const compressFile = require("./compressFile.js")

//Takes an array of files
//It parellelizes compression
function compressFiles(files) {
    
    //Note - may want to use os.freemem() to get memory that is available
    //That could allow us to carefully select files for maximum speed without running out of RAM
    //May also want to consider increasting the number of paralell compressions to above the number
    //of cores to prevent slowdowns on disk writes - expecially transparent file compression.
    //That should only be done if there is adequet memory
    
    let paralell = navigator.hardwareConcurrency
    
    
    
    
    

}