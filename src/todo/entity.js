require.paths.unshift(__dirname + '/..');

var db = require('db').database;
var collection = require('./collection');

this.Entity = function (attributes) {
    this.title = "Hello, I'm a Todo List.";
    this.items = [];
    this.timestamp = new(Date)().toUTCString();

    for (var k in attributes) { this[k] = attributes[k] }
};
this.Entity.prototype = {
    get json() {
        var json = {};
        var keys = Object.keys(this);

        for (var i = 0; i < keys.length; i++) {
            json[keys[i]] = this[keys[i]];
        }
        return json;
    }
};

this.get = function (id, callback) {
    collection.get(id, callback);
};

this.save = function (id, callback) {
    db.get(id, function (e, doc) {
        var newDoc = new(exports.Entity)();

        if (e && (e.error !== 'not_found')) {
            callback(e);
        } else {
            db.put(id, newDoc.json, function (e, doc) {
                if (e) {
                    callback(e);
                } else {
                    callback(null, {
                        title: newDoc.title,
                        _rev: doc._rev,
                        status: doc.headers.status
                    });
                }
            });
        }
    });
};
