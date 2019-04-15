
async function checkForUpdates() {
    let currentVersion = require("electron").remote.app.getVersion()


    //Bypass browser cache
    let headers = new Headers();
    headers.append('pragma', 'no-cache');
    headers.append('cache-control', 'no-cache');

    let settings = {
        method: 'GET',
        headers: headers,
    };
    
    
    let request = new Request("https://ecc521.github.io/Space-Saver/versions.json")

    let versions = await (await fetch(request, settings)).json()
    let latestVersion = versions.version

    if (currentVersion != latestVersion) {

        let alert = document.createElement("p")
        alert.innerHTML = `This app (version ${currentVersion}) is out of date. You can download the latest version (${latestVersion}) at <a href="https://github.com/ecc521/Space-Saver/releases/latest">GitHub</a>`
        alert.style.textAlign = "center"
        document.body.insertBefore(alert, document.body.firstChild)

    }
}



checkForUpdates()