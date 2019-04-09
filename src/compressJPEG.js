'use strict'

const fs = require("fs")

const { spawn } = require('child_process');

const binarySelector = require("./binarySelector.js")

const jpegtranPath = binarySelector.getBinaryPath("jpegtran")


async function compressJPEG(inputSrc) {	
    
	let stdoutCache = [] //Buffers to write into file cached are stored here

	//Compress jpeg here. Throw error if something goes wrong
	await new Promise((resolve, reject) => {
				        
        //Pass -copy all in order to avoid issues where the rotation flag is not copied.
        //When that happens, the image shows up flipped
        
        //If the -arithmetic flag is used instead of -optimize, compression almost doubles
        //However few applications support arithmetic coded JPEG's
        //Although jpegtran supports arithmetic coded JPEG's, the specific build may not.
		let compressor = spawn(jpegtranPath, ["-optimize", "-progressive", "-copy", "all", inputSrc], {
			detached: true,
			stdio: [ 'ignore', "pipe", "pipe" ]
		})
		
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
		
	//Let's just make sure that the output file has a smaller file size
	
	let originalSize = fs.statSync(inputSrc).size
	let compressedSize = 0
	
	for (let i=0;i<stdoutCache.length;i++) {
		compressedSize += stdoutCache[i].length
	}
	
	
	if (originalSize > compressedSize) {
		//Overwrite the original file with the compressed data
		fs.unlinkSync(inputSrc)
		let outputFile = fs.openSync(inputSrc, "a") //The file no longer exists, so it will be created here
		//Since we have multiple buffers to write in, open for appending
		
		for (let i=0;i<stdoutCache.length;i++) {
			fs.writeSync(outputFile, stdoutCache[i])
		}
	}
	
	return {
		originalSize,
		compressedSize, 
        mark: true,
	}
	
}


module.exports.compressJPEG = compressJPEG
