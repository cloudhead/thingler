window.dom = {};

dom.dragging = {
    element: null,
    offset:  null,
    index:   null,
    target:  null
};

dom.sorting = {
    element: null,
    count: null
};

dom.sortable = function (list, callback) {
    var items = list.querySelectorAll('li');

    dom.sorting.element = list;
    dom.sorting.callback = callback;
    dom.sorting.count = list.childNodes.length;

    for (var i = 0; i < items.length; i++) { dom.draggable(items[i]) }
};

document.onmouseup = function () {
    if (dom.dragging.element) {
        dom.sorting.element.removeChild(dom.dragging.element);
        dom.removeClass(dom.dragging.target, 'ghost');

        dom.sorting.callback(dom.dragging.element.firstChild.getAttribute('data-title'), dom.dragging.index);

        dom.dragging.element = null;
        dom.dragging.offset  = null;
    }
};
document.onmousemove = function (e) {
    var offset, element, list, position, prev, next;

    dom.mouse = { x: e.pageX, y: e.pageY };

    if (dom.dragging.element) {
        dom.dragging.element.style.top = (dom.mouse.y - dom.dragging.offset.y) + 'px';

        list = dom.sorting.element;

        if (dom.dragging.index > 0) {
            prev = list.childNodes[dom.dragging.index - 1];

            if (dom.mouse.y < dom.getPosition(prev).y + dom.dragging.element.clientHeight) {
                dom.dragging.index --;
                list.insertBefore(dom.dragging.target, prev);
                return;
            }
        }

        if (dom.dragging.index < dom.sorting.count) {
            next = list.childNodes[dom.dragging.index + 1];

            if (dom.mouse.y > dom.getPosition(next).y) {
                dom.dragging.index ++;
                list.insertBefore(dom.dragging.target, next.nextSibling);
                return;
            }
        }
        return false;
    }
};

dom.draggable = function (elem) {
    elem.onmousedown = function (e) {
        var source = e.srcElement || e.target;

        if (source.nodeName === 'LI' || source.nodeName === 'DIV') {
            while (source !== elem) {
                if (source === document.body) { return true }
                else                          { source = source.parentNode }
            } 
        } else { return true }

        var pos   = dom.getPosition(this);
        var clone = this.cloneNode(true);

        this.parentNode.appendChild(clone);

        dom.addClass(clone, 'dragging');
        dom.addClass(this,  'ghost');

        dom.dragging.index   = dom.getIndex(this);
        dom.dragging.offset  = { x: e.pageX - pos.x, y: e.pageY - pos.y };
        dom.dragging.element = clone;
        dom.dragging.target  = this;

        document.onmousemove(e);
    };
};

dom.getIndex = function (e) {
    var i = 0;

    while (e.previousSibling) {
        i ++;
        e = e.previousSibling;
    }
    return i;
};
dom.removeClass = function (e, name) {
    e.setAttribute('class', e.className.replace(name, ''));
};
dom.addClass = function (e, name) {
    if (e.className.indexOf(name) === -1) {
        e.setAttribute('class', e.className.split(' ').concat(name).join(' ').trim());
    }
};
dom.getPosition = function (e) {
    var left = 0;
    var top  = 0;

    while (e.offsetParent) {
        left += e.offsetLeft;
        top  += e.offsetTop;
        e     = e.offsetParent;
    }

    left += e.offsetLeft;
    top  += e.offsetTop;

    return { x: left, y: top };
}

dom.createElement = function (name, attrs) {
    var e = document.createElement(name);

    Object.keys(attrs || {}).forEach(function (a) {
        e[a] = attrs[a];
    });
    return e;
};

dom.hsla = function (h, s, l, a) {
    return 'hsla(' + [h, s + '%', l + '%', a].join(',') + ')';
};

dom.flash = function (element) {
    var alpha = 80, inc = 1;

    var timer = setInterval(function () {
        element.style.backgroundColor = dom.hsla(60, 90, 95, alpha / 100);
        alpha += inc;

        if (alpha === 100) { inc = -0.3 }
        if (alpha <= 0)    { clearInterval(timer) }
    }, 5);
};
