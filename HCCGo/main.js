'use strict';

const {app, BrowserWindow} = require('electron');
const {ipcMain} = require('electron');

let mainWindow = null;

require('electron-debug')({showDevTools: false});

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

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
		mainWindow.webContents.openDevTools();
    });
});
