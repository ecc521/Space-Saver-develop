//xattr is taking 100 milliseconds on my device - a huge amount of time.

const { spawn } = require("child_process")
const fs = require("fs")

if (process.platform === "darwin") {
    
	let attributeName = "com.spacesaver.lastcompressed"
    
    module.exports.isMarked = async function(src) {
		
		let lastModified = fs.statSync(src).mtimeMs //Get last modified time
		//Get the time the file was last compressed from xattr value
        let lastCompressed = await new Promise((resolve, reject) => {
			let reader = spawn("xattr", ["-p", attributeName, src], {
				detached: true,
				stdio: [ 'ignore', "pipe", "pipe" ]
			})
			
			reader.stdout.on("data", function(data) {
                resolve(Number(data.toString()))
            })
			reader.stderr.on("data", function(data) {
                let str = data.toString()
                if (!str.includes("No such xattr:")) {
                    reject()
                }
                else {
                    resolve(-Infinity)
                }
            })
			reader.on("close", resolve)
		})		
	
		return lastCompressed > lastModified //true if the file has been compressed since it's last modification		
    }    

	
    module.exports.markFile = function(src) {
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
    module.exports.isMarked = function(src) {return false}
    module.exports.markFile = function(src) {}
}


