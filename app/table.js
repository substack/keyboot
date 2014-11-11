module.exports = Table;

function Table (elem) {
    if (!(this instanceof Table)) return new Table(elem);
    if (typeof elem === 'string') elem = document.querySelector(elem);
    this.element = elem;
}

Table.prototype.add = function (row) {
    var tr = document.createElement('tr');
    for (var i = 0; i < row.length; i++) {
        var r = row[i];
        var td = document.createElement('td');
        if (typeof r === 'string') td.textContent = r;
        else if (r.text) td.textContent = r.text;
        else if (r.html) td.innerHTML = r.html;
        else td.appendChild(r);
        tr.appendChild(td);
    }
    this.element.appendChild(tr);
};
