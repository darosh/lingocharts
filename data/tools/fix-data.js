var content = '';

process.stdin.resume();

process.stdin.on('data', function (buf) {
    content += buf.toString();
});

process.stdin.on('end', function () {
    var o = JSON.parse(content);
    var f = o.filter(d => d.iso_a2 === 'FR')[0];
    o.push({iso_a2: 'GF', mapcolor7: f.mapcolor7});
    console.log(JSON.stringify(o));
});
