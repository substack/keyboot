var Table = require('./table.js');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var hyperglue = require('hyperglue');

module.exports = Requests;
inherits(Requests, EventEmitter);

function Requests (elem) {
    if (!(this instanceof Requests)) return new Requests(elem);
    EventEmitter.call(this);
    this.table = new Table(elem);
    this.template = this.table.element.querySelector('*[template=request-row]');
}

Requests.prototype.add = function (req) {
    var self = this;
    var tr = hyperglue(self.template.cloneNode(true), {
        '.domain': req.domain,
        '.permissions': JSON.stringify(req.permissions)
    });
    tr.style.display = 'table-row';
    tr.querySelector('.approve').addEventListener('click', function () {
        self.emit('approve', req);
    });
    tr.querySelector('.reject').addEventListener('click', function () {
        self.emit('reject', req);
    });
    self.table.add(req.domain, tr);
};

Requests.prototype.remove = function (req) {
    this.table.remove(req.domain);
};
