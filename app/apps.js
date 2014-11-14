var through = require('through2');
var isarray = require('isarray');

module.exports = Apps;

function Apps (db, bus) {
    if (!(this instanceof Apps)) return new Apps(db, bus);
    this.db = db;
    this.bus = bus;
}

Apps.prototype.getStatus = function (domain, cb) {
    var self = this;
    self.db.get('app!' + domain, function (err, res) {
        if (res) return cb(null, 'approved')
        self.db.get('request!' + domain, function (err, res) {
            if (res) return cb(null, 'pending');
            else cb(null, false)
        });
    });
};

Apps.prototype.get = function (domain, cb) {
    this.db.get('app!' + domain, cb)
};

Apps.prototype.saveRequest = function (req, domain, cb) {
    this.db.put('request!' + domain, req, cb);
    this.bus.emit('request', req);
};

Apps.prototype.reject = function (req, cb) {
    this.db.del('request!' + req.domain, cb);
    this.bus.emit('reject', req);
};

Apps.prototype.approve = function (req, profile, cb) {
    if (!cb) cb = function () {};
    if (!isarray(req.permissions)) {
        return cb(new Error('invalid value for permissions'));
    }
    
    var self = this;
    this.db.batch([
        {
            type: 'put',
            key: 'app!' + req.domain,
            value: {
                profile: profile,
                permissions: req.permissions
            }
        },
        { type: 'del', key: 'request!' + req.domain }
    ], done);
    function done (err) {
        if (err) cb(err)
        else {
            cb(null);
            self.bus.emit('approve', req);
        }
    }
};

Apps.prototype.revoke = function (req, cb) {
    if (!cb) cb = function () {};
    var self = this;
    self.db.del('app!' + req.domain, function (err) {
        if (err) return cb(err);
        cb(null);
        self.bus.emit('revoke', req);
    });
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
            domain: row.key.split('!')[1],
            profile: row.value.profile,
            permissions: row.value.permissions
        });
        next();
    }
    function end () { cb(null, rows) }
};
