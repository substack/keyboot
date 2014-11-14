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
    this.href = href;
    
    var seq = this.sequence;
    this.frame = createIframe(href, function (frame) {
        self._post({
            sequence: seq,
            action: 'request',
            permissions: perms
        });
    });
    
    window.addEventListener('message', function (ev) {
        if (!/^keyboot!/.test(ev.data)) return;
        try { var data = JSON.parse(ev.data.replace(/^keyboot!/, '')) }
        catch (err) { return }
        self._onmessage(data);
    });
}

KB.prototype._post = function (request) {
    this.frame.contentWindow.postMessage(
        'keyboot!' + JSON.stringify(request),
        this.href
    );
};

KB.prototype._onmessage = function (data) {
    if (data.sequence === 0) {
        if (data.response === 'approved') {
            this.emit('approve');
        }
        else if (data.response === 'rejected') {
            this.emit('reject');
        }
        else if (data.response === 'pending') {
            this.emit('pending');
        }
        else if (data.response === 'revoke') {
            this.emit('revoke');
        }
        return;
    }
    else this.emit('reply_' + data.sequence, data);
};

KB.prototype.sign = function (text, cb) {
    var seq = ++ this.sequence;
    this.once('reply_' + seq, function (data) {
        if (data.response === 'error') {
            cb(data.message)
        }
        else cb(null, data.result)
    });
    this._post({
        action: 'sign',
        sequence: seq,
        data: text
    });
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
