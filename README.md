# HCCGo

[![Build Status](https://travis-ci.org/unlhcc/HCCGo.svg?branch=master)](https://travis-ci.org/unlhcc/HCCGo)
[![Build status](https://ci.appveyor.com/api/projects/status/fgw8n9k22lp7xkdw/branch/master?svg=true)](https://ci.appveyor.com/project/djw8605/hccgo-668qn/branch/master)

A GUI application for submitting and managing jobs at the Holland Computing Center.

[Developer Documentation](https://unlhcc.github.io/hccgo-dev/)


## Tutorials

- [Writing Tutorials](tutorial-writing-tutorials.html)

## Setting up environment for running code
To setup your environment to run the code you'll need to first clone the repository, install 'npm', and install 'grunt-cli' globally with the command:
```bash
npm install -g grunt-cli
npm install -g bower
```

The command
```bash
npm install
bower install
npm --prefix ./HCCGo install HCCGo
```
will grab the packages needed to automate the running and building of HCCGo. The packages.json file here is only used for this purpose. The packages.json file located in the subdir of HCCGo is the actual file used to define the application.

At this point if you run just the 'grunt' command, the library should build properly, and you'll only need to run 'npm start' in the sub HCCGo dir to run the app. Using 'grunt run' will build the app and do the 'npm start' command for you.

To build the app and package for your system, simply run 
```bash
grunt <system-definition>
```

At the <system-definition> point, change to the package of your system. All options output to directory of same name in base directory. For instance:
```bash
packageWin - Use for a Windows system.

packageOsx - Use for a OSX system.

packageNix - Use for a Linux system.
```
