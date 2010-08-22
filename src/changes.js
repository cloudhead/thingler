var db = require('./db').database;
var parseRev = require('./db').parseRev;
var todo = require('./todo').resource;
var md5 = require('./md5');

var cache = {};

var hour = 3600 * 1000;

// Remove commits older than an hour.
// The maximum client polling time is one hour,
// so by this time, all connected clients should
// be up-to-date.
setInterval(function () {
    var now = Date.now();
    Object.keys(cache).forEach(function (k) {
        if (now - cache[k].ctime > hour) {
            delete(cache[k]);
        }
    });
}, hour);

this.post = function (res, id, params, session) {
    todo.get(id, function (err, doc) {
        if (err) { return res.send(doc.headers.status, {}, err) }

        var changes = params.changes;

        // Apply all the changes to the document
        changes.forEach(function (change) {
            if (validate(change)) {
                exports.handlers[change.type](doc, change, session);
            }
        });

        if (changes.length > 0) {
            db.put(id, doc, function (err, doc) {
                if (err) {
                    return res.send(doc.headers.status, {}, err);
                }
                reply(doc.rev);
                todo.clear(id);
            });
        } else {
            reply(doc._rev);
        }

        function reply(rev) {
            cache[id] = cache[id] || [];

            var dirty = cache[id].slice(0), status = 200;

            rev = rev ? parseRev(rev) : 0;

            if (changes.length > 0) {
                cache[id].push({ rev: rev, changes: changes, ctime: Date.now() });
                status = 201;
            }

            // If it's a goodbye, don't send anything back, just an OK
            if (params.last) {
                res.send(status);
            } else {
                res.send(status, {}, {
                    rev: rev,
                    commits: dirty.filter(function (commit) {
                        return commit.rev > params.rev;
                    })
                });
            }
        }
    });
};

this.get = function (res, id, params) {
    res.send(200, {}, { changes: cache[id] });
};

this.handlers = {
    insert: function (doc, change) {
        if (doc.items.length < 256) {
            if (! Array.isArray(change.tags)) { return }
            doc.items.unshift({
                id:    change.id,
                title: sanitize(change.title),
                tags:  change.tags
            });
        }
    },
    title: function (doc, change) {
        doc.title = sanitize(change.value);
    },
    edit: function (doc, change) {
        var item = find(change.id, doc);
        if (item) {
            item.title = change.title;
            item.tags = change.tags;
        }
    },
    sort: function (doc, change) {
        var index = indexOf(change.id, doc), item;
        if (index !== -1) {
            item = doc.items.splice(index, 1)[0];
            doc.items.splice(change.to, 0, item);
        }
    },
    check: function (doc, change) {
        var item = find(change.id, doc);
        if (item) {
            item.completed = Date.now();
        }
    },
    uncheck: function (doc, change) {
        var item = find(change.id, doc);
        if (item) {
            delete(item.completed);
        }
    },
    remove: function (doc, change) {
        var index = indexOf(change.id, doc);
        if (index !== -1) {
            doc.items.splice(index, 1);
        }
    },
    lock: function (doc, change, session) {
        if (session) {
            session.authenticated.push(doc._id);
            doc.password = md5.digest(change.password);
        }
    },
    unlock: function (doc, change, session) {
        doc.password = null;
    }
};

function validate(change) {
    if (change.type && (change.type in exports.handlers)) {
        if ('title' in change) {
            if ((typeof(change.title) !== 'string') || change.title.length > 256) {
                return false;
            }
        }
    } else {
        return false;
    }
    return true;
}
function sanitize(str) {
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function find(id, doc) {
    for (var i = 0; i < doc.items.length; i++) {
        if (doc.items[i].id === id) {
            return doc.items[i];
        }
    }
    return null;
}
function indexOf(id, doc) {
    for (var i = 0; i < doc.items.length; i++) {
        if (doc.items[i].id === id) {
            return i;
        }
    }
    return -1;
}
