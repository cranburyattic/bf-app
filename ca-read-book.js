var fs = require('fs');
var betfair = require('./ca_betfair.js');
var utils = require('./ca-utils.js');
var csv = require('fast-csv')
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');
var reader = require('line-by-line');


function runApplication() {
  readBookTxt();
}

var iter = 0;
var openingOdds = new Map();

function readBookTxt() {
  var lr = new reader(config.betfair.data_dir + '/data/' + '2016-7-24'+ '/book-1.125765861.csv');

lr.on('error', function (err) {
	// 'err' contains error object
});

lr.on('line', function (line) {
  var result = JSON.parse(line);
  //console.log(result);
  var runners = result[0].result[0].runners;
  runners.forEach(function(runner) {

      console.log(runner);
      var backTotal =  runner.ex.availableToBack.slice(0,3).reduce(function(count, item) {
        count = count + item.size;
        // increment or initialize to 1
        return count;
      },0);
      var layTotal =  runner.ex.availableToLay.slice(0,3).reduce(function(count, item) {
        count = count + item.size;
        // increment or initialize to 1
        return count;
      },0);
      // this needs to run write each runner out into a separate file - and then graphed - but should only be interested in top 3 horses
      //if(runner.selectionId == 11412658) {
        //iter++;
        //if(iter % 3 == 0) {
          if(!openingOdds.has(runner.selectionId)) {
            console.log(runner.selectionId);
            openingOdds.set(runner.selectionId,runner.lastPriceTraded.toFixed(2));
            console.log(openingOdds.keys());
          }

          utils.writeToFile('book-1.125765861-' + runner.selectionId + '.csv', runner.lastPriceTraded.toFixed(2) + ',' + runner.totalMatched.toFixed(2) + ',' + backTotal.toFixed(2) + ',' + layTotal.toFixed(2));

          //console.log(/*runner.selectionId + ',' + */runner.lastPriceTraded.toFixed(2) + ',' + runner.totalMatched.toFixed(2) + ',' + backTotal.toFixed(2) + ',' + layTotal.toFixed(2));

        //}

      //}

  })
});

lr.on('end', function () {
  console.log(openingOdds.keys());
});
}

function generateDirectoryName() {
  var date = new Date();
  return date.getFullYear() + '-' + (date.getMonth() + 1)  + '-' + date.getDate();
}

runApplication()
