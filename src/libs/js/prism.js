/* PrismJS 1.20.0
https://prismjs.com/download.html#themes=prism-okaidia&languages=markup+css+clike+javascript+css-extras+git+http+json+less+markdown+markup-templating+php+pug+jsx+scss+stylus&plugins=line-numbers+custom-class+normalize-whitespace+toolbar+copy-to-clipboard */
var _self = (typeof window !== 'undefined')
    ? window   // if in browser
    : (
        (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
            ? self // if in worker
            : {}   // if in node js
    );

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function (_self) {

    // Private helper vars
    var lang = /\blang(?:uage)?-([\w-]+)\b/i;
    var uniqueId = 0;


    var _ = {
        manual: _self.Prism && _self.Prism.manual,
        disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
        util: {
            encode: function encode(tokens) {
                if (tokens instanceof Token) {
                    return new Token(tokens.type, encode(tokens.content), tokens.alias);
                } else if (Array.isArray(tokens)) {
                    return tokens.map(encode);
                } else {
                    return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
                }
            },

            type: function (o) {
                return Object.prototype.toString.call(o).slice(8, -1);
            },

            objId: function (obj) {
                if (!obj['__id']) {
                    Object.defineProperty(obj, '__id', { value: ++uniqueId });
                }
                return obj['__id'];
            },

            // Deep clone a language definition (e.g. to extend it)
            clone: function deepClone(o, visited) {
                var clone, id, type = _.util.type(o);
                visited = visited || {};

                switch (type) {
                    case 'Object':
                        id = _.util.objId(o);
                        if (visited[id]) {
                            return visited[id];
                        }
                        clone = {};
                        visited[id] = clone;

                        for (var key in o) {
                            if (o.hasOwnProperty(key)) {
                                clone[key] = deepClone(o[key], visited);
                            }
                        }

                        return clone;

                    case 'Array':
                        id = _.util.objId(o);
                        if (visited[id]) {
                            return visited[id];
                        }
                        clone = [];
                        visited[id] = clone;

                        o.forEach(function (v, i) {
                            clone[i] = deepClone(v, visited);
                        });

                        return clone;

                    default:
                        return o;
                }
            },

            /**
             * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
             *
             * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
             *
             * @param {Element} element
             * @returns {string}
             */
            getLanguage: function (element) {
                while (element && !lang.test(element.className)) {
                    element = element.parentElement;
                }
                if (element) {
                    return (element.className.match(lang) || [, 'none'])[1].toLowerCase();
                }
                return 'none';
            },

            /**
             * Returns the script element that is currently executing.
             *
             * This does __not__ work for line script element.
             *
             * @returns {HTMLScriptElement | null}
             */
            currentScript: function () {
                if (typeof document === 'undefined') {
                    return null;
                }
                if ('currentScript' in document) {
                    return document.currentScript;
                }

                // IE11 workaround
                // we'll get the src of the current script by parsing IE11's error stack trace
                // this will not work for inline scripts

                try {
                    throw new Error();
                } catch (err) {
                    // Get file src url from stack. Specifically works with the format of stack traces in IE.
                    // A stack will look like this:
                    //
                    // Error
                    //    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
                    //    at Global code (http://localhost/components/prism-core.js:606:1)

                    var src = (/at [^(\r\n]*\((.*):.+:.+\)$/i.exec(err.stack) || [])[1];
                    if (src) {
                        var scripts = document.getElementsByTagName('script');
                        for (var i in scripts) {
                            if (scripts[i].src == src) {
                                return scripts[i];
                            }
                        }
                    }
                    return null;
                }
            },

            /**
             * Returns whether a given class is active for `element`.
             *
             * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
             * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
             * given class is just the given class with a `no-` prefix.
             *
             * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
             * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
             * ancestors have the given class or the negated version of it, then the default activation will be returned.
             *
             * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
             * version of it, the class is considered active.
             *
             * @param {Element} element
             * @param {string} className
             * @param {boolean} [defaultActivation=false]
             * @returns {boolean}
             */
            isActive: function (element, className, defaultActivation) {
                var no = 'no-' + className;

                while (element) {
                    var classList = element.classList;
                    if (classList.contains(className)) {
                        return true;
                    }
                    if (classList.contains(no)) {
                        return false;
                    }
                    element = element.parentElement;
                }
                return !!defaultActivation;
            }
        },

        languages: {
            extend: function (id, redef) {
                var lang = _.util.clone(_.languages[id]);

                for (var key in redef) {
                    lang[key] = redef[key];
                }

                return lang;
            },

            /**
             * Insert a token before another token in a language literal
             * As this needs to recreate the object (we cannot actually insert before keys in object literals),
             * we cannot just provide an object, we need an object and a key.
             * @param inside The key (or language id) of the parent
             * @param before The key to insert before.
             * @param insert Object with the key/value pairs to insert
             * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
             */
            insertBefore: function (inside, before, insert, root) {
                root = root || _.languages;
                var grammar = root[inside];
                var ret = {};

                for (var token in grammar) {
                    if (grammar.hasOwnProperty(token)) {

                        if (token == before) {
                            for (var newToken in insert) {
                                if (insert.hasOwnProperty(newToken)) {
                                    ret[newToken] = insert[newToken];
                                }
                            }
                        }

                        // Do not insert token which also occur in insert. See #1525
                        if (!insert.hasOwnProperty(token)) {
                            ret[token] = grammar[token];
                        }
                    }
                }

                var old = root[inside];
                root[inside] = ret;

                // Update references in other language definitions
                _.languages.DFS(_.languages, function (key, value) {
                    if (value === old && key != inside) {
                        this[key] = ret;
                    }
                });

                return ret;
            },

            // Traverse a language definition with Depth First Search
            DFS: function DFS(o, callback, type, visited) {
                visited = visited || {};

                var objId = _.util.objId;

                for (var i in o) {
                    if (o.hasOwnProperty(i)) {
                        callback.call(o, i, o[i], type || i);

                        var property = o[i],
                            propertyType = _.util.type(property);

                        if (propertyType === 'Object' && !visited[objId(property)]) {
                            visited[objId(property)] = true;
                            DFS(property, callback, null, visited);
                        }
                        else if (propertyType === 'Array' && !visited[objId(property)]) {
                            visited[objId(property)] = true;
                            DFS(property, callback, i, visited);
                        }
                    }
                }
            }
        },
        plugins: {},

        highlightAll: function (async, callback) {
            _.highlightAllUnder(document, async, callback);
        },

        highlightAllUnder: function (container, async, callback) {
            var env = {
                callback: callback,
                container: container,
                selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
            };

            _.hooks.run('before-highlightall', env);

            env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

            _.hooks.run('before-all-elements-highlight', env);

            for (var i = 0, element; element = env.elements[i++];) {
                _.highlightElement(element, async === true, env.callback);
            }
        },

        highlightElement: function (element, async, callback) {
            // Find language
            var language = _.util.getLanguage(element);
            var grammar = _.languages[language];

            // Set language on the element, if not present
            element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

            // Set language on the parent, for styling
            var parent = element.parentNode;
            if (parent && parent.nodeName.toLowerCase() === 'pre') {
                parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
            }

            var code = element.textContent;

            var env = {
                element: element,
                language: language,
                grammar: grammar,
                code: code
            };

            function insertHighlightedCode(highlightedCode) {
                env.highlightedCode = highlightedCode;

                _.hooks.run('before-insert', env);

                env.element.innerHTML = env.highlightedCode;

                _.hooks.run('after-highlight', env);
                _.hooks.run('complete', env);
                callback && callback.call(env.element);
            }

            _.hooks.run('before-sanity-check', env);

            if (!env.code) {
                _.hooks.run('complete', env);
                callback && callback.call(env.element);
                return;
            }

            _.hooks.run('before-highlight', env);

            if (!env.grammar) {
                insertHighlightedCode(_.util.encode(env.code));
                return;
            }

            if (async && _self.Worker) {
                var worker = new Worker(_.filename);

                worker.onmessage = function (evt) {
                    insertHighlightedCode(evt.data);
                };

                worker.postMessage(JSON.stringify({
                    language: env.language,
                    code: env.code,
                    immediateClose: true
                }));
            }
            else {
                insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
            }
        },

        highlight: function (text, grammar, language) {
            var env = {
                code: text,
                grammar: grammar,
                language: language
            };
            _.hooks.run('before-tokenize', env);
            env.tokens = _.tokenize(env.code, env.grammar);
            _.hooks.run('after-tokenize', env);
            return Token.stringify(_.util.encode(env.tokens), env.language);
        },

        tokenize: function (text, grammar) {
            var rest = grammar.rest;
            if (rest) {
                for (var token in rest) {
                    grammar[token] = rest[token];
                }

                delete grammar.rest;
            }

            var tokenList = new LinkedList();
            addAfter(tokenList, tokenList.head, text);

            matchGrammar(text, tokenList, grammar, tokenList.head, 0);

            return toArray(tokenList);
        },

        hooks: {
            all: {},

            add: function (name, callback) {
                var hooks = _.hooks.all;

                hooks[name] = hooks[name] || [];

                hooks[name].push(callback);
            },

            run: function (name, env) {
                var callbacks = _.hooks.all[name];

                if (!callbacks || !callbacks.length) {
                    return;
                }

                for (var i = 0, callback; callback = callbacks[i++];) {
                    callback(env);
                }
            }
        },

        Token: Token
    };

    _self.Prism = _;

    function Token(type, content, alias, matchedStr, greedy) {
        this.type = type;
        this.content = content;
        this.alias = alias;
        // Copy of the full string this token was created from
        this.length = (matchedStr || '').length | 0;
        this.greedy = !!greedy;
    }

    Token.stringify = function stringify(o, language) {
        if (typeof o == 'string') {
            return o;
        }
        if (Array.isArray(o)) {
            var s = '';
            o.forEach(function (e) {
                s += stringify(e, language);
            });
            return s;
        }

        var env = {
            type: o.type,
            content: stringify(o.content, language),
            tag: 'span',
            classes: ['token', o.type],
            attributes: {},
            language: language
        };

        var aliases = o.alias;
        if (aliases) {
            if (Array.isArray(aliases)) {
                Array.prototype.push.apply(env.classes, aliases);
            } else {
                env.classes.push(aliases);
            }
        }

        _.hooks.run('wrap', env);

        var attributes = '';
        for (var name in env.attributes) {
            attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
        }

        return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
    };

    /**
     * @param {string} text
     * @param {LinkedList<string | Token>} tokenList
     * @param {any} grammar
     * @param {LinkedListNode<string | Token>} startNode
     * @param {number} startPos
     * @param {boolean} [oneshot=false]
     * @param {string} [target]
     */
    function matchGrammar(text, tokenList, grammar, startNode, startPos, oneshot, target) {
        for (var token in grammar) {
            if (!grammar.hasOwnProperty(token) || !grammar[token]) {
                continue;
            }

            var patterns = grammar[token];
            patterns = Array.isArray(patterns) ? patterns : [patterns];

            for (var j = 0; j < patterns.length; ++j) {
                if (target && target == token + ',' + j) {
                    return;
                }

                var pattern = patterns[j],
                    inside = pattern.inside,
                    lookbehind = !!pattern.lookbehind,
                    greedy = !!pattern.greedy,
                    lookbehindLength = 0,
                    alias = pattern.alias;

                if (greedy && !pattern.pattern.global) {
                    // Without the global flag, lastIndex won't work
                    var flags = pattern.pattern.toString().match(/[imsuy]*$/)[0];
                    pattern.pattern = RegExp(pattern.pattern.source, flags + 'g');
                }

                pattern = pattern.pattern || pattern;

                for ( // iterate the token list and keep track of the current token/string position
                    var currentNode = startNode.next, pos = startPos;
                    currentNode !== tokenList.tail;
                    pos += currentNode.value.length, currentNode = currentNode.next
                ) {

                    var str = currentNode.value;

                    if (tokenList.length > text.length) {
                        // Something went terribly wrong, ABORT, ABORT!
                        return;
                    }

                    if (str instanceof Token) {
                        continue;
                    }

                    var removeCount = 1; // this is the to parameter of removeBetween

                    if (greedy && currentNode != tokenList.tail.prev) {
                        pattern.lastIndex = pos;
                        var match = pattern.exec(text);
                        if (!match) {
                            break;
                        }

                        var from = match.index + (lookbehind && match[1] ? match[1].length : 0);
                        var to = match.index + match[0].length;
                        var p = pos;

                        // find the node that contains the match
                        p += currentNode.value.length;
                        while (from >= p) {
                            currentNode = currentNode.next;
                            p += currentNode.value.length;
                        }
                        // adjust pos (and p)
                        p -= currentNode.value.length;
                        pos = p;

                        // the current node is a Token, then the match starts inside another Token, which is invalid
                        if (currentNode.value instanceof Token) {
                            continue;
                        }

                        // find the last node which is affected by this match
                        for (
                            var k = currentNode;
                            k !== tokenList.tail && (p < to || (typeof k.value === 'string' && !k.prev.value.greedy));
                            k = k.next
                        ) {
                            removeCount++;
                            p += k.value.length;
                        }
                        removeCount--;

                        // replace with the new match
                        str = text.slice(pos, p);
                        match.index -= pos;
                    } else {
                        pattern.lastIndex = 0;

                        var match = pattern.exec(str);
                    }

                    if (!match) {
                        if (oneshot) {
                            break;
                        }

                        continue;
                    }

                    if (lookbehind) {
                        lookbehindLength = match[1] ? match[1].length : 0;
                    }

                    var from = match.index + lookbehindLength,
                        match = match[0].slice(lookbehindLength),
                        to = from + match.length,
                        before = str.slice(0, from),
                        after = str.slice(to);

                    var removeFrom = currentNode.prev;

                    if (before) {
                        removeFrom = addAfter(tokenList, removeFrom, before);
                        pos += before.length;
                    }

                    removeRange(tokenList, removeFrom, removeCount);

                    var wrapped = new Token(token, inside ? _.tokenize(match, inside) : match, alias, match, greedy);
                    currentNode = addAfter(tokenList, removeFrom, wrapped);

                    if (after) {
                        addAfter(tokenList, currentNode, after);
                    }


                    if (removeCount > 1)
                        matchGrammar(text, tokenList, grammar, currentNode.prev, pos, true, token + ',' + j);

                    if (oneshot)
                        break;
                }
            }
        }
    }

    /**
     * @typedef LinkedListNode
     * @property {T} value
     * @property {LinkedListNode<T> | null} prev The previous node.
     * @property {LinkedListNode<T> | null} next The next node.
     * @template T
     */

    /**
     * @template T
     */
    function LinkedList() {
        /** @type {LinkedListNode<T>} */
        var head = { value: null, prev: null, next: null };
        /** @type {LinkedListNode<T>} */
        var tail = { value: null, prev: head, next: null };
        head.next = tail;

        /** @type {LinkedListNode<T>} */
        this.head = head;
        /** @type {LinkedListNode<T>} */
        this.tail = tail;
        this.length = 0;
    }

    /**
     * Adds a new node with the given value to the list.
     * @param {LinkedList<T>} list
     * @param {LinkedListNode<T>} node
     * @param {T} value
     * @returns {LinkedListNode<T>} The added node.
     * @template T
     */
    function addAfter(list, node, value) {
        // assumes that node != list.tail && values.length >= 0
        var next = node.next;

        var newNode = { value: value, prev: node, next: next };
        node.next = newNode;
        next.prev = newNode;
        list.length++;

        return newNode;
    }
    /**
     * Removes `count` nodes after the given node. The given node will not be removed.
     * @param {LinkedList<T>} list
     * @param {LinkedListNode<T>} node
     * @param {number} count
     * @template T
     */
    function removeRange(list, node, count) {
        var next = node.next;
        for (var i = 0; i < count && next !== list.tail; i++) {
            next = next.next;
        }
        node.next = next;
        next.prev = node;
        list.length -= i;
    }
    /**
     * @param {LinkedList<T>} list
     * @returns {T[]}
     * @template T
     */
    function toArray(list) {
        var array = [];
        var node = list.head.next;
        while (node !== list.tail) {
            array.push(node.value);
            node = node.next;
        }
        return array;
    }


    if (!_self.document) {
        if (!_self.addEventListener) {
            // in Node.js
            return _;
        }

        if (!_.disableWorkerMessageHandler) {
            // In worker
            _self.addEventListener('message', function (evt) {
                var message = JSON.parse(evt.data),
                    lang = message.language,
                    code = message.code,
                    immediateClose = message.immediateClose;

                _self.postMessage(_.highlight(code, _.languages[lang], lang));
                if (immediateClose) {
                    _self.close();
                }
            }, false);
        }

        return _;
    }

    //Get current script and highlight
    var script = _.util.currentScript();

    if (script) {
        _.filename = script.src;

        if (script.hasAttribute('data-manual')) {
            _.manual = true;
        }
    }

    function highlightAutomaticallyCallback() {
        if (!_.manual) {
            _.highlightAll();
        }
    }

    if (!_.manual) {
        // If the document state is "loading", then we'll use DOMContentLoaded.
        // If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
        // DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
        // might take longer one animation frame to execute which can create a race condition where only some plugins have
        // been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
        // See https://github.com/PrismJS/prism/issues/2102
        var readyState = document.readyState;
        if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
            document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
        } else {
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(highlightAutomaticallyCallback);
            } else {
                window.setTimeout(highlightAutomaticallyCallback, 16);
            }
        }
    }

    return _;

})(_self);

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
    global.Prism = Prism;
}
;
Prism.languages.markup = {
    'comment': /<!--[\s\S]*?-->/,
    'prolog': /<\?[\s\S]+?\?>/,
    'doctype': {
        // https://www.w3.org/TR/xml/#NT-doctypedecl
        pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
        greedy: true,
        inside: {
            'internal-subset': {
                pattern: /(\[)[\s\S]+(?=\]>$)/,
                lookbehind: true,
                greedy: true,
                inside: null // see below
            },
            'string': {
                pattern: /"[^"]*"|'[^']*'/,
                greedy: true
            },
            'punctuation': /^<!|>$|[[\]]/,
            'doctype-tag': /^DOCTYPE/,
            'name': /[^\s<>'"]+/
        }
    },
    'cdata': /<!\[CDATA\[[\s\S]*?]]>/i,
    'tag': {
        pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
        greedy: true,
        inside: {
            'tag': {
                pattern: /^<\/?[^\s>\/]+/,
                inside: {
                    'punctuation': /^<\/?/,
                    'namespace': /^[^\s>\/:]+:/
                }
            },
            'attr-value': {
                pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
                inside: {
                    'punctuation': [
                        {
                            pattern: /^=/,
                            alias: 'attr-equals'
                        },
                        /"|'/
                    ]
                }
            },
            'punctuation': /\/?>/,
            'attr-name': {
                pattern: /[^\s>\/]+/,
                inside: {
                    'namespace': /^[^\s>\/:]+:/
                }
            }

        }
    },
    'entity': [
        {
            pattern: /&[\da-z]{1,8};/i,
            alias: 'named-entity'
        },
        /&#x?[\da-f]{1,8};/i
    ]
};

Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
    Prism.languages.markup['entity'];
