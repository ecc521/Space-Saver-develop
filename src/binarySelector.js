const path = require("path")


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
    
	
    if (process.arch === "arm64") {
		binaryName = binaryName += "-arm64"
	}
	
	
	
    let binaryPath = path.resolve("bin", binaryName)
	
	//Set executable bit (Not sure what to do on Windows)
	if (process.platform !== "win32") {
		require("child_process").execSync("chmod 700 " + binaryPath)
	}
										  
	
    return binaryPath
    
}



module.exports = {
    getBinaryPath,
}