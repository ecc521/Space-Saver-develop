const fs = require("fs")
const {spawnSync} = require("fs")
const attributeName = "com.spacesaver.lastcompressed"


if (process.platform === "darwin") {
    const xattr = require("fs-xattr")

    //If needed, we can use the non-synchronus versions of these
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
            //TODO: Return true if the error message says attribute does not exist, otherwise false
            return false;
        }
    }
    
    module.exports.markFile = function(src) {
        return xattr.setSync(src, attributeName, Date.now().toString())
    }
}
else if (process.platform === "win32") {
    
    //Extended attributes can be accessed as filepath:attribute
    
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
            return fs.unlinkSync(src)
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
        if (output.stderr.length > 0) {return false} //Hasn't ever been marked
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
