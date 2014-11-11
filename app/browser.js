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

var Table = require('./table.js');
var profiles = Table('#settings table.profiles')

keys.list(function (err, profs) {
    if (err) {
        console.error(err);
    }
    else if (profs.length === 0) {
        showSplash();
    }
    else {
        profs.forEach(function (p) {
            profiles.add([ p.name, p.hash ]);
        });
        showSettings();
    }
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

function updateProfiles (profiles) {
}

function showSplash () {
    var splash = document.querySelector('#splash');
    classList(splash).add('show');
    
    var busy = splash.querySelector('.busy');
    var info = splash.querySelector('.info');
    var err = splash.querySelector('.error');
    var success = splash.querySelector('.success');
    var success = splash.querySelector('.success');
    var cont = splash.querySelector('button.continue');
    
    cont.addEventListener('click', function (ev) {
        classList(splash).remove('show');
        showSettings();
    });
    
    var button = splash.querySelector('button');
    button.addEventListener('click', function (ev) {
        button.style.display = 'none';
        
        var spin = new Spinner();
        
        info.textContent = 'Generating 4096-bit keypair. Please wait.';
        busy.appendChild(spin.el);
        
        keys.generate('default', function (err, keypair) {
            spin.stop();
            busy.removeChild(spin.el);
            if (err) {
                console.log('err=', err);
                info.textContent = '';
                error.textContent = '';
                msg.textContent = String(err);
            }
            else {
                info.textContent = '';
                classList(success).remove('hide');
            }
        });
    });
}
