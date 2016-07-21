/*
Module for interacting with Betfair
*/
var async = require('asynch');
var https = require('https');
var fs = require('fs');

var yaml_config = require('node-yaml-config');
console.log(__dirname);
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');


var username=config.betfair.username;
var password=config.betfair.password;
var sso_host=config.betfair.sso.host;
var sso_port=config.betfair.sso.port;
var exchange_host=config.betfair.exchange.host;
var exchange_port=config.betfair.exchange.port;
var APP_KEY = config.betfair.app_key;
var KEY=config.betfair.app_dir + '/config/' + config.betfair.key_file;
var CERT=config.betfair.app_dir + '/config/' + config.betfair.cert_file;
var sessionToken;


exports.login = function(callback) {
  console.error('Login to Betfair');
  var postdata = 'username=' + username + '&password=' + password;
  var body = '';
	var request = https.request(generateOptions('/api/certlogin'), function(res) {
 		 //When we receive data, we want to store it in a string
    	res.on('data', function (chunk) {
        	body += chunk;
    	});
    	//On end of the request, run what we need to
    	res.on('end',function() {
        	//Do Something with the data
        	var jsonResponse = JSON.parse(body);
          sessionToken = jsonResponse.sessionToken;
          console.error(sessionToken);
        	callback();
    	});
	});

	request.setHeader('X-Application', APP_KEY);
	request.setHeader('Content-Type', 'application/x-www-form-urlencoded');

	//Now we need to set up the request itself.
	//This is a simple sample error function
	request.on('error', function(e) {
  		console.error('problem with request: ' + e.message);
	});

	//Write our post data to the request
	request.write(postdata);
	//End the request.
	request.end();
}

exports.logout = function logout(callback) {
  console.error('Logoff from Betfair');

  var body = '';
	var request = https.request(generateOptions('/api/logout'), function(res) {
 		 //When we receive data, we want to store it in a string
    	res.on('data', function (chunk) {
        	body += chunk;
    	});
    	//On end of the request, run what we need to
    	res.on('end',function() {
        	//Do Something with the data
        	//console.log(body);
        	var jsonResponse = JSON.parse(body);
        	var status = jsonResponse.status;
        	console.error('Logoff ' + status);
        	callback();
    	});
	});

	request.setHeader('X-Application', APP_KEY);
	request.setHeader('X-Authentication', sessionToken);
	request.setHeader('Accept', 'application/json');

	//Now we need to set up the request itself.
	//This is a simple sample error function
	request.on('error', function(e) {
  		console.error('problem with request: ' + e.message);
	});
	//End the request.
	request.end();
}

function generateOptions(path) {
  return {
    hostname: sso_host,
    port: sso_port,
    path: path,
    method: 'POST',
    key: fs.readFileSync(KEY),
    cert: fs.readFileSync(CERT),
    agent: false
  };
}

/*
Execute a request against Betfair
*/
function executeBetfair(postdata, callback) {

  var body = '';

  var options = {
  	hostname: exchange_host,
  	port: exchange_port,
  	path: '/exchange/betting/json-rpc/v1',
  	method: 'POST',
  	key: fs.readFileSync(KEY),
  	cert: fs.readFileSync(CERT),
  	agent: false
	};

	var request = https.request(options, function(res) {
 		 //When we receive data, we want to store it in a string
    	res.on('data', function (chunk) {
        	body += chunk;
    	});
    	//On end of the request, run what we need to
    	res.on('end',function() {
        	//Do Something with the data
        	var jsonResponse = JSON.parse(body);
        	callback(jsonResponse);
    	});
	});

	request.setHeader('X-Authentication', sessionToken);
	request.setHeader('Accept', 'application/json');
	request.setHeader('X-Application', APP_KEY);
	request.setHeader('Content-Type', 'application/json');

	//Now we need to set up the request itself.
	//This is a simple sample error function
	request.on('error', function(e) {
  		console.log('problem with request: ' + e.message);
	});

	//Write our post data to the request
	request.write(postdata);
	//End the request.
	request.end();
}

exports.getTodaysRaces = function(callback) {

  var postdata = '[{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listEvents", "params": {"filter":{"eventTypeIds":["7"],"bspOnly":true,"marketCountries":["GB","IRE"],"marketStartTime":{"from":"'+ getStartDate() + '","to":"'+ getEndDate() + '"}}}, "id": 1}]';

  executeBetfair(postdata,callback);
}

exports.getRacingMarketsForEvents = function(eventIds, callback) {

  var postdata = '[{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listMarketCatalogue", "params": {"filter":{"eventIds":[' + eventIds + '],"marketTypeCodes":["WIN"]},"sort":"FIRST_TO_START","maxResults":"1000","marketProjection":["MARKET_START_TIME","EVENT","COMPETITION","RUNNER_METADATA"]}, "id": 1}]';

  executeBetfair(postdata,callback);
}

exports.getMarketCatalog = function(marketId, callback) {

  var postdata = '[{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listMarketCatalogue", "params": {"filter":{"marketIds":["' + marketId + '"]},"maxResults":"1","marketProjection":["RUNNER_METADATA","MARKET_START_TIME","EVENT"]}, "id": 1}]';

  executeBetfair(postdata,callback);
}

exports.getMarketBook = function(marketId, callback) {

  var postdata = '[{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listMarketBook", "params": {"marketIds":["' + marketId + '"],"priceProjection":{"priceData":["SP_AVAILABLE","SP_TRADED","EX_BEST_OFFERS","EX_ALL_OFFERS","EX_TRADED"]}}, "id": 1}]';

  executeBetfair(postdata,callback);
}

exports.getUnderOver25 = function(callback) {

  var postdata = '[{"jsonrpc": "2.0", "method": "SportsAPING/v1.0/listMarketCatalogue", "params": {"filter":{"marketCountries":["GB"],"marketTypeCodes":["OVER_UNDER_25"],"marketStartTime":{"from":"' + getStartDate() + '","to":"' + getEndDate() + '"}},"maxResults":"500","marketProjection":["MARKET_START_TIME"]}, "id": 1}]';

  executeBetfair(postdata,callback);
}

function getStartDate() {
  var d = new Date();
  d.setHours(1,0,0,0)
  return d.toISOString();
}

function getEndDate() {
  var d = new Date();
  d.setHours(23,0,0,0);
  return d.toISOString();
}
