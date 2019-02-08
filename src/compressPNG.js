async function compressPNG(inputSrc) {	
	
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
		
}


module.exports.compressPNG = compressPNG
