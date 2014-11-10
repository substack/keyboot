var Spinner = require('spinner-browserify');
var subtle = (window.crypto || window.mozCrypto || window.msCrypto).subtle;

var button = document.querySelector('#splash button');
button.addEventListener('click', function (ev) {
    button.style.display = 'none';
    
    var spin = new Spinner();
    
    var busy = document.querySelector('#splash .busy');
    var msg = document.querySelector('#splash .msg');
    msg.textContent = 'Generating 4096-bit keypair. Please wait.';
    busy.appendChild(spin.el);
    
    generate(function (err, keypair) {
        console.log('err=', err);
        spin.stop();
        busy.removeChild(spin.el);
        msg.textContent = 'keypair generated';
        window.keypair = keypair;
    });
});

window.addEventListener('postMessage', function (ev) {
    
});

function generate (cb) {
    var opts = {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 4096,
        publicExponent: new Uint8Array([ 1, 0, 1 ]),
        hash: { name: 'SHA-256' }
    };
    var op = subtle.generateKey(opts, false, [ 'sign', 'verify' ]);
    op.then(function (res) { cb(null, res) });
    op.catch(function (err) { cb(err) });
}
