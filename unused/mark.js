//if (process.platform === "darwin") {
    
	//let attributeName = "com.spacesaver.lastcompressed"
    
    
    
    
    
    //xattr is taking 100 milliseconds on my device - a huge amount of time.
    //ls -l@ is taking 5 milliseconds. There is some information that needs to be filtered out.
    //In addition, ls -l@ displays the length of the extended attribute instead of the attribute itself. This is an issue.
    //We could use the lengths of multiple extended attributes to encode the date. This would
    //lead to having to set multiple extended attributes - multiple calls to xattr
    //would be far to slow. Caching could be used to try and reduce this impact
    //The C (I believe) API could also be used
    //A npm xattr module could also be used
    
    
    /*
    module.exports.isMarked = async function(src) {
		
		let lastModified = fs.statSync(src).mtimeMs //Get last modified time
		//Get the time the file was last compressed from xattr value
        let lastCompressed = await new Promise((resolve, reject) => {
            
			let reader = spawn("ls", ["-l@", src], {
				detached: true,
				stdio: [ 'ignore', "pipe", "pipe" ]
			})
			
			reader.stdout.on("data", function(data) {
                //Convert data to the value of attributeName
                data = data.toString()
                let lines = data.split("\n")
                //The first line is information we don't care about
                for (let i=1;i<lines.length;i++) {
                    let line = lines[i]
                    //Parse line
                }
                resolve(-Infinity) //The file has never been compressed
            })
            
			reader.stderr.on("data", reject)
            })
			reader.on("close", resolve)
		})		
	
		return lastCompressed > lastModified //true if the file has been compressed since it's last modification		
    }*/
    
    
    /*
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
    }*/    
    

	/*
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
    }*/
    
//} //End of code for darwin

//Need to figure out what do do for Windows and Linux
//else {
    //Bogus functions for now
  //  module.exports.isMarked = function(src) {return false}
    //module.exports.markFile = function(src) {}
//}