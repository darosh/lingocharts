'use strict';

const config = {
    url: 'https://darosh.github.io/lingocharts/',
    repo: 'https://github.com/darosh/lingocharts/',
    format: d3.format(','),
    money: d3.format(',.0f'),
    hash: '',
    multicolor: [
        d3.interpolateGreens,
        d3.interpolateGreys,
        d3.interpolatePurples,
        d3.interpolateOranges,
        d3.interpolateBlues,
        d3.interpolateReds
    ],
    width: 960,
    height: 480,
    legendMargin: 12
};

config.legendHeight = 6 + 10 + config.legendMargin * 2;

config.simplify = d3.geoTransform({
    point: function (x, y) {
        this.stream.point(Math.round(x), Math.round(y));
    }
});

config.projection = d3.geoEquirectangular()
    .scale(config.height / Math.PI)
    .rotate([-10])
    .translate([config.width / 2, config.height / 2])
    .precision(1);

config.path = d3.geoPath()
    .projection({
        stream: function (s) {
            return config.projection.stream(config.simplify.stream(s));
        }
    })
    .pointRadius(2);

config.graticule = d3.geoGraticule();

Vue.filter('number', function (n) {
    return config.format(n);
});

Vue.filter('percent', function (n) {
    return isNaN(n) ? '' : (n + '%');
});

Vue.filter('money', function (n) {
    return isNaN(n) ? '' : ('$' + config.money(n));
});

Vue.filter('yes', function (v, t) {
    return v ? (t ? t : 'yes') : '';
});

Vue.component('flag', {
    template: '<div></div>',
    props: ['code'],
    mounted() {
        const f = getFlag(this.code, config.flags);

        if (f) {
            this.$el.appendChild(f);
        }
    }
});

Vue.component('sortable', {
    template: '<div><slot name="table" :list="sorted" :sort="sort"></slot></div>',
    props: ['list', 'filter'],
    data() {
        //noinspection CommaExpressionJS
        let l = Object.keys(this.list).map(k => (this.list[k].id = k, this.list[k]));

        if (this.filter) {
            l = l.filter(this.filter);
        }

        return {
            sorted: l
        }
    },
    methods: {
        sort(by, numeric) {
            if (numeric) {
                this.sorted.sort((a, b) => val(a) - val(b));
            } else {
                this.sorted.sort((a, b) => val(a).localeCompare(val(b)));
            }

            function val(a) {
                const r = by.call ? by(a) : a[by];
                return numeric ? isNaN(r) ? -Infinity : r : (r || '');
            }
        }
    }
});

Vue.component('family', {
    template: document.getElementById('template-family').innerHTML,
    props: ['db', 'node'],
    data(){
        return {
            expanded: false,
            config: config
        }
    },
    computed: {
        nd() {
            return this.node || d3.stratify()
                    .parentId(d => d.data && d.data.parent ? d.data.parent : d.id === 'root' ? null : 'root')
                    (d3.merge([Object.keys(this.db.family).map(k => ({
                        id: k,
                        expanded: false,
                        data: this.db.family[k]
                    })), [{id: 'root'}]]))
        }
    },
    watch: {
        'config.hash': function (newVal) {
            if (this.db && (newVal.indexOf('family-') > -1)) {
                const iteration = (node) => {
                    node.$children.forEach(c => {
                        c.expanded = false;
                        iter(c);
                    });
                };

                iteration(this);
            }

            if (this.node && (newVal === ('family-' + this.node.id))) {
                this.expanded = true;
                let p = this;

                while ((p = p.$parent) && p.$vnode && p.$vnode.componentOptions.tag === 'family') {
                    p.expanded = true;
                }

                Vue.nextTick(() => {
                    //noinspection UnnecessaryLocalVariableJS
                    const u = location.href;
                    location.href = u;
                });
            }
        }
    }
});

Vue.component('app-map', {
    template: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g class="graticule"></g><g class="land"></g><g class="border"></g><g class="legend"></g><g class="frame"></g></svg>',
    props: ['color', 'value', 'scale', 'extent', 'field', 'computed', 'multi'],
    mounted(){
        const svg = d3.select(this.$el);
        svg.attr('width', config.width)
            .attr('height', config.height + config.legendHeight);
        const grat = svg.select('.graticule');
        grat.selectAll('path').data([config.graticule()])
            .enter()
            .append('path')
            .attr('d', config.path)
            .attr('fill', 'none')
            .attr('stroke-width', 0.5)
            .attr('stroke', '#ccc');

        let color, colorScale, extent;

        if (this.multi) {
            color = d => {
                const t = config.data.country[d.id][this.multi];
                return config.multicolor[t[0]](t[1] * 0.5 + 0.25);
            }
        } else if (this.computed) {
            color = this.computed;
        } else {
            const value = this.field ? d => config.data.country[d.id][this.field] : this.value;
            extent = this.extent ? this.extent : d3.extent(Object.keys(config.data.country), k => value(config.data.country[k]));
            this.scale = this.scale || d3.scaleLog();
            this.color = this.color || (d => isNaN(d) ? '#fff' : d3.interpolateRdYlGn(d));
            colorScale = this.scale.domain(extent).range(this.color.call ? [0, 1] : this.color);
            color = this.color.call ? d => this.color(colorScale(value(d))) : d => colorScale(value(d));
        }

        const hasBottomLegend = colorScale && extent.length === 2;
        svg.attr('height', config.height + (hasBottomLegend ? config.legendHeight : 0));

        const land = svg.select('.land');
        land.selectAll('a').data(config.land)
            .enter()
            .append('a')
            .attr('xlink:href', d => '#country-' + d.id)
            .append('path')
            .attr('title', d => d.id)
            .attr('d', config.path)
            .attr('fill', color);
        const border = svg.select('.border');
        border.selectAll('d').data([config.border])
            .enter()
            .append('path')
            .attr('d', config.path)
            .attr('fill', 'none')
            .attr('stroke', '#000')
            .attr('stroke-width', 0.5);

        const frameStroke = 0.5;
        const frame = svg.select('.frame');
        frame.selectAll('rect').data([0])
            .enter()
            .append('rect')
            .attr('x', frameStroke / 2)
            .attr('y', frameStroke / 2)
            .attr('width', config.width - frameStroke)
            .attr('height', config.height - frameStroke)
            .attr('fill', 'none')
            .attr('stroke', '#000')
            .attr('stroke-width', frameStroke);

        if (hasBottomLegend) {
            colorScale.range([config.legendMargin, config.width - config.legendMargin]);
            const axis = d3.axisBottom(colorScale).ticks(7, '.0s');
            svg.select('.legend')
                .attr('transform', 'translate(0, ' + (config.height + config.legendMargin) + ')')
                .call(axis);
        }
    }
});

