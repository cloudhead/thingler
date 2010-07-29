//
// thingler.js
//
var path  = window.location.pathname;
var id    = path.slice(1);
var xhr   = new(pilgrim.Client)({ mime: 'application/json' });
var input = document.getElementById('new');
var title = document.getElementById('title');
var list  = document.getElementById('list');            

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
        });
    }
    return false;
}, false);

title.addEventListener('blur', function (e) {
    xhr.resource(id).put({ title: title.value })(function () {
    
    });
}, false);

// Focus the main input field
setTimeout(function () { input.focus() }, 50);

if (path.match(/^\/[a-f0-9]+$/)) {
    xhr.resource(id).get()(function (err, doc) {
        var completed, item;

        if (err) {
            go('not-found');
        } else {
            go('page');
            title.value = doc.title;
            doc.items.forEach(function (item) {
                list.appendChild(createItem(item));
            });
            dom.sortable(list);
        }
    });
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
        console.log(buildList());
        updateItems(function () {
            li.removeChild(e);
        });
        return false;
    };

    // Check Item
    checkbox.addEventListener('click', function () { 
        handleCheckEvent(checkbox, clone, item);
    }, false);

    clone.querySelector('a').innerHTML = item.title;

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
        item.completed = new(Date)().toUTCString();
        updateItems(function () {
            element.parentNode.setAttribute('class', 'completed');
        });
    } else {
        delete(item.completed);
        updateItems(function () {
            element.parentNode.setAttribute('class', '');
        });
    }
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

