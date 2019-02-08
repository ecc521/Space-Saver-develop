'use strict'


//Different operating systems have different transparent filesystem compression capabilities.
//Currently only Windows and macOS are supported (Linux doesn't have built in filesystem compression)


//Returns win32 even on 64 bit platforms - likely will never be changed due to backwards compatability
if (process.platform === "win32") {
    

    
    module.exports.transparentCompression = function() {
        //Use compact
        //Get compression level from settings????
        //That will be a difficult choice
        
        
        
        
        
    }
    
    
    
    
}
else if (process.platform === "darwin") {
    

    
    module.exports.transparentCompression = function() {
        //Maximum compression level is likely the best idea
        //Worsens random read performance, but should improve sequential
        
        //Use ditto --hfsCompression --zlibCompressionLevel
        
        
    }
    
    
    
}
else {
    //Platform not supported at this time
}


