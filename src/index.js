const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

let mainWindow

function createWindow () {
    let display = electron.screen.getPrimaryDisplay()
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: Math.ceil(display.bounds.width/2), 
        height: display.bounds.height,
        icon: "assets/64x64.png"
    })

    mainWindow.loadURL('file://'+__dirname+'/index.html')
    mainWindow.webContents.openDevTools();
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