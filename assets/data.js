'use strict';

function initData(config) {
    config.land = topojson.feature(config.map, config.map.objects.countries).features;
    config.border = topojson.mesh(config.map, config.map.objects.countries);
    addCountryGroup(config);
    addRank(config);

    config.groups = {
        '001': getGroupTable('001', config.data),
        '419': getGroupTable('419', config.data),
        EU: getGroupTable('EU', config.data),
        EZ: getGroupTable('EZ', config.data),
        UN: getGroupTable('UN', config.data)
    };
}

function addCountryGroup(config) {
    config.data.group['001'].contains.forEach((c, i) => {
        config.data.group[c].contains.forEach((d, j, a) => {
            config.data.group[d].contains.forEach(e => {
                config.data.country[e]._group = [c, d];
                config.data.country[e]._groupValue = [i, j / (a.length - 1)];
            });
        });
    });
}

function addRank(config) {
    const a = 'A'.charCodeAt(0);
    const ms = getMultiScale();

    Object.keys(config.data.language).forEach(k => {
        let r = Math.floor(Math.log(config.data.language[k].population) / Math.LN10 / 2);
        config.data.language[k]._rank = String.fromCharCode(a + r) + Math.min(9, Math.floor(config.data.language[k].literacy / 10));
        config.data.language[k]._rankColor = ms[r](Math.min(9, Math.floor(config.data.language[k].literacy / 10)) / 9);
    })
}

function getGroupTable(code, data) {
    let a = [];

    iter(code, data);

    function iter(code, data, parent = null) {
        a.push({
            id: code,
            parentId: parent
        });

        if (data.group[data.group[code].contains[0]]) {
            (data.group[code] ? data.group[code].contains : []).forEach(d => {
                iter(d, data, code);
            });
        } else {
            a.push({
                id: code + '-group',
                parentId: code,
                group: data.group[code].contains
            });
        }
    }

    a = d3.stratify()(a);

    const b = [];

    a.descendants().forEach(d => {
        if (d.parent) {
            const j = d.depth - 1;
            b[j] = b[j] || [];
            const l = d.leaves();
            d.span = l.length;
            d.items = 0;
            d.expanded = false;
            l.forEach(e => d.items += e.data.group.length);
            b[j].push(d);
        }
    });

    const c = [];
    const ii = [];
    b[b.length - 1].forEach((v, i) => {
        b.forEach((v, j) => {
            ii[j] = ii[j] || 0;
            c[ii[j]] = c[ii[j]] || [];
            c[ii[j]][j] = b[j][i];
            ii[j] += b[j][i] ? b[j][i].span : 0;
        });
    });

    c.items = 0;
    (a.children || []).forEach(e => c.items += e.items);

    return c;
}

function getFlag(iso, flags) {
    let node = flags.getElementById(iso);

    if (node) {
        node = node.cloneNode(true);
        node.removeAttribute('id');
        node.removeAttribute('transform');
        const svg = document.createElementNS(d3.namespaces.svg, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 64 64');
        svg.setAttribute('preserveAspectRatio', 'xMaxYMax');
        svg.appendChild(node);

        return svg;
    }
}

function getMultiScale() {
    const k = 0.15;

    return [
        d3.scaleLinear().domain([-k, 1]).range(['#fff', d3.schemeSet3[3]]),
        d3.scaleLinear().domain([-k, 1]).range(['#fff', d3.schemeSet3[9]]),
        d3.scaleLinear().domain([-k, 1]).range(['#fff', d3.schemeSet3[11]]),
        d3.scaleLinear().domain([-k, 1]).range(['#fff', d3.schemeSet3[4]]),
        d3.scaleLinear().domain([-k, 1]).range(['#fff', d3.schemeSet3[6]])
    ];
}
