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
		//Flag 555 allows all to read and execute
        try {
		require("fs").chmodSync(binaryPath, 0o555)
        }
        catch (e) {		
		try {
		//It is possible chmodSync failed because root was needed. Try to recover here.
		require("child_process").spawnSync("sudo", ["chmod", 555, binaryPath], {timeout:1000})
		if (result.stderr.length > 0) {console.error(result.stderr.toString())}
		}
		finally {
			console.error(e) //Log the original error
		}		
	}
    }

	
    return binaryPath
    
}



module.exports = {
    getBinaryPath,
}
