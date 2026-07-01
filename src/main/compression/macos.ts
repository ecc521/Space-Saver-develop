import fs from "fs";
import * as os from "os";
import * as path from "path";
import { spawn, execFile } from "child_process";
import { app } from "electron";

/**
 * Gets the disk usage of a file in bytes (based on 512-byte blocks).
 */
export async function getDiskUsage(src: string): Promise<number> {
  const stat = await fs.promises.lstat(src);
  return stat.blocks * 512;
}

/**
 * Gets the actual logical uncompressed size of a file in bytes.
 */
export async function getLogicalSize(src: string): Promise<number> {
  const stat = await fs.promises.lstat(src);
  return stat.size;
}

/**
 * Checks if a file is transparently compressed on macOS.
 * Uses stat -f %f to check if the 32 bit (HFS+ compression flag) is set.
 */
export async function isTransparentlyCompressed(src: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const detector = spawn("/usr/bin/stat", ["-f", "%f", "--", src]);
    let output = "";

    detector.stdout.on("data", (data) => {
      output += data.toString();
    });

    detector.stderr.on("data", (data) => reject(new Error(data.toString())));

    detector.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`stat exited with code ${code}`));
      }
      const flags = parseInt(output.trim(), 10);
      resolve(!!(flags & 32));
    });
  });
}

/**
 * Reverts transparent compression on a file (or directory).
 */
