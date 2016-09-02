/*jslint node: true*/
"use strict";

var fs = require('fs');
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/betfair_config.yml');
var moment = require('moment');

function dumpToFile(dir, filename, data) {

    var rootDir = config.betfair.data_dir + '/' + dir;

    if (!fs.existsSync(rootDir)) {
        fs.mkdirSync(rootDir);
    }
    fs.appendFileSync(rootDir + '/' +  filename, data + '\n');
}

exports.generateDirectoryName = function() {
    var date = new Date();
    return date.getFullYear() + '-' + (date.getMonth() + 1)  + '-' + date.getDate();
}

function generateDirectoryNameAddOne() {
    var now = moment(), tomorrow = now.add(1, 'd');
    return tomorrow.year() + '-' + (tomorrow.month() + 1)  + '-' + (tomorrow.date()); //date.getDate();
}

exports.writeToFile = function (filename, data) {
    dumpToFile('data/' + this.generateDirectoryName(), filename, data);
}

exports.writeToFileAddDay = function (filename, data) {
    dumpToFile('data/' + this.generateDirectoryNameAddOne(), filename, data);
}

exports.writeToFileJson = function (filename, data) {
    dumpToFile('data/' + this.generateDirectoryName(), filename, JSON.stringify(data));
}