Prism.languages.markup['doctype'].inside['internal-subset'].inside = Prism.languages.markup;

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function (env) {

    if (env.type === 'entity') {
        env.attributes['title'] = env.content.replace(/&amp;/, '&');
    }
});

Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
    /**
     * Adds an inlined language to markup.
     *
     * An example of an inlined language is CSS with `<style>` tags.
     *
     * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
     * case insensitive.
     * @param {string} lang The language key.
     * @example
     * addInlined('style', 'css');
     */
    value: function addInlined(tagName, lang) {
        var includedCdataInside = {};
        includedCdataInside['language-' + lang] = {
            pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
            lookbehind: true,
            inside: Prism.languages[lang]
        };
        includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

        var inside = {
            'included-cdata': {
                pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
                inside: includedCdataInside
            }
        };
        inside['language-' + lang] = {
            pattern: /[\s\S]+/,
            inside: Prism.languages[lang]
        };

        var def = {};
        def[tagName] = {
            pattern: RegExp(/(<__[\s\S]*?>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
            lookbehind: true,
            greedy: true,
            inside: inside
        };

        Prism.languages.insertBefore('markup', 'cdata', def);
    }
});

Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;

Prism.languages.xml = Prism.languages.extend('markup', {});
Prism.languages.ssml = Prism.languages.xml;
Prism.languages.atom = Prism.languages.xml;
Prism.languages.rss = Prism.languages.xml;

