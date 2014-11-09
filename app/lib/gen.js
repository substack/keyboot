// hide gross promise api behind something sensible

var pgp = require('openpgp');

module.exports = function (opts, cb) {
    var p = pgp.generateKeyPair(opts);
    p.then(function (r) { cb(null, r) });
    p.catch(function (err) { cb(err) });
};
