/*jslint node: true*/
"use strict";

var fs = require('fs');
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');

function dumpToFile(dir, filename, data, appendIfFileExists) {

    var rootDir = config.betfair.data_dir + '/' + dir;

    if (!fs.existsSync(rootDir)) {
        fs.mkdirSync(rootDir);
    }
    if(appendIfFileExists) {
      fs.appendFileSync(rootDir + '/' +  filename, data + '\n');
    } else {
      if(!fileExists(rootDir + '/' +  filename)) {
          fs.appendFileSync(rootDir + '/' +  filename, data + '\n');
      }
    }
}

function dumpFileToOSX(dir, filename, data, appendIfFileExists) {

    var rootDir = config.betfair.osx_data_dir + '/' + dir;

    if (!fs.existsSync(rootDir)) {
        fs.mkdirSync(rootDir);
    }
    if(appendIfFileExists) {
      fs.appendFileSync(rootDir + '/' +  filename, data + '\n');
    } else {
      if(!fileExists(rootDir + '/' +  filename)) {
          fs.appendFileSync(rootDir + '/' +  filename, data + '\n');
      }
    }
}

exports.generateDirectoryName = function() {
    var date = new Date();
    return date.getFullYear() + '-' + (date.getMonth() + 1)  + '-' + date.getDate();
}

exports.generateDirectoryNameAddOne = function() {
    var now = moment(), tomorrow = now.add(1, 'd');
    return tomorrow.year() + '-' + (tomorrow.month() + 1)  + '-' + (tomorrow.date()); //date.getDate();
}

exports.writeToFile = function (filename, data) {
    dumpToFile('data/' + this.generateDirectoryName(), filename, data, true);
}

exports.writeToFileWithSubDir = function(subDir,filename, data) {

    dumpToFile('data/' + this.generateDirectoryName() + '/' + subDir, filename, data, true);
}

exports.writeToFileAddDay = function (filename, data) {
    dumpToFile('data/' + this.generateDirectoryNameAddOne(), filename, data, true);
}

exports.writeToFileAddDay = function (filename, data, appendIfFileExists) {
    dumpToFile('data/' + this.generateDirectoryNameAddOne(), filename, data, appendIfFileExists);
}

exports.writeToFileWithSubDirWithAppend = function (subDir, filename, data, appendIfFileExists) {
    dumpToFile('data/' + this.generateDirectoryName() + '/' + subDir, filename, data, appendIfFileExists);
}

exports.writeToFileJson = function (filename, data) {
    dumpToFile('data/' + this.generateDirectoryName(), filename, JSON.stringify(data), true);
}

exports.writeToFileJsonOSX = function (filename, data) {
    dumpFileToOSX('data/' + this.generateDirectoryName(), filename, JSON.stringify(data), true);
}


function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}
