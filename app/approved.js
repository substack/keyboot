var Table = require('./table.js');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var hyperglue = require('hyperglue');

module.exports = Approved;
inherits(Approved, EventEmitter);

function Approved (elem) {
    if (!(this instanceof Approved)) return new Approved(elem);
    EventEmitter.call(this);
    this.table = new Table(elem);
    this.template = this.table.element.querySelector('*[template=approved]');
}

Approved.prototype.add = function (app) {
    var self = this;
    var tr = hyperglue(self.template.cloneNode(true), {
        '.domain': app.domain,
        '.permissions': JSON.stringify(app.permissions),
        '.profile select': { selected: app.profile }
    });
    tr.style.display = 'table-row';
    tr.querySelector('button.remove').addEventListener('click', function () {
        self.emit('remove', app);
    });
    self.table.add(app.domain, tr);
};

Approved.prototype.remove = function (req) {
    this.table.remove(req.domain);
};
