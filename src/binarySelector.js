const path = require("path")
const app = require("electron").remote.app 

//Currently, this program doesn't do anything
//I have not been able to get binaries cross compiled or WebAssembly working


//'arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x32', and 'x64'.

//Returns the path for the correct binary for this operating system
function getBinaryPath(name) {
    
    let arch = process.arch
    let platform = process.platform //Consider require("os").type()
    let binaryName = name
    
    //We can add a .exe to binaryName on Windows platforms, but it's not required
    
    
    //We need more binaries and a way for handling them (either that or WebAssembly support is needed)
    
	
    if (process.arch === "x64" && process.platform === "darwin") {
        binaryName += "-darwin-amd64"
    }
    else if (process.arch === "x64" && process.platform === "linux") {
        binaryName += "-linux-amd64"
    }
    else if (process.arch === "arm64" && process.platform === "linux") {
        binaryName += "-linux-arm64"
	}
    else if (process.platform === "win32") {
        //Do nothing
    }
    else {
        alert("Running Space Saver on " + process.platform + " with a " + process.arch + " CPU is unsupported")
    }   
    
    
	
	
	let appPath = app.getAppPath()
    
    //When running the packaged app, the path is to the app.asar file
    if (path.basename(appPath) === "app.asar") {
        appPath = path.dirname(appPath)
    }
        
    let binaryPath = path.resolve(appPath, "bin", binaryName)

    //Run chmod to make sure the binary can be run
    if (process.platform !== "win32") {
	    //Use break label syntax so that the try statement can be exited when success it made.
        chmod: try {
            let spawnSync = require("child_process").spawnSync
	    let result;
		
	    result = spawnSync("chmod", [700, binaryPath], {timeout:1000})
		if (result.stderr.length > 0) {console.error(result.stderr.toString())}
		else {break chmod;}
		
	    result = spawnSync("sudo", ["chmod", 700, binaryPath], {timeout:1000})
		if (result.stderr.length > 0) {console.error(result.stderr.toString())}
		else {break chmod;}
		
		alert("The file at " + binaryPath + " could not be modified by this program, and may not be execuatble. Please make sure the executable flag is set.")
		
        }
        catch (e) {console.warn(e)}
    }

	
    return binaryPath
    
}



module.exports = {
    getBinaryPath,
}
