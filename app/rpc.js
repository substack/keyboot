var RPC = require('frame-rpc');

module.exports = function (opts) {
    var rpc = RPC(window, window.parent, opts.origin, {
        request: function () { r.request.apply(r, arguments) },
        sign: function () { r.sign.apply(r, arguments) }
    });
    var r = new Remote(opts, rpc);
    return rpc;
};

function Remote (opts, rpc) {
    var self = this;
    this.origin = opts.origin;
    this.bus = opts.bus;
    this.apps = opts.apps;
    this.keys = opts.keys;
    this.subtle = opts.subtle;
    this.rpc = rpc;
    
    this.bus.on('approve', function f (req) {
        if (req.domain === self.origin) {
            rpc.call('emit', 'approve');
        }
    });
    this.bus.on('reject', function f (req) {
        if (req.domain === self.origin) {
            rpc.call('emit', 'reject');
        }
    });
    this.bus.on('revoke', function f (req) {
        if (req.domain === self.origin) {
            rpc.call('emit', 'revoke');
        }
    });
}

Remote.prototype.request = function (req, cb) {
    var self = this;
    self.apps.getStatus(self.origin, function (err, status) {
        if (err) return cb(err);
        else if (status === 'pending') {
            cb(null, status);
        }
        else if (status === 'approved') {
            self.rpc.call('emit', 'approve');
            cb(null, status);
        }
        else if (status === false) {
            self.apps.saveRequest(req, self.origin, function (err) {
                if (err) cb(err)
                else cb(null, 'pending')
            });
        }
        else cb(null, status)
    });
};

Remote.prototype.sign = function (text, cb) {
    var self = this;
    self.apps.get(self.origin, function (err, value) {
        if (err) return cb(err);
        if (!value || value.permissions.indexOf('sign') < 0) {
            return cb(new Error('insufficient permissions for signing'));
        }
        self.keys.load(value.profile, function (err, keys) {
            if (err) return cb(err);
            
            var algo = {
                name: 'RSASSA-PKCS1-v1_5',
                hash: 'SHA-256'
            };
            var buf = new Buffer(text);
            var data = new Uint8Array(buf.length);
            for (var i = 0; i < buf.length; i++) {
                data[i] = buf[i];
            }
            
            try {
                handleSign(self.subtle.sign(
                    algo, keys.private, data
                ));
            }
            catch (e) { console.error(e) }
        });
    });
    
    function handleSign (sign) {
        sign.then(function (result) {
            // TODO: add domain wrapper
            cb(null, new Uint8Array(result));
        });
        sign.catch(function (err) { cb(err) });
    }
};