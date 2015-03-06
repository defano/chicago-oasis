(function (data, $) {
    "use strict";

    data.CENSUS = "tracts";
    data.COMMUNITY = "commareas";

    var communityData = {}, // current community desertification data
        censusData = []; // current census desertification data

    data.getIndexForArea = function (areaId, activeGeography) {
        var record = data.getRecord(areaId, activeGeography);
        return record && record.ACCESS1;
    };

    data.getMaxIndex = function (polys, activeGeography) {
        var max = 0;
        for (var i = 0; i < polys.length; i++) {
            var index = data.getIndexForArea(polys[i].areaId, activeGeography);
            if (index > max) max = index;
        };

        return max;
    }

    data.getMinIndex = function (polys, activeGeography) {
        var min = Number.MAX_VALUE;
        for (var i = 0; i < polys.length; i++) {
            var index = data.getIndexForArea(polys[i].areaId, activeGeography);
            if (index < min) min = index;
        };

        return min;
    }

    data.getRecord = function (areaId, activeGeography) {
        var areaProperty = (activeGeography == data.CENSUS) ? "TRACT" : "COMMUNITY_AREA";
        var foundRecord = undefined;

        $.each(data.getDataset(activeGeography), function (i, record) {
            if (record[areaProperty] == areaId) {
                foundRecord = record;
            }
        });

        return foundRecord;
    };

    data.getDataset = function (geography) {
        return (geography == data.CENSUS) ? censusData : communityData;
    };

    data.loadCommunityData = function (datafile, callback) {
        communityData = {};

        json.fetch(datafile, function (data) {
            communityData = data;
            callback(data);
        });
    };

    data.loadCensusData = function (datafile, callback) {
        censusData = {};

        json.fetch(datafile, function (data) {
            censusData = data;
            callback(data);
        });
    };

}(window.data = window.data || {}, jQuery));