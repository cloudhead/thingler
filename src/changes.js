var db = require('./db').database;
var todos = require('./todo/collection');

var cache = {};

this.post = function (res, id, params) {
    todos.get(id, function (err, doc) {
        if (err) { return res.send(doc.headers.status, {}, err) }

        // Apply all the changes to the document
        params.changes.forEach(function (change) {
            if (validate(change)) {
                exports.handlers[change.type](doc, change);
            }
        });

        if (params.changes.length > 0) {
            db.put(id, doc, function (err, doc) {
                if (err) { return res.send(doc.headers.status, {}, err) }
                reply(doc.rev);
                todos.clear(id);
            });
        } else {
            reply(doc._rev);
        }

        function reply(rev) {
            cache[id] = cache[id] || [];

            var dirty = cache[id].slice(0), status = 200;

            rev = rev ? parseInt(rev.match(/^(\d+)-/)[1]) : 0;

            if (params.changes.length > 0) {
                cache[id].push({ rev: rev, changes: params.changes });
                status = 201;
            }
            res.send(status, {}, {
                rev: rev,
                commits: dirty.filter(function (commit) {
                    return commit.rev > params.rev;
                })
            });
        }
    });
};

this.get = function (res, id, params) {
    res.send(200, {}, { changes: cache[id] });
};

this.handlers = {
    insert: function (doc, change) {
        if (doc.items.length < 256) {
            doc.items.unshift({ title: sanitize(change.value) });
        }
    },
    title: function (doc, change) {
        doc.title = sanitize(change.value);
    },
    sort: function (doc, change) {
        var index = indexOf(change.title, doc), item;
        if (index !== -1) {
            item = doc.items.splice(index, 1)[0];
            doc.items.splice(change.to, 0, item);
        }
    },
    check: function (doc, change) {
        var item = find(change.title, doc);
        if (item) {
            item.completed = Date.now();
        }
    },
    uncheck: function (doc, change) {
        var item = find(change.title, doc);
        if (item) {
            delete(item.completed);
        }
    },
    remove: function (doc, change) {
        var index = indexOf(change.title, doc);
        if (index !== -1) {
            doc.items.splice(index, 1);
        }
    }
};

function validate(change) {
    if (change.type && (change.type in this.handlers)) {
        if ('value' in change) {
            if ((typeof(change.value) !== 'string') || change.value.length > 256) {
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

function find(title, doc) {
    for (var i = 0; i < doc.items.length; i++) {
        if (doc.items[i].title === title) {
            return doc.items[i];
        }
    }
    return null;
}
function indexOf(title, doc) {
    for (var i = 0; i < doc.items.length; i++) {
        if (doc.items[i].title === title) {
            return i;
        }
    }
    return -1;
}
