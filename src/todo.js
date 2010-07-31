var sys = require('sys');

var db = require('./db').database;

this.doc = {
    title: "Hello, I'm a Todo List.",
    items: []
};

//
// Retrieve a list
//
this.get = function (res, id, params) {
    db.get(id, function (e, result) {
        if (e) {
            res.send(result.headers.status, {}, result.json);
        } else {
            res.send(200, {}, result.json || result);
        }
    });
};

//
// Update a list, or create a named list
//
this.put = function (res, id, params) {
    db.get(id, function (e, doc) {
        var newDoc = {
            title: exports.doc.title,
            items: [],
            timestamp: new(Date)().toUTCString()
        };
        if (e && (e.error !== 'not_found')) {
            res.send(doc.headers.status, {}, doc.json);
        } else {
            db.put(id, newDoc, function (e, doc) {
                if (e) {
                    res.send(doc.headers.status, {}, doc.json);
                } else {
                    res.send(doc.headers.status, {}, {
                        title: newDoc.title,
                        _rev: doc._rev
                    });
                }
            });
        }
    });
};

//
// Destroy a list
//
this.del = function (res, id, params) {
    db.remove(id, function (e, result) {
        if (e) {
            res.send(result.headers.status, {}, result.json);
        } else {
            res.send(200, {}, { ok: true });
        }
    });
};

//
// Add an item to the list
//
this.post = function (res, id, params) {
    db.get(id, function (e, doc) {
        var item = params.item;

        if (e) {
            res.send(doc.headers.status, {}, doc.json);
        } else {
            db.save(id, { items: [item].concat(doc.items) }, function (e, doc) {
                if (e) {
                    res.send(doc.headers.status, {}, doc.json);
                } else {
                    res.send(201, {}, { ok: true });
                }
            });
        }
    });
};
