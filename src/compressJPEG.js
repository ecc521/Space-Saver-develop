'use strict'

const fs = require("fs")

const { spawn } = require('child_process');


const jpegtran = "./mozjpeg-build/jpegtran-static"


async function compressJPEG(inputSrc) {	
    
	let stdoutCache = [] //Buffers to write into file cached are stored here

	//Compress jpeg here. Throw error if something goes wrong
	await new Promise((resolve, reject) => {
				

		let compressor = spawn(jpegtran, ["-optimize", "-progressive", inputSrc], {
			detached: true,
			stdio: [ 'ignore', "pipe", "pipe" ]
		})
		
		compressor.stderr.on("data", reject)
		
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
	}
	
}


module.exports.compressJPEG = compressJPEG
