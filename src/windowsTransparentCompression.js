'use strict'


//Different operating systems have different transparent filesystem compression capabilities.
//Currently only Windows and macOS are supported (Linux doesn't have built in filesystem compression)

//Make sure to add a way to undo transparent compression - this shouldn't be too hard

//Returns win32 even on 64 bit platforms - likely will never be changed due to backwards compatability
    

    
//Some little info - NOTE: Not timed. Not exact

//All the XPRESS algorithms compressed VERY fast. (Seemed to be around 270-130 MB/s)
//LZX and NTFS both got around 40 MB/s

//NTFS (not putting a /EXE flag) did the worst on compression - it's out

//My tests did not determine a difference in decompression speeds - I believe that is because type was the bottleneck

function transparentlyCompress(src) {
                
    //Algorithm Options (fastest to most compact): XPRESS4K XPRESS8K XPRESS16K or LZX
    //C means compress, I ignore errors (like permission denied)
    
    
    //compact /C /I /EXE:ALGORITHM /S:PATH
        
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