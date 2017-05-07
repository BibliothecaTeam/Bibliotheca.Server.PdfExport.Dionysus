var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var markdownpdf = require("markdown-pdf");
var request     = require('request');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(bodyParser.text({limit: '10mb'}));

// set our port
var port = process.env.PORT || 8080;
var secureToken = process.env.SecureToken || "";

var serverAddress = process.env.ServerAddress || "http://localhost:8500";
var serviceId = process.env.ServiceId || "bibliotheca-pdfexport-dionysus";
var serviceName = process.env.ServiceName || "Bibliotheca PdfExport Dionysus";
var serviceHttpHealthCheck = process.env.ServiceHttpHealthCheck || "http://localhost:8080/api/health";
var serviceAddress = process.env.ServiceAddress || "http://localhost";
var servicePort = process.env.ServicePort || "8080";

var serviceInfo = {
  "ID": serviceId,
  "Name": serviceName,
  "Tags": [
    "bibliotheca",
    "pdfexport",
    "dionysus"
  ],
  "Address": serviceAddress,
  "Port": Number(servicePort),
  "EnableTagOverride": false,
  "Check": {
    "HTTP": serviceHttpHealthCheck,
    "Interval": "15s"
  }
};

function registerService() {
    request.put(
        serverAddress + "/v1/agent/service/register",
        { json: serviceInfo },
        function (error, response, body) {
            if (!error) {
                console.log("Registered successfully.");
            }

            if(error) {
                console.error("Registered failed.");
                console.error(error);
            }
        }
    );
}

// get an instance of the express Router
var router = express.Router();

// health route
router.get('/health', function(req, res) {
    res.send('[Dionysos: 1.0.1]  I\'m alive and reachable');   
});

// generator route
router.post('/transform', function(req, res) {

    var token = req.header("Authorization");
    if(token) {
        token = token.replace("SecureToken ", "");
    }
    
    if(!token || token !== secureToken) {
        res.setHeader("WWW-Authenticate", "SecureToken realm=\"Bibliotheca API\"");
        res.status(401).send();
        return;
    }

    var markdown = req.body;
    markdownpdf({
        cssPath: "pdf.css"
    }).from.string(markdown).to.buffer(function (error, pdfString) {
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

// register app in service discovery
setInterval(registerService, 60*1000);

// start server
app.listen(port);
console.log('Magic happens on port ' + port);