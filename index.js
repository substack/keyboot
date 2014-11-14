var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var defined = require('defined');

module.exports = KB;
inherits(KB, EventEmitter);

function KB (href, opts) {
    var self = this;
    if (!(this instanceof KB)) return new KB(href, opts);
    EventEmitter.call(this);
    if (!opts) opts = {};
    
    var perms = defined(opts.permissions, []);
    this.sequence = 0;
    
    var seq = this.sequence;
    this.frame = createIframe(href, function (frame) {
        var request = {
            sequence: seq,
            action: 'request',
            permissions: perms
        };
        frame.contentWindow.postMessage(
            'keyboot!' + JSON.stringify(request), href
        );
    });
    
    window.addEventListener('message', function (ev) {
        if (!/^keyboot!/.test(ev.data)) return;
        try { var data = JSON.parse(ev.data.replace(/^keyboot!/, '')) }
        catch (err) { return }
        if (data.sequence !== seq) return;
        
        if (data.response === 'approved') {
            self.emit('approve');
        }
        else if (data.response === 'rejected') {
            self.emit('reject');
        }
        else if (data.response === 'pending') {
            self.emit('pending');
        }
        else if (data.response === 'revoke') {
            self.emit('revoke');
        }
    });
}

KB.prototype.sign = function (cb) {
    // todo
};

KB.prototype.id = function (cb) {
    // todo
};

KB.prototype.close = function () {
    document.body.removeChild(this.frame);
    this.emit('close');
};

function createIframe (src, cb) {
    var iframe = document.createElement('iframe');
    iframe.addEventListener('load', function () {
        cb(iframe);
    });
    iframe.setAttribute('src', src);
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    return iframe;
}
