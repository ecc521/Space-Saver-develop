const compressFile = require("./compressFile.js")
const marker = require("./mark.js")

//Files waiting to be compressed
//This may be because of memory constraints, thread contraints, or other reasons
let compressionQueue = []


//statusUpdates are for when something changes - such as the number of 
//threads that are currently in use.
//This may be used by functions like pauseCompression
//statusUpdates only alert that something has changed. The function will have to check the respective variables.
let statusUpdate = {} 
//obj will be passed to all functions receiving the status update
function dispatchStatusUpdate(obj) {
    for (let receiverName in statusUpdate) {
        (statusUpdate[receiverName])(obj)
    }
}




//Number of compression operations to run at once
//Should become unnecassary when free memory (os.freemem()) and a thread limit is used instead
//That would reduce the effects of a thread being locked on i/o, which might be common on transparent filesystem compression
let maxThreads = navigator.hardwareConcurrency 
maxThreads *= 2 //Greatly reduces IO lock issues

let currentThreads = 0
let paused = false


function threadFinished() {
    currentThreads--
	if (compressionQueue.length === 0 || paused) {
        dispatchStatusUpdate() //Alert pauseCompression that another thread has opened
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


//Returns when a thread is ready 
async function allocateThread(src) {
    if (maxThreads > currentThreads && paused === false) {
        currentThreads++
        return true
    }
    else {
        await new Promise(function(resolve, reject){
            compressionQueue.push(resolve)
        })
        currentThreads++
        return true
    }
}




//Safely stops compression
async function pauseCompression() {
	paused = true
	//Define a setter on currentThreads, return a promise that resolves when everything is paused
	//If compression is resumed before pausing finished, it should be properly handled
	let pausingFinished = new Promise((resolve, reject) => {
        //Resolve when all current threads finish. 
        //Resolve with false if compression is resumed
        if (currentThreads === 0) {
            resolve(true)
        }
        statusUpdate["pauseCompression"] = function() {
            if (paused === false) {
                resolve(false) //We got unpaused
            }
            else if (currentThreads === 0) {
                resolve(true)
            }
        }
	})
	return pausingFinished
}


//Resumes compression. Fills up threads
function resumeCompression() {
	paused = false
    dispatchStatusUpdate() //Alert pauseCompression that it may have been unpaused
	let num = Math.min(compressionQueue.length, maxThreads-currentThreads)
	for (let i=0;i<num;i++) {
		(compressionQueue.pop())()
	}
}



//Compresses file in paralell. Returns when finished
async function compressParalell(src) {
    
    await allocateThread(src)
    
    //Checking was performed before acquiring a thread, however that resulted 
    //in an EAGAIN error (is 5000+ too many threads?)
    
    //It is possible for a file to be compressed twice. 
    //That would occour if a src is sent to this function twice, and
    //compression has not yet finished from the first time the src was sent
    
    if (await marker.isMarked(src)) {
        threadFinished(src) //Free the thread
        return {
            compressed: false,
            mark: false
        }
    }
    
    
    try {
        let result = await compressFile.compressFile(src)
        
        if (result.mark) {
            await marker.markFile(src)
        }
        
        return result;
    }
    catch (e) {
        console.warn(e)
        return e
    }
    finally {
        threadFinished(src)
    }    
}



function clearCompressionQueue() {
    compressionQueue = []
}

function getLocalValues() {
	//Variables that may be useful for other aspects of the program. When they are used, it should be marked here.
    return {
        compressionQueue,
        statusUpdate,
        currentThreads,
        maxThreads, 
        paused,
    }
}

module.exports = {
    compressParalell,
	pauseCompression,
	resumeCompression,
    getLocalValues,
    clearCompressionQueue,
}