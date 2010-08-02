var db = require('./db').database;
var todos = require('./todo/collection');

var cache = {};

this.post = function (res, id, params) {
    todos.get(id, function (err, doc) {
        if (err) { return res.send(doc.headers.status, {}, err) }

        // Apply all the changes to the document
        params.changes.forEach(function (change) {
            exports.handlers[change.type](doc, change);
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

            var dirty = cache[id].slice(0);

            rev = rev ? parseInt(rev.match(/^(\d+)-/)[1]) : 0;

            if (params.changes.length > 0) {
                cache[id].push({ rev: rev, changes: params.changes });
            }
            res.send(201, {}, {
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
        doc.items.unshift({ title: change.value });
    },
    title: function (doc, change) {
        doc.title = change.value;
    },
    sort: function (doc, change) {
        var index = indexOf(change.title, doc),
            item  = doc.items.splice(index, 1)[0];

        doc.items.splice(change.to, 0, item);
    },
    check: function (doc, change) {
        find(change.title, doc).completed = Date.now();
    },
    uncheck: function (doc, change) {
        delete(find(change.title, doc).completed);
    },
    remove: function (doc, change) {
        var index = indexOf(change.title, doc);
        doc.items.splice(index, 1);
    }
};

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
