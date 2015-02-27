(function (index, $) {

    var multiselectData = undefined;
    var minYear = 0;
    var maxYear = 0;
    var playStopped = true;

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
            $("#year-value").text(event.value);
        });

        // But only fire the update function once user has made a selection
        $("#year-slider").slider().on('slideStop', function (event) {
            $("#year-value").text(event.value);
            index.update();
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

        console.log("current: " + currentYear + " max: " + maxYear);
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
    };

}(window.index = window.index || {}, jQuery));