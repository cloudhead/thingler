//
// ~ thingler.js ~
//
var path   = window.location.pathname;
var id     = path.slice(1);
var xhr    = new(pilgrim.Client)({ extension: '.json' });
var input  = document.getElementById('new');
var title  = document.getElementById('title');
var list   = document.getElementById('list');
var about  = document.getElementById('about');
var create = document.getElementById('create');
var header = document.querySelector('header');
var footer = document.querySelector('footer');
var hash   = window.location.hash;

var lock            = document.getElementById('lock');
var passwordProtect = document.getElementById('password-protect');
var authenticate    = document.getElementById('password-authenticate');

var room = {
    rev: null,
    locked: false,
    changes: {
        data:  [],
        rollback: function (changes) {
            this.data = changes.concat(this.data);
        },
        push: function (type, change, callback) {
            change.type = type;
            change.ctime = Date.now();
            change.callback = callback;
            this.data.push(change);
            clock.tick();
        },
        commit: function () {
            var commit = this.data;
            this.data = [];
            return commit;
        }
    },
    initialize: function (doc) {
        // Initialize title and revision number
        title.value = doc.title;
        room.rev    = doc._rev && parseInt(doc._rev.match(/^(\d+)/)[1]);

        if (doc.locked) {
            lock.addClass('locked');
            room.locked = true;
        }
        header.style.display = 'block';

        // Initialize list
        doc.items && doc.items.forEach(function (item) {
            list.appendChild(createItem(item));
        });

        handleTagFilter(hash.slice(1));
        dom.sortable(list, handleSort);

        footer.style.visibility = 'visible'

        //
        // Start the Clock
        //
        clock.init(function (clock) {
            var changes = room.changes.commit();
            xhr.resource(id).post({
                rev:     room.rev || 0,
                changes: changes
            }, function (err, doc) {
                if (err) {
                    if (err.status !== 404) { console.log(err) }
                    room.changes.rollback(changes);
                } else if (doc && doc.commits) {
                    room.rev = doc.rev || 0;

                    if (doc.commits.length > 0) {
                        doc.commits.forEach(function (commit) {
                            commit.changes.forEach(function (change) {
                                handlers[change.type](change);
                            });
                        });
                        clock.activity();
                    }
                }
                clock.synchronised();
                changes.forEach(function (change) {
                    change.callback && change.callback();
                });
            });
        });
    }
};

//
// The Great Synchronization Clock
//
var clock = {
    timer: null,
    interval: 1000,
    synchronising: false,
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
        if (! this.synchronising) {
            this.synchronising = true;
            this.callback(this);
        }
    },

    synchronised: function () {
        this.synchronising = false;
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

        room.changes.push('insert', { tags: tags, title: value });

        input.value = '';
        handlers.insert({ title: value, tags: tags });
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
    room.changes.push('title', { value: title.value });
}, false);

xhr.path(id).get(function (err, doc) {
    var password = authenticate.querySelector('input');
    if (err && err.status === 404) {
        go('not-found');
        if (id.match(/^[a-zA-Z0-9-]+$/)) {
            create.onclick = function () {
                xhr.resource(id).put(function (e, doc) {
                    if (e) {

                    } else {
                        go('page');
                        dom.hide(document.getElementById('not-found'));
                        room.initialize(doc);
                    }
                });
                return false;
            };
        } else {
            dom.hide(create);
        }
    } else if (err && err.status === 401) {
        authenticate.style.display = 'block';
        password.focus();
        password.onkeydown = function (e) {
            var that = this;
            if (e.keyCode === 13) {
                password.addClass('disabled');
                password.disabled = true;
                xhr.resource(id).path('session')
                   .post({ password: this.value }, function (e, doc) {
                       if (e) {
                           that.addClass('error');
                           password.removeClass('disabled');
                           password.disabled = false;
                       } else {
                           xhr.resource(id).get(function (e, doc) {
                               go('page');
                               room.initialize(doc);
                               dom.hide(authenticate);
                           });
                       }
                   });
            }
        };
    } else {
        go('page');
        room.initialize(doc);
    }

    function go(page) {
        document.getElementById(page).style.display = 'block';
        if (page === 'page') { input.focus() }
    }
});

var handlers = {
    insert: function (change) {
        var item = createItem({ title: change.title, tags: change.tags });
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
            index = elem.parentNode.children.indexOf(elem),
            ref   = list.children[change.to];

        if (change.to > index) {
            if (!ref || change.to === list.children.length - 1) {
                list.appendChild(elem);
            } else {
                list.insertBefore(elem, ref.nextSibling);
            }
        } else {
            list.insertBefore(elem, ref);
        }
        dom.flash(elem);
    },
    lock: function (change) {
        lock.addClass('locked');
        room.locked = true;
    },
    unlock: function (change) {
        lock.removeClass('locked');
        room.locked = false;
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

document.querySelector('[data-action="close"]').onclick = function () {
    dom.hide(this.parentNode.parentNode);
    return false;
};

lock.onclick = function () {
    var input = passwordProtect.querySelector('input');

    if (room.locked) {
        room.changes.push('unlock', {});
        handlers.unlock();
    } else {
        input.disabled = false;
        input.removeClass('disabled');
        passwordProtect.style.display = 'block';
        input.focus();
        input.onkeydown = function (e) {
            if (e.keyCode === 13 && input.value) {
                input.disabled = true;
                input.addClass('disabled');
                room.changes.push('lock', { password: input.value }, function () {
                    passwordProtect.style.display = '';
                });
                handlers.lock();
                return false;
            }
        };
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
        room.changes.push('remove', { title: item.title });
        return false;
    };

    // Check Item
    checkbox.addEventListener('click', function () {
        if (this.checked) {
            room.changes.push('check', { title: item.title });
            clone.setAttribute('class', 'completed');
        } else {
            room.changes.push('uncheck', { title: item.title });
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
    return room.changes.push('sort', { title: title, to: to });
}
function handleTagFilter(filter) {
    var child, tag, tags;

    list.querySelectorAll('li.active').forEach(function (e) {
        e.removeClass('active');
    });

    list.children.forEach(function (child) {
        if (filter) {
            tag = child.querySelector('[data-tag=' + filter + ']');
            tags = child.firstChild.getAttribute('data-tags');

            if (tags && (tags.split(' ').indexOf(filter) !== -1)) {
                tag.addClass('active');
                dom.show(child);
            } else {
                dom.hide(child);
            }
        } else {
            tag && tag.removeClass('active');
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

