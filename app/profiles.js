var Table = require('./table.js');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var hyperglue = require('hyperglue');

module.exports = Profiles;
inherits(Profiles, EventEmitter);

function Profiles (elem) {
    if (!(this instanceof Profiles)) return new Profiles(elem);
    EventEmitter.call(this);
    
    this.table = new Table(elem);
    this.template = this.table.element.querySelector('*[template=profile]');
}

Profiles.prototype.add = function (pair) {
    var self = this;
    var tr = hyperglue(self.template.cloneNode(true), {
        '.name': pair.name,
        '.hash': pair.hash
    });
    tr.style.display = 'table-row';
    tr.querySelector('button.remove').addEventListener('click', remove);
    
    this.table.add(pair.name, tr);
    return tr;
    
    function remove () {
        if (!confirm(
            'Removing a keypair could lock you out of access to services'
            + " you've previously authenticated with.\n"
            + "Click OK if you're really sure you want to remove this keypair."
        )) return; // for now
        
        self.emit('remove', pair);
    }
};

Profiles.prototype.remove = function (pair) {
    this.table.remove(pair.name);
};
