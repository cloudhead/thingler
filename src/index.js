
var journey = require('journey'),
    static = require('node-static'),
    todos = require('./todos'),
    routes = require('./routes');

//
// Create a Router object with an associated routing table
//
var router = new(journey.Router)(routes.map, { strict: true });
var file = new(static.Server)('./pub', { cache: 0 });

this.server = require('http').createServer(function (request, response) {
    var body = "";

    request.addListener('data', function (chunk) { body += chunk });
    request.addListener('end', function () {
        if (request.url === '/') {
            todos.create(function (e, doc) {
                response.writeHead(303, { 'Location': '/' + doc.id });
                response.end();
            });
        } else {
            //
            // Dispatch the request to the router
            //
            router.route(request, body, function (result) {
                if (result.status === 406) { // A request for non-json data
                    file.serve(request, response, function (err, result) {
                        if (err) {
                            file.serveFile('/index.html', request, response);
                        }
                    });
                } else {
                    response.writeHead(result.status, result.headers);
                    response.end(result.body);
                }
            });
        }
    });
});

