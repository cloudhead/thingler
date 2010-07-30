//
// pilgrim - a stateful javascript REST library for the browser
//
var pilgrim = (function () {
    var exports = {};

    function Context(ctx, ident) {
        if (ctx) {
            this.host = ctx.host;
            this.headers = ctx.headers;
            this.path = ctx.path.slice(0);

            if (ident && ident !== '/') {
                this.path.push(ident);
            }
        } else {
            this.path = [];
        }
    }

    function resource(name) {
        var context = new(Context)(this, name);

        context.id = function () {
            return id.apply(context, arguments);
        };
        return context;
    }
    function id(n) {
        var context = new(Context)(this, n);

        context.resource = function () {
            return resource.apply(context, arguments);
        };
        return context;
    }

    Context.prototype.url = function () {
        return this.host + '/' + this.path.join('/');
    };

    Context.prototype.request = function (method, data, headers) {
        var query = [], url = this.url();

        if (method === 'get' && data) {
            for (var k in data) {
                query.push(k + '=' + data[k]);
            }
            url += '?' + query.join('&');
            data = null;
        }

        return function (callback) {
            return new(pilgrim.XHR)
                      (method, url, data, headers || {}).send(callback);
        };
    };

    ["get", "put", "post", "del"].forEach(function (m) {
        Context.prototype[m] = function (data) {
            return this.request.call(this, m, data);
        };
    });

    //
    // Client
    //
    exports.Client = function Client(host, options) {
        if (host && (typeof(host) === 'object')) { options = host, host = null }

        options = options || {};
        this.context = new(Context);
        this.context.headers = { accept: 'application/json' };
        this.context.host = host ? 'http://' + host.replace('http://', '') : '';
    };
    exports.Client.prototype.resource = function (name) {
        return resource.call(this.context, name);
    };

    //
    // XHR
    //
    exports.XHR = function XHR(method, url, data, headers) {
        this.method = method.toLowerCase();
        this.url = url;
        this.data = data || {};
        this.xhr = new(XMLHttpRequest);
        this.headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        };

        if (headers.accept) { this.headers['Accept'] = headers.accept }
    };
    exports.XHR.prototype.send = function (callback) {
        var that = this;
        this.xhr.open(this.method, this.url, true);
        this.xhr.onreadystatechange = function () {
            if (this.readyState != 4) { return }

            that.body = this.responseText;
            that.xml = this.responseXML;

            // Success
            if (this.status >= 200 && this.status < 300) {
                if (typeof(callback) === 'function') {
                    callback(null, JSON.parse(that.body));
                }
            // Error
            } else {
                if (typeof(callback) === 'function') {
                    callback(this.status);
                }
            }
        };

        if (this.method == 'post' || this.method == 'put') {
            this.headers['Content-Type'] = 'application/json';
        }

        for (k in this.headers) {
            this.xhr.setRequestHeader(k, this.headers[k]);
        }

        this.xhr.send(this.method === 'get' ? null : JSON.stringify(this.data));

        return this;
    };

    return exports;
})();
