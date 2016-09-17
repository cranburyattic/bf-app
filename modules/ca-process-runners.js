var moment = require('moment');
var math = require('mathjs');

  var runnerState = {};

var processRunners = function(runnerNames,data) {


  var processedRunners = [];

  var runners = data[0].result[0].runners.filter(runner => runner.status === 'ACTIVE');

  var lastMatchTime = data[0].result[0].lastMatchTime;
  var lastMatchTimeSeconds = moment(lastMatchTime).unix();

  backTotalForAllRunners = 0;
  layTotalForAllRuuners = 0;

  runners.slice().forEach(function(runner) {

    var backTotal =  runner.ex.availableToBack.slice(0,4).reduce(function(count, item) {
      count = count + item.size;
      return count;
    },0);
    backTotalForAllRunners = backTotalForAllRunners + backTotal;

    var layTotal =  runner.ex.availableToLay.slice(0,4).reduce(function(count, item) {
      count = count + item.size;
      // increment or initialize to 1
      return count;
    },0);
    layTotalForAllRuuners = layTotalForAllRuuners + layTotal;
  })


  runners.slice().forEach(function(runner) {
    //console.log(runner);
    var backTotal =  runner.ex.availableToBack.slice(0,4).reduce(function(count, item) {
      count = count + item.size;
      // increment or initialize to 1
      return count;
    },0);
    var layTotal =  runner.ex.availableToLay.slice(0,4).reduce(function(count, item) {
      count = count + item.size;
      // increment or initialize to 1
      return count;
    },0);


    var backTotal15 =  runner.ex.availableToBack.slice(1,5).reduce(function(count15, item) {
      count15 = count15 + item.size;
      // increment or initialize to 1
      return count15;
    },0);
    var layTotal15 =  runner.ex.availableToLay.slice(1,5).reduce(function(count15, item) {
      count15 = count15 + item.size;
      // increment or initialize to 1
      return count15;
    },0);

    var processedRunner = {};
    //console.log(JSON.stringify(runner));
    if(runner.ex.availableToBack[0] !== undefined) {

      processedRunner.name = runnerNames[runner.selectionId];
      processedRunner.selectionId = runner.selectionId;
      processedRunner.lastMatchTime = lastMatchTime;
      processedRunner.lastMatchTimeSeconds = lastMatchTimeSeconds;
      processedRunner.lastPriceTraded = runner.ex.availableToBack[0].price;
      processedRunner.bestBackPrice = runner.ex.availableToBack[0].price;
      processedRunner.bestBackSize = runner.ex.availableToBack[0].size.toFixed(0);

      if(runner.ex.availableToLay.length > 0) {
        processedRunner.bestLayPrice = runner.ex.availableToLay[0].price;
        processedRunner.bestLaySize = runner.ex.availableToLay[0].size.toFixed(0);
      } else {
        processedRunner.bestLayPrice = 'N/A';
        processedRunner.bestLaySize = 'N/A';
      }

      var value;
      if(layTotal >  backTotal) {
        value = (layTotal / (backTotal + layTotal) * 50);
      } else if(backTotal > layTotal) {
        value = (backTotal / (backTotal + layTotal) * -50);
      } else {
        value = 0;
      }

      processedRunner.value = value.toFixed(0);
      processedRunner.backTotal = (backTotal / (backTotal + layTotal) * 50);
      processedRunner.layTotal = (layTotal / (backTotal + layTotal) * -50);
      processedRunner.backTotal15 = (backTotal15 / (backTotal15 + layTotal15) * 50);
      processedRunner.layTotal15 = (layTotal15 / (backTotal15 + layTotal15) * -50);
      processedRunner.backValue = backTotal;
      processedRunner.layValue = layTotal * -1;
      processedRunner.backPercent = Math.round(backTotal / (backTotalForAllRunners + layTotalForAllRuuners) * 50);
      processedRunner.layPercent = Math.round(layTotal / (layTotalForAllRuuners + backTotalForAllRunners) * -50);

      if(runnerState[runner.selectionId]) {
        var previousState = runnerState[runner.selectionId];
        // set the state to be stored
        var newState = {};
        newState.baseTime = previousState.baseTime;
        newState.timeKey = moment(lastMatchTime).unix() - moment(previousState.baseTime).unix();
        newState.previousLastPriceTraded = previousState.lastPriceTraded;
        newState.value = processedRunner.value;
        newState.lastPriceTraded = processedRunner.lastPriceTraded;
        newState.minPriceTraded = Math.min(previousState.minPriceTraded,processedRunner.lastPriceTraded);
        newState.maxPriceTraded = Math.max(previousState.maxPriceTraded,processedRunner.lastPriceTraded);

        var lpt = previousState.historyLastPriceTraded;
        if(lpt.length > 60) {
          lpt.shift();
        }
        lpt.push(processedRunner.lastPriceTraded);
        newState.historyLastPriceTraded = lpt;
        processedRunner.stdevLpt = math.std(lpt).toFixed(2);

        var lv = previousState.historyLayValue;
        if(lv.length > 60) {
          lv.shift();
        }
        lv.push(processedRunner.layValue);
        newState.historyLayValue = lv;
        processedRunner.stdevLv = math.std(lv).toFixed(2);

        var bv = previousState.historyBackValue;
        if(bv.length > 60) {
          bv.shift();
        }
        bv.push(processedRunner.backValue);
        newState.historyBackValue = bv;
        processedRunner.stdevBv = math.std(bv).toFixed(2);


        // update the processedRunner
        processedRunner.previousLastPriceTraded = newState.previousLastPriceTraded;
        processedRunner.minPriceTraded = newState.minPriceTraded;
        processedRunner.maxPriceTraded = newState.maxPriceTraded;
        processedRunner.timeKey = newState.timeKey



        runnerState[runner.selectionId] = newState;
      } else {
        // set the state to be stored
        var newState = {};
        newState.baseTime = lastMatchTime;
        newState.timeKey = moment(lastMatchTime).unix() - moment(newState.baseTime).unix();
        newState.value = processedRunner.value;
        newState.previousLastPriceTraded = processedRunner.lastPriceTraded;
        newState.minPriceTraded = processedRunner.lastPriceTraded;
        newState.maxPriceTraded = processedRunner.lastPriceTraded;
        newState.lastPriceTraded = processedRunner.lastPriceTraded;

        newState.historyLastPriceTraded = [processedRunner.lastPriceTraded];
        newState.historyBackValue = [processedRunner.backValue];
        newState.historyLayValue = [processedRunner.layValue];

        // update the processedRunner
        processedRunner.minPriceTraded = newState.minPriceTraded;
        processedRunner.maxPriceTraded = newState.maxPriceTraded;
        processedRunner.previousLastPriceTraded = newState.previousLastPriceTraded;
        processedRunner.timeKey = newState.timeKey
        runnerState[runner.selectionId] = newState;

      }
      processedRunners.push(processedRunner);

    }
  });
  return processedRunners;
}

module.exports = processRunners;
