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




handleSquirrelEvent() //Will return false if it isn't an electron-squirrel event

//Windows electron-squirrel-startup
//https://stackoverflow.com/questions/38000403/electron-app-installed-but-doesnt-appear-in-start-menu
function handleSquirrelEvent() {
    if (process.argv.length === 1) {
        return false;
    }

    if (require('electron-squirrel-startup')) return;

    
  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};