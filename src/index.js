const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

let mainWindow

//Raise JavaScript Memory Limit to 2GB
//app.commandLine.appendSwitch('js-flags', '--max-old-space-size=2048');

function createWindow () {
    let display = electron.screen.getPrimaryDisplay()
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: display.bounds.width, 
        height: display.bounds.height,
        icon: "../assets/64x64.png",
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