
const path = require("path")


const uncompressable = require("./uncompressable.js")




function compressFile(src) {

	let extension = path.extname(src)
	
	
	
	if (extension === ".jpg" || extension === ".jpeg") {
		//Apply jpeg compression
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
	else if (uncompressable.indexOf(extension !== -1)) {
		return {
			compressed: false, //The file was not compressed
			mark: false, //We didn't try to compress the file
		}
	}
	//The file was not labeled as uncompressable. Attempt to apply transparent compression if available
	else {
		
	}
	




}



module.exports = {
	compressFile,
}