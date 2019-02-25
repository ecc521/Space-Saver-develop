const compressFile = require("./compressFile.js")

//Files that have yet to be compressed
let compressionQueue = []

//Number of compression operations to run at once
//Should become unnecassary when free memory (os.freemem()) and a thread limit is used instead
//That would reduce the effects of a thread being locked on i/o, which might be common on transparent filesystem compression
let maxThreads = navigator.hardwareConcurrency 
maxThreads *= 2 //Greatly reduces IO lock issues

let currentThreads = 0
let paused = false

//Compresses file in paralell. Returns when finished
async function compressParalell(src) {
    
        
    if (maxThreads > currentThreads) {
        currentThreads++
    }
    else {
        await new Promise(function(resolve, reject){
            compressionQueue.push(resolve)
        })
    }
    
    try {
        let result = await compressFile.compressFile(src)
        return result;
    }
    catch (e) {
        console.warn(e)
        return e
    }
    finally {
		
		if (compressionQueue.length === 0 || paused) {
			currentThreads--
		}
        else {
            (compressionQueue.pop())() //Calls resolve on last element in compressionQueue
            //.shift() might be better - it would be first-in first-out instead of first-in last-out
            //We could use an offset to fix performance, but .shift() can't be used by itself - 
            //We could have upwards of a million files - and Chrome had to be force quit when I tested
            //with a 1,000,000 number array
            //Using an offest may defeat attempts to restrict memory usage by filenames held in memory
        }
    }    
}


async function pauseCompression() {
	paused = true
	//Define a setter on currentThreads, return a promise that resolves when everything is paused
	//If compression is resumed before pausing finished, it should be properly handled
	let pausingFinished = new Promise((resolve, reject) => {
	
	})
	return pausingFinished
}



function resumeComression() {
	paused = false
	let num = Math.max(compressionQueue.length, maxThreads-currentThreads)
	for (let i=0;i<num;i++) {
		(compressionQueue.pop())()
	}
}



module.exports = {
    compressParalell,
	pauseCompression,
	resumeCompression,
}