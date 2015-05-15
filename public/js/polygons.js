(function (polygons, $) {
    "use strict";

    // Matt's Fusion tables and API key; don't mess with this
    var CENSUS_TRACTS_TABLE = '1E45OeyKEC8TBt_Jtau0HkiLycxjPcLS_SAgejFdt',
        COMMUNITY_AREAS_TABLE = '19403tp7_IakdCX0soN031hMap7jPZV3uPbNhI9ME',
        API_KEY = 'AIzaSyDq98eErcmMlEp7kkq1yKRMBisLSw2RM74',
        AREA_COLOR = '#6699FF',
        OUTLINE_COLOR = '#FFFFFF',
        communityPolys = [],
        censusPolys = [],
        readyCallback,
        censusReady,
        communitiesReady;

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

    function buildPolygons(data, successCallback) {

        var rows = data.rows,
            polys = [];

        console.log(data.rows);
        
        for (var i in rows) {
            var newCoordinates = [];
            var centroid;

            console.log("got row!");
            
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
                strokeColor: OUTLINE_COLOR,
                strokeOpacity: 1,
                strokeWeight: 2,
                fillColor: AREA_COLOR,
                areaId: areaId,
                areaName: areaName,
                centroid: centroid
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

    polygons.load = function (readyCallback) {
        // Pull census tract polys from fusion table
        queryFusionTable(CENSUS_TRACTS_TABLE, function (polys) {
            censusPolys = polys;
            if (communityPolys.length > 0) readyCallback();
        });

        // Pull community area polys from fusion table
        queryFusionTable(COMMUNITY_AREAS_TABLE, function (polys) {
            communityPolys = polys;
            if (censusPolys.length > 0) readyCallback();
        });
    }

    polygons.getCensusPolygons = function () {
        return censusPolys;
    };

    polygons.getCommunityPolygons = function () {
        return communityPolys;
    };

    polygons.areReady = function () {
        return censusPolys.length > 0 && communityPolys.length > 0;
    }

}(window.polygons = window.polygons || {}, jQuery));