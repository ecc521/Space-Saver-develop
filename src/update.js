
async function checkForUpdates() {
    let currentVersion = require("electron").remote.app.getVersion()
    
    let versions = await (await fetch("https://ecc521.github.io/Space-Saver/versions.json")).json()
    let latestVersion = versions.version
    
    if (currentVersion != latestVersion) {
        
        let alert = document.createElement("p")
        alert.innerHTML = `This app (version ${currentVersion}) is out of date. You can download the latest version (${latestVersion}) at <a href="https://github.com/ecc521/Space-Saver/releases/latest">GitHub</a>`
        alert.style.textAlign = "center"
        document.body.insertBefore(alert, document.body.firstChild)
        
    }
}



checkForUpdates()