(function (index, $) {

    json.fetch = function (file, callback) {
        var rxdata = null;
        
        $.ajax({
            url: '/json/' + file,
            dataType: 'json',
            success: function(data) {
                callback(data);
            }
        });
        
        return rxdata;
    }

}(window.json = window.json || {}, jQuery));