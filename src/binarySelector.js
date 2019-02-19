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
    
    
    
    //For Wineows:
    //binaryName-x64
    //binaryName-arm
    
    //For Mac (Check to see if Linux binaries can be used instead)
    //binaryName-darwin-x64
    
    //For Linux
    //Figure these out
    
    
    let binaryPath = path.resolve("bin", binaryName)
    return binaryPath
    
}



module.exports = {
    getBinaryPath,
}