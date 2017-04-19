//iso639-3
const fs = require('fs');
const nhx = require('nhx.js');
const missing = require('../resources/glottolog.org/missing.json');

const rm = require('../resources/glottolog.org/resourcemap.json');
let nw = (fs.readFileSync('./data/resources/glottolog.org/tree-glottolog-newick.txt', 'utf8') + '\n' + missing._).split('\n');
nw = '(' + nw.join(',') + ')';
nw = nhx.parse(nw);

function find(node, cb, status = {path: []}, level = 0) {
    (node.branchset || []).forEach(d => {
        if (status.end) {
            return;
        }

        status.path.push(d);

        if (cb(d)) {
            status.end = true;
            status.item = d;
        } else {
            find(d, cb, status, level + 1);
        }

        if (!status.end) {
            status.path.pop();
        }
    });

    return status;
}

module.exports = function (iso3) {
    let f = rm.resources.filter(d => d.identifiers.filter(d => (d.type === 'iso639-3' && d.identifier === iso3)).length);

    const id = f.length ? f[0].id : missing[iso3];

    let d = find(nw, d => (d.name || '').indexOf('[' + id + ']') > -1);

    d.path = d.path.filter(d => d.name);

    if (d.path.length) {
        d.path[d.path.length - 1].iso3 = iso3;

        return d.path.map(d => {
            let m = /'([^\[]+) \[([^\]]+)]/gi.exec(d.name);

            if (!m) {
                console.error(d);
            } else {
                let ff = rm.resources.filter(d => d.id === m[2])[0];
                console.log(ff);
                return {id: m[2], name: m[1], iso3: d.iso3, geo: (ff && (ff.latitude !== null)) ? [ff.latitude, ff.longitude] : null};
            }
        });
    } else {
        return null;
    }
};
