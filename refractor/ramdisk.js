const { exec } = require('child_process');







exports.createRamDisk = async function(options) {
    
    let bytes = options.bytes
    let name = options.name
    
    if (typeof bytes !== "number" || bytes < 0 || isNaN(bytes)) {
        throw "Bytes must be a positive whole integer"
    }
    
    //RAMDisks can only be allocated in 512 byte chunks
    let size = Math.ceil(bytes/512)
    
    await new Promise(function(resolve, reject) {
        exec("diskutil erasevolume HFS+ " + name + " `hdiutil attach -nomount ram://" + size + "`", function(err, stdout, stderr) {
            if (err) {
                reject(err)
            }
            else {
                resolve(stdout)
            }
        })
    })
    
    

    
    //diskutil erasevolume HFS+ name `hdiutil attach -nomount ram://size`
    
    let info = {
        bytes: size*512,
        path: "/Volumes/" + name, //May not be cross system
        
    }
    
    
    return info
}