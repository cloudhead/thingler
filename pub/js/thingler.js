//
// ~ thingler.js ~
//
var path  = window.location.pathname;
var id    = path.slice(1);
var xhr   = new(pilgrim.Client)({ mime: 'application/json' });
var input = document.getElementById('new');
var title = document.getElementById('title');
var list  = document.getElementById('list');

//
// The Great Synchronization Clock
//
var clock = {
    timer: null,
    interval: 1000,
    init: function (callback) {
        this.callback = callback;
        this.reset(1000);
    },
    //
    // Creates a new timer based the interval
    // passed.
    //
    reset: function (interval) {
        // One hour maximum interval
        this.interval = Math.min(interval, 3600000);

        if (this.timer)   { clearInterval(this.timer) }
        if (this.timeout) { clearTimeout(this.timeout) }

        this.timer = setInterval(function () {
            clock.tick();
        }, this.interval);

        // In `this.interval * 4` milliseconds,
        // double the interval.
        // Note that this could never happen,
        // if a `reset` is executed within that time.
        this.timeout = setTimeout(function () {
            clock.reset(clock.interval * 2);
        }, this.interval * 4);
    },
    //
    // Called on every interval tick.
    //
    tick: function () {
        this.callback(this);
    },
    //
    // Called on inbound & outbound activity.
    // We either preserve the current interval length,
    // if it's the shortest possible, or divide it by four.
    //
    activity: function () {
        if (this.interval < 4000) {
            this.reset(1000);
        } else {
            this.reset(this.interval / 4);
        }
        return true;
    }
};

var rev        = null;
var changes    = {
    data:  [],
    push:  function (change) { return clock.activity() && this.data.push(change) },
    clear: function ()       { return this.data = [] }
};

var titleHasFocus = false;

//
// New Item
//
input.addEventListener('keydown', function (e) {
    if (e.keyCode === 13) {
        var item = createItem({ title: input.value, timestamp: Date.now() });

        changes.push({ type: 'insert', value: input.value });
        list.insertBefore(item, list.firstChild);
        input.value = '';
        dom.flash(item);
        dom.sortable(list, handleSort);
    }
    return false;
}, false);

//
// Handle title changes
//
title.addEventListener('focus', function (e) {
    titleHasFocus = true;
}, false);
title.addEventListener('blur', function (e) {
    titleHasFocus = false;
    changes.push({ type: 'title', value: title.value });
}, false);

// Focus the main input field
setTimeout(function () { input.focus() }, 50);

xhr.resource(id).get()(function (err, doc) {
    if (err) {
        go('not-found');
    } else {
        go('page');

        title.value = doc.title;
        rev         = parseInt(doc._rev.match(/^(\d+)/)[1]);

        doc.items.forEach(function (item) {
            list.appendChild(createItem(item));
        });
        dom.sortable(list, handleSort);
    }
    function go(page) {
        document.getElementById(page).style.display = 'block';
    }
});

var handlers = {
    insert: function (change) {
        var item = createItem({ title: change.value });
        list.insertBefore(item, list.firstChild);
        dom.sortable(list, handleSort);
        dom.flash(item);
    },
    title: function (change) {
        title.value = change.value;
        dom.flash(title);
    },
    check: function (change) {
        var element = find(change.title);
        element.querySelector('[type="checkbox"]').checked = true;
        element.setAttribute('class', 'completed');
        dom.flash(element);
    },
    uncheck: function (change) {
        var element  = find(change.title),
            checkbox = element.querySelector('[type="checkbox"]');

        checkbox.checked  = false;
        checkbox.disabled = false;
        element.setAttribute('class', '');
        dom.flash(element);
    },
    remove: function (change) {
        var element = find(change.title);
        element && list.removeChild(element.parentNode);
    },
    sort: function (change) {
        var elem  = find(change.title).parentNode,
            index = dom.getIndex(elem),
            ref   = list.childNodes[change.to];

        if (change.to > index) {
            if (change.to === list.childNodes.length - 1) {
                list.appendChild(elem);
            } else {
                list.insertBefore(elem, ref.nextSibling);
            }
        } else {
            list.insertBefore(elem, ref);
        }
        dom.flash(elem);
    }
};

//
// Synchronization
//
clock.init(function (clock) {
    xhr.resource(id).post({
        rev:     rev,
        changes: changes.data
    })(function (err, doc) {
        if (err) {
            console.log(err);
        } else if (doc && doc.commits) {
            rev = doc.rev;

            if (doc.commits.length > 0) {
                doc.commits.forEach(function (commit) {
                    commit.changes.forEach(function (change) {
                        handlers[change.type](change);
                    });
                });
                clock.activity();
            }
            changes.clear();
        }
    });
});

//
// Find an item by `title`
//
function find(title) {
    return list.querySelector('[data-title="' + title + '"]');
}

function createItem(item) {
    var template = document.getElementById('todo-template');
    var e        = dom.createElement('li'),
        clone    = template.cloneNode(true),
        remove   = clone.querySelector('a[data-action="remove"]'),
        checkbox = clone.querySelector('input');

    if (item.completed) {
        checkbox.checked  = true;
        checkbox.disabled = true;
        clone.setAttribute('class', 'completed');
    }

    clone.id = '';
    clone.setAttribute('style', '');

    Object.keys(item).forEach(function (k) {
        clone.setAttribute('data-' + k, item[k]);
    });

    e.appendChild(clone);

    // Remove Item
    remove.onclick = function () {
        list.removeChild(e);
        changes.push({ type: 'remove', title: item.title });
        return false;
    };

    // Check Item
    checkbox.addEventListener('click', function () {
        if (this.checked) {
            changes.push({ type: 'check', title: item.title });
            clone.setAttribute('class', 'completed');
        } else {
            changes.push({ type: 'uncheck', title: item.title });
            clone.setAttribute('class', '');
        }
    }, false);

    clone.querySelector('label').innerHTML = item.title;

    return e;
}

function handleSort(title, to) {
    return changes.push({ type: 'sort', title: title, to: to });
}

