
var fs = require('fs');
var sys = require('sys');

var journey = require('journey'),
    static = require('node-static');

var todo = require('./todo/collection'),
    routes = require('./routes');

var options = {
    port: parseInt(process.argv[2]) || 8080,
    lock: '/tmp/thinglerd.pid'
};

var env = (process.env['NODE_ENV'] === 'production' ||
           options.port === 80) ? 'production' : 'development';

//
// Create a Router object with an associated routing table
//
var router = new(journey.Router)(routes.map, { strict: true });
var file   = new(static.Server)('./pub', { cache: env === 'production' ? 3600 : 0 });

this.server = require('http').createServer(function (request, response) {
    var body = [];

    request.addListener('data', function (chunk) { body.push(chunk) });
    request.addListener('end', function () {
        if (request.url === '/') {
            todo.create(function (id) {
                response.writeHead(303, { 'Location': '/' + id });
                response.end();
            });
        } else {
            //
            // Dispatch the request to the router
            //
            router.route(request, body.join(''), function (result) {
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

this.server.listen(options.port);

if (env === 'production') {
    // Write lock file
    fs.writeFileSync(options.lock, process.pid.toString() + '\n', 'ascii');
}

process.on('uncaughtException', function (err) {
    if (env === 'production') {
        fs.writeFileSync('crash-report.log', err.stack, 'ascii');
        process.exit(1);
    } else {
        sys.error(err.stack);
    }
});
process.on('exit', function () {
    (env === 'production') && fs.unlinkSync(options.lock);
});
