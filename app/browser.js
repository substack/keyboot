var Spinner = require('spinner-browserify');
var classList = require('class-list');
var hyperglue = require('hyperglue');
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
var apps = require('./apps.js')(db);

var profiles = require('./profiles.js')('#settings table.profiles')
var requests = require('./table.js')('#settings table.requests')

apps.requests(function (err, reqs) {
    console.log('reqs=', reqs);
    var template = document.querySelector('*[template=request-row]');
    
    reqs.forEach(function (req) {
        var tr = hyperglue(template.cloneNode(true), {
            '.domain': req.domain,
            '.permissions': JSON.stringify(req.permissions)
        });
        tr.style.display = 'table-row';
        tr.querySelector('.approve').addEventListener('click', function () {
            // ...
        });
        tr.querySelector('.reject').addEventListener('click', function () {
            requests.element.removeChild(tr);
            apps.reject(req.domain);
        });
        requests.element.appendChild(tr);
    });
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
    
    if (msg.action === 'request') {
        apps.getStatus(ev.origin, function (err, status) {
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
                apps.saveRequest(msg, ev.origin, function (err) {
                    if (err) console.error(err);
                    reply({
                        sequence: msg.sequence,
                        response: 'pending'
                    });
                });
            }
        });
    }
    
    function reply (res) {
        window.top.postMessage('keyboot!' + JSON.stringify(res), ev.origin);
    }
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
