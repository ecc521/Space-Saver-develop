require("./allPages.js")


function createSearchLink(query) {
	return "https://www.google.com/search?q=" + query
}

let homePage = "https://www.google.com/"


let urlBar = document.createElement("input")
urlBar.id = "urlBar"
urlBar.placeholder = "Type URL or Search Query Here..."
document.body.appendChild(urlBar)

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


let view = document.createElement("webview")
view.style.width = "100%"
view.style.height = "calc(100% - 30px)"
document.body.appendChild(view)
window.addEventListener("DOMContentLoaded", function() {
	view.allowfullscreen = true
	view.enableremotemodule = false
	view.src = homePage
})



view.addEventListener("did-start-loading", function() {
	urlBar.value = view.getURL()
})

view.addEventListener("did-finish-load", function() {
	urlBar.value = view.getURL()
})