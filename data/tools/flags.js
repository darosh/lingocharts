const fs = require('fs');
const jsdom = require('jsdom');
const em = require('emojione/emoji.json');
const colors = require('./colors');
const stringify = require('json-stringify-pretty-compact');

let fl = Object.keys(em).filter(k => em[k].category === 'flags');
let svgs = [];
let sims = [];

fl.sort((a, b) => a.localeCompare(b));

let size = 64;
let ratio = 1.33;
let cols = Math.ceil(Math.sqrt(fl.length) * ratio);
let rows = Math.ceil(fl.length / cols);

// console.error(fl.length + ' flags: ' + fl.map(k => k.replace(/flag_/, '')).join(', '));

fl.forEach((k, i) => {
    fs.readFile(require.resolve('emojione/assets/svg/' + em[k].unicode + '.svg'), 'utf8', (err, svg) => {
        jsdom.env(
            svg,
            (err, window) => {
                let col = i % cols;
                let row = Math.floor(i / cols);
                let iso = k.replace(/flag_/, '');
                let el = window.document.createElement('g');
                let sim = el.innerHTML = window.document.querySelector('svg').innerHTML;
                el.setAttribute('id', '-flag');
                el.setAttribute('transform', 'translate(' + [col * size, row * size] + ')');
                sims.push({
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="64" height="64">' + sim + '</svg>',
                    id: iso.toUpperCase()
                });
                svgs.push(el.outerHTML
                    .replace(/id="([^"]+)"/g, 'id="' + iso.toUpperCase() + '$1"')
                    .replace(/id="([^"]+)-flag"/g, 'id="$1"')
                    .replace(/url\(#([^\)]+)\)/g, 'url(#' + iso.toUpperCase() + '$1)'));

                if (fl.length === svgs.length) {
                    loaded();
                }
            }
        );
    });
});

function loaded() {
    jsdom.env(
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>',
        (err, window) => {
            let svg = window.document.querySelector('svg');
            svg.setAttribute('width', size * cols);
            svg.setAttribute('height', size * rows);
            svg.innerHTML = '\n' + svgs.join('\n') + '\n';
            console.log('<?xml version="1.0" encoding="UTF-8"?>\n' + svg.outerHTML);
            colors(sims, c => fs.writeFileSync('data/resources/flag-colors.json', stringify(c, {maxLength: 100})));
        }
    );
}
