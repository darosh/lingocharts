const wex = require('../resources/wikipedia.org/extinct-languages.json');

module.exports = [
    {
        id: 'total'
    },
    {
        id: 'living',
        title: 'Living languages',
        num: 7000,
        parentId: 'total',
    },
    {
        id: 'udhr',
        title: 'The Universal Declaration of Human Rights',
        num: 502,
        parentId: 'living',
        source: 'http://www.ohchr.org/EN/UDHR/Pages/SearchByLang.aspx'
    },
    {
        id: 'bible',
        num: 636,
        source: 'https://en.wikipedia.org/wiki/Bible_translations'
    },
    {
        id: 'newTestament',
        num: 636 + 1442,
        source: 'https://en.wikipedia.org/wiki/Bible_translations',
        parentId: 'bible'
    },
    {
        id: 'win10',
        num: 111,
        source: 'https://en.wikipedia.org/wiki/Windows_10'
    },
    {
        id: 'android',
        num: 100,
        source: 'https://en.wikipedia.org/wiki/Android_(operating_system)'
    },
    {
        id: 'ios',
        num: 40,
        source: 'https://en.wikipedia.org/wiki/IOS'
    },
    {
        id: 'extinct2050',
        title: 'Extinct by 2050',
        num: Math.round(7000 * 0.9),
        year: 2050,
        parentId: 'living',
        extinct: true,
        source: 'https://en.wikipedia.org/wiki/Extinct_language'
    },
    {
        id: 'extincted'
    }
];

let all = [];

wex.forEach((d, i) => {
    if (Array.isArray(d)) {
        Array.prototype.push.apply(all, d.filter((d, i) => i > 0).map(d => getYear(d[0])));
    }
});

let years = {};

all.forEach(d => {
    let cent = Math.round(d[0] / 100) * 100;
    years[cent] = years[cent] || 0;
    years[cent]++;
});

Object.keys(years).forEach(d => {
    module.exports.push({
        id: 'extinct' + d,
        num: years[d],
        year: parseInt(d),
        parentId: 'extincted',
        extinct: true
    });
});

function getYear(t) {
    let m = /(\d{3,4}) BCE/.exec(t);

    if (m) {
        return [-parseInt(m[1]), t];
    }

    m = /\d{4}/.exec(t);

    if (m) {
        return [parseInt(m[0]), t];
    }

    m = /(\d+)(st|nd|rd|th) century BCE/.exec(t);

    if (m) {
        return [(parseInt(m[1])) * -100, t];
    }

    m = /(\d+)(st|nd|rd|th) century/.exec(t);

    if (m) {
        return [(parseInt(m[1]) - 1) * 100, t];
    }

    m = /\d{3}/.exec(t);

    if (m) {
        return [parseInt(m[0]), t];
    }

    m = /(\d+)(st|nd|rd|th) millennium BCE/.exec(t)
    if (m) {
        return [parseInt(m[1]) * -1000, t];
    }

    console.error('unknown year: ', t);

    return t;
}
