
const path = require("path")

const compressJPEG = require("./compressJPEG.js") //JPEG lossless compression through mozjpeg
const transparentCompression = require("./transparentCompression.js") //Transparent compression utilities - these may not always be available

const uncompressable = require("./uncompressable.js") //Uncompressable file types



//We skip progressive JPEG images
const isProgressiveJPEG = require("./isProgressiveJPEG.js")



async function compressFile(src) {

	let extension = path.extname(src).toLowerCase()
    
	
	if (extension === ".jpg" || extension === ".jpeg") {
		//Make sure the JPEG isn't progressive - because progressive images won't compress much more, and
		//are likely to have already been compressed by our application
		if (await isProgressiveJPEG.isProgressiveJPEG(src)) {
			return {
				compressed: false, //We didn't compress it
				mark: false, //No reason to mark. We will catch it next time
			}
		}
		
		//Apply jpeg compression
		let result = await compressJPEG.compressJPEG(src)
        return result
	}
	
	
	
	else if (extension === ".png") {
		//Zopflipng compression is much too slow. Don't do anything
		//May add the feature back in a controlled manner
		return {
			compressed: false, //The file was not compressed
			mark: false, //We didn't try to compress the file
		}
	}
	
	
	//If the file is listed as uncompressable, skip the file
	else if (uncompressable.uncompressable.indexOf(extension) !== -1) {
		return {
			compressed: false, //The file was not compressed
			mark: false, //We didn't try to compress the file
		}
	}
	
	//The file was not labeled as uncompressable. Attempt to apply transparent compression if available
	else {
		if (transparentCompression.transparentlyCompress) {
			let result = await transparentCompression.transparentlyCompress(src) //Transparently compress the file
            return result;
		}
	}
	




}



module.exports = {
	compressFile,
}