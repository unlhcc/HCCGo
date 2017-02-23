var electronInstaller = require('electron-winstaller');

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: 'packageWin/HCCGo-win32-x64',
    outputDirectory: 'installer64/',
    authors: 'Derek Weitzel',
    exe: 'HCCGo.exe'
  });

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));