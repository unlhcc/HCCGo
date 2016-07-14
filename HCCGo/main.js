'use strict';

const {app, BrowserWindow} = require('electron');

let mainWindow = null;
require('electron-debug')({showDevTools: false});

app.on('ready', function() {

    mainWindow = new BrowserWindow({
        width: 1000,
	height: 800
    });

    mainWindow.on('closed', function() {
        mainWindow = null;
	app.quit();
    });
    mainWindow.loadURL('file://' + __dirname + '/app/index.html');
});
