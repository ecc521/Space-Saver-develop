require("./allPages.js")



const {dialog} = require('electron').remote

const calculateFiles = require("./calculateFiles.js")
const scheduler = require("./scheduler.js")

//Uses when the renderer process executes javascript in this process
const {ipcRenderer} = require("electron")









document.getElementById("start").addEventListener("click", reduceStorageSpace)


let savings, compressed, count, totalSize;

let progressText = document.getElementById("progressBarText")


let pauseButton = document.createElement("button")
pauseButton.innerText = "Pause Compression"
pauseButton.addEventListener("click", function() {
    let prom = scheduler.pauseCompression()
    alert("Finishing up current files. You will receive another message like this one once pausing is finished.")
    prom.then((val) => {
        if (val) {
            alert("Pausing Complete. You can safely close the app.")
            ipcRenderer.send('asynchronous-message', true) //The window can now be terminated
            pauseButton.replaceWith(resumeButton)
        }
        else {
            alert("Compression has been resumed.")
        }
    })
})
pauseButton.id = "pauseButton"
pauseButton.className = "btn"
document.getElementById("menu").appendChild(pauseButton)


let resumeButton = document.createElement("button")
resumeButton.innerHTML = "Resume" //Need to resize button. "Resume Compression" went onto a second line
resumeButton.addEventListener("click", function(){
    ipcRenderer.send('asynchronous-message', false) //The window can no longer be terminated
    scheduler.resumeCompression()
    resumeButton.replaceWith(pauseButton)
})
resumeButton.id = "resumeButton"
resumeButton.className = "btn"





function update() {
    document.getElementById("progressBarInner").style.width = (compressed/count*100) + "%"
    //Sorry - I'm using megabytes instead of mebibytes, because some people may not know what MiB is.
    progressText.innerHTML = `${compressed}/${count} files compressed. ${(savings/1000000).toFixed(2)} MB saved out of ${(totalSize/1000000).toFixed(2)} MB (${(savings/totalSize*100).toFixed(2)}% reduction)`
}


function reduceStorageSpace() {
    let schedulerStatus = scheduler.getLocalValues()

    if (schedulerStatus.paused) {
        //Don't bother alerting the user - file marking should prevent wasting of CPU time.
        scheduler.clearCompressionQueue()
        scheduler.resumeCompression()
        resumeButton.replaceWith(pauseButton)
    }
    else if (schedulerStatus.compressionQueue.length > 0) {
        alert("Compression is currently in progress. Please pause compression before adding more files.")
        return;
    }


    ipcRenderer.send('asynchronous-message', false) //The window can no longer be terminated

    document.getElementById("progressBarOuter").style.display = "block"
    progressText.innerHTML = "Beginning compression... It may take a few seconds before results show"

    let paths = calculateFiles.getSelectedPaths()
    let filteredPaths = calculateFiles.filterExcludedPaths(paths)

    //Run compression on all files in filteredPaths.

    savings = 0
    totalSize = 0
    compressed = 0
    count = 0

    for (let path in filteredPaths) {
        count++
        scheduler.compressParalell(path).then((results) => {
            //The file has been compressed
            console.log(path)
            console.log(results)

            let fileSavings = results.originalSize - results.compressedSize
            if (!isNaN(fileSavings)) {
                savings += fileSavings
                totalSize += results.originalSize
            }
            compressed++

            update()
            if (compressed === count) {
                ipcRenderer.send('asynchronous-message', true) //The window can now be terminated
            }
        })
    }

}










//Dark mode support
//As of now, CSS media queries fail
if (require("electron").remote.systemPreferences.isDarkMode()) {
    let elem = document.createElement("style")
    elem.innerHTML = `
body {
background: black;
color: white;
}
.selectedItem {
color:black
}
h1 {
text-align:center;
}
`
    document.body.appendChild(elem)
}




//All this is for rendering the select folder and select file buttons

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






//Try to give the app time to load before displaying alerts
setTimeout(require("./detectJunk.js").detectJunk, 750)

require("./update.js")

