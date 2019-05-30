//TODO: Add a way to open these files in the compressor UI.

require("./allPages.js")

const fs = require("fs")
const path = require("path")

let filePath;
if (!window.location.search) {
	//TODO: Create a button to select a file
	alert("Please open the file with Space Saver. Currently, the file viewer does not have a file selector.")
}
else {
	filePath = window.location.search.slice(1)
}

document.body.style.margin = 0


let view = document.createElement("webview")
view.style.width = "100vw"
view.style.height = "100vh"
document.body.appendChild(view)
window.addEventListener("DOMContentLoaded", function() {
	view.allowfullscreen = true
	view.enableremotemodule = false
	view.src = filePath

	view.addEventListener("dom-ready", resizeViewer)
})





async function resizeViewer() {
	let width = await view.executeJavaScript(`window.getComputedStyle(document.body.firstChild).width`)
	let height = await view.executeJavaScript(`window.getComputedStyle(document.body.firstChild).height`)

	width = parseInt(width)
	height = parseInt(height)

	window.resizeTo(Math.max(100, width), Math.max(50, height))
	console.log("Resized to " + width + " px wide and " + height + " px tall.")
}
