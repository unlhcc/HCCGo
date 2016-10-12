'use strict';

const {app, BrowserWindow} = require('electron');
const {ipcMain} = require('electron');

let mainWindow = null;
let modalWindow = null;

require('electron-debug')({showDevTools: false});

app.on('ready', function() {

    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        show: false
    });

    modalWindow = new BrowserWindow({
        parent: mainWindow,
        modal: true,
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

    modalWindow.on('closed', function() {
        modalWindow = null;
    });

    mainWindow.loadURL('file://' + __dirname + '/app/index.html');
    modalWindow.loadURL('file://' + __dirname + '/app/welcomeModal.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        modalWindow.show();
    });
/*
    modalWindow.once('ready-to-show', () => {
        modalWindow.show();
    });*/
});
