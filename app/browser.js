var gen = require('./lib/gen.js');

(function () {
    var opts = {
        numBits: 4096,
        userId: 'User Name <username@example.com>',
        passphrase: 'whatever...'
    };
    gen(opts, function (err, keypair) {
        console.log(keypair);
        window.keypair = keypair;
    });
})();
