require("./allPages.js")



function createSearchLink(query) {
	return "https://www.google.com/search?q=" + query
}

let homePage = "https://www.google.com/"


let view = document.createElement("webview")
view.style.width = "100%"
view.style.height = "calc(100% - 30px)"
window.addEventListener("DOMContentLoaded", function() {
	view.allowfullscreen = true
	view.enableremotemodule = false
	view.src = homePage
})



let backButton = document.createElement("button")
backButton.className = "navigationButton"
backButton.innerHTML = "⬅"

let forwardButton = document.createElement("button")
forwardButton.className = "navigationButton"
forwardButton.innerHTML = "➡"

let reloadButton = document.createElement("button")
reloadButton.className = "navigationButton"
reloadButton.innerHTML = "↻"


let urlBar = document.createElement("input")
urlBar.id = "urlBar"
urlBar.placeholder = "Type URL or Search Query Here..."



urlBar.addEventListener("keydown", function(event){
	if (event.key === "Enter") {
		
		let value = urlBar.value.trim()
		
		//Cheap way to make sure we are NOT looking for a URL
		if (value.includes(" ") || !value.includes(".")) {
			view.src = createSearchLink(value)
		}
		else {
			if (!value.startsWith("http://") && !value.startsWith("https://")) {
				value = "http://" + value
			}
			urlBar.value = value
			view.src = value
		}
	}
})

backButton.addEventListener("click", function() {
	view.goBack()
})

forwardButton.addEventListener("click", function() {
	view.goForward()
})

reloadButton.addEventListener("click", function() {
	view.reload()
})

view.addEventListener("did-start-loading", function() {
	urlBar.value = view.src
})

view.addEventListener("did-finish-load", function() {
	urlBar.value = view.getURL()
})

document.body.appendChild(backButton)
document.body.appendChild(forwardButton)
document.body.appendChild(reloadButton)
document.body.appendChild(urlBar)
document.body.appendChild(view)
