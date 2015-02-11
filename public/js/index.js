(function (index, $) {

    var year = 2007;
    var geo = "neighborhood";
    var business = "Food";

    function initGeoRadio() {
        $('#neighborhood-radio').change(function () {
            if ($(this).is(':checked')) {
                geo = "neighborhood";
                index.update();
            }
        });

        $('#census-radio').change(function () {
            if ($(this).is(':checked')) {
                geo = "census";
                index.update();
            }
        });
    }

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
    }

    function initYearSlider() {

        // Continually update the label...
        $("#year-slider").slider().on('slide', function (event) {
            $("#year-value").text(event.value);
        });

        // But only fire the update function once user has made a selection
        $("#year-slider").slider().on('slideStop', function (event) {
            $("#year-value").text(event.value);
            year = event.value;
            index.update();
        });
    }

    function initBusinessDropdown() {
        $(".dropdown-menu li a").click(
            function () {
                $("#business-dropdown").html(
                    $(this).text() + " <span class='caret'></span>");
                business = $(this).text();
                index.update();
            });
    }

    function initBusinessMarkerRadios() {
        $('#show-business-markers').change(function () {
            if ($(this).is(":checked")) {
                $("#critical-businesses").attr('disabled', false);
                $("#all-businesses").attr('disabled', false);
            } else {
                $("#critical-businesses").attr('disabled', true);
                $("#all-businesses").attr('disabled', true);
            }
        });
    }

    index.update = function () {
        if (geo == "census") {
            maps.showCensusTracts();
            
            // TODO: Load dataset based on current UI selections
            maps.setCensusData("grocery-tracts.json");
        } else {
            maps.showCommunities();

            // TODO: Load dataset based on current UI selections
            maps.setCommunityData(null);
        }

        console.log("Showing " + business + " across " + geo + " for year " + year);
    };

    index.init = function () {
        
        initBusinessMarkerRadios();
        initYearSlider();
        initBusinessDropdown();
        initGeoRadio();
        initBusinessMultiselect();
    };

}(window.index = window.index || {}, jQuery));