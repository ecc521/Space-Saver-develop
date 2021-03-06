'use strict'

const fs = require("fs")

const { spawn } = require('child_process');

const binarySelector = require("./binarySelector.js")

const jpegtranPath = binarySelector.getBinaryPath("jpegtran")

//Used to set priority of JPEG compression
const os = require("os")
const defaultPriority = 19 //Lowest priority


async function jpegtran(inputSrc, parameters, options) {	


    //Next 3 lines for testing arithmetic coding performance.
    //Note that they require jpegtran installed on your computer with arithmetic coding support.
    //parameters.push("-arithmetic")
    //parameters.splice(parameters.indexOf("-optimize"), 1)
    //let jpegtranPath = "jpegtran" //Overrules constant in this scope.



    parameters.push(inputSrc)

    let stdoutCache = [] //Buffers to write into file cached are stored here



    //Compress jpeg here. Throw error if something goes wrong
    await new Promise((resolve, reject) => {

        let compressor = spawn(jpegtranPath, parameters, {
            detached: true,
            stdio: [ 'ignore', "pipe", "pipe" ]
        })

        try {
            os.setPriority(compressor.pid, (options && options.priority) || defaultPriority)
        }
        catch (e) {
            console.warn(e)
        }

        compressor.stderr.on("data", function(data) {
            data = data.toString()
            if (data === "Invalid SOS parameters for sequential JPEG\n") {
                return; //SOS parameters are meaningless in sequential JPEG images
            }
            reject(data)
        })

        compressor.stdout.on("data", function(data) {
            stdoutCache.push(data)
        })

        compressor.on("close", resolve)

    })

    //Calculate the file sizes
    let originalSize = (await fs.promises.stat(inputSrc)).size
    let compressedSize = 0

    for (let i=0;i<stdoutCache.length;i++) {
        compressedSize += stdoutCache[i].length
    }

    //Let's just make sure that the output file has a smaller file size
    if (originalSize > compressedSize || (options && options.forceOverwrite)) {
        //Overwrite the original file with the compressed data
        await fs.promises.unlink(inputSrc)
        let outputFile = await fs.promises.open(inputSrc, "a") //The file no longer exists, so it will be created here
        //Since we have multiple buffers to write in, open for appending

        for (let i=0;i<stdoutCache.length;i++) {
            await fs.promises.appendFile(outputFile, stdoutCache[i])
        }
    }

    return {
        originalSize,
        compressedSize, 
    }

}


//Pass -copy all in order to avoid issues where the rotation flag is not copied.
//When that happens, the image shows up flipped        

async function compressJPEG(src, options) {

    //If the -arithmetic flag is used instead of -optimize, compression almost doubles (and I believe becomes faster)
    //However few applications support arithmetic coded JPEG's
    //Although jpegtran supports arithmetic coded JPEG's, the specific build may not.

    let result = await jpegtran(src, ["-optimize", "-progressive", "-copy", "all"], options)
    result.mark = true
    return result
}

async function toBaselineJPEG(src, options) {
    options = options || {}
    options.forceOverwrite = true
    let result = await jpegtran(src, ["-revert", "-copy", "all"], options) //Force overwrite
    result.mark = false
    return result
}


function revertJPEG(...parameters) {
    //May want to detect if the original JPEG was progressive, ext.
    return toBaselineJPEG(...parameters)
}


module.exports = {
    jpegtran,
    compressJPEG,
    toBaselineJPEG,
    revertJPEG,
}
