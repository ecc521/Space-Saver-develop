#include <napi.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>
#include <Security/Security.h>
#include <CoreFoundation/CoreFoundation.h>

#ifndef LOCAL_PEERTOKEN
#define LOCAL_PEERTOKEN 29
#endif

#ifndef LOCAL_PEERCRED
#define LOCAL_PEERCRED 1
#endif

// macOS xucred structure for LOCAL_PEERCRED
#include <sys/ucred.h>

Napi::Value VerifySocketClient(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "File descriptor (int) expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int fd = info[0].As<Napi::Number>().Int32Value();
    audit_token_t token;
    socklen_t token_len = sizeof(token);
    
    // 1. Get the audit token of the peer connected to the socket
    if (getsockopt(fd, SOL_LOCAL, LOCAL_PEERTOKEN, &token, &token_len) != 0) {
        return Napi::Boolean::New(env, false);
    }
    
    // 2. Convert audit_token_t to CFData for the Security framework
    CFDataRef tokenData = CFDataCreate(kCFAllocatorDefault, (const UInt8*)&token, sizeof(audit_token_t));
    if (!tokenData) {
        return Napi::Boolean::New(env, false);
    }
    
    CFMutableDictionaryRef attributes = CFDictionaryCreateMutable(kCFAllocatorDefault, 1, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
    CFDictionaryAddValue(attributes, kSecGuestAttributeAudit, tokenData);
    
    // 3. Get the SecCodeRef of the connecting guest process
    SecCodeRef guestCode = NULL;
    OSStatus status = SecCodeCopyGuestWithAttributes(NULL, attributes, kSecCSDefaultFlags, &guestCode);
    CFRelease(attributes);
    CFRelease(tokenData);
    
    if (status != errSecSuccess || !guestCode) {
        if (guestCode) CFRelease(guestCode);
        return Napi::Boolean::New(env, false);
    }
    
    // 4. Get our own SecCodeRef (the daemon)
    SecCodeRef ourCode = NULL;
    status = SecCodeCopySelf(kSecCSDefaultFlags, &ourCode);
    if (status != errSecSuccess || !ourCode) {
        CFRelease(guestCode);
        if (ourCode) CFRelease(ourCode);
        return Napi::Boolean::New(env, false);
    }
    
    // 5. Extract our own Designated Requirement
    SecRequirementRef ourRequirement = NULL;
    status = SecCodeCopyDesignatedRequirement(ourCode, kSecCSDefaultFlags, &ourRequirement);
    CFRelease(ourCode);
    
    if (status != errSecSuccess || !ourRequirement) {
        CFRelease(guestCode);
        if (ourRequirement) CFRelease(ourRequirement);
        return Napi::Boolean::New(env, false);
    }
    
    // 6. Validate the guest code against our own Designated Requirement
    // This mathematically guarantees the connecting process is identical in Code Signature (Team ID + Bundle ID)
    status = SecCodeCheckValidity(guestCode, kSecCSDefaultFlags, ourRequirement);
    
    CFRelease(ourRequirement);
    CFRelease(guestCode);
    
    return Napi::Boolean::New(env, status == errSecSuccess);
}

/**
 * Extract the effective UID of the peer connected to a Unix Domain Socket.
 * Uses LOCAL_PEERCRED with struct xucred (kernel-verified, unforgeable).
 */
Napi::Value GetPeerUID(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "File descriptor (int) expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    int fd = info[0].As<Napi::Number>().Int32Value();
    struct xucred cred;
    socklen_t cred_len = sizeof(cred);

    if (getsockopt(fd, SOL_LOCAL, LOCAL_PEERCRED, &cred, &cred_len) != 0) {
        return Napi::Number::New(env, -1);
    }

    return Napi::Number::New(env, static_cast<double>(cred.cr_uid));
}

/**
 * Check if a given UID can traverse to a file path (i.e., the file is visible to them).
 * Temporarily drops EUID to the target UID, calls access(F_OK), then restores root.
 *
 * We use F_OK (existence) rather than R_OK (read) deliberately:
 * - F_OK requires execute permission on ALL parent directories (directory traversal)
 * - If the caller can traverse to the file, they can already stat() it, so sizes aren't secret
 * - ditto preserves original file permissions on output, so file contents never leak
 * - This allows compressing root-owned files in /Library, /System, etc. that the user
 *   can see but not read — which is the daemon's entire purpose
 *
 * The kernel evaluates full POSIX owner/group/other/ACL rules natively.
 */
Napi::Value CheckAccessAsUser(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected (path: string, uid: number)").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string filePath = info[0].As<Napi::String>().Utf8Value();
    uid_t targetUID = static_cast<uid_t>(info[1].As<Napi::Number>().Uint32Value());
    uid_t originalEUID = geteuid();

    // Temporarily drop to the caller's UID
    if (seteuid(targetUID) != 0) {
        return Napi::Boolean::New(env, false);
    }

    // F_OK = can this UID see that the file exists? (requires directory traverse on all ancestors)
    int result = access(filePath.c_str(), F_OK);

    // IMMEDIATELY restore root — no early returns above this line
    seteuid(originalEUID);

    return Napi::Boolean::New(env, result == 0);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "verifySocketClient"), Napi::Function::New(env, VerifySocketClient));
    exports.Set(Napi::String::New(env, "getPeerUID"), Napi::Function::New(env, GetPeerUID));
    exports.Set(Napi::String::New(env, "checkAccessAsUser"), Napi::Function::New(env, CheckAccessAsUser));
    return exports;
}

NODE_API_MODULE(secure_ipc, Init)
