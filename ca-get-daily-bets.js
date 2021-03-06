/*
The Main Application
*/

// import required modules
var fs = require('fs');
var betfair  = require('./ca-betfair.js');
var utils = require('./ca-utils.js');
var moment = require('moment');
var reader = require('line-by-line');

var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');

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
  betfair.login(getTodaysBets);
}

// logoff from betfair
function logout() {
    betfair.logout(quit);
}

var root = config.betfair.data_dir + '/data/' + utils.generateDirectoryName() + '/';
var osx_root = config.betfair.osx_data_dir + '/data/' + utils.generateDirectoryName() + '/';


var runnerNames = {};
// GET TODAY'S races
function getTodaysBets() {

  var content = fs.readFileSync(root + 'events.json');
  var data = JSON.parse(content);
  var marketDetails = JSON.stringify(data[0].result[0])
  utils.writeToFileWithSubDir('charts','temp.txt','Charts');
  data[0].result.forEach(item => {
    item.runners.forEach(runner => {
      runnerNames[runner.selectionId] = runner.runnerName;
      var message = item.event.venue + ' - ' + item.marketStartTime.substring(11,16) + ' - ' + runner.runnerName;
      utils.writeToFileWithSubDir('info','info-' + item.marketId + '-' + runner.selectionId + '.csv',message);
    });
  });
	betfair.getDailyBets(handleResult);
}

function handleResult(data) {
  var processed = [];
  var headerAllBets = 'selectionId,horseName,profit';
  utils.writeToFile('all-bets.csv', headerAllBets);

  data[0].result.clearedOrders.map(bet => {
    var placedDateSeconds = moment(bet.placedDate).unix();
    var matchedDateSeconds = moment(bet.lastMatchedDate).unix();
    var lay = '';
    var back = '';
    var backPriceRequested = '';
    var layPriceRequested = '';
    if(bet.side === 'LAY') {
      lay = bet.sizeSettled;
      layPriceRequested = bet.priceRequested;
    } else if(bet.side === 'BACK') {
      back = bet.sizeSettled;
      backPriceRequested = bet.priceRequested;
    }

    var header = 'marketId,selectionId,placedDate,placedDateSeconds,matchDate,matchedDateSeconds,backPriceRequested,layPriceRequested,priceMatched,back,lay,profit,type';
    var key = bet.marketId + '-' + bet.selectionId;
    if(processed.indexOf(key) == -1 ) {
      utils.writeToFileWithSubDir('bets','bets-' + bet.marketId + '-' + bet.selectionId + '.csv', header);
      readBookTxt(bet.marketId);
      processed.push(key);
    }

    var messageAllBets = bet.selectionId + ',' + runnerNames[bet.selectionId] + ',' + bet.profit;
    utils.writeToFile('all-bets.csv', messageAllBets);

    var message = bet.marketId + ',' + bet.selectionId + ',' +  bet.placedDate + ',' + placedDateSeconds + ',' +
    bet.lastMatchedDate + ',' + matchedDateSeconds + ',' + backPriceRequested + ',' + layPriceRequested
    + ',' + bet.priceMatched  + ',' + back + ',' + lay + ',' + bet.profit + ',' + bet.side;
    utils.writeToFileWithSubDir('bets','bets-' + bet.marketId + '-' + bet.selectionId + '.csv', message);
  });
  utils.writeToFile('processed.txt',processed);
}

var runnerArray = [];

function readBookTxt(marketId) {

  //console.log(marketId);
  console.log('Processing ' + marketId);
  var lr = new reader(osx_root + 'book-' + marketId  + '.txt');

  lr.on('error', function (err) {
    console.log('Unable to find ' + marketId);
  });

  lr.on('line', function (line) {

    var data = JSON.parse(line);
    //console.log(data);
    var runners = data[0].result[0].runners;
    //console.log(data[0].result[0].lastMatchTime);
    var matchedDateSeconds = moment(data[0].result[0].lastMatchTime).unix();
    //console.log(runners);
    runners.slice().forEach(function(runner) {
      var message = matchedDateSeconds + ',' + runner.lastPriceTraded;
      utils.writeToFileWithSubDir('prices','prices-' + marketId + '-' + runner.selectionId + '.csv',message);
    });
  });

  lr.on('end', function () {
      console.log('Finished ' + marketId);
  });
}

runApplication();
