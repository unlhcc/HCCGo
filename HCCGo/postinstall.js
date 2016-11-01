#!/usr/bin/env node
const spawn = require('child_process').spawn;
const ref = spawn(__dirname + '\\node_modules\\.bin\\electron-rebuild.cmd',
                  ['-w', 'ffi', '--log'],
		  { cwd: __dirname,
		    env: process.env});
const ffi = spawn(__dirname + '\\node_modules\\.bin\\electron-rebuild.cmd',
                  ['-w', 'ref', '--log'],
		  { cwd: __dirname,
		    env: process.env});

ref.stdout.on('data', (data) => {
    console.log(`refout: ${data}`);
});

ref.stderr.on('data', (data) => {
    console.log(`referr: ${data}`);
});

ref.on('close', (code) => {
    if (code !== 0) {
        console.log(`ref rebuild exited with code ${code}`);
    }
});

ffi.stdout.on('data', (data) => {
    console.log(`ffiout: ${data}`);
});

ffi.stderr.on('data', (data) => {
    console.log(`ffierr: ${data}`);
});

ffi.on('close', (code) => {
    if (code !== 0) {
        console.log(`ffi rebuild exited with code ${code}`);
    }
});
