const fs = require('fs');

module.exports = {
    cldr: {
        version: require('cldr-core/package.json').version,
        name: 'CLDR - Unicode Common Locale Data Repository',
        home: 'http://cldr.unicode.org/',
        source: 'https://github.com/unicode-cldr/cldr-json',
        notes: 'Primary data source'
    },
    gl: {
        name: 'Glottolog',
        version: '2017-04-16',
        home: 'http://glottolog.org',
        source: 'http://glottolog.org/meta/downloads',
        notes: 'Language families'
    },
    sil: {
        name: 'ISO 639-3 Registration Authority',
        version: '2017-02-02',
        home: 'http://www-01.sil.org/iso639-3/',
        source: 'http://www-01.sil.org/iso639-3/download.asp',
        notes: 'ISO-639-3 language codes'
    },
    wb: {
        version: '2015',
        name: 'The World Bank',
        home: 'https://www.worldbank.org',
        api: ['http://api.worldbank.org/countries/indicators/IT.NET.USER.P2?per_page=300&format=json&date=2015:2015',
            'http://api.worldbank.org/countries/indicators/IT.CEL.SETS.P2?per_page=300&format=json&date=2015:2015'],
        notes: 'Internet and cell prone users'
    },
    wiki: {
        version: require('../resources/wikipedia.org/iso-family.json')[1]._version,
        name: 'Wikipedia',
        home: 'https://www.wikipedia.org',
        source: 'https://en.wikipedia.org/wiki/ISO_15924',
        // https://en.wikipedia.org/wiki/List_of_countries_by_future_population_(United_Nations,_medium_fertility_variant)
        // https://en.wikipedia.org/wiki/List_of_Wikipedias
        notes: 'Character count in scripts'
    },
    ned: {
        version: fs.readFileSync('./data/resources/naturalearthdata.com/ne_110m_admin_0_countries.VERSION.txt', 'utf8'),
        name: 'Natural Earth',
        home: 'http://www.naturalearthdata.com',
        source: 'https://github.com/nvkelso/natural-earth-vector/'
    },
    eo: {
        name: 'Emoji One',
        version: require('emojione/package.json').version,
        home: 'http://emojione.com/',
        source: 'https://github.com/Ranks/emojione',
        notes: 'Country flag icons'
    }
};
