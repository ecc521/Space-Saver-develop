



async function checkForUpdates() {
    let currentVersion = require("electron").remote.app.getVersion()

    let response = await fetch("https://ecc521.github.io/Space-Saver/versions.json", {cache: "no-store"})
    let versions = await response.json()
    
    
    //Allow for basic platform specific version bumps.
    let latestVersion = versions[process.platform] || versions.version

    if (currentVersion != latestVersion) {

        let alert = document.createElement("p")
        alert.innerHTML = `This app (version ${currentVersion}) is out of date. You can download the latest version (${latestVersion}) `

        
        
        let button = document.createElement("p")
        button.innerHTML = "here"
        button.style.textDecoration = "underline"
        button.style.cursor = "pointer"
        button.style.display = "inline-block"
        
        button.onclick = function() {
            let display = require("electron").screen.getPrimaryDisplay()
            let BrowserWindow = require("electron").remote.BrowserWindow
            let downloadWindow = new BrowserWindow ({
                webPreferences: {
                    nodeIntegration: false
                },
				width: Math.ceil(display.bounds.width*0.75), 
				height: Math.ceil(display.bounds.height*0.75)
            })

            downloadWindow.loadURL('https://github.com/ecc521/Space-Saver/releases/latest')            
        }
        
        
        alert.appendChild(button)
        alert.style.textAlign = "center"
        document.body.insertBefore(alert, document.body.firstChild)

    }
}



checkForUpdates()