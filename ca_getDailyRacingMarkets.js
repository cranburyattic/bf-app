/*
The Main Application
*/

// import required modules
var fs = require('fs');
var betfair  = require('./ca_betfair.js');
var moment = require('moment');

var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');


// handle CTRL-C if want to quit application
// This will force a logoff
process.on('SIGINT', function() {
  //console.log('Got SIGINT');
  logout();

});

function quit() {
  console.error('Finished!!');
  process.exit(0);
}

function runApplication() {
  betfair.login(getTodaysRaces);
}

// logoff from betfair
function logout() {
    betfair.logout(quit);
}

function dumpToFile(dir, filename, data) {

  var rootDir = config.betfair.data_dir + '/' + dir;
  console.log(rootDir);

	if(!fs.existsSync(rootDir)) {
   		fs.mkdirSync(rootDir);
	} else {
    	//console.error('Directory Exists');
	}

	fs.appendFileSync(rootDir + "/" +  filename, data + "\n")

}

// GET TODAY'S races
function getTodaysRaces() {
	betfair.getTodaysRaces(getRacingMarketsForEvents);
}

// callback function
function getEventId(item) {
  return item.event.id;
}

function getRacingMarketsForEvents(data) {
  var mapped = data[0].result.map(getEventId);
  var ids = '"' + mapped.join('","') + '"';
  betfair.getRacingMarketsForEvents(ids,log)  ;
}

function log(data) {
  // log the column headers
  writeToFile('course|marketName|marketId|marketStartTime|distance');
  data[0].result.forEach(outputPSVData);
  // logout
  logout();
}

function writeToFile(data) {
  console.log(data);
  dumpToFile('data/' + generateDirectoryName(),'markets.csv',data);
}

function outputPSVData(item) {
    var marketStartTime = moment(new Date(item.marketStartTime));
    //var marketStartTimeMinus10 = moment(new Date(item.marketStartTime)).subtract(10,'m');
    var s = item.event.venue + "|" + item.marketName + "|" + item.marketId + "|" + marketStartTime.format() + "|" + calculateRaceLength(item.marketName);
    writeToFile(s);
}

function generateDirectoryName() {
  var date = new Date();
  return date.getFullYear() + '-' + (date.getMonth() + 1)  + '-' + date.getDate();
}

function calculateRaceLength(marketName) {
    var array = marketName.split(" ");
    var raceLength = array[0];
    switch (raceLength.length) {
      case 2:
        var val = raceLength.charAt(1) == 'f' ? parseInt(raceLength.charAt(0)) : parseInt(raceLength.charAt(0)) * 8;
        return val;
        break;
      case 4:
        return parseInt(raceLength.charAt(0)) * 8 + parseInt(raceLength.charAt(2));
        break
      default:
        return 0;

    }
}

runApplication();
