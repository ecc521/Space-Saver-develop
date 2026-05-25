# Shrink Wizard Privileged Daemon - Security Architecture

The macOS daemon runs as root to apply transparent HFS+ compression to write-protected files. This document describes the three defenses that close all privilege escalation and information disclosure attacks.

---

## Defense Model

| Layer | Mechanism | What it prevents |
|-------|-----------|-----------------|
| **1. ditto permission preservation** | ditto copies owner/group/mode from source to output | Read elevation (output is unreadable if source was unreadable) |
| **2. Traversal check (F_OK)** | `seteuid(peerUID)` + `access(path, F_OK)` in native C++ | Information disclosure (blocks probing files in non-traversable directories) |
| **3. Permission comparison** | Compare output file's uid/gid/mode against recorded original | Integrity (detects source file swaps, prevents corrupting unrelated files) |

### Why this is sufficient

**Read elevation is impossible** because `ditto` preserves the source file's owner, group, and mode on the output. If ditto reads a `0600 root:wheel` file (even via a TOCTOU symlink swap), the compressed output is also `0600 root:wheel` — the attacker still cannot read it.
- The `0700` root-owned isolator directory is technically unnecessary for this guarantee, since ditto applies permissions immediately on the output file. It is kept as defense-in-depth: it ensures same-partition placement (enabling atomic `rename()`, avoiding any `copyFile()` fallback), and blocks unprivileged users from listing temp files during compression. The volume ownership check (`stat(isolator).uid === 0`) catches "Ignore Ownership" volumes where POSIX permissions would not be enforced.

**Information disclosure is impossible** because the daemon extracts the peer's UID via kernel-verified `LOCAL_PEERCRED` and checks `access(path, F_OK)` as that UID before every operation. `F_OK` requires execute permission on all parent directories — if the caller can't traverse to the file, the daemon reveals nothing (not even whether the file exists).

**File corruption from TOCTOU swaps** is caught by comparing the output file's uid/gid/mode against what was recorded before `ditto` ran. If the source was swapped for a symlink to a differently-owned file, the mismatch is detected and the operation aborts.

---

## Attacks Addressed

### Without Application Compromise

**1. Unauthenticated Socket Hijacking** — `secure_ipc.node` validates the connecting process's code signature via `audit_token_t` + `SecCodeCheckValidity`. Only the signed Shrink Wizard app is accepted. If `secure_ipc.node` fails to load, the daemon exits immediately.

**2. Code Injection via Dylib Tampering** — Apple's Hardened Runtime Library Validation blocks unsigned dylib injection. Modifying the `.app` bundle breaks the code seal.

**3. PATH Spoofing** — All spawns use absolute paths (`/usr/bin/ditto`, `/usr/bin/stat`, `/usr/bin/afscexpand`).

**4. Socket Squatting & Startup Race** — `/var/run/` is `root:daemon`; unprivileged users can't bind there. The daemon uses **socket activation**: launchd creates and owns the socket at all times (with `SockMode 0600` from the plist), and only spawns the daemon process when a connection arrives. There is no window between socket creation and permission enforcement, and the daemon process consumes zero memory until first use after boot.

### With Full Application Compromise

**5. Symlink Traversal (TOCTOU)** — If the source is swapped for a symlink during ditto's execution, ditto may follow it — but the output inherits the target's permissions (not the original's). The post-ditto permission comparison detects the mismatch and aborts. Even without this check, ditto's permission preservation prevents read elevation: the output is unreadable if the target was unreadable.

**6. Information Disclosure** — Blocked by the F_OK traversal check. The daemon only operates on files the caller can already see exist (and therefore can already `stat()`).

**7. Mounted Drive / Ignore Ownership** — The isolator's `stat().uid === 0` check catches volumes that don't enforce POSIX ownership.  Even on such volumes, ditto preserves the original file's permissions as defense-in-depth.

**8. Shell Injection** — All execution uses `spawn()` with argument arrays. No shell evaluation exists.

**9. Flag Injection** — All spawns use `--` before untrusted path arguments.

**10. Hard Link Exploitation** — `stat.nlink > 1` rejects files with multiple hard links.

**11. Cross-Device Rename Fallback** — Isolator is created in `path.dirname(src)`, guaranteeing same-partition atomic `rename()`. No `copyFile()` fallback exists.

**12. IPC Buffer Exhaustion** — Capped at 1 MB; excess disconnects the client.

**13. IPC Malformed JSON** — Structural validation + `try/catch`. Malformed payloads are silently dropped.

**14. mkdtemp Prediction** — Kernel cryptographic entropy (6 chars, 56B+ combinations). Collisions cause `EEXIST`.

**15. Priority Escalation** — `os.setPriority(0, PRIORITY_LOW)` at daemon startup. All child processes inherit lowest CPU priority.
