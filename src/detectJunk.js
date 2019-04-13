const fs = require("fs")
const path = require("path")

const utils = require("./utils.js")

const {shell} = require("electron")
const {dialog} = require("electron").remote





//Errors when something goes wrong
//Returns versions from newest to oldest.
function getChromeVersions(build = "stable") {    
    //Format:
    //MAJOR.MINOR.BUILD.PATCH

    //The build and the patch are all that matter for determining the newer version


    if (process.platform === "darwin") {

        let buildNames = {
            stable: "Google Chrome.app",
            //As of now, both beta and dev use the same name as stable.
            canary: "Google Chrome Canary.app",
        }

        let dir = path.join("/Applications", buildNames[build],"Contents", "Versions")
        let files = fs.readdirSync(dir)

        let versions = []

        for (let i=0;i<files.length;i++) {
            let name = files[i]
            let sections = name.split(".")

            //Check to make we have something in the format of XX.XX.XX.XX (number of digits irrelevent)
            if (sections.length === 4 && sections.every(x => !isNaN(Number(x)))) {
                versions.push({
                    version: name,
                    path: path.resolve(dir, name),
                    major: sections[0],
                    minor: sections[1],
                    build: sections[2],
                    patch: sections[3]
                })
            }

        }

        //Sort the versions from newest to oldest

        function versionCompare(a,b) {
            if (a.build !== b.build) {
                return b.build-a.build
            }
            else {
                return b.patch-a.patch
            }
        }

        versions.sort(versionCompare)
        return versions

    }
    else {
        //Only runs on Mac right now
        throw "Unsupported platform"
    }
}





//This code is extremely repetitive and junky. It should be cleaned up.
function detectJunk() {
    try {
        
        if (localStorage.getItem("skipChromeStableUpdates") === "true") {throw ""}

        let versions = getChromeVersions("stable")

        let storageUsed = 0
        for (let i=0;i<versions.length;i++) {
            let files = utils.getFilesInDirectory(versions[i].path)
            for (let i=0;i<files.length;i++) {
                storageUsed += fs.statSync(files[i]).size
            }
        }
        
        let result = dialog.showMessageBox({
            type: "question",
            buttons: ["Delete Them", "Show the Files", "Ignore and Don't Ask Again", "Ignore for Now"],
            title: "An Application is Wasting your Storage",
            message: `You have ${versions.length} Google Chrome updates stored on your device, using up ${storageUsed} bytes. What would you like to do?`
        })

        if (result === 0) {
            for (let i=0;i<versions.length;i++) {
                let files = utils.getFilesInDirectory(versions[i].path)
                for (let c=0;c<files.length;c++) {
                    fs.unlinkSync(files[i])
                }
            }
        }
        else if (result === 1) {
            shell.showItemInFolder(versions[versions.length-1].path)
        }
        else if (result === 2) {
            localStorage.setItem("skipChromeStableUpdates", true)
        }
    
    }
    catch (e) {}

    try {
        
        if (localStorage.getItem("skipChromeCanaryUpdates") === "true") {throw ""}
        
        let versions = getChromeVersions("canary")

        let storageUsed = 0
        for (let i=0;i<versions.length;i++) {
            let files = utils.getFilesInDirectory(versions[i].path)
            for (let i=0;i<files.length;i++) {
                storageUsed += fs.statSync(files[i]).size
            }
        }
        
        let result = dialog.showMessageBox({
            type: "question",
            buttons: ["Delete Them", "Show the Files", "Ignore and Don't Ask Again", "Ignore for Now"],
            title: "An Application is Wasting your Storage",
            message: `You have ${versions.length} Google Chrome Canary updates stored on your device, using up ${storageUsed} bytes. What would you like to do?`
        })


        if (result === 0) {
            for (let i=0;i<versions.length;i++) {
                let files = utils.getFilesInDirectory(versions[i].path)
                for (let c=0;c<files.length;c++) {
                    fs.unlinkSync(files[i])
                }
            }
        }
        else if (result === 1) {
            shell.showItemInFolder(versions[versions.length-1].path)
        }
        else if (result === 2) {
            localStorage.setItem("skipChromeCanaryUpdates", true)
        }
          
        
    
    }
    catch (e) {}


}


module.exports = {
    detectJunk,
    getChromeVersions,
}