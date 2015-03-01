(function (index, $) {

    var multiselectData = undefined;
    var minYear = 0;
    var maxYear = 0;
    var playStopped = true;
    var activeAreaType = undefined;
    var socioeconomicData = undefined;
    var multiselectReady = false;

    /* Initialize the area/geography type radio selection (census tracts vs. neighborhoods)
     */
    function initGeoRadio() {
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
    function initBusinessMultiselect() {
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
            $("#business-multiselect").multiselect('select', 'grocery');
            index.update();
        });

        // Trigger update on any user selection
        $('#business-multiselect').change(function () {
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
    }

    /* "Turn on" any popovers or tooltips defined on the page
     */
    function initPopovers() {
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        });

        $(function () {
            $('[data-toggle="popover"]').popover()
        });
    }

    /* Wire up event handling for the "Show critical businesses" checkbox
     */
    function initCriticalBusiness() {
        $("#show-critical-businesses").change(function () {
            index.update();
        });

        $("#relative-shading").change(function () {
            maps.setRelativePolygonShading($("#relative-shading").is(":checked"));
        });
    }

    function getSelectedBusiness() {
        return $('#business-multiselect').val();
    }

    function getSelectedYear() {
        return $("#year-slider").val();
    }

    function getAreaType() {
        return $('#neighborhood-radio').is(":checked") ? "commareas" : "tracts";
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

        multiselectData.forEach(function (record) {
            if (record.value == selectedBusiness) {
                minYear = record["min-year"];
                maxYear = record["max-year"];
            }
        });

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
    }

    function playSlider() {
        var currentYear = $("#year-slider").slider("getValue");

        if (!playStopped && currentYear < maxYear) {
            $("#play-icon").removeClass("glyphicon-play");
            $("#play-icon").addClass("glyphicon-stop");
            incrementSliderValue();
            setTimeout(playSlider, 750);
        } else {
            $("#play-icon").removeClass("glyphicon-stop");
            $("#play-icon").addClass("glyphicon-play");
            playStopped = true;
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

        if (opacity > 0.8) return "neighborhoods with the very lowest levels of access";
        else if (opacity > 0.6) return "neighborhoods with poor access";
        else if (opacity > 0.4) return "neighborhoods with fair accessiblity";
        else if (opacity > 0.2) return "neighborhoods with good accessibility";
        else return "neighborhoods with the highest accessiblity";
    }

    function getDesertClass(opacity) {
        if (opacity == undefined) return "(no data available)";

        if (opacity > 0.8) return "most deserted";
        else if (opacity > 0.6) return "largely deserted";
        else if (opacity > 0.4) return "somewhat accessible";
        else if (opacity > 0.2) return "largely accessible";
        else return "most accessible";
    }

    function getSocioeconomicIndicator(indicator, forArea) {
        return socioeconomicData[forArea.toUpperCase()][indicator];
    }

    function polyMouseoverCallback(areaType, areaName, poly, record) {
        if (activeAreaType != areaType) {
            activeAreaType = areaType;
            $("#info-panel").load(areaType === "census" ? "tract-report.html" : "community-report.html");
        }

        $(".year").text(getSelectedYear);
        $(".area-name").text(areaName);
        $(".desert-class").text(getDesertClass(poly.fillOpacity));

        if (areaType === "census") {
            $(".business-one-mile").text(record["ONE_MILE"]);
            $(".business-two-mile").text(record["TWO_MILE"]);
            $(".business-three-mile").text(record["THREE_MILE"]);
        } else {
            $(".neighborhood-desert-class").text(getDesertClassDescription(poly.fillOpacity));
            $(".per-capita-income").text(getSocioeconomicIndicator("PER CAPITA INCOME", areaName).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
            $(".citywide-per-capita-income").text(getSocioeconomicIndicator("PER CAPITA INCOME", "CHICAGO").toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
            $(".poverty-percent").text(getSocioeconomicIndicator("PERCENT HOUSEHOLDS BELOW POVERTY", areaName));
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
        // TODO: Cache this result and only fetch/update when required
        if (getAreaType() == "tracts") {
            maps.showCensusTracts();
            maps.setCensusData(dataset);
        } else {
            maps.showCommunities();
            maps.setCommunityData(dataset);
        }

        // Update critical business markers
        // TODO: Cache this result and only fetch/update when required
        if ($("#show-critical-businesses").is(':checked')) {
            var datafile = "critical/critical-" + getSelectedBusiness() + "-" + getSelectedYear() + ".json";
            maps.showMarkers(datafile);
        } else {
            maps.hideMarkers();
        }
    };

    index.init = function () {
        initYearSlider();
        initGeoRadio();
        initBusinessMultiselect();
        initPopovers();
        initCriticalBusiness();
        initVcrButtons();
        initMouseoverCallback();

        json.fetch("socioeconomic.json", function (data) {
            socioeconomicData = data;
        });
    };

}(window.index = window.index || {}, jQuery));