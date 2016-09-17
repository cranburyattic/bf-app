var setUpEventInformation = function(store, events) {
  events[0].result.forEach(item => {
    var details = {};
    details.marketId = item.marketId;
    if(item.event.venue) {
      details.venue = item.event.venue;
    } else {
      details.venue = item.event.name;
    }
    details.marketName = item.marketName;
    details.startTime = item.marketStartTime;
    store.dispatch({
      type: 'ADD_MARKET_DETAILS',
      id : item.marketId,
      details : details
    })
    item.runners.forEach(runner => {
      store.dispatch({
        type: 'ADD_RUNNER_NAME',
        id : runner.selectionId,
        name : runner.runnerName
      })
    });
  });
}

module.exports = setUpEventInformation;
