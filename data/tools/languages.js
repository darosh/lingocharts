const wex = require('../resources/wikipedia.org/extinct-languages.json');

const extinctedSource = 'https://en.wikipedia.org/wiki/List_of_languages_by_time_of_extinction';

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
        title: 'Declaration of Human Rights',
        num: 502,
        parentId: 'living',
        source: 'http://www.ohchr.org/EN/UDHR/Pages/SearchByLang.aspx',
        usage: true
    },
    {
        id: 'bible',
        title: 'Bible',
        num: 636,
        source: 'https://en.wikipedia.org/wiki/Bible_translations',
        usage: true
    },
    {
        id: 'newTestament',
        title: 'New Testament',
        num: 636 + 1442,
        source: 'https://en.wikipedia.org/wiki/Bible_translations',
        parentId: 'bible',
        usage: true
    },
    {
        id: 'win10',
        title: 'Windows 10',
        num: 111,
        source: 'https://en.wikipedia.org/wiki/Windows_10',
        usage: true
    },
    {
        id: 'android',
        title: 'Android',
        num: 100,
        source: 'https://en.wikipedia.org/wiki/Android_(operating_system)',
        usage: true
    },
    {
        id: 'ios',
        title: 'iOS',
        num: 40,
        source: 'https://en.wikipedia.org/wiki/IOS',
        usage: true
    },
    {
        id: 'extinct2050',
        title: 'Extinct by 2050',
        num: Math.round(7000 * 0.9),
        year: 2050,
        parentId: 'living',
        extinct: true,
        future: true,
        source: 'https://en.wikipedia.org/wiki/Extinct_language'
    },
    {
        id: 'sign',
        title: 'Sign',
        num: 137,
        source: 'https://en.wikipedia.org/wiki/Sign_language',
        usage: true
    },
    {
        id: 'spurious',
        title: 'Retired',
        num: 318,
        source: 'https://en.wikipedia.org/wiki/Spurious_languages',
        usage: true
    },
    {
        id: 'living2050',
        title: 'Living by 2050',
        num: Math.round(7000 * 0.1),
        year: 2050,
        parentId: 'living',
        future: true,
        usage: true,
        source: 'https://en.wikipedia.org/wiki/Extinct_language'
    },
    {
        id: 'extincted',
        source: extinctedSource
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

Object.keys(years).forEach((d, i) => {
    module.exports.push({
        id: 'extinct' + d,
        num: years[d],
        year: parseInt(d),
        parentId: 'extincted',
        extinct: true,
        source: !i ? extinctedSource : undefined,
        title: !i ? 'Extincted' : undefined
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
