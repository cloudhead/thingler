var db = require('./db').database;
var todo = require('./todo').doc;

this.post = function (res, params) {
    this.create(function (e, doc) {
        if (e) {
            res.send(doc.headers.status, {}, doc);
        } else {
            res.send(201, { 'Location': doc.headers.location }, { id: doc.id });
        }
    });
};

this.create = function (callback) {
    var doc = {
        title: todo.title,
        timestamp: new(Date)().toUTCString(),
        items: todo.items
    };
    db.insert(doc, callback);
};
