    module.exports.isMarkedSync = function(src) {
		
		let lastModified = fs.statSync(src).mtimeMs 	
	
        let lastCompressed;
        let reader = spawnSync("xattr", ["-p", attributeName, src])
        
        reader.stdout = Number(reader.stdout.toString())
        lastCompressed = reader.stdout
        
        
        //console.log(reader.stdout)
        //console.log(reader.stderr)
        
        reader.stderr = reader.stderr.toString()
        
        if (reader.stderr.length !== 0) {
            if(!reader.stderr.includes("No such xattr:")) {
                throw "Unknown Error " + reader.stderr
            }
            else {
                lastCompressed = -Infinity
            }
        }
                
		return lastCompressed > lastModified //true if the file has been compressed since it's last modification		
    }