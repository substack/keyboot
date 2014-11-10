var Spinner = require('spinner-browserify');
var classList = require('class-list');
var subtle = (window.crypto || window.mozCrypto || window.msCrypto).subtle;

if (!subtle || !subtle.generateKey || !subtle.exportKey || !subtle.importKey) {
    classList(document.querySelector('#splash .unsupported')).remove('hide');
    classList(document.querySelector('#splash')).add('show');
    return;
}
else {
    classList(document.querySelector('#splash .generate')).remove('hide');
}

var keystr = localStorage.getItem('keypair!default');
if (keystr) {
    var settings = document.querySelector('#settings');
    classList(settings).add('show');
    loadKeys(keystr, function (err, keypair) {
        console.log(keypair);
    });
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
    var result = {};
    var pub = crypto.subtle.exportKey('jwk', keypair.publicKey);
    unpromise(Promise.all([ pub, priv ]), function (err, keys) {
        if (err) return cb(err);
        localStorage.setItem('keypair!' + profile, JSON.stringify(result));
        cb(null, { public: keys[0], private: keys[1] });
    });
}

function loadKeys (keystr, cb) {
    try { var keyjson = JSON.parse(keystr) }
    catch (err) { return cb(err) }
    
    var pub = subtle.importKey(
        'jwk', keyjson.public,
        { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
        true, [ 'verify' ]
    );
    var priv = subtle.importKey(
        'jwk', keyjson.private, 
        { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
        true, [ 'sign' ]
    );
    unpromise(Promise.all([ pub, priv ]), function (err, keys) {
        if (err) cb(err)
        else cb(null, { public: keys[0], private: keys[1] })
    });
}

function unpromise (p, cb) {
    p.then(function (r) { cb(null, r) });
    p.catch(function (err) { cb(err) });
}
