
//Files that will not benefit from transparent filesystem compression
//Note: If there is an algorithm for recompressing the file effectively, this list will be ignored

//The list (uncompressable.txt) should be sorted alphabetically


const fs = require("fs")


let fileText = fs.readFileSync("uncompressable.txt", "utf8")
let fileLines = fileText.split("\n")

let extensions = []

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
		extensions.push(extension)
	}
	else {
		extensions.push("." + extension)
	}
}






module.exports = {
	uncompressable,
}