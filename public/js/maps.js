(function (queryTablemaps, $) {
    "use strict";

    var METERS_PER_MILE = 1609.34,
        CHICAGO = new google.maps.LatLng(41.8369, -87.6847),

        // Map colors
        NO_DATA_COLOR = "#666666",
        CIRCLE_COLOR = '#000066',
        OUTLINE_COLOR = '#FFFFFF',
        AREA_COLOR = '#6699FF',

        // Highlight style of selected polygon
        SELECTED = {
            strokeOpacity: 1,
            strokeWeight: 6,
        },
        UNSELECTED = {
            strokeOpacity: 1,
            strokeWeight: 1,
        },

        MARKER_ANIMATION = google.maps.Animation.DROP,

        activeGeography = data.COMMUNITY, // initial geography setting
        animateMarkers = true, // when true, markers drop into place
        relativeShadingEnabled = false, // When true, polygons are shaded relative only to other visible polygons

        map = null, // Google map object
        visibleInfoWindow, // info window presently visible

        circles = [], // handle to circle drawn on map
        markers = [], // handle to markers drawn on map
        selectionLock = false, // is highlighted selection locked (or update with hover)
        selectedPoly = null, // when locked, this is the selected polygon

        polyMouseoverCallback; // callback for when user hovers over polygon

    function initGoogleMap() {

        map = new google.maps.Map(document.getElementById('map-canvas'), {
            center: CHICAGO,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDoubleClickZoom: true,
            zoom: 11
        });

        // Refresh polygon shading as bounds change
        google.maps.event.addListener(map, 'bounds_changed', function () {
            maps.refreshPolygonShading();
        });
    }

    function initPolygons(onReady) {

        // Load polygons, then...
        polygons.load(function () {
            var allPolygons = polygons.getCensusPolygons().concat(polygons.getCommunityPolygons());

            // Walk through each poly and attach handlers
            $.each(allPolygons, function (i, poly) {
                // Handle mouseover events on this poly
                google.maps.event.addListener(poly, 'mouseover', function () {
                    if (!selectionLock) {
                        // Make shape outline bold
                        this.setOptions(SELECTED);

                        if (polyMouseoverCallback) {
                            var record = data.getRecord(this.areaId, activeGeography);
                            polyMouseoverCallback(activeGeography, this.areaName, this, record);
                        }
                    }
                });

                // Handle mouseout events on this poly
                google.maps.event.addListener(poly, 'mouseout', function () {
                    if (!selectionLock) {
                        this.setOptions(UNSELECTED);
                    }
                });

                google.maps.event.addListener(poly, 'click', function () {
                    selectionLock = !selectionLock;

                    if (!selectionLock) {
                        selectedPoly.setOptions(UNSELECTED);
                        poly.setOptions(SELECTED);
                        selectedPoly = null;
                    } else {
                        selectedPoly = poly;
                    }
                });

                // In order to draw circles, we need to capture click events. Since the poly will float
                // above the map, we can't attach this listener to the map object itself.
                google.maps.event.addListener(poly, 'dblclick', function (event) {
                    if (activeGeography == data.CENSUS) {
                        renderCircles(event.latLng, this.areaId);

                        // Unselect text on the page to prevent info windows from being rendered with selected text
                        // ... an inadvertent side-effect of the double-click
                        document.getSelection().removeAllRanges();
                    }
                });

            });

            showPolys(polygons.getCommunityPolygons());
            shadePolygons(polygons.getCommunityPolygons());

            onReady && onReady();
        });
    }

    function showPolys(polys) {
        for (var i = 0; i < polys.length; i++) {
            polys[i].setMap(maps.getMap());
        }
    }

    function hidePolys(polys) {
        for (var i = 0; i < polys.length; i++) {
            polys[i].setMap(null);
        }
    }

    function renderCircles(centerLatLng, areaId) {
        removeCircles();
        closeInfowindow();

        for (var i = 3; i > 0; i--) {
            var circle = newCircle(centerLatLng, i);

            google.maps.event.addListener(circle, 'mouseover', function (event) {

                var areaRecord = data.getRecord(areaId, data.CENSUS);
                var businessCount = undefined;
                if (this.radiusMiles == 3) businessCount = areaRecord["THREE_MILE"];
                else if (this.radiusMiles == 2) businessCount = areaRecord["TWO_MILE"];
                else if (this.radiusMiles == 1) businessCount = areaRecord["ONE_MILE"];

                var infowindow = new google.maps.InfoWindow({
                    position: event.latLng,
                    content: "<div class='circle-infowindow'><div class='circle-radius'>" + this.radiusMiles + " mile radius</div><div class='circle-description'>There are " + businessCount + " businesses of the selected type within a " + this.radiusMiles + " mile radius of the encircled location.</div></div>"
                });

                // Hide any visible infowindows
                closeInfowindow();

                infowindow.open(map);
                visibleInfoWindow = infowindow;
            });

            circles.push(circle);
        }
    }

    function newCircle(centerLatLng, radiusMiles) {

        var circleOptions = {
            strokeColor: OUTLINE_COLOR,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: CIRCLE_COLOR,
            fillOpacity: 0.35,
            map: map,
            center: centerLatLng,
            radius: radiusMiles * METERS_PER_MILE,
            zIndex: google.maps.Marker.MAX_ZINDEX + 1,
            radiusMiles: radiusMiles
        };

        return new google.maps.Circle(circleOptions);
    }

    function removeCircles() {
        for (var i = 0; i < circles.length; i++) {
            circles[i].setMap(null);
        }
    }

    function closeInfowindow() {
        if (visibleInfoWindow) visibleInfoWindow.close();
    }

    /* Filter a given set of polygons returning an array containing only those currently visible
     * on the map.
     */
    function getVisiblePolygons(polys) {
        var visiblePolys = [];

        // Get visible map boundaries
        var neLat = map.getBounds().getNorthEast().lat();
        var neLng = map.getBounds().getNorthEast().lng();
        var swLat = map.getBounds().getSouthWest().lat();
        var swLng = map.getBounds().getSouthWest().lng();

        // Filter set of polygons based on whether their centroid appears within bounds
        for (var i = 0; i < polys.length; i++) {
            var lat = polys[i].centroid.lat();
            var lng = polys[i].centroid.lng();

            // Is the polygon centroid presently visible on the map?
            if (lat < neLat && lng < neLng && lat > swLat && lng > swLng) {
                visiblePolys.push(polys[i]);
            }
        };

        return visiblePolys;
    }

    function getActivePolygons() {
        return (activeGeography == data.CENSUS) ? polygons.getCensusPolygons() : polygons.getCommunityPolygons();
    }

    /* Re-shade visible polygons (may change opacity on when relative shading is enabled).
     */
    maps.refreshPolygonShading = function () {

        var activePolygons = getActivePolygons();
        var activeDataset = data.getDataset(activeGeography);

        if (relativeShadingEnabled) {

            // Blank polygons that are not visible 
            // TODO: Shouldn't blank visible polygons
            for (var i = 0; i < activePolygons.length; i++) {
                activePolygons[i].setMap(null);
            };

            activePolygons = getVisiblePolygons(activePolygons);
        }

        shadePolygons(activePolygons);
    }

    function shadePolygons(polys) {

        // Get min and max access index values for polygons
        var max = data.getMaxIndex(polys, activeGeography);
        var min = data.getMinIndex(polys, activeGeography);

        $.each(polys, function (i, poly) {
            var index = data.getIndexForArea(poly.areaId, activeGeography);

            // No data available--color polygon in red
            if (index == undefined) {
                poly.setOptions({
                    fillOpacity: 0.4,
                    fillColor: NO_DATA_COLOR
                });
            }

            // Shade polygon based on bucket value
            else {
                poly.setOptions({
                    fillOpacity: getOpacityBucket((index - min) / (max - min)),
                    fillColor: AREA_COLOR
                });
            }

            poly.setMap(map);
        });
    }

    function getOpacityBucket(value) {
        var bucketCount = 5;
        var bucket = Math.round(value / (1 / bucketCount)) * (1 / bucketCount);

        // Don't shade anything as 0 or 1 (makes map hard to read)
        return (bucket == 0) ? 0.05 : (bucket == 1) ? .95 : bucket;
    }

    function renderMarkers(places) {

        $.each(places, function (index, place) {
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(place.LATTITUDE, place.LONGITUDE),
                map: map,
                title: place.DOING_BUSINESS_AS_NAME,
                animation: (animateMarkers) ? MARKER_ANIMATION : null
            });

            var contentString = '<div id="infowindow-pano"></div><div id="infowindow-text"><div id="infowindow-title"></div><div id="infowindow-address"></div><div id="infowindow-description"></div></div>';

            var infowindow = new google.maps.InfoWindow({
                content: contentString
            });

            $("#infowindow-title").text(place.DOING_BUSINESS_AS_NAME);

            google.maps.event.addListener(infowindow, 'domready', function () {
                var pano = new google.maps.StreetViewPanorama(document.getElementById("infowindow-pano"), {
                    position: new google.maps.LatLng(place.LATTITUDE, place.LONGITUDE),
                    navigationControl: false,
                    enableCloseButton: false,
                    addressControl: false,
                    linksControl: false,
                    panControl: false,
                    zoomControl: false
                });
                pano.setVisible(true);
            });

            google.maps.event.addListener(marker, 'click', function () {
                closeInfowindow();
                visibleInfoWindow = infowindow;
                infowindow.open(map, marker);

                var popAtRisk = place.POP_AT_RISK.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")

                $("#infowindow-title").text(place.DOING_BUSINESS_AS_NAME);
                $("#infowindow-address").text(place.ADDRESS);
                $("#infowindow-description").text("If this business were to close, a population of " + popAtRisk + " would live more than a mile away from a competing business.");
            });

            markers.push(marker);
        });
    };

    maps.showCommunities = function () {
        activeGeography = data.COMMUNITY;
        selectionLock = false;

        closeInfowindow();
        removeCircles();

        if (polygons.areReady()) {
            showPolys(polygons.getCommunityPolygons());
            hidePolys(polygons.getCensusPolygons());
        }
    };

    maps.showCensusTracts = function () {
        activeGeography = data.CENSUS;
        selectionLock = false;

        closeInfowindow();
        removeCircles();

        if (polygons.areReady()) {
            showPolys(polygons.getCensusPolygons());
            hidePolys(polygons.getCommunityPolygons());
        }
    };

    maps.showMarkers = function (datafile) {
        this.hideMarkers();
        json.fetch(datafile, function (places) {
            renderMarkers(places);
        });
    };

    maps.hideMarkers = function () {
        if (markers != null) {
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
            };
        }

        markers = [];
    };

    maps.setRelativePolygonShading = function (isRelativeShadingEnabled) {
        relativeShadingEnabled = isRelativeShadingEnabled;
        maps.refreshPolygonShading();
    };

    maps.enableMarkerAnimation = function (enable) {
        animateMarkers = enable;
    }

    maps.getMap = function () {
        return map;
    };

    maps.setSelectedArea = function (areaId) {
        selectionLock = true;
        selectedPoly;

        // Find the polygon identified by areaId...
        $.each(getActivePolygons(), function (i, thisPoly) {
            if (thisPoly.areaId == areaId) {
                selectedPoly = thisPoly;
            }
        });

        // ... provided we found one, select it
        if (selectedPoly) {
            selectedPoly.setOptions(SELECTED);
            if (polyMouseoverCallback) {
                var record = data.getRecord(areaId, activeGeography);
                polyMouseoverCallback(activeGeography, selectedPoly.areaName, selectedPoly, record);
            }
        }
    }

    maps.getSelectedArea = function () {
        return selectedPoly && selectedPoly.areaId;
    }

    maps.setPolyMouseoverCallback = function (callback) {
        polyMouseoverCallback = callback;
    }

    maps.init = function (onReady) {
        initGoogleMap();
        initPolygons(onReady);
    };

}(window.maps = window.maps || {}, jQuery));