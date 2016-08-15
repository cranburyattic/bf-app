var fs = require('fs');
var betfair = require('./ca-betfair.js');
var utils = require('./ca-utils.js');
var csv = require('fast-csv')
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');
var reader = require('line-by-line');


function runApplication() {
  readBetsTxt();
}

var iter = 0;
var openingOdds = new Map();

function readBetsTxt() {
  var lr = new reader('bets.json');
lr.on('error', function (err) {
	// 'err' contains error object
});

lr.on('line', function (line) {
  var result = JSON.parse(line);
  bets = result[0].result.accountStatement  ;
  //console.log(bets);
  bets.forEach(function(item) {
    bet = item.legacyData
    if(bet.eventTypeId == '7') {
        var back = '';
        var lay = '';
        if(bet.betType == 'B') {
          back = bet.avgPrice;
        } else {
          lay = bet.avgPrice;
        }
        console.log(bet.placedDate + ','  + back + ',' + lay + ','  + bet.eventId + ',' + bet.eventTypeId);
    }

  });
});

lr.on('end', function () {

});
}
runApplication()
