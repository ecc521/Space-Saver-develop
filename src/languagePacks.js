const utils = require("./utils.js")
const fs = require("fs")
const path = require("path")

const languages = require("./languages.js").languages



//This needs to be async - the applications folder is large


//This and getLauguagePacks are macOS only
async function getApplications (dir, dirs_){

    dirs_ = dirs_ || [];

    //Return if we were passed a file or symbolic link
    let dirStats = await fs.promises.lstat(dir)

    if (dirStats.isSymbolicLink() || !dirStats.isDirectory()) {
        return [];
    }

    let files;

    try {
        files = await fs.promises.readdir(dir);
    }
    catch (e) {
        //Likely a permission denied error
        //Return an empty array
        console.warn(e);
        return []
    }

    for (var i in files){

        let name = path.join(dir, files[i])
        let stats = await fs.promises.lstat(name)
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



//TODO: Only get language packs that can be written to/deleted.

async function getLanguagePacks(app) {

    let packs = []
    let dir = path.join(app, "Contents", "Resources")

    let contents = await fs.promises.readdir(dir)

    for (let c=0;c<contents.length;c++) {
        let name = contents[c]
        let src = path.join(dir, name)
        let stats = await fs.promises.lstat(src)
        if (stats.isDirectory() && name.endsWith(".lproj")) {
            let language = path.basename(name, ".lproj")
            packs.push(src)
        }
    }
    return packs

}





//On macOS 10.14 (Mojave) and later, Apple's system integrity protection stops us from removing some
//language packs, like those in applications that come with the os, even with superuser permissions, though
//it could be bypassed in the following manner (note: not tested)

//Next line quoted from https://mackeeper.com/blog/post/610-macos-bundlore-adware-analysis/#How%20does%20macOS%20Bundlore%20overcome%20macOS%2010.14%20protection%20mechanisms? 
//WebTools uses interesting techniques to bypass SIP. First, it creates a pair of keys with the ssh-keygen utility. Then WebTools moves a newly-created key to user’s authorized_keys and enables remote login. This means, WebTools can use these keys to access the machine without a password.
//Next, it uses the sftp utility to login to a local ssh service with a newly-created pair of keys. From this point, WebTools can access and modify files protected by SIP.

//Of course, Apple is likely working on, or has already created, a fix.

//Allow the user to select which languages to keep.


(async function() {

    //During development, localStorage is cleared every time the app restarts.
    //This code detects if the app is started in development, and does not create the language pack notification if it is.
    if (require("path").basename(require("electron").remote.app.getAppPath()) !== "app.asar") {
        return;
    }
    
    if (process.platform !== "darwin") {
        return;
    }
    

    let lastNotified = localStorage.getItem("lastLanguagePackNotification")
    //Only notify if more than 30 days have passed since last dismissal.
    if (lastNotified !== null && Date.now() - lastNotified < 1000*60*24*30) {
        return;
    }

    let applications = await getApplications("/Applications")

    let sizes = {}

    let languagePackPaths = {}

    for (let i=0;i<applications.length;i++) {

        let packs = await getLanguagePacks(applications[i])

        for (let c=0;c<packs.length;c++) {
            let pack = packs[c]

            let language = path.basename(pack, ".lproj")

            //I believe we need to keep Base.lproj, except in the case of macOS 10.9+,
            //where the development language in Base.lproj is also in it's own .lproj file
            //I don't find this worth bothering with
            if (language === "Base") {
                continue;
            }

            //Make sure that we can actually write to the file. If we can't, system integrity protection has
            //probably stopped us.

            try {
                await fs.promises.access(pack, fs.constants.W_OK);
            } catch (err) {
                continue; //Don't include the size in count.
            }


            let packBytes = (await fs.promises.lstat(pack)).size

            let contents = utils.getFilesInDirectory(pack)
            for (let s=0;s<contents.length;s++) {
                let filesize = (await fs.promises.lstat(contents[s])).size
                packBytes += filesize
            }

            //If we have the expanded version of the language, use it.
            language = languages[language] || language

            languagePackPaths[language] = languagePackPaths[language] || []
            languagePackPaths[language].push(pack)

            sizes[language] = sizes[language] || 0
            sizes[language] += packBytes
        }
    }


    let items = []
    for (let language in sizes) {
        items.push(language)
    }
    items.sort()

    let background = document.createElement("div")
    background.id = "languagePacksBackground"
    document.body.appendChild(background)


    let modal = document.createElement("div")

    let header = document.createElement("h1")
    header.innerHTML = "Language Packs Found"
    header.style.textAlign = "center"
    modal.appendChild(header)


    let dismissButton = document.createElement("button")
    dismissButton.innerHTML = "Dismiss"
    dismissButton.addEventListener("click", () => {
        modal.remove()
        background.remove()
    })
    dismissButton.className = "btn"
    modal.appendChild(dismissButton)


    let closeButton = document.createElement("button")
    closeButton.innerHTML = "Close for 1 Month"
    closeButton.addEventListener("click", () => {
        modal.remove()
        background.remove()
        //Don't bother the user again for another month.
        localStorage.setItem("lastLanguagePackNotification", Date.now())
    })
    closeButton.className = "btn"
    modal.appendChild(closeButton)


    let deleteButton = document.createElement("button")
    deleteButton.innerHTML = "Delete Selected"
    deleteButton.addEventListener("click", () => {

        let checkboxes = document.querySelectorAll(".languagePackCheckbox")
        let toDelete = []

        for (let i=0;i<checkboxes.length;i++) {
            let elem = checkboxes[i]
            if (elem.firstChild.checked) {
                toDelete.push(elem.innerText.slice(0,elem.innerText.lastIndexOf("-")-1)) //Eliminate the - x.xxMB with slicing
            }
        }


        for (let i=0;i<toDelete.length;i++) {
            let files = languagePackPaths[toDelete[i]]
            for (let c=0;c<files.length;c++) {
                utils.deleteDirectory(files[c])
            }
        }

        modal.remove()
        background.remove()
    })
    deleteButton.className = "btn"
    modal.appendChild(deleteButton)


    let text = document.createElement("p")
    text.innerHTML = `Please select language packs that you would like to delete.`
    modal.appendChild(text)

    for (let i=0;i<items.length;i++) {
        let span = document.createElement("span")

        let checkbox = document.createElement("input")
        checkbox.type = "checkbox"

        span.appendChild(checkbox)
        span.innerHTML += items[i] + " - " + (sizes[items[i]]/1024/1024).toFixed(2) + "MB"
        span.className = "languagePackCheckbox"
        modal.appendChild(span)
    }

    modal.id = "languagePacksModal"
    document.body.appendChild(modal)

})()




module.exports = {
    getLanguagePacks,
    getApplications
}



