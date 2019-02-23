const compressFile = require("./compressFile.js")

let compressionQueue = []
//Number of compression operations to run at once
//Should become unnecassary when free memory (os.freemem()) and a thread limit is used instead
//That would reduce the effects of a thread being locked on i/o, which might be common on transparent filesystem compression
let paralell = navigator.hardwareConcurrency 

paralell *= 2 //Just for testing if more processes helps with IO locks



//Compresses file in paralell. Returns when finished
async function compressParalell(src) {
    
        
    if (paralell > 0) {
        paralell--
    }
    else {
        await new Promise(function(resolve, reject){
            compressionQueue.push(resolve)
        })
    }
    
    let result = await compressFile.compressFile(src)
    
    if (compressionQueue.length > 0) {
        (compressionQueue.pop())() //Calls resolve on last element in compressionQueue
        //.shift() might be better - it would be first-in first-out instead of first-in last-out
        //We could use an offset to fix performance, but .shift() can't be used by itself - 
        //We could have upwards of a million files - and Chrome had to be force quit when I tested
        //with a 1,000,000 number array
        //Using an offest may defeat attempts to restrict memory usage by filenames held in memory
    }
    else {
        paralell++
    }
    
    return result;
}



module.exports = {
    compressParalell,
}