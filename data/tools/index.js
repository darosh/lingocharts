const cfg = {
    skipHome: false,
    skipPopulation: false,
    skipSmallPopulation: false,
    skipUnofficial: true
};

const d3 = require('d3-dsv');
const fs = require('fs');
const path = require('path');
const _stringify = require('json-stringify-pretty-compact');

const sil = require('./sil');
const glot = require('./glot');

const worldData = require('../map.data.json');

const namesTerritories = require('cldr-localenames-full/main/en/territories.json').main.en.localeDisplayNames.territories;
const namesLanguages = require('cldr-localenames-full/main/en/languages.json').main.en.localeDisplayNames.languages;
const namesScripts = require('cldr-localenames-full/main/en/scripts.json').main.en.localeDisplayNames.scripts;
const namesLocale = require('cldr-localenames-full/main/en/localeDisplayNames.json').main.en.localeDisplayNames;
const territoryInfo = require('cldr-core/supplemental/territoryInfo.json').supplemental.territoryInfo;
const territoryContainment = require('cldr-core/supplemental/territoryContainment.json').supplemental.territoryContainment;
// const languageData = require('cldr-core/supplemental/languageData.json');
const plurals = require('cldr-core/supplemental/plurals.json').supplemental['plurals-type-cardinal'];
const currencyData = require('cldr-core/supplemental/currencyData.json').supplemental.currencyData.region;
const ordinals = require('cldr-core/supplemental/ordinals.json').supplemental['plurals-type-ordinal'];
const likelySubtags = require('cldr-core/supplemental/likelySubtags.json');
const availableLocales = require('cldr-core/availableLocales.json').availableLocales.full;
const defaultContent = require('cldr-core/defaultContent.json').defaultContent;
const scriptMetadata = require('cldr-core/scriptMetadata.json').scriptMetadata;
const parentLocales = require('cldr-core/supplemental/parentLocales.json').supplemental.parentLocales.parentLocale;
const numberingSystems = require('cldr-core/supplemental/numberingSystems.json').supplemental.numberingSystems;

const cellUsers = require('../resources/worldbank.org/cell-users.json');
const netUsers = require('../resources/worldbank.org/net-users.json');
const isoScript = require('../resources/wikipedia.org/iso-script.json')[0];

const version = require('./version');

const country = {};
const map = {};
let language = {};
let status = [];
// let economy = {};
let form = ['zero', 'one', 'two', 'few', 'many', 'other'];

const dicLanguage = {};
let dicPlural = [];
let dicOrdinal = [];
let dicQuot = [];
let dicFamily = {};
let dicChar = {};
let dicScript = {};
let dicNum = {};
let dicCldr = {};
let dicParent = {};

makeMap();
makeCountry();
makeLanguage();
makeScript();
makeChar();
let containment = getContainment();
Object.keys(dicPlural).forEach(k => delete dicPlural[k].json);
Object.keys(dicOrdinal).forEach(k => delete dicOrdinal[k].json);
makeParent();
makeCldr();
log();
save({
    version: version,
    count: {
        country: Object.keys(country).length,
        language: Object.keys(language).filter(d => d.indexOf('-') === -1).length,
        'language-script': Object.keys(language).length,
        'language-likely': Object.keys(language).filter(l => language[l].likely).length,
        cldr: Object.keys(dicCldr).length,
        'cldr-parent': Object.keys(dicParent).length,
        group: Object.keys(containment).length,
        script: Object.keys(dicScript).length,
        family: Object.keys(dicFamily).length,
        plural: Object.keys(dicPlural).length,
        ordinal: Object.keys(dicOrdinal).length,
        char: (s = 0, Object.keys(dicChar).forEach(d => s += dicChar[d].length), s),
        map: Object.keys(map).length
    },
    country: country,
    language: language,
    group: containment,
    // economy: economy,
    form: form,
    plural: dicPlural,
    ordinal: dicOrdinal,
    status: status,
    family: dicFamily,
    script: dicScript,
    num: dicNum,
    quot: dicQuot,
    char: dicChar,
    // cldr: dicCldr,
    map: map
}, process.argv[2]);

