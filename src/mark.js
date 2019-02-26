const { spawn } = require("child_process")


if (process.platform === "darwin") {
    
	let attributeName = "com.spacesaver.lastcompressed"
	
    //Use xattr
    async function isMarked(src) {
		
		let lastModified = fs.statSync(src).mtimeMs //Get last modified time
		//Get the time the file was last compressed from xattr value
        let lastCompressed = await new Promise((resolve, reject) => {
			let reader = spawn("xattr", ["-p", attributeName, src], {
				detached: true,
				stdio: [ 'ignore', "pipe", "pipe" ]
			})
			
			reader.stdout.on("data", resolve)
			reader.stderr.on("data", reject)
			reader.on("close", resolve)
			//Make sure to handle no timestamp
			//Make sure this behaves correctly
				
		})		
	
		return lastCompressed > lastModified //true if the file has been compressed since it's last modification		
    }

	
    function markFile(src) {
		
		return new Promise((resolve, reject) => {
			//Set attributeName to the current time
			let marker = spawn("xattr", ["-w", attributeName, Date.now(),src], {
				detached: true,
				stdio: [ 'ignore', "pipe", "pipe" ]
			})
			marker.stdout.on("data", resolve)
			marker.stderr.on("data", reject)
			marker.on("close", resolve)
		})
    }
} //End of code for darwin

//Need to figure out what do do for Windows and Linux
else {
    //Bogus functions for now
    function isMarked(src) {return false}
    function markFile(src) {}
}







module.exports = {
    markFile,
    isMarked,
}