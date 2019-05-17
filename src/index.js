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

function createWindow () {
    let display = electron.screen.getPrimaryDisplay()
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
			webviewTag: true
        },
        width: Math.ceil(display.bounds.width*0.8), 
        height: Math.ceil(display.bounds.height*0.9)
    })

	
	
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
		mainWindow.loadURL('file://'+__dirname+'/browser.html')	
	}
	else if (openHandler) {
		mainWindow.loadURL('file://'+__dirname+'/handler.html')	
	}
	else {
    	mainWindow.loadURL('file://'+__dirname+'/index.html')
	}

    //See if we should ask the user before closing
    mainWindow.on('close', function (event) {
        //Currently used to see if the window should be closed, or
        //if closing should be stopped due to compressingg in progress

        if (canclose === false) {
            let choice = electron.dialog.showMessageBox(
                mainWindow,
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
                mainWindow.webContents.executeJavaScript(`document.getElementById("pauseButton").dispatchEvent(new Event("click"))`)
            }
        }

    })

    mainWindow.on('closed', function () {
        mainWindow = null
    })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})

app.on('browser-window-created',function(event,window) {
    window.setMenu(null);
});



