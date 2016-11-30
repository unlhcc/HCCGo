# HCCGo
A GUI application for submitting and managing jobs at the Holland Computing Center

## Setting up environment for running code
To setup your environment to run the code you'll need to first clone the repository, install 'npm', and install 'grunt-cli' globally with the command:
```bash
npm install grunt-cli -g
```

The command
```bash
npm install
```
will grab the packages needed to automate the running and building of HCCGo. The packages.json file here is only used for this purpose. The packages.json file located in the subdir of HCCGo is the actual file used to define the application.

At this point if you run just the 'grunt' command, the library should build properly, and you'll only need to run 'npm start' in the sub HCCGo dir to run the app. Using 'grunt run' will build the app and do the 'npm start' command for you.

To build the app and package for your system, simpy run 
```bash
grunt <system-definition>
```

At the <system-definition> point, change to the package of your system. All options output to directory of same name in base directory. For instance:
```bash
packageWin - Use for a Windows system.

packageOsx - Use for a OSX system.

packageNix - Use for a Linux system.
```
