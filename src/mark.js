const { spawn } = require("child_process")


if (process.platform === "darwin") {
    function markFile(src) {
    
		
		
		
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