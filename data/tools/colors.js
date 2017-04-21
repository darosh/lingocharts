var COLORS = 5;

const async = require('async');
const PNG = require('pngjs2').PNG;
const colorgram = require('colorgram');
const svg2png = require('svg2png');
const is = require('into-stream');

module.exports = (apis, done) => {
    var colors = {};
    async.forEachOfLimit(apis, 8, (item, key, callback) => {
        var str = Buffer.from(item.svg, 'utf8');
        svg2png(str).then(b => {
            is(b).pipe(new PNG())
                .on('error', (err) => {
                    console.error(err);
                    callback();
                })
                .on('parsed', function () {
                    colors[item.id] = colorgram.extract({
                        data: this.data,
                        width: this.width,
                        height: this.height,
                        channels: 4
                    }, COLORS).map(d => [c(d), Math.round(d[3] * 100) / 100])/*.filter(d => d[0] !== 'ffffff' && d[0] !== '000000')*//*.filter((a, b) => b < 2)*/;
                    callback();
                });
        });
    }, () => {
        if (done) {
            done(colors);
        }
    });
};

function c(d) {
    return d.filter((a, b) => b < 3).map(d => (d + 256).toString(16).substr(1)).join('');
}
