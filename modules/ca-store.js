var redux = require('redux');
var _ = require('lodash');

var store;

var initialState = {
  settings : {
    timeToStart : 10,
    timeout : 1000,
    logData : false
  },
  eventInfo : {
    runnerNames : {},
    marketDetails : {}
  },
  runtimeInfo : {
    marketTimers : {},
    marketStartTimes : {},
    marketCSV : {},
  }
}

function manageBetfairState(state, action) {

  var newState = _.assignIn({}, state);

  switch (action.type) {
    case 'SET_TIME_TO_START':
      newState.settings.timeToStart = action.value
      break;
    case 'SET_TIMEOUT':
      newState.settings.timeout = action.value;
      break;
    case 'SET_LOGDATA':
      newState.settings.logData = action.value;
      break;
    case 'ADD_RUNNER_NAME':
      newState.eventInfo.runnerNames[action.id] = action.name;
      break;
    case 'ADD_MARKET_DETAILS':
      newState.eventInfo.marketDetails[action.id] = action.details;
      break;
    case 'ADD_MARKET_TIMER':
      newState.runtimeInfo.marketTimers[action.id] = action.value;
      break;
    case 'ADD_MARKET_STARTTIME':
      newState.runtimeInfo.marketStartTimes[action.id] = action.value;
      break;
    case 'DELETE_MARKET_STARTTIME':
      delete newState.runtimeInfo.marketStartTimes[action.id];
      break;
    case 'ADD_MARKET_CSV':
      newState.runtimeInfo.marketCSV[action.id] = action.value;
      break;
  }
  return newState;
}

var getStore = function() {
  if(store === undefined) {
    store = redux.createStore(manageBetfairState, initialState);
  }
  return store;
}

module.exports = getStore;
