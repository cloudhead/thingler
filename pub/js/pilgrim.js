//
// ~ pilgrim.js ~
//
//   stateful xhr client
//
var pilgrim = (function () {
    //
    // Client
    //
    this.Client = function Client(host, options) {
        if (host && (typeof(host) === 'object')) { options = host, host = null }

        options = options || {};

        this.headers   = options.headers   || {};
        this.extension = options.extension || '';
        this.host      = host ? 'http://' + host.replace('http://', '') : '';
    };
    this.Client.prototype.resource = function (path) {
        return this.path(path + this.extension);
    };
    this.Client.prototype.path = function (path) {
        var that = this;

        return {
            path: function (p) { return that.path([path, p].join('/')) },

            get:  function (data, callback) { this.request(true, 'get',    data, callback) },
            put:  function (data, callback) { this.request(true, 'put',    data, callback) },
            post: function (data, callback) { this.request(true, 'post',   data, callback) },
            del:  function (data, callback) { this.request(true, 'delete', data, callback) },
            head: function (data, callback) { this.request(true, 'head',   data, callback) },

            getSync:  function (data, callback) { this.request(false, 'get',    data, callback) },
            putSync:  function (data, callback) { this.request(false, 'put',    data, callback) },
            postSync: function (data, callback) { this.request(false, 'post',   data, callback) },
            delSync:  function (data, callback) { this.request(false, 'delete', data, callback) },

            request: function (async, method /* [data], [callback] */) {
                var query = [], args = Array.prototype.slice.call(arguments, 2)
                                            .filter(function (a) { return a });

                var callback = args.pop() || function () {},
                    data     = args.shift();

                path = (that.host + '/' + path).replace('//', '/');

                if (method === 'get' && data) {
                    for (var k in data) {
                        query.push(k + '=' + encodeURIComponent(data[k]));
                    }
                    path += '?' + query.join('&');
                    data = null;
                }
                return new(pilgrim.XHR)
                          (method, path, data, that.headers, async).send(callback);
            }
        };
    };
    //
    // XHR
    //
    this.XHR = function XHR(method, url, data, headers, async, timeout) {
        this.method = method.toLowerCase();
        this.url    = url;
        this.data   = data || {};
        this.async  = async;
        this.requestDone = false;
        this.timeout = timeout || 0;

        if (window.XMLHttpRequest) {
            this.xhr = new(XMLHttpRequest);
        } else {
            this.xhr = new(ActiveXObject)("MSXML2.XMLHTTP.3.0");
        }

        this.headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept':           'application/json',
            'Cache-Control':    'no-store, no-cache',
            'Pragma':           'no-cache'
        };
        for (var k in headers) { this.headers[k] = headers[k] }
    };
    this.XHR.prototype.send = function (callback) {
        this.data = JSON.stringify(this.data);
        this.xhr.open(this.method, this.url, this.async);

        var that = this;
        var onreadystatechange = this.xhr.onreadystatechange = function (isTimeout) {

            if (that.xhr) {
              var handleComplete = function(xhr, status, responseText) {
                var body = {};
                try {
                   body = responseText ? JSON.parse(responseText) : {};
                } catch(parseError) {
                  if (responseText && typeof responseText === 'string' && responseText.search(/offline/i) != -1) {
                    status = 'error';
                  }
                }

                if (['abort','timeout','error'].indexOf(status) != -1) {
                    callback({ status: status, body: body, xhr: xhr });
                } else if (status >= 200 && status < 300) { // Success
                    callback(null, body);
                } else { // Error
                    callback({ status: status, body: body, xhr: xhr });
                }
              };


              // The request was aborted
              if ( !that.xhr || that.xhr.readyState === 0 || isTimeout === "abort" ) {

                // Opera doesn't call onreadystatechange before this point
                // so we simulate the call
                if ( !that.requestDone ) {
                  var status = isTimeout === 'abort' ? 'abort' : 0;
                  handleComplete(that.xhr, status, that.xhr.responseText);
                }

                that.requestDone = true;

                if ( that.xhr ) {
                  that.xhr.onreadystatechange = function() {};
                }

              } else if ( !that.requestDone && that.xhr && (that.xhr.readyState === 4 || isTimeout === "timeout") ) {
                 that.requestDone = true;
                 that.xhr.onreadystatechange = function() {};


                 var status = isTimeout === "timeout" ? 'timeout' : ((that.xhr.status < 99) ? 'error' : that.xhr.status);

                 handleComplete(that.xhr, status, that.xhr.responseText);

                 if ( isTimeout === "timeout" ) {
                   that.xhr.abort();
                 }

                 // Stop memory leaks
                 if ( that.async ) {
                   that.xhr = null;
                 }

              }

            }
        };

        //Workaround occasional weird resetting of Accepts header in firefox
        if (navigator && navigator.userAgent.search(/firefox/i) != -1) {
          this.xhr.onload = onreadystatechange;
        }

        if (this.timeout && this.timeout > 0) {
          setTimeout(function() {
            if (!this.requestDone) {
              this.xhr.abort();
            }
          },this.timeout);
        }


        // Override the abort handler, if we can (IE doesn't allow it, but that's OK)
        // Opera doesn't fire onreadystatechange at all on abort
        try {
          var oldAbort = xhr.abort;
          this.xhr.abort = function() {
            if ( this.xhr ) {
              oldAbort.call( this.xhr );
            }

            onreadystatechange( "abort" );
          };
        } catch( abortError ) {}

        // Set content headers
        if (this.method === 'post' || this.method === 'put') {
            this.headers['Content-Type'] = 'application/json';
        }

        // Set user headers
        for (k in this.headers) {
            this.xhr.setRequestHeader(k, this.headers[k]);
        }

        // Dispatch request
        this.xhr.send(this.method === 'get' ? null : this.data);

        return this;
    };
    return this;
}).call({});
