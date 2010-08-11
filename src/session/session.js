
var uuid = require('../uuid');

// Session store
var store = {};

this.store = store;

// Prune un-used sessions every hour
setInterval(function () { exports.prune() }, 3600);

this.maxAge = 3600 * 24; // 1 day

this.generate = function (callback) {
    uuid.generate(function (id) {
        store[id] = {
            id:    id,
            ctime: Date.now(),
            atime: Date.now(),
            authenticated: []
        };
        callback(id);
    });
};
this.create = function (req, callback) {
    var id = this.extract(req);

    if (!id || !(id in store)) {
        this.generate(function (id) {
            callback({ 'Set-Cookie':'SESSID=' + id });
        });
    } else {
        callback(null);
    }
};

this.extract = function (req) {
    if (req.headers['cookie']) {
        if (match = req.headers['cookie'].match(/SESSID=(\w{32})/)) {
            return match[1];
        } else {
            return null;
        }
    }
};

this.retrieve = function (req) {
    return this.get(this.extract(req));
};

this.get = function (id) {
    if (id in store) {
        store[id].atime = Date.now();
        return store[id];
    } else {
        return null;
    }
};

this.authenticate = function (session, docId) {
    session.atime = Date.now();
    return session.authenticated.push(docId);
};

this.prune = function () {
    var keys = Object.keys(store);
    var now  = Date.now();

    for (var i = 0, key; i < keys.length; i++) {
        key = keys[i];
        if (now - store[key].atime > this.maxAge) {
            delete(store[key]);
        }
    }
};
