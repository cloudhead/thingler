var sys = require('sys')

var uuid = require('./uuid'),
    db = require('../db').database;

var Entity = require('./entity').Entity;

var cache = {};

this.create = function (callback) {
    uuid.generate(function (id) {
        cache[id] = new(Entity)();
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
