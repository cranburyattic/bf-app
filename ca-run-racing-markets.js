var fs = require('fs');
var betfair = require('./ca-betfair.js');
var utils = require('./ca-utils.js');
var csv = require('fast-csv')
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');
var processRunners = require('./ca-process-runners.js');
var server = require('http').createServer();

var timetostart = 8;
var timeout = 1000;

// web socket section
var WebSocketServer = require('ws').Server
, wsrace1 = new WebSocketServer({ server , path: '/ws/race1' })
, wsrace2 = new WebSocketServer({ server , path: '/ws/race2' })
, wsrace3 = new WebSocketServer({ server , path: '/ws/race3' })

var websockets = [];

server.listen(8081, () => runApplication());

wsrace1.on('connection', function connection(ws) {
  console.log("Connection to wsrace1");
  websockets[0] = ws;
});

wsrace2.on('connection', function connection(ws) {
  console.log("Connection to wsrace2");
  websockets[1] = ws;
});

wsrace3.on('connection', function connection(ws) {
  console.log("Connection to wsrace3");
  websockets[2] = ws;
});

function emitData(data) {
  var index = getWebsocketIndex(websocketsIndex,data.race.id)
  if(websockets[index]  !== undefined) {
    if(websockets[index].readyState === 1) {
      websockets[index].send(JSON.stringify(data));
    }
  }
}

var websocketsIndex = [];

function getWebsocketIndex(state,marketId) {
  if(state.indexOf(marketId) === -1) {
    state.push(marketId);
  }
  return state.indexOf(marketId);
}

function removeWebsocketIndex(state, marketId) {

  var index = state.indexOf(marketId);
  if(index !== -1) {
    state = state.splice(index, index);
  }
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
  websockets.forEach(socket => {
    if(socket.readyState === 1) {
      socket.send(JSON.stringify(output))
    }
  });
  return state;
}

// web socket sections

// lookup data

var runnerNames = {};
var marketNames = {};

var content = fs.readFileSync(config.betfair.data_dir + '/data/' + generateDirectoryName() + '/events.json');
var data = JSON.parse(content);
var marketDetails = JSON.stringify(data[0].result[0])

data[0].result.forEach(item => {
  var details = {};
  details.marketId = item.marketId;
  details.venue = item.event.venue;
  details.marketName = item.marketName;
  details.startTime = item.marketStartTime;
  marketNames[item.marketId] = details;
  item.runners.forEach(runner => {
    runnerNames[runner.selectionId] = runner.runnerName;
  });
});

// lookup data

var marketTimers = {} ;
var marketStartTimes = {};
var marketData = {};

var stream = fs.createReadStream(config.betfair.data_dir + '/data/' + generateDirectoryName() + '/markets.csv');

function runApplication() {
  console.log('Running ' + new Date());
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
    //var startTime = moment(data.marketStartTime).subtract(6,'minutes');
    if(moment().isBefore(moment(data.marketStartTime))) {
      marketStartTimes[data.marketId] = moment(data.marketStartTime);
      var marketInfo = data.course  + ',' + data.marketName + ',' + data.distance + ',' + data.runners;
      marketData[data.marketId] = marketInfo;
      setMarketTimeout(data);
    }
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
  if(data[0].result[0] != null) {
    var marketId = data[0].result[0].marketId;
    var status = data[0].result[0].status;
    utils.writeToFileJson('book-' + marketId + '.txt',data);
    if(moment().isAfter(marketStartTimes[marketId])) {
      var message = marketData[marketId] + ',' + marketId + ',' + moment(marketStartTimes[marketId]).format() + ',' + data[0].result[0].totalMatched;
      utils.writeToFileAddDay('matched.csv',message);
      console.log('Closed ' + marketId)
      clearTimeout(marketTimers[marketId]);
      delete marketStartTimes[marketId];
      setTimeout(() => { websocketsIndex = removeWebsocketIndex(websocketsIndex, marketId) },1500);
      if(Object.keys(marketStartTimes).length === 0) {
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
  if(marketStartTimes[marketId]) {
    timeRemaining = (marketStartTimes[marketId].valueOf() - moment().valueOf());
    if(timeRemaining > 0) {
      timeRemaining = timeRemaining / timetostart * 60 * 1000 * 100
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
      course : marketNames[marketId].venue,
      totalMatched : data[0].result[0].totalMatched,
      totalAvailable : data[0].result[0].totalAvailable,
      distance : marketNames[marketId].marketName,
      startTime: moment(marketNames[marketId].startTime).format('HH:mm')
    }};

    var runners  = processRunners(runnerNames,data);
    output.runners = runners;
    emitData(output);
  }

  function generateDirectoryName() {
    var date = new Date();
    return date.getFullYear() + '-' + (date.getMonth() + 1)  + '-' + date.getDate();
  }

  function setMarketTimeout(data) {
    console.log('Register ' +  data.marketId + ' - ' + data.course  + ' - ' + data.marketName + ' - ' + moment(data.marketStartTime).format('HH:mm'));
    var startTime = moment(data.marketStartTime).subtract(timetostart,'minutes');
    var length = startTime.diff(moment());
    setTimeout(function(){ setMarketInterval(data.marketId) },length);
  }

  function setMarketInterval(marketId) {
    console.log('Active ' + marketId + " - " + marketStartTimes[marketId].format());
    var timer = setInterval( function(){ processMarket(marketId)},timeout);
    marketTimers[marketId] = timer;
  }
