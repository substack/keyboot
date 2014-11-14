var through = require('through2');

module.exports = Apps;

function Apps (db, bus) {
    if (!(this instanceof Apps)) return new Apps(db, bus);
    this.db = db;
    this.bus = bus;
}

Apps.prototype.handle = function (msg, origin) {
    var self = this;
    if (msg.action === 'request') {
        self.getStatus(origin, onstatus);
    }
    function onstatus (err, status) {
        if (status === 'pending') {
            reply({
                sequence: msg.sequence,
                response: 'pending'
            });
        }
        else if (status === 'approved') {
            reply({
                sequence: msg.sequence,
                response: 'approved'
            });
        }
        else if (status === false) {
            msg.domain = origin;
            self.saveRequest(msg, origin, function (err) {
                if (err) console.error(err);
                reply({
                    sequence: msg.sequence,
                    response: 'pending'
                });
            });
        }
        self.bus.on('approve', function f (req) {
            if (req.domain === origin) {
                reply({
                    sequence: msg.sequence,
                    response: 'approved'
                });
                self.bus.removeListener('approve', f);
            }
        });
        self.bus.on('reject', function f (req) {
            if (req.domain === origin) {
                reply({
                    sequence: msg.sequence,
                    response: 'rejected'
                });
                self.bus.removeListener('reject', f);
            }
        });
    }
    function reply (res) {
        window.parent.postMessage('keyboot!' + JSON.stringify(res), origin);
    }
};

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
