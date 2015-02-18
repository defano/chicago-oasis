(function (index, $) {

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
        return $('#neighborhood-radio').is(":checked") ? "neighborhood" : "census";
    }

    /*
     * Invoked when a user makes a UI selection that affects map rendering
     */
    index.update = function () {
        var dataset = getAreaType() + "-" + getSelectedBusiness() + "-" + getSelectedYear() + ".json";
        console.log(dataset);

        // Update polygons and shading
        // TODO: Cache this result and only fetch/update when required
        if (getAreaType() == "census") {
            maps.showCensusTracts();
            maps.setCensusData(dataset);
        } else {
            maps.showCommunities();
            maps.setCommunityData(dataset);
        }

        // Update critical business markers
        // TODO: Cache this result and only fetch/update when required
        if ($("#show-critical-businesses").is(':checked')) {
            var datafile = "critical-" + getSelectedBusiness() + "-" + getSelectedYear() + ".json";
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
    };

}(window.index = window.index || {}, jQuery));