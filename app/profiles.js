var Table = require('./table.js');

module.exports = Profiles;

function Profiles (elem) {
    if (!(this instanceof Profiles)) return new Profiles(elem);
    this.table = new Table(elem);
}

Profiles.prototype.add = function (name, pair) {
    /*
    var buttons = document.createElement('div');
    buttons.className = 'buttons';
    [ 'edit', 'delete' ].forEach(function (action) {
        var b = document.createElement('button');
        b.textContent = action;
        buttons.appendChild(b);
    });
    this.table.add([ name, pair.hash, buttons ]);
    */
    this.table.add(name, [ name, pair.hash ]);
};
