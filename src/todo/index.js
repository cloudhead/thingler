
var sys = require('sys');

var todo = require('./todo');
var md5 = require('../md5');

this.resource = todo;

//
// Retrieve a list
//
this.get = function (res, id, params, session) {
    todo.get(id, function (e, doc) {
        if (e) {
            res.send(doc.headers.status, {}, e);
        } else {
            if (doc.password) {
                if (! session) {
                    res.send(401, {}, { error: 'you must be logged in' });
                } else if (session.authenticated.indexOf(id) === -1) {
                    res.send(401, {}, { error: "you don't have permission to view this url" });
                } else {
                    doc.locked = true;
                    res.send(200, {}, doc);
                }
            } else {
                res.send(200, {}, doc);
            }
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

this.protect = function (res, id, params, session) {
    todo.get(id, function (e, doc) {
        new(todo.Todo)(doc).update({
            password: md5.digest(params.password)
        }).save(function (e, doc) {
            session.authenticated.push(id);
            res.send(200, {}, doc);
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
