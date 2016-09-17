var fs = require('fs');
var betfair = require('./ca-betfair.js');
var utils = require('./ca-utils.js');
var csv = require('fast-csv')
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');
var processRunners = require('./modules/ca-process-runners.js');
var eventInformation = require('./modules/ca-event-information.js');
var store = require('./modules/ca-store.js');

var server = require('http').createServer();

var appstore =  store();

// web socket section
var WebSocketServer = require('ws').Server
, wsrace1 = new WebSocketServer({ server , path: '/ws/race1' })
, wsrace2 = new WebSocketServer({ server , path: '/ws/race2' })
, wsrace3 = new WebSocketServer({ server , path: '/ws/race3' })

var websockets = [];

server.listen(8081, () => runApplication());

server.on('request', function(request, response) {
  response.end(JSON.stringify(_getState()));
});


wsrace1.on('connection', function connection(ws) {
  console.log("Connection to wsrace1");
  websockets[0] = ws;
  ws.addEventListener("close", function(event) {
    websocketMap = {}
  });
  logData = true;
});

wsrace2.on('connection', function connection(ws) {
  console.log("Connection to wsrace2");
  websockets[1] = ws;
  ws.addEventListener("close", function(event) {
    websocketMap = {}
  });
  logData = true;
});

var websocketMap = {};

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

function emitClose(marketId) {

  var output =
  { race:
    {
      id : marketId,
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

  var websocket = websocketMap[marketId];

  if(websocket != undefined) {
    if(websocket.readyState === 1) {
      websocket.send(JSON.stringify(output));
    }
    websockets.push(websocket);
    delete websocketMap[marketId];
  }
}

function setupEventData() {
  //var content = fs.readFileSync(config.betfair.data_dir + '/data/2016-9-4/events.json');
  var content = fs.readFileSync(config.betfair.data_dir + '/data/' + _generateDirectoryName() + '/events.json');
  eventInformation(appstore, JSON.parse(content));
  //console.log(appstore.getState());
}

var marketTimers = {} ;
var marketStartTimes = {};
var marketData = {};

var stream = fs.createReadStream(config.betfair.data_dir + '/data/' + _generateDirectoryName() + '/markets.csv');
//var stream = fs.createReadStream(config.betfair.data_dir + '/data/2016-9-4/markets.csv');

function runApplication() {
  setupEventData();
  betfair.login(setUpTimeouts);
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


function setUpTimeouts() {
  utils.writeToFileAddDay('matched.csv','course,marketName,distance,runners,marketId,startTime,totalMatched',false);
  var csvStream = csv
  .parse({headers : true})
  .on("data", function(data) {
    if(moment().isBefore(moment(data.marketStartTime))) {

      appstore.dispatch({
        type: 'ADD_MARKET_STARTTIME',
        id : data.marketId,
        value : moment(data.marketStartTime)
      })

      var marketInfo = data.course  + ',' + data.marketName + ',' + data.distance + ',' + data.runners;

      appstore.dispatch({
        type: 'ADD_MARKET_CSV',
        id : data.marketId,
        value : marketInfo
      })

      _setMarketTimeout(data);
    }
  })
  .on("end", function(){
    console.log("Timeouts setup");
    console.log(_getState());

  });
  stream.pipe(csvStream);
}

function processMarket(market) {
  betfair.getMarketBook(market, handleData);
}

function handleData(data)   {

  if(data[0].result[0] != null) {

    var marketId = data[0].result[0].marketId;
    var status = data[0].result[0].status;

    if(_getState().settings.logData) {
      utils.writeToFileJsonOSX('book-' + marketId + '.txt',data);
    }

    if(moment().isAfter(_getState().runtimeInfo.marketStartTimes[marketId])) {

      var message = _getState().runtimeInfo.marketCSV[marketId] + ',' + marketId + ',' + moment(_getState().runtimeInfo.marketStartTimes[marketId]).format() + ',' + data[0].result[0].totalMatched;

      utils.writeToFileAddDay('matched.csv',message);

      console.log('Closed ' + marketId)

      clearTimeout(_getState().runtimeInfo.marketTimers[marketId]);

      appstore.dispatch({
        type: 'DELETE_MARKET_STARTTIME',
        id : marketId,
      })

      emitClose(marketId);

      if(Object.keys(_getState().runtimeInfo.marketStartTimes).length === 0) {
        console.log('No markets left - Logging off');
        logout();
      }
    } else {
      emitDataToApp(data);
    }
  }
}

function emitDataToApp(data) {

  var marketId = data[0].result[0].marketId
  var timeRemaining;
  if(_getState().runtimeInfo.marketStartTimes[marketId]) {
    timeRemaining = (moment(_getState().runtimeInfo.marketStartTimes[marketId]).valueOf() - moment().valueOf());
    console.log('t1 ' + timeRemaining)
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
    // set up the runners
    output.runners = processRunners(_getState().eventInfo.runnerNames,data).slice(0,5);
    // send the data
    //console.log(output);
    emitData(output);
}

function _getState() {
  return appstore.getState();
}

function _generateDirectoryName() {
  return utils.generateDirectoryName();
}

function _setMarketTimeout(data) {
  console.log('Register ' +  data.marketId + ' - ' + data.course  + ' - ' + data.marketName + ' - ' + moment(data.marketStartTime).format('HH:mm'));

  var startTime = moment(data.marketStartTime).subtract(_getState().settings.timeToStart,'minutes');
  var length = startTime.diff(moment());

  setTimeout(function(){ _setMarketInterval(data.marketId) },length);
}

function _setMarketInterval(marketId) {

  console.log('Active ' + marketId + " - " + (_getState().runtimeInfo.marketStartTimes[marketId] ? _getState().runtimeInfo.marketStartTimes[marketId].format() : 'NOW'));

  console.log(_getState().settings.timeout);
  var timer = setInterval( function() { processMarket(marketId) },_getState().settings.timeout);

  appstore.dispatch({
    type: 'ADD_MARKET_TIMER',
    id : marketId,
    value : timer
  })

  console.log(_getState());
  marketTimers[marketId] = timer;
}
