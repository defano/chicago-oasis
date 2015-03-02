var express = require('express');
var app = express();
var fs = require('fs');
var marked = require('marked');

app.set('views', __dirname + '/public/jade');
app.set('port', (process.env.PORT || 5000));
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use('/lib', express.static(__dirname + '/bower_components'));

app.get('/*.md', function (req, res) {
    var path = __dirname + '/md/' + req.path;
    var file = fs.readFileSync(path, 'utf8');

    // I'm sure there's a more clever way to do this...
    res.render('markdown', {
        markdown: marked(file)
    });
});

app.listen(app.get('port'), function () {
    console.log("Node app is running at localhost:" + app.get('port'));
});