function log() {
    console.log('map teritories: ' + worldData.length);
    console.log('teritories: ' + Object.keys(territoryInfo).length);
    console.log('teritory names: ' + Object.keys(namesTerritories).filter(d => d.indexOf('-') === -1 && isNaN(parseInt(d))).length);
    console.log('extra teritory names: ' + Object.keys(namesTerritories).filter(d => d.indexOf('-') === -1 && isNaN(parseInt(d))).filter(d => {
            return !Object.keys(containment).filter(e => {
                return containment[e].contains.indexOf(d) > -1;
            }).length;
        }));
}

function makeCldr() {
    Object.keys(country).forEach(c => Object.keys(country[c].language || {}).forEach(l => {
        if (country[c].language[l].cldr) {
            dicCldr[country[c].language[l].cldr] = true;
        }
    }));

    Object.keys(language).forEach(k => language[k].cldr = (cldr(k) === k));
}

function makeParent() {
    Object.keys(country).forEach(c => Object.keys(country[c].language || {}).forEach(l => {
        if (country[c].language[l].cldr) {
            if (country[c].language[l].parent === 'root') {
                dicParent[country[c].language[l].cldr.split('-')[0]] = true;
            } else if (country[c].language[l].parent) {
                dicParent[country[c].language[l].parent] = true;
            } else {
                dicParent[country[c].language[l].cldr] = true;
            }
        }
    }));
}

function makeCountry() {
    Object.keys(territoryInfo).forEach(iso_a2 => {
        if (iso_a2 === 'ZZ') {
            return;
        }

        let ti = territoryInfo[iso_a2];
        let lp = getLanguagePopulation(ti.languagePopulation, iso_a2);
        lp = lp[0];

        if (!lp) {
            console.error('missing languagePopulation: ' + iso_a2);

            if (cfg.skipPopulation) {
                return;
            } else {
                lp = null;
            }
        }

        let pop = numOrZero(ti._population);

        if (cfg.skipSmallPopulation && (pop < 1000)) {
            console.error('small population: ' + iso_a2 + pop);
            return;
        }

        let net = netUsers[1].filter(d => d.country.id === iso_a2)[0] || null;
        let cell = cellUsers[1].filter(d => d.country.id === iso_a2)[0] || null;

        Object.keys(lp || {}).forEach(d => dicLanguage[d] = true);

        country[iso_a2] = {
            name: namesTerritories[iso_a2] || null,
            likely: likelySubtags.supplemental.likelySubtags['und-' + iso_a2],
            // color: geo.mapcolor7,
            population: pop,
            gdp: numOrZero(ti._gdp),
            literacy: numOrZero(ti._literacyPercent),
            net: net && net.value ? numFixed(numOrZero(net.value)) : null,
            cell: cell && cell.value ? numFixed(numOrZero(cell.value)) : null,
            language: lp,
            currency: Object.keys((currencyData[iso_a2] || [])
                    .filter(k => k[Object.keys(k)[0]]._from && !k[Object.keys(k)[0]]._to)[0] || {})[0] || null
        };
    });
}

