#!/usr/bin/env node
const spawn = require('child_process').spawnSync;
const fs = require('fs');
const target = "1.4.3";

var rebuilder = "";
var brace = "";

if (process.platform == 'win32') {
    rebuilder = "electron-rebuild.cmd";
    brace = "\\";
} else {
    rebuilder = "electron-rebuild";
    brace = "/";
}

// nslog fixer
try {
    fs.unlinkSync(__dirname + brace + 'node_modules'
                  + brace + 'nslog' + brace + 'build' + brace 
                  + 'Release' + brace + 'nslog.node');
} catch (e) {
    console.log("nslog.node doesn't exist\n");
}

const ref = spawn(__dirname + brace + 'node_modules' + brace + '.bin' 
                  + brace + rebuilder,
                  ['--version='+target,'--log'],
		  { cwd: __dirname + brace + 'node_modules' + brace + 'ref',
		    env: process.env,
			shell: true });
console.log('ref output: ' + ref.output);
console.log('ref error: ' + ref.error);

const ffi = spawn(__dirname + brace + 'node_modules' + brace + '.bin' 
                  + brace +  rebuilder,
                  ['--version='+target,'--log'],
		  { cwd: __dirname + brace + 'node_modules' + brace + 'ffi',
		    env: process.env,
			shell: true });
console.log('ffi output: ' + ffi.output);
console.log('ffi error: ' + ffi.error);
