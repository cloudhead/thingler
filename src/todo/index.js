
var sys = require('sys');

var entity = require('./entity');

//
// Retrieve a list
//
this.get = function (res, id, params) {
    entity.get(id, function (e, doc) {
        if (e) {
            res.send(doc.headers.status, {}, e);
        } else {
            res.send(200, {}, doc);
        }
    })
};

//
// Update a list, or create a named list
//
this.put = function (res, id, params) {
    entity.save(id, function (e, doc) {
        if (e) {
            res.send(doc.headers.status, {}, e);
        } else {
            res.send(doc.headers.status, {}, doc);
        }
    });
};
