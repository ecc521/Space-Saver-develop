const { spawn } = require("child_process")


if (process.platform === "darwin") {
    
    //Use xattr
    function markFile(src) {
        let lastModified = 0 //Get last modified date
        let lastCompressed = 0 //Get last compressed date from xattr value
		
		
		
    }

    function isMarked(src) {

    }
}
else {
    //Bogus functions for now
    function isMarked(src) {return false}
    function markFile(src) {}
}


module.exports = {
    markFile,
    isMarked,
}