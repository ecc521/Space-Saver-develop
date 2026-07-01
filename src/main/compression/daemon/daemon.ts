/* eslint-disable @typescript-eslint/no-require-imports */
import * as net from "net";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { transparentlyCompress, undoTransparentCompression } from "../macos";

// === SECURITY: Set daemon-wide lowest CPU priority at startup ===
// All child processes (ditto, afscexpand, stat) inherit this automatically.
try {
  os.setPriority(0, os.constants.priority.PRIORITY_LOW);
} catch {
  // Non-fatal: priority setting may fail in some edge cases
}

// === SECURITY: Load secure_ipc addon — MANDATORY, not optional ===
let secure_ipc: any = null;
try {
  const devPath = path.join(
    __dirname,
    "../../../../build/Release/secure_ipc.node",
  );
  secure_ipc = require(devPath);
} catch {
  try {
    const prodPath = path.join(
      process.resourcesPath || "",
      "app.asar.unpacked/build/Release/secure_ipc.node",
    );
    secure_ipc = require(prodPath);
  } catch (err) {
    console.error("FATAL: Failed to load secure_ipc addon:", err);
    console.error("Daemon cannot operate without authentication. Exiting.");
    process.exit(1);
  }
}

const SOCKET_PATH = "/var/run/com.shrinkwizard.sock";
const MAX_BUFFER_SIZE = 1024 * 1024; // 1 MB — prevents OOM DoS from unbounded input

// === SOCKET ACTIVATION ===
// In production: launchd binds and holds the socket (SockMode 0600 via plist).
// When a connection arrives, launchd spawns us and passes the socket as an inherited fd.
// We listen on that fd directly — no bind, no unlink, no chmod needed.
//
// In development (no LISTEN_FD): create and bind the socket normally.
const listenFdStr = process.env.LISTEN_FD;
const isSocketActivated =
  listenFdStr !== undefined && /^\d+$/.test(listenFdStr);

if (!isSocketActivated) {
  // Dev mode: clean up any leftover socket from a previous run
  if (fs.existsSync(SOCKET_PATH)) {
    try {
      fs.unlinkSync(SOCKET_PATH);
    } catch (e) {
      console.error("Could not unlink old socket:", e);
    }
  }
}

const server = net.createServer((socket) => {
  // 1. Verify connecting client using native Unix Socket Peer Credentials evaluation
  const fd = (socket as any)._handle?.fd;
  if (fd === undefined) {
    console.error("SECURITY VIOLATION: Cannot extract socket FD. Rejecting.");
    socket.destroy();
    return;
  }

  const isValid = secure_ipc.verifySocketClient(fd);
  if (!isValid) {
    console.error("SECURITY VIOLATION: Unauthorized IPC connection rejected!");
    socket.destroy();
    return;
  }

  // 2. Extract the connecting peer's effective UID (kernel-verified, unforgeable)
  const peerUID: number = secure_ipc.getPeerUID(fd);
  if (peerUID < 0) {
    console.error("SECURITY VIOLATION: Cannot determine peer UID. Rejecting.");
    socket.destroy();
    return;
  }

  // 3. Handle commands from the verified Electron process
  let buffer = "";
  socket.on("data", async (data) => {
    buffer += data.toString();

    // === SECURITY: Cap buffer to prevent OOM DoS ===
    if (buffer.length > MAX_BUFFER_SIZE) {
      console.error(
        "SECURITY: IPC buffer exceeded 1MB limit. Disconnecting client.",
      );
      socket.destroy();
      return;
    }

    let newlineIdx;

    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      const msgStr = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (!msgStr.trim()) continue;

      try {
        const req = JSON.parse(msgStr);
        if (
          req.type === "process" &&
          req.file &&
          typeof req.file.path === "string"
        ) {
          const targetPath: string = req.file.path;

          // === SECURITY: Verify the CALLER can traverse to this file (directory visibility) ===
          // Uses seteuid() to temporarily drop to the caller's UID, then calls access(F_OK).
          // F_OK checks existence, which requires execute permission on ALL parent directories.
          // This allows compressing root-owned files in /Library, /System, etc. that the user
          // can see but not read — because ditto preserves original file permissions on output,
          // so file contents never leak. The only metadata returned (sizes) is already available
          // to anyone who can stat() the file, which only requires directory traversal.
          // Net effect: the daemon amplifies WRITE privilege only, never READ privilege.
          const callerCanRead = secure_ipc.checkAccessAsUser(
            targetPath,
            peerUID,
          );
          if (!callerCanRead) {
            socket.write(
              JSON.stringify({
                type: "error",
                id: req.id,
                error: `ACCESS DENIED: UID ${peerUID} lacks read permission for ${targetPath}`,
              }) + "\n",
            );
            continue;
          }

          let result;
          if (req.mode === "compress") {
            result = await transparentlyCompress(targetPath, req.options);
          } else if (req.mode === "restore") {
            result = await undoTransparentCompression(targetPath);
          }
          socket.write(
            JSON.stringify({ type: "result", id: req.id, result }) + "\n",
          );
        } else if (req.type === "exit") {
          server.close();
          process.exit(0);
        }
      } catch (err: any) {
        console.error("Daemon error processing request:", err);
        socket.write(
          JSON.stringify({ type: "error", error: err.message }) + "\n",
        );
      }
    }
  });
});

// In production, launchd creates the socket with SockMode 0600 — no race window.
// In dev, we set umask so the socket is created 0600 from the first instant.
let previousUmask: number | undefined;
if (!isSocketActivated) {
  previousUmask = process.umask(0o177);
}

if (isSocketActivated) {
  // Production: inherit the already-bound socket fd from launchd.
  // launchd has bound /var/run/com.shrinkwizard.sock with SockMode 0600 already.
  const fd = parseInt(listenFdStr!);
  server.listen({ fd }, () => {
    console.log(
      `Daemon listening on inherited fd ${fd} (socket-activated by launchd)`,
    );
  });
} else {
  // Dev: bind the socket path ourselves.
  server.listen(SOCKET_PATH, () => {
    console.log(`Daemon listening on ${SOCKET_PATH} (dev mode)`);
    if (previousUmask !== undefined) process.umask(previousUmask);
  });
}
