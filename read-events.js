var fs = require('fs');
var betfair = require('./ca-betfair.js');
var utils = require('./ca-utils.js');
var csv = require('fast-csv')
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');
var io = require('socket.io')(1881);
var processRunners = require('./ca-process-runners.js');

var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: 8080 , path: '/ws/race1' });



var marketTimers = new Map();
var marketStartTimes = new Map();
var marketData = new Map();
var currentlyProcessedMarket;

var marketNames = new Map();
var runnerNames = new Map();


var content = fs.readFileSync('events.json');
var data = JSON.parse(content);
var marketDetails = JSON.stringify(data[0].result[0])

data[0].result.forEach(item => {
  var details = {};
  details.marketId = item.marketId;
  details.venue = item.event.venue;
  details.marketName = item.marketName;
  details.startTime = item.marketStartTime;
  marketNames.set(item.marketId,details);
  //console.log(item.event.venue + ' ' + item.marketName + ' ' + item.marketStartTime)
  item.runners.forEach(runner => {
    runnerNames.set(runner.selectionId,runner.runnerName);
  });
});

console.log(marketNames);
console.log(runnerNames);
