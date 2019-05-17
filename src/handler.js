//TODO: Add a way to open these files in the compressor UI.

require("./allPages.js")

const fs = require("fs")
const path = require("path")

let remoteArguments = require("electron").remote.process.argv		


let filePath;

			for (let i=1;i<remoteArguments.length;i++) {
				if (fs.existsSync(remoteArguments[i])) {
					if (!fs.statSync(remoteArguments[i]).isDirectory()) {
						filePath = remoteArguments[i]
					}
				}
			}

filePath = path.resolve(filePath)

document.body.style.margin = 0


let view = document.createElement("webview")
view.style.width = "100vw"
view.style.height = "100vh"
document.body.appendChild(view)
window.addEventListener("DOMContentLoaded", function() {
	view.allowfullscreen = true
	view.enableremotemodule = false
	view.src = filePath
})

