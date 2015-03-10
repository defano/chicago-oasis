"use strict";
$(document).ready(function () {

    var getUrlParameter = function (name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
    };

    var initialContext = {
        business: getUrlParameter('business') || 'grocery',
        year: Number(getUrlParameter('year')) || 2015,
        geo: getUrlParameter('geo') || data.COMMUNITY,
        relativeShading: Boolean(getUrlParameter('relative') === "true"),
        criticalMarkers: Boolean(getUrlParameter('critical') === "true"),
        lat: Number(getUrlParameter('lat')) || null,
        lng: Number(getUrlParameter('lng')) || null,
        zoom: Number(getUrlParameter('zoom')) || 11,
        select: getUrlParameter('select')
    };

    index.init(initialContext);
});