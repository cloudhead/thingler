
var session = require('./session');
var todo = require('../todo').resource;
var md5 = require('../md5');

this.resource = session;

this.post = function (res, id, params, sess) {
    id = id.toString();
    if (sess) {
        todo.get(id, function (e, doc) {
            if (! doc.password) {
                res.send(201);
            } else if (doc.password === md5.digest(params.password)) {
                session.authenticate(sess, id);
                res.send(201);
            } else {
                res.send(401, {}, { error: 'wrong password' });
            }
        });
    } else {
        res.send(401);
    }
};
this.del = function (res, id, params) {

};
