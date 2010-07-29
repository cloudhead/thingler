window.dom = {};

dom.dragging = {
    element: null,
    offset:  null,
    index:   null,
    target:  null
};

dom.sorting = {
    element: null
};

dom.sortable = function (list, callback) {
    var items = list.querySelectorAll('li');

    dom.sorting.element = list;
    dom.sorting.callback = callback;

    for (var i = 0; i < items.length; i++) { dom.draggable(items[i]) }
};

document.onmouseup = function () {
    if (dom.dragging.element) {
        dom.sorting.element.removeChild(dom.dragging.element);
        dom.removeClass(dom.dragging.target, 'ghost');
        dom.dragging.element = null;
        dom.dragging.offset  = null;
        dom.sorting.callback();
    }
};
document.onmousemove = function (e) {
    var offset, element, position, prev, next;

    dom.mouse = { x: e.pageX, y: e.pageY };

    if (dom.dragging.element) {
        dom.dragging.element.style.top = (dom.mouse.y - dom.dragging.offset.y) + 'px';

        if (dom.dragging.index > 0) {
            prev = dom.sorting.element.childNodes[dom.dragging.index - 1];

            if (dom.mouse.y < dom.getPosition(prev).y + dom.dragging.element.clientHeight) {
                dom.dragging.index --;
                dom.sorting.element.insertBefore(dom.dragging.target, prev);
            }
            console.log(dom.dragging.index)
        }

        if (dom.dragging.index < dom.sorting.element.childNodes.length) {
            next = dom.sorting.element.childNodes[dom.dragging.index + 1];

            if (dom.mouse.y > dom.getPosition(next).y) {
                dom.dragging.index ++;
                dom.sorting.element.insertBefore(dom.dragging.target, next.nextSibling);
            }
        }
        return false;
    }
};

dom.draggable = function (elem) {
    elem.onmousedown = function (e) {
        console.log(e)

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