(function (Prism) {

    var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;

    Prism.languages.css = {
        'comment': /\/\*[\s\S]*?\*\//,
        'atrule': {
            pattern: /@[\w-]+[\s\S]*?(?:;|(?=\s*\{))/,
            inside: {
                'rule': /^@[\w-]+/,
                'selector-function-argument': {
                    pattern: /(\bselector\s*\((?!\s*\))\s*)(?:[^()]|\((?:[^()]|\([^()]*\))*\))+?(?=\s*\))/,
                    lookbehind: true,
                    alias: 'selector'
                }
                // See rest below
            }
        },
        'url': {
            pattern: RegExp('url\\((?:' + string.source + '|[^\n\r()]*)\\)', 'i'),
            greedy: true,
            inside: {
                'function': /^url/i,
                'punctuation': /^\(|\)$/
            }
        },
        'selector': RegExp('[^{}\\s](?:[^{};"\']|' + string.source + ')*?(?=\\s*\\{)'),
        'string': {
            pattern: string,
            greedy: true
        },
        'property': /[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
        'important': /!important\b/i,
        'function': /[-a-z0-9]+(?=\()/i,
        'punctuation': /[(){};:,]/
    };

    Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

    var markup = Prism.languages.markup;
    if (markup) {
        markup.tag.addInlined('style', 'css');

        Prism.languages.insertBefore('inside', 'attr-value', {
            'style-attr': {
                pattern: /\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,
                inside: {
                    'attr-name': {
                        pattern: /^\s*style/i,
                        inside: markup.tag.inside
                    },
                    'punctuation': /^\s*=\s*['"]|['"]\s*$/,
                    'attr-value': {
                        pattern: /.+/i,
                        inside: Prism.languages.css
                    }
                },
                alias: 'language-css'
            }
        }, markup.tag);
    }

}(Prism));

Prism.languages.clike = {
    'comment': [
        {
            pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
            lookbehind: true
        },
        {
            pattern: /(^|[^\\:])\/\/.*/,
            lookbehind: true,
            greedy: true
        }
    ],
    'string': {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true
    },
    'class-name': {
        pattern: /(\b(?:class|interface|extends|implements|trait|instanceof|new)\s+|\bcatch\s+\()[\w.\\]+/i,
        lookbehind: true,
        inside: {
            'punctuation': /[.\\]/
        }
    },
    'keyword': /\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
    'boolean': /\b(?:true|false)\b/,
    'function': /\w+(?=\()/,
    'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
    'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    'punctuation': /[{}[\];(),.:]/
};

Prism.languages.javascript = Prism.languages.extend('clike', {
    'class-name': [
        Prism.languages.clike['class-name'],
        {
            pattern: /(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,
            lookbehind: true
        }
    ],
    'keyword': [
        {
            pattern: /((?:^|})\s*)(?:catch|finally)\b/,
            lookbehind: true
        },
        {
            pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|(?:get|set)(?=\s*[\[$\w\xA0-\uFFFF])|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
            lookbehind: true
        },
    ],
    'number': /\b(?:(?:0[xX](?:[\dA-Fa-f](?:_[\dA-Fa-f])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,
    // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
    'function': /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
});

Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/;

Prism.languages.insertBefore('javascript', 'keyword', {
    'regex': {
        pattern: /((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(?:\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^/\\\[\r\n])+\/[gimyus]{0,6}(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/,
        lookbehind: true,
        greedy: true
    },
    // This must be declared before keyword because we use "function" inside the look-forward
    'function-variable': {
        pattern: /#?[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/,
        alias: 'function'
    },
    'parameter': [
        {
            pattern: /(function(?:\s+[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\))/,
            lookbehind: true,
            inside: Prism.languages.javascript
        },
        {
            pattern: /[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/i,
            inside: Prism.languages.javascript
        },
        {
            pattern: /(\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*=>)/,
            lookbehind: true,
            inside: Prism.languages.javascript
        },
        {
            pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$A-Za-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()]|\([^()]*\))+?(?=\s*\)\s*\{)/,
            lookbehind: true,
            inside: Prism.languages.javascript
        }
    ],
    'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
});

Prism.languages.insertBefore('javascript', 'string', {
    'template-string': {
        pattern: /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}|(?!\${)[^\\`])*`/,
        greedy: true,
        inside: {
            'template-punctuation': {
                pattern: /^`|`$/,
                alias: 'string'
            },
            'interpolation': {
                pattern: /((?:^|[^\\])(?:\\{2})*)\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,
                lookbehind: true,
                inside: {
                    'interpolation-punctuation': {
                        pattern: /^\${|}$/,
                        alias: 'punctuation'
                    },
                    rest: Prism.languages.javascript
                }
            },
            'string': /[\s\S]+/
        }
    }
});

if (Prism.languages.markup) {
    Prism.languages.markup.tag.addInlined('script', 'javascript');
}

Prism.languages.js = Prism.languages.javascript;

(function (Prism) {

    var string = /("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/;
    var selectorInside;

    Prism.languages.css.selector = {
        pattern: Prism.languages.css.selector,
        inside: selectorInside = {
            'pseudo-element': /:(?:after|before|first-letter|first-line|selection)|::[-\w]+/,
            'pseudo-class': /:[-\w]+/,
            'class': /\.[-\w]+/,
            'id': /#[-\w]+/,
            'attribute': {
                pattern: RegExp('\\[(?:[^[\\]"\']|' + string.source + ')*\\]'),
                greedy: true,
                inside: {
                    'punctuation': /^\[|\]$/,
                    'case-sensitivity': {
                        pattern: /(\s)[si]$/i,
                        lookbehind: true,
                        alias: 'keyword'
                    },
                    'namespace': {
                        pattern: /^(\s*)[-*\w\xA0-\uFFFF]*\|(?!=)/,
                        lookbehind: true,
                        inside: {
                            'punctuation': /\|$/
                        }
                    },
                    'attr-name': {
                        pattern: /^(\s*)[-\w\xA0-\uFFFF]+/,
                        lookbehind: true
                    },
                    'attr-value': [
                        string,
                        {
                            pattern: /(=\s*)[-\w\xA0-\uFFFF]+(?=\s*$)/,
                            lookbehind: true
                        }
                    ],
                    'operator': /[|~*^$]?=/
                }
            },
            'n-th': [
                {
                    pattern: /(\(\s*)[+-]?\d*[\dn](?:\s*[+-]\s*\d+)?(?=\s*\))/,
                    lookbehind: true,
                    inside: {
                        'number': /[\dn]+/,
                        'operator': /[+-]/
                    }
                },
                {
                    pattern: /(\(\s*)(?:even|odd)(?=\s*\))/i,
                    lookbehind: true
                }
            ],
            'combinator': />|\+|~|\|\|/,

            // the `tag` token has been existed and removed.
            // because we can't find a perfect tokenize to match it.
            // if you want to add it, please read https://github.com/PrismJS/prism/pull/2373 first.

            'punctuation': /[(),]/,
        }
    };

    Prism.languages.css['atrule'].inside['selector-function-argument'].inside = selectorInside;

    Prism.languages.insertBefore('css', 'property', {
        'variable': {
            pattern: /(^|[^-\w\xA0-\uFFFF])--[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*/i,
            lookbehind: true
        }
    });

    var unit = {
        pattern: /(\b\d+)(?:%|[a-z]+\b)/,
        lookbehind: true
    };
    // 123 -123 .123 -.123 12.3 -12.3
    var number = {
        pattern: /(^|[^\w.-])-?\d*\.?\d+/,
        lookbehind: true
    };

    Prism.languages.insertBefore('css', 'function', {
        'operator': {
            pattern: /(\s)[+\-*\/](?=\s)/,
            lookbehind: true
        },
        // CAREFUL!
        // Previewers and Inline color use hexcode and color.
        'hexcode': {
            pattern: /\B#(?:[\da-f]{1,2}){3,4}\b/i,
            alias: 'color'
        },
        'color': [
            /\b(?:AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGr[ae]y|DarkGreen|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrange|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGr[ae]y|DarkTurquoise|DarkViolet|DeepPink|DeepSkyBlue|DimGr[ae]y|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gr[ae]y|Green|GreenYellow|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGr[ae]y|LightGreen|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGr[ae]y|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGr[ae]y|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Transparent|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen)\b/i,
            {
                pattern: /\b(?:rgb|hsl)\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*\)\B|\b(?:rgb|hsl)a\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*(?:0|0?\.\d+|1)\s*\)\B/i,
                inside: {
                    'unit': unit,
                    'number': number,
                    'function': /[\w-]+(?=\()/,
                    'punctuation': /[(),]/
                }
            }
        ],
        // it's important that there is no boundary assertion after the hex digits
        'entity': /\\[\da-f]{1,8}/i,
        'unit': unit,
        'number': number
    });

})(Prism);

Prism.languages.git = {
    /*
     * A simple one line comment like in a git status command
     * For instance:
     * $ git status
     * # On branch infinite-scroll
     * # Your branch and 'origin/sharedBranches/frontendTeam/infinite-scroll' have diverged,
     * # and have 1 and 2 different commits each, respectively.
     * nothing to commit (working directory clean)
     */
    'comment': /^#.*/m,

    /*
     * Regexp to match the changed lines in a git diff output. Check the example below.
     */
    'deleted': /^[-–].*/m,
    'inserted': /^\+.*/m,

    /*
     * a string (double and simple quote)
     */
    'string': /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/m,

    /*
     * a git command. It starts with a random prompt finishing by a $, then "git" then some other parameters
     * For instance:
     * $ git add file.txt
     */
    'command': {
        pattern: /^.*\$ git .*$/m,
        inside: {
            /*
             * A git command can contain a parameter starting by a single or a double dash followed by a string
             * For instance:
             * $ git diff --cached
             * $ git log -p
             */
            'parameter': /\s--?\w+/m
        }
    },

    /*
     * Coordinates displayed in a git diff command
     * For instance:
     * $ git diff
     * diff --git file.txt file.txt
     * index 6214953..1d54a52 100644
     * --- file.txt
     * +++ file.txt
     * @@ -1 +1,2 @@
     * -Here's my tetx file
     * +Here's my text file
     * +And this is the second line
     */
    'coord': /^@@.*@@$/m,

    /*
     * Match a "commit [SHA1]" line in a git log output.
     * For instance:
     * $ git log
     * commit a11a14ef7e26f2ca62d4b35eac455ce636d0dc09
     * Author: lgiraudel
     * Date:   Mon Feb 17 11:18:34 2014 +0100
     *
     *     Add of a new line
     */
    'commit_sha1': /^commit \w{40}$/m
};

(function (Prism) {
    Prism.languages.http = {
        'request-line': {
            pattern: /^(?:POST|GET|PUT|DELETE|OPTIONS|PATCH|TRACE|CONNECT)\s(?:https?:\/\/|\/)\S+\sHTTP\/[0-9.]+/m,
            inside: {
                // HTTP Verb
                'property': /^(?:POST|GET|PUT|DELETE|OPTIONS|PATCH|TRACE|CONNECT)\b/,
                // Path or query argument
                'attr-name': /:\w+/
            }
        },
        'response-status': {
            pattern: /^HTTP\/1.[01] \d+.*/m,
            inside: {
                // Status, e.g. 200 OK
                'property': {
                    pattern: /(^HTTP\/1.[01] )\d+.*/i,
                    lookbehind: true
                }
            }
        },
        // HTTP header name
        'header-name': {
            pattern: /^[\w-]+:(?=.)/m,
            alias: 'keyword'
        }
    };

    // Create a mapping of Content-Type headers to language definitions
    var langs = Prism.languages;
    var httpLanguages = {
        'application/javascript': langs.javascript,
        'application/json': langs.json || langs.javascript,
        'application/xml': langs.xml,
        'text/xml': langs.xml,
        'text/html': langs.html,
        'text/css': langs.css
    };

    // Declare which types can also be suffixes
    var suffixTypes = {
        'application/json': true,
        'application/xml': true
    };

    /**
     * Returns a pattern for the given content type which matches it and any type which has it as a suffix.
     *
     * @param {string} contentType
     * @returns {string}
     */
    function getSuffixPattern(contentType) {
        var suffix = contentType.replace(/^[a-z]+\//, '');
        var suffixPattern = '\\w+/(?:[\\w.-]+\\+)+' + suffix + '(?![+\\w.-])';
        return '(?:' + contentType + '|' + suffixPattern + ')';
    }

    // Insert each content type parser that has its associated language
    // currently loaded.
    var options;
    for (var contentType in httpLanguages) {
        if (httpLanguages[contentType]) {
            options = options || {};

            var pattern = suffixTypes[contentType] ? getSuffixPattern(contentType) : contentType;
            options[contentType.replace(/\//g, '-')] = {
                pattern: RegExp('(content-type:\\s*' + pattern + '[\\s\\S]*?)(?:\\r?\\n|\\r){2}[\\s\\S]*', 'i'),
                lookbehind: true,
                inside: httpLanguages[contentType]
            };
        }
    }
    if (options) {
        Prism.languages.insertBefore('http', 'header-name', options);
    }

}(Prism));

// https://www.json.org/json-en.html
Prism.languages.json = {
    'property': {
        pattern: /"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
        greedy: true
    },
    'string': {
        pattern: /"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
        greedy: true
    },
    'comment': /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
    'number': /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
    'punctuation': /[{}[\],]/,
    'operator': /:/,
    'boolean': /\b(?:true|false)\b/,
    'null': {
        pattern: /\bnull\b/,
        alias: 'keyword'
    }
};

Prism.languages.webmanifest = Prism.languages.json;

/* FIXME :
 :extend() is not handled specifically : its highlighting is buggy.
 Mixin usage must be inside a ruleset to be highlighted.
 At-rules (e.g. import) containing interpolations are buggy.
 Detached rulesets are highlighted as at-rules.
 A comment before a mixin usage prevents the latter to be properly highlighted.
 */

Prism.languages.less = Prism.languages.extend('css', {
    'comment': [
        /\/\*[\s\S]*?\*\//,
        {
            pattern: /(^|[^\\])\/\/.*/,
            lookbehind: true
        }
    ],
    'atrule': {
        pattern: /@[\w-]+?(?:\((?:[^(){}]|\([^(){}]*\))*\)|[^(){};])*?(?=\s*\{)/,
        inside: {
            'punctuation': /[:()]/
        }
    },
    // selectors and mixins are considered the same
    'selector': {
        pattern: /(?:@\{[\w-]+\}|[^{};\s@])(?:@\{[\w-]+\}|\((?:[^(){}]|\([^(){}]*\))*\)|[^(){};@])*?(?=\s*\{)/,
        inside: {
            // mixin parameters
            'variable': /@+[\w-]+/
        }
    },

    'property': /(?:@\{[\w-]+\}|[\w-])+(?:\+_?)?(?=\s*:)/i,
    'operator': /[+\-*\/]/
});

Prism.languages.insertBefore('less', 'property', {
    'variable': [
        // Variable declaration (the colon must be consumed!)
        {
            pattern: /@[\w-]+\s*:/,
            inside: {
                "punctuation": /:/
            }
        },

        // Variable usage
        /@@?[\w-]+/
    ],
    'mixin-usage': {
        pattern: /([{;]\s*)[.#](?!\d)[\w-]+.*?(?=[(;])/,
        lookbehind: true,
        alias: 'function'
    }
});

(function (Prism) {

    // Allow only one line break
    var inner = /(?:\\.|[^\\\n\r]|(?:\n|\r\n?)(?!\n|\r\n?))/.source;

    /**
     * This function is intended for the creation of the bold or italic pattern.
     *
     * This also adds a lookbehind group to the given pattern to ensure that the pattern is not backslash-escaped.
     *
     * _Note:_ Keep in mind that this adds a capturing group.
     *
     * @param {string} pattern
     * @returns {RegExp}
     */
    function createInline(pattern) {
        pattern = pattern.replace(/<inner>/g, function () { return inner; });
        return RegExp(/((?:^|[^\\])(?:\\{2})*)/.source + '(?:' + pattern + ')');
    }


    var tableCell = /(?:\\.|``(?:[^`\r\n]|`(?!`))+``|`[^`\r\n]+`|[^\\|\r\n`])+/.source;
    var tableRow = /\|?__(?:\|__)+\|?(?:(?:\n|\r\n?)|$)/.source.replace(/__/g, function () { return tableCell; });
    var tableLine = /\|?[ \t]*:?-{3,}:?[ \t]*(?:\|[ \t]*:?-{3,}:?[ \t]*)+\|?(?:\n|\r\n?)/.source;


    Prism.languages.markdown = Prism.languages.extend('markup', {});
    Prism.languages.insertBefore('markdown', 'prolog', {
        'blockquote': {
            // > ...
            pattern: /^>(?:[\t ]*>)*/m,
            alias: 'punctuation'
        },
        'table': {
            pattern: RegExp('^' + tableRow + tableLine + '(?:' + tableRow + ')*', 'm'),
            inside: {
                'table-data-rows': {
                    pattern: RegExp('^(' + tableRow + tableLine + ')(?:' + tableRow + ')*$'),
                    lookbehind: true,
                    inside: {
                        'table-data': {
                            pattern: RegExp(tableCell),
                            inside: Prism.languages.markdown
                        },
                        'punctuation': /\|/
                    }
                },
                'table-line': {
                    pattern: RegExp('^(' + tableRow + ')' + tableLine + '$'),
                    lookbehind: true,
                    inside: {
                        'punctuation': /\||:?-{3,}:?/
                    }
                },
                'table-header-row': {
                    pattern: RegExp('^' + tableRow + '$'),
                    inside: {
                        'table-header': {
                            pattern: RegExp(tableCell),
                            alias: 'important',
                            inside: Prism.languages.markdown
                        },
                        'punctuation': /\|/
                    }
                }
            }
        },
        'code': [
            {
                // Prefixed by 4 spaces or 1 tab and preceded by an empty line
                pattern: /((?:^|\n)[ \t]*\n|(?:^|\r\n?)[ \t]*\r\n?)(?: {4}|\t).+(?:(?:\n|\r\n?)(?: {4}|\t).+)*/,
                lookbehind: true,
                alias: 'keyword'
            },
            {
                // `code`
                // ``code``
                pattern: /``.+?``|`[^`\r\n]+`/,
                alias: 'keyword'
            },
            {
                // ```optional language
                // code block
                // ```
                pattern: /^```[\s\S]*?^```$/m,
                greedy: true,
                inside: {
                    'code-block': {
                        pattern: /^(```.*(?:\n|\r\n?))[\s\S]+?(?=(?:\n|\r\n?)^```$)/m,
                        lookbehind: true
                    },
                    'code-language': {
                        pattern: /^(```).+/,
                        lookbehind: true
                    },
                    'punctuation': /```/
                }
            }
        ],
        'title': [
            {
                // title 1
                // =======

                // title 2
                // -------
                pattern: /\S.*(?:\n|\r\n?)(?:==+|--+)(?=[ \t]*$)/m,
                alias: 'important',
                inside: {
                    punctuation: /==+$|--+$/
                }
            },
            {
                // # title 1
                // ###### title 6
                pattern: /(^\s*)#+.+/m,
                lookbehind: true,
                alias: 'important',
                inside: {
                    punctuation: /^#+|#+$/
                }
            }
        ],
        'hr': {
            // ***
            // ---
            // * * *
            // -----------
            pattern: /(^\s*)([*-])(?:[\t ]*\2){2,}(?=\s*$)/m,
            lookbehind: true,
            alias: 'punctuation'
        },
        'list': {
            // * item
            // + item
            // - item
            // 1. item
            pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m,
            lookbehind: true,
            alias: 'punctuation'
        },
        'url-reference': {
            // [id]: http://example.com "Optional title"
            // [id]: http://example.com 'Optional title'
            // [id]: http://example.com (Optional title)
            // [id]: <http://example.com> "Optional title"
            pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
            inside: {
                'variable': {
                    pattern: /^(!?\[)[^\]]+/,
                    lookbehind: true
                },
                'string': /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
                'punctuation': /^[\[\]!:]|[<>]/
            },
            alias: 'url'
        },
        'bold': {
            // **strong**
            // __strong__

            // allow one nested instance of italic text using the same delimiter
            pattern: createInline(/\b__(?:(?!_)<inner>|_(?:(?!_)<inner>)+_)+__\b|\*\*(?:(?!\*)<inner>|\*(?:(?!\*)<inner>)+\*)+\*\*/.source),
            lookbehind: true,
            greedy: true,
            inside: {
                'content': {
                    pattern: /(^..)[\s\S]+(?=..$)/,
                    lookbehind: true,
                    inside: {} // see below
                },
                'punctuation': /\*\*|__/
            }
        },
        'italic': {
            // *em*
            // _em_

            // allow one nested instance of bold text using the same delimiter
            pattern: createInline(/\b_(?:(?!_)<inner>|__(?:(?!_)<inner>)+__)+_\b|\*(?:(?!\*)<inner>|\*\*(?:(?!\*)<inner>)+\*\*)+\*/.source),
            lookbehind: true,
            greedy: true,
            inside: {
                'content': {
                    pattern: /(^.)[\s\S]+(?=.$)/,
                    lookbehind: true,
                    inside: {} // see below
                },
                'punctuation': /[*_]/
            }
        },
        'strike': {
            // ~~strike through~~
            // ~strike~
            pattern: createInline(/(~~?)(?:(?!~)<inner>)+?\2/.source),
            lookbehind: true,
            greedy: true,
            inside: {
                'content': {
                    pattern: /(^~~?)[\s\S]+(?=\1$)/,
                    lookbehind: true,
                    inside: {} // see below
                },
                'punctuation': /~~?/
            }
        },
        'url': {
            // [example](http://example.com "Optional title")
            // [example][id]
            // [example] [id]
            pattern: createInline(/!?\[(?:(?!\])<inner>)+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[(?:(?!\])<inner>)+\])/.source),
            lookbehind: true,
            greedy: true,
            inside: {
                'variable': {
                    pattern: /(\[)[^\]]+(?=\]$)/,
                    lookbehind: true
                },
                'content': {
                    pattern: /(^!?\[)[^\]]+(?=\])/,
                    lookbehind: true,
                    inside: {} // see below
                },
                'string': {
                    pattern: /"(?:\\.|[^"\\])*"(?=\)$)/
                }
            }
        }
    });

    ['url', 'bold', 'italic', 'strike'].forEach(function (token) {
        ['url', 'bold', 'italic', 'strike'].forEach(function (inside) {
            if (token !== inside) {
                Prism.languages.markdown[token].inside.content.inside[inside] = Prism.languages.markdown[inside];
            }
        });
    });

    Prism.hooks.add('after-tokenize', function (env) {
        if (env.language !== 'markdown' && env.language !== 'md') {
            return;
        }

        function walkTokens(tokens) {
            if (!tokens || typeof tokens === 'string') {
                return;
            }

            for (var i = 0, l = tokens.length; i < l; i++) {
                var token = tokens[i];

                if (token.type !== 'code') {
                    walkTokens(token.content);
                    continue;
                }

                /*
                 * Add the correct `language-xxxx` class to this code block. Keep in mind that the `code-language` token
                 * is optional. But the grammar is defined so that there is only one case we have to handle:
                 *
                 * token.content = [
                 *     <span class="punctuation">```</span>,
                 *     <span class="code-language">xxxx</span>,
                 *     '\n', // exactly one new lines (\r or \n or \r\n)
                 *     <span class="code-block">...</span>,
                 *     '\n', // exactly one new lines again
                 *     <span class="punctuation">```</span>
                 * ];
                 */

                var codeLang = token.content[1];
                var codeBlock = token.content[3];

                if (codeLang && codeBlock &&
                    codeLang.type === 'code-language' && codeBlock.type === 'code-block' &&
                    typeof codeLang.content === 'string') {

                    // this might be a language that Prism does not support

                    // do some replacements to support C++, C#, and F#
                    var lang = codeLang.content.replace(/\b#/g, 'sharp').replace(/\b\+\+/g, 'pp')
                    // only use the first word
                    lang = (/[a-z][\w-]*/i.exec(lang) || [''])[0].toLowerCase();
                    var alias = 'language-' + lang;

                    // add alias
                    if (!codeBlock.alias) {
                        codeBlock.alias = [alias];
                    } else if (typeof codeBlock.alias === 'string') {
                        codeBlock.alias = [codeBlock.alias, alias];
                    } else {
                        codeBlock.alias.push(alias);
                    }
                }
            }
        }

        walkTokens(env.tokens);
    });

    Prism.hooks.add('wrap', function (env) {
        if (env.type !== 'code-block') {
            return;
        }

        var codeLang = '';
        for (var i = 0, l = env.classes.length; i < l; i++) {
            var cls = env.classes[i];
            var match = /language-(.+)/.exec(cls);
            if (match) {
                codeLang = match[1];
                break;
            }
        }

        var grammar = Prism.languages[codeLang];

        if (!grammar) {
            if (codeLang && codeLang !== 'none' && Prism.plugins.autoloader) {
                var id = 'md-' + new Date().valueOf() + '-' + Math.floor(Math.random() * 1e16);
                env.attributes['id'] = id;

                Prism.plugins.autoloader.loadLanguages(codeLang, function () {
                    var ele = document.getElementById(id);
                    if (ele) {
                        ele.innerHTML = Prism.highlight(ele.textContent, Prism.languages[codeLang], codeLang);
                    }
                });
            }
        } else {
            // reverse Prism.util.encode
            var code = env.content.replace(/&lt;/g, '<').replace(/&amp;/g, '&');

            env.content = Prism.highlight(code, grammar, codeLang);
        }
    });

    Prism.languages.md = Prism.languages.markdown;

}(Prism));

(function (Prism) {

    /**
     * Returns the placeholder for the given language id and index.
     *
     * @param {string} language
     * @param {string|number} index
     * @returns {string}
     */
    function getPlaceholder(language, index) {
        return '___' + language.toUpperCase() + index + '___';
    }

    Object.defineProperties(Prism.languages['markup-templating'] = {}, {
        buildPlaceholders: {
            /**
             * Tokenize all inline templating expressions matching `placeholderPattern`.
             *
             * If `replaceFilter` is provided, only matches of `placeholderPattern` for which `replaceFilter` returns
             * `true` will be replaced.
             *
             * @param {object} env The environment of the `before-tokenize` hook.
             * @param {string} language The language id.
             * @param {RegExp} placeholderPattern The matches of this pattern will be replaced by placeholders.
             * @param {(match: string) => boolean} [replaceFilter]
             */
            value: function (env, language, placeholderPattern, replaceFilter) {
                if (env.language !== language) {
                    return;
                }

                var tokenStack = env.tokenStack = [];

                env.code = env.code.replace(placeholderPattern, function (match) {
                    if (typeof replaceFilter === 'function' && !replaceFilter(match)) {
                        return match;
                    }
                    var i = tokenStack.length;
                    var placeholder;

                    // Check for existing strings
                    while (env.code.indexOf(placeholder = getPlaceholder(language, i)) !== -1)
                        ++i;

                    // Create a sparse array
                    tokenStack[i] = match;

                    return placeholder;
                });

                // Switch the grammar to markup
                env.grammar = Prism.languages.markup;
            }
        },
        tokenizePlaceholders: {
            /**
             * Replace placeholders with proper tokens after tokenizing.
             *
             * @param {object} env The environment of the `after-tokenize` hook.
             * @param {string} language The language id.
             */
            value: function (env, language) {
                if (env.language !== language || !env.tokenStack) {
                    return;
                }

                // Switch the grammar back
                env.grammar = Prism.languages[language];

                var j = 0;
                var keys = Object.keys(env.tokenStack);

                function walkTokens(tokens) {
                    for (var i = 0; i < tokens.length; i++) {
                        // all placeholders are replaced already
                        if (j >= keys.length) {
                            break;
                        }

                        var token = tokens[i];
                        if (typeof token === 'string' || (token.content && typeof token.content === 'string')) {
                            var k = keys[j];
                            var t = env.tokenStack[k];
                            var s = typeof token === 'string' ? token : token.content;
                            var placeholder = getPlaceholder(language, k);

                            var index = s.indexOf(placeholder);
                            if (index > -1) {
                                ++j;

                                var before = s.substring(0, index);
                                var middle = new Prism.Token(language, Prism.tokenize(t, env.grammar), 'language-' + language, t);
                                var after = s.substring(index + placeholder.length);

                                var replacement = [];
                                if (before) {
                                    replacement.push.apply(replacement, walkTokens([before]));
                                }
                                replacement.push(middle);
                                if (after) {
                                    replacement.push.apply(replacement, walkTokens([after]));
                                }

                                if (typeof token === 'string') {
                                    tokens.splice.apply(tokens, [i, 1].concat(replacement));
                                } else {
                                    token.content = replacement;
                                }
                            }
                        } else if (token.content /* && typeof token.content !== 'string' */) {
                            walkTokens(token.content);
                        }
                    }

                    return tokens;
                }

                walkTokens(env.tokens);
            }
        }
    });

}(Prism));

/**
 * Original by Aaron Harun: http://aahacreative.com/2012/07/31/php-syntax-highlighting-prism/
 * Modified by Miles Johnson: http://milesj.me
 *
 * Supports the following:
 * 		- Extends clike syntax
 * 		- Support for PHP 5.3+ (namespaces, traits, generators, etc)
 * 		- Smarter constant and function matching
 *
 * Adds the following new token classes:
 * 		constant, delimiter, variable, function, package
 */
(function (Prism) {
    Prism.languages.php = Prism.languages.extend('clike', {
        'keyword': /\b(?:__halt_compiler|abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|eval|exit|extends|final|finally|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|namespace|new|or|parent|print|private|protected|public|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield)\b/i,
        'boolean': {
            pattern: /\b(?:false|true)\b/i,
            alias: 'constant'
        },
        'constant': [
            /\b[A-Z_][A-Z0-9_]*\b/,
            /\b(?:null)\b/i,
        ],
        'comment': {
            pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
            lookbehind: true
        }
    });

    Prism.languages.insertBefore('php', 'string', {
        'shell-comment': {
            pattern: /(^|[^\\])#.*/,
            lookbehind: true,
            alias: 'comment'
        }
    });

    Prism.languages.insertBefore('php', 'comment', {
        'delimiter': {
            pattern: /\?>$|^<\?(?:php(?=\s)|=)?/i,
            alias: 'important'
        }
    });

    Prism.languages.insertBefore('php', 'keyword', {
        'variable': /\$+(?:\w+\b|(?={))/i,
        'package': {
            pattern: /(\\|namespace\s+|use\s+)[\w\\]+/,
            lookbehind: true,
            inside: {
                punctuation: /\\/
            }
        }
    });

    // Must be defined after the function pattern
    Prism.languages.insertBefore('php', 'operator', {
        'property': {
            pattern: /(->)[\w]+/,
            lookbehind: true
        }
    });

    var string_interpolation = {
        pattern: /{\$(?:{(?:{[^{}]+}|[^{}]+)}|[^{}])+}|(^|[^\\{])\$+(?:\w+(?:\[[^\r\n\[\]]+\]|->\w+)*)/,
        lookbehind: true,
        inside: Prism.languages.php
    };

    Prism.languages.insertBefore('php', 'string', {
        'nowdoc-string': {
            pattern: /<<<'([^']+)'[\r\n](?:.*[\r\n])*?\1;/,
            greedy: true,
            alias: 'string',
            inside: {
                'delimiter': {
                    pattern: /^<<<'[^']+'|[a-z_]\w*;$/i,
                    alias: 'symbol',
                    inside: {
                        'punctuation': /^<<<'?|[';]$/
                    }
                }
            }
        },
        'heredoc-string': {
            pattern: /<<<(?:"([^"]+)"[\r\n](?:.*[\r\n])*?\1;|([a-z_]\w*)[\r\n](?:.*[\r\n])*?\2;)/i,
            greedy: true,
            alias: 'string',
            inside: {
                'delimiter': {
                    pattern: /^<<<(?:"[^"]+"|[a-z_]\w*)|[a-z_]\w*;$/i,
                    alias: 'symbol',
                    inside: {
                        'punctuation': /^<<<"?|[";]$/
                    }
                },
                'interpolation': string_interpolation // See below
            }
        },
        'single-quoted-string': {
            pattern: /'(?:\\[\s\S]|[^\\'])*'/,
            greedy: true,
            alias: 'string'
        },
        'double-quoted-string': {
            pattern: /"(?:\\[\s\S]|[^\\"])*"/,
            greedy: true,
            alias: 'string',
            inside: {
                'interpolation': string_interpolation // See below
            }
        }
    });
    // The different types of PHP strings "replace" the C-like standard string
    delete Prism.languages.php['string'];

    Prism.hooks.add('before-tokenize', function (env) {
        if (!/<\?/.test(env.code)) {
            return;
        }

        var phpPattern = /<\?(?:[^"'/#]|\/(?![*/])|("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|(?:\/\/|#)(?:[^?\n\r]|\?(?!>))*(?=$|\?>|[\r\n])|\/\*[\s\S]*?(?:\*\/|$))*?(?:\?>|$)/ig;
        Prism.languages['markup-templating'].buildPlaceholders(env, 'php', phpPattern);
    });

    Prism.hooks.add('after-tokenize', function (env) {
        Prism.languages['markup-templating'].tokenizePlaceholders(env, 'php');
    });

}(Prism));

(function (Prism) {
    // TODO:
    // - Add CSS highlighting inside <style> tags
    // - Add support for multi-line code blocks
    // - Add support for interpolation #{} and !{}
    // - Add support for tag interpolation #[]
    // - Add explicit support for plain text using |
    // - Add support for markup embedded in plain text

    Prism.languages.pug = {

        // Multiline stuff should appear before the rest

        // This handles both single-line and multi-line comments
        'comment': {
            pattern: /(^([\t ]*))\/\/.*(?:(?:\r?\n|\r)\2[\t ]+.+)*/m,
            lookbehind: true
        },

        // All the tag-related part is in lookbehind
        // so that it can be highlighted by the "tag" pattern
        'multiline-script': {
            pattern: /(^([\t ]*)script\b.*\.[\t ]*)(?:(?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/m,
            lookbehind: true,
            inside: Prism.languages.javascript
        },

        // See at the end of the file for known filters
        'filter': {
            pattern: /(^([\t ]*)):.+(?:(?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/m,
            lookbehind: true,
            inside: {
                'filter-name': {
                    pattern: /^:[\w-]+/,
                    alias: 'variable'
                }
            }
        },

        'multiline-plain-text': {
            pattern: /(^([\t ]*)[\w\-#.]+\.[\t ]*)(?:(?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/m,
            lookbehind: true
        },
        'markup': {
            pattern: /(^[\t ]*)<.+/m,
            lookbehind: true,
            inside: Prism.languages.markup
        },
        'doctype': {
            pattern: /((?:^|\n)[\t ]*)doctype(?: .+)?/,
            lookbehind: true
        },

        // This handle all conditional and loop keywords
        'flow-control': {
            pattern: /(^[\t ]*)(?:if|unless|else|case|when|default|each|while)\b(?: .+)?/m,
            lookbehind: true,
            inside: {
                'each': {
                    pattern: /^each .+? in\b/,
                    inside: {
                        'keyword': /\b(?:each|in)\b/,
                        'punctuation': /,/
                    }
                },
                'branch': {
                    pattern: /^(?:if|unless|else|case|when|default|while)\b/,
                    alias: 'keyword'
                },
                rest: Prism.languages.javascript
            }
        },
        'keyword': {
            pattern: /(^[\t ]*)(?:block|extends|include|append|prepend)\b.+/m,
            lookbehind: true
        },
        'mixin': [
            // Declaration
            {
                pattern: /(^[\t ]*)mixin .+/m,
                lookbehind: true,
                inside: {
                    'keyword': /^mixin/,
                    'function': /\w+(?=\s*\(|\s*$)/,
                    'punctuation': /[(),.]/
                }
            },
            // Usage
            {
                pattern: /(^[\t ]*)\+.+/m,
                lookbehind: true,
                inside: {
                    'name': {
                        pattern: /^\+\w+/,
                        alias: 'function'
                    },
                    rest: Prism.languages.javascript
                }
            }
        ],
        'script': {
            pattern: /(^[\t ]*script(?:(?:&[^(]+)?\([^)]+\))*[\t ]+).+/m,
            lookbehind: true,
            inside: Prism.languages.javascript
        },

        'plain-text': {
            pattern: /(^[\t ]*(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?[\t ]+).+/m,
            lookbehind: true
        },
        'tag': {
            pattern: /(^[\t ]*)(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?:?/m,
            lookbehind: true,
            inside: {
                'attributes': [
                    {
                        pattern: /&[^(]+\([^)]+\)/,
                        inside: Prism.languages.javascript
                    },
                    {
                        pattern: /\([^)]+\)/,
                        inside: {
                            'attr-value': {
                                pattern: /(=\s*)(?:\{[^}]*\}|[^,)\r\n]+)/,
                                lookbehind: true,
                                inside: Prism.languages.javascript
                            },
                            'attr-name': /[\w-]+(?=\s*!?=|\s*[,)])/,
                            'punctuation': /[!=(),]+/
                        }
                    }
                ],
                'punctuation': /:/,
                'attr-id': /#[\w\-]+/,
                'attr-class': /\.[\w\-]+/
            }
        },
        'code': [
            {
                pattern: /(^[\t ]*(?:-|!?=)).+/m,
                lookbehind: true,
                inside: Prism.languages.javascript
            }
        ],
        'punctuation': /[.\-!=|]+/
    };

    var filter_pattern = /(^([\t ]*)):{{filter_name}}(?:(?:\r?\n|\r(?!\n))(?:\2[\t ]+.+|\s*?(?=\r?\n|\r)))+/.source;

    // Non exhaustive list of available filters and associated languages
    var filters = [
        { filter: 'atpl', language: 'twig' },
        { filter: 'coffee', language: 'coffeescript' },
        'ejs',
        'handlebars',
        'less',
        'livescript',
        'markdown',
        { filter: 'sass', language: 'scss' },
        'stylus'
    ];
    var all_filters = {};
    for (var i = 0, l = filters.length; i < l; i++) {
        var filter = filters[i];
        filter = typeof filter === 'string' ? { filter: filter, language: filter } : filter;
        if (Prism.languages[filter.language]) {
            all_filters['filter-' + filter.filter] = {
                pattern: RegExp(filter_pattern.replace('{{filter_name}}', function () { return filter.filter; }), 'm'),
                lookbehind: true,
                inside: {
                    'filter-name': {
                        pattern: /^:[\w-]+/,
                        alias: 'variable'
                    },
                    rest: Prism.languages[filter.language]
                }
            }
        }
    }

    Prism.languages.insertBefore('pug', 'filter', all_filters);

}(Prism));

(function (Prism) {

    var javascript = Prism.util.clone(Prism.languages.javascript);

    Prism.languages.jsx = Prism.languages.extend('markup', javascript);
    Prism.languages.jsx.tag.pattern = /<\/?(?:[\w.:-]+\s*(?:\s+(?:[\w.:$-]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s{'">=]+|\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])+\}))?|\{\s*\.{3}\s*[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\s*\}))*\s*\/?)?>/i;

    Prism.languages.jsx.tag.inside['tag'].pattern = /^<\/?[^\s>\/]*/i;
    Prism.languages.jsx.tag.inside['attr-value'].pattern = /=(?!\{)(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">]+)/i;
    Prism.languages.jsx.tag.inside['tag'].inside['class-name'] = /^[A-Z]\w*(?:\.[A-Z]\w*)*$/;

    Prism.languages.insertBefore('inside', 'attr-name', {
        'spread': {
            pattern: /\{\s*\.{3}\s*[a-z_$][\w$]*(?:\.[a-z_$][\w$]*)*\s*\}/,
            inside: {
                'punctuation': /\.{3}|[{}.]/,
                'attr-value': /\w+/
            }
        }
    }, Prism.languages.jsx.tag);

    Prism.languages.insertBefore('inside', 'attr-value', {
        'script': {
            // Allow for two levels of nesting
            pattern: /=(?:\{(?:\{(?:\{[^{}]*\}|[^{}])*\}|[^{}])+\})/i,
            inside: {
                'script-punctuation': {
                    pattern: /^=(?={)/,
                    alias: 'punctuation'
                },
                rest: Prism.languages.jsx
            },
            'alias': 'language-javascript'
        }
    }, Prism.languages.jsx.tag);

    // The following will handle plain text inside tags
    var stringifyToken = function (token) {
        if (!token) {
            return '';
        }
        if (typeof token === 'string') {
            return token;
        }
        if (typeof token.content === 'string') {
            return token.content;
        }
        return token.content.map(stringifyToken).join('');
    };

    var walkTokens = function (tokens) {
        var openedTags = [];
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            var notTagNorBrace = false;

            if (typeof token !== 'string') {
                if (token.type === 'tag' && token.content[0] && token.content[0].type === 'tag') {
                    // We found a tag, now find its kind

                    if (token.content[0].content[0].content === '</') {
                        // Closing tag
                        if (openedTags.length > 0 && openedTags[openedTags.length - 1].tagName === stringifyToken(token.content[0].content[1])) {
                            // Pop matching opening tag
                            openedTags.pop();
                        }
                    } else {
                        if (token.content[token.content.length - 1].content === '/>') {
                            // Autoclosed tag, ignore
                        } else {
                            // Opening tag
                            openedTags.push({
                                tagName: stringifyToken(token.content[0].content[1]),
                                openedBraces: 0
                            });
                        }
                    }
                } else if (openedTags.length > 0 && token.type === 'punctuation' && token.content === '{') {

                    // Here we might have entered a JSX context inside a tag
                    openedTags[openedTags.length - 1].openedBraces++;

                } else if (openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces > 0 && token.type === 'punctuation' && token.content === '}') {

                    // Here we might have left a JSX context inside a tag
                    openedTags[openedTags.length - 1].openedBraces--;

                } else {
                    notTagNorBrace = true
                }
            }
            if (notTagNorBrace || typeof token === 'string') {
                if (openedTags.length > 0 && openedTags[openedTags.length - 1].openedBraces === 0) {
                    // Here we are inside a tag, and not inside a JSX context.
                    // That's plain text: drop any tokens matched.
                    var plainText = stringifyToken(token);

                    // And merge text with adjacent text
                    if (i < tokens.length - 1 && (typeof tokens[i + 1] === 'string' || tokens[i + 1].type === 'plain-text')) {
                        plainText += stringifyToken(tokens[i + 1]);
                        tokens.splice(i + 1, 1);
                    }
                    if (i > 0 && (typeof tokens[i - 1] === 'string' || tokens[i - 1].type === 'plain-text')) {
                        plainText = stringifyToken(tokens[i - 1]) + plainText;
                        tokens.splice(i - 1, 1);
                        i--;
                    }

                    tokens[i] = new Prism.Token('plain-text', plainText, null, plainText);
                }
            }

            if (token.content && typeof token.content !== 'string') {
                walkTokens(token.content);
            }
        }
    };

    Prism.hooks.add('after-tokenize', function (env) {
        if (env.language !== 'jsx' && env.language !== 'tsx') {
            return;
        }
        walkTokens(env.tokens);
    });

}(Prism));

Prism.languages.scss = Prism.languages.extend('css', {
    'comment': {
        pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
        lookbehind: true
    },
    'atrule': {
        pattern: /@[\w-]+(?:\([^()]+\)|[^(])*?(?=\s+[{;])/,
        inside: {
            'rule': /@[\w-]+/
            // See rest below
        }
    },
    // url, compassified
    'url': /(?:[-a-z]+-)?url(?=\()/i,
    // CSS selector regex is not appropriate for Sass
    // since there can be lot more things (var, @ directive, nesting..)
    // a selector must start at the end of a property or after a brace (end of other rules or nesting)
    // it can contain some characters that aren't used for defining rules or end of selector, & (parent selector), or interpolated variable
    // the end of a selector is found when there is no rules in it ( {} or {\s}) or if there is a property (because an interpolated var
    // can "pass" as a selector- e.g: proper#{$erty})
    // this one was hard to do, so please be careful if you edit this one :)
    'selector': {
        // Initial look-ahead is used to prevent matching of blank selectors
        pattern: /(?=\S)[^@;{}()]?(?:[^@;{}()]|#\{\$[-\w]+\})+(?=\s*\{(?:\}|\s|[^}]+[:{][^}]+))/m,
        inside: {
            'parent': {
                pattern: /&/,
                alias: 'important'
            },
            'placeholder': /%[-\w]+/,
            'variable': /\$[-\w]+|#\{\$[-\w]+\}/
        }
    },
    'property': {
        pattern: /(?:[\w-]|\$[-\w]+|#\{\$[-\w]+\})+(?=\s*:)/,
        inside: {
            'variable': /\$[-\w]+|#\{\$[-\w]+\}/
        }
    }
});

Prism.languages.insertBefore('scss', 'atrule', {
    'keyword': [
        /@(?:if|else(?: if)?|for|each|while|import|extend|debug|warn|mixin|include|function|return|content)/i,
        {
            pattern: /( +)(?:from|through)(?= )/,
            lookbehind: true
        }
    ]
});

Prism.languages.insertBefore('scss', 'important', {
    // var and interpolated vars
    'variable': /\$[-\w]+|#\{\$[-\w]+\}/
});

Prism.languages.insertBefore('scss', 'function', {
    'placeholder': {
        pattern: /%[-\w]+/,
        alias: 'selector'
    },
    'statement': {
        pattern: /\B!(?:default|optional)\b/i,
        alias: 'keyword'
    },
    'boolean': /\b(?:true|false)\b/,
    'null': {
        pattern: /\bnull\b/,
        alias: 'keyword'
    },
    'operator': {
        pattern: /(\s)(?:[-+*\/%]|[=!]=|<=?|>=?|and|or|not)(?=\s)/,
        lookbehind: true
    }
});

Prism.languages.scss['atrule'].inside.rest = Prism.languages.scss;

(function (Prism) {
    var unit = {
        pattern: /(\b\d+)(?:%|[a-z]+)/,
        lookbehind: true
    };
    // 123 -123 .123 -.123 12.3 -12.3
    var number = {
        pattern: /(^|[^\w.-])-?\d*\.?\d+/,
        lookbehind: true
    };

    var inside = {
        'comment': {
            pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
            lookbehind: true
        },
        'url': {
            pattern: /url\((["']?).*?\1\)/i,
            greedy: true
        },
        'string': {
            pattern: /("|')(?:(?!\1)[^\\\r\n]|\\(?:\r\n|[\s\S]))*\1/,
            greedy: true
        },
        'interpolation': null, // See below
        'func': null, // See below
        'important': /\B!(?:important|optional)\b/i,
        'keyword': {
            pattern: /(^|\s+)(?:(?:if|else|for|return|unless)(?=\s+|$)|@[\w-]+)/,
            lookbehind: true
        },
        'hexcode': /#[\da-f]{3,6}/i,
        'color': [
            /\b(?:AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGr[ae]y|DarkGreen|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrange|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGr[ae]y|DarkTurquoise|DarkViolet|DeepPink|DeepSkyBlue|DimGr[ae]y|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gr[ae]y|Green|GreenYellow|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGr[ae]y|LightGreen|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGr[ae]y|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGr[ae]y|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Transparent|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen)\b/i,
            {
                pattern: /\b(?:rgb|hsl)\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*\)\B|\b(?:rgb|hsl)a\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*(?:0|0?\.\d+|1)\s*\)\B/i,
                inside: {
                    'unit': unit,
                    'number': number,
                    'function': /[\w-]+(?=\()/,
                    'punctuation': /[(),]/
                }
            }
        ],
        'entity': /\\[\da-f]{1,8}/i,
        'unit': unit,
        'boolean': /\b(?:true|false)\b/,
        'operator': [
            // We want non-word chars around "-" because it is
            // accepted in property names.
            /~|[+!\/%<>?=]=?|[-:]=|\*[*=]?|\.{2,3}|&&|\|\||\B-\B|\b(?:and|in|is(?: a| defined| not|nt)?|not|or)\b/
        ],
        'number': number,
        'punctuation': /[{}()\[\];:,]/
    };

    inside['interpolation'] = {
        pattern: /\{[^\r\n}:]+\}/,
        alias: 'variable',
        inside: {
            'delimiter': {
                pattern: /^{|}$/,
                alias: 'punctuation'
            },
            rest: inside
        }
    };
    inside['func'] = {
        pattern: /[\w-]+\([^)]*\).*/,
        inside: {
            'function': /^[^(]+/,
            rest: inside
        }
    };

    Prism.languages.stylus = {
        'atrule-declaration': {
            pattern: /(^\s*)@.+/m,
            lookbehind: true,
            inside: {
                'atrule': /^@[\w-]+/,
                rest: inside
            }
        },
        'variable-declaration': {
            pattern: /(^[ \t]*)[\w$-]+\s*.?=[ \t]*(?:(?:\{[^}]*\}|.+)|$)/m,
            lookbehind: true,
            inside: {
                'variable': /^\S+/,
                rest: inside
            }
        },

        'statement': {
            pattern: /(^[ \t]*)(?:if|else|for|return|unless)[ \t]+.+/m,
            lookbehind: true,
            inside: {
                'keyword': /^\S+/,
                rest: inside
            }
        },

        // A property/value pair cannot end with a comma or a brace
        // It cannot have indented content unless it ended with a semicolon
        'property-declaration': {
            pattern: /((?:^|\{)([ \t]*))(?:[\w-]|\{[^}\r\n]+\})+(?:\s*:\s*|[ \t]+)[^{\r\n]*(?:;|[^{\r\n,](?=$)(?!(?:\r?\n|\r)(?:\{|\2[ \t]+)))/m,
            lookbehind: true,
            inside: {
                'property': {
                    pattern: /^[^\s:]+/,
                    inside: {
                        'interpolation': inside.interpolation
                    }
                },
                rest: inside
            }
        },



        // A selector can contain parentheses only as part of a pseudo-element
        // It can span multiple lines.
        // It must end with a comma or an accolade or have indented content.
        'selector': {
            pattern: /(^[ \t]*)(?:(?=\S)(?:[^{}\r\n:()]|::?[\w-]+(?:\([^)\r\n]*\))?|\{[^}\r\n]+\})+)(?:(?:\r?\n|\r)(?:\1(?:(?=\S)(?:[^{}\r\n:()]|::?[\w-]+(?:\([^)\r\n]*\))?|\{[^}\r\n]+\})+)))*(?:,$|\{|(?=(?:\r?\n|\r)(?:\{|\1[ \t]+)))/m,
            lookbehind: true,
            inside: {
                'interpolation': inside.interpolation,
                'comment': inside.comment,
                'punctuation': /[{},]/
            }
        },

        'func': inside.func,
        'string': inside.string,
        'comment': {
            pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|\/\/.*)/,
            lookbehind: true,
            greedy: true
        },
        'interpolation': inside.interpolation,
        'punctuation': /[{}()\[\];:.]/
    };
}(Prism));

(function () {

    if (typeof self === 'undefined' || !self.Prism || !self.document) {
        return;
    }

    /**
     * Plugin name which is used as a class name for <pre> which is activating the plugin
     * @type {String}
     */
    var PLUGIN_NAME = 'line-numbers';

    /**
     * Regular expression used for determining line breaks
     * @type {RegExp}
     */
    var NEW_LINE_EXP = /\n(?!$)/g;

    /**
     * Resizes line numbers spans according to height of line of code
     * @param {Element} element <pre> element
     */
    var _resizeElement = function (element) {
        var codeStyles = getStyles(element);
        var whiteSpace = codeStyles['white-space'];

        if (whiteSpace === 'pre-wrap' || whiteSpace === 'pre-line') {
            var codeElement = element.querySelector('code');
            var lineNumbersWrapper = element.querySelector('.line-numbers-rows');
            if (!codeElement || !lineNumbersWrapper) {
                return;
            }
            var lineNumberSizer = element.querySelector('.line-numbers-sizer');
            var codeLines = codeElement.textContent.split(NEW_LINE_EXP);

            if (!lineNumberSizer) {
                lineNumberSizer = document.createElement('span');
                lineNumberSizer.className = 'line-numbers-sizer';

                codeElement.appendChild(lineNumberSizer);
            }

            lineNumberSizer.style.display = 'block';

            codeLines.forEach(function (line, lineNumber) {
                lineNumberSizer.textContent = line || '\n';
                var lineSize = lineNumberSizer.getBoundingClientRect().height;
                lineNumbersWrapper.children[lineNumber].style.height = lineSize + 'px';
            });

            lineNumberSizer.textContent = '';
            lineNumberSizer.style.display = 'none';
        }
    };

    /**
     * Returns style declarations for the element
     * @param {Element} element
     */
    var getStyles = function (element) {
        if (!element) {
            return null;
        }

        return window.getComputedStyle ? getComputedStyle(element) : (element.currentStyle || null);
    };

    window.addEventListener('resize', function () {
        Array.prototype.forEach.call(document.querySelectorAll('pre.' + PLUGIN_NAME), _resizeElement);
    });

    Prism.hooks.add('complete', function (env) {
        if (!env.code) {
            return;
        }

        var code = /** @type {Element} */ (env.element);
        var pre = /** @type {Element} */ (code.parentNode);

        // works only for <code> wrapped inside <pre> (not inline)
        if (!pre || !/pre/i.test(pre.nodeName)) {
            return;
        }

        // Abort if line numbers already exists
        if (code.querySelector('.line-numbers-rows')) {
            return;
        }

        // only add line numbers if <code> or one of its ancestors has the `line-numbers` class
        if (!Prism.util.isActive(code, PLUGIN_NAME)) {
            return;
        }

        // Remove the class 'line-numbers' from the <code>
        code.classList.remove(PLUGIN_NAME);
        // Add the class 'line-numbers' to the <pre>
        pre.classList.add(PLUGIN_NAME);

        var match = env.code.match(NEW_LINE_EXP);
        var linesNum = match ? match.length + 1 : 1;
        var lineNumbersWrapper;

        var lines = new Array(linesNum + 1).join('<span></span>');

        lineNumbersWrapper = document.createElement('span');
        lineNumbersWrapper.setAttribute('aria-hidden', 'true');
        lineNumbersWrapper.className = 'line-numbers-rows';
        lineNumbersWrapper.innerHTML = lines;

        if (pre.hasAttribute('data-start')) {
            pre.style.counterReset = 'linenumber ' + (parseInt(pre.getAttribute('data-start'), 10) - 1);
        }

        env.element.appendChild(lineNumbersWrapper);

        _resizeElement(pre);

        Prism.hooks.run('line-numbers', env);
    });

    Prism.hooks.add('line-numbers', function (env) {
        env.plugins = env.plugins || {};
        env.plugins.lineNumbers = true;
    });

    /**
     * Global exports
     */
    Prism.plugins.lineNumbers = {
        /**
         * Returns the node of the given line number in the given element.
         * @param {Element} element A `<pre>` element with line numbers.
         * @param {Number} number
         * @returns {Element | undefined}
         */
        getLine: function (element, number) {
            if (element.tagName !== 'PRE' || !element.classList.contains(PLUGIN_NAME)) {
                return;
            }

            var lineNumberRows = element.querySelector('.line-numbers-rows');
            var lineNumberStart = parseInt(element.getAttribute('data-start'), 10) || 1;
            var lineNumberEnd = lineNumberStart + (lineNumberRows.children.length - 1);

            if (number < lineNumberStart) {
                number = lineNumberStart;
            }
            if (number > lineNumberEnd) {
                number = lineNumberEnd;
            }

            var lineIndex = number - lineNumberStart;

            return lineNumberRows.children[lineIndex];
        },
        /**
         * Resizes the line numbers of the given element.
         *
         * This function will not add line numbers. It will only resize existing ones.
         * @param {Element} element A `<pre>` element with line numbers.
         * @returns {void}
         */
        resize: function (element) {
            _resizeElement(element);
        }
    };

}());

(function () {

    if (
        (typeof self === 'undefined' || !self.Prism) &&
        (typeof global === 'undefined' || !global.Prism)
    ) {
        return;
    }

    /**
     * @callback ClassMapper
     * @param {string} className
     * @param {string} language
     * @returns {string}
     *
     * @callback ClassAdder
     * @param {ClassAdderEnvironment} env
     * @returns {undefined | string | string[]}
     *
     * @typedef ClassAdderEnvironment
     * @property {string} language
     * @property {string} type
     * @property {string} content
     */

    // options

    /** @type {ClassAdder | undefined} */
    var adder;
    /** @type {ClassMapper | undefined} */
    var mapper;
    /** @type {string} */
    var prefixString = '';


    Prism.plugins.customClass = {
        /**
         * Sets the function which can be used to add custom aliases to any token.
         *
         * @param {ClassAdder} classAdder
         */
        add: function (classAdder) {
            adder = classAdder;
        },
        /**
         * Maps all class names using the given object or map function.
         *
         * This does not affect the prefix.
         *
         * @param {Object<string, string> | ClassMapper} classMapper
         */
        map: function map(classMapper) {
            if (typeof classMapper === 'function') {
                mapper = classMapper;
            } else {
                mapper = function (className) {
                    return classMapper[className] || className;
                };
            }
        },
        /**
         * Adds the given prefix to all class names.
         *
         * @param {string} string
         */
        prefix: function prefix(string) {
            prefixString = string || '';
        }
    }

    Prism.hooks.add('wrap', function (env) {
        if (adder) {
            var result = adder({
                content: env.content,
                type: env.type,
                language: env.language
            });

            if (Array.isArray(result)) {
                env.classes.push.apply(env.classes, result);
            } else if (result) {
                env.classes.push(result);
            }
        }

        if (!mapper && !prefixString) {
            return;
        }

        env.classes = env.classes.map(function (c) {
            return prefixString + (mapper ? mapper(c, env.language) : c);
        });
    });

})();

(function () {

    var assign = Object.assign || function (obj1, obj2) {
        for (var name in obj2) {
            if (obj2.hasOwnProperty(name))
                obj1[name] = obj2[name];
        }
        return obj1;
    }

    function NormalizeWhitespace(defaults) {
        this.defaults = assign({}, defaults);
    }

    function toCamelCase(value) {
        return value.replace(/-(\w)/g, function (match, firstChar) {
            return firstChar.toUpperCase();
        });
    }

    function tabLen(str) {
        var res = 0;
        for (var i = 0; i < str.length; ++i) {
            if (str.charCodeAt(i) == '\t'.charCodeAt(0))
                res += 3;
        }
        return str.length + res;
    }

    NormalizeWhitespace.prototype = {
        setDefaults: function (defaults) {
            this.defaults = assign(this.defaults, defaults);
        },
        normalize: function (input, settings) {
            settings = assign(this.defaults, settings);

            for (var name in settings) {
                var methodName = toCamelCase(name);
                if (name !== "normalize" && methodName !== 'setDefaults' &&
                    settings[name] && this[methodName]) {
                    input = this[methodName].call(this, input, settings[name]);
                }
            }

            return input;
        },

        /*
         * Normalization methods
         */
        leftTrim: function (input) {
            return input.replace(/^\s+/, '');
        },
        rightTrim: function (input) {
            return input.replace(/\s+$/, '');
        },
        tabsToSpaces: function (input, spaces) {
            spaces = spaces | 0 || 4;
            return input.replace(/\t/g, new Array(++spaces).join(' '));
        },
        spacesToTabs: function (input, spaces) {
            spaces = spaces | 0 || 4;
            return input.replace(RegExp(' {' + spaces + '}', 'g'), '\t');
        },
        removeTrailing: function (input) {
            return input.replace(/\s*?$/gm, '');
        },
        // Support for deprecated plugin remove-initial-line-feed
        removeInitialLineFeed: function (input) {
            return input.replace(/^(?:\r?\n|\r)/, '');
        },
        removeIndent: function (input) {
            var indents = input.match(/^[^\S\n\r]*(?=\S)/gm);

            if (!indents || !indents[0].length)
                return input;

            indents.sort(function (a, b) { return a.length - b.length; });

            if (!indents[0].length)
                return input;

            return input.replace(RegExp('^' + indents[0], 'gm'), '');
        },
        indent: function (input, tabs) {
            return input.replace(/^[^\S\n\r]*(?=\S)/gm, new Array(++tabs).join('\t') + '$&');
        },
        breakLines: function (input, characters) {
            characters = (characters === true) ? 80 : characters | 0 || 80;

            var lines = input.split('\n');
            for (var i = 0; i < lines.length; ++i) {
                if (tabLen(lines[i]) <= characters)
                    continue;

                var line = lines[i].split(/(\s+)/g),
                    len = 0;

                for (var j = 0; j < line.length; ++j) {
                    var tl = tabLen(line[j]);
                    len += tl;
                    if (len > characters) {
                        line[j] = '\n' + line[j];
                        len = tl;
                    }
                }
                lines[i] = line.join('');
            }
            return lines.join('\n');
        }
    };

    // Support node modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = NormalizeWhitespace;
    }

    // Exit if prism is not loaded
    if (typeof Prism === 'undefined') {
        return;
    }

    Prism.plugins.NormalizeWhitespace = new NormalizeWhitespace({
        'remove-trailing': true,
        'remove-indent': true,
        'left-trim': true,
        'right-trim': true,
        /*'break-lines': 80,
        'indent': 2,
        'remove-initial-line-feed': false,
        'tabs-to-spaces': 4,
        'spaces-to-tabs': 4*/
    });

    Prism.hooks.add('before-sanity-check', function (env) {
        var Normalizer = Prism.plugins.NormalizeWhitespace;

        // Check settings
        if (env.settings && env.settings['whitespace-normalization'] === false) {
            return;
        }

        // Check classes
        if (!Prism.util.isActive(env.element, 'whitespace-normalization', true)) {
            return;
        }

        // Simple mode if there is no env.element
        if ((!env.element || !env.element.parentNode) && env.code) {
            env.code = Normalizer.normalize(env.code, env.settings);
            return;
        }

        // Normal mode
        var pre = env.element.parentNode;
        if (!env.code || !pre || pre.nodeName.toLowerCase() !== 'pre') {
            return;
        }

        var children = pre.childNodes,
            before = '',
            after = '',
            codeFound = false;

        // Move surrounding whitespace from the <pre> tag into the <code> tag
        for (var i = 0; i < children.length; ++i) {
            var node = children[i];

            if (node == env.element) {
                codeFound = true;
            } else if (node.nodeName === "#text") {
                if (codeFound) {
                    after += node.nodeValue;
                } else {
                    before += node.nodeValue;
                }

                pre.removeChild(node);
                --i;
            }
        }

        if (!env.element.children.length || !Prism.plugins.KeepMarkup) {
            env.code = before + env.code + after;
            env.code = Normalizer.normalize(env.code, env.settings);
        } else {
            // Preserve markup for keep-markup plugin
            var html = before + env.element.innerHTML + after;
            env.element.innerHTML = Normalizer.normalize(html, env.settings);
            env.code = env.element.textContent;
        }
    });

}());

(function () {
    if (typeof self === 'undefined' || !self.Prism || !self.document) {
        return;
    }

    var callbacks = [];
    var map = {};
    var noop = function () { };

    Prism.plugins.toolbar = {};

    /**
     * @typedef ButtonOptions
     * @property {string} text The text displayed.
     * @property {string} [url] The URL of the link which will be created.
     * @property {Function} [onClick] The event listener for the `click` event of the created button.
     * @property {string} [className] The class attribute to include with element.
     */

    /**
     * Register a button callback with the toolbar.
     *
     * @param {string} key
     * @param {ButtonOptions|Function} opts
     */
    var registerButton = Prism.plugins.toolbar.registerButton = function (key, opts) {
        var callback;

        if (typeof opts === 'function') {
            callback = opts;
        } else {
            callback = function (env) {
                var element;

                if (typeof opts.onClick === 'function') {
                    element = document.createElement('button');
                    element.type = 'button';
                    element.addEventListener('click', function () {
                        opts.onClick.call(this, env);
                    });
                } else if (typeof opts.url === 'string') {
                    element = document.createElement('a');
                    element.href = opts.url;
                } else {
                    element = document.createElement('span');
                }

                if (opts.className) {
                    element.classList.add(opts.className);
                }

                element.textContent = opts.text;

                return element;
            };
        }

        if (key in map) {
            console.warn('There is a button with the key "' + key + '" registered already.');
            return;
        }

        callbacks.push(map[key] = callback);
    };

    /**
     * Returns the callback order of the given element.
     *
     * @param {HTMLElement} element
     * @returns {string[] | undefined}
     */
    function getOrder(element) {
        while (element) {
            var order = element.getAttribute('data-toolbar-order');
            if (order != null) {
                order = order.trim();
                if (order.length) {
                    return order.split(/\s*,\s*/g);
                } else {
                    return [];
                }
            }
            element = element.parentElement;
        }
    }

    /**
     * Post-highlight Prism hook callback.
     *
     * @param env
     */
    var hook = Prism.plugins.toolbar.hook = function (env) {
        // Check if inline or actual code block (credit to line-numbers plugin)
        var pre = env.element.parentNode;
        if (!pre || !/pre/i.test(pre.nodeName)) {
            return;
        }

        // Autoloader rehighlights, so only do this once.
        if (pre.parentNode.classList.contains('code-toolbar')) {
            return;
        }

        // Create wrapper for <pre> to prevent scrolling toolbar with content
        var wrapper = document.createElement('div');
        wrapper.classList.add('code-toolbar');
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        // Setup the toolbar
        var toolbar = document.createElement('div');
        toolbar.classList.add('toolbar');

        // order callbacks
        var elementCallbacks = callbacks;
        var order = getOrder(env.element);
        if (order) {
            elementCallbacks = order.map(function (key) {
                return map[key] || noop;
            });
        }

        elementCallbacks.forEach(function (callback) {
            var element = callback(env);

            if (!element) {
                return;
            }

            var item = document.createElement('div');
            item.classList.add('toolbar-item');

            item.appendChild(element);
            toolbar.appendChild(item);
        });

        // Add our toolbar to the currently created wrapper of <pre> tag
        wrapper.appendChild(toolbar);
    };

    registerButton('label', function (env) {
        var pre = env.element.parentNode;
        if (!pre || !/pre/i.test(pre.nodeName)) {
            return;
        }

        if (!pre.hasAttribute('data-label')) {
            return;
        }

        var element, template;
        var text = pre.getAttribute('data-label');
        try {
            // Any normal text will blow up this selector.
            template = document.querySelector('template#' + text);
        } catch (e) { }

        if (template) {
            element = template.content;
        } else {
            if (pre.hasAttribute('data-url')) {
                element = document.createElement('a');
                element.href = pre.getAttribute('data-url');
            } else {
                element = document.createElement('span');
            }

            element.textContent = text;
        }

        return element;
    });

    /**
     * Register the toolbar with Prism.
     */
    Prism.hooks.add('complete', hook);
})();

(function () {
    if (typeof self === 'undefined' || !self.Prism || !self.document) {
        return;
    }

    if (!Prism.plugins.toolbar) {
        console.warn('Copy to Clipboard plugin loaded before Toolbar plugin.');

        return;
    }

    var ClipboardJS = window.ClipboardJS || undefined;

    if (!ClipboardJS && typeof require === 'function') {
        ClipboardJS = require('clipboard');
    }

    var callbacks = [];

    if (!ClipboardJS) {
        var script = document.createElement('script');
        var head = document.querySelector('head');

        script.onload = function () {
            ClipboardJS = window.ClipboardJS;

            if (ClipboardJS) {
                while (callbacks.length) {
                    callbacks.pop()();
                }
            }
        };

        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js';
        head.appendChild(script);
    }

    Prism.plugins.toolbar.registerButton('copy-to-clipboard', function (env) {
        var linkCopy = document.createElement('button');
        linkCopy.textContent = 'Copy';

        if (!ClipboardJS) {
            callbacks.push(registerClipboard);
        } else {
            registerClipboard();
        }

        return linkCopy;

        function registerClipboard() {
            var clip = new ClipboardJS(linkCopy, {
                'text': function () {
                    return env.code;
                }
            });

            clip.on('success', function () {
                linkCopy.textContent = 'Copied!';

                resetText();
            });
            clip.on('error', function () {
                linkCopy.textContent = 'Press Ctrl+C to copy';

                resetText();
            });
        }

        function resetText() {
            setTimeout(function () {
                linkCopy.textContent = 'Copy';
            }, 5000);
        }
    });
})();

