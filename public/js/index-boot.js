"use strict";
$(document).ready(function () {

    var getUrlParameter = function (name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
    };

    var initialContext = {
        business: getUrlParameter('business'),
        year: getUrlParameter('year'),
        geo: getUrlParameter('geo'),
        relativeShading: Boolean(getUrlParameter('relative') === "true"),
        criticalMarkers: Boolean(getUrlParameter('critical') === "true"),
        lat: Number(getUrlParameter('lat')),
        lng: Number(getUrlParameter('lng')),
        zoom: Number(getUrlParameter('zoom')),
        select: getUrlParameter('select')
    };

    index.init(initialContext);
});