(function (queryTablemaps, $, undefined) {

    // Matt's Fusion tables and API key; don't mess with this
    var CENSUS_TRACTS_TABLE = '1E45OeyKEC8TBt_Jtau0HkiLycxjPcLS_SAgejFdt';
    var COMMUNITY_AREAS_TABLE = '19403tp7_IakdCX0soN031hMap7jPZV3uPbNhI9ME';
    var API_KEY = 'AIzaSyB_Idpo8GuOvdaIU7VtOsk7pTargR6rEFw';

    var METERS_PER_MILE = 1609.34;
    var CHICAGO = new google.maps.LatLng(41.8369, -87.6847);

    var activeGeography = "communities";
    var communityPolys = []; // community area polygons
    var censusPolys = []; // census tract polygons
    var communityData = {}; // current community desertification data
    var censusData = []; // current census desertification data

    // When true, polygons are shaded relative only to other visible polygons
    var relativeShadingEnabled = false;

    var map = null; // Google map object

    // Predicates to indicate whether community area / census polys are ready
    // for rendering
    var communitiesReady = false;
    var censusReady = false;

    var circle = null; // handle to circle drawn on map
    var markers = []; // handle to markers drawn on map

    function queryFusionTable(tableId, successCallback) {

        // Construct the Fusion Table query
        var query = 'SELECT id, name, geometry FROM ' + tableId;
        var url = ['https://www.googleapis.com/fusiontables/v1/query'];
        url.push('?sql=' + encodeURIComponent(query));
        url.push('&key=' + API_KEY);
        url.push('&callback=?');

        // Fire it off; build polys when complete
        $.ajax({
            url: url.join(''),
            dataType: 'jsonp',
            success: function (data) {
                buildPolygons(data, successCallback);
            }
        });
    }

    function showPolys(polys) {
        polys.forEach(function (poly) {
            poly.setMap(maps.getMap());
        });
    }

    function hidePolys(polys) {
        polys.forEach(function (poly) {
            poly.setMap(null);
        });
    }

    function buildPolygons(data, successCallback) {

        var rows = data['rows'];
        var polys = [];

        for (var i in rows) {
            var newCoordinates = [];
            var centroid;

            // Extract data from fusion table; first row must be area id, second row must be area name
            // and thrid row must be "MultiGeometry" KML/XML
            var areaId = rows[i][0];
            var areaName = rows[i][1].toLowerCase();
            var geometries = rows[i][2]['geometries'];

            if (geometries) {
                for (var j in geometries) {
                    if (geometries[j].type == "Polygon") {
                        newCoordinates.push(getPolygonCoordinates(geometries[j]));
                    } else if (geometries[j].type == "Point") {
                        centroid = getPolygonCentroid(geometries[j]);
                    }
                }
            } else {
                newCoordinates = getPolygonCoordinates(rows[i][1]['geometry']);
            }

            var poly = new google.maps.Polygon({
                paths: newCoordinates,
                strokeColor: '#ffffff',
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: '#DB944D',
                areaId: areaId,
                areaName: areaName,
                centroid: centroid
            });

            // Handle mouseover events on this poly
            google.maps.event.addListener(poly, 'mouseover', function () {
                // TODO: Just for fun; replaces all instances of area name with mouseover'd selection
                $(".area-name").html(this.areaName + " (" + this.fillOpacity + ")");

                // Make shape outline bold
                this.setOptions({
                    strokeOpacity: 1,
                    strokeWeight: 6,
                });
            });

            // Handle mouseout events on this poly
            google.maps.event.addListener(poly, 'mouseout', function () {
                // Make shape outline "normal"
                this.setOptions({
                    strokeOpacity: 1,
                    strokeWeight: 1,
                });
            });

            // In order to draw circles, we need to capture click events. Since the poly will float
            // above the map, we can't attach this listener to the map object itself.
            google.maps.event.addListener(poly, 'click', function (event) {
                drawCircle(event.latLng, METERS_PER_MILE * 1);
            });

            // Squirrel away this poly
            polys.push(poly);
        }

        successCallback(polys);
    }

    function getPolygonCentroid(polygon) {
        var coordinates = polygon['coordinates']
        return new google.maps.LatLng(coordinates[1], coordinates[0]);
    }

    /* Converts KML data into a set of Google LatLng objects
     */
    function getPolygonCoordinates(polygon) {
        var newCoordinates = [];
        var coordinates = polygon['coordinates'][0];
        for (var i in coordinates) {
            newCoordinates.push(new google.maps.LatLng(coordinates[i][1],
                coordinates[i][0]));
        }
        return newCoordinates;
    }

    /* Render circle on map at the given lat/lng and radius (in meters).
     * TODO: Draw concentric circles
     */
    function drawCircle(centerLatLng, radius) {
        // Remove existing circle
        if (circle) circle.setMap(null);

        var circleOptions = {
            strokeColor: '#ffffff',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#4491BB',
            fillOpacity: 0.35,
            map: map,
            center: centerLatLng,
            radius: radius,
            zIndex: google.maps.Marker.MAX_ZINDEX + 1
        };

        circle = new google.maps.Circle(circleOptions);
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
        polys.forEach(function (thisPoly) {
            var lat = thisPoly.centroid.lat();
            var lng = thisPoly.centroid.lng();

            // Is the polygon centroid presently visible on the map?
            if (lat < neLat && lng < neLng && lat > swLat && lng > swLng) {
                visiblePolys.push(thisPoly);
            }
        });

        return visiblePolys;
    }

    function getMaxIndex(polys, data) {
        var max = 0;
        polys.forEach(function (thisPoly) {
            if (data[thisPoly.areaId] && data[thisPoly.areaId].ACCESS_INDEX > max) {
                max = data[thisPoly.areaId].ACCESS_INDEX;
            };
        });

        return max;
    }

    function getMinIndex(polys, data) {
        var min = Number.MAX_VALUE;
        polys.forEach(function (thisPoly) {
            if (data[thisPoly.areaId] && data[thisPoly.areaId].ACCESS_INDEX < min) {
                min = data[thisPoly.areaId].ACCESS_INDEX;
            };
        });

        return min;
    }

    /* Re-shade visible polygons (may change opacity on when relative shading is enabled).
     */
    function refreshPolygonShading() {

        var activePolygons = (activeGeography == "census") ? censusPolys : communityPolys;
        var activeDataset = (activeGeography == "census") ? censusData : communityData;

        if (relativeShadingEnabled) {
            activePolygons = getVisiblePolygons(activePolygons);
        }

        shadePolygons(activePolygons, activeDataset);
    }

    function shadePolygons(polys, data) {

        // Get min and max access index values for polygons
        var max = getMaxIndex(polys, data);
        var min = getMinIndex(polys, data);

        // Blank polygons that are not visible 
        polys.forEach(function (thisPoly) {
            thisPoly.setOptions({
                fillOpacity: 0
            });
        });

        // Shade visible polys relative to others
        getVisiblePolygons(polys).forEach(function (thisPoly) {
            var index = data[thisPoly.areaId] && data[thisPoly.areaId].ACCESS_INDEX;
            thisPoly.setOptions({
                fillOpacity: getOpacityBucket((index - min) / (max - min))
            });
        });
    }

    function getOpacityBucket(value) {
        var bucketCount = 5;
        return Math.round(value / (1 / bucketCount)) * (1 / bucketCount);
    }

    function renderMarkers(places) {
        places.forEach(function (place) {
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(place.lat, place.lng),
                title: place.name,
                map: map
            });

            markers.push(marker);
        });
    };

    maps.init = function () {
        var mapOptions = {
            center: CHICAGO,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoom: 11
        };

        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

        // Refresh polygon shading as bounds change
        google.maps.event.addListener(map, 'bounds_changed', function () {
            refreshPolygonShading();
        });

        // Pull census tract polys from fusion table
        queryFusionTable(CENSUS_TRACTS_TABLE, function (polys) {
            censusPolys = polys;
            censusReady = true;
        });

        // Pull community area polys from fusion table
        queryFusionTable(COMMUNITY_AREAS_TABLE, function (polys) {
            communityPolys = polys;
            communitiesReady = true;
            showPolys(communityPolys);
        });
    };

    maps.areCensusTractsReady = function () {
        return censusReady;
    };

    maps.areCommunitiesReady = function () {
        return communitiesReady;
    };

    maps.showCommunities = function (withDataset) {
        if (this.areCommunitiesReady()) {
            showPolys(communityPolys);
            hidePolys(censusPolys);
        }
    };

    maps.showCensusTracts = function () {
        if (this.areCensusTractsReady()) {
            showPolys(censusPolys);
            hidePolys(communityPolys);
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
            markers.forEach(function (thisMarker) {
                thisMarker.setMap(null);
            });
        }

        markers = [];
    };

    maps.setRelativePolygonShading = function (isRelativeShadingEnabled) {
        relativeShadingEnabled = isRelativeShadingEnabled;
    };

    maps.setCommunityData = function (datafile) {

        communityData = {};

        // Generate fake data
        //        communityPolys.forEach(function (thisPoly) {
        //            communityData[thisPoly.areaId] = {
        //                "ACCESS_INDEX": Math.random()
        //            };
        //        });
        //        shadePolygons(communityPolys, communityData);

        //         TODO: Uncomment to fetch real data
        json.fetch(datafile, function (data) {
            communityData = data;
            shadePolygons(communityPolys, data);
        });

        activeGeography = "communities";
    };

    maps.setCensusData = function (datafile) {
        censusData = {};

        // Generate fake data
        //        censusPolys.forEach(function (thisPoly) {
        //            censusData[thisPoly.areaId] = {
        //                "ACCESS_INDEX": Math.random()
        //            };
        //        });
        //        shadePolygons(censusPolys, censusData);

        //         TODO: Uncomment to fetch real data
        json.fetch(datafile, function (data) {
            censusData = data;
            shadePolygons(censusPolys, data);
        });

        activeGeography = "census";
    };

    maps.getMap = function () {
        return map;
    };

}(window.maps = window.maps || {}, jQuery));