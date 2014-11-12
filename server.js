var ecstatic = require('ecstatic');
var http = require('http');

var stdir = ecstatic(__dirname + '/app/static');
var server = http.createServer(stdir);
server.listen(9005);
