var fs = require('fs');
var betfair = require('./ca_betfair.js');
var utils = require('./ca-utils.js');
var csv = require('fast-csv')
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');

var marketTimers = new Map();
var marketStartTimes = new Map();
var marketData = new Map();

var stream = fs.createReadStream(config.betfair.data_dir + '/data/' + generateDirectoryName() + '/markets.csv');
//var stream = fs.createReadStream(config.betfair.data_dir + '/data/' + '2016-8-7' + '/markets.csv');

function runApplication() {
  console.log('Running ' + new Date());
  betfair.login(setUpTimeouts);
}
// handle CTRL-C if want to quit application
// This will force a logoff
process.on('SIGINT', function() {
  //console.log('Got SIGINT');
  logout();

});
// logoff from betfair
function logout() {
    betfair.logout(quit);
}
function quit() {
  console.log('Finished ' + new Date());
  process.exit(0);
}

function setUpTimeouts() {
utils.writeToFileAddDay('matched.csv','course,marketName,marketId,startTime,totalMatched');
var csvStream = csv
    .parse({headers : true})
    .on("data", function(data) {
        marketStartTimes.set(data.marketId,moment(data.marketStartTime));
        var marketInfo = data.course  + ',' + data.marketName;
        marketData.set(data.marketId,marketInfo);
        setMarketTimeout(data.marketStartTime, data.marketId);
    })
    .on("end", function(){
         console.log("Timeouts setup");
    });
stream.pipe(csvStream);
}

function processMarket(market) {
  betfair.getMarketBook(market, handleData);
}

function handleData(data)   {
//console.log(data);
  var marketId = data[0].result[0].marketId;
  //utils.writeToFileJson('book-' + marketId + '.txt',data);
  var status = data[0].result[0].status;
  if(moment().isAfter(marketStartTimes.get(marketId))) {
    var message = marketData.get(marketId) + ',' + marketId + ',' + moment(marketStartTimes.get(marketId)).format() + ',' + data[0].result[0].totalMatched;
    utils.writeToFileAddDay('matched.csv',message)
    console.log('Closed ' + marketId)
    clearTimeout(marketTimers.get(marketId));
    marketStartTimes.delete(marketId);
    if(marketStartTimes.size == 0) {
        console.log('No markets left - Logging off');
        logout();
    }
  }
}

function generateDirectoryName() {
  var date = new Date();
  return date.getFullYear() + '-' + (date.getMonth() + 1)  + '-' + date.getDate();
}

function setMarketTimeout(marketStartTime,market) {
  console.log('Register ' +  market);
  var now = moment();
  var startTime = moment(marketStartTime).subtract(6,'minutes');
  var length = startTime.diff(moment());
  setTimeout(function(){ setMarketInterval(market) },length);
}

function setMarketInterval(market) {
  console.log('Active ' + market + " - " + marketStartTimes.get(market).format());
  var timer = setInterval( function(){ processMarket(market) },1000);
  marketTimers.set(market,timer);
}

runApplication()
