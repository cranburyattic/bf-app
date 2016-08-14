var fs = require('fs');
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');

function dumpToFile(dir, filename, data) {

    var rootDir = config.betfair.data_dir + '/' + dir;

  	if(!fs.existsSync(rootDir)) {
     		fs.mkdirSync(rootDir);
  	}
  	fs.appendFileSync(rootDir + '/' +  filename, data + '\n')
}

exports.writeToFile = function(filename,data) {
    dumpToFile('data/' + generateDirectoryName(),filename,data);
}

exports.writeToFileAddDay = function(filename,data) {
    dumpToFile('data/' + generateDirectoryNameAddOne(),filename,data);
}


exports.writeToFileJson = function(filename,data) {
    dumpToFile('data/' + generateDirectoryName(),filename,JSON.stringify(data));
}



function generateDirectoryName() {
  var date = new Date();
  return date.getFullYear() + '-' + (date.getMonth() + 1)  + '-' + date.getDate();
}

function generateDirectoryNameAddOne() {
  var now = moment();
  var tomorrow = now.add(1, 'd');
  return tomorrow.year() + '-' + (tomorrow.month() + 1)  + '-' + (tomorrow.date()); //date.getDate();
}
