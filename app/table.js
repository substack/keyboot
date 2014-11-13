module.exports = Table;

function Table (elem) {
    if (!(this instanceof Table)) return new Table(elem);
    if (typeof elem === 'string') elem = document.querySelector(elem);
    this.element = elem;
}

Table.prototype.add = function (key, row) {
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
    tr.setAttribute('x-key', key);
    this.element.appendChild(tr);
    return tr;
};

Table.prototype.remove = function (key) {
    var tr = this.element.querySelector('tr[x-key="' + key + '"]');
    if (tr) this.element.removeChild(tr);
};
