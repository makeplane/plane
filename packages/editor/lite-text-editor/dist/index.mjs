var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../../node_modules/dom4/build/dom4.max.js
var require_dom4_max = __commonJS({
  "../../../node_modules/dom4/build/dom4.max.js"() {
    "use strict";
    (function(window2) {
      "use strict";
      function createDocumentFragment() {
        return document2.createDocumentFragment();
      }
      function createElement8(nodeName) {
        return document2.createElement(nodeName);
      }
      function enoughArguments(length, name) {
        if (!length)
          throw new Error(
            "Failed to construct " + name + ": 1 argument required, but only 0 present."
          );
      }
      function mutationMacro(nodes) {
        if (nodes.length === 1) {
          return textNodeIfPrimitive(nodes[0]);
        }
        for (var fragment = createDocumentFragment(), list = slice.call(nodes), i2 = 0; i2 < nodes.length; i2++) {
          fragment.appendChild(textNodeIfPrimitive(list[i2]));
        }
        return fragment;
      }
      function textNodeIfPrimitive(node) {
        return typeof node === "object" ? node : document2.createTextNode(node);
      }
      for (var head, property, TemporaryPrototype, TemporaryTokenList, wrapVerifyToken, document2 = window2.document, hOP = Object.prototype.hasOwnProperty, defineProperty = Object.defineProperty || function(object, property2, descriptor) {
        if (hOP.call(descriptor, "value")) {
          object[property2] = descriptor.value;
        } else {
          if (hOP.call(descriptor, "get"))
            object.__defineGetter__(property2, descriptor.get);
          if (hOP.call(descriptor, "set"))
            object.__defineSetter__(property2, descriptor.set);
        }
        return object;
      }, indexOf = [].indexOf || function indexOf2(value) {
        var length = this.length;
        while (length--) {
          if (this[length] === value) {
            break;
          }
        }
        return length;
      }, verifyToken = function(token) {
        if (!token) {
          throw "SyntaxError";
        } else if (spaces.test(token)) {
          throw "InvalidCharacterError";
        }
        return token;
      }, DOMTokenList = function(node) {
        var noClassName = typeof node.className === "undefined", className = noClassName ? node.getAttribute("class") || "" : node.className, isSVG2 = noClassName || typeof className === "object", value = (isSVG2 ? noClassName ? className : className.baseVal : className).replace(trim, "");
        if (value.length) {
          properties.push.apply(
            this,
            value.split(spaces)
          );
        }
        this._isSVG = isSVG2;
        this._ = node;
      }, classListDescriptor = {
        get: function get() {
          return new DOMTokenList(this);
        },
        set: function() {
        }
      }, trim = /^\s+|\s+$/g, spaces = /\s+/, SPACE2 = " ", CLASS_LIST = "classList", toggle = function toggle2(token, force) {
        if (this.contains(token)) {
          if (!force) {
            this.remove(token);
          }
        } else if (force === void 0 || force) {
          force = true;
          this.add(token);
        }
        return !!force;
      }, DocumentFragmentPrototype = window2.DocumentFragment && DocumentFragment.prototype, Node3 = window2.Node, NodePrototype = (Node3 || Element).prototype, CharacterData = window2.CharacterData || Node3, CharacterDataPrototype = CharacterData && CharacterData.prototype, DocumentType = window2.DocumentType, DocumentTypePrototype = DocumentType && DocumentType.prototype, ElementPrototype = (window2.Element || Node3 || window2.HTMLElement).prototype, HTMLSelectElement = window2.HTMLSelectElement || createElement8("select").constructor, selectRemove = HTMLSelectElement.prototype.remove, SVGElement2 = window2.SVGElement, properties = [
        "matches",
        ElementPrototype.matchesSelector || ElementPrototype.webkitMatchesSelector || ElementPrototype.khtmlMatchesSelector || ElementPrototype.mozMatchesSelector || ElementPrototype.msMatchesSelector || ElementPrototype.oMatchesSelector || function matches2(selector) {
          var parentNode = this.parentNode;
          return !!parentNode && -1 < indexOf.call(
            parentNode.querySelectorAll(selector),
            this
          );
        },
        "closest",
        function closest(selector) {
          var parentNode = this, matches2;
          while (
            // document has no .matches
            (matches2 = parentNode && parentNode.matches) && !parentNode.matches(selector)
          ) {
            parentNode = parentNode.parentNode;
          }
          return matches2 ? parentNode : null;
        },
        "prepend",
        function prepend() {
          var firstChild = this.firstChild, node = mutationMacro(arguments);
          if (firstChild) {
            this.insertBefore(node, firstChild);
          } else {
            this.appendChild(node);
          }
        },
        "append",
        function append() {
          this.appendChild(mutationMacro(arguments));
        },
        "before",
        function before() {
          var parentNode = this.parentNode;
          if (parentNode) {
            parentNode.insertBefore(
              mutationMacro(arguments),
              this
            );
          }
        },
        "after",
        function after() {
          var parentNode = this.parentNode, nextSibling = this.nextSibling, node = mutationMacro(arguments);
          if (parentNode) {
            if (nextSibling) {
              parentNode.insertBefore(node, nextSibling);
            } else {
              parentNode.appendChild(node);
            }
          }
        },
        // https://dom.spec.whatwg.org/#dom-element-toggleattribute
        "toggleAttribute",
        function toggleAttribute(name, force) {
          var had = this.hasAttribute(name);
          if (1 < arguments.length) {
            if (had && !force)
              this.removeAttribute(name);
            else if (force && !had)
              this.setAttribute(name, "");
          } else if (had)
            this.removeAttribute(name);
          else
            this.setAttribute(name, "");
          return this.hasAttribute(name);
        },
        // WARNING - DEPRECATED - use .replaceWith() instead
        "replace",
        function replace2() {
          this.replaceWith.apply(this, arguments);
        },
        "replaceWith",
        function replaceWith() {
          var parentNode = this.parentNode;
          if (parentNode) {
            parentNode.replaceChild(
              mutationMacro(arguments),
              this
            );
          }
        },
        "remove",
        function remove() {
          var parentNode = this.parentNode;
          if (parentNode) {
            parentNode.removeChild(this);
          }
        }
      ], slice = properties.slice, i = properties.length; i; i -= 2) {
        property = properties[i - 2];
        if (!(property in ElementPrototype)) {
          ElementPrototype[property] = properties[i - 1];
        }
        if (property === "remove" && !selectRemove._dom4) {
          (HTMLSelectElement.prototype[property] = function() {
            return 0 < arguments.length ? selectRemove.apply(this, arguments) : ElementPrototype.remove.call(this);
          })._dom4 = true;
        }
        if (/^(?:before|after|replace|replaceWith|remove)$/.test(property)) {
          if (CharacterData && !(property in CharacterDataPrototype)) {
            CharacterDataPrototype[property] = properties[i - 1];
          }
          if (DocumentType && !(property in DocumentTypePrototype)) {
            DocumentTypePrototype[property] = properties[i - 1];
          }
        }
        if (/^(?:append|prepend)$/.test(property)) {
          if (DocumentFragmentPrototype) {
            if (!(property in DocumentFragmentPrototype)) {
              DocumentFragmentPrototype[property] = properties[i - 1];
            }
          } else {
            try {
              createDocumentFragment().constructor.prototype[property] = properties[i - 1];
            } catch (o_O) {
            }
          }
        }
      }
      if (!createElement8("a").matches("a")) {
        ElementPrototype[property] = function(matches2) {
          return function(selector) {
            return matches2.call(
              this.parentNode ? this : createDocumentFragment().appendChild(this),
              selector
            );
          };
        }(ElementPrototype[property]);
      }
      DOMTokenList.prototype = {
        length: 0,
        add: function add() {
          for (var j = 0, token; j < arguments.length; j++) {
            token = arguments[j];
            if (!this.contains(token)) {
              properties.push.call(this, property);
            }
          }
          if (this._isSVG) {
            this._.setAttribute("class", "" + this);
          } else {
            this._.className = "" + this;
          }
        },
        contains: function(indexOf2) {
          return function contains2(token) {
            i = indexOf2.call(this, property = verifyToken(token));
            return -1 < i;
          };
        }([].indexOf || function(token) {
          i = this.length;
          while (i-- && this[i] !== token) {
          }
          return i;
        }),
        item: function item(i2) {
          return this[i2] || null;
        },
        remove: function remove() {
          for (var j = 0, token; j < arguments.length; j++) {
            token = arguments[j];
            if (this.contains(token)) {
              properties.splice.call(this, i, 1);
            }
          }
          if (this._isSVG) {
            this._.setAttribute("class", "" + this);
          } else {
            this._.className = "" + this;
          }
        },
        toggle,
        toString: function toString() {
          return properties.join.call(this, SPACE2);
        }
      };
      if (SVGElement2 && !(CLASS_LIST in SVGElement2.prototype)) {
        defineProperty(SVGElement2.prototype, CLASS_LIST, classListDescriptor);
      }
      if (!(CLASS_LIST in document2.documentElement)) {
        defineProperty(ElementPrototype, CLASS_LIST, classListDescriptor);
      } else {
        TemporaryTokenList = createElement8("div")[CLASS_LIST];
        TemporaryTokenList.add("a", "b", "a");
        if ("a b" != TemporaryTokenList) {
          TemporaryPrototype = TemporaryTokenList.constructor.prototype;
          if (!("add" in TemporaryPrototype)) {
            TemporaryPrototype = window2.TemporaryTokenList.prototype;
          }
          wrapVerifyToken = function(original) {
            return function() {
              var i2 = 0;
              while (i2 < arguments.length) {
                original.call(this, arguments[i2++]);
              }
            };
          };
          TemporaryPrototype.add = wrapVerifyToken(TemporaryPrototype.add);
          TemporaryPrototype.remove = wrapVerifyToken(TemporaryPrototype.remove);
          TemporaryPrototype.toggle = toggle;
        }
      }
      if (!("contains" in NodePrototype)) {
        defineProperty(NodePrototype, "contains", {
          value: function(el) {
            while (el && el !== this)
              el = el.parentNode;
            return this === el;
          }
        });
      }
      if (!("head" in document2)) {
        defineProperty(document2, "head", {
          get: function() {
            return head || (head = document2.getElementsByTagName("head")[0]);
          }
        });
      }
      (function() {
        for (var raf, rAF = window2.requestAnimationFrame, cAF = window2.cancelAnimationFrame, prefixes = ["o", "ms", "moz", "webkit"], i2 = prefixes.length; !cAF && i2--; ) {
          rAF = rAF || window2[prefixes[i2] + "RequestAnimationFrame"];
          cAF = window2[prefixes[i2] + "CancelAnimationFrame"] || window2[prefixes[i2] + "CancelRequestAnimationFrame"];
        }
        if (!cAF) {
          if (rAF) {
            raf = rAF;
            rAF = function(callback) {
              var goOn = true;
              raf(function() {
                if (goOn)
                  callback.apply(this, arguments);
              });
              return function() {
                goOn = false;
              };
            };
            cAF = function(id) {
              id();
            };
          } else {
            rAF = function(callback) {
              return setTimeout(callback, 15, 15);
            };
            cAF = function(id) {
              clearTimeout(id);
            };
          }
        }
        window2.requestAnimationFrame = rAF;
        window2.cancelAnimationFrame = cAF;
      })();
      try {
        new window2.CustomEvent("?");
      } catch (o_O) {
        window2.CustomEvent = function(eventName, defaultInitDict) {
          function CustomEvent2(type, eventInitDict) {
            var event = document2.createEvent(eventName);
            if (typeof type != "string") {
              throw new Error("An event name must be provided");
            }
            if (eventName == "Event") {
              event.initCustomEvent = initCustomEvent;
            }
            if (eventInitDict == null) {
              eventInitDict = defaultInitDict;
            }
            event.initCustomEvent(
              type,
              eventInitDict.bubbles,
              eventInitDict.cancelable,
              eventInitDict.detail
            );
            return event;
          }
          function initCustomEvent(type, bubbles, cancelable, detail) {
            this.initEvent(type, bubbles, cancelable);
            this.detail = detail;
          }
          return CustomEvent2;
        }(
          // is this IE9 or IE10 ?
          // where CustomEvent is there
          // but not usable as construtor ?
          window2.CustomEvent ? (
            // use the CustomEvent interface in such case
            "CustomEvent"
          ) : "Event",
          // otherwise the common compatible one
          {
            bubbles: false,
            cancelable: false,
            detail: null
          }
        );
      }
      try {
        new Event("_");
      } catch (o_O) {
        o_O = function($Event) {
          function Event2(type, init) {
            enoughArguments(arguments.length, "Event");
            var out = document2.createEvent("Event");
            if (!init)
              init = {};
            out.initEvent(
              type,
              !!init.bubbles,
              !!init.cancelable
            );
            return out;
          }
          Event2.prototype = $Event.prototype;
          return Event2;
        }(window2.Event || function Event2() {
        });
        defineProperty(window2, "Event", { value: o_O });
        if (Event !== o_O)
          Event = o_O;
      }
      try {
        new KeyboardEvent("_", {});
      } catch (o_O) {
        o_O = function($KeyboardEvent) {
          var initType = 0, defaults = {
            char: "",
            key: "",
            location: 0,
            ctrlKey: false,
            shiftKey: false,
            altKey: false,
            metaKey: false,
            altGraphKey: false,
            repeat: false,
            locale: navigator.language,
            detail: 0,
            bubbles: false,
            cancelable: false,
            keyCode: 0,
            charCode: 0,
            which: 0
          }, eventType;
          try {
            var e = document2.createEvent("KeyboardEvent");
            e.initKeyboardEvent(
              "keyup",
              false,
              false,
              window2,
              "+",
              3,
              true,
              false,
              true,
              false,
              false
            );
            initType = (e.keyIdentifier || e.key) == "+" && (e.keyLocation || e.location) == 3 && (e.ctrlKey ? e.altKey ? 1 : 3 : e.shiftKey ? 2 : 4) || 9;
          } catch (o_O2) {
          }
          eventType = 0 < initType ? "KeyboardEvent" : "Event";
          function getModifier(init) {
            for (var out = [], keys2 = [
              "ctrlKey",
              "Control",
              "shiftKey",
              "Shift",
              "altKey",
              "Alt",
              "metaKey",
              "Meta",
              "altGraphKey",
              "AltGraph"
            ], i2 = 0; i2 < keys2.length; i2 += 2) {
              if (init[keys2[i2]])
                out.push(keys2[i2 + 1]);
            }
            return out.join(" ");
          }
          function withDefaults(target, source) {
            for (var key in source) {
              if (source.hasOwnProperty(key) && !source.hasOwnProperty.call(target, key))
                target[key] = source[key];
            }
            return target;
          }
          function withInitValues(key, out, init) {
            try {
              out[key] = init[key];
            } catch (o_O2) {
            }
          }
          function KeyboardEvent2(type, init) {
            enoughArguments(arguments.length, "KeyboardEvent");
            init = withDefaults(init || {}, defaults);
            var out = document2.createEvent(eventType), ctrlKey = init.ctrlKey, shiftKey = init.shiftKey, altKey = init.altKey, metaKey = init.metaKey, altGraphKey = init.altGraphKey, modifiers = initType > 3 ? getModifier(init) : null, key = String(init.key), chr = String(init.char), location = init.location, keyCode = init.keyCode || (init.keyCode = key) && key.charCodeAt(0) || 0, charCode = init.charCode || (init.charCode = chr) && chr.charCodeAt(0) || 0, bubbles = init.bubbles, cancelable = init.cancelable, repeat = init.repeat, locale = init.locale, view = init.view || window2, args;
            if (!init.which)
              init.which = init.keyCode;
            if ("initKeyEvent" in out) {
              out.initKeyEvent(
                type,
                bubbles,
                cancelable,
                view,
                ctrlKey,
                altKey,
                shiftKey,
                metaKey,
                keyCode,
                charCode
              );
            } else if (0 < initType && "initKeyboardEvent" in out) {
              args = [type, bubbles, cancelable, view];
              switch (initType) {
                case 1:
                  args.push(key, location, ctrlKey, shiftKey, altKey, metaKey, altGraphKey);
                  break;
                case 2:
                  args.push(ctrlKey, altKey, shiftKey, metaKey, keyCode, charCode);
                  break;
                case 3:
                  args.push(key, location, ctrlKey, altKey, shiftKey, metaKey, altGraphKey);
                  break;
                case 4:
                  args.push(key, location, modifiers, repeat, locale);
                  break;
                default:
                  args.push(char, key, location, modifiers, repeat, locale);
              }
              out.initKeyboardEvent.apply(out, args);
            } else {
              out.initEvent(type, bubbles, cancelable);
            }
            for (key in out) {
              if (defaults.hasOwnProperty(key) && out[key] !== init[key]) {
                withInitValues(key, out, init);
              }
            }
            return out;
          }
          KeyboardEvent2.prototype = $KeyboardEvent.prototype;
          return KeyboardEvent2;
        }(window2.KeyboardEvent || function KeyboardEvent2() {
        });
        defineProperty(window2, "KeyboardEvent", { value: o_O });
        if (KeyboardEvent !== o_O)
          KeyboardEvent = o_O;
      }
      try {
        new MouseEvent("_", {});
      } catch (o_O) {
        o_O = function($MouseEvent) {
          function MouseEvent2(type, init) {
            enoughArguments(arguments.length, "MouseEvent");
            var out = document2.createEvent("MouseEvent");
            if (!init)
              init = {};
            out.initMouseEvent(
              type,
              !!init.bubbles,
              !!init.cancelable,
              init.view || window2,
              init.detail || 1,
              init.screenX || 0,
              init.screenY || 0,
              init.clientX || 0,
              init.clientY || 0,
              !!init.ctrlKey,
              !!init.altKey,
              !!init.shiftKey,
              !!init.metaKey,
              init.button || 0,
              init.relatedTarget || null
            );
            return out;
          }
          MouseEvent2.prototype = $MouseEvent.prototype;
          return MouseEvent2;
        }(window2.MouseEvent || function MouseEvent2() {
        });
        defineProperty(window2, "MouseEvent", { value: o_O });
        if (MouseEvent !== o_O)
          MouseEvent = o_O;
      }
      if (!document2.querySelectorAll("*").forEach) {
        (function() {
          function patch(what) {
            var querySelectorAll = what.querySelectorAll;
            what.querySelectorAll = function qSA(css) {
              var result = querySelectorAll.call(this, css);
              result.forEach = Array.prototype.forEach;
              return result;
            };
          }
          patch(document2);
          patch(Element.prototype);
        })();
      }
      try {
        document2.querySelector(":scope *");
      } catch (o_O) {
        (function() {
          var dataScope = "data-scope-" + (Math.random() * 1e9 >>> 0);
          var proto = Element.prototype;
          var querySelector = proto.querySelector;
          var querySelectorAll = proto.querySelectorAll;
          proto.querySelector = function qS(css) {
            return find(this, querySelector, css);
          };
          proto.querySelectorAll = function qSA(css) {
            return find(this, querySelectorAll, css);
          };
          function find(node, method, css) {
            if (node.type != document2.ELEMENT_NODE)
              return method.call(node, css);
            node.setAttribute(dataScope, null);
            var result = method.call(
              node,
              String(css).replace(
                /(^|,\s*)(:scope([ >]|$))/g,
                function($0, $1, $2, $3) {
                  return $1 + "[" + dataScope + "]" + ($3 || " ");
                }
              )
            );
            node.removeAttribute(dataScope);
            return result;
          }
        })();
      }
    })(window);
    (function(global2) {
      "use strict";
      var DOMMap = global2.WeakMap || function() {
        var counter2 = 0, dispatched = false, drop = false, value;
        function dispatch(key, ce, shouldDrop) {
          drop = shouldDrop;
          dispatched = false;
          value = void 0;
          key.dispatchEvent(ce);
        }
        function Handler(value2) {
          this.value = value2;
        }
        Handler.prototype.handleEvent = function handleEvent(e) {
          dispatched = true;
          if (drop) {
            e.currentTarget.removeEventListener(e.type, this, false);
          } else {
            value = this.value;
          }
        };
        function DOMMap2() {
          counter2++;
          this.__ce__ = new Event2("@DOMMap:" + counter2 + Math.random());
        }
        DOMMap2.prototype = {
          "constructor": DOMMap2,
          "delete": function del2(key) {
            return dispatch(key, this.__ce__, true), dispatched;
          },
          "get": function get(key) {
            dispatch(key, this.__ce__, false);
            var v = value;
            value = void 0;
            return v;
          },
          "has": function has(key) {
            return dispatch(key, this.__ce__, false), dispatched;
          },
          "set": function set(key, value2) {
            dispatch(key, this.__ce__, true);
            key.addEventListener(this.__ce__.type, new Handler(value2), false);
            return this;
          }
        };
        return DOMMap2;
      }();
      function Dict() {
      }
      Dict.prototype = (Object.create || Object)(null);
      function createEventListener(type, callback, options) {
        function eventListener(e) {
          if (eventListener.once) {
            e.currentTarget.removeEventListener(
              e.type,
              callback,
              eventListener
            );
            eventListener.removed = true;
          }
          if (eventListener.passive) {
            e.preventDefault = createEventListener.preventDefault;
          }
          if (typeof eventListener.callback === "function") {
            eventListener.callback.call(this, e);
          } else if (eventListener.callback) {
            eventListener.callback.handleEvent(e);
          }
          if (eventListener.passive) {
            delete e.preventDefault;
          }
        }
        eventListener.type = type;
        eventListener.callback = callback;
        eventListener.capture = !!options.capture;
        eventListener.passive = !!options.passive;
        eventListener.once = !!options.once;
        eventListener.removed = false;
        return eventListener;
      }
      createEventListener.preventDefault = function preventDefault() {
      };
      var Event2 = global2.CustomEvent, dE = global2.dispatchEvent, aEL = global2.addEventListener, rEL = global2.removeEventListener, counter = 0, increment = function() {
        counter++;
      }, indexOf = [].indexOf || function indexOf2(value) {
        var length = this.length;
        while (length--) {
          if (this[length] === value) {
            break;
          }
        }
        return length;
      }, getListenerKey = function(options) {
        return "".concat(
          options.capture ? "1" : "0",
          options.passive ? "1" : "0",
          options.once ? "1" : "0"
        );
      }, augment;
      try {
        aEL("_", increment, { once: true });
        dE(new Event2("_"));
        dE(new Event2("_"));
        rEL("_", increment, { once: true });
      } catch (o_O) {
      }
      if (counter !== 1) {
        (function() {
          var dm = new DOMMap();
          function createAEL(aEL2) {
            return function addEventListener(type, handler, options) {
              if (options && typeof options !== "boolean") {
                var info = dm.get(this), key = getListenerKey(options), i, tmp, wrap;
                if (!info)
                  dm.set(this, info = new Dict());
                if (!(type in info))
                  info[type] = {
                    handler: [],
                    wrap: []
                  };
                tmp = info[type];
                i = indexOf.call(tmp.handler, handler);
                if (i < 0) {
                  i = tmp.handler.push(handler) - 1;
                  tmp.wrap[i] = wrap = new Dict();
                } else {
                  wrap = tmp.wrap[i];
                }
                if (!(key in wrap)) {
                  wrap[key] = createEventListener(type, handler, options);
                  aEL2.call(this, type, wrap[key], wrap[key].capture);
                }
              } else {
                aEL2.call(this, type, handler, options);
              }
            };
          }
          function createREL(rEL2) {
            return function removeEventListener(type, handler, options) {
              if (options && typeof options !== "boolean") {
                var info = dm.get(this), key, i, tmp, wrap;
                if (info && type in info) {
                  tmp = info[type];
                  i = indexOf.call(tmp.handler, handler);
                  if (-1 < i) {
                    key = getListenerKey(options);
                    wrap = tmp.wrap[i];
                    if (key in wrap) {
                      rEL2.call(this, type, wrap[key], wrap[key].capture);
                      delete wrap[key];
                      for (key in wrap)
                        return;
                      tmp.handler.splice(i, 1);
                      tmp.wrap.splice(i, 1);
                      if (tmp.handler.length === 0)
                        delete info[type];
                    }
                  }
                }
              } else {
                rEL2.call(this, type, handler, options);
              }
            };
          }
          augment = function(Constructor) {
            if (!Constructor)
              return;
            var proto = Constructor.prototype;
            proto.addEventListener = createAEL(proto.addEventListener);
            proto.removeEventListener = createREL(proto.removeEventListener);
          };
          if (global2.EventTarget) {
            augment(EventTarget);
          } else {
            augment(global2.Text);
            augment(global2.Element || global2.HTMLElement);
            augment(global2.HTMLDocument);
            augment(global2.Window || { prototype: global2 });
            augment(global2.XMLHttpRequest);
          }
        })();
      }
    })(self);
  }
});

// ../../../node_modules/classnames/index.js
var require_classnames = __commonJS({
  "../../../node_modules/classnames/index.js"(exports, module) {
    "use strict";
    (function() {
      "use strict";
      var hasOwn = {}.hasOwnProperty;
      var nativeCodeString = "[native code]";
      function classNames4() {
        var classes = [];
        for (var i = 0; i < arguments.length; i++) {
          var arg = arguments[i];
          if (!arg)
            continue;
          var argType = typeof arg;
          if (argType === "string" || argType === "number") {
            classes.push(arg);
          } else if (Array.isArray(arg)) {
            if (arg.length) {
              var inner = classNames4.apply(null, arg);
              if (inner) {
                classes.push(inner);
              }
            }
          } else if (argType === "object") {
            if (arg.toString !== Object.prototype.toString && !arg.toString.toString().includes("[native code]")) {
              classes.push(arg.toString());
              continue;
            }
            for (var key in arg) {
              if (hasOwn.call(arg, key) && arg[key]) {
                classes.push(key);
              }
            }
          }
        }
        return classes.join(" ");
      }
      if (typeof module !== "undefined" && module.exports) {
        classNames4.default = classNames4;
        module.exports = classNames4;
      } else if (typeof define === "function" && typeof define.amd === "object" && define.amd) {
        define("classnames", [], function() {
          return classNames4;
        });
      } else {
        window.classNames = classNames4;
      }
    })();
  }
});

// ../../../node_modules/warning/warning.js
var require_warning = __commonJS({
  "../../../node_modules/warning/warning.js"(exports, module) {
    "use strict";
    var __DEV__ = process.env.NODE_ENV !== "production";
    var warning2 = function() {
    };
    if (__DEV__) {
      printWarning = function printWarning2(format, args) {
        var len = arguments.length;
        args = new Array(len > 1 ? len - 1 : 0);
        for (var key = 1; key < len; key++) {
          args[key - 1] = arguments[key];
        }
        var argIndex = 0;
        var message = "Warning: " + format.replace(/%s/g, function() {
          return args[argIndex++];
        });
        if (typeof console !== "undefined") {
          console.error(message);
        }
        try {
          throw new Error(message);
        } catch (x) {
        }
      };
      warning2 = function(condition, format, args) {
        var len = arguments.length;
        args = new Array(len > 2 ? len - 2 : 0);
        for (var key = 2; key < len; key++) {
          args[key - 2] = arguments[key];
        }
        if (format === void 0) {
          throw new Error(
            "`warning(condition, format, ...args)` requires a warning message argument"
          );
        }
        if (!condition) {
          printWarning.apply(null, [format].concat(args));
        }
      };
    }
    var printWarning;
    module.exports = warning2;
  }
});

// ../../../node_modules/prop-types/node_modules/react-is/cjs/react-is.production.min.js
var require_react_is_production_min = __commonJS({
  "../../../node_modules/prop-types/node_modules/react-is/cjs/react-is.production.min.js"(exports) {
    "use strict";
    var b = "function" === typeof Symbol && Symbol.for;
    var c = b ? Symbol.for("react.element") : 60103;
    var d = b ? Symbol.for("react.portal") : 60106;
    var e = b ? Symbol.for("react.fragment") : 60107;
    var f = b ? Symbol.for("react.strict_mode") : 60108;
    var g = b ? Symbol.for("react.profiler") : 60114;
    var h = b ? Symbol.for("react.provider") : 60109;
    var k = b ? Symbol.for("react.context") : 60110;
    var l = b ? Symbol.for("react.async_mode") : 60111;
    var m = b ? Symbol.for("react.concurrent_mode") : 60111;
    var n = b ? Symbol.for("react.forward_ref") : 60112;
    var p = b ? Symbol.for("react.suspense") : 60113;
    var q = b ? Symbol.for("react.suspense_list") : 60120;
    var r = b ? Symbol.for("react.memo") : 60115;
    var t = b ? Symbol.for("react.lazy") : 60116;
    var v = b ? Symbol.for("react.block") : 60121;
    var w = b ? Symbol.for("react.fundamental") : 60117;
    var x = b ? Symbol.for("react.responder") : 60118;
    var y = b ? Symbol.for("react.scope") : 60119;
    function z(a) {
      if ("object" === typeof a && null !== a) {
        var u = a.$$typeof;
        switch (u) {
          case c:
            switch (a = a.type, a) {
              case l:
              case m:
              case e:
              case g:
              case f:
              case p:
                return a;
              default:
                switch (a = a && a.$$typeof, a) {
                  case k:
                  case n:
                  case t:
                  case r:
                  case h:
                    return a;
                  default:
                    return u;
                }
            }
          case d:
            return u;
        }
      }
    }
    function A(a) {
      return z(a) === m;
    }
    exports.AsyncMode = l;
    exports.ConcurrentMode = m;
    exports.ContextConsumer = k;
    exports.ContextProvider = h;
    exports.Element = c;
    exports.ForwardRef = n;
    exports.Fragment = e;
    exports.Lazy = t;
    exports.Memo = r;
    exports.Portal = d;
    exports.Profiler = g;
    exports.StrictMode = f;
    exports.Suspense = p;
    exports.isAsyncMode = function(a) {
      return A(a) || z(a) === l;
    };
    exports.isConcurrentMode = A;
    exports.isContextConsumer = function(a) {
      return z(a) === k;
    };
    exports.isContextProvider = function(a) {
      return z(a) === h;
    };
    exports.isElement = function(a) {
      return "object" === typeof a && null !== a && a.$$typeof === c;
    };
    exports.isForwardRef = function(a) {
      return z(a) === n;
    };
    exports.isFragment = function(a) {
      return z(a) === e;
    };
    exports.isLazy = function(a) {
      return z(a) === t;
    };
    exports.isMemo = function(a) {
      return z(a) === r;
    };
    exports.isPortal = function(a) {
      return z(a) === d;
    };
    exports.isProfiler = function(a) {
      return z(a) === g;
    };
    exports.isStrictMode = function(a) {
      return z(a) === f;
    };
    exports.isSuspense = function(a) {
      return z(a) === p;
    };
    exports.isValidElementType = function(a) {
      return "string" === typeof a || "function" === typeof a || a === e || a === m || a === g || a === f || a === p || a === q || "object" === typeof a && null !== a && (a.$$typeof === t || a.$$typeof === r || a.$$typeof === h || a.$$typeof === k || a.$$typeof === n || a.$$typeof === w || a.$$typeof === x || a.$$typeof === y || a.$$typeof === v);
    };
    exports.typeOf = z;
  }
});

// ../../../node_modules/prop-types/node_modules/react-is/cjs/react-is.development.js
var require_react_is_development = __commonJS({
  "../../../node_modules/prop-types/node_modules/react-is/cjs/react-is.development.js"(exports) {
    "use strict";
    if (process.env.NODE_ENV !== "production") {
      (function() {
        "use strict";
        var hasSymbol = typeof Symbol === "function" && Symbol.for;
        var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for("react.element") : 60103;
        var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for("react.portal") : 60106;
        var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for("react.fragment") : 60107;
        var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for("react.strict_mode") : 60108;
        var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for("react.profiler") : 60114;
        var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for("react.provider") : 60109;
        var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for("react.context") : 60110;
        var REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for("react.async_mode") : 60111;
        var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for("react.concurrent_mode") : 60111;
        var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for("react.forward_ref") : 60112;
        var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for("react.suspense") : 60113;
        var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for("react.suspense_list") : 60120;
        var REACT_MEMO_TYPE = hasSymbol ? Symbol.for("react.memo") : 60115;
        var REACT_LAZY_TYPE = hasSymbol ? Symbol.for("react.lazy") : 60116;
        var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for("react.block") : 60121;
        var REACT_FUNDAMENTAL_TYPE = hasSymbol ? Symbol.for("react.fundamental") : 60117;
        var REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for("react.responder") : 60118;
        var REACT_SCOPE_TYPE = hasSymbol ? Symbol.for("react.scope") : 60119;
        function isValidElementType(type) {
          return typeof type === "string" || typeof type === "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
          type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || typeof type === "object" && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || type.$$typeof === REACT_RESPONDER_TYPE || type.$$typeof === REACT_SCOPE_TYPE || type.$$typeof === REACT_BLOCK_TYPE);
        }
        function typeOf(object) {
          if (typeof object === "object" && object !== null) {
            var $$typeof = object.$$typeof;
            switch ($$typeof) {
              case REACT_ELEMENT_TYPE:
                var type = object.type;
                switch (type) {
                  case REACT_ASYNC_MODE_TYPE:
                  case REACT_CONCURRENT_MODE_TYPE:
                  case REACT_FRAGMENT_TYPE:
                  case REACT_PROFILER_TYPE:
                  case REACT_STRICT_MODE_TYPE:
                  case REACT_SUSPENSE_TYPE:
                    return type;
                  default:
                    var $$typeofType = type && type.$$typeof;
                    switch ($$typeofType) {
                      case REACT_CONTEXT_TYPE:
                      case REACT_FORWARD_REF_TYPE:
                      case REACT_LAZY_TYPE:
                      case REACT_MEMO_TYPE:
                      case REACT_PROVIDER_TYPE:
                        return $$typeofType;
                      default:
                        return $$typeof;
                    }
                }
              case REACT_PORTAL_TYPE:
                return $$typeof;
            }
          }
          return void 0;
        }
        var AsyncMode = REACT_ASYNC_MODE_TYPE;
        var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
        var ContextConsumer = REACT_CONTEXT_TYPE;
        var ContextProvider = REACT_PROVIDER_TYPE;
        var Element2 = REACT_ELEMENT_TYPE;
        var ForwardRef = REACT_FORWARD_REF_TYPE;
        var Fragment2 = REACT_FRAGMENT_TYPE;
        var Lazy = REACT_LAZY_TYPE;
        var Memo = REACT_MEMO_TYPE;
        var Portal2 = REACT_PORTAL_TYPE;
        var Profiler = REACT_PROFILER_TYPE;
        var StrictMode = REACT_STRICT_MODE_TYPE;
        var Suspense = REACT_SUSPENSE_TYPE;
        var hasWarnedAboutDeprecatedIsAsyncMode = false;
        function isAsyncMode(object) {
          {
            if (!hasWarnedAboutDeprecatedIsAsyncMode) {
              hasWarnedAboutDeprecatedIsAsyncMode = true;
              console["warn"]("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.");
            }
          }
          return isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE;
        }
        function isConcurrentMode(object) {
          return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
        }
        function isContextConsumer(object) {
          return typeOf(object) === REACT_CONTEXT_TYPE;
        }
        function isContextProvider(object) {
          return typeOf(object) === REACT_PROVIDER_TYPE;
        }
        function isElement3(object) {
          return typeof object === "object" && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
        }
        function isForwardRef(object) {
          return typeOf(object) === REACT_FORWARD_REF_TYPE;
        }
        function isFragment2(object) {
          return typeOf(object) === REACT_FRAGMENT_TYPE;
        }
        function isLazy(object) {
          return typeOf(object) === REACT_LAZY_TYPE;
        }
        function isMemo(object) {
          return typeOf(object) === REACT_MEMO_TYPE;
        }
        function isPortal(object) {
          return typeOf(object) === REACT_PORTAL_TYPE;
        }
        function isProfiler(object) {
          return typeOf(object) === REACT_PROFILER_TYPE;
        }
        function isStrictMode(object) {
          return typeOf(object) === REACT_STRICT_MODE_TYPE;
        }
        function isSuspense(object) {
          return typeOf(object) === REACT_SUSPENSE_TYPE;
        }
        exports.AsyncMode = AsyncMode;
        exports.ConcurrentMode = ConcurrentMode;
        exports.ContextConsumer = ContextConsumer;
        exports.ContextProvider = ContextProvider;
        exports.Element = Element2;
        exports.ForwardRef = ForwardRef;
        exports.Fragment = Fragment2;
        exports.Lazy = Lazy;
        exports.Memo = Memo;
        exports.Portal = Portal2;
        exports.Profiler = Profiler;
        exports.StrictMode = StrictMode;
        exports.Suspense = Suspense;
        exports.isAsyncMode = isAsyncMode;
        exports.isConcurrentMode = isConcurrentMode;
        exports.isContextConsumer = isContextConsumer;
        exports.isContextProvider = isContextProvider;
        exports.isElement = isElement3;
        exports.isForwardRef = isForwardRef;
        exports.isFragment = isFragment2;
        exports.isLazy = isLazy;
        exports.isMemo = isMemo;
        exports.isPortal = isPortal;
        exports.isProfiler = isProfiler;
        exports.isStrictMode = isStrictMode;
        exports.isSuspense = isSuspense;
        exports.isValidElementType = isValidElementType;
        exports.typeOf = typeOf;
      })();
    }
  }
});

// ../../../node_modules/prop-types/node_modules/react-is/index.js
var require_react_is = __commonJS({
  "../../../node_modules/prop-types/node_modules/react-is/index.js"(exports, module) {
    "use strict";
    if (process.env.NODE_ENV === "production") {
      module.exports = require_react_is_production_min();
    } else {
      module.exports = require_react_is_development();
    }
  }
});

// ../../../node_modules/object-assign/index.js
var require_object_assign = __commonJS({
  "../../../node_modules/object-assign/index.js"(exports, module) {
    "use strict";
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;
    function toObject(val) {
      if (val === null || val === void 0) {
        throw new TypeError("Object.assign cannot be called with null or undefined");
      }
      return Object(val);
    }
    function shouldUseNative() {
      try {
        if (!Object.assign) {
          return false;
        }
        var test1 = new String("abc");
        test1[5] = "de";
        if (Object.getOwnPropertyNames(test1)[0] === "5") {
          return false;
        }
        var test2 = {};
        for (var i = 0; i < 10; i++) {
          test2["_" + String.fromCharCode(i)] = i;
        }
        var order2 = Object.getOwnPropertyNames(test2).map(function(n) {
          return test2[n];
        });
        if (order2.join("") !== "0123456789") {
          return false;
        }
        var test3 = {};
        "abcdefghijklmnopqrst".split("").forEach(function(letter) {
          test3[letter] = letter;
        });
        if (Object.keys(Object.assign({}, test3)).join("") !== "abcdefghijklmnopqrst") {
          return false;
        }
        return true;
      } catch (err) {
        return false;
      }
    }
    module.exports = shouldUseNative() ? Object.assign : function(target, source) {
      var from;
      var to = toObject(target);
      var symbols;
      for (var s = 1; s < arguments.length; s++) {
        from = Object(arguments[s]);
        for (var key in from) {
          if (hasOwnProperty.call(from, key)) {
            to[key] = from[key];
          }
        }
        if (getOwnPropertySymbols) {
          symbols = getOwnPropertySymbols(from);
          for (var i = 0; i < symbols.length; i++) {
            if (propIsEnumerable.call(from, symbols[i])) {
              to[symbols[i]] = from[symbols[i]];
            }
          }
        }
      }
      return to;
    };
  }
});

// ../../../node_modules/prop-types/lib/ReactPropTypesSecret.js
var require_ReactPropTypesSecret = __commonJS({
  "../../../node_modules/prop-types/lib/ReactPropTypesSecret.js"(exports, module) {
    "use strict";
    var ReactPropTypesSecret = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
    module.exports = ReactPropTypesSecret;
  }
});

// ../../../node_modules/prop-types/lib/has.js
var require_has = __commonJS({
  "../../../node_modules/prop-types/lib/has.js"(exports, module) {
    "use strict";
    module.exports = Function.call.bind(Object.prototype.hasOwnProperty);
  }
});

// ../../../node_modules/prop-types/checkPropTypes.js
var require_checkPropTypes = __commonJS({
  "../../../node_modules/prop-types/checkPropTypes.js"(exports, module) {
    "use strict";
    var printWarning = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      ReactPropTypesSecret = require_ReactPropTypesSecret();
      loggedTypeFailures = {};
      has = require_has();
      printWarning = function(text) {
        var message = "Warning: " + text;
        if (typeof console !== "undefined") {
          console.error(message);
        }
        try {
          throw new Error(message);
        } catch (x) {
        }
      };
    }
    var ReactPropTypesSecret;
    var loggedTypeFailures;
    var has;
    function checkPropTypes(typeSpecs, values2, location, componentName, getStack) {
      if (process.env.NODE_ENV !== "production") {
        for (var typeSpecName in typeSpecs) {
          if (has(typeSpecs, typeSpecName)) {
            var error;
            try {
              if (typeof typeSpecs[typeSpecName] !== "function") {
                var err = Error(
                  (componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
                );
                err.name = "Invariant Violation";
                throw err;
              }
              error = typeSpecs[typeSpecName](values2, typeSpecName, componentName, location, null, ReactPropTypesSecret);
            } catch (ex) {
              error = ex;
            }
            if (error && !(error instanceof Error)) {
              printWarning(
                (componentName || "React class") + ": type specification of " + location + " `" + typeSpecName + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof error + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
              );
            }
            if (error instanceof Error && !(error.message in loggedTypeFailures)) {
              loggedTypeFailures[error.message] = true;
              var stack = getStack ? getStack() : "";
              printWarning(
                "Failed " + location + " type: " + error.message + (stack != null ? stack : "")
              );
            }
          }
        }
      }
    }
    checkPropTypes.resetWarningCache = function() {
      if (process.env.NODE_ENV !== "production") {
        loggedTypeFailures = {};
      }
    };
    module.exports = checkPropTypes;
  }
});

// ../../../node_modules/prop-types/factoryWithTypeCheckers.js
var require_factoryWithTypeCheckers = __commonJS({
  "../../../node_modules/prop-types/factoryWithTypeCheckers.js"(exports, module) {
    "use strict";
    var ReactIs = require_react_is();
    var assign = require_object_assign();
    var ReactPropTypesSecret = require_ReactPropTypesSecret();
    var has = require_has();
    var checkPropTypes = require_checkPropTypes();
    var printWarning = function() {
    };
    if (process.env.NODE_ENV !== "production") {
      printWarning = function(text) {
        var message = "Warning: " + text;
        if (typeof console !== "undefined") {
          console.error(message);
        }
        try {
          throw new Error(message);
        } catch (x) {
        }
      };
    }
    function emptyFunctionThatReturnsNull() {
      return null;
    }
    module.exports = function(isValidElement2, throwOnDirectAccess) {
      var ITERATOR_SYMBOL = typeof Symbol === "function" && Symbol.iterator;
      var FAUX_ITERATOR_SYMBOL = "@@iterator";
      function getIteratorFn(maybeIterable) {
        var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
        if (typeof iteratorFn === "function") {
          return iteratorFn;
        }
      }
      var ANONYMOUS = "<<anonymous>>";
      var ReactPropTypes = {
        array: createPrimitiveTypeChecker("array"),
        bigint: createPrimitiveTypeChecker("bigint"),
        bool: createPrimitiveTypeChecker("boolean"),
        func: createPrimitiveTypeChecker("function"),
        number: createPrimitiveTypeChecker("number"),
        object: createPrimitiveTypeChecker("object"),
        string: createPrimitiveTypeChecker("string"),
        symbol: createPrimitiveTypeChecker("symbol"),
        any: createAnyTypeChecker(),
        arrayOf: createArrayOfTypeChecker,
        element: createElementTypeChecker(),
        elementType: createElementTypeTypeChecker(),
        instanceOf: createInstanceTypeChecker,
        node: createNodeChecker(),
        objectOf: createObjectOfTypeChecker,
        oneOf: createEnumTypeChecker,
        oneOfType: createUnionTypeChecker,
        shape: createShapeTypeChecker,
        exact: createStrictShapeTypeChecker
      };
      function is(x, y) {
        if (x === y) {
          return x !== 0 || 1 / x === 1 / y;
        } else {
          return x !== x && y !== y;
        }
      }
      function PropTypeError(message, data) {
        this.message = message;
        this.data = data && typeof data === "object" ? data : {};
        this.stack = "";
      }
      PropTypeError.prototype = Error.prototype;
      function createChainableTypeChecker(validate) {
        if (process.env.NODE_ENV !== "production") {
          var manualPropTypeCallCache = {};
          var manualPropTypeWarningCount = 0;
        }
        function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
          componentName = componentName || ANONYMOUS;
          propFullName = propFullName || propName;
          if (secret !== ReactPropTypesSecret) {
            if (throwOnDirectAccess) {
              var err = new Error(
                "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
              );
              err.name = "Invariant Violation";
              throw err;
            } else if (process.env.NODE_ENV !== "production" && typeof console !== "undefined") {
              var cacheKey = componentName + ":" + propName;
              if (!manualPropTypeCallCache[cacheKey] && // Avoid spamming the console because they are often not actionable except for lib authors
              manualPropTypeWarningCount < 3) {
                printWarning(
                  "You are manually calling a React.PropTypes validation function for the `" + propFullName + "` prop on `" + componentName + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
                );
                manualPropTypeCallCache[cacheKey] = true;
                manualPropTypeWarningCount++;
              }
            }
          }
          if (props[propName] == null) {
            if (isRequired) {
              if (props[propName] === null) {
                return new PropTypeError("The " + location + " `" + propFullName + "` is marked as required " + ("in `" + componentName + "`, but its value is `null`."));
              }
              return new PropTypeError("The " + location + " `" + propFullName + "` is marked as required in " + ("`" + componentName + "`, but its value is `undefined`."));
            }
            return null;
          } else {
            return validate(props, propName, componentName, location, propFullName);
          }
        }
        var chainedCheckType = checkType.bind(null, false);
        chainedCheckType.isRequired = checkType.bind(null, true);
        return chainedCheckType;
      }
      function createPrimitiveTypeChecker(expectedType) {
        function validate(props, propName, componentName, location, propFullName, secret) {
          var propValue = props[propName];
          var propType = getPropType(propValue);
          if (propType !== expectedType) {
            var preciseType = getPreciseType(propValue);
            return new PropTypeError(
              "Invalid " + location + " `" + propFullName + "` of type " + ("`" + preciseType + "` supplied to `" + componentName + "`, expected ") + ("`" + expectedType + "`."),
              { expectedType }
            );
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }
      function createAnyTypeChecker() {
        return createChainableTypeChecker(emptyFunctionThatReturnsNull);
      }
      function createArrayOfTypeChecker(typeChecker) {
        function validate(props, propName, componentName, location, propFullName) {
          if (typeof typeChecker !== "function") {
            return new PropTypeError("Property `" + propFullName + "` of component `" + componentName + "` has invalid PropType notation inside arrayOf.");
          }
          var propValue = props[propName];
          if (!Array.isArray(propValue)) {
            var propType = getPropType(propValue);
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type " + ("`" + propType + "` supplied to `" + componentName + "`, expected an array."));
          }
          for (var i = 0; i < propValue.length; i++) {
            var error = typeChecker(propValue, i, componentName, location, propFullName + "[" + i + "]", ReactPropTypesSecret);
            if (error instanceof Error) {
              return error;
            }
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }
      function createElementTypeChecker() {
        function validate(props, propName, componentName, location, propFullName) {
          var propValue = props[propName];
          if (!isValidElement2(propValue)) {
            var propType = getPropType(propValue);
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type " + ("`" + propType + "` supplied to `" + componentName + "`, expected a single ReactElement."));
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }
      function createElementTypeTypeChecker() {
        function validate(props, propName, componentName, location, propFullName) {
          var propValue = props[propName];
          if (!ReactIs.isValidElementType(propValue)) {
            var propType = getPropType(propValue);
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type " + ("`" + propType + "` supplied to `" + componentName + "`, expected a single ReactElement type."));
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }
      function createInstanceTypeChecker(expectedClass) {
        function validate(props, propName, componentName, location, propFullName) {
          if (!(props[propName] instanceof expectedClass)) {
            var expectedClassName = expectedClass.name || ANONYMOUS;
            var actualClassName = getClassName(props[propName]);
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type " + ("`" + actualClassName + "` supplied to `" + componentName + "`, expected ") + ("instance of `" + expectedClassName + "`."));
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }
      function createEnumTypeChecker(expectedValues) {
        if (!Array.isArray(expectedValues)) {
          if (process.env.NODE_ENV !== "production") {
            if (arguments.length > 1) {
              printWarning(
                "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
              );
            } else {
              printWarning("Invalid argument supplied to oneOf, expected an array.");
            }
          }
          return emptyFunctionThatReturnsNull;
        }
        function validate(props, propName, componentName, location, propFullName) {
          var propValue = props[propName];
          for (var i = 0; i < expectedValues.length; i++) {
            if (is(propValue, expectedValues[i])) {
              return null;
            }
          }
          var valuesString = JSON.stringify(expectedValues, function replacer(key, value) {
            var type = getPreciseType(value);
            if (type === "symbol") {
              return String(value);
            }
            return value;
          });
          return new PropTypeError("Invalid " + location + " `" + propFullName + "` of value `" + String(propValue) + "` " + ("supplied to `" + componentName + "`, expected one of " + valuesString + "."));
        }
        return createChainableTypeChecker(validate);
      }
      function createObjectOfTypeChecker(typeChecker) {
        function validate(props, propName, componentName, location, propFullName) {
          if (typeof typeChecker !== "function") {
            return new PropTypeError("Property `" + propFullName + "` of component `" + componentName + "` has invalid PropType notation inside objectOf.");
          }
          var propValue = props[propName];
          var propType = getPropType(propValue);
          if (propType !== "object") {
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type " + ("`" + propType + "` supplied to `" + componentName + "`, expected an object."));
          }
          for (var key in propValue) {
            if (has(propValue, key)) {
              var error = typeChecker(propValue, key, componentName, location, propFullName + "." + key, ReactPropTypesSecret);
              if (error instanceof Error) {
                return error;
              }
            }
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }
      function createUnionTypeChecker(arrayOfTypeCheckers) {
        if (!Array.isArray(arrayOfTypeCheckers)) {
          process.env.NODE_ENV !== "production" ? printWarning("Invalid argument supplied to oneOfType, expected an instance of array.") : void 0;
          return emptyFunctionThatReturnsNull;
        }
        for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
          var checker = arrayOfTypeCheckers[i];
          if (typeof checker !== "function") {
            printWarning(
              "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + getPostfixForTypeWarning(checker) + " at index " + i + "."
            );
            return emptyFunctionThatReturnsNull;
          }
        }
        function validate(props, propName, componentName, location, propFullName) {
          var expectedTypes = [];
          for (var i2 = 0; i2 < arrayOfTypeCheckers.length; i2++) {
            var checker2 = arrayOfTypeCheckers[i2];
            var checkerResult = checker2(props, propName, componentName, location, propFullName, ReactPropTypesSecret);
            if (checkerResult == null) {
              return null;
            }
            if (checkerResult.data && has(checkerResult.data, "expectedType")) {
              expectedTypes.push(checkerResult.data.expectedType);
            }
          }
          var expectedTypesMessage = expectedTypes.length > 0 ? ", expected one of type [" + expectedTypes.join(", ") + "]" : "";
          return new PropTypeError("Invalid " + location + " `" + propFullName + "` supplied to " + ("`" + componentName + "`" + expectedTypesMessage + "."));
        }
        return createChainableTypeChecker(validate);
      }
      function createNodeChecker() {
        function validate(props, propName, componentName, location, propFullName) {
          if (!isNode(props[propName])) {
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` supplied to " + ("`" + componentName + "`, expected a ReactNode."));
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }
      function invalidValidatorError(componentName, location, propFullName, key, type) {
        return new PropTypeError(
          (componentName || "React class") + ": " + location + " type `" + propFullName + "." + key + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + type + "`."
        );
      }
      function createShapeTypeChecker(shapeTypes) {
        function validate(props, propName, componentName, location, propFullName) {
          var propValue = props[propName];
          var propType = getPropType(propValue);
          if (propType !== "object") {
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type `" + propType + "` " + ("supplied to `" + componentName + "`, expected `object`."));
          }
          for (var key in shapeTypes) {
            var checker = shapeTypes[key];
            if (typeof checker !== "function") {
              return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
            }
            var error = checker(propValue, key, componentName, location, propFullName + "." + key, ReactPropTypesSecret);
            if (error) {
              return error;
            }
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }
      function createStrictShapeTypeChecker(shapeTypes) {
        function validate(props, propName, componentName, location, propFullName) {
          var propValue = props[propName];
          var propType = getPropType(propValue);
          if (propType !== "object") {
            return new PropTypeError("Invalid " + location + " `" + propFullName + "` of type `" + propType + "` " + ("supplied to `" + componentName + "`, expected `object`."));
          }
          var allKeys = assign({}, props[propName], shapeTypes);
          for (var key in allKeys) {
            var checker = shapeTypes[key];
            if (has(shapeTypes, key) && typeof checker !== "function") {
              return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
            }
            if (!checker) {
              return new PropTypeError(
                "Invalid " + location + " `" + propFullName + "` key `" + key + "` supplied to `" + componentName + "`.\nBad object: " + JSON.stringify(props[propName], null, "  ") + "\nValid keys: " + JSON.stringify(Object.keys(shapeTypes), null, "  ")
              );
            }
            var error = checker(propValue, key, componentName, location, propFullName + "." + key, ReactPropTypesSecret);
            if (error) {
              return error;
            }
          }
          return null;
        }
        return createChainableTypeChecker(validate);
      }
      function isNode(propValue) {
        switch (typeof propValue) {
          case "number":
          case "string":
          case "undefined":
            return true;
          case "boolean":
            return !propValue;
          case "object":
            if (Array.isArray(propValue)) {
              return propValue.every(isNode);
            }
            if (propValue === null || isValidElement2(propValue)) {
              return true;
            }
            var iteratorFn = getIteratorFn(propValue);
            if (iteratorFn) {
              var iterator = iteratorFn.call(propValue);
              var step;
              if (iteratorFn !== propValue.entries) {
                while (!(step = iterator.next()).done) {
                  if (!isNode(step.value)) {
                    return false;
                  }
                }
              } else {
                while (!(step = iterator.next()).done) {
                  var entry = step.value;
                  if (entry) {
                    if (!isNode(entry[1])) {
                      return false;
                    }
                  }
                }
              }
            } else {
              return false;
            }
            return true;
          default:
            return false;
        }
      }
      function isSymbol(propType, propValue) {
        if (propType === "symbol") {
          return true;
        }
        if (!propValue) {
          return false;
        }
        if (propValue["@@toStringTag"] === "Symbol") {
          return true;
        }
        if (typeof Symbol === "function" && propValue instanceof Symbol) {
          return true;
        }
        return false;
      }
      function getPropType(propValue) {
        var propType = typeof propValue;
        if (Array.isArray(propValue)) {
          return "array";
        }
        if (propValue instanceof RegExp) {
          return "object";
        }
        if (isSymbol(propType, propValue)) {
          return "symbol";
        }
        return propType;
      }
      function getPreciseType(propValue) {
        if (typeof propValue === "undefined" || propValue === null) {
          return "" + propValue;
        }
        var propType = getPropType(propValue);
        if (propType === "object") {
          if (propValue instanceof Date) {
            return "date";
          } else if (propValue instanceof RegExp) {
            return "regexp";
          }
        }
        return propType;
      }
      function getPostfixForTypeWarning(value) {
        var type = getPreciseType(value);
        switch (type) {
          case "array":
          case "object":
            return "an " + type;
          case "boolean":
          case "date":
          case "regexp":
            return "a " + type;
          default:
            return type;
        }
      }
      function getClassName(propValue) {
        if (!propValue.constructor || !propValue.constructor.name) {
          return ANONYMOUS;
        }
        return propValue.constructor.name;
      }
      ReactPropTypes.checkPropTypes = checkPropTypes;
      ReactPropTypes.resetWarningCache = checkPropTypes.resetWarningCache;
      ReactPropTypes.PropTypes = ReactPropTypes;
      return ReactPropTypes;
    };
  }
});

// ../../../node_modules/prop-types/factoryWithThrowingShims.js
var require_factoryWithThrowingShims = __commonJS({
  "../../../node_modules/prop-types/factoryWithThrowingShims.js"(exports, module) {
    "use strict";
    var ReactPropTypesSecret = require_ReactPropTypesSecret();
    function emptyFunction() {
    }
    function emptyFunctionWithReset() {
    }
    emptyFunctionWithReset.resetWarningCache = emptyFunction;
    module.exports = function() {
      function shim(props, propName, componentName, location, propFullName, secret) {
        if (secret === ReactPropTypesSecret) {
          return;
        }
        var err = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        err.name = "Invariant Violation";
        throw err;
      }
      ;
      shim.isRequired = shim;
      function getShim() {
        return shim;
      }
      ;
      var ReactPropTypes = {
        array: shim,
        bigint: shim,
        bool: shim,
        func: shim,
        number: shim,
        object: shim,
        string: shim,
        symbol: shim,
        any: shim,
        arrayOf: getShim,
        element: shim,
        elementType: shim,
        instanceOf: getShim,
        node: shim,
        objectOf: getShim,
        oneOf: getShim,
        oneOfType: getShim,
        shape: getShim,
        exact: getShim,
        checkPropTypes: emptyFunctionWithReset,
        resetWarningCache: emptyFunction
      };
      ReactPropTypes.PropTypes = ReactPropTypes;
      return ReactPropTypes;
    };
  }
});

// ../../../node_modules/prop-types/index.js
var require_prop_types = __commonJS({
  "../../../node_modules/prop-types/index.js"(exports, module) {
    "use strict";
    if (process.env.NODE_ENV !== "production") {
      ReactIs = require_react_is();
      throwOnDirectAccess = true;
      module.exports = require_factoryWithTypeCheckers()(ReactIs.isElement, throwOnDirectAccess);
    } else {
      module.exports = require_factoryWithThrowingShims()();
    }
    var ReactIs;
    var throwOnDirectAccess;
  }
});

// ../../../node_modules/react-fast-compare/index.js
var require_react_fast_compare = __commonJS({
  "../../../node_modules/react-fast-compare/index.js"(exports, module) {
    "use strict";
    var hasElementType = typeof Element !== "undefined";
    var hasMap = typeof Map === "function";
    var hasSet = typeof Set === "function";
    var hasArrayBuffer = typeof ArrayBuffer === "function" && !!ArrayBuffer.isView;
    function equal(a, b) {
      if (a === b)
        return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor)
          return false;
        var length, i, keys2;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length)
            return false;
          for (i = length; i-- !== 0; )
            if (!equal(a[i], b[i]))
              return false;
          return true;
        }
        var it;
        if (hasMap && a instanceof Map && b instanceof Map) {
          if (a.size !== b.size)
            return false;
          it = a.entries();
          while (!(i = it.next()).done)
            if (!b.has(i.value[0]))
              return false;
          it = a.entries();
          while (!(i = it.next()).done)
            if (!equal(i.value[1], b.get(i.value[0])))
              return false;
          return true;
        }
        if (hasSet && a instanceof Set && b instanceof Set) {
          if (a.size !== b.size)
            return false;
          it = a.entries();
          while (!(i = it.next()).done)
            if (!b.has(i.value[0]))
              return false;
          return true;
        }
        if (hasArrayBuffer && ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
          length = a.length;
          if (length != b.length)
            return false;
          for (i = length; i-- !== 0; )
            if (a[i] !== b[i])
              return false;
          return true;
        }
        if (a.constructor === RegExp)
          return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf && typeof a.valueOf === "function" && typeof b.valueOf === "function")
          return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString && typeof a.toString === "function" && typeof b.toString === "function")
          return a.toString() === b.toString();
        keys2 = Object.keys(a);
        length = keys2.length;
        if (length !== Object.keys(b).length)
          return false;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys2[i]))
            return false;
        if (hasElementType && a instanceof Element)
          return false;
        for (i = length; i-- !== 0; ) {
          if ((keys2[i] === "_owner" || keys2[i] === "__v" || keys2[i] === "__o") && a.$$typeof) {
            continue;
          }
          if (!equal(a[keys2[i]], b[keys2[i]]))
            return false;
        }
        return true;
      }
      return a !== a && b !== b;
    }
    module.exports = function isEqual2(a, b) {
      try {
        return equal(a, b);
      } catch (error) {
        if ((error.message || "").match(/stack|recursion/i)) {
          console.warn("react-fast-compare cannot handle circular refs");
          return false;
        }
        throw error;
      }
    };
  }
});

// src/ui/index.tsx
import * as React20 from "react";
import { EditorContainer, EditorContentWrapper, getEditorClassNames, useEditor } from "@plane/editor-core";

// src/ui/menus/fixed-menu/index.tsx
import { BoldItem, BulletListItem, cn, CodeItem, ImageItem, ItalicItem, NumberedListItem, QuoteItem, StrikeThroughItem, TableItem, UnderLineItem } from "@plane/editor-core";

// src/ui/menus/fixed-menu/icon.tsx
import { jsx } from "react/jsx-runtime";
var Icon = ({ iconName, className = "" }) => /* @__PURE__ */ jsx("span", { className: `material-symbols-rounded text-sm leading-5 font-light ${className}`, children: iconName });

// src/ui/tooltip.tsx
import * as React19 from "react";
import { useTheme } from "next-themes";

// ../../../node_modules/@blueprintjs/core/lib/esm/common/classes.js
var classes_exports = {};
__export(classes_exports, {
  ACTIVE: () => ACTIVE,
  ALERT: () => ALERT,
  ALERT_BODY: () => ALERT_BODY,
  ALERT_CONTENTS: () => ALERT_CONTENTS,
  ALERT_FOOTER: () => ALERT_FOOTER,
  ALIGN_LEFT: () => ALIGN_LEFT,
  ALIGN_RIGHT: () => ALIGN_RIGHT,
  BLOCKQUOTE: () => BLOCKQUOTE,
  BREADCRUMB: () => BREADCRUMB,
  BREADCRUMBS: () => BREADCRUMBS,
  BREADCRUMBS_COLLAPSED: () => BREADCRUMBS_COLLAPSED,
  BREADCRUMB_CURRENT: () => BREADCRUMB_CURRENT,
  BUTTON: () => BUTTON,
  BUTTON_GROUP: () => BUTTON_GROUP,
  BUTTON_SPINNER: () => BUTTON_SPINNER,
  BUTTON_TEXT: () => BUTTON_TEXT,
  CALLOUT: () => CALLOUT,
  CALLOUT_ICON: () => CALLOUT_ICON,
  CARD: () => CARD,
  CHECKBOX: () => CHECKBOX,
  CODE: () => CODE,
  CODE_BLOCK: () => CODE_BLOCK,
  COLLAPSE: () => COLLAPSE,
  COLLAPSE_BODY: () => COLLAPSE_BODY,
  COLLAPSIBLE_LIST: () => COLLAPSIBLE_LIST,
  COMPACT: () => COMPACT,
  CONTEXT_MENU: () => CONTEXT_MENU,
  CONTEXT_MENU_POPOVER_TARGET: () => CONTEXT_MENU_POPOVER_TARGET,
  CONTROL: () => CONTROL,
  CONTROL_GROUP: () => CONTROL_GROUP,
  CONTROL_INDICATOR: () => CONTROL_INDICATOR,
  CONTROL_INDICATOR_CHILD: () => CONTROL_INDICATOR_CHILD,
  DARK: () => DARK,
  DIALOG: () => DIALOG,
  DIALOG_BODY: () => DIALOG_BODY,
  DIALOG_BODY_SCROLL_CONTAINER: () => DIALOG_BODY_SCROLL_CONTAINER,
  DIALOG_CLOSE_BUTTON: () => DIALOG_CLOSE_BUTTON,
  DIALOG_CONTAINER: () => DIALOG_CONTAINER,
  DIALOG_FOOTER: () => DIALOG_FOOTER,
  DIALOG_FOOTER_ACTIONS: () => DIALOG_FOOTER_ACTIONS,
  DIALOG_FOOTER_FIXED: () => DIALOG_FOOTER_FIXED,
  DIALOG_FOOTER_MAIN_SECTION: () => DIALOG_FOOTER_MAIN_SECTION,
  DIALOG_HEADER: () => DIALOG_HEADER,
  DIALOG_STEP: () => DIALOG_STEP,
  DIALOG_STEP_CONTAINER: () => DIALOG_STEP_CONTAINER,
  DIALOG_STEP_ICON: () => DIALOG_STEP_ICON,
  DIALOG_STEP_TITLE: () => DIALOG_STEP_TITLE,
  DIALOG_STEP_VIEWED: () => DIALOG_STEP_VIEWED,
  DISABLED: () => DISABLED,
  DIVIDER: () => DIVIDER,
  DRAWER: () => DRAWER,
  DRAWER_BODY: () => DRAWER_BODY,
  DRAWER_FOOTER: () => DRAWER_FOOTER,
  DRAWER_HEADER: () => DRAWER_HEADER,
  EDITABLE_TEXT: () => EDITABLE_TEXT,
  EDITABLE_TEXT_CONTENT: () => EDITABLE_TEXT_CONTENT,
  EDITABLE_TEXT_EDITING: () => EDITABLE_TEXT_EDITING,
  EDITABLE_TEXT_INPUT: () => EDITABLE_TEXT_INPUT,
  EDITABLE_TEXT_PLACEHOLDER: () => EDITABLE_TEXT_PLACEHOLDER,
  ELEVATION_0: () => ELEVATION_0,
  ELEVATION_1: () => ELEVATION_1,
  ELEVATION_2: () => ELEVATION_2,
  ELEVATION_3: () => ELEVATION_3,
  ELEVATION_4: () => ELEVATION_4,
  END: () => END,
  FILE_INPUT: () => FILE_INPUT,
  FILE_INPUT_HAS_SELECTION: () => FILE_INPUT_HAS_SELECTION,
  FILE_UPLOAD_INPUT: () => FILE_UPLOAD_INPUT,
  FILE_UPLOAD_INPUT_CUSTOM_TEXT: () => FILE_UPLOAD_INPUT_CUSTOM_TEXT,
  FILL: () => FILL,
  FIXED: () => FIXED,
  FIXED_TOP: () => FIXED_TOP,
  FLEX_EXPANDER: () => FLEX_EXPANDER,
  FOCUS_DISABLED: () => FOCUS_DISABLED,
  FOCUS_STYLE_MANAGER_IGNORE: () => FOCUS_STYLE_MANAGER_IGNORE,
  FORM_CONTENT: () => FORM_CONTENT,
  FORM_GROUP: () => FORM_GROUP,
  FORM_GROUP_SUB_LABEL: () => FORM_GROUP_SUB_LABEL,
  FORM_HELPER_TEXT: () => FORM_HELPER_TEXT,
  HEADING: () => HEADING,
  HOTKEY: () => HOTKEY,
  HOTKEY_COLUMN: () => HOTKEY_COLUMN,
  HOTKEY_DIALOG: () => HOTKEY_DIALOG,
  HOTKEY_LABEL: () => HOTKEY_LABEL,
  HTML_SELECT: () => HTML_SELECT,
  HTML_TABLE: () => HTML_TABLE,
  HTML_TABLE_BORDERED: () => HTML_TABLE_BORDERED,
  HTML_TABLE_CONDENSED: () => HTML_TABLE_CONDENSED,
  HTML_TABLE_STRIPED: () => HTML_TABLE_STRIPED,
  ICON: () => ICON,
  ICON_LARGE: () => ICON_LARGE,
  ICON_STANDARD: () => ICON_STANDARD,
  INLINE: () => INLINE,
  INPUT: () => INPUT,
  INPUT_ACTION: () => INPUT_ACTION,
  INPUT_GHOST: () => INPUT_GHOST,
  INPUT_GROUP: () => INPUT_GROUP,
  INPUT_LEFT_CONTAINER: () => INPUT_LEFT_CONTAINER,
  INTENT_DANGER: () => INTENT_DANGER,
  INTENT_PRIMARY: () => INTENT_PRIMARY,
  INTENT_SUCCESS: () => INTENT_SUCCESS,
  INTENT_WARNING: () => INTENT_WARNING,
  INTERACTIVE: () => INTERACTIVE,
  KEY: () => KEY,
  KEY_COMBO: () => KEY_COMBO,
  LABEL: () => LABEL,
  LARGE: () => LARGE,
  LIST: () => LIST,
  LIST_UNSTYLED: () => LIST_UNSTYLED,
  LOADING: () => LOADING,
  MENU: () => MENU,
  MENU_DIVIDER: () => MENU_DIVIDER,
  MENU_HEADER: () => MENU_HEADER,
  MENU_ITEM: () => MENU_ITEM,
  MENU_ITEM_ICON: () => MENU_ITEM_ICON,
  MENU_ITEM_LABEL: () => MENU_ITEM_LABEL,
  MENU_SUBMENU: () => MENU_SUBMENU,
  MENU_SUBMENU_ICON: () => MENU_SUBMENU_ICON,
  MINIMAL: () => MINIMAL,
  MODIFIER_KEY: () => MODIFIER_KEY,
  MONOSPACE_TEXT: () => MONOSPACE_TEXT,
  MULTILINE: () => MULTILINE,
  MULTISTEP_DIALOG: () => MULTISTEP_DIALOG,
  MULTISTEP_DIALOG_FOOTER: () => MULTISTEP_DIALOG_FOOTER,
  MULTISTEP_DIALOG_LEFT_PANEL: () => MULTISTEP_DIALOG_LEFT_PANEL,
  MULTISTEP_DIALOG_NAV_RIGHT: () => MULTISTEP_DIALOG_NAV_RIGHT,
  MULTISTEP_DIALOG_NAV_TOP: () => MULTISTEP_DIALOG_NAV_TOP,
  MULTISTEP_DIALOG_PANELS: () => MULTISTEP_DIALOG_PANELS,
  MULTISTEP_DIALOG_RIGHT_PANEL: () => MULTISTEP_DIALOG_RIGHT_PANEL,
  NAVBAR: () => NAVBAR,
  NAVBAR_DIVIDER: () => NAVBAR_DIVIDER,
  NAVBAR_GROUP: () => NAVBAR_GROUP,
  NAVBAR_HEADING: () => NAVBAR_HEADING,
  NON_IDEAL_STATE: () => NON_IDEAL_STATE,
  NON_IDEAL_STATE_TEXT: () => NON_IDEAL_STATE_TEXT,
  NON_IDEAL_STATE_VISUAL: () => NON_IDEAL_STATE_VISUAL,
  NUMERIC_INPUT: () => NUMERIC_INPUT,
  OUTLINED: () => OUTLINED,
  OVERFLOW_LIST: () => OVERFLOW_LIST,
  OVERFLOW_LIST_SPACER: () => OVERFLOW_LIST_SPACER,
  OVERLAY: () => OVERLAY,
  OVERLAY_BACKDROP: () => OVERLAY_BACKDROP,
  OVERLAY_CONTAINER: () => OVERLAY_CONTAINER,
  OVERLAY_CONTENT: () => OVERLAY_CONTENT,
  OVERLAY_END_FOCUS_TRAP: () => OVERLAY_END_FOCUS_TRAP,
  OVERLAY_INLINE: () => OVERLAY_INLINE,
  OVERLAY_OPEN: () => OVERLAY_OPEN,
  OVERLAY_SCROLL_CONTAINER: () => OVERLAY_SCROLL_CONTAINER,
  OVERLAY_START_FOCUS_TRAP: () => OVERLAY_START_FOCUS_TRAP,
  PANEL_STACK: () => PANEL_STACK,
  PANEL_STACK2: () => PANEL_STACK2,
  PANEL_STACK2_HEADER: () => PANEL_STACK2_HEADER,
  PANEL_STACK2_HEADER_BACK: () => PANEL_STACK2_HEADER_BACK,
  PANEL_STACK2_VIEW: () => PANEL_STACK2_VIEW,
  PANEL_STACK_HEADER: () => PANEL_STACK_HEADER,
  PANEL_STACK_HEADER_BACK: () => PANEL_STACK_HEADER_BACK,
  PANEL_STACK_VIEW: () => PANEL_STACK_VIEW,
  POPOVER: () => POPOVER,
  POPOVER_ARROW: () => POPOVER_ARROW,
  POPOVER_BACKDROP: () => POPOVER_BACKDROP,
  POPOVER_CAPTURING_DISMISS: () => POPOVER_CAPTURING_DISMISS,
  POPOVER_CONTENT: () => POPOVER_CONTENT,
  POPOVER_CONTENT_SIZING: () => POPOVER_CONTENT_SIZING,
  POPOVER_DISMISS: () => POPOVER_DISMISS,
  POPOVER_DISMISS_OVERRIDE: () => POPOVER_DISMISS_OVERRIDE,
  POPOVER_OPEN: () => POPOVER_OPEN,
  POPOVER_OUT_OF_BOUNDARIES: () => POPOVER_OUT_OF_BOUNDARIES,
  POPOVER_TARGET: () => POPOVER_TARGET,
  POPOVER_WRAPPER: () => POPOVER_WRAPPER,
  PORTAL: () => PORTAL,
  POSITION_BOTTOM: () => POSITION_BOTTOM,
  POSITION_LEFT: () => POSITION_LEFT,
  POSITION_RIGHT: () => POSITION_RIGHT,
  POSITION_TOP: () => POSITION_TOP,
  PROGRESS_BAR: () => PROGRESS_BAR,
  PROGRESS_METER: () => PROGRESS_METER,
  PROGRESS_NO_ANIMATION: () => PROGRESS_NO_ANIMATION,
  PROGRESS_NO_STRIPES: () => PROGRESS_NO_STRIPES,
  RADIO: () => RADIO,
  READ_ONLY: () => READ_ONLY,
  RESIZABLE_INPUT_SPAN: () => RESIZABLE_INPUT_SPAN,
  ROUND: () => ROUND,
  RTL: () => RTL,
  RUNNING_TEXT: () => RUNNING_TEXT,
  SELECT: () => SELECT,
  SELECTED: () => SELECTED,
  SKELETON: () => SKELETON,
  SLIDER: () => SLIDER,
  SLIDER_AXIS: () => SLIDER_AXIS,
  SLIDER_HANDLE: () => SLIDER_HANDLE,
  SLIDER_LABEL: () => SLIDER_LABEL,
  SLIDER_PROGRESS: () => SLIDER_PROGRESS,
  SLIDER_TRACK: () => SLIDER_TRACK,
  SMALL: () => SMALL,
  SPINNER: () => SPINNER,
  SPINNER_ANIMATION: () => SPINNER_ANIMATION,
  SPINNER_HEAD: () => SPINNER_HEAD,
  SPINNER_NO_SPIN: () => SPINNER_NO_SPIN,
  SPINNER_TRACK: () => SPINNER_TRACK,
  START: () => START,
  SWITCH: () => SWITCH,
  SWITCH_INNER_TEXT: () => SWITCH_INNER_TEXT,
  TAB: () => TAB,
  TABS: () => TABS,
  TAB_ICON: () => TAB_ICON,
  TAB_INDICATOR: () => TAB_INDICATOR,
  TAB_INDICATOR_WRAPPER: () => TAB_INDICATOR_WRAPPER,
  TAB_LIST: () => TAB_LIST,
  TAB_PANEL: () => TAB_PANEL,
  TAB_TAG: () => TAB_TAG,
  TAG: () => TAG,
  TAG_INPUT: () => TAG_INPUT,
  TAG_INPUT_ICON: () => TAG_INPUT_ICON,
  TAG_INPUT_VALUES: () => TAG_INPUT_VALUES,
  TAG_REMOVE: () => TAG_REMOVE,
  TEXT_DISABLED: () => TEXT_DISABLED,
  TEXT_LARGE: () => TEXT_LARGE,
  TEXT_MUTED: () => TEXT_MUTED,
  TEXT_OVERFLOW_ELLIPSIS: () => TEXT_OVERFLOW_ELLIPSIS,
  TEXT_SMALL: () => TEXT_SMALL,
  TOAST: () => TOAST,
  TOAST_CONTAINER: () => TOAST_CONTAINER,
  TOAST_MESSAGE: () => TOAST_MESSAGE,
  TOOLTIP: () => TOOLTIP,
  TOOLTIP_INDICATOR: () => TOOLTIP_INDICATOR,
  TRANSITION_CONTAINER: () => TRANSITION_CONTAINER,
  TREE: () => TREE,
  TREE_NODE: () => TREE_NODE,
  TREE_NODE_CARET: () => TREE_NODE_CARET,
  TREE_NODE_CARET_CLOSED: () => TREE_NODE_CARET_CLOSED,
  TREE_NODE_CARET_NONE: () => TREE_NODE_CARET_NONE,
  TREE_NODE_CARET_OPEN: () => TREE_NODE_CARET_OPEN,
  TREE_NODE_CONTENT: () => TREE_NODE_CONTENT,
  TREE_NODE_EXPANDED: () => TREE_NODE_EXPANDED,
  TREE_NODE_ICON: () => TREE_NODE_ICON,
  TREE_NODE_LABEL: () => TREE_NODE_LABEL,
  TREE_NODE_LIST: () => TREE_NODE_LIST,
  TREE_NODE_SECONDARY_LABEL: () => TREE_NODE_SECONDARY_LABEL,
  TREE_NODE_SELECTED: () => TREE_NODE_SELECTED,
  TREE_ROOT: () => TREE_ROOT,
  UI_TEXT: () => UI_TEXT,
  VERTICAL: () => VERTICAL,
  alignmentClass: () => alignmentClass,
  elevationClass: () => elevationClass,
  getClassNamespace: () => getClassNamespace,
  iconClass: () => iconClass,
  intentClass: () => intentClass,
  positionClass: () => positionClass
});

// ../../../node_modules/@blueprintjs/core/lib/esm/common/alignment.js
var Alignment = {
  CENTER: "center",
  LEFT: "left",
  RIGHT: "right"
};

// ../../../node_modules/@blueprintjs/core/lib/esm/common/elevation.js
var Elevation = {
  ZERO: 0,
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4
};

// ../../../node_modules/@blueprintjs/core/lib/esm/common/intent.js
var Intent = {
  NONE: "none",
  PRIMARY: "primary",
  SUCCESS: "success",
  WARNING: "warning",
  DANGER: "danger"
};

// ../../../node_modules/@blueprintjs/core/lib/esm/common/position.js
var Position = {
  BOTTOM: "bottom",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_RIGHT: "bottom-right",
  LEFT: "left",
  LEFT_BOTTOM: "left-bottom",
  LEFT_TOP: "left-top",
  RIGHT: "right",
  RIGHT_BOTTOM: "right-bottom",
  RIGHT_TOP: "right-top",
  TOP: "top",
  TOP_LEFT: "top-left",
  TOP_RIGHT: "top-right"
};

// ../../../node_modules/@blueprintjs/core/lib/esm/common/classes.js
var _a;
var _b;
var _c;
var _d;
var NS = "bp4";
if (typeof process !== "undefined") {
  NS = (_d = (_b = (_a = process.env) === null || _a === void 0 ? void 0 : _a.BLUEPRINT_NAMESPACE) !== null && _b !== void 0 ? _b : (_c = process.env) === null || _c === void 0 ? void 0 : _c.REACT_APP_BLUEPRINT_NAMESPACE) !== null && _d !== void 0 ? _d : NS;
}
var ACTIVE = "".concat(NS, "-active");
var ALIGN_LEFT = "".concat(NS, "-align-left");
var ALIGN_RIGHT = "".concat(NS, "-align-right");
var COMPACT = "".concat(NS, "-compact");
var DARK = "".concat(NS, "-dark");
var DISABLED = "".concat(NS, "-disabled");
var FILL = "".concat(NS, "-fill");
var FIXED = "".concat(NS, "-fixed");
var FIXED_TOP = "".concat(NS, "-fixed-top");
var INLINE = "".concat(NS, "-inline");
var INTERACTIVE = "".concat(NS, "-interactive");
var LARGE = "".concat(NS, "-large");
var LOADING = "".concat(NS, "-loading");
var MINIMAL = "".concat(NS, "-minimal");
var OUTLINED = "".concat(NS, "-outlined");
var MULTILINE = "".concat(NS, "-multiline");
var READ_ONLY = "".concat(NS, "-read-only");
var ROUND = "".concat(NS, "-round");
var SELECTED = "".concat(NS, "-selected");
var SMALL = "".concat(NS, "-small");
var VERTICAL = "".concat(NS, "-vertical");
var POSITION_TOP = positionClass(Position.TOP);
var POSITION_BOTTOM = positionClass(Position.BOTTOM);
var POSITION_LEFT = positionClass(Position.LEFT);
var POSITION_RIGHT = positionClass(Position.RIGHT);
var ELEVATION_0 = elevationClass(Elevation.ZERO);
var ELEVATION_1 = elevationClass(Elevation.ONE);
var ELEVATION_2 = elevationClass(Elevation.TWO);
var ELEVATION_3 = elevationClass(Elevation.THREE);
var ELEVATION_4 = elevationClass(Elevation.FOUR);
var INTENT_PRIMARY = intentClass(Intent.PRIMARY);
var INTENT_SUCCESS = intentClass(Intent.SUCCESS);
var INTENT_WARNING = intentClass(Intent.WARNING);
var INTENT_DANGER = intentClass(Intent.DANGER);
var FOCUS_DISABLED = "".concat(NS, "-focus-disabled");
var FOCUS_STYLE_MANAGER_IGNORE = "".concat(NS, "-focus-style-manager-ignore");
var UI_TEXT = "".concat(NS, "-ui-text");
var RUNNING_TEXT = "".concat(NS, "-running-text");
var MONOSPACE_TEXT = "".concat(NS, "-monospace-text");
var TEXT_LARGE = "".concat(NS, "-text-large");
var TEXT_SMALL = "".concat(NS, "-text-small");
var TEXT_MUTED = "".concat(NS, "-text-muted");
var TEXT_DISABLED = "".concat(NS, "-text-disabled");
var TEXT_OVERFLOW_ELLIPSIS = "".concat(NS, "-text-overflow-ellipsis");
var BLOCKQUOTE = "".concat(NS, "-blockquote");
var CODE = "".concat(NS, "-code");
var CODE_BLOCK = "".concat(NS, "-code-block");
var HEADING = "".concat(NS, "-heading");
var LIST = "".concat(NS, "-list");
var LIST_UNSTYLED = "".concat(NS, "-list-unstyled");
var RTL = "".concat(NS, "-rtl");
var ALERT = "".concat(NS, "-alert");
var ALERT_BODY = "".concat(ALERT, "-body");
var ALERT_CONTENTS = "".concat(ALERT, "-contents");
var ALERT_FOOTER = "".concat(ALERT, "-footer");
var BREADCRUMB = "".concat(NS, "-breadcrumb");
var BREADCRUMB_CURRENT = "".concat(BREADCRUMB, "-current");
var BREADCRUMBS = "".concat(BREADCRUMB, "s");
var BREADCRUMBS_COLLAPSED = "".concat(BREADCRUMB, "s-collapsed");
var BUTTON = "".concat(NS, "-button");
var BUTTON_GROUP = "".concat(BUTTON, "-group");
var BUTTON_SPINNER = "".concat(BUTTON, "-spinner");
var BUTTON_TEXT = "".concat(BUTTON, "-text");
var CALLOUT = "".concat(NS, "-callout");
var CALLOUT_ICON = "".concat(CALLOUT, "-icon");
var CARD = "".concat(NS, "-card");
var COLLAPSE = "".concat(NS, "-collapse");
var COLLAPSE_BODY = "".concat(COLLAPSE, "-body");
var COLLAPSIBLE_LIST = "".concat(NS, "-collapse-list");
var CONTEXT_MENU = "".concat(NS, "-context-menu");
var CONTEXT_MENU_POPOVER_TARGET = "".concat(CONTEXT_MENU, "-popover-target");
var CONTROL_GROUP = "".concat(NS, "-control-group");
var DIALOG = "".concat(NS, "-dialog");
var DIALOG_CONTAINER = "".concat(DIALOG, "-container");
var DIALOG_HEADER = "".concat(DIALOG, "-header");
var DIALOG_BODY = "".concat(DIALOG, "-body");
var DIALOG_BODY_SCROLL_CONTAINER = "".concat(DIALOG, "-body-scroll-container");
var DIALOG_CLOSE_BUTTON = "".concat(DIALOG, "-close-button");
var DIALOG_FOOTER = "".concat(DIALOG, "-footer");
var DIALOG_FOOTER_FIXED = "".concat(DIALOG, "-footer-fixed");
var DIALOG_FOOTER_MAIN_SECTION = "".concat(DIALOG, "-footer-main-section");
var DIALOG_FOOTER_ACTIONS = "".concat(DIALOG, "-footer-actions");
var DIALOG_STEP = "".concat(NS, "-dialog-step");
var DIALOG_STEP_CONTAINER = "".concat(DIALOG_STEP, "-container");
var DIALOG_STEP_TITLE = "".concat(DIALOG_STEP, "-title");
var DIALOG_STEP_ICON = "".concat(DIALOG_STEP, "-icon");
var DIALOG_STEP_VIEWED = "".concat(DIALOG_STEP, "-viewed");
var DIVIDER = "".concat(NS, "-divider");
var DRAWER = "".concat(NS, "-drawer");
var DRAWER_BODY = "".concat(DRAWER, "-body");
var DRAWER_FOOTER = "".concat(DRAWER, "-footer");
var DRAWER_HEADER = "".concat(DRAWER, "-header");
var EDITABLE_TEXT = "".concat(NS, "-editable-text");
var EDITABLE_TEXT_CONTENT = "".concat(EDITABLE_TEXT, "-content");
var EDITABLE_TEXT_EDITING = "".concat(EDITABLE_TEXT, "-editing");
var EDITABLE_TEXT_INPUT = "".concat(EDITABLE_TEXT, "-input");
var EDITABLE_TEXT_PLACEHOLDER = "".concat(EDITABLE_TEXT, "-placeholder");
var FLEX_EXPANDER = "".concat(NS, "-flex-expander");
var HTML_SELECT = "".concat(NS, "-html-select");
var SELECT = "".concat(NS, "-select");
var HTML_TABLE = "".concat(NS, "-html-table");
var HTML_TABLE_BORDERED = "".concat(HTML_TABLE, "-bordered");
var HTML_TABLE_CONDENSED = "".concat(HTML_TABLE, "-condensed");
var HTML_TABLE_STRIPED = "".concat(HTML_TABLE, "-striped");
var INPUT = "".concat(NS, "-input");
var INPUT_GHOST = "".concat(INPUT, "-ghost");
var INPUT_GROUP = "".concat(INPUT, "-group");
var INPUT_LEFT_CONTAINER = "".concat(INPUT, "-left-container");
var INPUT_ACTION = "".concat(INPUT, "-action");
var RESIZABLE_INPUT_SPAN = "".concat(NS, "-resizable-input-span");
var CONTROL = "".concat(NS, "-control");
var CONTROL_INDICATOR = "".concat(CONTROL, "-indicator");
var CONTROL_INDICATOR_CHILD = "".concat(CONTROL_INDICATOR, "-child");
var CHECKBOX = "".concat(NS, "-checkbox");
var RADIO = "".concat(NS, "-radio");
var SWITCH = "".concat(NS, "-switch");
var SWITCH_INNER_TEXT = "".concat(SWITCH, "-inner-text");
var FILE_INPUT = "".concat(NS, "-file-input");
var FILE_INPUT_HAS_SELECTION = "".concat(NS, "-file-input-has-selection");
var FILE_UPLOAD_INPUT = "".concat(NS, "-file-upload-input");
var FILE_UPLOAD_INPUT_CUSTOM_TEXT = "".concat(NS, "-file-upload-input-custom-text");
var KEY = "".concat(NS, "-key");
var KEY_COMBO = "".concat(KEY, "-combo");
var MODIFIER_KEY = "".concat(NS, "-modifier-key");
var HOTKEY = "".concat(NS, "-hotkey");
var HOTKEY_LABEL = "".concat(HOTKEY, "-label");
var HOTKEY_COLUMN = "".concat(HOTKEY, "-column");
var HOTKEY_DIALOG = "".concat(HOTKEY, "-dialog");
var LABEL = "".concat(NS, "-label");
var FORM_GROUP = "".concat(NS, "-form-group");
var FORM_CONTENT = "".concat(NS, "-form-content");
var FORM_HELPER_TEXT = "".concat(NS, "-form-helper-text");
var FORM_GROUP_SUB_LABEL = "".concat(NS, "-form-group-sub-label");
var MENU = "".concat(NS, "-menu");
var MENU_ITEM = "".concat(MENU, "-item");
var MENU_ITEM_ICON = "".concat(MENU_ITEM, "-icon");
var MENU_ITEM_LABEL = "".concat(MENU_ITEM, "-label");
var MENU_SUBMENU = "".concat(NS, "-submenu");
var MENU_SUBMENU_ICON = "".concat(MENU_SUBMENU, "-icon");
var MENU_DIVIDER = "".concat(MENU, "-divider");
var MENU_HEADER = "".concat(MENU, "-header");
var MULTISTEP_DIALOG = "".concat(NS, "-multistep-dialog");
var MULTISTEP_DIALOG_PANELS = "".concat(MULTISTEP_DIALOG, "-panels");
var MULTISTEP_DIALOG_LEFT_PANEL = "".concat(MULTISTEP_DIALOG, "-left-panel");
var MULTISTEP_DIALOG_RIGHT_PANEL = "".concat(MULTISTEP_DIALOG, "-right-panel");
var MULTISTEP_DIALOG_FOOTER = "".concat(MULTISTEP_DIALOG, "-footer");
var MULTISTEP_DIALOG_NAV_TOP = "".concat(MULTISTEP_DIALOG, "-nav-top");
var MULTISTEP_DIALOG_NAV_RIGHT = "".concat(MULTISTEP_DIALOG, "-nav-right");
var NAVBAR = "".concat(NS, "-navbar");
var NAVBAR_GROUP = "".concat(NAVBAR, "-group");
var NAVBAR_HEADING = "".concat(NAVBAR, "-heading");
var NAVBAR_DIVIDER = "".concat(NAVBAR, "-divider");
var NON_IDEAL_STATE = "".concat(NS, "-non-ideal-state");
var NON_IDEAL_STATE_VISUAL = "".concat(NON_IDEAL_STATE, "-visual");
var NON_IDEAL_STATE_TEXT = "".concat(NON_IDEAL_STATE, "-text");
var NUMERIC_INPUT = "".concat(NS, "-numeric-input");
var OVERFLOW_LIST = "".concat(NS, "-overflow-list");
var OVERFLOW_LIST_SPACER = "".concat(OVERFLOW_LIST, "-spacer");
var OVERLAY = "".concat(NS, "-overlay");
var OVERLAY_BACKDROP = "".concat(OVERLAY, "-backdrop");
var OVERLAY_CONTAINER = "".concat(OVERLAY, "-container");
var OVERLAY_CONTENT = "".concat(OVERLAY, "-content");
var OVERLAY_INLINE = "".concat(OVERLAY, "-inline");
var OVERLAY_OPEN = "".concat(OVERLAY, "-open");
var OVERLAY_SCROLL_CONTAINER = "".concat(OVERLAY, "-scroll-container");
var OVERLAY_START_FOCUS_TRAP = "".concat(OVERLAY, "-start-focus-trap");
var OVERLAY_END_FOCUS_TRAP = "".concat(OVERLAY, "-end-focus-trap");
var PANEL_STACK = "".concat(NS, "-panel-stack");
var PANEL_STACK_HEADER = "".concat(PANEL_STACK, "-header");
var PANEL_STACK_HEADER_BACK = "".concat(PANEL_STACK, "-header-back");
var PANEL_STACK_VIEW = "".concat(PANEL_STACK, "-view");
var PANEL_STACK2 = "".concat(NS, "-panel-stack2");
var PANEL_STACK2_HEADER = "".concat(PANEL_STACK, "-header");
var PANEL_STACK2_HEADER_BACK = "".concat(PANEL_STACK, "-header-back");
var PANEL_STACK2_VIEW = "".concat(PANEL_STACK, "-view");
var POPOVER = "".concat(NS, "-popover");
var POPOVER_ARROW = "".concat(POPOVER, "-arrow");
var POPOVER_BACKDROP = "".concat(POPOVER, "-backdrop");
var POPOVER_CAPTURING_DISMISS = "".concat(POPOVER, "-capturing-dismiss");
var POPOVER_CONTENT = "".concat(POPOVER, "-content");
var POPOVER_CONTENT_SIZING = "".concat(POPOVER_CONTENT, "-sizing");
var POPOVER_DISMISS = "".concat(POPOVER, "-dismiss");
var POPOVER_DISMISS_OVERRIDE = "".concat(POPOVER_DISMISS, "-override");
var POPOVER_OPEN = "".concat(POPOVER, "-open");
var POPOVER_OUT_OF_BOUNDARIES = "".concat(POPOVER, "-out-of-boundaries");
var POPOVER_TARGET = "".concat(POPOVER, "-target");
var POPOVER_WRAPPER = "".concat(POPOVER, "-wrapper");
var TRANSITION_CONTAINER = "".concat(NS, "-transition-container");
var PROGRESS_BAR = "".concat(NS, "-progress-bar");
var PROGRESS_METER = "".concat(NS, "-progress-meter");
var PROGRESS_NO_STRIPES = "".concat(NS, "-no-stripes");
var PROGRESS_NO_ANIMATION = "".concat(NS, "-no-animation");
var PORTAL = "".concat(NS, "-portal");
var SKELETON = "".concat(NS, "-skeleton");
var SLIDER = "".concat(NS, "-slider");
var SLIDER_AXIS = "".concat(SLIDER, "-axis");
var SLIDER_HANDLE = "".concat(SLIDER, "-handle");
var SLIDER_LABEL = "".concat(SLIDER, "-label");
var SLIDER_TRACK = "".concat(SLIDER, "-track");
var SLIDER_PROGRESS = "".concat(SLIDER, "-progress");
var START = "".concat(NS, "-start");
var END = "".concat(NS, "-end");
var SPINNER = "".concat(NS, "-spinner");
var SPINNER_ANIMATION = "".concat(SPINNER, "-animation");
var SPINNER_HEAD = "".concat(SPINNER, "-head");
var SPINNER_NO_SPIN = "".concat(NS, "-no-spin");
var SPINNER_TRACK = "".concat(SPINNER, "-track");
var TAB = "".concat(NS, "-tab");
var TAB_ICON = "".concat(TAB, "-icon");
var TAB_TAG = "".concat(TAB, "-tag");
var TAB_INDICATOR = "".concat(TAB, "-indicator");
var TAB_INDICATOR_WRAPPER = "".concat(TAB_INDICATOR, "-wrapper");
var TAB_LIST = "".concat(TAB, "-list");
var TAB_PANEL = "".concat(TAB, "-panel");
var TABS = "".concat(TAB, "s");
var TAG = "".concat(NS, "-tag");
var TAG_REMOVE = "".concat(TAG, "-remove");
var TAG_INPUT = "".concat(NS, "-tag-input");
var TAG_INPUT_ICON = "".concat(TAG_INPUT, "-icon");
var TAG_INPUT_VALUES = "".concat(TAG_INPUT, "-values");
var TOAST = "".concat(NS, "-toast");
var TOAST_CONTAINER = "".concat(TOAST, "-container");
var TOAST_MESSAGE = "".concat(TOAST, "-message");
var TOOLTIP = "".concat(NS, "-tooltip");
var TOOLTIP_INDICATOR = "".concat(TOOLTIP, "-indicator");
var TREE = "".concat(NS, "-tree");
var TREE_NODE = "".concat(NS, "-tree-node");
var TREE_NODE_CARET = "".concat(TREE_NODE, "-caret");
var TREE_NODE_CARET_CLOSED = "".concat(TREE_NODE_CARET, "-closed");
var TREE_NODE_CARET_NONE = "".concat(TREE_NODE_CARET, "-none");
var TREE_NODE_CARET_OPEN = "".concat(TREE_NODE_CARET, "-open");
var TREE_NODE_CONTENT = "".concat(TREE_NODE, "-content");
var TREE_NODE_EXPANDED = "".concat(TREE_NODE, "-expanded");
var TREE_NODE_ICON = "".concat(TREE_NODE, "-icon");
var TREE_NODE_LABEL = "".concat(TREE_NODE, "-label");
var TREE_NODE_LIST = "".concat(TREE_NODE, "-list");
var TREE_NODE_SECONDARY_LABEL = "".concat(TREE_NODE, "-secondary-label");
var TREE_NODE_SELECTED = "".concat(TREE_NODE, "-selected");
var TREE_ROOT = "".concat(NS, "-tree-root");
var ICON = "".concat(NS, "-icon");
var ICON_STANDARD = "".concat(ICON, "-standard");
var ICON_LARGE = "".concat(ICON, "-large");
function getClassNamespace() {
  return NS;
}
function alignmentClass(alignment) {
  switch (alignment) {
    case Alignment.LEFT:
      return ALIGN_LEFT;
    case Alignment.RIGHT:
      return ALIGN_RIGHT;
    default:
      return void 0;
  }
}
function elevationClass(elevation) {
  if (elevation === void 0) {
    return void 0;
  }
  return "".concat(NS, "-elevation-").concat(elevation);
}
function iconClass(iconName) {
  if (iconName == null) {
    return void 0;
  }
  return iconName.indexOf("".concat(NS, "-icon-")) === 0 ? iconName : "".concat(NS, "-icon-").concat(iconName);
}
function intentClass(intent) {
  if (intent == null || intent === Intent.NONE) {
    return void 0;
  }
  return "".concat(NS, "-intent-").concat(intent.toLowerCase());
}
function positionClass(position) {
  if (position === void 0) {
    return void 0;
  }
  return "".concat(NS, "-position-").concat(position);
}

// ../../../node_modules/@blueprintjs/core/node_modules/tslib/tslib.es6.mjs
var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2)
      if (Object.prototype.hasOwnProperty.call(b2, p))
        d2[p] = b2[p];
  };
  return extendStatics(d, b);
};
function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
    throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign = function() {
  __assign = Object.assign || function __assign4(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};

// ../../../node_modules/@blueprintjs/core/lib/esm/common/utils/index.js
var utils_exports = {};
__export(utils_exports, {
  approxEqual: () => approxEqual,
  arrayLengthCompare: () => arrayLengthCompare,
  arraysEqual: () => arraysEqual,
  clamp: () => clamp,
  clickElementOnKeyPress: () => clickElementOnKeyPress,
  countDecimalPlaces: () => countDecimalPlaces,
  deepCompareKeys: () => deepCompareKeys,
  elementIsOrContains: () => elementIsOrContains,
  elementIsTextInput: () => elementIsTextInput,
  ensureElement: () => ensureElement,
  getActiveElement: () => getActiveElement,
  getDeepUnequalKeyValues: () => getDeepUnequalKeyValues,
  getDisplayName: () => getDisplayName,
  getRef: () => getRef,
  isDarkTheme: () => isDarkTheme,
  isElementOfType: () => isElementOfType,
  isFunction: () => isFunction,
  isNodeEnv: () => isNodeEnv,
  isReactChildrenElementOrElements: () => isReactChildrenElementOrElements,
  isReactNodeEmpty: () => isReactNodeEmpty,
  setRef: () => setRef,
  shallowCompareKeys: () => shallowCompareKeys,
  throttle: () => throttle,
  throttleEvent: () => throttleEvent,
  throttleReactEventCallback: () => throttleReactEventCallback,
  uniqueId: () => uniqueId
});

// ../../../node_modules/@blueprintjs/core/lib/esm/common/utils/compareUtils.js
function arraysEqual(arrA, arrB, compare) {
  if (compare === void 0) {
    compare = function(a, b) {
      return a === b;
    };
  }
  if (arrA == null && arrB == null) {
    return true;
  } else if (arrA == null || arrB == null || arrA.length !== arrB.length) {
    return false;
  } else {
    return arrA.every(function(a, i) {
      return compare(a, arrB[i]);
    });
  }
}
function shallowCompareKeys(objA, objB, keys2) {
  if (objA == null && objB == null) {
    return true;
  } else if (objA == null || objB == null) {
    return false;
  } else if (Array.isArray(objA) || Array.isArray(objB)) {
    return false;
  } else if (keys2 != null) {
    return shallowCompareKeysImpl(objA, objB, keys2);
  } else {
    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);
    return shallowCompareKeysImpl(objA, objB, { include: keysA }) && shallowCompareKeysImpl(objA, objB, { include: keysB });
  }
}
function deepCompareKeys(objA, objB, keys2) {
  if (objA === objB) {
    return true;
  } else if (objA == null && objB == null) {
    return true;
  } else if (objA == null || objB == null) {
    return false;
  } else if (Array.isArray(objA) || Array.isArray(objB)) {
    return arraysEqual(objA, objB, deepCompareKeys);
  } else if (isSimplePrimitiveType(objA) || isSimplePrimitiveType(objB)) {
    return objA === objB;
  } else if (keys2 != null) {
    return deepCompareKeysImpl(objA, objB, keys2);
  } else if (objA.constructor !== objB.constructor) {
    return false;
  } else {
    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);
    if (keysA == null || keysB == null) {
      return false;
    }
    if (keysA.length === 0 && keysB.length === 0) {
      return true;
    }
    return arraysEqual(keysA, keysB) && deepCompareKeysImpl(objA, objB, keysA);
  }
}
function getDeepUnequalKeyValues(objA, objB, keys2) {
  if (objA === void 0) {
    objA = {};
  }
  if (objB === void 0) {
    objB = {};
  }
  var filteredKeys = keys2 == null ? unionKeys(objA, objB) : keys2;
  return getUnequalKeyValues(objA, objB, filteredKeys, function(a, b, key) {
    return deepCompareKeys(a, b, [key]);
  });
}
function shallowCompareKeysImpl(objA, objB, keys2) {
  return filterKeys(objA, objB, keys2).every(function(key) {
    return objA.hasOwnProperty(key) === objB.hasOwnProperty(key) && objA[key] === objB[key];
  });
}
function deepCompareKeysImpl(objA, objB, keys2) {
  return keys2.every(function(key) {
    return objA.hasOwnProperty(key) === objB.hasOwnProperty(key) && deepCompareKeys(objA[key], objB[key]);
  });
}
function isSimplePrimitiveType(value) {
  return typeof value === "number" || typeof value === "string" || typeof value === "boolean";
}
function filterKeys(objA, objB, keys2) {
  if (isAllowlist(keys2)) {
    return keys2.include;
  } else if (isDenylist(keys2)) {
    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);
    var keySet_1 = arrayToObject(keysA.concat(keysB));
    keys2.exclude.forEach(function(key) {
      return delete keySet_1[key];
    });
    return Object.keys(keySet_1);
  }
  return [];
}
function isAllowlist(keys2) {
  return keys2 != null && keys2.include != null;
}
function isDenylist(keys2) {
  return keys2 != null && keys2.exclude != null;
}
function arrayToObject(arr) {
  return arr.reduce(function(obj, element) {
    obj[element] = true;
    return obj;
  }, {});
}
function getUnequalKeyValues(objA, objB, keys2, compareFn) {
  var unequalKeys = keys2.filter(function(key) {
    return !compareFn(objA, objB, key);
  });
  var unequalKeyValues = unequalKeys.map(function(key) {
    return {
      key,
      valueA: objA[key],
      valueB: objB[key]
    };
  });
  return unequalKeyValues;
}
function unionKeys(objA, objB) {
  var keysA = Object.keys(objA);
  var keysB = Object.keys(objB);
  var concatKeys = keysA.concat(keysB);
  var keySet = arrayToObject(concatKeys);
  return Object.keys(keySet);
}

// ../../../node_modules/@blueprintjs/core/lib/esm/common/utils/domUtils.js
function elementIsOrContains(element, testElement) {
  return element === testElement || element.contains(testElement);
}
function elementIsTextInput(elem) {
  if (elem == null || elem.closest == null) {
    return false;
  }
  var editable = elem.closest("input, textarea, [contenteditable=true]");
  if (editable == null) {
    return false;
  }
  if (editable.tagName.toLowerCase() === "input") {
    var inputType = editable.type;
    if (inputType === "checkbox" || inputType === "radio") {
      return false;
    }
  }
  if (editable.readOnly) {
    return false;
  }
  return true;
}
function getActiveElement(element, options) {
  var _a2;
  if (element == null) {
    return document.activeElement;
  }
  var rootNode = (_a2 = element.getRootNode(options)) !== null && _a2 !== void 0 ? _a2 : document;
  return rootNode.activeElement;
}
function throttleEvent(target, eventName, newEventName) {
  var throttledFunc = throttleImpl(function(event) {
    target.dispatchEvent(new CustomEvent(newEventName, event));
  });
  target.addEventListener(eventName, throttledFunc);
  return throttledFunc;
}
function throttleReactEventCallback(callback, options) {
  if (options === void 0) {
    options = {};
  }
  var throttledFunc = throttleImpl(
    callback,
    function(event2) {
      if (options.preventDefault) {
        event2.preventDefault();
      }
    },
    // prevent React from reclaiming the event object before we reference it
    function(event2) {
      return event2.persist();
    }
  );
  return throttledFunc;
}
function throttle(method) {
  return throttleImpl(method);
}
function throttleImpl(onAnimationFrameRequested, onBeforeIsRunningCheck, onAfterIsRunningCheck) {
  var isRunning = false;
  var func = function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    onBeforeIsRunningCheck === null || onBeforeIsRunningCheck === void 0 ? void 0 : onBeforeIsRunningCheck.apply(void 0, args);
    if (isRunning) {
      return;
    }
    isRunning = true;
    onAfterIsRunningCheck === null || onAfterIsRunningCheck === void 0 ? void 0 : onAfterIsRunningCheck.apply(void 0, args);
    requestAnimationFrame(function() {
      onAnimationFrameRequested.apply(void 0, args);
      isRunning = false;
    });
  };
  return func;
}
function clickElementOnKeyPress(keys2) {
  return function(e) {
    return keys2.some(function(key) {
      return e.key === key;
    }) && e.target.dispatchEvent(new MouseEvent("click", __assign(__assign({}, e), { view: void 0 })));
  };
}

// ../../../node_modules/@blueprintjs/core/lib/esm/common/utils/functionUtils.js
function isFunction(value) {
  return typeof value === "function";
}

// ../../../node_modules/@blueprintjs/core/lib/esm/common/errors.js
var ns = "[Blueprint]";
var CLAMP_MIN_MAX = ns + " clamp: max cannot be less than min";
var ALERT_WARN_CANCEL_PROPS = ns + " <Alert> cancelButtonText and onCancel should be set together.";
var ALERT_WARN_CANCEL_ESCAPE_KEY = ns + " <Alert> canEscapeKeyCancel enabled without onCancel or onClose handler.";
var ALERT_WARN_CANCEL_OUTSIDE_CLICK = ns + " <Alert> canOutsideClickCancel enabled without onCancel or onClose handler.";
var COLLAPSIBLE_LIST_INVALID_CHILD = ns + " <CollapsibleList> children must be <MenuItem>s";
var CONTEXTMENU_WARN_DECORATOR_NO_METHOD = ns + " @ContextMenuTarget-decorated class should implement renderContextMenu.";
var CONTEXTMENU_WARN_DECORATOR_NEEDS_REACT_ELEMENT = ns + ' "@ContextMenuTarget-decorated components must return a single JSX.Element or an empty render.';
var HOTKEYS_HOTKEY_CHILDREN = ns + " <Hotkeys> only accepts <Hotkey> children.";
var HOTKEYS_WARN_DECORATOR_NO_METHOD = ns + " @HotkeysTarget-decorated class should implement renderHotkeys.";
var HOTKEYS_WARN_DECORATOR_NEEDS_REACT_ELEMENT = ns + ' "@HotkeysTarget-decorated components must return a single JSX.Element or an empty render.';
var HOTKEYS_PROVIDER_NOT_FOUND = ns + " useHotkeys() was used outside of a <HotkeysProvider> context. These hotkeys will not be shown in the hotkeys help dialog.";
var HOTKEYS_TARGET2_CHILDREN_LOCAL_HOTKEYS = ns + " <HotkeysTarget2> was configured with local hotkeys, but you did not use the generated event handlers to bind their event handlers. Try using a render function as the child of this component.";
var INPUT_WARN_LEFT_ELEMENT_LEFT_ICON_MUTEX = ns + " <InputGroup> leftElement and leftIcon prop are mutually exclusive, with leftElement taking priority.";
var NUMERIC_INPUT_MIN_MAX = ns + " <NumericInput> requires min to be no greater than max if both are defined.";
var NUMERIC_INPUT_MINOR_STEP_SIZE_BOUND = ns + " <NumericInput> requires minorStepSize to be no greater than stepSize.";
var NUMERIC_INPUT_MAJOR_STEP_SIZE_BOUND = ns + " <NumericInput> requires stepSize to be no greater than majorStepSize.";
var NUMERIC_INPUT_MINOR_STEP_SIZE_NON_POSITIVE = ns + " <NumericInput> requires minorStepSize to be strictly greater than zero.";
var NUMERIC_INPUT_MAJOR_STEP_SIZE_NON_POSITIVE = ns + " <NumericInput> requires majorStepSize to be strictly greater than zero.";
var NUMERIC_INPUT_STEP_SIZE_NON_POSITIVE = ns + " <NumericInput> requires stepSize to be strictly greater than zero.";
var NUMERIC_INPUT_CONTROLLED_VALUE_INVALID = ns + " <NumericInput> controlled value prop does not adhere to stepSize, min, and/or max constraints.";
var PANEL_STACK_INITIAL_PANEL_STACK_MUTEX = ns + " <PanelStack> requires exactly one of initialPanel and stack prop";
var PANEL_STACK_REQUIRES_PANEL = ns + " <PanelStack> requires at least one panel in the stack";
var OVERFLOW_LIST_OBSERVE_PARENTS_CHANGED = ns + " <OverflowList> does not support changing observeParents after mounting.";
var POPOVER_REQUIRES_TARGET = ns + " <Popover> requires target prop or at least one child element.";
var POPOVER_HAS_BACKDROP_INTERACTION = ns + " <Popover hasBackdrop={true}> requires interactionKind={PopoverInteractionKind.CLICK}.";
var POPOVER_WARN_TOO_MANY_CHILDREN = ns + " <Popover> supports one or two children; additional children are ignored. First child is the target, second child is the content. You may instead supply these two as props.";
var POPOVER_WARN_DOUBLE_CONTENT = ns + " <Popover> with two children ignores content prop; use either prop or children.";
var POPOVER_WARN_DOUBLE_TARGET = ns + " <Popover> with children ignores target prop; use either prop or children.";
var POPOVER_WARN_EMPTY_CONTENT = ns + " Disabling <Popover> with empty/whitespace content...";
var POPOVER_WARN_HAS_BACKDROP_INLINE = ns + " <Popover usePortal={false}> ignores hasBackdrop";
var POPOVER_WARN_PLACEMENT_AND_POSITION_MUTEX = ns + " <Popover> supports either placement or position prop, not both.";
var POPOVER_WARN_UNCONTROLLED_ONINTERACTION = ns + " <Popover> onInteraction is ignored when uncontrolled.";
var PORTAL_CONTEXT_CLASS_NAME_STRING = ns + " <Portal> context blueprintPortalClassName must be string";
var PORTAL_LEGACY_CONTEXT_API = ns + " setting blueprintPortalClassName via legacy React context API is deprecated, use <PortalProvider> instead.";
var RADIOGROUP_WARN_CHILDREN_OPTIONS_MUTEX = ns + " <RadioGroup> children and options prop are mutually exclusive, with options taking priority.";
var SLIDER_ZERO_STEP = ns + " <Slider> stepSize must be greater than zero.";
var SLIDER_ZERO_LABEL_STEP = ns + " <Slider> labelStepSize must be greater than zero.";
var SLIDER_MIN = ns + " <Slider> min prop must be a finite number.";
var SLIDER_MAX = ns + " <Slider> max prop must be a finite number.";
var RANGESLIDER_NULL_VALUE = ns + " <RangeSlider> value prop must be an array of two non-null numbers.";
var MULTISLIDER_INVALID_CHILD = ns + " <MultiSlider> children must be <SliderHandle>s or <SliderTrackStop>s";
var MULTISLIDER_WARN_LABEL_STEP_SIZE_LABEL_VALUES_MUTEX = ns + " <MultiSlider> labelStepSize and labelValues prop are mutually exclusive, with labelStepSize taking priority.";
var SPINNER_WARN_CLASSES_SIZE = ns + " <Spinner> Classes.SMALL/LARGE are ignored if size prop is set.";
var TOASTER_CREATE_NULL = ns + " OverlayToaster.create() is not supported inside React lifecycle methods in React 16. See usage example on the docs site.";
var TOASTER_MAX_TOASTS_INVALID = ns + " <OverlayToaster> maxToasts is set to an invalid number, must be greater than 0";
var TOASTER_WARN_INLINE = ns + " OverlayToaster.create() ignores inline prop as it always creates a new element.";
var DIALOG_WARN_NO_HEADER_ICON = ns + " <Dialog> iconName is ignored if title is omitted.";
var DIALOG_WARN_NO_HEADER_CLOSE_BUTTON = ns + " <Dialog> isCloseButtonShown prop is ignored if title is omitted.";
var DRAWER_ANGLE_POSITIONS_ARE_CASTED = ns + " <Drawer> all angle positions are casted into pure position (TOP, BOTTOM, LEFT or RIGHT)";

// ../../../node_modules/@blueprintjs/core/lib/esm/common/utils/jsUtils.js
function isNodeEnv(env) {
  return typeof process !== "undefined" && process.env && process.env.NODE_ENV === env;
}
function arrayLengthCompare(a, b) {
  if (a === void 0) {
    a = [];
  }
  if (b === void 0) {
    b = [];
  }
  return a.length - b.length;
}
function approxEqual(a, b, tolerance) {
  if (tolerance === void 0) {
    tolerance = 1e-5;
  }
  return Math.abs(a - b) <= tolerance;
}
function clamp(val, min2, max2) {
  if (val == null) {
    return val;
  }
  if (max2 < min2) {
    throw new Error(CLAMP_MIN_MAX);
  }
  return Math.min(Math.max(val, min2), max2);
}
function countDecimalPlaces(num) {
  if (!isFinite(num)) {
    return 0;
  }
  var e = 1;
  var p = 0;
  while (Math.round(num * e) / e !== num) {
    e *= 10;
    p++;
  }
  return p;
}
var uniqueCountForNamespace = /* @__PURE__ */ new Map();
function uniqueId(namespace) {
  var _a2;
  var curCount = (_a2 = uniqueCountForNamespace.get(namespace)) !== null && _a2 !== void 0 ? _a2 : 0;
  uniqueCountForNamespace.set(namespace, curCount + 1);
  return "".concat(namespace, "-").concat(curCount);
}

// ../../../node_modules/@blueprintjs/core/lib/esm/common/utils/reactUtils.js
import * as React from "react";
function isReactNodeEmpty(node, skipArray) {
  if (skipArray === void 0) {
    skipArray = false;
  }
  return node == null || node === "" || node === false || !skipArray && Array.isArray(node) && // only recurse one level through arrays, for performance
  (node.length === 0 || node.every(function(n) {
    return isReactNodeEmpty(n, true);
  }));
}
function isReactChildrenElementOrElements(children) {
  return !isReactNodeEmpty(children, true) && children !== true;
}
function ensureElement(child, tagName) {
  if (tagName === void 0) {
    tagName = "span";
  }
  if (child == null || typeof child === "boolean") {
    return void 0;
  } else if (typeof child === "string") {
    return child.trim().length > 0 ? React.createElement(tagName, {}, child) : void 0;
  } else if (typeof child === "number" || typeof child.type === "symbol" || Array.isArray(child)) {
    return React.createElement(tagName, {}, child);
  } else if (isReactElement(child)) {
    return child;
  } else {
    return void 0;
  }
}
function isReactElement(child) {
  return typeof child === "object" && typeof child.type !== "undefined" && typeof child.props !== "undefined";
}
function getDisplayName(ComponentClass) {
  return ComponentClass.displayName || ComponentClass.name || "Unknown";
}
function isElementOfType(element, ComponentType) {
  return element != null && element.type != null && element.type.displayName != null && element.type.displayName === ComponentType.displayName;
}

// ../../../node_modules/@blueprintjs/core/lib/esm/common/configureDom4.js
if (typeof __require !== "undefined" && typeof window !== "undefined" && typeof document !== "undefined") {
  require_dom4_max();
}

// ../../../node_modules/@blueprintjs/core/lib/esm/common/utils/isDarkTheme.js
function isDarkTheme(element) {
  return element != null && element instanceof Element && element.closest(".".concat(DARK)) != null;
}

// ../../../node_modules/@blueprintjs/core/lib/esm/common/refs.js
function isRefObject(value) {
  return value != null && typeof value !== "function";
}
function isRefCallback(value) {
  return typeof value === "function";
}
function setRef(refTarget, ref) {
  if (isRefObject(refTarget)) {
    refTarget.current = ref;
  } else if (isRefCallback(refTarget)) {
    refTarget(ref);
  }
}
function mergeRefs() {
  var refs = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    refs[_i] = arguments[_i];
  }
  return function(value) {
    refs.forEach(function(ref) {
      setRef(ref, value);
    });
  };
}
function getRef(ref) {
  var _a2;
  if (ref === null) {
    return null;
  }
  return (_a2 = ref.current) !== null && _a2 !== void 0 ? _a2 : ref;
}
function refHandler(refTargetParent, refTargetKey, refProp) {
  return function(ref) {
    refTargetParent[refTargetKey] = ref;
    setRef(refProp, ref);
  };
}

// ../../../node_modules/@blueprintjs/core/lib/esm/common/abstractPureComponent2.js
import * as React2 from "react";
var AbstractPureComponent2 = (
  /** @class */
  function(_super) {
    __extends(AbstractPureComponent22, _super);
    function AbstractPureComponent22(props, context) {
      var _this = _super.call(this, props, context) || this;
      _this.timeoutIds = [];
      _this.requestIds = [];
      _this.clearTimeouts = function() {
        if (_this.timeoutIds.length > 0) {
          for (var _i = 0, _a2 = _this.timeoutIds; _i < _a2.length; _i++) {
            var timeoutId = _a2[_i];
            window.clearTimeout(timeoutId);
          }
          _this.timeoutIds = [];
        }
      };
      _this.cancelAnimationFrames = function() {
        if (_this.requestIds.length > 0) {
          for (var _i = 0, _a2 = _this.requestIds; _i < _a2.length; _i++) {
            var requestId = _a2[_i];
            window.cancelAnimationFrame(requestId);
          }
          _this.requestIds = [];
        }
      };
      if (!isNodeEnv("production")) {
        _this.validateProps(_this.props);
      }
      return _this;
    }
    AbstractPureComponent22.prototype.componentDidUpdate = function(_prevProps, _prevState, _snapshot) {
      if (!isNodeEnv("production")) {
        this.validateProps(this.props);
      }
    };
    AbstractPureComponent22.prototype.componentWillUnmount = function() {
      this.clearTimeouts();
      this.cancelAnimationFrames();
    };
    AbstractPureComponent22.prototype.requestAnimationFrame = function(callback) {
      var handle = window.requestAnimationFrame(callback);
      this.requestIds.push(handle);
      return function() {
        return window.cancelAnimationFrame(handle);
      };
    };
    AbstractPureComponent22.prototype.setTimeout = function(callback, timeout2) {
      var handle = window.setTimeout(callback, timeout2);
      this.timeoutIds.push(handle);
      return function() {
        return window.clearTimeout(handle);
      };
    };
    AbstractPureComponent22.prototype.validateProps = function(_props) {
    };
    return AbstractPureComponent22;
  }(React2.PureComponent)
);

// ../../../node_modules/@blueprintjs/core/lib/esm/common/props.js
var DISPLAYNAME_PREFIX = "Blueprint4";

// ../../../node_modules/@blueprintjs/colors/node_modules/tslib/tslib.es6.mjs
var __assign2 = function() {
  __assign2 = Object.assign || function __assign4(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign2.apply(this, arguments);
};

// ../../../node_modules/@blueprintjs/colors/lib/esm/colors.js
var grayScale = {
  BLACK: "#111418",
  DARK_GRAY1: "#1C2127",
  DARK_GRAY2: "#252A31",
  DARK_GRAY3: "#2F343C",
  DARK_GRAY4: "#383E47",
  DARK_GRAY5: "#404854",
  GRAY1: "#5F6B7C",
  GRAY2: "#738091",
  GRAY3: "#8F99A8",
  GRAY4: "#ABB3BF",
  GRAY5: "#C5CBD3",
  LIGHT_GRAY1: "#D3D8DE",
  LIGHT_GRAY2: "#DCE0E5",
  LIGHT_GRAY3: "#E5E8EB",
  LIGHT_GRAY4: "#EDEFF2",
  LIGHT_GRAY5: "#F6F7F9",
  WHITE: "#FFFFFF"
};
var coreColors = {
  BLUE1: "#184A90",
  BLUE2: "#215DB0",
  BLUE3: "#2D72D2",
  BLUE4: "#4C90F0",
  BLUE5: "#8ABBFF",
  GREEN1: "#165A36",
  GREEN2: "#1C6E42",
  GREEN3: "#238551",
  GREEN4: "#32A467",
  GREEN5: "#72CA9B",
  ORANGE1: "#77450D",
  ORANGE2: "#935610",
  ORANGE3: "#C87619",
  ORANGE4: "#EC9A3C",
  ORANGE5: "#FBB360",
  RED1: "#8E292C",
  RED2: "#AC2F33",
  RED3: "#CD4246",
  RED4: "#E76A6E",
  RED5: "#FA999C"
};
var extendedColors = {
  CERULEAN1: "#0C5174",
  CERULEAN2: "#0F6894",
  CERULEAN3: "#147EB3",
  CERULEAN4: "#3FA6DA",
  CERULEAN5: "#68C1EE",
  FOREST1: "#1D7324",
  FOREST2: "#238C2C",
  FOREST3: "#29A634",
  FOREST4: "#43BF4D",
  FOREST5: "#62D96B",
  GOLD1: "#5C4405",
  GOLD2: "#866103",
  GOLD3: "#D1980B",
  GOLD4: "#F0B726",
  GOLD5: "#FBD065",
  INDIGO1: "#5642A6",
  INDIGO2: "#634DBF",
  INDIGO3: "#7961DB",
  INDIGO4: "#9881F3",
  INDIGO5: "#BDADFF",
  LIME1: "#43501B",
  LIME2: "#5A701A",
  LIME3: "#8EB125",
  LIME4: "#B6D94C",
  LIME5: "#D4F17E",
  ROSE1: "#A82255",
  ROSE2: "#C22762",
  ROSE3: "#DB2C6F",
  ROSE4: "#F5498B",
  ROSE5: "#FF66A1",
  SEPIA1: "#5E4123",
  SEPIA2: "#7A542E",
  SEPIA3: "#946638",
  SEPIA4: "#AF855A",
  SEPIA5: "#D0B090",
  TURQUOISE1: "#004D46",
  TURQUOISE2: "#007067",
  TURQUOISE3: "#00A396",
  TURQUOISE4: "#13C9BA",
  TURQUOISE5: "#7AE1D8",
  VERMILION1: "#96290D",
  VERMILION2: "#B83211",
  VERMILION3: "#D33D17",
  VERMILION4: "#EB6847",
  VERMILION5: "#FF9980",
  VIOLET1: "#5C255C",
  VIOLET2: "#7C327C",
  VIOLET3: "#9D3F9D",
  VIOLET4: "#BD6BBD",
  VIOLET5: "#D69FD6"
};
var legacyColors = {
  /** @deprecated use CERULEAN1 */
  COBALT1: extendedColors.CERULEAN1,
  /** @deprecated use CERULEAN2 */
  COBALT2: extendedColors.CERULEAN2,
  /** @deprecated use CERULEAN3 */
  COBALT3: extendedColors.CERULEAN3,
  /** @deprecated use CERULEAN4 */
  COBALT4: extendedColors.CERULEAN4,
  /** @deprecated use CERULEAN5 */
  COBALT5: extendedColors.CERULEAN5
};
var Colors = __assign2(__assign2(__assign2(__assign2({}, grayScale), coreColors), extendedColors), legacyColors);

// ../../../node_modules/@blueprintjs/core/lib/esm/common/keys.js
var keys_exports = {};
__export(keys_exports, {
  ARROW_DOWN: () => ARROW_DOWN,
  ARROW_LEFT: () => ARROW_LEFT,
  ARROW_RIGHT: () => ARROW_RIGHT,
  ARROW_UP: () => ARROW_UP,
  BACKSPACE: () => BACKSPACE,
  DELETE: () => DELETE,
  ENTER: () => ENTER,
  ESCAPE: () => ESCAPE,
  SHIFT: () => SHIFT,
  SPACE: () => SPACE,
  TAB: () => TAB2,
  isKeyboardClick: () => isKeyboardClick
});
var BACKSPACE = 8;
var TAB2 = 9;
var ENTER = 13;
var SHIFT = 16;
var ESCAPE = 27;
var SPACE = 32;
var ARROW_LEFT = 37;
var ARROW_UP = 38;
var ARROW_RIGHT = 39;
var ARROW_DOWN = 40;
var DELETE = 46;
function isKeyboardClick(keyCode) {
  return keyCode === ENTER || keyCode === SPACE;
}

// ../../../node_modules/@blueprintjs/core/lib/esm/components/overlay/overlay.js
var import_classnames = __toESM(require_classnames());
import * as React8 from "react";
import { findDOMNode } from "react-dom";

// ../../../node_modules/@babel/runtime/helpers/esm/extends.js
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}

// ../../../node_modules/@babel/runtime/helpers/esm/objectWithoutPropertiesLoose.js
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null)
    return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0)
      continue;
    target[key] = source[key];
  }
  return target;
}

// ../../../node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf2(o2, p2) {
    o2.__proto__ = p2;
    return o2;
  };
  return _setPrototypeOf(o, p);
}

// ../../../node_modules/@babel/runtime/helpers/esm/inheritsLoose.js
function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  _setPrototypeOf(subClass, superClass);
}

// ../../../node_modules/react-transition-group/esm/CSSTransition.js
var import_prop_types3 = __toESM(require_prop_types());

// ../../../node_modules/dom-helpers/esm/hasClass.js
function hasClass(element, className) {
  if (element.classList)
    return !!className && element.classList.contains(className);
  return (" " + (element.className.baseVal || element.className) + " ").indexOf(" " + className + " ") !== -1;
}

// ../../../node_modules/dom-helpers/esm/addClass.js
function addClass(element, className) {
  if (element.classList)
    element.classList.add(className);
  else if (!hasClass(element, className))
    if (typeof element.className === "string")
      element.className = element.className + " " + className;
    else
      element.setAttribute("class", (element.className && element.className.baseVal || "") + " " + className);
}

// ../../../node_modules/dom-helpers/esm/removeClass.js
function replaceClassName(origClass, classToRemove) {
  return origClass.replace(new RegExp("(^|\\s)" + classToRemove + "(?:\\s|$)", "g"), "$1").replace(/\s+/g, " ").replace(/^\s*|\s*$/g, "");
}
function removeClass(element, className) {
  if (element.classList) {
    element.classList.remove(className);
  } else if (typeof element.className === "string") {
    element.className = replaceClassName(element.className, className);
  } else {
    element.setAttribute("class", replaceClassName(element.className && element.className.baseVal || "", className));
  }
}

// ../../../node_modules/react-transition-group/esm/CSSTransition.js
import React5 from "react";

// ../../../node_modules/react-transition-group/esm/Transition.js
var import_prop_types2 = __toESM(require_prop_types());
import React4 from "react";
import ReactDOM from "react-dom";

// ../../../node_modules/react-transition-group/esm/config.js
var config_default = {
  disabled: false
};

// ../../../node_modules/react-transition-group/esm/utils/PropTypes.js
var import_prop_types = __toESM(require_prop_types());
var timeoutsShape = process.env.NODE_ENV !== "production" ? import_prop_types.default.oneOfType([import_prop_types.default.number, import_prop_types.default.shape({
  enter: import_prop_types.default.number,
  exit: import_prop_types.default.number,
  appear: import_prop_types.default.number
}).isRequired]) : null;
var classNamesShape = process.env.NODE_ENV !== "production" ? import_prop_types.default.oneOfType([import_prop_types.default.string, import_prop_types.default.shape({
  enter: import_prop_types.default.string,
  exit: import_prop_types.default.string,
  active: import_prop_types.default.string
}), import_prop_types.default.shape({
  enter: import_prop_types.default.string,
  enterDone: import_prop_types.default.string,
  enterActive: import_prop_types.default.string,
  exit: import_prop_types.default.string,
  exitDone: import_prop_types.default.string,
  exitActive: import_prop_types.default.string
})]) : null;

// ../../../node_modules/react-transition-group/esm/TransitionGroupContext.js
import React3 from "react";
var TransitionGroupContext_default = React3.createContext(null);

// ../../../node_modules/react-transition-group/esm/utils/reflow.js
var forceReflow = function forceReflow2(node) {
  return node.scrollTop;
};

// ../../../node_modules/react-transition-group/esm/Transition.js
var UNMOUNTED = "unmounted";
var EXITED = "exited";
var ENTERING = "entering";
var ENTERED = "entered";
var EXITING = "exiting";
var Transition = /* @__PURE__ */ function(_React$Component) {
  _inheritsLoose(Transition2, _React$Component);
  function Transition2(props, context) {
    var _this;
    _this = _React$Component.call(this, props, context) || this;
    var parentGroup = context;
    var appear = parentGroup && !parentGroup.isMounting ? props.enter : props.appear;
    var initialStatus;
    _this.appearStatus = null;
    if (props.in) {
      if (appear) {
        initialStatus = EXITED;
        _this.appearStatus = ENTERING;
      } else {
        initialStatus = ENTERED;
      }
    } else {
      if (props.unmountOnExit || props.mountOnEnter) {
        initialStatus = UNMOUNTED;
      } else {
        initialStatus = EXITED;
      }
    }
    _this.state = {
      status: initialStatus
    };
    _this.nextCallback = null;
    return _this;
  }
  Transition2.getDerivedStateFromProps = function getDerivedStateFromProps(_ref, prevState) {
    var nextIn = _ref.in;
    if (nextIn && prevState.status === UNMOUNTED) {
      return {
        status: EXITED
      };
    }
    return null;
  };
  var _proto = Transition2.prototype;
  _proto.componentDidMount = function componentDidMount() {
    this.updateStatus(true, this.appearStatus);
  };
  _proto.componentDidUpdate = function componentDidUpdate(prevProps) {
    var nextStatus = null;
    if (prevProps !== this.props) {
      var status = this.state.status;
      if (this.props.in) {
        if (status !== ENTERING && status !== ENTERED) {
          nextStatus = ENTERING;
        }
      } else {
        if (status === ENTERING || status === ENTERED) {
          nextStatus = EXITING;
        }
      }
    }
    this.updateStatus(false, nextStatus);
  };
  _proto.componentWillUnmount = function componentWillUnmount() {
    this.cancelNextCallback();
  };
  _proto.getTimeouts = function getTimeouts() {
    var timeout2 = this.props.timeout;
    var exit, enter2, appear;
    exit = enter2 = appear = timeout2;
    if (timeout2 != null && typeof timeout2 !== "number") {
      exit = timeout2.exit;
      enter2 = timeout2.enter;
      appear = timeout2.appear !== void 0 ? timeout2.appear : enter2;
    }
    return {
      exit,
      enter: enter2,
      appear
    };
  };
  _proto.updateStatus = function updateStatus(mounting, nextStatus) {
    if (mounting === void 0) {
      mounting = false;
    }
    if (nextStatus !== null) {
      this.cancelNextCallback();
      if (nextStatus === ENTERING) {
        if (this.props.unmountOnExit || this.props.mountOnEnter) {
          var node = this.props.nodeRef ? this.props.nodeRef.current : ReactDOM.findDOMNode(this);
          if (node)
            forceReflow(node);
        }
        this.performEnter(mounting);
      } else {
        this.performExit();
      }
    } else if (this.props.unmountOnExit && this.state.status === EXITED) {
      this.setState({
        status: UNMOUNTED
      });
    }
  };
  _proto.performEnter = function performEnter(mounting) {
    var _this2 = this;
    var enter2 = this.props.enter;
    var appearing = this.context ? this.context.isMounting : mounting;
    var _ref2 = this.props.nodeRef ? [appearing] : [ReactDOM.findDOMNode(this), appearing], maybeNode = _ref2[0], maybeAppearing = _ref2[1];
    var timeouts = this.getTimeouts();
    var enterTimeout = appearing ? timeouts.appear : timeouts.enter;
    if (!mounting && !enter2 || config_default.disabled) {
      this.safeSetState({
        status: ENTERED
      }, function() {
        _this2.props.onEntered(maybeNode);
      });
      return;
    }
    this.props.onEnter(maybeNode, maybeAppearing);
    this.safeSetState({
      status: ENTERING
    }, function() {
      _this2.props.onEntering(maybeNode, maybeAppearing);
      _this2.onTransitionEnd(enterTimeout, function() {
        _this2.safeSetState({
          status: ENTERED
        }, function() {
          _this2.props.onEntered(maybeNode, maybeAppearing);
        });
      });
    });
  };
  _proto.performExit = function performExit() {
    var _this3 = this;
    var exit = this.props.exit;
    var timeouts = this.getTimeouts();
    var maybeNode = this.props.nodeRef ? void 0 : ReactDOM.findDOMNode(this);
    if (!exit || config_default.disabled) {
      this.safeSetState({
        status: EXITED
      }, function() {
        _this3.props.onExited(maybeNode);
      });
      return;
    }
    this.props.onExit(maybeNode);
    this.safeSetState({
      status: EXITING
    }, function() {
      _this3.props.onExiting(maybeNode);
      _this3.onTransitionEnd(timeouts.exit, function() {
        _this3.safeSetState({
          status: EXITED
        }, function() {
          _this3.props.onExited(maybeNode);
        });
      });
    });
  };
  _proto.cancelNextCallback = function cancelNextCallback() {
    if (this.nextCallback !== null) {
      this.nextCallback.cancel();
      this.nextCallback = null;
    }
  };
  _proto.safeSetState = function safeSetState(nextState, callback) {
    callback = this.setNextCallback(callback);
    this.setState(nextState, callback);
  };
  _proto.setNextCallback = function setNextCallback(callback) {
    var _this4 = this;
    var active = true;
    this.nextCallback = function(event) {
      if (active) {
        active = false;
        _this4.nextCallback = null;
        callback(event);
      }
    };
    this.nextCallback.cancel = function() {
      active = false;
    };
    return this.nextCallback;
  };
  _proto.onTransitionEnd = function onTransitionEnd(timeout2, handler) {
    this.setNextCallback(handler);
    var node = this.props.nodeRef ? this.props.nodeRef.current : ReactDOM.findDOMNode(this);
    var doesNotHaveTimeoutOrListener = timeout2 == null && !this.props.addEndListener;
    if (!node || doesNotHaveTimeoutOrListener) {
      setTimeout(this.nextCallback, 0);
      return;
    }
    if (this.props.addEndListener) {
      var _ref3 = this.props.nodeRef ? [this.nextCallback] : [node, this.nextCallback], maybeNode = _ref3[0], maybeNextCallback = _ref3[1];
      this.props.addEndListener(maybeNode, maybeNextCallback);
    }
    if (timeout2 != null) {
      setTimeout(this.nextCallback, timeout2);
    }
  };
  _proto.render = function render() {
    var status = this.state.status;
    if (status === UNMOUNTED) {
      return null;
    }
    var _this$props = this.props, children = _this$props.children, _in = _this$props.in, _mountOnEnter = _this$props.mountOnEnter, _unmountOnExit = _this$props.unmountOnExit, _appear = _this$props.appear, _enter = _this$props.enter, _exit = _this$props.exit, _timeout = _this$props.timeout, _addEndListener = _this$props.addEndListener, _onEnter = _this$props.onEnter, _onEntering = _this$props.onEntering, _onEntered = _this$props.onEntered, _onExit = _this$props.onExit, _onExiting = _this$props.onExiting, _onExited = _this$props.onExited, _nodeRef = _this$props.nodeRef, childProps = _objectWithoutPropertiesLoose(_this$props, ["children", "in", "mountOnEnter", "unmountOnExit", "appear", "enter", "exit", "timeout", "addEndListener", "onEnter", "onEntering", "onEntered", "onExit", "onExiting", "onExited", "nodeRef"]);
    return (
      // allows for nested Transitions
      /* @__PURE__ */ React4.createElement(TransitionGroupContext_default.Provider, {
        value: null
      }, typeof children === "function" ? children(status, childProps) : React4.cloneElement(React4.Children.only(children), childProps))
    );
  };
  return Transition2;
}(React4.Component);
Transition.contextType = TransitionGroupContext_default;
Transition.propTypes = process.env.NODE_ENV !== "production" ? {
  /**
   * A React reference to DOM element that need to transition:
   * https://stackoverflow.com/a/51127130/4671932
   *
   *   - When `nodeRef` prop is used, `node` is not passed to callback functions
   *      (e.g. `onEnter`) because user already has direct access to the node.
   *   - When changing `key` prop of `Transition` in a `TransitionGroup` a new
   *     `nodeRef` need to be provided to `Transition` with changed `key` prop
   *     (see
   *     [test/CSSTransition-test.js](https://github.com/reactjs/react-transition-group/blob/13435f897b3ab71f6e19d724f145596f5910581c/test/CSSTransition-test.js#L362-L437)).
   */
  nodeRef: import_prop_types2.default.shape({
    current: typeof Element === "undefined" ? import_prop_types2.default.any : function(propValue, key, componentName, location, propFullName, secret) {
      var value = propValue[key];
      return import_prop_types2.default.instanceOf(value && "ownerDocument" in value ? value.ownerDocument.defaultView.Element : Element)(propValue, key, componentName, location, propFullName, secret);
    }
  }),
  /**
   * A `function` child can be used instead of a React element. This function is
   * called with the current transition status (`'entering'`, `'entered'`,
   * `'exiting'`, `'exited'`), which can be used to apply context
   * specific props to a component.
   *
   * ```jsx
   * <Transition in={this.state.in} timeout={150}>
   *   {state => (
   *     <MyComponent className={`fade fade-${state}`} />
   *   )}
   * </Transition>
   * ```
   */
  children: import_prop_types2.default.oneOfType([import_prop_types2.default.func.isRequired, import_prop_types2.default.element.isRequired]).isRequired,
  /**
   * Show the component; triggers the enter or exit states
   */
  in: import_prop_types2.default.bool,
  /**
   * By default the child component is mounted immediately along with
   * the parent `Transition` component. If you want to "lazy mount" the component on the
   * first `in={true}` you can set `mountOnEnter`. After the first enter transition the component will stay
   * mounted, even on "exited", unless you also specify `unmountOnExit`.
   */
  mountOnEnter: import_prop_types2.default.bool,
  /**
   * By default the child component stays mounted after it reaches the `'exited'` state.
   * Set `unmountOnExit` if you'd prefer to unmount the component after it finishes exiting.
   */
  unmountOnExit: import_prop_types2.default.bool,
  /**
   * By default the child component does not perform the enter transition when
   * it first mounts, regardless of the value of `in`. If you want this
   * behavior, set both `appear` and `in` to `true`.
   *
   * > **Note**: there are no special appear states like `appearing`/`appeared`, this prop
   * > only adds an additional enter transition. However, in the
   * > `<CSSTransition>` component that first enter transition does result in
   * > additional `.appear-*` classes, that way you can choose to style it
   * > differently.
   */
  appear: import_prop_types2.default.bool,
  /**
   * Enable or disable enter transitions.
   */
  enter: import_prop_types2.default.bool,
  /**
   * Enable or disable exit transitions.
   */
  exit: import_prop_types2.default.bool,
  /**
   * The duration of the transition, in milliseconds.
   * Required unless `addEndListener` is provided.
   *
   * You may specify a single timeout for all transitions:
   *
   * ```jsx
   * timeout={500}
   * ```
   *
   * or individually:
   *
   * ```jsx
   * timeout={{
   *  appear: 500,
   *  enter: 300,
   *  exit: 500,
   * }}
   * ```
   *
   * - `appear` defaults to the value of `enter`
   * - `enter` defaults to `0`
   * - `exit` defaults to `0`
   *
   * @type {number | { enter?: number, exit?: number, appear?: number }}
   */
  timeout: function timeout(props) {
    var pt = timeoutsShape;
    if (!props.addEndListener)
      pt = pt.isRequired;
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    return pt.apply(void 0, [props].concat(args));
  },
  /**
   * Add a custom transition end trigger. Called with the transitioning
   * DOM node and a `done` callback. Allows for more fine grained transition end
   * logic. Timeouts are still used as a fallback if provided.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * ```jsx
   * addEndListener={(node, done) => {
   *   // use the css transitionend event to mark the finish of a transition
   *   node.addEventListener('transitionend', done, false);
   * }}
   * ```
   */
  addEndListener: import_prop_types2.default.func,
  /**
   * Callback fired before the "entering" status is applied. An extra parameter
   * `isAppearing` is supplied to indicate if the enter stage is occurring on the initial mount
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement, isAppearing: bool) -> void
   */
  onEnter: import_prop_types2.default.func,
  /**
   * Callback fired after the "entering" status is applied. An extra parameter
   * `isAppearing` is supplied to indicate if the enter stage is occurring on the initial mount
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement, isAppearing: bool)
   */
  onEntering: import_prop_types2.default.func,
  /**
   * Callback fired after the "entered" status is applied. An extra parameter
   * `isAppearing` is supplied to indicate if the enter stage is occurring on the initial mount
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement, isAppearing: bool) -> void
   */
  onEntered: import_prop_types2.default.func,
  /**
   * Callback fired before the "exiting" status is applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement) -> void
   */
  onExit: import_prop_types2.default.func,
  /**
   * Callback fired after the "exiting" status is applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement) -> void
   */
  onExiting: import_prop_types2.default.func,
  /**
   * Callback fired after the "exited" status is applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed
   *
   * @type Function(node: HtmlElement) -> void
   */
  onExited: import_prop_types2.default.func
} : {};
function noop() {
}
Transition.defaultProps = {
  in: false,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
  enter: true,
  exit: true,
  onEnter: noop,
  onEntering: noop,
  onEntered: noop,
  onExit: noop,
  onExiting: noop,
  onExited: noop
};
Transition.UNMOUNTED = UNMOUNTED;
Transition.EXITED = EXITED;
Transition.ENTERING = ENTERING;
Transition.ENTERED = ENTERED;
Transition.EXITING = EXITING;
var Transition_default = Transition;

// ../../../node_modules/react-transition-group/esm/CSSTransition.js
var _addClass = function addClass2(node, classes) {
  return node && classes && classes.split(" ").forEach(function(c) {
    return addClass(node, c);
  });
};
var removeClass2 = function removeClass3(node, classes) {
  return node && classes && classes.split(" ").forEach(function(c) {
    return removeClass(node, c);
  });
};
var CSSTransition = /* @__PURE__ */ function(_React$Component) {
  _inheritsLoose(CSSTransition2, _React$Component);
  function CSSTransition2() {
    var _this;
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _React$Component.call.apply(_React$Component, [this].concat(args)) || this;
    _this.appliedClasses = {
      appear: {},
      enter: {},
      exit: {}
    };
    _this.onEnter = function(maybeNode, maybeAppearing) {
      var _this$resolveArgument = _this.resolveArguments(maybeNode, maybeAppearing), node = _this$resolveArgument[0], appearing = _this$resolveArgument[1];
      _this.removeClasses(node, "exit");
      _this.addClass(node, appearing ? "appear" : "enter", "base");
      if (_this.props.onEnter) {
        _this.props.onEnter(maybeNode, maybeAppearing);
      }
    };
    _this.onEntering = function(maybeNode, maybeAppearing) {
      var _this$resolveArgument2 = _this.resolveArguments(maybeNode, maybeAppearing), node = _this$resolveArgument2[0], appearing = _this$resolveArgument2[1];
      var type = appearing ? "appear" : "enter";
      _this.addClass(node, type, "active");
      if (_this.props.onEntering) {
        _this.props.onEntering(maybeNode, maybeAppearing);
      }
    };
    _this.onEntered = function(maybeNode, maybeAppearing) {
      var _this$resolveArgument3 = _this.resolveArguments(maybeNode, maybeAppearing), node = _this$resolveArgument3[0], appearing = _this$resolveArgument3[1];
      var type = appearing ? "appear" : "enter";
      _this.removeClasses(node, type);
      _this.addClass(node, type, "done");
      if (_this.props.onEntered) {
        _this.props.onEntered(maybeNode, maybeAppearing);
      }
    };
    _this.onExit = function(maybeNode) {
      var _this$resolveArgument4 = _this.resolveArguments(maybeNode), node = _this$resolveArgument4[0];
      _this.removeClasses(node, "appear");
      _this.removeClasses(node, "enter");
      _this.addClass(node, "exit", "base");
      if (_this.props.onExit) {
        _this.props.onExit(maybeNode);
      }
    };
    _this.onExiting = function(maybeNode) {
      var _this$resolveArgument5 = _this.resolveArguments(maybeNode), node = _this$resolveArgument5[0];
      _this.addClass(node, "exit", "active");
      if (_this.props.onExiting) {
        _this.props.onExiting(maybeNode);
      }
    };
    _this.onExited = function(maybeNode) {
      var _this$resolveArgument6 = _this.resolveArguments(maybeNode), node = _this$resolveArgument6[0];
      _this.removeClasses(node, "exit");
      _this.addClass(node, "exit", "done");
      if (_this.props.onExited) {
        _this.props.onExited(maybeNode);
      }
    };
    _this.resolveArguments = function(maybeNode, maybeAppearing) {
      return _this.props.nodeRef ? [_this.props.nodeRef.current, maybeNode] : [maybeNode, maybeAppearing];
    };
    _this.getClassNames = function(type) {
      var classNames4 = _this.props.classNames;
      var isStringClassNames = typeof classNames4 === "string";
      var prefix = isStringClassNames && classNames4 ? classNames4 + "-" : "";
      var baseClassName = isStringClassNames ? "" + prefix + type : classNames4[type];
      var activeClassName = isStringClassNames ? baseClassName + "-active" : classNames4[type + "Active"];
      var doneClassName = isStringClassNames ? baseClassName + "-done" : classNames4[type + "Done"];
      return {
        baseClassName,
        activeClassName,
        doneClassName
      };
    };
    return _this;
  }
  var _proto = CSSTransition2.prototype;
  _proto.addClass = function addClass3(node, type, phase) {
    var className = this.getClassNames(type)[phase + "ClassName"];
    var _this$getClassNames = this.getClassNames("enter"), doneClassName = _this$getClassNames.doneClassName;
    if (type === "appear" && phase === "done" && doneClassName) {
      className += " " + doneClassName;
    }
    if (phase === "active") {
      if (node)
        forceReflow(node);
    }
    if (className) {
      this.appliedClasses[type][phase] = className;
      _addClass(node, className);
    }
  };
  _proto.removeClasses = function removeClasses(node, type) {
    var _this$appliedClasses$ = this.appliedClasses[type], baseClassName = _this$appliedClasses$.base, activeClassName = _this$appliedClasses$.active, doneClassName = _this$appliedClasses$.done;
    this.appliedClasses[type] = {};
    if (baseClassName) {
      removeClass2(node, baseClassName);
    }
    if (activeClassName) {
      removeClass2(node, activeClassName);
    }
    if (doneClassName) {
      removeClass2(node, doneClassName);
    }
  };
  _proto.render = function render() {
    var _this$props = this.props, _ = _this$props.classNames, props = _objectWithoutPropertiesLoose(_this$props, ["classNames"]);
    return /* @__PURE__ */ React5.createElement(Transition_default, _extends({}, props, {
      onEnter: this.onEnter,
      onEntered: this.onEntered,
      onEntering: this.onEntering,
      onExit: this.onExit,
      onExiting: this.onExiting,
      onExited: this.onExited
    }));
  };
  return CSSTransition2;
}(React5.Component);
CSSTransition.defaultProps = {
  classNames: ""
};
CSSTransition.propTypes = process.env.NODE_ENV !== "production" ? _extends({}, Transition_default.propTypes, {
  /**
   * The animation classNames applied to the component as it appears, enters,
   * exits or has finished the transition. A single name can be provided, which
   * will be suffixed for each stage, e.g. `classNames="fade"` applies:
   *
   * - `fade-appear`, `fade-appear-active`, `fade-appear-done`
   * - `fade-enter`, `fade-enter-active`, `fade-enter-done`
   * - `fade-exit`, `fade-exit-active`, `fade-exit-done`
   *
   * A few details to note about how these classes are applied:
   *
   * 1. They are _joined_ with the ones that are already defined on the child
   *    component, so if you want to add some base styles, you can use
   *    `className` without worrying that it will be overridden.
   *
   * 2. If the transition component mounts with `in={false}`, no classes are
   *    applied yet. You might be expecting `*-exit-done`, but if you think
   *    about it, a component cannot finish exiting if it hasn't entered yet.
   *
   * 2. `fade-appear-done` and `fade-enter-done` will _both_ be applied. This
   *    allows you to define different behavior for when appearing is done and
   *    when regular entering is done, using selectors like
   *    `.fade-enter-done:not(.fade-appear-done)`. For example, you could apply
   *    an epic entrance animation when element first appears in the DOM using
   *    [Animate.css](https://daneden.github.io/animate.css/). Otherwise you can
   *    simply use `fade-enter-done` for defining both cases.
   *
   * Each individual classNames can also be specified independently like:
   *
   * ```js
   * classNames={{
   *  appear: 'my-appear',
   *  appearActive: 'my-active-appear',
   *  appearDone: 'my-done-appear',
   *  enter: 'my-enter',
   *  enterActive: 'my-active-enter',
   *  enterDone: 'my-done-enter',
   *  exit: 'my-exit',
   *  exitActive: 'my-active-exit',
   *  exitDone: 'my-done-exit',
   * }}
   * ```
   *
   * If you want to set these classes using CSS Modules:
   *
   * ```js
   * import styles from './styles.css';
   * ```
   *
   * you might want to use camelCase in your CSS file, that way could simply
   * spread them instead of listing them one by one:
   *
   * ```js
   * classNames={{ ...styles }}
   * ```
   *
   * @type {string | {
   *  appear?: string,
   *  appearActive?: string,
   *  appearDone?: string,
   *  enter?: string,
   *  enterActive?: string,
   *  enterDone?: string,
   *  exit?: string,
   *  exitActive?: string,
   *  exitDone?: string,
   * }}
   */
  classNames: classNamesShape,
  /**
   * A `<Transition>` callback fired immediately after the 'enter' or 'appear' class is
   * applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement, isAppearing: bool)
   */
  onEnter: import_prop_types3.default.func,
  /**
   * A `<Transition>` callback fired immediately after the 'enter-active' or
   * 'appear-active' class is applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement, isAppearing: bool)
   */
  onEntering: import_prop_types3.default.func,
  /**
   * A `<Transition>` callback fired immediately after the 'enter' or
   * 'appear' classes are **removed** and the `done` class is added to the DOM node.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement, isAppearing: bool)
   */
  onEntered: import_prop_types3.default.func,
  /**
   * A `<Transition>` callback fired immediately after the 'exit' class is
   * applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed
   *
   * @type Function(node: HtmlElement)
   */
  onExit: import_prop_types3.default.func,
  /**
   * A `<Transition>` callback fired immediately after the 'exit-active' is applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed
   *
   * @type Function(node: HtmlElement)
   */
  onExiting: import_prop_types3.default.func,
  /**
   * A `<Transition>` callback fired immediately after the 'exit' classes
   * are **removed** and the `exit-done` class is added to the DOM node.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed
   *
   * @type Function(node: HtmlElement)
   */
  onExited: import_prop_types3.default.func
}) : {};
var CSSTransition_default = CSSTransition;

// ../../../node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js
function _assertThisInitialized(self2) {
  if (self2 === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self2;
}

// ../../../node_modules/react-transition-group/esm/TransitionGroup.js
var import_prop_types4 = __toESM(require_prop_types());
import React6 from "react";

// ../../../node_modules/react-transition-group/esm/utils/ChildMapping.js
import { Children, cloneElement, isValidElement } from "react";
function getChildMapping(children, mapFn) {
  var mapper = function mapper2(child) {
    return mapFn && isValidElement(child) ? mapFn(child) : child;
  };
  var result = /* @__PURE__ */ Object.create(null);
  if (children)
    Children.map(children, function(c) {
      return c;
    }).forEach(function(child) {
      result[child.key] = mapper(child);
    });
  return result;
}
function mergeChildMappings(prev, next) {
  prev = prev || {};
  next = next || {};
  function getValueForKey(key) {
    return key in next ? next[key] : prev[key];
  }
  var nextKeysPending = /* @__PURE__ */ Object.create(null);
  var pendingKeys = [];
  for (var prevKey in prev) {
    if (prevKey in next) {
      if (pendingKeys.length) {
        nextKeysPending[prevKey] = pendingKeys;
        pendingKeys = [];
      }
    } else {
      pendingKeys.push(prevKey);
    }
  }
  var i;
  var childMapping = {};
  for (var nextKey in next) {
    if (nextKeysPending[nextKey]) {
      for (i = 0; i < nextKeysPending[nextKey].length; i++) {
        var pendingNextKey = nextKeysPending[nextKey][i];
        childMapping[nextKeysPending[nextKey][i]] = getValueForKey(pendingNextKey);
      }
    }
    childMapping[nextKey] = getValueForKey(nextKey);
  }
  for (i = 0; i < pendingKeys.length; i++) {
    childMapping[pendingKeys[i]] = getValueForKey(pendingKeys[i]);
  }
  return childMapping;
}
function getProp(child, prop, props) {
  return props[prop] != null ? props[prop] : child.props[prop];
}
function getInitialChildMapping(props, onExited) {
  return getChildMapping(props.children, function(child) {
    return cloneElement(child, {
      onExited: onExited.bind(null, child),
      in: true,
      appear: getProp(child, "appear", props),
      enter: getProp(child, "enter", props),
      exit: getProp(child, "exit", props)
    });
  });
}
function getNextChildMapping(nextProps, prevChildMapping, onExited) {
  var nextChildMapping = getChildMapping(nextProps.children);
  var children = mergeChildMappings(prevChildMapping, nextChildMapping);
  Object.keys(children).forEach(function(key) {
    var child = children[key];
    if (!isValidElement(child))
      return;
    var hasPrev = key in prevChildMapping;
    var hasNext = key in nextChildMapping;
    var prevChild = prevChildMapping[key];
    var isLeaving = isValidElement(prevChild) && !prevChild.props.in;
    if (hasNext && (!hasPrev || isLeaving)) {
      children[key] = cloneElement(child, {
        onExited: onExited.bind(null, child),
        in: true,
        exit: getProp(child, "exit", nextProps),
        enter: getProp(child, "enter", nextProps)
      });
    } else if (!hasNext && hasPrev && !isLeaving) {
      children[key] = cloneElement(child, {
        in: false
      });
    } else if (hasNext && hasPrev && isValidElement(prevChild)) {
      children[key] = cloneElement(child, {
        onExited: onExited.bind(null, child),
        in: prevChild.props.in,
        exit: getProp(child, "exit", nextProps),
        enter: getProp(child, "enter", nextProps)
      });
    }
  });
  return children;
}

// ../../../node_modules/react-transition-group/esm/TransitionGroup.js
var values = Object.values || function(obj) {
  return Object.keys(obj).map(function(k) {
    return obj[k];
  });
};
var defaultProps = {
  component: "div",
  childFactory: function childFactory(child) {
    return child;
  }
};
var TransitionGroup = /* @__PURE__ */ function(_React$Component) {
  _inheritsLoose(TransitionGroup2, _React$Component);
  function TransitionGroup2(props, context) {
    var _this;
    _this = _React$Component.call(this, props, context) || this;
    var handleExited = _this.handleExited.bind(_assertThisInitialized(_this));
    _this.state = {
      contextValue: {
        isMounting: true
      },
      handleExited,
      firstRender: true
    };
    return _this;
  }
  var _proto = TransitionGroup2.prototype;
  _proto.componentDidMount = function componentDidMount() {
    this.mounted = true;
    this.setState({
      contextValue: {
        isMounting: false
      }
    });
  };
  _proto.componentWillUnmount = function componentWillUnmount() {
    this.mounted = false;
  };
  TransitionGroup2.getDerivedStateFromProps = function getDerivedStateFromProps(nextProps, _ref) {
    var prevChildMapping = _ref.children, handleExited = _ref.handleExited, firstRender = _ref.firstRender;
    return {
      children: firstRender ? getInitialChildMapping(nextProps, handleExited) : getNextChildMapping(nextProps, prevChildMapping, handleExited),
      firstRender: false
    };
  };
  _proto.handleExited = function handleExited(child, node) {
    var currentChildMapping = getChildMapping(this.props.children);
    if (child.key in currentChildMapping)
      return;
    if (child.props.onExited) {
      child.props.onExited(node);
    }
    if (this.mounted) {
      this.setState(function(state) {
        var children = _extends({}, state.children);
        delete children[child.key];
        return {
          children
        };
      });
    }
  };
  _proto.render = function render() {
    var _this$props = this.props, Component2 = _this$props.component, childFactory2 = _this$props.childFactory, props = _objectWithoutPropertiesLoose(_this$props, ["component", "childFactory"]);
    var contextValue = this.state.contextValue;
    var children = values(this.state.children).map(childFactory2);
    delete props.appear;
    delete props.enter;
    delete props.exit;
    if (Component2 === null) {
      return /* @__PURE__ */ React6.createElement(TransitionGroupContext_default.Provider, {
        value: contextValue
      }, children);
    }
    return /* @__PURE__ */ React6.createElement(TransitionGroupContext_default.Provider, {
      value: contextValue
    }, /* @__PURE__ */ React6.createElement(Component2, props, children));
  };
  return TransitionGroup2;
}(React6.Component);
TransitionGroup.propTypes = process.env.NODE_ENV !== "production" ? {
  /**
   * `<TransitionGroup>` renders a `<div>` by default. You can change this
   * behavior by providing a `component` prop.
   * If you use React v16+ and would like to avoid a wrapping `<div>` element
   * you can pass in `component={null}`. This is useful if the wrapping div
   * borks your css styles.
   */
  component: import_prop_types4.default.any,
  /**
   * A set of `<Transition>` components, that are toggled `in` and out as they
   * leave. the `<TransitionGroup>` will inject specific transition props, so
   * remember to spread them through if you are wrapping the `<Transition>` as
   * with our `<Fade>` example.
   *
   * While this component is meant for multiple `Transition` or `CSSTransition`
   * children, sometimes you may want to have a single transition child with
   * content that you want to be transitioned out and in when you change it
   * (e.g. routes, images etc.) In that case you can change the `key` prop of
   * the transition child as you change its content, this will cause
   * `TransitionGroup` to transition the child out and back in.
   */
  children: import_prop_types4.default.node,
  /**
   * A convenience prop that enables or disables appear animations
   * for all children. Note that specifying this will override any defaults set
   * on individual children Transitions.
   */
  appear: import_prop_types4.default.bool,
  /**
   * A convenience prop that enables or disables enter animations
   * for all children. Note that specifying this will override any defaults set
   * on individual children Transitions.
   */
  enter: import_prop_types4.default.bool,
  /**
   * A convenience prop that enables or disables exit animations
   * for all children. Note that specifying this will override any defaults set
   * on individual children Transitions.
   */
  exit: import_prop_types4.default.bool,
  /**
   * You may need to apply reactive updates to a child as it is exiting.
   * This is generally done by using `cloneElement` however in the case of an exiting
   * child the element has already been removed and not accessible to the consumer.
   *
   * If you do need to update a child as it leaves you can provide a `childFactory`
   * to wrap every child, even the ones that are leaving.
   *
   * @type Function(child: ReactElement) -> ReactElement
   */
  childFactory: import_prop_types4.default.func
} : {};
TransitionGroup.defaultProps = defaultProps;
var TransitionGroup_default = TransitionGroup;

// ../../../node_modules/@blueprintjs/core/lib/esm/components/portal/portal.js
import * as React7 from "react";
import * as ReactDOM2 from "react-dom";
var REACT_CONTEXT_TYPES = {
  blueprintPortalClassName: function(obj, key) {
    if (obj[key] != null && typeof obj[key] !== "string") {
      return new Error(PORTAL_CONTEXT_CLASS_NAME_STRING);
    }
    return void 0;
  }
};
var Portal = (
  /** @class */
  function(_super) {
    __extends(Portal2, _super);
    function Portal2() {
      var _this = _super !== null && _super.apply(this, arguments) || this;
      _this.context = {};
      _this.state = { hasMounted: false };
      _this.portalElement = null;
      return _this;
    }
    Portal2.prototype.render = function() {
      if (typeof document === "undefined" || !this.state.hasMounted || this.portalElement === null) {
        return null;
      } else {
        return ReactDOM2.createPortal(this.props.children, this.portalElement);
      }
    };
    Portal2.prototype.componentDidMount = function() {
      if (this.props.container == null) {
        return;
      }
      this.portalElement = this.createContainerElement();
      this.props.container.appendChild(this.portalElement);
      this.addStopPropagationListeners(this.props.stopPropagationEvents);
      this.setState({ hasMounted: true }, this.props.onChildrenMount);
    };
    Portal2.prototype.componentDidUpdate = function(prevProps) {
      if (this.portalElement != null && prevProps.className !== this.props.className) {
        maybeRemoveClass(this.portalElement.classList, prevProps.className);
        maybeAddClass(this.portalElement.classList, this.props.className);
      }
      if (this.portalElement != null && prevProps.stopPropagationEvents !== this.props.stopPropagationEvents) {
        this.removeStopPropagationListeners(prevProps.stopPropagationEvents);
        this.addStopPropagationListeners(this.props.stopPropagationEvents);
      }
    };
    Portal2.prototype.componentWillUnmount = function() {
      var _a2;
      this.removeStopPropagationListeners(this.props.stopPropagationEvents);
      (_a2 = this.portalElement) === null || _a2 === void 0 ? void 0 : _a2.remove();
    };
    Portal2.prototype.createContainerElement = function() {
      var container = document.createElement("div");
      container.classList.add(PORTAL);
      maybeAddClass(container.classList, this.props.className);
      if (this.context != null) {
        maybeAddClass(container.classList, this.context.blueprintPortalClassName);
      }
      return container;
    };
    Portal2.prototype.addStopPropagationListeners = function(eventNames) {
      var _this = this;
      eventNames === null || eventNames === void 0 ? void 0 : eventNames.forEach(function(event) {
        var _a2;
        return (_a2 = _this.portalElement) === null || _a2 === void 0 ? void 0 : _a2.addEventListener(event, handleStopProgation);
      });
    };
    Portal2.prototype.removeStopPropagationListeners = function(events2) {
      var _this = this;
      events2 === null || events2 === void 0 ? void 0 : events2.forEach(function(event) {
        var _a2;
        return (_a2 = _this.portalElement) === null || _a2 === void 0 ? void 0 : _a2.removeEventListener(event, handleStopProgation);
      });
    };
    Portal2.displayName = "".concat(DISPLAYNAME_PREFIX, ".Portal");
    Portal2.contextTypes = REACT_CONTEXT_TYPES;
    Portal2.defaultProps = {
      container: typeof document !== "undefined" ? document.body : void 0
    };
    return Portal2;
  }(React7.Component)
);
function maybeRemoveClass(classList, className) {
  if (className != null && className !== "") {
    classList.remove.apply(classList, className.split(" "));
  }
}
function maybeAddClass(classList, className) {
  if (className != null && className !== "") {
    classList.add.apply(classList, className.split(" "));
  }
}
function handleStopProgation(e) {
  e.stopPropagation();
}

// ../../../node_modules/@blueprintjs/core/lib/esm/components/overlay/overlay.js
var Overlay = (
  /** @class */
  function(_super) {
    __extends(Overlay2, _super);
    function Overlay2() {
      var _this = _super !== null && _super.apply(this, arguments) || this;
      _this.isAutoFocusing = false;
      _this.state = {
        hasEverOpened: _this.props.isOpen
      };
      _this.containerElement = null;
      _this.startFocusTrapElement = null;
      _this.endFocusTrapElement = null;
      _this.refHandlers = {
        // HACKHACK: see https://github.com/palantir/blueprint/issues/3979
        /* eslint-disable-next-line react/no-find-dom-node */
        container: function(ref) {
          return _this.containerElement = findDOMNode(ref);
        },
        endFocusTrap: function(ref) {
          return _this.endFocusTrapElement = ref;
        },
        startFocusTrap: function(ref) {
          return _this.startFocusTrapElement = ref;
        }
      };
      _this.maybeRenderChild = function(child) {
        if (isFunction(child)) {
          child = child();
        }
        if (child == null) {
          return null;
        }
        var decoratedChild = typeof child === "object" ? React8.cloneElement(child, {
          className: (0, import_classnames.default)(child.props.className, classes_exports.OVERLAY_CONTENT)
        }) : React8.createElement("span", { className: classes_exports.OVERLAY_CONTENT }, child);
        var _a2 = _this.props, onOpening = _a2.onOpening, onOpened = _a2.onOpened, onClosing = _a2.onClosing, transitionDuration = _a2.transitionDuration, transitionName = _a2.transitionName;
        return React8.createElement(CSSTransition_default, { classNames: transitionName, onEntering: onOpening, onEntered: onOpened, onExiting: onClosing, onExited: _this.handleTransitionExited, timeout: transitionDuration, addEndListener: _this.handleTransitionAddEnd }, decoratedChild);
      };
      _this.handleStartFocusTrapElementFocus = function(e) {
        var _a2;
        if (!_this.props.enforceFocus || _this.isAutoFocusing) {
          return;
        }
        if (e.relatedTarget != null && _this.containerElement.contains(e.relatedTarget) && e.relatedTarget !== _this.endFocusTrapElement) {
          (_a2 = _this.endFocusTrapElement) === null || _a2 === void 0 ? void 0 : _a2.focus({ preventScroll: true });
        }
      };
      _this.handleStartFocusTrapElementKeyDown = function(e) {
        var _a2;
        if (!_this.props.enforceFocus) {
          return;
        }
        if (e.shiftKey && e.which === keys_exports.TAB) {
          var lastFocusableElement = _this.getKeyboardFocusableElements().pop();
          if (lastFocusableElement != null) {
            lastFocusableElement.focus();
          } else {
            (_a2 = _this.endFocusTrapElement) === null || _a2 === void 0 ? void 0 : _a2.focus({ preventScroll: true });
          }
        }
      };
      _this.handleEndFocusTrapElementFocus = function(e) {
        var _a2, _b2;
        if (e.relatedTarget != null && _this.containerElement.contains(e.relatedTarget) && e.relatedTarget !== _this.startFocusTrapElement) {
          var firstFocusableElement = _this.getKeyboardFocusableElements().shift();
          if (!_this.isAutoFocusing && firstFocusableElement != null && firstFocusableElement !== e.relatedTarget) {
            firstFocusableElement.focus();
          } else {
            (_a2 = _this.startFocusTrapElement) === null || _a2 === void 0 ? void 0 : _a2.focus({ preventScroll: true });
          }
        } else {
          var lastFocusableElement = _this.getKeyboardFocusableElements().pop();
          if (lastFocusableElement != null) {
            lastFocusableElement.focus();
          } else {
            (_b2 = _this.startFocusTrapElement) === null || _b2 === void 0 ? void 0 : _b2.focus({ preventScroll: true });
          }
        }
      };
      _this.handleTransitionExited = function(node) {
        var _a2, _b2;
        if (_this.props.shouldReturnFocusOnClose && _this.lastActiveElementBeforeOpened instanceof HTMLElement) {
          _this.lastActiveElementBeforeOpened.focus();
        }
        (_b2 = (_a2 = _this.props).onClosed) === null || _b2 === void 0 ? void 0 : _b2.call(_a2, node);
      };
      _this.handleBackdropMouseDown = function(e) {
        var _a2;
        var _b2 = _this.props, backdropProps = _b2.backdropProps, canOutsideClickClose = _b2.canOutsideClickClose, enforceFocus = _b2.enforceFocus, onClose = _b2.onClose;
        if (canOutsideClickClose) {
          onClose === null || onClose === void 0 ? void 0 : onClose(e);
        }
        if (enforceFocus) {
          _this.bringFocusInsideOverlay();
        }
        (_a2 = backdropProps === null || backdropProps === void 0 ? void 0 : backdropProps.onMouseDown) === null || _a2 === void 0 ? void 0 : _a2.call(backdropProps, e);
      };
      _this.handleDocumentClick = function(e) {
        var _a2 = _this.props, canOutsideClickClose = _a2.canOutsideClickClose, isOpen = _a2.isOpen, onClose = _a2.onClose;
        var eventTarget = e.composed ? e.composedPath()[0] : e.target;
        var stackIndex = Overlay2.openStack.indexOf(_this);
        var isClickInThisOverlayOrDescendant = Overlay2.openStack.slice(stackIndex).some(function(_a3) {
          var elem = _a3.containerElement;
          return elem && elem.contains(eventTarget) && !elem.isSameNode(eventTarget);
        });
        if (isOpen && !isClickInThisOverlayOrDescendant && canOutsideClickClose) {
          onClose === null || onClose === void 0 ? void 0 : onClose(e);
        }
      };
      _this.handleDocumentFocus = function(e) {
        var eventTarget = e.composed ? e.composedPath()[0] : e.target;
        if (_this.props.enforceFocus && _this.containerElement != null && eventTarget instanceof Node && !_this.containerElement.contains(eventTarget)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          _this.bringFocusInsideOverlay();
        }
      };
      _this.handleKeyDown = function(e) {
        var _a2 = _this.props, canEscapeKeyClose = _a2.canEscapeKeyClose, onClose = _a2.onClose;
        if (e.key === "Escape" && canEscapeKeyClose) {
          onClose === null || onClose === void 0 ? void 0 : onClose(e);
          e.stopPropagation();
          e.preventDefault();
        }
      };
      _this.handleTransitionAddEnd = function() {
      };
      return _this;
    }
    Overlay2.getDerivedStateFromProps = function(_a2) {
      var hasEverOpened = _a2.isOpen;
      if (hasEverOpened) {
        return { hasEverOpened };
      }
      return null;
    };
    Overlay2.prototype.render = function() {
      var _a2;
      var _b2;
      if (this.props.lazy && !this.state.hasEverOpened) {
        return null;
      }
      var _c2 = this.props, autoFocus = _c2.autoFocus, children = _c2.children, className = _c2.className, enforceFocus = _c2.enforceFocus, usePortal = _c2.usePortal, isOpen = _c2.isOpen;
      var childrenWithTransitions = isOpen ? (_b2 = React8.Children.map(children, this.maybeRenderChild)) !== null && _b2 !== void 0 ? _b2 : [] : [];
      var maybeBackdrop = this.maybeRenderBackdrop();
      if (maybeBackdrop !== null) {
        childrenWithTransitions.unshift(maybeBackdrop);
      }
      if (isOpen && (autoFocus || enforceFocus) && childrenWithTransitions.length > 0) {
        childrenWithTransitions.unshift(this.renderDummyElement("__start", {
          className: classes_exports.OVERLAY_START_FOCUS_TRAP,
          onFocus: this.handleStartFocusTrapElementFocus,
          onKeyDown: this.handleStartFocusTrapElementKeyDown,
          ref: this.refHandlers.startFocusTrap
        }));
        if (enforceFocus) {
          childrenWithTransitions.push(this.renderDummyElement("__end", {
            className: classes_exports.OVERLAY_END_FOCUS_TRAP,
            onFocus: this.handleEndFocusTrapElementFocus,
            ref: this.refHandlers.endFocusTrap
          }));
        }
      }
      var containerClasses = (0, import_classnames.default)(classes_exports.OVERLAY, (_a2 = {}, _a2[classes_exports.OVERLAY_OPEN] = isOpen, _a2[classes_exports.OVERLAY_INLINE] = !usePortal, _a2), className);
      var transitionGroup = React8.createElement(TransitionGroup_default, { appear: true, "aria-live": "polite", className: containerClasses, component: "div", onKeyDown: this.handleKeyDown, ref: this.refHandlers.container }, childrenWithTransitions);
      if (usePortal) {
        return React8.createElement(Portal, { className: this.props.portalClassName, container: this.props.portalContainer, stopPropagationEvents: this.props.portalStopPropagationEvents }, transitionGroup);
      } else {
        return transitionGroup;
      }
    };
    Overlay2.prototype.componentDidMount = function() {
      if (this.props.isOpen) {
        this.overlayWillOpen();
      }
    };
    Overlay2.prototype.componentDidUpdate = function(prevProps) {
      if (prevProps.isOpen && !this.props.isOpen) {
        this.overlayWillClose();
      } else if (!prevProps.isOpen && this.props.isOpen) {
        this.overlayWillOpen();
      }
    };
    Overlay2.prototype.componentWillUnmount = function() {
      this.overlayWillClose();
    };
    Overlay2.prototype.bringFocusInsideOverlay = function() {
      var _this = this;
      return this.requestAnimationFrame(function() {
        var _a2;
        var activeElement = getActiveElement(_this.containerElement);
        if (_this.containerElement == null || activeElement == null || !_this.props.isOpen) {
          return;
        }
        var isFocusOutsideModal = !_this.containerElement.contains(activeElement);
        if (isFocusOutsideModal) {
          (_a2 = _this.startFocusTrapElement) === null || _a2 === void 0 ? void 0 : _a2.focus({ preventScroll: true });
          _this.isAutoFocusing = false;
        }
      });
    };
    Overlay2.prototype.maybeRenderBackdrop = function() {
      var _a2 = this.props, backdropClassName = _a2.backdropClassName, backdropProps = _a2.backdropProps, hasBackdrop = _a2.hasBackdrop, isOpen = _a2.isOpen, transitionDuration = _a2.transitionDuration, transitionName = _a2.transitionName;
      if (hasBackdrop && isOpen) {
        return React8.createElement(
          CSSTransition_default,
          { classNames: transitionName, key: "__backdrop", timeout: transitionDuration, addEndListener: this.handleTransitionAddEnd },
          React8.createElement("div", __assign({}, backdropProps, { className: (0, import_classnames.default)(classes_exports.OVERLAY_BACKDROP, backdropClassName, backdropProps === null || backdropProps === void 0 ? void 0 : backdropProps.className), onMouseDown: this.handleBackdropMouseDown }))
        );
      } else {
        return null;
      }
    };
    Overlay2.prototype.renderDummyElement = function(key, props) {
      var _a2 = this.props, transitionDuration = _a2.transitionDuration, transitionName = _a2.transitionName;
      return React8.createElement(
        CSSTransition_default,
        { classNames: transitionName, key, addEndListener: this.handleTransitionAddEnd, timeout: transitionDuration, unmountOnExit: true },
        React8.createElement("div", __assign({ tabIndex: 0 }, props))
      );
    };
    Overlay2.prototype.getKeyboardFocusableElements = function() {
      var focusableElements = this.containerElement !== null ? Array.from(
        // Order may not be correct if children elements use tabindex values > 0.
        // Selectors derived from this SO question:
        // https://stackoverflow.com/questions/1599660/which-html-elements-can-receive-focus
        this.containerElement.querySelectorAll([
          'a[href]:not([tabindex="-1"])',
          'button:not([disabled]):not([tabindex="-1"])',
          'details:not([tabindex="-1"])',
          'input:not([disabled]):not([tabindex="-1"])',
          'select:not([disabled]):not([tabindex="-1"])',
          'textarea:not([disabled]):not([tabindex="-1"])',
          '[tabindex]:not([tabindex="-1"])'
        ].join(","))
      ) : [];
      return focusableElements.filter(function(el) {
        return !el.classList.contains(classes_exports.OVERLAY_START_FOCUS_TRAP) && !el.classList.contains(classes_exports.OVERLAY_END_FOCUS_TRAP);
      });
    };
    Overlay2.prototype.overlayWillClose = function() {
      document.removeEventListener(
        "focus",
        this.handleDocumentFocus,
        /* useCapture */
        true
      );
      document.removeEventListener("mousedown", this.handleDocumentClick);
      var openStack = Overlay2.openStack;
      var stackIndex = openStack.indexOf(this);
      if (stackIndex !== -1) {
        openStack.splice(stackIndex, 1);
        if (openStack.length > 0) {
          var lastOpenedOverlay = Overlay2.getLastOpened();
          if (lastOpenedOverlay.props.autoFocus && lastOpenedOverlay.props.enforceFocus) {
            lastOpenedOverlay.bringFocusInsideOverlay();
            document.addEventListener(
              "focus",
              lastOpenedOverlay.handleDocumentFocus,
              /* useCapture */
              true
            );
          }
        }
        if (openStack.filter(function(o) {
          return o.props.usePortal && o.props.hasBackdrop;
        }).length === 0) {
          document.body.classList.remove(classes_exports.OVERLAY_OPEN);
        }
      }
    };
    Overlay2.prototype.overlayWillOpen = function() {
      var getLastOpened = Overlay2.getLastOpened, openStack = Overlay2.openStack;
      if (openStack.length > 0) {
        document.removeEventListener(
          "focus",
          getLastOpened().handleDocumentFocus,
          /* useCapture */
          true
        );
      }
      openStack.push(this);
      if (this.props.autoFocus) {
        this.isAutoFocusing = true;
        this.bringFocusInsideOverlay();
      }
      if (this.props.enforceFocus) {
        document.addEventListener(
          "focus",
          this.handleDocumentFocus,
          /* useCapture */
          true
        );
      }
      if (this.props.canOutsideClickClose && !this.props.hasBackdrop) {
        document.addEventListener("mousedown", this.handleDocumentClick);
      }
      if (this.props.hasBackdrop && this.props.usePortal) {
        document.body.classList.add(classes_exports.OVERLAY_OPEN);
      }
      this.lastActiveElementBeforeOpened = getActiveElement(this.containerElement);
    };
    Overlay2.displayName = "".concat(DISPLAYNAME_PREFIX, ".Overlay");
    Overlay2.defaultProps = {
      autoFocus: true,
      backdropProps: {},
      canEscapeKeyClose: true,
      canOutsideClickClose: true,
      enforceFocus: true,
      hasBackdrop: true,
      isOpen: false,
      lazy: true,
      shouldReturnFocusOnClose: true,
      transitionDuration: 300,
      transitionName: classes_exports.OVERLAY,
      usePortal: true
    };
    Overlay2.openStack = [];
    Overlay2.getLastOpened = function() {
      return Overlay2.openStack[Overlay2.openStack.length - 1];
    };
    return Overlay2;
  }(AbstractPureComponent2)
);

// ../../../node_modules/@juggle/resize-observer/lib/utils/resizeObservers.js
var resizeObservers = [];

// ../../../node_modules/@juggle/resize-observer/lib/algorithms/hasActiveObservations.js
var hasActiveObservations = function() {
  return resizeObservers.some(function(ro) {
    return ro.activeTargets.length > 0;
  });
};

// ../../../node_modules/@juggle/resize-observer/lib/algorithms/hasSkippedObservations.js
var hasSkippedObservations = function() {
  return resizeObservers.some(function(ro) {
    return ro.skippedTargets.length > 0;
  });
};

// ../../../node_modules/@juggle/resize-observer/lib/algorithms/deliverResizeLoopError.js
var msg = "ResizeObserver loop completed with undelivered notifications.";
var deliverResizeLoopError = function() {
  var event;
  if (typeof ErrorEvent === "function") {
    event = new ErrorEvent("error", {
      message: msg
    });
  } else {
    event = document.createEvent("Event");
    event.initEvent("error", false, false);
    event.message = msg;
  }
  window.dispatchEvent(event);
};

// ../../../node_modules/@juggle/resize-observer/lib/ResizeObserverBoxOptions.js
var ResizeObserverBoxOptions;
(function(ResizeObserverBoxOptions2) {
  ResizeObserverBoxOptions2["BORDER_BOX"] = "border-box";
  ResizeObserverBoxOptions2["CONTENT_BOX"] = "content-box";
  ResizeObserverBoxOptions2["DEVICE_PIXEL_CONTENT_BOX"] = "device-pixel-content-box";
})(ResizeObserverBoxOptions || (ResizeObserverBoxOptions = {}));

// ../../../node_modules/@juggle/resize-observer/lib/utils/freeze.js
var freeze = function(obj) {
  return Object.freeze(obj);
};

// ../../../node_modules/@juggle/resize-observer/lib/ResizeObserverSize.js
var ResizeObserverSize = function() {
  function ResizeObserverSize2(inlineSize, blockSize) {
    this.inlineSize = inlineSize;
    this.blockSize = blockSize;
    freeze(this);
  }
  return ResizeObserverSize2;
}();

// ../../../node_modules/@juggle/resize-observer/lib/DOMRectReadOnly.js
var DOMRectReadOnly = function() {
  function DOMRectReadOnly2(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.top = this.y;
    this.left = this.x;
    this.bottom = this.top + this.height;
    this.right = this.left + this.width;
    return freeze(this);
  }
  DOMRectReadOnly2.prototype.toJSON = function() {
    var _a2 = this, x = _a2.x, y = _a2.y, top2 = _a2.top, right2 = _a2.right, bottom2 = _a2.bottom, left2 = _a2.left, width = _a2.width, height = _a2.height;
    return { x, y, top: top2, right: right2, bottom: bottom2, left: left2, width, height };
  };
  DOMRectReadOnly2.fromRect = function(rectangle) {
    return new DOMRectReadOnly2(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  };
  return DOMRectReadOnly2;
}();

// ../../../node_modules/@juggle/resize-observer/lib/utils/element.js
var isSVG = function(target) {
  return target instanceof SVGElement && "getBBox" in target;
};
var isHidden = function(target) {
  if (isSVG(target)) {
    var _a2 = target.getBBox(), width = _a2.width, height = _a2.height;
    return !width && !height;
  }
  var _b2 = target, offsetWidth = _b2.offsetWidth, offsetHeight = _b2.offsetHeight;
  return !(offsetWidth || offsetHeight || target.getClientRects().length);
};
var isElement = function(obj) {
  var _a2;
  if (obj instanceof Element) {
    return true;
  }
  var scope = (_a2 = obj === null || obj === void 0 ? void 0 : obj.ownerDocument) === null || _a2 === void 0 ? void 0 : _a2.defaultView;
  return !!(scope && obj instanceof scope.Element);
};
var isReplacedElement = function(target) {
  switch (target.tagName) {
    case "INPUT":
      if (target.type !== "image") {
        break;
      }
    case "VIDEO":
    case "AUDIO":
    case "EMBED":
    case "OBJECT":
    case "CANVAS":
    case "IFRAME":
    case "IMG":
      return true;
  }
  return false;
};

// ../../../node_modules/@juggle/resize-observer/lib/utils/global.js
var global = typeof window !== "undefined" ? window : {};

// ../../../node_modules/@juggle/resize-observer/lib/algorithms/calculateBoxSize.js
var cache = /* @__PURE__ */ new WeakMap();
var scrollRegexp = /auto|scroll/;
var verticalRegexp = /^tb|vertical/;
var IE = /msie|trident/i.test(global.navigator && global.navigator.userAgent);
var parseDimension = function(pixel) {
  return parseFloat(pixel || "0");
};
var size = function(inlineSize, blockSize, switchSizes) {
  if (inlineSize === void 0) {
    inlineSize = 0;
  }
  if (blockSize === void 0) {
    blockSize = 0;
  }
  if (switchSizes === void 0) {
    switchSizes = false;
  }
  return new ResizeObserverSize((switchSizes ? blockSize : inlineSize) || 0, (switchSizes ? inlineSize : blockSize) || 0);
};
var zeroBoxes = freeze({
  devicePixelContentBoxSize: size(),
  borderBoxSize: size(),
  contentBoxSize: size(),
  contentRect: new DOMRectReadOnly(0, 0, 0, 0)
});
var calculateBoxSizes = function(target, forceRecalculation) {
  if (forceRecalculation === void 0) {
    forceRecalculation = false;
  }
  if (cache.has(target) && !forceRecalculation) {
    return cache.get(target);
  }
  if (isHidden(target)) {
    cache.set(target, zeroBoxes);
    return zeroBoxes;
  }
  var cs = getComputedStyle(target);
  var svg = isSVG(target) && target.ownerSVGElement && target.getBBox();
  var removePadding = !IE && cs.boxSizing === "border-box";
  var switchSizes = verticalRegexp.test(cs.writingMode || "");
  var canScrollVertically = !svg && scrollRegexp.test(cs.overflowY || "");
  var canScrollHorizontally = !svg && scrollRegexp.test(cs.overflowX || "");
  var paddingTop = svg ? 0 : parseDimension(cs.paddingTop);
  var paddingRight = svg ? 0 : parseDimension(cs.paddingRight);
  var paddingBottom = svg ? 0 : parseDimension(cs.paddingBottom);
  var paddingLeft = svg ? 0 : parseDimension(cs.paddingLeft);
  var borderTop = svg ? 0 : parseDimension(cs.borderTopWidth);
  var borderRight = svg ? 0 : parseDimension(cs.borderRightWidth);
  var borderBottom = svg ? 0 : parseDimension(cs.borderBottomWidth);
  var borderLeft = svg ? 0 : parseDimension(cs.borderLeftWidth);
  var horizontalPadding = paddingLeft + paddingRight;
  var verticalPadding = paddingTop + paddingBottom;
  var horizontalBorderArea = borderLeft + borderRight;
  var verticalBorderArea = borderTop + borderBottom;
  var horizontalScrollbarThickness = !canScrollHorizontally ? 0 : target.offsetHeight - verticalBorderArea - target.clientHeight;
  var verticalScrollbarThickness = !canScrollVertically ? 0 : target.offsetWidth - horizontalBorderArea - target.clientWidth;
  var widthReduction = removePadding ? horizontalPadding + horizontalBorderArea : 0;
  var heightReduction = removePadding ? verticalPadding + verticalBorderArea : 0;
  var contentWidth = svg ? svg.width : parseDimension(cs.width) - widthReduction - verticalScrollbarThickness;
  var contentHeight = svg ? svg.height : parseDimension(cs.height) - heightReduction - horizontalScrollbarThickness;
  var borderBoxWidth = contentWidth + horizontalPadding + verticalScrollbarThickness + horizontalBorderArea;
  var borderBoxHeight = contentHeight + verticalPadding + horizontalScrollbarThickness + verticalBorderArea;
  var boxes = freeze({
    devicePixelContentBoxSize: size(Math.round(contentWidth * devicePixelRatio), Math.round(contentHeight * devicePixelRatio), switchSizes),
    borderBoxSize: size(borderBoxWidth, borderBoxHeight, switchSizes),
    contentBoxSize: size(contentWidth, contentHeight, switchSizes),
    contentRect: new DOMRectReadOnly(paddingLeft, paddingTop, contentWidth, contentHeight)
  });
  cache.set(target, boxes);
  return boxes;
};
var calculateBoxSize = function(target, observedBox, forceRecalculation) {
  var _a2 = calculateBoxSizes(target, forceRecalculation), borderBoxSize = _a2.borderBoxSize, contentBoxSize = _a2.contentBoxSize, devicePixelContentBoxSize = _a2.devicePixelContentBoxSize;
  switch (observedBox) {
    case ResizeObserverBoxOptions.DEVICE_PIXEL_CONTENT_BOX:
      return devicePixelContentBoxSize;
    case ResizeObserverBoxOptions.BORDER_BOX:
      return borderBoxSize;
    default:
      return contentBoxSize;
  }
};

// ../../../node_modules/@juggle/resize-observer/lib/ResizeObserverEntry.js
var ResizeObserverEntry = function() {
  function ResizeObserverEntry2(target) {
    var boxes = calculateBoxSizes(target);
    this.target = target;
    this.contentRect = boxes.contentRect;
    this.borderBoxSize = freeze([boxes.borderBoxSize]);
    this.contentBoxSize = freeze([boxes.contentBoxSize]);
    this.devicePixelContentBoxSize = freeze([boxes.devicePixelContentBoxSize]);
  }
  return ResizeObserverEntry2;
}();

// ../../../node_modules/@juggle/resize-observer/lib/algorithms/calculateDepthForNode.js
var calculateDepthForNode = function(node) {
  if (isHidden(node)) {
    return Infinity;
  }
  var depth = 0;
  var parent = node.parentNode;
  while (parent) {
    depth += 1;
    parent = parent.parentNode;
  }
  return depth;
};

// ../../../node_modules/@juggle/resize-observer/lib/algorithms/broadcastActiveObservations.js
var broadcastActiveObservations = function() {
  var shallowestDepth = Infinity;
  var callbacks2 = [];
  resizeObservers.forEach(function processObserver(ro) {
    if (ro.activeTargets.length === 0) {
      return;
    }
    var entries = [];
    ro.activeTargets.forEach(function processTarget(ot) {
      var entry = new ResizeObserverEntry(ot.target);
      var targetDepth = calculateDepthForNode(ot.target);
      entries.push(entry);
      ot.lastReportedSize = calculateBoxSize(ot.target, ot.observedBox);
      if (targetDepth < shallowestDepth) {
        shallowestDepth = targetDepth;
      }
    });
    callbacks2.push(function resizeObserverCallback() {
      ro.callback.call(ro.observer, entries, ro.observer);
    });
    ro.activeTargets.splice(0, ro.activeTargets.length);
  });
  for (var _i = 0, callbacks_1 = callbacks2; _i < callbacks_1.length; _i++) {
    var callback = callbacks_1[_i];
    callback();
  }
  return shallowestDepth;
};

// ../../../node_modules/@juggle/resize-observer/lib/algorithms/gatherActiveObservationsAtDepth.js
var gatherActiveObservationsAtDepth = function(depth) {
  resizeObservers.forEach(function processObserver(ro) {
    ro.activeTargets.splice(0, ro.activeTargets.length);
    ro.skippedTargets.splice(0, ro.skippedTargets.length);
    ro.observationTargets.forEach(function processTarget(ot) {
      if (ot.isActive()) {
        if (calculateDepthForNode(ot.target) > depth) {
          ro.activeTargets.push(ot);
        } else {
          ro.skippedTargets.push(ot);
        }
      }
    });
  });
};

// ../../../node_modules/@juggle/resize-observer/lib/utils/process.js
var process2 = function() {
  var depth = 0;
  gatherActiveObservationsAtDepth(depth);
  while (hasActiveObservations()) {
    depth = broadcastActiveObservations();
    gatherActiveObservationsAtDepth(depth);
  }
  if (hasSkippedObservations()) {
    deliverResizeLoopError();
  }
  return depth > 0;
};

// ../../../node_modules/@juggle/resize-observer/lib/utils/queueMicroTask.js
var trigger;
var callbacks = [];
var notify = function() {
  return callbacks.splice(0).forEach(function(cb) {
    return cb();
  });
};
var queueMicroTask = function(callback) {
  if (!trigger) {
    var toggle_1 = 0;
    var el_1 = document.createTextNode("");
    var config = { characterData: true };
    new MutationObserver(function() {
      return notify();
    }).observe(el_1, config);
    trigger = function() {
      el_1.textContent = "".concat(toggle_1 ? toggle_1-- : toggle_1++);
    };
  }
  callbacks.push(callback);
  trigger();
};

// ../../../node_modules/@juggle/resize-observer/lib/utils/queueResizeObserver.js
var queueResizeObserver = function(cb) {
  queueMicroTask(function ResizeObserver2() {
    requestAnimationFrame(cb);
  });
};

// ../../../node_modules/@juggle/resize-observer/lib/utils/scheduler.js
var watching = 0;
var isWatching = function() {
  return !!watching;
};
var CATCH_PERIOD = 250;
var observerConfig = { attributes: true, characterData: true, childList: true, subtree: true };
var events = [
  "resize",
  "load",
  "transitionend",
  "animationend",
  "animationstart",
  "animationiteration",
  "keyup",
  "keydown",
  "mouseup",
  "mousedown",
  "mouseover",
  "mouseout",
  "blur",
  "focus"
];
var time = function(timeout2) {
  if (timeout2 === void 0) {
    timeout2 = 0;
  }
  return Date.now() + timeout2;
};
var scheduled = false;
var Scheduler = function() {
  function Scheduler2() {
    var _this = this;
    this.stopped = true;
    this.listener = function() {
      return _this.schedule();
    };
  }
  Scheduler2.prototype.run = function(timeout2) {
    var _this = this;
    if (timeout2 === void 0) {
      timeout2 = CATCH_PERIOD;
    }
    if (scheduled) {
      return;
    }
    scheduled = true;
    var until = time(timeout2);
    queueResizeObserver(function() {
      var elementsHaveResized = false;
      try {
        elementsHaveResized = process2();
      } finally {
        scheduled = false;
        timeout2 = until - time();
        if (!isWatching()) {
          return;
        }
        if (elementsHaveResized) {
          _this.run(1e3);
        } else if (timeout2 > 0) {
          _this.run(timeout2);
        } else {
          _this.start();
        }
      }
    });
  };
  Scheduler2.prototype.schedule = function() {
    this.stop();
    this.run();
  };
  Scheduler2.prototype.observe = function() {
    var _this = this;
    var cb = function() {
      return _this.observer && _this.observer.observe(document.body, observerConfig);
    };
    document.body ? cb() : global.addEventListener("DOMContentLoaded", cb);
  };
  Scheduler2.prototype.start = function() {
    var _this = this;
    if (this.stopped) {
      this.stopped = false;
      this.observer = new MutationObserver(this.listener);
      this.observe();
      events.forEach(function(name) {
        return global.addEventListener(name, _this.listener, true);
      });
    }
  };
  Scheduler2.prototype.stop = function() {
    var _this = this;
    if (!this.stopped) {
      this.observer && this.observer.disconnect();
      events.forEach(function(name) {
        return global.removeEventListener(name, _this.listener, true);
      });
      this.stopped = true;
    }
  };
  return Scheduler2;
}();
var scheduler = new Scheduler();
var updateCount = function(n) {
  !watching && n > 0 && scheduler.start();
  watching += n;
  !watching && scheduler.stop();
};

// ../../../node_modules/@juggle/resize-observer/lib/ResizeObservation.js
var skipNotifyOnElement = function(target) {
  return !isSVG(target) && !isReplacedElement(target) && getComputedStyle(target).display === "inline";
};
var ResizeObservation = function() {
  function ResizeObservation2(target, observedBox) {
    this.target = target;
    this.observedBox = observedBox || ResizeObserverBoxOptions.CONTENT_BOX;
    this.lastReportedSize = {
      inlineSize: 0,
      blockSize: 0
    };
  }
  ResizeObservation2.prototype.isActive = function() {
    var size2 = calculateBoxSize(this.target, this.observedBox, true);
    if (skipNotifyOnElement(this.target)) {
      this.lastReportedSize = size2;
    }
    if (this.lastReportedSize.inlineSize !== size2.inlineSize || this.lastReportedSize.blockSize !== size2.blockSize) {
      return true;
    }
    return false;
  };
  return ResizeObservation2;
}();

// ../../../node_modules/@juggle/resize-observer/lib/ResizeObserverDetail.js
var ResizeObserverDetail = function() {
  function ResizeObserverDetail2(resizeObserver, callback) {
    this.activeTargets = [];
    this.skippedTargets = [];
    this.observationTargets = [];
    this.observer = resizeObserver;
    this.callback = callback;
  }
  return ResizeObserverDetail2;
}();

// ../../../node_modules/@juggle/resize-observer/lib/ResizeObserverController.js
var observerMap = /* @__PURE__ */ new WeakMap();
var getObservationIndex = function(observationTargets, target) {
  for (var i = 0; i < observationTargets.length; i += 1) {
    if (observationTargets[i].target === target) {
      return i;
    }
  }
  return -1;
};
var ResizeObserverController = function() {
  function ResizeObserverController2() {
  }
  ResizeObserverController2.connect = function(resizeObserver, callback) {
    var detail = new ResizeObserverDetail(resizeObserver, callback);
    observerMap.set(resizeObserver, detail);
  };
  ResizeObserverController2.observe = function(resizeObserver, target, options) {
    var detail = observerMap.get(resizeObserver);
    var firstObservation = detail.observationTargets.length === 0;
    if (getObservationIndex(detail.observationTargets, target) < 0) {
      firstObservation && resizeObservers.push(detail);
      detail.observationTargets.push(new ResizeObservation(target, options && options.box));
      updateCount(1);
      scheduler.schedule();
    }
  };
  ResizeObserverController2.unobserve = function(resizeObserver, target) {
    var detail = observerMap.get(resizeObserver);
    var index = getObservationIndex(detail.observationTargets, target);
    var lastObservation = detail.observationTargets.length === 1;
    if (index >= 0) {
      lastObservation && resizeObservers.splice(resizeObservers.indexOf(detail), 1);
      detail.observationTargets.splice(index, 1);
      updateCount(-1);
    }
  };
  ResizeObserverController2.disconnect = function(resizeObserver) {
    var _this = this;
    var detail = observerMap.get(resizeObserver);
    detail.observationTargets.slice().forEach(function(ot) {
      return _this.unobserve(resizeObserver, ot.target);
    });
    detail.activeTargets.splice(0, detail.activeTargets.length);
  };
  return ResizeObserverController2;
}();

// ../../../node_modules/@juggle/resize-observer/lib/ResizeObserver.js
var ResizeObserver = function() {
  function ResizeObserver2(callback) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to construct 'ResizeObserver': 1 argument required, but only 0 present.");
    }
    if (typeof callback !== "function") {
      throw new TypeError("Failed to construct 'ResizeObserver': The callback provided as parameter 1 is not a function.");
    }
    ResizeObserverController.connect(this, callback);
  }
  ResizeObserver2.prototype.observe = function(target, options) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': 1 argument required, but only 0 present.");
    }
    if (!isElement(target)) {
      throw new TypeError("Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not of type 'Element");
    }
    ResizeObserverController.observe(this, target, options);
  };
  ResizeObserver2.prototype.unobserve = function(target) {
    if (arguments.length === 0) {
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': 1 argument required, but only 0 present.");
    }
    if (!isElement(target)) {
      throw new TypeError("Failed to execute 'unobserve' on 'ResizeObserver': parameter 1 is not of type 'Element");
    }
    ResizeObserverController.unobserve(this, target);
  };
  ResizeObserver2.prototype.disconnect = function() {
    ResizeObserverController.disconnect(this);
  };
  ResizeObserver2.toString = function() {
    return "function ResizeObserver () { [polyfill code] }";
  };
  return ResizeObserver2;
}();

// ../../../node_modules/@blueprintjs/core/lib/esm/components/popover/popoverSharedProps.js
var PopoverPosition = __assign(__assign({}, Position), { AUTO: "auto", AUTO_END: "auto-end", AUTO_START: "auto-start" });

// ../../../node_modules/@blueprintjs/popover2/lib/esm/classes.js
var NS2 = classes_exports.getClassNamespace();
var CONTEXT_MENU2 = "".concat(NS2, "-context-menu2");
var CONTEXT_MENU2_VIRTUAL_TARGET = "".concat(CONTEXT_MENU2, "-virtual-target");
var CONTEXT_MENU2_POPOVER2 = "".concat(CONTEXT_MENU2, "-popover2");
var CONTEXT_MENU2_BACKDROP = "".concat(CONTEXT_MENU2, "-backdrop");
var POPOVER2 = "".concat(NS2, "-popover2");
var POPOVER2_ARROW = "".concat(POPOVER2, "-arrow");
var POPOVER2_BACKDROP = "".concat(POPOVER2, "-backdrop");
var POPOVER2_CAPTURING_DISMISS = "".concat(POPOVER2, "-capturing-dismiss");
var POPOVER2_CONTENT = "".concat(POPOVER2, "-content");
var POPOVER2_CONTENT_PLACEMENT = "".concat(POPOVER2, "-placement");
var POPOVER2_CONTENT_SIZING = "".concat(POPOVER2_CONTENT, "-sizing");
var POPOVER2_DISMISS = "".concat(POPOVER2, "-dismiss");
var POPOVER2_DISMISS_OVERRIDE = "".concat(POPOVER2_DISMISS, "-override");
var POPOVER2_MATCH_TARGET_WIDTH = "".concat(POPOVER2, "-match-target-width");
var POPOVER2_OPEN = "".concat(POPOVER2, "-open");
var POPOVER2_POPPER_ESCAPED = "".concat(POPOVER2, "-popper-escaped");
var POPOVER2_REFERENCE_HIDDEN = "".concat(POPOVER2, "-reference-hidden");
var POPOVER2_TARGET = "".concat(POPOVER2, "-target");
var POPOVER2_TRANSITION_CONTAINER = "".concat(POPOVER2, "-transition-container");
var TOOLTIP2 = "".concat(NS2, "-tooltip2");
var TOOLTIP2_INDICATOR = "".concat(TOOLTIP2, "-indicator");

// ../../../node_modules/@blueprintjs/popover2/lib/esm/errors.js
var ns2 = "[Blueprint]";
var POPOVER2_REQUIRES_TARGET = "".concat(ns2, " <Popover2> requires renderTarget prop or a child element.");
var POPOVER2_HAS_BACKDROP_INTERACTION = "".concat(ns2, ' <Popover2 hasBackdrop={true}> requires interactionKind="click".');
var POPOVER2_WARN_TOO_MANY_CHILDREN = "".concat(ns2, " <Popover2> supports only one child which is rendered as its target; additional children are ignored.");
var POPOVER2_WARN_DOUBLE_TARGET = ns2 + " <Popover2> with children ignores renderTarget prop; use either prop or children.";
var POPOVER2_WARN_EMPTY_CONTENT = ns2 + " Disabling <Popover2> with empty/whitespace content...";
var POPOVER2_WARN_HAS_BACKDROP_INLINE = ns2 + " <Popover2 usePortal={false}> ignores hasBackdrop";
var POPOVER2_WARN_PLACEMENT_AND_POSITION_MUTEX = ns2 + " <Popover2> supports either placement or position prop, not both.";
var POPOVER2_WARN_UNCONTROLLED_ONINTERACTION = ns2 + " <Popover2> onInteraction is ignored when uncontrolled.";
var POPOVER2_WARN_TARGET_PROPS_WITH_RENDER_TARGET = ns2 + " <Popover2> targetProps value is ignored when renderTarget API is used.";

// ../../../node_modules/@blueprintjs/popover2/node_modules/tslib/tslib.es6.mjs
var extendStatics2 = function(d, b) {
  extendStatics2 = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2)
      if (Object.prototype.hasOwnProperty.call(b2, p))
        d2[p] = b2[p];
  };
  return extendStatics2(d, b);
};
function __extends2(d, b) {
  if (typeof b !== "function" && b !== null)
    throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics2(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign3 = function() {
  __assign3 = Object.assign || function __assign4(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign3.apply(this, arguments);
};
function __rest(s, e) {
  var t = {};
  for (var p in s)
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
}

// ../../../node_modules/@blueprintjs/popover2/lib/esm/popover2.js
var import_classnames3 = __toESM(require_classnames());
import * as React18 from "react";

// ../../../node_modules/react-popper/lib/esm/Popper.js
import * as React12 from "react";

// ../../../node_modules/react-popper/lib/esm/Manager.js
import * as React9 from "react";
var ManagerReferenceNodeContext = React9.createContext();
var ManagerReferenceNodeSetterContext = React9.createContext();
function Manager(_ref) {
  var children = _ref.children;
  var _React$useState = React9.useState(null), referenceNode = _React$useState[0], setReferenceNode = _React$useState[1];
  var hasUnmounted = React9.useRef(false);
  React9.useEffect(function() {
    return function() {
      hasUnmounted.current = true;
    };
  }, []);
  var handleSetReferenceNode = React9.useCallback(function(node) {
    if (!hasUnmounted.current) {
      setReferenceNode(node);
    }
  }, []);
  return /* @__PURE__ */ React9.createElement(ManagerReferenceNodeContext.Provider, {
    value: referenceNode
  }, /* @__PURE__ */ React9.createElement(ManagerReferenceNodeSetterContext.Provider, {
    value: handleSetReferenceNode
  }, children));
}

// ../../../node_modules/react-popper/lib/esm/utils.js
import * as React10 from "react";
var unwrapArray = function unwrapArray2(arg) {
  return Array.isArray(arg) ? arg[0] : arg;
};
var safeInvoke = function safeInvoke2(fn2) {
  if (typeof fn2 === "function") {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    return fn2.apply(void 0, args);
  }
};
var setRef2 = function setRef3(ref, node) {
  if (typeof ref === "function") {
    return safeInvoke(ref, node);
  } else if (ref != null) {
    ref.current = node;
  }
};
var fromEntries = function fromEntries2(entries) {
  return entries.reduce(function(acc, _ref) {
    var key = _ref[0], value = _ref[1];
    acc[key] = value;
    return acc;
  }, {});
};
var useIsomorphicLayoutEffect = typeof window !== "undefined" && window.document && window.document.createElement ? React10.useLayoutEffect : React10.useEffect;

// ../../../node_modules/react-popper/lib/esm/usePopper.js
import * as React11 from "react";
import * as ReactDOM3 from "react-dom";

// ../../../node_modules/@popperjs/core/lib/enums.js
var top = "top";
var bottom = "bottom";
var right = "right";
var left = "left";
var auto = "auto";
var basePlacements = [top, bottom, right, left];
var start = "start";
var end = "end";
var clippingParents = "clippingParents";
var viewport = "viewport";
var popper = "popper";
var reference = "reference";
var variationPlacements = /* @__PURE__ */ basePlacements.reduce(function(acc, placement) {
  return acc.concat([placement + "-" + start, placement + "-" + end]);
}, []);
var placements = /* @__PURE__ */ [].concat(basePlacements, [auto]).reduce(function(acc, placement) {
  return acc.concat([placement, placement + "-" + start, placement + "-" + end]);
}, []);
var beforeRead = "beforeRead";
var read = "read";
var afterRead = "afterRead";
var beforeMain = "beforeMain";
var main = "main";
var afterMain = "afterMain";
var beforeWrite = "beforeWrite";
var write = "write";
var afterWrite = "afterWrite";
var modifierPhases = [beforeRead, read, afterRead, beforeMain, main, afterMain, beforeWrite, write, afterWrite];

// ../../../node_modules/@popperjs/core/lib/dom-utils/getNodeName.js
function getNodeName(element) {
  return element ? (element.nodeName || "").toLowerCase() : null;
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getWindow.js
function getWindow(node) {
  if (node == null) {
    return window;
  }
  if (node.toString() !== "[object Window]") {
    var ownerDocument = node.ownerDocument;
    return ownerDocument ? ownerDocument.defaultView || window : window;
  }
  return node;
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/instanceOf.js
function isElement2(node) {
  var OwnElement = getWindow(node).Element;
  return node instanceof OwnElement || node instanceof Element;
}
function isHTMLElement(node) {
  var OwnElement = getWindow(node).HTMLElement;
  return node instanceof OwnElement || node instanceof HTMLElement;
}
function isShadowRoot(node) {
  if (typeof ShadowRoot === "undefined") {
    return false;
  }
  var OwnElement = getWindow(node).ShadowRoot;
  return node instanceof OwnElement || node instanceof ShadowRoot;
}

// ../../../node_modules/@popperjs/core/lib/modifiers/applyStyles.js
function applyStyles(_ref) {
  var state = _ref.state;
  Object.keys(state.elements).forEach(function(name) {
    var style = state.styles[name] || {};
    var attributes = state.attributes[name] || {};
    var element = state.elements[name];
    if (!isHTMLElement(element) || !getNodeName(element)) {
      return;
    }
    Object.assign(element.style, style);
    Object.keys(attributes).forEach(function(name2) {
      var value = attributes[name2];
      if (value === false) {
        element.removeAttribute(name2);
      } else {
        element.setAttribute(name2, value === true ? "" : value);
      }
    });
  });
}
function effect(_ref2) {
  var state = _ref2.state;
  var initialStyles = {
    popper: {
      position: state.options.strategy,
      left: "0",
      top: "0",
      margin: "0"
    },
    arrow: {
      position: "absolute"
    },
    reference: {}
  };
  Object.assign(state.elements.popper.style, initialStyles.popper);
  state.styles = initialStyles;
  if (state.elements.arrow) {
    Object.assign(state.elements.arrow.style, initialStyles.arrow);
  }
  return function() {
    Object.keys(state.elements).forEach(function(name) {
      var element = state.elements[name];
      var attributes = state.attributes[name] || {};
      var styleProperties = Object.keys(state.styles.hasOwnProperty(name) ? state.styles[name] : initialStyles[name]);
      var style = styleProperties.reduce(function(style2, property) {
        style2[property] = "";
        return style2;
      }, {});
      if (!isHTMLElement(element) || !getNodeName(element)) {
        return;
      }
      Object.assign(element.style, style);
      Object.keys(attributes).forEach(function(attribute) {
        element.removeAttribute(attribute);
      });
    });
  };
}
var applyStyles_default = {
  name: "applyStyles",
  enabled: true,
  phase: "write",
  fn: applyStyles,
  effect,
  requires: ["computeStyles"]
};

// ../../../node_modules/@popperjs/core/lib/utils/getBasePlacement.js
function getBasePlacement(placement) {
  return placement.split("-")[0];
}

// ../../../node_modules/@popperjs/core/lib/utils/math.js
var max = Math.max;
var min = Math.min;
var round = Math.round;

// ../../../node_modules/@popperjs/core/lib/utils/userAgent.js
function getUAString() {
  var uaData = navigator.userAgentData;
  if (uaData != null && uaData.brands && Array.isArray(uaData.brands)) {
    return uaData.brands.map(function(item) {
      return item.brand + "/" + item.version;
    }).join(" ");
  }
  return navigator.userAgent;
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/isLayoutViewport.js
function isLayoutViewport() {
  return !/^((?!chrome|android).)*safari/i.test(getUAString());
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getBoundingClientRect.js
function getBoundingClientRect(element, includeScale, isFixedStrategy) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  var clientRect = element.getBoundingClientRect();
  var scaleX = 1;
  var scaleY = 1;
  if (includeScale && isHTMLElement(element)) {
    scaleX = element.offsetWidth > 0 ? round(clientRect.width) / element.offsetWidth || 1 : 1;
    scaleY = element.offsetHeight > 0 ? round(clientRect.height) / element.offsetHeight || 1 : 1;
  }
  var _ref = isElement2(element) ? getWindow(element) : window, visualViewport = _ref.visualViewport;
  var addVisualOffsets = !isLayoutViewport() && isFixedStrategy;
  var x = (clientRect.left + (addVisualOffsets && visualViewport ? visualViewport.offsetLeft : 0)) / scaleX;
  var y = (clientRect.top + (addVisualOffsets && visualViewport ? visualViewport.offsetTop : 0)) / scaleY;
  var width = clientRect.width / scaleX;
  var height = clientRect.height / scaleY;
  return {
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    x,
    y
  };
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getLayoutRect.js
function getLayoutRect(element) {
  var clientRect = getBoundingClientRect(element);
  var width = element.offsetWidth;
  var height = element.offsetHeight;
  if (Math.abs(clientRect.width - width) <= 1) {
    width = clientRect.width;
  }
  if (Math.abs(clientRect.height - height) <= 1) {
    height = clientRect.height;
  }
  return {
    x: element.offsetLeft,
    y: element.offsetTop,
    width,
    height
  };
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/contains.js
function contains(parent, child) {
  var rootNode = child.getRootNode && child.getRootNode();
  if (parent.contains(child)) {
    return true;
  } else if (rootNode && isShadowRoot(rootNode)) {
    var next = child;
    do {
      if (next && parent.isSameNode(next)) {
        return true;
      }
      next = next.parentNode || next.host;
    } while (next);
  }
  return false;
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getComputedStyle.js
function getComputedStyle2(element) {
  return getWindow(element).getComputedStyle(element);
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/isTableElement.js
function isTableElement(element) {
  return ["table", "td", "th"].indexOf(getNodeName(element)) >= 0;
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getDocumentElement.js
function getDocumentElement(element) {
  return ((isElement2(element) ? element.ownerDocument : (
    // $FlowFixMe[prop-missing]
    element.document
  )) || window.document).documentElement;
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getParentNode.js
function getParentNode(element) {
  if (getNodeName(element) === "html") {
    return element;
  }
  return (
    // this is a quicker (but less type safe) way to save quite some bytes from the bundle
    // $FlowFixMe[incompatible-return]
    // $FlowFixMe[prop-missing]
    element.assignedSlot || // step into the shadow DOM of the parent of a slotted node
    element.parentNode || // DOM Element detected
    (isShadowRoot(element) ? element.host : null) || // ShadowRoot detected
    // $FlowFixMe[incompatible-call]: HTMLElement is a Node
    getDocumentElement(element)
  );
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getOffsetParent.js
function getTrueOffsetParent(element) {
  if (!isHTMLElement(element) || // https://github.com/popperjs/popper-core/issues/837
  getComputedStyle2(element).position === "fixed") {
    return null;
  }
  return element.offsetParent;
}
function getContainingBlock(element) {
  var isFirefox = /firefox/i.test(getUAString());
  var isIE = /Trident/i.test(getUAString());
  if (isIE && isHTMLElement(element)) {
    var elementCss = getComputedStyle2(element);
    if (elementCss.position === "fixed") {
      return null;
    }
  }
  var currentNode = getParentNode(element);
  if (isShadowRoot(currentNode)) {
    currentNode = currentNode.host;
  }
  while (isHTMLElement(currentNode) && ["html", "body"].indexOf(getNodeName(currentNode)) < 0) {
    var css = getComputedStyle2(currentNode);
    if (css.transform !== "none" || css.perspective !== "none" || css.contain === "paint" || ["transform", "perspective"].indexOf(css.willChange) !== -1 || isFirefox && css.willChange === "filter" || isFirefox && css.filter && css.filter !== "none") {
      return currentNode;
    } else {
      currentNode = currentNode.parentNode;
    }
  }
  return null;
}
function getOffsetParent(element) {
  var window2 = getWindow(element);
  var offsetParent = getTrueOffsetParent(element);
  while (offsetParent && isTableElement(offsetParent) && getComputedStyle2(offsetParent).position === "static") {
    offsetParent = getTrueOffsetParent(offsetParent);
  }
  if (offsetParent && (getNodeName(offsetParent) === "html" || getNodeName(offsetParent) === "body" && getComputedStyle2(offsetParent).position === "static")) {
    return window2;
  }
  return offsetParent || getContainingBlock(element) || window2;
}

// ../../../node_modules/@popperjs/core/lib/utils/getMainAxisFromPlacement.js
function getMainAxisFromPlacement(placement) {
  return ["top", "bottom"].indexOf(placement) >= 0 ? "x" : "y";
}

// ../../../node_modules/@popperjs/core/lib/utils/within.js
function within(min2, value, max2) {
  return max(min2, min(value, max2));
}
function withinMaxClamp(min2, value, max2) {
  var v = within(min2, value, max2);
  return v > max2 ? max2 : v;
}

// ../../../node_modules/@popperjs/core/lib/utils/getFreshSideObject.js
function getFreshSideObject() {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
}

// ../../../node_modules/@popperjs/core/lib/utils/mergePaddingObject.js
function mergePaddingObject(paddingObject) {
  return Object.assign({}, getFreshSideObject(), paddingObject);
}

// ../../../node_modules/@popperjs/core/lib/utils/expandToHashMap.js
function expandToHashMap(value, keys2) {
  return keys2.reduce(function(hashMap, key) {
    hashMap[key] = value;
    return hashMap;
  }, {});
}

// ../../../node_modules/@popperjs/core/lib/modifiers/arrow.js
var toPaddingObject = function toPaddingObject2(padding, state) {
  padding = typeof padding === "function" ? padding(Object.assign({}, state.rects, {
    placement: state.placement
  })) : padding;
  return mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
};
function arrow(_ref) {
  var _state$modifiersData$;
  var state = _ref.state, name = _ref.name, options = _ref.options;
  var arrowElement = state.elements.arrow;
  var popperOffsets2 = state.modifiersData.popperOffsets;
  var basePlacement = getBasePlacement(state.placement);
  var axis = getMainAxisFromPlacement(basePlacement);
  var isVertical = [left, right].indexOf(basePlacement) >= 0;
  var len = isVertical ? "height" : "width";
  if (!arrowElement || !popperOffsets2) {
    return;
  }
  var paddingObject = toPaddingObject(options.padding, state);
  var arrowRect = getLayoutRect(arrowElement);
  var minProp = axis === "y" ? top : left;
  var maxProp = axis === "y" ? bottom : right;
  var endDiff = state.rects.reference[len] + state.rects.reference[axis] - popperOffsets2[axis] - state.rects.popper[len];
  var startDiff = popperOffsets2[axis] - state.rects.reference[axis];
  var arrowOffsetParent = getOffsetParent(arrowElement);
  var clientSize = arrowOffsetParent ? axis === "y" ? arrowOffsetParent.clientHeight || 0 : arrowOffsetParent.clientWidth || 0 : 0;
  var centerToReference = endDiff / 2 - startDiff / 2;
  var min2 = paddingObject[minProp];
  var max2 = clientSize - arrowRect[len] - paddingObject[maxProp];
  var center = clientSize / 2 - arrowRect[len] / 2 + centerToReference;
  var offset2 = within(min2, center, max2);
  var axisProp = axis;
  state.modifiersData[name] = (_state$modifiersData$ = {}, _state$modifiersData$[axisProp] = offset2, _state$modifiersData$.centerOffset = offset2 - center, _state$modifiersData$);
}
function effect2(_ref2) {
  var state = _ref2.state, options = _ref2.options;
  var _options$element = options.element, arrowElement = _options$element === void 0 ? "[data-popper-arrow]" : _options$element;
  if (arrowElement == null) {
    return;
  }
  if (typeof arrowElement === "string") {
    arrowElement = state.elements.popper.querySelector(arrowElement);
    if (!arrowElement) {
      return;
    }
  }
  if (!contains(state.elements.popper, arrowElement)) {
    return;
  }
  state.elements.arrow = arrowElement;
}
var arrow_default = {
  name: "arrow",
  enabled: true,
  phase: "main",
  fn: arrow,
  effect: effect2,
  requires: ["popperOffsets"],
  requiresIfExists: ["preventOverflow"]
};

// ../../../node_modules/@popperjs/core/lib/utils/getVariation.js
function getVariation(placement) {
  return placement.split("-")[1];
}

// ../../../node_modules/@popperjs/core/lib/modifiers/computeStyles.js
var unsetSides = {
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto"
};
function roundOffsetsByDPR(_ref, win) {
  var x = _ref.x, y = _ref.y;
  var dpr = win.devicePixelRatio || 1;
  return {
    x: round(x * dpr) / dpr || 0,
    y: round(y * dpr) / dpr || 0
  };
}
function mapToStyles(_ref2) {
  var _Object$assign2;
  var popper2 = _ref2.popper, popperRect = _ref2.popperRect, placement = _ref2.placement, variation = _ref2.variation, offsets = _ref2.offsets, position = _ref2.position, gpuAcceleration = _ref2.gpuAcceleration, adaptive = _ref2.adaptive, roundOffsets = _ref2.roundOffsets, isFixed = _ref2.isFixed;
  var _offsets$x = offsets.x, x = _offsets$x === void 0 ? 0 : _offsets$x, _offsets$y = offsets.y, y = _offsets$y === void 0 ? 0 : _offsets$y;
  var _ref3 = typeof roundOffsets === "function" ? roundOffsets({
    x,
    y
  }) : {
    x,
    y
  };
  x = _ref3.x;
  y = _ref3.y;
  var hasX = offsets.hasOwnProperty("x");
  var hasY = offsets.hasOwnProperty("y");
  var sideX = left;
  var sideY = top;
  var win = window;
  if (adaptive) {
    var offsetParent = getOffsetParent(popper2);
    var heightProp = "clientHeight";
    var widthProp = "clientWidth";
    if (offsetParent === getWindow(popper2)) {
      offsetParent = getDocumentElement(popper2);
      if (getComputedStyle2(offsetParent).position !== "static" && position === "absolute") {
        heightProp = "scrollHeight";
        widthProp = "scrollWidth";
      }
    }
    offsetParent = offsetParent;
    if (placement === top || (placement === left || placement === right) && variation === end) {
      sideY = bottom;
      var offsetY = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.height : (
        // $FlowFixMe[prop-missing]
        offsetParent[heightProp]
      );
      y -= offsetY - popperRect.height;
      y *= gpuAcceleration ? 1 : -1;
    }
    if (placement === left || (placement === top || placement === bottom) && variation === end) {
      sideX = right;
      var offsetX = isFixed && offsetParent === win && win.visualViewport ? win.visualViewport.width : (
        // $FlowFixMe[prop-missing]
        offsetParent[widthProp]
      );
      x -= offsetX - popperRect.width;
      x *= gpuAcceleration ? 1 : -1;
    }
  }
  var commonStyles = Object.assign({
    position
  }, adaptive && unsetSides);
  var _ref4 = roundOffsets === true ? roundOffsetsByDPR({
    x,
    y
  }, getWindow(popper2)) : {
    x,
    y
  };
  x = _ref4.x;
  y = _ref4.y;
  if (gpuAcceleration) {
    var _Object$assign;
    return Object.assign({}, commonStyles, (_Object$assign = {}, _Object$assign[sideY] = hasY ? "0" : "", _Object$assign[sideX] = hasX ? "0" : "", _Object$assign.transform = (win.devicePixelRatio || 1) <= 1 ? "translate(" + x + "px, " + y + "px)" : "translate3d(" + x + "px, " + y + "px, 0)", _Object$assign));
  }
  return Object.assign({}, commonStyles, (_Object$assign2 = {}, _Object$assign2[sideY] = hasY ? y + "px" : "", _Object$assign2[sideX] = hasX ? x + "px" : "", _Object$assign2.transform = "", _Object$assign2));
}
function computeStyles(_ref5) {
  var state = _ref5.state, options = _ref5.options;
  var _options$gpuAccelerat = options.gpuAcceleration, gpuAcceleration = _options$gpuAccelerat === void 0 ? true : _options$gpuAccelerat, _options$adaptive = options.adaptive, adaptive = _options$adaptive === void 0 ? true : _options$adaptive, _options$roundOffsets = options.roundOffsets, roundOffsets = _options$roundOffsets === void 0 ? true : _options$roundOffsets;
  var commonStyles = {
    placement: getBasePlacement(state.placement),
    variation: getVariation(state.placement),
    popper: state.elements.popper,
    popperRect: state.rects.popper,
    gpuAcceleration,
    isFixed: state.options.strategy === "fixed"
  };
  if (state.modifiersData.popperOffsets != null) {
    state.styles.popper = Object.assign({}, state.styles.popper, mapToStyles(Object.assign({}, commonStyles, {
      offsets: state.modifiersData.popperOffsets,
      position: state.options.strategy,
      adaptive,
      roundOffsets
    })));
  }
  if (state.modifiersData.arrow != null) {
    state.styles.arrow = Object.assign({}, state.styles.arrow, mapToStyles(Object.assign({}, commonStyles, {
      offsets: state.modifiersData.arrow,
      position: "absolute",
      adaptive: false,
      roundOffsets
    })));
  }
  state.attributes.popper = Object.assign({}, state.attributes.popper, {
    "data-popper-placement": state.placement
  });
}
var computeStyles_default = {
  name: "computeStyles",
  enabled: true,
  phase: "beforeWrite",
  fn: computeStyles,
  data: {}
};

// ../../../node_modules/@popperjs/core/lib/modifiers/eventListeners.js
var passive = {
  passive: true
};
function effect3(_ref) {
  var state = _ref.state, instance = _ref.instance, options = _ref.options;
  var _options$scroll = options.scroll, scroll = _options$scroll === void 0 ? true : _options$scroll, _options$resize = options.resize, resize = _options$resize === void 0 ? true : _options$resize;
  var window2 = getWindow(state.elements.popper);
  var scrollParents = [].concat(state.scrollParents.reference, state.scrollParents.popper);
  if (scroll) {
    scrollParents.forEach(function(scrollParent) {
      scrollParent.addEventListener("scroll", instance.update, passive);
    });
  }
  if (resize) {
    window2.addEventListener("resize", instance.update, passive);
  }
  return function() {
    if (scroll) {
      scrollParents.forEach(function(scrollParent) {
        scrollParent.removeEventListener("scroll", instance.update, passive);
      });
    }
    if (resize) {
      window2.removeEventListener("resize", instance.update, passive);
    }
  };
}
var eventListeners_default = {
  name: "eventListeners",
  enabled: true,
  phase: "write",
  fn: function fn() {
  },
  effect: effect3,
  data: {}
};

// ../../../node_modules/@popperjs/core/lib/utils/getOppositePlacement.js
var hash = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, function(matched) {
    return hash[matched];
  });
}

// ../../../node_modules/@popperjs/core/lib/utils/getOppositeVariationPlacement.js
var hash2 = {
  start: "end",
  end: "start"
};
function getOppositeVariationPlacement(placement) {
  return placement.replace(/start|end/g, function(matched) {
    return hash2[matched];
  });
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getWindowScroll.js
function getWindowScroll(node) {
  var win = getWindow(node);
  var scrollLeft = win.pageXOffset;
  var scrollTop = win.pageYOffset;
  return {
    scrollLeft,
    scrollTop
  };
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getWindowScrollBarX.js
function getWindowScrollBarX(element) {
  return getBoundingClientRect(getDocumentElement(element)).left + getWindowScroll(element).scrollLeft;
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getViewportRect.js
function getViewportRect(element, strategy) {
  var win = getWindow(element);
  var html = getDocumentElement(element);
  var visualViewport = win.visualViewport;
  var width = html.clientWidth;
  var height = html.clientHeight;
  var x = 0;
  var y = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    var layoutViewport = isLayoutViewport();
    if (layoutViewport || !layoutViewport && strategy === "fixed") {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }
  return {
    width,
    height,
    x: x + getWindowScrollBarX(element),
    y
  };
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getDocumentRect.js
function getDocumentRect(element) {
  var _element$ownerDocumen;
  var html = getDocumentElement(element);
  var winScroll = getWindowScroll(element);
  var body = (_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body;
  var width = max(html.scrollWidth, html.clientWidth, body ? body.scrollWidth : 0, body ? body.clientWidth : 0);
  var height = max(html.scrollHeight, html.clientHeight, body ? body.scrollHeight : 0, body ? body.clientHeight : 0);
  var x = -winScroll.scrollLeft + getWindowScrollBarX(element);
  var y = -winScroll.scrollTop;
  if (getComputedStyle2(body || html).direction === "rtl") {
    x += max(html.clientWidth, body ? body.clientWidth : 0) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/isScrollParent.js
function isScrollParent(element) {
  var _getComputedStyle = getComputedStyle2(element), overflow = _getComputedStyle.overflow, overflowX = _getComputedStyle.overflowX, overflowY = _getComputedStyle.overflowY;
  return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getScrollParent.js
function getScrollParent(node) {
  if (["html", "body", "#document"].indexOf(getNodeName(node)) >= 0) {
    return node.ownerDocument.body;
  }
  if (isHTMLElement(node) && isScrollParent(node)) {
    return node;
  }
  return getScrollParent(getParentNode(node));
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/listScrollParents.js
function listScrollParents(element, list) {
  var _element$ownerDocumen;
  if (list === void 0) {
    list = [];
  }
  var scrollParent = getScrollParent(element);
  var isBody = scrollParent === ((_element$ownerDocumen = element.ownerDocument) == null ? void 0 : _element$ownerDocumen.body);
  var win = getWindow(scrollParent);
  var target = isBody ? [win].concat(win.visualViewport || [], isScrollParent(scrollParent) ? scrollParent : []) : scrollParent;
  var updatedList = list.concat(target);
  return isBody ? updatedList : (
    // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
    updatedList.concat(listScrollParents(getParentNode(target)))
  );
}

// ../../../node_modules/@popperjs/core/lib/utils/rectToClientRect.js
function rectToClientRect(rect) {
  return Object.assign({}, rect, {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height
  });
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getClippingRect.js
function getInnerBoundingClientRect(element, strategy) {
  var rect = getBoundingClientRect(element, false, strategy === "fixed");
  rect.top = rect.top + element.clientTop;
  rect.left = rect.left + element.clientLeft;
  rect.bottom = rect.top + element.clientHeight;
  rect.right = rect.left + element.clientWidth;
  rect.width = element.clientWidth;
  rect.height = element.clientHeight;
  rect.x = rect.left;
  rect.y = rect.top;
  return rect;
}
function getClientRectFromMixedType(element, clippingParent, strategy) {
  return clippingParent === viewport ? rectToClientRect(getViewportRect(element, strategy)) : isElement2(clippingParent) ? getInnerBoundingClientRect(clippingParent, strategy) : rectToClientRect(getDocumentRect(getDocumentElement(element)));
}
function getClippingParents(element) {
  var clippingParents2 = listScrollParents(getParentNode(element));
  var canEscapeClipping = ["absolute", "fixed"].indexOf(getComputedStyle2(element).position) >= 0;
  var clipperElement = canEscapeClipping && isHTMLElement(element) ? getOffsetParent(element) : element;
  if (!isElement2(clipperElement)) {
    return [];
  }
  return clippingParents2.filter(function(clippingParent) {
    return isElement2(clippingParent) && contains(clippingParent, clipperElement) && getNodeName(clippingParent) !== "body";
  });
}
function getClippingRect(element, boundary, rootBoundary, strategy) {
  var mainClippingParents = boundary === "clippingParents" ? getClippingParents(element) : [].concat(boundary);
  var clippingParents2 = [].concat(mainClippingParents, [rootBoundary]);
  var firstClippingParent = clippingParents2[0];
  var clippingRect = clippingParents2.reduce(function(accRect, clippingParent) {
    var rect = getClientRectFromMixedType(element, clippingParent, strategy);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromMixedType(element, firstClippingParent, strategy));
  clippingRect.width = clippingRect.right - clippingRect.left;
  clippingRect.height = clippingRect.bottom - clippingRect.top;
  clippingRect.x = clippingRect.left;
  clippingRect.y = clippingRect.top;
  return clippingRect;
}

// ../../../node_modules/@popperjs/core/lib/utils/computeOffsets.js
function computeOffsets(_ref) {
  var reference2 = _ref.reference, element = _ref.element, placement = _ref.placement;
  var basePlacement = placement ? getBasePlacement(placement) : null;
  var variation = placement ? getVariation(placement) : null;
  var commonX = reference2.x + reference2.width / 2 - element.width / 2;
  var commonY = reference2.y + reference2.height / 2 - element.height / 2;
  var offsets;
  switch (basePlacement) {
    case top:
      offsets = {
        x: commonX,
        y: reference2.y - element.height
      };
      break;
    case bottom:
      offsets = {
        x: commonX,
        y: reference2.y + reference2.height
      };
      break;
    case right:
      offsets = {
        x: reference2.x + reference2.width,
        y: commonY
      };
      break;
    case left:
      offsets = {
        x: reference2.x - element.width,
        y: commonY
      };
      break;
    default:
      offsets = {
        x: reference2.x,
        y: reference2.y
      };
  }
  var mainAxis = basePlacement ? getMainAxisFromPlacement(basePlacement) : null;
  if (mainAxis != null) {
    var len = mainAxis === "y" ? "height" : "width";
    switch (variation) {
      case start:
        offsets[mainAxis] = offsets[mainAxis] - (reference2[len] / 2 - element[len] / 2);
        break;
      case end:
        offsets[mainAxis] = offsets[mainAxis] + (reference2[len] / 2 - element[len] / 2);
        break;
      default:
    }
  }
  return offsets;
}

// ../../../node_modules/@popperjs/core/lib/utils/detectOverflow.js
function detectOverflow(state, options) {
  if (options === void 0) {
    options = {};
  }
  var _options = options, _options$placement = _options.placement, placement = _options$placement === void 0 ? state.placement : _options$placement, _options$strategy = _options.strategy, strategy = _options$strategy === void 0 ? state.strategy : _options$strategy, _options$boundary = _options.boundary, boundary = _options$boundary === void 0 ? clippingParents : _options$boundary, _options$rootBoundary = _options.rootBoundary, rootBoundary = _options$rootBoundary === void 0 ? viewport : _options$rootBoundary, _options$elementConte = _options.elementContext, elementContext = _options$elementConte === void 0 ? popper : _options$elementConte, _options$altBoundary = _options.altBoundary, altBoundary = _options$altBoundary === void 0 ? false : _options$altBoundary, _options$padding = _options.padding, padding = _options$padding === void 0 ? 0 : _options$padding;
  var paddingObject = mergePaddingObject(typeof padding !== "number" ? padding : expandToHashMap(padding, basePlacements));
  var altContext = elementContext === popper ? reference : popper;
  var popperRect = state.rects.popper;
  var element = state.elements[altBoundary ? altContext : elementContext];
  var clippingClientRect = getClippingRect(isElement2(element) ? element : element.contextElement || getDocumentElement(state.elements.popper), boundary, rootBoundary, strategy);
  var referenceClientRect = getBoundingClientRect(state.elements.reference);
  var popperOffsets2 = computeOffsets({
    reference: referenceClientRect,
    element: popperRect,
    strategy: "absolute",
    placement
  });
  var popperClientRect = rectToClientRect(Object.assign({}, popperRect, popperOffsets2));
  var elementClientRect = elementContext === popper ? popperClientRect : referenceClientRect;
  var overflowOffsets = {
    top: clippingClientRect.top - elementClientRect.top + paddingObject.top,
    bottom: elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom,
    left: clippingClientRect.left - elementClientRect.left + paddingObject.left,
    right: elementClientRect.right - clippingClientRect.right + paddingObject.right
  };
  var offsetData = state.modifiersData.offset;
  if (elementContext === popper && offsetData) {
    var offset2 = offsetData[placement];
    Object.keys(overflowOffsets).forEach(function(key) {
      var multiply = [right, bottom].indexOf(key) >= 0 ? 1 : -1;
      var axis = [top, bottom].indexOf(key) >= 0 ? "y" : "x";
      overflowOffsets[key] += offset2[axis] * multiply;
    });
  }
  return overflowOffsets;
}

// ../../../node_modules/@popperjs/core/lib/utils/computeAutoPlacement.js
function computeAutoPlacement(state, options) {
  if (options === void 0) {
    options = {};
  }
  var _options = options, placement = _options.placement, boundary = _options.boundary, rootBoundary = _options.rootBoundary, padding = _options.padding, flipVariations = _options.flipVariations, _options$allowedAutoP = _options.allowedAutoPlacements, allowedAutoPlacements = _options$allowedAutoP === void 0 ? placements : _options$allowedAutoP;
  var variation = getVariation(placement);
  var placements2 = variation ? flipVariations ? variationPlacements : variationPlacements.filter(function(placement2) {
    return getVariation(placement2) === variation;
  }) : basePlacements;
  var allowedPlacements = placements2.filter(function(placement2) {
    return allowedAutoPlacements.indexOf(placement2) >= 0;
  });
  if (allowedPlacements.length === 0) {
    allowedPlacements = placements2;
  }
  var overflows = allowedPlacements.reduce(function(acc, placement2) {
    acc[placement2] = detectOverflow(state, {
      placement: placement2,
      boundary,
      rootBoundary,
      padding
    })[getBasePlacement(placement2)];
    return acc;
  }, {});
  return Object.keys(overflows).sort(function(a, b) {
    return overflows[a] - overflows[b];
  });
}

// ../../../node_modules/@popperjs/core/lib/modifiers/flip.js
function getExpandedFallbackPlacements(placement) {
  if (getBasePlacement(placement) === auto) {
    return [];
  }
  var oppositePlacement = getOppositePlacement(placement);
  return [getOppositeVariationPlacement(placement), oppositePlacement, getOppositeVariationPlacement(oppositePlacement)];
}
function flip(_ref) {
  var state = _ref.state, options = _ref.options, name = _ref.name;
  if (state.modifiersData[name]._skip) {
    return;
  }
  var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? true : _options$altAxis, specifiedFallbackPlacements = options.fallbackPlacements, padding = options.padding, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, _options$flipVariatio = options.flipVariations, flipVariations = _options$flipVariatio === void 0 ? true : _options$flipVariatio, allowedAutoPlacements = options.allowedAutoPlacements;
  var preferredPlacement = state.options.placement;
  var basePlacement = getBasePlacement(preferredPlacement);
  var isBasePlacement = basePlacement === preferredPlacement;
  var fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipVariations ? [getOppositePlacement(preferredPlacement)] : getExpandedFallbackPlacements(preferredPlacement));
  var placements2 = [preferredPlacement].concat(fallbackPlacements).reduce(function(acc, placement2) {
    return acc.concat(getBasePlacement(placement2) === auto ? computeAutoPlacement(state, {
      placement: placement2,
      boundary,
      rootBoundary,
      padding,
      flipVariations,
      allowedAutoPlacements
    }) : placement2);
  }, []);
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var checksMap = /* @__PURE__ */ new Map();
  var makeFallbackChecks = true;
  var firstFittingPlacement = placements2[0];
  for (var i = 0; i < placements2.length; i++) {
    var placement = placements2[i];
    var _basePlacement = getBasePlacement(placement);
    var isStartVariation = getVariation(placement) === start;
    var isVertical = [top, bottom].indexOf(_basePlacement) >= 0;
    var len = isVertical ? "width" : "height";
    var overflow = detectOverflow(state, {
      placement,
      boundary,
      rootBoundary,
      altBoundary,
      padding
    });
    var mainVariationSide = isVertical ? isStartVariation ? right : left : isStartVariation ? bottom : top;
    if (referenceRect[len] > popperRect[len]) {
      mainVariationSide = getOppositePlacement(mainVariationSide);
    }
    var altVariationSide = getOppositePlacement(mainVariationSide);
    var checks = [];
    if (checkMainAxis) {
      checks.push(overflow[_basePlacement] <= 0);
    }
    if (checkAltAxis) {
      checks.push(overflow[mainVariationSide] <= 0, overflow[altVariationSide] <= 0);
    }
    if (checks.every(function(check) {
      return check;
    })) {
      firstFittingPlacement = placement;
      makeFallbackChecks = false;
      break;
    }
    checksMap.set(placement, checks);
  }
  if (makeFallbackChecks) {
    var numberOfChecks = flipVariations ? 3 : 1;
    var _loop = function _loop2(_i2) {
      var fittingPlacement = placements2.find(function(placement2) {
        var checks2 = checksMap.get(placement2);
        if (checks2) {
          return checks2.slice(0, _i2).every(function(check) {
            return check;
          });
        }
      });
      if (fittingPlacement) {
        firstFittingPlacement = fittingPlacement;
        return "break";
      }
    };
    for (var _i = numberOfChecks; _i > 0; _i--) {
      var _ret = _loop(_i);
      if (_ret === "break")
        break;
    }
  }
  if (state.placement !== firstFittingPlacement) {
    state.modifiersData[name]._skip = true;
    state.placement = firstFittingPlacement;
    state.reset = true;
  }
}
var flip_default = {
  name: "flip",
  enabled: true,
  phase: "main",
  fn: flip,
  requiresIfExists: ["offset"],
  data: {
    _skip: false
  }
};

// ../../../node_modules/@popperjs/core/lib/modifiers/hide.js
function getSideOffsets(overflow, rect, preventedOffsets) {
  if (preventedOffsets === void 0) {
    preventedOffsets = {
      x: 0,
      y: 0
    };
  }
  return {
    top: overflow.top - rect.height - preventedOffsets.y,
    right: overflow.right - rect.width + preventedOffsets.x,
    bottom: overflow.bottom - rect.height + preventedOffsets.y,
    left: overflow.left - rect.width - preventedOffsets.x
  };
}
function isAnySideFullyClipped(overflow) {
  return [top, right, bottom, left].some(function(side) {
    return overflow[side] >= 0;
  });
}
function hide(_ref) {
  var state = _ref.state, name = _ref.name;
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var preventedOffsets = state.modifiersData.preventOverflow;
  var referenceOverflow = detectOverflow(state, {
    elementContext: "reference"
  });
  var popperAltOverflow = detectOverflow(state, {
    altBoundary: true
  });
  var referenceClippingOffsets = getSideOffsets(referenceOverflow, referenceRect);
  var popperEscapeOffsets = getSideOffsets(popperAltOverflow, popperRect, preventedOffsets);
  var isReferenceHidden = isAnySideFullyClipped(referenceClippingOffsets);
  var hasPopperEscaped = isAnySideFullyClipped(popperEscapeOffsets);
  state.modifiersData[name] = {
    referenceClippingOffsets,
    popperEscapeOffsets,
    isReferenceHidden,
    hasPopperEscaped
  };
  state.attributes.popper = Object.assign({}, state.attributes.popper, {
    "data-popper-reference-hidden": isReferenceHidden,
    "data-popper-escaped": hasPopperEscaped
  });
}
var hide_default = {
  name: "hide",
  enabled: true,
  phase: "main",
  requiresIfExists: ["preventOverflow"],
  fn: hide
};

// ../../../node_modules/@popperjs/core/lib/modifiers/offset.js
function distanceAndSkiddingToXY(placement, rects, offset2) {
  var basePlacement = getBasePlacement(placement);
  var invertDistance = [left, top].indexOf(basePlacement) >= 0 ? -1 : 1;
  var _ref = typeof offset2 === "function" ? offset2(Object.assign({}, rects, {
    placement
  })) : offset2, skidding = _ref[0], distance = _ref[1];
  skidding = skidding || 0;
  distance = (distance || 0) * invertDistance;
  return [left, right].indexOf(basePlacement) >= 0 ? {
    x: distance,
    y: skidding
  } : {
    x: skidding,
    y: distance
  };
}
function offset(_ref2) {
  var state = _ref2.state, options = _ref2.options, name = _ref2.name;
  var _options$offset = options.offset, offset2 = _options$offset === void 0 ? [0, 0] : _options$offset;
  var data = placements.reduce(function(acc, placement) {
    acc[placement] = distanceAndSkiddingToXY(placement, state.rects, offset2);
    return acc;
  }, {});
  var _data$state$placement = data[state.placement], x = _data$state$placement.x, y = _data$state$placement.y;
  if (state.modifiersData.popperOffsets != null) {
    state.modifiersData.popperOffsets.x += x;
    state.modifiersData.popperOffsets.y += y;
  }
  state.modifiersData[name] = data;
}
var offset_default = {
  name: "offset",
  enabled: true,
  phase: "main",
  requires: ["popperOffsets"],
  fn: offset
};

// ../../../node_modules/@popperjs/core/lib/modifiers/popperOffsets.js
function popperOffsets(_ref) {
  var state = _ref.state, name = _ref.name;
  state.modifiersData[name] = computeOffsets({
    reference: state.rects.reference,
    element: state.rects.popper,
    strategy: "absolute",
    placement: state.placement
  });
}
var popperOffsets_default = {
  name: "popperOffsets",
  enabled: true,
  phase: "read",
  fn: popperOffsets,
  data: {}
};

// ../../../node_modules/@popperjs/core/lib/utils/getAltAxis.js
function getAltAxis(axis) {
  return axis === "x" ? "y" : "x";
}

// ../../../node_modules/@popperjs/core/lib/modifiers/preventOverflow.js
function preventOverflow(_ref) {
  var state = _ref.state, options = _ref.options, name = _ref.name;
  var _options$mainAxis = options.mainAxis, checkMainAxis = _options$mainAxis === void 0 ? true : _options$mainAxis, _options$altAxis = options.altAxis, checkAltAxis = _options$altAxis === void 0 ? false : _options$altAxis, boundary = options.boundary, rootBoundary = options.rootBoundary, altBoundary = options.altBoundary, padding = options.padding, _options$tether = options.tether, tether = _options$tether === void 0 ? true : _options$tether, _options$tetherOffset = options.tetherOffset, tetherOffset = _options$tetherOffset === void 0 ? 0 : _options$tetherOffset;
  var overflow = detectOverflow(state, {
    boundary,
    rootBoundary,
    padding,
    altBoundary
  });
  var basePlacement = getBasePlacement(state.placement);
  var variation = getVariation(state.placement);
  var isBasePlacement = !variation;
  var mainAxis = getMainAxisFromPlacement(basePlacement);
  var altAxis = getAltAxis(mainAxis);
  var popperOffsets2 = state.modifiersData.popperOffsets;
  var referenceRect = state.rects.reference;
  var popperRect = state.rects.popper;
  var tetherOffsetValue = typeof tetherOffset === "function" ? tetherOffset(Object.assign({}, state.rects, {
    placement: state.placement
  })) : tetherOffset;
  var normalizedTetherOffsetValue = typeof tetherOffsetValue === "number" ? {
    mainAxis: tetherOffsetValue,
    altAxis: tetherOffsetValue
  } : Object.assign({
    mainAxis: 0,
    altAxis: 0
  }, tetherOffsetValue);
  var offsetModifierState = state.modifiersData.offset ? state.modifiersData.offset[state.placement] : null;
  var data = {
    x: 0,
    y: 0
  };
  if (!popperOffsets2) {
    return;
  }
  if (checkMainAxis) {
    var _offsetModifierState$;
    var mainSide = mainAxis === "y" ? top : left;
    var altSide = mainAxis === "y" ? bottom : right;
    var len = mainAxis === "y" ? "height" : "width";
    var offset2 = popperOffsets2[mainAxis];
    var min2 = offset2 + overflow[mainSide];
    var max2 = offset2 - overflow[altSide];
    var additive = tether ? -popperRect[len] / 2 : 0;
    var minLen = variation === start ? referenceRect[len] : popperRect[len];
    var maxLen = variation === start ? -popperRect[len] : -referenceRect[len];
    var arrowElement = state.elements.arrow;
    var arrowRect = tether && arrowElement ? getLayoutRect(arrowElement) : {
      width: 0,
      height: 0
    };
    var arrowPaddingObject = state.modifiersData["arrow#persistent"] ? state.modifiersData["arrow#persistent"].padding : getFreshSideObject();
    var arrowPaddingMin = arrowPaddingObject[mainSide];
    var arrowPaddingMax = arrowPaddingObject[altSide];
    var arrowLen = within(0, referenceRect[len], arrowRect[len]);
    var minOffset = isBasePlacement ? referenceRect[len] / 2 - additive - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis : minLen - arrowLen - arrowPaddingMin - normalizedTetherOffsetValue.mainAxis;
    var maxOffset = isBasePlacement ? -referenceRect[len] / 2 + additive + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis : maxLen + arrowLen + arrowPaddingMax + normalizedTetherOffsetValue.mainAxis;
    var arrowOffsetParent = state.elements.arrow && getOffsetParent(state.elements.arrow);
    var clientOffset = arrowOffsetParent ? mainAxis === "y" ? arrowOffsetParent.clientTop || 0 : arrowOffsetParent.clientLeft || 0 : 0;
    var offsetModifierValue = (_offsetModifierState$ = offsetModifierState == null ? void 0 : offsetModifierState[mainAxis]) != null ? _offsetModifierState$ : 0;
    var tetherMin = offset2 + minOffset - offsetModifierValue - clientOffset;
    var tetherMax = offset2 + maxOffset - offsetModifierValue;
    var preventedOffset = within(tether ? min(min2, tetherMin) : min2, offset2, tether ? max(max2, tetherMax) : max2);
    popperOffsets2[mainAxis] = preventedOffset;
    data[mainAxis] = preventedOffset - offset2;
  }
  if (checkAltAxis) {
    var _offsetModifierState$2;
    var _mainSide = mainAxis === "x" ? top : left;
    var _altSide = mainAxis === "x" ? bottom : right;
    var _offset = popperOffsets2[altAxis];
    var _len = altAxis === "y" ? "height" : "width";
    var _min = _offset + overflow[_mainSide];
    var _max = _offset - overflow[_altSide];
    var isOriginSide = [top, left].indexOf(basePlacement) !== -1;
    var _offsetModifierValue = (_offsetModifierState$2 = offsetModifierState == null ? void 0 : offsetModifierState[altAxis]) != null ? _offsetModifierState$2 : 0;
    var _tetherMin = isOriginSide ? _min : _offset - referenceRect[_len] - popperRect[_len] - _offsetModifierValue + normalizedTetherOffsetValue.altAxis;
    var _tetherMax = isOriginSide ? _offset + referenceRect[_len] + popperRect[_len] - _offsetModifierValue - normalizedTetherOffsetValue.altAxis : _max;
    var _preventedOffset = tether && isOriginSide ? withinMaxClamp(_tetherMin, _offset, _tetherMax) : within(tether ? _tetherMin : _min, _offset, tether ? _tetherMax : _max);
    popperOffsets2[altAxis] = _preventedOffset;
    data[altAxis] = _preventedOffset - _offset;
  }
  state.modifiersData[name] = data;
}
var preventOverflow_default = {
  name: "preventOverflow",
  enabled: true,
  phase: "main",
  fn: preventOverflow,
  requiresIfExists: ["offset"]
};

// ../../../node_modules/@popperjs/core/lib/dom-utils/getHTMLElementScroll.js
function getHTMLElementScroll(element) {
  return {
    scrollLeft: element.scrollLeft,
    scrollTop: element.scrollTop
  };
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getNodeScroll.js
function getNodeScroll(node) {
  if (node === getWindow(node) || !isHTMLElement(node)) {
    return getWindowScroll(node);
  } else {
    return getHTMLElementScroll(node);
  }
}

// ../../../node_modules/@popperjs/core/lib/dom-utils/getCompositeRect.js
function isElementScaled(element) {
  var rect = element.getBoundingClientRect();
  var scaleX = round(rect.width) / element.offsetWidth || 1;
  var scaleY = round(rect.height) / element.offsetHeight || 1;
  return scaleX !== 1 || scaleY !== 1;
}
function getCompositeRect(elementOrVirtualElement, offsetParent, isFixed) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  var isOffsetParentAnElement = isHTMLElement(offsetParent);
  var offsetParentIsScaled = isHTMLElement(offsetParent) && isElementScaled(offsetParent);
  var documentElement = getDocumentElement(offsetParent);
  var rect = getBoundingClientRect(elementOrVirtualElement, offsetParentIsScaled, isFixed);
  var scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  var offsets = {
    x: 0,
    y: 0
  };
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || // https://github.com/popperjs/popper-core/issues/1078
    isScrollParent(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isHTMLElement(offsetParent)) {
      offsets = getBoundingClientRect(offsetParent, true);
      offsets.x += offsetParent.clientLeft;
      offsets.y += offsetParent.clientTop;
    } else if (documentElement) {
      offsets.x = getWindowScrollBarX(documentElement);
    }
  }
  return {
    x: rect.left + scroll.scrollLeft - offsets.x,
    y: rect.top + scroll.scrollTop - offsets.y,
    width: rect.width,
    height: rect.height
  };
}

// ../../../node_modules/@popperjs/core/lib/utils/orderModifiers.js
function order(modifiers) {
  var map = /* @__PURE__ */ new Map();
  var visited = /* @__PURE__ */ new Set();
  var result = [];
  modifiers.forEach(function(modifier) {
    map.set(modifier.name, modifier);
  });
  function sort(modifier) {
    visited.add(modifier.name);
    var requires = [].concat(modifier.requires || [], modifier.requiresIfExists || []);
    requires.forEach(function(dep) {
      if (!visited.has(dep)) {
        var depModifier = map.get(dep);
        if (depModifier) {
          sort(depModifier);
        }
      }
    });
    result.push(modifier);
  }
  modifiers.forEach(function(modifier) {
    if (!visited.has(modifier.name)) {
      sort(modifier);
    }
  });
  return result;
}
function orderModifiers(modifiers) {
  var orderedModifiers = order(modifiers);
  return modifierPhases.reduce(function(acc, phase) {
    return acc.concat(orderedModifiers.filter(function(modifier) {
      return modifier.phase === phase;
    }));
  }, []);
}

// ../../../node_modules/@popperjs/core/lib/utils/debounce.js
function debounce(fn2) {
  var pending;
  return function() {
    if (!pending) {
      pending = new Promise(function(resolve) {
        Promise.resolve().then(function() {
          pending = void 0;
          resolve(fn2());
        });
      });
    }
    return pending;
  };
}

// ../../../node_modules/@popperjs/core/lib/utils/mergeByName.js
function mergeByName(modifiers) {
  var merged = modifiers.reduce(function(merged2, current) {
    var existing = merged2[current.name];
    merged2[current.name] = existing ? Object.assign({}, existing, current, {
      options: Object.assign({}, existing.options, current.options),
      data: Object.assign({}, existing.data, current.data)
    }) : current;
    return merged2;
  }, {});
  return Object.keys(merged).map(function(key) {
    return merged[key];
  });
}

// ../../../node_modules/@popperjs/core/lib/createPopper.js
var DEFAULT_OPTIONS = {
  placement: "bottom",
  modifiers: [],
  strategy: "absolute"
};
function areValidElements() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  return !args.some(function(element) {
    return !(element && typeof element.getBoundingClientRect === "function");
  });
}
function popperGenerator(generatorOptions) {
  if (generatorOptions === void 0) {
    generatorOptions = {};
  }
  var _generatorOptions = generatorOptions, _generatorOptions$def = _generatorOptions.defaultModifiers, defaultModifiers2 = _generatorOptions$def === void 0 ? [] : _generatorOptions$def, _generatorOptions$def2 = _generatorOptions.defaultOptions, defaultOptions = _generatorOptions$def2 === void 0 ? DEFAULT_OPTIONS : _generatorOptions$def2;
  return function createPopper2(reference2, popper2, options) {
    if (options === void 0) {
      options = defaultOptions;
    }
    var state = {
      placement: "bottom",
      orderedModifiers: [],
      options: Object.assign({}, DEFAULT_OPTIONS, defaultOptions),
      modifiersData: {},
      elements: {
        reference: reference2,
        popper: popper2
      },
      attributes: {},
      styles: {}
    };
    var effectCleanupFns = [];
    var isDestroyed = false;
    var instance = {
      state,
      setOptions: function setOptions(setOptionsAction) {
        var options2 = typeof setOptionsAction === "function" ? setOptionsAction(state.options) : setOptionsAction;
        cleanupModifierEffects();
        state.options = Object.assign({}, defaultOptions, state.options, options2);
        state.scrollParents = {
          reference: isElement2(reference2) ? listScrollParents(reference2) : reference2.contextElement ? listScrollParents(reference2.contextElement) : [],
          popper: listScrollParents(popper2)
        };
        var orderedModifiers = orderModifiers(mergeByName([].concat(defaultModifiers2, state.options.modifiers)));
        state.orderedModifiers = orderedModifiers.filter(function(m) {
          return m.enabled;
        });
        runModifierEffects();
        return instance.update();
      },
      // Sync update – it will always be executed, even if not necessary. This
      // is useful for low frequency updates where sync behavior simplifies the
      // logic.
      // For high frequency updates (e.g. `resize` and `scroll` events), always
      // prefer the async Popper#update method
      forceUpdate: function forceUpdate() {
        if (isDestroyed) {
          return;
        }
        var _state$elements = state.elements, reference3 = _state$elements.reference, popper3 = _state$elements.popper;
        if (!areValidElements(reference3, popper3)) {
          return;
        }
        state.rects = {
          reference: getCompositeRect(reference3, getOffsetParent(popper3), state.options.strategy === "fixed"),
          popper: getLayoutRect(popper3)
        };
        state.reset = false;
        state.placement = state.options.placement;
        state.orderedModifiers.forEach(function(modifier) {
          return state.modifiersData[modifier.name] = Object.assign({}, modifier.data);
        });
        for (var index = 0; index < state.orderedModifiers.length; index++) {
          if (state.reset === true) {
            state.reset = false;
            index = -1;
            continue;
          }
          var _state$orderedModifie = state.orderedModifiers[index], fn2 = _state$orderedModifie.fn, _state$orderedModifie2 = _state$orderedModifie.options, _options = _state$orderedModifie2 === void 0 ? {} : _state$orderedModifie2, name = _state$orderedModifie.name;
          if (typeof fn2 === "function") {
            state = fn2({
              state,
              options: _options,
              name,
              instance
            }) || state;
          }
        }
      },
      // Async and optimistically optimized update – it will not be executed if
      // not necessary (debounced to run at most once-per-tick)
      update: debounce(function() {
        return new Promise(function(resolve) {
          instance.forceUpdate();
          resolve(state);
        });
      }),
      destroy: function destroy() {
        cleanupModifierEffects();
        isDestroyed = true;
      }
    };
    if (!areValidElements(reference2, popper2)) {
      return instance;
    }
    instance.setOptions(options).then(function(state2) {
      if (!isDestroyed && options.onFirstUpdate) {
        options.onFirstUpdate(state2);
      }
    });
    function runModifierEffects() {
      state.orderedModifiers.forEach(function(_ref) {
        var name = _ref.name, _ref$options = _ref.options, options2 = _ref$options === void 0 ? {} : _ref$options, effect4 = _ref.effect;
        if (typeof effect4 === "function") {
          var cleanupFn = effect4({
            state,
            name,
            instance,
            options: options2
          });
          var noopFn = function noopFn2() {
          };
          effectCleanupFns.push(cleanupFn || noopFn);
        }
      });
    }
    function cleanupModifierEffects() {
      effectCleanupFns.forEach(function(fn2) {
        return fn2();
      });
      effectCleanupFns = [];
    }
    return instance;
  };
}

// ../../../node_modules/@popperjs/core/lib/popper.js
var defaultModifiers = [eventListeners_default, popperOffsets_default, computeStyles_default, applyStyles_default, offset_default, flip_default, preventOverflow_default, arrow_default, hide_default];
var createPopper = /* @__PURE__ */ popperGenerator({
  defaultModifiers
});

// ../../../node_modules/react-popper/lib/esm/usePopper.js
var import_react_fast_compare = __toESM(require_react_fast_compare());
var EMPTY_MODIFIERS = [];
var usePopper = function usePopper2(referenceElement, popperElement, options) {
  if (options === void 0) {
    options = {};
  }
  var prevOptions = React11.useRef(null);
  var optionsWithDefaults = {
    onFirstUpdate: options.onFirstUpdate,
    placement: options.placement || "bottom",
    strategy: options.strategy || "absolute",
    modifiers: options.modifiers || EMPTY_MODIFIERS
  };
  var _React$useState = React11.useState({
    styles: {
      popper: {
        position: optionsWithDefaults.strategy,
        left: "0",
        top: "0"
      },
      arrow: {
        position: "absolute"
      }
    },
    attributes: {}
  }), state = _React$useState[0], setState = _React$useState[1];
  var updateStateModifier = React11.useMemo(function() {
    return {
      name: "updateState",
      enabled: true,
      phase: "write",
      fn: function fn2(_ref) {
        var state2 = _ref.state;
        var elements = Object.keys(state2.elements);
        ReactDOM3.flushSync(function() {
          setState({
            styles: fromEntries(elements.map(function(element) {
              return [element, state2.styles[element] || {}];
            })),
            attributes: fromEntries(elements.map(function(element) {
              return [element, state2.attributes[element]];
            }))
          });
        });
      },
      requires: ["computeStyles"]
    };
  }, []);
  var popperOptions = React11.useMemo(function() {
    var newOptions = {
      onFirstUpdate: optionsWithDefaults.onFirstUpdate,
      placement: optionsWithDefaults.placement,
      strategy: optionsWithDefaults.strategy,
      modifiers: [].concat(optionsWithDefaults.modifiers, [updateStateModifier, {
        name: "applyStyles",
        enabled: false
      }])
    };
    if ((0, import_react_fast_compare.default)(prevOptions.current, newOptions)) {
      return prevOptions.current || newOptions;
    } else {
      prevOptions.current = newOptions;
      return newOptions;
    }
  }, [optionsWithDefaults.onFirstUpdate, optionsWithDefaults.placement, optionsWithDefaults.strategy, optionsWithDefaults.modifiers, updateStateModifier]);
  var popperInstanceRef = React11.useRef();
  useIsomorphicLayoutEffect(function() {
    if (popperInstanceRef.current) {
      popperInstanceRef.current.setOptions(popperOptions);
    }
  }, [popperOptions]);
  useIsomorphicLayoutEffect(function() {
    if (referenceElement == null || popperElement == null) {
      return;
    }
    var createPopper2 = options.createPopper || createPopper;
    var popperInstance = createPopper2(referenceElement, popperElement, popperOptions);
    popperInstanceRef.current = popperInstance;
    return function() {
      popperInstance.destroy();
      popperInstanceRef.current = null;
    };
  }, [referenceElement, popperElement, options.createPopper]);
  return {
    state: popperInstanceRef.current ? popperInstanceRef.current.state : null,
    styles: state.styles,
    attributes: state.attributes,
    update: popperInstanceRef.current ? popperInstanceRef.current.update : null,
    forceUpdate: popperInstanceRef.current ? popperInstanceRef.current.forceUpdate : null
  };
};

// ../../../node_modules/react-popper/lib/esm/Popper.js
var NOOP = function NOOP2() {
  return void 0;
};
var NOOP_PROMISE = function NOOP_PROMISE2() {
  return Promise.resolve(null);
};
var EMPTY_MODIFIERS2 = [];
function Popper(_ref) {
  var _ref$placement = _ref.placement, placement = _ref$placement === void 0 ? "bottom" : _ref$placement, _ref$strategy = _ref.strategy, strategy = _ref$strategy === void 0 ? "absolute" : _ref$strategy, _ref$modifiers = _ref.modifiers, modifiers = _ref$modifiers === void 0 ? EMPTY_MODIFIERS2 : _ref$modifiers, referenceElement = _ref.referenceElement, onFirstUpdate = _ref.onFirstUpdate, innerRef = _ref.innerRef, children = _ref.children;
  var referenceNode = React12.useContext(ManagerReferenceNodeContext);
  var _React$useState = React12.useState(null), popperElement = _React$useState[0], setPopperElement = _React$useState[1];
  var _React$useState2 = React12.useState(null), arrowElement = _React$useState2[0], setArrowElement = _React$useState2[1];
  React12.useEffect(function() {
    setRef2(innerRef, popperElement);
  }, [innerRef, popperElement]);
  var options = React12.useMemo(function() {
    return {
      placement,
      strategy,
      onFirstUpdate,
      modifiers: [].concat(modifiers, [{
        name: "arrow",
        enabled: arrowElement != null,
        options: {
          element: arrowElement
        }
      }])
    };
  }, [placement, strategy, onFirstUpdate, modifiers, arrowElement]);
  var _usePopper = usePopper(referenceElement || referenceNode, popperElement, options), state = _usePopper.state, styles = _usePopper.styles, forceUpdate = _usePopper.forceUpdate, update = _usePopper.update;
  var childrenProps = React12.useMemo(function() {
    return {
      ref: setPopperElement,
      style: styles.popper,
      placement: state ? state.placement : placement,
      hasPopperEscaped: state && state.modifiersData.hide ? state.modifiersData.hide.hasPopperEscaped : null,
      isReferenceHidden: state && state.modifiersData.hide ? state.modifiersData.hide.isReferenceHidden : null,
      arrowProps: {
        style: styles.arrow,
        ref: setArrowElement
      },
      forceUpdate: forceUpdate || NOOP,
      update: update || NOOP_PROMISE
    };
  }, [setPopperElement, setArrowElement, placement, state, styles, update, forceUpdate]);
  return unwrapArray(children)(childrenProps);
}

// ../../../node_modules/react-popper/lib/esm/Reference.js
var import_warning = __toESM(require_warning());
import * as React13 from "react";
function Reference(_ref) {
  var children = _ref.children, innerRef = _ref.innerRef;
  var setReferenceNode = React13.useContext(ManagerReferenceNodeSetterContext);
  var refHandler2 = React13.useCallback(function(node) {
    setRef2(innerRef, node);
    safeInvoke(setReferenceNode, node);
  }, [innerRef, setReferenceNode]);
  React13.useEffect(function() {
    return function() {
      return setRef2(innerRef, null);
    };
  }, []);
  React13.useEffect(function() {
    (0, import_warning.default)(Boolean(setReferenceNode), "`Reference` should not be used outside of a `Manager` component.");
  }, [setReferenceNode]);
  return unwrapArray(children)({
    ref: refHandler2
  });
}

// ../../../node_modules/@blueprintjs/popover2/lib/esm/customModifiers.js
var matchReferenceWidthModifier = {
  enabled: true,
  name: "matchReferenceWidth",
  phase: "beforeWrite",
  requires: ["computeStyles"],
  fn: function(_a2) {
    var state = _a2.state;
    state.styles.popper.width = "".concat(state.rects.reference.width, "px");
  },
  effect: function(_a2) {
    var state = _a2.state;
    var referenceWidth = state.elements.reference.getBoundingClientRect().width;
    state.elements.popper.style.width = "".concat(referenceWidth, "px");
  }
};

// ../../../node_modules/@blueprintjs/popover2/lib/esm/popover2Arrow.js
import * as React14 from "react";

// ../../../node_modules/@blueprintjs/popover2/lib/esm/utils.js
function getBasePlacement2(placement) {
  return placement.split("-")[0];
}
function isVerticalPlacement(side) {
  return ["left", "right"].indexOf(side) !== -1;
}
function getOppositePlacement2(side) {
  switch (side) {
    case "top":
      return "bottom";
    case "left":
      return "right";
    case "bottom":
      return "top";
    default:
      return "left";
  }
}
function getAlignment(placement) {
  var align = placement.split("-")[1];
  switch (align) {
    case "start":
      return "left";
    case "end":
      return "right";
    default:
      return "center";
  }
}
function getTransformOrigin(placement, arrowStyles) {
  var basePlacement = getBasePlacement2(placement);
  if (arrowStyles === void 0) {
    return isVerticalPlacement(basePlacement) ? "".concat(getOppositePlacement2(basePlacement), " ").concat(getAlignment(basePlacement)) : "".concat(getAlignment(basePlacement), " ").concat(getOppositePlacement2(basePlacement));
  } else {
    var arrowSizeShift = 30 / 2;
    return isVerticalPlacement(basePlacement) ? "".concat(getOppositePlacement2(basePlacement), " ").concat(parseInt(arrowStyles.top, 10) + arrowSizeShift, "px") : "".concat(parseInt(arrowStyles.left, 10) + arrowSizeShift, "px ").concat(getOppositePlacement2(basePlacement));
  }
}

// ../../../node_modules/@blueprintjs/popover2/lib/esm/popover2Arrow.js
var SVG_SHADOW_PATH = "M8.11 6.302c1.015-.936 1.887-2.922 1.887-4.297v26c0-1.378-.868-3.357-1.888-4.297L.925 17.09c-1.237-1.14-1.233-3.034 0-4.17L8.11 6.302z";
var SVG_ARROW_PATH = "M8.787 7.036c1.22-1.125 2.21-3.376 2.21-5.03V0v30-2.005c0-1.654-.983-3.9-2.21-5.03l-7.183-6.616c-.81-.746-.802-1.96 0-2.7l7.183-6.614z";
var ARROW_SPACING = 4;
var POPOVER_ARROW_SVG_SIZE = 30;
var TOOLTIP_ARROW_SVG_SIZE = 22;
function getArrowAngle(placement) {
  if (placement == null) {
    return 0;
  }
  switch (getBasePlacement2(placement)) {
    case "top":
      return -90;
    case "left":
      return 180;
    case "bottom":
      return 90;
    default:
      return 0;
  }
}
function getArrowReferenceOffsetStyle(placement) {
  var offset2 = POPOVER_ARROW_SVG_SIZE / 2 - ARROW_SPACING;
  switch (getBasePlacement2(placement)) {
    case "top":
      return { bottom: -offset2 };
    case "left":
      return { right: -offset2 };
    case "bottom":
      return { top: -offset2 };
    default:
      return { left: -offset2 };
  }
}
var Popover2Arrow = function(_a2) {
  var _b2 = _a2.arrowProps, ref = _b2.ref, style = _b2.style, placement = _a2.placement;
  return (
    // data attribute allows popper.js to position the arrow
    React14.createElement(
      "div",
      { "aria-hidden": true, className: POPOVER2_ARROW, "data-popper-arrow": true, ref, style: __assign3(__assign3({}, style), getArrowReferenceOffsetStyle(placement)) },
      React14.createElement(
        "svg",
        { viewBox: "0 0 ".concat(POPOVER_ARROW_SVG_SIZE, " ").concat(POPOVER_ARROW_SVG_SIZE), style: { transform: "rotate(".concat(getArrowAngle(placement), "deg)") } },
        React14.createElement("path", { className: POPOVER2_ARROW + "-border", d: SVG_SHADOW_PATH }),
        React14.createElement("path", { className: POPOVER2_ARROW + "-fill", d: SVG_ARROW_PATH })
      )
    )
  );
};
Popover2Arrow.displayName = "".concat(DISPLAYNAME_PREFIX, ".Popover2Arrow");

// ../../../node_modules/@blueprintjs/popover2/lib/esm/popover2PlacementUtils.js
function positionToPlacement(position) {
  switch (position) {
    case PopoverPosition.TOP_LEFT:
      return "top-start";
    case PopoverPosition.TOP:
      return "top";
    case PopoverPosition.TOP_RIGHT:
      return "top-end";
    case PopoverPosition.RIGHT_TOP:
      return "right-start";
    case PopoverPosition.RIGHT:
      return "right";
    case PopoverPosition.RIGHT_BOTTOM:
      return "right-end";
    case PopoverPosition.BOTTOM_RIGHT:
      return "bottom-end";
    case PopoverPosition.BOTTOM:
      return "bottom";
    case PopoverPosition.BOTTOM_LEFT:
      return "bottom-start";
    case PopoverPosition.LEFT_BOTTOM:
      return "left-end";
    case PopoverPosition.LEFT:
      return "left";
    case PopoverPosition.LEFT_TOP:
      return "left-start";
    case "auto":
    case "auto-start":
    case "auto-end":
      return position;
    default:
      return assertNever(position);
  }
}
function assertNever(x) {
  throw new Error("Unexpected position: " + x);
}

// ../../../node_modules/@blueprintjs/popover2/lib/esm/resizeSensor2.js
import * as React15 from "react";
var ResizeSensor2 = (
  /** @class */
  function(_super) {
    __extends2(ResizeSensor22, _super);
    function ResizeSensor22() {
      var _this = _super !== null && _super.apply(this, arguments) || this;
      _this.targetRef = React15.createRef();
      _this.prevElement = void 0;
      _this.observer = new ResizeObserver(function(entries) {
        var _a2, _b2;
        return (_b2 = (_a2 = _this.props).onResize) === null || _b2 === void 0 ? void 0 : _b2.call(_a2, entries);
      });
      return _this;
    }
    ResizeSensor22.prototype.render = function() {
      var onlyChild = React15.Children.only(this.props.children);
      if (this.props.targetRef !== void 0) {
        return onlyChild;
      }
      return React15.cloneElement(onlyChild, { ref: this.targetRef });
    };
    ResizeSensor22.prototype.componentDidMount = function() {
      this.observeElement();
    };
    ResizeSensor22.prototype.componentDidUpdate = function(prevProps) {
      this.observeElement(this.props.observeParents !== prevProps.observeParents);
    };
    ResizeSensor22.prototype.componentWillUnmount = function() {
      this.observer.disconnect();
    };
    ResizeSensor22.prototype.observeElement = function(force) {
      if (force === void 0) {
        force = false;
      }
      if (!(this.targetRef.current instanceof Element)) {
        this.observer.disconnect();
        return;
      }
      if (this.targetRef.current === this.prevElement && !force) {
        return;
      } else {
        this.observer.disconnect();
        this.prevElement = this.targetRef.current;
      }
      this.observer.observe(this.targetRef.current);
      if (this.props.observeParents) {
        var parent_1 = this.targetRef.current.parentElement;
        while (parent_1 != null) {
          this.observer.observe(parent_1);
          parent_1 = parent_1.parentElement;
        }
      }
    };
    ResizeSensor22.displayName = "".concat(DISPLAYNAME_PREFIX, ".ResizeSensor2");
    return ResizeSensor22;
  }(AbstractPureComponent2)
);

// ../../../node_modules/@blueprintjs/popover2/lib/esm/tooltip2.js
var import_classnames2 = __toESM(require_classnames());
import * as React17 from "react";

// ../../../node_modules/@blueprintjs/popover2/lib/esm/tooltip2Context.js
import * as React16 from "react";
var noOpDispatch = function() {
  return null;
};
var Tooltip2Context = React16.createContext([
  {},
  noOpDispatch
]);
var tooltip2Reducer = function(state, action) {
  switch (action.type) {
    case "FORCE_DISABLED_STATE":
      return { forceDisabled: true };
    case "RESET_DISABLED_STATE":
      return {};
    default:
      return state;
  }
};
var Tooltip2Provider = function(_a2) {
  var children = _a2.children, forceDisable = _a2.forceDisable;
  var _b2 = React16.useReducer(tooltip2Reducer, {}), state = _b2[0], dispatch = _b2[1];
  React16.useEffect(function() {
    if (forceDisable) {
      dispatch({ type: "FORCE_DISABLED_STATE" });
    } else {
      dispatch({ type: "RESET_DISABLED_STATE" });
    }
  }, [forceDisable]);
  return React16.createElement(Tooltip2Context.Provider, { value: [state, dispatch] }, typeof children === "function" ? children(state) : children);
};

// ../../../node_modules/@blueprintjs/popover2/lib/esm/tooltip2.js
var Tooltip2 = (
  /** @class */
  function(_super) {
    __extends2(Tooltip22, _super);
    function Tooltip22() {
      var _this = _super !== null && _super.apply(this, arguments) || this;
      _this.popoverRef = React17.createRef();
      _this.renderPopover = function(ctxState) {
        var _a2;
        var _b2;
        var _c2 = _this.props, children = _c2.children, compact = _c2.compact, disabled = _c2.disabled, intent = _c2.intent, popoverClassName = _c2.popoverClassName, restProps = __rest(_c2, ["children", "compact", "disabled", "intent", "popoverClassName"]);
        var popoverClasses = (0, import_classnames2.default)(TOOLTIP2, classes_exports.intentClass(intent), popoverClassName, (_a2 = {}, _a2[classes_exports.COMPACT] = compact, _a2));
        return React17.createElement(Popover2, __assign3({ modifiers: {
          arrow: {
            enabled: !_this.props.minimal
          },
          offset: {
            options: {
              offset: [0, TOOLTIP_ARROW_SVG_SIZE / 2]
            }
          }
        } }, restProps, { autoFocus: false, canEscapeKeyClose: false, disabled: (_b2 = ctxState.forceDisabled) !== null && _b2 !== void 0 ? _b2 : disabled, enforceFocus: false, lazy: true, popoverClassName: popoverClasses, portalContainer: _this.props.portalContainer, ref: _this.popoverRef }), children);
      };
      return _this;
    }
    Tooltip22.prototype.render = function() {
      var _this = this;
      return React17.createElement(Tooltip2Context.Consumer, null, function(_a2) {
        var state = _a2[0];
        return React17.createElement(Tooltip2Provider, __assign3({}, state), _this.renderPopover);
      });
    };
    Tooltip22.prototype.reposition = function() {
      var _a2;
      (_a2 = this.popoverRef.current) === null || _a2 === void 0 ? void 0 : _a2.reposition();
    };
    Tooltip22.displayName = "".concat(DISPLAYNAME_PREFIX, ".Tooltip2");
    Tooltip22.defaultProps = {
      compact: false,
      hoverCloseDelay: 0,
      hoverOpenDelay: 100,
      interactionKind: "hover-target",
      minimal: false,
      transitionDuration: 100
    };
    return Tooltip22;
  }(React17.PureComponent)
);

// ../../../node_modules/@blueprintjs/popover2/lib/esm/popover2.js
var Popover2InteractionKind = {
  CLICK: "click",
  CLICK_TARGET_ONLY: "click-target",
  HOVER: "hover",
  HOVER_TARGET_ONLY: "hover-target"
};
var Popover2 = (
  /** @class */
  function(_super) {
    __extends2(Popover22, _super);
    function Popover22() {
      var _this = _super !== null && _super.apply(this, arguments) || this;
      _this.state = {
        hasDarkParent: false,
        isOpen: _this.getIsOpen(_this.props)
      };
      _this.popoverElement = null;
      _this.targetElement = null;
      _this.popoverRef = refHandler(_this, "popoverElement", _this.props.popoverRef);
      _this.targetRef = function(el) {
        return _this.targetElement = el;
      };
      _this.isMouseInTargetOrPopover = false;
      _this.lostFocusOnSamePage = true;
      _this.isControlled = function() {
        return _this.props.isOpen !== void 0;
      };
      _this.isArrowEnabled = function() {
        var _a2, _b2;
        return !_this.props.minimal && ((_b2 = (_a2 = _this.props.modifiers) === null || _a2 === void 0 ? void 0 : _a2.arrow) === null || _b2 === void 0 ? void 0 : _b2.enabled) !== false;
      };
      _this.isHoverInteractionKind = function() {
        return _this.props.interactionKind === Popover2InteractionKind.HOVER || _this.props.interactionKind === Popover2InteractionKind.HOVER_TARGET_ONLY;
      };
      _this.reposition = function() {
        var _a2;
        return (_a2 = _this.popperScheduleUpdate) === null || _a2 === void 0 ? void 0 : _a2.call(_this);
      };
      _this.renderTarget = function(_a2) {
        var _b2, _c2;
        var _d2, _e;
        var popperChildRef = _a2.ref;
        var _f = _this.props, children = _f.children, className = _f.className, fill = _f.fill, openOnTargetFocus = _f.openOnTargetFocus, renderTarget = _f.renderTarget;
        var isOpen = _this.state.isOpen;
        var isControlled = _this.isControlled();
        var isHoverInteractionKind = _this.isHoverInteractionKind();
        var targetTagName = _this.props.targetTagName;
        if (fill) {
          targetTagName = "div";
        }
        var ref = mergeRefs(popperChildRef, _this.targetRef);
        var targetEventHandlers = isHoverInteractionKind ? {
          // HOVER handlers
          onBlur: _this.handleTargetBlur,
          onContextMenu: _this.handleTargetContextMenu,
          onFocus: _this.handleTargetFocus,
          onMouseEnter: _this.handleMouseEnter,
          onMouseLeave: _this.handleMouseLeave
        } : {
          // CLICK needs only one handler
          onClick: _this.handleTargetClick,
          // For keyboard accessibility, trigger the same behavior as a click event upon pressing ENTER/SPACE
          onKeyDown: _this.handleKeyDown
        };
        var targetTabIndex = openOnTargetFocus && isHoverInteractionKind ? 0 : void 0;
        var ownTargetProps = __assign3({
          "aria-haspopup": (_d2 = _this.props.popupKind) !== null && _d2 !== void 0 ? _d2 : _this.props.interactionKind === Popover2InteractionKind.HOVER_TARGET_ONLY ? void 0 : "true",
          // N.B. this.props.className is passed along to renderTarget even though the user would have access to it.
          // If, instead, renderTarget is undefined and the target is provided as a child, this.props.className is
          // applied to the generated target wrapper element.
          className: (0, import_classnames3.default)(className, POPOVER2_TARGET, (_b2 = {}, _b2[POPOVER2_OPEN] = isOpen, // this class is mainly useful for button targets
          _b2[classes_exports.ACTIVE] = isOpen && !isControlled && !isHoverInteractionKind, _b2)),
          ref
        }, targetEventHandlers);
        var targetModifierClasses = (_c2 = {}, // this class is mainly useful for Blueprint <Button> targets; we should only apply it for
        // uncontrolled popovers when they are opened by a user interaction
        _c2[classes_exports.ACTIVE] = isOpen && !isControlled && !isHoverInteractionKind, // similarly, this class is mainly useful for targets like <Button>, <InputGroup>, etc.
        _c2[classes_exports.FILL] = fill, _c2);
        var target;
        if (renderTarget !== void 0) {
          target = renderTarget(__assign3(__assign3({}, ownTargetProps), {
            className: (0, import_classnames3.default)(ownTargetProps.className, targetModifierClasses),
            // if the consumer renders a tooltip target, it's their responsibility to disable that tooltip
            // when *this* popover is open
            isOpen,
            tabIndex: targetTabIndex
          }));
        } else {
          var childTarget = utils_exports.ensureElement(React18.Children.toArray(children)[0]);
          if (childTarget === void 0) {
            return null;
          }
          var clonedTarget = React18.cloneElement(childTarget, {
            className: (0, import_classnames3.default)(childTarget.props.className, targetModifierClasses),
            // force disable single Tooltip2 child when popover is open
            disabled: isOpen && utils_exports.isElementOfType(childTarget, Tooltip2) ? true : childTarget.props.disabled,
            tabIndex: (_e = childTarget.props.tabIndex) !== null && _e !== void 0 ? _e : targetTabIndex
          });
          var wrappedTarget = React18.createElement(targetTagName, __assign3(__assign3({}, ownTargetProps), _this.props.targetProps), clonedTarget);
          target = wrappedTarget;
        }
        return React18.createElement(ResizeSensor2, { targetRef: ref, onResize: _this.reposition }, target);
      };
      _this.renderPopover = function(popperProps) {
        var _a2;
        var _b2;
        var _c2 = _this.props, interactionKind = _c2.interactionKind, shouldReturnFocusOnClose = _c2.shouldReturnFocusOnClose, usePortal = _c2.usePortal;
        var isOpen = _this.state.isOpen;
        var transformOrigin = getTransformOrigin(popperProps.placement, _this.isArrowEnabled() ? popperProps.arrowProps.style : void 0);
        _this.popperScheduleUpdate = popperProps.update;
        var popoverHandlers = {
          // always check popover clicks for dismiss class
          onClick: _this.handlePopoverClick,
          // treat ENTER/SPACE keys the same as a click for accessibility
          // eslint-disable-next-line deprecation/deprecation
          onKeyDown: function(event) {
            return keys_exports.isKeyboardClick(event.keyCode) && _this.handlePopoverClick(event);
          }
        };
        if (interactionKind === Popover2InteractionKind.HOVER || !usePortal && interactionKind === Popover2InteractionKind.HOVER_TARGET_ONLY) {
          popoverHandlers.onMouseEnter = _this.handleMouseEnter;
          popoverHandlers.onMouseLeave = _this.handleMouseLeave;
        }
        var basePlacement = getBasePlacement2(popperProps.placement);
        var popoverClasses = (0, import_classnames3.default)(POPOVER2, (_a2 = {}, _a2[classes_exports.DARK] = _this.props.inheritDarkTheme && _this.state.hasDarkParent, _a2[classes_exports.MINIMAL] = _this.props.minimal, _a2[POPOVER2_CAPTURING_DISMISS] = _this.props.captureDismiss, _a2[POPOVER2_MATCH_TARGET_WIDTH] = _this.props.matchTargetWidth, _a2[POPOVER2_REFERENCE_HIDDEN] = popperProps.isReferenceHidden === true, _a2[POPOVER2_POPPER_ESCAPED] = popperProps.hasPopperEscaped === true, _a2), "".concat(POPOVER2_CONTENT_PLACEMENT, "-").concat(basePlacement), _this.props.popoverClassName);
        var defaultAutoFocus = _this.isHoverInteractionKind() ? false : void 0;
        return React18.createElement(
          Overlay,
          {
            autoFocus: (_b2 = _this.props.autoFocus) !== null && _b2 !== void 0 ? _b2 : defaultAutoFocus,
            backdropClassName: POPOVER2_BACKDROP,
            backdropProps: _this.props.backdropProps,
            canEscapeKeyClose: _this.props.canEscapeKeyClose,
            canOutsideClickClose: _this.props.interactionKind === Popover2InteractionKind.CLICK,
            enforceFocus: _this.props.enforceFocus,
            hasBackdrop: _this.props.hasBackdrop,
            isOpen,
            onClose: _this.handleOverlayClose,
            onClosed: _this.props.onClosed,
            onClosing: _this.props.onClosing,
            onOpened: _this.props.onOpened,
            onOpening: _this.props.onOpening,
            transitionDuration: _this.props.transitionDuration,
            transitionName: POPOVER2,
            usePortal: _this.props.usePortal,
            portalClassName: _this.props.portalClassName,
            portalContainer: _this.props.portalContainer,
            // if hover interaction, it doesn't make sense to take over focus control
            shouldReturnFocusOnClose: _this.isHoverInteractionKind() ? false : shouldReturnFocusOnClose
          },
          React18.createElement(
            "div",
            { className: POPOVER2_TRANSITION_CONTAINER, ref: popperProps.ref, style: popperProps.style },
            React18.createElement(
              ResizeSensor2,
              { onResize: _this.reposition },
              React18.createElement(
                "div",
                __assign3({ className: popoverClasses, style: { transformOrigin }, ref: _this.popoverRef }, popoverHandlers),
                _this.isArrowEnabled() && React18.createElement(Popover2Arrow, { arrowProps: popperProps.arrowProps, placement: popperProps.placement }),
                React18.createElement("div", { className: POPOVER2_CONTENT }, _this.props.content)
              )
            )
          )
        );
      };
      _this.handleTargetFocus = function(e) {
        if (_this.props.openOnTargetFocus && _this.isHoverInteractionKind()) {
          if (e.relatedTarget == null && !_this.lostFocusOnSamePage) {
            return;
          }
          _this.handleMouseEnter(e);
        }
      };
      _this.handleTargetBlur = function(e) {
        if (_this.props.openOnTargetFocus && _this.isHoverInteractionKind()) {
          if (e.relatedTarget != null) {
            if (e.relatedTarget !== _this.popoverElement && !_this.isElementInPopover(e.relatedTarget)) {
              _this.handleMouseLeave(e);
            }
          } else {
            _this.handleMouseLeave(e);
          }
        }
        _this.lostFocusOnSamePage = e.relatedTarget != null;
      };
      _this.handleTargetContextMenu = function(e) {
        if (e.defaultPrevented) {
          _this.setOpenState(false, e);
        }
      };
      _this.handleMouseEnter = function(e) {
        _this.isMouseInTargetOrPopover = true;
        if (!_this.props.usePortal && _this.isElementInPopover(e.target) && _this.props.interactionKind === Popover2InteractionKind.HOVER_TARGET_ONLY && !_this.props.openOnTargetFocus) {
          _this.handleMouseLeave(e);
        } else if (!_this.props.disabled) {
          _this.setOpenState(true, e, _this.props.hoverOpenDelay);
        }
      };
      _this.handleMouseLeave = function(e) {
        _this.isMouseInTargetOrPopover = false;
        _this.setTimeout(function() {
          if (_this.isMouseInTargetOrPopover) {
            return;
          }
          _this.setOpenState(false, e, _this.props.hoverCloseDelay);
        });
      };
      _this.handlePopoverClick = function(e) {
        var _a2, _b2, _c2, _d2;
        var eventTarget = e.target;
        var eventPopover = eventTarget.closest(".".concat(POPOVER2));
        var eventPopoverV1 = eventTarget.closest(".".concat(classes_exports.POPOVER));
        var isEventFromSelf = (eventPopover !== null && eventPopover !== void 0 ? eventPopover : eventPopoverV1) === _this.getPopoverElement();
        var isEventPopoverCapturing = (_b2 = (_a2 = eventPopover === null || eventPopover === void 0 ? void 0 : eventPopover.classList.contains(POPOVER2_CAPTURING_DISMISS)) !== null && _a2 !== void 0 ? _a2 : eventPopoverV1 === null || eventPopoverV1 === void 0 ? void 0 : eventPopoverV1.classList.contains(classes_exports.POPOVER_CAPTURING_DISMISS)) !== null && _b2 !== void 0 ? _b2 : false;
        var dismissElement = eventTarget.closest(".".concat(POPOVER2_DISMISS, ", .").concat(POPOVER2_DISMISS_OVERRIDE));
        var dismissElementV1 = eventTarget.closest(".".concat(classes_exports.POPOVER_DISMISS, ", .").concat(classes_exports.POPOVER_DISMISS_OVERRIDE));
        var shouldDismiss = (_d2 = (_c2 = dismissElement === null || dismissElement === void 0 ? void 0 : dismissElement.classList.contains(POPOVER2_DISMISS)) !== null && _c2 !== void 0 ? _c2 : dismissElementV1 === null || dismissElementV1 === void 0 ? void 0 : dismissElementV1.classList.contains(classes_exports.POPOVER_DISMISS)) !== null && _d2 !== void 0 ? _d2 : false;
        var isDisabled = eventTarget.closest(":disabled, .".concat(classes_exports.DISABLED)) != null;
        if (shouldDismiss && !isDisabled && (!isEventPopoverCapturing || isEventFromSelf)) {
          _this.setOpenState(false, e);
        }
      };
      _this.handleOverlayClose = function(e) {
        var _a2;
        if (_this.targetElement === null || e === void 0) {
          return;
        }
        var event = (_a2 = e.nativeEvent) !== null && _a2 !== void 0 ? _a2 : e;
        var eventTarget = event.composed ? event.composedPath()[0] : event.target;
        if (!utils_exports.elementIsOrContains(_this.targetElement, eventTarget) || e.nativeEvent instanceof KeyboardEvent) {
          _this.setOpenState(false, e);
        }
      };
      _this.handleKeyDown = function(e) {
        var isKeyboardClick2 = keys_exports.isKeyboardClick(e.keyCode);
        if (isKeyboardClick2) {
          _this.handleTargetClick(e);
        }
      };
      _this.handleTargetClick = function(e) {
        var shouldIgnoreClick = _this.state.isOpen && _this.isSimulatedButtonClick(e);
        if (!shouldIgnoreClick) {
          if (!_this.props.disabled && !_this.isElementInPopover(e.target)) {
            if (_this.props.isOpen == null) {
              _this.setState(function(prevState) {
                return { isOpen: !prevState.isOpen };
              });
            } else {
              _this.setOpenState(!_this.props.isOpen, e);
            }
          }
        }
      };
      _this.isSimulatedButtonClick = function(e) {
        return !e.isTrusted && e.target.matches(".".concat(classes_exports.BUTTON));
      };
      return _this;
    }
    Popover22.prototype.getPopoverElement = function() {
      var _a2;
      return (_a2 = this.popoverElement) === null || _a2 === void 0 ? void 0 : _a2.querySelector(".".concat(POPOVER2));
    };
    Popover22.prototype.getIsOpen = function(props) {
      var _a2;
      if (props.disabled) {
        return false;
      } else {
        return (_a2 = props.isOpen) !== null && _a2 !== void 0 ? _a2 : props.defaultIsOpen;
      }
    };
    Popover22.prototype.render = function() {
      var _a2 = this.props, disabled = _a2.disabled, content = _a2.content, placement = _a2.placement, _b2 = _a2.position, position = _b2 === void 0 ? "auto" : _b2, positioningStrategy = _a2.positioningStrategy;
      var isOpen = this.state.isOpen;
      var isContentEmpty = content == null || typeof content === "string" && content.trim() === "";
      if (isContentEmpty) {
        if (!disabled && isOpen !== false && !utils_exports.isNodeEnv("production")) {
          console.warn(POPOVER2_WARN_EMPTY_CONTENT);
        }
        return this.renderTarget({ ref: noop2 });
      }
      return React18.createElement(
        Manager,
        null,
        React18.createElement(Reference, null, this.renderTarget),
        React18.createElement(Popper, { innerRef: this.popoverRef, placement: placement !== null && placement !== void 0 ? placement : positionToPlacement(position), strategy: positioningStrategy, modifiers: this.getPopperModifiers() }, this.renderPopover)
      );
    };
    Popover22.prototype.componentDidMount = function() {
      this.updateDarkParent();
    };
    Popover22.prototype.componentDidUpdate = function(props, state) {
      _super.prototype.componentDidUpdate.call(this, props, state);
      this.updateDarkParent();
      var nextIsOpen = this.getIsOpen(this.props);
      if (this.props.isOpen != null && nextIsOpen !== this.state.isOpen) {
        this.setOpenState(nextIsOpen);
        this.setState({ isOpen: nextIsOpen });
      } else if (this.props.disabled && this.state.isOpen && this.props.isOpen == null) {
        this.setOpenState(false);
      }
    };
    Popover22.prototype.validateProps = function(props) {
      if (props.isOpen == null && props.onInteraction != null) {
        console.warn(POPOVER2_WARN_UNCONTROLLED_ONINTERACTION);
      }
      if (props.hasBackdrop && !props.usePortal) {
        console.warn(POPOVER2_WARN_HAS_BACKDROP_INLINE);
      }
      if (props.hasBackdrop && props.interactionKind !== Popover2InteractionKind.CLICK) {
        console.warn(POPOVER2_HAS_BACKDROP_INTERACTION);
      }
      if (props.placement !== void 0 && props.position !== void 0) {
        console.warn(POPOVER2_WARN_PLACEMENT_AND_POSITION_MUTEX);
      }
      var childrenCount = React18.Children.count(props.children);
      var hasRenderTargetProp = props.renderTarget !== void 0;
      var hasTargetPropsProp = props.targetProps !== void 0;
      if (childrenCount === 0 && !hasRenderTargetProp) {
        console.warn(POPOVER2_REQUIRES_TARGET);
      }
      if (childrenCount > 1) {
        console.warn(POPOVER2_WARN_TOO_MANY_CHILDREN);
      }
      if (childrenCount > 0 && hasRenderTargetProp) {
        console.warn(POPOVER2_WARN_DOUBLE_TARGET);
      }
      if (hasRenderTargetProp && hasTargetPropsProp) {
        console.warn(POPOVER2_WARN_TARGET_PROPS_WITH_RENDER_TARGET);
      }
    };
    Popover22.prototype.getPopperModifiers = function() {
      var _a2, _b2, _c2, _d2;
      var _e = this.props, matchTargetWidth = _e.matchTargetWidth, modifiers = _e.modifiers, modifiersCustom = _e.modifiersCustom;
      var popperModifiers = [
        __assign3({ enabled: this.isArrowEnabled(), name: "arrow" }, modifiers === null || modifiers === void 0 ? void 0 : modifiers.arrow),
        __assign3(__assign3({ name: "computeStyles" }, modifiers === null || modifiers === void 0 ? void 0 : modifiers.computeStyles), { options: __assign3({
          adaptive: true,
          // We disable the built-in gpuAcceleration so that
          // Popper.js will return us easy to interpolate values
          // (top, left instead of transform: translate3d)
          // We'll then use these values to generate the needed
          // css transform values blended with the react-spring values
          gpuAcceleration: false
        }, (_a2 = modifiers === null || modifiers === void 0 ? void 0 : modifiers.computeStyles) === null || _a2 === void 0 ? void 0 : _a2.options) }),
        __assign3(__assign3({ enabled: this.isArrowEnabled(), name: "offset" }, modifiers === null || modifiers === void 0 ? void 0 : modifiers.offset), { options: __assign3({ offset: [0, POPOVER_ARROW_SVG_SIZE / 2] }, (_b2 = modifiers === null || modifiers === void 0 ? void 0 : modifiers.offset) === null || _b2 === void 0 ? void 0 : _b2.options) }),
        __assign3(__assign3({ name: "flip" }, modifiers === null || modifiers === void 0 ? void 0 : modifiers.flip), { options: __assign3({ boundary: this.props.boundary, rootBoundary: this.props.rootBoundary }, (_c2 = modifiers === null || modifiers === void 0 ? void 0 : modifiers.flip) === null || _c2 === void 0 ? void 0 : _c2.options) }),
        __assign3(__assign3({ name: "preventOverflow" }, modifiers === null || modifiers === void 0 ? void 0 : modifiers.preventOverflow), { options: __assign3({ boundary: this.props.boundary, rootBoundary: this.props.rootBoundary }, (_d2 = modifiers === null || modifiers === void 0 ? void 0 : modifiers.preventOverflow) === null || _d2 === void 0 ? void 0 : _d2.options) })
      ];
      if (matchTargetWidth) {
        popperModifiers.push(matchReferenceWidthModifier);
      }
      if (modifiersCustom !== void 0) {
        popperModifiers.push.apply(popperModifiers, modifiersCustom);
      }
      return popperModifiers;
    };
    Popover22.prototype.setOpenState = function(isOpen, e, timeout2) {
      var _this = this;
      var _a2, _b2, _c2, _d2, _e;
      (_a2 = this.cancelOpenTimeout) === null || _a2 === void 0 ? void 0 : _a2.call(this);
      if (timeout2 !== void 0 && timeout2 > 0) {
        this.cancelOpenTimeout = this.setTimeout(function() {
          return _this.setOpenState(isOpen, e);
        }, timeout2);
      } else {
        if (this.props.isOpen == null) {
          this.setState({ isOpen });
        } else {
          (_c2 = (_b2 = this.props).onInteraction) === null || _c2 === void 0 ? void 0 : _c2.call(_b2, isOpen, e);
        }
        if (!isOpen) {
          (_e = (_d2 = this.props).onClose) === null || _e === void 0 ? void 0 : _e.call(_d2, e);
        }
      }
    };
    Popover22.prototype.updateDarkParent = function() {
      if (this.props.usePortal && this.state.isOpen) {
        var hasDarkParent = this.targetElement != null && this.targetElement.closest(".".concat(classes_exports.DARK)) != null;
        this.setState({ hasDarkParent });
      }
    };
    Popover22.prototype.isElementInPopover = function(element) {
      var _a2, _b2;
      return (_b2 = (_a2 = this.getPopoverElement()) === null || _a2 === void 0 ? void 0 : _a2.contains(element)) !== null && _b2 !== void 0 ? _b2 : false;
    };
    Popover22.displayName = "".concat(DISPLAYNAME_PREFIX, ".Popover2");
    Popover22.defaultProps = {
      boundary: "clippingParents",
      captureDismiss: false,
      defaultIsOpen: false,
      disabled: false,
      fill: false,
      hasBackdrop: false,
      hoverCloseDelay: 300,
      hoverOpenDelay: 150,
      inheritDarkTheme: true,
      interactionKind: Popover2InteractionKind.CLICK,
      matchTargetWidth: false,
      minimal: false,
      openOnTargetFocus: true,
      // N.B. we don't set a default for `placement` or `position` here because that would trigger
      // a warning in validateProps if the other prop is specified by a user of this component
      positioningStrategy: "absolute",
      renderTarget: void 0,
      shouldReturnFocusOnClose: false,
      targetTagName: "span",
      transitionDuration: 300,
      usePortal: true
    };
    return Popover22;
  }(AbstractPureComponent2)
);
function noop2() {
}

// src/ui/tooltip.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var Tooltip = ({
  tooltipHeading,
  tooltipContent,
  position = "top",
  children,
  disabled = false,
  className = "",
  openDelay = 200,
  closeDelay
}) => {
  const { theme } = useTheme();
  return /* @__PURE__ */ jsx2(
    Tooltip2,
    {
      disabled,
      hoverOpenDelay: openDelay,
      hoverCloseDelay: closeDelay,
      content: /* @__PURE__ */ jsxs(
        "div",
        {
          className: `relative z-50 max-w-xs gap-1 rounded-md p-2 text-xs shadow-md ${theme === "custom" ? "bg-custom-background-100 text-custom-text-200" : "bg-black text-gray-400"} break-words overflow-hidden ${className}`,
          children: [
            tooltipHeading && /* @__PURE__ */ jsx2(
              "h5",
              {
                className: `font-medium ${theme === "custom" ? "text-custom-text-100" : "text-white"}`,
                children: tooltipHeading
              }
            ),
            tooltipContent
          ]
        }
      ),
      position,
      renderTarget: (_a2) => {
        var _b2 = _a2, { isOpen: isTooltipOpen, ref: eleReference } = _b2, tooltipProps = __objRest(_b2, ["isOpen", "ref"]);
        return React19.cloneElement(children, __spreadValues(__spreadValues({ ref: eleReference }, tooltipProps), children.props));
      }
    }
  );
};

// src/ui/menus/fixed-menu/index.tsx
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var FixedMenu = (props) => {
  var _a2;
  const basicMarkItems = [
    BoldItem(props.editor),
    ItalicItem(props.editor),
    UnderLineItem(props.editor),
    StrikeThroughItem(props.editor)
  ];
  const listItems = [
    BulletListItem(props.editor),
    NumberedListItem(props.editor)
  ];
  const userActionItems = [
    QuoteItem(props.editor),
    CodeItem(props.editor)
  ];
  const complexItems = [
    TableItem(props.editor),
    ImageItem(props.editor, props.uploadFile, props.setIsSubmitting)
  ];
  const handleAccessChange = (accessKey) => {
    var _a3;
    (_a3 = props.commentAccessSpecifier) == null ? void 0 : _a3.onAccessChange(accessKey);
  };
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      className: "flex w-fit divide-x divide-custom-border-300 rounded border border-custom-border-300 bg-custom-background-100 shadow-xl",
      children: [
        props.commentAccessSpecifier && /* @__PURE__ */ jsx3("div", { className: "flex border border-custom-border-300 mt-0 divide-x divide-custom-border-300 rounded overflow-hidden", children: (_a2 = props == null ? void 0 : props.commentAccessSpecifier.commentAccess) == null ? void 0 : _a2.map((access) => {
          var _a3, _b2;
          return /* @__PURE__ */ jsx3(Tooltip, { tooltipContent: access.label, children: /* @__PURE__ */ jsx3(
            "button",
            {
              type: "button",
              onClick: () => handleAccessChange(access.key),
              className: `grid place-basicMarkItems-center p-1 hover:bg-custom-background-80 ${((_a3 = props.commentAccessSpecifier) == null ? void 0 : _a3.accessValue) === access.key ? "bg-custom-background-80" : ""}`,
              children: /* @__PURE__ */ jsx3(
                Icon,
                {
                  iconName: access.icon,
                  className: `w-4 h-4 ${((_b2 = props.commentAccessSpecifier) == null ? void 0 : _b2.accessValue) === access.key ? "!text-custom-text-100" : "!text-custom-text-400"}`
                }
              )
            }
          ) }, access.key);
        }) }),
        /* @__PURE__ */ jsx3("div", { className: "flex", children: basicMarkItems.map((item, index) => /* @__PURE__ */ jsx3(
          "button",
          {
            type: "button",
            onClick: item.command,
            className: cn(
              "p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors",
              {
                "text-custom-text-100 bg-custom-primary-100/5": item.isActive()
              }
            ),
            children: /* @__PURE__ */ jsx3(
              item.icon,
              {
                className: cn("h-4 w-4", {
                  "text-custom-text-100": item.isActive()
                })
              }
            )
          },
          index
        )) }),
        /* @__PURE__ */ jsx3("div", { className: "flex", children: listItems.map((item, index) => /* @__PURE__ */ jsx3(
          "button",
          {
            type: "button",
            onClick: item.command,
            className: cn(
              "p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors",
              {
                "text-custom-text-100 bg-custom-primary-100/5": item.isActive()
              }
            ),
            children: /* @__PURE__ */ jsx3(
              item.icon,
              {
                className: cn("h-4 w-4", {
                  "text-custom-text-100": item.isActive()
                })
              }
            )
          },
          index
        )) }),
        /* @__PURE__ */ jsx3("div", { className: "flex", children: userActionItems.map((item, index) => /* @__PURE__ */ jsx3(
          "button",
          {
            type: "button",
            onClick: item.command,
            className: cn(
              "p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors",
              {
                "text-custom-text-100 bg-custom-primary-100/5": item.isActive()
              }
            ),
            children: /* @__PURE__ */ jsx3(
              item.icon,
              {
                className: cn("h-4 w-4", {
                  "text-custom-text-100": item.isActive()
                })
              }
            )
          },
          index
        )) }),
        /* @__PURE__ */ jsx3("div", { className: "flex", children: complexItems.map((item, index) => /* @__PURE__ */ jsx3(
          "button",
          {
            type: "button",
            onClick: item.command,
            className: cn(
              "p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors",
              {
                "text-custom-text-100 bg-custom-primary-100/5": item.isActive()
              }
            ),
            children: /* @__PURE__ */ jsx3(
              item.icon,
              {
                className: cn("h-4 w-4", {
                  "text-custom-text-100": item.isActive()
                })
              }
            )
          },
          index
        )) })
      ]
    }
  );
};

// src/ui/extensions/custom-list-extension.tsx
import ListItem from "@tiptap/extension-list-item";
var CustomListItem = ListItem.extend({
  addKeyboardShortcuts() {
    return {
      "Shift-Enter": () => this.editor.chain().focus().splitListItem("listItem").run()
    };
  }
});

// ../../../node_modules/prosemirror-model/dist/index.js
function findDiffStart(a, b, pos) {
  for (let i = 0; ; i++) {
    if (i == a.childCount || i == b.childCount)
      return a.childCount == b.childCount ? null : pos;
    let childA = a.child(i), childB = b.child(i);
    if (childA == childB) {
      pos += childA.nodeSize;
      continue;
    }
    if (!childA.sameMarkup(childB))
      return pos;
    if (childA.isText && childA.text != childB.text) {
      for (let j = 0; childA.text[j] == childB.text[j]; j++)
        pos++;
      return pos;
    }
    if (childA.content.size || childB.content.size) {
      let inner = findDiffStart(childA.content, childB.content, pos + 1);
      if (inner != null)
        return inner;
    }
    pos += childA.nodeSize;
  }
}
function findDiffEnd(a, b, posA, posB) {
  for (let iA = a.childCount, iB = b.childCount; ; ) {
    if (iA == 0 || iB == 0)
      return iA == iB ? null : { a: posA, b: posB };
    let childA = a.child(--iA), childB = b.child(--iB), size2 = childA.nodeSize;
    if (childA == childB) {
      posA -= size2;
      posB -= size2;
      continue;
    }
    if (!childA.sameMarkup(childB))
      return { a: posA, b: posB };
    if (childA.isText && childA.text != childB.text) {
      let same = 0, minSize = Math.min(childA.text.length, childB.text.length);
      while (same < minSize && childA.text[childA.text.length - same - 1] == childB.text[childB.text.length - same - 1]) {
        same++;
        posA--;
        posB--;
      }
      return { a: posA, b: posB };
    }
    if (childA.content.size || childB.content.size) {
      let inner = findDiffEnd(childA.content, childB.content, posA - 1, posB - 1);
      if (inner)
        return inner;
    }
    posA -= size2;
    posB -= size2;
  }
}
var Fragment = class _Fragment {
  /**
  @internal
  */
  constructor(content, size2) {
    this.content = content;
    this.size = size2 || 0;
    if (size2 == null)
      for (let i = 0; i < content.length; i++)
        this.size += content[i].nodeSize;
  }
  /**
  Invoke a callback for all descendant nodes between the given two
  positions (relative to start of this fragment). Doesn't descend
  into a node when the callback returns `false`.
  */
  nodesBetween(from, to, f, nodeStart = 0, parent) {
    for (let i = 0, pos = 0; pos < to; i++) {
      let child = this.content[i], end2 = pos + child.nodeSize;
      if (end2 > from && f(child, nodeStart + pos, parent || null, i) !== false && child.content.size) {
        let start2 = pos + 1;
        child.nodesBetween(Math.max(0, from - start2), Math.min(child.content.size, to - start2), f, nodeStart + start2);
      }
      pos = end2;
    }
  }
  /**
  Call the given callback for every descendant node. `pos` will be
  relative to the start of the fragment. The callback may return
  `false` to prevent traversal of a given node's children.
  */
  descendants(f) {
    this.nodesBetween(0, this.size, f);
  }
  /**
  Extract the text between `from` and `to`. See the same method on
  [`Node`](https://prosemirror.net/docs/ref/#model.Node.textBetween).
  */
  textBetween(from, to, blockSeparator, leafText) {
    let text = "", separated = true;
    this.nodesBetween(from, to, (node, pos) => {
      if (node.isText) {
        text += node.text.slice(Math.max(from, pos) - pos, to - pos);
        separated = !blockSeparator;
      } else if (node.isLeaf) {
        if (leafText) {
          text += typeof leafText === "function" ? leafText(node) : leafText;
        } else if (node.type.spec.leafText) {
          text += node.type.spec.leafText(node);
        }
        separated = !blockSeparator;
      } else if (!separated && node.isBlock) {
        text += blockSeparator;
        separated = true;
      }
    }, 0);
    return text;
  }
  /**
  Create a new fragment containing the combined content of this
  fragment and the other.
  */
  append(other) {
    if (!other.size)
      return this;
    if (!this.size)
      return other;
    let last = this.lastChild, first2 = other.firstChild, content = this.content.slice(), i = 0;
    if (last.isText && last.sameMarkup(first2)) {
      content[content.length - 1] = last.withText(last.text + first2.text);
      i = 1;
    }
    for (; i < other.content.length; i++)
      content.push(other.content[i]);
    return new _Fragment(content, this.size + other.size);
  }
  /**
  Cut out the sub-fragment between the two given positions.
  */
  cut(from, to = this.size) {
    if (from == 0 && to == this.size)
      return this;
    let result = [], size2 = 0;
    if (to > from)
      for (let i = 0, pos = 0; pos < to; i++) {
        let child = this.content[i], end2 = pos + child.nodeSize;
        if (end2 > from) {
          if (pos < from || end2 > to) {
            if (child.isText)
              child = child.cut(Math.max(0, from - pos), Math.min(child.text.length, to - pos));
            else
              child = child.cut(Math.max(0, from - pos - 1), Math.min(child.content.size, to - pos - 1));
          }
          result.push(child);
          size2 += child.nodeSize;
        }
        pos = end2;
      }
    return new _Fragment(result, size2);
  }
  /**
  @internal
  */
  cutByIndex(from, to) {
    if (from == to)
      return _Fragment.empty;
    if (from == 0 && to == this.content.length)
      return this;
    return new _Fragment(this.content.slice(from, to));
  }
  /**
  Create a new fragment in which the node at the given index is
  replaced by the given node.
  */
  replaceChild(index, node) {
    let current = this.content[index];
    if (current == node)
      return this;
    let copy2 = this.content.slice();
    let size2 = this.size + node.nodeSize - current.nodeSize;
    copy2[index] = node;
    return new _Fragment(copy2, size2);
  }
  /**
  Create a new fragment by prepending the given node to this
  fragment.
  */
  addToStart(node) {
    return new _Fragment([node].concat(this.content), this.size + node.nodeSize);
  }
  /**
  Create a new fragment by appending the given node to this
  fragment.
  */
  addToEnd(node) {
    return new _Fragment(this.content.concat(node), this.size + node.nodeSize);
  }
  /**
  Compare this fragment to another one.
  */
  eq(other) {
    if (this.content.length != other.content.length)
      return false;
    for (let i = 0; i < this.content.length; i++)
      if (!this.content[i].eq(other.content[i]))
        return false;
    return true;
  }
  /**
  The first child of the fragment, or `null` if it is empty.
  */
  get firstChild() {
    return this.content.length ? this.content[0] : null;
  }
  /**
  The last child of the fragment, or `null` if it is empty.
  */
  get lastChild() {
    return this.content.length ? this.content[this.content.length - 1] : null;
  }
  /**
  The number of child nodes in this fragment.
  */
  get childCount() {
    return this.content.length;
  }
  /**
  Get the child node at the given index. Raise an error when the
  index is out of range.
  */
  child(index) {
    let found2 = this.content[index];
    if (!found2)
      throw new RangeError("Index " + index + " out of range for " + this);
    return found2;
  }
  /**
  Get the child node at the given index, if it exists.
  */
  maybeChild(index) {
    return this.content[index] || null;
  }
  /**
  Call `f` for every child node, passing the node, its offset
  into this parent node, and its index.
  */
  forEach(f) {
    for (let i = 0, p = 0; i < this.content.length; i++) {
      let child = this.content[i];
      f(child, p, i);
      p += child.nodeSize;
    }
  }
  /**
  Find the first position at which this fragment and another
  fragment differ, or `null` if they are the same.
  */
  findDiffStart(other, pos = 0) {
    return findDiffStart(this, other, pos);
  }
  /**
  Find the first position, searching from the end, at which this
  fragment and the given fragment differ, or `null` if they are
  the same. Since this position will not be the same in both
  nodes, an object with two separate positions is returned.
  */
  findDiffEnd(other, pos = this.size, otherPos = other.size) {
    return findDiffEnd(this, other, pos, otherPos);
  }
  /**
  Find the index and inner offset corresponding to a given relative
  position in this fragment. The result object will be reused
  (overwritten) the next time the function is called. (Not public.)
  */
  findIndex(pos, round2 = -1) {
    if (pos == 0)
      return retIndex(0, pos);
    if (pos == this.size)
      return retIndex(this.content.length, pos);
    if (pos > this.size || pos < 0)
      throw new RangeError(`Position ${pos} outside of fragment (${this})`);
    for (let i = 0, curPos = 0; ; i++) {
      let cur = this.child(i), end2 = curPos + cur.nodeSize;
      if (end2 >= pos) {
        if (end2 == pos || round2 > 0)
          return retIndex(i + 1, end2);
        return retIndex(i, curPos);
      }
      curPos = end2;
    }
  }
  /**
  Return a debugging string that describes this fragment.
  */
  toString() {
    return "<" + this.toStringInner() + ">";
  }
  /**
  @internal
  */
  toStringInner() {
    return this.content.join(", ");
  }
  /**
  Create a JSON-serializeable representation of this fragment.
  */
  toJSON() {
    return this.content.length ? this.content.map((n) => n.toJSON()) : null;
  }
  /**
  Deserialize a fragment from its JSON representation.
  */
  static fromJSON(schema, value) {
    if (!value)
      return _Fragment.empty;
    if (!Array.isArray(value))
      throw new RangeError("Invalid input for Fragment.fromJSON");
    return new _Fragment(value.map(schema.nodeFromJSON));
  }
  /**
  Build a fragment from an array of nodes. Ensures that adjacent
  text nodes with the same marks are joined together.
  */
  static fromArray(array) {
    if (!array.length)
      return _Fragment.empty;
    let joined, size2 = 0;
    for (let i = 0; i < array.length; i++) {
      let node = array[i];
      size2 += node.nodeSize;
      if (i && node.isText && array[i - 1].sameMarkup(node)) {
        if (!joined)
          joined = array.slice(0, i);
        joined[joined.length - 1] = node.withText(joined[joined.length - 1].text + node.text);
      } else if (joined) {
        joined.push(node);
      }
    }
    return new _Fragment(joined || array, size2);
  }
  /**
  Create a fragment from something that can be interpreted as a
  set of nodes. For `null`, it returns the empty fragment. For a
  fragment, the fragment itself. For a node or array of nodes, a
  fragment containing those nodes.
  */
  static from(nodes) {
    if (!nodes)
      return _Fragment.empty;
    if (nodes instanceof _Fragment)
      return nodes;
    if (Array.isArray(nodes))
      return this.fromArray(nodes);
    if (nodes.attrs)
      return new _Fragment([nodes], nodes.nodeSize);
    throw new RangeError("Can not convert " + nodes + " to a Fragment" + (nodes.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""));
  }
};
Fragment.empty = new Fragment([], 0);
var found = { index: 0, offset: 0 };
function retIndex(index, offset2) {
  found.index = index;
  found.offset = offset2;
  return found;
}
function compareDeep(a, b) {
  if (a === b)
    return true;
  if (!(a && typeof a == "object") || !(b && typeof b == "object"))
    return false;
  let array = Array.isArray(a);
  if (Array.isArray(b) != array)
    return false;
  if (array) {
    if (a.length != b.length)
      return false;
    for (let i = 0; i < a.length; i++)
      if (!compareDeep(a[i], b[i]))
        return false;
  } else {
    for (let p in a)
      if (!(p in b) || !compareDeep(a[p], b[p]))
        return false;
    for (let p in b)
      if (!(p in a))
        return false;
  }
  return true;
}
var Mark = class _Mark {
  /**
  @internal
  */
  constructor(type, attrs) {
    this.type = type;
    this.attrs = attrs;
  }
  /**
  Given a set of marks, create a new set which contains this one as
  well, in the right position. If this mark is already in the set,
  the set itself is returned. If any marks that are set to be
  [exclusive](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) with this mark are present,
  those are replaced by this one.
  */
  addToSet(set) {
    let copy2, placed = false;
    for (let i = 0; i < set.length; i++) {
      let other = set[i];
      if (this.eq(other))
        return set;
      if (this.type.excludes(other.type)) {
        if (!copy2)
          copy2 = set.slice(0, i);
      } else if (other.type.excludes(this.type)) {
        return set;
      } else {
        if (!placed && other.type.rank > this.type.rank) {
          if (!copy2)
            copy2 = set.slice(0, i);
          copy2.push(this);
          placed = true;
        }
        if (copy2)
          copy2.push(other);
      }
    }
    if (!copy2)
      copy2 = set.slice();
    if (!placed)
      copy2.push(this);
    return copy2;
  }
  /**
  Remove this mark from the given set, returning a new set. If this
  mark is not in the set, the set itself is returned.
  */
  removeFromSet(set) {
    for (let i = 0; i < set.length; i++)
      if (this.eq(set[i]))
        return set.slice(0, i).concat(set.slice(i + 1));
    return set;
  }
  /**
  Test whether this mark is in the given set of marks.
  */
  isInSet(set) {
    for (let i = 0; i < set.length; i++)
      if (this.eq(set[i]))
        return true;
    return false;
  }
  /**
  Test whether this mark has the same type and attributes as
  another mark.
  */
  eq(other) {
    return this == other || this.type == other.type && compareDeep(this.attrs, other.attrs);
  }
  /**
  Convert this mark to a JSON-serializeable representation.
  */
  toJSON() {
    let obj = { type: this.type.name };
    for (let _ in this.attrs) {
      obj.attrs = this.attrs;
      break;
    }
    return obj;
  }
  /**
  Deserialize a mark from JSON.
  */
  static fromJSON(schema, json) {
    if (!json)
      throw new RangeError("Invalid input for Mark.fromJSON");
    let type = schema.marks[json.type];
    if (!type)
      throw new RangeError(`There is no mark type ${json.type} in this schema`);
    return type.create(json.attrs);
  }
  /**
  Test whether two sets of marks are identical.
  */
  static sameSet(a, b) {
    if (a == b)
      return true;
    if (a.length != b.length)
      return false;
    for (let i = 0; i < a.length; i++)
      if (!a[i].eq(b[i]))
        return false;
    return true;
  }
  /**
  Create a properly sorted mark set from null, a single mark, or an
  unsorted array of marks.
  */
  static setFrom(marks) {
    if (!marks || Array.isArray(marks) && marks.length == 0)
      return _Mark.none;
    if (marks instanceof _Mark)
      return [marks];
    let copy2 = marks.slice();
    copy2.sort((a, b) => a.type.rank - b.type.rank);
    return copy2;
  }
};
Mark.none = [];
var ReplaceError = class extends Error {
};
var Slice = class _Slice {
  /**
  Create a slice. When specifying a non-zero open depth, you must
  make sure that there are nodes of at least that depth at the
  appropriate side of the fragment—i.e. if the fragment is an
  empty paragraph node, `openStart` and `openEnd` can't be greater
  than 1.
  
  It is not necessary for the content of open nodes to conform to
  the schema's content constraints, though it should be a valid
  start/end/middle for such a node, depending on which sides are
  open.
  */
  constructor(content, openStart, openEnd) {
    this.content = content;
    this.openStart = openStart;
    this.openEnd = openEnd;
  }
  /**
  The size this slice would add when inserted into a document.
  */
  get size() {
    return this.content.size - this.openStart - this.openEnd;
  }
  /**
  @internal
  */
  insertAt(pos, fragment) {
    let content = insertInto(this.content, pos + this.openStart, fragment);
    return content && new _Slice(content, this.openStart, this.openEnd);
  }
  /**
  @internal
  */
  removeBetween(from, to) {
    return new _Slice(removeRange(this.content, from + this.openStart, to + this.openStart), this.openStart, this.openEnd);
  }
  /**
  Tests whether this slice is equal to another slice.
  */
  eq(other) {
    return this.content.eq(other.content) && this.openStart == other.openStart && this.openEnd == other.openEnd;
  }
  /**
  @internal
  */
  toString() {
    return this.content + "(" + this.openStart + "," + this.openEnd + ")";
  }
  /**
  Convert a slice to a JSON-serializable representation.
  */
  toJSON() {
    if (!this.content.size)
      return null;
    let json = { content: this.content.toJSON() };
    if (this.openStart > 0)
      json.openStart = this.openStart;
    if (this.openEnd > 0)
      json.openEnd = this.openEnd;
    return json;
  }
  /**
  Deserialize a slice from its JSON representation.
  */
  static fromJSON(schema, json) {
    if (!json)
      return _Slice.empty;
    let openStart = json.openStart || 0, openEnd = json.openEnd || 0;
    if (typeof openStart != "number" || typeof openEnd != "number")
      throw new RangeError("Invalid input for Slice.fromJSON");
    return new _Slice(Fragment.fromJSON(schema, json.content), openStart, openEnd);
  }
  /**
  Create a slice from a fragment by taking the maximum possible
  open value on both side of the fragment.
  */
  static maxOpen(fragment, openIsolating = true) {
    let openStart = 0, openEnd = 0;
    for (let n = fragment.firstChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.firstChild)
      openStart++;
    for (let n = fragment.lastChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.lastChild)
      openEnd++;
    return new _Slice(fragment, openStart, openEnd);
  }
};
Slice.empty = new Slice(Fragment.empty, 0, 0);
function removeRange(content, from, to) {
  let { index, offset: offset2 } = content.findIndex(from), child = content.maybeChild(index);
  let { index: indexTo, offset: offsetTo } = content.findIndex(to);
  if (offset2 == from || child.isText) {
    if (offsetTo != to && !content.child(indexTo).isText)
      throw new RangeError("Removing non-flat range");
    return content.cut(0, from).append(content.cut(to));
  }
  if (index != indexTo)
    throw new RangeError("Removing non-flat range");
  return content.replaceChild(index, child.copy(removeRange(child.content, from - offset2 - 1, to - offset2 - 1)));
}
function insertInto(content, dist, insert, parent) {
  let { index, offset: offset2 } = content.findIndex(dist), child = content.maybeChild(index);
  if (offset2 == dist || child.isText) {
    if (parent && !parent.canReplace(index, index, insert))
      return null;
    return content.cut(0, dist).append(insert).append(content.cut(dist));
  }
  let inner = insertInto(child.content, dist - offset2 - 1, insert);
  return inner && content.replaceChild(index, child.copy(inner));
}
function replace($from, $to, slice) {
  if (slice.openStart > $from.depth)
    throw new ReplaceError("Inserted content deeper than insertion position");
  if ($from.depth - slice.openStart != $to.depth - slice.openEnd)
    throw new ReplaceError("Inconsistent open depths");
  return replaceOuter($from, $to, slice, 0);
}
function replaceOuter($from, $to, slice, depth) {
  let index = $from.index(depth), node = $from.node(depth);
  if (index == $to.index(depth) && depth < $from.depth - slice.openStart) {
    let inner = replaceOuter($from, $to, slice, depth + 1);
    return node.copy(node.content.replaceChild(index, inner));
  } else if (!slice.content.size) {
    return close(node, replaceTwoWay($from, $to, depth));
  } else if (!slice.openStart && !slice.openEnd && $from.depth == depth && $to.depth == depth) {
    let parent = $from.parent, content = parent.content;
    return close(parent, content.cut(0, $from.parentOffset).append(slice.content).append(content.cut($to.parentOffset)));
  } else {
    let { start: start2, end: end2 } = prepareSliceForReplace(slice, $from);
    return close(node, replaceThreeWay($from, start2, end2, $to, depth));
  }
}
function checkJoin(main2, sub) {
  if (!sub.type.compatibleContent(main2.type))
    throw new ReplaceError("Cannot join " + sub.type.name + " onto " + main2.type.name);
}
function joinable($before, $after, depth) {
  let node = $before.node(depth);
  checkJoin(node, $after.node(depth));
  return node;
}
function addNode(child, target) {
  let last = target.length - 1;
  if (last >= 0 && child.isText && child.sameMarkup(target[last]))
    target[last] = child.withText(target[last].text + child.text);
  else
    target.push(child);
}
function addRange($start, $end, depth, target) {
  let node = ($end || $start).node(depth);
  let startIndex = 0, endIndex = $end ? $end.index(depth) : node.childCount;
  if ($start) {
    startIndex = $start.index(depth);
    if ($start.depth > depth) {
      startIndex++;
    } else if ($start.textOffset) {
      addNode($start.nodeAfter, target);
      startIndex++;
    }
  }
  for (let i = startIndex; i < endIndex; i++)
    addNode(node.child(i), target);
  if ($end && $end.depth == depth && $end.textOffset)
    addNode($end.nodeBefore, target);
}
function close(node, content) {
  node.type.checkContent(content);
  return node.copy(content);
}
function replaceThreeWay($from, $start, $end, $to, depth) {
  let openStart = $from.depth > depth && joinable($from, $start, depth + 1);
  let openEnd = $to.depth > depth && joinable($end, $to, depth + 1);
  let content = [];
  addRange(null, $from, depth, content);
  if (openStart && openEnd && $start.index(depth) == $end.index(depth)) {
    checkJoin(openStart, openEnd);
    addNode(close(openStart, replaceThreeWay($from, $start, $end, $to, depth + 1)), content);
  } else {
    if (openStart)
      addNode(close(openStart, replaceTwoWay($from, $start, depth + 1)), content);
    addRange($start, $end, depth, content);
    if (openEnd)
      addNode(close(openEnd, replaceTwoWay($end, $to, depth + 1)), content);
  }
  addRange($to, null, depth, content);
  return new Fragment(content);
}
function replaceTwoWay($from, $to, depth) {
  let content = [];
  addRange(null, $from, depth, content);
  if ($from.depth > depth) {
    let type = joinable($from, $to, depth + 1);
    addNode(close(type, replaceTwoWay($from, $to, depth + 1)), content);
  }
  addRange($to, null, depth, content);
  return new Fragment(content);
}
function prepareSliceForReplace(slice, $along) {
  let extra = $along.depth - slice.openStart, parent = $along.node(extra);
  let node = parent.copy(slice.content);
  for (let i = extra - 1; i >= 0; i--)
    node = $along.node(i).copy(Fragment.from(node));
  return {
    start: node.resolveNoCache(slice.openStart + extra),
    end: node.resolveNoCache(node.content.size - slice.openEnd - extra)
  };
}
var ResolvedPos = class _ResolvedPos {
  /**
  @internal
  */
  constructor(pos, path, parentOffset) {
    this.pos = pos;
    this.path = path;
    this.parentOffset = parentOffset;
    this.depth = path.length / 3 - 1;
  }
  /**
  @internal
  */
  resolveDepth(val) {
    if (val == null)
      return this.depth;
    if (val < 0)
      return this.depth + val;
    return val;
  }
  /**
  The parent node that the position points into. Note that even if
  a position points into a text node, that node is not considered
  the parent—text nodes are ‘flat’ in this model, and have no content.
  */
  get parent() {
    return this.node(this.depth);
  }
  /**
  The root node in which the position was resolved.
  */
  get doc() {
    return this.node(0);
  }
  /**
  The ancestor node at the given level. `p.node(p.depth)` is the
  same as `p.parent`.
  */
  node(depth) {
    return this.path[this.resolveDepth(depth) * 3];
  }
  /**
  The index into the ancestor at the given level. If this points
  at the 3rd node in the 2nd paragraph on the top level, for
  example, `p.index(0)` is 1 and `p.index(1)` is 2.
  */
  index(depth) {
    return this.path[this.resolveDepth(depth) * 3 + 1];
  }
  /**
  The index pointing after this position into the ancestor at the
  given level.
  */
  indexAfter(depth) {
    depth = this.resolveDepth(depth);
    return this.index(depth) + (depth == this.depth && !this.textOffset ? 0 : 1);
  }
  /**
  The (absolute) position at the start of the node at the given
  level.
  */
  start(depth) {
    depth = this.resolveDepth(depth);
    return depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
  }
  /**
  The (absolute) position at the end of the node at the given
  level.
  */
  end(depth) {
    depth = this.resolveDepth(depth);
    return this.start(depth) + this.node(depth).content.size;
  }
  /**
  The (absolute) position directly before the wrapping node at the
  given level, or, when `depth` is `this.depth + 1`, the original
  position.
  */
  before(depth) {
    depth = this.resolveDepth(depth);
    if (!depth)
      throw new RangeError("There is no position before the top-level node");
    return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1];
  }
  /**
  The (absolute) position directly after the wrapping node at the
  given level, or the original position when `depth` is `this.depth + 1`.
  */
  after(depth) {
    depth = this.resolveDepth(depth);
    if (!depth)
      throw new RangeError("There is no position after the top-level node");
    return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1] + this.path[depth * 3].nodeSize;
  }
  /**
  When this position points into a text node, this returns the
  distance between the position and the start of the text node.
  Will be zero for positions that point between nodes.
  */
  get textOffset() {
    return this.pos - this.path[this.path.length - 1];
  }
  /**
  Get the node directly after the position, if any. If the position
  points into a text node, only the part of that node after the
  position is returned.
  */
  get nodeAfter() {
    let parent = this.parent, index = this.index(this.depth);
    if (index == parent.childCount)
      return null;
    let dOff = this.pos - this.path[this.path.length - 1], child = parent.child(index);
    return dOff ? parent.child(index).cut(dOff) : child;
  }
  /**
  Get the node directly before the position, if any. If the
  position points into a text node, only the part of that node
  before the position is returned.
  */
  get nodeBefore() {
    let index = this.index(this.depth);
    let dOff = this.pos - this.path[this.path.length - 1];
    if (dOff)
      return this.parent.child(index).cut(0, dOff);
    return index == 0 ? null : this.parent.child(index - 1);
  }
  /**
  Get the position at the given index in the parent node at the
  given depth (which defaults to `this.depth`).
  */
  posAtIndex(index, depth) {
    depth = this.resolveDepth(depth);
    let node = this.path[depth * 3], pos = depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
    for (let i = 0; i < index; i++)
      pos += node.child(i).nodeSize;
    return pos;
  }
  /**
  Get the marks at this position, factoring in the surrounding
  marks' [`inclusive`](https://prosemirror.net/docs/ref/#model.MarkSpec.inclusive) property. If the
  position is at the start of a non-empty node, the marks of the
  node after it (if any) are returned.
  */
  marks() {
    let parent = this.parent, index = this.index();
    if (parent.content.size == 0)
      return Mark.none;
    if (this.textOffset)
      return parent.child(index).marks;
    let main2 = parent.maybeChild(index - 1), other = parent.maybeChild(index);
    if (!main2) {
      let tmp = main2;
      main2 = other;
      other = tmp;
    }
    let marks = main2.marks;
    for (var i = 0; i < marks.length; i++)
      if (marks[i].type.spec.inclusive === false && (!other || !marks[i].isInSet(other.marks)))
        marks = marks[i--].removeFromSet(marks);
    return marks;
  }
  /**
  Get the marks after the current position, if any, except those
  that are non-inclusive and not present at position `$end`. This
  is mostly useful for getting the set of marks to preserve after a
  deletion. Will return `null` if this position is at the end of
  its parent node or its parent node isn't a textblock (in which
  case no marks should be preserved).
  */
  marksAcross($end) {
    let after = this.parent.maybeChild(this.index());
    if (!after || !after.isInline)
      return null;
    let marks = after.marks, next = $end.parent.maybeChild($end.index());
    for (var i = 0; i < marks.length; i++)
      if (marks[i].type.spec.inclusive === false && (!next || !marks[i].isInSet(next.marks)))
        marks = marks[i--].removeFromSet(marks);
    return marks;
  }
  /**
  The depth up to which this position and the given (non-resolved)
  position share the same parent nodes.
  */
  sharedDepth(pos) {
    for (let depth = this.depth; depth > 0; depth--)
      if (this.start(depth) <= pos && this.end(depth) >= pos)
        return depth;
    return 0;
  }
  /**
  Returns a range based on the place where this position and the
  given position diverge around block content. If both point into
  the same textblock, for example, a range around that textblock
  will be returned. If they point into different blocks, the range
  around those blocks in their shared ancestor is returned. You can
  pass in an optional predicate that will be called with a parent
  node to see if a range into that parent is acceptable.
  */
  blockRange(other = this, pred) {
    if (other.pos < this.pos)
      return other.blockRange(this);
    for (let d = this.depth - (this.parent.inlineContent || this.pos == other.pos ? 1 : 0); d >= 0; d--)
      if (other.pos <= this.end(d) && (!pred || pred(this.node(d))))
        return new NodeRange(this, other, d);
    return null;
  }
  /**
  Query whether the given position shares the same parent node.
  */
  sameParent(other) {
    return this.pos - this.parentOffset == other.pos - other.parentOffset;
  }
  /**
  Return the greater of this and the given position.
  */
  max(other) {
    return other.pos > this.pos ? other : this;
  }
  /**
  Return the smaller of this and the given position.
  */
  min(other) {
    return other.pos < this.pos ? other : this;
  }
  /**
  @internal
  */
  toString() {
    let str = "";
    for (let i = 1; i <= this.depth; i++)
      str += (str ? "/" : "") + this.node(i).type.name + "_" + this.index(i - 1);
    return str + ":" + this.parentOffset;
  }
  /**
  @internal
  */
  static resolve(doc, pos) {
    if (!(pos >= 0 && pos <= doc.content.size))
      throw new RangeError("Position " + pos + " out of range");
    let path = [];
    let start2 = 0, parentOffset = pos;
    for (let node = doc; ; ) {
      let { index, offset: offset2 } = node.content.findIndex(parentOffset);
      let rem = parentOffset - offset2;
      path.push(node, index, start2 + offset2);
      if (!rem)
        break;
      node = node.child(index);
      if (node.isText)
        break;
      parentOffset = rem - 1;
      start2 += offset2 + 1;
    }
    return new _ResolvedPos(pos, path, parentOffset);
  }
  /**
  @internal
  */
  static resolveCached(doc, pos) {
    for (let i = 0; i < resolveCache.length; i++) {
      let cached = resolveCache[i];
      if (cached.pos == pos && cached.doc == doc)
        return cached;
    }
    let result = resolveCache[resolveCachePos] = _ResolvedPos.resolve(doc, pos);
    resolveCachePos = (resolveCachePos + 1) % resolveCacheSize;
    return result;
  }
};
var resolveCache = [];
var resolveCachePos = 0;
var resolveCacheSize = 12;
var NodeRange = class {
  /**
  Construct a node range. `$from` and `$to` should point into the
  same node until at least the given `depth`, since a node range
  denotes an adjacent set of nodes in a single parent node.
  */
  constructor($from, $to, depth) {
    this.$from = $from;
    this.$to = $to;
    this.depth = depth;
  }
  /**
  The position at the start of the range.
  */
  get start() {
    return this.$from.before(this.depth + 1);
  }
  /**
  The position at the end of the range.
  */
  get end() {
    return this.$to.after(this.depth + 1);
  }
  /**
  The parent node that the range points into.
  */
  get parent() {
    return this.$from.node(this.depth);
  }
  /**
  The start index of the range in the parent node.
  */
  get startIndex() {
    return this.$from.index(this.depth);
  }
  /**
  The end index of the range in the parent node.
  */
  get endIndex() {
    return this.$to.indexAfter(this.depth);
  }
};
var emptyAttrs = /* @__PURE__ */ Object.create(null);
var Node2 = class _Node {
  /**
  @internal
  */
  constructor(type, attrs, content, marks = Mark.none) {
    this.type = type;
    this.attrs = attrs;
    this.marks = marks;
    this.content = content || Fragment.empty;
  }
  /**
  The size of this node, as defined by the integer-based [indexing
  scheme](/docs/guide/#doc.indexing). For text nodes, this is the
  amount of characters. For other leaf nodes, it is one. For
  non-leaf nodes, it is the size of the content plus two (the
  start and end token).
  */
  get nodeSize() {
    return this.isLeaf ? 1 : 2 + this.content.size;
  }
  /**
  The number of children that the node has.
  */
  get childCount() {
    return this.content.childCount;
  }
  /**
  Get the child node at the given index. Raises an error when the
  index is out of range.
  */
  child(index) {
    return this.content.child(index);
  }
  /**
  Get the child node at the given index, if it exists.
  */
  maybeChild(index) {
    return this.content.maybeChild(index);
  }
  /**
  Call `f` for every child node, passing the node, its offset
  into this parent node, and its index.
  */
  forEach(f) {
    this.content.forEach(f);
  }
  /**
  Invoke a callback for all descendant nodes recursively between
  the given two positions that are relative to start of this
  node's content. The callback is invoked with the node, its
  position relative to the original node (method receiver),
  its parent node, and its child index. When the callback returns
  false for a given node, that node's children will not be
  recursed over. The last parameter can be used to specify a
  starting position to count from.
  */
  nodesBetween(from, to, f, startPos = 0) {
    this.content.nodesBetween(from, to, f, startPos, this);
  }
  /**
  Call the given callback for every descendant node. Doesn't
  descend into a node when the callback returns `false`.
  */
  descendants(f) {
    this.nodesBetween(0, this.content.size, f);
  }
  /**
  Concatenates all the text nodes found in this fragment and its
  children.
  */
  get textContent() {
    return this.isLeaf && this.type.spec.leafText ? this.type.spec.leafText(this) : this.textBetween(0, this.content.size, "");
  }
  /**
  Get all text between positions `from` and `to`. When
  `blockSeparator` is given, it will be inserted to separate text
  from different block nodes. If `leafText` is given, it'll be
  inserted for every non-text leaf node encountered, otherwise
  [`leafText`](https://prosemirror.net/docs/ref/#model.NodeSpec^leafText) will be used.
  */
  textBetween(from, to, blockSeparator, leafText) {
    return this.content.textBetween(from, to, blockSeparator, leafText);
  }
  /**
  Returns this node's first child, or `null` if there are no
  children.
  */
  get firstChild() {
    return this.content.firstChild;
  }
  /**
  Returns this node's last child, or `null` if there are no
  children.
  */
  get lastChild() {
    return this.content.lastChild;
  }
  /**
  Test whether two nodes represent the same piece of document.
  */
  eq(other) {
    return this == other || this.sameMarkup(other) && this.content.eq(other.content);
  }
  /**
  Compare the markup (type, attributes, and marks) of this node to
  those of another. Returns `true` if both have the same markup.
  */
  sameMarkup(other) {
    return this.hasMarkup(other.type, other.attrs, other.marks);
  }
  /**
  Check whether this node's markup correspond to the given type,
  attributes, and marks.
  */
  hasMarkup(type, attrs, marks) {
    return this.type == type && compareDeep(this.attrs, attrs || type.defaultAttrs || emptyAttrs) && Mark.sameSet(this.marks, marks || Mark.none);
  }
  /**
  Create a new node with the same markup as this node, containing
  the given content (or empty, if no content is given).
  */
  copy(content = null) {
    if (content == this.content)
      return this;
    return new _Node(this.type, this.attrs, content, this.marks);
  }
  /**
  Create a copy of this node, with the given set of marks instead
  of the node's own marks.
  */
  mark(marks) {
    return marks == this.marks ? this : new _Node(this.type, this.attrs, this.content, marks);
  }
  /**
  Create a copy of this node with only the content between the
  given positions. If `to` is not given, it defaults to the end of
  the node.
  */
  cut(from, to = this.content.size) {
    if (from == 0 && to == this.content.size)
      return this;
    return this.copy(this.content.cut(from, to));
  }
  /**
  Cut out the part of the document between the given positions, and
  return it as a `Slice` object.
  */
  slice(from, to = this.content.size, includeParents = false) {
    if (from == to)
      return Slice.empty;
    let $from = this.resolve(from), $to = this.resolve(to);
    let depth = includeParents ? 0 : $from.sharedDepth(to);
    let start2 = $from.start(depth), node = $from.node(depth);
    let content = node.content.cut($from.pos - start2, $to.pos - start2);
    return new Slice(content, $from.depth - depth, $to.depth - depth);
  }
  /**
  Replace the part of the document between the given positions with
  the given slice. The slice must 'fit', meaning its open sides
  must be able to connect to the surrounding content, and its
  content nodes must be valid children for the node they are placed
  into. If any of this is violated, an error of type
  [`ReplaceError`](https://prosemirror.net/docs/ref/#model.ReplaceError) is thrown.
  */
  replace(from, to, slice) {
    return replace(this.resolve(from), this.resolve(to), slice);
  }
  /**
  Find the node directly after the given position.
  */
  nodeAt(pos) {
    for (let node = this; ; ) {
      let { index, offset: offset2 } = node.content.findIndex(pos);
      node = node.maybeChild(index);
      if (!node)
        return null;
      if (offset2 == pos || node.isText)
        return node;
      pos -= offset2 + 1;
    }
  }
  /**
  Find the (direct) child node after the given offset, if any,
  and return it along with its index and offset relative to this
  node.
  */
  childAfter(pos) {
    let { index, offset: offset2 } = this.content.findIndex(pos);
    return { node: this.content.maybeChild(index), index, offset: offset2 };
  }
  /**
  Find the (direct) child node before the given offset, if any,
  and return it along with its index and offset relative to this
  node.
  */
  childBefore(pos) {
    if (pos == 0)
      return { node: null, index: 0, offset: 0 };
    let { index, offset: offset2 } = this.content.findIndex(pos);
    if (offset2 < pos)
      return { node: this.content.child(index), index, offset: offset2 };
    let node = this.content.child(index - 1);
    return { node, index: index - 1, offset: offset2 - node.nodeSize };
  }
  /**
  Resolve the given position in the document, returning an
  [object](https://prosemirror.net/docs/ref/#model.ResolvedPos) with information about its context.
  */
  resolve(pos) {
    return ResolvedPos.resolveCached(this, pos);
  }
  /**
  @internal
  */
  resolveNoCache(pos) {
    return ResolvedPos.resolve(this, pos);
  }
  /**
  Test whether a given mark or mark type occurs in this document
  between the two given positions.
  */
  rangeHasMark(from, to, type) {
    let found2 = false;
    if (to > from)
      this.nodesBetween(from, to, (node) => {
        if (type.isInSet(node.marks))
          found2 = true;
        return !found2;
      });
    return found2;
  }
  /**
  True when this is a block (non-inline node)
  */
  get isBlock() {
    return this.type.isBlock;
  }
  /**
  True when this is a textblock node, a block node with inline
  content.
  */
  get isTextblock() {
    return this.type.isTextblock;
  }
  /**
  True when this node allows inline content.
  */
  get inlineContent() {
    return this.type.inlineContent;
  }
  /**
  True when this is an inline node (a text node or a node that can
  appear among text).
  */
  get isInline() {
    return this.type.isInline;
  }
  /**
  True when this is a text node.
  */
  get isText() {
    return this.type.isText;
  }
  /**
  True when this is a leaf node.
  */
  get isLeaf() {
    return this.type.isLeaf;
  }
  /**
  True when this is an atom, i.e. when it does not have directly
  editable content. This is usually the same as `isLeaf`, but can
  be configured with the [`atom` property](https://prosemirror.net/docs/ref/#model.NodeSpec.atom)
  on a node's spec (typically used when the node is displayed as
  an uneditable [node view](https://prosemirror.net/docs/ref/#view.NodeView)).
  */
  get isAtom() {
    return this.type.isAtom;
  }
  /**
  Return a string representation of this node for debugging
  purposes.
  */
  toString() {
    if (this.type.spec.toDebugString)
      return this.type.spec.toDebugString(this);
    let name = this.type.name;
    if (this.content.size)
      name += "(" + this.content.toStringInner() + ")";
    return wrapMarks(this.marks, name);
  }
  /**
  Get the content match in this node at the given index.
  */
  contentMatchAt(index) {
    let match = this.type.contentMatch.matchFragment(this.content, 0, index);
    if (!match)
      throw new Error("Called contentMatchAt on a node with invalid content");
    return match;
  }
  /**
  Test whether replacing the range between `from` and `to` (by
  child index) with the given replacement fragment (which defaults
  to the empty fragment) would leave the node's content valid. You
  can optionally pass `start` and `end` indices into the
  replacement fragment.
  */
  canReplace(from, to, replacement = Fragment.empty, start2 = 0, end2 = replacement.childCount) {
    let one = this.contentMatchAt(from).matchFragment(replacement, start2, end2);
    let two = one && one.matchFragment(this.content, to);
    if (!two || !two.validEnd)
      return false;
    for (let i = start2; i < end2; i++)
      if (!this.type.allowsMarks(replacement.child(i).marks))
        return false;
    return true;
  }
  /**
  Test whether replacing the range `from` to `to` (by index) with
  a node of the given type would leave the node's content valid.
  */
  canReplaceWith(from, to, type, marks) {
    if (marks && !this.type.allowsMarks(marks))
      return false;
    let start2 = this.contentMatchAt(from).matchType(type);
    let end2 = start2 && start2.matchFragment(this.content, to);
    return end2 ? end2.validEnd : false;
  }
  /**
  Test whether the given node's content could be appended to this
  node. If that node is empty, this will only return true if there
  is at least one node type that can appear in both nodes (to avoid
  merging completely incompatible nodes).
  */
  canAppend(other) {
    if (other.content.size)
      return this.canReplace(this.childCount, this.childCount, other.content);
    else
      return this.type.compatibleContent(other.type);
  }
  /**
  Check whether this node and its descendants conform to the
  schema, and raise error when they do not.
  */
  check() {
    this.type.checkContent(this.content);
    let copy2 = Mark.none;
    for (let i = 0; i < this.marks.length; i++)
      copy2 = this.marks[i].addToSet(copy2);
    if (!Mark.sameSet(copy2, this.marks))
      throw new RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map((m) => m.type.name)}`);
    this.content.forEach((node) => node.check());
  }
  /**
  Return a JSON-serializeable representation of this node.
  */
  toJSON() {
    let obj = { type: this.type.name };
    for (let _ in this.attrs) {
      obj.attrs = this.attrs;
      break;
    }
    if (this.content.size)
      obj.content = this.content.toJSON();
    if (this.marks.length)
      obj.marks = this.marks.map((n) => n.toJSON());
    return obj;
  }
  /**
  Deserialize a node from its JSON representation.
  */
  static fromJSON(schema, json) {
    if (!json)
      throw new RangeError("Invalid input for Node.fromJSON");
    let marks = null;
    if (json.marks) {
      if (!Array.isArray(json.marks))
        throw new RangeError("Invalid mark data for Node.fromJSON");
      marks = json.marks.map(schema.markFromJSON);
    }
    if (json.type == "text") {
      if (typeof json.text != "string")
        throw new RangeError("Invalid text node in JSON");
      return schema.text(json.text, marks);
    }
    let content = Fragment.fromJSON(schema, json.content);
    return schema.nodeType(json.type).create(json.attrs, content, marks);
  }
};
Node2.prototype.text = void 0;
function wrapMarks(marks, str) {
  for (let i = marks.length - 1; i >= 0; i--)
    str = marks[i].type.name + "(" + str + ")";
  return str;
}
var ContentMatch = class _ContentMatch {
  /**
  @internal
  */
  constructor(validEnd) {
    this.validEnd = validEnd;
    this.next = [];
    this.wrapCache = [];
  }
  /**
  @internal
  */
  static parse(string, nodeTypes) {
    let stream = new TokenStream(string, nodeTypes);
    if (stream.next == null)
      return _ContentMatch.empty;
    let expr = parseExpr(stream);
    if (stream.next)
      stream.err("Unexpected trailing text");
    let match = dfa(nfa(expr));
    checkForDeadEnds(match, stream);
    return match;
  }
  /**
  Match a node type, returning a match after that node if
  successful.
  */
  matchType(type) {
    for (let i = 0; i < this.next.length; i++)
      if (this.next[i].type == type)
        return this.next[i].next;
    return null;
  }
  /**
  Try to match a fragment. Returns the resulting match when
  successful.
  */
  matchFragment(frag, start2 = 0, end2 = frag.childCount) {
    let cur = this;
    for (let i = start2; cur && i < end2; i++)
      cur = cur.matchType(frag.child(i).type);
    return cur;
  }
  /**
  @internal
  */
  get inlineContent() {
    return this.next.length != 0 && this.next[0].type.isInline;
  }
  /**
  Get the first matching node type at this match position that can
  be generated.
  */
  get defaultType() {
    for (let i = 0; i < this.next.length; i++) {
      let { type } = this.next[i];
      if (!(type.isText || type.hasRequiredAttrs()))
        return type;
    }
    return null;
  }
  /**
  @internal
  */
  compatible(other) {
    for (let i = 0; i < this.next.length; i++)
      for (let j = 0; j < other.next.length; j++)
        if (this.next[i].type == other.next[j].type)
          return true;
    return false;
  }
  /**
  Try to match the given fragment, and if that fails, see if it can
  be made to match by inserting nodes in front of it. When
  successful, return a fragment of inserted nodes (which may be
  empty if nothing had to be inserted). When `toEnd` is true, only
  return a fragment if the resulting match goes to the end of the
  content expression.
  */
  fillBefore(after, toEnd = false, startIndex = 0) {
    let seen = [this];
    function search(match, types) {
      let finished = match.matchFragment(after, startIndex);
      if (finished && (!toEnd || finished.validEnd))
        return Fragment.from(types.map((tp) => tp.createAndFill()));
      for (let i = 0; i < match.next.length; i++) {
        let { type, next } = match.next[i];
        if (!(type.isText || type.hasRequiredAttrs()) && seen.indexOf(next) == -1) {
          seen.push(next);
          let found2 = search(next, types.concat(type));
          if (found2)
            return found2;
        }
      }
      return null;
    }
    return search(this, []);
  }
  /**
  Find a set of wrapping node types that would allow a node of the
  given type to appear at this position. The result may be empty
  (when it fits directly) and will be null when no such wrapping
  exists.
  */
  findWrapping(target) {
    for (let i = 0; i < this.wrapCache.length; i += 2)
      if (this.wrapCache[i] == target)
        return this.wrapCache[i + 1];
    let computed = this.computeWrapping(target);
    this.wrapCache.push(target, computed);
    return computed;
  }
  /**
  @internal
  */
  computeWrapping(target) {
    let seen = /* @__PURE__ */ Object.create(null), active = [{ match: this, type: null, via: null }];
    while (active.length) {
      let current = active.shift(), match = current.match;
      if (match.matchType(target)) {
        let result = [];
        for (let obj = current; obj.type; obj = obj.via)
          result.push(obj.type);
        return result.reverse();
      }
      for (let i = 0; i < match.next.length; i++) {
        let { type, next } = match.next[i];
        if (!type.isLeaf && !type.hasRequiredAttrs() && !(type.name in seen) && (!current.type || next.validEnd)) {
          active.push({ match: type.contentMatch, type, via: current });
          seen[type.name] = true;
        }
      }
    }
    return null;
  }
  /**
  The number of outgoing edges this node has in the finite
  automaton that describes the content expression.
  */
  get edgeCount() {
    return this.next.length;
  }
  /**
  Get the _n_​th outgoing edge from this node in the finite
  automaton that describes the content expression.
  */
  edge(n) {
    if (n >= this.next.length)
      throw new RangeError(`There's no ${n}th edge in this content match`);
    return this.next[n];
  }
  /**
  @internal
  */
  toString() {
    let seen = [];
    function scan(m) {
      seen.push(m);
      for (let i = 0; i < m.next.length; i++)
        if (seen.indexOf(m.next[i].next) == -1)
          scan(m.next[i].next);
    }
    scan(this);
    return seen.map((m, i) => {
      let out = i + (m.validEnd ? "*" : " ") + " ";
      for (let i2 = 0; i2 < m.next.length; i2++)
        out += (i2 ? ", " : "") + m.next[i2].type.name + "->" + seen.indexOf(m.next[i2].next);
      return out;
    }).join("\n");
  }
};
ContentMatch.empty = new ContentMatch(true);
var TokenStream = class {
  constructor(string, nodeTypes) {
    this.string = string;
    this.nodeTypes = nodeTypes;
    this.inline = null;
    this.pos = 0;
    this.tokens = string.split(/\s*(?=\b|\W|$)/);
    if (this.tokens[this.tokens.length - 1] == "")
      this.tokens.pop();
    if (this.tokens[0] == "")
      this.tokens.shift();
  }
  get next() {
    return this.tokens[this.pos];
  }
  eat(tok) {
    return this.next == tok && (this.pos++ || true);
  }
  err(str) {
    throw new SyntaxError(str + " (in content expression '" + this.string + "')");
  }
};
function parseExpr(stream) {
  let exprs = [];
  do {
    exprs.push(parseExprSeq(stream));
  } while (stream.eat("|"));
  return exprs.length == 1 ? exprs[0] : { type: "choice", exprs };
}
function parseExprSeq(stream) {
  let exprs = [];
  do {
    exprs.push(parseExprSubscript(stream));
  } while (stream.next && stream.next != ")" && stream.next != "|");
  return exprs.length == 1 ? exprs[0] : { type: "seq", exprs };
}
function parseExprSubscript(stream) {
  let expr = parseExprAtom(stream);
  for (; ; ) {
    if (stream.eat("+"))
      expr = { type: "plus", expr };
    else if (stream.eat("*"))
      expr = { type: "star", expr };
    else if (stream.eat("?"))
      expr = { type: "opt", expr };
    else if (stream.eat("{"))
      expr = parseExprRange(stream, expr);
    else
      break;
  }
  return expr;
}
function parseNum(stream) {
  if (/\D/.test(stream.next))
    stream.err("Expected number, got '" + stream.next + "'");
  let result = Number(stream.next);
  stream.pos++;
  return result;
}
function parseExprRange(stream, expr) {
  let min2 = parseNum(stream), max2 = min2;
  if (stream.eat(",")) {
    if (stream.next != "}")
      max2 = parseNum(stream);
    else
      max2 = -1;
  }
  if (!stream.eat("}"))
    stream.err("Unclosed braced range");
  return { type: "range", min: min2, max: max2, expr };
}
function resolveName(stream, name) {
  let types = stream.nodeTypes, type = types[name];
  if (type)
    return [type];
  let result = [];
  for (let typeName in types) {
    let type2 = types[typeName];
    if (type2.groups.indexOf(name) > -1)
      result.push(type2);
  }
  if (result.length == 0)
    stream.err("No node type or group '" + name + "' found");
  return result;
}
function parseExprAtom(stream) {
  if (stream.eat("(")) {
    let expr = parseExpr(stream);
    if (!stream.eat(")"))
      stream.err("Missing closing paren");
    return expr;
  } else if (!/\W/.test(stream.next)) {
    let exprs = resolveName(stream, stream.next).map((type) => {
      if (stream.inline == null)
        stream.inline = type.isInline;
      else if (stream.inline != type.isInline)
        stream.err("Mixing inline and block content");
      return { type: "name", value: type };
    });
    stream.pos++;
    return exprs.length == 1 ? exprs[0] : { type: "choice", exprs };
  } else {
    stream.err("Unexpected token '" + stream.next + "'");
  }
}
function nfa(expr) {
  let nfa2 = [[]];
  connect(compile(expr, 0), node());
  return nfa2;
  function node() {
    return nfa2.push([]) - 1;
  }
  function edge(from, to, term) {
    let edge2 = { term, to };
    nfa2[from].push(edge2);
    return edge2;
  }
  function connect(edges, to) {
    edges.forEach((edge2) => edge2.to = to);
  }
  function compile(expr2, from) {
    if (expr2.type == "choice") {
      return expr2.exprs.reduce((out, expr3) => out.concat(compile(expr3, from)), []);
    } else if (expr2.type == "seq") {
      for (let i = 0; ; i++) {
        let next = compile(expr2.exprs[i], from);
        if (i == expr2.exprs.length - 1)
          return next;
        connect(next, from = node());
      }
    } else if (expr2.type == "star") {
      let loop = node();
      edge(from, loop);
      connect(compile(expr2.expr, loop), loop);
      return [edge(loop)];
    } else if (expr2.type == "plus") {
      let loop = node();
      connect(compile(expr2.expr, from), loop);
      connect(compile(expr2.expr, loop), loop);
      return [edge(loop)];
    } else if (expr2.type == "opt") {
      return [edge(from)].concat(compile(expr2.expr, from));
    } else if (expr2.type == "range") {
      let cur = from;
      for (let i = 0; i < expr2.min; i++) {
        let next = node();
        connect(compile(expr2.expr, cur), next);
        cur = next;
      }
      if (expr2.max == -1) {
        connect(compile(expr2.expr, cur), cur);
      } else {
        for (let i = expr2.min; i < expr2.max; i++) {
          let next = node();
          edge(cur, next);
          connect(compile(expr2.expr, cur), next);
          cur = next;
        }
      }
      return [edge(cur)];
    } else if (expr2.type == "name") {
      return [edge(from, void 0, expr2.value)];
    } else {
      throw new Error("Unknown expr type");
    }
  }
}
function cmp(a, b) {
  return b - a;
}
function nullFrom(nfa2, node) {
  let result = [];
  scan(node);
  return result.sort(cmp);
  function scan(node2) {
    let edges = nfa2[node2];
    if (edges.length == 1 && !edges[0].term)
      return scan(edges[0].to);
    result.push(node2);
    for (let i = 0; i < edges.length; i++) {
      let { term, to } = edges[i];
      if (!term && result.indexOf(to) == -1)
        scan(to);
    }
  }
}
function dfa(nfa2) {
  let labeled = /* @__PURE__ */ Object.create(null);
  return explore(nullFrom(nfa2, 0));
  function explore(states) {
    let out = [];
    states.forEach((node) => {
      nfa2[node].forEach(({ term, to }) => {
        if (!term)
          return;
        let set;
        for (let i = 0; i < out.length; i++)
          if (out[i][0] == term)
            set = out[i][1];
        nullFrom(nfa2, to).forEach((node2) => {
          if (!set)
            out.push([term, set = []]);
          if (set.indexOf(node2) == -1)
            set.push(node2);
        });
      });
    });
    let state = labeled[states.join(",")] = new ContentMatch(states.indexOf(nfa2.length - 1) > -1);
    for (let i = 0; i < out.length; i++) {
      let states2 = out[i][1].sort(cmp);
      state.next.push({ type: out[i][0], next: labeled[states2.join(",")] || explore(states2) });
    }
    return state;
  }
}
function checkForDeadEnds(match, stream) {
  for (let i = 0, work = [match]; i < work.length; i++) {
    let state = work[i], dead = !state.validEnd, nodes = [];
    for (let j = 0; j < state.next.length; j++) {
      let { type, next } = state.next[j];
      nodes.push(type.name);
      if (dead && !(type.isText || type.hasRequiredAttrs()))
        dead = false;
      if (work.indexOf(next) == -1)
        work.push(next);
    }
    if (dead)
      stream.err("Only non-generatable nodes (" + nodes.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
  }
}
var DOMParser = class _DOMParser {
  /**
  Create a parser that targets the given schema, using the given
  parsing rules.
  */
  constructor(schema, rules) {
    this.schema = schema;
    this.rules = rules;
    this.tags = [];
    this.styles = [];
    rules.forEach((rule) => {
      if (rule.tag)
        this.tags.push(rule);
      else if (rule.style)
        this.styles.push(rule);
    });
    this.normalizeLists = !this.tags.some((r) => {
      if (!/^(ul|ol)\b/.test(r.tag) || !r.node)
        return false;
      let node = schema.nodes[r.node];
      return node.contentMatch.matchType(node);
    });
  }
  /**
  Parse a document from the content of a DOM node.
  */
  parse(dom, options = {}) {
    let context = new ParseContext(this, options, false);
    context.addAll(dom, options.from, options.to);
    return context.finish();
  }
  /**
  Parses the content of the given DOM node, like
  [`parse`](https://prosemirror.net/docs/ref/#model.DOMParser.parse), and takes the same set of
  options. But unlike that method, which produces a whole node,
  this one returns a slice that is open at the sides, meaning that
  the schema constraints aren't applied to the start of nodes to
  the left of the input and the end of nodes at the end.
  */
  parseSlice(dom, options = {}) {
    let context = new ParseContext(this, options, true);
    context.addAll(dom, options.from, options.to);
    return Slice.maxOpen(context.finish());
  }
  /**
  @internal
  */
  matchTag(dom, context, after) {
    for (let i = after ? this.tags.indexOf(after) + 1 : 0; i < this.tags.length; i++) {
      let rule = this.tags[i];
      if (matches(dom, rule.tag) && (rule.namespace === void 0 || dom.namespaceURI == rule.namespace) && (!rule.context || context.matchesContext(rule.context))) {
        if (rule.getAttrs) {
          let result = rule.getAttrs(dom);
          if (result === false)
            continue;
          rule.attrs = result || void 0;
        }
        return rule;
      }
    }
  }
  /**
  @internal
  */
  matchStyle(prop, value, context, after) {
    for (let i = after ? this.styles.indexOf(after) + 1 : 0; i < this.styles.length; i++) {
      let rule = this.styles[i], style = rule.style;
      if (style.indexOf(prop) != 0 || rule.context && !context.matchesContext(rule.context) || // Test that the style string either precisely matches the prop,
      // or has an '=' sign after the prop, followed by the given
      // value.
      style.length > prop.length && (style.charCodeAt(prop.length) != 61 || style.slice(prop.length + 1) != value))
        continue;
      if (rule.getAttrs) {
        let result = rule.getAttrs(value);
        if (result === false)
          continue;
        rule.attrs = result || void 0;
      }
      return rule;
    }
  }
  /**
  @internal
  */
  static schemaRules(schema) {
    let result = [];
    function insert(rule) {
      let priority = rule.priority == null ? 50 : rule.priority, i = 0;
      for (; i < result.length; i++) {
        let next = result[i], nextPriority = next.priority == null ? 50 : next.priority;
        if (nextPriority < priority)
          break;
      }
      result.splice(i, 0, rule);
    }
    for (let name in schema.marks) {
      let rules = schema.marks[name].spec.parseDOM;
      if (rules)
        rules.forEach((rule) => {
          insert(rule = copy(rule));
          if (!(rule.mark || rule.ignore || rule.clearMark))
            rule.mark = name;
        });
    }
    for (let name in schema.nodes) {
      let rules = schema.nodes[name].spec.parseDOM;
      if (rules)
        rules.forEach((rule) => {
          insert(rule = copy(rule));
          if (!(rule.node || rule.ignore || rule.mark))
            rule.node = name;
        });
    }
    return result;
  }
  /**
  Construct a DOM parser using the parsing rules listed in a
  schema's [node specs](https://prosemirror.net/docs/ref/#model.NodeSpec.parseDOM), reordered by
  [priority](https://prosemirror.net/docs/ref/#model.ParseRule.priority).
  */
  static fromSchema(schema) {
    return schema.cached.domParser || (schema.cached.domParser = new _DOMParser(schema, _DOMParser.schemaRules(schema)));
  }
};
var blockTags = {
  address: true,
  article: true,
  aside: true,
  blockquote: true,
  canvas: true,
  dd: true,
  div: true,
  dl: true,
  fieldset: true,
  figcaption: true,
  figure: true,
  footer: true,
  form: true,
  h1: true,
  h2: true,
  h3: true,
  h4: true,
  h5: true,
  h6: true,
  header: true,
  hgroup: true,
  hr: true,
  li: true,
  noscript: true,
  ol: true,
  output: true,
  p: true,
  pre: true,
  section: true,
  table: true,
  tfoot: true,
  ul: true
};
var ignoreTags = {
  head: true,
  noscript: true,
  object: true,
  script: true,
  style: true,
  title: true
};
var listTags = { ol: true, ul: true };
var OPT_PRESERVE_WS = 1;
var OPT_PRESERVE_WS_FULL = 2;
var OPT_OPEN_LEFT = 4;
function wsOptionsFor(type, preserveWhitespace, base) {
  if (preserveWhitespace != null)
    return (preserveWhitespace ? OPT_PRESERVE_WS : 0) | (preserveWhitespace === "full" ? OPT_PRESERVE_WS_FULL : 0);
  return type && type.whitespace == "pre" ? OPT_PRESERVE_WS | OPT_PRESERVE_WS_FULL : base & ~OPT_OPEN_LEFT;
}
var NodeContext = class {
  constructor(type, attrs, marks, pendingMarks, solid, match, options) {
    this.type = type;
    this.attrs = attrs;
    this.marks = marks;
    this.pendingMarks = pendingMarks;
    this.solid = solid;
    this.options = options;
    this.content = [];
    this.activeMarks = Mark.none;
    this.stashMarks = [];
    this.match = match || (options & OPT_OPEN_LEFT ? null : type.contentMatch);
  }
  findWrapping(node) {
    if (!this.match) {
      if (!this.type)
        return [];
      let fill = this.type.contentMatch.fillBefore(Fragment.from(node));
      if (fill) {
        this.match = this.type.contentMatch.matchFragment(fill);
      } else {
        let start2 = this.type.contentMatch, wrap;
        if (wrap = start2.findWrapping(node.type)) {
          this.match = start2;
          return wrap;
        } else {
          return null;
        }
      }
    }
    return this.match.findWrapping(node.type);
  }
  finish(openEnd) {
    if (!(this.options & OPT_PRESERVE_WS)) {
      let last = this.content[this.content.length - 1], m;
      if (last && last.isText && (m = /[ \t\r\n\u000c]+$/.exec(last.text))) {
        let text = last;
        if (last.text.length == m[0].length)
          this.content.pop();
        else
          this.content[this.content.length - 1] = text.withText(text.text.slice(0, text.text.length - m[0].length));
      }
    }
    let content = Fragment.from(this.content);
    if (!openEnd && this.match)
      content = content.append(this.match.fillBefore(Fragment.empty, true));
    return this.type ? this.type.create(this.attrs, content, this.marks) : content;
  }
  popFromStashMark(mark) {
    for (let i = this.stashMarks.length - 1; i >= 0; i--)
      if (mark.eq(this.stashMarks[i]))
        return this.stashMarks.splice(i, 1)[0];
  }
  applyPending(nextType) {
    for (let i = 0, pending = this.pendingMarks; i < pending.length; i++) {
      let mark = pending[i];
      if ((this.type ? this.type.allowsMarkType(mark.type) : markMayApply(mark.type, nextType)) && !mark.isInSet(this.activeMarks)) {
        this.activeMarks = mark.addToSet(this.activeMarks);
        this.pendingMarks = mark.removeFromSet(this.pendingMarks);
      }
    }
  }
  inlineContext(node) {
    if (this.type)
      return this.type.inlineContent;
    if (this.content.length)
      return this.content[0].isInline;
    return node.parentNode && !blockTags.hasOwnProperty(node.parentNode.nodeName.toLowerCase());
  }
};
var ParseContext = class {
  constructor(parser, options, isOpen) {
    this.parser = parser;
    this.options = options;
    this.isOpen = isOpen;
    this.open = 0;
    let topNode = options.topNode, topContext;
    let topOptions = wsOptionsFor(null, options.preserveWhitespace, 0) | (isOpen ? OPT_OPEN_LEFT : 0);
    if (topNode)
      topContext = new NodeContext(topNode.type, topNode.attrs, Mark.none, Mark.none, true, options.topMatch || topNode.type.contentMatch, topOptions);
    else if (isOpen)
      topContext = new NodeContext(null, null, Mark.none, Mark.none, true, null, topOptions);
    else
      topContext = new NodeContext(parser.schema.topNodeType, null, Mark.none, Mark.none, true, null, topOptions);
    this.nodes = [topContext];
    this.find = options.findPositions;
    this.needsBlock = false;
  }
  get top() {
    return this.nodes[this.open];
  }
  // Add a DOM node to the content. Text is inserted as text node,
  // otherwise, the node is passed to `addElement` or, if it has a
  // `style` attribute, `addElementWithStyles`.
  addDOM(dom) {
    if (dom.nodeType == 3)
      this.addTextNode(dom);
    else if (dom.nodeType == 1)
      this.addElement(dom);
  }
  withStyleRules(dom, f) {
    let style = dom.getAttribute("style");
    if (!style)
      return f();
    let marks = this.readStyles(parseStyles(style));
    if (!marks)
      return;
    let [addMarks, removeMarks] = marks, top2 = this.top;
    for (let i = 0; i < removeMarks.length; i++)
      this.removePendingMark(removeMarks[i], top2);
    for (let i = 0; i < addMarks.length; i++)
      this.addPendingMark(addMarks[i]);
    f();
    for (let i = 0; i < addMarks.length; i++)
      this.removePendingMark(addMarks[i], top2);
    for (let i = 0; i < removeMarks.length; i++)
      this.addPendingMark(removeMarks[i]);
  }
  addTextNode(dom) {
    let value = dom.nodeValue;
    let top2 = this.top;
    if (top2.options & OPT_PRESERVE_WS_FULL || top2.inlineContext(dom) || /[^ \t\r\n\u000c]/.test(value)) {
      if (!(top2.options & OPT_PRESERVE_WS)) {
        value = value.replace(/[ \t\r\n\u000c]+/g, " ");
        if (/^[ \t\r\n\u000c]/.test(value) && this.open == this.nodes.length - 1) {
          let nodeBefore = top2.content[top2.content.length - 1];
          let domNodeBefore = dom.previousSibling;
          if (!nodeBefore || domNodeBefore && domNodeBefore.nodeName == "BR" || nodeBefore.isText && /[ \t\r\n\u000c]$/.test(nodeBefore.text))
            value = value.slice(1);
        }
      } else if (!(top2.options & OPT_PRESERVE_WS_FULL)) {
        value = value.replace(/\r?\n|\r/g, " ");
      } else {
        value = value.replace(/\r\n?/g, "\n");
      }
      if (value)
        this.insertNode(this.parser.schema.text(value));
      this.findInText(dom);
    } else {
      this.findInside(dom);
    }
  }
  // Try to find a handler for the given tag and use that to parse. If
  // none is found, the element's content nodes are added directly.
  addElement(dom, matchAfter) {
    let name = dom.nodeName.toLowerCase(), ruleID;
    if (listTags.hasOwnProperty(name) && this.parser.normalizeLists)
      normalizeList(dom);
    let rule = this.options.ruleFromNode && this.options.ruleFromNode(dom) || (ruleID = this.parser.matchTag(dom, this, matchAfter));
    if (rule ? rule.ignore : ignoreTags.hasOwnProperty(name)) {
      this.findInside(dom);
      this.ignoreFallback(dom);
    } else if (!rule || rule.skip || rule.closeParent) {
      if (rule && rule.closeParent)
        this.open = Math.max(0, this.open - 1);
      else if (rule && rule.skip.nodeType)
        dom = rule.skip;
      let sync, top2 = this.top, oldNeedsBlock = this.needsBlock;
      if (blockTags.hasOwnProperty(name)) {
        if (top2.content.length && top2.content[0].isInline && this.open) {
          this.open--;
          top2 = this.top;
        }
        sync = true;
        if (!top2.type)
          this.needsBlock = true;
      } else if (!dom.firstChild) {
        this.leafFallback(dom);
        return;
      }
      if (rule && rule.skip)
        this.addAll(dom);
      else
        this.withStyleRules(dom, () => this.addAll(dom));
      if (sync)
        this.sync(top2);
      this.needsBlock = oldNeedsBlock;
    } else {
      this.withStyleRules(dom, () => {
        this.addElementByRule(dom, rule, rule.consuming === false ? ruleID : void 0);
      });
    }
  }
  // Called for leaf DOM nodes that would otherwise be ignored
  leafFallback(dom) {
    if (dom.nodeName == "BR" && this.top.type && this.top.type.inlineContent)
      this.addTextNode(dom.ownerDocument.createTextNode("\n"));
  }
  // Called for ignored nodes
  ignoreFallback(dom) {
    if (dom.nodeName == "BR" && (!this.top.type || !this.top.type.inlineContent))
      this.findPlace(this.parser.schema.text("-"));
  }
  // Run any style parser associated with the node's styles. Either
  // return an array of marks, or null to indicate some of the styles
  // had a rule with `ignore` set.
  readStyles(styles) {
    let add = Mark.none, remove = Mark.none;
    for (let i = 0; i < styles.length; i += 2) {
      for (let after = void 0; ; ) {
        let rule = this.parser.matchStyle(styles[i], styles[i + 1], this, after);
        if (!rule)
          break;
        if (rule.ignore)
          return null;
        if (rule.clearMark) {
          this.top.pendingMarks.concat(this.top.activeMarks).forEach((m) => {
            if (rule.clearMark(m))
              remove = m.addToSet(remove);
          });
        } else {
          add = this.parser.schema.marks[rule.mark].create(rule.attrs).addToSet(add);
        }
        if (rule.consuming === false)
          after = rule;
        else
          break;
      }
    }
    return [add, remove];
  }
  // Look up a handler for the given node. If none are found, return
  // false. Otherwise, apply it, use its return value to drive the way
  // the node's content is wrapped, and return true.
  addElementByRule(dom, rule, continueAfter) {
    let sync, nodeType, mark;
    if (rule.node) {
      nodeType = this.parser.schema.nodes[rule.node];
      if (!nodeType.isLeaf) {
        sync = this.enter(nodeType, rule.attrs || null, rule.preserveWhitespace);
      } else if (!this.insertNode(nodeType.create(rule.attrs))) {
        this.leafFallback(dom);
      }
    } else {
      let markType = this.parser.schema.marks[rule.mark];
      mark = markType.create(rule.attrs);
      this.addPendingMark(mark);
    }
    let startIn = this.top;
    if (nodeType && nodeType.isLeaf) {
      this.findInside(dom);
    } else if (continueAfter) {
      this.addElement(dom, continueAfter);
    } else if (rule.getContent) {
      this.findInside(dom);
      rule.getContent(dom, this.parser.schema).forEach((node) => this.insertNode(node));
    } else {
      let contentDOM = dom;
      if (typeof rule.contentElement == "string")
        contentDOM = dom.querySelector(rule.contentElement);
      else if (typeof rule.contentElement == "function")
        contentDOM = rule.contentElement(dom);
      else if (rule.contentElement)
        contentDOM = rule.contentElement;
      this.findAround(dom, contentDOM, true);
      this.addAll(contentDOM);
    }
    if (sync && this.sync(startIn))
      this.open--;
    if (mark)
      this.removePendingMark(mark, startIn);
  }
  // Add all child nodes between `startIndex` and `endIndex` (or the
  // whole node, if not given). If `sync` is passed, use it to
  // synchronize after every block element.
  addAll(parent, startIndex, endIndex) {
    let index = startIndex || 0;
    for (let dom = startIndex ? parent.childNodes[startIndex] : parent.firstChild, end2 = endIndex == null ? null : parent.childNodes[endIndex]; dom != end2; dom = dom.nextSibling, ++index) {
      this.findAtPoint(parent, index);
      this.addDOM(dom);
    }
    this.findAtPoint(parent, index);
  }
  // Try to find a way to fit the given node type into the current
  // context. May add intermediate wrappers and/or leave non-solid
  // nodes that we're in.
  findPlace(node) {
    let route, sync;
    for (let depth = this.open; depth >= 0; depth--) {
      let cx = this.nodes[depth];
      let found2 = cx.findWrapping(node);
      if (found2 && (!route || route.length > found2.length)) {
        route = found2;
        sync = cx;
        if (!found2.length)
          break;
      }
      if (cx.solid)
        break;
    }
    if (!route)
      return false;
    this.sync(sync);
    for (let i = 0; i < route.length; i++)
      this.enterInner(route[i], null, false);
    return true;
  }
  // Try to insert the given node, adjusting the context when needed.
  insertNode(node) {
    if (node.isInline && this.needsBlock && !this.top.type) {
      let block = this.textblockFromContext();
      if (block)
        this.enterInner(block);
    }
    if (this.findPlace(node)) {
      this.closeExtra();
      let top2 = this.top;
      top2.applyPending(node.type);
      if (top2.match)
        top2.match = top2.match.matchType(node.type);
      let marks = top2.activeMarks;
      for (let i = 0; i < node.marks.length; i++)
        if (!top2.type || top2.type.allowsMarkType(node.marks[i].type))
          marks = node.marks[i].addToSet(marks);
      top2.content.push(node.mark(marks));
      return true;
    }
    return false;
  }
  // Try to start a node of the given type, adjusting the context when
  // necessary.
  enter(type, attrs, preserveWS) {
    let ok = this.findPlace(type.create(attrs));
    if (ok)
      this.enterInner(type, attrs, true, preserveWS);
    return ok;
  }
  // Open a node of the given type
  enterInner(type, attrs = null, solid = false, preserveWS) {
    this.closeExtra();
    let top2 = this.top;
    top2.applyPending(type);
    top2.match = top2.match && top2.match.matchType(type);
    let options = wsOptionsFor(type, preserveWS, top2.options);
    if (top2.options & OPT_OPEN_LEFT && top2.content.length == 0)
      options |= OPT_OPEN_LEFT;
    this.nodes.push(new NodeContext(type, attrs, top2.activeMarks, top2.pendingMarks, solid, null, options));
    this.open++;
  }
  // Make sure all nodes above this.open are finished and added to
  // their parents
  closeExtra(openEnd = false) {
    let i = this.nodes.length - 1;
    if (i > this.open) {
      for (; i > this.open; i--)
        this.nodes[i - 1].content.push(this.nodes[i].finish(openEnd));
      this.nodes.length = this.open + 1;
    }
  }
  finish() {
    this.open = 0;
    this.closeExtra(this.isOpen);
    return this.nodes[0].finish(this.isOpen || this.options.topOpen);
  }
  sync(to) {
    for (let i = this.open; i >= 0; i--)
      if (this.nodes[i] == to) {
        this.open = i;
        return true;
      }
    return false;
  }
  get currentPos() {
    this.closeExtra();
    let pos = 0;
    for (let i = this.open; i >= 0; i--) {
      let content = this.nodes[i].content;
      for (let j = content.length - 1; j >= 0; j--)
        pos += content[j].nodeSize;
      if (i)
        pos++;
    }
    return pos;
  }
  findAtPoint(parent, offset2) {
    if (this.find)
      for (let i = 0; i < this.find.length; i++) {
        if (this.find[i].node == parent && this.find[i].offset == offset2)
          this.find[i].pos = this.currentPos;
      }
  }
  findInside(parent) {
    if (this.find)
      for (let i = 0; i < this.find.length; i++) {
        if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node))
          this.find[i].pos = this.currentPos;
      }
  }
  findAround(parent, content, before) {
    if (parent != content && this.find)
      for (let i = 0; i < this.find.length; i++) {
        if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node)) {
          let pos = content.compareDocumentPosition(this.find[i].node);
          if (pos & (before ? 2 : 4))
            this.find[i].pos = this.currentPos;
        }
      }
  }
  findInText(textNode) {
    if (this.find)
      for (let i = 0; i < this.find.length; i++) {
        if (this.find[i].node == textNode)
          this.find[i].pos = this.currentPos - (textNode.nodeValue.length - this.find[i].offset);
      }
  }
  // Determines whether the given context string matches this context.
  matchesContext(context) {
    if (context.indexOf("|") > -1)
      return context.split(/\s*\|\s*/).some(this.matchesContext, this);
    let parts = context.split("/");
    let option = this.options.context;
    let useRoot = !this.isOpen && (!option || option.parent.type == this.nodes[0].type);
    let minDepth = -(option ? option.depth + 1 : 0) + (useRoot ? 0 : 1);
    let match = (i, depth) => {
      for (; i >= 0; i--) {
        let part = parts[i];
        if (part == "") {
          if (i == parts.length - 1 || i == 0)
            continue;
          for (; depth >= minDepth; depth--)
            if (match(i - 1, depth))
              return true;
          return false;
        } else {
          let next = depth > 0 || depth == 0 && useRoot ? this.nodes[depth].type : option && depth >= minDepth ? option.node(depth - minDepth).type : null;
          if (!next || next.name != part && next.groups.indexOf(part) == -1)
            return false;
          depth--;
        }
      }
      return true;
    };
    return match(parts.length - 1, this.open);
  }
  textblockFromContext() {
    let $context = this.options.context;
    if ($context)
      for (let d = $context.depth; d >= 0; d--) {
        let deflt = $context.node(d).contentMatchAt($context.indexAfter(d)).defaultType;
        if (deflt && deflt.isTextblock && deflt.defaultAttrs)
          return deflt;
      }
    for (let name in this.parser.schema.nodes) {
      let type = this.parser.schema.nodes[name];
      if (type.isTextblock && type.defaultAttrs)
        return type;
    }
  }
  addPendingMark(mark) {
    let found2 = findSameMarkInSet(mark, this.top.pendingMarks);
    if (found2)
      this.top.stashMarks.push(found2);
    this.top.pendingMarks = mark.addToSet(this.top.pendingMarks);
  }
  removePendingMark(mark, upto) {
    for (let depth = this.open; depth >= 0; depth--) {
      let level = this.nodes[depth];
      let found2 = level.pendingMarks.lastIndexOf(mark);
      if (found2 > -1) {
        level.pendingMarks = mark.removeFromSet(level.pendingMarks);
      } else {
        level.activeMarks = mark.removeFromSet(level.activeMarks);
        let stashMark = level.popFromStashMark(mark);
        if (stashMark && level.type && level.type.allowsMarkType(stashMark.type))
          level.activeMarks = stashMark.addToSet(level.activeMarks);
      }
      if (level == upto)
        break;
    }
  }
};
function normalizeList(dom) {
  for (let child = dom.firstChild, prevItem = null; child; child = child.nextSibling) {
    let name = child.nodeType == 1 ? child.nodeName.toLowerCase() : null;
    if (name && listTags.hasOwnProperty(name) && prevItem) {
      prevItem.appendChild(child);
      child = prevItem;
    } else if (name == "li") {
      prevItem = child;
    } else if (name) {
      prevItem = null;
    }
  }
}
function matches(dom, selector) {
  return (dom.matches || dom.msMatchesSelector || dom.webkitMatchesSelector || dom.mozMatchesSelector).call(dom, selector);
}
function parseStyles(style) {
  let re = /\s*([\w-]+)\s*:\s*([^;]+)/g, m, result = [];
  while (m = re.exec(style))
    result.push(m[1], m[2].trim());
  return result;
}
function copy(obj) {
  let copy2 = {};
  for (let prop in obj)
    copy2[prop] = obj[prop];
  return copy2;
}
function markMayApply(markType, nodeType) {
  let nodes = nodeType.schema.nodes;
  for (let name in nodes) {
    let parent = nodes[name];
    if (!parent.allowsMarkType(markType))
      continue;
    let seen = [], scan = (match) => {
      seen.push(match);
      for (let i = 0; i < match.edgeCount; i++) {
        let { type, next } = match.edge(i);
        if (type == nodeType)
          return true;
        if (seen.indexOf(next) < 0 && scan(next))
          return true;
      }
    };
    if (scan(parent.contentMatch))
      return true;
  }
}
function findSameMarkInSet(mark, set) {
  for (let i = 0; i < set.length; i++) {
    if (mark.eq(set[i]))
      return set[i];
  }
}

// ../../../node_modules/prosemirror-transform/dist/index.js
var lower16 = 65535;
var factor16 = Math.pow(2, 16);
function makeRecover(index, offset2) {
  return index + offset2 * factor16;
}
function recoverIndex(value) {
  return value & lower16;
}
function recoverOffset(value) {
  return (value - (value & lower16)) / factor16;
}
var DEL_BEFORE = 1;
var DEL_AFTER = 2;
var DEL_ACROSS = 4;
var DEL_SIDE = 8;
var MapResult = class {
  /**
  @internal
  */
  constructor(pos, delInfo, recover) {
    this.pos = pos;
    this.delInfo = delInfo;
    this.recover = recover;
  }
  /**
  Tells you whether the position was deleted, that is, whether the
  step removed the token on the side queried (via the `assoc`)
  argument from the document.
  */
  get deleted() {
    return (this.delInfo & DEL_SIDE) > 0;
  }
  /**
  Tells you whether the token before the mapped position was deleted.
  */
  get deletedBefore() {
    return (this.delInfo & (DEL_BEFORE | DEL_ACROSS)) > 0;
  }
  /**
  True when the token after the mapped position was deleted.
  */
  get deletedAfter() {
    return (this.delInfo & (DEL_AFTER | DEL_ACROSS)) > 0;
  }
  /**
  Tells whether any of the steps mapped through deletes across the
  position (including both the token before and after the
  position).
  */
  get deletedAcross() {
    return (this.delInfo & DEL_ACROSS) > 0;
  }
};
var StepMap = class _StepMap {
  /**
  Create a position map. The modifications to the document are
  represented as an array of numbers, in which each group of three
  represents a modified chunk as `[start, oldSize, newSize]`.
  */
  constructor(ranges, inverted = false) {
    this.ranges = ranges;
    this.inverted = inverted;
    if (!ranges.length && _StepMap.empty)
      return _StepMap.empty;
  }
  /**
  @internal
  */
  recover(value) {
    let diff = 0, index = recoverIndex(value);
    if (!this.inverted)
      for (let i = 0; i < index; i++)
        diff += this.ranges[i * 3 + 2] - this.ranges[i * 3 + 1];
    return this.ranges[index * 3] + diff + recoverOffset(value);
  }
  mapResult(pos, assoc = 1) {
    return this._map(pos, assoc, false);
  }
  map(pos, assoc = 1) {
    return this._map(pos, assoc, true);
  }
  /**
  @internal
  */
  _map(pos, assoc, simple) {
    let diff = 0, oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
    for (let i = 0; i < this.ranges.length; i += 3) {
      let start2 = this.ranges[i] - (this.inverted ? diff : 0);
      if (start2 > pos)
        break;
      let oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex], end2 = start2 + oldSize;
      if (pos <= end2) {
        let side = !oldSize ? assoc : pos == start2 ? -1 : pos == end2 ? 1 : assoc;
        let result = start2 + diff + (side < 0 ? 0 : newSize);
        if (simple)
          return result;
        let recover = pos == (assoc < 0 ? start2 : end2) ? null : makeRecover(i / 3, pos - start2);
        let del2 = pos == start2 ? DEL_AFTER : pos == end2 ? DEL_BEFORE : DEL_ACROSS;
        if (assoc < 0 ? pos != start2 : pos != end2)
          del2 |= DEL_SIDE;
        return new MapResult(result, del2, recover);
      }
      diff += newSize - oldSize;
    }
    return simple ? pos + diff : new MapResult(pos + diff, 0, null);
  }
  /**
  @internal
  */
  touches(pos, recover) {
    let diff = 0, index = recoverIndex(recover);
    let oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
    for (let i = 0; i < this.ranges.length; i += 3) {
      let start2 = this.ranges[i] - (this.inverted ? diff : 0);
      if (start2 > pos)
        break;
      let oldSize = this.ranges[i + oldIndex], end2 = start2 + oldSize;
      if (pos <= end2 && i == index * 3)
        return true;
      diff += this.ranges[i + newIndex] - oldSize;
    }
    return false;
  }
  /**
  Calls the given function on each of the changed ranges included in
  this map.
  */
  forEach(f) {
    let oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
    for (let i = 0, diff = 0; i < this.ranges.length; i += 3) {
      let start2 = this.ranges[i], oldStart = start2 - (this.inverted ? diff : 0), newStart = start2 + (this.inverted ? 0 : diff);
      let oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex];
      f(oldStart, oldStart + oldSize, newStart, newStart + newSize);
      diff += newSize - oldSize;
    }
  }
  /**
  Create an inverted version of this map. The result can be used to
  map positions in the post-step document to the pre-step document.
  */
  invert() {
    return new _StepMap(this.ranges, !this.inverted);
  }
  /**
  @internal
  */
  toString() {
    return (this.inverted ? "-" : "") + JSON.stringify(this.ranges);
  }
  /**
  Create a map that moves all positions by offset `n` (which may be
  negative). This can be useful when applying steps meant for a
  sub-document to a larger document, or vice-versa.
  */
  static offset(n) {
    return n == 0 ? _StepMap.empty : new _StepMap(n < 0 ? [0, -n, 0] : [0, 0, n]);
  }
};
StepMap.empty = new StepMap([]);
var stepsByID = /* @__PURE__ */ Object.create(null);
var Step = class {
  /**
  Get the step map that represents the changes made by this step,
  and which can be used to transform between positions in the old
  and the new document.
  */
  getMap() {
    return StepMap.empty;
  }
  /**
  Try to merge this step with another one, to be applied directly
  after it. Returns the merged step when possible, null if the
  steps can't be merged.
  */
  merge(other) {
    return null;
  }
  /**
  Deserialize a step from its JSON representation. Will call
  through to the step class' own implementation of this method.
  */
  static fromJSON(schema, json) {
    if (!json || !json.stepType)
      throw new RangeError("Invalid input for Step.fromJSON");
    let type = stepsByID[json.stepType];
    if (!type)
      throw new RangeError(`No step type ${json.stepType} defined`);
    return type.fromJSON(schema, json);
  }
  /**
  To be able to serialize steps to JSON, each step needs a string
  ID to attach to its JSON representation. Use this method to
  register an ID for your step classes. Try to pick something
  that's unlikely to clash with steps from other modules.
  */
  static jsonID(id, stepClass) {
    if (id in stepsByID)
      throw new RangeError("Duplicate use of step JSON ID " + id);
    stepsByID[id] = stepClass;
    stepClass.prototype.jsonID = id;
    return stepClass;
  }
};
var StepResult = class _StepResult {
  /**
  @internal
  */
  constructor(doc, failed) {
    this.doc = doc;
    this.failed = failed;
  }
  /**
  Create a successful step result.
  */
  static ok(doc) {
    return new _StepResult(doc, null);
  }
  /**
  Create a failed step result.
  */
  static fail(message) {
    return new _StepResult(null, message);
  }
  /**
  Call [`Node.replace`](https://prosemirror.net/docs/ref/#model.Node.replace) with the given
  arguments. Create a successful result if it succeeds, and a
  failed one if it throws a `ReplaceError`.
  */
  static fromReplace(doc, from, to, slice) {
    try {
      return _StepResult.ok(doc.replace(from, to, slice));
    } catch (e) {
      if (e instanceof ReplaceError)
        return _StepResult.fail(e.message);
      throw e;
    }
  }
};
function mapFragment(fragment, f, parent) {
  let mapped = [];
  for (let i = 0; i < fragment.childCount; i++) {
    let child = fragment.child(i);
    if (child.content.size)
      child = child.copy(mapFragment(child.content, f, child));
    if (child.isInline)
      child = f(child, parent, i);
    mapped.push(child);
  }
  return Fragment.fromArray(mapped);
}
var AddMarkStep = class _AddMarkStep extends Step {
  /**
  Create a mark step.
  */
  constructor(from, to, mark) {
    super();
    this.from = from;
    this.to = to;
    this.mark = mark;
  }
  apply(doc) {
    let oldSlice = doc.slice(this.from, this.to), $from = doc.resolve(this.from);
    let parent = $from.node($from.sharedDepth(this.to));
    let slice = new Slice(mapFragment(oldSlice.content, (node, parent2) => {
      if (!node.isAtom || !parent2.type.allowsMarkType(this.mark.type))
        return node;
      return node.mark(this.mark.addToSet(node.marks));
    }, parent), oldSlice.openStart, oldSlice.openEnd);
    return StepResult.fromReplace(doc, this.from, this.to, slice);
  }
  invert() {
    return new RemoveMarkStep(this.from, this.to, this.mark);
  }
  map(mapping) {
    let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
    if (from.deleted && to.deleted || from.pos >= to.pos)
      return null;
    return new _AddMarkStep(from.pos, to.pos, this.mark);
  }
  merge(other) {
    if (other instanceof _AddMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from)
      return new _AddMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
    return null;
  }
  toJSON() {
    return {
      stepType: "addMark",
      mark: this.mark.toJSON(),
      from: this.from,
      to: this.to
    };
  }
  /**
  @internal
  */
  static fromJSON(schema, json) {
    if (typeof json.from != "number" || typeof json.to != "number")
      throw new RangeError("Invalid input for AddMarkStep.fromJSON");
    return new _AddMarkStep(json.from, json.to, schema.markFromJSON(json.mark));
  }
};
Step.jsonID("addMark", AddMarkStep);
var RemoveMarkStep = class _RemoveMarkStep extends Step {
  /**
  Create a mark-removing step.
  */
  constructor(from, to, mark) {
    super();
    this.from = from;
    this.to = to;
    this.mark = mark;
  }
  apply(doc) {
    let oldSlice = doc.slice(this.from, this.to);
    let slice = new Slice(mapFragment(oldSlice.content, (node) => {
      return node.mark(this.mark.removeFromSet(node.marks));
    }, doc), oldSlice.openStart, oldSlice.openEnd);
    return StepResult.fromReplace(doc, this.from, this.to, slice);
  }
  invert() {
    return new AddMarkStep(this.from, this.to, this.mark);
  }
  map(mapping) {
    let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
    if (from.deleted && to.deleted || from.pos >= to.pos)
      return null;
    return new _RemoveMarkStep(from.pos, to.pos, this.mark);
  }
  merge(other) {
    if (other instanceof _RemoveMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from)
      return new _RemoveMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
    return null;
  }
  toJSON() {
    return {
      stepType: "removeMark",
      mark: this.mark.toJSON(),
      from: this.from,
      to: this.to
    };
  }
  /**
  @internal
  */
  static fromJSON(schema, json) {
    if (typeof json.from != "number" || typeof json.to != "number")
      throw new RangeError("Invalid input for RemoveMarkStep.fromJSON");
    return new _RemoveMarkStep(json.from, json.to, schema.markFromJSON(json.mark));
  }
};
Step.jsonID("removeMark", RemoveMarkStep);
var AddNodeMarkStep = class _AddNodeMarkStep extends Step {
  /**
  Create a node mark step.
  */
  constructor(pos, mark) {
    super();
    this.pos = pos;
    this.mark = mark;
  }
  apply(doc) {
    let node = doc.nodeAt(this.pos);
    if (!node)
      return StepResult.fail("No node at mark step's position");
    let updated = node.type.create(node.attrs, null, this.mark.addToSet(node.marks));
    return StepResult.fromReplace(doc, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
  }
  invert(doc) {
    let node = doc.nodeAt(this.pos);
    if (node) {
      let newSet = this.mark.addToSet(node.marks);
      if (newSet.length == node.marks.length) {
        for (let i = 0; i < node.marks.length; i++)
          if (!node.marks[i].isInSet(newSet))
            return new _AddNodeMarkStep(this.pos, node.marks[i]);
        return new _AddNodeMarkStep(this.pos, this.mark);
      }
    }
    return new RemoveNodeMarkStep(this.pos, this.mark);
  }
  map(mapping) {
    let pos = mapping.mapResult(this.pos, 1);
    return pos.deletedAfter ? null : new _AddNodeMarkStep(pos.pos, this.mark);
  }
  toJSON() {
    return { stepType: "addNodeMark", pos: this.pos, mark: this.mark.toJSON() };
  }
  /**
  @internal
  */
  static fromJSON(schema, json) {
    if (typeof json.pos != "number")
      throw new RangeError("Invalid input for AddNodeMarkStep.fromJSON");
    return new _AddNodeMarkStep(json.pos, schema.markFromJSON(json.mark));
  }
};
Step.jsonID("addNodeMark", AddNodeMarkStep);
var RemoveNodeMarkStep = class _RemoveNodeMarkStep extends Step {
  /**
  Create a mark-removing step.
  */
  constructor(pos, mark) {
    super();
    this.pos = pos;
    this.mark = mark;
  }
  apply(doc) {
    let node = doc.nodeAt(this.pos);
    if (!node)
      return StepResult.fail("No node at mark step's position");
    let updated = node.type.create(node.attrs, null, this.mark.removeFromSet(node.marks));
    return StepResult.fromReplace(doc, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
  }
  invert(doc) {
    let node = doc.nodeAt(this.pos);
    if (!node || !this.mark.isInSet(node.marks))
      return this;
    return new AddNodeMarkStep(this.pos, this.mark);
  }
  map(mapping) {
    let pos = mapping.mapResult(this.pos, 1);
    return pos.deletedAfter ? null : new _RemoveNodeMarkStep(pos.pos, this.mark);
  }
  toJSON() {
    return { stepType: "removeNodeMark", pos: this.pos, mark: this.mark.toJSON() };
  }
  /**
  @internal
  */
  static fromJSON(schema, json) {
    if (typeof json.pos != "number")
      throw new RangeError("Invalid input for RemoveNodeMarkStep.fromJSON");
    return new _RemoveNodeMarkStep(json.pos, schema.markFromJSON(json.mark));
  }
};
Step.jsonID("removeNodeMark", RemoveNodeMarkStep);
var ReplaceStep = class _ReplaceStep extends Step {
  /**
  The given `slice` should fit the 'gap' between `from` and
  `to`—the depths must line up, and the surrounding nodes must be
  able to be joined with the open sides of the slice. When
  `structure` is true, the step will fail if the content between
  from and to is not just a sequence of closing and then opening
  tokens (this is to guard against rebased replace steps
  overwriting something they weren't supposed to).
  */
  constructor(from, to, slice, structure = false) {
    super();
    this.from = from;
    this.to = to;
    this.slice = slice;
    this.structure = structure;
  }
  apply(doc) {
    if (this.structure && contentBetween(doc, this.from, this.to))
      return StepResult.fail("Structure replace would overwrite content");
    return StepResult.fromReplace(doc, this.from, this.to, this.slice);
  }
  getMap() {
    return new StepMap([this.from, this.to - this.from, this.slice.size]);
  }
  invert(doc) {
    return new _ReplaceStep(this.from, this.from + this.slice.size, doc.slice(this.from, this.to));
  }
  map(mapping) {
    let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
    if (from.deletedAcross && to.deletedAcross)
      return null;
    return new _ReplaceStep(from.pos, Math.max(from.pos, to.pos), this.slice);
  }
  merge(other) {
    if (!(other instanceof _ReplaceStep) || other.structure || this.structure)
      return null;
    if (this.from + this.slice.size == other.from && !this.slice.openEnd && !other.slice.openStart) {
      let slice = this.slice.size + other.slice.size == 0 ? Slice.empty : new Slice(this.slice.content.append(other.slice.content), this.slice.openStart, other.slice.openEnd);
      return new _ReplaceStep(this.from, this.to + (other.to - other.from), slice, this.structure);
    } else if (other.to == this.from && !this.slice.openStart && !other.slice.openEnd) {
      let slice = this.slice.size + other.slice.size == 0 ? Slice.empty : new Slice(other.slice.content.append(this.slice.content), other.slice.openStart, this.slice.openEnd);
      return new _ReplaceStep(other.from, this.to, slice, this.structure);
    } else {
      return null;
    }
  }
  toJSON() {
    let json = { stepType: "replace", from: this.from, to: this.to };
    if (this.slice.size)
      json.slice = this.slice.toJSON();
    if (this.structure)
      json.structure = true;
    return json;
  }
  /**
  @internal
  */
  static fromJSON(schema, json) {
    if (typeof json.from != "number" || typeof json.to != "number")
      throw new RangeError("Invalid input for ReplaceStep.fromJSON");
    return new _ReplaceStep(json.from, json.to, Slice.fromJSON(schema, json.slice), !!json.structure);
  }
};
Step.jsonID("replace", ReplaceStep);
var ReplaceAroundStep = class _ReplaceAroundStep extends Step {
  /**
  Create a replace-around step with the given range and gap.
  `insert` should be the point in the slice into which the content
  of the gap should be moved. `structure` has the same meaning as
  it has in the [`ReplaceStep`](https://prosemirror.net/docs/ref/#transform.ReplaceStep) class.
  */
  constructor(from, to, gapFrom, gapTo, slice, insert, structure = false) {
    super();
    this.from = from;
    this.to = to;
    this.gapFrom = gapFrom;
    this.gapTo = gapTo;
    this.slice = slice;
    this.insert = insert;
    this.structure = structure;
  }
  apply(doc) {
    if (this.structure && (contentBetween(doc, this.from, this.gapFrom) || contentBetween(doc, this.gapTo, this.to)))
      return StepResult.fail("Structure gap-replace would overwrite content");
    let gap = doc.slice(this.gapFrom, this.gapTo);
    if (gap.openStart || gap.openEnd)
      return StepResult.fail("Gap is not a flat range");
    let inserted = this.slice.insertAt(this.insert, gap.content);
    if (!inserted)
      return StepResult.fail("Content does not fit in gap");
    return StepResult.fromReplace(doc, this.from, this.to, inserted);
  }
  getMap() {
    return new StepMap([
      this.from,
      this.gapFrom - this.from,
      this.insert,
      this.gapTo,
      this.to - this.gapTo,
      this.slice.size - this.insert
    ]);
  }
  invert(doc) {
    let gap = this.gapTo - this.gapFrom;
    return new _ReplaceAroundStep(this.from, this.from + this.slice.size + gap, this.from + this.insert, this.from + this.insert + gap, doc.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
  }
  map(mapping) {
    let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
    let gapFrom = mapping.map(this.gapFrom, -1), gapTo = mapping.map(this.gapTo, 1);
    if (from.deletedAcross && to.deletedAcross || gapFrom < from.pos || gapTo > to.pos)
      return null;
    return new _ReplaceAroundStep(from.pos, to.pos, gapFrom, gapTo, this.slice, this.insert, this.structure);
  }
  toJSON() {
    let json = {
      stepType: "replaceAround",
      from: this.from,
      to: this.to,
      gapFrom: this.gapFrom,
      gapTo: this.gapTo,
      insert: this.insert
    };
    if (this.slice.size)
      json.slice = this.slice.toJSON();
    if (this.structure)
      json.structure = true;
    return json;
  }
  /**
  @internal
  */
  static fromJSON(schema, json) {
    if (typeof json.from != "number" || typeof json.to != "number" || typeof json.gapFrom != "number" || typeof json.gapTo != "number" || typeof json.insert != "number")
      throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON");
    return new _ReplaceAroundStep(json.from, json.to, json.gapFrom, json.gapTo, Slice.fromJSON(schema, json.slice), json.insert, !!json.structure);
  }
};
Step.jsonID("replaceAround", ReplaceAroundStep);
function contentBetween(doc, from, to) {
  let $from = doc.resolve(from), dist = to - from, depth = $from.depth;
  while (dist > 0 && depth > 0 && $from.indexAfter(depth) == $from.node(depth).childCount) {
    depth--;
    dist--;
  }
  if (dist > 0) {
    let next = $from.node(depth).maybeChild($from.indexAfter(depth));
    while (dist > 0) {
      if (!next || next.isLeaf)
        return true;
      next = next.firstChild;
      dist--;
    }
  }
  return false;
}
function canCut(node, start2, end2) {
  return (start2 == 0 || node.canReplace(start2, node.childCount)) && (end2 == node.childCount || node.canReplace(0, end2));
}
function liftTarget(range) {
  let parent = range.parent;
  let content = parent.content.cutByIndex(range.startIndex, range.endIndex);
  for (let depth = range.depth; ; --depth) {
    let node = range.$from.node(depth);
    let index = range.$from.index(depth), endIndex = range.$to.indexAfter(depth);
    if (depth < range.depth && node.canReplace(index, endIndex, content))
      return depth;
    if (depth == 0 || node.type.spec.isolating || !canCut(node, index, endIndex))
      break;
  }
  return null;
}
function findWrapping(range, nodeType, attrs = null, innerRange = range) {
  let around = findWrappingOutside(range, nodeType);
  let inner = around && findWrappingInside(innerRange, nodeType);
  if (!inner)
    return null;
  return around.map(withAttrs).concat({ type: nodeType, attrs }).concat(inner.map(withAttrs));
}
function withAttrs(type) {
  return { type, attrs: null };
}
function findWrappingOutside(range, type) {
  let { parent, startIndex, endIndex } = range;
  let around = parent.contentMatchAt(startIndex).findWrapping(type);
  if (!around)
    return null;
  let outer = around.length ? around[0] : type;
  return parent.canReplaceWith(startIndex, endIndex, outer) ? around : null;
}
function findWrappingInside(range, type) {
  let { parent, startIndex, endIndex } = range;
  let inner = parent.child(startIndex);
  let inside = type.contentMatch.findWrapping(inner.type);
  if (!inside)
    return null;
  let lastType = inside.length ? inside[inside.length - 1] : type;
  let innerMatch = lastType.contentMatch;
  for (let i = startIndex; innerMatch && i < endIndex; i++)
    innerMatch = innerMatch.matchType(parent.child(i).type);
  if (!innerMatch || !innerMatch.validEnd)
    return null;
  return inside;
}
function canSplit(doc, pos, depth = 1, typesAfter) {
  let $pos = doc.resolve(pos), base = $pos.depth - depth;
  let innerType = typesAfter && typesAfter[typesAfter.length - 1] || $pos.parent;
  if (base < 0 || $pos.parent.type.spec.isolating || !$pos.parent.canReplace($pos.index(), $pos.parent.childCount) || !innerType.type.validContent($pos.parent.content.cutByIndex($pos.index(), $pos.parent.childCount)))
    return false;
  for (let d = $pos.depth - 1, i = depth - 2; d > base; d--, i--) {
    let node = $pos.node(d), index2 = $pos.index(d);
    if (node.type.spec.isolating)
      return false;
    let rest = node.content.cutByIndex(index2, node.childCount);
    let overrideChild = typesAfter && typesAfter[i + 1];
    if (overrideChild)
      rest = rest.replaceChild(0, overrideChild.type.create(overrideChild.attrs));
    let after = typesAfter && typesAfter[i] || node;
    if (!node.canReplace(index2 + 1, node.childCount) || !after.type.validContent(rest))
      return false;
  }
  let index = $pos.indexAfter(base);
  let baseType = typesAfter && typesAfter[0];
  return $pos.node(base).canReplaceWith(index, index, baseType ? baseType.type : $pos.node(base + 1).type);
}
function canJoin(doc, pos) {
  let $pos = doc.resolve(pos), index = $pos.index();
  return joinable2($pos.nodeBefore, $pos.nodeAfter) && $pos.parent.canReplace(index, index + 1);
}
function joinable2(a, b) {
  return !!(a && b && !a.isLeaf && a.canAppend(b));
}
function joinPoint(doc, pos, dir = -1) {
  let $pos = doc.resolve(pos);
  for (let d = $pos.depth; ; d--) {
    let before, after, index = $pos.index(d);
    if (d == $pos.depth) {
      before = $pos.nodeBefore;
      after = $pos.nodeAfter;
    } else if (dir > 0) {
      before = $pos.node(d + 1);
      index++;
      after = $pos.node(d).maybeChild(index);
    } else {
      before = $pos.node(d).maybeChild(index - 1);
      after = $pos.node(d + 1);
    }
    if (before && !before.isTextblock && joinable2(before, after) && $pos.node(d).canReplace(index, index + 1))
      return pos;
    if (d == 0)
      break;
    pos = dir < 0 ? $pos.before(d) : $pos.after(d);
  }
}
function replaceStep(doc, from, to = from, slice = Slice.empty) {
  if (from == to && !slice.size)
    return null;
  let $from = doc.resolve(from), $to = doc.resolve(to);
  if (fitsTrivially($from, $to, slice))
    return new ReplaceStep(from, to, slice);
  return new Fitter($from, $to, slice).fit();
}
function fitsTrivially($from, $to, slice) {
  return !slice.openStart && !slice.openEnd && $from.start() == $to.start() && $from.parent.canReplace($from.index(), $to.index(), slice.content);
}
var Fitter = class {
  constructor($from, $to, unplaced) {
    this.$from = $from;
    this.$to = $to;
    this.unplaced = unplaced;
    this.frontier = [];
    this.placed = Fragment.empty;
    for (let i = 0; i <= $from.depth; i++) {
      let node = $from.node(i);
      this.frontier.push({
        type: node.type,
        match: node.contentMatchAt($from.indexAfter(i))
      });
    }
    for (let i = $from.depth; i > 0; i--)
      this.placed = Fragment.from($from.node(i).copy(this.placed));
  }
  get depth() {
    return this.frontier.length - 1;
  }
  fit() {
    while (this.unplaced.size) {
      let fit = this.findFittable();
      if (fit)
        this.placeNodes(fit);
      else
        this.openMore() || this.dropNode();
    }
    let moveInline = this.mustMoveInline(), placedSize = this.placed.size - this.depth - this.$from.depth;
    let $from = this.$from, $to = this.close(moveInline < 0 ? this.$to : $from.doc.resolve(moveInline));
    if (!$to)
      return null;
    let content = this.placed, openStart = $from.depth, openEnd = $to.depth;
    while (openStart && openEnd && content.childCount == 1) {
      content = content.firstChild.content;
      openStart--;
      openEnd--;
    }
    let slice = new Slice(content, openStart, openEnd);
    if (moveInline > -1)
      return new ReplaceAroundStep($from.pos, moveInline, this.$to.pos, this.$to.end(), slice, placedSize);
    if (slice.size || $from.pos != this.$to.pos)
      return new ReplaceStep($from.pos, $to.pos, slice);
    return null;
  }
  // Find a position on the start spine of `this.unplaced` that has
  // content that can be moved somewhere on the frontier. Returns two
  // depths, one for the slice and one for the frontier.
  findFittable() {
    let startDepth = this.unplaced.openStart;
    for (let cur = this.unplaced.content, d = 0, openEnd = this.unplaced.openEnd; d < startDepth; d++) {
      let node = cur.firstChild;
      if (cur.childCount > 1)
        openEnd = 0;
      if (node.type.spec.isolating && openEnd <= d) {
        startDepth = d;
        break;
      }
      cur = node.content;
    }
    for (let pass = 1; pass <= 2; pass++) {
      for (let sliceDepth = pass == 1 ? startDepth : this.unplaced.openStart; sliceDepth >= 0; sliceDepth--) {
        let fragment, parent = null;
        if (sliceDepth) {
          parent = contentAt(this.unplaced.content, sliceDepth - 1).firstChild;
          fragment = parent.content;
        } else {
          fragment = this.unplaced.content;
        }
        let first2 = fragment.firstChild;
        for (let frontierDepth = this.depth; frontierDepth >= 0; frontierDepth--) {
          let { type, match } = this.frontier[frontierDepth], wrap, inject = null;
          if (pass == 1 && (first2 ? match.matchType(first2.type) || (inject = match.fillBefore(Fragment.from(first2), false)) : parent && type.compatibleContent(parent.type)))
            return { sliceDepth, frontierDepth, parent, inject };
          else if (pass == 2 && first2 && (wrap = match.findWrapping(first2.type)))
            return { sliceDepth, frontierDepth, parent, wrap };
          if (parent && match.matchType(parent.type))
            break;
        }
      }
    }
  }
  openMore() {
    let { content, openStart, openEnd } = this.unplaced;
    let inner = contentAt(content, openStart);
    if (!inner.childCount || inner.firstChild.isLeaf)
      return false;
    this.unplaced = new Slice(content, openStart + 1, Math.max(openEnd, inner.size + openStart >= content.size - openEnd ? openStart + 1 : 0));
    return true;
  }
  dropNode() {
    let { content, openStart, openEnd } = this.unplaced;
    let inner = contentAt(content, openStart);
    if (inner.childCount <= 1 && openStart > 0) {
      let openAtEnd = content.size - openStart <= openStart + inner.size;
      this.unplaced = new Slice(dropFromFragment(content, openStart - 1, 1), openStart - 1, openAtEnd ? openStart - 1 : openEnd);
    } else {
      this.unplaced = new Slice(dropFromFragment(content, openStart, 1), openStart, openEnd);
    }
  }
  // Move content from the unplaced slice at `sliceDepth` to the
  // frontier node at `frontierDepth`. Close that frontier node when
  // applicable.
  placeNodes({ sliceDepth, frontierDepth, parent, inject, wrap }) {
    while (this.depth > frontierDepth)
      this.closeFrontierNode();
    if (wrap)
      for (let i = 0; i < wrap.length; i++)
        this.openFrontierNode(wrap[i]);
    let slice = this.unplaced, fragment = parent ? parent.content : slice.content;
    let openStart = slice.openStart - sliceDepth;
    let taken = 0, add = [];
    let { match, type } = this.frontier[frontierDepth];
    if (inject) {
      for (let i = 0; i < inject.childCount; i++)
        add.push(inject.child(i));
      match = match.matchFragment(inject);
    }
    let openEndCount = fragment.size + sliceDepth - (slice.content.size - slice.openEnd);
    while (taken < fragment.childCount) {
      let next = fragment.child(taken), matches2 = match.matchType(next.type);
      if (!matches2)
        break;
      taken++;
      if (taken > 1 || openStart == 0 || next.content.size) {
        match = matches2;
        add.push(closeNodeStart(next.mark(type.allowedMarks(next.marks)), taken == 1 ? openStart : 0, taken == fragment.childCount ? openEndCount : -1));
      }
    }
    let toEnd = taken == fragment.childCount;
    if (!toEnd)
      openEndCount = -1;
    this.placed = addToFragment(this.placed, frontierDepth, Fragment.from(add));
    this.frontier[frontierDepth].match = match;
    if (toEnd && openEndCount < 0 && parent && parent.type == this.frontier[this.depth].type && this.frontier.length > 1)
      this.closeFrontierNode();
    for (let i = 0, cur = fragment; i < openEndCount; i++) {
      let node = cur.lastChild;
      this.frontier.push({ type: node.type, match: node.contentMatchAt(node.childCount) });
      cur = node.content;
    }
    this.unplaced = !toEnd ? new Slice(dropFromFragment(slice.content, sliceDepth, taken), slice.openStart, slice.openEnd) : sliceDepth == 0 ? Slice.empty : new Slice(dropFromFragment(slice.content, sliceDepth - 1, 1), sliceDepth - 1, openEndCount < 0 ? slice.openEnd : sliceDepth - 1);
  }
  mustMoveInline() {
    if (!this.$to.parent.isTextblock)
      return -1;
    let top2 = this.frontier[this.depth], level;
    if (!top2.type.isTextblock || !contentAfterFits(this.$to, this.$to.depth, top2.type, top2.match, false) || this.$to.depth == this.depth && (level = this.findCloseLevel(this.$to)) && level.depth == this.depth)
      return -1;
    let { depth } = this.$to, after = this.$to.after(depth);
    while (depth > 1 && after == this.$to.end(--depth))
      ++after;
    return after;
  }
  findCloseLevel($to) {
    scan:
      for (let i = Math.min(this.depth, $to.depth); i >= 0; i--) {
        let { match, type } = this.frontier[i];
        let dropInner = i < $to.depth && $to.end(i + 1) == $to.pos + ($to.depth - (i + 1));
        let fit = contentAfterFits($to, i, type, match, dropInner);
        if (!fit)
          continue;
        for (let d = i - 1; d >= 0; d--) {
          let { match: match2, type: type2 } = this.frontier[d];
          let matches2 = contentAfterFits($to, d, type2, match2, true);
          if (!matches2 || matches2.childCount)
            continue scan;
        }
        return { depth: i, fit, move: dropInner ? $to.doc.resolve($to.after(i + 1)) : $to };
      }
  }
  close($to) {
    let close2 = this.findCloseLevel($to);
    if (!close2)
      return null;
    while (this.depth > close2.depth)
      this.closeFrontierNode();
    if (close2.fit.childCount)
      this.placed = addToFragment(this.placed, close2.depth, close2.fit);
    $to = close2.move;
    for (let d = close2.depth + 1; d <= $to.depth; d++) {
      let node = $to.node(d), add = node.type.contentMatch.fillBefore(node.content, true, $to.index(d));
      this.openFrontierNode(node.type, node.attrs, add);
    }
    return $to;
  }
  openFrontierNode(type, attrs = null, content) {
    let top2 = this.frontier[this.depth];
    top2.match = top2.match.matchType(type);
    this.placed = addToFragment(this.placed, this.depth, Fragment.from(type.create(attrs, content)));
    this.frontier.push({ type, match: type.contentMatch });
  }
  closeFrontierNode() {
    let open = this.frontier.pop();
    let add = open.match.fillBefore(Fragment.empty, true);
    if (add.childCount)
      this.placed = addToFragment(this.placed, this.frontier.length, add);
  }
};
function dropFromFragment(fragment, depth, count) {
  if (depth == 0)
    return fragment.cutByIndex(count, fragment.childCount);
  return fragment.replaceChild(0, fragment.firstChild.copy(dropFromFragment(fragment.firstChild.content, depth - 1, count)));
}
function addToFragment(fragment, depth, content) {
  if (depth == 0)
    return fragment.append(content);
  return fragment.replaceChild(fragment.childCount - 1, fragment.lastChild.copy(addToFragment(fragment.lastChild.content, depth - 1, content)));
}
function contentAt(fragment, depth) {
  for (let i = 0; i < depth; i++)
    fragment = fragment.firstChild.content;
  return fragment;
}
function closeNodeStart(node, openStart, openEnd) {
  if (openStart <= 0)
    return node;
  let frag = node.content;
  if (openStart > 1)
    frag = frag.replaceChild(0, closeNodeStart(frag.firstChild, openStart - 1, frag.childCount == 1 ? openEnd - 1 : 0));
  if (openStart > 0) {
    frag = node.type.contentMatch.fillBefore(frag).append(frag);
    if (openEnd <= 0)
      frag = frag.append(node.type.contentMatch.matchFragment(frag).fillBefore(Fragment.empty, true));
  }
  return node.copy(frag);
}
function contentAfterFits($to, depth, type, match, open) {
  let node = $to.node(depth), index = open ? $to.indexAfter(depth) : $to.index(depth);
  if (index == node.childCount && !type.compatibleContent(node.type))
    return null;
  let fit = match.fillBefore(node.content, true, index);
  return fit && !invalidMarks(type, node.content, index) ? fit : null;
}
function invalidMarks(type, fragment, start2) {
  for (let i = start2; i < fragment.childCount; i++)
    if (!type.allowsMarks(fragment.child(i).marks))
      return true;
  return false;
}
var AttrStep = class _AttrStep extends Step {
  /**
  Construct an attribute step.
  */
  constructor(pos, attr, value) {
    super();
    this.pos = pos;
    this.attr = attr;
    this.value = value;
  }
  apply(doc) {
    let node = doc.nodeAt(this.pos);
    if (!node)
      return StepResult.fail("No node at attribute step's position");
    let attrs = /* @__PURE__ */ Object.create(null);
    for (let name in node.attrs)
      attrs[name] = node.attrs[name];
    attrs[this.attr] = this.value;
    let updated = node.type.create(attrs, null, node.marks);
    return StepResult.fromReplace(doc, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
  }
  getMap() {
    return StepMap.empty;
  }
  invert(doc) {
    return new _AttrStep(this.pos, this.attr, doc.nodeAt(this.pos).attrs[this.attr]);
  }
  map(mapping) {
    let pos = mapping.mapResult(this.pos, 1);
    return pos.deletedAfter ? null : new _AttrStep(pos.pos, this.attr, this.value);
  }
  toJSON() {
    return { stepType: "attr", pos: this.pos, attr: this.attr, value: this.value };
  }
  static fromJSON(schema, json) {
    if (typeof json.pos != "number" || typeof json.attr != "string")
      throw new RangeError("Invalid input for AttrStep.fromJSON");
    return new _AttrStep(json.pos, json.attr, json.value);
  }
};
Step.jsonID("attr", AttrStep);
var DocAttrStep = class _DocAttrStep extends Step {
  /**
  Construct an attribute step.
  */
  constructor(attr, value) {
    super();
    this.attr = attr;
    this.value = value;
  }
  apply(doc) {
    let attrs = /* @__PURE__ */ Object.create(null);
    for (let name in doc.attrs)
      attrs[name] = doc.attrs[name];
    attrs[this.attr] = this.value;
    let updated = doc.type.create(attrs, doc.content, doc.marks);
    return StepResult.ok(updated);
  }
  getMap() {
    return StepMap.empty;
  }
  invert(doc) {
    return new _DocAttrStep(this.attr, doc.attrs[this.attr]);
  }
  map(mapping) {
    return this;
  }
  toJSON() {
    return { stepType: "docAttr", attr: this.attr, value: this.value };
  }
  static fromJSON(schema, json) {
    if (typeof json.attr != "string")
      throw new RangeError("Invalid input for DocAttrStep.fromJSON");
    return new _DocAttrStep(json.attr, json.value);
  }
};
Step.jsonID("docAttr", DocAttrStep);
var TransformError = class extends Error {
};
TransformError = function TransformError2(message) {
  let err = Error.call(this, message);
  err.__proto__ = TransformError2.prototype;
  return err;
};
TransformError.prototype = Object.create(Error.prototype);
TransformError.prototype.constructor = TransformError;
TransformError.prototype.name = "TransformError";

// ../../../node_modules/prosemirror-state/dist/index.js
var classesById = /* @__PURE__ */ Object.create(null);
var Selection = class {
  /**
  Initialize a selection with the head and anchor and ranges. If no
  ranges are given, constructs a single range across `$anchor` and
  `$head`.
  */
  constructor($anchor, $head, ranges) {
    this.$anchor = $anchor;
    this.$head = $head;
    this.ranges = ranges || [new SelectionRange($anchor.min($head), $anchor.max($head))];
  }
  /**
  The selection's anchor, as an unresolved position.
  */
  get anchor() {
    return this.$anchor.pos;
  }
  /**
  The selection's head.
  */
  get head() {
    return this.$head.pos;
  }
  /**
  The lower bound of the selection's main range.
  */
  get from() {
    return this.$from.pos;
  }
  /**
  The upper bound of the selection's main range.
  */
  get to() {
    return this.$to.pos;
  }
  /**
  The resolved lower  bound of the selection's main range.
  */
  get $from() {
    return this.ranges[0].$from;
  }
  /**
  The resolved upper bound of the selection's main range.
  */
  get $to() {
    return this.ranges[0].$to;
  }
  /**
  Indicates whether the selection contains any content.
  */
  get empty() {
    let ranges = this.ranges;
    for (let i = 0; i < ranges.length; i++)
      if (ranges[i].$from.pos != ranges[i].$to.pos)
        return false;
    return true;
  }
  /**
  Get the content of this selection as a slice.
  */
  content() {
    return this.$from.doc.slice(this.from, this.to, true);
  }
  /**
  Replace the selection with a slice or, if no slice is given,
  delete the selection. Will append to the given transaction.
  */
  replace(tr, content = Slice.empty) {
    let lastNode = content.content.lastChild, lastParent = null;
    for (let i = 0; i < content.openEnd; i++) {
      lastParent = lastNode;
      lastNode = lastNode.lastChild;
    }
    let mapFrom = tr.steps.length, ranges = this.ranges;
    for (let i = 0; i < ranges.length; i++) {
      let { $from, $to } = ranges[i], mapping = tr.mapping.slice(mapFrom);
      tr.replaceRange(mapping.map($from.pos), mapping.map($to.pos), i ? Slice.empty : content);
      if (i == 0)
        selectionToInsertionEnd(tr, mapFrom, (lastNode ? lastNode.isInline : lastParent && lastParent.isTextblock) ? -1 : 1);
    }
  }
  /**
  Replace the selection with the given node, appending the changes
  to the given transaction.
  */
  replaceWith(tr, node) {
    let mapFrom = tr.steps.length, ranges = this.ranges;
    for (let i = 0; i < ranges.length; i++) {
      let { $from, $to } = ranges[i], mapping = tr.mapping.slice(mapFrom);
      let from = mapping.map($from.pos), to = mapping.map($to.pos);
      if (i) {
        tr.deleteRange(from, to);
      } else {
        tr.replaceRangeWith(from, to, node);
        selectionToInsertionEnd(tr, mapFrom, node.isInline ? -1 : 1);
      }
    }
  }
  /**
  Find a valid cursor or leaf node selection starting at the given
  position and searching back if `dir` is negative, and forward if
  positive. When `textOnly` is true, only consider cursor
  selections. Will return null when no valid selection position is
  found.
  */
  static findFrom($pos, dir, textOnly = false) {
    let inner = $pos.parent.inlineContent ? new TextSelection($pos) : findSelectionIn($pos.node(0), $pos.parent, $pos.pos, $pos.index(), dir, textOnly);
    if (inner)
      return inner;
    for (let depth = $pos.depth - 1; depth >= 0; depth--) {
      let found2 = dir < 0 ? findSelectionIn($pos.node(0), $pos.node(depth), $pos.before(depth + 1), $pos.index(depth), dir, textOnly) : findSelectionIn($pos.node(0), $pos.node(depth), $pos.after(depth + 1), $pos.index(depth) + 1, dir, textOnly);
      if (found2)
        return found2;
    }
    return null;
  }
  /**
  Find a valid cursor or leaf node selection near the given
  position. Searches forward first by default, but if `bias` is
  negative, it will search backwards first.
  */
  static near($pos, bias = 1) {
    return this.findFrom($pos, bias) || this.findFrom($pos, -bias) || new AllSelection($pos.node(0));
  }
  /**
  Find the cursor or leaf node selection closest to the start of
  the given document. Will return an
  [`AllSelection`](https://prosemirror.net/docs/ref/#state.AllSelection) if no valid position
  exists.
  */
  static atStart(doc) {
    return findSelectionIn(doc, doc, 0, 0, 1) || new AllSelection(doc);
  }
  /**
  Find the cursor or leaf node selection closest to the end of the
  given document.
  */
  static atEnd(doc) {
    return findSelectionIn(doc, doc, doc.content.size, doc.childCount, -1) || new AllSelection(doc);
  }
  /**
  Deserialize the JSON representation of a selection. Must be
  implemented for custom classes (as a static class method).
  */
  static fromJSON(doc, json) {
    if (!json || !json.type)
      throw new RangeError("Invalid input for Selection.fromJSON");
    let cls = classesById[json.type];
    if (!cls)
      throw new RangeError(`No selection type ${json.type} defined`);
    return cls.fromJSON(doc, json);
  }
  /**
  To be able to deserialize selections from JSON, custom selection
  classes must register themselves with an ID string, so that they
  can be disambiguated. Try to pick something that's unlikely to
  clash with classes from other modules.
  */
  static jsonID(id, selectionClass) {
    if (id in classesById)
      throw new RangeError("Duplicate use of selection JSON ID " + id);
    classesById[id] = selectionClass;
    selectionClass.prototype.jsonID = id;
    return selectionClass;
  }
  /**
  Get a [bookmark](https://prosemirror.net/docs/ref/#state.SelectionBookmark) for this selection,
  which is a value that can be mapped without having access to a
  current document, and later resolved to a real selection for a
  given document again. (This is used mostly by the history to
  track and restore old selections.) The default implementation of
  this method just converts the selection to a text selection and
  returns the bookmark for that.
  */
  getBookmark() {
    return TextSelection.between(this.$anchor, this.$head).getBookmark();
  }
};
Selection.prototype.visible = true;
var SelectionRange = class {
  /**
  Create a range.
  */
  constructor($from, $to) {
    this.$from = $from;
    this.$to = $to;
  }
};
var warnedAboutTextSelection = false;
function checkTextSelection($pos) {
  if (!warnedAboutTextSelection && !$pos.parent.inlineContent) {
    warnedAboutTextSelection = true;
    console["warn"]("TextSelection endpoint not pointing into a node with inline content (" + $pos.parent.type.name + ")");
  }
}
var TextSelection = class _TextSelection extends Selection {
  /**
  Construct a text selection between the given points.
  */
  constructor($anchor, $head = $anchor) {
    checkTextSelection($anchor);
    checkTextSelection($head);
    super($anchor, $head);
  }
  /**
  Returns a resolved position if this is a cursor selection (an
  empty text selection), and null otherwise.
  */
  get $cursor() {
    return this.$anchor.pos == this.$head.pos ? this.$head : null;
  }
  map(doc, mapping) {
    let $head = doc.resolve(mapping.map(this.head));
    if (!$head.parent.inlineContent)
      return Selection.near($head);
    let $anchor = doc.resolve(mapping.map(this.anchor));
    return new _TextSelection($anchor.parent.inlineContent ? $anchor : $head, $head);
  }
  replace(tr, content = Slice.empty) {
    super.replace(tr, content);
    if (content == Slice.empty) {
      let marks = this.$from.marksAcross(this.$to);
      if (marks)
        tr.ensureMarks(marks);
    }
  }
  eq(other) {
    return other instanceof _TextSelection && other.anchor == this.anchor && other.head == this.head;
  }
  getBookmark() {
    return new TextBookmark(this.anchor, this.head);
  }
  toJSON() {
    return { type: "text", anchor: this.anchor, head: this.head };
  }
  /**
  @internal
  */
  static fromJSON(doc, json) {
    if (typeof json.anchor != "number" || typeof json.head != "number")
      throw new RangeError("Invalid input for TextSelection.fromJSON");
    return new _TextSelection(doc.resolve(json.anchor), doc.resolve(json.head));
  }
  /**
  Create a text selection from non-resolved positions.
  */
  static create(doc, anchor, head = anchor) {
    let $anchor = doc.resolve(anchor);
    return new this($anchor, head == anchor ? $anchor : doc.resolve(head));
  }
  /**
  Return a text selection that spans the given positions or, if
  they aren't text positions, find a text selection near them.
  `bias` determines whether the method searches forward (default)
  or backwards (negative number) first. Will fall back to calling
  [`Selection.near`](https://prosemirror.net/docs/ref/#state.Selection^near) when the document
  doesn't contain a valid text position.
  */
  static between($anchor, $head, bias) {
    let dPos = $anchor.pos - $head.pos;
    if (!bias || dPos)
      bias = dPos >= 0 ? 1 : -1;
    if (!$head.parent.inlineContent) {
      let found2 = Selection.findFrom($head, bias, true) || Selection.findFrom($head, -bias, true);
      if (found2)
        $head = found2.$head;
      else
        return Selection.near($head, bias);
    }
    if (!$anchor.parent.inlineContent) {
      if (dPos == 0) {
        $anchor = $head;
      } else {
        $anchor = (Selection.findFrom($anchor, -bias, true) || Selection.findFrom($anchor, bias, true)).$anchor;
        if ($anchor.pos < $head.pos != dPos < 0)
          $anchor = $head;
      }
    }
    return new _TextSelection($anchor, $head);
  }
};
Selection.jsonID("text", TextSelection);
var TextBookmark = class _TextBookmark {
  constructor(anchor, head) {
    this.anchor = anchor;
    this.head = head;
  }
  map(mapping) {
    return new _TextBookmark(mapping.map(this.anchor), mapping.map(this.head));
  }
  resolve(doc) {
    return TextSelection.between(doc.resolve(this.anchor), doc.resolve(this.head));
  }
};
var NodeSelection = class _NodeSelection extends Selection {
  /**
  Create a node selection. Does not verify the validity of its
  argument.
  */
  constructor($pos) {
    let node = $pos.nodeAfter;
    let $end = $pos.node(0).resolve($pos.pos + node.nodeSize);
    super($pos, $end);
    this.node = node;
  }
  map(doc, mapping) {
    let { deleted, pos } = mapping.mapResult(this.anchor);
    let $pos = doc.resolve(pos);
    if (deleted)
      return Selection.near($pos);
    return new _NodeSelection($pos);
  }
  content() {
    return new Slice(Fragment.from(this.node), 0, 0);
  }
  eq(other) {
    return other instanceof _NodeSelection && other.anchor == this.anchor;
  }
  toJSON() {
    return { type: "node", anchor: this.anchor };
  }
  getBookmark() {
    return new NodeBookmark(this.anchor);
  }
  /**
  @internal
  */
  static fromJSON(doc, json) {
    if (typeof json.anchor != "number")
      throw new RangeError("Invalid input for NodeSelection.fromJSON");
    return new _NodeSelection(doc.resolve(json.anchor));
  }
  /**
  Create a node selection from non-resolved positions.
  */
  static create(doc, from) {
    return new _NodeSelection(doc.resolve(from));
  }
  /**
  Determines whether the given node may be selected as a node
  selection.
  */
  static isSelectable(node) {
    return !node.isText && node.type.spec.selectable !== false;
  }
};
NodeSelection.prototype.visible = false;
Selection.jsonID("node", NodeSelection);
var NodeBookmark = class _NodeBookmark {
  constructor(anchor) {
    this.anchor = anchor;
  }
  map(mapping) {
    let { deleted, pos } = mapping.mapResult(this.anchor);
    return deleted ? new TextBookmark(pos, pos) : new _NodeBookmark(pos);
  }
  resolve(doc) {
    let $pos = doc.resolve(this.anchor), node = $pos.nodeAfter;
    if (node && NodeSelection.isSelectable(node))
      return new NodeSelection($pos);
    return Selection.near($pos);
  }
};
var AllSelection = class _AllSelection extends Selection {
  /**
  Create an all-selection over the given document.
  */
  constructor(doc) {
    super(doc.resolve(0), doc.resolve(doc.content.size));
  }
  replace(tr, content = Slice.empty) {
    if (content == Slice.empty) {
      tr.delete(0, tr.doc.content.size);
      let sel = Selection.atStart(tr.doc);
      if (!sel.eq(tr.selection))
        tr.setSelection(sel);
    } else {
      super.replace(tr, content);
    }
  }
  toJSON() {
    return { type: "all" };
  }
  /**
  @internal
  */
  static fromJSON(doc) {
    return new _AllSelection(doc);
  }
  map(doc) {
    return new _AllSelection(doc);
  }
  eq(other) {
    return other instanceof _AllSelection;
  }
  getBookmark() {
    return AllBookmark;
  }
};
Selection.jsonID("all", AllSelection);
var AllBookmark = {
  map() {
    return this;
  },
  resolve(doc) {
    return new AllSelection(doc);
  }
};
function findSelectionIn(doc, node, pos, index, dir, text = false) {
  if (node.inlineContent)
    return TextSelection.create(doc, pos);
  for (let i = index - (dir > 0 ? 0 : 1); dir > 0 ? i < node.childCount : i >= 0; i += dir) {
    let child = node.child(i);
    if (!child.isAtom) {
      let inner = findSelectionIn(doc, child, pos + dir, dir < 0 ? child.childCount : 0, dir, text);
      if (inner)
        return inner;
    } else if (!text && NodeSelection.isSelectable(child)) {
      return NodeSelection.create(doc, pos - (dir < 0 ? child.nodeSize : 0));
    }
    pos += child.nodeSize * dir;
  }
  return null;
}
function selectionToInsertionEnd(tr, startLen, bias) {
  let last = tr.steps.length - 1;
  if (last < startLen)
    return;
  let step = tr.steps[last];
  if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep))
    return;
  let map = tr.mapping.maps[last], end2;
  map.forEach((_from, _to, _newFrom, newTo) => {
    if (end2 == null)
      end2 = newTo;
  });
  tr.setSelection(Selection.near(tr.doc.resolve(end2), bias));
}
function bind(f, self2) {
  return !self2 || !f ? f : f.bind(self2);
}
var FieldDesc = class {
  constructor(name, desc, self2) {
    this.name = name;
    this.init = bind(desc.init, self2);
    this.apply = bind(desc.apply, self2);
  }
};
var baseFields = [
  new FieldDesc("doc", {
    init(config) {
      return config.doc || config.schema.topNodeType.createAndFill();
    },
    apply(tr) {
      return tr.doc;
    }
  }),
  new FieldDesc("selection", {
    init(config, instance) {
      return config.selection || Selection.atStart(instance.doc);
    },
    apply(tr) {
      return tr.selection;
    }
  }),
  new FieldDesc("storedMarks", {
    init(config) {
      return config.storedMarks || null;
    },
    apply(tr, _marks, _old, state) {
      return state.selection.$cursor ? tr.storedMarks : null;
    }
  }),
  new FieldDesc("scrollToSelection", {
    init() {
      return 0;
    },
    apply(tr, prev) {
      return tr.scrolledIntoView ? prev + 1 : prev;
    }
  })
];
function bindProps(obj, self2, target) {
  for (let prop in obj) {
    let val = obj[prop];
    if (val instanceof Function)
      val = val.bind(self2);
    else if (prop == "handleDOMEvents")
      val = bindProps(val, self2, {});
    target[prop] = val;
  }
  return target;
}
var Plugin = class {
  /**
  Create a plugin.
  */
  constructor(spec) {
    this.spec = spec;
    this.props = {};
    if (spec.props)
      bindProps(spec.props, this, this.props);
    this.key = spec.key ? spec.key.key : createKey("plugin");
  }
  /**
  Extract the plugin's state field from an editor state.
  */
  getState(state) {
    return state[this.key];
  }
};
var keys = /* @__PURE__ */ Object.create(null);
function createKey(name) {
  if (name in keys)
    return name + "$" + ++keys[name];
  keys[name] = 0;
  return name + "$";
}
var PluginKey = class {
  /**
  Create a plugin key.
  */
  constructor(name = "key") {
    this.key = createKey(name);
  }
  /**
  Get the active plugin with this key, if any, from an editor
  state.
  */
  get(state) {
    return state.config.pluginsByKey[this.key];
  }
  /**
  Get the plugin's state from an editor state.
  */
  getState(state) {
    return state[this.key];
  }
};

// ../../../node_modules/prosemirror-commands/dist/index.js
var deleteSelection = (state, dispatch) => {
  if (state.selection.empty)
    return false;
  if (dispatch)
    dispatch(state.tr.deleteSelection().scrollIntoView());
  return true;
};
function atBlockStart(state, view) {
  let { $cursor } = state.selection;
  if (!$cursor || (view ? !view.endOfTextblock("backward", state) : $cursor.parentOffset > 0))
    return null;
  return $cursor;
}
var joinBackward = (state, dispatch, view) => {
  let $cursor = atBlockStart(state, view);
  if (!$cursor)
    return false;
  let $cut = findCutBefore($cursor);
  if (!$cut) {
    let range = $cursor.blockRange(), target = range && liftTarget(range);
    if (target == null)
      return false;
    if (dispatch)
      dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
  }
  let before = $cut.nodeBefore;
  if (!before.type.spec.isolating && deleteBarrier(state, $cut, dispatch))
    return true;
  if ($cursor.parent.content.size == 0 && (textblockAt(before, "end") || NodeSelection.isSelectable(before))) {
    let delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
    if (delStep && delStep.slice.size < delStep.to - delStep.from) {
      if (dispatch) {
        let tr = state.tr.step(delStep);
        tr.setSelection(textblockAt(before, "end") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos, -1)), -1) : NodeSelection.create(tr.doc, $cut.pos - before.nodeSize));
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
  }
  if (before.isAtom && $cut.depth == $cursor.depth - 1) {
    if (dispatch)
      dispatch(state.tr.delete($cut.pos - before.nodeSize, $cut.pos).scrollIntoView());
    return true;
  }
  return false;
};
function textblockAt(node, side, only = false) {
  for (let scan = node; scan; scan = side == "start" ? scan.firstChild : scan.lastChild) {
    if (scan.isTextblock)
      return true;
    if (only && scan.childCount != 1)
      return false;
  }
  return false;
}
var selectNodeBackward = (state, dispatch, view) => {
  let { $head, empty } = state.selection, $cut = $head;
  if (!empty)
    return false;
  if ($head.parent.isTextblock) {
    if (view ? !view.endOfTextblock("backward", state) : $head.parentOffset > 0)
      return false;
    $cut = findCutBefore($head);
  }
  let node = $cut && $cut.nodeBefore;
  if (!node || !NodeSelection.isSelectable(node))
    return false;
  if (dispatch)
    dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos - node.nodeSize)).scrollIntoView());
  return true;
};
function findCutBefore($pos) {
  if (!$pos.parent.type.spec.isolating)
    for (let i = $pos.depth - 1; i >= 0; i--) {
      if ($pos.index(i) > 0)
        return $pos.doc.resolve($pos.before(i + 1));
      if ($pos.node(i).type.spec.isolating)
        break;
    }
  return null;
}
function atBlockEnd(state, view) {
  let { $cursor } = state.selection;
  if (!$cursor || (view ? !view.endOfTextblock("forward", state) : $cursor.parentOffset < $cursor.parent.content.size))
    return null;
  return $cursor;
}
var joinForward = (state, dispatch, view) => {
  let $cursor = atBlockEnd(state, view);
  if (!$cursor)
    return false;
  let $cut = findCutAfter($cursor);
  if (!$cut)
    return false;
  let after = $cut.nodeAfter;
  if (deleteBarrier(state, $cut, dispatch))
    return true;
  if ($cursor.parent.content.size == 0 && (textblockAt(after, "start") || NodeSelection.isSelectable(after))) {
    let delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty);
    if (delStep && delStep.slice.size < delStep.to - delStep.from) {
      if (dispatch) {
        let tr = state.tr.step(delStep);
        tr.setSelection(textblockAt(after, "start") ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos)), 1) : NodeSelection.create(tr.doc, tr.mapping.map($cut.pos)));
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
  }
  if (after.isAtom && $cut.depth == $cursor.depth - 1) {
    if (dispatch)
      dispatch(state.tr.delete($cut.pos, $cut.pos + after.nodeSize).scrollIntoView());
    return true;
  }
  return false;
};
var selectNodeForward = (state, dispatch, view) => {
  let { $head, empty } = state.selection, $cut = $head;
  if (!empty)
    return false;
  if ($head.parent.isTextblock) {
    if (view ? !view.endOfTextblock("forward", state) : $head.parentOffset < $head.parent.content.size)
      return false;
    $cut = findCutAfter($head);
  }
  let node = $cut && $cut.nodeAfter;
  if (!node || !NodeSelection.isSelectable(node))
    return false;
  if (dispatch)
    dispatch(state.tr.setSelection(NodeSelection.create(state.doc, $cut.pos)).scrollIntoView());
  return true;
};
function findCutAfter($pos) {
  if (!$pos.parent.type.spec.isolating)
    for (let i = $pos.depth - 1; i >= 0; i--) {
      let parent = $pos.node(i);
      if ($pos.index(i) + 1 < parent.childCount)
        return $pos.doc.resolve($pos.after(i + 1));
      if (parent.type.spec.isolating)
        break;
    }
  return null;
}
var joinUp = (state, dispatch) => {
  let sel = state.selection, nodeSel = sel instanceof NodeSelection, point;
  if (nodeSel) {
    if (sel.node.isTextblock || !canJoin(state.doc, sel.from))
      return false;
    point = sel.from;
  } else {
    point = joinPoint(state.doc, sel.from, -1);
    if (point == null)
      return false;
  }
  if (dispatch) {
    let tr = state.tr.join(point);
    if (nodeSel)
      tr.setSelection(NodeSelection.create(tr.doc, point - state.doc.resolve(point).nodeBefore.nodeSize));
    dispatch(tr.scrollIntoView());
  }
  return true;
};
var joinDown = (state, dispatch) => {
  let sel = state.selection, point;
  if (sel instanceof NodeSelection) {
    if (sel.node.isTextblock || !canJoin(state.doc, sel.to))
      return false;
    point = sel.to;
  } else {
    point = joinPoint(state.doc, sel.to, 1);
    if (point == null)
      return false;
  }
  if (dispatch)
    dispatch(state.tr.join(point).scrollIntoView());
  return true;
};
var lift = (state, dispatch) => {
  let { $from, $to } = state.selection;
  let range = $from.blockRange($to), target = range && liftTarget(range);
  if (target == null)
    return false;
  if (dispatch)
    dispatch(state.tr.lift(range, target).scrollIntoView());
  return true;
};
var newlineInCode = (state, dispatch) => {
  let { $head, $anchor } = state.selection;
  if (!$head.parent.type.spec.code || !$head.sameParent($anchor))
    return false;
  if (dispatch)
    dispatch(state.tr.insertText("\n").scrollIntoView());
  return true;
};
function defaultBlockAt(match) {
  for (let i = 0; i < match.edgeCount; i++) {
    let { type } = match.edge(i);
    if (type.isTextblock && !type.hasRequiredAttrs())
      return type;
  }
  return null;
}
var exitCode = (state, dispatch) => {
  let { $head, $anchor } = state.selection;
  if (!$head.parent.type.spec.code || !$head.sameParent($anchor))
    return false;
  let above = $head.node(-1), after = $head.indexAfter(-1), type = defaultBlockAt(above.contentMatchAt(after));
  if (!type || !above.canReplaceWith(after, after, type))
    return false;
  if (dispatch) {
    let pos = $head.after(), tr = state.tr.replaceWith(pos, pos, type.createAndFill());
    tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
    dispatch(tr.scrollIntoView());
  }
  return true;
};
var createParagraphNear = (state, dispatch) => {
  let sel = state.selection, { $from, $to } = sel;
  if (sel instanceof AllSelection || $from.parent.inlineContent || $to.parent.inlineContent)
    return false;
  let type = defaultBlockAt($to.parent.contentMatchAt($to.indexAfter()));
  if (!type || !type.isTextblock)
    return false;
  if (dispatch) {
    let side = (!$from.parentOffset && $to.index() < $to.parent.childCount ? $from : $to).pos;
    let tr = state.tr.insert(side, type.createAndFill());
    tr.setSelection(TextSelection.create(tr.doc, side + 1));
    dispatch(tr.scrollIntoView());
  }
  return true;
};
var liftEmptyBlock = (state, dispatch) => {
  let { $cursor } = state.selection;
  if (!$cursor || $cursor.parent.content.size)
    return false;
  if ($cursor.depth > 1 && $cursor.after() != $cursor.end(-1)) {
    let before = $cursor.before();
    if (canSplit(state.doc, before)) {
      if (dispatch)
        dispatch(state.tr.split(before).scrollIntoView());
      return true;
    }
  }
  let range = $cursor.blockRange(), target = range && liftTarget(range);
  if (target == null)
    return false;
  if (dispatch)
    dispatch(state.tr.lift(range, target).scrollIntoView());
  return true;
};
function splitBlockAs(splitNode) {
  return (state, dispatch) => {
    let { $from, $to } = state.selection;
    if (state.selection instanceof NodeSelection && state.selection.node.isBlock) {
      if (!$from.parentOffset || !canSplit(state.doc, $from.pos))
        return false;
      if (dispatch)
        dispatch(state.tr.split($from.pos).scrollIntoView());
      return true;
    }
    if (!$from.parent.isBlock)
      return false;
    if (dispatch) {
      let atEnd = $to.parentOffset == $to.parent.content.size;
      let tr = state.tr;
      if (state.selection instanceof TextSelection || state.selection instanceof AllSelection)
        tr.deleteSelection();
      let deflt = $from.depth == 0 ? null : defaultBlockAt($from.node(-1).contentMatchAt($from.indexAfter(-1)));
      let splitType = splitNode && splitNode($to.parent, atEnd);
      let types = splitType ? [splitType] : atEnd && deflt ? [{ type: deflt }] : void 0;
      let can = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);
      if (!types && !can && canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt ? [{ type: deflt }] : void 0)) {
        if (deflt)
          types = [{ type: deflt }];
        can = true;
      }
      if (can) {
        tr.split(tr.mapping.map($from.pos), 1, types);
        if (!atEnd && !$from.parentOffset && $from.parent.type != deflt) {
          let first2 = tr.mapping.map($from.before()), $first = tr.doc.resolve(first2);
          if (deflt && $from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt))
            tr.setNodeMarkup(tr.mapping.map($from.before()), deflt);
        }
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}
var splitBlock = splitBlockAs();
var selectParentNode = (state, dispatch) => {
  let { $from, to } = state.selection, pos;
  let same = $from.sharedDepth(to);
  if (same == 0)
    return false;
  pos = $from.before(same);
  if (dispatch)
    dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)));
  return true;
};
var selectAll = (state, dispatch) => {
  if (dispatch)
    dispatch(state.tr.setSelection(new AllSelection(state.doc)));
  return true;
};
function joinMaybeClear(state, $pos, dispatch) {
  let before = $pos.nodeBefore, after = $pos.nodeAfter, index = $pos.index();
  if (!before || !after || !before.type.compatibleContent(after.type))
    return false;
  if (!before.content.size && $pos.parent.canReplace(index - 1, index)) {
    if (dispatch)
      dispatch(state.tr.delete($pos.pos - before.nodeSize, $pos.pos).scrollIntoView());
    return true;
  }
  if (!$pos.parent.canReplace(index, index + 1) || !(after.isTextblock || canJoin(state.doc, $pos.pos)))
    return false;
  if (dispatch)
    dispatch(state.tr.clearIncompatible($pos.pos, before.type, before.contentMatchAt(before.childCount)).join($pos.pos).scrollIntoView());
  return true;
}
function deleteBarrier(state, $cut, dispatch) {
  let before = $cut.nodeBefore, after = $cut.nodeAfter, conn, match;
  if (before.type.spec.isolating || after.type.spec.isolating)
    return false;
  if (joinMaybeClear(state, $cut, dispatch))
    return true;
  let canDelAfter = $cut.parent.canReplace($cut.index(), $cut.index() + 1);
  if (canDelAfter && (conn = (match = before.contentMatchAt(before.childCount)).findWrapping(after.type)) && match.matchType(conn[0] || after.type).validEnd) {
    if (dispatch) {
      let end2 = $cut.pos + after.nodeSize, wrap = Fragment.empty;
      for (let i = conn.length - 1; i >= 0; i--)
        wrap = Fragment.from(conn[i].create(null, wrap));
      wrap = Fragment.from(before.copy(wrap));
      let tr = state.tr.step(new ReplaceAroundStep($cut.pos - 1, end2, $cut.pos, end2, new Slice(wrap, 1, 0), conn.length, true));
      let joinAt = end2 + 2 * conn.length;
      if (canJoin(tr.doc, joinAt))
        tr.join(joinAt);
      dispatch(tr.scrollIntoView());
    }
    return true;
  }
  let selAfter = Selection.findFrom($cut, 1);
  let range = selAfter && selAfter.$from.blockRange(selAfter.$to), target = range && liftTarget(range);
  if (target != null && target >= $cut.depth) {
    if (dispatch)
      dispatch(state.tr.lift(range, target).scrollIntoView());
    return true;
  }
  if (canDelAfter && textblockAt(after, "start", true) && textblockAt(before, "end")) {
    let at = before, wrap = [];
    for (; ; ) {
      wrap.push(at);
      if (at.isTextblock)
        break;
      at = at.lastChild;
    }
    let afterText = after, afterDepth = 1;
    for (; !afterText.isTextblock; afterText = afterText.firstChild)
      afterDepth++;
    if (at.canReplace(at.childCount, at.childCount, afterText.content)) {
      if (dispatch) {
        let end2 = Fragment.empty;
        for (let i = wrap.length - 1; i >= 0; i--)
          end2 = Fragment.from(wrap[i].copy(end2));
        let tr = state.tr.step(new ReplaceAroundStep($cut.pos - wrap.length, $cut.pos + after.nodeSize, $cut.pos + afterDepth, $cut.pos + after.nodeSize - afterDepth, new Slice(end2, wrap.length, 0), 0, true));
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
  }
  return false;
}
function selectTextblockSide(side) {
  return function(state, dispatch) {
    let sel = state.selection, $pos = side < 0 ? sel.$from : sel.$to;
    let depth = $pos.depth;
    while ($pos.node(depth).isInline) {
      if (!depth)
        return false;
      depth--;
    }
    if (!$pos.node(depth).isTextblock)
      return false;
    if (dispatch)
      dispatch(state.tr.setSelection(TextSelection.create(state.doc, side < 0 ? $pos.start(depth) : $pos.end(depth))));
    return true;
  };
}
var selectTextblockStart = selectTextblockSide(-1);
var selectTextblockEnd = selectTextblockSide(1);
function wrapIn(nodeType, attrs = null) {
  return function(state, dispatch) {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to), wrapping = range && findWrapping(range, nodeType, attrs);
    if (!wrapping)
      return false;
    if (dispatch)
      dispatch(state.tr.wrap(range, wrapping).scrollIntoView());
    return true;
  };
}
function setBlockType(nodeType, attrs = null) {
  return function(state, dispatch) {
    let applicable = false;
    for (let i = 0; i < state.selection.ranges.length && !applicable; i++) {
      let { $from: { pos: from }, $to: { pos: to } } = state.selection.ranges[i];
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (applicable)
          return false;
        if (!node.isTextblock || node.hasMarkup(nodeType, attrs))
          return;
        if (node.type == nodeType) {
          applicable = true;
        } else {
          let $pos = state.doc.resolve(pos), index = $pos.index();
          applicable = $pos.parent.canReplaceWith(index, index + 1, nodeType);
        }
      });
    }
    if (!applicable)
      return false;
    if (dispatch) {
      let tr = state.tr;
      for (let i = 0; i < state.selection.ranges.length; i++) {
        let { $from: { pos: from }, $to: { pos: to } } = state.selection.ranges[i];
        tr.setBlockType(from, to, nodeType, attrs);
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}
function chainCommands(...commands2) {
  return function(state, dispatch, view) {
    for (let i = 0; i < commands2.length; i++)
      if (commands2[i](state, dispatch, view))
        return true;
    return false;
  };
}
var backspace = chainCommands(deleteSelection, joinBackward, selectNodeBackward);
var del = chainCommands(deleteSelection, joinForward, selectNodeForward);
var pcBaseKeymap = {
  "Enter": chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock),
  "Mod-Enter": exitCode,
  "Backspace": backspace,
  "Mod-Backspace": backspace,
  "Shift-Backspace": backspace,
  "Delete": del,
  "Mod-Delete": del,
  "Mod-a": selectAll
};
var macBaseKeymap = {
  "Ctrl-h": pcBaseKeymap["Backspace"],
  "Alt-Backspace": pcBaseKeymap["Mod-Backspace"],
  "Ctrl-d": pcBaseKeymap["Delete"],
  "Ctrl-Alt-Backspace": pcBaseKeymap["Mod-Delete"],
  "Alt-Delete": pcBaseKeymap["Mod-Delete"],
  "Alt-d": pcBaseKeymap["Mod-Delete"],
  "Ctrl-a": selectTextblockStart,
  "Ctrl-e": selectTextblockEnd
};
for (let key in pcBaseKeymap)
  macBaseKeymap[key] = pcBaseKeymap[key];
var mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : typeof os != "undefined" && os.platform ? os.platform() == "darwin" : false;

// ../../../node_modules/prosemirror-schema-list/dist/index.js
function wrapInList(listType, attrs = null) {
  return function(state, dispatch) {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to), doJoin = false, outerRange = range;
    if (!range)
      return false;
    if (range.depth >= 2 && $from.node(range.depth - 1).type.compatibleContent(listType) && range.startIndex == 0) {
      if ($from.index(range.depth - 1) == 0)
        return false;
      let $insert = state.doc.resolve(range.start - 2);
      outerRange = new NodeRange($insert, $insert, range.depth);
      if (range.endIndex < range.parent.childCount)
        range = new NodeRange($from, state.doc.resolve($to.end(range.depth)), range.depth);
      doJoin = true;
    }
    let wrap = findWrapping(outerRange, listType, attrs, range);
    if (!wrap)
      return false;
    if (dispatch)
      dispatch(doWrapInList(state.tr, range, wrap, doJoin, listType).scrollIntoView());
    return true;
  };
}
function doWrapInList(tr, range, wrappers, joinBefore, listType) {
  let content = Fragment.empty;
  for (let i = wrappers.length - 1; i >= 0; i--)
    content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content));
  tr.step(new ReplaceAroundStep(range.start - (joinBefore ? 2 : 0), range.end, range.start, range.end, new Slice(content, 0, 0), wrappers.length, true));
  let found2 = 0;
  for (let i = 0; i < wrappers.length; i++)
    if (wrappers[i].type == listType)
      found2 = i + 1;
  let splitDepth = wrappers.length - found2;
  let splitPos = range.start + wrappers.length - (joinBefore ? 2 : 0), parent = range.parent;
  for (let i = range.startIndex, e = range.endIndex, first2 = true; i < e; i++, first2 = false) {
    if (!first2 && canSplit(tr.doc, splitPos, splitDepth)) {
      tr.split(splitPos, splitDepth);
      splitPos += 2 * splitDepth;
    }
    splitPos += parent.child(i).nodeSize;
  }
  return tr;
}
function liftListItem(itemType) {
  return function(state, dispatch) {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild.type == itemType);
    if (!range)
      return false;
    if (!dispatch)
      return true;
    if ($from.node(range.depth - 1).type == itemType)
      return liftToOuterList(state, dispatch, itemType, range);
    else
      return liftOutOfList(state, dispatch, range);
  };
}
function liftToOuterList(state, dispatch, itemType, range) {
  let tr = state.tr, end2 = range.end, endOfList = range.$to.end(range.depth);
  if (end2 < endOfList) {
    tr.step(new ReplaceAroundStep(end2 - 1, endOfList, end2, endOfList, new Slice(Fragment.from(itemType.create(null, range.parent.copy())), 1, 0), 1, true));
    range = new NodeRange(tr.doc.resolve(range.$from.pos), tr.doc.resolve(endOfList), range.depth);
  }
  const target = liftTarget(range);
  if (target == null)
    return false;
  tr.lift(range, target);
  let after = tr.mapping.map(end2, -1) - 1;
  if (canJoin(tr.doc, after))
    tr.join(after);
  dispatch(tr.scrollIntoView());
  return true;
}
function liftOutOfList(state, dispatch, range) {
  let tr = state.tr, list = range.parent;
  for (let pos = range.end, i = range.endIndex - 1, e = range.startIndex; i > e; i--) {
    pos -= list.child(i).nodeSize;
    tr.delete(pos - 1, pos + 1);
  }
  let $start = tr.doc.resolve(range.start), item = $start.nodeAfter;
  if (tr.mapping.map(range.end) != range.start + $start.nodeAfter.nodeSize)
    return false;
  let atStart = range.startIndex == 0, atEnd = range.endIndex == list.childCount;
  let parent = $start.node(-1), indexBefore = $start.index(-1);
  if (!parent.canReplace(indexBefore + (atStart ? 0 : 1), indexBefore + 1, item.content.append(atEnd ? Fragment.empty : Fragment.from(list))))
    return false;
  let start2 = $start.pos, end2 = start2 + item.nodeSize;
  tr.step(new ReplaceAroundStep(start2 - (atStart ? 1 : 0), end2 + (atEnd ? 1 : 0), start2 + 1, end2 - 1, new Slice((atStart ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))).append(atEnd ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))), atStart ? 0 : 1, atEnd ? 0 : 1), atStart ? 0 : 1));
  dispatch(tr.scrollIntoView());
  return true;
}
function sinkListItem(itemType) {
  return function(state, dispatch) {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to, (node) => node.childCount > 0 && node.firstChild.type == itemType);
    if (!range)
      return false;
    let startIndex = range.startIndex;
    if (startIndex == 0)
      return false;
    let parent = range.parent, nodeBefore = parent.child(startIndex - 1);
    if (nodeBefore.type != itemType)
      return false;
    if (dispatch) {
      let nestedBefore = nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
      let inner = Fragment.from(nestedBefore ? itemType.create() : null);
      let slice = new Slice(Fragment.from(itemType.create(null, Fragment.from(parent.type.create(null, inner)))), nestedBefore ? 3 : 1, 0);
      let before = range.start, after = range.end;
      dispatch(state.tr.step(new ReplaceAroundStep(before - (nestedBefore ? 3 : 1), after, before, after, slice, 1, true)).scrollIntoView());
    }
    return true;
  };
}

// ../../../node_modules/@tiptap/core/dist/index.js
function createChainableState(config) {
  const { state, transaction } = config;
  let { selection } = transaction;
  let { doc } = transaction;
  let { storedMarks } = transaction;
  return __spreadProps(__spreadValues({}, state), {
    apply: state.apply.bind(state),
    applyTransaction: state.applyTransaction.bind(state),
    filterTransaction: state.filterTransaction,
    plugins: state.plugins,
    schema: state.schema,
    reconfigure: state.reconfigure.bind(state),
    toJSON: state.toJSON.bind(state),
    get storedMarks() {
      return storedMarks;
    },
    get selection() {
      return selection;
    },
    get doc() {
      return doc;
    },
    get tr() {
      selection = transaction.selection;
      doc = transaction.doc;
      storedMarks = transaction.storedMarks;
      return transaction;
    }
  });
}
var CommandManager = class {
  constructor(props) {
    this.editor = props.editor;
    this.rawCommands = this.editor.extensionManager.commands;
    this.customState = props.state;
  }
  get hasCustomState() {
    return !!this.customState;
  }
  get state() {
    return this.customState || this.editor.state;
  }
  get commands() {
    const { rawCommands, editor, state } = this;
    const { view } = editor;
    const { tr } = state;
    const props = this.buildProps(tr);
    return Object.fromEntries(Object.entries(rawCommands).map(([name, command2]) => {
      const method = (...args) => {
        const callback = command2(...args)(props);
        if (!tr.getMeta("preventDispatch") && !this.hasCustomState) {
          view.dispatch(tr);
        }
        return callback;
      };
      return [name, method];
    }));
  }
  get chain() {
    return () => this.createChain();
  }
  get can() {
    return () => this.createCan();
  }
  createChain(startTr, shouldDispatch = true) {
    const { rawCommands, editor, state } = this;
    const { view } = editor;
    const callbacks2 = [];
    const hasStartTransaction = !!startTr;
    const tr = startTr || state.tr;
    const run = () => {
      if (!hasStartTransaction && shouldDispatch && !tr.getMeta("preventDispatch") && !this.hasCustomState) {
        view.dispatch(tr);
      }
      return callbacks2.every((callback) => callback === true);
    };
    const chain = __spreadProps(__spreadValues({}, Object.fromEntries(Object.entries(rawCommands).map(([name, command2]) => {
      const chainedCommand = (...args) => {
        const props = this.buildProps(tr, shouldDispatch);
        const callback = command2(...args)(props);
        callbacks2.push(callback);
        return chain;
      };
      return [name, chainedCommand];
    }))), {
      run
    });
    return chain;
  }
  createCan(startTr) {
    const { rawCommands, state } = this;
    const dispatch = false;
    const tr = startTr || state.tr;
    const props = this.buildProps(tr, dispatch);
    const formattedCommands = Object.fromEntries(Object.entries(rawCommands).map(([name, command2]) => {
      return [name, (...args) => command2(...args)(__spreadProps(__spreadValues({}, props), { dispatch: void 0 }))];
    }));
    return __spreadProps(__spreadValues({}, formattedCommands), {
      chain: () => this.createChain(tr, dispatch)
    });
  }
  buildProps(tr, shouldDispatch = true) {
    const { rawCommands, editor, state } = this;
    const { view } = editor;
    const props = {
      tr,
      editor,
      view,
      state: createChainableState({
        state,
        transaction: tr
      }),
      dispatch: shouldDispatch ? () => void 0 : void 0,
      chain: () => this.createChain(tr, shouldDispatch),
      can: () => this.createCan(tr),
      get commands() {
        return Object.fromEntries(Object.entries(rawCommands).map(([name, command2]) => {
          return [name, (...args) => command2(...args)(props)];
        }));
      }
    };
    return props;
  }
};
function getExtensionField(extension, field, context) {
  if (extension.config[field] === void 0 && extension.parent) {
    return getExtensionField(extension.parent, field, context);
  }
  if (typeof extension.config[field] === "function") {
    const value = extension.config[field].bind(__spreadProps(__spreadValues({}, context), {
      parent: extension.parent ? getExtensionField(extension.parent, field, context) : null
    }));
    return value;
  }
  return extension.config[field];
}
function splitExtensions(extensions) {
  const baseExtensions = extensions.filter((extension) => extension.type === "extension");
  const nodeExtensions = extensions.filter((extension) => extension.type === "node");
  const markExtensions = extensions.filter((extension) => extension.type === "mark");
  return {
    baseExtensions,
    nodeExtensions,
    markExtensions
  };
}
function getNodeType(nameOrType, schema) {
  if (typeof nameOrType === "string") {
    if (!schema.nodes[nameOrType]) {
      throw Error(`There is no node type named '${nameOrType}'. Maybe you forgot to add the extension?`);
    }
    return schema.nodes[nameOrType];
  }
  return nameOrType;
}
function isFunction2(value) {
  return typeof value === "function";
}
function callOrReturn(value, context = void 0, ...props) {
  if (isFunction2(value)) {
    if (context) {
      return value.bind(context)(...props);
    }
    return value(...props);
  }
  return value;
}
function isRegExp(value) {
  return Object.prototype.toString.call(value) === "[object RegExp]";
}
function getType(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}
function isPlainObject(value) {
  if (getType(value) !== "Object") {
    return false;
  }
  return value.constructor === Object && Object.getPrototypeOf(value) === Object.prototype;
}
function mergeDeep(target, source) {
  const output = __spreadValues({}, target);
  if (isPlainObject(target) && isPlainObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isPlainObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}
var Extension = class _Extension {
  constructor(config = {}) {
    this.type = "extension";
    this.name = "extension";
    this.parent = null;
    this.child = null;
    this.config = {
      name: this.name,
      defaultOptions: {}
    };
    this.config = __spreadValues(__spreadValues({}, this.config), config);
    this.name = this.config.name;
    if (config.defaultOptions) {
      console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`);
    }
    this.options = this.config.defaultOptions;
    if (this.config.addOptions) {
      this.options = callOrReturn(getExtensionField(this, "addOptions", {
        name: this.name
      }));
    }
    this.storage = callOrReturn(getExtensionField(this, "addStorage", {
      name: this.name,
      options: this.options
    })) || {};
  }
  static create(config = {}) {
    return new _Extension(config);
  }
  configure(options = {}) {
    const extension = this.extend();
    extension.options = mergeDeep(this.options, options);
    extension.storage = callOrReturn(getExtensionField(extension, "addStorage", {
      name: extension.name,
      options: extension.options
    }));
    return extension;
  }
  extend(extendedConfig = {}) {
    const extension = new _Extension(extendedConfig);
    extension.parent = this;
    this.child = extension;
    extension.name = extendedConfig.name ? extendedConfig.name : extension.parent.name;
    if (extendedConfig.defaultOptions) {
      console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${extension.name}".`);
    }
    extension.options = callOrReturn(getExtensionField(extension, "addOptions", {
      name: extension.name
    }));
    extension.storage = callOrReturn(getExtensionField(extension, "addStorage", {
      name: extension.name,
      options: extension.options
    }));
    return extension;
  }
};
function getTextBetween(startNode, range, options) {
  const { from, to } = range;
  const { blockSeparator = "\n\n", textSerializers = {} } = options || {};
  let text = "";
  let separated = true;
  startNode.nodesBetween(from, to, (node, pos, parent, index) => {
    var _a2;
    const textSerializer = textSerializers === null || textSerializers === void 0 ? void 0 : textSerializers[node.type.name];
    if (textSerializer) {
      if (node.isBlock && !separated) {
        text += blockSeparator;
        separated = true;
      }
      if (parent) {
        text += textSerializer({
          node,
          pos,
          parent,
          index,
          range
        });
      }
    } else if (node.isText) {
      text += (_a2 = node === null || node === void 0 ? void 0 : node.text) === null || _a2 === void 0 ? void 0 : _a2.slice(Math.max(from, pos) - pos, to - pos);
      separated = false;
    } else if (node.isBlock && !separated) {
      text += blockSeparator;
      separated = true;
    }
  });
  return text;
}
function getTextSerializersFromSchema(schema) {
  return Object.fromEntries(Object.entries(schema.nodes).filter(([, node]) => node.spec.toText).map(([name, node]) => [name, node.spec.toText]));
}
var ClipboardTextSerializer = Extension.create({
  name: "clipboardTextSerializer",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("clipboardTextSerializer"),
        props: {
          clipboardTextSerializer: () => {
            const { editor } = this;
            const { state, schema } = editor;
            const { doc, selection } = state;
            const { ranges } = selection;
            const from = Math.min(...ranges.map((range2) => range2.$from.pos));
            const to = Math.max(...ranges.map((range2) => range2.$to.pos));
            const textSerializers = getTextSerializersFromSchema(schema);
            const range = { from, to };
            return getTextBetween(doc, range, {
              textSerializers
            });
          }
        }
      })
    ];
  }
});
var blur = () => ({ editor, view }) => {
  requestAnimationFrame(() => {
    var _a2;
    if (!editor.isDestroyed) {
      view.dom.blur();
      (_a2 = window === null || window === void 0 ? void 0 : window.getSelection()) === null || _a2 === void 0 ? void 0 : _a2.removeAllRanges();
    }
  });
  return true;
};
var clearContent = (emitUpdate = false) => ({ commands: commands2 }) => {
  return commands2.setContent("", emitUpdate);
};
var clearNodes = () => ({ state, tr, dispatch }) => {
  const { selection } = tr;
  const { ranges } = selection;
  if (!dispatch) {
    return true;
  }
  ranges.forEach(({ $from, $to }) => {
    state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
      if (node.type.isText) {
        return;
      }
      const { doc, mapping } = tr;
      const $mappedFrom = doc.resolve(mapping.map(pos));
      const $mappedTo = doc.resolve(mapping.map(pos + node.nodeSize));
      const nodeRange = $mappedFrom.blockRange($mappedTo);
      if (!nodeRange) {
        return;
      }
      const targetLiftDepth = liftTarget(nodeRange);
      if (node.type.isTextblock) {
        const { defaultType } = $mappedFrom.parent.contentMatchAt($mappedFrom.index());
        tr.setNodeMarkup(nodeRange.start, defaultType);
      }
      if (targetLiftDepth || targetLiftDepth === 0) {
        tr.lift(nodeRange, targetLiftDepth);
      }
    });
  });
  return true;
};
var command = (fn2) => (props) => {
  return fn2(props);
};
var createParagraphNear2 = () => ({ state, dispatch }) => {
  return createParagraphNear(state, dispatch);
};
var cut = (originRange, targetPos) => ({ editor, tr }) => {
  const { state } = editor;
  const contentSlice = state.doc.slice(originRange.from, originRange.to);
  tr.deleteRange(originRange.from, originRange.to);
  const newPos = tr.mapping.map(targetPos);
  tr.insert(newPos, contentSlice.content);
  tr.setSelection(new TextSelection(tr.doc.resolve(newPos - 1)));
  return true;
};
var deleteCurrentNode = () => ({ tr, dispatch }) => {
  const { selection } = tr;
  const currentNode = selection.$anchor.node();
  if (currentNode.content.size > 0) {
    return false;
  }
  const $pos = tr.selection.$anchor;
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.type === currentNode.type) {
      if (dispatch) {
        const from = $pos.before(depth);
        const to = $pos.after(depth);
        tr.delete(from, to).scrollIntoView();
      }
      return true;
    }
  }
  return false;
};
var deleteNode = (typeOrName) => ({ tr, state, dispatch }) => {
  const type = getNodeType(typeOrName, state.schema);
  const $pos = tr.selection.$anchor;
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.type === type) {
      if (dispatch) {
        const from = $pos.before(depth);
        const to = $pos.after(depth);
        tr.delete(from, to).scrollIntoView();
      }
      return true;
    }
  }
  return false;
};
var deleteRange = (range) => ({ tr, dispatch }) => {
  const { from, to } = range;
  if (dispatch) {
    tr.delete(from, to);
  }
  return true;
};
var deleteSelection2 = () => ({ state, dispatch }) => {
  return deleteSelection(state, dispatch);
};
var enter = () => ({ commands: commands2 }) => {
  return commands2.keyboardShortcut("Enter");
};
var exitCode2 = () => ({ state, dispatch }) => {
  return exitCode(state, dispatch);
};
function objectIncludes(object1, object2, options = { strict: true }) {
  const keys2 = Object.keys(object2);
  if (!keys2.length) {
    return true;
  }
  return keys2.every((key) => {
    if (options.strict) {
      return object2[key] === object1[key];
    }
    if (isRegExp(object2[key])) {
      return object2[key].test(object1[key]);
    }
    return object2[key] === object1[key];
  });
}
function findMarkInSet(marks, type, attributes = {}) {
  return marks.find((item) => {
    return item.type === type && objectIncludes(item.attrs, attributes);
  });
}
function isMarkInSet(marks, type, attributes = {}) {
  return !!findMarkInSet(marks, type, attributes);
}
function getMarkRange($pos, type, attributes = {}) {
  if (!$pos || !type) {
    return;
  }
  let start2 = $pos.parent.childAfter($pos.parentOffset);
  if ($pos.parentOffset === start2.offset && start2.offset !== 0) {
    start2 = $pos.parent.childBefore($pos.parentOffset);
  }
  if (!start2.node) {
    return;
  }
  const mark = findMarkInSet([...start2.node.marks], type, attributes);
  if (!mark) {
    return;
  }
  let startIndex = start2.index;
  let startPos = $pos.start() + start2.offset;
  let endIndex = startIndex + 1;
  let endPos = startPos + start2.node.nodeSize;
  findMarkInSet([...start2.node.marks], type, attributes);
  while (startIndex > 0 && mark.isInSet($pos.parent.child(startIndex - 1).marks)) {
    startIndex -= 1;
    startPos -= $pos.parent.child(startIndex).nodeSize;
  }
  while (endIndex < $pos.parent.childCount && isMarkInSet([...$pos.parent.child(endIndex).marks], type, attributes)) {
    endPos += $pos.parent.child(endIndex).nodeSize;
    endIndex += 1;
  }
  return {
    from: startPos,
    to: endPos
  };
}
function getMarkType(nameOrType, schema) {
  if (typeof nameOrType === "string") {
    if (!schema.marks[nameOrType]) {
      throw Error(`There is no mark type named '${nameOrType}'. Maybe you forgot to add the extension?`);
    }
    return schema.marks[nameOrType];
  }
  return nameOrType;
}
var extendMarkRange = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
  const type = getMarkType(typeOrName, state.schema);
  const { doc, selection } = tr;
  const { $from, from, to } = selection;
  if (dispatch) {
    const range = getMarkRange($from, type, attributes);
    if (range && range.from <= from && range.to >= to) {
      const newSelection = TextSelection.create(doc, range.from, range.to);
      tr.setSelection(newSelection);
    }
  }
  return true;
};
var first = (commands2) => (props) => {
  const items = typeof commands2 === "function" ? commands2(props) : commands2;
  for (let i = 0; i < items.length; i += 1) {
    if (items[i](props)) {
      return true;
    }
  }
  return false;
};
function isTextSelection(value) {
  return value instanceof TextSelection;
}
function minMax(value = 0, min2 = 0, max2 = 0) {
  return Math.min(Math.max(value, min2), max2);
}
function resolveFocusPosition(doc, position = null) {
  if (!position) {
    return null;
  }
  const selectionAtStart = Selection.atStart(doc);
  const selectionAtEnd = Selection.atEnd(doc);
  if (position === "start" || position === true) {
    return selectionAtStart;
  }
  if (position === "end") {
    return selectionAtEnd;
  }
  const minPos = selectionAtStart.from;
  const maxPos = selectionAtEnd.to;
  if (position === "all") {
    return TextSelection.create(doc, minMax(0, minPos, maxPos), minMax(doc.content.size, minPos, maxPos));
  }
  return TextSelection.create(doc, minMax(position, minPos, maxPos), minMax(position, minPos, maxPos));
}
function isiOS() {
  return [
    "iPad Simulator",
    "iPhone Simulator",
    "iPod Simulator",
    "iPad",
    "iPhone",
    "iPod"
  ].includes(navigator.platform) || navigator.userAgent.includes("Mac") && "ontouchend" in document;
}
var focus = (position = null, options = {}) => ({ editor, view, tr, dispatch }) => {
  options = __spreadValues({
    scrollIntoView: true
  }, options);
  const delayedFocus = () => {
    if (isiOS()) {
      view.dom.focus();
    }
    requestAnimationFrame(() => {
      if (!editor.isDestroyed) {
        view.focus();
        if (options === null || options === void 0 ? void 0 : options.scrollIntoView) {
          editor.commands.scrollIntoView();
        }
      }
    });
  };
  if (view.hasFocus() && position === null || position === false) {
    return true;
  }
  if (dispatch && position === null && !isTextSelection(editor.state.selection)) {
    delayedFocus();
    return true;
  }
  const selection = resolveFocusPosition(tr.doc, position) || editor.state.selection;
  const isSameSelection = editor.state.selection.eq(selection);
  if (dispatch) {
    if (!isSameSelection) {
      tr.setSelection(selection);
    }
    if (isSameSelection && tr.storedMarks) {
      tr.setStoredMarks(tr.storedMarks);
    }
    delayedFocus();
  }
  return true;
};
var forEach = (items, fn2) => (props) => {
  return items.every((item, index) => fn2(item, __spreadProps(__spreadValues({}, props), { index })));
};
var insertContent = (value, options) => ({ tr, commands: commands2 }) => {
  return commands2.insertContentAt({ from: tr.selection.from, to: tr.selection.to }, value, options);
};
function elementFromString(value) {
  const wrappedValue = `<body>${value}</body>`;
  return new window.DOMParser().parseFromString(wrappedValue, "text/html").body;
}
function createNodeFromContent(content, schema, options) {
  options = __spreadValues({
    slice: true,
    parseOptions: {}
  }, options);
  if (typeof content === "object" && content !== null) {
    try {
      if (Array.isArray(content) && content.length > 0) {
        return Fragment.fromArray(content.map((item) => schema.nodeFromJSON(item)));
      }
      return schema.nodeFromJSON(content);
    } catch (error) {
      console.warn("[tiptap warn]: Invalid content.", "Passed value:", content, "Error:", error);
      return createNodeFromContent("", schema, options);
    }
  }
  if (typeof content === "string") {
    const parser = DOMParser.fromSchema(schema);
    return options.slice ? parser.parseSlice(elementFromString(content), options.parseOptions).content : parser.parse(elementFromString(content), options.parseOptions);
  }
  return createNodeFromContent("", schema, options);
}
function selectionToInsertionEnd2(tr, startLen, bias) {
  const last = tr.steps.length - 1;
  if (last < startLen) {
    return;
  }
  const step = tr.steps[last];
  if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep)) {
    return;
  }
  const map = tr.mapping.maps[last];
  let end2 = 0;
  map.forEach((_from, _to, _newFrom, newTo) => {
    if (end2 === 0) {
      end2 = newTo;
    }
  });
  tr.setSelection(Selection.near(tr.doc.resolve(end2), bias));
}
var isFragment = (nodeOrFragment) => {
  return nodeOrFragment.toString().startsWith("<");
};
var insertContentAt = (position, value, options) => ({ tr, dispatch, editor }) => {
  if (dispatch) {
    options = __spreadValues({
      parseOptions: {},
      updateSelection: true
    }, options);
    const content = createNodeFromContent(value, editor.schema, {
      parseOptions: __spreadValues({
        preserveWhitespace: "full"
      }, options.parseOptions)
    });
    if (content.toString() === "<>") {
      return true;
    }
    let { from, to } = typeof position === "number" ? { from: position, to: position } : { from: position.from, to: position.to };
    let isOnlyTextContent = true;
    let isOnlyBlockContent = true;
    const nodes = isFragment(content) ? content : [content];
    nodes.forEach((node) => {
      node.check();
      isOnlyTextContent = isOnlyTextContent ? node.isText && node.marks.length === 0 : false;
      isOnlyBlockContent = isOnlyBlockContent ? node.isBlock : false;
    });
    if (from === to && isOnlyBlockContent) {
      const { parent } = tr.doc.resolve(from);
      const isEmptyTextBlock = parent.isTextblock && !parent.type.spec.code && !parent.childCount;
      if (isEmptyTextBlock) {
        from -= 1;
        to += 1;
      }
    }
    if (isOnlyTextContent) {
      if (Array.isArray(value)) {
        tr.insertText(value.map((v) => v.text || "").join(""), from, to);
      } else if (typeof value === "object" && !!value && !!value.text) {
        tr.insertText(value.text, from, to);
      } else {
        tr.insertText(value, from, to);
      }
    } else {
      tr.replaceWith(from, to, content);
    }
    if (options.updateSelection) {
      selectionToInsertionEnd2(tr, tr.steps.length - 1, -1);
    }
  }
  return true;
};
var joinUp2 = () => ({ state, dispatch }) => {
  return joinUp(state, dispatch);
};
var joinDown2 = () => ({ state, dispatch }) => {
  return joinDown(state, dispatch);
};
var joinBackward2 = () => ({ state, dispatch }) => {
  return joinBackward(state, dispatch);
};
var joinForward2 = () => ({ state, dispatch }) => {
  return joinForward(state, dispatch);
};
var joinItemBackward = () => ({ tr, state, dispatch }) => {
  try {
    const point = joinPoint(state.doc, state.selection.$from.pos, -1);
    if (point === null || point === void 0) {
      return false;
    }
    tr.join(point, 2);
    if (dispatch) {
      dispatch(tr);
    }
    return true;
  } catch (e) {
    return false;
  }
};
var joinItemForward = () => ({ state, dispatch, tr }) => {
  try {
    const point = joinPoint(state.doc, state.selection.$from.pos, 1);
    if (point === null || point === void 0) {
      return false;
    }
    tr.join(point, 2);
    if (dispatch) {
      dispatch(tr);
    }
    return true;
  } catch (e) {
    return false;
  }
};
function isMacOS() {
  return typeof navigator !== "undefined" ? /Mac/.test(navigator.platform) : false;
}
function normalizeKeyName(name) {
  const parts = name.split(/-(?!$)/);
  let result = parts[parts.length - 1];
  if (result === "Space") {
    result = " ";
  }
  let alt;
  let ctrl;
  let shift;
  let meta;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const mod = parts[i];
    if (/^(cmd|meta|m)$/i.test(mod)) {
      meta = true;
    } else if (/^a(lt)?$/i.test(mod)) {
      alt = true;
    } else if (/^(c|ctrl|control)$/i.test(mod)) {
      ctrl = true;
    } else if (/^s(hift)?$/i.test(mod)) {
      shift = true;
    } else if (/^mod$/i.test(mod)) {
      if (isiOS() || isMacOS()) {
        meta = true;
      } else {
        ctrl = true;
      }
    } else {
      throw new Error(`Unrecognized modifier name: ${mod}`);
    }
  }
  if (alt) {
    result = `Alt-${result}`;
  }
  if (ctrl) {
    result = `Ctrl-${result}`;
  }
  if (meta) {
    result = `Meta-${result}`;
  }
  if (shift) {
    result = `Shift-${result}`;
  }
  return result;
}
var keyboardShortcut = (name) => ({ editor, view, tr, dispatch }) => {
  const keys2 = normalizeKeyName(name).split(/-(?!$)/);
  const key = keys2.find((item) => !["Alt", "Ctrl", "Meta", "Shift"].includes(item));
  const event = new KeyboardEvent("keydown", {
    key: key === "Space" ? " " : key,
    altKey: keys2.includes("Alt"),
    ctrlKey: keys2.includes("Ctrl"),
    metaKey: keys2.includes("Meta"),
    shiftKey: keys2.includes("Shift"),
    bubbles: true,
    cancelable: true
  });
  const capturedTransaction = editor.captureTransaction(() => {
    view.someProp("handleKeyDown", (f) => f(view, event));
  });
  capturedTransaction === null || capturedTransaction === void 0 ? void 0 : capturedTransaction.steps.forEach((step) => {
    const newStep = step.map(tr.mapping);
    if (newStep && dispatch) {
      tr.maybeStep(newStep);
    }
  });
  return true;
};
function isNodeActive(state, typeOrName, attributes = {}) {
  const { from, to, empty } = state.selection;
  const type = typeOrName ? getNodeType(typeOrName, state.schema) : null;
  const nodeRanges = [];
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.isText) {
      return;
    }
    const relativeFrom = Math.max(from, pos);
    const relativeTo = Math.min(to, pos + node.nodeSize);
    nodeRanges.push({
      node,
      from: relativeFrom,
      to: relativeTo
    });
  });
  const selectionRange = to - from;
  const matchedNodeRanges = nodeRanges.filter((nodeRange) => {
    if (!type) {
      return true;
    }
    return type.name === nodeRange.node.type.name;
  }).filter((nodeRange) => objectIncludes(nodeRange.node.attrs, attributes, { strict: false }));
  if (empty) {
    return !!matchedNodeRanges.length;
  }
  const range = matchedNodeRanges.reduce((sum, nodeRange) => sum + nodeRange.to - nodeRange.from, 0);
  return range >= selectionRange;
}
var lift2 = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
  const type = getNodeType(typeOrName, state.schema);
  const isActive = isNodeActive(state, type, attributes);
  if (!isActive) {
    return false;
  }
  return lift(state, dispatch);
};
var liftEmptyBlock2 = () => ({ state, dispatch }) => {
  return liftEmptyBlock(state, dispatch);
};
var liftListItem2 = (typeOrName) => ({ state, dispatch }) => {
  const type = getNodeType(typeOrName, state.schema);
  return liftListItem(type)(state, dispatch);
};
var newlineInCode2 = () => ({ state, dispatch }) => {
  return newlineInCode(state, dispatch);
};
function getSchemaTypeNameByName(name, schema) {
  if (schema.nodes[name]) {
    return "node";
  }
  if (schema.marks[name]) {
    return "mark";
  }
  return null;
}
function deleteProps(obj, propOrProps) {
  const props = typeof propOrProps === "string" ? [propOrProps] : propOrProps;
  return Object.keys(obj).reduce((newObj, prop) => {
    if (!props.includes(prop)) {
      newObj[prop] = obj[prop];
    }
    return newObj;
  }, {});
}
var resetAttributes = (typeOrName, attributes) => ({ tr, state, dispatch }) => {
  let nodeType = null;
  let markType = null;
  const schemaType = getSchemaTypeNameByName(typeof typeOrName === "string" ? typeOrName : typeOrName.name, state.schema);
  if (!schemaType) {
    return false;
  }
  if (schemaType === "node") {
    nodeType = getNodeType(typeOrName, state.schema);
  }
  if (schemaType === "mark") {
    markType = getMarkType(typeOrName, state.schema);
  }
  if (dispatch) {
    tr.selection.ranges.forEach((range) => {
      state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, pos) => {
        if (nodeType && nodeType === node.type) {
          tr.setNodeMarkup(pos, void 0, deleteProps(node.attrs, attributes));
        }
        if (markType && node.marks.length) {
          node.marks.forEach((mark) => {
            if (markType === mark.type) {
              tr.addMark(pos, pos + node.nodeSize, markType.create(deleteProps(mark.attrs, attributes)));
            }
          });
        }
      });
    });
  }
  return true;
};
var scrollIntoView = () => ({ tr, dispatch }) => {
  if (dispatch) {
    tr.scrollIntoView();
  }
  return true;
};
var selectAll2 = () => ({ tr, commands: commands2 }) => {
  return commands2.setTextSelection({
    from: 0,
    to: tr.doc.content.size
  });
};
var selectNodeBackward2 = () => ({ state, dispatch }) => {
  return selectNodeBackward(state, dispatch);
};
var selectNodeForward2 = () => ({ state, dispatch }) => {
  return selectNodeForward(state, dispatch);
};
var selectParentNode2 = () => ({ state, dispatch }) => {
  return selectParentNode(state, dispatch);
};
var selectTextblockEnd2 = () => ({ state, dispatch }) => {
  return selectTextblockEnd(state, dispatch);
};
var selectTextblockStart2 = () => ({ state, dispatch }) => {
  return selectTextblockStart(state, dispatch);
};
function createDocument(content, schema, parseOptions = {}) {
  return createNodeFromContent(content, schema, { slice: false, parseOptions });
}
var setContent = (content, emitUpdate = false, parseOptions = {}) => ({ tr, editor, dispatch }) => {
  const { doc } = tr;
  const document2 = createDocument(content, editor.schema, parseOptions);
  if (dispatch) {
    tr.replaceWith(0, doc.content.size, document2).setMeta("preventUpdate", !emitUpdate);
  }
  return true;
};
function getMarkAttributes(state, typeOrName) {
  const type = getMarkType(typeOrName, state.schema);
  const { from, to, empty } = state.selection;
  const marks = [];
  if (empty) {
    if (state.storedMarks) {
      marks.push(...state.storedMarks);
    }
    marks.push(...state.selection.$head.marks());
  } else {
    state.doc.nodesBetween(from, to, (node) => {
      marks.push(...node.marks);
    });
  }
  const mark = marks.find((markItem) => markItem.type.name === type.name);
  if (!mark) {
    return {};
  }
  return __spreadValues({}, mark.attrs);
}
function defaultBlockAt2(match) {
  for (let i = 0; i < match.edgeCount; i += 1) {
    const { type } = match.edge(i);
    if (type.isTextblock && !type.hasRequiredAttrs()) {
      return type;
    }
  }
  return null;
}
function findParentNodeClosestToPos($pos, predicate) {
  for (let i = $pos.depth; i > 0; i -= 1) {
    const node = $pos.node(i);
    if (predicate(node)) {
      return {
        pos: i > 0 ? $pos.before(i) : 0,
        start: $pos.start(i),
        depth: i,
        node
      };
    }
  }
}
function findParentNode(predicate) {
  return (selection) => findParentNodeClosestToPos(selection.$from, predicate);
}
function getSplittedAttributes(extensionAttributes, typeName, attributes) {
  return Object.fromEntries(Object.entries(attributes).filter(([name]) => {
    const extensionAttribute = extensionAttributes.find((item) => {
      return item.type === typeName && item.name === name;
    });
    if (!extensionAttribute) {
      return false;
    }
    return extensionAttribute.attribute.keepOnSplit;
  }));
}
function isMarkActive(state, typeOrName, attributes = {}) {
  const { empty, ranges } = state.selection;
  const type = typeOrName ? getMarkType(typeOrName, state.schema) : null;
  if (empty) {
    return !!(state.storedMarks || state.selection.$from.marks()).filter((mark) => {
      if (!type) {
        return true;
      }
      return type.name === mark.type.name;
    }).find((mark) => objectIncludes(mark.attrs, attributes, { strict: false }));
  }
  let selectionRange = 0;
  const markRanges = [];
  ranges.forEach(({ $from, $to }) => {
    const from = $from.pos;
    const to = $to.pos;
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText && !node.marks.length) {
        return;
      }
      const relativeFrom = Math.max(from, pos);
      const relativeTo = Math.min(to, pos + node.nodeSize);
      const range2 = relativeTo - relativeFrom;
      selectionRange += range2;
      markRanges.push(...node.marks.map((mark) => ({
        mark,
        from: relativeFrom,
        to: relativeTo
      })));
    });
  });
  if (selectionRange === 0) {
    return false;
  }
  const matchedRange = markRanges.filter((markRange) => {
    if (!type) {
      return true;
    }
    return type.name === markRange.mark.type.name;
  }).filter((markRange) => objectIncludes(markRange.mark.attrs, attributes, { strict: false })).reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);
  const excludedRange = markRanges.filter((markRange) => {
    if (!type) {
      return true;
    }
    return markRange.mark.type !== type && markRange.mark.type.excludes(type);
  }).reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);
  const range = matchedRange > 0 ? matchedRange + excludedRange : matchedRange;
  return range >= selectionRange;
}
function isList(name, extensions) {
  const { nodeExtensions } = splitExtensions(extensions);
  const extension = nodeExtensions.find((item) => item.name === name);
  if (!extension) {
    return false;
  }
  const context = {
    name: extension.name,
    options: extension.options,
    storage: extension.storage
  };
  const group = callOrReturn(getExtensionField(extension, "group", context));
  if (typeof group !== "string") {
    return false;
  }
  return group.split(" ").includes("list");
}
function canSetMark(state, tr, newMarkType) {
  var _a2;
  const { selection } = tr;
  let cursor = null;
  if (isTextSelection(selection)) {
    cursor = selection.$cursor;
  }
  if (cursor) {
    const currentMarks = (_a2 = state.storedMarks) !== null && _a2 !== void 0 ? _a2 : cursor.marks();
    return !!newMarkType.isInSet(currentMarks) || !currentMarks.some((mark) => mark.type.excludes(newMarkType));
  }
  const { ranges } = selection;
  return ranges.some(({ $from, $to }) => {
    let someNodeSupportsMark = $from.depth === 0 ? state.doc.inlineContent && state.doc.type.allowsMarkType(newMarkType) : false;
    state.doc.nodesBetween($from.pos, $to.pos, (node, _pos, parent) => {
      if (someNodeSupportsMark) {
        return false;
      }
      if (node.isInline) {
        const parentAllowsMarkType = !parent || parent.type.allowsMarkType(newMarkType);
        const currentMarksAllowMarkType = !!newMarkType.isInSet(node.marks) || !node.marks.some((otherMark) => otherMark.type.excludes(newMarkType));
        someNodeSupportsMark = parentAllowsMarkType && currentMarksAllowMarkType;
      }
      return !someNodeSupportsMark;
    });
    return someNodeSupportsMark;
  });
}
var setMark = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
  const { selection } = tr;
  const { empty, ranges } = selection;
  const type = getMarkType(typeOrName, state.schema);
  if (dispatch) {
    if (empty) {
      const oldAttributes = getMarkAttributes(state, type);
      tr.addStoredMark(type.create(__spreadValues(__spreadValues({}, oldAttributes), attributes)));
    } else {
      ranges.forEach((range) => {
        const from = range.$from.pos;
        const to = range.$to.pos;
        state.doc.nodesBetween(from, to, (node, pos) => {
          const trimmedFrom = Math.max(pos, from);
          const trimmedTo = Math.min(pos + node.nodeSize, to);
          const someHasMark = node.marks.find((mark) => mark.type === type);
          if (someHasMark) {
            node.marks.forEach((mark) => {
              if (type === mark.type) {
                tr.addMark(trimmedFrom, trimmedTo, type.create(__spreadValues(__spreadValues({}, mark.attrs), attributes)));
              }
            });
          } else {
            tr.addMark(trimmedFrom, trimmedTo, type.create(attributes));
          }
        });
      });
    }
  }
  return canSetMark(state, tr, type);
};
var setMeta = (key, value) => ({ tr }) => {
  tr.setMeta(key, value);
  return true;
};
var setNode = (typeOrName, attributes = {}) => ({ state, dispatch, chain }) => {
  const type = getNodeType(typeOrName, state.schema);
  if (!type.isTextblock) {
    console.warn('[tiptap warn]: Currently "setNode()" only supports text block nodes.');
    return false;
  }
  return chain().command(({ commands: commands2 }) => {
    const canSetBlock = setBlockType(type, attributes)(state);
    if (canSetBlock) {
      return true;
    }
    return commands2.clearNodes();
  }).command(({ state: updatedState }) => {
    return setBlockType(type, attributes)(updatedState, dispatch);
  }).run();
};
var setNodeSelection = (position) => ({ tr, dispatch }) => {
  if (dispatch) {
    const { doc } = tr;
    const from = minMax(position, 0, doc.content.size);
    const selection = NodeSelection.create(doc, from);
    tr.setSelection(selection);
  }
  return true;
};
var setTextSelection = (position) => ({ tr, dispatch }) => {
  if (dispatch) {
    const { doc } = tr;
    const { from, to } = typeof position === "number" ? { from: position, to: position } : position;
    const minPos = TextSelection.atStart(doc).from;
    const maxPos = TextSelection.atEnd(doc).to;
    const resolvedFrom = minMax(from, minPos, maxPos);
    const resolvedEnd = minMax(to, minPos, maxPos);
    const selection = TextSelection.create(doc, resolvedFrom, resolvedEnd);
    tr.setSelection(selection);
  }
  return true;
};
var sinkListItem2 = (typeOrName) => ({ state, dispatch }) => {
  const type = getNodeType(typeOrName, state.schema);
  return sinkListItem(type)(state, dispatch);
};
function ensureMarks(state, splittableMarks) {
  const marks = state.storedMarks || state.selection.$to.parentOffset && state.selection.$from.marks();
  if (marks) {
    const filteredMarks = marks.filter((mark) => splittableMarks === null || splittableMarks === void 0 ? void 0 : splittableMarks.includes(mark.type.name));
    state.tr.ensureMarks(filteredMarks);
  }
}
var splitBlock2 = ({ keepMarks = true } = {}) => ({ tr, state, dispatch, editor }) => {
  const { selection, doc } = tr;
  const { $from, $to } = selection;
  const extensionAttributes = editor.extensionManager.attributes;
  const newAttributes = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
  if (selection instanceof NodeSelection && selection.node.isBlock) {
    if (!$from.parentOffset || !canSplit(doc, $from.pos)) {
      return false;
    }
    if (dispatch) {
      if (keepMarks) {
        ensureMarks(state, editor.extensionManager.splittableMarks);
      }
      tr.split($from.pos).scrollIntoView();
    }
    return true;
  }
  if (!$from.parent.isBlock) {
    return false;
  }
  if (dispatch) {
    const atEnd = $to.parentOffset === $to.parent.content.size;
    if (selection instanceof TextSelection) {
      tr.deleteSelection();
    }
    const deflt = $from.depth === 0 ? void 0 : defaultBlockAt2($from.node(-1).contentMatchAt($from.indexAfter(-1)));
    let types = atEnd && deflt ? [
      {
        type: deflt,
        attrs: newAttributes
      }
    ] : void 0;
    let can = canSplit(tr.doc, tr.mapping.map($from.pos), 1, types);
    if (!types && !can && canSplit(tr.doc, tr.mapping.map($from.pos), 1, deflt ? [{ type: deflt }] : void 0)) {
      can = true;
      types = deflt ? [
        {
          type: deflt,
          attrs: newAttributes
        }
      ] : void 0;
    }
    if (can) {
      tr.split(tr.mapping.map($from.pos), 1, types);
      if (deflt && !atEnd && !$from.parentOffset && $from.parent.type !== deflt) {
        const first2 = tr.mapping.map($from.before());
        const $first = tr.doc.resolve(first2);
        if ($from.node(-1).canReplaceWith($first.index(), $first.index() + 1, deflt)) {
          tr.setNodeMarkup(tr.mapping.map($from.before()), deflt);
        }
      }
    }
    if (keepMarks) {
      ensureMarks(state, editor.extensionManager.splittableMarks);
    }
    tr.scrollIntoView();
  }
  return true;
};
var splitListItem = (typeOrName) => ({ tr, state, dispatch, editor }) => {
  var _a2;
  const type = getNodeType(typeOrName, state.schema);
  const { $from, $to } = state.selection;
  const node = state.selection.node;
  if (node && node.isBlock || $from.depth < 2 || !$from.sameParent($to)) {
    return false;
  }
  const grandParent = $from.node(-1);
  if (grandParent.type !== type) {
    return false;
  }
  const extensionAttributes = editor.extensionManager.attributes;
  if ($from.parent.content.size === 0 && $from.node(-1).childCount === $from.indexAfter(-1)) {
    if ($from.depth === 2 || $from.node(-3).type !== type || $from.index(-2) !== $from.node(-2).childCount - 1) {
      return false;
    }
    if (dispatch) {
      let wrap = Fragment.empty;
      const depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3;
      for (let d = $from.depth - depthBefore; d >= $from.depth - 3; d -= 1) {
        wrap = Fragment.from($from.node(d).copy(wrap));
      }
      const depthAfter = $from.indexAfter(-1) < $from.node(-2).childCount ? 1 : $from.indexAfter(-2) < $from.node(-3).childCount ? 2 : 3;
      const newNextTypeAttributes2 = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
      const nextType2 = ((_a2 = type.contentMatch.defaultType) === null || _a2 === void 0 ? void 0 : _a2.createAndFill(newNextTypeAttributes2)) || void 0;
      wrap = wrap.append(Fragment.from(type.createAndFill(null, nextType2) || void 0));
      const start2 = $from.before($from.depth - (depthBefore - 1));
      tr.replace(start2, $from.after(-depthAfter), new Slice(wrap, 4 - depthBefore, 0));
      let sel = -1;
      tr.doc.nodesBetween(start2, tr.doc.content.size, (n, pos) => {
        if (sel > -1) {
          return false;
        }
        if (n.isTextblock && n.content.size === 0) {
          sel = pos + 1;
        }
      });
      if (sel > -1) {
        tr.setSelection(TextSelection.near(tr.doc.resolve(sel)));
      }
      tr.scrollIntoView();
    }
    return true;
  }
  const nextType = $to.pos === $from.end() ? grandParent.contentMatchAt(0).defaultType : null;
  const newTypeAttributes = getSplittedAttributes(extensionAttributes, grandParent.type.name, grandParent.attrs);
  const newNextTypeAttributes = getSplittedAttributes(extensionAttributes, $from.node().type.name, $from.node().attrs);
  tr.delete($from.pos, $to.pos);
  const types = nextType ? [
    { type, attrs: newTypeAttributes },
    { type: nextType, attrs: newNextTypeAttributes }
  ] : [{ type, attrs: newTypeAttributes }];
  if (!canSplit(tr.doc, $from.pos, 2)) {
    return false;
  }
  if (dispatch) {
    const { selection, storedMarks } = state;
    const { splittableMarks } = editor.extensionManager;
    const marks = storedMarks || selection.$to.parentOffset && selection.$from.marks();
    tr.split($from.pos, 2, types).scrollIntoView();
    if (!marks || !dispatch) {
      return true;
    }
    const filteredMarks = marks.filter((mark) => splittableMarks.includes(mark.type.name));
    tr.ensureMarks(filteredMarks);
  }
  return true;
};
var joinListBackwards = (tr, listType) => {
  const list = findParentNode((node) => node.type === listType)(tr.selection);
  if (!list) {
    return true;
  }
  const before = tr.doc.resolve(Math.max(0, list.pos - 1)).before(list.depth);
  if (before === void 0) {
    return true;
  }
  const nodeBefore = tr.doc.nodeAt(before);
  const canJoinBackwards = list.node.type === (nodeBefore === null || nodeBefore === void 0 ? void 0 : nodeBefore.type) && canJoin(tr.doc, list.pos);
  if (!canJoinBackwards) {
    return true;
  }
  tr.join(list.pos);
  return true;
};
var joinListForwards = (tr, listType) => {
  const list = findParentNode((node) => node.type === listType)(tr.selection);
  if (!list) {
    return true;
  }
  const after = tr.doc.resolve(list.start).after(list.depth);
  if (after === void 0) {
    return true;
  }
  const nodeAfter = tr.doc.nodeAt(after);
  const canJoinForwards = list.node.type === (nodeAfter === null || nodeAfter === void 0 ? void 0 : nodeAfter.type) && canJoin(tr.doc, after);
  if (!canJoinForwards) {
    return true;
  }
  tr.join(after);
  return true;
};
var toggleList = (listTypeOrName, itemTypeOrName, keepMarks, attributes = {}) => ({ editor, tr, state, dispatch, chain, commands: commands2, can }) => {
  const { extensions, splittableMarks } = editor.extensionManager;
  const listType = getNodeType(listTypeOrName, state.schema);
  const itemType = getNodeType(itemTypeOrName, state.schema);
  const { selection, storedMarks } = state;
  const { $from, $to } = selection;
  const range = $from.blockRange($to);
  const marks = storedMarks || selection.$to.parentOffset && selection.$from.marks();
  if (!range) {
    return false;
  }
  const parentList = findParentNode((node) => isList(node.type.name, extensions))(selection);
  if (range.depth >= 1 && parentList && range.depth - parentList.depth <= 1) {
    if (parentList.node.type === listType) {
      return commands2.liftListItem(itemType);
    }
    if (isList(parentList.node.type.name, extensions) && listType.validContent(parentList.node.content) && dispatch) {
      return chain().command(() => {
        tr.setNodeMarkup(parentList.pos, listType);
        return true;
      }).command(() => joinListBackwards(tr, listType)).command(() => joinListForwards(tr, listType)).run();
    }
  }
  if (!keepMarks || !marks || !dispatch) {
    return chain().command(() => {
      const canWrapInList = can().wrapInList(listType, attributes);
      if (canWrapInList) {
        return true;
      }
      return commands2.clearNodes();
    }).wrapInList(listType, attributes).command(() => joinListBackwards(tr, listType)).command(() => joinListForwards(tr, listType)).run();
  }
  return chain().command(() => {
    const canWrapInList = can().wrapInList(listType, attributes);
    const filteredMarks = marks.filter((mark) => splittableMarks.includes(mark.type.name));
    tr.ensureMarks(filteredMarks);
    if (canWrapInList) {
      return true;
    }
    return commands2.clearNodes();
  }).wrapInList(listType, attributes).command(() => joinListBackwards(tr, listType)).command(() => joinListForwards(tr, listType)).run();
};
var toggleMark = (typeOrName, attributes = {}, options = {}) => ({ state, commands: commands2 }) => {
  const { extendEmptyMarkRange = false } = options;
  const type = getMarkType(typeOrName, state.schema);
  const isActive = isMarkActive(state, type, attributes);
  if (isActive) {
    return commands2.unsetMark(type, { extendEmptyMarkRange });
  }
  return commands2.setMark(type, attributes);
};
var toggleNode = (typeOrName, toggleTypeOrName, attributes = {}) => ({ state, commands: commands2 }) => {
  const type = getNodeType(typeOrName, state.schema);
  const toggleType = getNodeType(toggleTypeOrName, state.schema);
  const isActive = isNodeActive(state, type, attributes);
  if (isActive) {
    return commands2.setNode(toggleType);
  }
  return commands2.setNode(type, attributes);
};
var toggleWrap = (typeOrName, attributes = {}) => ({ state, commands: commands2 }) => {
  const type = getNodeType(typeOrName, state.schema);
  const isActive = isNodeActive(state, type, attributes);
  if (isActive) {
    return commands2.lift(type);
  }
  return commands2.wrapIn(type, attributes);
};
var undoInputRule = () => ({ state, dispatch }) => {
  const plugins = state.plugins;
  for (let i = 0; i < plugins.length; i += 1) {
    const plugin = plugins[i];
    let undoable;
    if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
      if (dispatch) {
        const tr = state.tr;
        const toUndo = undoable.transform;
        for (let j = toUndo.steps.length - 1; j >= 0; j -= 1) {
          tr.step(toUndo.steps[j].invert(toUndo.docs[j]));
        }
        if (undoable.text) {
          const marks = tr.doc.resolve(undoable.from).marks();
          tr.replaceWith(undoable.from, undoable.to, state.schema.text(undoable.text, marks));
        } else {
          tr.delete(undoable.from, undoable.to);
        }
      }
      return true;
    }
  }
  return false;
};
var unsetAllMarks = () => ({ tr, dispatch }) => {
  const { selection } = tr;
  const { empty, ranges } = selection;
  if (empty) {
    return true;
  }
  if (dispatch) {
    ranges.forEach((range) => {
      tr.removeMark(range.$from.pos, range.$to.pos);
    });
  }
  return true;
};
var unsetMark = (typeOrName, options = {}) => ({ tr, state, dispatch }) => {
  var _a2;
  const { extendEmptyMarkRange = false } = options;
  const { selection } = tr;
  const type = getMarkType(typeOrName, state.schema);
  const { $from, empty, ranges } = selection;
  if (!dispatch) {
    return true;
  }
  if (empty && extendEmptyMarkRange) {
    let { from, to } = selection;
    const attrs = (_a2 = $from.marks().find((mark) => mark.type === type)) === null || _a2 === void 0 ? void 0 : _a2.attrs;
    const range = getMarkRange($from, type, attrs);
    if (range) {
      from = range.from;
      to = range.to;
    }
    tr.removeMark(from, to, type);
  } else {
    ranges.forEach((range) => {
      tr.removeMark(range.$from.pos, range.$to.pos, type);
    });
  }
  tr.removeStoredMark(type);
  return true;
};
var updateAttributes = (typeOrName, attributes = {}) => ({ tr, state, dispatch }) => {
  let nodeType = null;
  let markType = null;
  const schemaType = getSchemaTypeNameByName(typeof typeOrName === "string" ? typeOrName : typeOrName.name, state.schema);
  if (!schemaType) {
    return false;
  }
  if (schemaType === "node") {
    nodeType = getNodeType(typeOrName, state.schema);
  }
  if (schemaType === "mark") {
    markType = getMarkType(typeOrName, state.schema);
  }
  if (dispatch) {
    tr.selection.ranges.forEach((range) => {
      const from = range.$from.pos;
      const to = range.$to.pos;
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (nodeType && nodeType === node.type) {
          tr.setNodeMarkup(pos, void 0, __spreadValues(__spreadValues({}, node.attrs), attributes));
        }
        if (markType && node.marks.length) {
          node.marks.forEach((mark) => {
            if (markType === mark.type) {
              const trimmedFrom = Math.max(pos, from);
              const trimmedTo = Math.min(pos + node.nodeSize, to);
              tr.addMark(trimmedFrom, trimmedTo, markType.create(__spreadValues(__spreadValues({}, mark.attrs), attributes)));
            }
          });
        }
      });
    });
  }
  return true;
};
var wrapIn2 = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
  const type = getNodeType(typeOrName, state.schema);
  return wrapIn(type, attributes)(state, dispatch);
};
var wrapInList2 = (typeOrName, attributes = {}) => ({ state, dispatch }) => {
  const type = getNodeType(typeOrName, state.schema);
  return wrapInList(type, attributes)(state, dispatch);
};
var commands = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  blur,
  clearContent,
  clearNodes,
  command,
  createParagraphNear: createParagraphNear2,
  cut,
  deleteCurrentNode,
  deleteNode,
  deleteRange,
  deleteSelection: deleteSelection2,
  enter,
  exitCode: exitCode2,
  extendMarkRange,
  first,
  focus,
  forEach,
  insertContent,
  insertContentAt,
  joinUp: joinUp2,
  joinDown: joinDown2,
  joinBackward: joinBackward2,
  joinForward: joinForward2,
  joinItemBackward,
  joinItemForward,
  keyboardShortcut,
  lift: lift2,
  liftEmptyBlock: liftEmptyBlock2,
  liftListItem: liftListItem2,
  newlineInCode: newlineInCode2,
  resetAttributes,
  scrollIntoView,
  selectAll: selectAll2,
  selectNodeBackward: selectNodeBackward2,
  selectNodeForward: selectNodeForward2,
  selectParentNode: selectParentNode2,
  selectTextblockEnd: selectTextblockEnd2,
  selectTextblockStart: selectTextblockStart2,
  setContent,
  setMark,
  setMeta,
  setNode,
  setNodeSelection,
  setTextSelection,
  sinkListItem: sinkListItem2,
  splitBlock: splitBlock2,
  splitListItem,
  toggleList,
  toggleMark,
  toggleNode,
  toggleWrap,
  undoInputRule,
  unsetAllMarks,
  unsetMark,
  updateAttributes,
  wrapIn: wrapIn2,
  wrapInList: wrapInList2
});
var Commands = Extension.create({
  name: "commands",
  addCommands() {
    return __spreadValues({}, commands);
  }
});
var Editable = Extension.create({
  name: "editable",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("editable"),
        props: {
          editable: () => this.editor.options.editable
        }
      })
    ];
  }
});
var FocusEvents = Extension.create({
  name: "focusEvents",
  addProseMirrorPlugins() {
    const { editor } = this;
    return [
      new Plugin({
        key: new PluginKey("focusEvents"),
        props: {
          handleDOMEvents: {
            focus: (view, event) => {
              editor.isFocused = true;
              const transaction = editor.state.tr.setMeta("focus", { event }).setMeta("addToHistory", false);
              view.dispatch(transaction);
              return false;
            },
            blur: (view, event) => {
              editor.isFocused = false;
              const transaction = editor.state.tr.setMeta("blur", { event }).setMeta("addToHistory", false);
              view.dispatch(transaction);
              return false;
            }
          }
        }
      })
    ];
  }
});
var Keymap = Extension.create({
  name: "keymap",
  addKeyboardShortcuts() {
    const handleBackspace = () => this.editor.commands.first(({ commands: commands2 }) => [
      () => commands2.undoInputRule(),
      // maybe convert first text block node to default node
      () => commands2.command(({ tr }) => {
        const { selection, doc } = tr;
        const { empty, $anchor } = selection;
        const { pos, parent } = $anchor;
        const $parentPos = $anchor.parent.isTextblock ? tr.doc.resolve(pos - 1) : $anchor;
        const parentIsIsolating = $parentPos.parent.type.spec.isolating;
        const parentPos = $anchor.pos - $anchor.parentOffset;
        const isAtStart = parentIsIsolating && $parentPos.parent.childCount === 1 ? parentPos === $anchor.pos : Selection.atStart(doc).from === pos;
        if (!empty || !isAtStart || !parent.type.isTextblock || parent.textContent.length) {
          return false;
        }
        return commands2.clearNodes();
      }),
      () => commands2.deleteSelection(),
      () => commands2.joinBackward(),
      () => commands2.selectNodeBackward()
    ]);
    const handleDelete = () => this.editor.commands.first(({ commands: commands2 }) => [
      () => commands2.deleteSelection(),
      () => commands2.deleteCurrentNode(),
      () => commands2.joinForward(),
      () => commands2.selectNodeForward()
    ]);
    const handleEnter = () => this.editor.commands.first(({ commands: commands2 }) => [
      () => commands2.newlineInCode(),
      () => commands2.createParagraphNear(),
      () => commands2.liftEmptyBlock(),
      () => commands2.splitBlock()
    ]);
    const baseKeymap = {
      Enter: handleEnter,
      "Mod-Enter": () => this.editor.commands.exitCode(),
      Backspace: handleBackspace,
      "Mod-Backspace": handleBackspace,
      "Shift-Backspace": handleBackspace,
      Delete: handleDelete,
      "Mod-Delete": handleDelete,
      "Mod-a": () => this.editor.commands.selectAll()
    };
    const pcKeymap = __spreadValues({}, baseKeymap);
    const macKeymap = __spreadProps(__spreadValues({}, baseKeymap), {
      "Ctrl-h": handleBackspace,
      "Alt-Backspace": handleBackspace,
      "Ctrl-d": handleDelete,
      "Ctrl-Alt-Backspace": handleDelete,
      "Alt-Delete": handleDelete,
      "Alt-d": handleDelete,
      "Ctrl-a": () => this.editor.commands.selectTextblockStart(),
      "Ctrl-e": () => this.editor.commands.selectTextblockEnd()
    });
    if (isiOS() || isMacOS()) {
      return macKeymap;
    }
    return pcKeymap;
  },
  addProseMirrorPlugins() {
    return [
      // With this plugin we check if the whole document was selected and deleted.
      // In this case we will additionally call `clearNodes()` to convert e.g. a heading
      // to a paragraph if necessary.
      // This is an alternative to ProseMirror's `AllSelection`, which doesn’t work well
      // with many other commands.
      new Plugin({
        key: new PluginKey("clearDocument"),
        appendTransaction: (transactions, oldState, newState) => {
          const docChanges = transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc);
          if (!docChanges) {
            return;
          }
          const { empty, from, to } = oldState.selection;
          const allFrom = Selection.atStart(oldState.doc).from;
          const allEnd = Selection.atEnd(oldState.doc).to;
          const allWasSelected = from === allFrom && to === allEnd;
          if (empty || !allWasSelected) {
            return;
          }
          const isEmpty = newState.doc.textBetween(0, newState.doc.content.size, " ", " ").length === 0;
          if (!isEmpty) {
            return;
          }
          const tr = newState.tr;
          const state = createChainableState({
            state: newState,
            transaction: tr
          });
          const { commands: commands2 } = new CommandManager({
            editor: this.editor,
            state
          });
          commands2.clearNodes();
          if (!tr.steps.length) {
            return;
          }
          return tr;
        }
      })
    ];
  }
});
var Tabindex = Extension.create({
  name: "tabindex",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("tabindex"),
        props: {
          attributes: this.editor.isEditable ? { tabindex: "0" } : {}
        }
      })
    ];
  }
});

// src/ui/extensions/enter-key-extension.tsx
var EnterKeyExtension = (onEnterKeyPress) => Extension.create({
  name: "enterKey",
  addKeyboardShortcuts() {
    return {
      "Enter": () => {
        if (onEnterKeyPress) {
          onEnterKeyPress();
        }
        return true;
      }
    };
  }
});

// src/ui/extensions/index.tsx
var LiteTextEditorExtensions = (onEnterKeyPress) => [
  CustomListItem,
  EnterKeyExtension(onEnterKeyPress)
];

// src/ui/index.tsx
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var LiteTextEditor = ({
  onChange,
  debouncedUpdatesEnabled,
  editable,
  setIsSubmitting,
  setShouldShowAlert,
  editorContentCustomClassNames,
  value,
  uploadFile,
  deleteFile,
  noBorder,
  borderOnFocus,
  customClassName,
  forwardedRef,
  commentAccessSpecifier,
  onEnterKeyPress
}) => {
  const editor = useEditor({
    onChange,
    debouncedUpdatesEnabled,
    editable,
    setIsSubmitting,
    setShouldShowAlert,
    value,
    uploadFile,
    deleteFile,
    forwardedRef,
    extensions: LiteTextEditorExtensions(onEnterKeyPress)
  });
  const editorClassNames = getEditorClassNames({ noBorder, borderOnFocus, customClassName });
  if (!editor)
    return null;
  return /* @__PURE__ */ jsx4(EditorContainer, { editor, editorClassNames, children: /* @__PURE__ */ jsxs3("div", { className: "flex flex-col", children: [
    /* @__PURE__ */ jsx4(EditorContentWrapper, { editor, editorContentCustomClassNames }),
    editable !== false && /* @__PURE__ */ jsx4("div", { className: "w-full mt-4", children: /* @__PURE__ */ jsx4(FixedMenu, { editor, uploadFile, setIsSubmitting, commentAccessSpecifier }) })
  ] }) });
};
var LiteTextEditorWithRef = React20.forwardRef((props, ref) => /* @__PURE__ */ jsx4(LiteTextEditor, __spreadProps(__spreadValues({}, props), { forwardedRef: ref })));
LiteTextEditorWithRef.displayName = "LiteTextEditorWithRef";

// src/ui/read-only/index.tsx
import { EditorContainer as EditorContainer2, EditorContentWrapper as EditorContentWrapper2, getEditorClassNames as getEditorClassNames2, useReadOnlyEditor } from "@plane/editor-core";
import * as React21 from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
var LiteReadOnlyEditor = ({
  editorContentCustomClassNames,
  noBorder,
  borderOnFocus,
  customClassName,
  value,
  forwardedRef
}) => {
  const editor = useReadOnlyEditor({
    value,
    forwardedRef
  });
  const editorClassNames = getEditorClassNames2({ noBorder, borderOnFocus, customClassName });
  if (!editor)
    return null;
  return /* @__PURE__ */ jsx5(EditorContainer2, { editor, editorClassNames, children: /* @__PURE__ */ jsx5("div", { className: "flex flex-col", children: /* @__PURE__ */ jsx5(EditorContentWrapper2, { editor, editorContentCustomClassNames }) }) });
};
var LiteReadOnlyEditorWithRef = React21.forwardRef((props, ref) => /* @__PURE__ */ jsx5(LiteReadOnlyEditor, __spreadProps(__spreadValues({}, props), { forwardedRef: ref })));
LiteReadOnlyEditorWithRef.displayName = "LiteReadOnlyEditorWithRef";
export {
  LiteReadOnlyEditor,
  LiteReadOnlyEditorWithRef,
  LiteTextEditor,
  LiteTextEditorWithRef
};
/*! Bundled license information:

dom4/build/dom4.max.js:
  (*!
  Copyright (C) 2013-2015 by Andrea Giammarchi - @WebReflection
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
  
  *)

classnames/index.js:
  (*!
  	Copyright (c) 2018 Jed Watson.
  	Licensed under the MIT License (MIT), see
  	http://jedwatson.github.io/classnames
  *)

react-is/cjs/react-is.production.min.js:
  (** @license React v16.13.1
   * react-is.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-is/cjs/react-is.development.js:
  (** @license React v16.13.1
   * react-is.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

object-assign/index.js:
  (*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  *)
*/
