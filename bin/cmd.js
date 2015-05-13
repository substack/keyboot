#!/usr/bin/env node

var http = require('http');
var minimist = require('minimist');
var hyperboot = require('hyperboot');
var fs = require('fs');
var path = require('path');

var argv = minimist(process.argv.slice(2), {
    alias: { p: 'port', d: 'dir', h: 'help', v: [ 'verbose', 'version' ] },
    default: { d: path.join(process.cwd(), 'hyperdata') }
});

if (argv._[0] === 'help' || argv.help) {
    showHelp(0);
}
else if (argv._[0] === 'version' || process.argv.length === 3 && argv.version) {
    console.log(require('../package.json').version);
}
else if (argv._[0] === 'server') {
    var boot = hyperboot({
        dir: argv.dir,
        name: 'keyboot'
    });
    var server = http.createServer(function (req, res) {
        if (argv.verbose) console.log(req.method, req.url);
        if (boot.exec(req, res)) return;
        res.statusCode = 404;
        res.end('not found\n');
    });
    server.listen(argv.port, function () {
        console.log('http://localhost:' + server.address().port);
    });
}
else showHelp(1)

function showHelp (code) {
    var r = fs.createReadStream(path.join(__dirname, 'usage.txt'));
    r.pipe(process.stdout);
    r.once('end', function () {
        if (code) process.exit(code);
    });
}
