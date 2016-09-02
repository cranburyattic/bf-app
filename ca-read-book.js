var fs = require('fs');
var betfair = require('./ca-betfair.js');
var utils = require('./ca-utils.js');
var csv = require('fast-csv')
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');
var reader = require('line-by-line');
var processRunners = require('./ca-process-runners.js');


function runApplication() {
  readBookTxt();
}

var runnerArray = [];

function readBookTxt() {
  var lr = new reader(config.betfair.data_dir + '/data/' + '2016-9-1'+ '/book-1.126554080.txt');

  lr.on('error', function (err) {
    // 'err' contains error object
  });

  lr.on('line', function (line) {

    var data = JSON.parse(line);
    var runners = data[0].result[0].runners;
    console.log(data[0].result[0].lastMatchTime);
    var matchedDateSeconds = moment(data[0].result[0].lastMatchTime).unix();
    //console.log(runners);
    runners.slice().forEach(function(runner) {


      var message = matchedDateSeconds + ',' + runner.lastPriceTraded;
      dumpToFile('data/2016-9-1','prices-1.126554080-' + runner.selectionId + '.csv',message);
    });
    //  lastPriceTraded
    //r//unnerArray = processRunners(JSON.parse(line));


    // ...and continue emitting lines.
  });

  lr.on('end', function () {

  });
}

function dumpToFile(dir, filename, data) {

var rootDir = config.betfair.data_dir + '/' + dir;

if (!fs.existsSync(rootDir)) {
fs.mkdirSync(rootDir);
}
fs.appendFileSync(rootDir + '/' +  filename, data + '\n');
}

runApplication();
