var has = require('has');

module.exports = Table;

function Table (elem) {
    if (!(this instanceof Table)) return new Table(elem);
    if (typeof elem === 'string') elem = document.querySelector(elem);
    this.element = elem;
    this.rows = {};
}

Table.prototype.add = function (key, row) {
    if (has(this.rows, key)) return this.rows[key];
    
    var tr;
    if (row && typeof row === 'object' && row instanceof HTMLElement) {
        tr = row;
    }
    else {
        tr = document.createElement('tr')
        for (var i = 0; i < row.length; i++) {
            var r = row[i];
            var td = document.createElement('td');
            if (typeof r === 'string') td.textContent = r;
            else if (r.text) td.textContent = r.text;
            else if (r.html) td.innerHTML = r.html;
            else td.appendChild(r);
            tr.appendChild(td);
        }
    }
    this.rows[key] = tr;
    this.element.appendChild(tr);
    return tr;
};

Table.prototype.remove = function (key) {
    if (!has(this.rows, key)) return false;
    this.element.removeChild(this.rows[key]);
    delete this.rows[key];
    return true;
};
