'use strict'

const { spawn } = require('child_process');

const zopflipng = "./zopfli/zopflipng"


async function compressPNG(inputSrc) {	
	
	//Compress png here. Throw error if something goes wrong
	return new Promise((resolve, reject) => {
		
		//Overwrites input file if output is smaller
		
		let compressor = spawn(zopflipng, ["-y", inputSrc, inputSrc], {
			detached: true,
			stdio: [ 'ignore', 'ignore', "pipe" ]
		})
		
		compressor.stderr.on("data", reject)
		
		compressor.on("close", resolve)
		
	})
		
}


module.exports.compressPNG = compressPNG
