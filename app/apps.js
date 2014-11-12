var through = require('through2');

module.exports = Apps;

function Apps (db) {
    if (!(this instanceof Apps)) return new Apps(db);
    this.db = db;
}

Apps.prototype.saveRequest = function (req, domain, cb) {
    var id = Date.now() + '.' + Math.floor(Math.pow(16,8)).toString(16);
    this.db.put('request!' + id + '!' + domain, req, cb);
};

Apps.prototype.approve = function (profile, cb) {
};

Apps.prototype.reject = function (profile, keypair, cb) {
};

Apps.prototype.requests = function (cb) {
    var s = this.db.createReadStream({ gt: 'request!', lt: 'request!~' });
    s.on('error', cb);
    s.pipe(through.obj(write, end));
    
    var rows = [];
    function write (row, enc, next) {
        rows.push({
            domain: row.key.split('!')[2],
            id: row.key.split('!')[1],
            usages: row.value.usages
        });
        next();
    }
    function end () { cb(null, rows) }
};
