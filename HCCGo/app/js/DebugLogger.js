

function DebugLogger(logLocation) {
  
  this.logLocation = logLocation;
};

DebugLogger.prototype.do_log = function(message, type) {
  // Append to the debug log
  
  // Get the debuglog
  formatted = $('<div></div>')
  
  if (type == 'normal')
    formatted.addClass('normal');
  else if (type == 'warning')
    formatted.addClass('warning');
  else if (type == 'error')
    formatted.addClass('error');
  else
    formatted.addClass('normal');
    
  formatted.text(message);
    
  this.logLocation.append(formatted);
  this.logLocation[0].scrollTop = this.logLocation[0].scrollHeight;
  console.log(message);
};


DebugLogger.prototype.error = function(message) {
  this.do_log(message, 'error');
};

DebugLogger.prototype.warning = function(message) {
  this.do_log(message, 'warning');
};

DebugLogger.prototype.log = function(message) {
  this.do_log(message, 'normal');
};
