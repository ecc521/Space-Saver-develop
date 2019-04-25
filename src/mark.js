const fs = require("fs")
const {spawnSync, spawn} = require("child_process") 


//On linux, the attribute name has to be prefixed by user.
const attributeName = process.platform === "linux" ? "user.com.spacesaver.lastcompressed":"com.spacesaver.lastcompressed"

if (process.platform === "darwin") {
    //On Mac, fs-xattr is used becuase it is MUCH faster
    //But if something goes wrong with using native dependiencies, or
    //with something else, xattr and ls -l@ are used as fallbacks
    try {
        const xattr = require("fs-xattr")
        
        //No real reason to use the asyncronus versions of these - it takes less than half a millisecond
        //per invocation on my computer
        //If we want to make the extended attribute smaller, we can make the number hexadecimal, or even
        //encode it as individual bytes
        
        module.exports.isMarked = function(src) {
            let lastModified = fs.statSync(src).mtimeMs
            let lastCompressed;
            try {
                lastCompressed = Number(xattr.getSync(src, attributeName).toString())
            }
            catch(e) {
                return false; //The attribute did not exist. It has not been compressed
            }
            return lastCompressed > lastModified //true if the file has been compressed since it's last modification
        }

        module.exports.unmarkFile = function(src) {
            try {
                return xattr.removeSync(src, attributeName)
            }
            catch (e) {
                //TODO: Return true if the error message says attribute does not exist -
                //because it is gone just as if it had been removed
                //Return false only if something else goes wrong.
                return false;
            }
        }

        module.exports.markFile = function(src) {
            return xattr.setSync(src, attributeName, Date.now().toString())
        }
    }
    catch (e) {
        console.error(e)
        console.warn("Something wen't wrong setting up the fs-xattr module. An error was logged. Please know that this will lead to large performance losses.")
        
        //xattr is taking 100 milliseconds on my device - a huge amount of time.
        //ls -l@ is taking 5 milliseconds. There is some information that needs to be filtered out.

        //We currently use ls -l@ to see if the extended attribute exists - if it doesn't exist,
        //we know that the file has not been marked. If it does exist, we fall back to xattr.

        //We might be able to fix xattr's bad performance by calling it with multiple files at once
        //That is not currently performed, and I have not confirmed that it would help.
        
        module.exports.isMarked = function(src) {
            return new Promise((resolve, reject) => {

                let reader = spawn("ls", ["-l@", src], {
                    detached: true,
                    stdio: [ 'ignore', "pipe", "pipe" ]
                })

                reader.stdout.on("data", function(data) {

                    data = data.toString()
                    let lines = data.split("\n")
                    //The first line is information we don't care about
                    for (let i=1;i<lines.length;i++) {
                        let line = lines[i]
                        let parts = line.split("\t")
                        let attributeName = parts[1]
                        let attributeLength = Number(parts[2])

                        resolve(module.exports.xattrIsMarked(src))
                        //We know the attribute exists - 
                        //but ls -l@ does not give us its value, only its length
                    }
                    resolve(false) //The attribute does not exist
                })

                reader.stderr.on("data", reject)
                reader.on("close", resolve)
            })			
        }



        module.exports.xattrIsMarked = async function(src) {

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
        
        module.exports.unmarkFile = function(src) {
            return new Promise((resolve, reject) => {
                //Delete the extended attribute
                let marker = spawn("xattr", ["-d", attributeName, src], {
                    detached: true,
                    stdio: [ 'ignore', "pipe", "pipe" ]
                })
                marker.stdout.on("data", resolve)
                marker.stderr.on("data", reject)
                marker.on("close", resolve)
            })
        }
    }
}
else if (process.platform === "win32") {

    //Extended attributes can be accessed as filepath:attribute
    //These are known as Alternate Data Streams

    module.exports.isMarked = function(src) {
        let lastModified = fs.statSync(src).mtimeMs
        let lastCompressed;
        try {
            lastCompressed = Number(fs.readFileSync(src + ":" + attributeName, "utf8"))
        }
        catch (e) {
            return false //The attribute does not exist. The file has not been compressed.
        }

        return lastCompressed > lastModified
    }

    module.exports.unmarkFile = function(src) {
        try {
            return fs.unlinkSync(src + ":" + attributeName)
        }
        catch (e) {
            //TODO: Return true if the error message is ENOENT, otherwise false
            return false;
        }
    }

    module.exports.markFile = function(src) {
        return fs.writeFileSync(src + ":" + attributeName, Date.now().toString())
    }
}
else if (process.platform === "linux") {
    //Use getfattr and setfattr

    //Format:
    //setfattr -n attributename -v attributevalue filename
    //getfattr --only-values -n attributename filename

    module.exports.isMarked = function(src) {
        let lastModified = fs.statSync(src).mtimeMs
        let output = spawnSync("getfattr", ["--only-values", "-n", attributeName, src], {timeout:100})
        if (output.stdout.length === 0) {return false} //Hasn't ever been marked
        let lastCompressed = Number(output.stdout.toString())
        return lastCompressed > lastModified
    }

    module.exports.unmarkFile = function(src) {
        let output = spawnSync("setfattr", ["-x", attributeName, src], {timeout:100})
        //Try to return the most useful data possible
        if (output.stderr.length > 0) {return output.stderr}
        return output.status
    }

    module.exports.markFile = function(src) {
        let output = spawnSync("setfattr", ["-n", attributeName, "-v", Date.now().toString(), src], {timeout:100})
        //Try to return the most useful data possible
        if (output.stderr.length > 0) {return output.stderr}
        return output.status
    }    
}
else {
    //Dummy functions
    module.exports.markFile = function() {return false}
    module.exports.isMarked = function() {return false}
    module.exports.unmarkFile = function(src) {return false}
}
