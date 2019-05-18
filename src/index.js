const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const fs = require("fs")

let mainWindow




const { ipcMain } = require('electron')

let canclose = true;
ipcMain.on('asynchronous-message', function(event, value) {
    //Currently, this is only used to stop acciendenal closing of the window
    canclose = value
    event.returnValue = canclose
});


function createWindow (pagePath) {
    let display = electron.screen.getPrimaryDisplay()
    let newWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
			webviewTag: true
        },
        width: Math.ceil(display.bounds.width*0.8),
        height: Math.ceil(display.bounds.height*0.9)
    })



    	newWindow.loadURL('file://'+__dirname+'/'+pagePath)

    //See if we should ask the user before closing
    newWindow.on('close', function (event) {
        //Currently used to see if the window should be closed, or
        //if closing should be stopped due to compressingg in progress

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







//TODO: If passed multiple different files to open, open different files, not the same one multiple times.
app.on('ready', function() {
    //Use the file viewer if we were passed a file.
    let openHandler;

        if (process.argv.length >= 2) {
            for (let i=1;i<process.argv.length;i++) {
                if (fs.existsSync(process.argv[i])) {
                    if (!fs.statSync(process.argv[i]).isDirectory()) {
                        openHandler = true
                    }
                }
            }
        }


    if (process.argv.includes("browser")) {
        mainWindow = createWindow("browser.html")
    }
    else if (openHandler) {
        mainWindow = createWindow("handler.html")
    }
    else {
        mainWindow = createWindow("index.html")
    }
})

//macOS
  app.on("open-file", (event, file) => {
      process.argv.push(file)
    createWindow("handler.html")
    event.preventDefault();
  });


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
