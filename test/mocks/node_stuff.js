
/*
process = {}
process.env = {}
process.platform = 'darwin';
process.env.HOME = "/home/derek"

path = {}
path.join = function() {
  new_array = [];
  for (var i = 0; i < arguments.length; i++) {
    new_array.push(arguments[i]);
  }
  return new_array.join('/');
};

mockLocation = {};
new_location = "";
mockLocation.path = function(location) {
  new_location = location;
}


ipcRenderer = function(msg, func) {
  console.log("msg: " + msg);
};
electron = {'ipcRenderer':ipcRenderer};

require = function(packageName) {
  switch(packageName) {
    case "path":
      return path;
      break;
    case "electron":
      return electron;
      break;
    case "async":
      return async;
      break;
  }
}


*/