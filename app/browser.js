var Spinner = require('spinner-browserify');
var classList = require('class-list');
var subtle = (window.crypto || window.mozCrypto || window.msCrypto).subtle;

var keystr = localStorage.getItem('keypair!default');
if (keystr) {
    var settings = document.querySelector('#settings');
    classList(settings).add('show');
    var keyjson = JSON.parse(keystr);
    var keypair = {
        public: subtle.importKey(
            'jwk', keyjson.public,
            { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
            true, [ 'verify' ]
        ),
        private: subtle.importKey(
            'jwk', keyjson.private, 
            { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
            true, [ 'sign' ]
        )
    };
    console.log(keypair);
    window.keypair = keypair;
}
else {
    var splash = document.querySelector('#splash');
    classList(splash).add('show');
    
    var button = document.querySelector('#splash button');
    button.addEventListener('click', function (ev) {
        button.style.display = 'none';
        
        var spin = new Spinner();
        
        var busy = document.querySelector('#splash .busy');
        var msg = document.querySelector('#splash .msg');
        msg.textContent = 'Generating 4096-bit keypair. Please wait.';
        busy.appendChild(spin.el);
        
        generate(function (err, keypair) {
            spin.stop();
            busy.removeChild(spin.el);
            if (err) {
                console.log('err=', err);
                msg.textContent = String(err);
                return;
            }
            msg.textContent = 'keypair generated';
            saveKeys('default', keypair, function (err) {
                console.log('err=', err);
            });
        });
    });
}

window.addEventListener('postMessage', function (ev) {
    
});

function generate (cb) {
    var opts = {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 4096,
        publicExponent: new Uint8Array([ 1, 0, 1 ]),
        hash: { name: 'SHA-256' }
    };
    unpromise(subtle.generateKey(opts, true, [ 'sign', 'verify' ]), cb);
}

function saveKeys (profile, keypair, cb) {
    var pending = 2, result = {};
    var pub = crypto.subtle.exportKey('jwk', keypair.publicKey);
    unpromise(pub, function (err, key) {
        if (err) return done(err);
        result.public = key;
        if (-- pending === 0) done();
    });
    
    var priv = crypto.subtle.exportKey('jwk', keypair.privateKey);
    unpromise(priv, function (err, key) {
        if (err) return done(err);
        result.private = key;
        if (-- pending === 0) done();
    });
    
    function done (err) {
        if (err) { cb(err); cb = function () {} }
        localStorage.setItem('keypair!' + profile, JSON.stringify(result));
        cb(null);
    }
}

function abuf (str) {
    var u16 = new Uint16Array(str.length * 2);
    for (var i = 0; i < str.length; i++) u16[i] = str.charAt(i);
    return new ArrayBuffer(u16);
}

function unpromise (p, cb) {
    p.then(function (r) { cb(null, r) });
    p.catch(function (err) { cb(err) });
}
