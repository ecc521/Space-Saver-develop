const fs = require("fs")
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
    
    module.exports.markFile = function(src) {
        return fs.writeFileSync(src + ":" + attributeName, Date.now().toString())
    }
}
else {
    //Dummy functions for now
    //Not sure what to do for Linux
    module.exports.markFile = function() {}
    module.exports.isMarked = function() {return false}
}
