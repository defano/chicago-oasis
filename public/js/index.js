(function (index, $) {

    /* Initialize the area/geography type radio selection (census tracts vs. neighborhoods)
     */
    function initGeoRadio() {
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

        json.fetch("licenses.json", function (data) {
            $("#business-multiselect").multiselect('dataprovider', data);
        });

        $('#business-multiselect').change(function () {
            index.update();
        });
    }

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

    function initPopovers() {
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        });

        $(function () {
            $('[data-toggle="popover"]').popover()
        });
    }

    function initCriticalBusiness() {
        $("#show-critical-businesses").change(function () {
            index.update();
        });
    }

    function getSelectedBusiness() {
        return $('#business-multiselect').val();
    }

    function getSelectedYear() {
        return $("#year-slider").val();
    }

    function getAreaType() {
        return $('#neighborhood-radio').is(':checked') ? "neighborhood" : "census";
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