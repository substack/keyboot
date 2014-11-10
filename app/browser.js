var gen = require('./lib/gen.js');
var Spinner = require('spinner-browserify');

var button = document.querySelector('#splash button');
button.addEventListener('click', function (ev) {
    generate();
});

function generate () {
    button.style.display = 'none';
    
    var opts = {
        numBits: 4096,
        userId: 'User Name <username@example.com>',
        passphrase: 'whatever...'
    };
    
    var spin = new Spinner();
    
    var busy = document.querySelector('#splash .busy');
    var msg = document.querySelector('#splash .msg');
    msg.textContent = 'Generating keypair. Please wait.';
    busy.appendChild(spin.el);
    
    gen(opts, function (err, keypair) {
        spin.stop();
        busy.removeChild(spin.el);
        msg.textContent = 'keypair generated';
        console.log('ok...');
    });
}
