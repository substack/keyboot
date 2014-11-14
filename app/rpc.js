module.exports = RPC;

function RPC (bus, apps, keys, subtle) {
    if (!(this instanceof RPC)) return new RPC(bus, apps, keys, subtle);
    this.bus = bus;
    this.apps = apps;
    this.keys = keys;
    this.subtle = subtle;
}

RPC.prototype.handle = function (msg, origin) {
    var self = this;
    if (msg.action === 'request') {
        self.getStatus(origin, onstatus);
    }
    else if (msg.action === 'sign') {
        self.apps.get(origin, function (err, value) {
            if (err) return reply({
                sequence: msg.sequence,
                response: 'error',
                message: err.message
            });
            if (!value || value.permissions.indexOf('sign') < 0) {
                return reply({
                    sequence: msg.sequence,
                    response: 'error',
                    message: 'insufficient permissions for signing'
                });
            }
            self.keys.load(value.profile, function (err, keys) {
                if (err) return reply({
                    sequence: msg.sequence,
                    response: 'error',
                    message: err.message
                });
                handleSign(self.subtle.sign(
                    keys.private,
                    'RSA-256'
                ));
            });
        });
    }
    
    function handleSign (sign) {
        sign.then(function (result) {
            console.log('RESULT=', result);
            /*
            reply({
               sequence: msg.sequence,
               response: '',
               message: ''
            })
            */
        });
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
            self.apps.saveRequest(msg, origin, function (err) {
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
            }
        });
        self.bus.on('reject', function f (req) {
            if (req.domain === origin) {
                reply({
                    sequence: msg.sequence,
                    response: 'rejected'
                });
            }
        });
        self.bus.on('revoke', function f (req) {
            if (req.domain === origin) {
                reply({
                    sequence: msg.sequence,
                    response: 'revoke'
                });
            }
        });
    }
    function reply (res) {
        window.parent.postMessage('keyboot!' + JSON.stringify(res), origin);
    }
};
