#!/usr/bin/env node
var exec = require('child_process').exec;

exec('./node_modules/.bin/electron-rebuild -w ffi',
    function(error,stdout,stderr){
    
    });

exec('./node_modules/.bin/electron-rebuild -w ref',
    function(error,stdout,stderr){
    
    });
