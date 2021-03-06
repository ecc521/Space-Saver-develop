'use strict'


//Different operating systems have different transparent filesystem compression capabilities.
//Currently only Windows and macOS are supported (Linux doesn't have built in filesystem compression)

//Make sure to add a way to undo transparent compression - this shouldn't be too hard

//Returns win32 even on 64 bit platforms - likely will never be changed due to backwards compatability
if (process.platform === "win32") {
    

    //Load windows transparent compression file
    module.exports = require("./windowsTransparentCompression.js")
    
    
    
}
else if (process.platform === "darwin") {
    


    //Load macOS transparent compression file
    module.exports = require("./macOSTransparentCompression.js")
    
}


