const compressFile = require("./compressFile.js")
const marker = require("./mark.js")
const os = require("os") //To get the priority constants


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




//

//When compression initially starts, the threads can compete over CPU usage, and
//cause it to take a long time before the first file finishes.
//Create one high priority process per core and one low priority one
let hardwareThreads = navigator.hardwareConcurrency 

//Add extra low priority threads to reduce IO locks
let additionalThreads = hardwareThreads

let currentAdditionalThreads = 0
let currentHardwareThreads = 0

let paused = false



let hardwareThreadPriority = os.constants.priority.PRIORITY_BELOW_NORMAL
let additionalThreadPriority = os.constants.priority.PRIORITY_LOW

function threadFinished(src, priority) {
    
    
    if (priority === hardwareThreadPriority) {
        currentHardwareThreads--
    }
    else if (priority === additionalThreadPriority) {
        currentAdditionalThreads--
    }
    else {
        console.error("Unknown priority " + priority)
    }
    
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
async function allocateThread(src, priority) {
    let hasThread = !paused
    
    if (hasThread) {
        hasThread = (0 < hardwareThreads + additionalThreads - currentHardwareThreads - currentAdditionalThreads)
    }
    
    if (!hasThread) {
        await new Promise(function(resolve, reject){
            compressionQueue.push(resolve)
        })
    }
    
    //Hardware threads go first
    if (hardwareThreads > currentHardwareThreads) {
        currentHardwareThreads++
        return hardwareThreadPriority
    }
    else if (additionalThreads > currentAdditionalThreads) {
        currentAdditionalThreads++
        return additionalThreadPriority
    }
    else {
        console.error("Something went wrong")
    }

}






//Safely stops compression
async function pauseCompression() {
	paused = true
	//If compression is resumed before pausing finished, it should be properly handled
	let pausingFinished = new Promise((resolve, reject) => {
        //Resolve when all current threads finish. 
        //Resolve with false if compression is resumed
        if (currentAdditionalThreads + currentHardwareThreads === 0) {
            resolve(true)
        }
        statusUpdate["pauseCompression"] = function() {
            if (paused === false) {
                resolve(false) //We got unpaused
            }
            else if (currentAdditionalThreads + currentHardwareThreads === 0) {
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
	let num = Math.min(compressionQueue.length, hardwareThreads + additionalThreads - currentAdditionalThreads - currentHardwareThreads)
	for (let i=0;i<num;i++) {
		(compressionQueue.pop())()
	}
}



//Compresses file in paralell. Returns when finished
async function compressParalell(src) {
    
    let priority = await allocateThread(src)
    
    //Checking was performed before acquiring a thread, however that resulted 
    //in an EAGAIN error (is 5000+ too many threads?)
    
    //It is possible for a file to be compressed twice. 
    //That would occour if a src is sent to this function twice, and
    //compression has not yet finished from the first time the src was sent
    
    if (await marker.isMarked(src)) {
        threadFinished(src, priority) //Free the thread
        return {
            compressed: false,
            mark: false
        }
    }
    
    
    try {
        let result = await compressFile.compressFile(src, priority)
        
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
        threadFinished(src, priority)
    }    
}



function clearCompressionQueue() {
    compressionQueue = []
}

function getLocalValues() {
	//Variables that may be useful for other aspects of the program. When they are used, it should be marked here.
    //There are some variables that are not included in this that could be
    return {
        compressionQueue,
        statusUpdate,
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
