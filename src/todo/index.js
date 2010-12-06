
var sys = require('sys');

var todo = require('./todo');
var db = require('../db');

this.resource = todo;

//
// Retrieve a list
//
this.get = function (res, id, params, session) {
    id = id.toString();
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
    todo.save(id.toString(), function (e, doc) {
        if (e) {
            res.send(doc.headers.status, {}, e);
        } else {
            res.send(doc.status, {}, doc);
        }
    });
};

