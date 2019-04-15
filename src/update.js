
async function checkForUpdates() {
    let currentVersion = require("electron").remote.app.getVersion()
    
    let versions = await (await fetch(baseURL + "versions.json")).json()
    let version = versions.version
    
    if (currentVersion != version) {
        alert("This app is out of date. You can download the latest version at https://ecc521.github.io/Space-Saver")
    }
}




checkForUpdates()