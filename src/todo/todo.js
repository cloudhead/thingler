
var uuid = require('../uuid');

require.paths.unshift(__dirname + '/..');

var db = require('db').database;

var cache = {};

this.Todo = function (attributes) {
    this.title = "Hello, I'm a Todo List.";
    this.items = [];
    this.timestamp = new(Date)().toUTCString();

    for (var k in attributes) { this[k] = attributes[k] }
};
this.Todo.prototype = {
    get json () {
        var that = this;

        return Object.keys(this).reduce(function (json, k) {
            json[k] = that[k];
            return json;
        }, {});
    },
    update: function (obj) {
        var that = this;
        Object.keys(obj).forEach(function (k) {
            that[k] = obj[k];
        })
        return this;
    },
    save: function (callback) {
        db.put(this._id, this.json, function (e, res) {
            callback(e, res);
        });
    }
};

this.create = function (callback) {
    uuid.generate(function (id) {
        cache[id] = new(exports.Todo)({ _id: id });
        callback(id);
    });
};

this.clear = function (id) {
    delete(cache[id]);
};

this.get = function (id, callback) {
    process.nextTick(function () {
        if (id in cache) {
            callback(null, cache[id].json);
        } else {
            db.get(id, function (e, result) {
                if (e) {
                    callback(e, result);
                } else {
                    callback(null, result.json);
                }
            });
        }
    });
};

this.save = function (id, callback) {
    db.get(id, function (e, doc) {
        var newDoc = new(exports.Todo)();

        if (e && (e.error !== 'not_found')) {
            callback(e);
        } else {
            db.put(id, newDoc.json, function (e, doc) {
                if (e) {
                    callback(e, doc);
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
