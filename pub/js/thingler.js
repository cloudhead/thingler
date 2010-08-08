//
// ~ thingler.js ~
//
var path  = window.location.pathname;
var id    = path.slice(1);
var xhr   = new(pilgrim.Client)({ mime: 'application/json' });
var input = document.getElementById('new');
var title = document.getElementById('title');
var list  = document.getElementById('list');
var about = document.getElementById('about');
var create = document.getElementById('create');
var footer = document.querySelector('footer');
var hash   = window.location.hash;

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
    push:  function (type, change) {
        change.type = type;
        this.data.push(change);
        clock.tick();
    },
    clear: function ()             { return this.data = [] }
};

var titleHasFocus = false;
var tagPattern = /\B#[a-zA-Z0-9_-]+\b/g;

//
// New Item
//
input.addEventListener('keydown', function (e) {
    if (e.keyCode === 13 && input.value.length > 0) {
        var value = input.value.replace(/</g, '&lt;').replace(/>/, '&gt;');
        var tags = value.match(tagPattern) || [], item;

        value = value.replace(tagPattern, '').trim();
        tags = tags.map(function (tag) { return tag.slice(1) });
        item = createItem({
            title: value,
            tags: tags,
            timestamp: Date.now()
        });

        changes.push('insert', { tags: tags, value: value });
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
    changes.push('title', { value: title.value });
}, false);

xhr.resource(id + '.json').get()(function (err, doc) {
    if (err) {
        go('not-found');
        if (id.match(/^[a-zA-Z0-9-]+$/)) {
            create.onclick = function () {
                xhr.resource(id).put()(function (e, doc) {
                    if (e) {

                    } else {
                        go('page');
                        dom.hide(document.getElementById('not-found'));
                        initialize(doc);
                    }
                });
                return false;
            };
        } else {
            dom.hide(create);
        }
    } else {
        go('page');

        footer.style.visibility = 'visible'
        initialize(doc);

        // Initialize list
        doc.items.forEach(function (item) {
            list.appendChild(createItem(item));
        });
        handleTagFilter(hash.slice(1));
        dom.sortable(list, handleSort);
    }

    function go(page) {
        document.getElementById(page).style.display = 'block';
        if (page === 'page') { input.focus() }
    }
    function initialize(doc) {
        // Initialize title and revision number
        title.value = doc.title;
        rev         = doc._rev && parseInt(doc._rev.match(/^(\d+)/)[1]);
        //
        // Start the Clock
        //
        clock.init(function (clock) {
            xhr.resource(id).post({
                rev:     rev || 0,
                changes: changes.data
            })(function (err, doc) {
                if (err) {
                    if (err !== 404) { console.log(err) }
                } else if (doc && doc.commits) {
                    rev = doc.rev || 0;

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
            ref   = list.children[change.to];

        if (change.to > index) {
            if (change.to === list.children.length - 1) {
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

document.querySelector('[data-action="about"]').onclick = function () {
    if (about.style.display !== 'block') {
        about.style.display = 'block';
    } else {
        dom.hide(about);
    }
    return false;
};

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
        tagList  = clone.querySelector('ul.tags'),
        checkbox = clone.querySelector('input');

    if (item.completed) {
        checkbox.checked  = true;
        checkbox.disabled = true;
        clone.setAttribute('class', 'completed');
    }

    clone.id = '';
    clone.setAttribute('style', '');

    for (var k in item) {
        clone.setAttribute('data-' + k, Array.isArray(item[k]) ?
                            item[k].join(' ') : item[k]);
    }

    if (item.tags) {
        item.tags.forEach(function (tag) {
            var a  = dom.createElement('a', { href: '#' + tag }, tag),
                li = dom.createElement('li');
            li.setAttribute('data-tag', tag);
            li.appendChild(a);
            a.onclick = function () {
                if (window.location.hash.slice(1) === tag) {
                    window.location.hash = '';
                    return false;
                }
            };
            tagList.appendChild(li);
        });
    }

    e.appendChild(clone);

    // Remove Item
    remove.onclick = function () {
        list.removeChild(e);
        changes.push('remove', { title: item.title });
        return false;
    };

    // Check Item
    checkbox.addEventListener('click', function () {
        if (this.checked) {
            changes.push('check', { title: item.title });
            clone.setAttribute('class', 'completed');
        } else {
            changes.push('uncheck', { title: item.title });
            clone.setAttribute('class', '');
        }
    }, false);

    clone.querySelector('label').innerHTML = markup(item.title);

    return e;
}
function markup(str) {
    return str.replace(/\*\*((?:\\\*|\*[^*]|[^*])+)\*\*/g, function (_, match) {
        return '<strong>' + match.replace(/\\\*\*/g, '*') + '</strong>';
    }).replace(/\*((?:\\\*|[^*])+)\*/g, function (_, match) {
        return '<em>' + match.replace(/\\\*/g, '*') + '</em>';
    }).replace(/\b_((?:\\\_|[^_])+)_\b/g, function (_, match) {
        return '<em>' + match.replace(/\\_/g, '_') + '</em>';
    }).replace(/`((?:\\`|[^`])+)`/g, function (_, match) {
        return '<code>' + match.replace(/\\`/g, '`') + '</code>';
    });
}

function handleSort(title, to) {
    return changes.push('sort', { title: title, to: to });
}
function handleTagFilter(filter) {
    var child, tag, tags;

    list.querySelectorAll('li.active').forEach(function (e) {
        dom.removeClass(e, 'active');
    });

    list.children.forEach(function (child) {
        if (filter) {
            tag = child.querySelector('[data-tag=' + filter + ']');
            tags = child.firstChild.getAttribute('data-tags');

            if (tags && (tags.split(' ').indexOf(filter) !== -1)) {
                dom.addClass(tag, 'active');
                dom.show(child);
            } else {
                dom.hide(child);
            }
        } else {
            tag && dom.removeClass(tag, 'active');
            dom.show(child);
        }
    });
}

//
// Check the hashtag every 10ms, for changes
//
setInterval(function () {
    if (window.location.hash !== hash) {
        hash = window.location.hash;
        handleTagFilter(hash.slice(1));
    }
}, 10);

