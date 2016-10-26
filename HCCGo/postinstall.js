#!/usr/bin/env node
var exec = require('child_process').exec;

/*exec('npm rebiuld --runtime=electron --target=1.4.3 --disturl=https://atom.io/download/atom-shell',
    function(error,stdout,stderr){
    console.log(error);
	console.log(stdout);
	console.log(stderr);
    });
*/

exec(__dirname + '\\node_modules\\.bin\\electron-rebuild.cmd -w ffi',
    function(error,stdout,stderr){
    console.log(error);
	console.log(stdout);
	console.log(stderr);
    });

exec(__dirname + '\\node_modules\\.bin\\electron-rebuild.cmd -w ref',
    function(error,stdout,stderr){
    console.log(error);
	console.log(stdout);
	console.log(stderr);
    });