function makeLanguage() {
    Object.keys(dicLanguage).sort().forEach(k => {
        let j = k.replace(/-.*/gi, '');
        // let sc = languageData.supplemental.languageData[j];
        let parts = k.split('-');

        // if (!sc) {
        //     sc = {_scripts: null}
        // }

        let miscChars;
        let miscDelim;
        let miscNum;
        let miscKey;

        let fm = getFamily(j);

        language[k] = {
            name: namesLanguages[k]
            || namesLanguages[j]
            || fm.name,
            iso3: fm.iso3,
            gl: fm.gl,
            family: fm.fm,
            likely: likelySubtags.supplemental.likelySubtags[k],
            script: parts[1] ? parts[1] : likelySubtags.supplemental.likelySubtags[j] ? likelySubtags.supplemental.likelySubtags[j].split('-')[1] : null,
            plural: plurals[j] ? getPluralsGroup(j) : null,
            ordinal: getOrdinalsGroup(j)
        };

        if (language[k].script) {
            dicScript[language[k].script] = dicScript[language[k].script] || {};

            if (availableLocales.indexOf(j + '-' + language[k].script) > -1) {
                miscKey = j + '-' + language[k].script;
                miscChars = require('cldr-misc-full/main/' + j + '-' + language[k].script + '/characters.json');
                miscDelim = require('cldr-misc-full/main/' + j + '-' + language[k].script + '/delimiters.json');
                miscNum = require('cldr-numbers-full/main/' + j + '-' + language[k].script + '/numbers.json');
            } else if (availableLocales.indexOf(j) > -1) {
                let lik = likelySubtags.supplemental.likelySubtags[j];

                if (lik && (lik.split('-')[1] === language[k].script)) {
                    miscKey = j;
                    miscChars = require('cldr-misc-full/main/' + j + '/characters.json');
                    miscDelim = require('cldr-misc-full/main/' + j + '/delimiters.json');
                    miscNum = require('cldr-numbers-full/main/' + j + '/numbers.json');
                }
            }

            if (miscKey) {
                language[k].num = miscNum.main[miscKey].numbers.defaultNumberingSystem;
                dicNum[language[k].num] = dicNum[language[k].num] || getNum(language[k].num);
                dicChar[language[k].script] = dicChar[language[k].script] || [];
                language[k].chars = index(dicChar[language[k].script], miscChars ? miscChars.main[miscKey].characters.exemplarCharacters.substring(1, miscChars.main[miscKey].characters.exemplarCharacters.length - 1).replace(/\\u([0-9a-z]{4})/gi, a => String.fromCharCode(parseInt(a.substring(2), 16))) : null);
                let d = miscDelim.main[miscKey].delimiters;
                language[k].quot = index(dicQuot, d.quotationStart + d.quotationEnd + d.alternateQuotationStart + d.alternateQuotationEnd);
            } else {
                language[k].chars = null;
                language[k].quot = null;
            }
        }

        let t = getPopulation(k);
        language[k].population = t[0];
        language[k].literacy = t[1];
    });
}

function makeChar() {
    Object.keys(dicChar).forEach(s => {
        dicChar[s] = dicChar[s].map(c => {
            let cn = 0;
            let parts = c.split(' ');

            parts.forEach(p => {
                cn += p.indexOf('-') === -1 ? 1 : ((p.charCodeAt(2) - p.charCodeAt(0)) + 1);
            });

            return {
                chars: c,
                count: cn
            }
        });
    });
}

function makeScript() {
    Object.keys(dicScript).forEach(k => {
        let m = scriptMetadata[k] || {};

        Object.assign(dicScript[k], {
            name: namesScripts[k],
            rtl: m.rtl === 'YES',
            cased: m.hasCase === 'YES',
            lbl: m.lbLetters === 'YES',
            ime: m.ime === 'YES',
            density: m.density,
            country: m.originCountry,
            language: m.likelyLanguage,
            sample: m.sampleChar,
            chars: parseInt(isoScript.filter(d => d[0] === k)[0][6].replace(/,/g, ''), 10)
        });
    });
// dicChar.sort();
// dicChar.sort((a, b) => new Levenshtein(a.replace(/ /g, ''), b.replace(/ /g, '')).distance);
}

function getPopulation(k) {
    let pop = 0;
    let lit = 0;

    Object.keys(country).forEach(c => Object.keys(country[c].language || {}).filter(l => l === k).forEach(l => {
            let po = country[c].population || 0;
            let li = country[c].literacy || 100;

            po *= (country[c].language[l].percent || 100) / 100;
            pop += po;
            li = country[c].language[l].literacy || li;
            lit += po * (li / 100);
        })
    );

    return [Math.ceil(pop), numFixed(100 * lit / pop)];
}

