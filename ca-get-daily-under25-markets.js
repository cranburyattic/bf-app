/*
Get the Under 2.5 goals football markets for the day
*/

// import required modules
var fs = require('fs');
var betfair  = require('./ca_betfair.js');
var utils = require('./ca-utils.js');
var moment = require('moment');

var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');

var OUTPUT_FILE = 'under-over-25.csv';

// handle CTRL-C if want to quit application
// This will force a logoff
process.on('SIGINT', function() {
  //console.log('Got SIGINT');
  logout();

});

function quit() {
  console.log('Finished ' + new Date());
  process.exit(0);
}

function runApplication() {
  console.log('Running ' + new Date());
  betfair.login(getTodaysUnderOver25);
}

// logoff from betfair
function logout() {
    betfair.logout(quit);
}

function getTodaysUnderOver25() {
	betfair.getUnderOver25(processResult);
}

function processResult(data) {
  utils.writeToFileJson('under-over-25.json', data);
  utils.writeToFile(OUTPUT_FILE,'eventName,marketId,marketStartTime');

  data[0].result.forEach(function(item) { var marketStartTime = moment(new Date(item.marketStartTime));
                                            utils.writeToFile(OUTPUT_FILE,item.event.name + "," + item.marketId + "," + marketStartTime.format() )});
  logout;
}

function generateDirectoryName() {
  var date = new Date();
  return date.getFullYear() + '-' + (date.getMonth() + 1)  + '-' + date.getDate();
}

runApplication();
