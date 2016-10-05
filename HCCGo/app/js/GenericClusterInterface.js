

/**
  * Generic interface for clusters.  Should be classed
  * Javascript Object Inheritance, FTW!
  *
  */

var GenericClusterInterface = function(connectionService, $q) {
  this.$q = $q;
  this.connectionService = connectionService;
}

GenericClusterInterface.prototype.getJobs = function() {

  // return a promise if the jobs info are found

}

function CSVToArray( strData, strDelimiter ){
  strDelimiter = (strDelimiter || ",");
  var objPattern = new RegExp(
    (
        // Delimiters.
        "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
        // Quoted fields.
        "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
        // Standard fields.
        "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),
    "gi"
  );
  var arrData = [[]];
  var arrMatches = null;
  while (arrMatches = objPattern.exec( strData )){
    var strMatchedDelimiter = arrMatches[ 1 ];
    if (
        strMatchedDelimiter.length &&
        strMatchedDelimiter !== strDelimiter
        ){
        arrData.push( [] );
    }
    var strMatchedValue;
    if (arrMatches[ 2 ]){
        strMatchedValue = arrMatches[ 2 ].replace(
            new RegExp( "\"\"", "g" ),
            "\""
            );

    } else {
        strMatchedValue = arrMatches[ 3 ];
    }
    arrData[ arrData.length - 1 ].push( strMatchedValue );
  }
  return( arrData );
}

GenericClusterInterface.prototype.getCompletedJobs = function(docs) {
  var deferred = this.$q.defer();
  var completedJobs = [];
  for(var i = 0; i < docs.length; i++) {
    // setup return document
    var returnData = {
      "_id": docs[i]._id
    }
    this.connectionService.runCommand("sacct -j " + docs[i].jobId + " -l --noconvert -P").then(function(data) {
      // parse data and make list of docs to update the db with
      var parsedData = CSVToArray(data, '|');
      var headers = parsedData[0];
      var jobData = parsedData[1];
      var batchData = parsedData[2];
      var desiredFields = [
        "Elapsed",
        "ReqMem",
        "State",
        "JobName"
      ]
      // loop through headers to get the indices of the desired fields
      for(var j = 0; j < headers.length; j++) {
        var index = desiredFields.indexOf(headers[j]);
        if(index > -1) {
          if(headers[j] == "JobName")
            returnData[desiredFields[index]] = jobData[j];
          else
            returnData[desiredFields[index]] = batchData[j];
        }
      }
      if(returnData.State != "COMPLETED") returnData = {}

      completedJobs.push(returnData);
      if(i==docs.length)
        deferred.resolve(completedJobs);
    });
  }
  return deferred.promise;
}

GenericClusterInterface.prototype.getStorageInfo = function() {

  // Return a promise if the storage info
  var storagePromise = this.$q.defer();
  var connectionService = this.connectionService;

  this.connectionService.runCommand("quota -w -f /home").then(function(data) {

    // Split the output
    reported_output = data.split("\n")[2];

    var returnData = [];

    work = {
      name: "Work",
      blocksUsed: 0,
      blocksQuota: 0,
      blocksLimit: 0,
      filesUsed: 0,
      filesQuota: 0,
      filesLimit: 0
    }

    home = {
      name: "Home",
      blocksUsed: 0,
      blocksQuota: 0,
      blocksLimit: 0,
      filesUsed: 0,
      filesQuota: 0,
      filesLimit: 0
    }

    split_output = reported_output.split(/[ ]+/);
    function KilobytestoGigabytes(kbytes) {
      return parseInt(kbytes) / Math.pow(1024, 2);
    }

    home.blocksUsed = KilobytestoGigabytes(split_output[1]);
    home.blocksQuota = KilobytestoGigabytes(split_output[2]);
    home.blocksLimit = KilobytestoGigabytes(split_output[3]);
    returnData.push(home);

    connectionService.runCommand("lfs quota -g `id -g` /work").then(function(data) {
      // Split the output
      reported_output = data.split("\n")[2];

      split_output = $.trim(reported_output).split(/[ ]+/);

      work.blocksUsed = KilobytestoGigabytes(split_output[1]);
      work.blocksQuota = KilobytestoGigabytes(split_output[2]);
      work.blocksLimit = KilobytestoGigabytes(split_output[3]);
      returnData.push(work);

      storagePromise.resolve(returnData);

    });




  });


  return storagePromise.promise;
}
