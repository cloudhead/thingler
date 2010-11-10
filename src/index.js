
var fs = require('fs');
var sys = require('sys');
var http = require('http');
var Buffer = require('buffer').Buffer;

var journey = require('journey'),
    static = require('node-static');

var todo = require('./todo').resource,
    session = require('./session/session'),
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

this.server = http.createServer(function (request, response) {
    var body = [], log;

    request.addListener('data', function (chunk) { body.push(chunk) });
    request.addListener('end', function () {
        log = [request.method, request.url, body.join('')];

        // If the response hasn't completed within 5 seconds
        // of the request, send a 500 back.
        var timer = setTimeout(function () {
            if (! response.finished) {
                if (request.headers.accept.indexOf('application/json') !== -1) {
                    response.writeHead(500, {});
                    response.end(JSON.stringify({error: 500}));
                } else {
                    file.serveFile('/error.html', 500, {}, request, response);
                }
            }
        }, 5000);

        if (/MSIE [0-8]/.test(request.headers['user-agent'])) { // Block old IE
            file.serveFile('/upgrade.html', 200, {}, request, response);
            clearTimeout(timer);
        } else if (request.url === '/') {
            todo.create(function (id) {
                finish(303, { 'Location': '/' + id });
            });
        } else {
            //
            // Dispatch the request to the router
            //
            router.route(request, body.join(''), function (result) {
                if (result.status === 406) { // A request for non-json data
                    file.serve(request, response, function (err, result) {
                        if (err) {
                            file.serveFile('/index.html', 200, {}, request, response);
                            clearTimeout(timer);
                        }
                    });
                } else {
                    session.create(request, function (header) {
                        if (header) { result.headers['Set-Cookie'] = header['Set-Cookie'] }
                        finish(result.status, result.headers, result.body);
                    });
                }
            });
        }
        function finish(status, headers, body) {
            response.writeHead(status, headers);
            body ? response.end(body) : response.end();
            clearTimeout(timer);

            sys.puts([
                new(Date)().toJSON(),
                log.join(' '),
                [status, http.STATUS_CODES[status], body].join(' ')
            ].join(' -- '));
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
        fs.open('thinglerd.log', 'a+', 0666, function (e, fd) {
            var buffer = new(Buffer)(new(Date)().toUTCString() + ' -- ' + err.stack + '\n');
            fs.write(fd, buffer, 0, buffer.length, null);
        });
    } else {
        sys.error(err.stack);
    }
});
process.on('exit', function () {
    (env === 'production') && fs.unlinkSync(options.lock);
});
