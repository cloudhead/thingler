var db = require('./db').connection;

var cache = [];

this.generate = function (callback) {
    if (cache.length > 0) {
        callback(cache.pop());
    } else {
        db.uuids(100, function (err, data) {
            Array.prototype.push.apply(cache, data);
            callback(cache.pop());
        });
    }
};
