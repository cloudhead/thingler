window.dom = {};

dom.dragging = {
    element: null,
    offset:  null,
    index:   null,
    target:  null
};

dom.sorting = {
    element: null,
    count: null,
    positions: []
};

var KEY = {
    BACKSPACE: 8,
    TAB:       9,
    RETURN:   13,
    ESC:      27,
    SPACE:    32,
    LEFT:     37,
    UP:       38,
    RIGHT:    39,
    DOWN:     40,
};

dom.sortable = function (list, callback) {
    dom.sorting.element = list;
    dom.sorting.callback = callback;
    dom.sorting.count = list.childElementCount;

    list.children.forEach(dom.draggable);
};

document.onmouseup = function () {
    var list = dom.sorting.element;

    if (dom.dragging.element) {
        list.removeChild(dom.dragging.element);
        dom.dragging.target.removeClass('ghost');
        dom.sorting.element.removeClass('unselectable');

        dom.sorting.callback(dom.dragging.element.firstChild.getAttribute('data-id'), dom.dragging.index);

        dom.dragging.element = null;
        dom.dragging.offset  = null;

        list.children.forEach(dom.enableSelection);
    }
};
document.onmousemove = function (e) {
    var offset, element, list, position, prev, next;

    dom.mouse = { x: e.pageX, y: e.pageY };

    if (dom.dragging.element) {
        dom.dragging.element.style.top = (dom.mouse.y - dom.dragging.offset.y) + 'px';

        list = dom.sorting.element;

        if (dom.dragging.index > 0) {
            prev = list.children[dom.dragging.index - 1];

            if (dom.mouse.y < dom.getPosition(prev).y + dom.dragging.element.clientHeight) {
                dom.dragging.index --;
                list.insertBefore(dom.dragging.target, prev);
                return dom.refreshPositions(list);
            }
        }

        if (dom.dragging.index < dom.sorting.count) {
            next = list.children[dom.dragging.index + 1];

            if (dom.mouse.y > dom.getPosition(next).y) {
                dom.dragging.index ++;
                list.insertBefore(dom.dragging.target, next.nextSibling);
                return dom.refreshPositions(list);
            }
        }
        return false;
    }
};

dom.refreshPositions = function (elem) {
    dom.sorting.positions = elem.children.map(dom.getPosition);
    return false;
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

        if (this.hasClass('editing')) { return true }

        var pos   = dom.getPosition(this);
        var clone = this.cloneNode(true);

        this.parentNode.appendChild(clone);

        this.addClass('ghost');
        clone.addClass('dragging');
        dom.sorting.element.addClass('unselectable');

        dom.dragging.index   = list.children.indexOf(this);
        dom.dragging.offset  = { x: e.pageX - pos.x, y: e.pageY - pos.y };
        dom.dragging.element = clone;
        dom.dragging.target  = this;

        // Disable text selection while dragging
        dom.sorting.element.children.forEach(dom.disableSelection);
        document.onmousemove(e);
    };
};

dom.removeClass = function (e, name) {
    if (! e.className) { return }

    var classes = e.className.split(' '),
        index = classes.indexOf(name);

    if (index !== -1) {
        classes.splice(index, 1);
        e.setAttribute('class', classes.join(' '));
    }
};
dom.addClass = function (e, name) {
    var classes = e.className ? e.className.split(' ') : [];

    if (classes.indexOf(name) === -1) {
        e.setAttribute('class', classes.concat(name).join(' ').trim());
    }
};
dom.hasClass = function (e, name) {
    return new(RegExp)('\\b' + name + '\\b').test(e.className);
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
};

dom.createElement = function (name, attrs, html) {
    var e = document.createElement(name);

    for (var a in (attrs || {})) {
        e[a] = attrs[a];
    }
    html && (e.innerHTML = html);

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
        if (alpha <= 0)    { clearInterval(timer), element.style.backgroundColor = '' }
    }, 5);
};

dom.disableSelection = function (element) {
    element.onselectstart = function () { return false };
    element.unselectable = "on";
};
dom.enableSelection = function (element) {
    element.onselectstart = null;
    element.unselectable = "off";
};
dom.show = function (e) {
    return e.style.display = '';
};
dom.hide = function (e) {
    return e.style.display = 'none';
};

