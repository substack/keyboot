var through = require('through2');
var createHash = require('sha.js');

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
        self.save(profile, keypair, function (err, ref) {
            if (err) cb(err)
            else cb(null, ref)
        });
    });
};

Keys.prototype.list = function (cb) {
    var self = this;
    var s = this.db.createReadStream({ gt: 'keypair!', lt: 'keypair!~' });
    s.on('error', cb);
    s.pipe(through.obj(write, end));
    
    var rows = [];
    function write (row, enc, next) {
        var name = row.key.split('!')[1];
        self.load(name, function (err, profile) {
            rows.push(profile);
            next();
        });
    }
    function end () { cb(null, rows) }
};

Keys.prototype.save = function (profile, keypair, cb) {
    var self = this;
    var pub = this.crypto.exportKey('jwk', keypair.publicKey);
    var priv = this.crypto.exportKey('jwk', keypair.privateKey);
    var rpub = this.crypto.exportKey('spki', keypair.publicKey);
    
    unpromise(Promise.all([ rpub, pub, priv ]), function (err, keys) {
        if (err) return cb(err);
        
        var rawpub = new Uint8Array(keys[0]);
        var ref = {
            public: keys[1],
            rawPublic: Buffer(rawpub).toString('base64'),
            private: keys[2],
            hash: createHash('sha256').update(rawpub).digest('hex')
        };
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
            if (err) return cb(err);
            cb(null, {
                name: profile,
                hash: keyjson.hash,
                rawPublic: keyjson.rawPublic,
                public: keys[0],
                private: keys[1]
            });
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
