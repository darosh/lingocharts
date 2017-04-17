const fs = require('fs');
const dsv = require('d3-dsv');
let p = './data/resources/sil.org';
let files = fs.readdirSync(p);
const data = dsv.tsvParse(fs.readFileSync(p + '/' + files.filter(f => /iso-639-3_\d{8}.tab/.exec(f))[0], 'utf8'));

module.exports = function (iso2) {
    return data.filter(d => d.Part1 === iso2)[0].Id;
};
