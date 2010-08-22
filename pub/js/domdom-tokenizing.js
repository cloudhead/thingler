//
// ~ domdom - tokenizing input behaviour ~
//
dom.tokenizing = function (element, container, pattern) {
    var tokens = container.querySelector('.tokens');

    element.tokenizer = {
        pattern:   pattern,
        element:   element,
        container: container,
        tokens:    tokens
    };

    //
    // When the user clicks in the input container, where there
    // is no input field, it should focus the right-most input,
    // to make it seem like the container is the input.
    //
    container.on('mousedown', function (e) {
        if      (e.target.nodeName === 'INPUT')        { return }
        else if (! e.target.isDescendantOf(container)) { return }

        container.emit('focus');

        if (tokens.children.length > 0) { tokens.lastChild.lastChild.focus() }
        else                            { element.focus(), element.setCursor(element.value.length) }
        e.preventDefault();
    });

    dom.autosizing(element);
    //
    // Parse main input for tokens
    //
    element.on('keydown', function (e) {
        if (e.keyCode === KEY.RETURN) {
            this.emit('new', { tokens: dom.tokenizing.parseTokens(tokens) });
        } else if (e.keyCode === KEY.RIGHT) {
            if (e.target.selectionStart === this.value.length) {
                tokens.firstChild && tokens.firstChild.lastChild.focus();
            }
        }
    }).on('keypress', function (e) {
        if (e.charCode) {
            var value = this.value + String.fromCharCode(e.charCode), match;
            if (match = value.match(pattern)) {
                this.value = value.replace(match[0], '').trim();
                this.autosize();
                dom.tokenizing.createToken.call(element.tokenizer, match[0].trim());
                e.preventDefault();
            }
        }
    });

    document.on('mousedown', function (e) {
        if (! e.target.isDescendantOf(container)) {
            container.emit('blur');
            element.emit('blurall', { tokens: dom.tokenizing.parseTokens(tokens) });
        }
    });

    return element;
};
dom.tokenizing.removeToken = function (elem) {
    if (this.tokens.firstChild === elem.parentNode) {
        this.element.focus();
    } else {
        elem.parentNode.previousElementSibling.lastChild.focus();
    }
    this.tokens.removeChild(elem.parentNode);
};
dom.tokenizing.parseTokens = function (tokens) {
    return tokens.children.map(function (li)   { return li.firstChild.value })
                          .filter(function (t) { return !!t });
};
dom.tokenizing.createTokens = function (tokens) {
    var that = this;
    this.tokens.innerHTML = '';
    tokens.forEach(function (t) {
        dom.tokenizing.createToken.call(that, t);
    });
};
dom.tokenizing.createToken = function (str, ref) {
    var li    = dom.createElement('li'),
        token = dom.createElement('input', { className: 'token' }),
        that  = this;

    li.appendChild(token);

    if (ref) { this.tokens.insertBefore(li, ref) }
    else     { this.tokens.appendChild(li) }

    token.value = str;
    token.focus();

    var input = dom.tokenizing.createInput.call(this, li);

    token.on('keydown', function (e) {
        var value = this.value[0] === '#' ? this.value : '#' + this.value;
        if ((e.keyCode === KEY.RETURN ||
             e.keyCode === KEY.SPACE  ||
             e.keyCode === KEY.TAB) && this.value) {
            input.focus();
            e.preventDefault();
        } else if (e.keyCode === KEY.BACKSPACE) {
            if (! this.value) {
                dom.tokenizing.removeToken.call(that, token);
                e.preventDefault();
            }
        }
    });
    dom.autosizing(token);
    return token;
};
dom.tokenizing.createInput = function (li) {
    var input = dom.createElement('input', { className: 'token-input' }),
        that  = this;

    li.appendChild(input);

    dom.autosizing(input);
    input.on('keydown', function (e) {
        var length = that.element.value.length;
        if (e.keyCode === KEY.LEFT) {
            if (input.parentNode === that.tokens.firstChild) {
                that.element.focus();
                that.element.setCursor(length)
                that.element.autosize();
                e.preventDefault();
            } else {
                input.parentNode.previousSibling.lastChild.focus();
            }
        } else if (e.keyCode === KEY.RIGHT && input.parentNode.nextSibling) {
            input.parentNode.nextSibling.lastChild.focus();
        } else if (e.keyCode === KEY.BACKSPACE) {
            if (! input.value) {
                dom.tokenizing.removeToken.call(that, input);
                e.preventDefault();
            }
        } else if (e.keyCode === KEY.ESC) {
            that.element.emit('blurall', { tokens: dom.tokenizing.parseTokens(that.tokens) });
        } else if (e.keyCode === KEY.RETURN && !input.value) {
            that.element.emit('new', { tokens: dom.tokenizing.parseTokens(that.tokens) });
            that.element.style.width = '';
        }
    }).on('keypress', function (e) {
        if (e.charCode) {
            var value = input.value + String.fromCharCode(e.charCode);
            var match = value.match(that.pattern);

            if (e.keyCode === KEY.SPACE) { e.preventDefault() }
            else if (match) {
                input.value = '';
                input.autosize();
                dom.tokenizing.createToken.call(that, value, input.parentNode.nextSibling);
                e.preventDefault();
            }
        }
    });
    return input;
};
