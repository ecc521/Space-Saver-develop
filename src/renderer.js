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
 

let addBtn = document.querySelector('#addBtn')
addBtn.addEventListener('click', addFolder)

let selectedItems = document.querySelector('#selectedItems')
let selectedItemsHeader = document.querySelector('#selectedItemsHeader')


function addFolder(){
    let options = {
        //TODO: It appears that on both Windows and Linux, you cannot have a single selection dialogue
        //for both directories and files.

        //For Windows and Linux, create both an Add Folders and an Add Files
        //First make sure that a single selection dialogue doesn't work though
        properties: ['openDirectory', "openFile", 'multiSelections']
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