function getNum(k) {
    return {
        name: namesLocale.types.numbers[k],
        rules: numberingSystems[k]._rules,
        type: numberingSystems[k]._type,
        digits: numberingSystems[k]._digits
    }
}

function getScript(k) {
    let parts = k.split('-');
    let j = parts[0];
    return parts[1] ? parts[1] : likelySubtags.supplemental.likelySubtags[j] ? likelySubtags.supplemental.likelySubtags[j].split('-')[1] : null;
}

function cldr(lang, country) {
    if (!country) {
        if (availableLocales.indexOf(lang) > -1) {
            return lang;
        } else {
            console.error('not available' + lang);
            return null;
        }
    } else if (defaultContent.indexOf(lang + '-' + country) > -1 || defaultContent.indexOf(lang + '-' + getScript(lang) + '-' + country) > -1) {
        return lang;
    } else if (availableLocales.indexOf(lang + '-' + country) > -1) {
        return lang + '-' + country;
    } else {
        return null;
    }
}

function clean(obj, fields = {}, n, level) {
    const propNames = Object.getOwnPropertyNames(obj);

    propNames.forEach((name) => {
        const prop = obj[name];

        if (level > 1 && parseInt(name).toString() !== name) {
            if (['language'].indexOf(n) === -1) {
                fields[name] = true;
            }
        }

        if (typeof prop === 'object' && prop !== null) {
            clean(prop, fields, name, (level || 0) + 1);
        } else if (prop === null) {
            delete obj[name];
        }
    });

    return Object.keys(fields);
}

function index(dic, val) {
    if (!val) {
        return val;
    }

    let i = dic.indexOf(val);

    if (i === -1) {
        i = dic.length;
        dic.push(val);
    }

    return i;
}

function getFamily(kk) {
    let j = kk.replace(/-.*/, '');

    const iso3 = j.length === 3 ? j : sil(j);

    if (!iso3) {
        console.error(j, iso3);
    }

    let f = glot(iso3);

    if (!f) {
        // dicFamily.push(null);
        console.error(kk, f && f[0].name);
        return null;
    } else {
        f.forEach((d, i) => {
            dicFamily[d.id] = dicFamily[d.id] || {};
            dicFamily[d.id].name = d.name;
            dicFamily[d.id].geo = d.geo;
            dicFamily[d.id].parent = i > 0 ? f[i - 1].id : null
        });

        dicFamily[f[f.length - 1].id].iso23 = j;
        dicFamily[f[f.length - 1].id].iso3 = iso3;

        return {gl: f[f.length - 1].id, iso3: iso3, fm: f[0].id, name: f[f.length - 1].name};
    }
}

function getPluralsData(j) {
    return Object.keys(plurals[j]).map(d => d.replace(/.*-/, '')).map(d => form.indexOf(d));
}

function getPluralsGroup(j) {
    let k = JSON.stringify(plurals[j]);
    let i = dicPlural.indexOf(dicPlural.filter(d => d.json === k)[0]);

    if (i < 0) {
        i = dicPlural.length;
        dicPlural.push({
            forms: getPluralsData(j),
            json: k
        });
    }

    return i;
}

function getOrdinalsGroup(j) {
    if (!ordinals[j]) {
        return null;
    }

    let k = JSON.stringify(ordinals[j]);
    let i = dicOrdinal.indexOf(dicOrdinal.filter(d => d.json === k)[0]);

    if (i < 0) {
        i = dicOrdinal.length;
        dicOrdinal.push({
            forms: getPluralsData(j),
            json: k
        });
    }

    return i;
}

function numOrZero(t) {
    let n = parseFloat(t, 10);
    return n < 0 ? 0 : n;
}

function numFixed(n) {
    return parseFloat(n.toPrecision(3));
}

