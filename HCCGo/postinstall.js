#!/usr/bin/env node
const spawn = require('child_process').spawnSync;
const fs = require('fs');
const target = "1.4.3";
const path = require('path');

var rebuilder = "";

if (process.platform == 'win32') {
    rebuilder = "electron-rebuild.cmd";
} else {
    rebuilder = "electron-rebuild";
}

// nslog fixer
try {
    fs.unlinkSync(path.join(__dirname, 'node_modules', 'nslog', 'build',
                            'Release', 'nslog.node'));
} catch (e) {
    console.log("nslog.node doesn't exist\n");
}

const disk = spawn(path.join(__dirname, 'node_modules', '.bin', rebuilder),
                  ['--version='+target,'--log'],
		  { cwd: path.join(__dirname ,'node_modules' ,'diskusage'),
		    env: process.env,
			shell: true });
console.log('disk output: ' + disk.output);
console.log('disk error: ' + disk.error);
