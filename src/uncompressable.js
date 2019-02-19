
//Files that will not benefit from transparent filesystem compression
//Note: If there is an algorithm for recompressing the file effectively, this list will be ignored

//The list (uncompressable.txt) should be sorted alphabetically


const fs = require("fs")
const path = require("path")

let fileText = fs.readFileSync(path.join(__dirname, "uncompressable.txt"), "utf8")
let fileLines = fileText.split("\n")

let uncompressable = []

//Collect all the file extensions. Ignore comments
for (let i=0;i<fileLines.length;i++) {
	
	let line = fileLines[i]
	
	if (line.startsWith("//") || line.length === 0) {
		continue;
	}
	
	let arr = line.split(" ")
	let extension = arr[0]
	
	//Add the dot if the user didn't
	if (extension.startsWith(".")) {
		uncompressable.push(extension)
	}
	else {
		uncompressable.push("." + extension)
	}
}






module.exports = {
	uncompressable,
}