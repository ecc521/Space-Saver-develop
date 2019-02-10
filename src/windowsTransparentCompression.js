'use strict'


//Different operating systems have different transparent filesystem compression capabilities.
//Currently only Windows and macOS are supported (Linux doesn't have built in filesystem compression)

//Make sure to add a way to undo transparent compression - this shouldn't be too hard

//Returns win32 even on 64 bit platforms - likely will never be changed due to backwards compatability
    

    
function transparentlyCompress(src) {
    //Use compact
        
        
    //To use either XPRESS4K XPRESS8K XPRESS16K or LZX
    //In order, fastest to most compact
    //The above algorithms are designed for compression EXE (Application) files
    //EXE:ALGORITHM
    
    
    //To use NTFS compression, avoid setting 
    
    
    //Use compact /C  PATH
    //Use /F flag to force compression
    //Does not recurse into directories!
    
        
}
    
    
function undoTransparentCompression(src) {
    
}

function getCompressionData(src) {
    //compact src
    
    return {
        isCompressed:"unknown",
    }
}

module.exports = {
    getCompressionData,
    undoTransparentCompression,
    transparentlyCompress,
}