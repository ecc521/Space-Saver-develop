//This was previouslly used to avoid recompressing non-progressive JPEG images
//This is being dropped after I ran some tests on 22 GB of photos - enough were progressive,
//And saw significant savings when run through jpegtran due to huffman table optimization.

//This may be useful in estimating compression savings though

const fs = require("fs")



function isProgressiveJPEG(src) {
	
	let stream = fs.createReadStream(src)
	
	return new Promise((resolve, reject) => {
		let last = null;
        let chunk = null;
		
		stream.on("readable", function() {
			while (null !== (chunk = stream.read())) {
				for (let i=0;i<chunk.length;i++) {
					let byte = chunk[i]
					

					if (last === 0xFF && byte === 0xC0) {
						//0xFF, 0xC0 is start of frame for baseline JPEG
						resolve(false)
					}
					else if (last === 0xFF && byte === 0xC2) {
						//0xFF, 0xC2 is start of frame for progressive JPEG
						resolve(true)
					}
					
					
					last = byte
				}
			}			
		})
		
		stream.on("end", function() {resolve(false)}) //Clearly not a JPEG if we got here
	})
}








module.exports = {
	isProgressiveJPEG,
}