dom.contentWidth = function (element, str) {
    var span = dom.createElement('span'), width, parent, style;

    var css = function (property) {
        return window.getComputedStyle(element, null).getPropertyValue(property);
    };

    span.style.fontFamily    = css('font-family');
    span.style.fontSize      = css('font-size');
    span.style.letterSpacing = css('letter-spacing');
    span.style.wordSpacing   = css('word-spacing');
    span.style.padding       = css('padding');
    span.style.margin        = css('margin');
    span.style.height        = 'auto';
    span.style.width         = 'auto';
    span.style.visibility    = 'hidden';
    span.style.position      = 'absolute';
    span.style.top           = '-1000px';

    span.innerHTML = (str || element.value).replace(/&/g, '&amp;')
                                           .replace(/</g, '&lt;')
                                           .replace(/>/g, '&gt;')
                                           .replace(/ /g, '&nbsp;');
    document.body.appendChild(span);
    width = span.offsetWidth;
    document.body.removeChild(span);

    return Math.max(width + 1, 2);
};
dom.autosizing = function (input) {
    if (input.AUTOSIZING) { return input }

    var resize = function (element, str) {
        return element.style.width = dom.contentWidth(element, str) + 'px';
    };
    input.addEventListener('keypress', function (e) {
        if (e.charCode) { // Make sure it's a printable character. (Firefox)
            resize(this, this.value + String.fromCharCode(e.charCode));
        }
    }, false);
    input.addEventListener('keydown', function (e) {
        var position = e.target.selectionStart, string = this.value.split('');
        if (e.keyCode === KEY.BACKSPACE && position > 0) {
            string.splice(position - 1, 1);
            resize(this, string.join(''));
        }
    }, false);
    input.autosize = function (str) {
        return resize(this, str || this.value);
    };
    resize(input, input.value);

    input.AUTOSIZING = true;

    return input;
};

//
// DOM Prototype Extensions
//
Node.prototype.emit = function (type, data) {
    var event = document.createEvent('Events');
    event.initEvent(type, true, true);
    for (var k in data) { event[k] = data[k] }
    return this.dispatchEvent(event);
};
Node.prototype.on = function (event, listener, c) {
    this.addEventListener(event, listener, c || false);
    return this;
};
NodeList.prototype.forEach = function (fun) {
    return Array.prototype.forEach.call(this, fun);
};
NodeList.prototype.map = function (fun) {
    return Array.prototype.map.call(this, fun);
};
NodeList.prototype.indexOf = function (obj) {
    return Array.prototype.indexOf.call(this, obj);
};
HTMLCollection.prototype.forEach = function (fun) {
    return Array.prototype.forEach.call(this, fun);
};
HTMLCollection.prototype.map = function (fun) {
    return Array.prototype.map.call(this, fun);
};
HTMLCollection.prototype.indexOf = function (obj) {
    return Array.prototype.indexOf.call(this, obj);
};
HTMLElement.prototype.addClass = function (name) {
    return dom.addClass(this, name);
};
HTMLElement.prototype.removeClass = function (name) {
    return dom.removeClass(this, name);
};
HTMLElement.prototype.hasClass = function (name) {
    return dom.hasClass(this, name);
};
HTMLElement.prototype.insertAfter = function (element, ref) {
    this.insertBefore(element, ref.nextElementSibling);
};
HTMLElement.prototype.isDescendantOf = function (element) {
    var source = this;
    while (source !== document) {
        if (source === element) { return true }
        else                    { source = source.parentNode }
    }
    return false;
};
HTMLElement.prototype.getComputedStyle = function (pseudo) {
    return window.getComputedStyle(this, pseudo);
};
HTMLElement.prototype.setCursor = function (x) {
    this.setSelectionRange(x, x);
    return this;
};

//
// Object & Array ECMA 5 methods
//
if (! Array.isArray) {
    Array.isArray = function (obj) {
        return obj instanceof Array;
    };
}
