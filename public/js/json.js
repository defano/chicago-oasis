(function (index, $) {
    "use strict";

    json.fetch = function (file, callback) {
        $.ajax({
            url: '/json/' + file,
            dataType: 'json',
            success: function (data) {
                callback(data);
            },
            error: function (xhr, status, error) {
                console.log("Request failed for " + file + " with status: " + status + ", " + error);
            }
        });
    };

}(window.json = window.json || {}, jQuery));