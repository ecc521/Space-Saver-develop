const {dialog} = require('electron').remote

const calculateFiles = require("./calculateFiles.js")




document.getElementById("start").addEventListener("click", reduceStorageSpace)

function reduceStorageSpace() {
    let paths = calculateFiles.getSelectedPaths()
    let filteredPaths = calculateFiles.filterExcludedPaths(paths)
    
    //Run compression on all files in filteredPaths.
    //Real time update should be offered if possible
    
    //NOTE: getSelectedPaths() and filterExcludedPaths() have not yet been tested
    
}












let paths = [];
 

let selectedItems = document.querySelector('#selectedItems')
let selectedItemsHeader = document.querySelector('#selectedItemsHeader')



//Create Add Files button
//If a single file dialog for both folders and files is not supported, also make an add folders button
function createButton(text) {
	let button = document.createElement("button")
	button.className = "btn"
	button.innerText = text
	return button
}


let menu = document.getElementById("menu")

if (process.platform === "darwin") {
	//Create one button for both file and folder selection
	let selectButton = createButton("📂 Select Files")
	selectButton.addEventListener("click", function(){addPaths(true, true)})
	menu.appendChild(selectButton)
}
else {
	//Create a button for file selection and a button for folder selection
	let folderButton = createButton("📂 Select Folders")
	folderButton.addEventListener("click", function(){addPaths(false, true)})
	menu.appendChild(folderButton)
	
	let fileButton = createButton("Select Files")
	fileButton.addEventListener("click", function(){addPaths(true, false)})
	menu.appendChild(fileButton)
}



function addPaths(files, folders){
	let properties = []
	
	//On Windows and Linux a single dialog can't be for both folders and directories. Electron shows a file selector
	
//Create both an Add Folders and an Add Files
	if (folders) {
		properties.push("openDirectory")
	}
	
	if (files) {
		properties.push("openFile")
	}
	
	properties.push("multiSelections") //Allow selecting multiple files
	
 let options = {     
  properties,
 }
 
 dialog.showOpenDialog(options, (newPaths) => {
     if (!newPaths) {
         return;
     }
     
  newPaths.forEach(newPath =>{
      let exist = paths.some((pathObject) => {
          return pathObject.path == newPath
      })

      if (exist){
          //alert(newPath + " has already been selected.") 
          return;
      }

      new pathObject(newPath);
  })
 })
}


function pathObject (newPath){
 this.path = newPath
 this.isIncluded = true
 paths.push (this)
 
 selectedItemsHeader.className = ''

 let textNode = document.createElement("p")
 textNode.innerText = newPath
    textNode.style.display = "inline-block"
    textNode.className = "location"
    
    
 let del = document.createElement('span')
 del.className = 'delDir';
 del.innerHTML = '✖'
 
 let type = document.createElement('span');
 type.className = 'mode'
 type.innerHTML = 'included';
 
 let div = document.createElement('div')
 div.className = "selectedItem"
 div.appendChild(del)
 div.appendChild(type)
 div.appendChild(textNode)
 selectedItems.appendChild(div)
 
 del.addEventListener('click', () => {
  selectedItems.removeChild(div)
  let index = paths.indexOf(this)

  if (index !== -1)
   paths.splice(index, 1)

  if (paths.length === 0 )
   selectedItemsHeader.className = 'hide';
 })
 
 type.addEventListener('click', () => {
  this.isIncluded = !this.isIncluded
  if (this.isIncluded){
   type.className = 'mode'
   type.innerHTML = 'included'
  } 
     else {
   type.className = 'mode modeExcluded'
   type.innerHTML = 'excluded'
  }
 })
}







