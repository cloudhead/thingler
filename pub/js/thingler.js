//
// thingler.js
//
var path  = window.location.pathname;
var id    = path.slice(1);
var xhr   = new(pilgrim.Client)({ mime: 'application/json' });
var input = document.getElementById('new');
var title = document.getElementById('title');
var list  = document.getElementById('list');            
var dirty = false;
var poll  = 10000;

var titleHasFocus = false;

//
// New Item
//
input.addEventListener('keydown', function (e) {
    if (e.keyCode === 13) {
        xhr.resource(id).post({
            item: { title: input.value }
        })(function (err, doc) {
            var item = createItem({ title: input.value, timestamp: doc.timestamp });
            changes.push({ type: 'insert', value: input.value });
            list.insertBefore(item, list.firstChild);
            flash(item);
            input.value = '';
            dom.sortable(list, handleSort);
        });
    }
    return false;
}, false);

title.addEventListener('focus', function (e) {
    titleHasFocus = true;
}, false);
title.addEventListener('blur', function (e) {
    titleHasFocus = false;
    xhr.resource(id).put({ title: title.value })(function () {
    
    });
}, false);

// Focus the main input field
setTimeout(function () { input.focus() }, 50);

xhr.resource(id).get()(function (err, doc) {
    var completed, item;

    if (err) {
        go('not-found');
    } else {
        go('page');
        refresh(doc);
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
setInterval(function () {
    xhr.resource(id + '/changes').post({
        rev:     rev,
        changes: changes
    })(function (err, doc) {
        if (err) {
            console.log(err);
        } else if (doc.commits) {
            changes = [];
            rev     = doc.rev;

            if (doc.commits.length > 0) {
                doc.commits.forEach(function (commit) {
                    commit.changes.forEach(function (change) {
                        handlers[change.type](change);
                    });
                });
            }
        }
    });
}, poll);

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
        edit     = clone.querySelector('a[data-action="edit"]'),
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

function buildList() {
    var list  = [];
    var nodes = document.querySelectorAll('#list li > div');

    for (var i = 0, node, item; i < nodes.length; i++) {
        node = nodes[i];
        item = {};

        for (var j = 0, match; j < node.attributes.length; j++) {
            if (match = node.attributes[j].name.match(/^data-([a-z]+)$/)) {
                item[match[1]] = node.attributes[j].value;
            }
        }
        list.push(item); 
    }
    return list;
}

function go(page) {
    document.getElementById(page).style.display = 'block'; 
}

function handleCheckEvent(checkbox, element, item) {
    if (checkbox.checked) {
        element.setAttribute('data-completed', new(Date)().toUTCString());
        updateItems(function () {
            element.parentNode.setAttribute('class', 'completed');
        });
    } else {
        element.setAttribute('data-completed', '');
        updateItems(function () {
            element.parentNode.setAttribute('class', '');
        });
    }
}

function handleSort(e) {
    updateItems();
}

function updateItems(callback) {
    xhr.resource(id).put({ items: buildList() })(callback);
}

function hsla(h, s, l, a) {
    return 'hsla(' + [h, s + '%', l + '%', a].join(',') + ')';
}

function flash(element) {
    var alpha = 80, inc = 1;

    var timer = setInterval(function () {
        element.style.backgroundColor = hsla(60, 90, 95, alpha / 100);
        alpha += inc;

        if (alpha === 100) { inc = -0.3 }
        if (alpha <= 0)    { clearInterval(timer) }
    }, 5);
}

