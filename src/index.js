const electron = require('electron')
const {app, Menu} = electron
const BrowserWindow = electron.BrowserWindow
const fs = require("fs")
const path = require("path")

let mainWindow




const { ipcMain } = require('electron')

let canclose = true;
ipcMain.on('asynchronous-message', function(event, value) {
    //Currently, this is only used to stop acciendenal closing of the window
    canclose = value
    event.returnValue = canclose
});


function createWindow (pagePath, query) {
    let display = electron.screen.getPrimaryDisplay()
    let newWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
			webviewTag: true
        },
        width: Math.ceil(display.bounds.width*0.8),
        height: Math.ceil(display.bounds.height*0.9)
    })



    	newWindow.loadURL('file://'+__dirname+'/'+ pagePath + "?" + query)

    //See if we should ask the user before closing
    newWindow.on('close', function (event) {
        //Currently used to see if the window should be closed, or
        //if closing should be stopped due to compressing in progress

        if (canclose === false) {
            let choice = electron.dialog.showMessageBox(
                newWindow,
                {
                    type: 'question',
                    buttons: ['Close', 'Pause Compression', 'Cancel'],
                    title: 'Please Confirm',
                    message: 'Compressing of files is still in progress. Although the risk is low, problems may result if you terminate compression. What would you like to do?'
                }
            );

            if (choice > 0) {
                event.preventDefault()
            };
            if (choice === 1) {
                //Pause compression
                newWindow.webContents.executeJavaScript(`document.getElementById("pauseButton").dispatchEvent(new Event("click"))`)
            }
        }

    })

    newWindow.on('closed', function () {
        newWindow = null
    })
    return newWindow
}





//When the app is closed, and told to open a file, the ready event will be run, not the open-file event.
//Tried to fix, couldn't figure it out.
      app.on("open-file", (event, file) => {
        createWindow("handler.html", file)
        event.preventDefault();
      });

app.on('ready', function(event) {

    //Use the file viewer if we were passed a file.
    let openHandler;

        if (process.argv.length >= 2) {
            for (let i=1;i<process.argv.length;i++) {
                if (fs.existsSync(process.argv[i])) {
                    if (!fs.statSync(process.argv[i]).isDirectory()) {
                        openHandler = true
                        mainWindow = createWindow("handler.html", path.resolve(process.argv[i]))
                    }
                }
            }
        }

    if (openHandler) {} //Already handled above...
    else if (process.argv.includes("browser")) {
        mainWindow = createWindow("browser.html")
    }
    else {
        mainWindow = createWindow("index.html")
    }

    setDock()
})


app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        mainWindow = createWindow("index.html")
    }
})

app.on('browser-window-created',function(event,window) {
    window.setMenu(null);
});



function setDock() {
    let dockMenu = Menu.buildFromTemplate([
        {
            label: 'New Window',
            submenu: [
                {
                    label: 'Compressor' ,
                    click() {
                        createWindow("index.html")
                    }
                },
                {
                    label: 'File Viewer',
                    click() {
                        createWindow("handler.html")
                    }
                },
                {
                    label: 'Browser',
                    click() {
                        createWindow("browser.html")
                    }
                }
            ]
        }
    ])

    app.dock.setMenu(dockMenu)
}
