const {dialog} = require('electron').remote

let dir = dirObject
let dirs = [];
 

let addBtn = document.querySelector('#addBtn')
addBtn.addEventListener('click', addFolder)

let pathsDiv = document.querySelector('#paths')
let pathsDivHead = document.querySelector('#pathsHead')


function addFolder(){
 let options = {
  properties: ['openDirectory', 'multiSelections']
 }
 
 dialog.showOpenDialog(options, (paths) => {
  if (!paths) return
  paths.forEach(path =>{
   let exist = dirs.some((dir) => {
    return dir.path == path
   })
 
   if (exist){
    alert(path + ' already added in the list') 
    return
   }
 
   new dir(path);
  })
 })
}


function dirObject (path){
 this.path = path
 this.isIncluded = true
 dirs.push (this)
 
 pathsDivHead.className = ''

 let textNode = document.createTextNode(path)
 
 let del = document.createElement('span')
 del.className = 'delDir';
 del.innerHTML = '✖'
 
 let type = document.createElement('span');
 type.className = 'typeDir'
 type.innerHTML = 'included';
 
 let div = document.createElement('div')
 div.appendChild(del)
 div.appendChild(type)
 div.appendChild(textNode)
 pathsDiv.appendChild(div)
 
 del.addEventListener('click', () => {
  pathsDiv.removeChild(div)
  let index = dirs.indexOf(this)

  if (index !== -1)
   dirs.splice(index, 1)

  if (dirs.length === 0 )
   pathsDivHead.className = 'hide';
 })
 
 type.addEventListener('click', () => {
  this.isIncluded = !this.isIncluded
  if (this.isIncluded){
   type.className = 'typeDir'
   type.innerHTML = 'included'
  } else {
   type.className = 'typeDir typeDirDisable'
   type.innerHTML = 'excluded'
  }
 })
}