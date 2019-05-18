require("./allPages.js")



function createSearchLink(query) {
	return "https://www.google.com/search?q=" + query
}

let homePage = "https://www.google.com/"


let view = document.createElement("webview")
view.className = "webview"
window.addEventListener("DOMContentLoaded", function() {
	view.allowfullscreen = true
	view.enableremotemodule = false
	view.src = homePage
})



let backButton = document.createElement("button")
backButton.className = "navigationButton"
backButton.innerHTML = String.fromCharCode(11013) //"⬅"

let forwardButton = document.createElement("button")
forwardButton.className = "navigationButton"
forwardButton.innerHTML = String.fromCharCode(10145) //"➡"

let reloadButton = document.createElement("button")
reloadButton.className = "navigationButton"
reloadButton.innerHTML = String.fromCharCode(8635) //"↻"


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

//Select all content in urlBar when clicked and not yet focused.
urlBar.onfocus = function(){
	console.log("Added")
	setTimeout(function() {urlBar.select()}, 25)

	urlBar.addEventListener("click", function() {
		setTimeout(function(){
			urlBar.select()	
		},25)
	}, {once:true})
}


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

view.addEventListener("update-target-url", function(url) {
	//User hovers over link
	console.log(url)
})

view.addEventListener("new-window", function(event) {
	console.log(event)
})

view.addEventListener("will-navigate", function(url) {
	console.log(url)
})

document.body.appendChild(backButton)
document.body.appendChild(forwardButton)
document.body.appendChild(reloadButton)
document.body.appendChild(urlBar)
document.body.appendChild(view)
