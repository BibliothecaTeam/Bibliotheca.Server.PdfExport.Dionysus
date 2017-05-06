var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var markdownpdf = require("markdown-pdf");

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());

// set our port
var port = process.env.PORT || 8080;

// get an instance of the express Router
var router = express.Router();

// health route
router.get('/health', function(req, res) {
    res.send('[Dionysos: 1.0.0]  I\'m alive and reachable');   
});

// generator route
router.post('/transform', function(req, res) {
    var markdown = req.body;

    console.log("Body: ", markdown);

    // markdownpdf().from.string(markdown).to("document.pdf", function () {
    //     res.status(200).send("OK");
    // });

    markdownpdf().from.string(markdown).to.buffer(function (error, pdfString) {
        if(error) {
            res.status(400).send(error);
        }
        else {
            console.log("PDF created successfully");
            res.setHeader("Content-Type", "application/pdf");
            res.status(200).send(pdfString);
        }
    });
});

// all of our routes will be prefixed with /api
app.use('/api', router);

// start server
app.listen(port);
console.log('Magic happens on port ' + port);