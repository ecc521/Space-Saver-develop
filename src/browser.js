require("./allPages.js")


document.body.style.margin = 0
document.body.style.height = "100%"
document.documentElement.style.height = "100%"

function createSearchLink(query) {
	return "https://www.google.com/search?q=" + query
}

let homePage = "https://www.google.com/"


let urlBar = document.createElement("input")
urlBar.style.width = "90%"
urlBar.style.height = "26px"
urlBar.style.borderRadius = "15px"
//urlBar.style.border = "none" //If this line is uncommented, 26px can be changed to 30px
urlBar.style.padding = 0
urlBar.style.margin = 0
urlBar.style.backgroundColor = "#eeeeee"
document.body.appendChild(urlBar)

urlBar.addEventListener("keydown", function(event){
	if (event.key === "Enter") {
		
		let value = urlBar.value
		
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