var through = require('through2');

module.exports = Apps;

function Apps (db) {
    if (!(this instanceof Apps)) return new Apps(db);
    this.db = db;
}

Apps.prototype.getStatus = function (domain, cb) {
    this.db.get('request!' + domain, function (err, res) {
        if (res) return cb(null, 'pending');
        else cb(null, false)
    });
};

Apps.prototype.saveRequest = function (req, domain, cb) {
    this.db.put('request!' + domain, req, cb);
};

Apps.prototype.reject = function (domain, cb) {
    this.db.del('request!' + domain, cb);
};

Apps.prototype.approve = function (domain, profile, cb) {
    this.db.put('app!' + domain, profile, cb);
};

Apps.prototype.requests = function (cb) {
    var s = this.db.createReadStream({ gt: 'request!', lt: 'request!~' });
    s.on('error', cb);
    s.pipe(through.obj(write, end));
    
    var rows = [];
    function write (row, enc, next) {
        rows.push({
            domain: row.key.split('!')[1],
            permissions: row.value.permissions
        });
        next();
    }
    function end () { cb(null, rows) }
};

Apps.prototype.approved = function (profile, cb) {
    var s = this.db.createReadStream({ gt: 'app!', lt: 'app!~' });
    s.on('error', cb);
    s.pipe(through.obj(write, end));
    
    var rows = [];
    function write (row, enc, next) {
        rows.push({
            
        });
        next();
    }
    function end () { cb(null, rows) }
};
