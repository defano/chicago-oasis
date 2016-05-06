var express = require('express');
var app = express();
var fs = require('fs');
var marked = require('marked');
var url = require('url')


app.set('views', __dirname + '/public/jade');
app.set('port', (process.env.PORT || 5000));
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use('/lib', express.static(__dirname + '/bower_components'));

app.get('/*.md', function (req, res) {
    var query = url.parse(req.url, true).query;
    var path = __dirname + '/md/' + req.path;
    var file = fs.readFileSync(path, 'utf8');
    var template = "template" in query ? query["template"] : "markdown"

    // I'm sure there's a more clever way to do this...
    res.render(template, {
        markdown: marked(file)
    });
});

app.listen(app.get('port'), function () {
    console.log("Chicago Oasis is running on localhost:" + app.get('port'));
});