export async function undoTransparentCompression(
  src: string,
): Promise<{ originalSize: number; uncompressedSize: number }> {
  // === SECURITY: Validate target is not a symlink before operating as root ===
  const preStat = await fs.promises.lstat(src);
  if (preStat.isSymbolicLink()) {
    throw new Error("SECURITY VIOLATION: Unsafe symlink traversal rejected.");
  }

  const initialDiskUsage = await getDiskUsage(src);

  await new Promise<void>((resolve, reject) => {
    const decompressor = spawn("/usr/bin/afscexpand", ["--", src]);
    if (decompressor.pid) {
      try {
        os.setPriority(decompressor.pid, os.constants.priority.PRIORITY_LOW);
      } catch {
        // Ignored: silent downgrade fallback if PID is already restricted
      }
    }
    decompressor.stderr.on("data", (data) =>
      reject(new Error(data.toString())),
    );
    decompressor.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`afscexpand exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });

  const finalDiskUsage = await getDiskUsage(src);
  return {
    originalSize: initialDiskUsage,
    uncompressedSize: finalDiskUsage,
  };
}

/**
 * Options for transparent compression.
 */
export interface CompressOptions {
  /**
   * By default, it uses the system default compression algorithm.
   */
  algorithm?: "default";

  /**
   * The zlib compression level if using ditto or if applicable.
   * Usually 1-9.
   */
  compressionLevel?: number;
}

export interface CompressResult {
  originalSize: number;
  compressedSize: number;
  mark: boolean;
  compressed: boolean;
}

/**
 * Applies AppleFSCompression to a file using the macOS native ditto CLI.
 */
export async function transparentlyCompress(
  src: string,
  _options?: CompressOptions,
): Promise<CompressResult> {
  // Best-effort early rejection of symlinks. Not a security boundary
  // (the real protection is ditto's permission preservation + the isolator),
  // but avoids wasting work on files we know we shouldn't process.
  const stat = await fs.promises.lstat(src);
  if (stat.isSymbolicLink()) {
    throw new Error("Refusing to compress symbolic links.");
  }

  const isCompressed = await isTransparentlyCompressed(src);
  if (isCompressed) {
    return {
      originalSize: stat.size,
      compressedSize: stat.blocks * 512,
      mark: false,
      compressed: false,
    };
  }

  if (stat.nlink > 1) {
    // Cannot safely replace files with multiple hard links without breaking them
    return {
      originalSize: await getLogicalSize(src),
      compressedSize: await getDiskUsage(src),
      mark: false,
      compressed: false,
    };
  }

  // Record original file identity for post-ditto integrity verification
  const originalUid = stat.uid;
  const originalGid = stat.gid;
  const originalMode = stat.mode;
  const originalDiskUsage = stat.blocks * 512;
  const logicalSize = stat.size;

  // Protect compressor from boundless execution on raw Virtual Machine slices / sparse maps
  if (originalDiskUsage < logicalSize) {
    return {
      originalSize: logicalSize,
      compressedSize: originalDiskUsage,
      mark: false,
      compressed: false,
    };
  }

  // SECURITY LAYER 1: 0700 root-owned isolator.
  // ditto preserves original file permissions on the output, which is the primary barrier
  // against read elevation. The isolator ensures those permissions are enforced during
  // the compression window by:
  //   1. Residing on the same partition (prevents EXDEV, enables atomic rename)
  //   2. Blocking unprivileged users from reading output files during compression
  const secureIsolator = await fs.promises.mkdtemp(
    path.join(path.dirname(src), ".shrinkwizard-sec-"),
  );
  try {
    // SECURITY LAYER 1b: Volume ownership verification.
    // APFS/HFS+ volumes with "Ignore Ownership" remap file creations to a different UID.
    // Verify the isolator is owned by whoever we're running as (root for daemon, user for app).
    const isolatorStat = await fs.promises.stat(secureIsolator);
    if (isolatorStat.uid !== (process.geteuid?.() ?? -1)) {
      throw new Error(
        "SECURITY VIOLATION: Volume does not enforce POSIX ownership. Aborting.",
      );
    }

    await fs.promises.chmod(secureIsolator, 0o700);
  } catch (err) {
    await fs.promises.rmdir(secureIsolator).catch(() => {});
    throw err;
  }

  const tmpPath = path.join(
    secureIsolator,
    path.basename(src) +
      `.wzd_tmp_${Math.random().toString(36).substring(2, 11)}`,
  );
  const args = ["--hfsCompression", "--", src, tmpPath];

  return new Promise((resolve, reject) => {
    const compressor = spawn("/usr/bin/ditto", args);
    if (compressor.pid) {
      try {
        os.setPriority(compressor.pid, os.constants.priority.PRIORITY_LOW);
      } catch {
        // Ignored: silent downgrade fallback
      }
    }

    let errorOutput = "";

    compressor.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    compressor.on("close", async (code) => {
      const cleanUpTemp = async () => {
        try {
          await fs.promises.rm(secureIsolator, {
            recursive: true,
            force: true,
          });
        } catch {
          /* Ignored */
        }
      };

      if (code !== 0) {
        await cleanUpTemp();
        return reject(
          new Error(`ditto exited with code ${code}: ${errorOutput}`),
        );
      }

      try {
        // INTEGRITY CHECK: Post-ditto permission comparison.
        // ditto preserves the source file's owner/group/mode on the output. If an attacker
        // swapped the source for a symlink to a different file during ditto's execution,
        // the output will have that file's permissions — which will differ from what we
        // recorded. This prevents corrupting unrelated files by writing compressed data
        // where it doesn't belong. (Read elevation is already prevented by ditto's
        // permission preservation + the isolator, regardless of this check.)
        const outputStat = await fs.promises.lstat(tmpPath);
        if (
          outputStat.uid !== originalUid ||
          outputStat.gid !== originalGid ||
          outputStat.mode !== originalMode
        ) {
          await cleanUpTemp();
          return reject(
            new Error(
              "Source file was replaced during compression (permission mismatch). Aborting.",
            ),
          );
        }

        // Atomic swap. rename() does not follow symlinks at the destination.
        // Same-partition placement guarantees no EXDEV.
        await fs.promises.rename(tmpPath, src);

        const endDiskUsage = await getDiskUsage(src);
        resolve({
          originalSize: originalDiskUsage,
          compressedSize: endDiskUsage,
          mark: endDiskUsage < originalDiskUsage,
          compressed: true,
        });
      } catch (err) {
        await cleanUpTemp();
        reject(err);
      } finally {
        await cleanUpTemp();
      }
    });
  });
}

/**
 * Registers the helper daemon using modern SMAppService on macOS.
 */
export async function registerHelperDaemon(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (process.platform !== "darwin") {
      return reject(new Error("Helper daemon is only supported on macOS"));
    }
    const binaryName = "HelperInstaller";
    const isPackaged =
      typeof app !== "undefined" && app ? app.isPackaged : false;
    const installerPath = isPackaged
      ? path.join(path.dirname(process.execPath), binaryName)
      : path.join(
          typeof app !== "undefined" && app ? app.getAppPath() : process.cwd(),
          "build",
          binaryName,
        );

    if (!fs.existsSync(installerPath)) {
      return reject(
        new Error(`HelperInstaller binary not found at ${installerPath}`),
      );
    }

    execFile(installerPath, ["install"], (error, stdout, stderr) => {
      if (error) {
        return reject(
          new Error(`Failed to install helper: ${stderr || error.message}`),
        );
      }
      resolve(stdout.trim());
    });
  });
}

/**
 * Queries the registration status of the helper daemon.
 */
export async function getHelperStatus(): Promise<string> {
  return new Promise((resolve) => {
    if (process.platform !== "darwin") {
      return resolve("Unsupported");
    }
    const binaryName = "HelperInstaller";
    const isPackaged =
      typeof app !== "undefined" && app ? app.isPackaged : false;
    const installerPath = isPackaged
      ? path.join(path.dirname(process.execPath), binaryName)
      : path.join(
          typeof app !== "undefined" && app ? app.getAppPath() : process.cwd(),
          "build",
          binaryName,
        );

    if (!fs.existsSync(installerPath)) {
      return resolve("Not Installed");
    }

    execFile(installerPath, ["status"], (error, stdout, _stderr) => {
      if (error) {
        return resolve("Unknown");
      }
      resolve(stdout.trim());
    });
  });
}
