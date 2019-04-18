const utils = require("./utils.js")
const fs = require("fs")
const path = require("path")

const languages = require("./languages.js").languages




//This and getLauguagePacks are macOS only
function getApplications (dir, dirs_){

    dirs_ = dirs_ || [];

    //Return if we were passed a file or symbolic link
    let dirStats = fs.lstatSync(dir)

    if (dirStats.isSymbolicLink() || !dirStats.isDirectory()) {
        return [];
    }

    let files;

    try {
        files = fs.readdirSync(dir);
    }
    catch (e) {
        //Likely a permission denied error
        //Return an empty array
        console.warn(e);
        return []
    }

    for (var i in files){

        let name = path.join(dir, files[i])
        let stats = fs.lstatSync(name)
        if (stats.isDirectory()){
            if (files[i].endsWith(".app")) {
                dirs_.push(name)
            }
            else {
                getApplications(name, dirs_)
            }
        }
    }
    return dirs_;
}





function getLanguagePacks(app) {
    let packs = []
    let dir = path.join(app, "Contents", "Resources")

    let contents = fs.readdirSync(dir)

    for (let c=0;c<contents.length;c++) {
        let name = contents[c]
        let src = path.join(dir, name)
        let stats = fs.statSync(src)
        if (stats.isDirectory() && name.endsWith(".lproj")) {
            let language = path.basename(name, ".lproj")
            packs.push(src)
        }
    }
    return packs
}



//Consider not scanning system applications so that a macOS reinstallation (an update may also work)
//would not be needed.

//Allow the user to select which languages to keep.
let applications = getApplications("/Applications")

let sizes = {}



for (let i=0;i<applications.length;i++) {

    let packs = getLanguagePacks(applications[i])
    console.log(i)

    for (let c=0;c<packs.length;c++) {
        let pack = packs[c]

        let language = path.basename(pack, ".lproj")
        
        //I believe we need to keep Base.lproj, except in the case of macOS 10.9+,
        //where the development language in Base.lproj is also in it's own .lproj file
        //I don't find this worth bothering with
        if (language === "Base") {
            continue;
        }
        
        
        let packBytes = fs.statSync(pack).size

        let contents = utils.getFilesInDirectory(pack)
        for (let s=0;s<contents.length;s++) {
            let filesize = fs.statSync(contents[s]).size
            packBytes += filesize
        }
        
        sizes[language] = sizes[language] || 0
        sizes[language] += packBytes
    }
}


let items = []
for (let language in sizes) {
    items.push(languages[language] || language) //If we have the expanded version of the language, use it.
}
items.sort()

let modal = document.createElement("div")
let warning = document.createElement("p")
warning.innerHTML = "It is advised that you err on the side of caution, and pick all languages that you can use, or may ever use. Make sure to read through the whole list, expecially the bottom. Reinstallations will likely be required if you want a language pack back."
modal.appendChild(warning)

for (let i=0;i<items.length;i++) {
    let checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    modal.appendChild(checkbox)
    modal.innerHTML += items[i] + "<br>"
}

document.body.appendChild(modal)







console.log(sizes)


module.exports = {
    getLanguagePacks,
    getApplications
}



