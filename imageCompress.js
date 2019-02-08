'use strict'

//Consider taking hash of image data to make TOTALLY sure files are identical (only if it has minor performance impact)

const fs = require("fs")
const path = require("path")

const { spawn } = require('child_process');





const jpegtran = "./mozjpeg-build/jpegtran-static"
const zopflipng = "./zopfli/zopflipng"

const prefix = "a7xj3kjafie" //jpegtran cannot directly modify the input file. We need to output to a new location, delete the input



async function compressJPEG(inputSrc) {

	console.log("Compressing " + inputSrc)

	let inputDirname = path.dirname(inputSrc) //Get directory of the input image
	let inputName = path.basename(inputSrc) //Get name of input image
	
	let outputName = prefix + inputName //Add prefix to name of input image
	let outputSrc = path.join(inputDirname, outputName) //Combine the directory and prefixed name
	
	
	//Compress jpeg here. Throw error if something goes wrong
	await new Promise((resolve, reject) => {
		
		let outputFile = fs.openSync(outputSrc, "wx") //Create for writing. Fails if file exists (that should be handled, even though it would be freak)
		
		let compressor = spawn(jpegtran, ["-optimize", "-progressive", inputSrc], {
			detached: true,
			stdio: [ 'ignore', outputFile, "pipe" ]
		})
		
		compressor.stderr.on("data", reject)
		
		compressor.on("close", resolve)
		
	})
		
	//Let's just make sure that the output file has a smaller file size
	
	let originalSize = fs.statSync(inputSrc).size
	let compressedSize = fs.statSync(outputSrc).size
	
	if (originalSize > compressedSize) {
		fs.unlinkSync(inputSrc) //Delete the input image
		fs.renameSync(outputSrc, inputSrc) //Move the prefixed and compressed image to the original location
	}
	else {
		fs.unlinkSync(outputSrc) //The output file was larger. Delete it.
	}
	
	console.log("Finished compressing " + inputSrc)
	
}





async function compressPNG(inputSrc) {

	console.log("Compressing " + inputSrc)
	
	
	//Compress png here. Throw error if something goes wrong
	await new Promise((resolve, reject) => {
		
		//Overwrites input file if output is smaller
		
		let compressor = spawn(zopflipng, ["-y", inputSrc, inputSrc], {
			detached: true,
			stdio: [ 'ignore', 'ignore', "pipe" ]
		})
		
		compressor.stderr.on("data", reject)
		
		compressor.on("close", resolve)
		
	})
		
	console.log("Finished compressing " + inputSrc)

}




//compressJPEG seems to compress slightly more and MUCH (~30x) faster

module.exports = {
	compressJPEG,
	compressPNG,
}
