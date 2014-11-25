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

(function () {
    var hboot = require('hyperboot/rpc');
    var elems = document.querySelectorAll('.configure-versions');
    for (var i = 0; i < elems.length; i++) {
        elems[i].addEventListener('click', function (ev) {
            hboot.toggle()
        });
    }
})();

var bus = require('page-bus')();
var level = require('level-browserify');
var db = level('keybear', { valueEncoding: 'json' });
var has = require('has');

var keys = require('./keys.js')(db, bus, subtle);
var apps = require('./apps.js')(db, bus);

var rpc = window.parent !== window
    ? require('./rpc.js')({
        origin: document.referrer,
        bus: bus,
        apps: apps,
        keys: keys,
        subtle: subtle
    })
    : null
;

bus.on('approve', function (req) {
    requests.remove(req);
    approved.add(req);
});

bus.on('revoke', function (app) {
    approved.remove(app);
});

bus.on('reject', function (req) {
    requests.remove(req);
});

bus.on('request', function (req) {
    requests.add(req);
});

bus.on('remove', function (pair) {
    profiles.remove(pair);
});

var profiles = require('./profiles.js')('#settings table.profiles');
profiles.on('remove', function (pair) {
    keys.remove(pair);
});

var requests = require('./requests.js')('#settings table.requests');
requests.on('approve', function (req) {
    apps.approve(req, 'default');
});

requests.on('reject', function (req) {
    apps.reject(req);
});

var approved = require('./approved.js')('#settings table.approved');
approved.on('revoke', function (app) {
    apps.revoke(app);
});

apps.requests(function (err, reqs) {
    reqs.forEach(function (req) { requests.add(req) });
});

apps.approved('default', function (err, xapps) {
    xapps.forEach(function (x) { approved.add(x) });
});

keys.list(function (err, profs) {
    if (err) {
        console.error(err);
    }
    else if (profs.length === 0) {
        showSplash();
    }
    else {
        profs.forEach(function (p) {
            profiles.add(p);
        });
        showSettings();
    }
});

function showSettings () {
    var settings = document.querySelector('#settings');
    classList(settings).add('show');
    keys.load('default', function (err, keypair) {
        //console.log(keypair.public);
        //console.log(keypair.private);
    });
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
        
        var name = 'default';
        keys.generate(name, function (err, keypair) {
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
                profiles.add(keypair);
            }
        });
    });
}
