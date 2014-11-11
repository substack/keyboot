var through = require('through2');

module.exports = Keys;

function Keys (db, crypto) {
    if (!(this instanceof Keys)) return new Keys(db, crypto);
    this.db = db;
    this.crypto = crypto;
}

Keys.prototype.generate = function (profile, cb) {
    var self = this;
    generate(this.crypto, function (err, keypair) {
        if (err) return cb(err)
        self.save(profile, keypair, function (err) {
            if (err) cb(err)
            else cb(null, keypair)
        });
    });
};

Keys.prototype.list = function (cb) {
    var s = this.db.createReadStream({ gt: 'keypair!', lt: 'keypair!~' });
    s.on('error', cb);
    s.pipe(through.obj(write, end));
    
    var rows = [];
    function write (row, enc, next) {
        rows.push({
            name: row.key.split('!')[1],
            hash: 'abcdef0123456789'
        });
        next();
    }
    function end () { cb(null, rows) }
};

Keys.prototype.save = function (profile, keypair, cb) {
    var self = this;
    var pub = this.crypto.exportKey('jwk', keypair.publicKey);
    var priv = this.crypto.exportKey('jwk', keypair.privateKey);
    unpromise(Promise.all([ pub, priv ]), function (err, keys) {
        if (err) return cb(err);
        var ref = { public: keys[0], private: keys[1] };
        self.db.put('keypair!' + profile, ref, function (err) {
            if (err) cb(err)
            else cb(null, ref)
        });
    });
};

Keys.prototype.load = function (profile, cb) {
    var self = this;
    this.db.get('keypair!' + profile, function (err, keyjson) {
        if (err) return cb(err);
        var pub = self.crypto.importKey(
            'jwk', keyjson.public,
            { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
            true, [ 'verify' ]
        );
        var priv = self.crypto.importKey(
            'jwk', keyjson.private, 
            { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
            true, [ 'sign' ]
        );
        unpromise(Promise.all([ pub, priv ]), function (err, keys) {
            if (err) cb(err)
            else cb(null, { public: keys[0], private: keys[1] })
        });
    });
};

function unpromise (p, cb) {
    p.then(function (r) { cb(null, r) });
    p.catch(function (err) { cb(err) });
}

function generate (crypto, cb) {
    var opts = {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 4096,
        publicExponent: new Uint8Array([ 1, 0, 1 ]),
        hash: { name: 'SHA-256' }
    };
    unpromise(crypto.generateKey(opts, true, [ 'sign', 'verify' ]), cb);
}
