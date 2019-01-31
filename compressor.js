const { exec } = require('child_process');
const createRamDisk = require("./ramdisk.js").createRamDisk






exports.transparentCompression = async function(options) {
    
    let zlibCompressionLevel = options.zlibCompressionLevel //Checked
    let hfsCompression = options.hfsCompression //Checked
    let path = options.path
    
    //Options checking
    
    if (typeof hfsCompression !== "boolean") {
        throw "hfsCompression must be a boolean"
    }
    
    if (hfsCompression) {
        //zlib Compression Level not needed if no hfsCompression
        if (typeof zlibCompressionLevel !== "number" || isNaN(zlibCompressionLevel) || zlibCompressionLevel > 9 || zlibCompressionLevel < 0) {
            throw "zlib Compression Level must be a number 0-9"
        }    
    }

    

    //TODO: Get size of fiile
    let ramDisk = await createRamDisk({
        name: "testfile",
        bytes: 100000000, 
    })
    
    let dest = ramDisk.path + options.path
    
    
    path = "\"" + path + "\""
    dest = "\"" + dest + "\""
    
    let script = "ditto"
        
    if (hfsCompression) {
        script += " --hfsCompression"
        //zlib Compression Level only needed if using hfsCompression
        script += " --zlibCompressionLevel " + zlibCompressionLevel
    }
    else {
        script += " --nopreserveHFSCompression"
    }
    
    //paths may have spaces
    script += " " + path
    
    
    script += " " + dest
    
    
    
    await new Promise(function(resolve, reject) {
        exec(script, function(err, stdout, stderr) {
            if (err) {
                reject(err)
            }
            else {
                resolve(stdout)
            }
        })
    })
    
    
    
    await new Promise(function(resolve, reject) {
        exec("rm -rf " + path, function(err, stdout, stderr) {
            if (err) {
                reject(err)
            }
            else {
                resolve(stdout)
            }
        })
    })    
    
    await new Promise(function(resolve, reject) {
        exec("ditto " +  dest + " " + path , function(err, stdout, stderr) {
            if (err) {
                reject(err)
            }
            else {
                resolve(stdout)
            }
        })
    })    
    
    
}




//compressor.transparentCompression({zlibCompressionLevel:9,hfsCompression:true,path:"/Users/tuckerwillenborg/Documents/Useful\ Applications\ copy/Photos\ Duplicate\ Cleaner.app"})








