var fs = require('fs');
var betfair = require('./ca-betfair.js');
var utils = require('./ca-utils.js');
var csv = require('fast-csv')
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');
var processRunners = require('./ca-process-runners.js');
var reader = require('line-by-line');

var root = config.betfair.data_dir + '/data/2016-9-3/';

var runnerNames = {};

function runApplication() {
  generateRunnerNames();
  readBookTxt();
}

function readBookTxt() {
  //insights-chart-1.126573666-295498
  var lr = new reader(config.betfair.data_dir + '/data/2016-9-3/book-1.126573666.txt');

  lr.on('error', function (err) {
    // 'err' contains error object
  });

  lr.on('line', function (line) {

    var data = JSON.parse(line);
    var processedRunners = processRunners(runnerNames,data);

      // pause emitting of lines...
      	lr.pause();

      	// ...do your asynchronous line processing..
      	setTimeout(function () {
          var output = {
            race : {
              id : '111',
              timeRemaining : '100',
              course : 'blah',
              totalMatched : 0,
              totalAvailable : 0,
              distance : '1m',
              startTime: 'now'
            }};

            output.runners = processedRunners;
            fs.writeFileSync('/Users/phirow/aaa.txt',JSON.stringify(output));
      		lr.resume();
      	}, 200);
  });

  lr.on('end', function () {
    var output =
    { race:
      {
        id : 111,
        course : 'Waiting',
        startTime : 'For',
        distance : 'Race',
        timeRemaining : 0,
        totalMatched : 0,
        totalAvailable : 0,
        lastPriceTraded : 0,
        previousLastPriceTraded : 0
      },
      runners: []
    }
    fs.writeFileSync('/Users/phirow/aaa.txt',JSON.stringify(output));
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
