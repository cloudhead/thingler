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

// Pull interval
setInterval(function () {
    xhr.resource(id).get()(function (err, doc) {
        if (err) {

        } else {
            refresh(doc);
        }
    });
}, poll);

function refresh(doc) {
    if (! titleHasFocus) {
        title.value = doc.title;
    }
    title.setAttribute('data-title', doc.title);

    if (! dom.dragging.element) {
        list.innerHTML = '';
        doc.items.forEach(function (item) {
            list.appendChild(createItem(item));
        });
        dom.sortable(list, handleSort);
    }
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
        updateItems();
        return false;
    };

    // Check Item
    checkbox.addEventListener('click', function () { 
        handleCheckEvent(checkbox, clone, item);
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

