'use strict';

const {app, BrowserWindow, globalShortcut, Menu} = require('electron');
const {ipcMain} = require('electron');
const {autoUpdater} = require('electron');


let mainWindow = null;

require('electron-debug')({showDevTools: true});

app.on('ready', function() {

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        show: false
    });

	ipcMain.on('focus-check-reply', (event, arg) => {
	    console.log("Checking if app has focus");
		event.sender.send('focus-check-message', mainWindow.isFocused());
	});

    mainWindow.on('closed', function() {
        mainWindow = null;
        app.quit();
    });

    mainWindow.loadURL('file://' + __dirname + '/app/index.html');
	
    globalShortcut.register('Alt+F12', () => {
        mainWindow.webContents.openDevTools();
    });
	
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Check for updates!
        var os = require('os');

        var platform = os.platform() + '_' + os.arch();
        var version = app.getVersion();

        autoUpdater.setFeedURL('https://hccgo.herokuapp.com/update/'+platform+'/'+version);
        
        autoUpdater.on('error', function(error) {
            console.log("Erorr is " + error);
            mainWindow.webContents.send('updater-error', error);
        });
        
        autoUpdater.on('checking-for-update', function() {
            mainWindow.webContents.send('checking-for-update', null);
        });

        
        autoUpdater.on('update-available', function() {
            mainWindow.webContents.send('update-available');
        });
        
        autoUpdater.on('update-not-available', function() {
            mainWindow.webContents.send('update-not-available');
        });
        
        autoUpdater.on('update-downloaded', function(event, releaseNotes, releaseName, releaseDate, updateURL) {
            mainWindow.webContents.send('update-downloaded', {releaseNotes: releaseNotes, releaseName: releaseName, releaseDate: releaseDate, updateURL: updateURL});
        });
        
        autoUpdater.checkForUpdates()
        
    });
    

    var template = [{
        label: "Edit",
        submenu: [
            { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:", role: 'undo' },
            { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:", role: 'redo' },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:", role: "cut" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:", role: "copy" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:", role: "paste" },
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:", role: "selectall" }
        ]}, {
            label: 'View',
            submenu: [
          {
            label: "Reload",
            role: 'reload'
          },
          {
            label: "Open Dev Tools",
            role: 'toggledevtools',
            click: function() {
                mainWindow.webContents.openDevTools();
            }
          },
          {
            type: 'separator'
          },
          {
            role: 'resetzoom'
          },
          {
            role: 'zoomin'
          },
          {
            role: 'zoomout'
          },
          {
            type: 'separator'
          },
          {
            role: 'togglefullscreen'
          }
      ]}, {
          role: 'window',
          submenu: [
            {
              role: 'minimize'
            },
            {
              role: 'close'
            }
          ]
        },
        {
          role: 'help',
          submenu: [
            {
              label: 'Learn More',
              click () { require('electron').shell.openExternal('http://electron.atom.io') }
            }
          ]
        }
    ];

    if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          role: 'about'
        },
        { 
          label: "Check for Updates", click: function() {
          autoUpdater.checkForUpdates();
        }},
        {
          type: 'separator'
        },
        {
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    });
    // Edit menu.
    template[1].submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'Speech',
        submenu: [
          {
            role: 'startspeaking'
          },
          {
            role: 'stopspeaking'
          }
        ]
      }
    )
    // Window menu.
    template[3].submenu = [
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
      },
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
      {
        label: 'Zoom',
        role: 'zoom'
      },
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        role: 'front'
      }
    ]
    }


    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    
    // Auto-update
    
    

    
});
