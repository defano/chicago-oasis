(function (index, $) {

    json.fetch = function (file) {
        var rxdata = null;
        
        $.ajax({
            async: "false",
            url: '/json/' + file,
            dataType: 'json',
            success: function (data) {
                rxdata = data;
            }
        });
        
        return rxdata;
    }

}(window.json = window.json || {}, jQuery));