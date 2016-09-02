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

var root = config.betfair.data_dir + '/data/2016-9-1/';
// GET TODAY'S races
function getTodaysBets() {

  var content = fs.readFileSync(config.betfair.data_dir + '/data/2016-9-1/events.json');
  var data = JSON.parse(content);
  var marketDetails = JSON.stringify(data[0].result[0])

  data[0].result.forEach(item => {
    item.runners.forEach(runner => {
      var message = item.event.venue + ' - ' + item.marketStartTime.substring(11,16) + ' - ' + runner.runnerName;
      //console.log(message);
      dumpToFile('data/2016-9-1','info-' + item.marketId + '-' + runner.selectionId + '.csv',message);
    });
  });

  //console.log('marketId,selectionId,placedDate,placedDateSeconds,matchDate,matchedDateSeconds,backPriceRequested,layPriceRequested,priceMatched,back,lay,profit,type');
	betfair.getDailyBets(handleResult);
}

function dumpToFile(dir, filename, data) {

    var rootDir = config.betfair.data_dir + '/' + dir;

    if (!fs.existsSync(rootDir)) {
        fs.mkdirSync(rootDir);
    }
    fs.appendFileSync(rootDir + '/' +  filename, data + '\n');
}

function handleResult(data) {
  var processed = [];

  data[0].result.clearedOrders.map(bet => {
    var placedDateSeconds = moment(bet.placedDate).unix();
    var matchedDateSeconds = moment(bet.lastMatchedDate).unix();
    //console.log(bet.lastMatchedDate + " " + matchedDateSeconds);
    var lay = '';
    var back = '';
    var backPriceRequest = '';
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
    //console.log(processed);
    //console.log(processed.indexOf(key));
    if(processed.indexOf(key) == -1 ) {
      dumpToFile('data/2016-9-1','bets-' + bet.marketId + '-' + bet.selectionId + '.csv', header);
      readBookTxt(bet.marketId);
      processed.push(key);
    }

    var message = bet.marketId + ',' + bet.selectionId + ',' +  bet.placedDate + ',' + placedDateSeconds + ',' +
    bet.lastMatchedDate + ',' + matchedDateSeconds + ',' + backPriceRequested + ',' + layPriceRequested
    + ',' + bet.priceMatched  + ',' + back + ',' + lay + ',' + bet.profit + ',' + bet.side;
    dumpToFile('data/2016-9-1','bets-' + bet.marketId + '-' + bet.selectionId + '.csv', message);
  });
  dumpToFile('data/2016-9-1','processed.txt',processed);
}

var runnerArray = [];

function readBookTxt(marketId) {

  //console.log(marketId);
  console.log('Processing ' + marketId);
  var lr = new reader(config.betfair.data_dir + '/data/' + '2016-9-1'+ '/book-' + marketId  + '.txt');

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
      dumpToFile('data/2016-9-1','prices-' + marketId + '-' + runner.selectionId + '.csv',message);
    });
  });

  lr.on('end', function () {
      console.log('Finished ' + marketId);
  });
}

runApplication();
