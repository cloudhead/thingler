var sys = require('sys');

var db = require('./db').database;

//
// Retrieve a list
//
this.get = function (res, id, params) {
    db.get(id, function (e, result) {
        if (e) {
            res.send(result.headers.status, {}, result.doc);
        } else {
            res.send(200, {}, result.doc || result);
        }
    });
};

//
// Update a list
//
this.put = function (res, id, params) {
    db.get(id, function (e, doc) {
        if (e) {
            res.send(doc.headers.status, {}, doc.doc);
        } else {
            delete(params._id);
            delete(params._rev);

            db.save(id, params, function (e, doc) {
                if (e) {
                    res.send(doc.headers.status, {}, doc.doc);
                } else {
                    res.send(200, {}, { ok: true });
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
            res.send(result.headers.status, {}, result.doc);
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
            res.send(doc.headers.status, {}, doc.doc);
        } else {
            db.save(id, { items: [item].concat(doc.items) }, function (e, doc) {
                if (e) {
                    res.send(doc.headers.status, {}, doc.doc);
                } else {
                    res.send(201, {}, { ok: true });
                }
            });
        }
    });
};
