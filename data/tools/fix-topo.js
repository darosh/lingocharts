var content = '';

process.stdin.resume();

process.stdin.on('data', function (buf) {
    content += buf.toString();
});

process.stdin.on('end', function () {
    var o = JSON.parse(content);
    var n = o.objects.countries.geometries;
    var f = n.filter(d => d.id === 'FR')[0];
    var a = f.arcs.shift();
    n.push({
        type: 'MultiPolygon',
        arcs: [a],
        id: 'GF'
    });
    console.log(JSON.stringify(o));
});
