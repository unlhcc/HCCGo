'use strict';

const {app, BrowserWindow} = require('electron');

let mainWindow = null;

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        width: 1000,
	height: 800
    });

    mainWindow.loadUrl('file://' + __dirname + '/app/index.html');
});