function getLanguagePopulation(lp, iso) {
    let r = null;
    let sum = 0;

    Object.keys(lp || {}).forEach(k => {
        if (cfg.skipUnofficial && lp[k]._officialStatus || !cfg.skipUnofficial) {
            r = r || {};
            let p = numOrZero(lp[k]._populationPercent);
            sum += p;
            let n = k.replace(/_/g, '-');
            let st = status.indexOf(lp[k]._officialStatus);

            if (st === -1) {
                st = status.length;
                status.push(lp[k]._officialStatus);
            }

            r[n] = {
                percent: p,
                literacy: lp[k]._literacyPercent ? numOrZero(lp[k]._literacyPercent) : undefined,
                status: st,
                cldr: cldr(n, iso),
                parent: parentLocales[cldr(n, iso)] || null
            }
        }
    });

    return [r, sum];
}

function getContainment() {
    let l = territoryContainment;
    let r = {};

    Object.keys(l).forEach(d => {
        if (d.indexOf('-') >= 0) {
            return;
        }

        r[d] = {
            name: namesTerritories[d] || null,
            root: d === '001' ? true : undefined,
            group: (l[d]._grouping && !parseInt(d, 10)) || d === '419' ? true : undefined,
            likely: likelySubtags.supplemental.likelySubtags['und-' + d] || likelySubtags.supplemental.likelySubtags['und'],
            /*
             contains: l[d]._contains.filter(d => {
             let h = Object.keys(country).filter(e => {
             return country[e].a2 === d;
             }).length || (parseInt(d, 10) > 0);

             if (!h) {
             // console.error('skipping containment: ' + d);
             }

             return h;
             })
             */
            contains: l[d]._contains
        }
    });

    return r;
}

function save(obj, dir) {
    obj.fields = clean(obj).sort();

    Object.keys(obj).forEach(k => {
        fs.writeFile(path.join(dir, k + '.json'), stringify(obj[k], null, 2));
        fs.writeFile(path.join(dir, k + '.tsv'), d3.tsvFormat(Array.isArray(obj[k])
            ? obj[k].map(d => (typeof d === 'string') ? {value: d} : d)
            : toRows(obj[k])));
    });

    fs.writeFile(path.join(dir, 'index.json'), stringify(obj, null, 2));
}

function toRows(o) {
    const r = [];

    Object.keys(o).forEach(d => {
        let i;

        if (typeof o[d] !== 'object') {
            i = {
                value: o[d]
            };
        } else {
            i = o[d];
        }

        i.id = d;

        if (Array.isArray(i)) {
            i.forEach((j, n) => {
                let k = Object.assign({id: i.id, index: n}, j);
                r.push(k);
            });
        } else {
            i = Object.assign({}, i);

            Object.keys(i).forEach(k => {
                if (!Array.isArray(i[k]) && typeof i[k] === 'object') {
                    i[k] = JSON.stringify(i[k]);
                }
            });

            r.push(i);
        }
    });

    return r;
}

function stringify(o) {
    return _stringify(o, {maxLength: 100});
}

function makeMap() {
    worldData.forEach(geo => {
        Object.keys(geo).forEach(k => geo[k.toLowerCase()] = geo[k]);

        if (cfg.skipHome && (geo.homepart !== '1')) {
            console.error('skipping non home: ' + geo.iso_a2 + ' / ' + geo.iso_n3 + ' / ' + geo.name_long);
            return;
        }

        // let eco = parseInt(geo.economy);

        // economy[eco] = geo.economy;

        map[geo.iso_a2] = {
            // a2: geo.iso_a2,
            // n3: geo.iso_n3,
            // type: geo.type,
            // name: namesTerritories[geo.iso_a2] || null,
            // name: geo.name,
            // name_long: geo.name_long,
            // continent: geo.continent,
            // subregion: geo.subregion,
            color: geo.mapcolor7,
            // rank: geo.scalerank,
            // income: geo.income_grp,
            // economy: eco,
            // pop_est: numOrZero(geo.pop_est),
            // gdp_md_est: numOrZero(geo.gdp_md_est),
        };
    });
}
