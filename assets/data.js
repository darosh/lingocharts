function getFlag(iso, flags) {
    var node = flags.getElementById(iso);

    if (node) {
        node = node.cloneNode(true);
        node.removeAttribute('id');
        node.removeAttribute('transform');
        var svg = document.createElementNS(d3.namespaces.svg, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 64 64');
        svg.setAttribute('preserveAspectRatio', 'xMaxYMax');
        svg.appendChild(node);

        return svg;
    }
}
