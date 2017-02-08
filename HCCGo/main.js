'use strict';

const {app, BrowserWindow, globalShortcut, Menu} = require('electron');
const {ipcMain} = require('electron');
const {autoUpdater} = require('electron');


let mainWindow = null;

require('electron-debug')({showDevTools: true});

app.on('ready', function() {

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        minWidth: 1200,
        minHeight: 800
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

        try {
            autoUpdater.setFeedURL('https://hccgo.herokuapp.com/update/'+platform+'/'+version);
        } catch(e) {
            console.log("Application is not signed, auto-updates will not work");
            console.log(e);
        }

        autoUpdater.on('error', function(error, msg) {
            console.log("Erorr is " + error);
            var arg = {err: error, msg: msg};
            mainWindow.webContents.send('updater-error', arg);
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

        ipcMain.on('updateRestart', function(event, arg) {
            autoUpdater.quitAndInstall();
        })

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
