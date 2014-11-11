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

var level = require('level-browserify');
var db = level('keybear', { valueEncoding: 'json' });
var keys = require('./keys.js')(db, subtle);

keys.list(function (err, profiles) {
    if (err) {
        console.error(err);
    }
    else if (profiles.length === 0) {
        showSplash();
    }
    else showSettings();
});

window.addEventListener('postMessage', function (ev) {
    console.log('postMessage=', ev);
});

function showSettings () {
    var settings = document.querySelector('#settings');
    classList(settings).add('show');
    keys.load('default', function (err, keypair) {
        console.log(keypair.public);
        console.log(keypair.private);
    });
}

function showSplash () {
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
        
        keys.generate('default', function (err, keypair) {
            spin.stop();
            busy.removeChild(spin.el);
            if (err) {
                console.log('err=', err);
                msg.textContent = String(err);
            }
            else {
                msg.textContent = 'keypair generated';
            }
        });
    });
}
