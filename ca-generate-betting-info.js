var fs = require('fs');
var betfair = require('./ca-betfair.js');
var utils = require('./ca-utils.js');
var csv = require('fast-csv')
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');
var processRunners = require('./ca-process-runners.js');
var reader = require('line-by-line');

if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " DATE YYYY-M-D");
    process.exit(-1);
}
var date = process.argv[2];
var root = config.betfair.data_dir + '/data/' + date + '/';

var runnerNames = {};

function runApplication() {
  generateRunnerNames();
  generateData();
}


function generateData() {

  var content = fs.readFileSync(root + 'processed.txt','UTF-8');
  var files = content.split(',');

  marketIds = [];
  files.forEach(file => {
    var marketId = file.split('-')[0];
    if(marketIds.indexOf(marketId) == -1 ) {
      marketIds.push(marketId);
    }
  });

  marketIds.forEach(marketId => {
    readBookTxt(date, marketId);
  });

}

function readBookTxt(date, filename) {
  var lr = new reader(config.betfair.data_dir + '/data/' + date + '/book-' + filename + '.txt');

  lr.on('error', function (err) {
    // 'err' contains error object
  });

  lr.on('line', function (line) {

    var data = JSON.parse(line);
    var processedRunners = processRunners(runnerNames,data);
    processedRunners.forEach(pr => {
      var header  = 'marketId,selectionId,name,lastMatchTimeSeconds,backTotal,layTotal,backTotal15,layTotal15,backValue,layValue,lastPriceTraded,timeKey';
      var fileToWrite = 'insights-' + filename + '-' + pr.selectionId + '.csv'
      utils.writeToFileWithSubDirWithAppend('insights',fileToWrite,header,false);
      var message = filename + ','+ pr.selectionId + ',' + pr.name + ',' +  pr.lastMatchTimeSeconds + ',' +
      pr.backTotal + ',' + pr.layTotal + ',' + pr.backTotal15 + ',' +
      pr.layTotal15 + ',' + pr.backValue + ',' + pr.layValue  + ',' + pr.lastPriceTraded + ',' + pr.timeKey;
      utils.writeToFileWithSubDir('insights',fileToWrite,message);
    });
  });

  lr.on('end', function () {

  });
}

function generateRunnerNames() {

  var content = fs.readFileSync(root + 'events.json');
  var data = JSON.parse(content);
  var marketDetails = JSON.stringify(data[0].result[0])
  data[0].result.forEach(item => {
    item.runners.forEach(runner => {
      runnerNames[runner.selectionId] = runner.runnerName;
    });
  });
}
runApplication();

// select a date and

// read in processed.txt

// for each runner generate the bet info

// combine with price info in python
