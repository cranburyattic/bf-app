

var runnerNamesMap = {};
var runnerState = {};

var processRunners = function(runnerNames,data) {

  runnerNamesMap = runnerNames;

  var runners = data[0].result[0].runners.filter(runner => runner.status === 'ACTIVE');


  var processedRunners = [];

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

    var processedRunner = {};
    //console.log(JSON.stringify(runner));
    if(runner.ex.availableToBack[0] !== undefined) {
    processedRunner.name = runnerNamesMap[runner.selectionId];
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
    processedRunner.backPercent = Math.round(backTotal / (backTotalForAllRunners + layTotalForAllRuuners) * 50);
    processedRunner.layPercent = Math.round(layTotal / (layTotalForAllRuuners + backTotalForAllRunners) * -50);
    if(runnerState[runner.selectionId]) {
        var previousState = runnerState[runner.selectionId];
        // set the state to be stored
        var newState = {};
        newState.previousLastPriceTraded = previousState.lastPriceTraded;
        newState.value = processedRunner.value;
        newState.lastPriceTraded = processedRunner.lastPriceTraded;
        newState.minPriceTraded = Math.min(previousState.minPriceTraded,processedRunner.lastPriceTraded);
        newState.maxPriceTraded = Math.max(previousState.maxPriceTraded,processedRunner.lastPriceTraded);
        // update the processedRunner
        processedRunner.previousLastPriceTraded = newState.previousLastPriceTraded;
        processedRunner.minPriceTraded = newState.minPriceTraded;
        processedRunner.maxPriceTraded = newState.maxPriceTraded;
        runnerState[runner.selectionId] = newState;
      } else {
        // set the state to be stored
        var newState = {};
        newState.value = processedRunner.value;
        newState.previousLastPriceTraded = processedRunner.lastPriceTraded;
        newState.minPriceTraded = processedRunner.lastPriceTraded;
        newState.maxPriceTraded = processedRunner.lastPriceTraded;
        newState.lastPriceTraded = processedRunner.lastPriceTraded;

        // update the processedRunner
        processedRunner.minPriceTraded = newState.minPriceTraded;
        processedRunner.maxPriceTraded = newState.maxPriceTraded;
        processedRunner.previousLastPriceTraded = newState.previousLastPriceTraded;
        runnerState[runner.selectionId] = newState;
      }
      processedRunners.push(processedRunner);
    }
  });
  return processedRunners;
}

module.exports = processRunners;
