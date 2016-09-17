var fs = require('fs');
var betfair = require('./ca-betfair.js');
var utils = require('./ca-utils.js');
var csv = require('fast-csv')
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');
var processRunners = require('./modules/ca-process-runners.js');
var server = require('http').createServer();
var store = require('./modules/ca-store.js');
var processRunners = require('./modules/ca-process-runners.js');
var eventInformation = require('./modules/ca-event-information.js');

var appstore =  store();

var marketToRun = process.argv[2];
console.log(marketToRun + ' ' + process.argv.slice(2));

var websocketMap = {}
var websockets = [];
// web socket section
var WebSocketServer = require('ws').Server
//, ws1 = new WebSocketServer({ server , path: '/ws/race1' })
for(var i = 1; i < 4; i++) {
  wss = new WebSocketServer({ server , path: '/ws/race' + i })
  wss.on('connection', function connection(ws) {
    console.log('Connection to wsrace');
    ws.addEventListener("close", function(event) {
      websocketMap = {}
    });
    websockets.push(ws);
  });
}

server.listen(8081);
runApplication()
var websocket;
logData = true;
/*
ws1.on('connection', function connection(ws) {
  console.log("Connection to wsrace1");
  logData = true;
  websocket = ws;
  runApplication()
});
*/
function emitData(data) {
  var websocket = websocketMap[data.race.id];
  if(websocket === undefined && websockets.length > 0) {
    websocket = websockets.shift();
    websocketMap[data.race.id] = websocket;
  }

  if(websocket != undefined) {
    if(websocket.readyState === 1) {
      websocket.send(JSON.stringify(data));
    }
  }
}

function runApplication() {
  betfair.login(_handleSingleEvent)  ;
}
// handle CTRL-C if want to quit application
// This will force a logoff
process.on('SIGINT', function() {
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

function _handleSingleEvent() {
  var ids = '"' + process.argv.slice(2).join('","') + '"';
  betfair.getEventData(ids,_getMarketsForEvents);
}

function _getMarketsForEvents(data) {
  var mapped = data[0].result.map(_getEventId);
  var ids = '"' + process.argv.slice(2).join('","') + '"';
  betfair.getMarketsForEvents(ids,log)  ;
}

function log(events) {
  eventInformation(appstore, events);
  _setMarketInterval(process.argv.slice(2));
}

// callback function
function _getEventId(item) {
  return item.event.id;
}

function _setMarketInterval(markets) {

  markets.forEach(function(marketId) {
    console.log('Active ' + marketId);
    var timer = setInterval( function() { _processMarket(marketId) },_getState().settings.timeout);
    appstore.dispatch({
      type: 'ADD_MARKET_TIMER',
      id : marketId,
      value : timer
    });
  });
}


function _processMarket(market) {
  betfair.getMarketBook(market, handleData);
}

function handleData(data)   {

  if(data[0].result[0] != null) {
    var marketId = data[0].result[0].marketId;
    var status = data[0].result[0].status;
    if(logData) {
      utils.writeToFileJson('book-' + marketId + '.txt',data);
    }
    emitDataToApp(data);
  }
}

function emitDataToApp(data) {

  var marketId = data[0].result[0].marketId
  var timeRemaining;
  if(_getState().runtimeInfo.marketStartTimes[marketId]) {
    timeRemaining = (moment(_getState().runtimeInfo.marketStartTimes[marketId]).valueOf() - moment().valueOf());
    if(timeRemaining > 0) {
      timeRemaining = timeRemaining / (_getState().settings.timeToStart * 60 * 1000) * 100
    } else if(timeRemaining < 0){
      timeRemaining = 100;
    }
  } else {
    timeRemaining = 0;
  }

  var output = {
    race : {
      id : marketId,
      timeRemaining : timeRemaining,
      course : _getState().eventInfo.marketDetails[marketId].venue,
      totalMatched : data[0].result[0].totalMatched,
      totalAvailable : data[0].result[0].totalAvailable,
      distance : _getState().eventInfo.marketDetails[marketId].marketName,
      startTime: moment(_getState().eventInfo.marketDetails[marketId].startTime).format('HH:mm')
    }};
    output.runners = processRunners(_getState().eventInfo.runnerNames,data).slice(0,100);
    emitData(output);
  }

  function _getState() {
    return appstore.getState();
  }
