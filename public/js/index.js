(function (index, $) {
    "use strict";

    var multiselectData,
        minYear = 0,
        maxYear = 0,
        playStopped = true,
        activeAreaType,
        socioeconomicData,
        multiselectReady = false;

    /* Initialize the area/geography type radio selection (census tracts vs. neighborhoods)
     */
    function initGeoRadio(geo) {

        // Trigger update on user selection
        $('#neighborhood-radio').change(function () {
            index.update();
        });
        $('#census-radio').change(function () {
            index.update();
        });
    }

    /* Initialize the business license multiselect drop-down with data fetched from the server.
     */
    function initBusinessMultiselect(business) {
        $('#business-multiselect').multiselect({
            buttonClass: 'desert-multiselect-button btn btn-primary',
            enableFiltering: true,
            filterBehavior: 'value',
            enableCaseInsensitiveFiltering: true,
            filterPlaceholder: 'Business Type',
            includeSelectAllOption: true
        });

        // Fetch license list from server and update the multiselect accordingly
        json.fetch("licenses.json", function (data) {
            multiselectData = data;
            $("#business-multiselect").multiselect('dataprovider', data);
            $("#business-multiselect").multiselect('select', business);
            index.update();
        });

        // Trigger update on any user selection
        $('#business-multiselect').change(function () {
            stopSlider();
            index.update();
        });
    }

    /* Initialize the year slider; trigger events based on user interaction
     */
    function initYearSlider() {

        // Continually update the label...
        $("#year-slider").slider().on('slide', function (event) {
            if (event.value != $("#year-value").text()) {
                $("#year-value").text(event.value);
                index.update();
            }
        });

        $("#year-slider").slider().on('slideStart', function (event) {
            maps.enableMarkerAnimation(false);
        });

        $("#year-slider").slider().on('slideStop', function (event) {
            maps.enableMarkerAnimation(true);
        });
    }

    /* "Turn on" any popovers or tooltips defined on the page
     */
    function initPopovers() {
        $(function () {
            $('[data-toggle="tooltip"]').tooltip();
        });

        $(function () {
            $('[data-toggle="popover"]').popover();
        });
    }

    /* Wire up event handling for the "Show critical businesses" checkbox
     */
    function initCriticalBusiness() {
        $("#show-critical-businesses").change(function () {
            maps.enableMarkerAnimation(true);
            index.update();
        });

        $("#relative-shading").change(function () {
            // Set relative shading option
            maps.setRelativePolygonShading(getRelativeShading());
            index.update();
        });
    }

    function initPermalink() {
        $('#permalink').click(function () {
            $('#permalink-url').attr('href', getPermalink());
            $('#permalink-text').text(getPermalink());
            $('#permalink-modal').modal('show');
        });
    }

    function getSelectedBusiness() {
        return $('#business-multiselect').val();
    }

    function getSelectedYear() {
        return $("#year-slider").val();
    }

    function getAreaType() {
        return $('#neighborhood-radio').is(":checked") ? data.COMMUNITY : data.CENSUS;
    }

    function getRelativeShading() {
        return $("#relative-shading").is(":checked");
    }

    function getCriticalBusinessSelection() {
        return $("#show-critical-businesses").is(":checked");
    }

    function getPermalink() {
        var map = maps.getMap();
        var url = window.location.href.split('/');
        return url[0] + "//" + url[2] + "/?business=" + getSelectedBusiness() + "&year=" + getSelectedYear() + "&geo=" + getAreaType() + "&critical=" + getCriticalBusinessSelection() + "&relative=" + getRelativeShading() + "&lat=" + map.getCenter().lat() + "&lng=" + map.getCenter().lng() + "&zoom=" + map.getZoom();
    }

    function updateSliderValue(value) {
        $("#year-slider").slider("setValue", value);
        $("#year-value").text($("#year-slider").slider("getValue"));

        index.update();
    }

    function incrementSliderValue() {
        var currentYear = $("#year-slider").slider("getValue");

        if (currentYear < maxYear) {
            updateSliderValue(currentYear + 1);
        }
    }

    function updateSliderRange() {
        var selectedBusiness = getSelectedBusiness();

        for (var i = 0; i < multiselectData.length; i++) {
            var record = multiselectData[i];
            if (record.value == selectedBusiness) {
                minYear = record["min-year"];
                maxYear = record["max-year"];
            }
        }

        var selectedYear = $("#year-slider").slider("getValue");

        $("#year-slider").slider("setAttribute", "min", minYear);
        $("#year-slider").slider("setAttribute", "max", maxYear);
        $("#year-slider").slider("setValue", selectedYear);

        if (selectedYear > maxYear)
            $("#year-slider").slider("setValue", maxYear);

        if (selectedYear < minYear)
            $("#year-slider").slider("setValue", minYear);

        $("#year-value").text($("#year-slider").slider("getValue"));
    }

    function stopSlider() {
        playStopped = true;
        $("#play-icon").removeClass("glyphicon-stop");
        $("#play-icon").addClass("glyphicon-play");
        maps.enableMarkerAnimation(true);
    }

    function playSlider() {
        var currentYear = $("#year-slider").slider("getValue");
        maps.enableMarkerAnimation(false);

        if (!playStopped && currentYear < maxYear) {
            $("#play-icon").removeClass("glyphicon-play");
            $("#play-icon").addClass("glyphicon-stop");
            incrementSliderValue();
            setTimeout(playSlider, 750);
        } else {
            stopSlider();
        }
    }

    function initVcrButtons() {

        $("#fast-forwards").on("click", function (event) {
            updateSliderValue(maxYear);
        });

        $("#fast-backwards").on("click", function (event) {
            updateSliderValue(minYear);
        });

        $("#play").on("click", function (event) {
            if (playStopped) {
                playStopped = false;
                playSlider();
            } else {
                stopSlider();
            }
        });
    }

    function getDesertClassDescription(opacity) {
        if (opacity == undefined) return "(no data available)";

        if (opacity > 0.8) return "neighborhoods with the highest accessiblity";
        else if (opacity > 0.7) return "neighborhoods with good accessibility";
        else if (opacity > 0.5) return "neighborhoods with fair accessiblity";
        else if (opacity > 0.3) return "neighborhoods with poor access";
        else return "neighborhoods with the very lowest levels of access";
    }

    function getDesertClass(opacity) {
        if (opacity == undefined) return "(no data available)";

        if (opacity > 0.8) return "most accessible";
        else if (opacity > 0.7) return "largely accessible";
        else if (opacity > 0.5) return "somewhat accessible";
        else if (opacity > 0.3) return "largely deserted";
        else return "most deserted";
    }

    function getSocioeconomicIndicator(indicator, forArea) {
        return socioeconomicData[forArea.toUpperCase()][indicator];
    }

    function polyMouseoverCallback(areaType, areaName, poly, record) {

        // Area type changed (or first access); need to load HTML fragment
        if (activeAreaType != areaType) {
            activeAreaType = areaType;
            $("#info-panel").load(areaType === data.CENSUS ? "html/tract-report.html" : "html/community-report.html", function () {
                polyMouseoverCallback(areaType, areaName, poly, record);
            });

            return;
        }

        // Re-register pop-overs on the new HTML
        initPopovers();

        $(".year").text(getSelectedYear);
        $(".area-name").text(areaName);
        $(".desert-class").text(getDesertClass(poly.fillOpacity));

        if (areaType === data.CENSUS) {
            $(".business-one-mile").text(record["ONE_MILE"]);
            $(".business-two-mile").text(record["TWO_MILE"]);
            $(".business-three-mile").text(record["THREE_MILE"]);
        } else {
            $(".per-capita-income").text(getSocioeconomicIndicator("PER CAPITA INCOME", areaName).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
            $(".poverty-percent").text(getSocioeconomicIndicator("PERCENT HOUSEHOLDS BELOW POVERTY", areaName));
            $(".hardship-index").text(getSocioeconomicIndicator("HARDSHIP INDEX", areaName));
            $(".percent-unemployed").text(getSocioeconomicIndicator("PERCENT AGED 16+ UNEMPLOYED", areaName));
            $(".neighborhood-desert-class").text(getDesertClassDescription(poly.fillOpacity));
        }
    }

    function initMouseoverCallback() {
        maps.setPolyMouseoverCallback(polyMouseoverCallback);
    }

    /*
     * Invoked when a user makes a UI selection that affects map rendering
     */
    index.update = function () {

        updateSliderRange();

        var dataset = getAreaType() + "/" + getSelectedBusiness() + "-" + getSelectedYear() + ".json";

        // Update polygons and shading
        if (getAreaType() == data.CENSUS) {
            maps.showCensusTracts();
            data.loadCensusData(dataset, function (data) {
                maps.refreshPolygonShading();
            });
        } else {
            maps.showCommunities();
            data.loadCommunityData(dataset, function (data) {
                maps.refreshPolygonShading();
            });
        }

        // Update critical business markers
        if ($("#show-critical-businesses").is(':checked')) {
            var datafile = "critical/critical-" + getSelectedBusiness() + "-" + getSelectedYear() + ".json";
            maps.showMarkers(datafile);
        } else {
            maps.hideMarkers();
        }
    };

    index.init = function (initialContext) {
        initBusinessMultiselect(initialContext.business || 'grocery');
        initYearSlider();
        initGeoRadio();
        initPopovers();
        initCriticalBusiness();
        initVcrButtons();
        initMouseoverCallback();
        initPermalink();

        json.fetch("socioeconomic.json", function (data) {
            socioeconomicData = data;
        });

        maps.init(function () {
            updateSliderValue(Number(initialContext.year) || 2015);
            if (initialContext.criticalMarkers) $('#show-critical-businesses').click();
            if (initialContext.relativeShading) $('#relative-shading').click();
            if (initialContext.geo === data.CENSUS) $('#census-radio').click();

            maps.getMap().setZoom(initialContext.zoom || 11);
            if (initialContext.lat && initialContext.lng) {
                maps.getMap().setCenter(new google.maps.LatLng(initialContext.lat, initialContext.lng));
            }
        });
    };

}(window.index = window.index || {}, jQuery));