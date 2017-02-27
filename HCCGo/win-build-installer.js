var electronInstaller = require('electron-winstaller');

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: '../packageWin/HCCGo-win32-x64',
    outputDirectory: '../installer64/',
    authors: 'Derek Weitzel',
    exe: 'HCCGo.exe',
    loadingGif: 'icons/HCCGoGIF.gif',
    setupIcon: 'icons/HCCGo.ico',
    iconUrl: 'https://raw.githubusercontent.com/unlhcc/HCCGo/master/HCCGo/icons/HCCGo.ico',
    setupExe: 'HCCGo-Installer.exe',
    noMsi: true
  });

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));
