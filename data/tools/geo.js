const map = require('../map.json');
const country = require('../country.json');

Object.keys(country).forEach(k => {
    if (!map[k]) {
        const js = {
            type: 'Feature',
            geometry: {
                type: Array.isArray(country[k].geo[0]) ? 'MultiPoint' : 'Point',
                coordinates: Array.isArray(country[k].geo[0])
                    ? country[k].geo.map(d => d.reverse())
                    : country[k].geo.reverse()
            },
            id: k
        };

        console.log(JSON.stringify(js));
    }
});