Vue.component('app-chart-bar', {
    template: '<div><svg style="float:left" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g class="chart"></g><g class="values"></g><g class="legend"></g><g class="frame"></g></svg><div style="min-width: 240px; display: inline-block"><ul><li v-for="i in list" v-if="i.source"><a :href="i.source" target="_blank">{{i.title}}</a></li></ul></div><div style="clear: left"></div></div>',
    props: ['list', 'x', 'sort', 'desc'],
    mounted() {
        const height = 240;
        const svg = d3.select(this.$el).select('svg');
        svg.attr('width', config.width)
            .attr('height', config.height + config.legendHeight - 6 - 6);

        const shift = 10 + 2 + 2;
        const x = d3.scaleBand().rangeRound([0, config.width]).padding(0.1);
        const y = d3.scaleLinear().rangeRound([config.height, shift]);

        this.list.sort((a, b) => d3[this.desc ? 'descending' : 'ascending'](a[this.sort], b[this.sort]));
        x.domain(this.list.map(d => d[this.x]));
        y.domain([0, d3.max(this.list, d => d.num)]);

        svg.select('.chart').selectAll('.bar')
            .data(this.list)
            .enter()
            .append('rect')
            .attr('fill', d3.interpolateBlues(0.5))
            .attr('x', d => x(d[this.x]))
            .attr('y', d => y(d.num))
            .attr('width', x.bandwidth())
            .attr('height', d => config.height - y(d.num));

        svg.select('.values').selectAll('.value')
            .data(this.list)
            .enter()
            .append('text')
            .attr('font-size', 10)
            .attr('text-anchor', 'middle')
            .attr('x', d => x(d[this.x]) + x.bandwidth() / 2)
            .attr('y', d => y(d.num) - 2)
            .text(d => d.num);

        svg.select('.legend')
            .attr('transform', 'translate(0,' + config.height + ')')
            .call(d3.axisBottom(x))
            .selectAll('path').attr('display', 'none');
    }
});

new Vue({
    el: '#app',
    data() {
        d3.queue()
            .defer(d3.json, './data/index.json')
            .defer(d3.json, './data/map.topo.json')
            .defer(d3.xml, './data/flags.svg')
            .await((err, data, map, flags) => {
                config.flags = flags;
                config.map = map;
                config.data = data;
                config.land = topojson.feature(map, map.objects.countries).features;
                config.border = topojson.mesh(map, map.objects.countries);
                this.data = data;

                this.groups = {
                    '001': this.groupTable('001'),
                    '419': this.groupTable('419'),
                    EU: this.groupTable('EU'),
                    EZ: this.groupTable('EZ'),
                    UN: this.groupTable('UN')
                };

                this.addCountryGroup();

                Vue.nextTick(function () {
                    const h = location.hash;
                    const u = location.href;

                    if (h.length > 1) {
                        const e = document.querySelector(h);

                        if (e) {
                            e.scrollIntoView();
                        }

                        location.href = u;
                    }

                    config.hash = h.substr(1);

                    window.addEventListener('hashchange', () => {
                        const h = location.hash;
                        config.hash = h.substr(1);
                        document.querySelector(h).scrollIntoView();
                    }, false);

                });
            });

        return {
            config: config,
            data: null,
            map: null,
            groups: {}
        }
    },
    methods: {
        items(o) {
            return Array.isArray(o) ? o.length : Object.keys(o).length;
        },
        addCountryGroup () {
            config.data.group['001'].contains.forEach((c, i) => {
                config.data.group[c].contains.forEach((d, j, a) => {
                    config.data.group[d].contains.forEach(e => {
                        config.data.country[e]._group = [c, d];
                        config.data.country[e]._groupValue = [i, j / (a.length - 1)];
                    });
                });
            });
        },
        groupTable(code) {
            let a = [];

            iter(code, this.data);

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
    }
});
