
const path = require("path")

const compressJPEG = require("./compressJPEG.js") //JPEG lossless compression through mozjpeg
const transparentCompression = require("./transparentCompression.js") //Transparent compression utilities - these may not always be available

const uncompressable = require("./uncompressable.js") //Uncompressable file types


async function compressFile(src) {

	let extension = path.extname(src).toLowerCase()
	
	if (extension === ".jpg" || extension === ".jpeg") {		
		//Apply jpeg compression
		let result = await compressJPEG.compressJPEG(src)
        return result
	}
	
	
	
	else if (extension === ".png") {
		//zopflipng is much too slow. Don't do anything
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
        else {
            //Transparent compression not available
            return {
                compressed: false,
                mark: false,
            }
        }
	}
	




}



module.exports = {
	compressFile,
}
