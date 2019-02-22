let utils = require("./utils.js")


function filterExcludedPaths(paths) {
    
    //The longer paths will be more specific
    paths.sort((a,b) => {return a.length - b.length})
    
    //Time to create the list
    let allFiles = {}
    
    for (let i=0;i<paths.length;i++) {
        let currentPath = paths[i].path
        let mode = paths[i].mode
        
        let currentFiles = utils.getFilesInDirectory(currentPath)
        
        for (let i=0;i<currentFiles.length;i++) {
            let currentFile = currentFiles[i]
            if (mode === "included") {
                allFiles[currentFile] = true //Add the path to the object
            }
            else {
                delete allFiles[currentFile] //Remove the path from the object
            }
        }
    }
    
    return allFiles
}




function getSelectedPaths() {
    let elems = document.querySelectorAll(".selectedItem")
    let pathArray = []
    for (let i=0;i<elems.length;i++) {
        let elem = elems[i]
        pathArray.push({
            path: elem.querySelector(".location").innerText,
            mode: elem.querySelector(".mode").innerText,
        })
    }
    return pathArray
}





module.exports = {
    getSelectedPaths,
    filterExcludedPaths,
}