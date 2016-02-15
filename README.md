# HCCGo
A GUI application for submitting and managing jobs at the Holland Computing Center

## Setting up environment for running code
To setup your environment to run the code you'll need to first clone the repository, install 'npm', and install 'grunt-cli' globally with the command:
```bash
npm install grunt-cli -g
```

Then go into the 'src' directory and run:
```bash
npm install
```

This command will read the packages.json file and install into the 'src' directory required dependencies for the app to run. Then you'll have to come back up into the root directory of HCCGo. Using npm install the following packages:
```bash
grunt
grunt-bower-task
grunt-contrib-less
grunt-node-webkit-builder
grunt-shell
```

For using grunt these packages are required inorder for the 'webkit' build to function properly. The last step is if you intend to use the 'grunt run' command. At this point if you run just the 'grunt' command, the library should build properly, and you'll only need to go into 'webkitbuilds/HCCGo' and find the folder that is closet to your system (for instance osx64 if you run a Mac machine). If you want to use 'grunt run' so the library builds and then the app immediately loads you'll need to edit Gruntfile.js in the section:
```bash
shell: {
  start_webkit: {
    command: 'open webkitbuilds/HCCGo/osx/HCCGo.app'
  }
},
```

Just edit the text after 'command' to load the proper file for your system and 'grunt run' will work fine!
