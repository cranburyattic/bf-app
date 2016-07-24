var fs = require('fs');
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');

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

exports.writeToFileJson = function(filename,data) {
    dumpToFile('data/' + generateDirectoryName(),filename,JSON.stringify(data));
}

function generateDirectoryName() {
  var date = new Date();
  return date.getFullYear() + '-' + (date.getMonth() + 1)  + '-' + date.getDate();
}
