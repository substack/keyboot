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

var bus = require('page-bus')();
var level = require('level-browserify');
var db = level('keybear', { valueEncoding: 'json' });

var keys = require('./keys.js')(db, subtle);
var apps = require('./apps.js')(db, bus);

bus.on('approve', function (req) {
console.log('APPROVE', req);
    requests.remove(req.domain);
    approved.add(req.domain, [ req.domain ]);
});

bus.on('reject', function (req) {
console.log('REJECT');
    requests.remove(req);
});

bus.on('request', function (req) {
console.log('REQUEST', req);
    requests.add(req.domain, req);
    apps.reject(req.domain);
});

var profiles = require('./profiles.js')('#settings table.profiles');
var requests = require('./requests.js')('#settings table.requests');
var approved = require('./table.js')('#settings table.approved');

requests.on('approve', function (req) {
    apps.approve(req, 'default');
});

bus.on('whatever', function (x) {
    console.log('x=', x);
});

requests.on('reject', function (req) {
    apps.reject(req);
});

apps.requests(function (err, reqs) {
    reqs.forEach(function (req) { requests.add(req) });
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
            profiles.add(p.name, p);
        });
        showSettings();
    }
});

if (window.top !== window) {
    window.addEventListener('message', onmessage);
}

function onmessage (ev) {
    if (!/^keyboot!/.test(ev.data)) return;
    try { var msg = JSON.parse(ev.data.replace(/^keyboot!/, '')) }
    catch (err) { return }
    if (!msg || typeof msg !== 'object') return;
    apps.handle(msg, ev.origin);
}

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
                profiles.add(name, keypair);
            }
        });
    });
}
