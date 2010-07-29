var db = require('./db').database;

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
    db.insert({
        title: "Hello, I'm a Todo List.",
        timestamp: new(Date)().toUTCString(),
        items: []
    }, callback);
};
