var um = Object.create;
var Yn = Object.defineProperty;
var pm = Object.getOwnPropertyDescriptor;
var cm = Object.getOwnPropertyNames;
var dm = Object.getPrototypeOf, fm = Object.prototype.hasOwnProperty;
var s = (e, t) => Yn(e, "name", { value: t, configurable: !0 }), $o = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy <
"u" ? new Proxy(e, {
  get: (t, o) => (typeof require < "u" ? require : t)[o]
}) : e)(function(e) {
  if (typeof require < "u") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + e + '" is not supported');
});
var _e = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var mm = (e, t, o, i) => {
  if (t && typeof t == "object" || typeof t == "function")
    for (let n of cm(t))
      !fm.call(e, n) && n !== o && Yn(e, n, { get: () => t[n], enumerable: !(i = pm(t, n)) || i.enumerable });
  return e;
};
var Ve = (e, t, o) => (o = e != null ? um(dm(e)) : {}, mm(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  t || !e || !e.__esModule ? Yn(o, "default", { value: e, enumerable: !0 }) : o,
  e
));

// ../node_modules/prop-types/lib/ReactPropTypesSecret.js
var Ua = _e((ZS, Ka) => {
  "use strict";
  var hm = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  Ka.exports = hm;
});

// ../node_modules/prop-types/factoryWithThrowingShims.js
var Xa = _e((JS, Ya) => {
  "use strict";
  var gm = Ua();
  function qa() {
  }
  s(qa, "emptyFunction");
  function Ga() {
  }
  s(Ga, "emptyFunctionWithReset");
  Ga.resetWarningCache = qa;
  Ya.exports = function() {
    function e(i, n, r, l, u, p) {
      if (p !== gm) {
        var c = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. \
Read more at http://fb.me/use-check-prop-types"
        );
        throw c.name = "Invariant Violation", c;
      }
    }
    s(e, "shim"), e.isRequired = e;
    function t() {
      return e;
    }
    s(t, "getShim");
    var o = {
      array: e,
      bigint: e,
      bool: e,
      func: e,
      number: e,
      object: e,
      string: e,
      symbol: e,
      any: e,
      arrayOf: t,
      element: e,
      elementType: e,
      instanceOf: t,
      node: e,
      objectOf: t,
      oneOf: t,
      oneOfType: t,
      shape: t,
      exact: t,
      checkPropTypes: Ga,
      resetWarningCache: qa
    };
    return o.PropTypes = o, o;
  };
});

// ../node_modules/prop-types/index.js
var ti = _e((rw, Qa) => {
  Qa.exports = Xa()();
  var tw, ow;
});

// ../node_modules/react-fast-compare/index.js
var oi = _e((nw, Za) => {
  var ym = typeof Element < "u", vm = typeof Map == "function", bm = typeof Set == "function", xm = typeof ArrayBuffer == "function" && !!ArrayBuffer.
  isView;
  function wr(e, t) {
    if (e === t) return !0;
    if (e && t && typeof e == "object" && typeof t == "object") {
      if (e.constructor !== t.constructor) return !1;
      var o, i, n;
      if (Array.isArray(e)) {
        if (o = e.length, o != t.length) return !1;
        for (i = o; i-- !== 0; )
          if (!wr(e[i], t[i])) return !1;
        return !0;
      }
      var r;
      if (vm && e instanceof Map && t instanceof Map) {
        if (e.size !== t.size) return !1;
        for (r = e.entries(); !(i = r.next()).done; )
          if (!t.has(i.value[0])) return !1;
        for (r = e.entries(); !(i = r.next()).done; )
          if (!wr(i.value[1], t.get(i.value[0]))) return !1;
        return !0;
      }
      if (bm && e instanceof Set && t instanceof Set) {
        if (e.size !== t.size) return !1;
        for (r = e.entries(); !(i = r.next()).done; )
          if (!t.has(i.value[0])) return !1;
        return !0;
      }
      if (xm && ArrayBuffer.isView(e) && ArrayBuffer.isView(t)) {
        if (o = e.length, o != t.length) return !1;
        for (i = o; i-- !== 0; )
          if (e[i] !== t[i]) return !1;
        return !0;
      }
      if (e.constructor === RegExp) return e.source === t.source && e.flags === t.flags;
      if (e.valueOf !== Object.prototype.valueOf && typeof e.valueOf == "function" && typeof t.valueOf == "function") return e.valueOf() ===
      t.valueOf();
      if (e.toString !== Object.prototype.toString && typeof e.toString == "function" && typeof t.toString == "function") return e.toString() ===
      t.toString();
      if (n = Object.keys(e), o = n.length, o !== Object.keys(t).length) return !1;
      for (i = o; i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(t, n[i])) return !1;
      if (ym && e instanceof Element) return !1;
      for (i = o; i-- !== 0; )
        if (!((n[i] === "_owner" || n[i] === "__v" || n[i] === "__o") && e.$$typeof) && !wr(e[n[i]], t[n[i]]))
          return !1;
      return !0;
    }
    return e !== e && t !== t;
  }
  s(wr, "equal");
  Za.exports = /* @__PURE__ */ s(function(t, o) {
    try {
      return wr(t, o);
    } catch (i) {
      if ((i.message || "").match(/stack|recursion/i))
        return console.warn("react-fast-compare cannot handle circular refs"), !1;
      throw i;
    }
  }, "isEqual");
});

// ../node_modules/invariant/browser.js
var el = _e((sw, Ja) => {
  "use strict";
  var Im = /* @__PURE__ */ s(function(e, t, o, i, n, r, l, u) {
    if (!e) {
      var p;
      if (t === void 0)
        p = new Error(
          "Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings."
        );
      else {
        var c = [o, i, n, r, l, u], d = 0;
        p = new Error(
          t.replace(/%s/g, function() {
            return c[d++];
          })
        ), p.name = "Invariant Violation";
      }
      throw p.framesToPop = 1, p;
    }
  }, "invariant");
  Ja.exports = Im;
});

// ../node_modules/shallowequal/index.js
var ol = _e((lw, tl) => {
  tl.exports = /* @__PURE__ */ s(function(t, o, i, n) {
    var r = i ? i.call(n, t, o) : void 0;
    if (r !== void 0)
      return !!r;
    if (t === o)
      return !0;
    if (typeof t != "object" || !t || typeof o != "object" || !o)
      return !1;
    var l = Object.keys(t), u = Object.keys(o);
    if (l.length !== u.length)
      return !1;
    for (var p = Object.prototype.hasOwnProperty.bind(o), c = 0; c < l.length; c++) {
      var d = l[c];
      if (!p(d))
        return !1;
      var m = t[d], f = o[d];
      if (r = i ? i.call(n, m, f, d) : void 0, r === !1 || r === void 0 && m !== f)
        return !1;
    }
    return !0;
  }, "shallowEqual");
});

// ../node_modules/memoizerific/memoizerific.js
var Zo = _e((wu, Ti) => {
  (function(e) {
    if (typeof wu == "object" && typeof Ti < "u")
      Ti.exports = e();
    else if (typeof define == "function" && define.amd)
      define([], e);
    else {
      var t;
      typeof window < "u" ? t = window : typeof global < "u" ? t = global : typeof self < "u" ? t = self : t = this, t.memoizerific = e();
    }
  })(function() {
    var e, t, o;
    return (/* @__PURE__ */ s(function i(n, r, l) {
      function u(d, m) {
        if (!r[d]) {
          if (!n[d]) {
            var f = typeof $o == "function" && $o;
            if (!m && f) return f(d, !0);
            if (p) return p(d, !0);
            var y = new Error("Cannot find module '" + d + "'");
            throw y.code = "MODULE_NOT_FOUND", y;
          }
          var h = r[d] = { exports: {} };
          n[d][0].call(h.exports, function(v) {
            var I = n[d][1][v];
            return u(I || v);
          }, h, h.exports, i, n, r, l);
        }
        return r[d].exports;
      }
      s(u, "s");
      for (var p = typeof $o == "function" && $o, c = 0; c < l.length; c++) u(l[c]);
      return u;
    }, "e"))({ 1: [function(i, n, r) {
      n.exports = function(l) {
        if (typeof Map != "function" || l) {
          var u = i("./similar");
          return new u();
        } else
          return /* @__PURE__ */ new Map();
      };
    }, { "./similar": 2 }], 2: [function(i, n, r) {
      function l() {
        return this.list = [], this.lastItem = void 0, this.size = 0, this;
      }
      s(l, "Similar"), l.prototype.get = function(u) {
        var p;
        if (this.lastItem && this.isEqual(this.lastItem.key, u))
          return this.lastItem.val;
        if (p = this.indexOf(u), p >= 0)
          return this.lastItem = this.list[p], this.list[p].val;
      }, l.prototype.set = function(u, p) {
        var c;
        return this.lastItem && this.isEqual(this.lastItem.key, u) ? (this.lastItem.val = p, this) : (c = this.indexOf(u), c >= 0 ? (this.lastItem =
        this.list[c], this.list[c].val = p, this) : (this.lastItem = { key: u, val: p }, this.list.push(this.lastItem), this.size++, this));
      }, l.prototype.delete = function(u) {
        var p;
        if (this.lastItem && this.isEqual(this.lastItem.key, u) && (this.lastItem = void 0), p = this.indexOf(u), p >= 0)
          return this.size--, this.list.splice(p, 1)[0];
      }, l.prototype.has = function(u) {
        var p;
        return this.lastItem && this.isEqual(this.lastItem.key, u) ? !0 : (p = this.indexOf(u), p >= 0 ? (this.lastItem = this.list[p], !0) :
        !1);
      }, l.prototype.forEach = function(u, p) {
        var c;
        for (c = 0; c < this.size; c++)
          u.call(p || this, this.list[c].val, this.list[c].key, this);
      }, l.prototype.indexOf = function(u) {
        var p;
        for (p = 0; p < this.size; p++)
          if (this.isEqual(this.list[p].key, u))
            return p;
        return -1;
      }, l.prototype.isEqual = function(u, p) {
        return u === p || u !== u && p !== p;
      }, n.exports = l;
    }, {}], 3: [function(i, n, r) {
      var l = i("map-or-similar");
      n.exports = function(d) {
        var m = new l(!1), f = [];
        return function(y) {
          var h = /* @__PURE__ */ s(function() {
            var v = m, I, C, b = arguments.length - 1, x = Array(b + 1), g = !0, w;
            if ((h.numArgs || h.numArgs === 0) && h.numArgs !== b + 1)
              throw new Error("Memoizerific functions should always be called with the same number of arguments");
            for (w = 0; w < b; w++) {
              if (x[w] = {
                cacheItem: v,
                arg: arguments[w]
              }, v.has(arguments[w])) {
                v = v.get(arguments[w]);
                continue;
              }
              g = !1, I = new l(!1), v.set(arguments[w], I), v = I;
            }
            return g && (v.has(arguments[b]) ? C = v.get(arguments[b]) : g = !1), g || (C = y.apply(null, arguments), v.set(arguments[b], C)),
            d > 0 && (x[b] = {
              cacheItem: v,
              arg: arguments[b]
            }, g ? u(f, x) : f.push(x), f.length > d && p(f.shift())), h.wasMemoized = g, h.numArgs = b + 1, C;
          }, "memoizerific");
          return h.limit = d, h.wasMemoized = !1, h.cache = m, h.lru = f, h;
        };
      };
      function u(d, m) {
        var f = d.length, y = m.length, h, v, I;
        for (v = 0; v < f; v++) {
          for (h = !0, I = 0; I < y; I++)
            if (!c(d[v][I].arg, m[I].arg)) {
              h = !1;
              break;
            }
          if (h)
            break;
        }
        d.push(d.splice(v, 1)[0]);
      }
      s(u, "moveToMostRecentLru");
      function p(d) {
        var m = d.length, f = d[m - 1], y, h;
        for (f.cacheItem.delete(f.arg), h = m - 2; h >= 0 && (f = d[h], y = f.cacheItem.get(f.arg), !y || !y.size); h--)
          f.cacheItem.delete(f.arg);
      }
      s(p, "removeCachedResult");
      function c(d, m) {
        return d === m || d !== d && m !== m;
      }
      s(c, "isEqual");
    }, { "map-or-similar": 1 }] }, {}, [3])(3);
  });
});

// ../node_modules/picoquery/lib/string-util.js
var Ai = _e((Pi) => {
  "use strict";
  Object.defineProperty(Pi, "__esModule", { value: !0 });
  Pi.encodeString = Hh;
  var bt = Array.from({ length: 256 }, (e, t) => "%" + ((t < 16 ? "0" : "") + t.toString(16)).toUpperCase()), Bh = new Int8Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    1,
    0
  ]);
  function Hh(e) {
    let t = e.length;
    if (t === 0)
      return "";
    let o = "", i = 0, n = 0;
    e: for (; n < t; n++) {
      let r = e.charCodeAt(n);
      for (; r < 128; ) {
        if (Bh[r] !== 1 && (i < n && (o += e.slice(i, n)), i = n + 1, o += bt[r]), ++n === t)
          break e;
        r = e.charCodeAt(n);
      }
      if (i < n && (o += e.slice(i, n)), r < 2048) {
        i = n + 1, o += bt[192 | r >> 6] + bt[128 | r & 63];
        continue;
      }
      if (r < 55296 || r >= 57344) {
        i = n + 1, o += bt[224 | r >> 12] + bt[128 | r >> 6 & 63] + bt[128 | r & 63];
        continue;
      }
      if (++n, n >= t)
        throw new Error("URI malformed");
      let l = e.charCodeAt(n) & 1023;
      i = n + 1, r = 65536 + ((r & 1023) << 10 | l), o += bt[240 | r >> 18] + bt[128 | r >> 12 & 63] + bt[128 | r >> 6 & 63] + bt[128 | r & 63];
    }
    return i === 0 ? e : i < t ? o + e.slice(i) : o;
  }
  s(Hh, "encodeString");
});

// ../node_modules/picoquery/lib/shared.js
var Xr = _e((xt) => {
  "use strict";
  Object.defineProperty(xt, "__esModule", { value: !0 });
  xt.defaultOptions = xt.defaultShouldSerializeObject = xt.defaultValueSerializer = void 0;
  var Di = Ai(), Rh = /* @__PURE__ */ s((e) => {
    switch (typeof e) {
      case "string":
        return (0, Di.encodeString)(e);
      case "bigint":
      case "boolean":
        return "" + e;
      case "number":
        if (Number.isFinite(e))
          return e < 1e21 ? "" + e : (0, Di.encodeString)("" + e);
        break;
    }
    return e instanceof Date ? (0, Di.encodeString)(e.toISOString()) : "";
  }, "defaultValueSerializer");
  xt.defaultValueSerializer = Rh;
  var zh = /* @__PURE__ */ s((e) => e instanceof Date, "defaultShouldSerializeObject");
  xt.defaultShouldSerializeObject = zh;
  var _u = /* @__PURE__ */ s((e) => e, "identityFunc");
  xt.defaultOptions = {
    nesting: !0,
    nestingSyntax: "dot",
    arrayRepeat: !1,
    arrayRepeatSyntax: "repeat",
    delimiter: 38,
    valueDeserializer: _u,
    valueSerializer: xt.defaultValueSerializer,
    keyDeserializer: _u,
    shouldSerializeObject: xt.defaultShouldSerializeObject
  };
});

// ../node_modules/picoquery/lib/object-util.js
var Mi = _e((Qr) => {
  "use strict";
  Object.defineProperty(Qr, "__esModule", { value: !0 });
  Qr.getDeepObject = Vh;
  Qr.stringifyObject = ku;
  var eo = Xr(), Wh = Ai();
  function jh(e) {
    return e === "__proto__" || e === "constructor" || e === "prototype";
  }
  s(jh, "isPrototypeKey");
  function Vh(e, t, o, i, n) {
    if (jh(t))
      return e;
    let r = e[t];
    return typeof r == "object" && r !== null ? r : !i && (n || typeof o == "number" || typeof o == "string" && o * 0 === 0 && o.indexOf(".") ===
    -1) ? e[t] = [] : e[t] = {};
  }
  s(Vh, "getDeepObject");
  var $h = 20, Kh = "[]", Uh = "[", qh = "]", Gh = ".";
  function ku(e, t, o = 0, i, n) {
    let { nestingSyntax: r = eo.defaultOptions.nestingSyntax, arrayRepeat: l = eo.defaultOptions.arrayRepeat, arrayRepeatSyntax: u = eo.defaultOptions.
    arrayRepeatSyntax, nesting: p = eo.defaultOptions.nesting, delimiter: c = eo.defaultOptions.delimiter, valueSerializer: d = eo.defaultOptions.
    valueSerializer, shouldSerializeObject: m = eo.defaultOptions.shouldSerializeObject } = t, f = typeof c == "number" ? String.fromCharCode(
    c) : c, y = n === !0 && l, h = r === "dot" || r === "js" && !n;
    if (o > $h)
      return "";
    let v = "", I = !0, C = !1;
    for (let b in e) {
      let x = e[b], g;
      i ? (g = i, y ? u === "bracket" && (g += Kh) : h ? (g += Gh, g += b) : (g += Uh, g += b, g += qh)) : g = b, I || (v += f), typeof x ==
      "object" && x !== null && !m(x) ? (C = x.pop !== void 0, (p || l && C) && (v += ku(x, t, o + 1, g, C))) : (v += (0, Wh.encodeString)(g),
      v += "=", v += d(x, b)), I && (I = !1);
    }
    return v;
  }
  s(ku, "stringifyObject");
});

// ../node_modules/fast-decode-uri-component/index.js
var Du = _e((XO, Au) => {
  "use strict";
  var Ou = 12, Yh = 0, Li = [
    // The first part of the table maps bytes to character to a transition.
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    4,
    4,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    6,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    8,
    7,
    7,
    10,
    9,
    9,
    9,
    11,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    // The second part of the table maps a state to a new state when adding a
    // transition.
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    12,
    0,
    0,
    0,
    0,
    24,
    36,
    48,
    60,
    72,
    84,
    96,
    0,
    12,
    12,
    12,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    24,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    24,
    24,
    24,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    24,
    24,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    48,
    48,
    48,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    48,
    48,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    48,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // The third part maps the current transition to a mask that needs to apply
    // to the byte.
    127,
    63,
    63,
    63,
    0,
    31,
    15,
    15,
    15,
    7,
    7,
    7
  ];
  function Xh(e) {
    var t = e.indexOf("%");
    if (t === -1) return e;
    for (var o = e.length, i = "", n = 0, r = 0, l = t, u = Ou; t > -1 && t < o; ) {
      var p = Pu(e[t + 1], 4), c = Pu(e[t + 2], 0), d = p | c, m = Li[d];
      if (u = Li[256 + u + m], r = r << 6 | d & Li[364 + m], u === Ou)
        i += e.slice(n, l), i += r <= 65535 ? String.fromCharCode(r) : String.fromCharCode(
          55232 + (r >> 10),
          56320 + (r & 1023)
        ), r = 0, n = t + 3, t = l = e.indexOf("%", n);
      else {
        if (u === Yh)
          return null;
        if (t += 3, t < o && e.charCodeAt(t) === 37) continue;
        return null;
      }
    }
    return i + e.slice(n);
  }
  s(Xh, "decodeURIComponent");
  var Qh = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    a: 10,
    A: 10,
    b: 11,
    B: 11,
    c: 12,
    C: 12,
    d: 13,
    D: 13,
    e: 14,
    E: 14,
    f: 15,
    F: 15
  };
  function Pu(e, t) {
    var o = Qh[e];
    return o === void 0 ? 255 : o << t;
  }
  s(Pu, "hexCodeToInt");
  Au.exports = Xh;
});

// ../node_modules/picoquery/lib/parse.js
var Fu = _e((kt) => {
  "use strict";
  var Zh = kt && kt.__importDefault || function(e) {
    return e && e.__esModule ? e : { default: e };
  };
  Object.defineProperty(kt, "__esModule", { value: !0 });
  kt.numberValueDeserializer = kt.numberKeyDeserializer = void 0;
  kt.parse = tg;
  var Zr = Mi(), to = Xr(), Mu = Zh(Du()), Jh = /* @__PURE__ */ s((e) => {
    let t = Number(e);
    return Number.isNaN(t) ? e : t;
  }, "numberKeyDeserializer");
  kt.numberKeyDeserializer = Jh;
  var eg = /* @__PURE__ */ s((e) => {
    let t = Number(e);
    return Number.isNaN(t) ? e : t;
  }, "numberValueDeserializer");
  kt.numberValueDeserializer = eg;
  var Lu = /\+/g, Nu = /* @__PURE__ */ s(function() {
  }, "Empty");
  Nu.prototype = /* @__PURE__ */ Object.create(null);
  function Jr(e, t, o, i, n) {
    let r = e.substring(t, o);
    return i && (r = r.replace(Lu, " ")), n && (r = (0, Mu.default)(r) || r), r;
  }
  s(Jr, "computeKeySlice");
  function tg(e, t) {
    let { valueDeserializer: o = to.defaultOptions.valueDeserializer, keyDeserializer: i = to.defaultOptions.keyDeserializer, arrayRepeatSyntax: n = to.
    defaultOptions.arrayRepeatSyntax, nesting: r = to.defaultOptions.nesting, arrayRepeat: l = to.defaultOptions.arrayRepeat, nestingSyntax: u = to.
    defaultOptions.nestingSyntax, delimiter: p = to.defaultOptions.delimiter } = t ?? {}, c = typeof p == "string" ? p.charCodeAt(0) : p, d = u ===
    "js", m = new Nu();
    if (typeof e != "string")
      return m;
    let f = e.length, y = "", h = -1, v = -1, I = -1, C = m, b, x = "", g = "", w = !1, T = !1, _ = !1, k = !1, E = !1, O = !1, P = !1, A = 0,
    D = -1, L = -1, B = -1;
    for (let N = 0; N < f + 1; N++) {
      if (A = N !== f ? e.charCodeAt(N) : c, A === c) {
        if (P = v > h, P || (v = N), I !== v - 1 && (g = Jr(e, I + 1, D > -1 ? D : v, _, w), x = i(g), b !== void 0 && (C = (0, Zr.getDeepObject)(
        C, b, x, d && E, d && O))), P || x !== "") {
          P && (y = e.slice(v + 1, N), k && (y = y.replace(Lu, " ")), T && (y = (0, Mu.default)(y) || y));
          let V = o(y, x);
          if (l) {
            let R = C[x];
            R === void 0 ? D > -1 ? C[x] = [V] : C[x] = V : R.pop ? R.push(V) : C[x] = [R, V];
          } else
            C[x] = V;
        }
        y = "", h = N, v = N, w = !1, T = !1, _ = !1, k = !1, E = !1, O = !1, D = -1, I = N, C = m, b = void 0, x = "";
      } else A === 93 ? (l && n === "bracket" && B === 91 && (D = L), r && (u === "index" || d) && v <= h && (I !== L && (g = Jr(e, I + 1, N,
      _, w), x = i(g), b !== void 0 && (C = (0, Zr.getDeepObject)(C, b, x, void 0, d)), b = x, _ = !1, w = !1), I = N, O = !0, E = !1)) : A ===
      46 ? r && (u === "dot" || d) && v <= h && (I !== L && (g = Jr(e, I + 1, N, _, w), x = i(g), b !== void 0 && (C = (0, Zr.getDeepObject)(
      C, b, x, d)), b = x, _ = !1, w = !1), E = !0, O = !1, I = N) : A === 91 ? r && (u === "index" || d) && v <= h && (I !== L && (g = Jr(e,
      I + 1, N, _, w), x = i(g), d && b !== void 0 && (C = (0, Zr.getDeepObject)(C, b, x, d)), b = x, _ = !1, w = !1, E = !1, O = !0), I = N) :
      A === 61 ? v <= h ? v = N : T = !0 : A === 43 ? v > h ? k = !0 : _ = !0 : A === 37 && (v > h ? T = !0 : w = !0);
      L = N, B = A;
    }
    return m;
  }
  s(tg, "parse");
});

// ../node_modules/picoquery/lib/stringify.js
var Bu = _e((Ni) => {
  "use strict";
  Object.defineProperty(Ni, "__esModule", { value: !0 });
  Ni.stringify = rg;
  var og = Mi();
  function rg(e, t) {
    if (e === null || typeof e != "object")
      return "";
    let o = t ?? {};
    return (0, og.stringifyObject)(e, o);
  }
  s(rg, "stringify");
});

// ../node_modules/picoquery/lib/main.js
var Hu = _e((dt) => {
  "use strict";
  var ng = dt && dt.__createBinding || (Object.create ? function(e, t, o, i) {
    i === void 0 && (i = o);
    var n = Object.getOwnPropertyDescriptor(t, o);
    (!n || ("get" in n ? !t.__esModule : n.writable || n.configurable)) && (n = { enumerable: !0, get: /* @__PURE__ */ s(function() {
      return t[o];
    }, "get") }), Object.defineProperty(e, i, n);
  } : function(e, t, o, i) {
    i === void 0 && (i = o), e[i] = t[o];
  }), ig = dt && dt.__exportStar || function(e, t) {
    for (var o in e) o !== "default" && !Object.prototype.hasOwnProperty.call(t, o) && ng(t, e, o);
  };
  Object.defineProperty(dt, "__esModule", { value: !0 });
  dt.stringify = dt.parse = void 0;
  var sg = Fu();
  Object.defineProperty(dt, "parse", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return sg.parse;
  }, "get") });
  var ag = Bu();
  Object.defineProperty(dt, "stringify", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return ag.stringify;
  }, "get") });
  ig(Xr(), dt);
});

// ../node_modules/toggle-selection/index.js
var $u = _e((xP, Vu) => {
  Vu.exports = function() {
    var e = document.getSelection();
    if (!e.rangeCount)
      return function() {
      };
    for (var t = document.activeElement, o = [], i = 0; i < e.rangeCount; i++)
      o.push(e.getRangeAt(i));
    switch (t.tagName.toUpperCase()) {
      // .toUpperCase handles XHTML
      case "INPUT":
      case "TEXTAREA":
        t.blur();
        break;
      default:
        t = null;
        break;
    }
    return e.removeAllRanges(), function() {
      e.type === "Caret" && e.removeAllRanges(), e.rangeCount || o.forEach(function(n) {
        e.addRange(n);
      }), t && t.focus();
    };
  };
});

// ../node_modules/copy-to-clipboard/index.js
var qu = _e((IP, Uu) => {
  "use strict";
  var fg = $u(), Ku = {
    "text/plain": "Text",
    "text/html": "Url",
    default: "Text"
  }, mg = "Copy to clipboard: #{key}, Enter";
  function hg(e) {
    var t = (/mac os x/i.test(navigator.userAgent) ? "\u2318" : "Ctrl") + "+C";
    return e.replace(/#{\s*key\s*}/g, t);
  }
  s(hg, "format");
  function gg(e, t) {
    var o, i, n, r, l, u, p = !1;
    t || (t = {}), o = t.debug || !1;
    try {
      n = fg(), r = document.createRange(), l = document.getSelection(), u = document.createElement("span"), u.textContent = e, u.ariaHidden =
      "true", u.style.all = "unset", u.style.position = "fixed", u.style.top = 0, u.style.clip = "rect(0, 0, 0, 0)", u.style.whiteSpace = "p\
re", u.style.webkitUserSelect = "text", u.style.MozUserSelect = "text", u.style.msUserSelect = "text", u.style.userSelect = "text", u.addEventListener(
      "copy", function(d) {
        if (d.stopPropagation(), t.format)
          if (d.preventDefault(), typeof d.clipboardData > "u") {
            o && console.warn("unable to use e.clipboardData"), o && console.warn("trying IE specific stuff"), window.clipboardData.clearData();
            var m = Ku[t.format] || Ku.default;
            window.clipboardData.setData(m, e);
          } else
            d.clipboardData.clearData(), d.clipboardData.setData(t.format, e);
        t.onCopy && (d.preventDefault(), t.onCopy(d.clipboardData));
      }), document.body.appendChild(u), r.selectNodeContents(u), l.addRange(r);
      var c = document.execCommand("copy");
      if (!c)
        throw new Error("copy command was unsuccessful");
      p = !0;
    } catch (d) {
      o && console.error("unable to copy using execCommand: ", d), o && console.warn("trying IE specific stuff");
      try {
        window.clipboardData.setData(t.format || "text", e), t.onCopy && t.onCopy(window.clipboardData), p = !0;
      } catch (m) {
        o && console.error("unable to copy using clipboardData: ", m), o && console.error("falling back to prompt"), i = hg("message" in t ?
        t.message : mg), window.prompt(i, e);
      }
    } finally {
      l && (typeof l.removeRange == "function" ? l.removeRange(r) : l.removeAllRanges()), u && document.body.removeChild(u), n();
    }
    return p;
  }
  s(gg, "copy");
  Uu.exports = gg;
});

// ../node_modules/downshift/node_modules/react-is/cjs/react-is.production.min.js
var Kc = _e((de) => {
  "use strict";
  var qi = Symbol.for("react.element"), Gi = Symbol.for("react.portal"), fn = Symbol.for("react.fragment"), mn = Symbol.for("react.strict_mo\
de"), hn = Symbol.for("react.profiler"), gn = Symbol.for("react.provider"), yn = Symbol.for("react.context"), lv = Symbol.for("react.server_\
context"), vn = Symbol.for("react.forward_ref"), bn = Symbol.for("react.suspense"), xn = Symbol.for("react.suspense_list"), In = Symbol.for(
  "react.memo"), Sn = Symbol.for("react.lazy"), uv = Symbol.for("react.offscreen"), $c;
  $c = Symbol.for("react.module.reference");
  function ot(e) {
    if (typeof e == "object" && e !== null) {
      var t = e.$$typeof;
      switch (t) {
        case qi:
          switch (e = e.type, e) {
            case fn:
            case hn:
            case mn:
            case bn:
            case xn:
              return e;
            default:
              switch (e = e && e.$$typeof, e) {
                case lv:
                case yn:
                case vn:
                case Sn:
                case In:
                case gn:
                  return e;
                default:
                  return t;
              }
          }
        case Gi:
          return t;
      }
    }
  }
  s(ot, "v");
  de.ContextConsumer = yn;
  de.ContextProvider = gn;
  de.Element = qi;
  de.ForwardRef = vn;
  de.Fragment = fn;
  de.Lazy = Sn;
  de.Memo = In;
  de.Portal = Gi;
  de.Profiler = hn;
  de.StrictMode = mn;
  de.Suspense = bn;
  de.SuspenseList = xn;
  de.isAsyncMode = function() {
    return !1;
  };
  de.isConcurrentMode = function() {
    return !1;
  };
  de.isContextConsumer = function(e) {
    return ot(e) === yn;
  };
  de.isContextProvider = function(e) {
    return ot(e) === gn;
  };
  de.isElement = function(e) {
    return typeof e == "object" && e !== null && e.$$typeof === qi;
  };
  de.isForwardRef = function(e) {
    return ot(e) === vn;
  };
  de.isFragment = function(e) {
    return ot(e) === fn;
  };
  de.isLazy = function(e) {
    return ot(e) === Sn;
  };
  de.isMemo = function(e) {
    return ot(e) === In;
  };
  de.isPortal = function(e) {
    return ot(e) === Gi;
  };
  de.isProfiler = function(e) {
    return ot(e) === hn;
  };
  de.isStrictMode = function(e) {
    return ot(e) === mn;
  };
  de.isSuspense = function(e) {
    return ot(e) === bn;
  };
  de.isSuspenseList = function(e) {
    return ot(e) === xn;
  };
  de.isValidElementType = function(e) {
    return typeof e == "string" || typeof e == "function" || e === fn || e === hn || e === mn || e === bn || e === xn || e === uv || typeof e ==
    "object" && e !== null && (e.$$typeof === Sn || e.$$typeof === In || e.$$typeof === gn || e.$$typeof === yn || e.$$typeof === vn || e.$$typeof ===
    $c || e.getModuleId !== void 0);
  };
  de.typeOf = ot;
});

// ../node_modules/downshift/node_modules/react-is/index.js
var qc = _e((VN, Uc) => {
  "use strict";
  Uc.exports = Kc();
});

// ../node_modules/fuse.js/dist/fuse.js
var tf = _e((ar, Rs) => {
  (function(e, t) {
    typeof ar == "object" && typeof Rs == "object" ? Rs.exports = t() : typeof define == "function" && define.amd ? define("Fuse", [], t) : typeof ar ==
    "object" ? ar.Fuse = t() : e.Fuse = t();
  })(ar, function() {
    return function(e) {
      var t = {};
      function o(i) {
        if (t[i]) return t[i].exports;
        var n = t[i] = { i, l: !1, exports: {} };
        return e[i].call(n.exports, n, n.exports, o), n.l = !0, n.exports;
      }
      return s(o, "r"), o.m = e, o.c = t, o.d = function(i, n, r) {
        o.o(i, n) || Object.defineProperty(i, n, { enumerable: !0, get: r });
      }, o.r = function(i) {
        typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(i, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(
        i, "__esModule", { value: !0 });
      }, o.t = function(i, n) {
        if (1 & n && (i = o(i)), 8 & n || 4 & n && typeof i == "object" && i && i.__esModule) return i;
        var r = /* @__PURE__ */ Object.create(null);
        if (o.r(r), Object.defineProperty(r, "default", { enumerable: !0, value: i }), 2 & n && typeof i != "string") for (var l in i) o.d(r,
        l, (function(u) {
          return i[u];
        }).bind(null, l));
        return r;
      }, o.n = function(i) {
        var n = i && i.__esModule ? function() {
          return i.default;
        } : function() {
          return i;
        };
        return o.d(n, "a", n), n;
      }, o.o = function(i, n) {
        return Object.prototype.hasOwnProperty.call(i, n);
      }, o.p = "", o(o.s = 0);
    }([function(e, t, o) {
      function i(d) {
        return (i = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(m) {
          return typeof m;
        } : function(m) {
          return m && typeof Symbol == "function" && m.constructor === Symbol && m !== Symbol.prototype ? "symbol" : typeof m;
        })(d);
      }
      s(i, "n");
      function n(d, m) {
        for (var f = 0; f < m.length; f++) {
          var y = m[f];
          y.enumerable = y.enumerable || !1, y.configurable = !0, "value" in y && (y.writable = !0), Object.defineProperty(d, y.key, y);
        }
      }
      s(n, "o");
      var r = o(1), l = o(7), u = l.get, p = (l.deepValue, l.isArray), c = function() {
        function d(h, v) {
          var I = v.location, C = I === void 0 ? 0 : I, b = v.distance, x = b === void 0 ? 100 : b, g = v.threshold, w = g === void 0 ? 0.6 :
          g, T = v.maxPatternLength, _ = T === void 0 ? 32 : T, k = v.caseSensitive, E = k !== void 0 && k, O = v.tokenSeparator, P = O === void 0 ?
          / +/g : O, A = v.findAllMatches, D = A !== void 0 && A, L = v.minMatchCharLength, B = L === void 0 ? 1 : L, N = v.id, V = N === void 0 ?
          null : N, R = v.keys, K = R === void 0 ? [] : R, W = v.shouldSort, ee = W === void 0 || W, H = v.getFn, j = H === void 0 ? u : H, F = v.
          sortFn, $ = F === void 0 ? function(ue, be) {
            return ue.score - be.score;
          } : F, X = v.tokenize, oe = X !== void 0 && X, J = v.matchAllTokens, ae = J !== void 0 && J, ie = v.includeMatches, se = ie !== void 0 &&
          ie, le = v.includeScore, ve = le !== void 0 && le, he = v.verbose, Pe = he !== void 0 && he;
          (function(ue, be) {
            if (!(ue instanceof be)) throw new TypeError("Cannot call a class as a function");
          })(this, d), this.options = { location: C, distance: x, threshold: w, maxPatternLength: _, isCaseSensitive: E, tokenSeparator: P, findAllMatches: D,
          minMatchCharLength: B, id: V, keys: K, includeMatches: se, includeScore: ve, shouldSort: ee, getFn: j, sortFn: $, verbose: Pe, tokenize: oe,
          matchAllTokens: ae }, this.setCollection(h), this._processKeys(K);
        }
        s(d, "e");
        var m, f, y;
        return m = d, (f = [{ key: "setCollection", value: /* @__PURE__ */ s(function(h) {
          return this.list = h, h;
        }, "value") }, { key: "_processKeys", value: /* @__PURE__ */ s(function(h) {
          if (this._keyWeights = {}, this._keyNames = [], h.length && typeof h[0] == "string") for (var v = 0, I = h.length; v < I; v += 1) {
            var C = h[v];
            this._keyWeights[C] = 1, this._keyNames.push(C);
          }
          else {
            for (var b = null, x = null, g = 0, w = 0, T = h.length; w < T; w += 1) {
              var _ = h[w];
              if (!_.hasOwnProperty("name")) throw new Error('Missing "name" property in key object');
              var k = _.name;
              if (this._keyNames.push(k), !_.hasOwnProperty("weight")) throw new Error('Missing "weight" property in key object');
              var E = _.weight;
              if (E < 0 || E > 1) throw new Error('"weight" property in key must bein the range of [0, 1)');
              x = x == null ? E : Math.max(x, E), b = b == null ? E : Math.min(b, E), this._keyWeights[k] = E, g += E;
            }
            if (g > 1) throw new Error("Total of weights cannot exceed 1");
          }
        }, "value") }, { key: "search", value: /* @__PURE__ */ s(function(h) {
          var v = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : { limit: !1 };
          this._log(`---------
Search pattern: "`.concat(h, '"'));
          var I = this._prepareSearchers(h), C = I.tokenSearchers, b = I.fullSearcher, x = this._search(C, b);
          return this._computeScore(x), this.options.shouldSort && this._sort(x), v.limit && typeof v.limit == "number" && (x = x.slice(0, v.
          limit)), this._format(x);
        }, "value") }, { key: "_prepareSearchers", value: /* @__PURE__ */ s(function() {
          var h = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", v = [];
          if (this.options.tokenize) for (var I = h.split(this.options.tokenSeparator), C = 0, b = I.length; C < b; C += 1) v.push(new r(I[C],
          this.options));
          return { tokenSearchers: v, fullSearcher: new r(h, this.options) };
        }, "value") }, { key: "_search", value: /* @__PURE__ */ s(function() {
          var h = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [], v = arguments.length > 1 ? arguments[1] : void 0, I = this.
          list, C = {}, b = [];
          if (typeof I[0] == "string") {
            for (var x = 0, g = I.length; x < g; x += 1) this._analyze({ key: "", value: I[x], record: x, index: x }, { resultMap: C, results: b,
            tokenSearchers: h, fullSearcher: v });
            return b;
          }
          for (var w = 0, T = I.length; w < T; w += 1) for (var _ = I[w], k = 0, E = this._keyNames.length; k < E; k += 1) {
            var O = this._keyNames[k];
            this._analyze({ key: O, value: this.options.getFn(_, O), record: _, index: w }, { resultMap: C, results: b, tokenSearchers: h, fullSearcher: v });
          }
          return b;
        }, "value") }, { key: "_analyze", value: /* @__PURE__ */ s(function(h, v) {
          var I = this, C = h.key, b = h.arrayIndex, x = b === void 0 ? -1 : b, g = h.value, w = h.record, T = h.index, _ = v.tokenSearchers,
          k = _ === void 0 ? [] : _, E = v.fullSearcher, O = v.resultMap, P = O === void 0 ? {} : O, A = v.results, D = A === void 0 ? [] : A;
          (/* @__PURE__ */ s(function L(B, N, V, R) {
            if (N != null) {
              if (typeof N == "string") {
                var K = !1, W = -1, ee = 0;
                I._log(`
Key: `.concat(C === "" ? "--" : C));
                var H = E.search(N);
                if (I._log('Full text: "'.concat(N, '", score: ').concat(H.score)), I.options.tokenize) {
                  for (var j = N.split(I.options.tokenSeparator), F = j.length, $ = [], X = 0, oe = k.length; X < oe; X += 1) {
                    var J = k[X];
                    I._log(`
Pattern: "`.concat(J.pattern, '"'));
                    for (var ae = !1, ie = 0; ie < F; ie += 1) {
                      var se = j[ie], le = J.search(se), ve = {};
                      le.isMatch ? (ve[se] = le.score, K = !0, ae = !0, $.push(le.score)) : (ve[se] = 1, I.options.matchAllTokens || $.push(
                      1)), I._log('Token: "'.concat(se, '", score: ').concat(ve[se]));
                    }
                    ae && (ee += 1);
                  }
                  W = $[0];
                  for (var he = $.length, Pe = 1; Pe < he; Pe += 1) W += $[Pe];
                  W /= he, I._log("Token score average:", W);
                }
                var ue = H.score;
                W > -1 && (ue = (ue + W) / 2), I._log("Score average:", ue);
                var be = !I.options.tokenize || !I.options.matchAllTokens || ee >= k.length;
                if (I._log(`
Check Matches: `.concat(be)), (K || H.isMatch) && be) {
                  var Te = { key: C, arrayIndex: B, value: N, score: ue };
                  I.options.includeMatches && (Te.matchedIndices = H.matchedIndices);
                  var Re = P[R];
                  Re ? Re.output.push(Te) : (P[R] = { item: V, output: [Te] }, D.push(P[R]));
                }
              } else if (p(N)) for (var Le = 0, Se = N.length; Le < Se; Le += 1) L(Le, N[Le], V, R);
            }
          }, "e"))(x, g, w, T);
        }, "value") }, { key: "_computeScore", value: /* @__PURE__ */ s(function(h) {
          this._log(`

Computing score:
`);
          for (var v = this._keyWeights, I = !!Object.keys(v).length, C = 0, b = h.length; C < b; C += 1) {
            for (var x = h[C], g = x.output, w = g.length, T = 1, _ = 0; _ < w; _ += 1) {
              var k = g[_], E = k.key, O = I ? v[E] : 1, P = k.score === 0 && v && v[E] > 0 ? Number.EPSILON : k.score;
              T *= Math.pow(P, O);
            }
            x.score = T, this._log(x);
          }
        }, "value") }, { key: "_sort", value: /* @__PURE__ */ s(function(h) {
          this._log(`

Sorting....`), h.sort(this.options.sortFn);
        }, "value") }, { key: "_format", value: /* @__PURE__ */ s(function(h) {
          var v = [];
          if (this.options.verbose) {
            var I = [];
            this._log(`

Output:

`, JSON.stringify(h, function(k, E) {
              if (i(E) === "object" && E !== null) {
                if (I.indexOf(E) !== -1) return;
                I.push(E);
              }
              return E;
            }, 2)), I = null;
          }
          var C = [];
          this.options.includeMatches && C.push(function(k, E) {
            var O = k.output;
            E.matches = [];
            for (var P = 0, A = O.length; P < A; P += 1) {
              var D = O[P];
              if (D.matchedIndices.length !== 0) {
                var L = { indices: D.matchedIndices, value: D.value };
                D.key && (L.key = D.key), D.hasOwnProperty("arrayIndex") && D.arrayIndex > -1 && (L.arrayIndex = D.arrayIndex), E.matches.push(
                L);
              }
            }
          }), this.options.includeScore && C.push(function(k, E) {
            E.score = k.score;
          });
          for (var b = 0, x = h.length; b < x; b += 1) {
            var g = h[b];
            if (this.options.id && (g.item = this.options.getFn(g.item, this.options.id)[0]), C.length) {
              for (var w = { item: g.item }, T = 0, _ = C.length; T < _; T += 1) C[T](g, w);
              v.push(w);
            } else v.push(g.item);
          }
          return v;
        }, "value") }, { key: "_log", value: /* @__PURE__ */ s(function() {
          var h;
          this.options.verbose && (h = console).log.apply(h, arguments);
        }, "value") }]) && n(m.prototype, f), y && n(m, y), d;
      }();
      e.exports = c;
    }, function(e, t, o) {
      function i(p, c) {
        for (var d = 0; d < c.length; d++) {
          var m = c[d];
          m.enumerable = m.enumerable || !1, m.configurable = !0, "value" in m && (m.writable = !0), Object.defineProperty(p, m.key, m);
        }
      }
      s(i, "n");
      var n = o(2), r = o(3), l = o(6), u = function() {
        function p(f, y) {
          var h = y.location, v = h === void 0 ? 0 : h, I = y.distance, C = I === void 0 ? 100 : I, b = y.threshold, x = b === void 0 ? 0.6 :
          b, g = y.maxPatternLength, w = g === void 0 ? 32 : g, T = y.isCaseSensitive, _ = T !== void 0 && T, k = y.tokenSeparator, E = k ===
          void 0 ? / +/g : k, O = y.findAllMatches, P = O !== void 0 && O, A = y.minMatchCharLength, D = A === void 0 ? 1 : A, L = y.includeMatches,
          B = L !== void 0 && L;
          (function(N, V) {
            if (!(N instanceof V)) throw new TypeError("Cannot call a class as a function");
          })(this, p), this.options = { location: v, distance: C, threshold: x, maxPatternLength: w, isCaseSensitive: _, tokenSeparator: E, findAllMatches: P,
          includeMatches: B, minMatchCharLength: D }, this.pattern = _ ? f : f.toLowerCase(), this.pattern.length <= w && (this.patternAlphabet =
          l(this.pattern));
        }
        s(p, "e");
        var c, d, m;
        return c = p, (d = [{ key: "search", value: /* @__PURE__ */ s(function(f) {
          var y = this.options, h = y.isCaseSensitive, v = y.includeMatches;
          if (h || (f = f.toLowerCase()), this.pattern === f) {
            var I = { isMatch: !0, score: 0 };
            return v && (I.matchedIndices = [[0, f.length - 1]]), I;
          }
          var C = this.options, b = C.maxPatternLength, x = C.tokenSeparator;
          if (this.pattern.length > b) return n(f, this.pattern, x);
          var g = this.options, w = g.location, T = g.distance, _ = g.threshold, k = g.findAllMatches, E = g.minMatchCharLength;
          return r(f, this.pattern, this.patternAlphabet, { location: w, distance: T, threshold: _, findAllMatches: k, minMatchCharLength: E,
          includeMatches: v });
        }, "value") }]) && i(c.prototype, d), m && i(c, m), p;
      }();
      e.exports = u;
    }, function(e, t) {
      var o = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;
      e.exports = function(i, n) {
        var r = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : / +/g, l = new RegExp(n.replace(o, "\\$&").replace(r, "|")),
        u = i.match(l), p = !!u, c = [];
        if (p) for (var d = 0, m = u.length; d < m; d += 1) {
          var f = u[d];
          c.push([i.indexOf(f), f.length - 1]);
        }
        return { score: p ? 0.5 : 1, isMatch: p, matchedIndices: c };
      };
    }, function(e, t, o) {
      var i = o(4), n = o(5);
      e.exports = function(r, l, u, p) {
        for (var c = p.location, d = c === void 0 ? 0 : c, m = p.distance, f = m === void 0 ? 100 : m, y = p.threshold, h = y === void 0 ? 0.6 :
        y, v = p.findAllMatches, I = v !== void 0 && v, C = p.minMatchCharLength, b = C === void 0 ? 1 : C, x = p.includeMatches, g = x !== void 0 &&
        x, w = d, T = r.length, _ = h, k = r.indexOf(l, w), E = l.length, O = [], P = 0; P < T; P += 1) O[P] = 0;
        if (k !== -1) {
          var A = i(l, { errors: 0, currentLocation: k, expectedLocation: w, distance: f });
          if (_ = Math.min(A, _), (k = r.lastIndexOf(l, w + E)) !== -1) {
            var D = i(l, { errors: 0, currentLocation: k, expectedLocation: w, distance: f });
            _ = Math.min(D, _);
          }
        }
        k = -1;
        for (var L = [], B = 1, N = E + T, V = 1 << (E <= 31 ? E - 1 : 30), R = 0; R < E; R += 1) {
          for (var K = 0, W = N; K < W; )
            i(l, { errors: R, currentLocation: w + W, expectedLocation: w, distance: f }) <= _ ? K = W : N = W, W = Math.floor((N - K) / 2 +
            K);
          N = W;
          var ee = Math.max(1, w - W + 1), H = I ? T : Math.min(w + W, T) + E, j = Array(H + 2);
          j[H + 1] = (1 << R) - 1;
          for (var F = H; F >= ee; F -= 1) {
            var $ = F - 1, X = u[r.charAt($)];
            if (X && (O[$] = 1), j[F] = (j[F + 1] << 1 | 1) & X, R !== 0 && (j[F] |= (L[F + 1] | L[F]) << 1 | 1 | L[F + 1]), j[F] & V && (B =
            i(l, { errors: R, currentLocation: $, expectedLocation: w, distance: f })) <= _) {
              if (_ = B, (k = $) <= w) break;
              ee = Math.max(1, 2 * w - k);
            }
          }
          if (i(l, { errors: R + 1, currentLocation: w, expectedLocation: w, distance: f }) > _) break;
          L = j;
        }
        var oe = { isMatch: k >= 0, score: B === 0 ? 1e-3 : B };
        return g && (oe.matchedIndices = n(O, b)), oe;
      };
    }, function(e, t) {
      e.exports = function(o, i) {
        var n = i.errors, r = n === void 0 ? 0 : n, l = i.currentLocation, u = l === void 0 ? 0 : l, p = i.expectedLocation, c = p === void 0 ?
        0 : p, d = i.distance, m = d === void 0 ? 100 : d, f = r / o.length, y = Math.abs(c - u);
        return m ? f + y / m : y ? 1 : f;
      };
    }, function(e, t) {
      e.exports = function() {
        for (var o = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [], i = arguments.length > 1 && arguments[1] !== void 0 ?
        arguments[1] : 1, n = [], r = -1, l = -1, u = 0, p = o.length; u < p; u += 1) {
          var c = o[u];
          c && r === -1 ? r = u : c || r === -1 || ((l = u - 1) - r + 1 >= i && n.push([r, l]), r = -1);
        }
        return o[u - 1] && u - r >= i && n.push([r, u - 1]), n;
      };
    }, function(e, t) {
      e.exports = function(o) {
        for (var i = {}, n = o.length, r = 0; r < n; r += 1) i[o.charAt(r)] = 0;
        for (var l = 0; l < n; l += 1) i[o.charAt(l)] |= 1 << n - l - 1;
        return i;
      };
    }, function(e, t) {
      var o = /* @__PURE__ */ s(function(l) {
        return Array.isArray ? Array.isArray(l) : Object.prototype.toString.call(l) === "[object Array]";
      }, "r"), i = /* @__PURE__ */ s(function(l) {
        return l == null ? "" : function(u) {
          if (typeof u == "string") return u;
          var p = u + "";
          return p == "0" && 1 / u == -1 / 0 ? "-0" : p;
        }(l);
      }, "n"), n = /* @__PURE__ */ s(function(l) {
        return typeof l == "string";
      }, "o"), r = /* @__PURE__ */ s(function(l) {
        return typeof l == "number";
      }, "i");
      e.exports = { get: /* @__PURE__ */ s(function(l, u) {
        var p = [];
        return (/* @__PURE__ */ s(function c(d, m) {
          if (m) {
            var f = m.indexOf("."), y = m, h = null;
            f !== -1 && (y = m.slice(0, f), h = m.slice(f + 1));
            var v = d[y];
            if (v != null) if (h || !n(v) && !r(v)) if (o(v)) for (var I = 0, C = v.length; I < C; I += 1) c(v[I], h);
            else h && c(v, h);
            else p.push(i(v));
          } else p.push(d);
        }, "e"))(l, u), p;
      }, "get"), isArray: o, isString: n, isNum: r, toString: i };
    }]);
  });
});

// ../node_modules/store2/dist/store2.js
var jf = _e((Kn, Un) => {
  (function(e, t) {
    var o = {
      version: "2.14.2",
      areas: {},
      apis: {},
      nsdelim: ".",
      // utilities
      inherit: /* @__PURE__ */ s(function(n, r) {
        for (var l in n)
          r.hasOwnProperty(l) || Object.defineProperty(r, l, Object.getOwnPropertyDescriptor(n, l));
        return r;
      }, "inherit"),
      stringify: /* @__PURE__ */ s(function(n, r) {
        return n === void 0 || typeof n == "function" ? n + "" : JSON.stringify(n, r || o.replace);
      }, "stringify"),
      parse: /* @__PURE__ */ s(function(n, r) {
        try {
          return JSON.parse(n, r || o.revive);
        } catch {
          return n;
        }
      }, "parse"),
      // extension hooks
      fn: /* @__PURE__ */ s(function(n, r) {
        o.storeAPI[n] = r;
        for (var l in o.apis)
          o.apis[l][n] = r;
      }, "fn"),
      get: /* @__PURE__ */ s(function(n, r) {
        return n.getItem(r);
      }, "get"),
      set: /* @__PURE__ */ s(function(n, r, l) {
        n.setItem(r, l);
      }, "set"),
      remove: /* @__PURE__ */ s(function(n, r) {
        n.removeItem(r);
      }, "remove"),
      key: /* @__PURE__ */ s(function(n, r) {
        return n.key(r);
      }, "key"),
      length: /* @__PURE__ */ s(function(n) {
        return n.length;
      }, "length"),
      clear: /* @__PURE__ */ s(function(n) {
        n.clear();
      }, "clear"),
      // core functions
      Store: /* @__PURE__ */ s(function(n, r, l) {
        var u = o.inherit(o.storeAPI, function(c, d, m) {
          return arguments.length === 0 ? u.getAll() : typeof d == "function" ? u.transact(c, d, m) : d !== void 0 ? u.set(c, d, m) : typeof c ==
          "string" || typeof c == "number" ? u.get(c) : typeof c == "function" ? u.each(c) : c ? u.setAll(c, d) : u.clear();
        });
        u._id = n;
        try {
          var p = "__store2_test";
          r.setItem(p, "ok"), u._area = r, r.removeItem(p);
        } catch {
          u._area = o.storage("fake");
        }
        return u._ns = l || "", o.areas[n] || (o.areas[n] = u._area), o.apis[u._ns + u._id] || (o.apis[u._ns + u._id] = u), u;
      }, "Store"),
      storeAPI: {
        // admin functions
        area: /* @__PURE__ */ s(function(n, r) {
          var l = this[n];
          return (!l || !l.area) && (l = o.Store(n, r, this._ns), this[n] || (this[n] = l)), l;
        }, "area"),
        namespace: /* @__PURE__ */ s(function(n, r, l) {
          if (l = l || this._delim || o.nsdelim, !n)
            return this._ns ? this._ns.substring(0, this._ns.length - l.length) : "";
          var u = n, p = this[u];
          if ((!p || !p.namespace) && (p = o.Store(this._id, this._area, this._ns + u + l), p._delim = l, this[u] || (this[u] = p), !r))
            for (var c in o.areas)
              p.area(c, o.areas[c]);
          return p;
        }, "namespace"),
        isFake: /* @__PURE__ */ s(function(n) {
          return n ? (this._real = this._area, this._area = o.storage("fake")) : n === !1 && (this._area = this._real || this._area), this._area.
          name === "fake";
        }, "isFake"),
        toString: /* @__PURE__ */ s(function() {
          return "store" + (this._ns ? "." + this.namespace() : "") + "[" + this._id + "]";
        }, "toString"),
        // storage functions
        has: /* @__PURE__ */ s(function(n) {
          return this._area.has ? this._area.has(this._in(n)) : this._in(n) in this._area;
        }, "has"),
        size: /* @__PURE__ */ s(function() {
          return this.keys().length;
        }, "size"),
        each: /* @__PURE__ */ s(function(n, r) {
          for (var l = 0, u = o.length(this._area); l < u; l++) {
            var p = this._out(o.key(this._area, l));
            if (p !== void 0 && n.call(this, p, this.get(p), r) === !1)
              break;
            u > o.length(this._area) && (u--, l--);
          }
          return r || this;
        }, "each"),
        keys: /* @__PURE__ */ s(function(n) {
          return this.each(function(r, l, u) {
            u.push(r);
          }, n || []);
        }, "keys"),
        get: /* @__PURE__ */ s(function(n, r) {
          var l = o.get(this._area, this._in(n)), u;
          return typeof r == "function" && (u = r, r = null), l !== null ? o.parse(l, u) : r ?? l;
        }, "get"),
        getAll: /* @__PURE__ */ s(function(n) {
          return this.each(function(r, l, u) {
            u[r] = l;
          }, n || {});
        }, "getAll"),
        transact: /* @__PURE__ */ s(function(n, r, l) {
          var u = this.get(n, l), p = r(u);
          return this.set(n, p === void 0 ? u : p), this;
        }, "transact"),
        set: /* @__PURE__ */ s(function(n, r, l) {
          var u = this.get(n), p;
          return u != null && l === !1 ? r : (typeof l == "function" && (p = l, l = void 0), o.set(this._area, this._in(n), o.stringify(r, p),
          l) || u);
        }, "set"),
        setAll: /* @__PURE__ */ s(function(n, r) {
          var l, u;
          for (var p in n)
            u = n[p], this.set(p, u, r) !== u && (l = !0);
          return l;
        }, "setAll"),
        add: /* @__PURE__ */ s(function(n, r, l) {
          var u = this.get(n);
          if (u instanceof Array)
            r = u.concat(r);
          else if (u !== null) {
            var p = typeof u;
            if (p === typeof r && p === "object") {
              for (var c in r)
                u[c] = r[c];
              r = u;
            } else
              r = u + r;
          }
          return o.set(this._area, this._in(n), o.stringify(r, l)), r;
        }, "add"),
        remove: /* @__PURE__ */ s(function(n, r) {
          var l = this.get(n, r);
          return o.remove(this._area, this._in(n)), l;
        }, "remove"),
        clear: /* @__PURE__ */ s(function() {
          return this._ns ? this.each(function(n) {
            o.remove(this._area, this._in(n));
          }, 1) : o.clear(this._area), this;
        }, "clear"),
        clearAll: /* @__PURE__ */ s(function() {
          var n = this._area;
          for (var r in o.areas)
            o.areas.hasOwnProperty(r) && (this._area = o.areas[r], this.clear());
          return this._area = n, this;
        }, "clearAll"),
        // internal use functions
        _in: /* @__PURE__ */ s(function(n) {
          return typeof n != "string" && (n = o.stringify(n)), this._ns ? this._ns + n : n;
        }, "_in"),
        _out: /* @__PURE__ */ s(function(n) {
          return this._ns ? n && n.indexOf(this._ns) === 0 ? n.substring(this._ns.length) : void 0 : (
            // so each() knows to skip it
            n
          );
        }, "_out")
      },
      // end _.storeAPI
      storage: /* @__PURE__ */ s(function(n) {
        return o.inherit(o.storageAPI, { items: {}, name: n });
      }, "storage"),
      storageAPI: {
        length: 0,
        has: /* @__PURE__ */ s(function(n) {
          return this.items.hasOwnProperty(n);
        }, "has"),
        key: /* @__PURE__ */ s(function(n) {
          var r = 0;
          for (var l in this.items)
            if (this.has(l) && n === r++)
              return l;
        }, "key"),
        setItem: /* @__PURE__ */ s(function(n, r) {
          this.has(n) || this.length++, this.items[n] = r;
        }, "setItem"),
        removeItem: /* @__PURE__ */ s(function(n) {
          this.has(n) && (delete this.items[n], this.length--);
        }, "removeItem"),
        getItem: /* @__PURE__ */ s(function(n) {
          return this.has(n) ? this.items[n] : null;
        }, "getItem"),
        clear: /* @__PURE__ */ s(function() {
          for (var n in this.items)
            this.removeItem(n);
        }, "clear")
      }
      // end _.storageAPI
    }, i = (
      // safely set this up (throws error in IE10/32bit mode for local files)
      o.Store("local", function() {
        try {
          return localStorage;
        } catch {
        }
      }())
    );
    i.local = i, i._ = o, i.area("session", function() {
      try {
        return sessionStorage;
      } catch {
      }
    }()), i.area("page", o.storage("page")), typeof t == "function" && t.amd !== void 0 ? t("store2", [], function() {
      return i;
    }) : typeof Un < "u" && Un.exports ? Un.exports = i : (e.store && (o.conflict = e.store), e.store = i);
  })(Kn, Kn && Kn.define);
});

// global-externals:@storybook/core/channels
var Lx = __STORYBOOK_CHANNELS__, { Channel: Nx, PostMessageTransport: Fx, WebsocketTransport: Bx, createBrowserChannel: ya } = __STORYBOOK_CHANNELS__;

// ../node_modules/@storybook/global/dist/index.mjs
var re = (() => {
  let e;
  return typeof window < "u" ? e = window : typeof globalThis < "u" ? e = globalThis : typeof global < "u" ? e = global : typeof self < "u" ?
  e = self : e = {}, e;
})();

// global-externals:@storybook/core/core-events
var zx = __STORYBOOK_CORE_EVENTS__, { ARGTYPES_INFO_REQUEST: va, ARGTYPES_INFO_RESPONSE: ba, CHANNEL_CREATED: xa, CHANNEL_WS_DISCONNECT: Wx,
CONFIG_ERROR: jx, CREATE_NEW_STORYFILE_REQUEST: Ia, CREATE_NEW_STORYFILE_RESPONSE: Sa, CURRENT_STORY_WAS_SET: Vx, DOCS_PREPARED: $x, DOCS_RENDERED: Kx,
FILE_COMPONENT_SEARCH_REQUEST: wa, FILE_COMPONENT_SEARCH_RESPONSE: hr, FORCE_REMOUNT: Xn, FORCE_RE_RENDER: Ux, GLOBALS_UPDATED: qx, NAVIGATE_URL: Gx,
PLAY_FUNCTION_THREW_EXCEPTION: Yx, PRELOAD_ENTRIES: $t, PREVIEW_BUILDER_PROGRESS: Ea, PREVIEW_KEYDOWN: Xx, REGISTER_SUBSCRIPTION: Qx, REQUEST_WHATS_NEW_DATA: Zx,
RESET_STORY_ARGS: Jx, RESULT_WHATS_NEW_DATA: eI, SAVE_STORY_REQUEST: Ca, SAVE_STORY_RESPONSE: Ta, SELECT_STORY: tI, SET_CONFIG: oI, SET_CURRENT_STORY: _a,
SET_FILTER: rI, SET_GLOBALS: nI, SET_INDEX: iI, SET_STORIES: sI, SET_WHATS_NEW_CACHE: aI, SHARED_STATE_CHANGED: lI, SHARED_STATE_SET: uI, STORIES_COLLAPSE_ALL: Ko,
STORIES_EXPAND_ALL: Qn, STORY_ARGS_UPDATED: pI, STORY_CHANGED: cI, STORY_ERRORED: dI, STORY_INDEX_INVALIDATED: fI, STORY_MISSING: mI, STORY_PREPARED: hI,
STORY_RENDERED: gI, STORY_RENDER_PHASE_CHANGED: yI, STORY_SPECIFIED: vI, STORY_THREW_EXCEPTION: bI, STORY_UNCHANGED: xI, TELEMETRY_ERROR: II,
TESTING_MODULE_CANCEL_TEST_RUN_REQUEST: ka, TESTING_MODULE_CANCEL_TEST_RUN_RESPONSE: SI, TESTING_MODULE_CRASH_REPORT: Zn, TESTING_MODULE_PROGRESS_REPORT: Jn,
TESTING_MODULE_RUN_ALL_REQUEST: gr, TESTING_MODULE_RUN_REQUEST: wI, TESTING_MODULE_WATCH_MODE_REQUEST: Oa, TOGGLE_WHATS_NEW_NOTIFICATIONS: EI,
UNHANDLED_ERRORS_WHILE_PLAYING: CI, UPDATE_GLOBALS: TI, UPDATE_QUERY_PARAMS: _I, UPDATE_STORY_ARGS: kI } = __STORYBOOK_CORE_EVENTS__;

// global-externals:@storybook/core/manager-api
var PI = __STORYBOOK_API__, { ActiveTabs: AI, Consumer: me, ManagerContext: DI, Provider: Pa, RequestResponseError: MI, addons: ut, combineParameters: LI,
controlOrMetaKey: NI, controlOrMetaSymbol: FI, eventMatchesShortcut: BI, eventToShortcut: Aa, experimental_requestResponse: yr, isMacLike: HI,
isShortcutTaken: RI, keyToSymbol: zI, merge: vr, mockChannel: WI, optionOrAltSymbol: jI, shortcutMatchesShortcut: Da, shortcutToHumanString: pt,
types: we, useAddonState: VI, useArgTypes: $I, useArgs: KI, useChannel: UI, useGlobalTypes: qI, useGlobals: GI, useParameter: YI, useSharedState: XI,
useStoryPrepared: QI, useStorybookApi: pe, useStorybookState: Ze } = __STORYBOOK_API__;

// global-externals:react
var a = __REACT__, { Children: JI, Component: Ge, Fragment: Ne, Profiler: eS, PureComponent: tS, StrictMode: oS, Suspense: rS, __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: nS,
cloneElement: Ma, createContext: So, createElement: iS, createFactory: sS, createRef: aS, forwardRef: La, isValidElement: lS, lazy: uS, memo: Uo,
startTransition: pS, unstable_act: cS, useCallback: M, useContext: br, useDebugValue: dS, useDeferredValue: Na, useEffect: z, useId: fS, useImperativeHandle: mS,
useInsertionEffect: hS, useLayoutEffect: Lt, useMemo: Y, useReducer: wo, useRef: G, useState: U, useSyncExternalStore: gS, useTransition: Fa,
version: yS } = __REACT__;

// global-externals:react-dom/client
var vS = __REACT_DOM_CLIENT__, { createRoot: Ba, hydrateRoot: bS } = __REACT_DOM_CLIENT__;

// global-externals:@storybook/core/router
var IS = __STORYBOOK_ROUTER__, { BaseLocationProvider: SS, DEEPLY_EQUAL: wS, Link: Ir, Location: Sr, LocationProvider: Ha, Match: Ra, Route: qo,
buildArgsParam: ES, deepDiff: CS, getMatch: TS, parsePath: _S, queryFromLocation: kS, stringifyQuery: OS, useNavigate: za } = __STORYBOOK_ROUTER__;

// global-externals:@storybook/core/theming
var AS = __STORYBOOK_THEMING__, { CacheProvider: DS, ClassNames: MS, Global: Eo, ThemeProvider: ei, background: LS, color: NS, convert: FS, create: BS,
createCache: HS, createGlobal: Wa, createReset: RS, css: zS, darken: WS, ensure: ja, ignoreSsrWarning: jS, isPropValid: VS, jsx: $S, keyframes: Kt,
lighten: Co, styled: S, themes: KS, typography: US, useTheme: Fe, withTheme: Va } = __STORYBOOK_THEMING__;

// global-externals:@storybook/core/manager-errors
var GS = __STORYBOOK_CORE_EVENTS_MANAGER_ERRORS__, { Category: YS, ProviderDoesNotExtendBaseProviderError: $a, UncaughtManagerError: XS } = __STORYBOOK_CORE_EVENTS_MANAGER_ERRORS__;

// ../node_modules/react-helmet-async/lib/index.module.js
var ne = Ve(ti()), ul = Ve(oi()), ai = Ve(el()), pl = Ve(ol());
function Ee() {
  return Ee = Object.assign || function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var o = arguments[t];
      for (var i in o) Object.prototype.hasOwnProperty.call(o, i) && (e[i] = o[i]);
    }
    return e;
  }, Ee.apply(this, arguments);
}
s(Ee, "a");
function ci(e, t) {
  e.prototype = Object.create(t.prototype), e.prototype.constructor = e, li(e, t);
}
s(ci, "s");
function li(e, t) {
  return li = Object.setPrototypeOf || function(o, i) {
    return o.__proto__ = i, o;
  }, li(e, t);
}
s(li, "c");
function rl(e, t) {
  if (e == null) return {};
  var o, i, n = {}, r = Object.keys(e);
  for (i = 0; i < r.length; i++) t.indexOf(o = r[i]) >= 0 || (n[o] = e[o]);
  return n;
}
s(rl, "u");
var Z = { BASE: "base", BODY: "body", HEAD: "head", HTML: "html", LINK: "link", META: "meta", NOSCRIPT: "noscript", SCRIPT: "script", STYLE: "\
style", TITLE: "title", FRAGMENT: "Symbol(react.fragment)" }, Sm = { rel: ["amphtml", "canonical", "alternate"] }, wm = { type: ["applicatio\
n/ld+json"] }, Em = { charset: "", name: ["robots", "description"], property: ["og:type", "og:title", "og:url", "og:image", "og:image:alt", "\
og:description", "twitter:url", "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt", "twitter:card", "twitter:site"] },
nl = Object.keys(Z).map(function(e) {
  return Z[e];
}), Tr = { accesskey: "accessKey", charset: "charSet", class: "className", contenteditable: "contentEditable", contextmenu: "contextMenu", "\
http-equiv": "httpEquiv", itemprop: "itemProp", tabindex: "tabIndex" }, Cm = Object.keys(Tr).reduce(function(e, t) {
  return e[Tr[t]] = t, e;
}, {}), _o = /* @__PURE__ */ s(function(e, t) {
  for (var o = e.length - 1; o >= 0; o -= 1) {
    var i = e[o];
    if (Object.prototype.hasOwnProperty.call(i, t)) return i[t];
  }
  return null;
}, "T"), Tm = /* @__PURE__ */ s(function(e) {
  var t = _o(e, Z.TITLE), o = _o(e, "titleTemplate");
  if (Array.isArray(t) && (t = t.join("")), o && t) return o.replace(/%s/g, function() {
    return t;
  });
  var i = _o(e, "defaultTitle");
  return t || i || void 0;
}, "g"), _m = /* @__PURE__ */ s(function(e) {
  return _o(e, "onChangeClientState") || function() {
  };
}, "b"), ri = /* @__PURE__ */ s(function(e, t) {
  return t.filter(function(o) {
    return o[e] !== void 0;
  }).map(function(o) {
    return o[e];
  }).reduce(function(o, i) {
    return Ee({}, o, i);
  }, {});
}, "v"), km = /* @__PURE__ */ s(function(e, t) {
  return t.filter(function(o) {
    return o[Z.BASE] !== void 0;
  }).map(function(o) {
    return o[Z.BASE];
  }).reverse().reduce(function(o, i) {
    if (!o.length) for (var n = Object.keys(i), r = 0; r < n.length; r += 1) {
      var l = n[r].toLowerCase();
      if (e.indexOf(l) !== -1 && i[l]) return o.concat(i);
    }
    return o;
  }, []);
}, "A"), Go = /* @__PURE__ */ s(function(e, t, o) {
  var i = {};
  return o.filter(function(n) {
    return !!Array.isArray(n[e]) || (n[e] !== void 0 && console && typeof console.warn == "function" && console.warn("Helmet: " + e + ' shou\
ld be of type "Array". Instead found type "' + typeof n[e] + '"'), !1);
  }).map(function(n) {
    return n[e];
  }).reverse().reduce(function(n, r) {
    var l = {};
    r.filter(function(m) {
      for (var f, y = Object.keys(m), h = 0; h < y.length; h += 1) {
        var v = y[h], I = v.toLowerCase();
        t.indexOf(I) === -1 || f === "rel" && m[f].toLowerCase() === "canonical" || I === "rel" && m[I].toLowerCase() === "stylesheet" || (f =
        I), t.indexOf(v) === -1 || v !== "innerHTML" && v !== "cssText" && v !== "itemprop" || (f = v);
      }
      if (!f || !m[f]) return !1;
      var C = m[f].toLowerCase();
      return i[f] || (i[f] = {}), l[f] || (l[f] = {}), !i[f][C] && (l[f][C] = !0, !0);
    }).reverse().forEach(function(m) {
      return n.push(m);
    });
    for (var u = Object.keys(l), p = 0; p < u.length; p += 1) {
      var c = u[p], d = Ee({}, i[c], l[c]);
      i[c] = d;
    }
    return n;
  }, []).reverse();
}, "C"), Om = /* @__PURE__ */ s(function(e, t) {
  if (Array.isArray(e) && e.length) {
    for (var o = 0; o < e.length; o += 1) if (e[o][t]) return !0;
  }
  return !1;
}, "O"), cl = /* @__PURE__ */ s(function(e) {
  return Array.isArray(e) ? e.join("") : e;
}, "S"), ni = /* @__PURE__ */ s(function(e, t) {
  return Array.isArray(e) ? e.reduce(function(o, i) {
    return function(n, r) {
      for (var l = Object.keys(n), u = 0; u < l.length; u += 1) if (r[l[u]] && r[l[u]].includes(n[l[u]])) return !0;
      return !1;
    }(i, t) ? o.priority.push(i) : o.default.push(i), o;
  }, { priority: [], default: [] }) : { default: e };
}, "E"), il = /* @__PURE__ */ s(function(e, t) {
  var o;
  return Ee({}, e, ((o = {})[t] = void 0, o));
}, "I"), Pm = [Z.NOSCRIPT, Z.SCRIPT, Z.STYLE], ii = /* @__PURE__ */ s(function(e, t) {
  return t === void 0 && (t = !0), t === !1 ? String(e) : String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(
  /"/g, "&quot;").replace(/'/g, "&#x27;");
}, "w"), sl = /* @__PURE__ */ s(function(e) {
  return Object.keys(e).reduce(function(t, o) {
    var i = e[o] !== void 0 ? o + '="' + e[o] + '"' : "" + o;
    return t ? t + " " + i : i;
  }, "");
}, "x"), al = /* @__PURE__ */ s(function(e, t) {
  return t === void 0 && (t = {}), Object.keys(e).reduce(function(o, i) {
    return o[Tr[i] || i] = e[i], o;
  }, t);
}, "L"), Cr = /* @__PURE__ */ s(function(e, t) {
  return t.map(function(o, i) {
    var n, r = ((n = { key: i })["data-rh"] = !0, n);
    return Object.keys(o).forEach(function(l) {
      var u = Tr[l] || l;
      u === "innerHTML" || u === "cssText" ? r.dangerouslySetInnerHTML = { __html: o.innerHTML || o.cssText } : r[u] = o[l];
    }), a.createElement(e, r);
  });
}, "j"), Je = /* @__PURE__ */ s(function(e, t, o) {
  switch (e) {
    case Z.TITLE:
      return { toComponent: /* @__PURE__ */ s(function() {
        return n = t.titleAttributes, (r = { key: i = t.title })["data-rh"] = !0, l = al(n, r), [a.createElement(Z.TITLE, l, i)];
        var i, n, r, l;
      }, "toComponent"), toString: /* @__PURE__ */ s(function() {
        return function(i, n, r, l) {
          var u = sl(r), p = cl(n);
          return u ? "<" + i + ' data-rh="true" ' + u + ">" + ii(p, l) + "</" + i + ">" : "<" + i + ' data-rh="true">' + ii(p, l) + "</" + i +
          ">";
        }(e, t.title, t.titleAttributes, o);
      }, "toString") };
    case "bodyAttributes":
    case "htmlAttributes":
      return { toComponent: /* @__PURE__ */ s(function() {
        return al(t);
      }, "toComponent"), toString: /* @__PURE__ */ s(function() {
        return sl(t);
      }, "toString") };
    default:
      return { toComponent: /* @__PURE__ */ s(function() {
        return Cr(e, t);
      }, "toComponent"), toString: /* @__PURE__ */ s(function() {
        return function(i, n, r) {
          return n.reduce(function(l, u) {
            var p = Object.keys(u).filter(function(m) {
              return !(m === "innerHTML" || m === "cssText");
            }).reduce(function(m, f) {
              var y = u[f] === void 0 ? f : f + '="' + ii(u[f], r) + '"';
              return m ? m + " " + y : y;
            }, ""), c = u.innerHTML || u.cssText || "", d = Pm.indexOf(i) === -1;
            return l + "<" + i + ' data-rh="true" ' + p + (d ? "/>" : ">" + c + "</" + i + ">");
          }, "");
        }(e, t, o);
      }, "toString") };
  }
}, "M"), ui = /* @__PURE__ */ s(function(e) {
  var t = e.baseTag, o = e.bodyAttributes, i = e.encode, n = e.htmlAttributes, r = e.noscriptTags, l = e.styleTags, u = e.title, p = u === void 0 ?
  "" : u, c = e.titleAttributes, d = e.linkTags, m = e.metaTags, f = e.scriptTags, y = { toComponent: /* @__PURE__ */ s(function() {
  }, "toComponent"), toString: /* @__PURE__ */ s(function() {
    return "";
  }, "toString") };
  if (e.prioritizeSeoTags) {
    var h = function(v) {
      var I = v.linkTags, C = v.scriptTags, b = v.encode, x = ni(v.metaTags, Em), g = ni(I, Sm), w = ni(C, wm);
      return { priorityMethods: { toComponent: /* @__PURE__ */ s(function() {
        return [].concat(Cr(Z.META, x.priority), Cr(Z.LINK, g.priority), Cr(Z.SCRIPT, w.priority));
      }, "toComponent"), toString: /* @__PURE__ */ s(function() {
        return Je(Z.META, x.priority, b) + " " + Je(Z.LINK, g.priority, b) + " " + Je(Z.SCRIPT, w.priority, b);
      }, "toString") }, metaTags: x.default, linkTags: g.default, scriptTags: w.default };
    }(e);
    y = h.priorityMethods, d = h.linkTags, m = h.metaTags, f = h.scriptTags;
  }
  return { priority: y, base: Je(Z.BASE, t, i), bodyAttributes: Je("bodyAttributes", o, i), htmlAttributes: Je("htmlAttributes", n, i), link: Je(
  Z.LINK, d, i), meta: Je(Z.META, m, i), noscript: Je(Z.NOSCRIPT, r, i), script: Je(Z.SCRIPT, f, i), style: Je(Z.STYLE, l, i), title: Je(Z.TITLE,
  { title: p, titleAttributes: c }, i) };
}, "k"), Er = [], pi = /* @__PURE__ */ s(function(e, t) {
  var o = this;
  t === void 0 && (t = typeof document < "u"), this.instances = [], this.value = { setHelmet: /* @__PURE__ */ s(function(i) {
    o.context.helmet = i;
  }, "setHelmet"), helmetInstances: { get: /* @__PURE__ */ s(function() {
    return o.canUseDOM ? Er : o.instances;
  }, "get"), add: /* @__PURE__ */ s(function(i) {
    (o.canUseDOM ? Er : o.instances).push(i);
  }, "add"), remove: /* @__PURE__ */ s(function(i) {
    var n = (o.canUseDOM ? Er : o.instances).indexOf(i);
    (o.canUseDOM ? Er : o.instances).splice(n, 1);
  }, "remove") } }, this.context = e, this.canUseDOM = t, t || (e.helmet = ui({ baseTag: [], bodyAttributes: {}, encodeSpecialCharacters: !0,
  htmlAttributes: {}, linkTags: [], metaTags: [], noscriptTags: [], scriptTags: [], styleTags: [], title: "", titleAttributes: {} }));
}, "N"), dl = a.createContext({}), Am = ne.default.shape({ setHelmet: ne.default.func, helmetInstances: ne.default.shape({ get: ne.default.func,
add: ne.default.func, remove: ne.default.func }) }), Dm = typeof document < "u", Nt = /* @__PURE__ */ function(e) {
  function t(o) {
    var i;
    return (i = e.call(this, o) || this).helmetData = new pi(i.props.context, t.canUseDOM), i;
  }
  return s(t, "r"), ci(t, e), t.prototype.render = function() {
    return a.createElement(dl.Provider, { value: this.helmetData.value }, this.props.children);
  }, t;
}(Ge);
Nt.canUseDOM = Dm, Nt.propTypes = { context: ne.default.shape({ helmet: ne.default.shape() }), children: ne.default.node.isRequired }, Nt.defaultProps =
{ context: {} }, Nt.displayName = "HelmetProvider";
var To = /* @__PURE__ */ s(function(e, t) {
  var o, i = document.head || document.querySelector(Z.HEAD), n = i.querySelectorAll(e + "[data-rh]"), r = [].slice.call(n), l = [];
  return t && t.length && t.forEach(function(u) {
    var p = document.createElement(e);
    for (var c in u) Object.prototype.hasOwnProperty.call(u, c) && (c === "innerHTML" ? p.innerHTML = u.innerHTML : c === "cssText" ? p.styleSheet ?
    p.styleSheet.cssText = u.cssText : p.appendChild(document.createTextNode(u.cssText)) : p.setAttribute(c, u[c] === void 0 ? "" : u[c]));
    p.setAttribute("data-rh", "true"), r.some(function(d, m) {
      return o = m, p.isEqualNode(d);
    }) ? r.splice(o, 1) : l.push(p);
  }), r.forEach(function(u) {
    return u.parentNode.removeChild(u);
  }), l.forEach(function(u) {
    return i.appendChild(u);
  }), { oldTags: r, newTags: l };
}, "Y"), si = /* @__PURE__ */ s(function(e, t) {
  var o = document.getElementsByTagName(e)[0];
  if (o) {
    for (var i = o.getAttribute("data-rh"), n = i ? i.split(",") : [], r = [].concat(n), l = Object.keys(t), u = 0; u < l.length; u += 1) {
      var p = l[u], c = t[p] || "";
      o.getAttribute(p) !== c && o.setAttribute(p, c), n.indexOf(p) === -1 && n.push(p);
      var d = r.indexOf(p);
      d !== -1 && r.splice(d, 1);
    }
    for (var m = r.length - 1; m >= 0; m -= 1) o.removeAttribute(r[m]);
    n.length === r.length ? o.removeAttribute("data-rh") : o.getAttribute("data-rh") !== l.join(",") && o.setAttribute("data-rh", l.join(","));
  }
}, "B"), ll = /* @__PURE__ */ s(function(e, t) {
  var o = e.baseTag, i = e.htmlAttributes, n = e.linkTags, r = e.metaTags, l = e.noscriptTags, u = e.onChangeClientState, p = e.scriptTags, c = e.
  styleTags, d = e.title, m = e.titleAttributes;
  si(Z.BODY, e.bodyAttributes), si(Z.HTML, i), function(v, I) {
    v !== void 0 && document.title !== v && (document.title = cl(v)), si(Z.TITLE, I);
  }(d, m);
  var f = { baseTag: To(Z.BASE, o), linkTags: To(Z.LINK, n), metaTags: To(Z.META, r), noscriptTags: To(Z.NOSCRIPT, l), scriptTags: To(Z.SCRIPT,
  p), styleTags: To(Z.STYLE, c) }, y = {}, h = {};
  Object.keys(f).forEach(function(v) {
    var I = f[v], C = I.newTags, b = I.oldTags;
    C.length && (y[v] = C), b.length && (h[v] = f[v].oldTags);
  }), t && t(), u(e, y, h);
}, "K"), Yo = null, _r = /* @__PURE__ */ function(e) {
  function t() {
    for (var i, n = arguments.length, r = new Array(n), l = 0; l < n; l++) r[l] = arguments[l];
    return (i = e.call.apply(e, [this].concat(r)) || this).rendered = !1, i;
  }
  s(t, "e"), ci(t, e);
  var o = t.prototype;
  return o.shouldComponentUpdate = function(i) {
    return !(0, pl.default)(i, this.props);
  }, o.componentDidUpdate = function() {
    this.emitChange();
  }, o.componentWillUnmount = function() {
    this.props.context.helmetInstances.remove(this), this.emitChange();
  }, o.emitChange = function() {
    var i, n, r = this.props.context, l = r.setHelmet, u = null, p = (i = r.helmetInstances.get().map(function(c) {
      var d = Ee({}, c.props);
      return delete d.context, d;
    }), { baseTag: km(["href"], i), bodyAttributes: ri("bodyAttributes", i), defer: _o(i, "defer"), encode: _o(i, "encodeSpecialCharacters"),
    htmlAttributes: ri("htmlAttributes", i), linkTags: Go(Z.LINK, ["rel", "href"], i), metaTags: Go(Z.META, ["name", "charset", "http-equiv",
    "property", "itemprop"], i), noscriptTags: Go(Z.NOSCRIPT, ["innerHTML"], i), onChangeClientState: _m(i), scriptTags: Go(Z.SCRIPT, ["src",
    "innerHTML"], i), styleTags: Go(Z.STYLE, ["cssText"], i), title: Tm(i), titleAttributes: ri("titleAttributes", i), prioritizeSeoTags: Om(
    i, "prioritizeSeoTags") });
    Nt.canUseDOM ? (n = p, Yo && cancelAnimationFrame(Yo), n.defer ? Yo = requestAnimationFrame(function() {
      ll(n, function() {
        Yo = null;
      });
    }) : (ll(n), Yo = null)) : ui && (u = ui(p)), l(u);
  }, o.init = function() {
    this.rendered || (this.rendered = !0, this.props.context.helmetInstances.add(this), this.emitChange());
  }, o.render = function() {
    return this.init(), null;
  }, t;
}(Ge);
_r.propTypes = { context: Am.isRequired }, _r.displayName = "HelmetDispatcher";
var Mm = ["children"], Lm = ["children"], Xo = /* @__PURE__ */ function(e) {
  function t() {
    return e.apply(this, arguments) || this;
  }
  s(t, "r"), ci(t, e);
  var o = t.prototype;
  return o.shouldComponentUpdate = function(i) {
    return !(0, ul.default)(il(this.props, "helmetData"), il(i, "helmetData"));
  }, o.mapNestedChildrenToProps = function(i, n) {
    if (!n) return null;
    switch (i.type) {
      case Z.SCRIPT:
      case Z.NOSCRIPT:
        return { innerHTML: n };
      case Z.STYLE:
        return { cssText: n };
      default:
        throw new Error("<" + i.type + " /> elements are self-closing and can not contain children. Refer to our API for more information.");
    }
  }, o.flattenArrayTypeChildren = function(i) {
    var n, r = i.child, l = i.arrayTypeChildren;
    return Ee({}, l, ((n = {})[r.type] = [].concat(l[r.type] || [], [Ee({}, i.newChildProps, this.mapNestedChildrenToProps(r, i.nestedChildren))]),
    n));
  }, o.mapObjectTypeChildren = function(i) {
    var n, r, l = i.child, u = i.newProps, p = i.newChildProps, c = i.nestedChildren;
    switch (l.type) {
      case Z.TITLE:
        return Ee({}, u, ((n = {})[l.type] = c, n.titleAttributes = Ee({}, p), n));
      case Z.BODY:
        return Ee({}, u, { bodyAttributes: Ee({}, p) });
      case Z.HTML:
        return Ee({}, u, { htmlAttributes: Ee({}, p) });
      default:
        return Ee({}, u, ((r = {})[l.type] = Ee({}, p), r));
    }
  }, o.mapArrayTypeChildrenToProps = function(i, n) {
    var r = Ee({}, n);
    return Object.keys(i).forEach(function(l) {
      var u;
      r = Ee({}, r, ((u = {})[l] = i[l], u));
    }), r;
  }, o.warnOnInvalidChildren = function(i, n) {
    return (0, ai.default)(nl.some(function(r) {
      return i.type === r;
    }), typeof i.type == "function" ? "You may be attempting to nest <Helmet> components within each other, which is not allowed. Refer to o\
ur API for more information." : "Only elements types " + nl.join(", ") + " are allowed. Helmet does not support rendering <" + i.type + "> e\
lements. Refer to our API for more information."), (0, ai.default)(!n || typeof n == "string" || Array.isArray(n) && !n.some(function(r) {
      return typeof r != "string";
    }), "Helmet expects a string as a child of <" + i.type + ">. Did you forget to wrap your children in braces? ( <" + i.type + ">{``}</" +
    i.type + "> ) Refer to our API for more information."), !0;
  }, o.mapChildrenToProps = function(i, n) {
    var r = this, l = {};
    return a.Children.forEach(i, function(u) {
      if (u && u.props) {
        var p = u.props, c = p.children, d = rl(p, Mm), m = Object.keys(d).reduce(function(y, h) {
          return y[Cm[h] || h] = d[h], y;
        }, {}), f = u.type;
        switch (typeof f == "symbol" ? f = f.toString() : r.warnOnInvalidChildren(u, c), f) {
          case Z.FRAGMENT:
            n = r.mapChildrenToProps(c, n);
            break;
          case Z.LINK:
          case Z.META:
          case Z.NOSCRIPT:
          case Z.SCRIPT:
          case Z.STYLE:
            l = r.flattenArrayTypeChildren({ child: u, arrayTypeChildren: l, newChildProps: m, nestedChildren: c });
            break;
          default:
            n = r.mapObjectTypeChildren({ child: u, newProps: n, newChildProps: m, nestedChildren: c });
        }
      }
    }), this.mapArrayTypeChildrenToProps(l, n);
  }, o.render = function() {
    var i = this.props, n = i.children, r = rl(i, Lm), l = Ee({}, r), u = r.helmetData;
    return n && (l = this.mapChildrenToProps(n, l)), !u || u instanceof pi || (u = new pi(u.context, u.instances)), u ? /* @__PURE__ */ a.createElement(
    _r, Ee({}, l, { context: u.value, helmetData: void 0 })) : /* @__PURE__ */ a.createElement(dl.Consumer, null, function(p) {
      return a.createElement(_r, Ee({}, l, { context: p }));
    });
  }, t;
}(Ge);
Xo.propTypes = { base: ne.default.object, bodyAttributes: ne.default.object, children: ne.default.oneOfType([ne.default.arrayOf(ne.default.node),
ne.default.node]), defaultTitle: ne.default.string, defer: ne.default.bool, encodeSpecialCharacters: ne.default.bool, htmlAttributes: ne.default.
object, link: ne.default.arrayOf(ne.default.object), meta: ne.default.arrayOf(ne.default.object), noscript: ne.default.arrayOf(ne.default.object),
onChangeClientState: ne.default.func, script: ne.default.arrayOf(ne.default.object), style: ne.default.arrayOf(ne.default.object), title: ne.default.
string, titleAttributes: ne.default.object, titleTemplate: ne.default.string, prioritizeSeoTags: ne.default.bool, helmetData: ne.default.object },
Xo.defaultProps = { defer: !0, encodeSpecialCharacters: !0, prioritizeSeoTags: !1 }, Xo.displayName = "Helmet";

// src/manager/constants.ts
var wt = "@media (min-width: 600px)";

// src/manager/components/hooks/useMedia.tsx
function fl(e) {
  let t = /* @__PURE__ */ s((r) => typeof window < "u" ? window.matchMedia(r).matches : !1, "getMatches"), [o, i] = U(t(e));
  function n() {
    i(t(e));
  }
  return s(n, "handleChange"), z(() => {
    let r = window.matchMedia(e);
    return n(), r.addEventListener("change", n), () => {
      r.removeEventListener("change", n);
    };
  }, [e]), o;
}
s(fl, "useMediaQuery");

// src/manager/components/layout/LayoutProvider.tsx
var ml = So({
  isMobileMenuOpen: !1,
  setMobileMenuOpen: /* @__PURE__ */ s(() => {
  }, "setMobileMenuOpen"),
  isMobileAboutOpen: !1,
  setMobileAboutOpen: /* @__PURE__ */ s(() => {
  }, "setMobileAboutOpen"),
  isMobilePanelOpen: !1,
  setMobilePanelOpen: /* @__PURE__ */ s(() => {
  }, "setMobilePanelOpen"),
  isDesktop: !1,
  isMobile: !1
}), hl = /* @__PURE__ */ s(({ children: e }) => {
  let [t, o] = U(!1), [i, n] = U(!1), [r, l] = U(!1), u = fl(`(min-width: ${600}px)`), p = !u, c = Y(
    () => ({
      isMobileMenuOpen: t,
      setMobileMenuOpen: o,
      isMobileAboutOpen: i,
      setMobileAboutOpen: n,
      isMobilePanelOpen: r,
      setMobilePanelOpen: l,
      isDesktop: u,
      isMobile: p
    }),
    [
      t,
      o,
      i,
      n,
      r,
      l,
      u,
      p
    ]
  );
  return /* @__PURE__ */ a.createElement(ml.Provider, { value: c }, e);
}, "LayoutProvider"), ge = /* @__PURE__ */ s(() => br(ml), "useLayout");

// global-externals:@storybook/core/components
var Sw = __STORYBOOK_COMPONENTS__, { A: ww, ActionBar: Ew, AddonPanel: Cw, Badge: kr, Bar: Tw, Blockquote: _w, Button: fe, ClipboardCode: kw,
Code: Ow, DL: Pw, Div: Aw, DocumentWrapper: Dw, EmptyTabContent: gl, ErrorFormatter: yl, FlexBar: Mw, Form: Or, H1: Lw, H2: Nw, H3: Fw, H4: Bw,
H5: Hw, H6: Rw, HR: zw, IconButton: te, IconButtonSkeleton: Ww, Icons: vl, Img: jw, LI: Vw, Link: We, ListItem: $w, Loader: Pr, Modal: Ut, OL: Kw,
P: Uw, Placeholder: qw, Pre: Gw, ResetWrapper: Yw, ScrollArea: Ar, Separator: ko, Spaced: Et, Span: Xw, StorybookIcon: Qw, StorybookLogo: Dr,
Symbols: Zw, SyntaxHighlighter: Jw, TT: eE, TabBar: Mr, TabButton: Lr, TabWrapper: tE, Table: oE, Tabs: bl, TabsState: rE, TooltipLinkList: Ct,
TooltipMessage: nE, TooltipNote: qt, UL: iE, WithTooltip: je, WithTooltipPure: sE, Zoom: xl, codeCommon: aE, components: lE, createCopyToClipboardFunction: uE,
getStoryHref: Oo, icons: pE, interleaveSeparators: cE, nameSpaceClassNames: dE, resetComponents: fE, withReset: mE } = __STORYBOOK_COMPONENTS__;

// global-externals:@storybook/icons
var gE = __STORYBOOK_ICONS__, { AccessibilityAltIcon: yE, AccessibilityIcon: vE, AddIcon: bE, AdminIcon: xE, AlertAltIcon: IE, AlertIcon: Nr,
AlignLeftIcon: SE, AlignRightIcon: wE, AppleIcon: EE, ArrowBottomLeftIcon: CE, ArrowBottomRightIcon: TE, ArrowDownIcon: _E, ArrowLeftIcon: Il,
ArrowRightIcon: kE, ArrowSolidDownIcon: OE, ArrowSolidLeftIcon: PE, ArrowSolidRightIcon: AE, ArrowSolidUpIcon: DE, ArrowTopLeftIcon: ME, ArrowTopRightIcon: LE,
ArrowUpIcon: NE, AzureDevOpsIcon: FE, BackIcon: BE, BasketIcon: HE, BatchAcceptIcon: RE, BatchDenyIcon: zE, BeakerIcon: WE, BellIcon: jE, BitbucketIcon: VE,
BoldIcon: $E, BookIcon: KE, BookmarkHollowIcon: UE, BookmarkIcon: qE, BottomBarIcon: Fr, BottomBarToggleIcon: Sl, BoxIcon: GE, BranchIcon: YE,
BrowserIcon: XE, ButtonIcon: QE, CPUIcon: ZE, CalendarIcon: JE, CameraIcon: eC, CategoryIcon: tC, CertificateIcon: oC, ChangedIcon: rC, ChatIcon: nC,
CheckIcon: et, ChevronDownIcon: Po, ChevronLeftIcon: iC, ChevronRightIcon: wl, ChevronSmallDownIcon: sC, ChevronSmallLeftIcon: aC, ChevronSmallRightIcon: lC,
ChevronSmallUpIcon: El, ChevronUpIcon: uC, ChromaticIcon: pC, ChromeIcon: cC, CircleHollowIcon: dC, CircleIcon: Cl, ClearIcon: fC, CloseAltIcon: Br,
CloseIcon: ct, CloudHollowIcon: mC, CloudIcon: hC, CogIcon: di, CollapseIcon: Tl, CommandIcon: gC, CommentAddIcon: yC, CommentIcon: vC, CommentsIcon: bC,
CommitIcon: xC, CompassIcon: IC, ComponentDrivenIcon: SC, ComponentIcon: fi, ContrastIcon: wC, ControlsIcon: EC, CopyIcon: CC, CreditIcon: TC,
CrossIcon: _C, DashboardIcon: kC, DatabaseIcon: OC, DeleteIcon: PC, DiamondIcon: AC, DirectionIcon: DC, DiscordIcon: MC, DocChartIcon: LC, DocListIcon: NC,
DocumentIcon: Ao, DownloadIcon: FC, DragIcon: BC, EditIcon: HC, EllipsisIcon: RC, EmailIcon: zC, ExpandAltIcon: _l, ExpandIcon: kl, EyeCloseIcon: Ol,
EyeIcon: Hr, FaceHappyIcon: WC, FaceNeutralIcon: jC, FaceSadIcon: VC, FacebookIcon: $C, FailedIcon: KC, FastForwardIcon: UC, FigmaIcon: qC, FilterIcon: Pl,
FlagIcon: GC, FolderIcon: YC, FormIcon: XC, GDriveIcon: QC, GithubIcon: Rr, GitlabIcon: ZC, GlobeIcon: mi, GoogleIcon: JC, GraphBarIcon: eT,
GraphLineIcon: tT, GraphqlIcon: oT, GridAltIcon: rT, GridIcon: nT, GrowIcon: iT, HeartHollowIcon: sT, HeartIcon: Al, HomeIcon: aT, HourglassIcon: lT,
InfoIcon: Dl, ItalicIcon: uT, JumpToIcon: pT, KeyIcon: cT, LightningIcon: Ml, LightningOffIcon: dT, LinkBrokenIcon: fT, LinkIcon: Ll, LinkedinIcon: mT,
LinuxIcon: hT, ListOrderedIcon: gT, ListUnorderedIcon: yT, LocationIcon: vT, LockIcon: zr, MarkdownIcon: bT, MarkupIcon: Nl, MediumIcon: xT,
MemoryIcon: IT, MenuIcon: Wr, MergeIcon: ST, MirrorIcon: wT, MobileIcon: ET, MoonIcon: CT, NutIcon: TT, OutboxIcon: _T, OutlineIcon: kT, PaintBrushIcon: OT,
PaperClipIcon: PT, ParagraphIcon: AT, PassedIcon: DT, PhoneIcon: MT, PhotoDragIcon: LT, PhotoIcon: NT, PinAltIcon: FT, PinIcon: BT, PlayAllHollowIcon: Fl,
PlayBackIcon: HT, PlayHollowIcon: Bl, PlayIcon: RT, PlayNextIcon: zT, PlusIcon: Hl, PointerDefaultIcon: WT, PointerHandIcon: jT, PowerIcon: VT,
PrintIcon: $T, ProceedIcon: KT, ProfileIcon: UT, PullRequestIcon: qT, QuestionIcon: GT, RSSIcon: YT, RedirectIcon: XT, ReduxIcon: QT, RefreshIcon: ZT,
ReplyIcon: JT, RepoIcon: e1, RequestChangeIcon: t1, RewindIcon: o1, RulerIcon: r1, SaveIcon: n1, SearchIcon: jr, ShareAltIcon: Tt, ShareIcon: i1,
ShieldIcon: s1, SideBySideIcon: a1, SidebarAltIcon: Vr, SidebarAltToggleIcon: l1, SidebarIcon: u1, SidebarToggleIcon: p1, SpeakerIcon: c1, StackedIcon: d1,
StarHollowIcon: f1, StarIcon: m1, StatusFailIcon: hi, StatusPassIcon: Rl, StatusWarnIcon: gi, StickerIcon: h1, StopAltHollowIcon: zl, StopAltIcon: g1,
StopIcon: y1, StorybookIcon: Wl, StructureIcon: v1, SubtractIcon: b1, SunIcon: x1, SupportIcon: I1, SwitchAltIcon: S1, SyncIcon: Ft, TabletIcon: w1,
ThumbsUpIcon: E1, TimeIcon: jl, TimerIcon: C1, TransferIcon: T1, TrashIcon: Vl, TwitterIcon: _1, TypeIcon: k1, UbuntuIcon: O1, UndoIcon: P1,
UnfoldIcon: A1, UnlockIcon: D1, UnpinIcon: M1, UploadIcon: L1, UserAddIcon: N1, UserAltIcon: F1, UserIcon: B1, UsersIcon: H1, VSCodeIcon: R1,
VerifiedIcon: z1, VideoIcon: W1, WandIcon: $l, WatchIcon: j1, WindowsIcon: V1, WrenchIcon: $1, XIcon: K1, YoutubeIcon: U1, ZoomIcon: Kl, ZoomOutIcon: Ul,
ZoomResetIcon: ql, iconList: q1 } = __STORYBOOK_ICONS__;

// ../node_modules/@babel/runtime/helpers/esm/extends.js
function q() {
  return q = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var o = arguments[t];
      for (var i in o) ({}).hasOwnProperty.call(o, i) && (e[i] = o[i]);
    }
    return e;
  }, q.apply(null, arguments);
}
s(q, "_extends");

// ../node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js
function Gl(e) {
  if (e === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}
s(Gl, "_assertThisInitialized");

// ../node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js
function Bt(e, t) {
  return Bt = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(o, i) {
    return o.__proto__ = i, o;
  }, Bt(e, t);
}
s(Bt, "_setPrototypeOf");

// ../node_modules/@babel/runtime/helpers/esm/inheritsLoose.js
function Do(e, t) {
  e.prototype = Object.create(t.prototype), e.prototype.constructor = e, Bt(e, t);
}
s(Do, "_inheritsLoose");

// ../node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js
function $r(e) {
  return $r = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t) {
    return t.__proto__ || Object.getPrototypeOf(t);
  }, $r(e);
}
s($r, "_getPrototypeOf");

// ../node_modules/@babel/runtime/helpers/esm/isNativeFunction.js
function Yl(e) {
  try {
    return Function.toString.call(e).indexOf("[native code]") !== -1;
  } catch {
    return typeof e == "function";
  }
}
s(Yl, "_isNativeFunction");

// ../node_modules/@babel/runtime/helpers/esm/isNativeReflectConstruct.js
function yi() {
  try {
    var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
  } catch {
  }
  return (yi = /* @__PURE__ */ s(function() {
    return !!e;
  }, "_isNativeReflectConstruct"))();
}
s(yi, "_isNativeReflectConstruct");

// ../node_modules/@babel/runtime/helpers/esm/construct.js
function Xl(e, t, o) {
  if (yi()) return Reflect.construct.apply(null, arguments);
  var i = [null];
  i.push.apply(i, t);
  var n = new (e.bind.apply(e, i))();
  return o && Bt(n, o.prototype), n;
}
s(Xl, "_construct");

// ../node_modules/@babel/runtime/helpers/esm/wrapNativeSuper.js
function Kr(e) {
  var t = typeof Map == "function" ? /* @__PURE__ */ new Map() : void 0;
  return Kr = /* @__PURE__ */ s(function(i) {
    if (i === null || !Yl(i)) return i;
    if (typeof i != "function") throw new TypeError("Super expression must either be null or a function");
    if (t !== void 0) {
      if (t.has(i)) return t.get(i);
      t.set(i, n);
    }
    function n() {
      return Xl(i, arguments, $r(this).constructor);
    }
    return s(n, "Wrapper"), n.prototype = Object.create(i.prototype, {
      constructor: {
        value: n,
        enumerable: !1,
        writable: !0,
        configurable: !0
      }
    }), Bt(n, i);
  }, "_wrapNativeSuper"), Kr(e);
}
s(Kr, "_wrapNativeSuper");

// ../node_modules/polished/dist/polished.esm.js
var Lo = /* @__PURE__ */ function(e) {
  Do(t, e);
  function t(o) {
    var i;
    if (1)
      i = e.call(this, "An error occurred. See https://github.com/styled-components/polished/blob/main/src/internalHelpers/errors.md#" + o +
      " for more information.") || this;
    else
      for (var n, r, l; l < n; l++)
        ;
    return Gl(i);
  }
  return s(t, "PolishedError"), t;
}(/* @__PURE__ */ Kr(Error));
function vi(e) {
  return Math.round(e * 255);
}
s(vi, "colorToInt");
function Nm(e, t, o) {
  return vi(e) + "," + vi(t) + "," + vi(o);
}
s(Nm, "convertToInt");
function Ql(e, t, o, i) {
  if (i === void 0 && (i = Nm), t === 0)
    return i(o, o, o);
  var n = (e % 360 + 360) % 360 / 60, r = (1 - Math.abs(2 * o - 1)) * t, l = r * (1 - Math.abs(n % 2 - 1)), u = 0, p = 0, c = 0;
  n >= 0 && n < 1 ? (u = r, p = l) : n >= 1 && n < 2 ? (u = l, p = r) : n >= 2 && n < 3 ? (p = r, c = l) : n >= 3 && n < 4 ? (p = l, c = r) :
  n >= 4 && n < 5 ? (u = l, c = r) : n >= 5 && n < 6 && (u = r, c = l);
  var d = o - r / 2, m = u + d, f = p + d, y = c + d;
  return i(m, f, y);
}
s(Ql, "hslToRgb");
var Zl = {
  aliceblue: "f0f8ff",
  antiquewhite: "faebd7",
  aqua: "00ffff",
  aquamarine: "7fffd4",
  azure: "f0ffff",
  beige: "f5f5dc",
  bisque: "ffe4c4",
  black: "000",
  blanchedalmond: "ffebcd",
  blue: "0000ff",
  blueviolet: "8a2be2",
  brown: "a52a2a",
  burlywood: "deb887",
  cadetblue: "5f9ea0",
  chartreuse: "7fff00",
  chocolate: "d2691e",
  coral: "ff7f50",
  cornflowerblue: "6495ed",
  cornsilk: "fff8dc",
  crimson: "dc143c",
  cyan: "00ffff",
  darkblue: "00008b",
  darkcyan: "008b8b",
  darkgoldenrod: "b8860b",
  darkgray: "a9a9a9",
  darkgreen: "006400",
  darkgrey: "a9a9a9",
  darkkhaki: "bdb76b",
  darkmagenta: "8b008b",
  darkolivegreen: "556b2f",
  darkorange: "ff8c00",
  darkorchid: "9932cc",
  darkred: "8b0000",
  darksalmon: "e9967a",
  darkseagreen: "8fbc8f",
  darkslateblue: "483d8b",
  darkslategray: "2f4f4f",
  darkslategrey: "2f4f4f",
  darkturquoise: "00ced1",
  darkviolet: "9400d3",
  deeppink: "ff1493",
  deepskyblue: "00bfff",
  dimgray: "696969",
  dimgrey: "696969",
  dodgerblue: "1e90ff",
  firebrick: "b22222",
  floralwhite: "fffaf0",
  forestgreen: "228b22",
  fuchsia: "ff00ff",
  gainsboro: "dcdcdc",
  ghostwhite: "f8f8ff",
  gold: "ffd700",
  goldenrod: "daa520",
  gray: "808080",
  green: "008000",
  greenyellow: "adff2f",
  grey: "808080",
  honeydew: "f0fff0",
  hotpink: "ff69b4",
  indianred: "cd5c5c",
  indigo: "4b0082",
  ivory: "fffff0",
  khaki: "f0e68c",
  lavender: "e6e6fa",
  lavenderblush: "fff0f5",
  lawngreen: "7cfc00",
  lemonchiffon: "fffacd",
  lightblue: "add8e6",
  lightcoral: "f08080",
  lightcyan: "e0ffff",
  lightgoldenrodyellow: "fafad2",
  lightgray: "d3d3d3",
  lightgreen: "90ee90",
  lightgrey: "d3d3d3",
  lightpink: "ffb6c1",
  lightsalmon: "ffa07a",
  lightseagreen: "20b2aa",
  lightskyblue: "87cefa",
  lightslategray: "789",
  lightslategrey: "789",
  lightsteelblue: "b0c4de",
  lightyellow: "ffffe0",
  lime: "0f0",
  limegreen: "32cd32",
  linen: "faf0e6",
  magenta: "f0f",
  maroon: "800000",
  mediumaquamarine: "66cdaa",
  mediumblue: "0000cd",
  mediumorchid: "ba55d3",
  mediumpurple: "9370db",
  mediumseagreen: "3cb371",
  mediumslateblue: "7b68ee",
  mediumspringgreen: "00fa9a",
  mediumturquoise: "48d1cc",
  mediumvioletred: "c71585",
  midnightblue: "191970",
  mintcream: "f5fffa",
  mistyrose: "ffe4e1",
  moccasin: "ffe4b5",
  navajowhite: "ffdead",
  navy: "000080",
  oldlace: "fdf5e6",
  olive: "808000",
  olivedrab: "6b8e23",
  orange: "ffa500",
  orangered: "ff4500",
  orchid: "da70d6",
  palegoldenrod: "eee8aa",
  palegreen: "98fb98",
  paleturquoise: "afeeee",
  palevioletred: "db7093",
  papayawhip: "ffefd5",
  peachpuff: "ffdab9",
  peru: "cd853f",
  pink: "ffc0cb",
  plum: "dda0dd",
  powderblue: "b0e0e6",
  purple: "800080",
  rebeccapurple: "639",
  red: "f00",
  rosybrown: "bc8f8f",
  royalblue: "4169e1",
  saddlebrown: "8b4513",
  salmon: "fa8072",
  sandybrown: "f4a460",
  seagreen: "2e8b57",
  seashell: "fff5ee",
  sienna: "a0522d",
  silver: "c0c0c0",
  skyblue: "87ceeb",
  slateblue: "6a5acd",
  slategray: "708090",
  slategrey: "708090",
  snow: "fffafa",
  springgreen: "00ff7f",
  steelblue: "4682b4",
  tan: "d2b48c",
  teal: "008080",
  thistle: "d8bfd8",
  tomato: "ff6347",
  turquoise: "40e0d0",
  violet: "ee82ee",
  wheat: "f5deb3",
  white: "fff",
  whitesmoke: "f5f5f5",
  yellow: "ff0",
  yellowgreen: "9acd32"
};
function Fm(e) {
  if (typeof e != "string") return e;
  var t = e.toLowerCase();
  return Zl[t] ? "#" + Zl[t] : e;
}
s(Fm, "nameToHex");
var Bm = /^#[a-fA-F0-9]{6}$/, Hm = /^#[a-fA-F0-9]{8}$/, Rm = /^#[a-fA-F0-9]{3}$/, zm = /^#[a-fA-F0-9]{4}$/, bi = /^rgb\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*\)$/i,
Wm = /^rgb(?:a)?\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i, jm = /^hsl\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*\)$/i,
Vm = /^hsl(?:a)?\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i;
function tu(e) {
  if (typeof e != "string")
    throw new Lo(3);
  var t = Fm(e);
  if (t.match(Bm))
    return {
      red: parseInt("" + t[1] + t[2], 16),
      green: parseInt("" + t[3] + t[4], 16),
      blue: parseInt("" + t[5] + t[6], 16)
    };
  if (t.match(Hm)) {
    var o = parseFloat((parseInt("" + t[7] + t[8], 16) / 255).toFixed(2));
    return {
      red: parseInt("" + t[1] + t[2], 16),
      green: parseInt("" + t[3] + t[4], 16),
      blue: parseInt("" + t[5] + t[6], 16),
      alpha: o
    };
  }
  if (t.match(Rm))
    return {
      red: parseInt("" + t[1] + t[1], 16),
      green: parseInt("" + t[2] + t[2], 16),
      blue: parseInt("" + t[3] + t[3], 16)
    };
  if (t.match(zm)) {
    var i = parseFloat((parseInt("" + t[4] + t[4], 16) / 255).toFixed(2));
    return {
      red: parseInt("" + t[1] + t[1], 16),
      green: parseInt("" + t[2] + t[2], 16),
      blue: parseInt("" + t[3] + t[3], 16),
      alpha: i
    };
  }
  var n = bi.exec(t);
  if (n)
    return {
      red: parseInt("" + n[1], 10),
      green: parseInt("" + n[2], 10),
      blue: parseInt("" + n[3], 10)
    };
  var r = Wm.exec(t.substring(0, 50));
  if (r)
    return {
      red: parseInt("" + r[1], 10),
      green: parseInt("" + r[2], 10),
      blue: parseInt("" + r[3], 10),
      alpha: parseFloat("" + r[4]) > 1 ? parseFloat("" + r[4]) / 100 : parseFloat("" + r[4])
    };
  var l = jm.exec(t);
  if (l) {
    var u = parseInt("" + l[1], 10), p = parseInt("" + l[2], 10) / 100, c = parseInt("" + l[3], 10) / 100, d = "rgb(" + Ql(u, p, c) + ")", m = bi.
    exec(d);
    if (!m)
      throw new Lo(4, t, d);
    return {
      red: parseInt("" + m[1], 10),
      green: parseInt("" + m[2], 10),
      blue: parseInt("" + m[3], 10)
    };
  }
  var f = Vm.exec(t.substring(0, 50));
  if (f) {
    var y = parseInt("" + f[1], 10), h = parseInt("" + f[2], 10) / 100, v = parseInt("" + f[3], 10) / 100, I = "rgb(" + Ql(y, h, v) + ")", C = bi.
    exec(I);
    if (!C)
      throw new Lo(4, t, I);
    return {
      red: parseInt("" + C[1], 10),
      green: parseInt("" + C[2], 10),
      blue: parseInt("" + C[3], 10),
      alpha: parseFloat("" + f[4]) > 1 ? parseFloat("" + f[4]) / 100 : parseFloat("" + f[4])
    };
  }
  throw new Lo(5);
}
s(tu, "parseToRgb");
var $m = /* @__PURE__ */ s(function(t) {
  return t.length === 7 && t[1] === t[2] && t[3] === t[4] && t[5] === t[6] ? "#" + t[1] + t[3] + t[5] : t;
}, "reduceHexValue"), Jl = $m;
function Mo(e) {
  var t = e.toString(16);
  return t.length === 1 ? "0" + t : t;
}
s(Mo, "numberToHex");
function eu(e, t, o) {
  if (typeof e == "number" && typeof t == "number" && typeof o == "number")
    return Jl("#" + Mo(e) + Mo(t) + Mo(o));
  if (typeof e == "object" && t === void 0 && o === void 0)
    return Jl("#" + Mo(e.red) + Mo(e.green) + Mo(e.blue));
  throw new Lo(6);
}
s(eu, "rgb");
function xi(e, t, o, i) {
  if (typeof e == "string" && typeof t == "number") {
    var n = tu(e);
    return "rgba(" + n.red + "," + n.green + "," + n.blue + "," + t + ")";
  } else {
    if (typeof e == "number" && typeof t == "number" && typeof o == "number" && typeof i == "number")
      return i >= 1 ? eu(e, t, o) : "rgba(" + e + "," + t + "," + o + "," + i + ")";
    if (typeof e == "object" && t === void 0 && o === void 0 && i === void 0)
      return e.alpha >= 1 ? eu(e.red, e.green, e.blue) : "rgba(" + e.red + "," + e.green + "," + e.blue + "," + e.alpha + ")";
  }
  throw new Lo(7);
}
s(xi, "rgba");
function ou(e, t, o) {
  return /* @__PURE__ */ s(function() {
    var n = o.concat(Array.prototype.slice.call(arguments));
    return n.length >= t ? e.apply(this, n) : ou(e, t, n);
  }, "fn");
}
s(ou, "curried");
function Km(e) {
  return ou(e, e.length, []);
}
s(Km, "curry");
function Um(e, t, o) {
  return Math.max(e, Math.min(t, o));
}
s(Um, "guard");
function qm(e, t) {
  if (t === "transparent") return t;
  var o = tu(t), i = typeof o.alpha == "number" ? o.alpha : 1, n = q({}, o, {
    alpha: Um(0, 1, +(i * 100 - parseFloat(e) * 100).toFixed(2) / 100)
  });
  return xi(n);
}
s(qm, "transparentize");
var Gm = /* @__PURE__ */ Km(qm), xe = Gm;

// src/manager/components/notifications/NotificationItem.tsx
var Ym = Kt({
  "0%": {
    opacity: 0,
    transform: "translateY(30px)"
  },
  "100%": {
    opacity: 1,
    transform: "translateY(0)"
  }
}), Xm = Kt({
  "0%": {
    width: "0%"
  },
  "100%": {
    width: "100%"
  }
}), ru = S.div(
  ({ theme: e }) => ({
    position: "relative",
    display: "flex",
    border: `1px solid ${e.appBorderColor}`,
    padding: "12px 6px 12px 12px",
    borderRadius: e.appBorderRadius + 1,
    alignItems: "center",
    animation: `${Ym} 500ms`,
    background: e.base === "light" ? "hsla(203, 50%, 20%, .97)" : "hsla(203, 30%, 95%, .97)",
    boxShadow: "0 2px 5px 0 rgba(0, 0, 0, 0.05), 0 5px 15px 0 rgba(0, 0, 0, 0.1)",
    color: e.color.inverseText,
    textDecoration: "none",
    overflow: "hidden",
    [wt]: {
      boxShadow: `0 1px 2px 0 rgba(0, 0, 0, 0.05), 0px -5px 20px 10px ${e.background.app}`
    }
  }),
  ({ duration: e, theme: t }) => e && {
    "&::after": {
      content: '""',
      display: "block",
      position: "absolute",
      bottom: 0,
      left: 0,
      height: 3,
      background: t.color.secondary,
      animation: `${Xm} ${e}ms linear forwards reverse`
    }
  }
), nu = S(ru)({
  cursor: "pointer",
  border: "none",
  outline: "none",
  textAlign: "left",
  transition: "all 150ms ease-out",
  transform: "translate3d(0, 0, 0)",
  "&:hover": {
    transform: "translate3d(0, -3px, 0)",
    boxShadow: "0 1px 3px 0 rgba(30,167,253,0.5), 0 2px 5px 0 rgba(0,0,0,0.05), 0 5px 15px 0 rgba(0,0,0,0.1)"
  },
  "&:active": {
    transform: "translate3d(0, 0, 0)",
    boxShadow: "0 1px 3px 0 rgba(30,167,253,0.5), 0 2px 5px 0 rgba(0,0,0,0.05), 0 5px 15px 0 rgba(0,0,0,0.1)"
  },
  "&:focus": {
    boxShadow: "rgba(2,156,253,1) 0 0 0 1px inset, 0 1px 3px 0 rgba(30,167,253,0.5), 0 2px 5px 0 rgba(0,0,0,0.05), 0 5px 15px 0 rgba(0,0,0,0\
.1)"
  }
}), Qm = nu.withComponent("div"), Zm = nu.withComponent(Ir), Jm = S.div(() => ({
  display: "flex",
  marginRight: 10,
  alignItems: "center",
  svg: {
    width: 16,
    height: 16
  }
})), eh = S.div(({ theme: e }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  color: e.base === "dark" ? e.color.mediumdark : e.color.mediumlight
})), th = S.div(({ theme: e, hasIcon: t }) => ({
  height: "100%",
  alignItems: "center",
  whiteSpace: "balance",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontSize: e.typography.size.s1,
  lineHeight: "16px",
  fontWeight: e.typography.weight.bold
})), oh = S.div(({ theme: e }) => ({
  color: xe(0.25, e.color.inverseText),
  fontSize: e.typography.size.s1 - 1,
  lineHeight: "14px",
  marginTop: 2,
  whiteSpace: "balance"
})), Ii = /* @__PURE__ */ s(({
  icon: e,
  content: { headline: t, subHeadline: o }
}) => {
  let i = Fe(), n = i.base === "dark" ? i.color.mediumdark : i.color.mediumlight;
  return /* @__PURE__ */ a.createElement(a.Fragment, null, !e || /* @__PURE__ */ a.createElement(Jm, null, a.isValidElement(e) ? e : typeof e ==
  "object" && "name" in e && /* @__PURE__ */ a.createElement(vl, { icon: e.name, color: e.color || n })), /* @__PURE__ */ a.createElement(eh,
  null, /* @__PURE__ */ a.createElement(th, { title: t, hasIcon: !!e }, t), o && /* @__PURE__ */ a.createElement(oh, null, o)));
}, "ItemContent"), rh = S(te)(({ theme: e }) => ({
  width: 28,
  alignSelf: "center",
  marginTop: 0,
  color: e.base === "light" ? "rgba(255,255,255,0.7)" : " #999999"
})), Si = /* @__PURE__ */ s(({ onDismiss: e }) => /* @__PURE__ */ a.createElement(
  rh,
  {
    title: "Dismiss notification",
    onClick: (t) => {
      t.preventDefault(), t.stopPropagation(), e();
    }
  },
  /* @__PURE__ */ a.createElement(Br, { size: 12 })
), "DismissNotificationItem"), B_ = S.div({
  height: 48
}), nh = /* @__PURE__ */ s(({
  notification: { content: e, duration: t, link: o, onClear: i, onClick: n, id: r, icon: l },
  onDismissNotification: u,
  zIndex: p
}) => {
  let c = M(() => {
    u(r), i && i({ dismissed: !1, timeout: !0 });
  }, [r, u, i]), d = G(null);
  z(() => {
    if (t)
      return d.current = setTimeout(c, t), () => clearTimeout(d.current);
  }, [t, c]);
  let m = M(() => {
    clearTimeout(d.current), u(r), i && i({ dismissed: !0, timeout: !1 });
  }, [r, u, i]);
  return o ? /* @__PURE__ */ a.createElement(Zm, { to: o, duration: t, style: { zIndex: p } }, /* @__PURE__ */ a.createElement(Ii, { icon: l,
  content: e }), /* @__PURE__ */ a.createElement(Si, { onDismiss: m })) : n ? /* @__PURE__ */ a.createElement(
    Qm,
    {
      duration: t,
      onClick: () => n({ onDismiss: m }),
      style: { zIndex: p }
    },
    /* @__PURE__ */ a.createElement(Ii, { icon: l, content: e }),
    /* @__PURE__ */ a.createElement(Si, { onDismiss: m })
  ) : /* @__PURE__ */ a.createElement(ru, { duration: t, style: { zIndex: p } }, /* @__PURE__ */ a.createElement(Ii, { icon: l, content: e }),
  /* @__PURE__ */ a.createElement(Si, { onDismiss: m }));
}, "NotificationItem"), iu = nh;

// src/manager/components/notifications/NotificationList.tsx
var Ur = /* @__PURE__ */ s(({
  notifications: e,
  clearNotification: t
}) => {
  let { isMobile: o } = ge();
  return /* @__PURE__ */ a.createElement(ih, { isMobile: o }, e && e.map((i, n) => /* @__PURE__ */ a.createElement(
    iu,
    {
      key: i.id,
      onDismissNotification: (r) => t(r),
      notification: i,
      zIndex: e.length - n
    }
  )));
}, "NotificationList"), ih = S.div(
  {
    zIndex: 200,
    "> * + *": {
      marginTop: 12
    },
    "&:empty": {
      display: "none"
    }
  },
  ({ isMobile: e }) => e && {
    position: "fixed",
    bottom: 40,
    margin: 20
  }
);

// src/manager/container/Notifications.tsx
var sh = /* @__PURE__ */ s(({ state: e, api: t }) => ({
  notifications: e.notifications,
  clearNotification: t.clearNotification
}), "mapper"), su = /* @__PURE__ */ s((e) => /* @__PURE__ */ a.createElement(me, { filter: sh }, (t) => /* @__PURE__ */ a.createElement(Ur, {
...e, ...t })), "Notifications");

// src/manager/components/mobile/navigation/MobileAddonsDrawer.tsx
var ah = S.div(({ theme: e }) => ({
  position: "relative",
  boxSizing: "border-box",
  width: "100%",
  background: e.background.content,
  height: "42vh",
  zIndex: 11,
  overflow: "hidden"
})), au = /* @__PURE__ */ s(({ children: e }) => /* @__PURE__ */ a.createElement(ah, null, e), "MobileAddonsDrawer");

// ../node_modules/@babel/runtime/helpers/esm/objectWithoutPropertiesLoose.js
function ke(e, t) {
  if (e == null) return {};
  var o = {};
  for (var i in e) if ({}.hasOwnProperty.call(e, i)) {
    if (t.indexOf(i) >= 0) continue;
    o[i] = e[i];
  }
  return o;
}
s(ke, "_objectWithoutPropertiesLoose");

// global-externals:react-dom
var Gt = __REACT_DOM__, { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: rk, createPortal: nk, createRoot: ik, findDOMNode: sk, flushSync: Yt,
hydrate: ak, hydrateRoot: lk, render: uk, unmountComponentAtNode: pk, unstable_batchedUpdates: ck, unstable_renderSubtreeIntoContainer: dk, version: fk } = __REACT_DOM__;

// ../node_modules/react-transition-group/esm/config.js
var wi = {
  disabled: !1
};

// ../node_modules/react-transition-group/esm/TransitionGroupContext.js
var Ei = a.createContext(null);

// ../node_modules/react-transition-group/esm/utils/reflow.js
var lu = /* @__PURE__ */ s(function(t) {
  return t.scrollTop;
}, "forceReflow");

// ../node_modules/react-transition-group/esm/Transition.js
var Qo = "unmounted", Xt = "exited", Qt = "entering", Fo = "entered", Ci = "exiting", _t = /* @__PURE__ */ function(e) {
  Do(t, e);
  function t(i, n) {
    var r;
    r = e.call(this, i, n) || this;
    var l = n, u = l && !l.isMounting ? i.enter : i.appear, p;
    return r.appearStatus = null, i.in ? u ? (p = Xt, r.appearStatus = Qt) : p = Fo : i.unmountOnExit || i.mountOnEnter ? p = Qo : p = Xt, r.
    state = {
      status: p
    }, r.nextCallback = null, r;
  }
  s(t, "Transition"), t.getDerivedStateFromProps = /* @__PURE__ */ s(function(n, r) {
    var l = n.in;
    return l && r.status === Qo ? {
      status: Xt
    } : null;
  }, "getDerivedStateFromProps");
  var o = t.prototype;
  return o.componentDidMount = /* @__PURE__ */ s(function() {
    this.updateStatus(!0, this.appearStatus);
  }, "componentDidMount"), o.componentDidUpdate = /* @__PURE__ */ s(function(n) {
    var r = null;
    if (n !== this.props) {
      var l = this.state.status;
      this.props.in ? l !== Qt && l !== Fo && (r = Qt) : (l === Qt || l === Fo) && (r = Ci);
    }
    this.updateStatus(!1, r);
  }, "componentDidUpdate"), o.componentWillUnmount = /* @__PURE__ */ s(function() {
    this.cancelNextCallback();
  }, "componentWillUnmount"), o.getTimeouts = /* @__PURE__ */ s(function() {
    var n = this.props.timeout, r, l, u;
    return r = l = u = n, n != null && typeof n != "number" && (r = n.exit, l = n.enter, u = n.appear !== void 0 ? n.appear : l), {
      exit: r,
      enter: l,
      appear: u
    };
  }, "getTimeouts"), o.updateStatus = /* @__PURE__ */ s(function(n, r) {
    if (n === void 0 && (n = !1), r !== null)
      if (this.cancelNextCallback(), r === Qt) {
        if (this.props.unmountOnExit || this.props.mountOnEnter) {
          var l = this.props.nodeRef ? this.props.nodeRef.current : Gt.findDOMNode(this);
          l && lu(l);
        }
        this.performEnter(n);
      } else
        this.performExit();
    else this.props.unmountOnExit && this.state.status === Xt && this.setState({
      status: Qo
    });
  }, "updateStatus"), o.performEnter = /* @__PURE__ */ s(function(n) {
    var r = this, l = this.props.enter, u = this.context ? this.context.isMounting : n, p = this.props.nodeRef ? [u] : [Gt.findDOMNode(this),
    u], c = p[0], d = p[1], m = this.getTimeouts(), f = u ? m.appear : m.enter;
    if (!n && !l || wi.disabled) {
      this.safeSetState({
        status: Fo
      }, function() {
        r.props.onEntered(c);
      });
      return;
    }
    this.props.onEnter(c, d), this.safeSetState({
      status: Qt
    }, function() {
      r.props.onEntering(c, d), r.onTransitionEnd(f, function() {
        r.safeSetState({
          status: Fo
        }, function() {
          r.props.onEntered(c, d);
        });
      });
    });
  }, "performEnter"), o.performExit = /* @__PURE__ */ s(function() {
    var n = this, r = this.props.exit, l = this.getTimeouts(), u = this.props.nodeRef ? void 0 : Gt.findDOMNode(this);
    if (!r || wi.disabled) {
      this.safeSetState({
        status: Xt
      }, function() {
        n.props.onExited(u);
      });
      return;
    }
    this.props.onExit(u), this.safeSetState({
      status: Ci
    }, function() {
      n.props.onExiting(u), n.onTransitionEnd(l.exit, function() {
        n.safeSetState({
          status: Xt
        }, function() {
          n.props.onExited(u);
        });
      });
    });
  }, "performExit"), o.cancelNextCallback = /* @__PURE__ */ s(function() {
    this.nextCallback !== null && (this.nextCallback.cancel(), this.nextCallback = null);
  }, "cancelNextCallback"), o.safeSetState = /* @__PURE__ */ s(function(n, r) {
    r = this.setNextCallback(r), this.setState(n, r);
  }, "safeSetState"), o.setNextCallback = /* @__PURE__ */ s(function(n) {
    var r = this, l = !0;
    return this.nextCallback = function(u) {
      l && (l = !1, r.nextCallback = null, n(u));
    }, this.nextCallback.cancel = function() {
      l = !1;
    }, this.nextCallback;
  }, "setNextCallback"), o.onTransitionEnd = /* @__PURE__ */ s(function(n, r) {
    this.setNextCallback(r);
    var l = this.props.nodeRef ? this.props.nodeRef.current : Gt.findDOMNode(this), u = n == null && !this.props.addEndListener;
    if (!l || u) {
      setTimeout(this.nextCallback, 0);
      return;
    }
    if (this.props.addEndListener) {
      var p = this.props.nodeRef ? [this.nextCallback] : [l, this.nextCallback], c = p[0], d = p[1];
      this.props.addEndListener(c, d);
    }
    n != null && setTimeout(this.nextCallback, n);
  }, "onTransitionEnd"), o.render = /* @__PURE__ */ s(function() {
    var n = this.state.status;
    if (n === Qo)
      return null;
    var r = this.props, l = r.children, u = r.in, p = r.mountOnEnter, c = r.unmountOnExit, d = r.appear, m = r.enter, f = r.exit, y = r.timeout,
    h = r.addEndListener, v = r.onEnter, I = r.onEntering, C = r.onEntered, b = r.onExit, x = r.onExiting, g = r.onExited, w = r.nodeRef, T = ke(
    r, ["children", "in", "mountOnEnter", "unmountOnExit", "appear", "enter", "exit", "timeout", "addEndListener", "onEnter", "onEntering", "\
onEntered", "onExit", "onExiting", "onExited", "nodeRef"]);
    return (
      // allows for nested Transitions
      /* @__PURE__ */ a.createElement(Ei.Provider, {
        value: null
      }, typeof l == "function" ? l(n, T) : a.cloneElement(a.Children.only(l), T))
    );
  }, "render"), t;
}(a.Component);
_t.contextType = Ei;
_t.propTypes = {};
function No() {
}
s(No, "noop");
_t.defaultProps = {
  in: !1,
  mountOnEnter: !1,
  unmountOnExit: !1,
  appear: !1,
  enter: !0,
  exit: !0,
  onEnter: No,
  onEntering: No,
  onEntered: No,
  onExit: No,
  onExiting: No,
  onExited: No
};
_t.UNMOUNTED = Qo;
_t.EXITED = Xt;
_t.ENTERING = Qt;
_t.ENTERED = Fo;
_t.EXITING = Ci;
var Zt = _t;

// src/manager/components/upgrade/UpgradeBlock.tsx
var qr = /* @__PURE__ */ s(({ onNavigateToWhatsNew: e }) => {
  let t = pe(), [o, i] = U("npm");
  return /* @__PURE__ */ a.createElement(uh, null, /* @__PURE__ */ a.createElement("strong", null, "You are on Storybook ", t.getCurrentVersion().
  version), /* @__PURE__ */ a.createElement("p", null, "Run the following script to check for updates and upgrade to the latest version."), /* @__PURE__ */ a.
  createElement(ph, null, /* @__PURE__ */ a.createElement(uu, { active: o === "npm", onClick: () => i("npm") }, "npm"), /* @__PURE__ */ a.createElement(
  uu, { active: o === "pnpm", onClick: () => i("pnpm") }, "pnpm")), /* @__PURE__ */ a.createElement(ch, null, o === "npm" ? "npx storybook@l\
atest upgrade" : "pnpm dlx storybook@latest upgrade"), e && // eslint-disable-next-line jsx-a11y/anchor-is-valid
  /* @__PURE__ */ a.createElement(We, { onClick: e }, "See what's new in Storybook"));
}, "UpgradeBlock"), uh = S.div(({ theme: e }) => ({
  border: "1px solid",
  borderRadius: 5,
  padding: 20,
  marginTop: 0,
  borderColor: e.appBorderColor,
  fontSize: e.typography.size.s2,
  width: "100%",
  [wt]: {
    maxWidth: 400
  }
})), ph = S.div({
  display: "flex",
  gap: 2
}), ch = S.pre(({ theme: e }) => ({
  background: e.base === "light" ? "rgba(0, 0, 0, 0.05)" : e.appBorderColor,
  fontSize: e.typography.size.s2 - 1,
  margin: "4px 0 16px"
})), uu = S.button(({ theme: e, active: t }) => ({
  all: "unset",
  alignItems: "center",
  gap: 10,
  color: e.color.defaultText,
  fontSize: e.typography.size.s2 - 1,
  borderBottom: "2px solid transparent",
  borderBottomColor: t ? e.color.secondary : "none",
  padding: "0 10px 5px",
  marginBottom: "5px",
  cursor: "pointer"
}));

// src/manager/components/mobile/about/MobileAbout.tsx
var du = /* @__PURE__ */ s(() => {
  let { isMobileAboutOpen: e, setMobileAboutOpen: t } = ge(), o = G(null);
  return /* @__PURE__ */ a.createElement(
    Zt,
    {
      nodeRef: o,
      in: e,
      timeout: 300,
      appear: !0,
      mountOnEnter: !0,
      unmountOnExit: !0
    },
    (i) => /* @__PURE__ */ a.createElement(dh, { ref: o, state: i, transitionDuration: 300 }, /* @__PURE__ */ a.createElement(hh, { onClick: () => t(
    !1), title: "Close about section" }, /* @__PURE__ */ a.createElement(Il, null), "Back"), /* @__PURE__ */ a.createElement(fh, null, /* @__PURE__ */ a.
    createElement(pu, { href: "https://github.com/storybookjs/storybook", target: "_blank" }, /* @__PURE__ */ a.createElement(cu, null, /* @__PURE__ */ a.
    createElement(Rr, null), /* @__PURE__ */ a.createElement("span", null, "Github")), /* @__PURE__ */ a.createElement(Tt, { width: 12 })), /* @__PURE__ */ a.
    createElement(
      pu,
      {
        href: "https://storybook.js.org/docs/react/get-started/install/",
        target: "_blank"
      },
      /* @__PURE__ */ a.createElement(cu, null, /* @__PURE__ */ a.createElement(Wl, null), /* @__PURE__ */ a.createElement("span", null, "Do\
cumentation")),
      /* @__PURE__ */ a.createElement(Tt, { width: 12 })
    )), /* @__PURE__ */ a.createElement(qr, null), /* @__PURE__ */ a.createElement(mh, null, "Open source software maintained by", " ", /* @__PURE__ */ a.
    createElement(We, { href: "https://chromatic.com", target: "_blank" }, "Chromatic"), " ", "and the", " ", /* @__PURE__ */ a.createElement(
    We, { href: "https://github.com/storybookjs/storybook/graphs/contributors" }, "Storybook Community")))
  );
}, "MobileAbout"), dh = S.div(
  ({ theme: e, state: t, transitionDuration: o }) => ({
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    zIndex: 11,
    transition: `all ${o}ms ease-in-out`,
    overflow: "scroll",
    padding: "25px 10px 10px",
    color: e.color.defaultText,
    background: e.background.content,
    opacity: `${(() => {
      switch (t) {
        case "entering":
        case "entered":
          return 1;
        case "exiting":
        case "exited":
          return 0;
        default:
          return 0;
      }
    })()}`,
    transform: `${(() => {
      switch (t) {
        case "entering":
        case "entered":
          return "translateX(0)";
        case "exiting":
        case "exited":
          return "translateX(20px)";
        default:
          return "translateX(0)";
      }
    })()}`
  })
), fh = S.div({
  marginTop: 20,
  marginBottom: 20
}), pu = S.a(({ theme: e }) => ({
  all: "unset",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: e.typography.size.s2 - 1,
  height: 52,
  borderBottom: `1px solid ${e.appBorderColor}`,
  cursor: "pointer",
  padding: "0 10px",
  "&:last-child": {
    borderBottom: "none"
  }
})), cu = S.div(({ theme: e }) => ({
  display: "flex",
  alignItems: "center",
  fontSize: e.typography.size.s2 - 1,
  height: 40,
  gap: 5
})), mh = S.div(({ theme: e }) => ({
  fontSize: e.typography.size.s2 - 1,
  marginTop: 30
})), hh = S.button(({ theme: e }) => ({
  all: "unset",
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "currentColor",
  fontSize: e.typography.size.s2 - 1,
  padding: "0 10px"
}));

// src/manager/components/mobile/navigation/MobileMenuDrawer.tsx
var fu = /* @__PURE__ */ s(({ children: e }) => {
  let t = G(null), o = G(null), i = G(null), { isMobileMenuOpen: n, setMobileMenuOpen: r, isMobileAboutOpen: l, setMobileAboutOpen: u } = ge();
  return /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(
    Zt,
    {
      nodeRef: t,
      in: n,
      timeout: 300,
      mountOnEnter: !0,
      unmountOnExit: !0,
      onExited: () => u(!1)
    },
    (p) => /* @__PURE__ */ a.createElement(gh, { ref: t, state: p }, /* @__PURE__ */ a.createElement(
      Zt,
      {
        nodeRef: o,
        in: !l,
        timeout: 300
      },
      (c) => /* @__PURE__ */ a.createElement(yh, { ref: o, state: c }, e)
    ), /* @__PURE__ */ a.createElement(du, null))
  ), /* @__PURE__ */ a.createElement(
    Zt,
    {
      nodeRef: i,
      in: n,
      timeout: 300,
      mountOnEnter: !0,
      unmountOnExit: !0
    },
    (p) => /* @__PURE__ */ a.createElement(
      vh,
      {
        ref: i,
        state: p,
        onClick: () => r(!1),
        "aria-label": "Close navigation menu"
      }
    )
  ));
}, "MobileMenuDrawer"), gh = S.div(({ theme: e, state: t }) => ({
  position: "fixed",
  boxSizing: "border-box",
  width: "100%",
  background: e.background.content,
  height: "80%",
  bottom: 0,
  left: 0,
  zIndex: 11,
  borderRadius: "10px 10px 0 0",
  transition: `all ${300}ms ease-in-out`,
  overflow: "hidden",
  transform: `${t === "entering" || t === "entered" ? "translateY(0)" : t === "exiting" || t === "exited" ? "translateY(100%)" : "translateY\
(0)"}`
})), yh = S.div(({ theme: e, state: t }) => ({
  position: "absolute",
  width: "100%",
  height: "100%",
  top: 0,
  left: 0,
  zIndex: 1,
  transition: `all ${300}ms ease-in-out`,
  overflow: "hidden",
  opacity: `${t === "entered" || t === "entering" ? 1 : t === "exiting" || t === "exited" ? 0 : 1}`,
  transform: `${(() => {
    switch (t) {
      case "entering":
      case "entered":
        return "translateX(0)";
      case "exiting":
      case "exited":
        return "translateX(-20px)";
      default:
        return "translateX(0)";
    }
  })()}`
})), vh = S.div(({ state: e }) => ({
  position: "fixed",
  boxSizing: "border-box",
  background: "rgba(0, 0, 0, 0.5)",
  top: 0,
  bottom: 0,
  right: 0,
  left: 0,
  zIndex: 10,
  transition: `all ${300}ms ease-in-out`,
  cursor: "pointer",
  opacity: `${(() => {
    switch (e) {
      case "entering":
      case "entered":
        return 1;
      case "exiting":
      case "exited":
        return 0;
      default:
        return 0;
    }
  })()}`,
  "&:hover": {
    background: "rgba(0, 0, 0, 0.6)"
  }
}));

// src/manager/components/mobile/navigation/MobileNavigation.tsx
var bh = /* @__PURE__ */ s(() => {
  let { index: e } = Ze(), t = pe(), o = t.getCurrentStoryData();
  if (!o)
    return "";
  let i = o.renderLabel?.(o, t) || o.name, n = e[o.id];
  for (; "parent" in n && n.parent && e[n.parent] && i.length < 24; )
    n = e[n.parent], i = `${n.renderLabel?.(n, t) || n.name}/${i}`;
  return i;
}, "useFullStoryName"), mu = /* @__PURE__ */ s(({ menu: e, panel: t, showPanel: o }) => {
  let { isMobileMenuOpen: i, isMobilePanelOpen: n, setMobileMenuOpen: r, setMobilePanelOpen: l } = ge(), u = bh();
  return /* @__PURE__ */ a.createElement(xh, null, /* @__PURE__ */ a.createElement(fu, null, e), n ? /* @__PURE__ */ a.createElement(au, null,
  t) : /* @__PURE__ */ a.createElement(Ih, { className: "sb-bar" }, /* @__PURE__ */ a.createElement(Sh, { onClick: () => r(!i), title: "Open\
 navigation menu" }, /* @__PURE__ */ a.createElement(Wr, null), /* @__PURE__ */ a.createElement(wh, null, u)), o && /* @__PURE__ */ a.createElement(
  te, { onClick: () => l(!0), title: "Open addon panel" }, /* @__PURE__ */ a.createElement(Sl, null))));
}, "MobileNavigation"), xh = S.div(({ theme: e }) => ({
  bottom: 0,
  left: 0,
  width: "100%",
  zIndex: 10,
  background: e.barBg,
  borderTop: `1px solid ${e.appBorderColor}`
})), Ih = S.div({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  height: 40,
  padding: "0 6px"
}), Sh = S.button(({ theme: e }) => ({
  all: "unset",
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: e.barTextColor,
  fontSize: `${e.typography.size.s2 - 1}px`,
  padding: "0 7px",
  fontWeight: e.typography.weight.bold,
  WebkitLineClamp: 1,
  "> svg": {
    width: 14,
    height: 14,
    flexShrink: 0
  }
})), wh = S.p({
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden"
});

// src/manager/components/layout/useDragging.ts
var hu = 30, Gr = 240, Yr = 270, gu = 0.9;
function yu(e, t, o) {
  return Math.min(Math.max(e, t), o);
}
s(yu, "clamp");
function vu(e, t, o) {
  return t + (o - t) * e;
}
s(vu, "interpolate");
function bu({
  setState: e,
  isPanelShown: t,
  isDesktop: o
}) {
  let i = G(null), n = G(null);
  return z(() => {
    let r = i.current, l = n.current, u = document.querySelector("#storybook-preview-wrapper"), p = null, c = /* @__PURE__ */ s((f) => {
      f.preventDefault(), e((y) => ({
        ...y,
        isDragging: !0
      })), f.currentTarget === r ? p = r : f.currentTarget === l && (p = l), window.addEventListener("mousemove", m), window.addEventListener(
      "mouseup", d), u && (u.style.pointerEvents = "none");
    }, "onDragStart"), d = /* @__PURE__ */ s((f) => {
      e((y) => p === l && y.navSize < Gr && y.navSize > 0 ? {
        ...y,
        isDragging: !1,
        navSize: Gr
      } : p === r && y.panelPosition === "right" && y.rightPanelWidth < Yr && y.rightPanelWidth > 0 ? {
        ...y,
        isDragging: !1,
        rightPanelWidth: Yr
      } : {
        ...y,
        isDragging: !1
      }), window.removeEventListener("mousemove", m), window.removeEventListener("mouseup", d), u?.removeAttribute("style"), p = null;
    }, "onDragEnd"), m = /* @__PURE__ */ s((f) => {
      if (f.buttons === 0) {
        d(f);
        return;
      }
      e((y) => {
        if (p === l) {
          let h = f.clientX;
          return h === y.navSize ? y : h <= hu ? {
            ...y,
            navSize: 0
          } : h <= Gr ? {
            ...y,
            navSize: vu(gu, h, Gr)
          } : {
            ...y,
            // @ts-expect-error (non strict)
            navSize: yu(h, 0, f.view.innerWidth)
          };
        }
        if (p === r) {
          let h = y.panelPosition === "bottom" ? "bottomPanelHeight" : "rightPanelWidth", v = y.panelPosition === "bottom" ? (
            // @ts-expect-error (non strict)
            f.view.innerHeight - f.clientY
          ) : (
            // @ts-expect-error (non strict)
            f.view.innerWidth - f.clientX
          );
          if (v === y[h])
            return y;
          if (v <= hu)
            return {
              ...y,
              [h]: 0
            };
          if (y.panelPosition === "right" && v <= Yr)
            return {
              ...y,
              [h]: vu(
                gu,
                v,
                Yr
              )
            };
          let I = (
            // @ts-expect-error (non strict)
            y.panelPosition === "bottom" ? f.view.innerHeight : f.view.innerWidth
          );
          return {
            ...y,
            [h]: yu(v, 0, I)
          };
        }
        return y;
      });
    }, "onDrag");
    return r?.addEventListener("mousedown", c), l?.addEventListener("mousedown", c), () => {
      r?.removeEventListener("mousedown", c), l?.removeEventListener("mousedown", c), u?.removeAttribute("style");
    };
  }, [
    // we need to rerun this effect when the panel is shown/hidden or when changing between mobile/desktop to re-attach the event listeners
    t,
    o,
    e
  ]), { panelResizerRef: i, sidebarResizerRef: n };
}
s(bu, "useDragging");

// src/manager/components/layout/Layout.tsx
var Eh = 100, xu = /* @__PURE__ */ s((e, t) => e.navSize === t.navSize && e.bottomPanelHeight === t.bottomPanelHeight && e.rightPanelWidth ===
t.rightPanelWidth && e.panelPosition === t.panelPosition, "layoutStateIsEqual"), Ch = /* @__PURE__ */ s(({
  managerLayoutState: e,
  setManagerLayoutState: t,
  isDesktop: o,
  hasTab: i
}) => {
  let n = a.useRef(e), [r, l] = U({
    ...e,
    isDragging: !1
  });
  z(() => {
    r.isDragging || // don't interrupt user's drag
    xu(e, n.current) || (n.current = e, l((h) => ({ ...h, ...e })));
  }, [r.isDragging, e, l]), Lt(() => {
    if (r.isDragging || // wait with syncing managerLayoutState until user is done dragging
    xu(e, r))
      return;
    let h = {
      navSize: r.navSize,
      bottomPanelHeight: r.bottomPanelHeight,
      rightPanelWidth: r.rightPanelWidth
    };
    n.current = {
      ...n.current,
      ...h
    }, t(h);
  }, [r, t]);
  let u = e.viewMode !== "story" && e.viewMode !== "docs", p = e.viewMode === "story" && !i, { panelResizerRef: c, sidebarResizerRef: d } = bu(
  {
    setState: l,
    isPanelShown: p,
    isDesktop: o
  }), { navSize: m, rightPanelWidth: f, bottomPanelHeight: y } = r.isDragging ? r : e;
  return {
    navSize: m,
    rightPanelWidth: f,
    bottomPanelHeight: y,
    panelPosition: e.panelPosition,
    panelResizerRef: c,
    sidebarResizerRef: d,
    showPages: u,
    showPanel: p,
    isDragging: r.isDragging
  };
}, "useLayoutSyncingState"), Su = /* @__PURE__ */ s(({ managerLayoutState: e, setManagerLayoutState: t, hasTab: o, ...i }) => {
  let { isDesktop: n, isMobile: r } = ge(), {
    navSize: l,
    rightPanelWidth: u,
    bottomPanelHeight: p,
    panelPosition: c,
    panelResizerRef: d,
    sidebarResizerRef: m,
    showPages: f,
    showPanel: y,
    isDragging: h
  } = Ch({ managerLayoutState: e, setManagerLayoutState: t, isDesktop: n, hasTab: o });
  return /* @__PURE__ */ a.createElement(
    Th,
    {
      navSize: l,
      rightPanelWidth: u,
      bottomPanelHeight: p,
      panelPosition: e.panelPosition,
      isDragging: h,
      viewMode: e.viewMode,
      showPanel: y
    },
    f && /* @__PURE__ */ a.createElement(Oh, null, i.slotPages),
    /* @__PURE__ */ a.createElement(Ra, { path: /(^\/story|docs|onboarding\/|^\/$)/, startsWith: !1 }, ({ match: v }) => /* @__PURE__ */ a.createElement(
    kh, { shown: !!v }, i.slotMain)),
    n && /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(_h, null, /* @__PURE__ */ a.createElement(Iu, { ref: m }),
    i.slotSidebar), y && /* @__PURE__ */ a.createElement(Ph, { position: c }, /* @__PURE__ */ a.createElement(
      Iu,
      {
        orientation: c === "bottom" ? "horizontal" : "vertical",
        position: c === "bottom" ? "left" : "right",
        ref: d
      }
    ), i.slotPanel)),
    r && /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(su, null), /* @__PURE__ */ a.createElement(
      mu,
      {
        menu: i.slotSidebar,
        panel: i.slotPanel,
        showPanel: y
      }
    ))
  );
}, "Layout"), Th = S.div(
  ({ navSize: e, rightPanelWidth: t, bottomPanelHeight: o, viewMode: i, panelPosition: n, showPanel: r }) => ({
    width: "100%",
    height: ["100vh", "100dvh"],
    // This array is a special Emotion syntax to set a fallback if 100dvh is not supported
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    [wt]: {
      display: "grid",
      gap: 0,
      gridTemplateColumns: `minmax(0, ${e}px) minmax(${Eh}px, 1fr) minmax(0, ${t}px)`,
      gridTemplateRows: `1fr minmax(0, ${o}px)`,
      gridTemplateAreas: i === "docs" || !r ? `"sidebar content content"
                  "sidebar content content"` : n === "right" ? `"sidebar content panel"
                  "sidebar content panel"` : `"sidebar content content"
                "sidebar panel   panel"`
    }
  })
), _h = S.div(({ theme: e }) => ({
  backgroundColor: e.background.app,
  gridArea: "sidebar",
  position: "relative",
  borderRight: `1px solid ${e.color.border}`
})), kh = S.div(({ theme: e, shown: t }) => ({
  flex: 1,
  position: "relative",
  backgroundColor: e.background.content,
  display: t ? "grid" : "none",
  // This is needed to make the content container fill the available space
  overflow: "auto",
  [wt]: {
    flex: "auto",
    gridArea: "content"
  }
})), Oh = S.div(({ theme: e }) => ({
  gridRowStart: "sidebar-start",
  gridRowEnd: "-1",
  gridColumnStart: "sidebar-end",
  gridColumnEnd: "-1",
  backgroundColor: e.background.content,
  zIndex: 1
})), Ph = S.div(
  ({ theme: e, position: t }) => ({
    gridArea: "panel",
    position: "relative",
    backgroundColor: e.background.content,
    borderTop: t === "bottom" ? `1px solid ${e.color.border}` : void 0,
    borderLeft: t === "right" ? `1px solid ${e.color.border}` : void 0
  })
), Iu = S.div(
  ({ theme: e }) => ({
    position: "absolute",
    opacity: 0,
    transition: "opacity 0.2s ease-in-out",
    zIndex: 100,
    "&:after": {
      content: '""',
      display: "block",
      backgroundColor: e.color.secondary
    },
    "&:hover": {
      opacity: 1
    }
  }),
  ({ orientation: e = "vertical", position: t = "left" }) => e === "vertical" ? {
    width: t === "left" ? 10 : 13,
    height: "100%",
    top: 0,
    right: t === "left" ? "-7px" : void 0,
    left: t === "right" ? "-7px" : void 0,
    "&:after": {
      width: 1,
      height: "100%",
      marginLeft: t === "left" ? 3 : 6
    },
    "&:hover": {
      cursor: "col-resize"
    }
  } : {
    width: "100%",
    height: "13px",
    top: "-7px",
    left: 0,
    "&:after": {
      width: "100%",
      height: 1,
      marginTop: 6
    },
    "&:hover": {
      cursor: "row-resize"
    }
  }
);

// global-externals:@storybook/core/types
var SO = __STORYBOOK_TYPES__, { Addon_TypesEnum: Ae } = __STORYBOOK_TYPES__;

// src/manager/container/Panel.tsx
var Eu = Ve(Zo(), 1);

// src/manager/components/panel/Panel.tsx
var Oi = class Oi extends Ge {
  constructor(t) {
    super(t), this.state = { hasError: !1 };
  }
  componentDidCatch(t, o) {
    this.setState({ hasError: !0 }), console.error(t, o);
  }
  // @ts-expect-error (we know this is broken)
  render() {
    let { hasError: t } = this.state, { children: o } = this.props;
    return t ? /* @__PURE__ */ a.createElement("h1", null, "Something went wrong.") : o;
  }
};
s(Oi, "SafeTab");
var _i = Oi, ki = a.memo(
  ({
    panels: e,
    shortcuts: t,
    actions: o,
    selectedPanel: i = null,
    panelPosition: n = "right",
    absolute: r = !0
  }) => {
    let { isDesktop: l, setMobilePanelOpen: u } = ge();
    return /* @__PURE__ */ a.createElement(
      bl,
      {
        absolute: r,
        ...i ? { selected: i } : {},
        menuName: "Addons",
        actions: o,
        showToolsWhenEmpty: !0,
        emptyState: /* @__PURE__ */ a.createElement(
          gl,
          {
            title: "Storybook add-ons",
            description: /* @__PURE__ */ a.createElement(a.Fragment, null, "Integrate your tools with Storybook to connect workflows and unl\
ock advanced features."),
            footer: /* @__PURE__ */ a.createElement(We, { href: "https://storybook.js.org/integrations", target: "_blank", withArrow: !0 }, /* @__PURE__ */ a.
            createElement(Ao, null), " Explore integrations catalog")
          }
        ),
        tools: /* @__PURE__ */ a.createElement(Ah, null, l ? /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(
          te,
          {
            key: "position",
            onClick: o.togglePosition,
            title: `Change addon orientation [${pt(
              t.panelPosition
            )}]`
          },
          n === "bottom" ? /* @__PURE__ */ a.createElement(Vr, null) : /* @__PURE__ */ a.createElement(Fr, null)
        ), /* @__PURE__ */ a.createElement(
          te,
          {
            key: "visibility",
            onClick: o.toggleVisibility,
            title: `Hide addons [${pt(t.togglePanel)}]`
          },
          /* @__PURE__ */ a.createElement(ct, null)
        )) : /* @__PURE__ */ a.createElement(te, { onClick: () => u(!1), title: "Close addon panel" }, /* @__PURE__ */ a.createElement(ct, null))),
        id: "storybook-panel-root"
      },
      Object.entries(e).map(([p, c]) => (
        // @ts-expect-error (we know this is broken)
        /* @__PURE__ */ a.createElement(_i, { key: p, id: p, title: typeof c.title == "function" ? /* @__PURE__ */ a.createElement(c.title, null) :
        c.title }, c.render)
      ))
    );
  }
);
ki.displayName = "AddonPanel";
var Ah = S.div({
  display: "flex",
  alignItems: "center",
  gap: 6
});

// src/manager/container/Panel.tsx
var Dh = (0, Eu.default)(1)((e) => ({
  onSelect: /* @__PURE__ */ s((t) => e.setSelectedPanel(t), "onSelect"),
  toggleVisibility: /* @__PURE__ */ s(() => e.togglePanel(), "toggleVisibility"),
  togglePosition: /* @__PURE__ */ s(() => e.togglePanelPosition(), "togglePosition")
})), Mh = /* @__PURE__ */ s((e) => {
  let t = e.getElements(Ae.PANEL), o = e.getCurrentStoryData();
  if (!t || !o || o.type !== "story")
    return t;
  let { parameters: i } = o, n = {};
  return Object.entries(t).forEach(([r, l]) => {
    let { paramKey: u } = l;
    u && i && i[u] && i[u].disable || (n[r] = l);
  }), n;
}, "getPanels"), Lh = /* @__PURE__ */ s(({ state: e, api: t }) => ({
  panels: Mh(t),
  selectedPanel: t.getSelectedPanel(),
  panelPosition: e.layout.panelPosition,
  actions: Dh(t),
  shortcuts: t.getShortcutKeys()
}), "mapper"), Nh = /* @__PURE__ */ s((e) => /* @__PURE__ */ a.createElement(me, { filter: Lh }, (t) => /* @__PURE__ */ a.createElement(ki, {
...e, ...t })), "Panel"), Cu = Nh;

// src/manager/container/Preview.tsx
var er = Ve(Zo(), 1);

// src/manager/components/preview/Iframe.tsx
var Fh = S.iframe(({ theme: e }) => ({
  backgroundColor: e.background.preview,
  display: "block",
  boxSizing: "content-box",
  height: "100%",
  width: "100%",
  border: "0 none",
  transition: "background-position 0s, visibility 0s",
  backgroundPosition: "-1px -1px, -1px -1px, -1px -1px, -1px -1px",
  margin: "auto",
  boxShadow: "0 0 100px 100vw rgba(0,0,0,0.5)"
}));
function Tu(e) {
  let { active: t, id: o, title: i, src: n, allowFullScreen: r, scale: l, ...u } = e, p = a.useRef(null);
  return /* @__PURE__ */ a.createElement(xl.IFrame, { scale: l, active: t, iFrameRef: p }, /* @__PURE__ */ a.createElement(
    Fh,
    {
      "data-is-storybook": t ? "true" : "false",
      onLoad: (c) => c.currentTarget.setAttribute("data-is-loaded", "true"),
      id: o,
      title: i,
      src: n,
      allow: "clipboard-write;",
      allowFullScreen: r,
      ref: p,
      ...u
    }
  ));
}
s(Tu, "IFrame");

// src/manager/components/preview/utils/stringifyQueryParams.tsx
var Ru = Ve(Hu(), 1);
var zu = /* @__PURE__ */ s((e) => {
  let t = (0, Ru.stringify)(e);
  return t === "" ? "" : `&${t}`;
}, "stringifyQueryParams");

// src/manager/components/preview/FramesRenderer.tsx
var lg = /* @__PURE__ */ s((e, t) => e && t[e] ? `storybook-ref-${e}` : "storybook-preview-iframe", "getActive"), ug = S(fe)(({ theme: e }) => ({
  display: "none",
  "@media (min-width: 600px)": {
    position: "absolute",
    display: "block",
    top: 10,
    right: 15,
    padding: "10px 15px",
    fontSize: e.typography.size.s1,
    transform: "translateY(-100px)",
    "&:focus": {
      transform: "translateY(0)",
      zIndex: 1
    }
  }
})), pg = /* @__PURE__ */ s(({ api: e, state: t }) => ({
  isFullscreen: e.getIsFullscreen(),
  isNavShown: e.getIsNavShown(),
  selectedStoryId: t.storyId
}), "whenSidebarIsVisible"), cg = {
  '#root [data-is-storybook="false"]': {
    display: "none"
  },
  '#root [data-is-storybook="true"]': {
    display: "block"
  }
}, Wu = /* @__PURE__ */ s(({
  refs: e,
  scale: t,
  viewMode: o = "story",
  refId: i,
  queryParams: n = {},
  baseUrl: r,
  storyId: l = "*"
}) => {
  let u = e[i]?.version, p = zu({
    ...n,
    ...u && { version: u }
  }), c = lg(i, e), { current: d } = G({}), m = Object.values(e).filter((f) => f.type === "auto-inject" || f.id === i, {});
  return d["storybook-preview-iframe"] || (d["storybook-preview-iframe"] = Oo(r, l, {
    ...n,
    ...u && { version: u },
    viewMode: o
  })), m.forEach((f) => {
    let y = `storybook-ref-${f.id}`, h = d[y]?.split("/iframe.html")[0];
    if (!h || f.url !== h) {
      let v = `${f.url}/iframe.html?id=${l}&viewMode=${o}&refId=${f.id}${p}`;
      d[y] = v;
    }
  }), /* @__PURE__ */ a.createElement(Ne, null, /* @__PURE__ */ a.createElement(Eo, { styles: cg }), /* @__PURE__ */ a.createElement(me, { filter: pg },
  ({ isFullscreen: f, isNavShown: y, selectedStoryId: h }) => f || !y || !h ? null : /* @__PURE__ */ a.createElement(ug, { asChild: !0 }, /* @__PURE__ */ a.
  createElement("a", { href: `#${h}`, tabIndex: 0, title: "Skip to sidebar" }, "Skip to sidebar"))), Object.entries(d).map(([f, y]) => /* @__PURE__ */ a.
  createElement(Ne, { key: f }, /* @__PURE__ */ a.createElement(
    Tu,
    {
      active: f === c,
      key: f,
      id: f,
      title: f,
      src: y,
      allowFullScreen: !0,
      scale: t
    }
  ))));
}, "FramesRenderer");

// src/manager/components/preview/tools/addons.tsx
var dg = /* @__PURE__ */ s(({ api: e, state: t }) => ({
  isVisible: e.getIsPanelShown(),
  singleStory: t.singleStory,
  panelPosition: t.layout.panelPosition,
  toggle: /* @__PURE__ */ s(() => e.togglePanel(), "toggle")
}), "menuMapper"), ju = {
  title: "addons",
  id: "addons",
  type: we.TOOL,
  match: /* @__PURE__ */ s(({ viewMode: e, tabId: t }) => e === "story" && !t, "match"),
  render: /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(me, { filter: dg }, ({ isVisible: e, toggle: t, singleStory: o, panelPosition: i }) => !o &&
  !e && /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(te, { "aria-label": "Show addons", key: "addons", onClick: t,
  title: "Show addons" }, i === "bottom" ? /* @__PURE__ */ a.createElement(Fr, null) : /* @__PURE__ */ a.createElement(Vr, null)))), "render")
};

// src/manager/components/preview/tools/copy.tsx
var Gu = Ve(qu(), 1);
var { PREVIEW_URL: yg, document: vg } = re, bg = /* @__PURE__ */ s(({ state: e }) => {
  let { storyId: t, refId: o, refs: i } = e, { location: n } = vg, r = i[o], l = `${n.origin}${n.pathname}`;
  return l.endsWith("/") || (l += "/"), {
    refId: o,
    baseUrl: r ? `${r.url}/iframe.html` : yg || `${l}iframe.html`,
    storyId: t,
    queryParams: e.customQueryParams
  };
}, "copyMapper"), Yu = {
  title: "copy",
  id: "copy",
  type: we.TOOL,
  match: /* @__PURE__ */ s(({ viewMode: e, tabId: t }) => e === "story" && !t, "match"),
  render: /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(me, { filter: bg }, ({ baseUrl: e, storyId: t, queryParams: o }) => t ? /* @__PURE__ */ a.
  createElement(
    te,
    {
      key: "copy",
      onClick: () => (0, Gu.default)(Oo(e, t, o)),
      title: "Copy canvas link"
    },
    /* @__PURE__ */ a.createElement(Ll, null)
  ) : null), "render")
};

// src/manager/components/preview/tools/eject.tsx
var { PREVIEW_URL: xg } = re, Ig = /* @__PURE__ */ s(({ state: e }) => {
  let { storyId: t, refId: o, refs: i } = e, n = i[o];
  return {
    refId: o,
    baseUrl: n ? `${n.url}/iframe.html` : xg || "iframe.html",
    storyId: t,
    queryParams: e.customQueryParams
  };
}, "ejectMapper"), Xu = {
  title: "eject",
  id: "eject",
  type: we.TOOL,
  match: /* @__PURE__ */ s(({ viewMode: e, tabId: t }) => e === "story" && !t, "match"),
  render: /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(me, { filter: Ig }, ({ baseUrl: e, storyId: t, queryParams: o }) => t ? /* @__PURE__ */ a.
  createElement(te, { key: "opener", asChild: !0 }, /* @__PURE__ */ a.createElement(
    "a",
    {
      href: Oo(e, t, o),
      target: "_blank",
      rel: "noopener noreferrer",
      title: "Open canvas in new tab"
    },
    /* @__PURE__ */ a.createElement(Tt, null)
  )) : null), "render")
};

// src/manager/components/preview/tools/remount.tsx
var Sg = S(te)(({ theme: e, animating: t, disabled: o }) => ({
  opacity: o ? 0.5 : 1,
  svg: {
    animation: t ? `${e.animation.rotate360} 1000ms ease-out` : void 0
  }
})), wg = /* @__PURE__ */ s(({ api: e, state: t }) => {
  let { storyId: o } = t;
  return {
    storyId: o,
    remount: /* @__PURE__ */ s(() => e.emit(Xn, { storyId: t.storyId }), "remount"),
    api: e
  };
}, "menuMapper"), Qu = {
  title: "remount",
  id: "remount",
  type: we.TOOL,
  match: /* @__PURE__ */ s(({ viewMode: e, tabId: t }) => e === "story" && !t, "match"),
  render: /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(me, { filter: wg }, ({ remount: e, storyId: t, api: o }) => {
    let [i, n] = U(!1), r = /* @__PURE__ */ s(() => {
      t && e();
    }, "remountComponent");
    return o.on(Xn, () => {
      n(!0);
    }), /* @__PURE__ */ a.createElement(
      Sg,
      {
        key: "remount",
        title: "Remount component",
        onClick: r,
        onAnimationEnd: () => n(!1),
        animating: i,
        disabled: !t
      },
      /* @__PURE__ */ a.createElement(Ft, null)
    );
  }), "render")
};

// src/manager/components/preview/tools/zoom.tsx
var Jo = 1, Zu = So({ value: Jo, set: /* @__PURE__ */ s((e) => {
}, "set") }), Bi = class Bi extends Ge {
  constructor() {
    super(...arguments);
    this.state = {
      value: Jo
    };
    this.set = /* @__PURE__ */ s((o) => this.setState({ value: o }), "set");
  }
  render() {
    let { children: o, shouldScale: i } = this.props, { set: n } = this, { value: r } = this.state;
    return /* @__PURE__ */ a.createElement(Zu.Provider, { value: { value: i ? r : Jo, set: n } }, o);
  }
};
s(Bi, "ZoomProvider");
var en = Bi, { Consumer: Fi } = Zu, Eg = Uo(/* @__PURE__ */ s(function({ zoomIn: t, zoomOut: o, reset: i }) {
  return /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(te, { key: "zoomin", onClick: t, title: "Zoom in" },
  /* @__PURE__ */ a.createElement(Kl, null)), /* @__PURE__ */ a.createElement(te, { key: "zoomout", onClick: o, title: "Zoom out" }, /* @__PURE__ */ a.
  createElement(Ul, null)), /* @__PURE__ */ a.createElement(te, { key: "zoomreset", onClick: i, title: "Reset zoom" }, /* @__PURE__ */ a.createElement(
  ql, null)));
}, "Zoom"));
var Cg = Uo(/* @__PURE__ */ s(function({
  set: t,
  value: o
}) {
  let i = M(
    (l) => {
      l.preventDefault(), t(0.8 * o);
    },
    [t, o]
  ), n = M(
    (l) => {
      l.preventDefault(), t(1.25 * o);
    },
    [t, o]
  ), r = M(
    (l) => {
      l.preventDefault(), t(Jo);
    },
    [t, Jo]
  );
  return /* @__PURE__ */ a.createElement(Eg, { key: "zoom", zoomIn: i, zoomOut: n, reset: r });
}, "ZoomWrapper"));
function Tg() {
  return /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(Fi, null, ({ set: e, value: t }) => /* @__PURE__ */ a.
  createElement(Cg, { set: e, value: t })), /* @__PURE__ */ a.createElement(ko, null));
}
s(Tg, "ZoomToolRenderer");
var Ju = {
  title: "zoom",
  id: "zoom",
  type: we.TOOL,
  match: /* @__PURE__ */ s(({ viewMode: e, tabId: t }) => e === "story" && !t, "match"),
  render: Tg
};

// src/manager/components/preview/Toolbar.tsx
var _g = /* @__PURE__ */ s(({ api: e, state: t }) => ({
  toggle: e.toggleFullscreen,
  isFullscreen: e.getIsFullscreen(),
  shortcut: pt(e.getShortcutKeys().fullScreen),
  hasPanel: Object.keys(e.getElements(Ae.PANEL)).length > 0,
  singleStory: t.singleStory
}), "fullScreenMapper"), tp = {
  title: "fullscreen",
  id: "fullscreen",
  type: we.TOOL,
  // @ts-expect-error (non strict)
  match: /* @__PURE__ */ s((e) => ["story", "docs"].includes(e.viewMode), "match"),
  render: /* @__PURE__ */ s(() => {
    let { isMobile: e } = ge();
    return e ? null : /* @__PURE__ */ a.createElement(me, { filter: _g }, ({ toggle: t, isFullscreen: o, shortcut: i, hasPanel: n, singleStory: r }) => (!r ||
    r && n) && /* @__PURE__ */ a.createElement(
      te,
      {
        key: "full",
        onClick: t,
        title: `${o ? "Exit full screen" : "Go full screen"} [${i}]`,
        "aria-label": o ? "Exit full screen" : "Go full screen"
      },
      o ? /* @__PURE__ */ a.createElement(ct, null) : /* @__PURE__ */ a.createElement(kl, null)
    ));
  }, "render")
};
var op = a.memo(/* @__PURE__ */ s(function({
  isShown: t,
  tools: o,
  toolsExtra: i,
  tabs: n,
  tabId: r,
  api: l
}) {
  return n || o || i ? /* @__PURE__ */ a.createElement(Og, { className: "sb-bar", key: "toolbar", shown: t, "data-test-id": "sb-preview-tool\
bar" }, /* @__PURE__ */ a.createElement(Pg, null, /* @__PURE__ */ a.createElement(rp, null, n.length > 1 ? /* @__PURE__ */ a.createElement(Ne,
  null, /* @__PURE__ */ a.createElement(Mr, { key: "tabs" }, n.map((u, p) => /* @__PURE__ */ a.createElement(
    Lr,
    {
      disabled: u.disabled,
      active: u.id === r || u.id === "canvas" && !r,
      onClick: () => {
        l.applyQueryParams({ tab: u.id === "canvas" ? void 0 : u.id });
      },
      key: u.id || `tab-${p}`
    },
    u.title
  ))), /* @__PURE__ */ a.createElement(ko, null)) : null, /* @__PURE__ */ a.createElement(ep, { key: "left", list: o })), /* @__PURE__ */ a.
  createElement(Ag, null, /* @__PURE__ */ a.createElement(ep, { key: "right", list: i })))) : null;
}, "ToolbarComp")), ep = a.memo(/* @__PURE__ */ s(function({ list: t }) {
  return /* @__PURE__ */ a.createElement(a.Fragment, null, t.filter(Boolean).map(({ render: o, id: i, ...n }, r) => (
    // @ts-expect-error (Converted from ts-ignore)
    /* @__PURE__ */ a.createElement(o, { key: i || n.key || `f-${r}` })
  )));
}, "Tools"));
function kg(e, t) {
  let o = t?.type === "story" && t?.prepared ? t?.parameters : {}, i = "toolbar" in o ? o.toolbar : void 0, { toolbar: n } = ut.getConfig(),
  r = vr(
    n || {},
    i || {}
  );
  return r ? !!r[e?.id]?.hidden : !1;
}
s(kg, "toolbarItemHasBeenExcluded");
function Hi(e, t, o, i, n, r) {
  let l = /* @__PURE__ */ s((u) => u && (!u.match || u.match({
    storyId: t?.id,
    refId: t?.refId,
    viewMode: o,
    location: i,
    path: n,
    tabId: r
  })) && !kg(u, t), "filter");
  return e.filter(l);
}
s(Hi, "filterToolsSide");
var Og = S.div(({ theme: e, shown: t }) => ({
  position: "relative",
  color: e.barTextColor,
  width: "100%",
  height: 40,
  flexShrink: 0,
  overflowX: "auto",
  overflowY: "hidden",
  marginTop: t ? 0 : -40,
  boxShadow: `${e.appBorderColor}  0 -1px 0 0 inset`,
  background: e.barBg,
  zIndex: 4
})), Pg = S.div({
  position: "absolute",
  width: "calc(100% - 20px)",
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "nowrap",
  flexShrink: 0,
  height: 40,
  marginLeft: 10,
  marginRight: 10
}), rp = S.div({
  display: "flex",
  whiteSpace: "nowrap",
  flexBasis: "auto",
  gap: 6,
  alignItems: "center"
}), Ag = S(rp)({
  marginLeft: 30
});

// src/manager/components/preview/utils/components.ts
var np = S.main({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  overflow: "hidden"
}), ip = S.div({
  overflow: "auto",
  width: "100%",
  zIndex: 3,
  background: "transparent",
  flex: 1
}), sp = S.div(
  {
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    justifyItems: "center",
    overflow: "auto",
    gridTemplateColumns: "100%",
    gridTemplateRows: "100%",
    position: "relative",
    width: "100%",
    height: "100%"
  },
  ({ show: e }) => ({ display: e ? "grid" : "none" })
), lA = S(Ir)({
  color: "inherit",
  textDecoration: "inherit",
  display: "inline-block"
}), uA = S.span({
  // Hides full screen icon at mobile breakpoint defined in app.js
  "@media (max-width: 599px)": {
    display: "none"
  }
}), tn = S.div(({ theme: e }) => ({
  alignContent: "center",
  alignItems: "center",
  justifyContent: "center",
  justifyItems: "center",
  overflow: "auto",
  display: "grid",
  gridTemplateColumns: "100%",
  gridTemplateRows: "100%",
  position: "relative",
  width: "100%",
  height: "100%"
})), ap = S.div(({ theme: e }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  background: e.background.preview,
  zIndex: 1
}));

// src/manager/components/preview/Wrappers.tsx
var lp = /* @__PURE__ */ s(({
  wrappers: e,
  id: t,
  storyId: o,
  children: i
}) => /* @__PURE__ */ a.createElement(Ne, null, e.reduceRight(
  (n, r, l) => /* @__PURE__ */ a.createElement(r.render, { index: l, children: n, id: t, storyId: o }),
  i
)), "ApplyWrappers"), up = [
  {
    id: "iframe-wrapper",
    type: Ae.PREVIEW,
    render: /* @__PURE__ */ s((e) => /* @__PURE__ */ a.createElement(tn, { id: "storybook-preview-wrapper" }, e.children), "render")
  }
];

// src/manager/components/preview/Preview.tsx
var Mg = /* @__PURE__ */ s(({ state: e, api: t }) => ({
  storyId: e.storyId,
  refId: e.refId,
  viewMode: e.viewMode,
  customCanvas: t.renderPreview,
  queryParams: e.customQueryParams,
  getElements: t.getElements,
  entry: t.getData(e.storyId, e.refId),
  previewInitialized: e.previewInitialized,
  refs: e.refs
}), "canvasMapper"), pp = /* @__PURE__ */ s(() => ({
  id: "canvas",
  type: we.TAB,
  title: "Canvas",
  route: /* @__PURE__ */ s(({ storyId: e, refId: t }) => t ? `/story/${t}_${e}` : `/story/${e}`, "route"),
  match: /* @__PURE__ */ s(({ viewMode: e }) => !!(e && e.match(/^(story|docs)$/)), "match"),
  render: /* @__PURE__ */ s(() => null, "render")
}), "createCanvasTab"), cp = a.memo(/* @__PURE__ */ s(function(t) {
  let {
    api: o,
    id: i,
    options: n,
    viewMode: r,
    storyId: l,
    entry: u = void 0,
    description: p,
    baseUrl: c,
    withLoader: d = !0,
    tools: m,
    toolsExtra: f,
    tabs: y,
    wrappers: h,
    tabId: v
  } = t, I = y.find((g) => g.id === v)?.render, C = r === "story", { showToolbar: b } = n, x = G(l);
  return z(() => {
    if (u && r) {
      if (l === x.current)
        return;
      if (x.current = l, r.match(/docs|story/)) {
        let { refId: g, id: w } = u;
        o.emit(_a, {
          storyId: w,
          viewMode: r,
          options: { target: g }
        });
      }
    }
  }, [u, r, l, o]), /* @__PURE__ */ a.createElement(Ne, null, i === "main" && /* @__PURE__ */ a.createElement(Xo, { key: "description" }, /* @__PURE__ */ a.
  createElement("title", null, p)), /* @__PURE__ */ a.createElement(en, { shouldScale: C }, /* @__PURE__ */ a.createElement(np, null, /* @__PURE__ */ a.
  createElement(
    op,
    {
      key: "tools",
      isShown: b,
      tabId: v,
      tabs: y,
      tools: m,
      toolsExtra: f,
      api: o
    }
  ), /* @__PURE__ */ a.createElement(ip, { key: "frame" }, I && /* @__PURE__ */ a.createElement(tn, null, I({ active: !0 })), /* @__PURE__ */ a.
  createElement(sp, { show: !v }, /* @__PURE__ */ a.createElement(Lg, { withLoader: d, baseUrl: c, wrappers: h }))))));
}, "Preview"));
var Lg = /* @__PURE__ */ s(({ baseUrl: e, withLoader: t, wrappers: o }) => /* @__PURE__ */ a.createElement(me, { filter: Mg }, ({
  entry: i,
  refs: n,
  customCanvas: r,
  storyId: l,
  refId: u,
  viewMode: p,
  queryParams: c,
  previewInitialized: d
}) => {
  let m = "canvas", [f, y] = U(void 0);
  z(() => {
    if (re.CONFIG_TYPE === "DEVELOPMENT")
      try {
        ut.getChannel().on(Ea, (x) => {
          y(x);
        });
      } catch {
      }
  }, []);
  let h = !!n[u] && !n[u].previewInitialized, v = !(f?.value === 1 || f === void 0), I = !u && (!d || v), C = i && h || I;
  return /* @__PURE__ */ a.createElement(Fi, null, ({ value: b }) => /* @__PURE__ */ a.createElement(a.Fragment, null, t && C && /* @__PURE__ */ a.
  createElement(ap, null, /* @__PURE__ */ a.createElement(Pr, { id: "preview-loader", role: "progressbar", progress: f })), /* @__PURE__ */ a.
  createElement(lp, { id: m, storyId: l, viewMode: p, wrappers: o }, r ? r(l, p, m, e, b, c) : /* @__PURE__ */ a.createElement(
    Wu,
    {
      baseUrl: e,
      refs: n,
      scale: b,
      entry: i,
      viewMode: p,
      refId: u,
      queryParams: c,
      storyId: l
    }
  ))));
}), "Canvas");
function dp(e, t) {
  let { previewTabs: o } = ut.getConfig(), i = t ? t.previewTabs : void 0;
  if (o || i) {
    let n = vr(o || {}, i || {}), r = Object.keys(n).map((l, u) => ({
      index: u,
      ...typeof n[l] == "string" ? { title: n[l] } : n[l],
      id: l
    }));
    return e.filter((l) => {
      let u = r.find((p) => p.id === l.id);
      return u === void 0 || u.id === "canvas" || !u.hidden;
    }).map((l, u) => ({ ...l, index: u })).sort((l, u) => {
      let p = r.find((f) => f.id === l.id), c = p ? p.index : r.length + l.index, d = r.find((f) => f.id === u.id), m = d ? d.index : r.length +
      u.index;
      return c - m;
    }).map((l) => {
      let u = r.find((p) => p.id === l.id);
      return u ? {
        ...l,
        title: u.title || l.title,
        disabled: u.disabled,
        hidden: u.hidden
      } : l;
    });
  }
  return e;
}
s(dp, "filterTabs");

// src/manager/components/preview/tools/menu.tsx
var Ng = /* @__PURE__ */ s(({ api: e, state: t }) => ({
  isVisible: e.getIsNavShown(),
  singleStory: t.singleStory,
  toggle: /* @__PURE__ */ s(() => e.toggleNav(), "toggle")
}), "menuMapper"), fp = {
  title: "menu",
  id: "menu",
  type: we.TOOL,
  // @ts-expect-error (non strict)
  match: /* @__PURE__ */ s(({ viewMode: e }) => ["story", "docs"].includes(e), "match"),
  render: /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(me, { filter: Ng }, ({ isVisible: e, toggle: t, singleStory: o }) => !o &&
  !e && /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(te, { "aria-label": "Show sidebar", key: "menu", onClick: t,
  title: "Show sidebar" }, /* @__PURE__ */ a.createElement(Wr, null)), /* @__PURE__ */ a.createElement(ko, null))), "render")
};

// src/manager/container/Preview.tsx
var Fg = [pp()], Bg = [fp, Qu, Ju], Hg = [ju, tp, Xu, Yu], Rg = [], zg = (0, er.default)(1)(
  (e, t, o, i) => i ? dp([...Fg, ...Object.values(t)], o) : Rg
), Wg = (0, er.default)(1)(
  (e, t, o) => Hi([...Bg, ...Object.values(t)], ...o)
), jg = (0, er.default)(1)(
  (e, t, o) => Hi([...Hg, ...Object.values(t)], ...o)
), Vg = (0, er.default)(1)((e, t) => [
  ...up,
  ...Object.values(t)
]), { PREVIEW_URL: $g } = re, Kg = /* @__PURE__ */ s((e) => e.split("/").join(" / ").replace(/\s\s/, " "), "splitTitleAddExtraSpace"), Ug = /* @__PURE__ */ s(
(e) => {
  if (e?.type === "story" || e?.type === "docs") {
    let { title: t, name: o } = e;
    return t && o ? Kg(`${t} - ${o} \u22C5 Storybook`) : "Storybook";
  }
  return e?.name ? `${e.name} \u22C5 Storybook` : "Storybook";
}, "getDescription"), qg = /* @__PURE__ */ s(({
  api: e,
  state: t
  // @ts-expect-error (non strict)
}) => {
  let { layout: o, location: i, customQueryParams: n, storyId: r, refs: l, viewMode: u, path: p, refId: c } = t, d = e.getData(r, c), m = Object.
  values(e.getElements(Ae.TAB)), f = Object.values(e.getElements(Ae.PREVIEW)), y = Object.values(e.getElements(Ae.TOOL)), h = Object.values(
  e.getElements(Ae.TOOLEXTRA)), v = e.getQueryParam("tab"), I = Wg(y.length, e.getElements(Ae.TOOL), [
    d,
    u,
    i,
    p,
    // @ts-expect-error (non strict)
    v
  ]), C = jg(
    h.length,
    e.getElements(Ae.TOOLEXTRA),
    // @ts-expect-error (non strict)
    [d, u, i, p, v]
  );
  return {
    api: e,
    entry: d,
    options: o,
    description: Ug(d),
    viewMode: u,
    refs: l,
    storyId: r,
    baseUrl: $g || "iframe.html",
    queryParams: n,
    tools: I,
    toolsExtra: C,
    tabs: zg(
      m.length,
      e.getElements(Ae.TAB),
      d ? d.parameters : void 0,
      o.showTabs
    ),
    wrappers: Vg(
      f.length,
      e.getElements(Ae.PREVIEW)
    ),
    tabId: v
  };
}, "mapper"), Gg = a.memo(/* @__PURE__ */ s(function(t) {
  return /* @__PURE__ */ a.createElement(me, { filter: qg }, (o) => /* @__PURE__ */ a.createElement(cp, { ...t, ...o }));
}, "PreviewConnected")), mp = Gg;

// src/manager/hooks/useDebounce.ts
function hp(e, t) {
  let [o, i] = U(e);
  return z(() => {
    let n = setTimeout(() => {
      i(e);
    }, t);
    return () => {
      clearTimeout(n);
    };
  }, [e, t]), o;
}
s(hp, "useDebounce");

// src/manager/hooks/useMeasure.tsx
function gp() {
  let [e, t] = a.useState({
    width: null,
    height: null
  }), o = a.useRef(null);
  return [a.useCallback((n) => {
    if (o.current && (o.current.disconnect(), o.current = null), n?.nodeType === Node.ELEMENT_NODE) {
      let r = new ResizeObserver(([l]) => {
        if (l && l.borderBoxSize) {
          let { inlineSize: u, blockSize: p } = l.borderBoxSize[0];
          t({ width: u, height: p });
        }
      });
      r.observe(n), o.current = r;
    }
  }, []), e];
}
s(gp, "useMeasure");

// ../node_modules/@tanstack/virtual-core/dist/esm/utils.js
function oo(e, t, o) {
  let i = o.initialDeps ?? [], n;
  return () => {
    var r, l, u, p;
    let c;
    o.key && ((r = o.debug) != null && r.call(o)) && (c = Date.now());
    let d = e();
    if (!(d.length !== i.length || d.some((y, h) => i[h] !== y)))
      return n;
    i = d;
    let f;
    if (o.key && ((l = o.debug) != null && l.call(o)) && (f = Date.now()), n = t(...d), o.key && ((u = o.debug) != null && u.call(o))) {
      let y = Math.round((Date.now() - c) * 100) / 100, h = Math.round((Date.now() - f) * 100) / 100, v = h / 16, I = /* @__PURE__ */ s((C, b) => {
        for (C = String(C); C.length < b; )
          C = " " + C;
        return C;
      }, "pad");
      console.info(
        `%c\u23F1 ${I(h, 5)} /${I(y, 5)} ms`,
        `
            font-size: .6rem;
            font-weight: bold;
            color: hsl(${Math.max(
          0,
          Math.min(120 - 120 * v, 120)
        )}deg 100% 31%);`,
        o?.key
      );
    }
    return (p = o?.onChange) == null || p.call(o, n), n;
  };
}
s(oo, "memo");
function on(e, t) {
  if (e === void 0)
    throw new Error(`Unexpected undefined${t ? `: ${t}` : ""}`);
  return e;
}
s(on, "notUndefined");
var yp = /* @__PURE__ */ s((e, t) => Math.abs(e - t) < 1, "approxEqual");

// ../node_modules/@tanstack/virtual-core/dist/esm/index.js
var Yg = /* @__PURE__ */ s((e) => e, "defaultKeyExtractor"), Xg = /* @__PURE__ */ s((e) => {
  let t = Math.max(e.startIndex - e.overscan, 0), o = Math.min(e.endIndex + e.overscan, e.count - 1), i = [];
  for (let n = t; n <= o; n++)
    i.push(n);
  return i;
}, "defaultRangeExtractor"), vp = /* @__PURE__ */ s((e, t) => {
  let o = e.scrollElement;
  if (!o)
    return;
  let i = /* @__PURE__ */ s((r) => {
    let { width: l, height: u } = r;
    t({ width: Math.round(l), height: Math.round(u) });
  }, "handler");
  if (i(o.getBoundingClientRect()), typeof ResizeObserver > "u")
    return () => {
    };
  let n = new ResizeObserver((r) => {
    let l = r[0];
    if (l?.borderBoxSize) {
      let u = l.borderBoxSize[0];
      if (u) {
        i({ width: u.inlineSize, height: u.blockSize });
        return;
      }
    }
    i(o.getBoundingClientRect());
  });
  return n.observe(o, { box: "border-box" }), () => {
    n.unobserve(o);
  };
}, "observeElementRect");
var bp = /* @__PURE__ */ s((e, t) => {
  let o = e.scrollElement;
  if (!o)
    return;
  let i = /* @__PURE__ */ s(() => {
    t(o[e.options.horizontal ? "scrollLeft" : "scrollTop"]);
  }, "handler");
  return i(), o.addEventListener("scroll", i, {
    passive: !0
  }), () => {
    o.removeEventListener("scroll", i);
  };
}, "observeElementOffset");
var Qg = /* @__PURE__ */ s((e, t, o) => {
  if (t?.borderBoxSize) {
    let i = t.borderBoxSize[0];
    if (i)
      return Math.round(
        i[o.options.horizontal ? "inlineSize" : "blockSize"]
      );
  }
  return Math.round(
    e.getBoundingClientRect()[o.options.horizontal ? "width" : "height"]
  );
}, "measureElement");
var xp = /* @__PURE__ */ s((e, {
  adjustments: t = 0,
  behavior: o
}, i) => {
  var n, r;
  let l = e + t;
  (r = (n = i.scrollElement) == null ? void 0 : n.scrollTo) == null || r.call(n, {
    [i.options.horizontal ? "left" : "top"]: l,
    behavior: o
  });
}, "elementScroll"), Ri = class Ri {
  constructor(t) {
    this.unsubs = [], this.scrollElement = null, this.isScrolling = !1, this.isScrollingTimeoutId = null, this.scrollToIndexTimeoutId = null,
    this.measurementsCache = [], this.itemSizeCache = /* @__PURE__ */ new Map(), this.pendingMeasuredCacheIndexes = [], this.scrollDirection =
    null, this.scrollAdjustments = 0, this.measureElementCache = /* @__PURE__ */ new Map(), this.observer = /* @__PURE__ */ (() => {
      let o = null, i = /* @__PURE__ */ s(() => o || (typeof ResizeObserver < "u" ? o = new ResizeObserver((n) => {
        n.forEach((r) => {
          this._measureElement(r.target, r);
        });
      }) : null), "get");
      return {
        disconnect: /* @__PURE__ */ s(() => {
          var n;
          return (n = i()) == null ? void 0 : n.disconnect();
        }, "disconnect"),
        observe: /* @__PURE__ */ s((n) => {
          var r;
          return (r = i()) == null ? void 0 : r.observe(n, { box: "border-box" });
        }, "observe"),
        unobserve: /* @__PURE__ */ s((n) => {
          var r;
          return (r = i()) == null ? void 0 : r.unobserve(n);
        }, "unobserve")
      };
    })(), this.range = null, this.setOptions = (o) => {
      Object.entries(o).forEach(([i, n]) => {
        typeof n > "u" && delete o[i];
      }), this.options = {
        debug: !1,
        initialOffset: 0,
        overscan: 1,
        paddingStart: 0,
        paddingEnd: 0,
        scrollPaddingStart: 0,
        scrollPaddingEnd: 0,
        horizontal: !1,
        getItemKey: Yg,
        rangeExtractor: Xg,
        onChange: /* @__PURE__ */ s(() => {
        }, "onChange"),
        measureElement: Qg,
        initialRect: { width: 0, height: 0 },
        scrollMargin: 0,
        gap: 0,
        scrollingDelay: 150,
        indexAttribute: "data-index",
        initialMeasurementsCache: [],
        lanes: 1,
        ...o
      };
    }, this.notify = (o) => {
      var i, n;
      (n = (i = this.options).onChange) == null || n.call(i, this, o);
    }, this.maybeNotify = oo(
      () => (this.calculateRange(), [
        this.isScrolling,
        this.range ? this.range.startIndex : null,
        this.range ? this.range.endIndex : null
      ]),
      (o) => {
        this.notify(o);
      },
      {
        key: !1,
        debug: /* @__PURE__ */ s(() => this.options.debug, "debug"),
        initialDeps: [
          this.isScrolling,
          this.range ? this.range.startIndex : null,
          this.range ? this.range.endIndex : null
        ]
      }
    ), this.cleanup = () => {
      this.unsubs.filter(Boolean).forEach((o) => o()), this.unsubs = [], this.scrollElement = null;
    }, this._didMount = () => (this.measureElementCache.forEach(this.observer.observe), () => {
      this.observer.disconnect(), this.cleanup();
    }), this._willUpdate = () => {
      let o = this.options.getScrollElement();
      this.scrollElement !== o && (this.cleanup(), this.scrollElement = o, this._scrollToOffset(this.scrollOffset, {
        adjustments: void 0,
        behavior: void 0
      }), this.unsubs.push(
        this.options.observeElementRect(this, (i) => {
          this.scrollRect = i, this.maybeNotify();
        })
      ), this.unsubs.push(
        this.options.observeElementOffset(this, (i) => {
          this.scrollAdjustments = 0, this.scrollOffset !== i && (this.isScrollingTimeoutId !== null && (clearTimeout(this.isScrollingTimeoutId),
          this.isScrollingTimeoutId = null), this.isScrolling = !0, this.scrollDirection = this.scrollOffset < i ? "forward" : "backward", this.
          scrollOffset = i, this.maybeNotify(), this.isScrollingTimeoutId = setTimeout(() => {
            this.isScrollingTimeoutId = null, this.isScrolling = !1, this.scrollDirection = null, this.maybeNotify();
          }, this.options.scrollingDelay));
        })
      ));
    }, this.getSize = () => this.scrollRect[this.options.horizontal ? "width" : "height"], this.memoOptions = oo(
      () => [
        this.options.count,
        this.options.paddingStart,
        this.options.scrollMargin,
        this.options.getItemKey
      ],
      (o, i, n, r) => (this.pendingMeasuredCacheIndexes = [], {
        count: o,
        paddingStart: i,
        scrollMargin: n,
        getItemKey: r
      }),
      {
        key: !1
      }
    ), this.getFurthestMeasurement = (o, i) => {
      let n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
      for (let l = i - 1; l >= 0; l--) {
        let u = o[l];
        if (n.has(u.lane))
          continue;
        let p = r.get(
          u.lane
        );
        if (p == null || u.end > p.end ? r.set(u.lane, u) : u.end < p.end && n.set(u.lane, !0), n.size === this.options.lanes)
          break;
      }
      return r.size === this.options.lanes ? Array.from(r.values()).sort((l, u) => l.end === u.end ? l.index - u.index : l.end - u.end)[0] :
      void 0;
    }, this.getMeasurements = oo(
      () => [this.memoOptions(), this.itemSizeCache],
      ({ count: o, paddingStart: i, scrollMargin: n, getItemKey: r }, l) => {
        let u = this.pendingMeasuredCacheIndexes.length > 0 ? Math.min(...this.pendingMeasuredCacheIndexes) : 0;
        this.pendingMeasuredCacheIndexes = [];
        let p = this.measurementsCache.slice(0, u);
        for (let c = u; c < o; c++) {
          let d = r(c), m = this.options.lanes === 1 ? p[c - 1] : this.getFurthestMeasurement(p, c), f = m ? m.end + this.options.gap : i + n,
          y = l.get(d), h = typeof y == "number" ? y : this.options.estimateSize(c), v = f + h, I = m ? m.lane : c % this.options.lanes;
          p[c] = {
            index: c,
            start: f,
            size: h,
            end: v,
            key: d,
            lane: I
          };
        }
        return this.measurementsCache = p, p;
      },
      {
        key: !1,
        debug: /* @__PURE__ */ s(() => this.options.debug, "debug")
      }
    ), this.calculateRange = oo(
      () => [this.getMeasurements(), this.getSize(), this.scrollOffset],
      (o, i, n) => this.range = o.length > 0 && i > 0 ? Zg({
        measurements: o,
        outerSize: i,
        scrollOffset: n
      }) : null,
      {
        key: !1,
        debug: /* @__PURE__ */ s(() => this.options.debug, "debug")
      }
    ), this.getIndexes = oo(
      () => [
        this.options.rangeExtractor,
        this.calculateRange(),
        this.options.overscan,
        this.options.count
      ],
      (o, i, n, r) => i === null ? [] : o({
        ...i,
        overscan: n,
        count: r
      }),
      {
        key: !1,
        debug: /* @__PURE__ */ s(() => this.options.debug, "debug")
      }
    ), this.indexFromElement = (o) => {
      let i = this.options.indexAttribute, n = o.getAttribute(i);
      return n ? parseInt(n, 10) : (console.warn(
        `Missing attribute name '${i}={index}' on measured element.`
      ), -1);
    }, this._measureElement = (o, i) => {
      let n = this.measurementsCache[this.indexFromElement(o)];
      if (!n || !o.isConnected) {
        this.measureElementCache.forEach((u, p) => {
          u === o && (this.observer.unobserve(o), this.measureElementCache.delete(p));
        });
        return;
      }
      let r = this.measureElementCache.get(n.key);
      r !== o && (r && this.observer.unobserve(r), this.observer.observe(o), this.measureElementCache.set(n.key, o));
      let l = this.options.measureElement(o, i, this);
      this.resizeItem(n, l);
    }, this.resizeItem = (o, i) => {
      let n = this.itemSizeCache.get(o.key) ?? o.size, r = i - n;
      r !== 0 && ((this.shouldAdjustScrollPositionOnItemSizeChange !== void 0 ? this.shouldAdjustScrollPositionOnItemSizeChange(o, r, this) :
      o.start < this.scrollOffset + this.scrollAdjustments) && this._scrollToOffset(this.scrollOffset, {
        adjustments: this.scrollAdjustments += r,
        behavior: void 0
      }), this.pendingMeasuredCacheIndexes.push(o.index), this.itemSizeCache = new Map(this.itemSizeCache.set(o.key, i)), this.notify(!1));
    }, this.measureElement = (o) => {
      o && this._measureElement(o, void 0);
    }, this.getVirtualItems = oo(
      () => [this.getIndexes(), this.getMeasurements()],
      (o, i) => {
        let n = [];
        for (let r = 0, l = o.length; r < l; r++) {
          let u = o[r], p = i[u];
          n.push(p);
        }
        return n;
      },
      {
        key: !1,
        debug: /* @__PURE__ */ s(() => this.options.debug, "debug")
      }
    ), this.getVirtualItemForOffset = (o) => {
      let i = this.getMeasurements();
      return on(
        i[Ip(
          0,
          i.length - 1,
          (n) => on(i[n]).start,
          o
        )]
      );
    }, this.getOffsetForAlignment = (o, i) => {
      let n = this.getSize();
      i === "auto" && (o <= this.scrollOffset ? i = "start" : o >= this.scrollOffset + n ? i = "end" : i = "start"), i === "start" ? o = o :
      i === "end" ? o = o - n : i === "center" && (o = o - n / 2);
      let r = this.options.horizontal ? "scrollWidth" : "scrollHeight", u = (this.scrollElement ? "document" in this.scrollElement ? this.scrollElement.
      document.documentElement[r] : this.scrollElement[r] : 0) - this.getSize();
      return Math.max(Math.min(u, o), 0);
    }, this.getOffsetForIndex = (o, i = "auto") => {
      o = Math.max(0, Math.min(o, this.options.count - 1));
      let n = on(this.getMeasurements()[o]);
      if (i === "auto")
        if (n.end >= this.scrollOffset + this.getSize() - this.options.scrollPaddingEnd)
          i = "end";
        else if (n.start <= this.scrollOffset + this.options.scrollPaddingStart)
          i = "start";
        else
          return [this.scrollOffset, i];
      let r = i === "end" ? n.end + this.options.scrollPaddingEnd : n.start - this.options.scrollPaddingStart;
      return [this.getOffsetForAlignment(r, i), i];
    }, this.isDynamicMode = () => this.measureElementCache.size > 0, this.cancelScrollToIndex = () => {
      this.scrollToIndexTimeoutId !== null && (clearTimeout(this.scrollToIndexTimeoutId), this.scrollToIndexTimeoutId = null);
    }, this.scrollToOffset = (o, { align: i = "start", behavior: n } = {}) => {
      this.cancelScrollToIndex(), n === "smooth" && this.isDynamicMode() && console.warn(
        "The `smooth` scroll behavior is not fully supported with dynamic size."
      ), this._scrollToOffset(this.getOffsetForAlignment(o, i), {
        adjustments: void 0,
        behavior: n
      });
    }, this.scrollToIndex = (o, { align: i = "auto", behavior: n } = {}) => {
      o = Math.max(0, Math.min(o, this.options.count - 1)), this.cancelScrollToIndex(), n === "smooth" && this.isDynamicMode() && console.warn(
        "The `smooth` scroll behavior is not fully supported with dynamic size."
      );
      let [r, l] = this.getOffsetForIndex(o, i);
      this._scrollToOffset(r, { adjustments: void 0, behavior: n }), n !== "smooth" && this.isDynamicMode() && (this.scrollToIndexTimeoutId =
      setTimeout(() => {
        if (this.scrollToIndexTimeoutId = null, this.measureElementCache.has(
          this.options.getItemKey(o)
        )) {
          let [p] = this.getOffsetForIndex(o, l);
          yp(p, this.scrollOffset) || this.scrollToIndex(o, { align: l, behavior: n });
        } else
          this.scrollToIndex(o, { align: l, behavior: n });
      }));
    }, this.scrollBy = (o, { behavior: i } = {}) => {
      this.cancelScrollToIndex(), i === "smooth" && this.isDynamicMode() && console.warn(
        "The `smooth` scroll behavior is not fully supported with dynamic size."
      ), this._scrollToOffset(this.scrollOffset + o, {
        adjustments: void 0,
        behavior: i
      });
    }, this.getTotalSize = () => {
      var o;
      let i = this.getMeasurements(), n;
      return i.length === 0 ? n = this.options.paddingStart : n = this.options.lanes === 1 ? ((o = i[i.length - 1]) == null ? void 0 : o.end) ??
      0 : Math.max(
        ...i.slice(-this.options.lanes).map((r) => r.end)
      ), n - this.options.scrollMargin + this.options.paddingEnd;
    }, this._scrollToOffset = (o, {
      adjustments: i,
      behavior: n
    }) => {
      this.options.scrollToFn(o, { behavior: n, adjustments: i }, this);
    }, this.measure = () => {
      this.itemSizeCache = /* @__PURE__ */ new Map(), this.notify(!1);
    }, this.setOptions(t), this.scrollRect = this.options.initialRect, this.scrollOffset = typeof this.options.initialOffset == "function" ?
    this.options.initialOffset() : this.options.initialOffset, this.measurementsCache = this.options.initialMeasurementsCache, this.measurementsCache.
    forEach((o) => {
      this.itemSizeCache.set(o.key, o.size);
    }), this.maybeNotify();
  }
};
s(Ri, "Virtualizer");
var rn = Ri, Ip = /* @__PURE__ */ s((e, t, o, i) => {
  for (; e <= t; ) {
    let n = (e + t) / 2 | 0, r = o(n);
    if (r < i)
      e = n + 1;
    else if (r > i)
      t = n - 1;
    else
      return n;
  }
  return e > 0 ? e - 1 : 0;
}, "findNearestBinarySearch");
function Zg({
  measurements: e,
  outerSize: t,
  scrollOffset: o
}) {
  let i = e.length - 1, r = Ip(0, i, /* @__PURE__ */ s((u) => e[u].start, "getOffset"), o), l = r;
  for (; l < i && e[l].end < o + t; )
    l++;
  return { startIndex: r, endIndex: l };
}
s(Zg, "calculateRange");

// ../node_modules/@tanstack/react-virtual/dist/esm/index.js
var Jg = typeof document < "u" ? Lt : z;
function ey(e) {
  let t = wo(() => ({}), {})[1], o = {
    ...e,
    onChange: /* @__PURE__ */ s((n, r) => {
      var l;
      r ? Yt(t) : t(), (l = e.onChange) == null || l.call(e, n, r);
    }, "onChange")
  }, [i] = U(
    () => new rn(o)
  );
  return i.setOptions(o), z(() => i._didMount(), []), Jg(() => i._willUpdate()), i;
}
s(ey, "useVirtualizerBase");
function Sp(e) {
  return ey({
    observeElementRect: vp,
    observeElementOffset: bp,
    scrollToFn: xp,
    ...e
  });
}
s(Sp, "useVirtualizer");

// src/manager/components/sidebar/FIleSearchList.utils.tsx
var wp = /* @__PURE__ */ s(({
  parentRef: e,
  rowVirtualizer: t,
  selectedItem: o
}) => {
  z(() => {
    let i = /* @__PURE__ */ s((n) => {
      if (!e.current)
        return;
      let r = t.options.count, l = document.activeElement, u = parseInt(l.getAttribute("data-index") || "-1", 10), p = l.tagName === "INPUT",
      c = /* @__PURE__ */ s(() => document.querySelector('[data-index="0"]'), "getFirstElement"), d = /* @__PURE__ */ s(() => document.querySelector(
      `[data-index="${r - 1}"]`), "getLastElement");
      if (n.code === "ArrowDown" && l) {
        if (n.stopPropagation(), p) {
          c()?.focus();
          return;
        }
        if (u === r - 1) {
          Yt(() => {
            t.scrollToIndex(0, { align: "start" });
          }), setTimeout(() => {
            c()?.focus();
          }, 100);
          return;
        }
        if (o === u) {
          document.querySelector(
            `[data-index-position="${o}_first"]`
          )?.focus();
          return;
        }
        if (o !== null && l.getAttribute("data-index-position")?.includes("last")) {
          document.querySelector(
            `[data-index="${o + 1}"]`
          )?.focus();
          return;
        }
        l.nextElementSibling?.focus();
      }
      if (n.code === "ArrowUp" && l) {
        if (p) {
          Yt(() => {
            t.scrollToIndex(r - 1, { align: "start" });
          }), setTimeout(() => {
            d()?.focus();
          }, 100);
          return;
        }
        if (o !== null && l.getAttribute("data-index-position")?.includes("first")) {
          document.querySelector(
            `[data-index="${o}"]`
          )?.focus();
          return;
        }
        l.previousElementSibling?.focus();
      }
    }, "handleArrowKeys");
    return document.addEventListener("keydown", i, { capture: !0 }), () => {
      document.removeEventListener("keydown", i, { capture: !0 });
    };
  }, [t, o, e]);
}, "useArrowKeyNavigation");

// src/manager/components/sidebar/FileList.tsx
var Ep = S("div")(({ theme: e }) => ({
  marginTop: "-16px",
  // after element which fades out the list
  "&::after": {
    content: '""',
    position: "fixed",
    pointerEvents: "none",
    bottom: 0,
    left: 0,
    right: 0,
    height: "80px",
    background: `linear-gradient(${xi(e.barBg, 0)} 10%, ${e.barBg} 80%)`
  }
})), nn = S("div")(({ theme: e }) => ({
  height: "280px",
  overflow: "auto",
  msOverflowStyle: "none",
  scrollbarWidth: "none",
  position: "relative",
  "::-webkit-scrollbar": {
    display: "none"
  }
})), Cp = S("li")(({ theme: e }) => ({
  ":focus-visible": {
    outline: "none",
    ".file-list-item": {
      borderRadius: "4px",
      background: e.base === "dark" ? "rgba(255,255,255,.1)" : e.color.mediumlight,
      "> svg": {
        display: "flex"
      }
    }
  }
})), sn = S("div")(({ theme: e }) => ({
  display: "flex",
  flexDirection: "column",
  position: "relative"
})), Tp = S.div(({ theme: e, selected: t, disabled: o, error: i }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  alignSelf: "stretch",
  padding: "8px 16px",
  cursor: "pointer",
  borderRadius: "4px",
  ...t && {
    borderRadius: "4px",
    background: e.base === "dark" ? "rgba(255,255,255,.1)" : e.color.mediumlight,
    "> svg": {
      display: "flex"
    }
  },
  ...o && {
    cursor: "not-allowed",
    div: {
      color: `${e.color.mediumdark} !important`
    }
  },
  ...i && {
    background: e.base === "light" ? "#00000011" : "#00000033"
  },
  "&:hover": {
    background: i ? "#00000022" : e.base === "dark" ? "rgba(255,255,255,.1)" : e.color.mediumlight,
    "> svg": {
      display: "flex"
    }
  }
})), _p = S("ul")({
  margin: 0,
  padding: "0 0 0 0",
  width: "100%",
  position: "relative"
}), kp = S("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: "calc(100% - 50px)"
}), Op = S("div")(({ theme: e, error: t }) => ({
  color: t ? e.color.negativeText : e.color.secondary
})), Pp = S("div")(({ theme: e, error: t }) => ({
  color: t ? e.color.negativeText : e.base === "dark" ? e.color.lighter : e.color.darkest,
  fontSize: "14px",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  overflow: "hidden",
  maxWidth: "100%"
})), Ap = S("div")(({ theme: e }) => ({
  color: e.color.mediumdark,
  fontSize: "14px",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  overflow: "hidden",
  maxWidth: "100%"
})), Dp = S("ul")(({ theme: e }) => ({
  margin: 0,
  padding: 0
})), Mp = S("li")(({ theme: e, error: t }) => ({
  padding: "8px 16px 8px 16px",
  marginLeft: "30px",
  display: "flex",
  gap: "8px",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "14px",
  cursor: "pointer",
  borderRadius: "4px",
  ":focus-visible": {
    outline: "none"
  },
  ...t && {
    background: "#F9ECEC",
    color: e.color.negativeText
  },
  "&:hover,:focus-visible": {
    background: t ? "#F9ECEC" : e.base === "dark" ? "rgba(255, 255, 255, 0.1)" : e.color.mediumlight,
    "> svg": {
      display: "flex"
    }
  },
  "> div > svg": {
    color: t ? e.color.negativeText : e.color.secondary
  }
})), Lp = S("div")(({ theme: e }) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  width: "calc(100% - 20px)"
})), Np = S("span")(({ theme: e }) => ({
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  overflow: "hidden",
  maxWidth: "calc(100% - 160px)",
  display: "inline-block"
})), Fp = S("span")(({ theme: e }) => ({
  display: "inline-block",
  padding: `1px ${e.appBorderRadius}px`,
  borderRadius: "2px",
  fontSize: "10px",
  color: e.base === "dark" ? e.color.lightest : "#727272",
  backgroundColor: e.base === "dark" ? "rgba(255, 255, 255, 0.1)" : "#F2F4F5"
})), Bp = S("div")(({ theme: e }) => ({
  textAlign: "center",
  maxWidth: "334px",
  margin: "16px auto 50px auto",
  fontSize: "14px",
  color: e.base === "dark" ? e.color.lightest : "#000"
})), Hp = S("p")(({ theme: e }) => ({
  margin: 0,
  color: e.base === "dark" ? e.color.defaultText : e.color.mediumdark
}));

// src/manager/components/sidebar/FileSearchListSkeleton.tsx
var ty = S("div")(({ theme: e }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  alignSelf: "stretch",
  padding: "8px 16px"
})), oy = S("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: "100%",
  borderRadius: "3px"
}), ry = S.div(({ theme: e }) => ({
  width: "14px",
  height: "14px",
  borderRadius: "3px",
  marginTop: "1px",
  background: e.base === "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)",
  animation: `${e.animation.glow} 1.5s ease-in-out infinite`
})), Rp = S.div(({ theme: e }) => ({
  height: "16px",
  borderRadius: "3px",
  background: e.base === "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)",
  animation: `${e.animation.glow} 1.5s ease-in-out infinite`,
  width: "100%",
  maxWidth: "100%",
  "+ div": {
    marginTop: "6px"
  }
})), zp = /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(nn, null, [1, 2, 3].map((e) => /* @__PURE__ */ a.createElement(sn, { key: e },
/* @__PURE__ */ a.createElement(ty, null, /* @__PURE__ */ a.createElement(ry, null), /* @__PURE__ */ a.createElement(oy, null, /* @__PURE__ */ a.
createElement(Rp, { style: { width: "90px" } }), /* @__PURE__ */ a.createElement(Rp, { style: { width: "300px" } })))))), "FileSearchListLoa\
dingSkeleton");

// src/manager/components/sidebar/FileSearchList.tsx
var Wp = S(wl)(({ theme: e }) => ({
  display: "none",
  alignSelf: "center",
  color: e.color.mediumdark
})), ny = S(Po)(({ theme: e }) => ({
  display: "none",
  alignSelf: "center",
  color: e.color.mediumdark
})), jp = Uo(/* @__PURE__ */ s(function({
  isLoading: t,
  searchResults: o,
  onNewStory: i,
  errorItemId: n
}) {
  let [r, l] = U(null), u = a.useRef(), p = Y(() => [...o ?? []].sort((h, v) => {
    let I = h.exportedComponents === null || h.exportedComponents?.length === 0, C = h.storyFileExists, b = v.exportedComponents === null ||
    v.exportedComponents?.length === 0, x = v.storyFileExists;
    return C && !x ? -1 : x && !C || I && !b ? 1 : !I && b ? -1 : 0;
  }), [o]), c = o?.length || 0, d = Sp({
    count: c,
    // @ts-expect-error (non strict)
    getScrollElement: /* @__PURE__ */ s(() => u.current, "getScrollElement"),
    paddingStart: 16,
    paddingEnd: 40,
    estimateSize: /* @__PURE__ */ s(() => 54, "estimateSize"),
    overscan: 2
  });
  wp({ rowVirtualizer: d, parentRef: u, selectedItem: r });
  let m = M(
    ({ virtualItem: h, searchResult: v, itemId: I }) => {
      v?.exportedComponents?.length > 1 ? l((C) => C === h.index ? null : h.index) : v?.exportedComponents?.length === 1 && i({
        componentExportName: v.exportedComponents[0].name,
        componentFilePath: v.filepath,
        componentIsDefaultExport: v.exportedComponents[0].default,
        selectedItemId: I,
        componentExportCount: 1
      });
    },
    [i]
  ), f = M(
    ({ searchResult: h, component: v, id: I }) => {
      i({
        componentExportName: v.name,
        componentFilePath: h.filepath,
        componentIsDefaultExport: v.default,
        selectedItemId: I,
        // @ts-expect-error (non strict)
        componentExportCount: h.exportedComponents.length
      });
    },
    [i]
  ), y = M(
    ({ virtualItem: h, selected: v, searchResult: I }) => {
      let C = n === I.filepath, b = v === h.index;
      return /* @__PURE__ */ a.createElement(
        sn,
        {
          "aria-expanded": b,
          "aria-controls": `file-list-export-${h.index}`,
          id: `file-list-item-wrapper-${h.index}`
        },
        /* @__PURE__ */ a.createElement(
          Tp,
          {
            className: "file-list-item",
            selected: b,
            error: C,
            disabled: I.exportedComponents === null || I.exportedComponents?.length === 0
          },
          /* @__PURE__ */ a.createElement(Op, { error: C }, /* @__PURE__ */ a.createElement(fi, null)),
          /* @__PURE__ */ a.createElement(kp, null, /* @__PURE__ */ a.createElement(Pp, { error: C }, I.filepath.split("/").at(-1)), /* @__PURE__ */ a.
          createElement(Ap, null, I.filepath)),
          b ? /* @__PURE__ */ a.createElement(ny, null) : /* @__PURE__ */ a.createElement(Wp, null)
        ),
        I?.exportedComponents?.length > 1 && b && /* @__PURE__ */ a.createElement(
          Dp,
          {
            role: "region",
            id: `file-list-export-${h.index}`,
            "aria-labelledby": `file-list-item-wrapper-${h.index}`,
            onClick: (x) => {
              x.stopPropagation();
            },
            onKeyUp: (x) => {
              x.key === "Enter" && x.stopPropagation();
            }
          },
          I.exportedComponents?.map((x, g) => {
            let w = n === `${I.filepath}_${g}`, T = g === 0 ? "first" : (
              // @ts-expect-error (non strict)
              g === I.exportedComponents.length - 1 ? "last" : "middle"
            );
            return /* @__PURE__ */ a.createElement(
              Mp,
              {
                tabIndex: 0,
                "data-index-position": `${h.index}_${T}`,
                key: x.name,
                error: w,
                onClick: () => {
                  f({
                    searchResult: I,
                    component: x,
                    id: `${I.filepath}_${g}`
                  });
                },
                onKeyUp: (_) => {
                  _.key === "Enter" && f({
                    searchResult: I,
                    component: x,
                    id: `${I.filepath}_${g}`
                  });
                }
              },
              /* @__PURE__ */ a.createElement(Lp, null, /* @__PURE__ */ a.createElement(fi, null), x.default ? /* @__PURE__ */ a.createElement(
              a.Fragment, null, /* @__PURE__ */ a.createElement(Np, null, I.filepath.split("/").at(-1)?.split(".")?.at(0)), /* @__PURE__ */ a.
              createElement(Fp, null, "Default export")) : x.name),
              /* @__PURE__ */ a.createElement(Wp, null)
            );
          })
        )
      );
    },
    [f, n]
  );
  return t && (o === null || o?.length === 0) ? /* @__PURE__ */ a.createElement(zp, null) : o?.length === 0 ? /* @__PURE__ */ a.createElement(
  Bp, null, /* @__PURE__ */ a.createElement("p", null, "We could not find any file with that name"), /* @__PURE__ */ a.createElement(Hp, null,
  "You may want to try using different keywords, check for typos, and adjust your filters")) : p?.length > 0 ? /* @__PURE__ */ a.createElement(
  Ep, null, /* @__PURE__ */ a.createElement(nn, { ref: u }, /* @__PURE__ */ a.createElement(
    _p,
    {
      style: {
        height: `${d.getTotalSize()}px`
      }
    },
    d.getVirtualItems().map((h) => {
      let v = p[h.index], I = v.exportedComponents === null || v.exportedComponents?.length === 0, C = {};
      return /* @__PURE__ */ a.createElement(
        Cp,
        {
          key: h.key,
          "data-index": h.index,
          ref: d.measureElement,
          onClick: () => {
            m({
              virtualItem: h,
              itemId: v.filepath,
              searchResult: v
            });
          },
          onKeyUp: (b) => {
            b.key === "Enter" && m({
              virtualItem: h,
              itemId: v.filepath,
              searchResult: v
            });
          },
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${h.start}px)`
          },
          tabIndex: 0
        },
        I ? /* @__PURE__ */ a.createElement(
          je,
          {
            ...C,
            style: { width: "100%" },
            hasChrome: !1,
            closeOnOutsideClick: !0,
            tooltip: /* @__PURE__ */ a.createElement(
              qt,
              {
                note: I ? "We can't evaluate exports for this file. You can't create a story for it automatically" : null
              }
            )
          },
          /* @__PURE__ */ a.createElement(
            y,
            {
              searchResult: v,
              selected: r,
              virtualItem: h
            }
          )
        ) : /* @__PURE__ */ a.createElement(
          y,
          {
            ...C,
            key: h.index,
            searchResult: v,
            selected: r,
            virtualItem: h
          }
        )
      );
    })
  ))) : null;
}, "FileSearchList"));

// src/manager/components/sidebar/FileSearchModal.tsx
var iy = 418, sy = S(Ut)(() => ({
  boxShadow: "none",
  background: "transparent"
})), ay = S.div(({ theme: e, height: t }) => ({
  backgroundColor: e.background.bar,
  borderRadius: 6,
  boxShadow: "rgba(255, 255, 255, 0.05) 0 0 0 1px inset, rgba(14, 18, 22, 0.35) 0px 10px 18px -10px",
  padding: "16px",
  transition: "height 0.3s",
  height: t ? `${t + 32}px` : "auto",
  overflow: "hidden"
})), ly = S(Ut.Content)(({ theme: e }) => ({
  margin: 0,
  color: e.base === "dark" ? e.color.lighter : e.color.mediumdark
})), uy = S(Or.Input)(({ theme: e }) => ({
  paddingLeft: 40,
  paddingRight: 28,
  fontSize: 14,
  height: 40,
  ...e.base === "light" && {
    color: e.color.darkest
  },
  "::placeholder": {
    color: e.color.mediumdark
  },
  "&:invalid:not(:placeholder-shown)": {
    boxShadow: `${e.color.negative} 0 0 0 1px inset`
  },
  "&::-webkit-search-decoration, &::-webkit-search-cancel-button, &::-webkit-search-results-button, &::-webkit-search-results-decoration": {
    display: "none"
  }
})), py = S.div({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  position: "relative"
}), cy = S.div(({ theme: e }) => ({
  position: "absolute",
  top: 0,
  left: 16,
  zIndex: 1,
  pointerEvents: "none",
  color: e.darkest,
  display: "flex",
  alignItems: "center",
  height: "100%"
})), dy = S.div(({ theme: e }) => ({
  position: "absolute",
  top: 0,
  right: 16,
  zIndex: 1,
  color: e.darkest,
  display: "flex",
  alignItems: "center",
  height: "100%",
  "@keyframes spin": {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" }
  },
  animation: "spin 1s linear infinite"
})), fy = S(Ut.Error)({
  position: "absolute",
  padding: "8px 40px 8px 16px",
  bottom: 0,
  maxHeight: "initial",
  width: "100%",
  div: {
    wordBreak: "break-word"
  },
  "> div": {
    padding: 0
  }
}), my = S(Br)({
  position: "absolute",
  top: 4,
  right: -24,
  cursor: "pointer"
}), Vp = /* @__PURE__ */ s(({
  open: e,
  onOpenChange: t,
  fileSearchQuery: o,
  setFileSearchQuery: i,
  isLoading: n,
  error: r,
  searchResults: l,
  onCreateNewStory: u,
  setError: p,
  container: c
}) => {
  let [d, m] = gp(), [f, y] = U(m.height), [, h] = Fa(), [v, I] = U(o);
  return z(() => {
    f < m.height && y(m.height);
  }, [m.height, f]), /* @__PURE__ */ a.createElement(
    sy,
    {
      height: iy,
      width: 440,
      open: e,
      onOpenChange: t,
      onEscapeKeyDown: () => {
        t(!1);
      },
      onInteractOutside: () => {
        t(!1);
      },
      container: c
    },
    /* @__PURE__ */ a.createElement(ay, { height: o === "" ? m.height : f }, /* @__PURE__ */ a.createElement(ly, { ref: d }, /* @__PURE__ */ a.
    createElement(Ut.Header, null, /* @__PURE__ */ a.createElement(Ut.Title, null, "Add a new story"), /* @__PURE__ */ a.createElement(Ut.Description,
    null, "We will create a new story for your component")), /* @__PURE__ */ a.createElement(py, null, /* @__PURE__ */ a.createElement(cy, null,
    /* @__PURE__ */ a.createElement(jr, null)), /* @__PURE__ */ a.createElement(
      uy,
      {
        placeholder: "./components/**/*.tsx",
        type: "search",
        required: !0,
        autoFocus: !0,
        value: v,
        onChange: (C) => {
          let b = C.target.value;
          I(b), h(() => {
            i(b);
          });
        }
      }
    ), n && /* @__PURE__ */ a.createElement(dy, null, /* @__PURE__ */ a.createElement(Ft, null))), /* @__PURE__ */ a.createElement(
      jp,
      {
        errorItemId: r?.selectedItemId,
        isLoading: n,
        searchResults: l,
        onNewStory: u
      }
    ))),
    r && o !== "" && /* @__PURE__ */ a.createElement(fy, null, /* @__PURE__ */ a.createElement("div", null, r.error), /* @__PURE__ */ a.createElement(
      my,
      {
        onClick: () => {
          p(null);
        }
      }
    ))
  );
}, "FileSearchModal");

// src/manager/components/sidebar/FileSearchModal.utils.tsx
function $p(e) {
  return Object.keys(e).reduce(
    (o, i) => {
      let n = e[i];
      if (typeof n.control == "object" && "type" in n.control)
        switch (n.control.type) {
          case "object":
            o[i] = {};
            break;
          case "inline-radio":
          case "radio":
          case "inline-check":
          case "check":
          case "select":
          case "multi-select":
            o[i] = n.control.options?.[0];
            break;
          case "color":
            o[i] = "#000000";
            break;
          default:
            break;
        }
      return an(n.type, o, i), o;
    },
    {}
  );
}
s($p, "extractSeededRequiredArgs");
function an(e, t, o) {
  if (!(typeof e == "string" || !e.required))
    switch (e.name) {
      case "boolean":
        t[o] = !0;
        break;
      case "number":
        t[o] = 0;
        break;
      case "string":
        t[o] = o;
        break;
      case "array":
        t[o] = [];
        break;
      case "object":
        t[o] = {}, Object.entries(e.value ?? {}).forEach(([i, n]) => {
          an(n, t[o], i);
        });
        break;
      case "function":
        t[o] = () => {
        };
        break;
      case "intersection":
        e.value?.every((i) => i.name === "object") && (t[o] = {}, e.value?.forEach((i) => {
          i.name === "object" && Object.entries(i.value ?? {}).forEach(([n, r]) => {
            an(r, t[o], n);
          });
        }));
        break;
      case "union":
        e.value?.[0] !== void 0 && an(e.value[0], t, o);
        break;
      case "enum":
        e.value?.[0] !== void 0 && (t[o] = e.value?.[0]);
        break;
      case "other":
        typeof e.value == "string" && e.value === "tuple" && (t[o] = []);
        break;
      default:
        break;
    }
}
s(an, "setArgType");
async function ln(e, t, o = 1) {
  if (o > 10)
    throw new Error("We could not select the new story. Please try again.");
  try {
    await e(t);
  } catch {
    return await new Promise((n) => setTimeout(n, 500)), ln(e, t, o + 1);
  }
}
s(ln, "trySelectNewStory");

// src/manager/components/sidebar/CreateNewStoryFileModal.tsx
var hy = /* @__PURE__ */ s((e) => JSON.stringify(e, (t, o) => typeof o == "function" ? "__sb_empty_function_arg__" : o), "stringifyArgs"), Kp = /* @__PURE__ */ s(
({ open: e, onOpenChange: t }) => {
  let [o, i] = U(!1), [n, r] = U(""), l = hp(n, 600), u = Na(l), p = G(null), [c, d] = U(
    null
  ), m = pe(), [f, y] = U(null), h = M(
    (b) => {
      m.addNotification({
        id: "create-new-story-file-success",
        content: {
          headline: "Story file created",
          subHeadline: `${b} was created`
        },
        duration: 8e3,
        icon: /* @__PURE__ */ a.createElement(et, null)
      }), t(!1);
    },
    [m, t]
  ), v = M(() => {
    m.addNotification({
      id: "create-new-story-file-error",
      content: {
        headline: "Story already exists",
        subHeadline: "Successfully navigated to existing story"
      },
      duration: 8e3,
      icon: /* @__PURE__ */ a.createElement(et, null)
    }), t(!1);
  }, [m, t]), I = M(() => {
    i(!0);
    let b = ut.getChannel(), x = /* @__PURE__ */ s((g) => {
      g.id === u && (g.success ? y(g.payload.files) : d({ error: g.error }), b.off(hr, x), i(!1), p.current = null);
    }, "set");
    return b.on(hr, x), u !== "" && p.current !== u ? (p.current = u, b.emit(wa, {
      id: u,
      payload: {}
    })) : (y(null), i(!1)), () => {
      b.off(hr, x);
    };
  }, [u]), C = M(
    async ({
      componentExportName: b,
      componentFilePath: x,
      componentIsDefaultExport: g,
      componentExportCount: w,
      selectedItemId: T
    }) => {
      try {
        let _ = ut.getChannel(), k = await yr(_, Ia, Sa, {
          componentExportName: b,
          componentFilePath: x,
          componentIsDefaultExport: g,
          componentExportCount: w
        });
        d(null);
        let E = k.storyId;
        await ln(m.selectStory, E);
        try {
          let P = (await yr(_, va, ba, {
            storyId: E
          })).argTypes, A = $p(P);
          await yr(
            _,
            Ca,
            Ta,
            {
              args: hy(A),
              importPath: k.storyFilePath,
              csfId: E
            }
          );
        } catch {
        }
        h(b), I();
      } catch (_) {
        switch (_?.payload?.type) {
          case "STORY_FILE_EXISTS":
            let k = _;
            await ln(m.selectStory, k.payload.kind), v();
            break;
          default:
            d({ selectedItemId: T, error: _?.message });
            break;
        }
      }
    },
    [m?.selectStory, h, I, v]
  );
  return z(() => {
    d(null);
  }, [u]), z(() => I(), [I]), /* @__PURE__ */ a.createElement(
    Vp,
    {
      error: c,
      fileSearchQuery: n,
      fileSearchQueryDeferred: u,
      onCreateNewStory: C,
      isLoading: o,
      onOpenChange: t,
      open: e,
      searchResults: f,
      setError: d,
      setFileSearchQuery: r
    }
  );
}, "CreateNewStoryFileModal");

// src/manager/components/sidebar/HighlightStyles.tsx
var Up = /* @__PURE__ */ s(({ refId: e, itemId: t }) => /* @__PURE__ */ a.createElement(
  Eo,
  {
    styles: ({ color: o }) => {
      let i = xe(0.85, o.secondary);
      return {
        [`[data-ref-id="${e}"][data-item-id="${t}"]:not([data-selected="true"])`]: {
          '&[data-nodetype="component"], &[data-nodetype="group"]': {
            background: i,
            "&:hover, &:focus": { background: i }
          },
          '&[data-nodetype="story"], &[data-nodetype="document"]': {
            color: o.defaultText,
            background: i,
            "&:hover, &:focus": { background: i }
          }
        }
      };
    }
  }
), "HighlightStyles");

// src/manager/utils/tree.ts
var Bo = Ve(Zo(), 1);
var { document: Yp, window: gy } = re, un = /* @__PURE__ */ s((e, t) => !t || t === St ? e : `${t}_${e}`, "createId"), Xp = /* @__PURE__ */ s(
(e, t) => `${Yp.location.pathname}?path=/${e.type}/${un(e.id, t)}`, "getLink");
var qp = (0, Bo.default)(1e3)((e, t) => t[e]), yy = (0, Bo.default)(1e3)((e, t) => {
  let o = qp(e, t);
  return o && o.type !== "root" ? qp(o.parent, t) : void 0;
}), Qp = (0, Bo.default)(1e3)((e, t) => {
  let o = yy(e, t);
  return o ? [o, ...Qp(o.id, t)] : [];
}), tr = (0, Bo.default)(1e3)(
  (e, t) => Qp(t, e).map((o) => o.id)
), It = (0, Bo.default)(1e3)((e, t, o) => {
  let i = e[t];
  return (i.type === "story" || i.type === "docs" ? [] : i.children).reduce((r, l) => {
    let u = e[l];
    return !u || o && (u.type === "story" || u.type === "docs") || r.push(l, ...It(e, l, o)), r;
  }, []);
});
function Zp(e, t) {
  let o = e.type !== "root" && e.parent ? t.index[e.parent] : null;
  return o ? [...Zp(o, t), o.name] : t.id === St ? [] : [t.title || t.id];
}
s(Zp, "getPath");
var zi = /* @__PURE__ */ s((e, t) => ({ ...e, refId: t.id, path: Zp(e, t) }), "searchItem");
function Jp(e, t, o) {
  let i = t + o % e.length;
  return i < 0 && (i = e.length + i), i >= e.length && (i -= e.length), i;
}
s(Jp, "cycle");
var ro = /* @__PURE__ */ s((e, t = !1) => {
  if (!e)
    return;
  let { top: o, bottom: i } = e.getBoundingClientRect();
  o >= 0 && i <= (gy.innerHeight || Yp.documentElement.clientHeight) || e.scrollIntoView({ block: t ? "center" : "nearest" });
}, "scrollIntoView"), ec = /* @__PURE__ */ s((e, t, o, i) => {
  switch (!0) {
    case t:
      return "auth";
    case o:
      return "error";
    case e:
      return "loading";
    case i:
      return "empty";
    default:
      return "ready";
  }
}, "getStateType"), no = /* @__PURE__ */ s((e, t) => !e || !t ? !1 : e === t ? !0 : no(e.parentElement || void 0, t), "isAncestor"), Gp = /* @__PURE__ */ s(
(e) => e.replaceAll(/(\s|-|_)/gi, ""), "removeNoiseFromName"), tc = /* @__PURE__ */ s((e, t) => Gp(e) === Gp(t), "isStoryHoistable");

// global-externals:@storybook/core/client-logger
var uM = __STORYBOOK_CLIENT_LOGGER__, { deprecate: pM, logger: oc, once: cM, pretty: dM } = __STORYBOOK_CLIENT_LOGGER__;

// src/manager/components/sidebar/Loader.tsx
var rc = [0, 0, 1, 1, 2, 3, 3, 3, 1, 1, 1, 2, 2, 2, 3], vy = S.div(
  {
    cursor: "progress",
    fontSize: 13,
    height: "16px",
    marginTop: 4,
    marginBottom: 4,
    alignItems: "center",
    overflow: "hidden"
  },
  ({ depth: e = 0 }) => ({
    marginLeft: e * 15,
    maxWidth: 85 - e * 5
  }),
  ({ theme: e }) => e.animation.inlineGlow,
  ({ theme: e }) => ({
    background: e.appBorderColor
  })
), or = S.div({
  display: "flex",
  flexDirection: "column",
  paddingLeft: 20,
  paddingRight: 20
}), nc = /* @__PURE__ */ s(({ size: e }) => {
  let t = Math.ceil(e / rc.length), o = Array.from(Array(t)).fill(rc).flat().slice(0, e);
  return /* @__PURE__ */ a.createElement(Ne, null, o.map((i, n) => /* @__PURE__ */ a.createElement(vy, { depth: i, key: n })));
}, "Loader");

// src/manager/components/sidebar/RefBlocks.tsx
var { window: ic } = re, by = S.div(({ theme: e }) => ({
  fontSize: e.typography.size.s2,
  lineHeight: "20px",
  margin: 0
})), Wi = S.div(({ theme: e }) => ({
  fontSize: e.typography.size.s2,
  lineHeight: "20px",
  margin: 0,
  code: {
    fontSize: e.typography.size.s1
  },
  ul: {
    paddingLeft: 20,
    marginTop: 8,
    marginBottom: 8
  }
})), xy = S.pre(
  {
    width: 420,
    boxSizing: "border-box",
    borderRadius: 8,
    overflow: "auto",
    whiteSpace: "pre"
  },
  ({ theme: e }) => ({
    color: e.color.dark
  })
), sc = /* @__PURE__ */ s(({ loginUrl: e, id: t }) => {
  let [o, i] = U(!1), n = M(() => {
    ic.document.location.reload();
  }, []), r = M((l) => {
    l.preventDefault();
    let u = ic.open(e, `storybook_auth_${t}`, "resizable,scrollbars"), p = setInterval(() => {
      u ? u.closed && (clearInterval(p), i(!0)) : (oc.error("unable to access loginUrl window"), clearInterval(p));
    }, 1e3);
  }, []);
  return /* @__PURE__ */ a.createElement(or, null, /* @__PURE__ */ a.createElement(Et, null, o ? /* @__PURE__ */ a.createElement(Ne, null, /* @__PURE__ */ a.
  createElement(Wi, null, "Authentication on ", /* @__PURE__ */ a.createElement("strong", null, e), " concluded. Refresh the page to fetch t\
his Storybook."), /* @__PURE__ */ a.createElement("div", null, /* @__PURE__ */ a.createElement(fe, { small: !0, gray: !0, onClick: n }, /* @__PURE__ */ a.
  createElement(Ft, null), "Refresh now"))) : /* @__PURE__ */ a.createElement(Ne, null, /* @__PURE__ */ a.createElement(Wi, null, "Sign in t\
o browse this Storybook."), /* @__PURE__ */ a.createElement("div", null, /* @__PURE__ */ a.createElement(fe, { small: !0, gray: !0, onClick: r },
  /* @__PURE__ */ a.createElement(zr, null), "Sign in")))));
}, "AuthBlock"), ac = /* @__PURE__ */ s(({ error: e }) => /* @__PURE__ */ a.createElement(or, null, /* @__PURE__ */ a.createElement(Et, null,
/* @__PURE__ */ a.createElement(by, null, "Oh no! Something went wrong loading this Storybook.", /* @__PURE__ */ a.createElement("br", null),
/* @__PURE__ */ a.createElement(
  je,
  {
    tooltip: /* @__PURE__ */ a.createElement(xy, null, /* @__PURE__ */ a.createElement(yl, { error: e }))
  },
  /* @__PURE__ */ a.createElement(We, { isButton: !0 }, "View error ", /* @__PURE__ */ a.createElement(Po, null))
), " ", /* @__PURE__ */ a.createElement(We, { withArrow: !0, href: "https://storybook.js.org/docs", cancel: !1, target: "_blank" }, "View do\
cs")))), "ErrorBlock"), Iy = S(Et)({
  display: "flex"
}), Sy = S(Et)({
  flex: 1
}), lc = /* @__PURE__ */ s(({ isMain: e }) => /* @__PURE__ */ a.createElement(or, null, /* @__PURE__ */ a.createElement(Iy, { col: 1 }, /* @__PURE__ */ a.
createElement(Sy, null, /* @__PURE__ */ a.createElement(Wi, null, e ? /* @__PURE__ */ a.createElement(a.Fragment, null, "Oh no! Your Storybo\
ok is empty. Possible reasons why:", /* @__PURE__ */ a.createElement("ul", null, /* @__PURE__ */ a.createElement("li", null, "The glob speci\
fied in ", /* @__PURE__ */ a.createElement("code", null, "main.js"), " isn't correct."), /* @__PURE__ */ a.createElement("li", null, "No sto\
ries are defined in your story files."), /* @__PURE__ */ a.createElement("li", null, "You're using filter-functions, and all stories are fil\
tered away.")), " ") : /* @__PURE__ */ a.createElement(a.Fragment, null, "This composed storybook is empty, maybe you're using filter-functi\
ons, and all stories are filtered away."))))), "EmptyBlock"), uc = /* @__PURE__ */ s(({ isMain: e }) => /* @__PURE__ */ a.createElement(or, null,
/* @__PURE__ */ a.createElement(nc, { size: e ? 17 : 5 })), "LoaderBlock");

// src/manager/components/sidebar/RefIndicator.tsx
var { document: wy, window: Ey } = re, Cy = S.aside(({ theme: e }) => ({
  height: 16,
  display: "flex",
  alignItems: "center",
  "& > * + *": {
    marginLeft: e.layoutMargin
  }
})), Ty = S.button(({ theme: e }) => ({
  height: 20,
  width: 20,
  padding: 0,
  margin: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  outline: "none",
  border: "1px solid transparent",
  borderRadius: "100%",
  cursor: "pointer",
  color: e.base === "light" ? xe(0.3, e.color.defaultText) : xe(0.6, e.color.defaultText),
  "&:hover": {
    color: e.barSelectedColor
  },
  "&:focus": {
    color: e.barSelectedColor,
    borderColor: e.color.secondary
  },
  svg: {
    height: 10,
    width: 10,
    transition: "all 150ms ease-out",
    color: "inherit"
  }
})), io = S.span(({ theme: e }) => ({
  fontWeight: e.typography.weight.bold
})), so = S.a(({ theme: e }) => ({
  textDecoration: "none",
  lineHeight: "16px",
  padding: 15,
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  color: e.color.defaultText,
  "&:not(:last-child)": {
    borderBottom: `1px solid ${e.appBorderColor}`
  },
  "&:hover": {
    background: e.background.hoverable,
    color: e.color.darker
  },
  "&:link": {
    color: e.color.darker
  },
  "&:active": {
    color: e.color.darker
  },
  "&:focus": {
    color: e.color.darker
  },
  "& > *": {
    flex: 1
  },
  "& > svg": {
    marginTop: 3,
    width: 16,
    height: 16,
    marginRight: 10,
    flex: "unset"
  }
})), _y = S.div({
  width: 280,
  boxSizing: "border-box",
  borderRadius: 8,
  overflow: "hidden"
}), ky = S.div(({ theme: e }) => ({
  display: "flex",
  alignItems: "center",
  fontSize: e.typography.size.s1,
  fontWeight: e.typography.weight.regular,
  color: e.base === "light" ? xe(0.3, e.color.defaultText) : xe(0.6, e.color.defaultText),
  "& > * + *": {
    marginLeft: 4
  },
  svg: {
    height: 10,
    width: 10
  }
})), Oy = /* @__PURE__ */ s(({ url: e, versions: t }) => {
  let o = Y(() => {
    let i = Object.entries(t).find(([n, r]) => r === e);
    return i && i[0] ? i[0] : "current";
  }, [e, t]);
  return /* @__PURE__ */ a.createElement(ky, null, /* @__PURE__ */ a.createElement("span", null, o), /* @__PURE__ */ a.createElement(Po, null));
}, "CurrentVersion"), pc = a.memo(
  La(
    ({ state: e, ...t }, o) => {
      let i = pe(), n = Y(() => Object.values(t.index || {}), [t.index]), r = Y(
        () => n.filter((u) => u.type === "component").length,
        [n]
      ), l = Y(
        () => n.filter((u) => u.type === "docs" || u.type === "story").length,
        [n]
      );
      return /* @__PURE__ */ a.createElement(Cy, { ref: o }, /* @__PURE__ */ a.createElement(
        je,
        {
          placement: "bottom-start",
          trigger: "click",
          closeOnOutsideClick: !0,
          tooltip: /* @__PURE__ */ a.createElement(_y, null, /* @__PURE__ */ a.createElement(Et, { row: 0 }, e === "loading" && /* @__PURE__ */ a.
          createElement(Ny, { url: t.url }), (e === "error" || e === "empty") && /* @__PURE__ */ a.createElement(Ly, { url: t.url }), e === "\
ready" && /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(Py, { url: t.url, componentCount: r, leafCount: l }),
          t.sourceUrl && /* @__PURE__ */ a.createElement(Ay, { url: t.sourceUrl })), e === "auth" && /* @__PURE__ */ a.createElement(Dy, { ...t }),
          t.type === "auto-inject" && e !== "error" && /* @__PURE__ */ a.createElement(Fy, null), e !== "loading" && /* @__PURE__ */ a.createElement(
          My, null)))
        },
        /* @__PURE__ */ a.createElement(Ty, { "data-action": "toggle-indicator", "aria-label": "toggle indicator" }, /* @__PURE__ */ a.createElement(
        mi, null))
      ), t.versions && Object.keys(t.versions).length ? /* @__PURE__ */ a.createElement(
        je,
        {
          placement: "bottom-start",
          trigger: "click",
          closeOnOutsideClick: !0,
          tooltip: (u) => /* @__PURE__ */ a.createElement(
            Ct,
            {
              links: Object.entries(t.versions).map(([p, c]) => ({
                icon: c === t.url ? /* @__PURE__ */ a.createElement(et, null) : void 0,
                id: p,
                title: p,
                href: c,
                onClick: /* @__PURE__ */ s((d, m) => {
                  d.preventDefault(), i.changeRefVersion(t.id, m.href), u.onHide();
                }, "onClick")
              }))
            }
          )
        },
        /* @__PURE__ */ a.createElement(Oy, { url: t.url, versions: t.versions })
      ) : null);
    }
  )
), Py = /* @__PURE__ */ s(({ url: e, componentCount: t, leafCount: o }) => {
  let i = Fe();
  return /* @__PURE__ */ a.createElement(so, { href: e.replace(/\/?$/, "/index.html"), target: "_blank" }, /* @__PURE__ */ a.createElement(mi,
  { color: i.color.secondary }), /* @__PURE__ */ a.createElement("div", null, /* @__PURE__ */ a.createElement(io, null, "View external Story\
book"), /* @__PURE__ */ a.createElement("div", null, "Explore ", t, " components and ", o, " stories in a new browser tab.")));
}, "ReadyMessage"), Ay = /* @__PURE__ */ s(({ url: e }) => {
  let t = Fe();
  return /* @__PURE__ */ a.createElement(so, { href: e, target: "_blank" }, /* @__PURE__ */ a.createElement(Nl, { color: t.color.secondary }),
  /* @__PURE__ */ a.createElement("div", null, /* @__PURE__ */ a.createElement(io, null, "View source code")));
}, "SourceCodeMessage"), Dy = /* @__PURE__ */ s(({ loginUrl: e, id: t }) => {
  let o = Fe(), i = M((n) => {
    n.preventDefault();
    let r = Ey.open(e, `storybook_auth_${t}`, "resizable,scrollbars"), l = setInterval(() => {
      r ? r.closed && (clearInterval(l), wy.location.reload()) : clearInterval(l);
    }, 1e3);
  }, []);
  return /* @__PURE__ */ a.createElement(so, { onClick: i }, /* @__PURE__ */ a.createElement(zr, { color: o.color.gold }), /* @__PURE__ */ a.
  createElement("div", null, /* @__PURE__ */ a.createElement(io, null, "Log in required"), /* @__PURE__ */ a.createElement("div", null, "You\
 need to authenticate to view this Storybook's components.")));
}, "LoginRequiredMessage"), My = /* @__PURE__ */ s(() => {
  let e = Fe();
  return /* @__PURE__ */ a.createElement(so, { href: "https://storybook.js.org/docs/sharing/storybook-composition", target: "_blank" }, /* @__PURE__ */ a.
  createElement(Ao, { color: e.color.green }), /* @__PURE__ */ a.createElement("div", null, /* @__PURE__ */ a.createElement(io, null, "Read \
Composition docs"), /* @__PURE__ */ a.createElement("div", null, "Learn how to combine multiple Storybooks into one.")));
}, "ReadDocsMessage"), Ly = /* @__PURE__ */ s(({ url: e }) => {
  let t = Fe();
  return /* @__PURE__ */ a.createElement(so, { href: e.replace(/\/?$/, "/index.html"), target: "_blank" }, /* @__PURE__ */ a.createElement(Nr,
  { color: t.color.negative }), /* @__PURE__ */ a.createElement("div", null, /* @__PURE__ */ a.createElement(io, null, "Something went wrong"),
  /* @__PURE__ */ a.createElement("div", null, "This external Storybook didn't load. Debug it in a new tab now.")));
}, "ErrorOccurredMessage"), Ny = /* @__PURE__ */ s(({ url: e }) => {
  let t = Fe();
  return /* @__PURE__ */ a.createElement(so, { href: e.replace(/\/?$/, "/index.html"), target: "_blank" }, /* @__PURE__ */ a.createElement(jl,
  { color: t.color.secondary }), /* @__PURE__ */ a.createElement("div", null, /* @__PURE__ */ a.createElement(io, null, "Please wait"), /* @__PURE__ */ a.
  createElement("div", null, "This Storybook is loading.")));
}, "LoadingMessage"), Fy = /* @__PURE__ */ s(() => {
  let e = Fe();
  return /* @__PURE__ */ a.createElement(so, { href: "https://storybook.js.org/docs/sharing/storybook-composition", target: "_blank" }, /* @__PURE__ */ a.
  createElement(Ml, { color: e.color.gold }), /* @__PURE__ */ a.createElement("div", null, /* @__PURE__ */ a.createElement(io, null, "Reduce\
 lag"), /* @__PURE__ */ a.createElement("div", null, "Learn how to speed up Composition performance.")));
}, "PerformanceDegradedMessage");

// src/manager/components/sidebar/IconSymbols.tsx
var By = S.svg`
  position: absolute;
  width: 0;
  height: 0;
  display: inline-block;
  shape-rendering: inherit;
  vertical-align: middle;
`, cc = "icon--group", dc = "icon--component", fc = "icon--document", mc = "icon--story", hc = "icon--success", gc = "icon--error", yc = "ic\
on--warning", vc = "icon--dot", bc = /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(By, { "data-chromatic": "ignore" }, /* @__PURE__ */ a.
createElement("symbol", { id: cc }, /* @__PURE__ */ a.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M6.586 3.504l-1.5-1.5H1v9h12v-7.5H6.586zm.414-1L5.793 1.297a1 1 0 00-.707-.293H.5a.5.5 0 00-.5.5v10a.5.5 0 00.5.5h13a.5.5 0 00.5-.5v\
-8.5a.5.5 0 00-.5-.5H7z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ a.createElement("symbol", { id: dc }, /* @__PURE__ */ a.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M3.5 1.004a2.5 2.5 0 00-2.5 2.5v7a2.5 2.5 0 002.5 2.5h7a2.5 2.5 0 002.5-2.5v-7a2.5 2.5 0 00-2.5-2.5h-7zm8.5 5.5H7.5v-4.5h3a1.5 1.5 0\
 011.5 1.5v3zm0 1v3a1.5 1.5 0 01-1.5 1.5h-3v-4.5H12zm-5.5 4.5v-4.5H2v3a1.5 1.5 0 001.5 1.5h3zM2 6.504h4.5v-4.5h-3a1.5 1.5 0 00-1.5 1.5v3z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ a.createElement("symbol", { id: fc }, /* @__PURE__ */ a.createElement(
  "path",
  {
    d: "M4 5.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5zM4.5 7.5a.5.5 0 000 1h5a.5.5 0 000-1h-5zM4 10.5a.5.5 0 01.5-.5h5a.5.5 0 010 \
1h-5a.5.5 0 01-.5-.5z",
    fill: "currentColor"
  }
), /* @__PURE__ */ a.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M1.5 0a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V3.207a.5.5 0 00-.146-.353L10.146.146A.5.5 0 009.793 0H1.5zM2 1h7.5v2a.5.5 0\
 00.5.5h2V13H2V1z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ a.createElement("symbol", { id: mc }, /* @__PURE__ */ a.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M3.5 0h7a.5.5 0 01.5.5v13a.5.5 0 01-.454.498.462.462 0 01-.371-.118L7 11.159l-3.175 2.72a.46.46 0 01-.379.118A.5.5 0 013 13.5V.5a.5.\
5 0 01.5-.5zM4 12.413l2.664-2.284a.454.454 0 01.377-.128.498.498 0 01.284.12L10 12.412V1H4v11.413z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ a.createElement("symbol", { id: hc }, /* @__PURE__ */ a.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M10.854 4.146a.5.5 0 010 .708l-5 5a.5.5 0 01-.708 0l-2-2a.5.5 0 11.708-.708L5.5 8.793l4.646-4.647a.5.5 0 01.708 0z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ a.createElement("symbol", { id: gc }, /* @__PURE__ */ a.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M7 4a3 3 0 100 6 3 3 0 000-6zM3 7a4 4 0 118 0 4 4 0 01-8 0z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ a.createElement("symbol", { id: yc }, /* @__PURE__ */ a.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M7.206 3.044a.498.498 0 01.23.212l3.492 5.985a.494.494 0 01.006.507.497.497 0 01-.443.252H3.51a.499.499 0 01-.437-.76l3.492-5.984a.4\
97.497 0 01.642-.212zM7 4.492L4.37 9h5.26L7 4.492z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ a.createElement("symbol", { id: vc }, /* @__PURE__ */ a.createElement("circle", { cx: "3", cy: "3", r: "3", fill: "curre\
ntColor" }))), "IconSymbols"), $e = /* @__PURE__ */ s(({ type: e }) => e === "group" ? /* @__PURE__ */ a.createElement("use", { xlinkHref: `\
#${cc}` }) : e === "component" ? /* @__PURE__ */ a.createElement("use", { xlinkHref: `#${dc}` }) : e === "document" ? /* @__PURE__ */ a.createElement(
"use", { xlinkHref: `#${fc}` }) : e === "story" ? /* @__PURE__ */ a.createElement("use", { xlinkHref: `#${mc}` }) : e === "success" ? /* @__PURE__ */ a.
createElement("use", { xlinkHref: `#${hc}` }) : e === "error" ? /* @__PURE__ */ a.createElement("use", { xlinkHref: `#${gc}` }) : e === "war\
ning" ? /* @__PURE__ */ a.createElement("use", { xlinkHref: `#${yc}` }) : e === "dot" ? /* @__PURE__ */ a.createElement("use", { xlinkHref: `\
#${vc}` }) : null, "UseSymbol");

// src/manager/utils/status.tsx
var Hy = S(Cl)({
  // specificity hack
  "&&&": {
    width: 6,
    height: 6
  }
}), Ry = S(Hy)(({ theme: { animation: e, color: t, base: o } }) => ({
  // specificity hack
  animation: `${e.glow} 1.5s ease-in-out infinite`,
  color: o === "light" ? t.mediumdark : t.darker
})), zy = ["unknown", "pending", "success", "warn", "error"], rr = {
  unknown: [null, null],
  pending: [/* @__PURE__ */ a.createElement(Ry, { key: "icon" }), "currentColor"],
  success: [
    /* @__PURE__ */ a.createElement("svg", { key: "icon", viewBox: "0 0 14 14", width: "14", height: "14" }, /* @__PURE__ */ a.createElement(
    $e, { type: "success" })),
    "currentColor"
  ],
  warn: [
    /* @__PURE__ */ a.createElement("svg", { key: "icon", viewBox: "0 0 14 14", width: "14", height: "14" }, /* @__PURE__ */ a.createElement(
    $e, { type: "warning" })),
    "#A15C20"
  ],
  error: [
    /* @__PURE__ */ a.createElement("svg", { key: "icon", viewBox: "0 0 14 14", width: "14", height: "14" }, /* @__PURE__ */ a.createElement(
    $e, { type: "error" })),
    "brown"
  ]
}, nr = /* @__PURE__ */ s((e) => zy.reduce(
  (t, o) => e.includes(o) ? o : t,
  "unknown"
), "getHighestStatus");
function pn(e, t) {
  return Object.values(e).reduce((o, i) => {
    if (i.type === "group" || i.type === "component") {
      let n = It(e, i.id, !1).map((l) => e[l]).filter((l) => l.type === "story"), r = nr(
        // @ts-expect-error (non strict)
        n.flatMap((l) => Object.values(t?.[l.id] || {})).map((l) => l.status)
      );
      r && (o[i.id] = r);
    }
    return o;
  }, {});
}
s(pn, "getGroupStatus");

// src/manager/components/sidebar/StatusButton.tsx
var xc = /* @__PURE__ */ s(({ theme: e, status: t }) => {
  let o = e.base === "light" ? xe(0.3, e.color.defaultText) : xe(0.6, e.color.defaultText);
  return {
    color: {
      pending: o,
      success: e.color.positive,
      error: e.color.negative,
      warn: e.color.warning,
      unknown: o
    }[t]
  };
}, "withStatusColor"), Ic = S.div(xc, {
  margin: 3
}), ji = S(te)(
  xc,
  ({ theme: e, height: t, width: o }) => ({
    transition: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: o || 28,
    height: t || 28,
    "&:hover": {
      color: e.color.secondary
    },
    "&:focus": {
      color: e.color.secondary,
      borderColor: e.color.secondary,
      "&:not(:focus-visible)": {
        borderColor: "transparent"
      }
    }
  }),
  ({ theme: e, selectedItem: t }) => t && {
    "&:hover": {
      boxShadow: `inset 0 0 0 2px ${e.color.secondary}`,
      background: "rgba(255, 255, 255, 0.2)"
    }
  }
);

// src/manager/components/sidebar/StatusContext.tsx
var Vi = So({}), Sc = /* @__PURE__ */ s((e) => {
  let { data: t, status: o, groupStatus: i } = br(Vi), n = {
    counts: { pending: 0, success: 0, error: 0, warn: 0, unknown: 0 },
    statuses: { pending: {}, success: {}, error: {}, warn: {}, unknown: {} }
  };
  if (t && o && i && ["pending", "warn", "error"].includes(i[e.id]))
    for (let r of It(t, e.id, !1))
      for (let l of Object.values(o[r] || {}))
        n.counts[l.status]++, n.statuses[l.status][r] = n.statuses[l.status][r] || [], n.statuses[l.status][r].push(l);
  return n;
}, "useStatusSummary");

// src/manager/components/sidebar/components/CollapseIcon.tsx
var Wy = S.div(({ theme: e, isExpanded: t }) => ({
  width: 8,
  height: 8,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: xe(0.4, e.textMutedColor),
  transform: t ? "rotateZ(90deg)" : "none",
  transition: "transform .1s ease-out"
})), ao = /* @__PURE__ */ s(({ isExpanded: e }) => /* @__PURE__ */ a.createElement(Wy, { isExpanded: e }, /* @__PURE__ */ a.createElement("s\
vg", { xmlns: "http://www.w3.org/2000/svg", width: "8", height: "8", fill: "none" }, /* @__PURE__ */ a.createElement(
  "path",
  {
    fill: "#73828C",
    fillRule: "evenodd",
    d: "M1.896 7.146a.5.5 0 1 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 1 0-.708.708L5.043 4 1.896 7.146Z",
    clipRule: "evenodd"
  }
))), "CollapseIcon");

// src/manager/components/sidebar/TreeNode.tsx
var Ht = S.svg(
  ({ theme: e, type: t }) => ({
    width: 14,
    height: 14,
    flex: "0 0 auto",
    color: t === "group" ? e.base === "dark" ? e.color.primary : e.color.ultraviolet : t === "component" ? e.color.secondary : t === "docume\
nt" ? e.base === "dark" ? e.color.gold : "#ff8300" : t === "story" ? e.color.seafoam : "currentColor"
  })
), wc = S.button(({ theme: e, depth: t = 0, isExpandable: o = !1 }) => ({
  width: "100%",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "start",
  textAlign: "left",
  paddingLeft: `${(o ? 8 : 22) + t * 18}px`,
  color: "inherit",
  fontSize: `${e.typography.size.s2}px`,
  background: "transparent",
  minHeight: 28,
  borderRadius: 4,
  gap: 6,
  paddingTop: 5,
  paddingBottom: 4
})), Ec = S.a(({ theme: e, depth: t = 0 }) => ({
  width: "100%",
  cursor: "pointer",
  color: "inherit",
  display: "flex",
  gap: 6,
  flex: 1,
  alignItems: "start",
  paddingLeft: `${22 + t * 18}px`,
  paddingTop: 5,
  paddingBottom: 4,
  fontSize: `${e.typography.size.s2}px`,
  textDecoration: "none",
  overflowWrap: "break-word",
  wordWrap: "break-word",
  wordBreak: "break-word"
})), Cc = S.div(({ theme: e }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 16,
  marginBottom: 4,
  fontSize: `${e.typography.size.s1 - 1}px`,
  fontWeight: e.typography.weight.bold,
  lineHeight: "16px",
  minHeight: 28,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: e.textMutedColor
})), cn = S.div({
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginTop: 2
}), Tc = a.memo(/* @__PURE__ */ s(function({
  children: t,
  isExpanded: o = !1,
  isExpandable: i = !1,
  ...n
}) {
  return /* @__PURE__ */ a.createElement(wc, { isExpandable: i, tabIndex: -1, ...n }, /* @__PURE__ */ a.createElement(cn, null, i && /* @__PURE__ */ a.
  createElement(ao, { isExpanded: o }), /* @__PURE__ */ a.createElement(Ht, { viewBox: "0 0 14 14", width: "14", height: "14", type: "group" },
  /* @__PURE__ */ a.createElement($e, { type: "group" }))), t);
}, "GroupNode")), _c = a.memo(
  /* @__PURE__ */ s(function({ theme: t, children: o, isExpanded: i, isExpandable: n, isSelected: r, ...l }) {
    return /* @__PURE__ */ a.createElement(wc, { isExpandable: n, tabIndex: -1, ...l }, /* @__PURE__ */ a.createElement(cn, null, n && /* @__PURE__ */ a.
    createElement(ao, { isExpanded: i }), /* @__PURE__ */ a.createElement(Ht, { viewBox: "0 0 14 14", width: "12", height: "12", type: "comp\
onent" }, /* @__PURE__ */ a.createElement($e, { type: "component" }))), o);
  }, "ComponentNode")
), kc = a.memo(
  /* @__PURE__ */ s(function({ theme: t, children: o, docsMode: i, ...n }) {
    return /* @__PURE__ */ a.createElement(Ec, { tabIndex: -1, ...n }, /* @__PURE__ */ a.createElement(cn, null, /* @__PURE__ */ a.createElement(
    Ht, { viewBox: "0 0 14 14", width: "12", height: "12", type: "document" }, /* @__PURE__ */ a.createElement($e, { type: "document" }))), o);
  }, "DocumentNode")
), Oc = a.memo(/* @__PURE__ */ s(function({
  theme: t,
  children: o,
  ...i
}) {
  return /* @__PURE__ */ a.createElement(Ec, { tabIndex: -1, ...i }, /* @__PURE__ */ a.createElement(cn, null, /* @__PURE__ */ a.createElement(
  Ht, { viewBox: "0 0 14 14", width: "12", height: "12", type: "story" }, /* @__PURE__ */ a.createElement($e, { type: "story" }))), o);
}, "StoryNode"));

// ../node_modules/es-toolkit/dist/function/debounce.mjs
function dn(e, t, { signal: o, edges: i } = {}) {
  let n, r = null, l = i != null && i.includes("leading"), u = i == null || i.includes("trailing"), p = /* @__PURE__ */ s(() => {
    r !== null && (e.apply(n, r), n = void 0, r = null);
  }, "invoke"), c = /* @__PURE__ */ s(() => {
    u && p(), y();
  }, "onTimerEnd"), d = null, m = /* @__PURE__ */ s(() => {
    d != null && clearTimeout(d), d = setTimeout(() => {
      d = null, c();
    }, t);
  }, "schedule"), f = /* @__PURE__ */ s(() => {
    d !== null && (clearTimeout(d), d = null);
  }, "cancelTimer"), y = /* @__PURE__ */ s(() => {
    f(), n = void 0, r = null;
  }, "cancel"), h = /* @__PURE__ */ s(() => {
    f(), p();
  }, "flush"), v = /* @__PURE__ */ s(function(...I) {
    if (o?.aborted)
      return;
    n = this, r = I;
    let C = d == null;
    m(), l && C && p();
  }, "debounced");
  return v.schedule = m, v.cancel = y, v.flush = h, o?.addEventListener("abort", y, { once: !0 }), v;
}
s(dn, "debounce");

// ../node_modules/es-toolkit/dist/function/throttle.mjs
function $i(e, t, { signal: o, edges: i = ["leading", "trailing"] } = {}) {
  let n = null, r = dn(e, t, { signal: o, edges: i }), l = /* @__PURE__ */ s(function(...u) {
    n == null ? n = Date.now() : Date.now() - n >= t && (n = Date.now(), r.cancel(), r(...u)), r(...u);
  }, "throttled");
  return l.cancel = r.cancel, l.flush = r.flush, l;
}
s($i, "throttle");

// src/manager/keybinding.ts
var jy = {
  // event.code => event.key
  Space: " ",
  Slash: "/",
  ArrowLeft: "ArrowLeft",
  ArrowUp: "ArrowUp",
  ArrowRight: "ArrowRight",
  ArrowDown: "ArrowDown",
  Escape: "Escape",
  Enter: "Enter"
}, Vy = { alt: !1, ctrl: !1, meta: !1, shift: !1 }, Rt = /* @__PURE__ */ s((e, t) => {
  let { alt: o, ctrl: i, meta: n, shift: r } = e === !1 ? Vy : e;
  return !(typeof o == "boolean" && o !== t.altKey || typeof i == "boolean" && i !== t.ctrlKey || typeof n == "boolean" && n !== t.metaKey ||
  typeof r == "boolean" && r !== t.shiftKey);
}, "matchesModifiers"), tt = /* @__PURE__ */ s((e, t) => t.code ? t.code === e : t.key === jy[e], "matchesKeyCode");

// src/manager/components/sidebar/useExpanded.ts
var { document: Ki } = re, $y = /* @__PURE__ */ s(({
  refId: e,
  data: t,
  initialExpanded: o,
  highlightedRef: i,
  rootIds: n
}) => {
  let r = i.current?.refId === e ? tr(t, i.current?.itemId) : [];
  return [...n, ...r].reduce(
    // @ts-expect-error (non strict)
    (l, u) => Object.assign(l, { [u]: u in o ? o[u] : !0 }),
    {}
  );
}, "initializeExpanded"), Ky = /* @__PURE__ */ s(() => {
}, "noop"), Pc = /* @__PURE__ */ s(({
  containerRef: e,
  isBrowsing: t,
  refId: o,
  data: i,
  initialExpanded: n,
  rootIds: r,
  highlightedRef: l,
  setHighlightedItemId: u,
  selectedStoryId: p,
  onSelectStoryId: c
}) => {
  let d = pe(), [m, f] = wo(
    (b, { ids: x, value: g }) => x.reduce((w, T) => Object.assign(w, { [T]: g }), { ...b }),
    // @ts-expect-error (non strict)
    { refId: o, data: i, highlightedRef: l, rootIds: r, initialExpanded: n },
    $y
  ), y = M(
    (b) => e.current?.querySelector(`[data-item-id="${b}"]`),
    [e]
  ), h = M(
    (b) => {
      u(b.getAttribute("data-item-id")), ro(b);
    },
    [u]
  ), v = M(
    ({ ids: b, value: x }) => {
      if (f({ ids: b, value: x }), b.length === 1) {
        let g = e.current?.querySelector(
          `[data-item-id="${b[0]}"][data-ref-id="${o}"]`
        );
        g && h(g);
      }
    },
    [e, h, o]
  );
  z(() => {
    f({ ids: tr(i, p), value: !0 });
  }, [i, p]);
  let I = M(() => {
    let b = Object.keys(i).filter((x) => !r.includes(x));
    f({ ids: b, value: !1 });
  }, [i, r]), C = M(() => {
    f({ ids: Object.keys(i), value: !0 });
  }, [i]);
  return z(() => d ? (d.on(Ko, I), d.on(Qn, C), () => {
    d.off(Ko, I), d.off(Qn, C);
  }) : Ky, [d, I, C]), z(() => {
    let b = Ki.getElementById("storybook-explorer-menu"), x = $i((g) => {
      let w = l.current?.refId === o && l.current?.itemId;
      if (!t || !e.current || !w || g.repeat || !Rt(!1, g))
        return;
      let T = tt("Enter", g), _ = tt("Space", g), k = tt("ArrowLeft", g), E = tt("ArrowRight", g);
      if (!(T || _ || k || E))
        return;
      let O = y(w);
      if (!O || O.getAttribute("data-ref-id") !== o)
        return;
      let P = g.target;
      if (!no(b, P) && !no(P, b))
        return;
      if (P.hasAttribute("data-action")) {
        if (T || _)
          return;
        P.blur();
      }
      let A = O.getAttribute("data-nodetype");
      (T || _) && ["component", "story", "document"].includes(A) && c(w);
      let D = O.getAttribute("aria-expanded");
      if (k) {
        if (D === "true") {
          f({ ids: [w], value: !1 });
          return;
        }
        let L = O.getAttribute("data-parent-id"), B = L && y(L);
        if (B && B.getAttribute("data-highlightable") === "true") {
          h(B);
          return;
        }
        f({ ids: It(i, w, !0), value: !1 });
        return;
      }
      E && (D === "false" ? v({ ids: [w], value: !0 }) : D === "true" && v({ ids: It(i, w, !0), value: !0 }));
    }, 60);
    return Ki.addEventListener("keydown", x), () => Ki.removeEventListener("keydown", x);
  }, [
    e,
    t,
    o,
    i,
    l,
    u,
    c
  ]), [m, v];
}, "useExpanded");

// src/manager/components/sidebar/Tree.tsx
var Uy = "storybook/test", qL = `${Uy}/test-provider`, qy = S.div((e) => ({
  marginTop: e.hasOrphans ? 20 : 0,
  marginBottom: 20
})), Gy = S.button(({ theme: e }) => ({
  all: "unset",
  display: "flex",
  padding: "0px 8px",
  borderRadius: 4,
  transition: "color 150ms, box-shadow 150ms",
  gap: 6,
  alignItems: "center",
  cursor: "pointer",
  height: 28,
  "&:hover, &:focus": {
    outline: "none",
    background: xe(0.93, e.color.secondary)
  }
})), Ac = S.div(({ theme: e }) => ({
  position: "relative",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: e.color.defaultText,
  background: "transparent",
  minHeight: 28,
  borderRadius: 4,
  "&:hover, &:focus": {
    background: xe(0.93, e.color.secondary),
    outline: "none"
  },
  '&[data-selected="true"]': {
    color: e.color.lightest,
    background: e.color.secondary,
    fontWeight: e.typography.weight.bold,
    "&&:hover, &&:focus": {
      background: e.color.secondary
    },
    svg: { color: e.color.lightest }
  },
  a: { color: "currentColor" }
})), Yy = S(fe)(({ theme: e }) => ({
  display: "none",
  "@media (min-width: 600px)": {
    display: "block",
    fontSize: "10px",
    overflow: "hidden",
    width: 1,
    height: "20px",
    boxSizing: "border-box",
    opacity: 0,
    padding: 0,
    "&:focus": {
      opacity: 1,
      padding: "5px 10px",
      background: "white",
      color: e.color.secondary,
      width: "auto"
    }
  }
})), Dc = a.memo(/* @__PURE__ */ s(function({
  item: t,
  status: o,
  groupStatus: i,
  refId: n,
  docsMode: r,
  isOrphan: l,
  isDisplayed: u,
  isSelected: p,
  isFullyExpanded: c,
  setFullyExpanded: d,
  isExpanded: m,
  setExpanded: f,
  onSelectStoryId: y,
  collapsedData: h,
  api: v
}) {
  let { isDesktop: I, isMobile: C, setMobileMenuOpen: b } = ge(), x = Fe(), { counts: g, statuses: w } = Sc(t);
  if (!u)
    return null;
  let T = un(t.id, n);
  if (t.type === "story" || t.type === "docs") {
    let _ = t.type === "docs" ? kc : Oc, k = nr(Object.values(o || {}).map((A) => A.status)), [E, O] = rr[k], P = ["success", "error", "warn",
    "pending", "unknown"];
    return /* @__PURE__ */ a.createElement(
      Ac,
      {
        key: T,
        className: "sidebar-item",
        "data-selected": p,
        "data-ref-id": n,
        "data-item-id": t.id,
        "data-parent-id": t.parent,
        "data-nodetype": t.type === "docs" ? "document" : "story",
        "data-highlightable": u
      },
      /* @__PURE__ */ a.createElement(
        _,
        {
          style: p ? {} : { color: O },
          href: Xp(t, n),
          id: T,
          depth: l ? t.depth : t.depth - 1,
          onClick: (A) => {
            A.preventDefault(), y(t.id), C && b(!1);
          },
          ...t.type === "docs" && { docsMode: r }
        },
        t.renderLabel?.(t, v) || t.name
      ),
      p && /* @__PURE__ */ a.createElement(Yy, { asChild: !0 }, /* @__PURE__ */ a.createElement("a", { href: "#storybook-preview-wrapper" },
      "Skip to canvas")),
      E ? /* @__PURE__ */ a.createElement(
        je,
        {
          closeOnOutsideClick: !0,
          closeOnTriggerHidden: !0,
          onClick: (A) => A.stopPropagation(),
          placement: "bottom",
          tooltip: ({ onHide: A }) => /* @__PURE__ */ a.createElement(
            Ct,
            {
              links: Object.entries(o || {}).sort(
                (D, L) => P.indexOf(D[1].status) - P.indexOf(L[1].status)
              ).map(([D, L]) => ({
                id: D,
                title: L.title,
                description: L.description,
                "aria-label": `Test status for ${L.title}: ${L.status}`,
                icon: {
                  success: /* @__PURE__ */ a.createElement(Rl, { color: x.color.positive }),
                  error: /* @__PURE__ */ a.createElement(hi, { color: x.color.negative }),
                  warn: /* @__PURE__ */ a.createElement(gi, { color: x.color.warning }),
                  pending: /* @__PURE__ */ a.createElement(Ft, { size: 12, color: x.color.defaultText }),
                  unknown: null
                }[L.status],
                onClick: /* @__PURE__ */ s(() => {
                  y(t.id), L.onClick?.(), A();
                }, "onClick")
              }))
            }
          )
        },
        /* @__PURE__ */ a.createElement(
          ji,
          {
            "aria-label": `Test status: ${k}`,
            role: "status",
            type: "button",
            status: k,
            selectedItem: p
          },
          E
        )
      ) : null
    );
  }
  if (t.type === "root")
    return /* @__PURE__ */ a.createElement(
      Cc,
      {
        key: T,
        id: T,
        className: "sidebar-subheading",
        "data-ref-id": n,
        "data-item-id": t.id,
        "data-nodetype": "root"
      },
      /* @__PURE__ */ a.createElement(
        Gy,
        {
          type: "button",
          "data-action": "collapse-root",
          onClick: (_) => {
            _.preventDefault(), f({ ids: [t.id], value: !m });
          },
          "aria-expanded": m
        },
        /* @__PURE__ */ a.createElement(ao, { isExpanded: m }),
        t.renderLabel?.(t, v) || t.name
      ),
      m && /* @__PURE__ */ a.createElement(
        te,
        {
          className: "sidebar-subheading-action",
          "aria-label": c ? "Expand" : "Collapse",
          "data-action": "expand-all",
          "data-expanded": c,
          onClick: (_) => {
            _.preventDefault(), d();
          }
        },
        c ? /* @__PURE__ */ a.createElement(Tl, null) : /* @__PURE__ */ a.createElement(_l, null)
      )
    );
  if (t.type === "component" || t.type === "group") {
    let _ = i?.[t.id], k = _ ? rr[_][1] : null, E = t.type === "component" ? _c : Tc, O = /* @__PURE__ */ s((P) => {
      let A = [];
      return g.error && A.push({
        id: "errors",
        icon: /* @__PURE__ */ a.createElement(hi, { color: x.color.negative }),
        title: `${g.error} ${g.error === 1 ? "story" : "stories"} with errors`,
        onClick: /* @__PURE__ */ s(() => {
          let [D, [L]] = Object.entries(w.error)[0];
          y(D), L.onClick?.(), P();
        }, "onClick")
      }), g.warn && A.push({
        id: "warnings",
        icon: /* @__PURE__ */ a.createElement(gi, { color: x.color.gold }),
        title: `${g.warn} ${g.warn === 1 ? "story" : "stories"} with warnings`,
        onClick: /* @__PURE__ */ s(() => {
          let [D, [L]] = Object.entries(w.warn)[0];
          y(D), L.onClick?.(), P();
        }, "onClick")
      }), A;
    }, "createLinks");
    return /* @__PURE__ */ a.createElement(
      Ac,
      {
        key: T,
        className: "sidebar-item",
        "data-ref-id": n,
        "data-item-id": t.id,
        "data-parent-id": t.parent,
        "data-nodetype": t.type === "component" ? "component" : "group",
        "data-highlightable": u
      },
      /* @__PURE__ */ a.createElement(
        E,
        {
          id: T,
          style: k ? { color: k } : {},
          "aria-controls": t.children && t.children[0],
          "aria-expanded": m,
          depth: l ? t.depth : t.depth - 1,
          isComponent: t.type === "component",
          isExpandable: t.children && t.children.length > 0,
          isExpanded: m,
          onClick: (P) => {
            P.preventDefault(), f({ ids: [t.id], value: !m }), t.type === "component" && !m && I && y(t.id);
          },
          onMouseEnter: () => {
            t.type === "component" && v.emit($t, {
              ids: [t.children[0]],
              options: { target: n }
            });
          }
        },
        t.renderLabel?.(t, v) || t.name
      ),
      ["error", "warn"].includes(_) && /* @__PURE__ */ a.createElement(
        je,
        {
          closeOnOutsideClick: !0,
          onClick: (P) => P.stopPropagation(),
          placement: "bottom",
          tooltip: ({ onHide: P }) => /* @__PURE__ */ a.createElement(Ct, { links: O(P) })
        },
        /* @__PURE__ */ a.createElement(ji, { type: "button", status: _ }, /* @__PURE__ */ a.createElement("svg", { key: "icon", viewBox: "0\
 0 6 6", width: "6", height: "6", type: "dot" }, /* @__PURE__ */ a.createElement($e, { type: "dot" })))
      )
    );
  }
  return null;
}, "Node")), Xy = a.memo(/* @__PURE__ */ s(function({
  setExpanded: t,
  isFullyExpanded: o,
  expandableDescendants: i,
  ...n
}) {
  let r = M(
    () => t({ ids: i, value: !o }),
    [t, o, i]
  );
  return /* @__PURE__ */ a.createElement(
    Dc,
    {
      ...n,
      setExpanded: t,
      isFullyExpanded: o,
      setFullyExpanded: r
    }
  );
}, "Root")), Mc = a.memo(/* @__PURE__ */ s(function({
  isBrowsing: t,
  isMain: o,
  refId: i,
  data: n,
  status: r,
  docsMode: l,
  highlightedRef: u,
  setHighlightedItemId: p,
  selectedStoryId: c,
  onSelectStoryId: d
}) {
  let m = G(null), f = pe(), [y, h, v] = Y(
    () => Object.keys(n).reduce(
      (E, O) => {
        let P = n[O];
        return P.type === "root" ? E[0].push(O) : P.parent || E[1].push(O), P.type === "root" && P.startCollapsed && (E[2][O] = !1), E;
      },
      [[], [], {}]
    ),
    [n]
  ), { expandableDescendants: I } = Y(() => [...h, ...y].reduce(
    (E, O) => (E.expandableDescendants[O] = It(n, O, !1).filter(
      (P) => !["story", "docs"].includes(n[P].type)
    ), E),
    { orphansFirst: [], expandableDescendants: {} }
  ), [n, y, h]), C = Y(() => Object.keys(n).filter((E) => {
    let O = n[E];
    if (O.type !== "component")
      return !1;
    let { children: P = [], name: A } = O;
    if (P.length !== 1)
      return !1;
    let D = n[P[0]];
    return D.type === "docs" ? !0 : D.type === "story" ? tc(D.name, A) : !1;
  }), [n]), b = Y(
    () => Object.keys(n).filter((E) => !C.includes(E)),
    [C]
  ), x = Y(() => C.reduce(
    (E, O) => {
      let { children: P, parent: A, name: D } = n[O], [L] = P;
      if (A) {
        let B = [...n[A].children];
        B[B.indexOf(O)] = L, E[A] = { ...n[A], children: B };
      }
      return E[L] = {
        ...n[L],
        name: D,
        parent: A,
        depth: n[L].depth - 1
      }, E;
    },
    { ...n }
  ), [n]), g = Y(() => b.reduce(
    (E, O) => Object.assign(E, { [O]: tr(x, O) }),
    {}
  ), [b, x]), [w, T] = Pc({
    // @ts-expect-error (non strict)
    containerRef: m,
    isBrowsing: t,
    refId: i,
    data: x,
    initialExpanded: v,
    rootIds: y,
    highlightedRef: u,
    setHighlightedItemId: p,
    selectedStoryId: c,
    onSelectStoryId: d
  }), _ = Y(() => pn(x, r), [x, r]), k = Y(() => b.map((E) => {
    let O = x[E], P = un(E, i);
    if (O.type === "root") {
      let D = I[O.id], L = D.every((B) => w[B]);
      return (
        // @ts-expect-error (TODO)
        /* @__PURE__ */ a.createElement(
          Xy,
          {
            api: f,
            key: P,
            item: O,
            refId: i,
            collapsedData: x,
            isOrphan: !1,
            isDisplayed: !0,
            isSelected: c === E,
            isExpanded: !!w[E],
            setExpanded: T,
            isFullyExpanded: L,
            expandableDescendants: D,
            onSelectStoryId: d
          }
        )
      );
    }
    let A = !O.parent || g[E].every((D) => w[D]);
    return /* @__PURE__ */ a.createElement(
      Dc,
      {
        api: f,
        collapsedData: x,
        key: P,
        item: O,
        status: r?.[E],
        groupStatus: _,
        refId: i,
        docsMode: l,
        isOrphan: h.some((D) => E === D || E.startsWith(`${D}-`)),
        isDisplayed: A,
        isSelected: c === E,
        isExpanded: !!w[E],
        setExpanded: T,
        onSelectStoryId: d
      }
    );
  }), [
    g,
    f,
    x,
    b,
    l,
    I,
    w,
    _,
    d,
    h,
    i,
    c,
    T,
    r
  ]);
  return /* @__PURE__ */ a.createElement(Vi.Provider, { value: { data: n, status: r, groupStatus: _ } }, /* @__PURE__ */ a.createElement(qy,
  { ref: m, hasOrphans: o && h.length > 0 }, /* @__PURE__ */ a.createElement(bc, null), k));
}, "Tree"));

// src/manager/components/sidebar/Refs.tsx
var Qy = S.div(({ isMain: e }) => ({
  position: "relative",
  marginTop: e ? void 0 : 0
})), Zy = S.div(({ theme: e }) => ({
  fontWeight: e.typography.weight.bold,
  fontSize: e.typography.size.s2,
  // Similar to ListItem.tsx
  textDecoration: "none",
  lineHeight: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "transparent",
  width: "100%",
  marginTop: 20,
  paddingTop: 16,
  paddingBottom: 12,
  borderTop: `1px solid ${e.appBorderColor}`,
  color: e.base === "light" ? e.color.defaultText : xe(0.2, e.color.defaultText)
})), Jy = S.div({
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  flex: 1,
  overflow: "hidden",
  marginLeft: 2
}), ev = S.button(({ theme: e }) => ({
  all: "unset",
  display: "flex",
  padding: "0px 8px",
  gap: 6,
  alignItems: "center",
  cursor: "pointer",
  overflow: "hidden",
  "&:focus": {
    borderColor: e.color.secondary,
    "span:first-of-type": {
      borderLeftColor: e.color.secondary
    }
  }
})), Lc = a.memo(
  /* @__PURE__ */ s(function(t) {
    let { docsOptions: o } = Ze(), i = pe(), {
      index: n,
      id: r,
      title: l = r,
      isLoading: u,
      isBrowsing: p,
      selectedStoryId: c,
      highlightedRef: d,
      setHighlighted: m,
      loginUrl: f,
      type: y,
      expanded: h = !0,
      indexError: v,
      previewInitialized: I
    } = t, C = Y(() => n ? Object.keys(n).length : 0, [n]), b = G(null), x = r === St, w = u || (y === "auto-inject" && !I || y === "server-\
checked") || y === "unknown", E = ec(w, !!f && C === 0, !!v, !w && C === 0), [O, P] = U(h);
    z(() => {
      n && c && n[c] && P(!0);
    }, [P, n, c]);
    let A = M(() => P((B) => !B), [P]), D = M(
      (B) => m({ itemId: B, refId: r }),
      [m]
    ), L = M(
      // @ts-expect-error (non strict)
      (B) => i && i.selectStory(B, void 0, { ref: !x && r }),
      [i, x, r]
    );
    return /* @__PURE__ */ a.createElement(a.Fragment, null, x || /* @__PURE__ */ a.createElement(
      Zy,
      {
        "aria-label": `${O ? "Hide" : "Show"} ${l} stories`,
        "aria-expanded": O
      },
      /* @__PURE__ */ a.createElement(ev, { "data-action": "collapse-ref", onClick: A }, /* @__PURE__ */ a.createElement(ao, { isExpanded: O }),
      /* @__PURE__ */ a.createElement(Jy, { title: l }, l)),
      /* @__PURE__ */ a.createElement(pc, { ...t, state: E, ref: b })
    ), O && /* @__PURE__ */ a.createElement(Qy, { "data-title": l, isMain: x }, E === "auth" && /* @__PURE__ */ a.createElement(sc, { id: r,
    loginUrl: f }), E === "error" && /* @__PURE__ */ a.createElement(ac, { error: v }), E === "loading" && /* @__PURE__ */ a.createElement(uc,
    { isMain: x }), E === "empty" && /* @__PURE__ */ a.createElement(lc, { isMain: x }), E === "ready" && /* @__PURE__ */ a.createElement(
      Mc,
      {
        status: t.status,
        isBrowsing: p,
        isMain: x,
        refId: r,
        data: n,
        docsMode: o.docsMode,
        selectedStoryId: c,
        onSelectStoryId: L,
        highlightedRef: d,
        setHighlightedItemId: D
      }
    )));
  }, "Ref")
);

// src/manager/components/sidebar/useHighlighted.ts
var { document: Ui, window: Nc } = re, Fc = /* @__PURE__ */ s((e) => e ? { itemId: e.storyId, refId: e.refId } : null, "fromSelection"), Bc = /* @__PURE__ */ s(
({
  containerRef: e,
  isLoading: t,
  isBrowsing: o,
  dataset: i,
  selected: n
}) => {
  let r = Fc(n), l = G(r), [u, p] = U(r), c = pe(), d = M(
    (f) => {
      l.current = f, p(f);
    },
    [l]
  ), m = M(
    (f, y = !1) => {
      let h = f.getAttribute("data-item-id"), v = f.getAttribute("data-ref-id");
      !h || !v || (d({ itemId: h, refId: v }), ro(f, y));
    },
    [d]
  );
  return z(() => {
    let f = Fc(n);
    if (d(f), f) {
      let { itemId: y, refId: h } = f;
      setTimeout(() => {
        ro(
          // @ts-expect-error (non strict)
          e.current?.querySelector(`[data-item-id="${y}"][data-ref-id="${h}"]`),
          !0
          // make sure it's clearly visible by centering it
        );
      }, 0);
    }
  }, [i, l, e, n]), z(() => {
    let f = Ui.getElementById("storybook-explorer-menu"), y, h = /* @__PURE__ */ s((v) => {
      if (t || !o || !e.current || !Rt(!1, v))
        return;
      let I = tt("ArrowUp", v), C = tt("ArrowDown", v);
      if (!(I || C))
        return;
      let b = Nc.requestAnimationFrame(() => {
        Nc.cancelAnimationFrame(y), y = b;
        let x = v.target;
        if (!no(f, x) && !no(x, f))
          return;
        x.hasAttribute("data-action") && x.blur();
        let g = Array.from(
          e.current.querySelectorAll("[data-highlightable=true]")
        ), w = g.findIndex(
          (k) => k.getAttribute("data-item-id") === l.current?.itemId && k.getAttribute("data-ref-id") === l.current?.refId
        ), T = Jp(g, w, I ? -1 : 1), _ = I ? T === g.length - 1 : T === 0;
        if (m(g[T], _), g[T].getAttribute("data-nodetype") === "component") {
          let { itemId: k, refId: E } = l.current, O = c.resolveStory(k, E === "storybook_internal" ? void 0 : E);
          O.type === "component" && c.emit($t, {
            // @ts-expect-error (non strict)
            ids: [O.children[0]],
            options: { target: E }
          });
        }
      });
    }, "navigateTree");
    return Ui.addEventListener("keydown", h), () => Ui.removeEventListener("keydown", h);
  }, [t, o, l, m]), [u, d, l];
}, "useHighlighted");

// src/manager/components/sidebar/Explorer.tsx
var Hc = a.memo(/* @__PURE__ */ s(function({
  isLoading: t,
  isBrowsing: o,
  dataset: i,
  selected: n
}) {
  let r = G(null), [l, u, p] = Bc({
    // @ts-expect-error (non strict)
    containerRef: r,
    isLoading: t,
    isBrowsing: o,
    dataset: i,
    selected: n
  });
  return /* @__PURE__ */ a.createElement(
    "div",
    {
      ref: r,
      id: "storybook-explorer-tree",
      "data-highlighted-ref-id": l?.refId,
      "data-highlighted-item-id": l?.itemId
    },
    l && /* @__PURE__ */ a.createElement(Up, { ...l }),
    i.entries.map(([c, d]) => /* @__PURE__ */ a.createElement(
      Lc,
      {
        ...d,
        key: c,
        isLoading: t,
        isBrowsing: o,
        selectedStoryId: n?.refId === d.id ? n.storyId : null,
        highlightedRef: p,
        setHighlighted: u
      }
    ))
  );
}, "Explorer"));

// src/manager/components/sidebar/Brand.tsx
var tv = S(Dr)(({ theme: e }) => ({
  width: "auto",
  height: "22px !important",
  display: "block",
  color: e.base === "light" ? e.color.defaultText : e.color.lightest
})), ov = S.img({
  display: "block",
  maxWidth: "150px !important",
  maxHeight: "100px"
}), Rc = S.a(({ theme: e }) => ({
  display: "inline-block",
  height: "100%",
  margin: "-3px -4px",
  padding: "2px 3px",
  border: "1px solid transparent",
  borderRadius: 3,
  color: "inherit",
  textDecoration: "none",
  "&:focus": {
    outline: 0,
    borderColor: e.color.secondary
  }
})), zc = Va(({ theme: e }) => {
  let { title: t = "Storybook", url: o = "./", image: i, target: n } = e.brand, r = n || (o === "./" ? "" : "_blank");
  if (i === null)
    return t === null ? null : o ? /* @__PURE__ */ a.createElement(Rc, { href: o, target: r, dangerouslySetInnerHTML: { __html: t } }) : /* @__PURE__ */ a.
    createElement("div", { dangerouslySetInnerHTML: { __html: t } });
  let l = i ? /* @__PURE__ */ a.createElement(ov, { src: i, alt: t }) : /* @__PURE__ */ a.createElement(tv, { alt: t });
  return o ? /* @__PURE__ */ a.createElement(Rc, { title: t, href: o, target: r }, l) : /* @__PURE__ */ a.createElement("div", null, l);
});

// src/manager/components/sidebar/Menu.tsx
var Wc = S(te)(({ highlighted: e, theme: t }) => ({
  position: "relative",
  overflow: "visible",
  marginTop: 0,
  zIndex: 1,
  ...e && {
    "&:before, &:after": {
      content: '""',
      position: "absolute",
      top: 6,
      right: 6,
      width: 5,
      height: 5,
      zIndex: 2,
      borderRadius: "50%",
      background: t.background.app,
      border: `1px solid ${t.background.app}`,
      boxShadow: `0 0 0 2px ${t.background.app}`
    },
    "&:after": {
      background: t.color.positive,
      border: "1px solid rgba(0, 0, 0, 0.1)",
      boxShadow: `0 0 0 2px ${t.background.app}`
    },
    "&:hover:after, &:focus-visible:after": {
      boxShadow: `0 0 0 2px ${xe(0.88, t.color.secondary)}`
    }
  }
})), rv = S.div({
  display: "flex",
  gap: 4
}), nv = /* @__PURE__ */ s(({ menu: e, onHide: t }) => {
  let o = Y(() => e.map(({ onClick: i, ...n }) => ({
    ...n,
    onClick: /* @__PURE__ */ s((r, l) => {
      i && i(r, l), t();
    }, "onClick")
  })), [e, t]);
  return /* @__PURE__ */ a.createElement(Ct, { links: o });
}, "SidebarMenuList"), jc = /* @__PURE__ */ s(({ menu: e, isHighlighted: t, onClick: o }) => {
  let [i, n] = U(!1), { isMobile: r, setMobileMenuOpen: l } = ge();
  return r ? /* @__PURE__ */ a.createElement(rv, null, /* @__PURE__ */ a.createElement(
    Wc,
    {
      title: "About Storybook",
      "aria-label": "About Storybook",
      highlighted: t,
      active: !1,
      onClick: o
    },
    /* @__PURE__ */ a.createElement(di, null)
  ), /* @__PURE__ */ a.createElement(
    te,
    {
      title: "Close menu",
      "aria-label": "Close menu",
      onClick: () => l(!1)
    },
    /* @__PURE__ */ a.createElement(ct, null)
  )) : /* @__PURE__ */ a.createElement(
    je,
    {
      placement: "top",
      closeOnOutsideClick: !0,
      tooltip: ({ onHide: u }) => /* @__PURE__ */ a.createElement(nv, { onHide: u, menu: e }),
      onVisibleChange: n
    },
    /* @__PURE__ */ a.createElement(
      Wc,
      {
        title: "Shortcuts",
        "aria-label": "Shortcuts",
        highlighted: t,
        active: i
      },
      /* @__PURE__ */ a.createElement(di, null)
    )
  );
}, "SidebarMenu");

// src/manager/components/sidebar/Heading.tsx
var iv = S.div(({ theme: e }) => ({
  fontSize: e.typography.size.s2,
  fontWeight: e.typography.weight.bold,
  color: e.color.defaultText,
  marginRight: 20,
  display: "flex",
  width: "100%",
  alignItems: "center",
  minHeight: 22,
  "& > * > *": {
    maxWidth: "100%"
  },
  "& > *": {
    maxWidth: "100%",
    height: "auto",
    display: "block",
    flex: "1 1 auto"
  }
})), sv = S.div({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  position: "relative",
  minHeight: 42,
  paddingLeft: 8
}), av = S(fe)(({ theme: e }) => ({
  display: "none",
  "@media (min-width: 600px)": {
    display: "block",
    position: "absolute",
    fontSize: e.typography.size.s1,
    zIndex: 3,
    border: 0,
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    wordWrap: "normal",
    opacity: 0,
    transition: "opacity 150ms ease-out",
    "&:focus": {
      width: "100%",
      height: "inherit",
      padding: "10px 15px",
      margin: 0,
      clip: "unset",
      overflow: "unset",
      opacity: 1
    }
  }
})), Vc = /* @__PURE__ */ s(({
  menuHighlighted: e = !1,
  menu: t,
  skipLinkHref: o,
  extra: i,
  isLoading: n,
  onMenuClick: r,
  ...l
}) => /* @__PURE__ */ a.createElement(sv, { ...l }, o && /* @__PURE__ */ a.createElement(av, { asChild: !0 }, /* @__PURE__ */ a.createElement(
"a", { href: o, tabIndex: 0 }, "Skip to canvas")), /* @__PURE__ */ a.createElement(iv, null, /* @__PURE__ */ a.createElement(zc, null)), n ?
null : i.map(({ id: u, render: p }) => /* @__PURE__ */ a.createElement(p, { key: u })), /* @__PURE__ */ a.createElement(jc, { menu: t, isHighlighted: e,
onClick: r })), "Heading");

// ../node_modules/downshift/dist/downshift.esm.js
var Q = Ve(ti());
var cv = Ve(qc());

// ../node_modules/compute-scroll-into-view/dist/index.js
var Gc = /* @__PURE__ */ s((e) => typeof e == "object" && e != null && e.nodeType === 1, "t"), Yc = /* @__PURE__ */ s((e, t) => (!t || e !==
"hidden") && e !== "visible" && e !== "clip", "e"), Yi = /* @__PURE__ */ s((e, t) => {
  if (e.clientHeight < e.scrollHeight || e.clientWidth < e.scrollWidth) {
    let o = getComputedStyle(e, null);
    return Yc(o.overflowY, t) || Yc(o.overflowX, t) || ((i) => {
      let n = ((r) => {
        if (!r.ownerDocument || !r.ownerDocument.defaultView) return null;
        try {
          return r.ownerDocument.defaultView.frameElement;
        } catch {
          return null;
        }
      })(i);
      return !!n && (n.clientHeight < i.scrollHeight || n.clientWidth < i.scrollWidth);
    })(e);
  }
  return !1;
}, "n"), wn = /* @__PURE__ */ s((e, t, o, i, n, r, l, u) => r < e && l > t || r > e && l < t ? 0 : r <= e && u <= o || l >= t && u >= o ? r -
e - i : l > t && u < o || r < e && u > o ? l - t + n : 0, "o"), pv = /* @__PURE__ */ s((e) => {
  let t = e.parentElement;
  return t ?? (e.getRootNode().host || null);
}, "l"), Xc = /* @__PURE__ */ s((e, t) => {
  var o, i, n, r;
  if (typeof document > "u") return [];
  let { scrollMode: l, block: u, inline: p, boundary: c, skipOverflowHiddenElements: d } = t, m = typeof c == "function" ? c : (N) => N !== c;
  if (!Gc(e)) throw new TypeError("Invalid target");
  let f = document.scrollingElement || document.documentElement, y = [], h = e;
  for (; Gc(h) && m(h); ) {
    if (h = pv(h), h === f) {
      y.push(h);
      break;
    }
    h != null && h === document.body && Yi(h) && !Yi(document.documentElement) || h != null && Yi(h, d) && y.push(h);
  }
  let v = (i = (o = window.visualViewport) == null ? void 0 : o.width) != null ? i : innerWidth, I = (r = (n = window.visualViewport) == null ?
  void 0 : n.height) != null ? r : innerHeight, { scrollX: C, scrollY: b } = window, { height: x, width: g, top: w, right: T, bottom: _, left: k } = e.
  getBoundingClientRect(), { top: E, right: O, bottom: P, left: A } = ((N) => {
    let V = window.getComputedStyle(N);
    return { top: parseFloat(V.scrollMarginTop) || 0, right: parseFloat(V.scrollMarginRight) || 0, bottom: parseFloat(V.scrollMarginBottom) ||
    0, left: parseFloat(V.scrollMarginLeft) || 0 };
  })(e), D = u === "start" || u === "nearest" ? w - E : u === "end" ? _ + P : w + x / 2 - E + P, L = p === "center" ? k + g / 2 - A + O : p ===
  "end" ? T + O : k - A, B = [];
  for (let N = 0; N < y.length; N++) {
    let V = y[N], { height: R, width: K, top: W, right: ee, bottom: H, left: j } = V.getBoundingClientRect();
    if (l === "if-needed" && w >= 0 && k >= 0 && _ <= I && T <= v && w >= W && _ <= H && k >= j && T <= ee) return B;
    let F = getComputedStyle(V), $ = parseInt(F.borderLeftWidth, 10), X = parseInt(F.borderTopWidth, 10), oe = parseInt(F.borderRightWidth, 10),
    J = parseInt(F.borderBottomWidth, 10), ae = 0, ie = 0, se = "offsetWidth" in V ? V.offsetWidth - V.clientWidth - $ - oe : 0, le = "offse\
tHeight" in V ? V.offsetHeight - V.clientHeight - X - J : 0, ve = "offsetWidth" in V ? V.offsetWidth === 0 ? 0 : K / V.offsetWidth : 0, he = "\
offsetHeight" in V ? V.offsetHeight === 0 ? 0 : R / V.offsetHeight : 0;
    if (f === V) ae = u === "start" ? D : u === "end" ? D - I : u === "nearest" ? wn(b, b + I, I, X, J, b + D, b + D + x, x) : D - I / 2, ie =
    p === "start" ? L : p === "center" ? L - v / 2 : p === "end" ? L - v : wn(C, C + v, v, $, oe, C + L, C + L + g, g), ae = Math.max(0, ae +
    b), ie = Math.max(0, ie + C);
    else {
      ae = u === "start" ? D - W - X : u === "end" ? D - H + J + le : u === "nearest" ? wn(W, H, R, X, J + le, D, D + x, x) : D - (W + R / 2) +
      le / 2, ie = p === "start" ? L - j - $ : p === "center" ? L - (j + K / 2) + se / 2 : p === "end" ? L - ee + oe + se : wn(j, ee, K, $, oe +
      se, L, L + g, g);
      let { scrollLeft: Pe, scrollTop: ue } = V;
      ae = he === 0 ? 0 : Math.max(0, Math.min(ue + ae / he, V.scrollHeight - R / he + le)), ie = ve === 0 ? 0 : Math.max(0, Math.min(Pe + ie /
      ve, V.scrollWidth - K / ve + se)), D += ue - ae, L += Pe - ie;
    }
    B.push({ el: V, top: ae, left: ie });
  }
  return B;
}, "r");

// ../node_modules/tslib/tslib.es6.mjs
var lo = /* @__PURE__ */ s(function() {
  return lo = Object.assign || /* @__PURE__ */ s(function(t) {
    for (var o, i = 1, n = arguments.length; i < n; i++) {
      o = arguments[i];
      for (var r in o) Object.prototype.hasOwnProperty.call(o, r) && (t[r] = o[r]);
    }
    return t;
  }, "__assign"), lo.apply(this, arguments);
}, "__assign");

// ../node_modules/downshift/dist/downshift.esm.js
var dv = 0;
function Qc(e) {
  return typeof e == "function" ? e : Ye;
}
s(Qc, "cbToCb");
function Ye() {
}
s(Ye, "noop");
function nd(e, t) {
  if (e) {
    var o = Xc(e, {
      boundary: t,
      block: "nearest",
      scrollMode: "if-needed"
    });
    o.forEach(function(i) {
      var n = i.el, r = i.top, l = i.left;
      n.scrollTop = r, n.scrollLeft = l;
    });
  }
}
s(nd, "scrollIntoView");
function Zc(e, t, o) {
  var i = e === t || t instanceof o.Node && e.contains && e.contains(t);
  return i;
}
s(Zc, "isOrContainsNode");
function Nn(e, t) {
  var o;
  function i() {
    o && clearTimeout(o);
  }
  s(i, "cancel");
  function n() {
    for (var r = arguments.length, l = new Array(r), u = 0; u < r; u++)
      l[u] = arguments[u];
    i(), o = setTimeout(function() {
      o = null, e.apply(void 0, l);
    }, t);
  }
  return s(n, "wrapper"), n.cancel = i, n;
}
s(Nn, "debounce");
function ce() {
  for (var e = arguments.length, t = new Array(e), o = 0; o < e; o++)
    t[o] = arguments[o];
  return function(i) {
    for (var n = arguments.length, r = new Array(n > 1 ? n - 1 : 0), l = 1; l < n; l++)
      r[l - 1] = arguments[l];
    return t.some(function(u) {
      return u && u.apply(void 0, [i].concat(r)), i.preventDownshiftDefault || i.hasOwnProperty("nativeEvent") && i.nativeEvent.preventDownshiftDefault;
    });
  };
}
s(ce, "callAllEventHandlers");
function ft() {
  for (var e = arguments.length, t = new Array(e), o = 0; o < e; o++)
    t[o] = arguments[o];
  return function(i) {
    t.forEach(function(n) {
      typeof n == "function" ? n(i) : n && (n.current = i);
    });
  };
}
s(ft, "handleRefs");
function id() {
  return String(dv++);
}
s(id, "generateId");
function fv(e) {
  var t = e.isOpen, o = e.resultCount, i = e.previousResultCount;
  return t ? o ? o !== i ? o + " result" + (o === 1 ? " is" : "s are") + " available, use up and down arrow keys to navigate. Press Enter ke\
y to select." : "" : "No results are available." : "";
}
s(fv, "getA11yStatusMessage");
function Jc(e, t) {
  return e = Array.isArray(e) ? (
    /* istanbul ignore next (preact) */
    e[0]
  ) : e, !e && t ? t : e;
}
s(Jc, "unwrapArray");
function mv(e) {
  return typeof e.type == "string";
}
s(mv, "isDOMElement");
function hv(e) {
  return e.props;
}
s(hv, "getElementProps");
var gv = ["highlightedIndex", "inputValue", "isOpen", "selectedItem", "type"];
function En(e) {
  e === void 0 && (e = {});
  var t = {};
  return gv.forEach(function(o) {
    e.hasOwnProperty(o) && (t[o] = e[o]);
  }), t;
}
s(En, "pickState");
function sr(e, t) {
  return !e || !t ? e : Object.keys(e).reduce(function(o, i) {
    return o[i] = On(t, i) ? t[i] : e[i], o;
  }, {});
}
s(sr, "getState");
function On(e, t) {
  return e[t] !== void 0;
}
s(On, "isControlledProp");
function Ho(e) {
  var t = e.key, o = e.keyCode;
  return o >= 37 && o <= 40 && t.indexOf("Arrow") !== 0 ? "Arrow" + t : t;
}
s(Ho, "normalizeArrowKey");
function mt(e, t, o, i, n) {
  n === void 0 && (n = !1);
  var r = o.length;
  if (r === 0)
    return -1;
  var l = r - 1;
  (typeof e != "number" || e < 0 || e > l) && (e = t > 0 ? -1 : l + 1);
  var u = e + t;
  u < 0 ? u = n ? l : 0 : u > l && (u = n ? 0 : l);
  var p = zt(u, t < 0, o, i, n);
  return p === -1 ? e >= r ? -1 : e : p;
}
s(mt, "getHighlightedIndex");
function zt(e, t, o, i, n) {
  n === void 0 && (n = !1);
  var r = o.length;
  if (t) {
    for (var l = e; l >= 0; l--)
      if (!i(o[l], l))
        return l;
  } else
    for (var u = e; u < r; u++)
      if (!i(o[u], u))
        return u;
  return n ? zt(t ? r - 1 : 0, t, o, i) : -1;
}
s(zt, "getNonDisabledIndex");
function Pn(e, t, o, i) {
  return i === void 0 && (i = !0), o && t.some(function(n) {
    return n && (Zc(n, e, o) || i && Zc(n, o.document.activeElement, o));
  });
}
s(Pn, "targetWithinDownshift");
var yv = Nn(function(e) {
  sd(e).textContent = "";
}, 500);
function sd(e) {
  var t = e.getElementById("a11y-status-message");
  return t || (t = e.createElement("div"), t.setAttribute("id", "a11y-status-message"), t.setAttribute("role", "status"), t.setAttribute("ar\
ia-live", "polite"), t.setAttribute("aria-relevant", "additions text"), Object.assign(t.style, {
    border: "0",
    clip: "rect(0 0 0 0)",
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: "0",
    position: "absolute",
    width: "1px"
  }), e.body.appendChild(t), t);
}
s(sd, "getStatusDiv");
function ad(e, t) {
  if (!(!e || !t)) {
    var o = sd(t);
    o.textContent = e, yv(t);
  }
}
s(ad, "setStatus");
function vv(e) {
  var t = e?.getElementById("a11y-status-message");
  t && t.remove();
}
s(vv, "cleanupStatusDiv");
var ld = 0, ud = 1, pd = 2, Cn = 3, Tn = 4, cd = 5, dd = 6, fd = 7, md = 8, hd = 9, gd = 10, yd = 11, vd = 12, bd = 13, xd = 14, Id = 15, Sd = 16,
bv = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  unknown: ld,
  mouseUp: ud,
  itemMouseEnter: pd,
  keyDownArrowUp: Cn,
  keyDownArrowDown: Tn,
  keyDownEscape: cd,
  keyDownEnter: dd,
  keyDownHome: fd,
  keyDownEnd: md,
  clickItem: hd,
  blurInput: gd,
  changeInput: yd,
  keyDownSpaceButton: vd,
  clickButton: bd,
  blurButton: xd,
  controlledPropUpdatedSelectedItem: Id,
  touchEnd: Sd
}), xv = ["refKey", "ref"], Iv = ["onClick", "onPress", "onKeyDown", "onKeyUp", "onBlur"], Sv = ["onKeyDown", "onBlur", "onChange", "onInput",
"onChangeText"], wv = ["refKey", "ref"], Ev = ["onMouseMove", "onMouseDown", "onClick", "onPress", "index", "item"], Cv = /* @__PURE__ */ function() {
  var e = /* @__PURE__ */ function(t) {
    function o(n) {
      var r;
      r = t.call(this, n) || this, r.id = r.props.id || "downshift-" + id(), r.menuId = r.props.menuId || r.id + "-menu", r.labelId = r.props.
      labelId || r.id + "-label", r.inputId = r.props.inputId || r.id + "-input", r.getItemId = r.props.getItemId || function(b) {
        return r.id + "-item-" + b;
      }, r.items = [], r.itemCount = null, r.previousResultCount = 0, r.timeoutIds = [], r.internalSetTimeout = function(b, x) {
        var g = setTimeout(function() {
          r.timeoutIds = r.timeoutIds.filter(function(w) {
            return w !== g;
          }), b();
        }, x);
        r.timeoutIds.push(g);
      }, r.setItemCount = function(b) {
        r.itemCount = b;
      }, r.unsetItemCount = function() {
        r.itemCount = null;
      }, r.isItemDisabled = function(b, x) {
        var g = r.getItemNodeFromIndex(x);
        return g && g.hasAttribute("disabled");
      }, r.setHighlightedIndex = function(b, x) {
        b === void 0 && (b = r.props.defaultHighlightedIndex), x === void 0 && (x = {}), x = En(x), r.internalSetState(q({
          highlightedIndex: b
        }, x));
      }, r.clearSelection = function(b) {
        r.internalSetState({
          selectedItem: null,
          inputValue: "",
          highlightedIndex: r.props.defaultHighlightedIndex,
          isOpen: r.props.defaultIsOpen
        }, b);
      }, r.selectItem = function(b, x, g) {
        x = En(x), r.internalSetState(q({
          isOpen: r.props.defaultIsOpen,
          highlightedIndex: r.props.defaultHighlightedIndex,
          selectedItem: b,
          inputValue: r.props.itemToString(b)
        }, x), g);
      }, r.selectItemAtIndex = function(b, x, g) {
        var w = r.items[b];
        w != null && r.selectItem(w, x, g);
      }, r.selectHighlightedItem = function(b, x) {
        return r.selectItemAtIndex(r.getState().highlightedIndex, b, x);
      }, r.internalSetState = function(b, x) {
        var g, w, T = {}, _ = typeof b == "function";
        return !_ && b.hasOwnProperty("inputValue") && r.props.onInputValueChange(b.inputValue, q({}, r.getStateAndHelpers(), b)), r.setState(
        function(k) {
          var E;
          k = r.getState(k);
          var O = _ ? b(k) : b;
          O = r.props.stateReducer(k, O), g = O.hasOwnProperty("selectedItem");
          var P = {};
          return g && O.selectedItem !== k.selectedItem && (w = O.selectedItem), (E = O).type || (E.type = ld), Object.keys(O).forEach(function(A) {
            k[A] !== O[A] && (T[A] = O[A]), A !== "type" && (O[A], On(r.props, A) || (P[A] = O[A]));
          }), _ && O.hasOwnProperty("inputValue") && r.props.onInputValueChange(O.inputValue, q({}, r.getStateAndHelpers(), O)), P;
        }, function() {
          Qc(x)();
          var k = Object.keys(T).length > 1;
          k && r.props.onStateChange(T, r.getStateAndHelpers()), g && r.props.onSelect(b.selectedItem, r.getStateAndHelpers()), w !== void 0 &&
          r.props.onChange(w, r.getStateAndHelpers()), r.props.onUserAction(T, r.getStateAndHelpers());
        });
      }, r.rootRef = function(b) {
        return r._rootNode = b;
      }, r.getRootProps = function(b, x) {
        var g, w = b === void 0 ? {} : b, T = w.refKey, _ = T === void 0 ? "ref" : T, k = w.ref, E = ke(w, xv), O = x === void 0 ? {} : x, P = O.
        suppressRefError, A = P === void 0 ? !1 : P;
        r.getRootProps.called = !0, r.getRootProps.refKey = _, r.getRootProps.suppressRefError = A;
        var D = r.getState(), L = D.isOpen;
        return q((g = {}, g[_] = ft(k, r.rootRef), g.role = "combobox", g["aria-expanded"] = L, g["aria-haspopup"] = "listbox", g["aria-owns"] =
        L ? r.menuId : void 0, g["aria-labelledby"] = r.labelId, g), E);
      }, r.keyDownHandlers = {
        ArrowDown: /* @__PURE__ */ s(function(x) {
          var g = this;
          if (x.preventDefault(), this.getState().isOpen) {
            var w = x.shiftKey ? 5 : 1;
            this.moveHighlightedIndex(w, {
              type: Tn
            });
          } else
            this.internalSetState({
              isOpen: !0,
              type: Tn
            }, function() {
              var T = g.getItemCount();
              if (T > 0) {
                var _ = g.getState(), k = _.highlightedIndex, E = mt(k, 1, {
                  length: T
                }, g.isItemDisabled, !0);
                g.setHighlightedIndex(E, {
                  type: Tn
                });
              }
            });
        }, "ArrowDown"),
        ArrowUp: /* @__PURE__ */ s(function(x) {
          var g = this;
          if (x.preventDefault(), this.getState().isOpen) {
            var w = x.shiftKey ? -5 : -1;
            this.moveHighlightedIndex(w, {
              type: Cn
            });
          } else
            this.internalSetState({
              isOpen: !0,
              type: Cn
            }, function() {
              var T = g.getItemCount();
              if (T > 0) {
                var _ = g.getState(), k = _.highlightedIndex, E = mt(k, -1, {
                  length: T
                }, g.isItemDisabled, !0);
                g.setHighlightedIndex(E, {
                  type: Cn
                });
              }
            });
        }, "ArrowUp"),
        Enter: /* @__PURE__ */ s(function(x) {
          if (x.which !== 229) {
            var g = this.getState(), w = g.isOpen, T = g.highlightedIndex;
            if (w && T != null) {
              x.preventDefault();
              var _ = this.items[T], k = this.getItemNodeFromIndex(T);
              if (_ == null || k && k.hasAttribute("disabled"))
                return;
              this.selectHighlightedItem({
                type: dd
              });
            }
          }
        }, "Enter"),
        Escape: /* @__PURE__ */ s(function(x) {
          x.preventDefault(), this.reset(q({
            type: cd
          }, !this.state.isOpen && {
            selectedItem: null,
            inputValue: ""
          }));
        }, "Escape")
      }, r.buttonKeyDownHandlers = q({}, r.keyDownHandlers, {
        " ": /* @__PURE__ */ s(function(x) {
          x.preventDefault(), this.toggleMenu({
            type: vd
          });
        }, "_")
      }), r.inputKeyDownHandlers = q({}, r.keyDownHandlers, {
        Home: /* @__PURE__ */ s(function(x) {
          var g = this.getState(), w = g.isOpen;
          if (w) {
            x.preventDefault();
            var T = this.getItemCount();
            if (!(T <= 0 || !w)) {
              var _ = zt(0, !1, {
                length: T
              }, this.isItemDisabled);
              this.setHighlightedIndex(_, {
                type: fd
              });
            }
          }
        }, "Home"),
        End: /* @__PURE__ */ s(function(x) {
          var g = this.getState(), w = g.isOpen;
          if (w) {
            x.preventDefault();
            var T = this.getItemCount();
            if (!(T <= 0 || !w)) {
              var _ = zt(T - 1, !0, {
                length: T
              }, this.isItemDisabled);
              this.setHighlightedIndex(_, {
                type: md
              });
            }
          }
        }, "End")
      }), r.getToggleButtonProps = function(b) {
        var x = b === void 0 ? {} : b, g = x.onClick;
        x.onPress;
        var w = x.onKeyDown, T = x.onKeyUp, _ = x.onBlur, k = ke(x, Iv), E = r.getState(), O = E.isOpen, P = {
          onClick: ce(g, r.buttonHandleClick),
          onKeyDown: ce(w, r.buttonHandleKeyDown),
          onKeyUp: ce(T, r.buttonHandleKeyUp),
          onBlur: ce(_, r.buttonHandleBlur)
        }, A = k.disabled ? {} : P;
        return q({
          type: "button",
          role: "button",
          "aria-label": O ? "close menu" : "open menu",
          "aria-haspopup": !0,
          "data-toggle": !0
        }, A, k);
      }, r.buttonHandleKeyUp = function(b) {
        b.preventDefault();
      }, r.buttonHandleKeyDown = function(b) {
        var x = Ho(b);
        r.buttonKeyDownHandlers[x] && r.buttonKeyDownHandlers[x].call(r, b);
      }, r.buttonHandleClick = function(b) {
        if (b.preventDefault(), r.props.environment) {
          var x = r.props.environment.document, g = x.body, w = x.activeElement;
          g && g === w && b.target.focus();
        }
        r.internalSetTimeout(function() {
          return r.toggleMenu({
            type: bd
          });
        });
      }, r.buttonHandleBlur = function(b) {
        var x = b.target;
        r.internalSetTimeout(function() {
          if (!(r.isMouseDown || !r.props.environment)) {
            var g = r.props.environment.document.activeElement;
            (g == null || g.id !== r.inputId) && g !== x && r.reset({
              type: xd
            });
          }
        });
      }, r.getLabelProps = function(b) {
        return q({
          htmlFor: r.inputId,
          id: r.labelId
        }, b);
      }, r.getInputProps = function(b) {
        var x = b === void 0 ? {} : b, g = x.onKeyDown, w = x.onBlur, T = x.onChange, _ = x.onInput;
        x.onChangeText;
        var k = ke(x, Sv), E, O = {};
        E = "onChange";
        var P = r.getState(), A = P.inputValue, D = P.isOpen, L = P.highlightedIndex;
        if (!k.disabled) {
          var B;
          O = (B = {}, B[E] = ce(T, _, r.inputHandleChange), B.onKeyDown = ce(g, r.inputHandleKeyDown), B.onBlur = ce(w, r.inputHandleBlur),
          B);
        }
        return q({
          "aria-autocomplete": "list",
          "aria-activedescendant": D && typeof L == "number" && L >= 0 ? r.getItemId(L) : void 0,
          "aria-controls": D ? r.menuId : void 0,
          "aria-labelledby": k && k["aria-label"] ? void 0 : r.labelId,
          // https://developer.mozilla.org/en-US/docs/Web/Security/Securing_your_site/Turning_off_form_autocompletion
          // revert back since autocomplete="nope" is ignored on latest Chrome and Opera
          autoComplete: "off",
          value: A,
          id: r.inputId
        }, O, k);
      }, r.inputHandleKeyDown = function(b) {
        var x = Ho(b);
        x && r.inputKeyDownHandlers[x] && r.inputKeyDownHandlers[x].call(r, b);
      }, r.inputHandleChange = function(b) {
        r.internalSetState({
          type: yd,
          isOpen: !0,
          inputValue: b.target.value,
          highlightedIndex: r.props.defaultHighlightedIndex
        });
      }, r.inputHandleBlur = function() {
        r.internalSetTimeout(function() {
          var b;
          if (!(r.isMouseDown || !r.props.environment)) {
            var x = r.props.environment.document.activeElement, g = (x == null || (b = x.dataset) == null ? void 0 : b.toggle) && r._rootNode &&
            r._rootNode.contains(x);
            g || r.reset({
              type: gd
            });
          }
        });
      }, r.menuRef = function(b) {
        r._menuNode = b;
      }, r.getMenuProps = function(b, x) {
        var g, w = b === void 0 ? {} : b, T = w.refKey, _ = T === void 0 ? "ref" : T, k = w.ref, E = ke(w, wv), O = x === void 0 ? {} : x, P = O.
        suppressRefError, A = P === void 0 ? !1 : P;
        return r.getMenuProps.called = !0, r.getMenuProps.refKey = _, r.getMenuProps.suppressRefError = A, q((g = {}, g[_] = ft(k, r.menuRef),
        g.role = "listbox", g["aria-labelledby"] = E && E["aria-label"] ? void 0 : r.labelId, g.id = r.menuId, g), E);
      }, r.getItemProps = function(b) {
        var x, g = b === void 0 ? {} : b, w = g.onMouseMove, T = g.onMouseDown, _ = g.onClick;
        g.onPress;
        var k = g.index, E = g.item, O = E === void 0 ? (
          /* istanbul ignore next */
          void 0
        ) : E, P = ke(g, Ev);
        k === void 0 ? (r.items.push(O), k = r.items.indexOf(O)) : r.items[k] = O;
        var A = "onClick", D = _, L = (x = {
          // onMouseMove is used over onMouseEnter here. onMouseMove
          // is only triggered on actual mouse movement while onMouseEnter
          // can fire on DOM changes, interrupting keyboard navigation
          onMouseMove: ce(w, function() {
            k !== r.getState().highlightedIndex && (r.setHighlightedIndex(k, {
              type: pd
            }), r.avoidScrolling = !0, r.internalSetTimeout(function() {
              return r.avoidScrolling = !1;
            }, 250));
          }),
          onMouseDown: ce(T, function(N) {
            N.preventDefault();
          })
        }, x[A] = ce(D, function() {
          r.selectItemAtIndex(k, {
            type: hd
          });
        }), x), B = P.disabled ? {
          onMouseDown: L.onMouseDown
        } : L;
        return q({
          id: r.getItemId(k),
          role: "option",
          "aria-selected": r.getState().highlightedIndex === k
        }, B, P);
      }, r.clearItems = function() {
        r.items = [];
      }, r.reset = function(b, x) {
        b === void 0 && (b = {}), b = En(b), r.internalSetState(function(g) {
          var w = g.selectedItem;
          return q({
            isOpen: r.props.defaultIsOpen,
            highlightedIndex: r.props.defaultHighlightedIndex,
            inputValue: r.props.itemToString(w)
          }, b);
        }, x);
      }, r.toggleMenu = function(b, x) {
        b === void 0 && (b = {}), b = En(b), r.internalSetState(function(g) {
          var w = g.isOpen;
          return q({
            isOpen: !w
          }, w && {
            highlightedIndex: r.props.defaultHighlightedIndex
          }, b);
        }, function() {
          var g = r.getState(), w = g.isOpen, T = g.highlightedIndex;
          w && r.getItemCount() > 0 && typeof T == "number" && r.setHighlightedIndex(T, b), Qc(x)();
        });
      }, r.openMenu = function(b) {
        r.internalSetState({
          isOpen: !0
        }, b);
      }, r.closeMenu = function(b) {
        r.internalSetState({
          isOpen: !1
        }, b);
      }, r.updateStatus = Nn(function() {
        var b;
        if ((b = r.props) != null && (b = b.environment) != null && b.document) {
          var x = r.getState(), g = r.items[x.highlightedIndex], w = r.getItemCount(), T = r.props.getA11yStatusMessage(q({
            itemToString: r.props.itemToString,
            previousResultCount: r.previousResultCount,
            resultCount: w,
            highlightedItem: g
          }, x));
          r.previousResultCount = w, ad(T, r.props.environment.document);
        }
      }, 200);
      var l = r.props, u = l.defaultHighlightedIndex, p = l.initialHighlightedIndex, c = p === void 0 ? u : p, d = l.defaultIsOpen, m = l.initialIsOpen,
      f = m === void 0 ? d : m, y = l.initialInputValue, h = y === void 0 ? "" : y, v = l.initialSelectedItem, I = v === void 0 ? null : v, C = r.
      getState({
        highlightedIndex: c,
        isOpen: f,
        inputValue: h,
        selectedItem: I
      });
      return C.selectedItem != null && r.props.initialInputValue === void 0 && (C.inputValue = r.props.itemToString(C.selectedItem)), r.state =
      C, r;
    }
    s(o, "Downshift"), Do(o, t);
    var i = o.prototype;
    return i.internalClearTimeouts = /* @__PURE__ */ s(function() {
      this.timeoutIds.forEach(function(r) {
        clearTimeout(r);
      }), this.timeoutIds = [];
    }, "internalClearTimeouts"), i.getState = /* @__PURE__ */ s(function(r) {
      return r === void 0 && (r = this.state), sr(r, this.props);
    }, "getState$1"), i.getItemCount = /* @__PURE__ */ s(function() {
      var r = this.items.length;
      return this.itemCount != null ? r = this.itemCount : this.props.itemCount !== void 0 && (r = this.props.itemCount), r;
    }, "getItemCount"), i.getItemNodeFromIndex = /* @__PURE__ */ s(function(r) {
      return this.props.environment ? this.props.environment.document.getElementById(this.getItemId(r)) : null;
    }, "getItemNodeFromIndex"), i.scrollHighlightedItemIntoView = /* @__PURE__ */ s(function() {
      {
        var r = this.getItemNodeFromIndex(this.getState().highlightedIndex);
        this.props.scrollIntoView(r, this._menuNode);
      }
    }, "scrollHighlightedItemIntoView"), i.moveHighlightedIndex = /* @__PURE__ */ s(function(r, l) {
      var u = this.getItemCount(), p = this.getState(), c = p.highlightedIndex;
      if (u > 0) {
        var d = mt(c, r, {
          length: u
        }, this.isItemDisabled, !0);
        this.setHighlightedIndex(d, l);
      }
    }, "moveHighlightedIndex"), i.getStateAndHelpers = /* @__PURE__ */ s(function() {
      var r = this.getState(), l = r.highlightedIndex, u = r.inputValue, p = r.selectedItem, c = r.isOpen, d = this.props.itemToString, m = this.
      id, f = this.getRootProps, y = this.getToggleButtonProps, h = this.getLabelProps, v = this.getMenuProps, I = this.getInputProps, C = this.
      getItemProps, b = this.openMenu, x = this.closeMenu, g = this.toggleMenu, w = this.selectItem, T = this.selectItemAtIndex, _ = this.selectHighlightedItem,
      k = this.setHighlightedIndex, E = this.clearSelection, O = this.clearItems, P = this.reset, A = this.setItemCount, D = this.unsetItemCount,
      L = this.internalSetState;
      return {
        // prop getters
        getRootProps: f,
        getToggleButtonProps: y,
        getLabelProps: h,
        getMenuProps: v,
        getInputProps: I,
        getItemProps: C,
        // actions
        reset: P,
        openMenu: b,
        closeMenu: x,
        toggleMenu: g,
        selectItem: w,
        selectItemAtIndex: T,
        selectHighlightedItem: _,
        setHighlightedIndex: k,
        clearSelection: E,
        clearItems: O,
        setItemCount: A,
        unsetItemCount: D,
        setState: L,
        // props
        itemToString: d,
        // derived
        id: m,
        // state
        highlightedIndex: l,
        inputValue: u,
        isOpen: c,
        selectedItem: p
      };
    }, "getStateAndHelpers"), i.componentDidMount = /* @__PURE__ */ s(function() {
      var r = this;
      if (!this.props.environment)
        this.cleanup = function() {
          r.internalClearTimeouts();
        };
      else {
        var l = /* @__PURE__ */ s(function() {
          r.isMouseDown = !0;
        }, "onMouseDown"), u = /* @__PURE__ */ s(function(y) {
          r.isMouseDown = !1;
          var h = Pn(y.target, [r._rootNode, r._menuNode], r.props.environment);
          !h && r.getState().isOpen && r.reset({
            type: ud
          }, function() {
            return r.props.onOuterClick(r.getStateAndHelpers());
          });
        }, "onMouseUp"), p = /* @__PURE__ */ s(function() {
          r.isTouchMove = !1;
        }, "onTouchStart"), c = /* @__PURE__ */ s(function() {
          r.isTouchMove = !0;
        }, "onTouchMove"), d = /* @__PURE__ */ s(function(y) {
          var h = Pn(y.target, [r._rootNode, r._menuNode], r.props.environment, !1);
          !r.isTouchMove && !h && r.getState().isOpen && r.reset({
            type: Sd
          }, function() {
            return r.props.onOuterClick(r.getStateAndHelpers());
          });
        }, "onTouchEnd"), m = this.props.environment;
        m.addEventListener("mousedown", l), m.addEventListener("mouseup", u), m.addEventListener("touchstart", p), m.addEventListener("touch\
move", c), m.addEventListener("touchend", d), this.cleanup = function() {
          r.internalClearTimeouts(), r.updateStatus.cancel(), m.removeEventListener("mousedown", l), m.removeEventListener("mouseup", u), m.
          removeEventListener("touchstart", p), m.removeEventListener("touchmove", c), m.removeEventListener("touchend", d);
        };
      }
    }, "componentDidMount"), i.shouldScroll = /* @__PURE__ */ s(function(r, l) {
      var u = this.props.highlightedIndex === void 0 ? this.getState() : this.props, p = u.highlightedIndex, c = l.highlightedIndex === void 0 ?
      r : l, d = c.highlightedIndex, m = p && this.getState().isOpen && !r.isOpen, f = p !== d;
      return m || f;
    }, "shouldScroll"), i.componentDidUpdate = /* @__PURE__ */ s(function(r, l) {
      On(this.props, "selectedItem") && this.props.selectedItemChanged(r.selectedItem, this.props.selectedItem) && this.internalSetState({
        type: Id,
        inputValue: this.props.itemToString(this.props.selectedItem)
      }), !this.avoidScrolling && this.shouldScroll(l, r) && this.scrollHighlightedItemIntoView(), this.updateStatus();
    }, "componentDidUpdate"), i.componentWillUnmount = /* @__PURE__ */ s(function() {
      this.cleanup();
    }, "componentWillUnmount"), i.render = /* @__PURE__ */ s(function() {
      var r = Jc(this.props.children, Ye);
      this.clearItems(), this.getRootProps.called = !1, this.getRootProps.refKey = void 0, this.getRootProps.suppressRefError = void 0, this.
      getMenuProps.called = !1, this.getMenuProps.refKey = void 0, this.getMenuProps.suppressRefError = void 0, this.getLabelProps.called = !1,
      this.getInputProps.called = !1;
      var l = Jc(r(this.getStateAndHelpers()));
      if (!l)
        return null;
      if (this.getRootProps.called || this.props.suppressRefError)
        return l;
      if (mv(l))
        return /* @__PURE__ */ Ma(l, this.getRootProps(hv(l)));
    }, "render"), o;
  }(Ge);
  return e.defaultProps = {
    defaultHighlightedIndex: null,
    defaultIsOpen: !1,
    getA11yStatusMessage: fv,
    itemToString: /* @__PURE__ */ s(function(o) {
      return o == null ? "" : String(o);
    }, "itemToString"),
    onStateChange: Ye,
    onInputValueChange: Ye,
    onUserAction: Ye,
    onChange: Ye,
    onSelect: Ye,
    onOuterClick: Ye,
    selectedItemChanged: /* @__PURE__ */ s(function(o, i) {
      return o !== i;
    }, "selectedItemChanged"),
    environment: (
      /* istanbul ignore next (ssr) */
      typeof window > "u" ? void 0 : window
    ),
    stateReducer: /* @__PURE__ */ s(function(o, i) {
      return i;
    }, "stateReducer"),
    suppressRefError: !1,
    scrollIntoView: nd
  }, e.stateChangeTypes = bv, e;
}(), co = Cv;
var wd = {
  highlightedIndex: -1,
  isOpen: !1,
  selectedItem: null,
  inputValue: ""
};
function Tv(e, t, o) {
  var i = e.props, n = e.type, r = {};
  Object.keys(t).forEach(function(l) {
    _v(l, e, t, o), o[l] !== t[l] && (r[l] = o[l]);
  }), i.onStateChange && Object.keys(r).length && i.onStateChange(q({
    type: n
  }, r));
}
s(Tv, "callOnChangeProps");
function _v(e, t, o, i) {
  var n = t.props, r = t.type, l = "on" + Zi(e) + "Change";
  n[l] && i[e] !== void 0 && i[e] !== o[e] && n[l](q({
    type: r
  }, i));
}
s(_v, "invokeOnChangeHandler");
function kv(e, t) {
  return t.changes;
}
s(kv, "stateReducer");
var ed = Nn(function(e, t) {
  ad(e, t);
}, 200), Ov = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u" ? Lt : z, Ed = "useId" in a ?
/* @__PURE__ */ s(function(t) {
  var o = t.id, i = t.labelId, n = t.menuId, r = t.getItemId, l = t.toggleButtonId, u = t.inputId, p = "downshift-" + a.useId();
  o || (o = p);
  var c = G({
    labelId: i || o + "-label",
    menuId: n || o + "-menu",
    getItemId: r || function(d) {
      return o + "-item-" + d;
    },
    toggleButtonId: l || o + "-toggle-button",
    inputId: u || o + "-input"
  });
  return c.current;
}, "useElementIds") : /* @__PURE__ */ s(function(t) {
  var o = t.id, i = o === void 0 ? "downshift-" + id() : o, n = t.labelId, r = t.menuId, l = t.getItemId, u = t.toggleButtonId, p = t.inputId,
  c = G({
    labelId: n || i + "-label",
    menuId: r || i + "-menu",
    getItemId: l || function(d) {
      return i + "-item-" + d;
    },
    toggleButtonId: u || i + "-toggle-button",
    inputId: p || i + "-input"
  });
  return c.current;
}, "useElementIds");
function Qi(e, t, o, i) {
  var n, r;
  if (e === void 0) {
    if (t === void 0)
      throw new Error(i);
    n = o[t], r = t;
  } else
    r = t === void 0 ? o.indexOf(e) : t, n = e;
  return [n, r];
}
s(Qi, "getItemAndIndex");
function Pv(e) {
  return /^\S{1}$/.test(e);
}
s(Pv, "isAcceptedCharacterKey");
function Zi(e) {
  return "" + e.slice(0, 1).toUpperCase() + e.slice(1);
}
s(Zi, "capitalizeString");
function Fn(e) {
  var t = G(e);
  return t.current = e, t;
}
s(Fn, "useLatestRef");
function Cd(e, t, o, i) {
  var n = G(), r = G(), l = M(function(y, h) {
    r.current = h, y = sr(y, h.props);
    var v = e(y, h), I = h.props.stateReducer(y, q({}, h, {
      changes: v
    }));
    return I;
  }, [e]), u = wo(l, t, o), p = u[0], c = u[1], d = Fn(t), m = M(function(y) {
    return c(q({
      props: d.current
    }, y));
  }, [d]), f = r.current;
  return z(function() {
    var y = sr(n.current, f?.props), h = f && n.current && !i(y, p);
    h && Tv(f, y, p), n.current = p;
  }, [p, f, i]), [p, m];
}
s(Cd, "useEnhancedReducer");
function Td(e, t, o, i) {
  var n = Cd(e, t, o, i), r = n[0], l = n[1];
  return [sr(r, t), l];
}
s(Td, "useControlledReducer$1");
var ir = {
  itemToString: /* @__PURE__ */ s(function(t) {
    return t ? String(t) : "";
  }, "itemToString"),
  itemToKey: /* @__PURE__ */ s(function(t) {
    return t;
  }, "itemToKey"),
  stateReducer: kv,
  scrollIntoView: nd,
  environment: (
    /* istanbul ignore next (ssr) */
    typeof window > "u" ? void 0 : window
  )
};
function Xe(e, t, o) {
  o === void 0 && (o = wd);
  var i = e["default" + Zi(t)];
  return i !== void 0 ? i : o[t];
}
s(Xe, "getDefaultValue$1");
function uo(e, t, o) {
  o === void 0 && (o = wd);
  var i = e[t];
  if (i !== void 0)
    return i;
  var n = e["initial" + Zi(t)];
  return n !== void 0 ? n : Xe(e, t, o);
}
s(uo, "getInitialValue$1");
function _d(e) {
  var t = uo(e, "selectedItem"), o = uo(e, "isOpen"), i = uo(e, "highlightedIndex"), n = uo(e, "inputValue");
  return {
    highlightedIndex: i < 0 && t && o ? e.items.findIndex(function(r) {
      return e.itemToKey(r) === e.itemToKey(t);
    }) : i,
    isOpen: o,
    selectedItem: t,
    inputValue: n
  };
}
s(_d, "getInitialState$2");
function po(e, t, o) {
  var i = e.items, n = e.initialHighlightedIndex, r = e.defaultHighlightedIndex, l = e.isItemDisabled, u = e.itemToKey, p = t.selectedItem, c = t.
  highlightedIndex;
  return i.length === 0 ? -1 : n !== void 0 && c === n && !l(i[n]) ? n : r !== void 0 && !l(i[r]) ? r : p ? i.findIndex(function(d) {
    return u(p) === u(d);
  }) : o < 0 && !l(i[i.length - 1]) ? i.length - 1 : o > 0 && !l(i[0]) ? 0 : -1;
}
s(po, "getHighlightedIndexOnOpen");
function kd(e, t, o) {
  var i = G({
    isMouseDown: !1,
    isTouchMove: !1,
    isTouchEnd: !1
  });
  return z(function() {
    if (!e)
      return Ye;
    var n = t.map(function(d) {
      return d.current;
    });
    function r() {
      i.current.isTouchEnd = !1, i.current.isMouseDown = !0;
    }
    s(r, "onMouseDown");
    function l(d) {
      i.current.isMouseDown = !1, Pn(d.target, n, e) || o();
    }
    s(l, "onMouseUp");
    function u() {
      i.current.isTouchEnd = !1, i.current.isTouchMove = !1;
    }
    s(u, "onTouchStart");
    function p() {
      i.current.isTouchMove = !0;
    }
    s(p, "onTouchMove");
    function c(d) {
      i.current.isTouchEnd = !0, !i.current.isTouchMove && !Pn(d.target, n, e, !1) && o();
    }
    return s(c, "onTouchEnd"), e.addEventListener("mousedown", r), e.addEventListener("mouseup", l), e.addEventListener("touchstart", u), e.
    addEventListener("touchmove", p), e.addEventListener("touchend", c), /* @__PURE__ */ s(function() {
      e.removeEventListener("mousedown", r), e.removeEventListener("mouseup", l), e.removeEventListener("touchstart", u), e.removeEventListener(
      "touchmove", p), e.removeEventListener("touchend", c);
    }, "cleanup");
  }, [e, o]), i.current;
}
s(kd, "useMouseAndTouchTracker");
var Ji = /* @__PURE__ */ s(function() {
  return Ye;
}, "useGetterPropsCalledChecker");
function es(e, t, o, i) {
  i === void 0 && (i = {});
  var n = i.document, r = Bn();
  z(function() {
    if (!(!e || r || !n)) {
      var l = e(t);
      ed(l, n);
    }
  }, o), z(function() {
    return function() {
      ed.cancel(), vv(n);
    };
  }, [n]);
}
s(es, "useA11yMessageStatus");
function Od(e) {
  var t = e.highlightedIndex, o = e.isOpen, i = e.itemRefs, n = e.getItemNodeFromIndex, r = e.menuElement, l = e.scrollIntoView, u = G(!0);
  return Ov(function() {
    t < 0 || !o || !Object.keys(i.current).length || (u.current === !1 ? u.current = !0 : l(n(t), r));
  }, [t]), u;
}
s(Od, "useScrollIntoView");
var ts = Ye;
function An(e, t, o) {
  var i;
  o === void 0 && (o = !0);
  var n = ((i = e.items) == null ? void 0 : i.length) && t >= 0;
  return q({
    isOpen: !1,
    highlightedIndex: -1
  }, n && q({
    selectedItem: e.items[t],
    isOpen: Xe(e, "isOpen"),
    highlightedIndex: Xe(e, "highlightedIndex")
  }, o && {
    inputValue: e.itemToString(e.items[t])
  }));
}
s(An, "getChangesOnSelection");
function Pd(e, t) {
  return e.isOpen === t.isOpen && e.inputValue === t.inputValue && e.highlightedIndex === t.highlightedIndex && e.selectedItem === t.selectedItem;
}
s(Pd, "isDropdownsStateEqual");
function Bn() {
  var e = a.useRef(!0);
  return a.useEffect(function() {
    return e.current = !1, function() {
      e.current = !0;
    };
  }, []), e.current;
}
s(Bn, "useIsInitialMount");
var _n = {
  environment: Q.default.shape({
    addEventListener: Q.default.func.isRequired,
    removeEventListener: Q.default.func.isRequired,
    document: Q.default.shape({
      createElement: Q.default.func.isRequired,
      getElementById: Q.default.func.isRequired,
      activeElement: Q.default.any.isRequired,
      body: Q.default.any.isRequired
    }).isRequired,
    Node: Q.default.func.isRequired
  }),
  itemToString: Q.default.func,
  itemToKey: Q.default.func,
  stateReducer: Q.default.func
}, Ad = q({}, _n, {
  getA11yStatusMessage: Q.default.func,
  highlightedIndex: Q.default.number,
  defaultHighlightedIndex: Q.default.number,
  initialHighlightedIndex: Q.default.number,
  isOpen: Q.default.bool,
  defaultIsOpen: Q.default.bool,
  initialIsOpen: Q.default.bool,
  selectedItem: Q.default.any,
  initialSelectedItem: Q.default.any,
  defaultSelectedItem: Q.default.any,
  id: Q.default.string,
  labelId: Q.default.string,
  menuId: Q.default.string,
  getItemId: Q.default.func,
  toggleButtonId: Q.default.string,
  onSelectedItemChange: Q.default.func,
  onHighlightedIndexChange: Q.default.func,
  onStateChange: Q.default.func,
  onIsOpenChange: Q.default.func,
  scrollIntoView: Q.default.func
});
function Dd(e, t, o) {
  var i = t.type, n = t.props, r;
  switch (i) {
    case o.ItemMouseMove:
      r = {
        highlightedIndex: t.disabled ? -1 : t.index
      };
      break;
    case o.MenuMouseLeave:
      r = {
        highlightedIndex: -1
      };
      break;
    case o.ToggleButtonClick:
    case o.FunctionToggleMenu:
      r = {
        isOpen: !e.isOpen,
        highlightedIndex: e.isOpen ? -1 : po(n, e, 0)
      };
      break;
    case o.FunctionOpenMenu:
      r = {
        isOpen: !0,
        highlightedIndex: po(n, e, 0)
      };
      break;
    case o.FunctionCloseMenu:
      r = {
        isOpen: !1
      };
      break;
    case o.FunctionSetHighlightedIndex:
      r = {
        highlightedIndex: t.highlightedIndex
      };
      break;
    case o.FunctionSetInputValue:
      r = {
        inputValue: t.inputValue
      };
      break;
    case o.FunctionReset:
      r = {
        highlightedIndex: Xe(n, "highlightedIndex"),
        isOpen: Xe(n, "isOpen"),
        selectedItem: Xe(n, "selectedItem"),
        inputValue: Xe(n, "inputValue")
      };
      break;
    default:
      throw new Error("Reducer called without proper action type.");
  }
  return q({}, e, r);
}
s(Dd, "downshiftCommonReducer");
function Av(e) {
  for (var t = e.keysSoFar, o = e.highlightedIndex, i = e.items, n = e.itemToString, r = e.isItemDisabled, l = t.toLowerCase(), u = 0; u < i.
  length; u++) {
    var p = (u + o + (t.length < 2 ? 1 : 0)) % i.length, c = i[p];
    if (c !== void 0 && n(c).toLowerCase().startsWith(l) && !r(c, p))
      return p;
  }
  return o;
}
s(Av, "getItemIndexByCharacterKey");
var e5 = lo(lo({}, Ad), { items: Q.default.array.isRequired, isItemDisabled: Q.default.func }), Dv = lo(lo({}, ir), { isItemDisabled: /* @__PURE__ */ s(
function() {
  return !1;
}, "isItemDisabled") }), Mv = Ye, kn = 0, os = 1, rs = 2, Dn = 3, ns = 4, is = 5, ss = 6, as = 7, ls = 8, us = 9, ps = 10, Mn = 11, Md = 12,
Ld = 13, cs = 14, Nd = 15, Fd = 16, Bd = 17, Hd = 18, ds = 19, Xi = 20, Rd = 21, zd = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ToggleButtonClick: kn,
  ToggleButtonKeyDownArrowDown: os,
  ToggleButtonKeyDownArrowUp: rs,
  ToggleButtonKeyDownCharacter: Dn,
  ToggleButtonKeyDownEscape: ns,
  ToggleButtonKeyDownHome: is,
  ToggleButtonKeyDownEnd: ss,
  ToggleButtonKeyDownEnter: as,
  ToggleButtonKeyDownSpaceButton: ls,
  ToggleButtonKeyDownPageUp: us,
  ToggleButtonKeyDownPageDown: ps,
  ToggleButtonBlur: Mn,
  MenuMouseLeave: Md,
  ItemMouseMove: Ld,
  ItemClick: cs,
  FunctionToggleMenu: Nd,
  FunctionOpenMenu: Fd,
  FunctionCloseMenu: Bd,
  FunctionSetHighlightedIndex: Hd,
  FunctionSelectItem: ds,
  FunctionSetInputValue: Xi,
  FunctionReset: Rd
});
function Lv(e, t) {
  var o, i = t.type, n = t.props, r = t.altKey, l;
  switch (i) {
    case cs:
      l = {
        isOpen: Xe(n, "isOpen"),
        highlightedIndex: Xe(n, "highlightedIndex"),
        selectedItem: n.items[t.index]
      };
      break;
    case Dn:
      {
        var u = t.key, p = "" + e.inputValue + u, c = !e.isOpen && e.selectedItem ? n.items.findIndex(function(y) {
          return n.itemToKey(y) === n.itemToKey(e.selectedItem);
        }) : e.highlightedIndex, d = Av({
          keysSoFar: p,
          highlightedIndex: c,
          items: n.items,
          itemToString: n.itemToString,
          isItemDisabled: n.isItemDisabled
        });
        l = {
          inputValue: p,
          highlightedIndex: d,
          isOpen: !0
        };
      }
      break;
    case os:
      {
        var m = e.isOpen ? mt(e.highlightedIndex, 1, n.items, n.isItemDisabled) : r && e.selectedItem == null ? -1 : po(n, e, 1);
        l = {
          highlightedIndex: m,
          isOpen: !0
        };
      }
      break;
    case rs:
      if (e.isOpen && r)
        l = An(n, e.highlightedIndex, !1);
      else {
        var f = e.isOpen ? mt(e.highlightedIndex, -1, n.items, n.isItemDisabled) : po(n, e, -1);
        l = {
          highlightedIndex: f,
          isOpen: !0
        };
      }
      break;
    // only triggered when menu is open.
    case as:
    case ls:
      l = An(n, e.highlightedIndex, !1);
      break;
    case is:
      l = {
        highlightedIndex: zt(0, !1, n.items, n.isItemDisabled),
        isOpen: !0
      };
      break;
    case ss:
      l = {
        highlightedIndex: zt(n.items.length - 1, !0, n.items, n.isItemDisabled),
        isOpen: !0
      };
      break;
    case us:
      l = {
        highlightedIndex: mt(e.highlightedIndex, -10, n.items, n.isItemDisabled)
      };
      break;
    case ps:
      l = {
        highlightedIndex: mt(e.highlightedIndex, 10, n.items, n.isItemDisabled)
      };
      break;
    case ns:
      l = {
        isOpen: !1,
        highlightedIndex: -1
      };
      break;
    case Mn:
      l = q({
        isOpen: !1,
        highlightedIndex: -1
      }, e.highlightedIndex >= 0 && ((o = n.items) == null ? void 0 : o.length) && {
        selectedItem: n.items[e.highlightedIndex]
      });
      break;
    case ds:
      l = {
        selectedItem: t.selectedItem
      };
      break;
    default:
      return Dd(e, t, zd);
  }
  return q({}, e, l);
}
s(Lv, "downshiftSelectReducer");
var Nv = ["onClick"], Fv = ["onMouseLeave", "refKey", "ref"], Bv = ["onBlur", "onClick", "onPress", "onKeyDown", "refKey", "ref"], Hv = ["it\
em", "index", "onMouseMove", "onClick", "onMouseDown", "onPress", "refKey", "disabled", "ref"];
Wd.stateChangeTypes = zd;
function Wd(e) {
  e === void 0 && (e = {}), Mv(e, Wd);
  var t = q({}, Dv, e), o = t.scrollIntoView, i = t.environment, n = t.getA11yStatusMessage, r = Td(Lv, t, _d, Pd), l = r[0], u = r[1], p = l.
  isOpen, c = l.highlightedIndex, d = l.selectedItem, m = l.inputValue, f = G(null), y = G(null), h = G({}), v = G(null), I = Ed(t), C = Fn(
  {
    state: l,
    props: t
  }), b = M(function(R) {
    return h.current[I.getItemId(R)];
  }, [I]);
  es(n, l, [p, c, d, m], i);
  var x = Od({
    menuElement: y.current,
    highlightedIndex: c,
    isOpen: p,
    itemRefs: h,
    scrollIntoView: o,
    getItemNodeFromIndex: b
  });
  z(function() {
    return v.current = Nn(function(R) {
      R({
        type: Xi,
        inputValue: ""
      });
    }, 500), function() {
      v.current.cancel();
    };
  }, []), z(function() {
    m && v.current(u);
  }, [u, m]), ts({
    props: t,
    state: l
  }), z(function() {
    var R = uo(t, "isOpen");
    R && f.current && f.current.focus();
  }, []);
  var g = kd(i, [f, y], M(/* @__PURE__ */ s(function() {
    C.current.state.isOpen && u({
      type: Mn
    });
  }, "handleBlur"), [u, C])), w = Ji("getMenuProps", "getToggleButtonProps");
  z(function() {
    p || (h.current = {});
  }, [p]);
  var T = Y(function() {
    return {
      ArrowDown: /* @__PURE__ */ s(function(K) {
        K.preventDefault(), u({
          type: os,
          altKey: K.altKey
        });
      }, "ArrowDown"),
      ArrowUp: /* @__PURE__ */ s(function(K) {
        K.preventDefault(), u({
          type: rs,
          altKey: K.altKey
        });
      }, "ArrowUp"),
      Home: /* @__PURE__ */ s(function(K) {
        K.preventDefault(), u({
          type: is
        });
      }, "Home"),
      End: /* @__PURE__ */ s(function(K) {
        K.preventDefault(), u({
          type: ss
        });
      }, "End"),
      Escape: /* @__PURE__ */ s(function() {
        C.current.state.isOpen && u({
          type: ns
        });
      }, "Escape"),
      Enter: /* @__PURE__ */ s(function(K) {
        K.preventDefault(), u({
          type: C.current.state.isOpen ? as : kn
        });
      }, "Enter"),
      PageUp: /* @__PURE__ */ s(function(K) {
        C.current.state.isOpen && (K.preventDefault(), u({
          type: us
        }));
      }, "PageUp"),
      PageDown: /* @__PURE__ */ s(function(K) {
        C.current.state.isOpen && (K.preventDefault(), u({
          type: ps
        }));
      }, "PageDown"),
      " ": /* @__PURE__ */ s(function(K) {
        K.preventDefault();
        var W = C.current.state;
        if (!W.isOpen) {
          u({
            type: kn
          });
          return;
        }
        W.inputValue ? u({
          type: Dn,
          key: " "
        }) : u({
          type: ls
        });
      }, "_")
    };
  }, [u, C]), _ = M(function() {
    u({
      type: Nd
    });
  }, [u]), k = M(function() {
    u({
      type: Bd
    });
  }, [u]), E = M(function() {
    u({
      type: Fd
    });
  }, [u]), O = M(function(R) {
    u({
      type: Hd,
      highlightedIndex: R
    });
  }, [u]), P = M(function(R) {
    u({
      type: ds,
      selectedItem: R
    });
  }, [u]), A = M(function() {
    u({
      type: Rd
    });
  }, [u]), D = M(function(R) {
    u({
      type: Xi,
      inputValue: R
    });
  }, [u]), L = M(function(R) {
    var K = R === void 0 ? {} : R, W = K.onClick, ee = ke(K, Nv), H = /* @__PURE__ */ s(function() {
      var F;
      (F = f.current) == null || F.focus();
    }, "labelHandleClick");
    return q({
      id: I.labelId,
      htmlFor: I.toggleButtonId,
      onClick: ce(W, H)
    }, ee);
  }, [I]), B = M(function(R, K) {
    var W, ee = R === void 0 ? {} : R, H = ee.onMouseLeave, j = ee.refKey, F = j === void 0 ? "ref" : j, $ = ee.ref, X = ke(ee, Fv), oe = K ===
    void 0 ? {} : K, J = oe.suppressRefError, ae = J === void 0 ? !1 : J, ie = /* @__PURE__ */ s(function() {
      u({
        type: Md
      });
    }, "menuHandleMouseLeave");
    return w("getMenuProps", ae, F, y), q((W = {}, W[F] = ft($, function(se) {
      y.current = se;
    }), W.id = I.menuId, W.role = "listbox", W["aria-labelledby"] = X && X["aria-label"] ? void 0 : "" + I.labelId, W.onMouseLeave = ce(H, ie),
    W), X);
  }, [u, w, I]), N = M(function(R, K) {
    var W, ee = R === void 0 ? {} : R, H = ee.onBlur, j = ee.onClick;
    ee.onPress;
    var F = ee.onKeyDown, $ = ee.refKey, X = $ === void 0 ? "ref" : $, oe = ee.ref, J = ke(ee, Bv), ae = K === void 0 ? {} : K, ie = ae.suppressRefError,
    se = ie === void 0 ? !1 : ie, le = C.current.state, ve = /* @__PURE__ */ s(function() {
      u({
        type: kn
      });
    }, "toggleButtonHandleClick"), he = /* @__PURE__ */ s(function() {
      le.isOpen && !g.isMouseDown && u({
        type: Mn
      });
    }, "toggleButtonHandleBlur"), Pe = /* @__PURE__ */ s(function(Te) {
      var Re = Ho(Te);
      Re && T[Re] ? T[Re](Te) : Pv(Re) && u({
        type: Dn,
        key: Re
      });
    }, "toggleButtonHandleKeyDown"), ue = q((W = {}, W[X] = ft(oe, function(be) {
      f.current = be;
    }), W["aria-activedescendant"] = le.isOpen && le.highlightedIndex > -1 ? I.getItemId(le.highlightedIndex) : "", W["aria-controls"] = I.menuId,
    W["aria-expanded"] = C.current.state.isOpen, W["aria-haspopup"] = "listbox", W["aria-labelledby"] = J && J["aria-label"] ? void 0 : "" +
    I.labelId, W.id = I.toggleButtonId, W.role = "combobox", W.tabIndex = 0, W.onBlur = ce(H, he), W), J);
    return J.disabled || (ue.onClick = ce(j, ve), ue.onKeyDown = ce(F, Pe)), w("getToggleButtonProps", se, X, f), ue;
  }, [u, I, C, g, w, T]), V = M(function(R) {
    var K, W = R === void 0 ? {} : R, ee = W.item, H = W.index, j = W.onMouseMove, F = W.onClick, $ = W.onMouseDown;
    W.onPress;
    var X = W.refKey, oe = X === void 0 ? "ref" : X, J = W.disabled, ae = W.ref, ie = ke(W, Hv);
    J !== void 0 && console.warn('Passing "disabled" as an argument to getItemProps is not supported anymore. Please use the isItemDisabled \
prop from useSelect.');
    var se = C.current, le = se.state, ve = se.props, he = Qi(ee, H, ve.items, "Pass either item or index to getItemProps!"), Pe = he[0], ue = he[1],
    be = ve.isItemDisabled(Pe, ue), Te = /* @__PURE__ */ s(function() {
      g.isTouchEnd || ue === le.highlightedIndex || (x.current = !1, u({
        type: Ld,
        index: ue,
        disabled: be
      }));
    }, "itemHandleMouseMove"), Re = /* @__PURE__ */ s(function() {
      u({
        type: cs,
        index: ue
      });
    }, "itemHandleClick"), Le = /* @__PURE__ */ s(function(Dt) {
      return Dt.preventDefault();
    }, "itemHandleMouseDown"), Se = q((K = {}, K[oe] = ft(ae, function(Ue) {
      Ue && (h.current[I.getItemId(ue)] = Ue);
    }), K["aria-disabled"] = be, K["aria-selected"] = "" + (Pe === le.selectedItem), K.id = I.getItemId(ue), K.role = "option", K), ie);
    return be || (Se.onClick = ce(F, Re)), Se.onMouseMove = ce(j, Te), Se.onMouseDown = ce($, Le), Se;
  }, [C, I, g, x, u]);
  return {
    // prop getters.
    getToggleButtonProps: N,
    getLabelProps: L,
    getMenuProps: B,
    getItemProps: V,
    // actions.
    toggleMenu: _,
    openMenu: E,
    closeMenu: k,
    setHighlightedIndex: O,
    selectItem: P,
    reset: A,
    setInputValue: D,
    // state.
    highlightedIndex: c,
    isOpen: p,
    selectedItem: d,
    inputValue: m
  };
}
s(Wd, "useSelect");
var fs = 0, ms = 1, hs = 2, gs = 3, ys = 4, vs = 5, bs = 6, xs = 7, Is = 8, Ln = 9, Ss = 10, jd = 11, Vd = 12, ws = 13, $d = 14, Kd = 15, Ud = 16,
qd = 17, Gd = 18, Es = 19, Yd = 20, Xd = 21, Cs = 22, Qd = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  InputKeyDownArrowDown: fs,
  InputKeyDownArrowUp: ms,
  InputKeyDownEscape: hs,
  InputKeyDownHome: gs,
  InputKeyDownEnd: ys,
  InputKeyDownPageUp: vs,
  InputKeyDownPageDown: bs,
  InputKeyDownEnter: xs,
  InputChange: Is,
  InputBlur: Ln,
  InputClick: Ss,
  MenuMouseLeave: jd,
  ItemMouseMove: Vd,
  ItemClick: ws,
  ToggleButtonClick: $d,
  FunctionToggleMenu: Kd,
  FunctionOpenMenu: Ud,
  FunctionCloseMenu: qd,
  FunctionSetHighlightedIndex: Gd,
  FunctionSelectItem: Es,
  FunctionSetInputValue: Yd,
  FunctionReset: Xd,
  ControlledPropUpdatedSelectedItem: Cs
});
function Rv(e) {
  var t = _d(e), o = t.selectedItem, i = t.inputValue;
  return i === "" && o && e.defaultInputValue === void 0 && e.initialInputValue === void 0 && e.inputValue === void 0 && (i = e.itemToString(
  o)), q({}, t, {
    inputValue: i
  });
}
s(Rv, "getInitialState$1");
var t5 = q({}, Ad, {
  items: Q.default.array.isRequired,
  isItemDisabled: Q.default.func,
  inputValue: Q.default.string,
  defaultInputValue: Q.default.string,
  initialInputValue: Q.default.string,
  inputId: Q.default.string,
  onInputValueChange: Q.default.func
});
function zv(e, t, o, i) {
  var n = G(), r = Cd(e, t, o, i), l = r[0], u = r[1], p = Bn();
  return z(function() {
    if (On(t, "selectedItem")) {
      if (!p) {
        var c = t.itemToKey(t.selectedItem) !== t.itemToKey(n.current);
        c && u({
          type: Cs,
          inputValue: t.itemToString(t.selectedItem)
        });
      }
      n.current = l.selectedItem === n.current ? t.selectedItem : l.selectedItem;
    }
  }, [l.selectedItem, t.selectedItem]), [sr(l, t), u];
}
s(zv, "useControlledReducer");
var Wv = Ye, jv = q({}, ir, {
  isItemDisabled: /* @__PURE__ */ s(function() {
    return !1;
  }, "isItemDisabled")
});
function Vv(e, t) {
  var o, i = t.type, n = t.props, r = t.altKey, l;
  switch (i) {
    case ws:
      l = {
        isOpen: Xe(n, "isOpen"),
        highlightedIndex: Xe(n, "highlightedIndex"),
        selectedItem: n.items[t.index],
        inputValue: n.itemToString(n.items[t.index])
      };
      break;
    case fs:
      e.isOpen ? l = {
        highlightedIndex: mt(e.highlightedIndex, 1, n.items, n.isItemDisabled, !0)
      } : l = {
        highlightedIndex: r && e.selectedItem == null ? -1 : po(n, e, 1),
        isOpen: n.items.length >= 0
      };
      break;
    case ms:
      e.isOpen ? r ? l = An(n, e.highlightedIndex) : l = {
        highlightedIndex: mt(e.highlightedIndex, -1, n.items, n.isItemDisabled, !0)
      } : l = {
        highlightedIndex: po(n, e, -1),
        isOpen: n.items.length >= 0
      };
      break;
    case xs:
      l = An(n, e.highlightedIndex);
      break;
    case hs:
      l = q({
        isOpen: !1,
        highlightedIndex: -1
      }, !e.isOpen && {
        selectedItem: null,
        inputValue: ""
      });
      break;
    case vs:
      l = {
        highlightedIndex: mt(e.highlightedIndex, -10, n.items, n.isItemDisabled, !0)
      };
      break;
    case bs:
      l = {
        highlightedIndex: mt(e.highlightedIndex, 10, n.items, n.isItemDisabled, !0)
      };
      break;
    case gs:
      l = {
        highlightedIndex: zt(0, !1, n.items, n.isItemDisabled)
      };
      break;
    case ys:
      l = {
        highlightedIndex: zt(n.items.length - 1, !0, n.items, n.isItemDisabled)
      };
      break;
    case Ln:
      l = q({
        isOpen: !1,
        highlightedIndex: -1
      }, e.highlightedIndex >= 0 && ((o = n.items) == null ? void 0 : o.length) && t.selectItem && {
        selectedItem: n.items[e.highlightedIndex],
        inputValue: n.itemToString(n.items[e.highlightedIndex])
      });
      break;
    case Is:
      l = {
        isOpen: !0,
        highlightedIndex: Xe(n, "highlightedIndex"),
        inputValue: t.inputValue
      };
      break;
    case Ss:
      l = {
        isOpen: !e.isOpen,
        highlightedIndex: e.isOpen ? -1 : po(n, e, 0)
      };
      break;
    case Es:
      l = {
        selectedItem: t.selectedItem,
        inputValue: n.itemToString(t.selectedItem)
      };
      break;
    case Cs:
      l = {
        inputValue: t.inputValue
      };
      break;
    default:
      return Dd(e, t, Qd);
  }
  return q({}, e, l);
}
s(Vv, "downshiftUseComboboxReducer");
var $v = ["onMouseLeave", "refKey", "ref"], Kv = ["item", "index", "refKey", "ref", "onMouseMove", "onMouseDown", "onClick", "onPress", "dis\
abled"], Uv = ["onClick", "onPress", "refKey", "ref"], qv = ["onKeyDown", "onChange", "onInput", "onBlur", "onChangeText", "onClick", "refKe\
y", "ref"];
Zd.stateChangeTypes = Qd;
function Zd(e) {
  e === void 0 && (e = {}), Wv(e, Zd);
  var t = q({}, jv, e), o = t.items, i = t.scrollIntoView, n = t.environment, r = t.getA11yStatusMessage, l = zv(Vv, t, Rv, Pd), u = l[0], p = l[1],
  c = u.isOpen, d = u.highlightedIndex, m = u.selectedItem, f = u.inputValue, y = G(null), h = G({}), v = G(null), I = G(null), C = Bn(), b = Ed(
  t), x = G(), g = Fn({
    state: u,
    props: t
  }), w = M(function(H) {
    return h.current[b.getItemId(H)];
  }, [b]);
  es(r, u, [c, d, m, f], n);
  var T = Od({
    menuElement: y.current,
    highlightedIndex: d,
    isOpen: c,
    itemRefs: h,
    scrollIntoView: i,
    getItemNodeFromIndex: w
  });
  ts({
    props: t,
    state: u
  }), z(function() {
    var H = uo(t, "isOpen");
    H && v.current && v.current.focus();
  }, []), z(function() {
    C || (x.current = o.length);
  });
  var _ = kd(n, [I, y, v], M(/* @__PURE__ */ s(function() {
    g.current.state.isOpen && p({
      type: Ln,
      selectItem: !1
    });
  }, "handleBlur"), [p, g])), k = Ji("getInputProps", "getMenuProps");
  z(function() {
    c || (h.current = {});
  }, [c]), z(function() {
    var H;
    !c || !(n != null && n.document) || !(v != null && (H = v.current) != null && H.focus) || n.document.activeElement !== v.current && v.current.
    focus();
  }, [c, n]);
  var E = Y(function() {
    return {
      ArrowDown: /* @__PURE__ */ s(function(j) {
        j.preventDefault(), p({
          type: fs,
          altKey: j.altKey
        });
      }, "ArrowDown"),
      ArrowUp: /* @__PURE__ */ s(function(j) {
        j.preventDefault(), p({
          type: ms,
          altKey: j.altKey
        });
      }, "ArrowUp"),
      Home: /* @__PURE__ */ s(function(j) {
        g.current.state.isOpen && (j.preventDefault(), p({
          type: gs
        }));
      }, "Home"),
      End: /* @__PURE__ */ s(function(j) {
        g.current.state.isOpen && (j.preventDefault(), p({
          type: ys
        }));
      }, "End"),
      Escape: /* @__PURE__ */ s(function(j) {
        var F = g.current.state;
        (F.isOpen || F.inputValue || F.selectedItem || F.highlightedIndex > -1) && (j.preventDefault(), p({
          type: hs
        }));
      }, "Escape"),
      Enter: /* @__PURE__ */ s(function(j) {
        var F = g.current.state;
        !F.isOpen || j.which === 229 || (j.preventDefault(), p({
          type: xs
        }));
      }, "Enter"),
      PageUp: /* @__PURE__ */ s(function(j) {
        g.current.state.isOpen && (j.preventDefault(), p({
          type: vs
        }));
      }, "PageUp"),
      PageDown: /* @__PURE__ */ s(function(j) {
        g.current.state.isOpen && (j.preventDefault(), p({
          type: bs
        }));
      }, "PageDown")
    };
  }, [p, g]), O = M(function(H) {
    return q({
      id: b.labelId,
      htmlFor: b.inputId
    }, H);
  }, [b]), P = M(function(H, j) {
    var F, $ = H === void 0 ? {} : H, X = $.onMouseLeave, oe = $.refKey, J = oe === void 0 ? "ref" : oe, ae = $.ref, ie = ke($, $v), se = j ===
    void 0 ? {} : j, le = se.suppressRefError, ve = le === void 0 ? !1 : le;
    return k("getMenuProps", ve, J, y), q((F = {}, F[J] = ft(ae, function(he) {
      y.current = he;
    }), F.id = b.menuId, F.role = "listbox", F["aria-labelledby"] = ie && ie["aria-label"] ? void 0 : "" + b.labelId, F.onMouseLeave = ce(X,
    function() {
      p({
        type: jd
      });
    }), F), ie);
  }, [p, k, b]), A = M(function(H) {
    var j, F, $ = H === void 0 ? {} : H, X = $.item, oe = $.index, J = $.refKey, ae = J === void 0 ? "ref" : J, ie = $.ref, se = $.onMouseMove,
    le = $.onMouseDown, ve = $.onClick;
    $.onPress;
    var he = $.disabled, Pe = ke($, Kv);
    he !== void 0 && console.warn('Passing "disabled" as an argument to getItemProps is not supported anymore. Please use the isItemDisabled\
 prop from useCombobox.');
    var ue = g.current, be = ue.props, Te = ue.state, Re = Qi(X, oe, be.items, "Pass either item or index to getItemProps!"), Le = Re[0], Se = Re[1],
    Ue = be.isItemDisabled(Le, Se), Dt = "onClick", Mt = ve, at = /* @__PURE__ */ s(function() {
      _.isTouchEnd || Se === Te.highlightedIndex || (T.current = !1, p({
        type: Vd,
        index: Se,
        disabled: Ue
      }));
    }, "itemHandleMouseMove"), vt = /* @__PURE__ */ s(function() {
      p({
        type: ws,
        index: Se
      });
    }, "itemHandleClick"), lt = /* @__PURE__ */ s(function(lm) {
      return lm.preventDefault();
    }, "itemHandleMouseDown");
    return q((j = {}, j[ae] = ft(ie, function(qe) {
      qe && (h.current[b.getItemId(Se)] = qe);
    }), j["aria-disabled"] = Ue, j["aria-selected"] = "" + (Se === Te.highlightedIndex), j.id = b.getItemId(Se), j.role = "option", j), !Ue &&
    (F = {}, F[Dt] = ce(Mt, vt), F), {
      onMouseMove: ce(se, at),
      onMouseDown: ce(le, lt)
    }, Pe);
  }, [p, b, g, _, T]), D = M(function(H) {
    var j, F = H === void 0 ? {} : H, $ = F.onClick;
    F.onPress;
    var X = F.refKey, oe = X === void 0 ? "ref" : X, J = F.ref, ae = ke(F, Uv), ie = g.current.state, se = /* @__PURE__ */ s(function() {
      p({
        type: $d
      });
    }, "toggleButtonHandleClick");
    return q((j = {}, j[oe] = ft(J, function(le) {
      I.current = le;
    }), j["aria-controls"] = b.menuId, j["aria-expanded"] = ie.isOpen, j.id = b.toggleButtonId, j.tabIndex = -1, j), !ae.disabled && q({}, {
      onClick: ce($, se)
    }), ae);
  }, [p, g, b]), L = M(function(H, j) {
    var F, $ = H === void 0 ? {} : H, X = $.onKeyDown, oe = $.onChange, J = $.onInput, ae = $.onBlur;
    $.onChangeText;
    var ie = $.onClick, se = $.refKey, le = se === void 0 ? "ref" : se, ve = $.ref, he = ke($, qv), Pe = j === void 0 ? {} : j, ue = Pe.suppressRefError,
    be = ue === void 0 ? !1 : ue;
    k("getInputProps", be, le, v);
    var Te = g.current.state, Re = /* @__PURE__ */ s(function(lt) {
      var qe = Ho(lt);
      qe && E[qe] && E[qe](lt);
    }, "inputHandleKeyDown"), Le = /* @__PURE__ */ s(function(lt) {
      p({
        type: Is,
        inputValue: lt.target.value
      });
    }, "inputHandleChange"), Se = /* @__PURE__ */ s(function(lt) {
      if (n != null && n.document && Te.isOpen && !_.isMouseDown) {
        var qe = lt.relatedTarget === null && n.document.activeElement !== n.document.body;
        p({
          type: Ln,
          selectItem: !qe
        });
      }
    }, "inputHandleBlur"), Ue = /* @__PURE__ */ s(function() {
      p({
        type: Ss
      });
    }, "inputHandleClick"), Dt = "onChange", Mt = {};
    if (!he.disabled) {
      var at;
      Mt = (at = {}, at[Dt] = ce(oe, J, Le), at.onKeyDown = ce(X, Re), at.onBlur = ce(ae, Se), at.onClick = ce(ie, Ue), at);
    }
    return q((F = {}, F[le] = ft(ve, function(vt) {
      v.current = vt;
    }), F["aria-activedescendant"] = Te.isOpen && Te.highlightedIndex > -1 ? b.getItemId(Te.highlightedIndex) : "", F["aria-autocomplete"] =
    "list", F["aria-controls"] = b.menuId, F["aria-expanded"] = Te.isOpen, F["aria-labelledby"] = he && he["aria-label"] ? void 0 : b.labelId,
    F.autoComplete = "off", F.id = b.inputId, F.role = "combobox", F.value = Te.inputValue, F), Mt, he);
  }, [p, b, n, E, g, _, k]), B = M(function() {
    p({
      type: Kd
    });
  }, [p]), N = M(function() {
    p({
      type: qd
    });
  }, [p]), V = M(function() {
    p({
      type: Ud
    });
  }, [p]), R = M(function(H) {
    p({
      type: Gd,
      highlightedIndex: H
    });
  }, [p]), K = M(function(H) {
    p({
      type: Es,
      selectedItem: H
    });
  }, [p]), W = M(function(H) {
    p({
      type: Yd,
      inputValue: H
    });
  }, [p]), ee = M(function() {
    p({
      type: Xd
    });
  }, [p]);
  return {
    // prop getters.
    getItemProps: A,
    getLabelProps: O,
    getMenuProps: P,
    getInputProps: L,
    getToggleButtonProps: D,
    // actions.
    toggleMenu: B,
    openMenu: V,
    closeMenu: N,
    setHighlightedIndex: R,
    setInputValue: W,
    selectItem: K,
    reset: ee,
    // state.
    highlightedIndex: d,
    isOpen: c,
    selectedItem: m,
    inputValue: f
  };
}
s(Zd, "useCombobox");
var Jd = {
  activeIndex: -1,
  selectedItems: []
};
function td(e, t) {
  return uo(e, t, Jd);
}
s(td, "getInitialValue");
function od(e, t) {
  return Xe(e, t, Jd);
}
s(od, "getDefaultValue");
function Gv(e) {
  var t = td(e, "activeIndex"), o = td(e, "selectedItems");
  return {
    activeIndex: t,
    selectedItems: o
  };
}
s(Gv, "getInitialState");
function rd(e) {
  if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey)
    return !1;
  var t = e.target;
  return !(t instanceof HTMLInputElement && // if element is a text input
  t.value !== "" && // and we have text in it
  // and cursor is either not at the start or is currently highlighting text.
  (t.selectionStart !== 0 || t.selectionEnd !== 0));
}
s(rd, "isKeyDownOperationPermitted");
function Yv(e, t) {
  return e.selectedItems === t.selectedItems && e.activeIndex === t.activeIndex;
}
s(Yv, "isStateEqual");
var o5 = {
  stateReducer: _n.stateReducer,
  itemToKey: _n.itemToKey,
  environment: _n.environment,
  selectedItems: Q.default.array,
  initialSelectedItems: Q.default.array,
  defaultSelectedItems: Q.default.array,
  getA11yStatusMessage: Q.default.func,
  activeIndex: Q.default.number,
  initialActiveIndex: Q.default.number,
  defaultActiveIndex: Q.default.number,
  onActiveIndexChange: Q.default.func,
  onSelectedItemsChange: Q.default.func,
  keyNavigationNext: Q.default.string,
  keyNavigationPrevious: Q.default.string
}, Xv = {
  itemToKey: ir.itemToKey,
  stateReducer: ir.stateReducer,
  environment: ir.environment,
  keyNavigationNext: "ArrowRight",
  keyNavigationPrevious: "ArrowLeft"
}, Qv = Ye, Ts = 0, _s = 1, ks = 2, Os = 3, Ps = 4, As = 5, Ds = 6, Ms = 7, Ls = 8, Ns = 9, Fs = 10, Bs = 11, Hs = 12, Zv = /* @__PURE__ */ Object.
freeze({
  __proto__: null,
  SelectedItemClick: Ts,
  SelectedItemKeyDownDelete: _s,
  SelectedItemKeyDownBackspace: ks,
  SelectedItemKeyDownNavigationNext: Os,
  SelectedItemKeyDownNavigationPrevious: Ps,
  DropdownKeyDownNavigationPrevious: As,
  DropdownKeyDownBackspace: Ds,
  DropdownClick: Ms,
  FunctionAddSelectedItem: Ls,
  FunctionRemoveSelectedItem: Ns,
  FunctionSetSelectedItems: Fs,
  FunctionSetActiveIndex: Bs,
  FunctionReset: Hs
});
function Jv(e, t) {
  var o = t.type, i = t.index, n = t.props, r = t.selectedItem, l = e.activeIndex, u = e.selectedItems, p;
  switch (o) {
    case Ts:
      p = {
        activeIndex: i
      };
      break;
    case Ps:
      p = {
        activeIndex: l - 1 < 0 ? 0 : l - 1
      };
      break;
    case Os:
      p = {
        activeIndex: l + 1 >= u.length ? -1 : l + 1
      };
      break;
    case ks:
    case _s: {
      if (l < 0)
        break;
      var c = l;
      u.length === 1 ? c = -1 : l === u.length - 1 && (c = u.length - 2), p = q({
        selectedItems: [].concat(u.slice(0, l), u.slice(l + 1))
      }, {
        activeIndex: c
      });
      break;
    }
    case As:
      p = {
        activeIndex: u.length - 1
      };
      break;
    case Ds:
      p = {
        selectedItems: u.slice(0, u.length - 1)
      };
      break;
    case Ls:
      p = {
        selectedItems: [].concat(u, [r])
      };
      break;
    case Ms:
      p = {
        activeIndex: -1
      };
      break;
    case Ns: {
      var d = l, m = u.findIndex(function(h) {
        return n.itemToKey(h) === n.itemToKey(r);
      });
      if (m < 0)
        break;
      u.length === 1 ? d = -1 : m === u.length - 1 && (d = u.length - 2), p = {
        selectedItems: [].concat(u.slice(0, m), u.slice(m + 1)),
        activeIndex: d
      };
      break;
    }
    case Fs: {
      var f = t.selectedItems;
      p = {
        selectedItems: f
      };
      break;
    }
    case Bs: {
      var y = t.activeIndex;
      p = {
        activeIndex: y
      };
      break;
    }
    case Hs:
      p = {
        activeIndex: od(n, "activeIndex"),
        selectedItems: od(n, "selectedItems")
      };
      break;
    default:
      throw new Error("Reducer called without proper action type.");
  }
  return q({}, e, p);
}
s(Jv, "downshiftMultipleSelectionReducer");
var eb = ["refKey", "ref", "onClick", "onKeyDown", "selectedItem", "index"], tb = ["refKey", "ref", "onKeyDown", "onClick", "preventKeyActio\
n"];
ef.stateChangeTypes = Zv;
function ef(e) {
  e === void 0 && (e = {}), Qv(e, ef);
  var t = q({}, Xv, e), o = t.getA11yStatusMessage, i = t.environment, n = t.keyNavigationNext, r = t.keyNavigationPrevious, l = Td(Jv, t, Gv,
  Yv), u = l[0], p = l[1], c = u.activeIndex, d = u.selectedItems, m = Bn(), f = G(null), y = G();
  y.current = [];
  var h = Fn({
    state: u,
    props: t
  });
  es(o, u, [c, d], i), z(function() {
    m || (c === -1 && f.current ? f.current.focus() : y.current[c] && y.current[c].focus());
  }, [c]), ts({
    props: t,
    state: u
  });
  var v = Ji("getDropdownProps"), I = Y(function() {
    var E;
    return E = {}, E[r] = function() {
      p({
        type: Ps
      });
    }, E[n] = function() {
      p({
        type: Os
      });
    }, E.Delete = /* @__PURE__ */ s(function() {
      p({
        type: _s
      });
    }, "Delete"), E.Backspace = /* @__PURE__ */ s(function() {
      p({
        type: ks
      });
    }, "Backspace"), E;
  }, [p, n, r]), C = Y(function() {
    var E;
    return E = {}, E[r] = function(O) {
      rd(O) && p({
        type: As
      });
    }, E.Backspace = /* @__PURE__ */ s(function(P) {
      rd(P) && p({
        type: Ds
      });
    }, "Backspace"), E;
  }, [p, r]), b = M(function(E) {
    var O, P = E === void 0 ? {} : E, A = P.refKey, D = A === void 0 ? "ref" : A, L = P.ref, B = P.onClick, N = P.onKeyDown, V = P.selectedItem,
    R = P.index, K = ke(P, eb), W = h.current.state, ee = Qi(V, R, W.selectedItems, "Pass either item or index to getSelectedItemProps!"), H = ee[1],
    j = H > -1 && H === W.activeIndex, F = /* @__PURE__ */ s(function() {
      p({
        type: Ts,
        index: H
      });
    }, "selectedItemHandleClick"), $ = /* @__PURE__ */ s(function(oe) {
      var J = Ho(oe);
      J && I[J] && I[J](oe);
    }, "selectedItemHandleKeyDown");
    return q((O = {}, O[D] = ft(L, function(X) {
      X && y.current.push(X);
    }), O.tabIndex = j ? 0 : -1, O.onClick = ce(B, F), O.onKeyDown = ce(N, $), O), K);
  }, [p, h, I]), x = M(function(E, O) {
    var P, A = E === void 0 ? {} : E, D = A.refKey, L = D === void 0 ? "ref" : D, B = A.ref, N = A.onKeyDown, V = A.onClick, R = A.preventKeyAction,
    K = R === void 0 ? !1 : R, W = ke(A, tb), ee = O === void 0 ? {} : O, H = ee.suppressRefError, j = H === void 0 ? !1 : H;
    v("getDropdownProps", j, L, f);
    var F = /* @__PURE__ */ s(function(oe) {
      var J = Ho(oe);
      J && C[J] && C[J](oe);
    }, "dropdownHandleKeyDown"), $ = /* @__PURE__ */ s(function() {
      p({
        type: Ms
      });
    }, "dropdownHandleClick");
    return q((P = {}, P[L] = ft(B, function(X) {
      X && (f.current = X);
    }), P), !K && {
      onKeyDown: ce(N, F),
      onClick: ce(V, $)
    }, W);
  }, [p, C, v]), g = M(function(E) {
    p({
      type: Ls,
      selectedItem: E
    });
  }, [p]), w = M(function(E) {
    p({
      type: Ns,
      selectedItem: E
    });
  }, [p]), T = M(function(E) {
    p({
      type: Fs,
      selectedItems: E
    });
  }, [p]), _ = M(function(E) {
    p({
      type: Bs,
      activeIndex: E
    });
  }, [p]), k = M(function() {
    p({
      type: Hs
    });
  }, [p]);
  return {
    getSelectedItemProps: b,
    getDropdownProps: x,
    addSelectedItem: g,
    removeSelectedItem: w,
    setSelectedItems: T,
    setActiveIndex: _,
    reset: k,
    selectedItems: d,
    activeIndex: c
  };
}
s(ef, "useMultipleSelection");

// src/manager/components/sidebar/Search.tsx
var of = Ve(tf(), 1);

// src/manager/components/sidebar/types.ts
function lr(e) {
  return !!(e && e.showAll);
}
s(lr, "isExpandType");
function zs(e) {
  return !!(e && e.item);
}
s(zs, "isSearchResult");

// src/manager/components/sidebar/Search.tsx
var { document: ob } = re, Ws = 50, rb = {
  shouldSort: !0,
  tokenize: !0,
  findAllMatches: !0,
  includeScore: !0,
  includeMatches: !0,
  threshold: 0.2,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [
    { name: "name", weight: 0.7 },
    { name: "path", weight: 0.3 }
  ]
}, nb = S.div({
  display: "flex",
  flexDirection: "row",
  columnGap: 6
}), ib = S.label({
  position: "absolute",
  left: -1e4,
  top: "auto",
  width: 1,
  height: 1,
  overflow: "hidden"
}), sb = S.div(({ theme: e }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: 2,
  flexGrow: 1,
  height: 32,
  width: "100%",
  boxShadow: `${e.button.border} 0 0 0 1px inset`,
  borderRadius: e.appBorderRadius + 2,
  "&:has(input:focus), &:has(input:active)": {
    boxShadow: `${e.color.secondary} 0 0 0 1px inset`,
    background: e.background.app
  }
})), ab = S.div(({ theme: e, onClick: t }) => ({
  cursor: t ? "pointer" : "default",
  flex: "0 0 28px",
  height: "100%",
  pointerEvents: t ? "auto" : "none",
  color: e.textMutedColor,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
})), lb = S.input(({ theme: e }) => ({
  appearance: "none",
  height: 28,
  width: "100%",
  padding: 0,
  border: 0,
  background: "transparent",
  fontSize: `${e.typography.size.s1 + 1}px`,
  fontFamily: "inherit",
  transition: "all 150ms",
  color: e.color.defaultText,
  outline: 0,
  "&::placeholder": {
    color: e.textMutedColor,
    opacity: 1
  },
  "&:valid ~ code, &:focus ~ code": {
    display: "none"
  },
  "&:invalid ~ svg": {
    display: "none"
  },
  "&:valid ~ svg": {
    display: "block"
  },
  "&::-ms-clear": {
    display: "none"
  },
  "&::-webkit-search-decoration, &::-webkit-search-cancel-button, &::-webkit-search-results-button, &::-webkit-search-results-decoration": {
    display: "none"
  }
})), ub = S.code(({ theme: e }) => ({
  margin: 5,
  marginTop: 6,
  height: 16,
  lineHeight: "16px",
  textAlign: "center",
  fontSize: "11px",
  color: e.base === "light" ? e.color.dark : e.textMutedColor,
  userSelect: "none",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  gap: 4,
  flexShrink: 0
})), pb = S.span({
  fontSize: "14px"
}), cb = S.div({
  display: "flex",
  alignItems: "center",
  gap: 2
}), db = S.div({ outline: 0 }), rf = a.memo(/* @__PURE__ */ s(function({
  children: t,
  dataset: o,
  enableShortcuts: i = !0,
  getLastViewed: n,
  initialQuery: r = "",
  searchBarContent: l,
  searchFieldContent: u
}) {
  let p = pe(), c = G(null), [d, m] = U("Find components"), [f, y] = U(!1), h = p ? pt(p.getShortcutKeys().search) : "/", v = M(() => {
    let w = o.entries.reduce((T, [_, { index: k, status: E }]) => {
      let O = pn(k || {}, E);
      return k && T.push(
        ...Object.values(k).map((P) => {
          let A = E && E[P.id] ? nr(Object.values(E[P.id] || {}).map((D) => D.status)) : null;
          return {
            ...zi(P, o.hash[_]),
            status: A || O[P.id] || null
          };
        })
      ), T;
    }, []);
    return new of.default(w, rb);
  }, [o]), I = M(
    (w) => {
      let T = v();
      if (!w)
        return [];
      let _ = [], k = /* @__PURE__ */ new Set(), E = T.search(w).filter(({ item: O }) => !(O.type === "component" || O.type === "docs" || O.
      type === "story") || // @ts-expect-error (non strict)
      k.has(O.parent) ? !1 : (k.add(O.id), !0));
      return E.length && (_ = E.slice(0, f ? 1e3 : Ws), E.length > Ws && !f && _.push({
        showAll: /* @__PURE__ */ s(() => y(!0), "showAll"),
        totalCount: E.length,
        moreCount: E.length - Ws
      })), _;
    },
    [f, v]
  ), C = M(
    (w) => {
      if (zs(w)) {
        let { id: T, refId: _ } = w.item;
        p?.selectStory(T, void 0, { ref: _ !== St && _ }), c.current.blur(), y(!1);
        return;
      }
      lr(w) && w.showAll();
    },
    [p]
  ), b = M((w, T) => {
    y(!1);
  }, []), x = M(
    (w, T) => {
      switch (T.type) {
        case co.stateChangeTypes.blurInput:
          return {
            ...T,
            // Prevent clearing the input on blur
            inputValue: w.inputValue,
            // Return to the tree view after selecting an item
            isOpen: w.inputValue && !w.selectedItem
          };
        case co.stateChangeTypes.mouseUp:
          return w;
        case co.stateChangeTypes.keyDownEscape:
          return w.inputValue ? { ...T, inputValue: "", isOpen: !0, selectedItem: null } : { ...T, isOpen: !1, selectedItem: null };
        case co.stateChangeTypes.clickItem:
        case co.stateChangeTypes.keyDownEnter:
          return zs(T.selectedItem) ? { ...T, inputValue: w.inputValue } : lr(T.selectedItem) ? w : T;
        default:
          return T;
      }
    },
    []
  ), { isMobile: g } = ge();
  return (
    // @ts-expect-error (non strict)
    /* @__PURE__ */ a.createElement(
      co,
      {
        initialInputValue: r,
        stateReducer: x,
        itemToString: (w) => w?.item?.name || "",
        scrollIntoView: (w) => ro(w),
        onSelect: C,
        onInputValueChange: b
      },
      ({
        isOpen: w,
        openMenu: T,
        closeMenu: _,
        inputValue: k,
        clearSelection: E,
        getInputProps: O,
        getItemProps: P,
        getLabelProps: A,
        getMenuProps: D,
        getRootProps: L,
        highlightedIndex: B
      }) => {
        let N = k ? k.trim() : "", V = N ? I(N) : [], R = !N && n();
        R && R.length && (V = R.reduce((H, { storyId: j, refId: F }) => {
          let $ = o.hash[F];
          if ($ && $.index && $.index[j]) {
            let X = $.index[j], oe = X.type === "story" ? $.index[X.parent] : X;
            H.some((J) => J.item.refId === F && J.item.id === oe.id) || H.push({ item: zi(oe, o.hash[F]), matches: [], score: 0 });
          }
          return H;
        }, []));
        let K = "storybook-explorer-searchfield", W = O({
          id: K,
          ref: c,
          required: !0,
          type: "search",
          placeholder: d,
          onFocus: /* @__PURE__ */ s(() => {
            T(), m("Type to find...");
          }, "onFocus"),
          onBlur: /* @__PURE__ */ s(() => m("Find components"), "onBlur"),
          onKeyDown: /* @__PURE__ */ s((H) => {
            H.key === "Escape" && k.length === 0 && c.current.blur();
          }, "onKeyDown")
        }), ee = A({
          htmlFor: K
        });
        return /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(ib, { ...ee }, "Search for components"), /* @__PURE__ */ a.
        createElement(nb, null, /* @__PURE__ */ a.createElement(
          sb,
          {
            ...L({ refKey: "" }, { suppressRefError: !0 }),
            className: "search-field"
          },
          /* @__PURE__ */ a.createElement(ab, null, /* @__PURE__ */ a.createElement(jr, null)),
          /* @__PURE__ */ a.createElement(lb, { ...W }),
          !g && i && !w && /* @__PURE__ */ a.createElement(ub, null, h === "\u2318 K" ? /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.
          createElement(pb, null, "\u2318"), "K") : h),
          /* @__PURE__ */ a.createElement(cb, null, w && /* @__PURE__ */ a.createElement(te, { onClick: () => E() }, /* @__PURE__ */ a.createElement(
          ct, null)), u)
        ), l), /* @__PURE__ */ a.createElement(db, { tabIndex: 0, id: "storybook-explorer-menu" }, t({
          query: N,
          results: V,
          isBrowsing: !w && ob.activeElement !== c.current,
          closeMenu: _,
          getMenuProps: D,
          getItemProps: P,
          highlightedIndex: B
        })));
      }
    )
  );
}, "Search"));

// src/manager/components/sidebar/SearchResults.tsx
var { document: nf } = re, fb = S.ol({
  listStyle: "none",
  margin: 0,
  padding: 0
}), mb = S.li(({ theme: e, isHighlighted: t }) => ({
  width: "100%",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  textAlign: "left",
  color: "inherit",
  fontSize: `${e.typography.size.s2}px`,
  background: t ? e.background.hoverable : "transparent",
  minHeight: 28,
  borderRadius: 4,
  gap: 6,
  paddingTop: 7,
  paddingBottom: 7,
  paddingLeft: 8,
  paddingRight: 8,
  "&:hover, &:focus": {
    background: xe(0.93, e.color.secondary),
    outline: "none"
  }
})), hb = S.div({
  marginTop: 2
}), gb = S.div({
  flex: 1,
  display: "flex",
  flexDirection: "column"
}), yb = S.div(({ theme: e }) => ({
  marginTop: 20,
  textAlign: "center",
  fontSize: `${e.typography.size.s2}px`,
  lineHeight: "18px",
  color: e.color.defaultText,
  small: {
    color: e.barTextColor,
    fontSize: `${e.typography.size.s1}px`
  }
})), vb = S.mark(({ theme: e }) => ({
  background: "transparent",
  color: e.color.secondary
})), bb = S.div({
  marginTop: 8
}), xb = S.div(({ theme: e }) => ({
  display: "flex",
  justifyContent: "space-between",
  fontSize: `${e.typography.size.s1 - 1}px`,
  fontWeight: e.typography.weight.bold,
  minHeight: 28,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: e.textMutedColor,
  marginTop: 16,
  marginBottom: 4,
  alignItems: "center",
  ".search-result-recentlyOpened-clear": {
    visibility: "hidden"
  },
  "&:hover": {
    ".search-result-recentlyOpened-clear": {
      visibility: "visible"
    }
  }
})), sf = a.memo(/* @__PURE__ */ s(function({
  children: t,
  match: o
}) {
  if (!o)
    return t;
  let { value: i, indices: n } = o, { nodes: r } = n.reduce(
    ({ cursor: l, nodes: u }, [p, c], d, { length: m }) => (u.push(/* @__PURE__ */ a.createElement("span", { key: `${d}-1` }, i.slice(l, p))),
    u.push(/* @__PURE__ */ a.createElement(vb, { key: `${d}-2` }, i.slice(p, c + 1))), d === m - 1 && u.push(/* @__PURE__ */ a.createElement(
    "span", { key: `${d}-3` }, i.slice(c + 1))), { cursor: c + 1, nodes: u }),
    { cursor: 0, nodes: [] }
  );
  return /* @__PURE__ */ a.createElement("span", null, r);
}, "Highlight")), Ib = S.div(({ theme: e }) => ({
  display: "grid",
  justifyContent: "start",
  gridAutoColumns: "auto",
  gridAutoFlow: "column",
  "& > span": {
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }
})), Sb = S.div(({ theme: e }) => ({
  display: "grid",
  justifyContent: "start",
  gridAutoColumns: "auto",
  gridAutoFlow: "column",
  fontSize: `${e.typography.size.s1 - 1}px`,
  "& > span": {
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  "& > span + span": {
    "&:before": {
      content: "' / '"
    }
  }
})), wb = a.memo(/* @__PURE__ */ s(function({ item: t, matches: o, onClick: i, ...n }) {
  let r = M(
    (d) => {
      d.preventDefault(), i?.(d);
    },
    [i]
  ), l = pe();
  z(() => {
    l && n.isHighlighted && t.type === "component" && l.emit($t, { ids: [t.children[0]] }, { options: { target: t.refId } });
  }, [n.isHighlighted, t]);
  let u = o.find((d) => d.key === "name"), p = o.filter((d) => d.key === "path"), [c] = t.status ? rr[t.status] : [];
  return /* @__PURE__ */ a.createElement(mb, { ...n, onClick: r }, /* @__PURE__ */ a.createElement(hb, null, t.type === "component" && /* @__PURE__ */ a.
  createElement(Ht, { viewBox: "0 0 14 14", width: "14", height: "14", type: "component" }, /* @__PURE__ */ a.createElement($e, { type: "com\
ponent" })), t.type === "story" && /* @__PURE__ */ a.createElement(Ht, { viewBox: "0 0 14 14", width: "14", height: "14", type: "story" }, /* @__PURE__ */ a.
  createElement($e, { type: "story" })), !(t.type === "component" || t.type === "story") && /* @__PURE__ */ a.createElement(Ht, { viewBox: "\
0 0 14 14", width: "14", height: "14", type: "document" }, /* @__PURE__ */ a.createElement($e, { type: "document" }))), /* @__PURE__ */ a.createElement(
  gb, { className: "search-result-item--label" }, /* @__PURE__ */ a.createElement(Ib, null, /* @__PURE__ */ a.createElement(sf, { match: u },
  t.name)), /* @__PURE__ */ a.createElement(Sb, null, t.path.map((d, m) => /* @__PURE__ */ a.createElement("span", { key: m }, /* @__PURE__ */ a.
  createElement(sf, { match: p.find((f) => f.arrayIndex === m) }, d))))), t.status ? /* @__PURE__ */ a.createElement(Ic, { status: t.status },
  c) : null);
}, "Result")), af = a.memo(/* @__PURE__ */ s(function({
  query: t,
  results: o,
  closeMenu: i,
  getMenuProps: n,
  getItemProps: r,
  highlightedIndex: l,
  isLoading: u = !1,
  enableShortcuts: p = !0,
  clearLastViewed: c
}) {
  let d = pe();
  z(() => {
    let y = /* @__PURE__ */ s((h) => {
      if (!(!p || u || h.repeat) && Rt(!1, h) && tt("Escape", h)) {
        if (h.target?.id === "storybook-explorer-searchfield")
          return;
        h.preventDefault(), i();
      }
    }, "handleEscape");
    return nf.addEventListener("keydown", y), () => nf.removeEventListener("keydown", y);
  }, [i, p, u]);
  let m = M((y) => {
    if (!d)
      return;
    let h = y.currentTarget, v = h.getAttribute("data-id"), I = h.getAttribute("data-refid"), C = d.resolveStory(v, I === "storybook_interna\
l" ? void 0 : I);
    C?.type === "component" && d.emit($t, {
      // @ts-expect-error (TODO)
      ids: [C.isLeaf ? C.id : C.children[0]],
      options: { target: I }
    });
  }, []), f = /* @__PURE__ */ s(() => {
    c(), i();
  }, "handleClearLastViewed");
  return /* @__PURE__ */ a.createElement(fb, { ...n() }, o.length > 0 && !t && /* @__PURE__ */ a.createElement(xb, { className: "search-resu\
lt-recentlyOpened" }, "Recently opened", /* @__PURE__ */ a.createElement(
    te,
    {
      className: "search-result-recentlyOpened-clear",
      onClick: f
    },
    /* @__PURE__ */ a.createElement(Vl, null)
  )), o.length === 0 && t && /* @__PURE__ */ a.createElement("li", null, /* @__PURE__ */ a.createElement(yb, null, /* @__PURE__ */ a.createElement(
  "strong", null, "No components found"), /* @__PURE__ */ a.createElement("br", null), /* @__PURE__ */ a.createElement("small", null, "Find \
components by name or path."))), o.map((y, h) => {
    if (lr(y))
      return /* @__PURE__ */ a.createElement(bb, { key: "search-result-expand" }, /* @__PURE__ */ a.createElement(
        fe,
        {
          ...y,
          ...r({ key: h, index: h, item: y }),
          size: "small"
        },
        "Show ",
        y.moreCount,
        " more results"
      ));
    let { item: v } = y, I = `${v.refId}::${v.id}`;
    return /* @__PURE__ */ a.createElement(
      wb,
      {
        key: v.id,
        ...y,
        ...r({ key: I, index: h, item: y }),
        isHighlighted: l === h,
        "data-id": y.item.id,
        "data-refid": y.item.refId,
        onMouseOver: m,
        className: "search-result-item"
      }
    );
  }));
}, "SearchResults"));

// ../node_modules/react-popper/lib/esm/utils.js
var js = /* @__PURE__ */ s(function(t) {
  return t.reduce(function(o, i) {
    var n = i[0], r = i[1];
    return o[n] = r, o;
  }, {});
}, "fromEntries"), Vs = typeof window < "u" && window.document && window.document.createElement ? Lt : z;

// ../node_modules/@popperjs/core/lib/enums.js
var Ie = "top", De = "bottom", Oe = "right", Ce = "left", Hn = "auto", Wt = [Ie, De, Oe, Ce], Ot = "start", fo = "end", lf = "clippingParent\
s", Rn = "viewport", Ro = "popper", uf = "reference", $s = /* @__PURE__ */ Wt.reduce(function(e, t) {
  return e.concat([t + "-" + Ot, t + "-" + fo]);
}, []), zn = /* @__PURE__ */ [].concat(Wt, [Hn]).reduce(function(e, t) {
  return e.concat([t, t + "-" + Ot, t + "-" + fo]);
}, []), Eb = "beforeRead", Cb = "read", Tb = "afterRead", _b = "beforeMain", kb = "main", Ob = "afterMain", Pb = "beforeWrite", Ab = "write",
Db = "afterWrite", pf = [Eb, Cb, Tb, _b, kb, Ob, Pb, Ab, Db];

// ../node_modules/@popperjs/core/lib/dom-utils/getNodeName.js
function Be(e) {
  return e ? (e.nodeName || "").toLowerCase() : null;
}
s(Be, "getNodeName");

// ../node_modules/@popperjs/core/lib/dom-utils/getWindow.js
function ye(e) {
  if (e == null)
    return window;
  if (e.toString() !== "[object Window]") {
    var t = e.ownerDocument;
    return t && t.defaultView || window;
  }
  return e;
}
s(ye, "getWindow");

// ../node_modules/@popperjs/core/lib/dom-utils/instanceOf.js
function rt(e) {
  var t = ye(e).Element;
  return e instanceof t || e instanceof Element;
}
s(rt, "isElement");
function Me(e) {
  var t = ye(e).HTMLElement;
  return e instanceof t || e instanceof HTMLElement;
}
s(Me, "isHTMLElement");
function zo(e) {
  if (typeof ShadowRoot > "u")
    return !1;
  var t = ye(e).ShadowRoot;
  return e instanceof t || e instanceof ShadowRoot;
}
s(zo, "isShadowRoot");

// ../node_modules/@popperjs/core/lib/modifiers/applyStyles.js
function Mb(e) {
  var t = e.state;
  Object.keys(t.elements).forEach(function(o) {
    var i = t.styles[o] || {}, n = t.attributes[o] || {}, r = t.elements[o];
    !Me(r) || !Be(r) || (Object.assign(r.style, i), Object.keys(n).forEach(function(l) {
      var u = n[l];
      u === !1 ? r.removeAttribute(l) : r.setAttribute(l, u === !0 ? "" : u);
    }));
  });
}
s(Mb, "applyStyles");
function Lb(e) {
  var t = e.state, o = {
    popper: {
      position: t.options.strategy,
      left: "0",
      top: "0",
      margin: "0"
    },
    arrow: {
      position: "absolute"
    },
    reference: {}
  };
  return Object.assign(t.elements.popper.style, o.popper), t.styles = o, t.elements.arrow && Object.assign(t.elements.arrow.style, o.arrow),
  function() {
    Object.keys(t.elements).forEach(function(i) {
      var n = t.elements[i], r = t.attributes[i] || {}, l = Object.keys(t.styles.hasOwnProperty(i) ? t.styles[i] : o[i]), u = l.reduce(function(p, c) {
        return p[c] = "", p;
      }, {});
      !Me(n) || !Be(n) || (Object.assign(n.style, u), Object.keys(r).forEach(function(p) {
        n.removeAttribute(p);
      }));
    });
  };
}
s(Lb, "effect");
var cf = {
  name: "applyStyles",
  enabled: !0,
  phase: "write",
  fn: Mb,
  effect: Lb,
  requires: ["computeStyles"]
};

// ../node_modules/@popperjs/core/lib/utils/getBasePlacement.js
function He(e) {
  return e.split("-")[0];
}
s(He, "getBasePlacement");

// ../node_modules/@popperjs/core/lib/utils/math.js
var ht = Math.max, mo = Math.min, Pt = Math.round;

// ../node_modules/@popperjs/core/lib/utils/userAgent.js
function Wo() {
  var e = navigator.userAgentData;
  return e != null && e.brands && Array.isArray(e.brands) ? e.brands.map(function(t) {
    return t.brand + "/" + t.version;
  }).join(" ") : navigator.userAgent;
}
s(Wo, "getUAString");

// ../node_modules/@popperjs/core/lib/dom-utils/isLayoutViewport.js
function ur() {
  return !/^((?!chrome|android).)*safari/i.test(Wo());
}
s(ur, "isLayoutViewport");

// ../node_modules/@popperjs/core/lib/dom-utils/getBoundingClientRect.js
function nt(e, t, o) {
  t === void 0 && (t = !1), o === void 0 && (o = !1);
  var i = e.getBoundingClientRect(), n = 1, r = 1;
  t && Me(e) && (n = e.offsetWidth > 0 && Pt(i.width) / e.offsetWidth || 1, r = e.offsetHeight > 0 && Pt(i.height) / e.offsetHeight || 1);
  var l = rt(e) ? ye(e) : window, u = l.visualViewport, p = !ur() && o, c = (i.left + (p && u ? u.offsetLeft : 0)) / n, d = (i.top + (p && u ?
  u.offsetTop : 0)) / r, m = i.width / n, f = i.height / r;
  return {
    width: m,
    height: f,
    top: d,
    right: c + m,
    bottom: d + f,
    left: c,
    x: c,
    y: d
  };
}
s(nt, "getBoundingClientRect");

// ../node_modules/@popperjs/core/lib/dom-utils/getLayoutRect.js
function ho(e) {
  var t = nt(e), o = e.offsetWidth, i = e.offsetHeight;
  return Math.abs(t.width - o) <= 1 && (o = t.width), Math.abs(t.height - i) <= 1 && (i = t.height), {
    x: e.offsetLeft,
    y: e.offsetTop,
    width: o,
    height: i
  };
}
s(ho, "getLayoutRect");

// ../node_modules/@popperjs/core/lib/dom-utils/contains.js
function pr(e, t) {
  var o = t.getRootNode && t.getRootNode();
  if (e.contains(t))
    return !0;
  if (o && zo(o)) {
    var i = t;
    do {
      if (i && e.isSameNode(i))
        return !0;
      i = i.parentNode || i.host;
    } while (i);
  }
  return !1;
}
s(pr, "contains");

// ../node_modules/@popperjs/core/lib/dom-utils/getComputedStyle.js
function Ke(e) {
  return ye(e).getComputedStyle(e);
}
s(Ke, "getComputedStyle");

// ../node_modules/@popperjs/core/lib/dom-utils/isTableElement.js
function Ks(e) {
  return ["table", "td", "th"].indexOf(Be(e)) >= 0;
}
s(Ks, "isTableElement");

// ../node_modules/@popperjs/core/lib/dom-utils/getDocumentElement.js
function ze(e) {
  return ((rt(e) ? e.ownerDocument : (
    // $FlowFixMe[prop-missing]
    e.document
  )) || window.document).documentElement;
}
s(ze, "getDocumentElement");

// ../node_modules/@popperjs/core/lib/dom-utils/getParentNode.js
function At(e) {
  return Be(e) === "html" ? e : (
    // this is a quicker (but less type safe) way to save quite some bytes from the bundle
    // $FlowFixMe[incompatible-return]
    // $FlowFixMe[prop-missing]
    e.assignedSlot || // step into the shadow DOM of the parent of a slotted node
    e.parentNode || // DOM Element detected
    (zo(e) ? e.host : null) || // ShadowRoot detected
    // $FlowFixMe[incompatible-call]: HTMLElement is a Node
    ze(e)
  );
}
s(At, "getParentNode");

// ../node_modules/@popperjs/core/lib/dom-utils/getOffsetParent.js
function df(e) {
  return !Me(e) || // https://github.com/popperjs/popper-core/issues/837
  Ke(e).position === "fixed" ? null : e.offsetParent;
}
s(df, "getTrueOffsetParent");
function Nb(e) {
  var t = /firefox/i.test(Wo()), o = /Trident/i.test(Wo());
  if (o && Me(e)) {
    var i = Ke(e);
    if (i.position === "fixed")
      return null;
  }
  var n = At(e);
  for (zo(n) && (n = n.host); Me(n) && ["html", "body"].indexOf(Be(n)) < 0; ) {
    var r = Ke(n);
    if (r.transform !== "none" || r.perspective !== "none" || r.contain === "paint" || ["transform", "perspective"].indexOf(r.willChange) !==
    -1 || t && r.willChange === "filter" || t && r.filter && r.filter !== "none")
      return n;
    n = n.parentNode;
  }
  return null;
}
s(Nb, "getContainingBlock");
function gt(e) {
  for (var t = ye(e), o = df(e); o && Ks(o) && Ke(o).position === "static"; )
    o = df(o);
  return o && (Be(o) === "html" || Be(o) === "body" && Ke(o).position === "static") ? t : o || Nb(e) || t;
}
s(gt, "getOffsetParent");

// ../node_modules/@popperjs/core/lib/utils/getMainAxisFromPlacement.js
function go(e) {
  return ["top", "bottom"].indexOf(e) >= 0 ? "x" : "y";
}
s(go, "getMainAxisFromPlacement");

// ../node_modules/@popperjs/core/lib/utils/within.js
function yo(e, t, o) {
  return ht(e, mo(t, o));
}
s(yo, "within");
function ff(e, t, o) {
  var i = yo(e, t, o);
  return i > o ? o : i;
}
s(ff, "withinMaxClamp");

// ../node_modules/@popperjs/core/lib/utils/getFreshSideObject.js
function cr() {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
}
s(cr, "getFreshSideObject");

// ../node_modules/@popperjs/core/lib/utils/mergePaddingObject.js
function dr(e) {
  return Object.assign({}, cr(), e);
}
s(dr, "mergePaddingObject");

// ../node_modules/@popperjs/core/lib/utils/expandToHashMap.js
function fr(e, t) {
  return t.reduce(function(o, i) {
    return o[i] = e, o;
  }, {});
}
s(fr, "expandToHashMap");

// ../node_modules/@popperjs/core/lib/modifiers/arrow.js
var Fb = /* @__PURE__ */ s(function(t, o) {
  return t = typeof t == "function" ? t(Object.assign({}, o.rects, {
    placement: o.placement
  })) : t, dr(typeof t != "number" ? t : fr(t, Wt));
}, "toPaddingObject");
function Bb(e) {
  var t, o = e.state, i = e.name, n = e.options, r = o.elements.arrow, l = o.modifiersData.popperOffsets, u = He(o.placement), p = go(u), c = [
  Ce, Oe].indexOf(u) >= 0, d = c ? "height" : "width";
  if (!(!r || !l)) {
    var m = Fb(n.padding, o), f = ho(r), y = p === "y" ? Ie : Ce, h = p === "y" ? De : Oe, v = o.rects.reference[d] + o.rects.reference[p] -
    l[p] - o.rects.popper[d], I = l[p] - o.rects.reference[p], C = gt(r), b = C ? p === "y" ? C.clientHeight || 0 : C.clientWidth || 0 : 0, x = v /
    2 - I / 2, g = m[y], w = b - f[d] - m[h], T = b / 2 - f[d] / 2 + x, _ = yo(g, T, w), k = p;
    o.modifiersData[i] = (t = {}, t[k] = _, t.centerOffset = _ - T, t);
  }
}
s(Bb, "arrow");
function Hb(e) {
  var t = e.state, o = e.options, i = o.element, n = i === void 0 ? "[data-popper-arrow]" : i;
  n != null && (typeof n == "string" && (n = t.elements.popper.querySelector(n), !n) || pr(t.elements.popper, n) && (t.elements.arrow = n));
}
s(Hb, "effect");
var mf = {
  name: "arrow",
  enabled: !0,
  phase: "main",
  fn: Bb,
  effect: Hb,
  requires: ["popperOffsets"],
  requiresIfExists: ["preventOverflow"]
};

// ../node_modules/@popperjs/core/lib/utils/getVariation.js
function it(e) {
  return e.split("-")[1];
}
s(it, "getVariation");

// ../node_modules/@popperjs/core/lib/modifiers/computeStyles.js
var Rb = {
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto"
};
function zb(e, t) {
  var o = e.x, i = e.y, n = t.devicePixelRatio || 1;
  return {
    x: Pt(o * n) / n || 0,
    y: Pt(i * n) / n || 0
  };
}
s(zb, "roundOffsetsByDPR");
function hf(e) {
  var t, o = e.popper, i = e.popperRect, n = e.placement, r = e.variation, l = e.offsets, u = e.position, p = e.gpuAcceleration, c = e.adaptive,
  d = e.roundOffsets, m = e.isFixed, f = l.x, y = f === void 0 ? 0 : f, h = l.y, v = h === void 0 ? 0 : h, I = typeof d == "function" ? d({
    x: y,
    y: v
  }) : {
    x: y,
    y: v
  };
  y = I.x, v = I.y;
  var C = l.hasOwnProperty("x"), b = l.hasOwnProperty("y"), x = Ce, g = Ie, w = window;
  if (c) {
    var T = gt(o), _ = "clientHeight", k = "clientWidth";
    if (T === ye(o) && (T = ze(o), Ke(T).position !== "static" && u === "absolute" && (_ = "scrollHeight", k = "scrollWidth")), T = T, n ===
    Ie || (n === Ce || n === Oe) && r === fo) {
      g = De;
      var E = m && T === w && w.visualViewport ? w.visualViewport.height : (
        // $FlowFixMe[prop-missing]
        T[_]
      );
      v -= E - i.height, v *= p ? 1 : -1;
    }
    if (n === Ce || (n === Ie || n === De) && r === fo) {
      x = Oe;
      var O = m && T === w && w.visualViewport ? w.visualViewport.width : (
        // $FlowFixMe[prop-missing]
        T[k]
      );
      y -= O - i.width, y *= p ? 1 : -1;
    }
  }
  var P = Object.assign({
    position: u
  }, c && Rb), A = d === !0 ? zb({
    x: y,
    y: v
  }, ye(o)) : {
    x: y,
    y: v
  };
  if (y = A.x, v = A.y, p) {
    var D;
    return Object.assign({}, P, (D = {}, D[g] = b ? "0" : "", D[x] = C ? "0" : "", D.transform = (w.devicePixelRatio || 1) <= 1 ? "translate\
(" + y + "px, " + v + "px)" : "translate3d(" + y + "px, " + v + "px, 0)", D));
  }
  return Object.assign({}, P, (t = {}, t[g] = b ? v + "px" : "", t[x] = C ? y + "px" : "", t.transform = "", t));
}
s(hf, "mapToStyles");
function Wb(e) {
  var t = e.state, o = e.options, i = o.gpuAcceleration, n = i === void 0 ? !0 : i, r = o.adaptive, l = r === void 0 ? !0 : r, u = o.roundOffsets,
  p = u === void 0 ? !0 : u, c = {
    placement: He(t.placement),
    variation: it(t.placement),
    popper: t.elements.popper,
    popperRect: t.rects.popper,
    gpuAcceleration: n,
    isFixed: t.options.strategy === "fixed"
  };
  t.modifiersData.popperOffsets != null && (t.styles.popper = Object.assign({}, t.styles.popper, hf(Object.assign({}, c, {
    offsets: t.modifiersData.popperOffsets,
    position: t.options.strategy,
    adaptive: l,
    roundOffsets: p
  })))), t.modifiersData.arrow != null && (t.styles.arrow = Object.assign({}, t.styles.arrow, hf(Object.assign({}, c, {
    offsets: t.modifiersData.arrow,
    position: "absolute",
    adaptive: !1,
    roundOffsets: p
  })))), t.attributes.popper = Object.assign({}, t.attributes.popper, {
    "data-popper-placement": t.placement
  });
}
s(Wb, "computeStyles");
var gf = {
  name: "computeStyles",
  enabled: !0,
  phase: "beforeWrite",
  fn: Wb,
  data: {}
};

// ../node_modules/@popperjs/core/lib/modifiers/eventListeners.js
var Wn = {
  passive: !0
};
function jb(e) {
  var t = e.state, o = e.instance, i = e.options, n = i.scroll, r = n === void 0 ? !0 : n, l = i.resize, u = l === void 0 ? !0 : l, p = ye(t.
  elements.popper), c = [].concat(t.scrollParents.reference, t.scrollParents.popper);
  return r && c.forEach(function(d) {
    d.addEventListener("scroll", o.update, Wn);
  }), u && p.addEventListener("resize", o.update, Wn), function() {
    r && c.forEach(function(d) {
      d.removeEventListener("scroll", o.update, Wn);
    }), u && p.removeEventListener("resize", o.update, Wn);
  };
}
s(jb, "effect");
var yf = {
  name: "eventListeners",
  enabled: !0,
  phase: "write",
  fn: /* @__PURE__ */ s(function() {
  }, "fn"),
  effect: jb,
  data: {}
};

// ../node_modules/@popperjs/core/lib/utils/getOppositePlacement.js
var Vb = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
function jo(e) {
  return e.replace(/left|right|bottom|top/g, function(t) {
    return Vb[t];
  });
}
s(jo, "getOppositePlacement");

// ../node_modules/@popperjs/core/lib/utils/getOppositeVariationPlacement.js
var $b = {
  start: "end",
  end: "start"
};
function jn(e) {
  return e.replace(/start|end/g, function(t) {
    return $b[t];
  });
}
s(jn, "getOppositeVariationPlacement");

// ../node_modules/@popperjs/core/lib/dom-utils/getWindowScroll.js
function vo(e) {
  var t = ye(e), o = t.pageXOffset, i = t.pageYOffset;
  return {
    scrollLeft: o,
    scrollTop: i
  };
}
s(vo, "getWindowScroll");

// ../node_modules/@popperjs/core/lib/dom-utils/getWindowScrollBarX.js
function bo(e) {
  return nt(ze(e)).left + vo(e).scrollLeft;
}
s(bo, "getWindowScrollBarX");

// ../node_modules/@popperjs/core/lib/dom-utils/getViewportRect.js
function Us(e, t) {
  var o = ye(e), i = ze(e), n = o.visualViewport, r = i.clientWidth, l = i.clientHeight, u = 0, p = 0;
  if (n) {
    r = n.width, l = n.height;
    var c = ur();
    (c || !c && t === "fixed") && (u = n.offsetLeft, p = n.offsetTop);
  }
  return {
    width: r,
    height: l,
    x: u + bo(e),
    y: p
  };
}
s(Us, "getViewportRect");

// ../node_modules/@popperjs/core/lib/dom-utils/getDocumentRect.js
function qs(e) {
  var t, o = ze(e), i = vo(e), n = (t = e.ownerDocument) == null ? void 0 : t.body, r = ht(o.scrollWidth, o.clientWidth, n ? n.scrollWidth :
  0, n ? n.clientWidth : 0), l = ht(o.scrollHeight, o.clientHeight, n ? n.scrollHeight : 0, n ? n.clientHeight : 0), u = -i.scrollLeft + bo(
  e), p = -i.scrollTop;
  return Ke(n || o).direction === "rtl" && (u += ht(o.clientWidth, n ? n.clientWidth : 0) - r), {
    width: r,
    height: l,
    x: u,
    y: p
  };
}
s(qs, "getDocumentRect");

// ../node_modules/@popperjs/core/lib/dom-utils/isScrollParent.js
function xo(e) {
  var t = Ke(e), o = t.overflow, i = t.overflowX, n = t.overflowY;
  return /auto|scroll|overlay|hidden/.test(o + n + i);
}
s(xo, "isScrollParent");

// ../node_modules/@popperjs/core/lib/dom-utils/getScrollParent.js
function Vn(e) {
  return ["html", "body", "#document"].indexOf(Be(e)) >= 0 ? e.ownerDocument.body : Me(e) && xo(e) ? e : Vn(At(e));
}
s(Vn, "getScrollParent");

// ../node_modules/@popperjs/core/lib/dom-utils/listScrollParents.js
function jt(e, t) {
  var o;
  t === void 0 && (t = []);
  var i = Vn(e), n = i === ((o = e.ownerDocument) == null ? void 0 : o.body), r = ye(i), l = n ? [r].concat(r.visualViewport || [], xo(i) ? i :
  []) : i, u = t.concat(l);
  return n ? u : (
    // $FlowFixMe[incompatible-call]: isBody tells us target will be an HTMLElement here
    u.concat(jt(At(l)))
  );
}
s(jt, "listScrollParents");

// ../node_modules/@popperjs/core/lib/utils/rectToClientRect.js
function Vo(e) {
  return Object.assign({}, e, {
    left: e.x,
    top: e.y,
    right: e.x + e.width,
    bottom: e.y + e.height
  });
}
s(Vo, "rectToClientRect");

// ../node_modules/@popperjs/core/lib/dom-utils/getClippingRect.js
function Kb(e, t) {
  var o = nt(e, !1, t === "fixed");
  return o.top = o.top + e.clientTop, o.left = o.left + e.clientLeft, o.bottom = o.top + e.clientHeight, o.right = o.left + e.clientWidth, o.
  width = e.clientWidth, o.height = e.clientHeight, o.x = o.left, o.y = o.top, o;
}
s(Kb, "getInnerBoundingClientRect");
function vf(e, t, o) {
  return t === Rn ? Vo(Us(e, o)) : rt(t) ? Kb(t, o) : Vo(qs(ze(e)));
}
s(vf, "getClientRectFromMixedType");
function Ub(e) {
  var t = jt(At(e)), o = ["absolute", "fixed"].indexOf(Ke(e).position) >= 0, i = o && Me(e) ? gt(e) : e;
  return rt(i) ? t.filter(function(n) {
    return rt(n) && pr(n, i) && Be(n) !== "body";
  }) : [];
}
s(Ub, "getClippingParents");
function Gs(e, t, o, i) {
  var n = t === "clippingParents" ? Ub(e) : [].concat(t), r = [].concat(n, [o]), l = r[0], u = r.reduce(function(p, c) {
    var d = vf(e, c, i);
    return p.top = ht(d.top, p.top), p.right = mo(d.right, p.right), p.bottom = mo(d.bottom, p.bottom), p.left = ht(d.left, p.left), p;
  }, vf(e, l, i));
  return u.width = u.right - u.left, u.height = u.bottom - u.top, u.x = u.left, u.y = u.top, u;
}
s(Gs, "getClippingRect");

// ../node_modules/@popperjs/core/lib/utils/computeOffsets.js
function mr(e) {
  var t = e.reference, o = e.element, i = e.placement, n = i ? He(i) : null, r = i ? it(i) : null, l = t.x + t.width / 2 - o.width / 2, u = t.
  y + t.height / 2 - o.height / 2, p;
  switch (n) {
    case Ie:
      p = {
        x: l,
        y: t.y - o.height
      };
      break;
    case De:
      p = {
        x: l,
        y: t.y + t.height
      };
      break;
    case Oe:
      p = {
        x: t.x + t.width,
        y: u
      };
      break;
    case Ce:
      p = {
        x: t.x - o.width,
        y: u
      };
      break;
    default:
      p = {
        x: t.x,
        y: t.y
      };
  }
  var c = n ? go(n) : null;
  if (c != null) {
    var d = c === "y" ? "height" : "width";
    switch (r) {
      case Ot:
        p[c] = p[c] - (t[d] / 2 - o[d] / 2);
        break;
      case fo:
        p[c] = p[c] + (t[d] / 2 - o[d] / 2);
        break;
      default:
    }
  }
  return p;
}
s(mr, "computeOffsets");

// ../node_modules/@popperjs/core/lib/utils/detectOverflow.js
function yt(e, t) {
  t === void 0 && (t = {});
  var o = t, i = o.placement, n = i === void 0 ? e.placement : i, r = o.strategy, l = r === void 0 ? e.strategy : r, u = o.boundary, p = u ===
  void 0 ? lf : u, c = o.rootBoundary, d = c === void 0 ? Rn : c, m = o.elementContext, f = m === void 0 ? Ro : m, y = o.altBoundary, h = y ===
  void 0 ? !1 : y, v = o.padding, I = v === void 0 ? 0 : v, C = dr(typeof I != "number" ? I : fr(I, Wt)), b = f === Ro ? uf : Ro, x = e.rects.
  popper, g = e.elements[h ? b : f], w = Gs(rt(g) ? g : g.contextElement || ze(e.elements.popper), p, d, l), T = nt(e.elements.reference), _ = mr(
  {
    reference: T,
    element: x,
    strategy: "absolute",
    placement: n
  }), k = Vo(Object.assign({}, x, _)), E = f === Ro ? k : T, O = {
    top: w.top - E.top + C.top,
    bottom: E.bottom - w.bottom + C.bottom,
    left: w.left - E.left + C.left,
    right: E.right - w.right + C.right
  }, P = e.modifiersData.offset;
  if (f === Ro && P) {
    var A = P[n];
    Object.keys(O).forEach(function(D) {
      var L = [Oe, De].indexOf(D) >= 0 ? 1 : -1, B = [Ie, De].indexOf(D) >= 0 ? "y" : "x";
      O[D] += A[B] * L;
    });
  }
  return O;
}
s(yt, "detectOverflow");

// ../node_modules/@popperjs/core/lib/utils/computeAutoPlacement.js
function Ys(e, t) {
  t === void 0 && (t = {});
  var o = t, i = o.placement, n = o.boundary, r = o.rootBoundary, l = o.padding, u = o.flipVariations, p = o.allowedAutoPlacements, c = p ===
  void 0 ? zn : p, d = it(i), m = d ? u ? $s : $s.filter(function(h) {
    return it(h) === d;
  }) : Wt, f = m.filter(function(h) {
    return c.indexOf(h) >= 0;
  });
  f.length === 0 && (f = m);
  var y = f.reduce(function(h, v) {
    return h[v] = yt(e, {
      placement: v,
      boundary: n,
      rootBoundary: r,
      padding: l
    })[He(v)], h;
  }, {});
  return Object.keys(y).sort(function(h, v) {
    return y[h] - y[v];
  });
}
s(Ys, "computeAutoPlacement");

// ../node_modules/@popperjs/core/lib/modifiers/flip.js
function qb(e) {
  if (He(e) === Hn)
    return [];
  var t = jo(e);
  return [jn(e), t, jn(t)];
}
s(qb, "getExpandedFallbackPlacements");
function Gb(e) {
  var t = e.state, o = e.options, i = e.name;
  if (!t.modifiersData[i]._skip) {
    for (var n = o.mainAxis, r = n === void 0 ? !0 : n, l = o.altAxis, u = l === void 0 ? !0 : l, p = o.fallbackPlacements, c = o.padding, d = o.
    boundary, m = o.rootBoundary, f = o.altBoundary, y = o.flipVariations, h = y === void 0 ? !0 : y, v = o.allowedAutoPlacements, I = t.options.
    placement, C = He(I), b = C === I, x = p || (b || !h ? [jo(I)] : qb(I)), g = [I].concat(x).reduce(function(F, $) {
      return F.concat(He($) === Hn ? Ys(t, {
        placement: $,
        boundary: d,
        rootBoundary: m,
        padding: c,
        flipVariations: h,
        allowedAutoPlacements: v
      }) : $);
    }, []), w = t.rects.reference, T = t.rects.popper, _ = /* @__PURE__ */ new Map(), k = !0, E = g[0], O = 0; O < g.length; O++) {
      var P = g[O], A = He(P), D = it(P) === Ot, L = [Ie, De].indexOf(A) >= 0, B = L ? "width" : "height", N = yt(t, {
        placement: P,
        boundary: d,
        rootBoundary: m,
        altBoundary: f,
        padding: c
      }), V = L ? D ? Oe : Ce : D ? De : Ie;
      w[B] > T[B] && (V = jo(V));
      var R = jo(V), K = [];
      if (r && K.push(N[A] <= 0), u && K.push(N[V] <= 0, N[R] <= 0), K.every(function(F) {
        return F;
      })) {
        E = P, k = !1;
        break;
      }
      _.set(P, K);
    }
    if (k)
      for (var W = h ? 3 : 1, ee = /* @__PURE__ */ s(function($) {
        var X = g.find(function(oe) {
          var J = _.get(oe);
          if (J)
            return J.slice(0, $).every(function(ae) {
              return ae;
            });
        });
        if (X)
          return E = X, "break";
      }, "_loop"), H = W; H > 0; H--) {
        var j = ee(H);
        if (j === "break") break;
      }
    t.placement !== E && (t.modifiersData[i]._skip = !0, t.placement = E, t.reset = !0);
  }
}
s(Gb, "flip");
var bf = {
  name: "flip",
  enabled: !0,
  phase: "main",
  fn: Gb,
  requiresIfExists: ["offset"],
  data: {
    _skip: !1
  }
};

// ../node_modules/@popperjs/core/lib/modifiers/hide.js
function xf(e, t, o) {
  return o === void 0 && (o = {
    x: 0,
    y: 0
  }), {
    top: e.top - t.height - o.y,
    right: e.right - t.width + o.x,
    bottom: e.bottom - t.height + o.y,
    left: e.left - t.width - o.x
  };
}
s(xf, "getSideOffsets");
function If(e) {
  return [Ie, Oe, De, Ce].some(function(t) {
    return e[t] >= 0;
  });
}
s(If, "isAnySideFullyClipped");
function Yb(e) {
  var t = e.state, o = e.name, i = t.rects.reference, n = t.rects.popper, r = t.modifiersData.preventOverflow, l = yt(t, {
    elementContext: "reference"
  }), u = yt(t, {
    altBoundary: !0
  }), p = xf(l, i), c = xf(u, n, r), d = If(p), m = If(c);
  t.modifiersData[o] = {
    referenceClippingOffsets: p,
    popperEscapeOffsets: c,
    isReferenceHidden: d,
    hasPopperEscaped: m
  }, t.attributes.popper = Object.assign({}, t.attributes.popper, {
    "data-popper-reference-hidden": d,
    "data-popper-escaped": m
  });
}
s(Yb, "hide");
var Sf = {
  name: "hide",
  enabled: !0,
  phase: "main",
  requiresIfExists: ["preventOverflow"],
  fn: Yb
};

// ../node_modules/@popperjs/core/lib/modifiers/offset.js
function Xb(e, t, o) {
  var i = He(e), n = [Ce, Ie].indexOf(i) >= 0 ? -1 : 1, r = typeof o == "function" ? o(Object.assign({}, t, {
    placement: e
  })) : o, l = r[0], u = r[1];
  return l = l || 0, u = (u || 0) * n, [Ce, Oe].indexOf(i) >= 0 ? {
    x: u,
    y: l
  } : {
    x: l,
    y: u
  };
}
s(Xb, "distanceAndSkiddingToXY");
function Qb(e) {
  var t = e.state, o = e.options, i = e.name, n = o.offset, r = n === void 0 ? [0, 0] : n, l = zn.reduce(function(d, m) {
    return d[m] = Xb(m, t.rects, r), d;
  }, {}), u = l[t.placement], p = u.x, c = u.y;
  t.modifiersData.popperOffsets != null && (t.modifiersData.popperOffsets.x += p, t.modifiersData.popperOffsets.y += c), t.modifiersData[i] =
  l;
}
s(Qb, "offset");
var wf = {
  name: "offset",
  enabled: !0,
  phase: "main",
  requires: ["popperOffsets"],
  fn: Qb
};

// ../node_modules/@popperjs/core/lib/modifiers/popperOffsets.js
function Zb(e) {
  var t = e.state, o = e.name;
  t.modifiersData[o] = mr({
    reference: t.rects.reference,
    element: t.rects.popper,
    strategy: "absolute",
    placement: t.placement
  });
}
s(Zb, "popperOffsets");
var Ef = {
  name: "popperOffsets",
  enabled: !0,
  phase: "read",
  fn: Zb,
  data: {}
};

// ../node_modules/@popperjs/core/lib/utils/getAltAxis.js
function Xs(e) {
  return e === "x" ? "y" : "x";
}
s(Xs, "getAltAxis");

// ../node_modules/@popperjs/core/lib/modifiers/preventOverflow.js
function Jb(e) {
  var t = e.state, o = e.options, i = e.name, n = o.mainAxis, r = n === void 0 ? !0 : n, l = o.altAxis, u = l === void 0 ? !1 : l, p = o.boundary,
  c = o.rootBoundary, d = o.altBoundary, m = o.padding, f = o.tether, y = f === void 0 ? !0 : f, h = o.tetherOffset, v = h === void 0 ? 0 : h,
  I = yt(t, {
    boundary: p,
    rootBoundary: c,
    padding: m,
    altBoundary: d
  }), C = He(t.placement), b = it(t.placement), x = !b, g = go(C), w = Xs(g), T = t.modifiersData.popperOffsets, _ = t.rects.reference, k = t.
  rects.popper, E = typeof v == "function" ? v(Object.assign({}, t.rects, {
    placement: t.placement
  })) : v, O = typeof E == "number" ? {
    mainAxis: E,
    altAxis: E
  } : Object.assign({
    mainAxis: 0,
    altAxis: 0
  }, E), P = t.modifiersData.offset ? t.modifiersData.offset[t.placement] : null, A = {
    x: 0,
    y: 0
  };
  if (T) {
    if (r) {
      var D, L = g === "y" ? Ie : Ce, B = g === "y" ? De : Oe, N = g === "y" ? "height" : "width", V = T[g], R = V + I[L], K = V - I[B], W = y ?
      -k[N] / 2 : 0, ee = b === Ot ? _[N] : k[N], H = b === Ot ? -k[N] : -_[N], j = t.elements.arrow, F = y && j ? ho(j) : {
        width: 0,
        height: 0
      }, $ = t.modifiersData["arrow#persistent"] ? t.modifiersData["arrow#persistent"].padding : cr(), X = $[L], oe = $[B], J = yo(0, _[N], F[N]),
      ae = x ? _[N] / 2 - W - J - X - O.mainAxis : ee - J - X - O.mainAxis, ie = x ? -_[N] / 2 + W + J + oe + O.mainAxis : H + J + oe + O.mainAxis,
      se = t.elements.arrow && gt(t.elements.arrow), le = se ? g === "y" ? se.clientTop || 0 : se.clientLeft || 0 : 0, ve = (D = P?.[g]) != null ?
      D : 0, he = V + ae - ve - le, Pe = V + ie - ve, ue = yo(y ? mo(R, he) : R, V, y ? ht(K, Pe) : K);
      T[g] = ue, A[g] = ue - V;
    }
    if (u) {
      var be, Te = g === "x" ? Ie : Ce, Re = g === "x" ? De : Oe, Le = T[w], Se = w === "y" ? "height" : "width", Ue = Le + I[Te], Dt = Le -
      I[Re], Mt = [Ie, Ce].indexOf(C) !== -1, at = (be = P?.[w]) != null ? be : 0, vt = Mt ? Ue : Le - _[Se] - k[Se] - at + O.altAxis, lt = Mt ?
      Le + _[Se] + k[Se] - at - O.altAxis : Dt, qe = y && Mt ? ff(vt, Le, lt) : yo(y ? vt : Ue, Le, y ? lt : Dt);
      T[w] = qe, A[w] = qe - Le;
    }
    t.modifiersData[i] = A;
  }
}
s(Jb, "preventOverflow");
var Cf = {
  name: "preventOverflow",
  enabled: !0,
  phase: "main",
  fn: Jb,
  requiresIfExists: ["offset"]
};

// ../node_modules/@popperjs/core/lib/dom-utils/getHTMLElementScroll.js
function Qs(e) {
  return {
    scrollLeft: e.scrollLeft,
    scrollTop: e.scrollTop
  };
}
s(Qs, "getHTMLElementScroll");

// ../node_modules/@popperjs/core/lib/dom-utils/getNodeScroll.js
function Zs(e) {
  return e === ye(e) || !Me(e) ? vo(e) : Qs(e);
}
s(Zs, "getNodeScroll");

// ../node_modules/@popperjs/core/lib/dom-utils/getCompositeRect.js
function e0(e) {
  var t = e.getBoundingClientRect(), o = Pt(t.width) / e.offsetWidth || 1, i = Pt(t.height) / e.offsetHeight || 1;
  return o !== 1 || i !== 1;
}
s(e0, "isElementScaled");
function Js(e, t, o) {
  o === void 0 && (o = !1);
  var i = Me(t), n = Me(t) && e0(t), r = ze(t), l = nt(e, n, o), u = {
    scrollLeft: 0,
    scrollTop: 0
  }, p = {
    x: 0,
    y: 0
  };
  return (i || !i && !o) && ((Be(t) !== "body" || // https://github.com/popperjs/popper-core/issues/1078
  xo(r)) && (u = Zs(t)), Me(t) ? (p = nt(t, !0), p.x += t.clientLeft, p.y += t.clientTop) : r && (p.x = bo(r))), {
    x: l.left + u.scrollLeft - p.x,
    y: l.top + u.scrollTop - p.y,
    width: l.width,
    height: l.height
  };
}
s(Js, "getCompositeRect");

// ../node_modules/@popperjs/core/lib/utils/orderModifiers.js
function t0(e) {
  var t = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Set(), i = [];
  e.forEach(function(r) {
    t.set(r.name, r);
  });
  function n(r) {
    o.add(r.name);
    var l = [].concat(r.requires || [], r.requiresIfExists || []);
    l.forEach(function(u) {
      if (!o.has(u)) {
        var p = t.get(u);
        p && n(p);
      }
    }), i.push(r);
  }
  return s(n, "sort"), e.forEach(function(r) {
    o.has(r.name) || n(r);
  }), i;
}
s(t0, "order");
function ea(e) {
  var t = t0(e);
  return pf.reduce(function(o, i) {
    return o.concat(t.filter(function(n) {
      return n.phase === i;
    }));
  }, []);
}
s(ea, "orderModifiers");

// ../node_modules/@popperjs/core/lib/utils/debounce.js
function ta(e) {
  var t;
  return function() {
    return t || (t = new Promise(function(o) {
      Promise.resolve().then(function() {
        t = void 0, o(e());
      });
    })), t;
  };
}
s(ta, "debounce");

// ../node_modules/@popperjs/core/lib/utils/mergeByName.js
function oa(e) {
  var t = e.reduce(function(o, i) {
    var n = o[i.name];
    return o[i.name] = n ? Object.assign({}, n, i, {
      options: Object.assign({}, n.options, i.options),
      data: Object.assign({}, n.data, i.data)
    }) : i, o;
  }, {});
  return Object.keys(t).map(function(o) {
    return t[o];
  });
}
s(oa, "mergeByName");

// ../node_modules/@popperjs/core/lib/createPopper.js
var Tf = {
  placement: "bottom",
  modifiers: [],
  strategy: "absolute"
};
function _f() {
  for (var e = arguments.length, t = new Array(e), o = 0; o < e; o++)
    t[o] = arguments[o];
  return !t.some(function(i) {
    return !(i && typeof i.getBoundingClientRect == "function");
  });
}
s(_f, "areValidElements");
function kf(e) {
  e === void 0 && (e = {});
  var t = e, o = t.defaultModifiers, i = o === void 0 ? [] : o, n = t.defaultOptions, r = n === void 0 ? Tf : n;
  return /* @__PURE__ */ s(function(u, p, c) {
    c === void 0 && (c = r);
    var d = {
      placement: "bottom",
      orderedModifiers: [],
      options: Object.assign({}, Tf, r),
      modifiersData: {},
      elements: {
        reference: u,
        popper: p
      },
      attributes: {},
      styles: {}
    }, m = [], f = !1, y = {
      state: d,
      setOptions: /* @__PURE__ */ s(function(C) {
        var b = typeof C == "function" ? C(d.options) : C;
        v(), d.options = Object.assign({}, r, d.options, b), d.scrollParents = {
          reference: rt(u) ? jt(u) : u.contextElement ? jt(u.contextElement) : [],
          popper: jt(p)
        };
        var x = ea(oa([].concat(i, d.options.modifiers)));
        return d.orderedModifiers = x.filter(function(g) {
          return g.enabled;
        }), h(), y.update();
      }, "setOptions"),
      // Sync update – it will always be executed, even if not necessary. This
      // is useful for low frequency updates where sync behavior simplifies the
      // logic.
      // For high frequency updates (e.g. `resize` and `scroll` events), always
      // prefer the async Popper#update method
      forceUpdate: /* @__PURE__ */ s(function() {
        if (!f) {
          var C = d.elements, b = C.reference, x = C.popper;
          if (_f(b, x)) {
            d.rects = {
              reference: Js(b, gt(x), d.options.strategy === "fixed"),
              popper: ho(x)
            }, d.reset = !1, d.placement = d.options.placement, d.orderedModifiers.forEach(function(O) {
              return d.modifiersData[O.name] = Object.assign({}, O.data);
            });
            for (var g = 0; g < d.orderedModifiers.length; g++) {
              if (d.reset === !0) {
                d.reset = !1, g = -1;
                continue;
              }
              var w = d.orderedModifiers[g], T = w.fn, _ = w.options, k = _ === void 0 ? {} : _, E = w.name;
              typeof T == "function" && (d = T({
                state: d,
                options: k,
                name: E,
                instance: y
              }) || d);
            }
          }
        }
      }, "forceUpdate"),
      // Async and optimistically optimized update – it will not be executed if
      // not necessary (debounced to run at most once-per-tick)
      update: ta(function() {
        return new Promise(function(I) {
          y.forceUpdate(), I(d);
        });
      }),
      destroy: /* @__PURE__ */ s(function() {
        v(), f = !0;
      }, "destroy")
    };
    if (!_f(u, p))
      return y;
    y.setOptions(c).then(function(I) {
      !f && c.onFirstUpdate && c.onFirstUpdate(I);
    });
    function h() {
      d.orderedModifiers.forEach(function(I) {
        var C = I.name, b = I.options, x = b === void 0 ? {} : b, g = I.effect;
        if (typeof g == "function") {
          var w = g({
            state: d,
            name: C,
            instance: y,
            options: x
          }), T = /* @__PURE__ */ s(function() {
          }, "noopFn");
          m.push(w || T);
        }
      });
    }
    s(h, "runModifierEffects");
    function v() {
      m.forEach(function(I) {
        return I();
      }), m = [];
    }
    return s(v, "cleanupModifierEffects"), y;
  }, "createPopper");
}
s(kf, "popperGenerator");

// ../node_modules/@popperjs/core/lib/popper.js
var o0 = [yf, Ef, gf, cf, wf, bf, Cf, mf, Sf], ra = /* @__PURE__ */ kf({
  defaultModifiers: o0
});

// ../node_modules/react-popper/lib/esm/usePopper.js
var Of = Ve(oi());
var r0 = [], na = /* @__PURE__ */ s(function(t, o, i) {
  i === void 0 && (i = {});
  var n = G(null), r = {
    onFirstUpdate: i.onFirstUpdate,
    placement: i.placement || "bottom",
    strategy: i.strategy || "absolute",
    modifiers: i.modifiers || r0
  }, l = U({
    styles: {
      popper: {
        position: r.strategy,
        left: "0",
        top: "0"
      },
      arrow: {
        position: "absolute"
      }
    },
    attributes: {}
  }), u = l[0], p = l[1], c = Y(function() {
    return {
      name: "updateState",
      enabled: !0,
      phase: "write",
      fn: /* @__PURE__ */ s(function(y) {
        var h = y.state, v = Object.keys(h.elements);
        Yt(function() {
          p({
            styles: js(v.map(function(I) {
              return [I, h.styles[I] || {}];
            })),
            attributes: js(v.map(function(I) {
              return [I, h.attributes[I]];
            }))
          });
        });
      }, "fn"),
      requires: ["computeStyles"]
    };
  }, []), d = Y(function() {
    var f = {
      onFirstUpdate: r.onFirstUpdate,
      placement: r.placement,
      strategy: r.strategy,
      modifiers: [].concat(r.modifiers, [c, {
        name: "applyStyles",
        enabled: !1
      }])
    };
    return (0, Of.default)(n.current, f) ? n.current || f : (n.current = f, f);
  }, [r.onFirstUpdate, r.placement, r.strategy, r.modifiers, c]), m = G();
  return Vs(function() {
    m.current && m.current.setOptions(d);
  }, [d]), Vs(function() {
    if (!(t == null || o == null)) {
      var f = i.createPopper || ra, y = f(t, o, d);
      return m.current = y, function() {
        y.destroy(), m.current = null;
      };
    }
  }, [t, o, i.createPopper]), {
    state: m.current ? m.current.state : null,
    styles: u.styles,
    attributes: u.attributes,
    update: m.current ? m.current.update : null,
    forceUpdate: m.current ? m.current.forceUpdate : null
  };
}, "usePopper");

// ../node_modules/react-popper-tooltip/dist/esm/react-popper-tooltip.js
function Df(e) {
  var t = G(e);
  return t.current = e, M(function() {
    return t.current;
  }, []);
}
s(Df, "useGetLatest");
var n0 = /* @__PURE__ */ s(function() {
}, "noop");
function i0(e) {
  var t = e.initial, o = e.value, i = e.onChange, n = i === void 0 ? n0 : i;
  if (t === void 0 && o === void 0)
    throw new TypeError('Either "value" or "initial" variable must be set. Now both are undefined');
  var r = U(t), l = r[0], u = r[1], p = Df(l), c = M(function(m) {
    var f = p(), y = typeof m == "function" ? m(f) : m;
    typeof y.persist == "function" && y.persist(), u(y), typeof n == "function" && n(y);
  }, [p, n]), d = o !== void 0;
  return [d ? o : l, d ? n : c];
}
s(i0, "useControlledState");
function Mf(e, t) {
  return e === void 0 && (e = 0), t === void 0 && (t = 0), function() {
    return {
      width: 0,
      height: 0,
      top: t,
      right: e,
      bottom: t,
      left: e,
      x: 0,
      y: 0,
      toJSON: /* @__PURE__ */ s(function() {
        return null;
      }, "toJSON")
    };
  };
}
s(Mf, "generateBoundingClientRect");
var s0 = ["styles", "attributes"], Pf = {
  getBoundingClientRect: Mf()
}, Af = {
  closeOnOutsideClick: !0,
  closeOnTriggerHidden: !1,
  defaultVisible: !1,
  delayHide: 0,
  delayShow: 0,
  followCursor: !1,
  interactive: !1,
  mutationObserverOptions: {
    attributes: !0,
    childList: !0,
    subtree: !0
  },
  offset: [0, 6],
  trigger: "hover"
};
function Lf(e, t) {
  var o, i, n;
  e === void 0 && (e = {}), t === void 0 && (t = {});
  var r = Object.keys(Af).reduce(function(B, N) {
    var V;
    return q({}, B, (V = {}, V[N] = B[N] !== void 0 ? B[N] : Af[N], V));
  }, e), l = Y(
    function() {
      return [{
        name: "offset",
        options: {
          offset: r.offset
        }
      }];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Array.isArray(r.offset) ? r.offset : []
  ), u = q({}, t, {
    placement: t.placement || r.placement,
    modifiers: t.modifiers || l
  }), p = U(null), c = p[0], d = p[1], m = U(null), f = m[0], y = m[1], h = i0({
    initial: r.defaultVisible,
    value: r.visible,
    onChange: r.onVisibleChange
  }), v = h[0], I = h[1], C = G();
  z(function() {
    return function() {
      return clearTimeout(C.current);
    };
  }, []);
  var b = na(r.followCursor ? Pf : c, f, u), x = b.styles, g = b.attributes, w = ke(b, s0), T = w.update, _ = Df({
    visible: v,
    triggerRef: c,
    tooltipRef: f,
    finalConfig: r
  }), k = M(
    function(B) {
      return Array.isArray(r.trigger) ? r.trigger.includes(B) : r.trigger === B;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Array.isArray(r.trigger) ? r.trigger : [r.trigger]
  ), E = M(function() {
    clearTimeout(C.current), C.current = window.setTimeout(function() {
      return I(!1);
    }, r.delayHide);
  }, [r.delayHide, I]), O = M(function() {
    clearTimeout(C.current), C.current = window.setTimeout(function() {
      return I(!0);
    }, r.delayShow);
  }, [r.delayShow, I]), P = M(function() {
    _().visible ? E() : O();
  }, [_, E, O]);
  z(function() {
    if (_().finalConfig.closeOnOutsideClick) {
      var B = /* @__PURE__ */ s(function(V) {
        var R, K = _(), W = K.tooltipRef, ee = K.triggerRef, H = (V.composedPath == null || (R = V.composedPath()) == null ? void 0 : R[0]) ||
        V.target;
        H instanceof Node && W != null && ee != null && !W.contains(H) && !ee.contains(H) && E();
      }, "handleClickOutside");
      return document.addEventListener("mousedown", B), function() {
        return document.removeEventListener("mousedown", B);
      };
    }
  }, [_, E]), z(function() {
    if (!(c == null || !k("click")))
      return c.addEventListener("click", P), function() {
        return c.removeEventListener("click", P);
      };
  }, [c, k, P]), z(function() {
    if (!(c == null || !k("double-click")))
      return c.addEventListener("dblclick", P), function() {
        return c.removeEventListener("dblclick", P);
      };
  }, [c, k, P]), z(function() {
    if (!(c == null || !k("right-click"))) {
      var B = /* @__PURE__ */ s(function(V) {
        V.preventDefault(), P();
      }, "preventDefaultAndToggle");
      return c.addEventListener("contextmenu", B), function() {
        return c.removeEventListener("contextmenu", B);
      };
    }
  }, [c, k, P]), z(function() {
    if (!(c == null || !k("focus")))
      return c.addEventListener("focus", O), c.addEventListener("blur", E), function() {
        c.removeEventListener("focus", O), c.removeEventListener("blur", E);
      };
  }, [c, k, O, E]), z(function() {
    if (!(c == null || !k("hover")))
      return c.addEventListener("mouseenter", O), c.addEventListener("mouseleave", E), function() {
        c.removeEventListener("mouseenter", O), c.removeEventListener("mouseleave", E);
      };
  }, [c, k, O, E]), z(function() {
    if (!(f == null || !k("hover") || !_().finalConfig.interactive))
      return f.addEventListener("mouseenter", O), f.addEventListener("mouseleave", E), function() {
        f.removeEventListener("mouseenter", O), f.removeEventListener("mouseleave", E);
      };
  }, [f, k, O, E, _]);
  var A = w == null || (o = w.state) == null || (i = o.modifiersData) == null || (n = i.hide) == null ? void 0 : n.isReferenceHidden;
  z(function() {
    r.closeOnTriggerHidden && A && E();
  }, [r.closeOnTriggerHidden, E, A]), z(function() {
    if (!r.followCursor || c == null) return;
    function B(N) {
      var V = N.clientX, R = N.clientY;
      Pf.getBoundingClientRect = Mf(V, R), T?.();
    }
    return s(B, "setMousePosition"), c.addEventListener("mousemove", B), function() {
      return c.removeEventListener("mousemove", B);
    };
  }, [r.followCursor, c, T]), z(function() {
    if (!(f == null || T == null || r.mutationObserverOptions == null)) {
      var B = new MutationObserver(T);
      return B.observe(f, r.mutationObserverOptions), function() {
        return B.disconnect();
      };
    }
  }, [r.mutationObserverOptions, f, T]);
  var D = /* @__PURE__ */ s(function(N) {
    return N === void 0 && (N = {}), q({}, N, {
      style: q({}, N.style, x.popper)
    }, g.popper, {
      "data-popper-interactive": r.interactive
    });
  }, "getTooltipProps"), L = /* @__PURE__ */ s(function(N) {
    return N === void 0 && (N = {}), q({}, N, g.arrow, {
      style: q({}, N.style, x.arrow),
      "data-popper-arrow": !0
    });
  }, "getArrowProps");
  return q({
    getArrowProps: L,
    getTooltipProps: D,
    setTooltipRef: y,
    setTriggerRef: d,
    tooltipRef: f,
    triggerRef: c,
    visible: v
  }, w);
}
s(Lf, "usePopperTooltip");

// src/components/components/tooltip/Tooltip.tsx
var Nf = Ve(Zo(), 1), st = (0, Nf.default)(1e3)(
  (e, t, o, i = 0) => t.split("-")[0] === e ? o : i
), Vt = 8, a0 = S.div(
  {
    position: "absolute",
    borderStyle: "solid"
  },
  ({ placement: e }) => {
    let t = 0, o = 0;
    switch (!0) {
      case (e.startsWith("left") || e.startsWith("right")): {
        o = 8;
        break;
      }
      case (e.startsWith("top") || e.startsWith("bottom")): {
        t = 8;
        break;
      }
      default:
    }
    return { transform: `translate3d(${t}px, ${o}px, 0px)` };
  },
  ({ theme: e, color: t, placement: o }) => ({
    bottom: `${st("top", o, `${Vt * -1}px`, "auto")}`,
    top: `${st("bottom", o, `${Vt * -1}px`, "auto")}`,
    right: `${st("left", o, `${Vt * -1}px`, "auto")}`,
    left: `${st("right", o, `${Vt * -1}px`, "auto")}`,
    borderBottomWidth: `${st("top", o, "0", Vt)}px`,
    borderTopWidth: `${st("bottom", o, "0", Vt)}px`,
    borderRightWidth: `${st("left", o, "0", Vt)}px`,
    borderLeftWidth: `${st("right", o, "0", Vt)}px`,
    borderTopColor: st(
      "top",
      o,
      e.color[t] || t || e.base === "light" ? Co(e.background.app) : e.background.app,
      "transparent"
    ),
    borderBottomColor: st(
      "bottom",
      o,
      e.color[t] || t || e.base === "light" ? Co(e.background.app) : e.background.app,
      "transparent"
    ),
    borderLeftColor: st(
      "left",
      o,
      e.color[t] || t || e.base === "light" ? Co(e.background.app) : e.background.app,
      "transparent"
    ),
    borderRightColor: st(
      "right",
      o,
      e.color[t] || t || e.base === "light" ? Co(e.background.app) : e.background.app,
      "transparent"
    )
  })
), l0 = S.div(
  ({ hidden: e }) => ({
    display: e ? "none" : "inline-block",
    zIndex: 2147483647
  }),
  ({ theme: e, color: t, hasChrome: o }) => o ? {
    background: t && e.color[t] || t || e.base === "light" ? Co(e.background.app) : e.background.app,
    filter: `
            drop-shadow(0px 5px 5px rgba(0,0,0,0.05))
            drop-shadow(0 1px 3px rgba(0,0,0,0.1))
          `,
    borderRadius: e.appBorderRadius,
    fontSize: e.typography.size.s1
  } : {}
), ia = a.forwardRef(
  ({
    placement: e = "top",
    hasChrome: t = !0,
    children: o,
    arrowProps: i = {},
    tooltipRef: n,
    color: r,
    withArrows: l,
    ...u
  }, p) => /* @__PURE__ */ a.createElement(l0, { "data-testid": "tooltip", hasChrome: t, ref: p, ...u, color: r }, t && l && /* @__PURE__ */ a.
  createElement(a0, { placement: e, ...i, color: r }), o)
);
ia.displayName = "Tooltip";

// src/components/components/tooltip/WithTooltip.tsx
var { document: $n } = re, u0 = S.div`
  display: inline-block;
  cursor: ${(e) => (
  // @ts-expect-error (non strict)
  e.trigger === "hover" || e.trigger.includes("hover") ? "default" : "pointer"
)};
`, p0 = S.g`
  cursor: ${(e) => (
  // @ts-expect-error (non strict)
  e.trigger === "hover" || e.trigger.includes("hover") ? "default" : "pointer"
)};
`, c0 = /* @__PURE__ */ s(({
  svg: e = !1,
  trigger: t = "click",
  closeOnOutsideClick: o = !1,
  placement: i = "top",
  modifiers: n = [
    {
      name: "preventOverflow",
      options: {
        padding: 8
      }
    },
    {
      name: "offset",
      options: {
        offset: [8, 8]
      }
    },
    {
      name: "arrow",
      options: {
        padding: 8
      }
    }
  ],
  hasChrome: r = !0,
  defaultVisible: l = !1,
  withArrows: u,
  offset: p,
  tooltip: c,
  children: d,
  closeOnTriggerHidden: m,
  mutationObserverOptions: f,
  delayHide: y,
  visible: h,
  interactive: v,
  delayShow: I,
  strategy: C,
  followCursor: b,
  onVisibleChange: x,
  ...g
}) => {
  let w = e ? p0 : u0, {
    getArrowProps: T,
    getTooltipProps: _,
    setTooltipRef: k,
    setTriggerRef: E,
    visible: O,
    state: P
  } = Lf(
    {
      trigger: t,
      placement: i,
      defaultVisible: l,
      delayHide: y,
      interactive: v,
      closeOnOutsideClick: o,
      closeOnTriggerHidden: m,
      onVisibleChange: x,
      delayShow: I,
      followCursor: b,
      mutationObserverOptions: f,
      visible: h,
      offset: p
    },
    {
      modifiers: n,
      strategy: C
    }
  ), A = /* @__PURE__ */ a.createElement(
    ia,
    {
      placement: P?.placement,
      ref: k,
      hasChrome: r,
      arrowProps: T(),
      withArrows: u,
      ..._()
    },
    typeof c == "function" ? c({ onHide: /* @__PURE__ */ s(() => x(!1), "onHide") }) : c
  );
  return /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(w, { trigger: t, ref: E, ...g }, d), O && Gt.createPortal(
  A, $n.body));
}, "WithTooltipPure"), sa = /* @__PURE__ */ s(({
  startOpen: e = !1,
  onVisibleChange: t,
  ...o
}) => {
  let [i, n] = U(e), r = M(
    (l) => {
      t && t(l) === !1 || n(l);
    },
    [t]
  );
  return z(() => {
    let l = /* @__PURE__ */ s(() => r(!1), "hide");
    $n.addEventListener("keydown", l, !1);
    let u = Array.from($n.getElementsByTagName("iframe")), p = [];
    return u.forEach((c) => {
      let d = /* @__PURE__ */ s(() => {
        try {
          c.contentWindow.document && (c.contentWindow.document.addEventListener("click", l), p.push(() => {
            try {
              c.contentWindow.document.removeEventListener("click", l);
            } catch {
            }
          }));
        } catch {
        }
      }, "bind");
      d(), c.addEventListener("load", d), p.push(() => {
        c.removeEventListener("load", d);
      });
    }), () => {
      $n.removeEventListener("keydown", l), p.forEach((c) => {
        c();
      });
    };
  }), /* @__PURE__ */ a.createElement(c0, { ...o, visible: i, onVisibleChange: r });
}, "WithToolTipState");

// src/manager/components/sidebar/TestingModule.tsx
var aa = 500, d0 = Kt({
  "0%": { transform: "rotate(0deg)" },
  "10%": { transform: "rotate(10deg)" },
  "40%": { transform: "rotate(170deg)" },
  "50%": { transform: "rotate(180deg)" },
  "60%": { transform: "rotate(190deg)" },
  "90%": { transform: "rotate(350deg)" },
  "100%": { transform: "rotate(360deg)" }
}), f0 = S.div(
  ({ crashed: e, running: t, theme: o, failed: i }) => ({
    position: "relative",
    lineHeight: "20px",
    width: "100%",
    padding: 1,
    overflow: "hidden",
    background: `var(--sb-sidebar-bottom-card-background, ${o.background.content})`,
    borderRadius: `var(--sb-sidebar-bottom-card-border-radius, ${o.appBorderRadius + 1}px)`,
    boxShadow: `inset 0 0 0 1px ${e && !t ? o.color.negative : o.appBorderColor}, var(--sb-sidebar-bottom-card-box-shadow, 0 1px 2px 0 rgba(\
0, 0, 0, 0.05), 0px -5px 20px 10px ${o.background.app})`,
    transitionProperty: "color, background-color, border-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "0.15s",
    "&:after": {
      content: '""',
      display: t ? "block" : "none",
      position: "absolute",
      left: "50%",
      top: "50%",
      marginLeft: "calc(max(100vw, 100vh) * -0.5)",
      marginTop: "calc(max(100vw, 100vh) * -0.5)",
      height: "max(100vw, 100vh)",
      width: "max(100vw, 100vh)",
      animation: `${d0} 3s linear infinite`,
      background: i ? (
        // Hardcoded colors to prevent themes from messing with them (orange+gold, secondary+seafoam)
        "conic-gradient(transparent 90deg, #FC521F 150deg, #FFAE00 210deg, transparent 270deg)"
      ) : "conic-gradient(transparent 90deg, #029CFD 150deg, #37D5D3 210deg, transparent 270deg)",
      opacity: 1,
      willChange: "auto"
    }
  })
), m0 = S.div(({ theme: e }) => ({
  position: "relative",
  zIndex: 1,
  borderRadius: e.appBorderRadius,
  backgroundColor: e.background.content,
  "&:hover #testing-module-collapse-toggle": {
    opacity: 1
  }
})), h0 = S.div(({ theme: e }) => ({
  overflow: "hidden",
  transition: "max-height 250ms",
  willChange: "auto",
  boxShadow: `inset 0 -1px 0 ${e.appBorderColor}`
})), g0 = S.div({
  padding: "12px 6px",
  display: "flex",
  flexDirection: "column",
  gap: "12px"
}), y0 = S.div(({ onClick: e }) => ({
  display: "flex",
  width: "100%",
  cursor: e ? "pointer" : "default",
  userSelect: "none",
  alignItems: "center",
  justifyContent: "space-between",
  overflow: "hidden",
  padding: "6px"
})), v0 = S.div({
  display: "flex",
  flexBasis: "100%",
  justifyContent: "flex-end",
  gap: 6
}), b0 = S(fe)({
  opacity: 0,
  transition: "opacity 250ms",
  willChange: "auto",
  "&:focus, &:hover": {
    opacity: 1
  }
}), Ff = S(fe)(
  { minWidth: 28 },
  ({ active: e, status: t, theme: o }) => !e && (o.base === "light" ? {
    background: {
      negative: o.background.negative,
      warning: o.background.warning
    }[t],
    color: {
      negative: o.color.negativeText,
      warning: o.color.warningText
    }[t]
  } : {
    background: {
      negative: `${o.color.negative}22`,
      warning: `${o.color.warning}22`
    }[t],
    color: {
      negative: o.color.negative,
      warning: o.color.warning
    }[t]
  })
), x0 = S.div({
  display: "flex",
  justifyContent: "space-between",
  gap: 6
}), I0 = S.div({
  display: "flex",
  flexDirection: "column",
  marginLeft: 6
}), S0 = S.div({
  display: "flex",
  gap: 6
}), w0 = S.div(({ crashed: e, theme: t }) => ({
  fontSize: t.typography.size.s1,
  fontWeight: e ? "bold" : "normal",
  color: e ? t.color.negativeText : t.color.defaultText
})), E0 = S.div(({ theme: e }) => ({
  fontSize: e.typography.size.s1,
  color: e.barTextColor
})), C0 = /* @__PURE__ */ s(({ state: e }) => {
  let t = e.description, o = e.title;
  return /* @__PURE__ */ a.createElement(I0, null, /* @__PURE__ */ a.createElement(w0, { crashed: e.crashed, id: "testing-module-title" }, /* @__PURE__ */ a.
  createElement(o, { ...e })), /* @__PURE__ */ a.createElement(E0, { id: "testing-module-description" }, /* @__PURE__ */ a.createElement(t, {
  ...e })));
}, "DynamicInfo"), Bf = /* @__PURE__ */ s(({
  testProviders: e,
  errorCount: t,
  errorsActive: o,
  setErrorsActive: i,
  warningCount: n,
  warningsActive: r,
  setWarningsActive: l,
  onRunTests: u,
  onCancelTests: p,
  onSetWatchMode: c
}) => {
  let d = G(null), [m, f] = U(!1), [y, h] = U(aa);
  z(() => {
    h(d.current?.offsetHeight || aa);
  }, []);
  let v = /* @__PURE__ */ s(() => {
    h(d.current?.offsetHeight || aa), f(!m);
  }, "toggleCollapsed"), I = e.some((g) => g.running), C = e.some((g) => g.crashed), b = e.some((g) => g.failed), x = e.length > 0;
  return /* @__PURE__ */ a.createElement(
    f0,
    {
      id: "storybook-testing-module",
      running: I,
      crashed: C,
      failed: b || t > 0
    },
    /* @__PURE__ */ a.createElement(m0, null, /* @__PURE__ */ a.createElement(
      h0,
      {
        style: {
          display: x ? "block" : "none",
          maxHeight: m ? 0 : y
        }
      },
      /* @__PURE__ */ a.createElement(g0, { ref: d }, e.map((g) => /* @__PURE__ */ a.createElement(x0, { key: g.id, "data-module-id": g.id },
      /* @__PURE__ */ a.createElement(C0, { state: g }), /* @__PURE__ */ a.createElement(S0, null, g.watchable && /* @__PURE__ */ a.createElement(
        fe,
        {
          "aria-label": `${g.watching ? "Disable" : "Enable"} watch mode for ${g.name}`,
          variant: "ghost",
          padding: "small",
          active: g.watching,
          onClick: () => c(g.id, !g.watching),
          disabled: g.crashed || g.running
        },
        /* @__PURE__ */ a.createElement(Hr, null)
      ), g.runnable && /* @__PURE__ */ a.createElement(a.Fragment, null, g.running && g.cancellable ? /* @__PURE__ */ a.createElement(
        fe,
        {
          "aria-label": `Stop ${g.name}`,
          variant: "ghost",
          padding: "small",
          onClick: () => p(g.id),
          disabled: g.cancelling
        },
        /* @__PURE__ */ a.createElement(zl, null)
      ) : /* @__PURE__ */ a.createElement(
        fe,
        {
          "aria-label": `Start ${g.name}`,
          variant: "ghost",
          padding: "small",
          onClick: () => u(g.id),
          disabled: g.crashed || g.running
        },
        /* @__PURE__ */ a.createElement(Bl, null)
      ))))))
    ), /* @__PURE__ */ a.createElement(y0, { onClick: x ? v : void 0 }, x && /* @__PURE__ */ a.createElement(
      fe,
      {
        variant: "ghost",
        padding: "small",
        onClick: (g) => {
          g.stopPropagation(), e.filter((w) => !w.crashed && !w.running && w.runnable).forEach(({ id: w }) => u(w));
        },
        disabled: I
      },
      /* @__PURE__ */ a.createElement(Fl, null),
      I ? "Running..." : "Run tests"
    ), /* @__PURE__ */ a.createElement(v0, null, x && /* @__PURE__ */ a.createElement(
      b0,
      {
        variant: "ghost",
        padding: "small",
        onClick: v,
        id: "testing-module-collapse-toggle",
        "aria-label": m ? "Expand testing module" : "Collapse testing module"
      },
      /* @__PURE__ */ a.createElement(
        El,
        {
          style: {
            transform: m ? "none" : "rotate(180deg)",
            transition: "transform 250ms",
            willChange: "auto"
          }
        }
      )
    ), t > 0 && /* @__PURE__ */ a.createElement(
      sa,
      {
        hasChrome: !1,
        tooltip: /* @__PURE__ */ a.createElement(qt, { note: "Toggle errors" }),
        trigger: "hover"
      },
      /* @__PURE__ */ a.createElement(
        Ff,
        {
          id: "errors-found-filter",
          variant: "ghost",
          padding: t < 10 ? "medium" : "small",
          status: "negative",
          active: o,
          onClick: (g) => {
            g.stopPropagation(), i(!o);
          },
          "aria-label": "Toggle errors"
        },
        t < 100 ? t : "99+"
      )
    ), n > 0 && /* @__PURE__ */ a.createElement(
      sa,
      {
        hasChrome: !1,
        tooltip: /* @__PURE__ */ a.createElement(qt, { note: "Toggle warnings" }),
        trigger: "hover"
      },
      /* @__PURE__ */ a.createElement(
        Ff,
        {
          id: "warnings-found-filter",
          variant: "ghost",
          padding: n < 10 ? "medium" : "small",
          status: "warning",
          active: r,
          onClick: (g) => {
            g.stopPropagation(), l(!r);
          },
          "aria-label": "Toggle warnings"
        },
        n < 100 ? n : "99+"
      )
    ))))
  );
}, "TestingModule");

// src/manager/components/sidebar/SidebarBottom.tsx
var T0 = "sidebar-bottom-spacer", _0 = "sidebar-bottom-wrapper", Hf = "@storybook/manager/test-providers", k0 = {
  details: {},
  cancellable: !1,
  cancelling: !1,
  running: !1,
  watching: !1,
  failed: !1,
  crashed: !1
}, O0 = /* @__PURE__ */ s(() => !0, "filterNone"), P0 = /* @__PURE__ */ s(({ status: e = {} }) => Object.values(e).some((t) => t?.status ===
"warn"), "filterWarn"), A0 = /* @__PURE__ */ s(({ status: e = {} }) => Object.values(e).some((t) => t?.status === "error"), "filterError"), D0 = /* @__PURE__ */ s(
({ status: e = {} }) => Object.values(e).some((t) => t?.status === "warn" || t?.status === "error"), "filterBoth"), M0 = /* @__PURE__ */ s((e = !1, t = !1) => e &&
t ? D0 : e ? P0 : t ? A0 : O0, "getFilter"), L0 = S.div(({ theme: e }) => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  color: e.color.defaultText,
  fontSize: e.typography.size.s1,
  "&:empty": {
    display: "none"
  },
  // Integrators can use these to style their custom additions
  "--sb-sidebar-bottom-card-background": e.background.content,
  "--sb-sidebar-bottom-card-border": `1px solid ${e.appBorderColor}`,
  "--sb-sidebar-bottom-card-border-radius": `${e.appBorderRadius + 1}px`,
  "--sb-sidebar-bottom-card-box-shadow": `0 1px 2px 0 rgba(0, 0, 0, 0.05), 0px -5px 20px 10px ${e.background.app}`
})), N0 = /* @__PURE__ */ s(({
  api: e,
  notifications: t = [],
  status: o = {},
  isDevelopment: i
}) => {
  let n = G(null), r = G(null), [l, u] = U(!1), [p, c] = U(!1), [d, m] = U(() => {
    let T = {};
    try {
      T = JSON.parse(sessionStorage.getItem(Hf) || "{}");
    } catch {
    }
    return Object.fromEntries(
      Object.entries(e.getElements(Ae.experimental_TEST_PROVIDER)).map(
        ([_, k]) => [_, { ...k, ...k0, ...T[_] }]
      )
    );
  }), f = Object.values(o).filter(
    (T) => Object.values(T).some((_) => _?.status === "warn")
  ), y = Object.values(o).filter(
    (T) => Object.values(T).some((_) => _?.status === "error")
  ), h = f.length > 0, v = y.length > 0, I = M(
    (T, _) => m((k) => {
      let E = { ...k, [T]: { ...k[T], ..._ } };
      return sessionStorage.setItem(Hf, JSON.stringify(E)), E;
    }),
    []
  ), C = M(
    ({ providerId: T }) => {
      I(T, {
        cancelling: !1,
        running: !0,
        failed: !1,
        crashed: !1,
        progress: void 0
      }), e.experimental_updateStatus(
        T,
        (_ = {}) => Object.fromEntries(Object.keys(_).map((k) => [k, null]))
      );
    },
    [e, I]
  ), b = M(
    (T) => {
      e.emit(gr, { providerId: T });
    },
    [e]
  ), x = M(
    (T) => {
      I(T, { cancelling: !0 }), e.emit(ka, { providerId: T });
    },
    [e, I]
  ), g = M(
    (T, _) => {
      I(T, { watching: _ }), e.emit(Oa, { providerId: T, watchMode: _ });
    },
    [e, I]
  );
  z(() => {
    let T = n.current, _ = r.current;
    if (T && _) {
      let k = new ResizeObserver(() => {
        T && _ && (T.style.height = `${_.clientHeight}px`);
      });
      return k.observe(_), () => k.disconnect();
    }
  }, []), z(() => {
    let T = M0(h && l, v && p);
    e.experimental_setFilter("sidebar-bottom-filter", T);
  }, [e, h, v, l, p]), z(() => {
    let T = /* @__PURE__ */ s(({ providerId: k, ...E }) => {
      I(k, { details: E, running: !1, crashed: !0, watching: !1 });
    }, "onCrashReport"), _ = /* @__PURE__ */ s(({ providerId: k, ...E }) => {
      if (E.status === "failed")
        I(k, { ...E, running: !1, failed: !0 });
      else {
        let O = { ...E, running: E.status === "pending" };
        I(k, O);
        let { mapStatusUpdate: P, ...A } = d[k], D = P?.({ ...A, ...O });
        D && e.experimental_updateStatus(k, D);
      }
    }, "onProgressReport");
    return e.getChannel()?.on(Zn, T), e.getChannel()?.on(gr, C), e.getChannel()?.on(Jn, _), () => {
      e.getChannel()?.off(Zn, T), e.getChannel()?.off(Jn, _), e.getChannel()?.off(gr, C);
    };
  }, [e, d, I, C]);
  let w = Object.values(d);
  return !h && !v && !w.length && !t.length ? null : /* @__PURE__ */ a.createElement("div", { id: T0, ref: n }, /* @__PURE__ */ a.createElement(
  L0, { id: _0, ref: r }, /* @__PURE__ */ a.createElement(Ur, { notifications: t, clearNotification: e.clearNotification }), i && /* @__PURE__ */ a.
  createElement(
    Bf,
    {
      testProviders: w,
      errorCount: y.length,
      errorsActive: p,
      setErrorsActive: c,
      warningCount: f.length,
      warningsActive: l,
      setWarningsActive: u,
      onRunTests: b,
      onCancelTests: x,
      onSetWatchMode: g
    }
  )));
}, "SidebarBottomBase"), Rf = /* @__PURE__ */ s(({ isDevelopment: e }) => {
  let t = pe(), { notifications: o, status: i } = Ze();
  return /* @__PURE__ */ a.createElement(
    N0,
    {
      api: t,
      notifications: o,
      status: i,
      isDevelopment: e
    }
  );
}, "SidebarBottom");

// src/manager/components/sidebar/TagsFilterPanel.tsx
var F0 = /* @__PURE__ */ new Set(["play-fn"]), B0 = S.div({
  minWidth: 180,
  maxWidth: 220
}), zf = /* @__PURE__ */ s(({
  api: e,
  allTags: t,
  selectedTags: o,
  toggleTag: i,
  isDevelopment: n
}) => {
  let r = Fe(), l = t.filter((c) => !F0.has(c)), u = e.getDocsUrl({ subpath: "writing-stories/tags#filtering-by-custom-tags" }), p = t.map((c) => {
    let d = o.includes(c), m = `tag-${c}`;
    return {
      id: m,
      title: c,
      right: /* @__PURE__ */ a.createElement(
        "input",
        {
          type: "checkbox",
          id: m,
          name: m,
          value: c,
          checked: d,
          onChange: () => {
          }
        }
      ),
      onClick: /* @__PURE__ */ s(() => i(c), "onClick")
    };
  });
  return t.length === 0 && p.push({
    id: "no-tags",
    title: "There are no tags. Use tags to organize and filter your Storybook.",
    isIndented: !1
  }), l.length === 0 && n && p.push({
    id: "tags-docs",
    title: "Learn how to add tags",
    icon: /* @__PURE__ */ a.createElement(Tt, null),
    href: u,
    style: {
      borderTop: `4px solid ${r.appBorderColor}`
    }
  }), /* @__PURE__ */ a.createElement(B0, null, /* @__PURE__ */ a.createElement(Ct, { links: p }));
}, "TagsFilterPanel");

// src/manager/components/sidebar/TagsFilter.tsx
var H0 = "tags-filter", R0 = /* @__PURE__ */ new Set([
  "dev",
  "docs-only",
  "test-only",
  "autodocs",
  "test",
  "attached-mdx",
  "unattached-mdx"
]), z0 = S.div({
  position: "relative"
}), W0 = S(kr)(({ theme: e }) => ({
  position: "absolute",
  top: 7,
  right: 7,
  transform: "translate(50%, -50%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 3,
  height: 6,
  minWidth: 6,
  lineHeight: "px",
  boxShadow: `${e.barSelectedColor} 0 0 0 1px inset`,
  fontSize: e.typography.size.s1 - 1,
  background: e.color.secondary,
  color: e.color.lightest
})), Wf = /* @__PURE__ */ s(({
  api: e,
  indexJson: t,
  initialSelectedTags: o = [],
  isDevelopment: i
}) => {
  let [n, r] = U(o), [l, u] = U(!1), p = n.length > 0;
  z(() => {
    e.experimental_setFilter(H0, (f) => n.length === 0 ? !0 : n.some((y) => f.tags?.includes(y)));
  }, [e, n]);
  let c = Object.values(t.entries).reduce((f, y) => (y.tags?.forEach((h) => {
    R0.has(h) || f.add(h);
  }), f), /* @__PURE__ */ new Set()), d = M(
    (f) => {
      n.includes(f) ? r(n.filter((y) => y !== f)) : r([...n, f]);
    },
    [n, r]
  ), m = M(
    (f) => {
      f.preventDefault(), u(!l);
    },
    [l, u]
  );
  return c.size === 0 && !i ? null : /* @__PURE__ */ a.createElement(
    je,
    {
      placement: "bottom",
      trigger: "click",
      onVisibleChange: u,
      tooltip: () => /* @__PURE__ */ a.createElement(
        zf,
        {
          api: e,
          allTags: Array.from(c).toSorted(),
          selectedTags: n,
          toggleTag: d,
          isDevelopment: i
        }
      ),
      closeOnOutsideClick: !0
    },
    /* @__PURE__ */ a.createElement(z0, null, /* @__PURE__ */ a.createElement(te, { key: "tags", title: "Tag filters", active: p, onClick: m },
    /* @__PURE__ */ a.createElement(Pl, null)), n.length > 0 && /* @__PURE__ */ a.createElement(W0, null))
  );
}, "TagsFilter");

// ../node_modules/es-toolkit/dist/compat/function/debounce.mjs
function la(e, t = 0, o = {}) {
  typeof o != "object" && (o = {});
  let { signal: i, leading: n = !1, trailing: r = !0, maxWait: l } = o, u = Array(2);
  n && (u[0] = "leading"), r && (u[1] = "trailing");
  let p, c = null, d = dn(function(...y) {
    p = e.apply(this, y), c = null;
  }, t, { signal: i, edges: u }), m = /* @__PURE__ */ s(function(...y) {
    if (l != null) {
      if (c === null)
        c = Date.now();
      else if (Date.now() - c >= l)
        return p = e.apply(this, y), c = Date.now(), d.cancel(), d.schedule(), p;
    }
    return d.apply(this, y), p;
  }, "debounced"), f = /* @__PURE__ */ s(() => (d.flush(), p), "flush");
  return m.cancel = d.cancel, m.flush = f, m;
}
s(la, "debounce");

// src/manager/components/sidebar/useLastViewed.ts
var qn = Ve(jf(), 1);
var Vf = la((e) => qn.default.set("lastViewedStoryIds", e), 1e3), $f = /* @__PURE__ */ s((e) => {
  let t = Y(() => {
    let n = qn.default.get("lastViewedStoryIds");
    return !n || !Array.isArray(n) ? [] : n.some((r) => typeof r == "object" && r.storyId && r.refId) ? n : [];
  }, [qn.default]), o = G(t), i = M(
    (n) => {
      let r = o.current, l = r.findIndex(
        ({ storyId: u, refId: p }) => u === n.storyId && p === n.refId
      );
      l !== 0 && (l === -1 ? o.current = [n, ...r] : o.current = [n, ...r.slice(0, l), ...r.slice(l + 1)], Vf(o.current));
    },
    [o]
  );
  return z(() => {
    e && i(e);
  }, [e]), {
    getLastViewed: M(() => o.current, [o]),
    clearLastViewed: M(() => {
      o.current = o.current.slice(0, 1), Vf(o.current);
    }, [o])
  };
}, "useLastViewed");

// src/manager/components/sidebar/Sidebar.tsx
var St = "storybook_internal", j0 = S.nav(({ theme: e }) => ({
  position: "absolute",
  zIndex: 1,
  left: 0,
  top: 0,
  bottom: 0,
  right: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  background: e.background.content,
  [wt]: {
    background: e.background.app
  }
})), V0 = S(Et)({
  paddingLeft: 12,
  paddingRight: 12,
  paddingBottom: 20,
  paddingTop: 16,
  flex: 1
}), $0 = S(qt)({
  margin: 0
}), K0 = S(te)(({ theme: e }) => ({
  color: e.color.mediumdark,
  width: 32,
  height: 32,
  borderRadius: e.appBorderRadius + 2
})), U0 = a.memo(/* @__PURE__ */ s(function({
  children: t,
  condition: o
}) {
  let [i, n] = a.Children.toArray(t);
  return /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement("div", { style: { display: o ? "block" : "none" } },
  i), /* @__PURE__ */ a.createElement("div", { style: { display: o ? "none" : "block" } }, n));
}, "Swap")), q0 = /* @__PURE__ */ s((e, t, o, i, n) => {
  let r = Y(
    () => ({
      [St]: {
        index: e,
        indexError: t,
        previewInitialized: o,
        status: i,
        title: null,
        id: St,
        url: "iframe.html"
      },
      ...n
    }),
    [n, e, t, o, i]
  );
  return Y(() => ({ hash: r, entries: Object.entries(r) }), [r]);
}, "useCombination"), G0 = re.STORYBOOK_RENDERER === "react", Kf = a.memo(/* @__PURE__ */ s(function({
  // @ts-expect-error (non strict)
  storyId: t = null,
  refId: o = St,
  index: i,
  indexJson: n,
  indexError: r,
  status: l,
  previewInitialized: u,
  menu: p,
  extra: c,
  menuHighlighted: d = !1,
  enableShortcuts: m = !0,
  isDevelopment: f = re.CONFIG_TYPE === "DEVELOPMENT",
  refs: y = {},
  onMenuClick: h,
  showCreateStoryButton: v = f && G0
}) {
  let [I, C] = U(!1), b = Y(() => t && { storyId: t, refId: o }, [t, o]), x = q0(i, r, u, l, y), g = !i && !r, w = $f(b), { isMobile: T } = ge(),
  _ = pe();
  return /* @__PURE__ */ a.createElement(j0, { className: "container sidebar-container" }, /* @__PURE__ */ a.createElement(Ar, { vertical: !0,
  offset: 3, scrollbarSize: 6 }, /* @__PURE__ */ a.createElement(V0, { row: 1.6 }, /* @__PURE__ */ a.createElement(
    Vc,
    {
      className: "sidebar-header",
      menuHighlighted: d,
      menu: p,
      extra: c,
      skipLinkHref: "#storybook-preview-wrapper",
      isLoading: g,
      onMenuClick: h
    }
  ), /* @__PURE__ */ a.createElement(
    rf,
    {
      dataset: x,
      enableShortcuts: m,
      searchBarContent: v && /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(
        je,
        {
          trigger: "hover",
          hasChrome: !1,
          tooltip: /* @__PURE__ */ a.createElement($0, { note: "Create a new story" })
        },
        /* @__PURE__ */ a.createElement(
          K0,
          {
            onClick: () => {
              C(!0);
            },
            variant: "outline"
          },
          /* @__PURE__ */ a.createElement(Hl, null)
        )
      ), /* @__PURE__ */ a.createElement(
        Kp,
        {
          open: I,
          onOpenChange: C
        }
      )),
      searchFieldContent: n && /* @__PURE__ */ a.createElement(Wf, { api: _, indexJson: n, isDevelopment: f }),
      ...w
    },
    ({
      query: k,
      results: E,
      isBrowsing: O,
      closeMenu: P,
      getMenuProps: A,
      getItemProps: D,
      highlightedIndex: L
    }) => /* @__PURE__ */ a.createElement(U0, { condition: O }, /* @__PURE__ */ a.createElement(
      Hc,
      {
        dataset: x,
        selected: b,
        isLoading: g,
        isBrowsing: O
      }
    ), /* @__PURE__ */ a.createElement(
      af,
      {
        query: k,
        results: E,
        closeMenu: P,
        getMenuProps: A,
        getItemProps: D,
        highlightedIndex: L,
        enableShortcuts: m,
        isLoading: g,
        clearLastViewed: w.clearLastViewed
      }
    ))
  )), T || g ? null : /* @__PURE__ */ a.createElement(Rf, { isDevelopment: f })));
}, "Sidebar"));

// src/manager/container/Menu.tsx
var Y0 = {
  storySearchField: "storybook-explorer-searchfield",
  storyListMenu: "storybook-explorer-menu",
  storyPanelRoot: "storybook-panel-root"
}, X0 = S.span(({ theme: e }) => ({
  display: "inline-block",
  height: 16,
  lineHeight: "16px",
  textAlign: "center",
  fontSize: "11px",
  background: e.base === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
  color: e.base === "light" ? e.color.dark : e.textMutedColor,
  borderRadius: 2,
  userSelect: "none",
  pointerEvents: "none",
  padding: "0 6px"
})), Q0 = S.code(
  ({ theme: e }) => `
  padding: 0;
  vertical-align: middle;

  & + & {
    margin-left: 6px;
  }
`
), Qe = /* @__PURE__ */ s(({ keys: e }) => /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(X0, null, e.map(
(t, o) => /* @__PURE__ */ a.createElement(Q0, { key: t }, pt([t]))))), "Shortcut"), Uf = /* @__PURE__ */ s((e, t, o, i, n, r, l) => {
  let u = Fe(), p = t.getShortcutKeys(), c = Y(
    () => ({
      id: "about",
      title: "About your Storybook",
      onClick: /* @__PURE__ */ s(() => t.changeSettingsTab("about"), "onClick"),
      icon: /* @__PURE__ */ a.createElement(Dl, null)
    }),
    [t]
  ), d = Y(() => ({
    id: "documentation",
    title: "Documentation",
    href: t.getDocsUrl({ versioned: !0, renderer: !0 }),
    icon: /* @__PURE__ */ a.createElement(Tt, null)
  }), [t]), m = e.whatsNewData?.status === "SUCCESS" && !e.disableWhatsNewNotifications, f = t.isWhatsNewUnread(), y = Y(
    () => ({
      id: "whats-new",
      title: "What's new?",
      onClick: /* @__PURE__ */ s(() => t.changeSettingsTab("whats-new"), "onClick"),
      right: m && f && /* @__PURE__ */ a.createElement(kr, { status: "positive" }, "Check it out"),
      icon: /* @__PURE__ */ a.createElement($l, null)
    }),
    [t, m, f]
  ), h = Y(
    () => ({
      id: "shortcuts",
      title: "Keyboard shortcuts",
      onClick: /* @__PURE__ */ s(() => t.changeSettingsTab("shortcuts"), "onClick"),
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: p.shortcutsPage }) : null,
      style: {
        borderBottom: `4px solid ${u.appBorderColor}`
      }
    }),
    [t, l, p.shortcutsPage, u.appBorderColor]
  ), v = Y(
    () => ({
      id: "S",
      title: "Show sidebar",
      onClick: /* @__PURE__ */ s(() => t.toggleNav(), "onClick"),
      active: r,
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: p.toggleNav }) : null,
      icon: r ? /* @__PURE__ */ a.createElement(et, null) : null
    }),
    [t, l, p, r]
  ), I = Y(
    () => ({
      id: "T",
      title: "Show toolbar",
      onClick: /* @__PURE__ */ s(() => t.toggleToolbar(), "onClick"),
      active: o,
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: p.toolbar }) : null,
      icon: o ? /* @__PURE__ */ a.createElement(et, null) : null
    }),
    [t, l, p, o]
  ), C = Y(
    () => ({
      id: "A",
      title: "Show addons",
      onClick: /* @__PURE__ */ s(() => t.togglePanel(), "onClick"),
      active: n,
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: p.togglePanel }) : null,
      icon: n ? /* @__PURE__ */ a.createElement(et, null) : null
    }),
    [t, l, p, n]
  ), b = Y(
    () => ({
      id: "D",
      title: "Change addons orientation",
      onClick: /* @__PURE__ */ s(() => t.togglePanelPosition(), "onClick"),
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: p.panelPosition }) : null
    }),
    [t, l, p]
  ), x = Y(
    () => ({
      id: "F",
      title: "Go full screen",
      onClick: /* @__PURE__ */ s(() => t.toggleFullscreen(), "onClick"),
      active: i,
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: p.fullScreen }) : null,
      icon: i ? /* @__PURE__ */ a.createElement(et, null) : null
    }),
    [t, l, p, i]
  ), g = Y(
    () => ({
      id: "/",
      title: "Search",
      onClick: /* @__PURE__ */ s(() => t.focusOnUIElement(Y0.storySearchField), "onClick"),
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: p.search }) : null
    }),
    [t, l, p]
  ), w = Y(
    () => ({
      id: "up",
      title: "Previous component",
      onClick: /* @__PURE__ */ s(() => t.jumpToComponent(-1), "onClick"),
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: p.prevComponent }) : null
    }),
    [t, l, p]
  ), T = Y(
    () => ({
      id: "down",
      title: "Next component",
      onClick: /* @__PURE__ */ s(() => t.jumpToComponent(1), "onClick"),
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: p.nextComponent }) : null
    }),
    [t, l, p]
  ), _ = Y(
    () => ({
      id: "prev",
      title: "Previous story",
      onClick: /* @__PURE__ */ s(() => t.jumpToStory(-1), "onClick"),
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: p.prevStory }) : null
    }),
    [t, l, p]
  ), k = Y(
    () => ({
      id: "next",
      title: "Next story",
      onClick: /* @__PURE__ */ s(() => t.jumpToStory(1), "onClick"),
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: p.nextStory }) : null
    }),
    [t, l, p]
  ), E = Y(
    () => ({
      id: "collapse",
      title: "Collapse all",
      onClick: /* @__PURE__ */ s(() => t.emit(Ko), "onClick"),
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: p.collapseAll }) : null
    }),
    [t, l, p]
  ), O = M(() => {
    let P = t.getAddonsShortcuts(), A = p;
    return Object.entries(P).filter(([D, { showInMenu: L }]) => L).map(([D, { label: L, action: B }]) => ({
      id: D,
      title: L,
      onClick: /* @__PURE__ */ s(() => B(), "onClick"),
      right: l ? /* @__PURE__ */ a.createElement(Qe, { keys: A[D] }) : null
    }));
  }, [t, l, p]);
  return Y(
    () => [
      c,
      ...e.whatsNewData?.status === "SUCCESS" ? [y] : [],
      d,
      h,
      v,
      I,
      C,
      b,
      x,
      g,
      w,
      T,
      _,
      k,
      E,
      ...O()
    ],
    [
      c,
      e,
      y,
      d,
      h,
      v,
      I,
      C,
      b,
      x,
      g,
      w,
      T,
      _,
      k,
      E,
      O
    ]
  );
}, "useMenu");

// src/manager/container/Sidebar.tsx
var Z0 = a.memo(/* @__PURE__ */ s(function({ onMenuClick: t }) {
  return /* @__PURE__ */ a.createElement(me, { filter: /* @__PURE__ */ s(({ state: i, api: n }) => {
    let {
      ui: { name: r, url: l, enableShortcuts: u },
      viewMode: p,
      storyId: c,
      refId: d,
      layout: { showToolbar: m },
      // FIXME: This is the actual `index.json` index where the `index` below
      // is actually the stories hash. We should fix this up and make it consistent.
      // eslint-disable-next-line @typescript-eslint/naming-convention
      internal_index: f,
      index: y,
      status: h,
      indexError: v,
      previewInitialized: I,
      refs: C
    } = i, b = Uf(
      i,
      n,
      m,
      n.getIsFullscreen(),
      n.getIsPanelShown(),
      n.getIsNavShown(),
      u
    ), x = i.whatsNewData?.status === "SUCCESS" && !i.disableWhatsNewNotifications, g = n.getElements(Ae.experimental_SIDEBAR_TOP), w = Y(() => Object.
    values(g), [Object.keys(g).join("")]);
    return {
      title: r,
      url: l,
      indexJson: f,
      index: y,
      indexError: v,
      status: h,
      previewInitialized: I,
      refs: C,
      storyId: c,
      refId: d,
      viewMode: p,
      menu: b,
      menuHighlighted: x && n.isWhatsNewUnread(),
      enableShortcuts: u,
      extra: w
    };
  }, "mapper") }, (i) => /* @__PURE__ */ a.createElement(Kf, { ...i, onMenuClick: t }));
}, "Sideber")), qf = Z0;

// src/manager/App.tsx
var Gf = /* @__PURE__ */ s(({ managerLayoutState: e, setManagerLayoutState: t, pages: o, hasTab: i }) => {
  let { setMobileAboutOpen: n } = ge();
  return /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(Eo, { styles: Wa }), /* @__PURE__ */ a.createElement(
    Su,
    {
      hasTab: i,
      managerLayoutState: e,
      setManagerLayoutState: t,
      slotMain: /* @__PURE__ */ a.createElement(mp, { id: "main", withLoader: !0 }),
      slotSidebar: /* @__PURE__ */ a.createElement(qf, { onMenuClick: () => n((r) => !r) }),
      slotPanel: /* @__PURE__ */ a.createElement(Cu, null),
      slotPages: o.map(({ id: r, render: l }) => /* @__PURE__ */ a.createElement(l, { key: r }))
    }
  ));
}, "App");

// src/manager/provider.ts
var ua = class ua {
  getElements(t) {
    throw new Error("Provider.getElements() is not implemented!");
  }
  handleAPI(t) {
    throw new Error("Provider.handleAPI() is not implemented!");
  }
  getConfig() {
    return console.error("Provider.getConfig() is not implemented!"), {};
  }
};
s(ua, "Provider");
var Io = ua;

// src/manager/settings/About.tsx
var J0 = S.div({
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  marginTop: 40
}), ex = S.header({
  marginBottom: 32,
  alignItems: "center",
  display: "flex",
  "> svg": {
    height: 48,
    width: "auto",
    marginRight: 8
  }
}), tx = S.div(({ theme: e }) => ({
  marginBottom: 24,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  color: e.base === "light" ? e.color.dark : e.color.lightest,
  fontWeight: e.typography.weight.regular,
  fontSize: e.typography.size.s2
})), ox = S.div({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 24,
  marginTop: 24,
  gap: 16
}), Yf = S(We)(({ theme: e }) => ({
  "&&": {
    fontWeight: e.typography.weight.bold,
    color: e.base === "light" ? e.color.dark : e.color.light
  },
  "&:hover": {
    color: e.base === "light" ? e.color.darkest : e.color.lightest
  }
})), Xf = /* @__PURE__ */ s(({ onNavigateToWhatsNew: e }) => /* @__PURE__ */ a.createElement(J0, null, /* @__PURE__ */ a.createElement(ex, null,
/* @__PURE__ */ a.createElement(Dr, { alt: "Storybook" })), /* @__PURE__ */ a.createElement(qr, { onNavigateToWhatsNew: e }), /* @__PURE__ */ a.
createElement(tx, null, /* @__PURE__ */ a.createElement(ox, null, /* @__PURE__ */ a.createElement(fe, { asChild: !0 }, /* @__PURE__ */ a.createElement(
"a", { href: "https://github.com/storybookjs/storybook" }, /* @__PURE__ */ a.createElement(Rr, null), "GitHub")), /* @__PURE__ */ a.createElement(
fe, { asChild: !0 }, /* @__PURE__ */ a.createElement("a", { href: "https://storybook.js.org/docs" }, /* @__PURE__ */ a.createElement(Ao, { style: {
display: "inline", marginRight: 5 } }), "Documentation"))), /* @__PURE__ */ a.createElement("div", null, "Open source software maintained by",
" ", /* @__PURE__ */ a.createElement(Yf, { href: "https://www.chromatic.com/" }, "Chromatic"), " and the", " ", /* @__PURE__ */ a.createElement(
Yf, { href: "https://github.com/storybookjs/storybook/graphs/contributors" }, "Storybook Community")))), "AboutScreen");

// src/manager/settings/AboutPage.tsx
var ca = class ca extends Ge {
  componentDidMount() {
    let { api: t, notificationId: o } = this.props;
    t.clearNotification(o);
  }
  render() {
    let { children: t } = this.props;
    return t;
  }
};
s(ca, "NotificationClearer");
var pa = ca, Qf = /* @__PURE__ */ s(() => {
  let e = pe(), t = Ze(), o = M(() => {
    e.changeSettingsTab("whats-new");
  }, [e]);
  return /* @__PURE__ */ a.createElement(pa, { api: e, notificationId: "update" }, /* @__PURE__ */ a.createElement(
    Xf,
    {
      onNavigateToWhatsNew: t.whatsNewData?.status === "SUCCESS" ? o : void 0
    }
  ));
}, "AboutPage");

// src/manager/settings/SettingsFooter.tsx
var rx = S.div(({ theme: e }) => ({
  display: "flex",
  paddingTop: 20,
  marginTop: 20,
  borderTop: `1px solid ${e.appBorderColor}`,
  fontWeight: e.typography.weight.bold,
  "& > * + *": {
    marginLeft: 20
  }
})), nx = /* @__PURE__ */ s((e) => /* @__PURE__ */ a.createElement(rx, { ...e }, /* @__PURE__ */ a.createElement(We, { secondary: !0, href: "\
https://storybook.js.org", cancel: !1, target: "_blank" }, "Docs"), /* @__PURE__ */ a.createElement(We, { secondary: !0, href: "https://gith\
ub.com/storybookjs/storybook", cancel: !1, target: "_blank" }, "GitHub"), /* @__PURE__ */ a.createElement(
  We,
  {
    secondary: !0,
    href: "https://storybook.js.org/community#support",
    cancel: !1,
    target: "_blank"
  },
  "Support"
)), "SettingsFooter"), Zf = nx;

// src/manager/settings/shortcuts.tsx
var ix = S.header(({ theme: e }) => ({
  marginBottom: 20,
  fontSize: e.typography.size.m3,
  fontWeight: e.typography.weight.bold,
  alignItems: "center",
  display: "flex"
})), Jf = S.div(({ theme: e }) => ({
  fontWeight: e.typography.weight.bold
})), sx = S.div({
  alignSelf: "flex-end",
  display: "grid",
  margin: "10px 0",
  gridTemplateColumns: "1fr 1fr 12px",
  "& > *:last-of-type": {
    gridColumn: "2 / 2",
    justifySelf: "flex-end",
    gridRow: "1"
  }
}), ax = S.div(({ theme: e }) => ({
  padding: "6px 0",
  borderTop: `1px solid ${e.appBorderColor}`,
  display: "grid",
  gridTemplateColumns: "1fr 1fr 0px"
})), lx = S.div({
  display: "grid",
  gridTemplateColumns: "1fr",
  gridAutoRows: "minmax(auto, auto)",
  marginBottom: 20
}), ux = S.div({
  alignSelf: "center"
}), px = S(Or.Input)(
  ({ valid: e, theme: t }) => e === "error" ? {
    animation: `${t.animation.jiggle} 700ms ease-out`
  } : {},
  {
    display: "flex",
    width: 80,
    flexDirection: "column",
    justifySelf: "flex-end",
    paddingLeft: 4,
    paddingRight: 4,
    textAlign: "center"
  }
), cx = Kt`
0%,100% { opacity: 0; }
  50% { opacity: 1; }
`, dx = S(et)(
  ({ valid: e, theme: t }) => e === "valid" ? {
    color: t.color.positive,
    animation: `${cx} 2s ease forwards`
  } : {
    opacity: 0
  },
  {
    alignSelf: "center",
    display: "flex",
    marginLeft: 10,
    height: 14,
    width: 14
  }
), fx = S.div(({ theme: e }) => ({
  fontSize: e.typography.size.s2,
  padding: "3rem 20px",
  maxWidth: 600,
  margin: "0 auto"
})), mx = {
  fullScreen: "Go full screen",
  togglePanel: "Toggle addons",
  panelPosition: "Toggle addons orientation",
  toggleNav: "Toggle sidebar",
  toolbar: "Toggle canvas toolbar",
  search: "Focus search",
  focusNav: "Focus sidebar",
  focusIframe: "Focus canvas",
  focusPanel: "Focus addons",
  prevComponent: "Previous component",
  nextComponent: "Next component",
  prevStory: "Previous story",
  nextStory: "Next story",
  shortcutsPage: "Go to shortcuts page",
  aboutPage: "Go to about page",
  collapseAll: "Collapse all items on sidebar",
  expandAll: "Expand all items on sidebar",
  remount: "Remount component"
}, hx = ["escape"];
function da(e) {
  return Object.entries(e).reduce(
    // @ts-expect-error (non strict)
    (t, [o, i]) => hx.includes(o) ? t : { ...t, [o]: { shortcut: i, error: !1 } },
    {}
  );
}
s(da, "toShortcutState");
var fa = class fa extends Ge {
  constructor(o) {
    super(o);
    this.onKeyDown = /* @__PURE__ */ s((o) => {
      let { activeFeature: i, shortcutKeys: n } = this.state;
      if (o.key === "Backspace")
        return this.restoreDefault();
      let r = Aa(o);
      if (!r)
        return !1;
      let l = !!Object.entries(n).find(
        ([u, { shortcut: p }]) => u !== i && p && Da(r, p)
      );
      return this.setState({
        shortcutKeys: { ...n, [i]: { shortcut: r, error: l } }
      });
    }, "onKeyDown");
    this.onFocus = /* @__PURE__ */ s((o) => () => {
      let { shortcutKeys: i } = this.state;
      this.setState({
        activeFeature: o,
        shortcutKeys: {
          ...i,
          [o]: { shortcut: null, error: !1 }
        }
      });
    }, "onFocus");
    this.onBlur = /* @__PURE__ */ s(async () => {
      let { shortcutKeys: o, activeFeature: i } = this.state;
      if (o[i]) {
        let { shortcut: n, error: r } = o[i];
        return !n || r ? this.restoreDefault() : this.saveShortcut();
      }
      return !1;
    }, "onBlur");
    this.saveShortcut = /* @__PURE__ */ s(async () => {
      let { activeFeature: o, shortcutKeys: i } = this.state, { setShortcut: n } = this.props;
      await n(o, i[o].shortcut), this.setState({ successField: o });
    }, "saveShortcut");
    this.restoreDefaults = /* @__PURE__ */ s(async () => {
      let { restoreAllDefaultShortcuts: o } = this.props, i = await o();
      return this.setState({ shortcutKeys: da(i) });
    }, "restoreDefaults");
    this.restoreDefault = /* @__PURE__ */ s(async () => {
      let { activeFeature: o, shortcutKeys: i } = this.state, { restoreDefaultShortcut: n } = this.props, r = await n(o);
      return this.setState({
        shortcutKeys: {
          ...i,
          ...da({ [o]: r })
        }
      });
    }, "restoreDefault");
    this.displaySuccessMessage = /* @__PURE__ */ s((o) => {
      let { successField: i, shortcutKeys: n } = this.state;
      return o === i && n[o].error === !1 ? "valid" : void 0;
    }, "displaySuccessMessage");
    this.displayError = /* @__PURE__ */ s((o) => {
      let { activeFeature: i, shortcutKeys: n } = this.state;
      return o === i && n[o].error === !0 ? "error" : void 0;
    }, "displayError");
    this.renderKeyInput = /* @__PURE__ */ s(() => {
      let { shortcutKeys: o, addonsShortcutLabels: i } = this.state;
      return Object.entries(o).map(([r, { shortcut: l }]) => /* @__PURE__ */ a.createElement(ax, { key: r }, /* @__PURE__ */ a.createElement(
      ux, null, mx[r] || i[r]), /* @__PURE__ */ a.createElement(
        px,
        {
          spellCheck: "false",
          valid: this.displayError(r),
          className: "modalInput",
          onBlur: this.onBlur,
          onFocus: this.onFocus(r),
          onKeyDown: this.onKeyDown,
          value: l ? pt(l) : "",
          placeholder: "Type keys",
          readOnly: !0
        }
      ), /* @__PURE__ */ a.createElement(dx, { valid: this.displaySuccessMessage(r) })));
    }, "renderKeyInput");
    this.renderKeyForm = /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(lx, null, /* @__PURE__ */ a.createElement(sx, null, /* @__PURE__ */ a.
    createElement(Jf, null, "Commands"), /* @__PURE__ */ a.createElement(Jf, null, "Shortcut")), this.renderKeyInput()), "renderKeyForm");
    this.state = {
      // @ts-expect-error (non strict)
      activeFeature: void 0,
      // @ts-expect-error (non strict)
      successField: void 0,
      // The initial shortcutKeys that come from props are the defaults/what was saved
      // As the user interacts with the page, the state stores the temporary, unsaved shortcuts
      // This object also includes the error attached to each shortcut
      // @ts-expect-error (non strict)
      shortcutKeys: da(o.shortcutKeys),
      addonsShortcutLabels: o.addonsShortcutLabels
    };
  }
  render() {
    let o = this.renderKeyForm();
    return /* @__PURE__ */ a.createElement(fx, null, /* @__PURE__ */ a.createElement(ix, null, "Keyboard shortcuts"), o, /* @__PURE__ */ a.createElement(
      fe,
      {
        variant: "outline",
        size: "small",
        id: "restoreDefaultsHotkeys",
        onClick: this.restoreDefaults
      },
      "Restore defaults"
    ), /* @__PURE__ */ a.createElement(Zf, null));
  }
};
s(fa, "ShortcutsScreen");
var Gn = fa;

// src/manager/settings/ShortcutsPage.tsx
var em = /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(me, null, ({
  api: {
    getShortcutKeys: e,
    getAddonsShortcutLabels: t,
    setShortcut: o,
    restoreDefaultShortcut: i,
    restoreAllDefaultShortcuts: n
  }
}) => /* @__PURE__ */ a.createElement(
  Gn,
  {
    shortcutKeys: e(),
    addonsShortcutLabels: t(),
    setShortcut: o,
    restoreDefaultShortcut: i,
    restoreAllDefaultShortcuts: n
  }
)), "ShortcutsPage");

// src/manager/settings/whats_new.tsx
var tm = S.div({
  top: "50%",
  position: "absolute",
  transform: "translateY(-50%)",
  width: "100%",
  textAlign: "center"
}), gx = S.div({
  position: "relative",
  height: "32px"
}), om = S.div(({ theme: e }) => ({
  paddingTop: "12px",
  color: e.textMutedColor,
  maxWidth: "295px",
  margin: "0 auto",
  fontSize: `${e.typography.size.s1}px`,
  lineHeight: "16px"
})), yx = S.div(({ theme: e }) => ({
  position: "absolute",
  width: "100%",
  bottom: "40px",
  background: e.background.bar,
  fontSize: "13px",
  borderTop: "1px solid",
  borderColor: e.appBorderColor,
  padding: "8px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
})), vx = /* @__PURE__ */ s(({
  isNotificationsEnabled: e,
  onToggleNotifications: t,
  onCopyLink: o
}) => {
  let i = Fe(), [n, r] = U("Copy Link"), l = /* @__PURE__ */ s(() => {
    o(), r("Copied!"), setTimeout(() => r("Copy Link"), 4e3);
  }, "copyLink");
  return /* @__PURE__ */ a.createElement(yx, null, /* @__PURE__ */ a.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
  /* @__PURE__ */ a.createElement(Al, { color: i.color.mediumdark }), /* @__PURE__ */ a.createElement("div", null, "Share this with your tea\
m."), /* @__PURE__ */ a.createElement(fe, { onClick: l, size: "small", variant: "ghost" }, n)), e ? /* @__PURE__ */ a.createElement(fe, { size: "\
small", variant: "ghost", onClick: t }, /* @__PURE__ */ a.createElement(Ol, null), "Hide notifications") : /* @__PURE__ */ a.createElement(fe,
  { size: "small", variant: "ghost", onClick: t }, /* @__PURE__ */ a.createElement(Hr, null), "Show notifications"));
}, "WhatsNewFooter"), bx = S.iframe(
  {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    border: 0,
    margin: 0,
    padding: 0,
    width: "100%",
    height: "calc(100% - 80px)",
    background: "white"
  },
  ({ isLoaded: e }) => ({ visibility: e ? "visible" : "hidden" })
), xx = S((e) => /* @__PURE__ */ a.createElement(Nr, { ...e }))(({ theme: e }) => ({
  color: e.textMutedColor,
  width: 32,
  height: 32,
  margin: "0 auto"
})), Ix = /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(tm, null, /* @__PURE__ */ a.createElement(gx, null, /* @__PURE__ */ a.createElement(
Pr, null)), /* @__PURE__ */ a.createElement(om, null, "Loading...")), "WhatsNewLoader"), Sx = /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(
tm, null, /* @__PURE__ */ a.createElement(xx, null), /* @__PURE__ */ a.createElement(om, null, "The page couldn't be loaded. Check your inte\
rnet connection and try again.")), "MaxWaitTimeMessaging"), wx = /* @__PURE__ */ s(({
  didHitMaxWaitTime: e,
  isLoaded: t,
  onLoad: o,
  url: i,
  onCopyLink: n,
  onToggleNotifications: r,
  isNotificationsEnabled: l
}) => /* @__PURE__ */ a.createElement(Ne, null, !t && !e && /* @__PURE__ */ a.createElement(Ix, null), e ? /* @__PURE__ */ a.createElement(Sx,
null) : /* @__PURE__ */ a.createElement(a.Fragment, null, /* @__PURE__ */ a.createElement(bx, { isLoaded: t, onLoad: o, src: i, title: "What\
's new?" }), /* @__PURE__ */ a.createElement(
  vx,
  {
    isNotificationsEnabled: l,
    onToggleNotifications: r,
    onCopyLink: n
  }
))), "PureWhatsNewScreen"), Ex = 1e4, rm = /* @__PURE__ */ s(() => {
  let e = pe(), t = Ze(), { whatsNewData: o } = t, [i, n] = U(!1), [r, l] = U(!1);
  if (z(() => {
    let p = setTimeout(() => !i && l(!0), Ex);
    return () => clearTimeout(p);
  }, [i]), o?.status !== "SUCCESS")
    return null;
  let u = !o.disableWhatsNewNotifications;
  return /* @__PURE__ */ a.createElement(
    wx,
    {
      didHitMaxWaitTime: r,
      isLoaded: i,
      onLoad: () => {
        e.whatsNewHasBeenRead(), n(!0);
      },
      url: o.url,
      isNotificationsEnabled: u,
      onCopyLink: () => {
        navigator.clipboard?.writeText(o.blogUrl ?? o.url);
      },
      onToggleNotifications: () => {
        u ? re.confirm("All update notifications will no longer be shown. Are you sure?") && e.toggleWhatsNewNotifications() : e.toggleWhatsNewNotifications();
      }
    }
  );
}, "WhatsNewScreen");

// src/manager/settings/whats_new_page.tsx
var nm = /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(rm, null), "WhatsNewPage");

// src/manager/settings/index.tsx
var { document: im } = re, Cx = S.div(({ theme: e }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  height: 40,
  boxShadow: `${e.appBorderColor}  0 -1px 0 0 inset`,
  background: e.barBg,
  paddingRight: 8
})), ma = a.memo(/* @__PURE__ */ s(function({
  changeTab: t,
  id: o,
  title: i
}) {
  return /* @__PURE__ */ a.createElement(Sr, null, ({ path: n }) => {
    let r = n.includes(`settings/${o}`);
    return /* @__PURE__ */ a.createElement(
      Lr,
      {
        id: `tabbutton-${o}`,
        className: ["tabbutton"].concat(r ? ["tabbutton-active"] : []).join(" "),
        type: "button",
        key: "id",
        active: r,
        onClick: () => t(o),
        role: "tab"
      },
      i
    );
  });
}, "TabBarButton")), Tx = S(Ar)(({ theme: e }) => ({
  background: e.background.content
})), _x = /* @__PURE__ */ s(({ changeTab: e, onClose: t, enableShortcuts: o = !0, enableWhatsNew: i }) => (a.useEffect(() => {
  let n = /* @__PURE__ */ s((r) => {
    !o || r.repeat || Rt(!1, r) && tt("Escape", r) && (r.preventDefault(), t());
  }, "handleEscape");
  return im.addEventListener("keydown", n), () => im.removeEventListener("keydown", n);
}, [o, t]), /* @__PURE__ */ a.createElement(Ne, null, /* @__PURE__ */ a.createElement(Cx, { className: "sb-bar" }, /* @__PURE__ */ a.createElement(
Mr, { role: "tablist" }, /* @__PURE__ */ a.createElement(ma, { id: "about", title: "About", changeTab: e }), i && /* @__PURE__ */ a.createElement(
ma, { id: "whats-new", title: "What's new?", changeTab: e }), /* @__PURE__ */ a.createElement(ma, { id: "shortcuts", title: "Keyboard shortc\
uts", changeTab: e })), /* @__PURE__ */ a.createElement(
  te,
  {
    onClick: (n) => (n.preventDefault(), t()),
    title: "Close settings page"
  },
  /* @__PURE__ */ a.createElement(ct, null)
)), /* @__PURE__ */ a.createElement(Tx, { vertical: !0, horizontal: !1 }, /* @__PURE__ */ a.createElement(qo, { path: "about" }, /* @__PURE__ */ a.
createElement(Qf, { key: "about" })), /* @__PURE__ */ a.createElement(qo, { path: "whats-new" }, /* @__PURE__ */ a.createElement(nm, { key: "\
whats-new" })), /* @__PURE__ */ a.createElement(qo, { path: "shortcuts" }, /* @__PURE__ */ a.createElement(em, { key: "shortcuts" }))))), "P\
ages"), kx = /* @__PURE__ */ s(() => {
  let e = pe(), t = Ze(), o = /* @__PURE__ */ s((i) => e.changeSettingsTab(i), "changeTab");
  return /* @__PURE__ */ a.createElement(
    _x,
    {
      enableWhatsNew: t.whatsNewData?.status === "SUCCESS",
      enableShortcuts: t.ui.enableShortcuts,
      changeTab: o,
      onClose: e.closeSettings
    }
  );
}, "SettingsPages"), sm = {
  id: "settings",
  url: "/settings/",
  title: "Settings",
  type: we.experimental_PAGE,
  render: /* @__PURE__ */ s(() => /* @__PURE__ */ a.createElement(qo, { path: "/settings/", startsWith: !0 }, /* @__PURE__ */ a.createElement(
  kx, null)), "render")
};

// src/manager/index.tsx
ei.displayName = "ThemeProvider";
Nt.displayName = "HelmetProvider";
var Ox = /* @__PURE__ */ s(({ provider: e }) => /* @__PURE__ */ a.createElement(Nt, { key: "helmet.Provider" }, /* @__PURE__ */ a.createElement(
Ha, { key: "location.provider" }, /* @__PURE__ */ a.createElement(Px, { provider: e }))), "Root"), Px = /* @__PURE__ */ s(({ provider: e }) => {
  let t = za();
  return /* @__PURE__ */ a.createElement(Sr, { key: "location.consumer" }, (o) => /* @__PURE__ */ a.createElement(
    Pa,
    {
      key: "manager",
      provider: e,
      ...o,
      navigate: t,
      docsOptions: re?.DOCS_OPTIONS || {}
    },
    (i) => {
      let { state: n, api: r } = i, l = M(
        (p) => {
          r.setSizes(p);
        },
        [r]
      ), u = Y(
        () => [sm, ...Object.values(r.getElements(we.experimental_PAGE))],
        [Object.keys(r.getElements(we.experimental_PAGE)).join()]
      );
      return /* @__PURE__ */ a.createElement(ei, { key: "theme.provider", theme: ja(n.theme) }, /* @__PURE__ */ a.createElement(hl, null, /* @__PURE__ */ a.
      createElement(
        Gf,
        {
          key: "app",
          pages: u,
          managerLayoutState: {
            ...n.layout,
            viewMode: n.viewMode
          },
          hasTab: !!r.getQueryParam("tab"),
          setManagerLayoutState: l
        }
      )));
    }
  ));
}, "Main");
function am(e, t) {
  if (!(t instanceof Io))
    throw new $a();
  Ba(e).render(/* @__PURE__ */ a.createElement(Ox, { key: "root", provider: t }));
}
s(am, "renderStorybookUI");

// src/manager/runtime.ts
var ga = class ga extends Io {
  constructor() {
    super();
    let t = ya({ page: "manager" });
    ut.setChannel(t), t.emit(xa), this.addons = ut, this.channel = t, re.__STORYBOOK_ADDONS_CHANNEL__ = t;
  }
  getElements(t) {
    return this.addons.getElements(t);
  }
  getConfig() {
    return this.addons.getConfig();
  }
  handleAPI(t) {
    this.addons.loadAddons(t);
  }
};
s(ga, "ReactProvider");
var ha = ga, { document: Ax } = re, Dx = Ax.getElementById("root");
setTimeout(() => {
  am(Dx, new ha());
}, 0);
