
var sys = require('sys');

var todo = require('./todo');

this.resource = todo;

//
// Retrieve a list
//
this.get = function (res, id, params) {
    todo.get(id, function (e, doc) {
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
    todo.save(id, function (e, doc) {
        if (e) {
            res.send(doc.headers.status, {}, e);
        } else {
            res.send(doc.headers.status, {}, doc);
        }
    });
};

this.protect = function (res, id, params) {
    todo.get(id, function (e, doc) {
        new(todo.Todo)(doc).update({
            password: params.password
        }).save(function (e, doc) {
            res.send(200);
        });
    });
};

this.unprotect = function (res, id, params) {
    todo.get(id, function (e, doc) {
        new(todo.Todo)(doc).update({
            password: null
        }).save(function (e, doc) {
            res.send(200);
        });
    });
};
