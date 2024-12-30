var Mi = Object.create;
var zr = Object.defineProperty;
var qi = Object.getOwnPropertyDescriptor;
var Ui = Object.getOwnPropertyNames;
var Bi = Object.getPrototypeOf, Gi = Object.prototype.hasOwnProperty;
var s = (r, e) => zr(r, "name", { value: e, configurable: !0 }), or = /* @__PURE__ */ ((r) => typeof require < "u" ? require : typeof Proxy <
"u" ? new Proxy(r, {
  get: (e, t) => (typeof require < "u" ? require : e)[t]
}) : r)(function(r) {
  if (typeof require < "u") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + r + '" is not supported');
});
var B = (r, e) => () => (e || r((e = { exports: {} }).exports, e), e.exports), Re = (r, e) => {
  for (var t in e)
    zr(r, t, { get: e[t], enumerable: !0 });
}, Vi = (r, e, t, o) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let n of Ui(e))
      !Gi.call(r, n) && n !== t && zr(r, n, { get: () => e[n], enumerable: !(o = qi(e, n)) || o.enumerable });
  return r;
};
var ue = (r, e, t) => (t = r != null ? Mi(Bi(r)) : {}, Vi(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  e || !r || !r.__esModule ? zr(t, "default", { value: r, enumerable: !0 }) : t,
  r
));

// ../node_modules/memoizerific/memoizerific.js
var Xr = B((Kn, oo) => {
  (function(r) {
    if (typeof Kn == "object" && typeof oo < "u")
      oo.exports = r();
    else if (typeof define == "function" && define.amd)
      define([], r);
    else {
      var e;
      typeof window < "u" ? e = window : typeof global < "u" ? e = global : typeof self < "u" ? e = self : e = this, e.memoizerific = r();
    }
  })(function() {
    var r, e, t;
    return (/* @__PURE__ */ s(function o(n, a, l) {
      function c(u, d) {
        if (!a[u]) {
          if (!n[u]) {
            var y = typeof or == "function" && or;
            if (!d && y) return y(u, !0);
            if (i) return i(u, !0);
            var g = new Error("Cannot find module '" + u + "'");
            throw g.code = "MODULE_NOT_FOUND", g;
          }
          var m = a[u] = { exports: {} };
          n[u][0].call(m.exports, function(S) {
            var h = n[u][1][S];
            return c(h || S);
          }, m, m.exports, o, n, a, l);
        }
        return a[u].exports;
      }
      s(c, "s");
      for (var i = typeof or == "function" && or, p = 0; p < l.length; p++) c(l[p]);
      return c;
    }, "e"))({ 1: [function(o, n, a) {
      n.exports = function(l) {
        if (typeof Map != "function" || l) {
          var c = o("./similar");
          return new c();
        } else
          return /* @__PURE__ */ new Map();
      };
    }, { "./similar": 2 }], 2: [function(o, n, a) {
      function l() {
        return this.list = [], this.lastItem = void 0, this.size = 0, this;
      }
      s(l, "Similar"), l.prototype.get = function(c) {
        var i;
        if (this.lastItem && this.isEqual(this.lastItem.key, c))
          return this.lastItem.val;
        if (i = this.indexOf(c), i >= 0)
          return this.lastItem = this.list[i], this.list[i].val;
      }, l.prototype.set = function(c, i) {
        var p;
        return this.lastItem && this.isEqual(this.lastItem.key, c) ? (this.lastItem.val = i, this) : (p = this.indexOf(c), p >= 0 ? (this.lastItem =
        this.list[p], this.list[p].val = i, this) : (this.lastItem = { key: c, val: i }, this.list.push(this.lastItem), this.size++, this));
      }, l.prototype.delete = function(c) {
        var i;
        if (this.lastItem && this.isEqual(this.lastItem.key, c) && (this.lastItem = void 0), i = this.indexOf(c), i >= 0)
          return this.size--, this.list.splice(i, 1)[0];
      }, l.prototype.has = function(c) {
        var i;
        return this.lastItem && this.isEqual(this.lastItem.key, c) ? !0 : (i = this.indexOf(c), i >= 0 ? (this.lastItem = this.list[i], !0) :
        !1);
      }, l.prototype.forEach = function(c, i) {
        var p;
        for (p = 0; p < this.size; p++)
          c.call(i || this, this.list[p].val, this.list[p].key, this);
      }, l.prototype.indexOf = function(c) {
        var i;
        for (i = 0; i < this.size; i++)
          if (this.isEqual(this.list[i].key, c))
            return i;
        return -1;
      }, l.prototype.isEqual = function(c, i) {
        return c === i || c !== c && i !== i;
      }, n.exports = l;
    }, {}], 3: [function(o, n, a) {
      var l = o("map-or-similar");
      n.exports = function(u) {
        var d = new l(!1), y = [];
        return function(g) {
          var m = /* @__PURE__ */ s(function() {
            var S = d, h, A, b = arguments.length - 1, E = Array(b + 1), T = !0, _;
            if ((m.numArgs || m.numArgs === 0) && m.numArgs !== b + 1)
              throw new Error("Memoizerific functions should always be called with the same number of arguments");
            for (_ = 0; _ < b; _++) {
              if (E[_] = {
                cacheItem: S,
                arg: arguments[_]
              }, S.has(arguments[_])) {
                S = S.get(arguments[_]);
                continue;
              }
              T = !1, h = new l(!1), S.set(arguments[_], h), S = h;
            }
            return T && (S.has(arguments[b]) ? A = S.get(arguments[b]) : T = !1), T || (A = g.apply(null, arguments), S.set(arguments[b], A)),
            u > 0 && (E[b] = {
              cacheItem: S,
              arg: arguments[b]
            }, T ? c(y, E) : y.push(E), y.length > u && i(y.shift())), m.wasMemoized = T, m.numArgs = b + 1, A;
          }, "memoizerific");
          return m.limit = u, m.wasMemoized = !1, m.cache = d, m.lru = y, m;
        };
      };
      function c(u, d) {
        var y = u.length, g = d.length, m, S, h;
        for (S = 0; S < y; S++) {
          for (m = !0, h = 0; h < g; h++)
            if (!p(u[S][h].arg, d[h].arg)) {
              m = !1;
              break;
            }
          if (m)
            break;
        }
        u.push(u.splice(S, 1)[0]);
      }
      s(c, "moveToMostRecentLru");
      function i(u) {
        var d = u.length, y = u[d - 1], g, m;
        for (y.cacheItem.delete(y.arg), m = d - 2; m >= 0 && (y = u[m], g = y.cacheItem.get(y.arg), !g || !g.size); m--)
          y.cacheItem.delete(y.arg);
      }
      s(i, "removeCachedResult");
      function p(u, d) {
        return u === d || u !== u && d !== d;
      }
      s(p, "isEqual");
    }, { "map-or-similar": 1 }] }, {}, [3])(3);
  });
});

// ../node_modules/picoquery/lib/string-util.js
var xn = B((Rn) => {
  "use strict";
  Object.defineProperty(Rn, "__esModule", { value: !0 });
  Rn.encodeString = iu;
  var oe = Array.from({ length: 256 }, (r, e) => "%" + ((e < 16 ? "0" : "") + e.toString(16)).toUpperCase()), au = new Int8Array([
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
  function iu(r) {
    let e = r.length;
    if (e === 0)
      return "";
    let t = "", o = 0, n = 0;
    e: for (; n < e; n++) {
      let a = r.charCodeAt(n);
      for (; a < 128; ) {
        if (au[a] !== 1 && (o < n && (t += r.slice(o, n)), o = n + 1, t += oe[a]), ++n === e)
          break e;
        a = r.charCodeAt(n);
      }
      if (o < n && (t += r.slice(o, n)), a < 2048) {
        o = n + 1, t += oe[192 | a >> 6] + oe[128 | a & 63];
        continue;
      }
      if (a < 55296 || a >= 57344) {
        o = n + 1, t += oe[224 | a >> 12] + oe[128 | a >> 6 & 63] + oe[128 | a & 63];
        continue;
      }
      if (++n, n >= e)
        throw new Error("URI malformed");
      let l = r.charCodeAt(n) & 1023;
      o = n + 1, a = 65536 + ((a & 1023) << 10 | l), t += oe[240 | a >> 18] + oe[128 | a >> 12 & 63] + oe[128 | a >> 6 & 63] + oe[128 | a & 63];
    }
    return o === 0 ? r : o < e ? t + r.slice(o) : t;
  }
  s(iu, "encodeString");
});

// ../node_modules/picoquery/lib/shared.js
var St = B((ne) => {
  "use strict";
  Object.defineProperty(ne, "__esModule", { value: !0 });
  ne.defaultOptions = ne.defaultShouldSerializeObject = ne.defaultValueSerializer = void 0;
  var An = xn(), lu = /* @__PURE__ */ s((r) => {
    switch (typeof r) {
      case "string":
        return (0, An.encodeString)(r);
      case "bigint":
      case "boolean":
        return "" + r;
      case "number":
        if (Number.isFinite(r))
          return r < 1e21 ? "" + r : (0, An.encodeString)("" + r);
        break;
    }
    return r instanceof Date ? (0, An.encodeString)(r.toISOString()) : "";
  }, "defaultValueSerializer");
  ne.defaultValueSerializer = lu;
  var cu = /* @__PURE__ */ s((r) => r instanceof Date, "defaultShouldSerializeObject");
  ne.defaultShouldSerializeObject = cu;
  var Na = /* @__PURE__ */ s((r) => r, "identityFunc");
  ne.defaultOptions = {
    nesting: !0,
    nestingSyntax: "dot",
    arrayRepeat: !1,
    arrayRepeatSyntax: "repeat",
    delimiter: 38,
    valueDeserializer: Na,
    valueSerializer: ne.defaultValueSerializer,
    keyDeserializer: Na,
    shouldSerializeObject: ne.defaultShouldSerializeObject
  };
});

// ../node_modules/picoquery/lib/object-util.js
var _n = B((bt) => {
  "use strict";
  Object.defineProperty(bt, "__esModule", { value: !0 });
  bt.getDeepObject = uu;
  bt.stringifyObject = La;
  var ke = St(), pu = xn();
  function du(r) {
    return r === "__proto__" || r === "constructor" || r === "prototype";
  }
  s(du, "isPrototypeKey");
  function uu(r, e, t, o, n) {
    if (du(e))
      return r;
    let a = r[e];
    return typeof a == "object" && a !== null ? a : !o && (n || typeof t == "number" || typeof t == "string" && t * 0 === 0 && t.indexOf(".") ===
    -1) ? r[e] = [] : r[e] = {};
  }
  s(uu, "getDeepObject");
  var fu = 20, yu = "[]", mu = "[", hu = "]", gu = ".";
  function La(r, e, t = 0, o, n) {
    let { nestingSyntax: a = ke.defaultOptions.nestingSyntax, arrayRepeat: l = ke.defaultOptions.arrayRepeat, arrayRepeatSyntax: c = ke.defaultOptions.
    arrayRepeatSyntax, nesting: i = ke.defaultOptions.nesting, delimiter: p = ke.defaultOptions.delimiter, valueSerializer: u = ke.defaultOptions.
    valueSerializer, shouldSerializeObject: d = ke.defaultOptions.shouldSerializeObject } = e, y = typeof p == "number" ? String.fromCharCode(
    p) : p, g = n === !0 && l, m = a === "dot" || a === "js" && !n;
    if (t > fu)
      return "";
    let S = "", h = !0, A = !1;
    for (let b in r) {
      let E = r[b], T;
      o ? (T = o, g ? c === "bracket" && (T += yu) : m ? (T += gu, T += b) : (T += mu, T += b, T += hu)) : T = b, h || (S += y), typeof E ==
      "object" && E !== null && !d(E) ? (A = E.pop !== void 0, (i || l && A) && (S += La(E, e, t + 1, T, A))) : (S += (0, pu.encodeString)(T),
      S += "=", S += u(E, b)), h && (h = !1);
    }
    return S;
  }
  s(La, "stringifyObject");
});

// ../node_modules/fast-decode-uri-component/index.js
var Ua = B((YS, qa) => {
  "use strict";
  var ja = 12, Su = 0, wn = [
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
  function bu(r) {
    var e = r.indexOf("%");
    if (e === -1) return r;
    for (var t = r.length, o = "", n = 0, a = 0, l = e, c = ja; e > -1 && e < t; ) {
      var i = Ma(r[e + 1], 4), p = Ma(r[e + 2], 0), u = i | p, d = wn[u];
      if (c = wn[256 + c + d], a = a << 6 | u & wn[364 + d], c === ja)
        o += r.slice(n, l), o += a <= 65535 ? String.fromCharCode(a) : String.fromCharCode(
          55232 + (a >> 10),
          56320 + (a & 1023)
        ), a = 0, n = e + 3, e = l = r.indexOf("%", n);
      else {
        if (c === Su)
          return null;
        if (e += 3, e < t && r.charCodeAt(e) === 37) continue;
        return null;
      }
    }
    return o + r.slice(n);
  }
  s(bu, "decodeURIComponent");
  var Tu = {
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
  function Ma(r, e) {
    var t = Tu[r];
    return t === void 0 ? 255 : t << e;
  }
  s(Ma, "hexCodeToInt");
  qa.exports = bu;
});

// ../node_modules/picoquery/lib/parse.js
var Ha = B((pe) => {
  "use strict";
  var Eu = pe && pe.__importDefault || function(r) {
    return r && r.__esModule ? r : { default: r };
  };
  Object.defineProperty(pe, "__esModule", { value: !0 });
  pe.numberValueDeserializer = pe.numberKeyDeserializer = void 0;
  pe.parse = Au;
  var Tt = _n(), Ne = St(), Ba = Eu(Ua()), Ru = /* @__PURE__ */ s((r) => {
    let e = Number(r);
    return Number.isNaN(e) ? r : e;
  }, "numberKeyDeserializer");
  pe.numberKeyDeserializer = Ru;
  var xu = /* @__PURE__ */ s((r) => {
    let e = Number(r);
    return Number.isNaN(e) ? r : e;
  }, "numberValueDeserializer");
  pe.numberValueDeserializer = xu;
  var Ga = /\+/g, Va = /* @__PURE__ */ s(function() {
  }, "Empty");
  Va.prototype = /* @__PURE__ */ Object.create(null);
  function Et(r, e, t, o, n) {
    let a = r.substring(e, t);
    return o && (a = a.replace(Ga, " ")), n && (a = (0, Ba.default)(a) || a), a;
  }
  s(Et, "computeKeySlice");
  function Au(r, e) {
    let { valueDeserializer: t = Ne.defaultOptions.valueDeserializer, keyDeserializer: o = Ne.defaultOptions.keyDeserializer, arrayRepeatSyntax: n = Ne.
    defaultOptions.arrayRepeatSyntax, nesting: a = Ne.defaultOptions.nesting, arrayRepeat: l = Ne.defaultOptions.arrayRepeat, nestingSyntax: c = Ne.
    defaultOptions.nestingSyntax, delimiter: i = Ne.defaultOptions.delimiter } = e ?? {}, p = typeof i == "string" ? i.charCodeAt(0) : i, u = c ===
    "js", d = new Va();
    if (typeof r != "string")
      return d;
    let y = r.length, g = "", m = -1, S = -1, h = -1, A = d, b, E = "", T = "", _ = !1, P = !1, D = !1, O = !1, U = !1, J = !1, de = !1, k = 0,
    F = -1, M = -1, N = -1;
    for (let I = 0; I < y + 1; I++) {
      if (k = I !== y ? r.charCodeAt(I) : p, k === p) {
        if (de = S > m, de || (S = I), h !== S - 1 && (T = Et(r, h + 1, F > -1 ? F : S, D, _), E = o(T), b !== void 0 && (A = (0, Tt.getDeepObject)(
        A, b, E, u && U, u && J))), de || E !== "") {
          de && (g = r.slice(S + 1, I), O && (g = g.replace(Ga, " ")), P && (g = (0, Ba.default)(g) || g));
          let V = t(g, E);
          if (l) {
            let Q = A[E];
            Q === void 0 ? F > -1 ? A[E] = [V] : A[E] = V : Q.pop ? Q.push(V) : A[E] = [Q, V];
          } else
            A[E] = V;
        }
        g = "", m = I, S = I, _ = !1, P = !1, D = !1, O = !1, U = !1, J = !1, F = -1, h = I, A = d, b = void 0, E = "";
      } else k === 93 ? (l && n === "bracket" && N === 91 && (F = M), a && (c === "index" || u) && S <= m && (h !== M && (T = Et(r, h + 1, I,
      D, _), E = o(T), b !== void 0 && (A = (0, Tt.getDeepObject)(A, b, E, void 0, u)), b = E, D = !1, _ = !1), h = I, J = !0, U = !1)) : k ===
      46 ? a && (c === "dot" || u) && S <= m && (h !== M && (T = Et(r, h + 1, I, D, _), E = o(T), b !== void 0 && (A = (0, Tt.getDeepObject)(
      A, b, E, u)), b = E, D = !1, _ = !1), U = !0, J = !1, h = I) : k === 91 ? a && (c === "index" || u) && S <= m && (h !== M && (T = Et(r,
      h + 1, I, D, _), E = o(T), u && b !== void 0 && (A = (0, Tt.getDeepObject)(A, b, E, u)), b = E, D = !1, _ = !1, U = !1, J = !0), h = I) :
      k === 61 ? S <= m ? S = I : P = !0 : k === 43 ? S > m ? O = !0 : D = !0 : k === 37 && (S > m ? P = !0 : _ = !0);
      M = I, N = k;
    }
    return d;
  }
  s(Au, "parse");
});

// ../node_modules/picoquery/lib/stringify.js
var za = B((vn) => {
  "use strict";
  Object.defineProperty(vn, "__esModule", { value: !0 });
  vn.stringify = wu;
  var _u = _n();
  function wu(r, e) {
    if (r === null || typeof r != "object")
      return "";
    let t = e ?? {};
    return (0, _u.stringifyObject)(r, t);
  }
  s(wu, "stringify");
});

// ../node_modules/picoquery/lib/main.js
var Rt = B((re) => {
  "use strict";
  var vu = re && re.__createBinding || (Object.create ? function(r, e, t, o) {
    o === void 0 && (o = t);
    var n = Object.getOwnPropertyDescriptor(e, t);
    (!n || ("get" in n ? !e.__esModule : n.writable || n.configurable)) && (n = { enumerable: !0, get: /* @__PURE__ */ s(function() {
      return e[t];
    }, "get") }), Object.defineProperty(r, o, n);
  } : function(r, e, t, o) {
    o === void 0 && (o = t), r[o] = e[t];
  }), Pu = re && re.__exportStar || function(r, e) {
    for (var t in r) t !== "default" && !Object.prototype.hasOwnProperty.call(e, t) && vu(e, r, t);
  };
  Object.defineProperty(re, "__esModule", { value: !0 });
  re.stringify = re.parse = void 0;
  var Cu = Ha();
  Object.defineProperty(re, "parse", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return Cu.parse;
  }, "get") });
  var Ou = za();
  Object.defineProperty(re, "stringify", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return Ou.stringify;
  }, "get") });
  Pu(St(), re);
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/maps/entities.json
var In = B((db, ju) => {
  ju.exports = { Aacute: "\xC1", aacute: "\xE1", Abreve: "\u0102", abreve: "\u0103", ac: "\u223E", acd: "\u223F", acE: "\u223E\u0333", Acirc: "\
\xC2", acirc: "\xE2", acute: "\xB4", Acy: "\u0410", acy: "\u0430", AElig: "\xC6", aelig: "\xE6", af: "\u2061", Afr: "\u{1D504}", afr: "\u{1D51E}",
  Agrave: "\xC0", agrave: "\xE0", alefsym: "\u2135", aleph: "\u2135", Alpha: "\u0391", alpha: "\u03B1", Amacr: "\u0100", amacr: "\u0101", amalg: "\
\u2A3F", amp: "&", AMP: "&", andand: "\u2A55", And: "\u2A53", and: "\u2227", andd: "\u2A5C", andslope: "\u2A58", andv: "\u2A5A", ang: "\u2220",
  ange: "\u29A4", angle: "\u2220", angmsdaa: "\u29A8", angmsdab: "\u29A9", angmsdac: "\u29AA", angmsdad: "\u29AB", angmsdae: "\u29AC", angmsdaf: "\
\u29AD", angmsdag: "\u29AE", angmsdah: "\u29AF", angmsd: "\u2221", angrt: "\u221F", angrtvb: "\u22BE", angrtvbd: "\u299D", angsph: "\u2222",
  angst: "\xC5", angzarr: "\u237C", Aogon: "\u0104", aogon: "\u0105", Aopf: "\u{1D538}", aopf: "\u{1D552}", apacir: "\u2A6F", ap: "\u2248", apE: "\
\u2A70", ape: "\u224A", apid: "\u224B", apos: "'", ApplyFunction: "\u2061", approx: "\u2248", approxeq: "\u224A", Aring: "\xC5", aring: "\xE5",
  Ascr: "\u{1D49C}", ascr: "\u{1D4B6}", Assign: "\u2254", ast: "*", asymp: "\u2248", asympeq: "\u224D", Atilde: "\xC3", atilde: "\xE3", Auml: "\
\xC4", auml: "\xE4", awconint: "\u2233", awint: "\u2A11", backcong: "\u224C", backepsilon: "\u03F6", backprime: "\u2035", backsim: "\u223D",
  backsimeq: "\u22CD", Backslash: "\u2216", Barv: "\u2AE7", barvee: "\u22BD", barwed: "\u2305", Barwed: "\u2306", barwedge: "\u2305", bbrk: "\
\u23B5", bbrktbrk: "\u23B6", bcong: "\u224C", Bcy: "\u0411", bcy: "\u0431", bdquo: "\u201E", becaus: "\u2235", because: "\u2235", Because: "\
\u2235", bemptyv: "\u29B0", bepsi: "\u03F6", bernou: "\u212C", Bernoullis: "\u212C", Beta: "\u0392", beta: "\u03B2", beth: "\u2136", between: "\
\u226C", Bfr: "\u{1D505}", bfr: "\u{1D51F}", bigcap: "\u22C2", bigcirc: "\u25EF", bigcup: "\u22C3", bigodot: "\u2A00", bigoplus: "\u2A01", bigotimes: "\
\u2A02", bigsqcup: "\u2A06", bigstar: "\u2605", bigtriangledown: "\u25BD", bigtriangleup: "\u25B3", biguplus: "\u2A04", bigvee: "\u22C1", bigwedge: "\
\u22C0", bkarow: "\u290D", blacklozenge: "\u29EB", blacksquare: "\u25AA", blacktriangle: "\u25B4", blacktriangledown: "\u25BE", blacktriangleleft: "\
\u25C2", blacktriangleright: "\u25B8", blank: "\u2423", blk12: "\u2592", blk14: "\u2591", blk34: "\u2593", block: "\u2588", bne: "=\u20E5", bnequiv: "\
\u2261\u20E5", bNot: "\u2AED", bnot: "\u2310", Bopf: "\u{1D539}", bopf: "\u{1D553}", bot: "\u22A5", bottom: "\u22A5", bowtie: "\u22C8", boxbox: "\
\u29C9", boxdl: "\u2510", boxdL: "\u2555", boxDl: "\u2556", boxDL: "\u2557", boxdr: "\u250C", boxdR: "\u2552", boxDr: "\u2553", boxDR: "\u2554",
  boxh: "\u2500", boxH: "\u2550", boxhd: "\u252C", boxHd: "\u2564", boxhD: "\u2565", boxHD: "\u2566", boxhu: "\u2534", boxHu: "\u2567", boxhU: "\
\u2568", boxHU: "\u2569", boxminus: "\u229F", boxplus: "\u229E", boxtimes: "\u22A0", boxul: "\u2518", boxuL: "\u255B", boxUl: "\u255C", boxUL: "\
\u255D", boxur: "\u2514", boxuR: "\u2558", boxUr: "\u2559", boxUR: "\u255A", boxv: "\u2502", boxV: "\u2551", boxvh: "\u253C", boxvH: "\u256A",
  boxVh: "\u256B", boxVH: "\u256C", boxvl: "\u2524", boxvL: "\u2561", boxVl: "\u2562", boxVL: "\u2563", boxvr: "\u251C", boxvR: "\u255E", boxVr: "\
\u255F", boxVR: "\u2560", bprime: "\u2035", breve: "\u02D8", Breve: "\u02D8", brvbar: "\xA6", bscr: "\u{1D4B7}", Bscr: "\u212C", bsemi: "\u204F",
  bsim: "\u223D", bsime: "\u22CD", bsolb: "\u29C5", bsol: "\\", bsolhsub: "\u27C8", bull: "\u2022", bullet: "\u2022", bump: "\u224E", bumpE: "\
\u2AAE", bumpe: "\u224F", Bumpeq: "\u224E", bumpeq: "\u224F", Cacute: "\u0106", cacute: "\u0107", capand: "\u2A44", capbrcup: "\u2A49", capcap: "\
\u2A4B", cap: "\u2229", Cap: "\u22D2", capcup: "\u2A47", capdot: "\u2A40", CapitalDifferentialD: "\u2145", caps: "\u2229\uFE00", caret: "\u2041",
  caron: "\u02C7", Cayleys: "\u212D", ccaps: "\u2A4D", Ccaron: "\u010C", ccaron: "\u010D", Ccedil: "\xC7", ccedil: "\xE7", Ccirc: "\u0108", ccirc: "\
\u0109", Cconint: "\u2230", ccups: "\u2A4C", ccupssm: "\u2A50", Cdot: "\u010A", cdot: "\u010B", cedil: "\xB8", Cedilla: "\xB8", cemptyv: "\u29B2",
  cent: "\xA2", centerdot: "\xB7", CenterDot: "\xB7", cfr: "\u{1D520}", Cfr: "\u212D", CHcy: "\u0427", chcy: "\u0447", check: "\u2713", checkmark: "\
\u2713", Chi: "\u03A7", chi: "\u03C7", circ: "\u02C6", circeq: "\u2257", circlearrowleft: "\u21BA", circlearrowright: "\u21BB", circledast: "\
\u229B", circledcirc: "\u229A", circleddash: "\u229D", CircleDot: "\u2299", circledR: "\xAE", circledS: "\u24C8", CircleMinus: "\u2296", CirclePlus: "\
\u2295", CircleTimes: "\u2297", cir: "\u25CB", cirE: "\u29C3", cire: "\u2257", cirfnint: "\u2A10", cirmid: "\u2AEF", cirscir: "\u29C2", ClockwiseContourIntegral: "\
\u2232", CloseCurlyDoubleQuote: "\u201D", CloseCurlyQuote: "\u2019", clubs: "\u2663", clubsuit: "\u2663", colon: ":", Colon: "\u2237", Colone: "\
\u2A74", colone: "\u2254", coloneq: "\u2254", comma: ",", commat: "@", comp: "\u2201", compfn: "\u2218", complement: "\u2201", complexes: "\u2102",
  cong: "\u2245", congdot: "\u2A6D", Congruent: "\u2261", conint: "\u222E", Conint: "\u222F", ContourIntegral: "\u222E", copf: "\u{1D554}", Copf: "\
\u2102", coprod: "\u2210", Coproduct: "\u2210", copy: "\xA9", COPY: "\xA9", copysr: "\u2117", CounterClockwiseContourIntegral: "\u2233", crarr: "\
\u21B5", cross: "\u2717", Cross: "\u2A2F", Cscr: "\u{1D49E}", cscr: "\u{1D4B8}", csub: "\u2ACF", csube: "\u2AD1", csup: "\u2AD0", csupe: "\u2AD2",
  ctdot: "\u22EF", cudarrl: "\u2938", cudarrr: "\u2935", cuepr: "\u22DE", cuesc: "\u22DF", cularr: "\u21B6", cularrp: "\u293D", cupbrcap: "\u2A48",
  cupcap: "\u2A46", CupCap: "\u224D", cup: "\u222A", Cup: "\u22D3", cupcup: "\u2A4A", cupdot: "\u228D", cupor: "\u2A45", cups: "\u222A\uFE00",
  curarr: "\u21B7", curarrm: "\u293C", curlyeqprec: "\u22DE", curlyeqsucc: "\u22DF", curlyvee: "\u22CE", curlywedge: "\u22CF", curren: "\xA4",
  curvearrowleft: "\u21B6", curvearrowright: "\u21B7", cuvee: "\u22CE", cuwed: "\u22CF", cwconint: "\u2232", cwint: "\u2231", cylcty: "\u232D",
  dagger: "\u2020", Dagger: "\u2021", daleth: "\u2138", darr: "\u2193", Darr: "\u21A1", dArr: "\u21D3", dash: "\u2010", Dashv: "\u2AE4", dashv: "\
\u22A3", dbkarow: "\u290F", dblac: "\u02DD", Dcaron: "\u010E", dcaron: "\u010F", Dcy: "\u0414", dcy: "\u0434", ddagger: "\u2021", ddarr: "\u21CA",
  DD: "\u2145", dd: "\u2146", DDotrahd: "\u2911", ddotseq: "\u2A77", deg: "\xB0", Del: "\u2207", Delta: "\u0394", delta: "\u03B4", demptyv: "\
\u29B1", dfisht: "\u297F", Dfr: "\u{1D507}", dfr: "\u{1D521}", dHar: "\u2965", dharl: "\u21C3", dharr: "\u21C2", DiacriticalAcute: "\xB4", DiacriticalDot: "\
\u02D9", DiacriticalDoubleAcute: "\u02DD", DiacriticalGrave: "`", DiacriticalTilde: "\u02DC", diam: "\u22C4", diamond: "\u22C4", Diamond: "\u22C4",
  diamondsuit: "\u2666", diams: "\u2666", die: "\xA8", DifferentialD: "\u2146", digamma: "\u03DD", disin: "\u22F2", div: "\xF7", divide: "\xF7",
  divideontimes: "\u22C7", divonx: "\u22C7", DJcy: "\u0402", djcy: "\u0452", dlcorn: "\u231E", dlcrop: "\u230D", dollar: "$", Dopf: "\u{1D53B}",
  dopf: "\u{1D555}", Dot: "\xA8", dot: "\u02D9", DotDot: "\u20DC", doteq: "\u2250", doteqdot: "\u2251", DotEqual: "\u2250", dotminus: "\u2238",
  dotplus: "\u2214", dotsquare: "\u22A1", doublebarwedge: "\u2306", DoubleContourIntegral: "\u222F", DoubleDot: "\xA8", DoubleDownArrow: "\u21D3",
  DoubleLeftArrow: "\u21D0", DoubleLeftRightArrow: "\u21D4", DoubleLeftTee: "\u2AE4", DoubleLongLeftArrow: "\u27F8", DoubleLongLeftRightArrow: "\
\u27FA", DoubleLongRightArrow: "\u27F9", DoubleRightArrow: "\u21D2", DoubleRightTee: "\u22A8", DoubleUpArrow: "\u21D1", DoubleUpDownArrow: "\
\u21D5", DoubleVerticalBar: "\u2225", DownArrowBar: "\u2913", downarrow: "\u2193", DownArrow: "\u2193", Downarrow: "\u21D3", DownArrowUpArrow: "\
\u21F5", DownBreve: "\u0311", downdownarrows: "\u21CA", downharpoonleft: "\u21C3", downharpoonright: "\u21C2", DownLeftRightVector: "\u2950",
  DownLeftTeeVector: "\u295E", DownLeftVectorBar: "\u2956", DownLeftVector: "\u21BD", DownRightTeeVector: "\u295F", DownRightVectorBar: "\u2957",
  DownRightVector: "\u21C1", DownTeeArrow: "\u21A7", DownTee: "\u22A4", drbkarow: "\u2910", drcorn: "\u231F", drcrop: "\u230C", Dscr: "\u{1D49F}",
  dscr: "\u{1D4B9}", DScy: "\u0405", dscy: "\u0455", dsol: "\u29F6", Dstrok: "\u0110", dstrok: "\u0111", dtdot: "\u22F1", dtri: "\u25BF", dtrif: "\
\u25BE", duarr: "\u21F5", duhar: "\u296F", dwangle: "\u29A6", DZcy: "\u040F", dzcy: "\u045F", dzigrarr: "\u27FF", Eacute: "\xC9", eacute: "\xE9",
  easter: "\u2A6E", Ecaron: "\u011A", ecaron: "\u011B", Ecirc: "\xCA", ecirc: "\xEA", ecir: "\u2256", ecolon: "\u2255", Ecy: "\u042D", ecy: "\
\u044D", eDDot: "\u2A77", Edot: "\u0116", edot: "\u0117", eDot: "\u2251", ee: "\u2147", efDot: "\u2252", Efr: "\u{1D508}", efr: "\u{1D522}",
  eg: "\u2A9A", Egrave: "\xC8", egrave: "\xE8", egs: "\u2A96", egsdot: "\u2A98", el: "\u2A99", Element: "\u2208", elinters: "\u23E7", ell: "\
\u2113", els: "\u2A95", elsdot: "\u2A97", Emacr: "\u0112", emacr: "\u0113", empty: "\u2205", emptyset: "\u2205", EmptySmallSquare: "\u25FB",
  emptyv: "\u2205", EmptyVerySmallSquare: "\u25AB", emsp13: "\u2004", emsp14: "\u2005", emsp: "\u2003", ENG: "\u014A", eng: "\u014B", ensp: "\
\u2002", Eogon: "\u0118", eogon: "\u0119", Eopf: "\u{1D53C}", eopf: "\u{1D556}", epar: "\u22D5", eparsl: "\u29E3", eplus: "\u2A71", epsi: "\u03B5",
  Epsilon: "\u0395", epsilon: "\u03B5", epsiv: "\u03F5", eqcirc: "\u2256", eqcolon: "\u2255", eqsim: "\u2242", eqslantgtr: "\u2A96", eqslantless: "\
\u2A95", Equal: "\u2A75", equals: "=", EqualTilde: "\u2242", equest: "\u225F", Equilibrium: "\u21CC", equiv: "\u2261", equivDD: "\u2A78", eqvparsl: "\
\u29E5", erarr: "\u2971", erDot: "\u2253", escr: "\u212F", Escr: "\u2130", esdot: "\u2250", Esim: "\u2A73", esim: "\u2242", Eta: "\u0397", eta: "\
\u03B7", ETH: "\xD0", eth: "\xF0", Euml: "\xCB", euml: "\xEB", euro: "\u20AC", excl: "!", exist: "\u2203", Exists: "\u2203", expectation: "\u2130",
  exponentiale: "\u2147", ExponentialE: "\u2147", fallingdotseq: "\u2252", Fcy: "\u0424", fcy: "\u0444", female: "\u2640", ffilig: "\uFB03",
  fflig: "\uFB00", ffllig: "\uFB04", Ffr: "\u{1D509}", ffr: "\u{1D523}", filig: "\uFB01", FilledSmallSquare: "\u25FC", FilledVerySmallSquare: "\
\u25AA", fjlig: "fj", flat: "\u266D", fllig: "\uFB02", fltns: "\u25B1", fnof: "\u0192", Fopf: "\u{1D53D}", fopf: "\u{1D557}", forall: "\u2200",
  ForAll: "\u2200", fork: "\u22D4", forkv: "\u2AD9", Fouriertrf: "\u2131", fpartint: "\u2A0D", frac12: "\xBD", frac13: "\u2153", frac14: "\xBC",
  frac15: "\u2155", frac16: "\u2159", frac18: "\u215B", frac23: "\u2154", frac25: "\u2156", frac34: "\xBE", frac35: "\u2157", frac38: "\u215C",
  frac45: "\u2158", frac56: "\u215A", frac58: "\u215D", frac78: "\u215E", frasl: "\u2044", frown: "\u2322", fscr: "\u{1D4BB}", Fscr: "\u2131",
  gacute: "\u01F5", Gamma: "\u0393", gamma: "\u03B3", Gammad: "\u03DC", gammad: "\u03DD", gap: "\u2A86", Gbreve: "\u011E", gbreve: "\u011F",
  Gcedil: "\u0122", Gcirc: "\u011C", gcirc: "\u011D", Gcy: "\u0413", gcy: "\u0433", Gdot: "\u0120", gdot: "\u0121", ge: "\u2265", gE: "\u2267",
  gEl: "\u2A8C", gel: "\u22DB", geq: "\u2265", geqq: "\u2267", geqslant: "\u2A7E", gescc: "\u2AA9", ges: "\u2A7E", gesdot: "\u2A80", gesdoto: "\
\u2A82", gesdotol: "\u2A84", gesl: "\u22DB\uFE00", gesles: "\u2A94", Gfr: "\u{1D50A}", gfr: "\u{1D524}", gg: "\u226B", Gg: "\u22D9", ggg: "\u22D9",
  gimel: "\u2137", GJcy: "\u0403", gjcy: "\u0453", gla: "\u2AA5", gl: "\u2277", glE: "\u2A92", glj: "\u2AA4", gnap: "\u2A8A", gnapprox: "\u2A8A",
  gne: "\u2A88", gnE: "\u2269", gneq: "\u2A88", gneqq: "\u2269", gnsim: "\u22E7", Gopf: "\u{1D53E}", gopf: "\u{1D558}", grave: "`", GreaterEqual: "\
\u2265", GreaterEqualLess: "\u22DB", GreaterFullEqual: "\u2267", GreaterGreater: "\u2AA2", GreaterLess: "\u2277", GreaterSlantEqual: "\u2A7E",
  GreaterTilde: "\u2273", Gscr: "\u{1D4A2}", gscr: "\u210A", gsim: "\u2273", gsime: "\u2A8E", gsiml: "\u2A90", gtcc: "\u2AA7", gtcir: "\u2A7A",
  gt: ">", GT: ">", Gt: "\u226B", gtdot: "\u22D7", gtlPar: "\u2995", gtquest: "\u2A7C", gtrapprox: "\u2A86", gtrarr: "\u2978", gtrdot: "\u22D7",
  gtreqless: "\u22DB", gtreqqless: "\u2A8C", gtrless: "\u2277", gtrsim: "\u2273", gvertneqq: "\u2269\uFE00", gvnE: "\u2269\uFE00", Hacek: "\u02C7",
  hairsp: "\u200A", half: "\xBD", hamilt: "\u210B", HARDcy: "\u042A", hardcy: "\u044A", harrcir: "\u2948", harr: "\u2194", hArr: "\u21D4", harrw: "\
\u21AD", Hat: "^", hbar: "\u210F", Hcirc: "\u0124", hcirc: "\u0125", hearts: "\u2665", heartsuit: "\u2665", hellip: "\u2026", hercon: "\u22B9",
  hfr: "\u{1D525}", Hfr: "\u210C", HilbertSpace: "\u210B", hksearow: "\u2925", hkswarow: "\u2926", hoarr: "\u21FF", homtht: "\u223B", hookleftarrow: "\
\u21A9", hookrightarrow: "\u21AA", hopf: "\u{1D559}", Hopf: "\u210D", horbar: "\u2015", HorizontalLine: "\u2500", hscr: "\u{1D4BD}", Hscr: "\
\u210B", hslash: "\u210F", Hstrok: "\u0126", hstrok: "\u0127", HumpDownHump: "\u224E", HumpEqual: "\u224F", hybull: "\u2043", hyphen: "\u2010",
  Iacute: "\xCD", iacute: "\xED", ic: "\u2063", Icirc: "\xCE", icirc: "\xEE", Icy: "\u0418", icy: "\u0438", Idot: "\u0130", IEcy: "\u0415", iecy: "\
\u0435", iexcl: "\xA1", iff: "\u21D4", ifr: "\u{1D526}", Ifr: "\u2111", Igrave: "\xCC", igrave: "\xEC", ii: "\u2148", iiiint: "\u2A0C", iiint: "\
\u222D", iinfin: "\u29DC", iiota: "\u2129", IJlig: "\u0132", ijlig: "\u0133", Imacr: "\u012A", imacr: "\u012B", image: "\u2111", ImaginaryI: "\
\u2148", imagline: "\u2110", imagpart: "\u2111", imath: "\u0131", Im: "\u2111", imof: "\u22B7", imped: "\u01B5", Implies: "\u21D2", incare: "\
\u2105", in: "\u2208", infin: "\u221E", infintie: "\u29DD", inodot: "\u0131", intcal: "\u22BA", int: "\u222B", Int: "\u222C", integers: "\u2124",
  Integral: "\u222B", intercal: "\u22BA", Intersection: "\u22C2", intlarhk: "\u2A17", intprod: "\u2A3C", InvisibleComma: "\u2063", InvisibleTimes: "\
\u2062", IOcy: "\u0401", iocy: "\u0451", Iogon: "\u012E", iogon: "\u012F", Iopf: "\u{1D540}", iopf: "\u{1D55A}", Iota: "\u0399", iota: "\u03B9",
  iprod: "\u2A3C", iquest: "\xBF", iscr: "\u{1D4BE}", Iscr: "\u2110", isin: "\u2208", isindot: "\u22F5", isinE: "\u22F9", isins: "\u22F4", isinsv: "\
\u22F3", isinv: "\u2208", it: "\u2062", Itilde: "\u0128", itilde: "\u0129", Iukcy: "\u0406", iukcy: "\u0456", Iuml: "\xCF", iuml: "\xEF", Jcirc: "\
\u0134", jcirc: "\u0135", Jcy: "\u0419", jcy: "\u0439", Jfr: "\u{1D50D}", jfr: "\u{1D527}", jmath: "\u0237", Jopf: "\u{1D541}", jopf: "\u{1D55B}",
  Jscr: "\u{1D4A5}", jscr: "\u{1D4BF}", Jsercy: "\u0408", jsercy: "\u0458", Jukcy: "\u0404", jukcy: "\u0454", Kappa: "\u039A", kappa: "\u03BA",
  kappav: "\u03F0", Kcedil: "\u0136", kcedil: "\u0137", Kcy: "\u041A", kcy: "\u043A", Kfr: "\u{1D50E}", kfr: "\u{1D528}", kgreen: "\u0138", KHcy: "\
\u0425", khcy: "\u0445", KJcy: "\u040C", kjcy: "\u045C", Kopf: "\u{1D542}", kopf: "\u{1D55C}", Kscr: "\u{1D4A6}", kscr: "\u{1D4C0}", lAarr: "\
\u21DA", Lacute: "\u0139", lacute: "\u013A", laemptyv: "\u29B4", lagran: "\u2112", Lambda: "\u039B", lambda: "\u03BB", lang: "\u27E8", Lang: "\
\u27EA", langd: "\u2991", langle: "\u27E8", lap: "\u2A85", Laplacetrf: "\u2112", laquo: "\xAB", larrb: "\u21E4", larrbfs: "\u291F", larr: "\u2190",
  Larr: "\u219E", lArr: "\u21D0", larrfs: "\u291D", larrhk: "\u21A9", larrlp: "\u21AB", larrpl: "\u2939", larrsim: "\u2973", larrtl: "\u21A2",
  latail: "\u2919", lAtail: "\u291B", lat: "\u2AAB", late: "\u2AAD", lates: "\u2AAD\uFE00", lbarr: "\u290C", lBarr: "\u290E", lbbrk: "\u2772",
  lbrace: "{", lbrack: "[", lbrke: "\u298B", lbrksld: "\u298F", lbrkslu: "\u298D", Lcaron: "\u013D", lcaron: "\u013E", Lcedil: "\u013B", lcedil: "\
\u013C", lceil: "\u2308", lcub: "{", Lcy: "\u041B", lcy: "\u043B", ldca: "\u2936", ldquo: "\u201C", ldquor: "\u201E", ldrdhar: "\u2967", ldrushar: "\
\u294B", ldsh: "\u21B2", le: "\u2264", lE: "\u2266", LeftAngleBracket: "\u27E8", LeftArrowBar: "\u21E4", leftarrow: "\u2190", LeftArrow: "\u2190",
  Leftarrow: "\u21D0", LeftArrowRightArrow: "\u21C6", leftarrowtail: "\u21A2", LeftCeiling: "\u2308", LeftDoubleBracket: "\u27E6", LeftDownTeeVector: "\
\u2961", LeftDownVectorBar: "\u2959", LeftDownVector: "\u21C3", LeftFloor: "\u230A", leftharpoondown: "\u21BD", leftharpoonup: "\u21BC", leftleftarrows: "\
\u21C7", leftrightarrow: "\u2194", LeftRightArrow: "\u2194", Leftrightarrow: "\u21D4", leftrightarrows: "\u21C6", leftrightharpoons: "\u21CB",
  leftrightsquigarrow: "\u21AD", LeftRightVector: "\u294E", LeftTeeArrow: "\u21A4", LeftTee: "\u22A3", LeftTeeVector: "\u295A", leftthreetimes: "\
\u22CB", LeftTriangleBar: "\u29CF", LeftTriangle: "\u22B2", LeftTriangleEqual: "\u22B4", LeftUpDownVector: "\u2951", LeftUpTeeVector: "\u2960",
  LeftUpVectorBar: "\u2958", LeftUpVector: "\u21BF", LeftVectorBar: "\u2952", LeftVector: "\u21BC", lEg: "\u2A8B", leg: "\u22DA", leq: "\u2264",
  leqq: "\u2266", leqslant: "\u2A7D", lescc: "\u2AA8", les: "\u2A7D", lesdot: "\u2A7F", lesdoto: "\u2A81", lesdotor: "\u2A83", lesg: "\u22DA\uFE00",
  lesges: "\u2A93", lessapprox: "\u2A85", lessdot: "\u22D6", lesseqgtr: "\u22DA", lesseqqgtr: "\u2A8B", LessEqualGreater: "\u22DA", LessFullEqual: "\
\u2266", LessGreater: "\u2276", lessgtr: "\u2276", LessLess: "\u2AA1", lesssim: "\u2272", LessSlantEqual: "\u2A7D", LessTilde: "\u2272", lfisht: "\
\u297C", lfloor: "\u230A", Lfr: "\u{1D50F}", lfr: "\u{1D529}", lg: "\u2276", lgE: "\u2A91", lHar: "\u2962", lhard: "\u21BD", lharu: "\u21BC",
  lharul: "\u296A", lhblk: "\u2584", LJcy: "\u0409", ljcy: "\u0459", llarr: "\u21C7", ll: "\u226A", Ll: "\u22D8", llcorner: "\u231E", Lleftarrow: "\
\u21DA", llhard: "\u296B", lltri: "\u25FA", Lmidot: "\u013F", lmidot: "\u0140", lmoustache: "\u23B0", lmoust: "\u23B0", lnap: "\u2A89", lnapprox: "\
\u2A89", lne: "\u2A87", lnE: "\u2268", lneq: "\u2A87", lneqq: "\u2268", lnsim: "\u22E6", loang: "\u27EC", loarr: "\u21FD", lobrk: "\u27E6", longleftarrow: "\
\u27F5", LongLeftArrow: "\u27F5", Longleftarrow: "\u27F8", longleftrightarrow: "\u27F7", LongLeftRightArrow: "\u27F7", Longleftrightarrow: "\
\u27FA", longmapsto: "\u27FC", longrightarrow: "\u27F6", LongRightArrow: "\u27F6", Longrightarrow: "\u27F9", looparrowleft: "\u21AB", looparrowright: "\
\u21AC", lopar: "\u2985", Lopf: "\u{1D543}", lopf: "\u{1D55D}", loplus: "\u2A2D", lotimes: "\u2A34", lowast: "\u2217", lowbar: "_", LowerLeftArrow: "\
\u2199", LowerRightArrow: "\u2198", loz: "\u25CA", lozenge: "\u25CA", lozf: "\u29EB", lpar: "(", lparlt: "\u2993", lrarr: "\u21C6", lrcorner: "\
\u231F", lrhar: "\u21CB", lrhard: "\u296D", lrm: "\u200E", lrtri: "\u22BF", lsaquo: "\u2039", lscr: "\u{1D4C1}", Lscr: "\u2112", lsh: "\u21B0",
  Lsh: "\u21B0", lsim: "\u2272", lsime: "\u2A8D", lsimg: "\u2A8F", lsqb: "[", lsquo: "\u2018", lsquor: "\u201A", Lstrok: "\u0141", lstrok: "\
\u0142", ltcc: "\u2AA6", ltcir: "\u2A79", lt: "<", LT: "<", Lt: "\u226A", ltdot: "\u22D6", lthree: "\u22CB", ltimes: "\u22C9", ltlarr: "\u2976",
  ltquest: "\u2A7B", ltri: "\u25C3", ltrie: "\u22B4", ltrif: "\u25C2", ltrPar: "\u2996", lurdshar: "\u294A", luruhar: "\u2966", lvertneqq: "\
\u2268\uFE00", lvnE: "\u2268\uFE00", macr: "\xAF", male: "\u2642", malt: "\u2720", maltese: "\u2720", Map: "\u2905", map: "\u21A6", mapsto: "\
\u21A6", mapstodown: "\u21A7", mapstoleft: "\u21A4", mapstoup: "\u21A5", marker: "\u25AE", mcomma: "\u2A29", Mcy: "\u041C", mcy: "\u043C", mdash: "\
\u2014", mDDot: "\u223A", measuredangle: "\u2221", MediumSpace: "\u205F", Mellintrf: "\u2133", Mfr: "\u{1D510}", mfr: "\u{1D52A}", mho: "\u2127",
  micro: "\xB5", midast: "*", midcir: "\u2AF0", mid: "\u2223", middot: "\xB7", minusb: "\u229F", minus: "\u2212", minusd: "\u2238", minusdu: "\
\u2A2A", MinusPlus: "\u2213", mlcp: "\u2ADB", mldr: "\u2026", mnplus: "\u2213", models: "\u22A7", Mopf: "\u{1D544}", mopf: "\u{1D55E}", mp: "\
\u2213", mscr: "\u{1D4C2}", Mscr: "\u2133", mstpos: "\u223E", Mu: "\u039C", mu: "\u03BC", multimap: "\u22B8", mumap: "\u22B8", nabla: "\u2207",
  Nacute: "\u0143", nacute: "\u0144", nang: "\u2220\u20D2", nap: "\u2249", napE: "\u2A70\u0338", napid: "\u224B\u0338", napos: "\u0149", napprox: "\
\u2249", natural: "\u266E", naturals: "\u2115", natur: "\u266E", nbsp: "\xA0", nbump: "\u224E\u0338", nbumpe: "\u224F\u0338", ncap: "\u2A43",
  Ncaron: "\u0147", ncaron: "\u0148", Ncedil: "\u0145", ncedil: "\u0146", ncong: "\u2247", ncongdot: "\u2A6D\u0338", ncup: "\u2A42", Ncy: "\u041D",
  ncy: "\u043D", ndash: "\u2013", nearhk: "\u2924", nearr: "\u2197", neArr: "\u21D7", nearrow: "\u2197", ne: "\u2260", nedot: "\u2250\u0338",
  NegativeMediumSpace: "\u200B", NegativeThickSpace: "\u200B", NegativeThinSpace: "\u200B", NegativeVeryThinSpace: "\u200B", nequiv: "\u2262",
  nesear: "\u2928", nesim: "\u2242\u0338", NestedGreaterGreater: "\u226B", NestedLessLess: "\u226A", NewLine: `
`, nexist: "\u2204", nexists: "\u2204", Nfr: "\u{1D511}", nfr: "\u{1D52B}", ngE: "\u2267\u0338", nge: "\u2271", ngeq: "\u2271", ngeqq: "\u2267\u0338",
  ngeqslant: "\u2A7E\u0338", nges: "\u2A7E\u0338", nGg: "\u22D9\u0338", ngsim: "\u2275", nGt: "\u226B\u20D2", ngt: "\u226F", ngtr: "\u226F",
  nGtv: "\u226B\u0338", nharr: "\u21AE", nhArr: "\u21CE", nhpar: "\u2AF2", ni: "\u220B", nis: "\u22FC", nisd: "\u22FA", niv: "\u220B", NJcy: "\
\u040A", njcy: "\u045A", nlarr: "\u219A", nlArr: "\u21CD", nldr: "\u2025", nlE: "\u2266\u0338", nle: "\u2270", nleftarrow: "\u219A", nLeftarrow: "\
\u21CD", nleftrightarrow: "\u21AE", nLeftrightarrow: "\u21CE", nleq: "\u2270", nleqq: "\u2266\u0338", nleqslant: "\u2A7D\u0338", nles: "\u2A7D\u0338",
  nless: "\u226E", nLl: "\u22D8\u0338", nlsim: "\u2274", nLt: "\u226A\u20D2", nlt: "\u226E", nltri: "\u22EA", nltrie: "\u22EC", nLtv: "\u226A\u0338",
  nmid: "\u2224", NoBreak: "\u2060", NonBreakingSpace: "\xA0", nopf: "\u{1D55F}", Nopf: "\u2115", Not: "\u2AEC", not: "\xAC", NotCongruent: "\
\u2262", NotCupCap: "\u226D", NotDoubleVerticalBar: "\u2226", NotElement: "\u2209", NotEqual: "\u2260", NotEqualTilde: "\u2242\u0338", NotExists: "\
\u2204", NotGreater: "\u226F", NotGreaterEqual: "\u2271", NotGreaterFullEqual: "\u2267\u0338", NotGreaterGreater: "\u226B\u0338", NotGreaterLess: "\
\u2279", NotGreaterSlantEqual: "\u2A7E\u0338", NotGreaterTilde: "\u2275", NotHumpDownHump: "\u224E\u0338", NotHumpEqual: "\u224F\u0338", notin: "\
\u2209", notindot: "\u22F5\u0338", notinE: "\u22F9\u0338", notinva: "\u2209", notinvb: "\u22F7", notinvc: "\u22F6", NotLeftTriangleBar: "\u29CF\u0338",
  NotLeftTriangle: "\u22EA", NotLeftTriangleEqual: "\u22EC", NotLess: "\u226E", NotLessEqual: "\u2270", NotLessGreater: "\u2278", NotLessLess: "\
\u226A\u0338", NotLessSlantEqual: "\u2A7D\u0338", NotLessTilde: "\u2274", NotNestedGreaterGreater: "\u2AA2\u0338", NotNestedLessLess: "\u2AA1\u0338",
  notni: "\u220C", notniva: "\u220C", notnivb: "\u22FE", notnivc: "\u22FD", NotPrecedes: "\u2280", NotPrecedesEqual: "\u2AAF\u0338", NotPrecedesSlantEqual: "\
\u22E0", NotReverseElement: "\u220C", NotRightTriangleBar: "\u29D0\u0338", NotRightTriangle: "\u22EB", NotRightTriangleEqual: "\u22ED", NotSquareSubset: "\
\u228F\u0338", NotSquareSubsetEqual: "\u22E2", NotSquareSuperset: "\u2290\u0338", NotSquareSupersetEqual: "\u22E3", NotSubset: "\u2282\u20D2",
  NotSubsetEqual: "\u2288", NotSucceeds: "\u2281", NotSucceedsEqual: "\u2AB0\u0338", NotSucceedsSlantEqual: "\u22E1", NotSucceedsTilde: "\u227F\u0338",
  NotSuperset: "\u2283\u20D2", NotSupersetEqual: "\u2289", NotTilde: "\u2241", NotTildeEqual: "\u2244", NotTildeFullEqual: "\u2247", NotTildeTilde: "\
\u2249", NotVerticalBar: "\u2224", nparallel: "\u2226", npar: "\u2226", nparsl: "\u2AFD\u20E5", npart: "\u2202\u0338", npolint: "\u2A14", npr: "\
\u2280", nprcue: "\u22E0", nprec: "\u2280", npreceq: "\u2AAF\u0338", npre: "\u2AAF\u0338", nrarrc: "\u2933\u0338", nrarr: "\u219B", nrArr: "\
\u21CF", nrarrw: "\u219D\u0338", nrightarrow: "\u219B", nRightarrow: "\u21CF", nrtri: "\u22EB", nrtrie: "\u22ED", nsc: "\u2281", nsccue: "\u22E1",
  nsce: "\u2AB0\u0338", Nscr: "\u{1D4A9}", nscr: "\u{1D4C3}", nshortmid: "\u2224", nshortparallel: "\u2226", nsim: "\u2241", nsime: "\u2244",
  nsimeq: "\u2244", nsmid: "\u2224", nspar: "\u2226", nsqsube: "\u22E2", nsqsupe: "\u22E3", nsub: "\u2284", nsubE: "\u2AC5\u0338", nsube: "\u2288",
  nsubset: "\u2282\u20D2", nsubseteq: "\u2288", nsubseteqq: "\u2AC5\u0338", nsucc: "\u2281", nsucceq: "\u2AB0\u0338", nsup: "\u2285", nsupE: "\
\u2AC6\u0338", nsupe: "\u2289", nsupset: "\u2283\u20D2", nsupseteq: "\u2289", nsupseteqq: "\u2AC6\u0338", ntgl: "\u2279", Ntilde: "\xD1", ntilde: "\
\xF1", ntlg: "\u2278", ntriangleleft: "\u22EA", ntrianglelefteq: "\u22EC", ntriangleright: "\u22EB", ntrianglerighteq: "\u22ED", Nu: "\u039D",
  nu: "\u03BD", num: "#", numero: "\u2116", numsp: "\u2007", nvap: "\u224D\u20D2", nvdash: "\u22AC", nvDash: "\u22AD", nVdash: "\u22AE", nVDash: "\
\u22AF", nvge: "\u2265\u20D2", nvgt: ">\u20D2", nvHarr: "\u2904", nvinfin: "\u29DE", nvlArr: "\u2902", nvle: "\u2264\u20D2", nvlt: "<\u20D2",
  nvltrie: "\u22B4\u20D2", nvrArr: "\u2903", nvrtrie: "\u22B5\u20D2", nvsim: "\u223C\u20D2", nwarhk: "\u2923", nwarr: "\u2196", nwArr: "\u21D6",
  nwarrow: "\u2196", nwnear: "\u2927", Oacute: "\xD3", oacute: "\xF3", oast: "\u229B", Ocirc: "\xD4", ocirc: "\xF4", ocir: "\u229A", Ocy: "\u041E",
  ocy: "\u043E", odash: "\u229D", Odblac: "\u0150", odblac: "\u0151", odiv: "\u2A38", odot: "\u2299", odsold: "\u29BC", OElig: "\u0152", oelig: "\
\u0153", ofcir: "\u29BF", Ofr: "\u{1D512}", ofr: "\u{1D52C}", ogon: "\u02DB", Ograve: "\xD2", ograve: "\xF2", ogt: "\u29C1", ohbar: "\u29B5",
  ohm: "\u03A9", oint: "\u222E", olarr: "\u21BA", olcir: "\u29BE", olcross: "\u29BB", oline: "\u203E", olt: "\u29C0", Omacr: "\u014C", omacr: "\
\u014D", Omega: "\u03A9", omega: "\u03C9", Omicron: "\u039F", omicron: "\u03BF", omid: "\u29B6", ominus: "\u2296", Oopf: "\u{1D546}", oopf: "\
\u{1D560}", opar: "\u29B7", OpenCurlyDoubleQuote: "\u201C", OpenCurlyQuote: "\u2018", operp: "\u29B9", oplus: "\u2295", orarr: "\u21BB", Or: "\
\u2A54", or: "\u2228", ord: "\u2A5D", order: "\u2134", orderof: "\u2134", ordf: "\xAA", ordm: "\xBA", origof: "\u22B6", oror: "\u2A56", orslope: "\
\u2A57", orv: "\u2A5B", oS: "\u24C8", Oscr: "\u{1D4AA}", oscr: "\u2134", Oslash: "\xD8", oslash: "\xF8", osol: "\u2298", Otilde: "\xD5", otilde: "\
\xF5", otimesas: "\u2A36", Otimes: "\u2A37", otimes: "\u2297", Ouml: "\xD6", ouml: "\xF6", ovbar: "\u233D", OverBar: "\u203E", OverBrace: "\u23DE",
  OverBracket: "\u23B4", OverParenthesis: "\u23DC", para: "\xB6", parallel: "\u2225", par: "\u2225", parsim: "\u2AF3", parsl: "\u2AFD", part: "\
\u2202", PartialD: "\u2202", Pcy: "\u041F", pcy: "\u043F", percnt: "%", period: ".", permil: "\u2030", perp: "\u22A5", pertenk: "\u2031", Pfr: "\
\u{1D513}", pfr: "\u{1D52D}", Phi: "\u03A6", phi: "\u03C6", phiv: "\u03D5", phmmat: "\u2133", phone: "\u260E", Pi: "\u03A0", pi: "\u03C0", pitchfork: "\
\u22D4", piv: "\u03D6", planck: "\u210F", planckh: "\u210E", plankv: "\u210F", plusacir: "\u2A23", plusb: "\u229E", pluscir: "\u2A22", plus: "\
+", plusdo: "\u2214", plusdu: "\u2A25", pluse: "\u2A72", PlusMinus: "\xB1", plusmn: "\xB1", plussim: "\u2A26", plustwo: "\u2A27", pm: "\xB1",
  Poincareplane: "\u210C", pointint: "\u2A15", popf: "\u{1D561}", Popf: "\u2119", pound: "\xA3", prap: "\u2AB7", Pr: "\u2ABB", pr: "\u227A",
  prcue: "\u227C", precapprox: "\u2AB7", prec: "\u227A", preccurlyeq: "\u227C", Precedes: "\u227A", PrecedesEqual: "\u2AAF", PrecedesSlantEqual: "\
\u227C", PrecedesTilde: "\u227E", preceq: "\u2AAF", precnapprox: "\u2AB9", precneqq: "\u2AB5", precnsim: "\u22E8", pre: "\u2AAF", prE: "\u2AB3",
  precsim: "\u227E", prime: "\u2032", Prime: "\u2033", primes: "\u2119", prnap: "\u2AB9", prnE: "\u2AB5", prnsim: "\u22E8", prod: "\u220F", Product: "\
\u220F", profalar: "\u232E", profline: "\u2312", profsurf: "\u2313", prop: "\u221D", Proportional: "\u221D", Proportion: "\u2237", propto: "\
\u221D", prsim: "\u227E", prurel: "\u22B0", Pscr: "\u{1D4AB}", pscr: "\u{1D4C5}", Psi: "\u03A8", psi: "\u03C8", puncsp: "\u2008", Qfr: "\u{1D514}",
  qfr: "\u{1D52E}", qint: "\u2A0C", qopf: "\u{1D562}", Qopf: "\u211A", qprime: "\u2057", Qscr: "\u{1D4AC}", qscr: "\u{1D4C6}", quaternions: "\
\u210D", quatint: "\u2A16", quest: "?", questeq: "\u225F", quot: '"', QUOT: '"', rAarr: "\u21DB", race: "\u223D\u0331", Racute: "\u0154", racute: "\
\u0155", radic: "\u221A", raemptyv: "\u29B3", rang: "\u27E9", Rang: "\u27EB", rangd: "\u2992", range: "\u29A5", rangle: "\u27E9", raquo: "\xBB",
  rarrap: "\u2975", rarrb: "\u21E5", rarrbfs: "\u2920", rarrc: "\u2933", rarr: "\u2192", Rarr: "\u21A0", rArr: "\u21D2", rarrfs: "\u291E", rarrhk: "\
\u21AA", rarrlp: "\u21AC", rarrpl: "\u2945", rarrsim: "\u2974", Rarrtl: "\u2916", rarrtl: "\u21A3", rarrw: "\u219D", ratail: "\u291A", rAtail: "\
\u291C", ratio: "\u2236", rationals: "\u211A", rbarr: "\u290D", rBarr: "\u290F", RBarr: "\u2910", rbbrk: "\u2773", rbrace: "}", rbrack: "]",
  rbrke: "\u298C", rbrksld: "\u298E", rbrkslu: "\u2990", Rcaron: "\u0158", rcaron: "\u0159", Rcedil: "\u0156", rcedil: "\u0157", rceil: "\u2309",
  rcub: "}", Rcy: "\u0420", rcy: "\u0440", rdca: "\u2937", rdldhar: "\u2969", rdquo: "\u201D", rdquor: "\u201D", rdsh: "\u21B3", real: "\u211C",
  realine: "\u211B", realpart: "\u211C", reals: "\u211D", Re: "\u211C", rect: "\u25AD", reg: "\xAE", REG: "\xAE", ReverseElement: "\u220B", ReverseEquilibrium: "\
\u21CB", ReverseUpEquilibrium: "\u296F", rfisht: "\u297D", rfloor: "\u230B", rfr: "\u{1D52F}", Rfr: "\u211C", rHar: "\u2964", rhard: "\u21C1",
  rharu: "\u21C0", rharul: "\u296C", Rho: "\u03A1", rho: "\u03C1", rhov: "\u03F1", RightAngleBracket: "\u27E9", RightArrowBar: "\u21E5", rightarrow: "\
\u2192", RightArrow: "\u2192", Rightarrow: "\u21D2", RightArrowLeftArrow: "\u21C4", rightarrowtail: "\u21A3", RightCeiling: "\u2309", RightDoubleBracket: "\
\u27E7", RightDownTeeVector: "\u295D", RightDownVectorBar: "\u2955", RightDownVector: "\u21C2", RightFloor: "\u230B", rightharpoondown: "\u21C1",
  rightharpoonup: "\u21C0", rightleftarrows: "\u21C4", rightleftharpoons: "\u21CC", rightrightarrows: "\u21C9", rightsquigarrow: "\u219D", RightTeeArrow: "\
\u21A6", RightTee: "\u22A2", RightTeeVector: "\u295B", rightthreetimes: "\u22CC", RightTriangleBar: "\u29D0", RightTriangle: "\u22B3", RightTriangleEqual: "\
\u22B5", RightUpDownVector: "\u294F", RightUpTeeVector: "\u295C", RightUpVectorBar: "\u2954", RightUpVector: "\u21BE", RightVectorBar: "\u2953",
  RightVector: "\u21C0", ring: "\u02DA", risingdotseq: "\u2253", rlarr: "\u21C4", rlhar: "\u21CC", rlm: "\u200F", rmoustache: "\u23B1", rmoust: "\
\u23B1", rnmid: "\u2AEE", roang: "\u27ED", roarr: "\u21FE", robrk: "\u27E7", ropar: "\u2986", ropf: "\u{1D563}", Ropf: "\u211D", roplus: "\u2A2E",
  rotimes: "\u2A35", RoundImplies: "\u2970", rpar: ")", rpargt: "\u2994", rppolint: "\u2A12", rrarr: "\u21C9", Rrightarrow: "\u21DB", rsaquo: "\
\u203A", rscr: "\u{1D4C7}", Rscr: "\u211B", rsh: "\u21B1", Rsh: "\u21B1", rsqb: "]", rsquo: "\u2019", rsquor: "\u2019", rthree: "\u22CC", rtimes: "\
\u22CA", rtri: "\u25B9", rtrie: "\u22B5", rtrif: "\u25B8", rtriltri: "\u29CE", RuleDelayed: "\u29F4", ruluhar: "\u2968", rx: "\u211E", Sacute: "\
\u015A", sacute: "\u015B", sbquo: "\u201A", scap: "\u2AB8", Scaron: "\u0160", scaron: "\u0161", Sc: "\u2ABC", sc: "\u227B", sccue: "\u227D",
  sce: "\u2AB0", scE: "\u2AB4", Scedil: "\u015E", scedil: "\u015F", Scirc: "\u015C", scirc: "\u015D", scnap: "\u2ABA", scnE: "\u2AB6", scnsim: "\
\u22E9", scpolint: "\u2A13", scsim: "\u227F", Scy: "\u0421", scy: "\u0441", sdotb: "\u22A1", sdot: "\u22C5", sdote: "\u2A66", searhk: "\u2925",
  searr: "\u2198", seArr: "\u21D8", searrow: "\u2198", sect: "\xA7", semi: ";", seswar: "\u2929", setminus: "\u2216", setmn: "\u2216", sext: "\
\u2736", Sfr: "\u{1D516}", sfr: "\u{1D530}", sfrown: "\u2322", sharp: "\u266F", SHCHcy: "\u0429", shchcy: "\u0449", SHcy: "\u0428", shcy: "\u0448",
  ShortDownArrow: "\u2193", ShortLeftArrow: "\u2190", shortmid: "\u2223", shortparallel: "\u2225", ShortRightArrow: "\u2192", ShortUpArrow: "\
\u2191", shy: "\xAD", Sigma: "\u03A3", sigma: "\u03C3", sigmaf: "\u03C2", sigmav: "\u03C2", sim: "\u223C", simdot: "\u2A6A", sime: "\u2243",
  simeq: "\u2243", simg: "\u2A9E", simgE: "\u2AA0", siml: "\u2A9D", simlE: "\u2A9F", simne: "\u2246", simplus: "\u2A24", simrarr: "\u2972", slarr: "\
\u2190", SmallCircle: "\u2218", smallsetminus: "\u2216", smashp: "\u2A33", smeparsl: "\u29E4", smid: "\u2223", smile: "\u2323", smt: "\u2AAA",
  smte: "\u2AAC", smtes: "\u2AAC\uFE00", SOFTcy: "\u042C", softcy: "\u044C", solbar: "\u233F", solb: "\u29C4", sol: "/", Sopf: "\u{1D54A}", sopf: "\
\u{1D564}", spades: "\u2660", spadesuit: "\u2660", spar: "\u2225", sqcap: "\u2293", sqcaps: "\u2293\uFE00", sqcup: "\u2294", sqcups: "\u2294\uFE00",
  Sqrt: "\u221A", sqsub: "\u228F", sqsube: "\u2291", sqsubset: "\u228F", sqsubseteq: "\u2291", sqsup: "\u2290", sqsupe: "\u2292", sqsupset: "\
\u2290", sqsupseteq: "\u2292", square: "\u25A1", Square: "\u25A1", SquareIntersection: "\u2293", SquareSubset: "\u228F", SquareSubsetEqual: "\
\u2291", SquareSuperset: "\u2290", SquareSupersetEqual: "\u2292", SquareUnion: "\u2294", squarf: "\u25AA", squ: "\u25A1", squf: "\u25AA", srarr: "\
\u2192", Sscr: "\u{1D4AE}", sscr: "\u{1D4C8}", ssetmn: "\u2216", ssmile: "\u2323", sstarf: "\u22C6", Star: "\u22C6", star: "\u2606", starf: "\
\u2605", straightepsilon: "\u03F5", straightphi: "\u03D5", strns: "\xAF", sub: "\u2282", Sub: "\u22D0", subdot: "\u2ABD", subE: "\u2AC5", sube: "\
\u2286", subedot: "\u2AC3", submult: "\u2AC1", subnE: "\u2ACB", subne: "\u228A", subplus: "\u2ABF", subrarr: "\u2979", subset: "\u2282", Subset: "\
\u22D0", subseteq: "\u2286", subseteqq: "\u2AC5", SubsetEqual: "\u2286", subsetneq: "\u228A", subsetneqq: "\u2ACB", subsim: "\u2AC7", subsub: "\
\u2AD5", subsup: "\u2AD3", succapprox: "\u2AB8", succ: "\u227B", succcurlyeq: "\u227D", Succeeds: "\u227B", SucceedsEqual: "\u2AB0", SucceedsSlantEqual: "\
\u227D", SucceedsTilde: "\u227F", succeq: "\u2AB0", succnapprox: "\u2ABA", succneqq: "\u2AB6", succnsim: "\u22E9", succsim: "\u227F", SuchThat: "\
\u220B", sum: "\u2211", Sum: "\u2211", sung: "\u266A", sup1: "\xB9", sup2: "\xB2", sup3: "\xB3", sup: "\u2283", Sup: "\u22D1", supdot: "\u2ABE",
  supdsub: "\u2AD8", supE: "\u2AC6", supe: "\u2287", supedot: "\u2AC4", Superset: "\u2283", SupersetEqual: "\u2287", suphsol: "\u27C9", suphsub: "\
\u2AD7", suplarr: "\u297B", supmult: "\u2AC2", supnE: "\u2ACC", supne: "\u228B", supplus: "\u2AC0", supset: "\u2283", Supset: "\u22D1", supseteq: "\
\u2287", supseteqq: "\u2AC6", supsetneq: "\u228B", supsetneqq: "\u2ACC", supsim: "\u2AC8", supsub: "\u2AD4", supsup: "\u2AD6", swarhk: "\u2926",
  swarr: "\u2199", swArr: "\u21D9", swarrow: "\u2199", swnwar: "\u292A", szlig: "\xDF", Tab: "	", target: "\u2316", Tau: "\u03A4", tau: "\u03C4",
  tbrk: "\u23B4", Tcaron: "\u0164", tcaron: "\u0165", Tcedil: "\u0162", tcedil: "\u0163", Tcy: "\u0422", tcy: "\u0442", tdot: "\u20DB", telrec: "\
\u2315", Tfr: "\u{1D517}", tfr: "\u{1D531}", there4: "\u2234", therefore: "\u2234", Therefore: "\u2234", Theta: "\u0398", theta: "\u03B8", thetasym: "\
\u03D1", thetav: "\u03D1", thickapprox: "\u2248", thicksim: "\u223C", ThickSpace: "\u205F\u200A", ThinSpace: "\u2009", thinsp: "\u2009", thkap: "\
\u2248", thksim: "\u223C", THORN: "\xDE", thorn: "\xFE", tilde: "\u02DC", Tilde: "\u223C", TildeEqual: "\u2243", TildeFullEqual: "\u2245", TildeTilde: "\
\u2248", timesbar: "\u2A31", timesb: "\u22A0", times: "\xD7", timesd: "\u2A30", tint: "\u222D", toea: "\u2928", topbot: "\u2336", topcir: "\u2AF1",
  top: "\u22A4", Topf: "\u{1D54B}", topf: "\u{1D565}", topfork: "\u2ADA", tosa: "\u2929", tprime: "\u2034", trade: "\u2122", TRADE: "\u2122",
  triangle: "\u25B5", triangledown: "\u25BF", triangleleft: "\u25C3", trianglelefteq: "\u22B4", triangleq: "\u225C", triangleright: "\u25B9",
  trianglerighteq: "\u22B5", tridot: "\u25EC", trie: "\u225C", triminus: "\u2A3A", TripleDot: "\u20DB", triplus: "\u2A39", trisb: "\u29CD", tritime: "\
\u2A3B", trpezium: "\u23E2", Tscr: "\u{1D4AF}", tscr: "\u{1D4C9}", TScy: "\u0426", tscy: "\u0446", TSHcy: "\u040B", tshcy: "\u045B", Tstrok: "\
\u0166", tstrok: "\u0167", twixt: "\u226C", twoheadleftarrow: "\u219E", twoheadrightarrow: "\u21A0", Uacute: "\xDA", uacute: "\xFA", uarr: "\
\u2191", Uarr: "\u219F", uArr: "\u21D1", Uarrocir: "\u2949", Ubrcy: "\u040E", ubrcy: "\u045E", Ubreve: "\u016C", ubreve: "\u016D", Ucirc: "\xDB",
  ucirc: "\xFB", Ucy: "\u0423", ucy: "\u0443", udarr: "\u21C5", Udblac: "\u0170", udblac: "\u0171", udhar: "\u296E", ufisht: "\u297E", Ufr: "\
\u{1D518}", ufr: "\u{1D532}", Ugrave: "\xD9", ugrave: "\xF9", uHar: "\u2963", uharl: "\u21BF", uharr: "\u21BE", uhblk: "\u2580", ulcorn: "\u231C",
  ulcorner: "\u231C", ulcrop: "\u230F", ultri: "\u25F8", Umacr: "\u016A", umacr: "\u016B", uml: "\xA8", UnderBar: "_", UnderBrace: "\u23DF",
  UnderBracket: "\u23B5", UnderParenthesis: "\u23DD", Union: "\u22C3", UnionPlus: "\u228E", Uogon: "\u0172", uogon: "\u0173", Uopf: "\u{1D54C}",
  uopf: "\u{1D566}", UpArrowBar: "\u2912", uparrow: "\u2191", UpArrow: "\u2191", Uparrow: "\u21D1", UpArrowDownArrow: "\u21C5", updownarrow: "\
\u2195", UpDownArrow: "\u2195", Updownarrow: "\u21D5", UpEquilibrium: "\u296E", upharpoonleft: "\u21BF", upharpoonright: "\u21BE", uplus: "\u228E",
  UpperLeftArrow: "\u2196", UpperRightArrow: "\u2197", upsi: "\u03C5", Upsi: "\u03D2", upsih: "\u03D2", Upsilon: "\u03A5", upsilon: "\u03C5",
  UpTeeArrow: "\u21A5", UpTee: "\u22A5", upuparrows: "\u21C8", urcorn: "\u231D", urcorner: "\u231D", urcrop: "\u230E", Uring: "\u016E", uring: "\
\u016F", urtri: "\u25F9", Uscr: "\u{1D4B0}", uscr: "\u{1D4CA}", utdot: "\u22F0", Utilde: "\u0168", utilde: "\u0169", utri: "\u25B5", utrif: "\
\u25B4", uuarr: "\u21C8", Uuml: "\xDC", uuml: "\xFC", uwangle: "\u29A7", vangrt: "\u299C", varepsilon: "\u03F5", varkappa: "\u03F0", varnothing: "\
\u2205", varphi: "\u03D5", varpi: "\u03D6", varpropto: "\u221D", varr: "\u2195", vArr: "\u21D5", varrho: "\u03F1", varsigma: "\u03C2", varsubsetneq: "\
\u228A\uFE00", varsubsetneqq: "\u2ACB\uFE00", varsupsetneq: "\u228B\uFE00", varsupsetneqq: "\u2ACC\uFE00", vartheta: "\u03D1", vartriangleleft: "\
\u22B2", vartriangleright: "\u22B3", vBar: "\u2AE8", Vbar: "\u2AEB", vBarv: "\u2AE9", Vcy: "\u0412", vcy: "\u0432", vdash: "\u22A2", vDash: "\
\u22A8", Vdash: "\u22A9", VDash: "\u22AB", Vdashl: "\u2AE6", veebar: "\u22BB", vee: "\u2228", Vee: "\u22C1", veeeq: "\u225A", vellip: "\u22EE",
  verbar: "|", Verbar: "\u2016", vert: "|", Vert: "\u2016", VerticalBar: "\u2223", VerticalLine: "|", VerticalSeparator: "\u2758", VerticalTilde: "\
\u2240", VeryThinSpace: "\u200A", Vfr: "\u{1D519}", vfr: "\u{1D533}", vltri: "\u22B2", vnsub: "\u2282\u20D2", vnsup: "\u2283\u20D2", Vopf: "\
\u{1D54D}", vopf: "\u{1D567}", vprop: "\u221D", vrtri: "\u22B3", Vscr: "\u{1D4B1}", vscr: "\u{1D4CB}", vsubnE: "\u2ACB\uFE00", vsubne: "\u228A\uFE00",
  vsupnE: "\u2ACC\uFE00", vsupne: "\u228B\uFE00", Vvdash: "\u22AA", vzigzag: "\u299A", Wcirc: "\u0174", wcirc: "\u0175", wedbar: "\u2A5F", wedge: "\
\u2227", Wedge: "\u22C0", wedgeq: "\u2259", weierp: "\u2118", Wfr: "\u{1D51A}", wfr: "\u{1D534}", Wopf: "\u{1D54E}", wopf: "\u{1D568}", wp: "\
\u2118", wr: "\u2240", wreath: "\u2240", Wscr: "\u{1D4B2}", wscr: "\u{1D4CC}", xcap: "\u22C2", xcirc: "\u25EF", xcup: "\u22C3", xdtri: "\u25BD",
  Xfr: "\u{1D51B}", xfr: "\u{1D535}", xharr: "\u27F7", xhArr: "\u27FA", Xi: "\u039E", xi: "\u03BE", xlarr: "\u27F5", xlArr: "\u27F8", xmap: "\
\u27FC", xnis: "\u22FB", xodot: "\u2A00", Xopf: "\u{1D54F}", xopf: "\u{1D569}", xoplus: "\u2A01", xotime: "\u2A02", xrarr: "\u27F6", xrArr: "\
\u27F9", Xscr: "\u{1D4B3}", xscr: "\u{1D4CD}", xsqcup: "\u2A06", xuplus: "\u2A04", xutri: "\u25B3", xvee: "\u22C1", xwedge: "\u22C0", Yacute: "\
\xDD", yacute: "\xFD", YAcy: "\u042F", yacy: "\u044F", Ycirc: "\u0176", ycirc: "\u0177", Ycy: "\u042B", ycy: "\u044B", yen: "\xA5", Yfr: "\u{1D51C}",
  yfr: "\u{1D536}", YIcy: "\u0407", yicy: "\u0457", Yopf: "\u{1D550}", yopf: "\u{1D56A}", Yscr: "\u{1D4B4}", yscr: "\u{1D4CE}", YUcy: "\u042E",
  yucy: "\u044E", yuml: "\xFF", Yuml: "\u0178", Zacute: "\u0179", zacute: "\u017A", Zcaron: "\u017D", zcaron: "\u017E", Zcy: "\u0417", zcy: "\
\u0437", Zdot: "\u017B", zdot: "\u017C", zeetrf: "\u2128", ZeroWidthSpace: "\u200B", Zeta: "\u0396", zeta: "\u03B6", zfr: "\u{1D537}", Zfr: "\
\u2128", ZHcy: "\u0416", zhcy: "\u0436", zigrarr: "\u21DD", zopf: "\u{1D56B}", Zopf: "\u2124", Zscr: "\u{1D4B5}", zscr: "\u{1D4CF}", zwj: "\u200D",
  zwnj: "\u200C" };
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/maps/legacy.json
var Qa = B((ub, Mu) => {
  Mu.exports = { Aacute: "\xC1", aacute: "\xE1", Acirc: "\xC2", acirc: "\xE2", acute: "\xB4", AElig: "\xC6", aelig: "\xE6", Agrave: "\xC0", agrave: "\
\xE0", amp: "&", AMP: "&", Aring: "\xC5", aring: "\xE5", Atilde: "\xC3", atilde: "\xE3", Auml: "\xC4", auml: "\xE4", brvbar: "\xA6", Ccedil: "\
\xC7", ccedil: "\xE7", cedil: "\xB8", cent: "\xA2", copy: "\xA9", COPY: "\xA9", curren: "\xA4", deg: "\xB0", divide: "\xF7", Eacute: "\xC9",
  eacute: "\xE9", Ecirc: "\xCA", ecirc: "\xEA", Egrave: "\xC8", egrave: "\xE8", ETH: "\xD0", eth: "\xF0", Euml: "\xCB", euml: "\xEB", frac12: "\
\xBD", frac14: "\xBC", frac34: "\xBE", gt: ">", GT: ">", Iacute: "\xCD", iacute: "\xED", Icirc: "\xCE", icirc: "\xEE", iexcl: "\xA1", Igrave: "\
\xCC", igrave: "\xEC", iquest: "\xBF", Iuml: "\xCF", iuml: "\xEF", laquo: "\xAB", lt: "<", LT: "<", macr: "\xAF", micro: "\xB5", middot: "\xB7",
  nbsp: "\xA0", not: "\xAC", Ntilde: "\xD1", ntilde: "\xF1", Oacute: "\xD3", oacute: "\xF3", Ocirc: "\xD4", ocirc: "\xF4", Ograve: "\xD2", ograve: "\
\xF2", ordf: "\xAA", ordm: "\xBA", Oslash: "\xD8", oslash: "\xF8", Otilde: "\xD5", otilde: "\xF5", Ouml: "\xD6", ouml: "\xF6", para: "\xB6",
  plusmn: "\xB1", pound: "\xA3", quot: '"', QUOT: '"', raquo: "\xBB", reg: "\xAE", REG: "\xAE", sect: "\xA7", shy: "\xAD", sup1: "\xB9", sup2: "\
\xB2", sup3: "\xB3", szlig: "\xDF", THORN: "\xDE", thorn: "\xFE", times: "\xD7", Uacute: "\xDA", uacute: "\xFA", Ucirc: "\xDB", ucirc: "\xFB",
  Ugrave: "\xD9", ugrave: "\xF9", uml: "\xA8", Uuml: "\xDC", uuml: "\xFC", Yacute: "\xDD", yacute: "\xFD", yen: "\xA5", yuml: "\xFF" };
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/maps/xml.json
var Fn = B((fb, qu) => {
  qu.exports = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' };
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/maps/decode.json
var Za = B((yb, Uu) => {
  Uu.exports = { "0": 65533, "128": 8364, "130": 8218, "131": 402, "132": 8222, "133": 8230, "134": 8224, "135": 8225, "136": 710, "137": 8240,
  "138": 352, "139": 8249, "140": 338, "142": 381, "145": 8216, "146": 8217, "147": 8220, "148": 8221, "149": 8226, "150": 8211, "151": 8212,
  "152": 732, "153": 8482, "154": 353, "155": 8250, "156": 339, "158": 382, "159": 376 };
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/decode_codepoint.js
var ri = B((Lr) => {
  "use strict";
  var Bu = Lr && Lr.__importDefault || function(r) {
    return r && r.__esModule ? r : { default: r };
  };
  Object.defineProperty(Lr, "__esModule", { value: !0 });
  var ei = Bu(Za()), Gu = (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    String.fromCodePoint || function(r) {
      var e = "";
      return r > 65535 && (r -= 65536, e += String.fromCharCode(r >>> 10 & 1023 | 55296), r = 56320 | r & 1023), e += String.fromCharCode(r),
      e;
    }
  );
  function Vu(r) {
    return r >= 55296 && r <= 57343 || r > 1114111 ? "\uFFFD" : (r in ei.default && (r = ei.default[r]), Gu(r));
  }
  s(Vu, "decodeCodePoint");
  Lr.default = Vu;
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/decode.js
var kn = B((se) => {
  "use strict";
  var xt = se && se.__importDefault || function(r) {
    return r && r.__esModule ? r : { default: r };
  };
  Object.defineProperty(se, "__esModule", { value: !0 });
  se.decodeHTML = se.decodeHTMLStrict = se.decodeXML = void 0;
  var Dn = xt(In()), Hu = xt(Qa()), zu = xt(Fn()), ti = xt(ri()), Wu = /&(?:[a-zA-Z0-9]+|#[xX][\da-fA-F]+|#\d+);/g;
  se.decodeXML = ni(zu.default);
  se.decodeHTMLStrict = ni(Dn.default);
  function ni(r) {
    var e = si(r);
    return function(t) {
      return String(t).replace(Wu, e);
    };
  }
  s(ni, "getStrictDecoder");
  var oi = /* @__PURE__ */ s(function(r, e) {
    return r < e ? 1 : -1;
  }, "sorter");
  se.decodeHTML = function() {
    for (var r = Object.keys(Hu.default).sort(oi), e = Object.keys(Dn.default).sort(oi), t = 0, o = 0; t < e.length; t++)
      r[o] === e[t] ? (e[t] += ";?", o++) : e[t] += ";";
    var n = new RegExp("&(?:" + e.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g"), a = si(Dn.default);
    function l(c) {
      return c.substr(-1) !== ";" && (c += ";"), a(c);
    }
    return s(l, "replacer"), function(c) {
      return String(c).replace(n, l);
    };
  }();
  function si(r) {
    return /* @__PURE__ */ s(function(t) {
      if (t.charAt(1) === "#") {
        var o = t.charAt(2);
        return o === "X" || o === "x" ? ti.default(parseInt(t.substr(3), 16)) : ti.default(parseInt(t.substr(2), 10));
      }
      return r[t.slice(1, -1)] || t;
    }, "replace");
  }
  s(si, "getReplacer");
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/encode.js
var Ln = B((K) => {
  "use strict";
  var ai = K && K.__importDefault || function(r) {
    return r && r.__esModule ? r : { default: r };
  };
  Object.defineProperty(K, "__esModule", { value: !0 });
  K.escapeUTF8 = K.escape = K.encodeNonAsciiHTML = K.encodeHTML = K.encodeXML = void 0;
  var $u = ai(Fn()), ii = ci($u.default), li = pi(ii);
  K.encodeXML = fi(ii);
  var Yu = ai(In()), Nn = ci(Yu.default), Ku = pi(Nn);
  K.encodeHTML = Ju(Nn, Ku);
  K.encodeNonAsciiHTML = fi(Nn);
  function ci(r) {
    return Object.keys(r).sort().reduce(function(e, t) {
      return e[r[t]] = "&" + t + ";", e;
    }, {});
  }
  s(ci, "getInverseObj");
  function pi(r) {
    for (var e = [], t = [], o = 0, n = Object.keys(r); o < n.length; o++) {
      var a = n[o];
      a.length === 1 ? e.push("\\" + a) : t.push(a);
    }
    e.sort();
    for (var l = 0; l < e.length - 1; l++) {
      for (var c = l; c < e.length - 1 && e[c].charCodeAt(1) + 1 === e[c + 1].charCodeAt(1); )
        c += 1;
      var i = 1 + c - l;
      i < 3 || e.splice(l, i, e[l] + "-" + e[c]);
    }
    return t.unshift("[" + e.join("") + "]"), new RegExp(t.join("|"), "g");
  }
  s(pi, "getInverseReplacer");
  var di = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g,
  Xu = (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    String.prototype.codePointAt != null ? (
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      function(r) {
        return r.codePointAt(0);
      }
    ) : (
      // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      function(r) {
        return (r.charCodeAt(0) - 55296) * 1024 + r.charCodeAt(1) - 56320 + 65536;
      }
    )
  );
  function At(r) {
    return "&#x" + (r.length > 1 ? Xu(r) : r.charCodeAt(0)).toString(16).toUpperCase() + ";";
  }
  s(At, "singleCharReplacer");
  function Ju(r, e) {
    return function(t) {
      return t.replace(e, function(o) {
        return r[o];
      }).replace(di, At);
    };
  }
  s(Ju, "getInverse");
  var ui = new RegExp(li.source + "|" + di.source, "g");
  function Qu(r) {
    return r.replace(ui, At);
  }
  s(Qu, "escape");
  K.escape = Qu;
  function Zu(r) {
    return r.replace(li, At);
  }
  s(Zu, "escapeUTF8");
  K.escapeUTF8 = Zu;
  function fi(r) {
    return function(e) {
      return e.replace(ui, function(t) {
        return r[t] || At(t);
      });
    };
  }
  s(fi, "getASCIIEncoder");
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/index.js
var mi = B((v) => {
  "use strict";
  Object.defineProperty(v, "__esModule", { value: !0 });
  v.decodeXMLStrict = v.decodeHTML5Strict = v.decodeHTML4Strict = v.decodeHTML5 = v.decodeHTML4 = v.decodeHTMLStrict = v.decodeHTML = v.decodeXML =
  v.encodeHTML5 = v.encodeHTML4 = v.escapeUTF8 = v.escape = v.encodeNonAsciiHTML = v.encodeHTML = v.encodeXML = v.encode = v.decodeStrict = v.
  decode = void 0;
  var _t = kn(), yi = Ln();
  function ef(r, e) {
    return (!e || e <= 0 ? _t.decodeXML : _t.decodeHTML)(r);
  }
  s(ef, "decode");
  v.decode = ef;
  function rf(r, e) {
    return (!e || e <= 0 ? _t.decodeXML : _t.decodeHTMLStrict)(r);
  }
  s(rf, "decodeStrict");
  v.decodeStrict = rf;
  function tf(r, e) {
    return (!e || e <= 0 ? yi.encodeXML : yi.encodeHTML)(r);
  }
  s(tf, "encode");
  v.encode = tf;
  var je = Ln();
  Object.defineProperty(v, "encodeXML", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return je.encodeXML;
  }, "get") });
  Object.defineProperty(v, "encodeHTML", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return je.encodeHTML;
  }, "get") });
  Object.defineProperty(v, "encodeNonAsciiHTML", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return je.encodeNonAsciiHTML;
  }, "get") });
  Object.defineProperty(v, "escape", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return je.escape;
  }, "get") });
  Object.defineProperty(v, "escapeUTF8", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return je.escapeUTF8;
  }, "get") });
  Object.defineProperty(v, "encodeHTML4", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return je.encodeHTML;
  }, "get") });
  Object.defineProperty(v, "encodeHTML5", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return je.encodeHTML;
  }, "get") });
  var Te = kn();
  Object.defineProperty(v, "decodeXML", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return Te.decodeXML;
  }, "get") });
  Object.defineProperty(v, "decodeHTML", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return Te.decodeHTML;
  }, "get") });
  Object.defineProperty(v, "decodeHTMLStrict", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return Te.decodeHTMLStrict;
  }, "get") });
  Object.defineProperty(v, "decodeHTML4", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return Te.decodeHTML;
  }, "get") });
  Object.defineProperty(v, "decodeHTML5", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return Te.decodeHTML;
  }, "get") });
  Object.defineProperty(v, "decodeHTML4Strict", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return Te.decodeHTMLStrict;
  }, "get") });
  Object.defineProperty(v, "decodeHTML5Strict", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return Te.decodeHTMLStrict;
  }, "get") });
  Object.defineProperty(v, "decodeXMLStrict", { enumerable: !0, get: /* @__PURE__ */ s(function() {
    return Te.decodeXML;
  }, "get") });
});

// ../node_modules/ansi-to-html/lib/ansi_to_html.js
var wi = B((xb, _i) => {
  "use strict";
  function of(r, e) {
    if (!(r instanceof e))
      throw new TypeError("Cannot call a class as a function");
  }
  s(of, "_classCallCheck");
  function hi(r, e) {
    for (var t = 0; t < e.length; t++) {
      var o = e[t];
      o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(r, o.key, o);
    }
  }
  s(hi, "_defineProperties");
  function nf(r, e, t) {
    return e && hi(r.prototype, e), t && hi(r, t), r;
  }
  s(nf, "_createClass");
  function Ri(r, e) {
    var t = typeof Symbol < "u" && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = sf(r)) || e && r && typeof r.length == "number") {
        t && (r = t);
        var o = 0, n = /* @__PURE__ */ s(function() {
        }, "F");
        return { s: n, n: /* @__PURE__ */ s(function() {
          return o >= r.length ? { done: !0 } : { done: !1, value: r[o++] };
        }, "n"), e: /* @__PURE__ */ s(function(p) {
          throw p;
        }, "e"), f: n };
      }
      throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
    }
    var a = !0, l = !1, c;
    return { s: /* @__PURE__ */ s(function() {
      t = t.call(r);
    }, "s"), n: /* @__PURE__ */ s(function() {
      var p = t.next();
      return a = p.done, p;
    }, "n"), e: /* @__PURE__ */ s(function(p) {
      l = !0, c = p;
    }, "e"), f: /* @__PURE__ */ s(function() {
      try {
        !a && t.return != null && t.return();
      } finally {
        if (l) throw c;
      }
    }, "f") };
  }
  s(Ri, "_createForOfIteratorHelper");
  function sf(r, e) {
    if (r) {
      if (typeof r == "string") return gi(r, e);
      var t = Object.prototype.toString.call(r).slice(8, -1);
      if (t === "Object" && r.constructor && (t = r.constructor.name), t === "Map" || t === "Set") return Array.from(r);
      if (t === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)) return gi(r, e);
    }
  }
  s(sf, "_unsupportedIterableToArray");
  function gi(r, e) {
    (e == null || e > r.length) && (e = r.length);
    for (var t = 0, o = new Array(e); t < e; t++)
      o[t] = r[t];
    return o;
  }
  s(gi, "_arrayLikeToArray");
  var af = mi(), Si = {
    fg: "#FFF",
    bg: "#000",
    newline: !1,
    escapeXML: !1,
    stream: !1,
    colors: lf()
  };
  function lf() {
    var r = {
      0: "#000",
      1: "#A00",
      2: "#0A0",
      3: "#A50",
      4: "#00A",
      5: "#A0A",
      6: "#0AA",
      7: "#AAA",
      8: "#555",
      9: "#F55",
      10: "#5F5",
      11: "#FF5",
      12: "#55F",
      13: "#F5F",
      14: "#5FF",
      15: "#FFF"
    };
    return wt(0, 5).forEach(function(e) {
      wt(0, 5).forEach(function(t) {
        wt(0, 5).forEach(function(o) {
          return cf(e, t, o, r);
        });
      });
    }), wt(0, 23).forEach(function(e) {
      var t = e + 232, o = xi(e * 10 + 8);
      r[t] = "#" + o + o + o;
    }), r;
  }
  s(lf, "getDefaultColors");
  function cf(r, e, t, o) {
    var n = 16 + r * 36 + e * 6 + t, a = r > 0 ? r * 40 + 55 : 0, l = e > 0 ? e * 40 + 55 : 0, c = t > 0 ? t * 40 + 55 : 0;
    o[n] = pf([a, l, c]);
  }
  s(cf, "setStyleColor");
  function xi(r) {
    for (var e = r.toString(16); e.length < 2; )
      e = "0" + e;
    return e;
  }
  s(xi, "toHexString");
  function pf(r) {
    var e = [], t = Ri(r), o;
    try {
      for (t.s(); !(o = t.n()).done; ) {
        var n = o.value;
        e.push(xi(n));
      }
    } catch (a) {
      t.e(a);
    } finally {
      t.f();
    }
    return "#" + e.join("");
  }
  s(pf, "toColorHexString");
  function bi(r, e, t, o) {
    var n;
    return e === "text" ? n = yf(t, o) : e === "display" ? n = uf(r, t, o) : e === "xterm256Foreground" ? n = Pt(r, o.colors[t]) : e === "xt\
erm256Background" ? n = Ct(r, o.colors[t]) : e === "rgb" && (n = df(r, t)), n;
  }
  s(bi, "generateOutput");
  function df(r, e) {
    e = e.substring(2).slice(0, -1);
    var t = +e.substr(0, 2), o = e.substring(5).split(";"), n = o.map(function(a) {
      return ("0" + Number(a).toString(16)).substr(-2);
    }).join("");
    return vt(r, (t === 38 ? "color:#" : "background-color:#") + n);
  }
  s(df, "handleRgb");
  function uf(r, e, t) {
    e = parseInt(e, 10);
    var o = {
      "-1": /* @__PURE__ */ s(function() {
        return "<br/>";
      }, "_"),
      0: /* @__PURE__ */ s(function() {
        return r.length && Ai(r);
      }, "_"),
      1: /* @__PURE__ */ s(function() {
        return Ee(r, "b");
      }, "_"),
      3: /* @__PURE__ */ s(function() {
        return Ee(r, "i");
      }, "_"),
      4: /* @__PURE__ */ s(function() {
        return Ee(r, "u");
      }, "_"),
      8: /* @__PURE__ */ s(function() {
        return vt(r, "display:none");
      }, "_"),
      9: /* @__PURE__ */ s(function() {
        return Ee(r, "strike");
      }, "_"),
      22: /* @__PURE__ */ s(function() {
        return vt(r, "font-weight:normal;text-decoration:none;font-style:normal");
      }, "_"),
      23: /* @__PURE__ */ s(function() {
        return Ei(r, "i");
      }, "_"),
      24: /* @__PURE__ */ s(function() {
        return Ei(r, "u");
      }, "_"),
      39: /* @__PURE__ */ s(function() {
        return Pt(r, t.fg);
      }, "_"),
      49: /* @__PURE__ */ s(function() {
        return Ct(r, t.bg);
      }, "_"),
      53: /* @__PURE__ */ s(function() {
        return vt(r, "text-decoration:overline");
      }, "_")
    }, n;
    return o[e] ? n = o[e]() : 4 < e && e < 7 ? n = Ee(r, "blink") : 29 < e && e < 38 ? n = Pt(r, t.colors[e - 30]) : 39 < e && e < 48 ? n =
    Ct(r, t.colors[e - 40]) : 89 < e && e < 98 ? n = Pt(r, t.colors[8 + (e - 90)]) : 99 < e && e < 108 && (n = Ct(r, t.colors[8 + (e - 100)])),
    n;
  }
  s(uf, "handleDisplay");
  function Ai(r) {
    var e = r.slice(0);
    return r.length = 0, e.reverse().map(function(t) {
      return "</" + t + ">";
    }).join("");
  }
  s(Ai, "resetStyles");
  function wt(r, e) {
    for (var t = [], o = r; o <= e; o++)
      t.push(o);
    return t;
  }
  s(wt, "range");
  function ff(r) {
    return function(e) {
      return (r === null || e.category !== r) && r !== "all";
    };
  }
  s(ff, "notCategory");
  function Ti(r) {
    r = parseInt(r, 10);
    var e = null;
    return r === 0 ? e = "all" : r === 1 ? e = "bold" : 2 < r && r < 5 ? e = "underline" : 4 < r && r < 7 ? e = "blink" : r === 8 ? e = "hid\
e" : r === 9 ? e = "strike" : 29 < r && r < 38 || r === 39 || 89 < r && r < 98 ? e = "foreground-color" : (39 < r && r < 48 || r === 49 || 99 <
    r && r < 108) && (e = "background-color"), e;
  }
  s(Ti, "categoryForCode");
  function yf(r, e) {
    return e.escapeXML ? af.encodeXML(r) : r;
  }
  s(yf, "pushText");
  function Ee(r, e, t) {
    return t || (t = ""), r.push(e), "<".concat(e).concat(t ? ' style="'.concat(t, '"') : "", ">");
  }
  s(Ee, "pushTag");
  function vt(r, e) {
    return Ee(r, "span", e);
  }
  s(vt, "pushStyle");
  function Pt(r, e) {
    return Ee(r, "span", "color:" + e);
  }
  s(Pt, "pushForegroundColor");
  function Ct(r, e) {
    return Ee(r, "span", "background-color:" + e);
  }
  s(Ct, "pushBackgroundColor");
  function Ei(r, e) {
    var t;
    if (r.slice(-1)[0] === e && (t = r.pop()), t)
      return "</" + e + ">";
  }
  s(Ei, "closeTag");
  function mf(r, e, t) {
    var o = !1, n = 3;
    function a() {
      return "";
    }
    s(a, "remove");
    function l(_, P) {
      return t("xterm256Foreground", P), "";
    }
    s(l, "removeXterm256Foreground");
    function c(_, P) {
      return t("xterm256Background", P), "";
    }
    s(c, "removeXterm256Background");
    function i(_) {
      return e.newline ? t("display", -1) : t("text", _), "";
    }
    s(i, "newline");
    function p(_, P) {
      o = !0, P.trim().length === 0 && (P = "0"), P = P.trimRight(";").split(";");
      var D = Ri(P), O;
      try {
        for (D.s(); !(O = D.n()).done; ) {
          var U = O.value;
          t("display", U);
        }
      } catch (J) {
        D.e(J);
      } finally {
        D.f();
      }
      return "";
    }
    s(p, "ansiMess");
    function u(_) {
      return t("text", _), "";
    }
    s(u, "realText");
    function d(_) {
      return t("rgb", _), "";
    }
    s(d, "rgb");
    var y = [{
      pattern: /^\x08+/,
      sub: a
    }, {
      pattern: /^\x1b\[[012]?K/,
      sub: a
    }, {
      pattern: /^\x1b\[\(B/,
      sub: a
    }, {
      pattern: /^\x1b\[[34]8;2;\d+;\d+;\d+m/,
      sub: d
    }, {
      pattern: /^\x1b\[38;5;(\d+)m/,
      sub: l
    }, {
      pattern: /^\x1b\[48;5;(\d+)m/,
      sub: c
    }, {
      pattern: /^\n/,
      sub: i
    }, {
      pattern: /^\r+\n/,
      sub: i
    }, {
      pattern: /^\r/,
      sub: i
    }, {
      pattern: /^\x1b\[((?:\d{1,3};?)+|)m/,
      sub: p
    }, {
      // CSI n J
      // ED - Erase in Display Clears part of the screen.
      // If n is 0 (or missing), clear from cursor to end of screen.
      // If n is 1, clear from cursor to beginning of the screen.
      // If n is 2, clear entire screen (and moves cursor to upper left on DOS ANSI.SYS).
      // If n is 3, clear entire screen and delete all lines saved in the scrollback buffer
      //   (this feature was added for xterm and is supported by other terminal applications).
      pattern: /^\x1b\[\d?J/,
      sub: a
    }, {
      // CSI n ; m f
      // HVP - Horizontal Vertical Position Same as CUP
      pattern: /^\x1b\[\d{0,3};\d{0,3}f/,
      sub: a
    }, {
      // catch-all for CSI sequences?
      pattern: /^\x1b\[?[\d;]{0,3}/,
      sub: a
    }, {
      /**
       * extracts real text - not containing:
       * - `\x1b' - ESC - escape (Ascii 27)
       * - '\x08' - BS - backspace (Ascii 8)
       * - `\n` - Newline - linefeed (LF) (ascii 10)
       * - `\r` - Windows Carriage Return (CR)
       */
      pattern: /^(([^\x1b\x08\r\n])+)/,
      sub: u
    }];
    function g(_, P) {
      P > n && o || (o = !1, r = r.replace(_.pattern, _.sub));
    }
    s(g, "process");
    var m = [], S = r, h = S.length;
    e: for (; h > 0; ) {
      for (var A = 0, b = 0, E = y.length; b < E; A = ++b) {
        var T = y[A];
        if (g(T, A), r.length !== h) {
          h = r.length;
          continue e;
        }
      }
      if (r.length === h)
        break;
      m.push(0), h = r.length;
    }
    return m;
  }
  s(mf, "tokenize");
  function hf(r, e, t) {
    return e !== "text" && (r = r.filter(ff(Ti(t))), r.push({
      token: e,
      data: t,
      category: Ti(t)
    })), r;
  }
  s(hf, "updateStickyStack");
  var gf = /* @__PURE__ */ function() {
    function r(e) {
      of(this, r), e = e || {}, e.colors && (e.colors = Object.assign({}, Si.colors, e.colors)), this.options = Object.assign({}, Si, e), this.
      stack = [], this.stickyStack = [];
    }
    return s(r, "Filter"), nf(r, [{
      key: "toHtml",
      value: /* @__PURE__ */ s(function(t) {
        var o = this;
        t = typeof t == "string" ? [t] : t;
        var n = this.stack, a = this.options, l = [];
        return this.stickyStack.forEach(function(c) {
          var i = bi(n, c.token, c.data, a);
          i && l.push(i);
        }), mf(t.join(""), a, function(c, i) {
          var p = bi(n, c, i, a);
          p && l.push(p), a.stream && (o.stickyStack = hf(o.stickyStack, c, i));
        }), n.length && l.push(Ai(n)), l.join("");
      }, "toHtml")
    }]), r;
  }();
  _i.exports = gf;
});

// ../node_modules/browser-dtector/browser-dtector.umd.min.js
var Ni = B((Gn, Vn) => {
  (function(r, e) {
    typeof Gn == "object" && typeof Vn < "u" ? Vn.exports = e() : typeof define == "function" && define.amd ? define(e) : (r = typeof globalThis <
    "u" ? globalThis : r || self).BrowserDetector = e();
  })(Gn, function() {
    "use strict";
    function r(l, c) {
      for (var i = 0; i < c.length; i++) {
        var p = c[i];
        p.enumerable = p.enumerable || !1, p.configurable = !0, "value" in p && (p.writable = !0), Object.defineProperty(l, (u = p.key, d = void 0,
        typeof (d = function(y, g) {
          if (typeof y != "object" || y === null) return y;
          var m = y[Symbol.toPrimitive];
          if (m !== void 0) {
            var S = m.call(y, g || "default");
            if (typeof S != "object") return S;
            throw new TypeError("@@toPrimitive must return a primitive value.");
          }
          return (g === "string" ? String : Number)(y);
        }(u, "string")) == "symbol" ? d : String(d)), p);
      }
      var u, d;
    }
    s(r, "e");
    var e = { chrome: "Google Chrome", brave: "Brave", crios: "Google Chrome", edge: "Microsoft Edge", edg: "Microsoft Edge", edgios: "Micro\
soft Edge", fennec: "Mozilla Firefox", jsdom: "JsDOM", mozilla: "Mozilla Firefox", fxios: "Mozilla Firefox", msie: "Microsoft Internet Explo\
rer", opera: "Opera", opios: "Opera", opr: "Opera", opt: "Opera", rv: "Microsoft Internet Explorer", safari: "Safari", samsungbrowser: "Sams\
ung Browser", electron: "Electron" }, t = { android: "Android", androidTablet: "Android Tablet", cros: "Chrome OS", fennec: "Android Tablet",
    ipad: "IPad", iphone: "IPhone", jsdom: "JsDOM", linux: "Linux", mac: "Macintosh", tablet: "Android Tablet", win: "Windows", "windows pho\
ne": "Windows Phone", xbox: "Microsoft Xbox" }, o = /* @__PURE__ */ s(function(l) {
      var c = new RegExp("^-?\\d+(?:.\\d{0,".concat(arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : -1, "})?")), i = Number(
      l).toString().match(c);
      return i ? i[0] : null;
    }, "n"), n = /* @__PURE__ */ s(function() {
      return typeof window < "u" ? window.navigator : null;
    }, "i"), a = function() {
      function l(u) {
        var d;
        (function(y, g) {
          if (!(y instanceof g)) throw new TypeError("Cannot call a class as a function");
        })(this, l), this.userAgent = u || ((d = n()) === null || d === void 0 ? void 0 : d.userAgent) || null;
      }
      s(l, "t");
      var c, i, p;
      return c = l, i = [{ key: "parseUserAgent", value: /* @__PURE__ */ s(function(u) {
        var d, y, g, m = {}, S = u || this.userAgent || "", h = S.toLowerCase().replace(/\s\s+/g, " "), A = /(edge)\/([\w.]+)/.exec(h) || /(edg)[/]([\w.]+)/.
        exec(h) || /(opr)[/]([\w.]+)/.exec(h) || /(opt)[/]([\w.]+)/.exec(h) || /(fxios)[/]([\w.]+)/.exec(h) || /(edgios)[/]([\w.]+)/.exec(h) ||
        /(jsdom)[/]([\w.]+)/.exec(h) || /(samsungbrowser)[/]([\w.]+)/.exec(h) || /(electron)[/]([\w.]+)/.exec(h) || /(chrome)[/]([\w.]+)/.exec(
        h) || /(crios)[/]([\w.]+)/.exec(h) || /(opios)[/]([\w.]+)/.exec(h) || /(version)(applewebkit)[/]([\w.]+).*(safari)[/]([\w.]+)/.exec(
        h) || /(webkit)[/]([\w.]+).*(version)[/]([\w.]+).*(safari)[/]([\w.]+)/.exec(h) || /(applewebkit)[/]([\w.]+).*(safari)[/]([\w.]+)/.exec(
        h) || /(webkit)[/]([\w.]+)/.exec(h) || /(opera)(?:.*version|)[/]([\w.]+)/.exec(h) || /(msie) ([\w.]+)/.exec(h) || /(fennec)[/]([\w.]+)/.
        exec(h) || h.indexOf("trident") >= 0 && /(rv)(?::| )([\w.]+)/.exec(h) || h.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.
        exec(h) || [], b = /(ipad)/.exec(h) || /(ipod)/.exec(h) || /(iphone)/.exec(h) || /(jsdom)/.exec(h) || /(windows phone)/.exec(h) || /(xbox)/.
        exec(h) || /(win)/.exec(h) || /(tablet)/.exec(h) || /(android)/.test(h) && /(mobile)/.test(h) === !1 && ["androidTablet"] || /(android)/.
        exec(h) || /(mac)/.exec(h) || /(linux)/.exec(h) || /(cros)/.exec(h) || [], E = A[5] || A[3] || A[1] || null, T = b[0] || null, _ = A[4] ||
        A[2] || null, P = n();
        E === "chrome" && typeof (P == null || (d = P.brave) === null || d === void 0 ? void 0 : d.isBrave) == "function" && (E = "brave"), E &&
        (m[E] = !0), T && (m[T] = !0);
        var D = !!(m.tablet || m.android || m.androidTablet), O = !!(m.ipad || m.tablet || m.androidTablet), U = !!(m.android || m.androidTablet ||
        m.tablet || m.ipad || m.ipod || m.iphone || m["windows phone"]), J = !!(m.cros || m.mac || m.linux || m.win), de = !!(m.brave || m.chrome ||
        m.crios || m.opr || m.safari || m.edg || m.electron), k = !!(m.msie || m.rv);
        return { name: (y = e[E]) !== null && y !== void 0 ? y : null, platform: (g = t[T]) !== null && g !== void 0 ? g : null, userAgent: S,
        version: _, shortVersion: _ ? o(parseFloat(_), 2) : null, isAndroid: D, isTablet: O, isMobile: U, isDesktop: J, isWebkit: de, isIE: k };
      }, "value") }, { key: "getBrowserInfo", value: /* @__PURE__ */ s(function() {
        var u = this.parseUserAgent();
        return { name: u.name, platform: u.platform, userAgent: u.userAgent, version: u.version, shortVersion: u.shortVersion };
      }, "value") }], p = [{ key: "VERSION", get: /* @__PURE__ */ s(function() {
        return "3.4.0";
      }, "get") }], i && r(c.prototype, i), p && r(c, p), Object.defineProperty(c, "prototype", { writable: !1 }), l;
    }();
    return a;
  });
});

// ../node_modules/@storybook/global/dist/index.mjs
var It = {};
Re(It, {
  global: () => R
});
var R = (() => {
  let r;
  return typeof window < "u" ? r = window : typeof globalThis < "u" ? r = globalThis : typeof global < "u" ? r = global : typeof self < "u" ?
  r = self : r = {}, r;
})();

// src/core-events/index.ts
var fe = {};
Re(fe, {
  ARGTYPES_INFO_REQUEST: () => Zt,
  ARGTYPES_INFO_RESPONSE: () => Yr,
  CHANNEL_CREATED: () => zi,
  CHANNEL_WS_DISCONNECT: () => Dt,
  CONFIG_ERROR: () => kt,
  CREATE_NEW_STORYFILE_REQUEST: () => Wi,
  CREATE_NEW_STORYFILE_RESPONSE: () => $i,
  CURRENT_STORY_WAS_SET: () => Wr,
  DOCS_PREPARED: () => Nt,
  DOCS_RENDERED: () => nr,
  FILE_COMPONENT_SEARCH_REQUEST: () => Yi,
  FILE_COMPONENT_SEARCH_RESPONSE: () => Ki,
  FORCE_REMOUNT: () => Lt,
  FORCE_RE_RENDER: () => sr,
  GLOBALS_UPDATED: () => xe,
  NAVIGATE_URL: () => Xi,
  PLAY_FUNCTION_THREW_EXCEPTION: () => jt,
  PRELOAD_ENTRIES: () => qt,
  PREVIEW_BUILDER_PROGRESS: () => Ji,
  PREVIEW_KEYDOWN: () => Ut,
  REGISTER_SUBSCRIPTION: () => Qi,
  REQUEST_WHATS_NEW_DATA: () => ll,
  RESET_STORY_ARGS: () => ar,
  RESULT_WHATS_NEW_DATA: () => cl,
  SAVE_STORY_REQUEST: () => ul,
  SAVE_STORY_RESPONSE: () => fl,
  SELECT_STORY: () => Zi,
  SET_CONFIG: () => el,
  SET_CURRENT_STORY: () => Bt,
  SET_FILTER: () => rl,
  SET_GLOBALS: () => Gt,
  SET_INDEX: () => tl,
  SET_STORIES: () => ol,
  SET_WHATS_NEW_CACHE: () => pl,
  SHARED_STATE_CHANGED: () => nl,
  SHARED_STATE_SET: () => sl,
  STORIES_COLLAPSE_ALL: () => al,
  STORIES_EXPAND_ALL: () => il,
  STORY_ARGS_UPDATED: () => Vt,
  STORY_CHANGED: () => Ht,
  STORY_ERRORED: () => zt,
  STORY_INDEX_INVALIDATED: () => Wt,
  STORY_MISSING: () => $r,
  STORY_PREPARED: () => $t,
  STORY_RENDERED: () => Ue,
  STORY_RENDER_PHASE_CHANGED: () => Ae,
  STORY_SPECIFIED: () => Yt,
  STORY_THREW_EXCEPTION: () => Kt,
  STORY_UNCHANGED: () => Xt,
  TELEMETRY_ERROR: () => Qt,
  TESTING_MODULE_CANCEL_TEST_RUN_REQUEST: () => Sl,
  TESTING_MODULE_CANCEL_TEST_RUN_RESPONSE: () => bl,
  TESTING_MODULE_CRASH_REPORT: () => yl,
  TESTING_MODULE_PROGRESS_REPORT: () => ml,
  TESTING_MODULE_RUN_ALL_REQUEST: () => gl,
  TESTING_MODULE_RUN_REQUEST: () => hl,
  TESTING_MODULE_WATCH_MODE_REQUEST: () => Tl,
  TOGGLE_WHATS_NEW_NOTIFICATIONS: () => dl,
  UNHANDLED_ERRORS_WHILE_PLAYING: () => Mt,
  UPDATE_GLOBALS: () => ir,
  UPDATE_QUERY_PARAMS: () => Jt,
  UPDATE_STORY_ARGS: () => lr,
  default: () => Hi
});
var Ft = /* @__PURE__ */ ((x) => (x.CHANNEL_WS_DISCONNECT = "channelWSDisconnect", x.CHANNEL_CREATED = "channelCreated", x.CONFIG_ERROR = "c\
onfigError", x.STORY_INDEX_INVALIDATED = "storyIndexInvalidated", x.STORY_SPECIFIED = "storySpecified", x.SET_CONFIG = "setConfig", x.SET_STORIES =
"setStories", x.SET_INDEX = "setIndex", x.SET_CURRENT_STORY = "setCurrentStory", x.CURRENT_STORY_WAS_SET = "currentStoryWasSet", x.FORCE_RE_RENDER =
"forceReRender", x.FORCE_REMOUNT = "forceRemount", x.PRELOAD_ENTRIES = "preloadStories", x.STORY_PREPARED = "storyPrepared", x.DOCS_PREPARED =
"docsPrepared", x.STORY_CHANGED = "storyChanged", x.STORY_UNCHANGED = "storyUnchanged", x.STORY_RENDERED = "storyRendered", x.STORY_MISSING =
"storyMissing", x.STORY_ERRORED = "storyErrored", x.STORY_THREW_EXCEPTION = "storyThrewException", x.STORY_RENDER_PHASE_CHANGED = "storyRend\
erPhaseChanged", x.PLAY_FUNCTION_THREW_EXCEPTION = "playFunctionThrewException", x.UNHANDLED_ERRORS_WHILE_PLAYING = "unhandledErrorsWhilePla\
ying", x.UPDATE_STORY_ARGS = "updateStoryArgs", x.STORY_ARGS_UPDATED = "storyArgsUpdated", x.RESET_STORY_ARGS = "resetStoryArgs", x.SET_FILTER =
"setFilter", x.SET_GLOBALS = "setGlobals", x.UPDATE_GLOBALS = "updateGlobals", x.GLOBALS_UPDATED = "globalsUpdated", x.REGISTER_SUBSCRIPTION =
"registerSubscription", x.PREVIEW_KEYDOWN = "previewKeydown", x.PREVIEW_BUILDER_PROGRESS = "preview_builder_progress", x.SELECT_STORY = "sel\
ectStory", x.STORIES_COLLAPSE_ALL = "storiesCollapseAll", x.STORIES_EXPAND_ALL = "storiesExpandAll", x.DOCS_RENDERED = "docsRendered", x.SHARED_STATE_CHANGED =
"sharedStateChanged", x.SHARED_STATE_SET = "sharedStateSet", x.NAVIGATE_URL = "navigateUrl", x.UPDATE_QUERY_PARAMS = "updateQueryParams", x.
REQUEST_WHATS_NEW_DATA = "requestWhatsNewData", x.RESULT_WHATS_NEW_DATA = "resultWhatsNewData", x.SET_WHATS_NEW_CACHE = "setWhatsNewCache", x.
TOGGLE_WHATS_NEW_NOTIFICATIONS = "toggleWhatsNewNotifications", x.TELEMETRY_ERROR = "telemetryError", x.FILE_COMPONENT_SEARCH_REQUEST = "fil\
eComponentSearchRequest", x.FILE_COMPONENT_SEARCH_RESPONSE = "fileComponentSearchResponse", x.SAVE_STORY_REQUEST = "saveStoryRequest", x.SAVE_STORY_RESPONSE =
"saveStoryResponse", x.ARGTYPES_INFO_REQUEST = "argtypesInfoRequest", x.ARGTYPES_INFO_RESPONSE = "argtypesInfoResponse", x.CREATE_NEW_STORYFILE_REQUEST =
"createNewStoryfileRequest", x.CREATE_NEW_STORYFILE_RESPONSE = "createNewStoryfileResponse", x.TESTING_MODULE_CRASH_REPORT = "testingModuleC\
rashReport", x.TESTING_MODULE_PROGRESS_REPORT = "testingModuleProgressReport", x.TESTING_MODULE_RUN_REQUEST = "testingModuleRunRequest", x.TESTING_MODULE_RUN_ALL_REQUEST =
"testingModuleRunAllRequest", x.TESTING_MODULE_CANCEL_TEST_RUN_REQUEST = "testingModuleCancelTestRunRequest", x.TESTING_MODULE_CANCEL_TEST_RUN_RESPONSE =
"testingModuleCancelTestRunResponse", x.TESTING_MODULE_WATCH_MODE_REQUEST = "testingModuleWatchModeRequest", x))(Ft || {}), Hi = Ft, {
  CHANNEL_WS_DISCONNECT: Dt,
  CHANNEL_CREATED: zi,
  CONFIG_ERROR: kt,
  CREATE_NEW_STORYFILE_REQUEST: Wi,
  CREATE_NEW_STORYFILE_RESPONSE: $i,
  CURRENT_STORY_WAS_SET: Wr,
  DOCS_PREPARED: Nt,
  DOCS_RENDERED: nr,
  FILE_COMPONENT_SEARCH_REQUEST: Yi,
  FILE_COMPONENT_SEARCH_RESPONSE: Ki,
  FORCE_RE_RENDER: sr,
  FORCE_REMOUNT: Lt,
  GLOBALS_UPDATED: xe,
  NAVIGATE_URL: Xi,
  PLAY_FUNCTION_THREW_EXCEPTION: jt,
  UNHANDLED_ERRORS_WHILE_PLAYING: Mt,
  PRELOAD_ENTRIES: qt,
  PREVIEW_BUILDER_PROGRESS: Ji,
  PREVIEW_KEYDOWN: Ut,
  REGISTER_SUBSCRIPTION: Qi,
  RESET_STORY_ARGS: ar,
  SELECT_STORY: Zi,
  SET_CONFIG: el,
  SET_CURRENT_STORY: Bt,
  SET_FILTER: rl,
  SET_GLOBALS: Gt,
  SET_INDEX: tl,
  SET_STORIES: ol,
  SHARED_STATE_CHANGED: nl,
  SHARED_STATE_SET: sl,
  STORIES_COLLAPSE_ALL: al,
  STORIES_EXPAND_ALL: il,
  STORY_ARGS_UPDATED: Vt,
  STORY_CHANGED: Ht,
  STORY_ERRORED: zt,
  STORY_INDEX_INVALIDATED: Wt,
  STORY_MISSING: $r,
  STORY_PREPARED: $t,
  STORY_RENDER_PHASE_CHANGED: Ae,
  STORY_RENDERED: Ue,
  STORY_SPECIFIED: Yt,
  STORY_THREW_EXCEPTION: Kt,
  STORY_UNCHANGED: Xt,
  UPDATE_GLOBALS: ir,
  UPDATE_QUERY_PARAMS: Jt,
  UPDATE_STORY_ARGS: lr,
  REQUEST_WHATS_NEW_DATA: ll,
  RESULT_WHATS_NEW_DATA: cl,
  SET_WHATS_NEW_CACHE: pl,
  TOGGLE_WHATS_NEW_NOTIFICATIONS: dl,
  TELEMETRY_ERROR: Qt,
  SAVE_STORY_REQUEST: ul,
  SAVE_STORY_RESPONSE: fl,
  ARGTYPES_INFO_REQUEST: Zt,
  ARGTYPES_INFO_RESPONSE: Yr,
  TESTING_MODULE_CRASH_REPORT: yl,
  TESTING_MODULE_PROGRESS_REPORT: ml,
  TESTING_MODULE_RUN_REQUEST: hl,
  TESTING_MODULE_RUN_ALL_REQUEST: gl,
  TESTING_MODULE_CANCEL_TEST_RUN_REQUEST: Sl,
  TESTING_MODULE_CANCEL_TEST_RUN_RESPONSE: bl,
  TESTING_MODULE_WATCH_MODE_REQUEST: Tl
} = Ft;

// src/preview/globals/globals.ts
var eo = {
  "@storybook/global": "__STORYBOOK_MODULE_GLOBAL__",
  "storybook/internal/channels": "__STORYBOOK_MODULE_CHANNELS__",
  "@storybook/channels": "__STORYBOOK_MODULE_CHANNELS__",
  "@storybook/core/channels": "__STORYBOOK_MODULE_CHANNELS__",
  "storybook/internal/client-logger": "__STORYBOOK_MODULE_CLIENT_LOGGER__",
  "@storybook/client-logger": "__STORYBOOK_MODULE_CLIENT_LOGGER__",
  "@storybook/core/client-logger": "__STORYBOOK_MODULE_CLIENT_LOGGER__",
  "storybook/internal/core-events": "__STORYBOOK_MODULE_CORE_EVENTS__",
  "@storybook/core-events": "__STORYBOOK_MODULE_CORE_EVENTS__",
  "@storybook/core/core-events": "__STORYBOOK_MODULE_CORE_EVENTS__",
  "storybook/internal/preview-errors": "__STORYBOOK_MODULE_CORE_EVENTS_PREVIEW_ERRORS__",
  "@storybook/core-events/preview-errors": "__STORYBOOK_MODULE_CORE_EVENTS_PREVIEW_ERRORS__",
  "@storybook/core/preview-errors": "__STORYBOOK_MODULE_CORE_EVENTS_PREVIEW_ERRORS__",
  "storybook/internal/preview-api": "__STORYBOOK_MODULE_PREVIEW_API__",
  "@storybook/preview-api": "__STORYBOOK_MODULE_PREVIEW_API__",
  "@storybook/core/preview-api": "__STORYBOOK_MODULE_PREVIEW_API__",
  "storybook/internal/types": "__STORYBOOK_MODULE_TYPES__",
  "@storybook/types": "__STORYBOOK_MODULE_TYPES__",
  "@storybook/core/types": "__STORYBOOK_MODULE_TYPES__"
}, zn = Object.keys(eo);

// src/channels/index.ts
var fr = {};
Re(fr, {
  Channel: () => ye,
  PostMessageTransport: () => We,
  WebsocketTransport: () => $e,
  createBrowserChannel: () => gd,
  default: () => hd
});

// src/channels/main.ts
var El = /* @__PURE__ */ s((r) => r.transports !== void 0, "isMulti"), Rl = /* @__PURE__ */ s(() => Math.random().toString(16).slice(2), "ge\
nerateRandomId"), ro = class ro {
  constructor(e = {}) {
    this.sender = Rl();
    this.events = {};
    this.data = {};
    this.transports = [];
    this.isAsync = e.async || !1, El(e) ? (this.transports = e.transports || [], this.transports.forEach((t) => {
      t.setHandler((o) => this.handleEvent(o));
    })) : this.transports = e.transport ? [e.transport] : [], this.transports.forEach((t) => {
      t.setHandler((o) => this.handleEvent(o));
    });
  }
  get hasTransport() {
    return this.transports.length > 0;
  }
  addListener(e, t) {
    this.events[e] = this.events[e] || [], this.events[e].push(t);
  }
  emit(e, ...t) {
    let o = { type: e, args: t, from: this.sender }, n = {};
    t.length >= 1 && t[0] && t[0].options && (n = t[0].options);
    let a = /* @__PURE__ */ s(() => {
      this.transports.forEach((l) => {
        l.send(o, n);
      }), this.handleEvent(o);
    }, "handler");
    this.isAsync ? setImmediate(a) : a();
  }
  last(e) {
    return this.data[e];
  }
  eventNames() {
    return Object.keys(this.events);
  }
  listenerCount(e) {
    let t = this.listeners(e);
    return t ? t.length : 0;
  }
  listeners(e) {
    return this.events[e] || void 0;
  }
  once(e, t) {
    let o = this.onceListener(e, t);
    this.addListener(e, o);
  }
  removeAllListeners(e) {
    e ? this.events[e] && delete this.events[e] : this.events = {};
  }
  removeListener(e, t) {
    let o = this.listeners(e);
    o && (this.events[e] = o.filter((n) => n !== t));
  }
  on(e, t) {
    this.addListener(e, t);
  }
  off(e, t) {
    this.removeListener(e, t);
  }
  handleEvent(e) {
    let t = this.listeners(e.type);
    t && t.length && t.forEach((o) => {
      o.apply(e, e.args);
    }), this.data[e.type] = e.args;
  }
  onceListener(e, t) {
    let o = /* @__PURE__ */ s((...n) => (this.removeListener(e, o), t(...n)), "onceListener");
    return o;
  }
};
s(ro, "Channel");
var ye = ro;

// src/client-logger/index.ts
var cr = {};
Re(cr, {
  deprecate: () => te,
  logger: () => C,
  once: () => L,
  pretty: () => Y
});
var { LOGLEVEL: xl } = R, me = {
  trace: 1,
  debug: 2,
  info: 3,
  warn: 4,
  error: 5,
  silent: 10
}, Al = xl, Be = me[Al] || me.info, C = {
  trace: /* @__PURE__ */ s((r, ...e) => {
    Be <= me.trace && console.trace(r, ...e);
  }, "trace"),
  debug: /* @__PURE__ */ s((r, ...e) => {
    Be <= me.debug && console.debug(r, ...e);
  }, "debug"),
  info: /* @__PURE__ */ s((r, ...e) => {
    Be <= me.info && console.info(r, ...e);
  }, "info"),
  warn: /* @__PURE__ */ s((r, ...e) => {
    Be <= me.warn && console.warn(r, ...e);
  }, "warn"),
  error: /* @__PURE__ */ s((r, ...e) => {
    Be <= me.error && console.error(r, ...e);
  }, "error"),
  log: /* @__PURE__ */ s((r, ...e) => {
    Be < me.silent && console.log(r, ...e);
  }, "log")
}, to = /* @__PURE__ */ new Set(), L = /* @__PURE__ */ s((r) => (e, ...t) => {
  if (!to.has(e))
    return to.add(e), C[r](e, ...t);
}, "once");
L.clear = () => to.clear();
L.trace = L("trace");
L.debug = L("debug");
L.info = L("info");
L.warn = L("warn");
L.error = L("error");
L.log = L("log");
var te = L("warn"), Y = /* @__PURE__ */ s((r) => (...e) => {
  let t = [];
  if (e.length) {
    let o = /<span\s+style=(['"])([^'"]*)\1\s*>/gi, n = /<\/span>/gi, a;
    for (t.push(e[0].replace(o, "%c").replace(n, "%c")); a = o.exec(e[0]); )
      t.push(a[2]), t.push("");
    for (let l = 1; l < e.length; l++)
      t.push(e[l]);
  }
  C[r].apply(C, t);
}, "pretty");
Y.trace = Y("trace");
Y.debug = Y("debug");
Y.info = Y("info");
Y.warn = Y("warn");
Y.error = Y("error");

// ../node_modules/telejson/dist/chunk-465TF3XA.mjs
var _l = Object.create, Wn = Object.defineProperty, wl = Object.getOwnPropertyDescriptor, $n = Object.getOwnPropertyNames, vl = Object.getPrototypeOf,
Pl = Object.prototype.hasOwnProperty, X = /* @__PURE__ */ s((r, e) => /* @__PURE__ */ s(function() {
  return e || (0, r[$n(r)[0]])((e = { exports: {} }).exports, e), e.exports;
}, "__require"), "__commonJS"), Cl = /* @__PURE__ */ s((r, e, t, o) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let n of $n(e))
      !Pl.call(r, n) && n !== t && Wn(r, n, { get: /* @__PURE__ */ s(() => e[n], "get"), enumerable: !(o = wl(e, n)) || o.enumerable });
  return r;
}, "__copyProps"), Kr = /* @__PURE__ */ s((r, e, t) => (t = r != null ? _l(vl(r)) : {}, Cl(
  e || !r || !r.__esModule ? Wn(t, "default", { value: r, enumerable: !0 }) : t,
  r
)), "__toESM"), Ol = [
  "bubbles",
  "cancelBubble",
  "cancelable",
  "composed",
  "currentTarget",
  "defaultPrevented",
  "eventPhase",
  "isTrusted",
  "returnValue",
  "srcElement",
  "target",
  "timeStamp",
  "type"
], Il = ["detail"];
function Yn(r) {
  let e = Ol.filter((t) => r[t] !== void 0).reduce((t, o) => ({ ...t, [o]: r[o] }), {});
  return r instanceof CustomEvent && Il.filter((t) => r[t] !== void 0).forEach((t) => {
    e[t] = r[t];
  }), e;
}
s(Yn, "extractEventHiddenProperties");

// ../node_modules/telejson/dist/index.mjs
var ps = ue(Xr(), 1);
var rs = X({
  "node_modules/has-symbols/shams.js"(r, e) {
    "use strict";
    e.exports = /* @__PURE__ */ s(function() {
      if (typeof Symbol != "function" || typeof Object.getOwnPropertySymbols != "function")
        return !1;
      if (typeof Symbol.iterator == "symbol")
        return !0;
      var o = {}, n = Symbol("test"), a = Object(n);
      if (typeof n == "string" || Object.prototype.toString.call(n) !== "[object Symbol]" || Object.prototype.toString.call(a) !== "[object \
Symbol]")
        return !1;
      var l = 42;
      o[n] = l;
      for (n in o)
        return !1;
      if (typeof Object.keys == "function" && Object.keys(o).length !== 0 || typeof Object.getOwnPropertyNames == "function" && Object.getOwnPropertyNames(
      o).length !== 0)
        return !1;
      var c = Object.getOwnPropertySymbols(o);
      if (c.length !== 1 || c[0] !== n || !Object.prototype.propertyIsEnumerable.call(o, n))
        return !1;
      if (typeof Object.getOwnPropertyDescriptor == "function") {
        var i = Object.getOwnPropertyDescriptor(o, n);
        if (i.value !== l || i.enumerable !== !0)
          return !1;
      }
      return !0;
    }, "hasSymbols");
  }
}), ts = X({
  "node_modules/has-symbols/index.js"(r, e) {
    "use strict";
    var t = typeof Symbol < "u" && Symbol, o = rs();
    e.exports = /* @__PURE__ */ s(function() {
      return typeof t != "function" || typeof Symbol != "function" || typeof t("foo") != "symbol" || typeof Symbol("bar") != "symbol" ? !1 :
      o();
    }, "hasNativeSymbols");
  }
}), Fl = X({
  "node_modules/function-bind/implementation.js"(r, e) {
    "use strict";
    var t = "Function.prototype.bind called on incompatible ", o = Array.prototype.slice, n = Object.prototype.toString, a = "[object Functi\
on]";
    e.exports = /* @__PURE__ */ s(function(c) {
      var i = this;
      if (typeof i != "function" || n.call(i) !== a)
        throw new TypeError(t + i);
      for (var p = o.call(arguments, 1), u, d = /* @__PURE__ */ s(function() {
        if (this instanceof u) {
          var h = i.apply(
            this,
            p.concat(o.call(arguments))
          );
          return Object(h) === h ? h : this;
        } else
          return i.apply(
            c,
            p.concat(o.call(arguments))
          );
      }, "binder"), y = Math.max(0, i.length - p.length), g = [], m = 0; m < y; m++)
        g.push("$" + m);
      if (u = Function("binder", "return function (" + g.join(",") + "){ return binder.apply(this,arguments); }")(d), i.prototype) {
        var S = /* @__PURE__ */ s(function() {
        }, "Empty2");
        S.prototype = i.prototype, u.prototype = new S(), S.prototype = null;
      }
      return u;
    }, "bind");
  }
}), so = X({
  "node_modules/function-bind/index.js"(r, e) {
    "use strict";
    var t = Fl();
    e.exports = Function.prototype.bind || t;
  }
}), Dl = X({
  "node_modules/has/src/index.js"(r, e) {
    "use strict";
    var t = so();
    e.exports = t.call(Function.call, Object.prototype.hasOwnProperty);
  }
}), os = X({
  "node_modules/get-intrinsic/index.js"(r, e) {
    "use strict";
    var t, o = SyntaxError, n = Function, a = TypeError, l = /* @__PURE__ */ s(function(k) {
      try {
        return n('"use strict"; return (' + k + ").constructor;")();
      } catch {
      }
    }, "getEvalledConstructor"), c = Object.getOwnPropertyDescriptor;
    if (c)
      try {
        c({}, "");
      } catch {
        c = null;
      }
    var i = /* @__PURE__ */ s(function() {
      throw new a();
    }, "throwTypeError"), p = c ? function() {
      try {
        return arguments.callee, i;
      } catch {
        try {
          return c(arguments, "callee").get;
        } catch {
          return i;
        }
      }
    }() : i, u = ts()(), d = Object.getPrototypeOf || function(k) {
      return k.__proto__;
    }, y = {}, g = typeof Uint8Array > "u" ? t : d(Uint8Array), m = {
      "%AggregateError%": typeof AggregateError > "u" ? t : AggregateError,
      "%Array%": Array,
      "%ArrayBuffer%": typeof ArrayBuffer > "u" ? t : ArrayBuffer,
      "%ArrayIteratorPrototype%": u ? d([][Symbol.iterator]()) : t,
      "%AsyncFromSyncIteratorPrototype%": t,
      "%AsyncFunction%": y,
      "%AsyncGenerator%": y,
      "%AsyncGeneratorFunction%": y,
      "%AsyncIteratorPrototype%": y,
      "%Atomics%": typeof Atomics > "u" ? t : Atomics,
      "%BigInt%": typeof BigInt > "u" ? t : BigInt,
      "%Boolean%": Boolean,
      "%DataView%": typeof DataView > "u" ? t : DataView,
      "%Date%": Date,
      "%decodeURI%": decodeURI,
      "%decodeURIComponent%": decodeURIComponent,
      "%encodeURI%": encodeURI,
      "%encodeURIComponent%": encodeURIComponent,
      "%Error%": Error,
      "%eval%": eval,
      "%EvalError%": EvalError,
      "%Float32Array%": typeof Float32Array > "u" ? t : Float32Array,
      "%Float64Array%": typeof Float64Array > "u" ? t : Float64Array,
      "%FinalizationRegistry%": typeof FinalizationRegistry > "u" ? t : FinalizationRegistry,
      "%Function%": n,
      "%GeneratorFunction%": y,
      "%Int8Array%": typeof Int8Array > "u" ? t : Int8Array,
      "%Int16Array%": typeof Int16Array > "u" ? t : Int16Array,
      "%Int32Array%": typeof Int32Array > "u" ? t : Int32Array,
      "%isFinite%": isFinite,
      "%isNaN%": isNaN,
      "%IteratorPrototype%": u ? d(d([][Symbol.iterator]())) : t,
      "%JSON%": typeof JSON == "object" ? JSON : t,
      "%Map%": typeof Map > "u" ? t : Map,
      "%MapIteratorPrototype%": typeof Map > "u" || !u ? t : d((/* @__PURE__ */ new Map())[Symbol.iterator]()),
      "%Math%": Math,
      "%Number%": Number,
      "%Object%": Object,
      "%parseFloat%": parseFloat,
      "%parseInt%": parseInt,
      "%Promise%": typeof Promise > "u" ? t : Promise,
      "%Proxy%": typeof Proxy > "u" ? t : Proxy,
      "%RangeError%": RangeError,
      "%ReferenceError%": ReferenceError,
      "%Reflect%": typeof Reflect > "u" ? t : Reflect,
      "%RegExp%": RegExp,
      "%Set%": typeof Set > "u" ? t : Set,
      "%SetIteratorPrototype%": typeof Set > "u" || !u ? t : d((/* @__PURE__ */ new Set())[Symbol.iterator]()),
      "%SharedArrayBuffer%": typeof SharedArrayBuffer > "u" ? t : SharedArrayBuffer,
      "%String%": String,
      "%StringIteratorPrototype%": u ? d(""[Symbol.iterator]()) : t,
      "%Symbol%": u ? Symbol : t,
      "%SyntaxError%": o,
      "%ThrowTypeError%": p,
      "%TypedArray%": g,
      "%TypeError%": a,
      "%Uint8Array%": typeof Uint8Array > "u" ? t : Uint8Array,
      "%Uint8ClampedArray%": typeof Uint8ClampedArray > "u" ? t : Uint8ClampedArray,
      "%Uint16Array%": typeof Uint16Array > "u" ? t : Uint16Array,
      "%Uint32Array%": typeof Uint32Array > "u" ? t : Uint32Array,
      "%URIError%": URIError,
      "%WeakMap%": typeof WeakMap > "u" ? t : WeakMap,
      "%WeakRef%": typeof WeakRef > "u" ? t : WeakRef,
      "%WeakSet%": typeof WeakSet > "u" ? t : WeakSet
    }, S = /* @__PURE__ */ s(function k(F) {
      var M;
      if (F === "%AsyncFunction%")
        M = l("async function () {}");
      else if (F === "%GeneratorFunction%")
        M = l("function* () {}");
      else if (F === "%AsyncGeneratorFunction%")
        M = l("async function* () {}");
      else if (F === "%AsyncGenerator%") {
        var N = k("%AsyncGeneratorFunction%");
        N && (M = N.prototype);
      } else if (F === "%AsyncIteratorPrototype%") {
        var I = k("%AsyncGenerator%");
        I && (M = d(I.prototype));
      }
      return m[F] = M, M;
    }, "doEval2"), h = {
      "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
      "%ArrayPrototype%": ["Array", "prototype"],
      "%ArrayProto_entries%": ["Array", "prototype", "entries"],
      "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
      "%ArrayProto_keys%": ["Array", "prototype", "keys"],
      "%ArrayProto_values%": ["Array", "prototype", "values"],
      "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
      "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
      "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
      "%BooleanPrototype%": ["Boolean", "prototype"],
      "%DataViewPrototype%": ["DataView", "prototype"],
      "%DatePrototype%": ["Date", "prototype"],
      "%ErrorPrototype%": ["Error", "prototype"],
      "%EvalErrorPrototype%": ["EvalError", "prototype"],
      "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
      "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
      "%FunctionPrototype%": ["Function", "prototype"],
      "%Generator%": ["GeneratorFunction", "prototype"],
      "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
      "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
      "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
      "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
      "%JSONParse%": ["JSON", "parse"],
      "%JSONStringify%": ["JSON", "stringify"],
      "%MapPrototype%": ["Map", "prototype"],
      "%NumberPrototype%": ["Number", "prototype"],
      "%ObjectPrototype%": ["Object", "prototype"],
      "%ObjProto_toString%": ["Object", "prototype", "toString"],
      "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
      "%PromisePrototype%": ["Promise", "prototype"],
      "%PromiseProto_then%": ["Promise", "prototype", "then"],
      "%Promise_all%": ["Promise", "all"],
      "%Promise_reject%": ["Promise", "reject"],
      "%Promise_resolve%": ["Promise", "resolve"],
      "%RangeErrorPrototype%": ["RangeError", "prototype"],
      "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
      "%RegExpPrototype%": ["RegExp", "prototype"],
      "%SetPrototype%": ["Set", "prototype"],
      "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
      "%StringPrototype%": ["String", "prototype"],
      "%SymbolPrototype%": ["Symbol", "prototype"],
      "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
      "%TypedArrayPrototype%": ["TypedArray", "prototype"],
      "%TypeErrorPrototype%": ["TypeError", "prototype"],
      "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
      "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
      "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
      "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
      "%URIErrorPrototype%": ["URIError", "prototype"],
      "%WeakMapPrototype%": ["WeakMap", "prototype"],
      "%WeakSetPrototype%": ["WeakSet", "prototype"]
    }, A = so(), b = Dl(), E = A.call(Function.call, Array.prototype.concat), T = A.call(Function.apply, Array.prototype.splice), _ = A.call(
    Function.call, String.prototype.replace), P = A.call(Function.call, String.prototype.slice), D = A.call(Function.call, RegExp.prototype.
    exec), O = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, U = /\\(\\)?/g, J = /* @__PURE__ */ s(
    function(F) {
      var M = P(F, 0, 1), N = P(F, -1);
      if (M === "%" && N !== "%")
        throw new o("invalid intrinsic syntax, expected closing `%`");
      if (N === "%" && M !== "%")
        throw new o("invalid intrinsic syntax, expected opening `%`");
      var I = [];
      return _(F, O, function(V, Q, $, Ur) {
        I[I.length] = $ ? _(Ur, U, "$1") : Q || V;
      }), I;
    }, "stringToPath3"), de = /* @__PURE__ */ s(function(F, M) {
      var N = F, I;
      if (b(h, N) && (I = h[N], N = "%" + I[0] + "%"), b(m, N)) {
        var V = m[N];
        if (V === y && (V = S(N)), typeof V > "u" && !M)
          throw new a("intrinsic " + F + " exists, but is not available. Please file an issue!");
        return {
          alias: I,
          name: N,
          value: V
        };
      }
      throw new o("intrinsic " + F + " does not exist!");
    }, "getBaseIntrinsic2");
    e.exports = /* @__PURE__ */ s(function(F, M) {
      if (typeof F != "string" || F.length === 0)
        throw new a("intrinsic name must be a non-empty string");
      if (arguments.length > 1 && typeof M != "boolean")
        throw new a('"allowMissing" argument must be a boolean');
      if (D(/^%?[^%]*%?$/, F) === null)
        throw new o("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
      var N = J(F), I = N.length > 0 ? N[0] : "", V = de("%" + I + "%", M), Q = V.name, $ = V.value, Ur = !1, Ot = V.alias;
      Ot && (I = Ot[0], T(N, E([0, 1], Ot)));
      for (var Br = 1, tr = !0; Br < N.length; Br += 1) {
        var ae = N[Br], Gr = P(ae, 0, 1), Vr = P(ae, -1);
        if ((Gr === '"' || Gr === "'" || Gr === "`" || Vr === '"' || Vr === "'" || Vr === "`") && Gr !== Vr)
          throw new o("property names with quotes must have matching quotes");
        if ((ae === "constructor" || !tr) && (Ur = !0), I += "." + ae, Q = "%" + I + "%", b(m, Q))
          $ = m[Q];
        else if ($ != null) {
          if (!(ae in $)) {
            if (!M)
              throw new a("base intrinsic for " + F + " exists, but the property is not available.");
            return;
          }
          if (c && Br + 1 >= N.length) {
            var Hr = c($, ae);
            tr = !!Hr, tr && "get" in Hr && !("originalValue" in Hr.get) ? $ = Hr.get : $ = $[ae];
          } else
            tr = b($, ae), $ = $[ae];
          tr && !Ur && (m[Q] = $);
        }
      }
      return $;
    }, "GetIntrinsic");
  }
}), kl = X({
  "node_modules/call-bind/index.js"(r, e) {
    "use strict";
    var t = so(), o = os(), n = o("%Function.prototype.apply%"), a = o("%Function.prototype.call%"), l = o("%Reflect.apply%", !0) || t.call(
    a, n), c = o("%Object.getOwnPropertyDescriptor%", !0), i = o("%Object.defineProperty%", !0), p = o("%Math.max%");
    if (i)
      try {
        i({}, "a", { value: 1 });
      } catch {
        i = null;
      }
    e.exports = /* @__PURE__ */ s(function(y) {
      var g = l(t, a, arguments);
      if (c && i) {
        var m = c(g, "length");
        m.configurable && i(
          g,
          "length",
          { value: 1 + p(0, y.length - (arguments.length - 1)) }
        );
      }
      return g;
    }, "callBind");
    var u = /* @__PURE__ */ s(function() {
      return l(t, n, arguments);
    }, "applyBind2");
    i ? i(e.exports, "apply", { value: u }) : e.exports.apply = u;
  }
}), Nl = X({
  "node_modules/call-bind/callBound.js"(r, e) {
    "use strict";
    var t = os(), o = kl(), n = o(t("String.prototype.indexOf"));
    e.exports = /* @__PURE__ */ s(function(l, c) {
      var i = t(l, !!c);
      return typeof i == "function" && n(l, ".prototype.") > -1 ? o(i) : i;
    }, "callBoundIntrinsic");
  }
}), Ll = X({
  "node_modules/has-tostringtag/shams.js"(r, e) {
    "use strict";
    var t = rs();
    e.exports = /* @__PURE__ */ s(function() {
      return t() && !!Symbol.toStringTag;
    }, "hasToStringTagShams");
  }
}), jl = X({
  "node_modules/is-regex/index.js"(r, e) {
    "use strict";
    var t = Nl(), o = Ll()(), n, a, l, c;
    o && (n = t("Object.prototype.hasOwnProperty"), a = t("RegExp.prototype.exec"), l = {}, i = /* @__PURE__ */ s(function() {
      throw l;
    }, "throwRegexMarker"), c = {
      toString: i,
      valueOf: i
    }, typeof Symbol.toPrimitive == "symbol" && (c[Symbol.toPrimitive] = i));
    var i, p = t("Object.prototype.toString"), u = Object.getOwnPropertyDescriptor, d = "[object RegExp]";
    e.exports = /* @__PURE__ */ s(o ? function(g) {
      if (!g || typeof g != "object")
        return !1;
      var m = u(g, "lastIndex"), S = m && n(m, "value");
      if (!S)
        return !1;
      try {
        a(g, c);
      } catch (h) {
        return h === l;
      }
    } : function(g) {
      return !g || typeof g != "object" && typeof g != "function" ? !1 : p(g) === d;
    }, "isRegex");
  }
}), Ml = X({
  "node_modules/is-function/index.js"(r, e) {
    e.exports = o;
    var t = Object.prototype.toString;
    function o(n) {
      if (!n)
        return !1;
      var a = t.call(n);
      return a === "[object Function]" || typeof n == "function" && a !== "[object RegExp]" || typeof window < "u" && (n === window.setTimeout ||
      n === window.alert || n === window.confirm || n === window.prompt);
    }
    s(o, "isFunction3");
  }
}), ql = X({
  "node_modules/is-symbol/index.js"(r, e) {
    "use strict";
    var t = Object.prototype.toString, o = ts()();
    o ? (n = Symbol.prototype.toString, a = /^Symbol\(.*\)$/, l = /* @__PURE__ */ s(function(i) {
      return typeof i.valueOf() != "symbol" ? !1 : a.test(n.call(i));
    }, "isRealSymbolObject"), e.exports = /* @__PURE__ */ s(function(i) {
      if (typeof i == "symbol")
        return !0;
      if (t.call(i) !== "[object Symbol]")
        return !1;
      try {
        return l(i);
      } catch {
        return !1;
      }
    }, "isSymbol3")) : e.exports = /* @__PURE__ */ s(function(i) {
      return !1;
    }, "isSymbol3");
    var n, a, l;
  }
}), Ul = Kr(jl()), Bl = Kr(Ml()), Gl = Kr(ql());
function Vl(r) {
  return r != null && typeof r == "object" && Array.isArray(r) === !1;
}
s(Vl, "isObject");
var Hl = typeof global == "object" && global && global.Object === Object && global, zl = Hl, Wl = typeof self == "object" && self && self.Object ===
Object && self, $l = zl || Wl || Function("return this")(), ao = $l, Yl = ao.Symbol, Ge = Yl, ns = Object.prototype, Kl = ns.hasOwnProperty,
Xl = ns.toString, pr = Ge ? Ge.toStringTag : void 0;
function Jl(r) {
  var e = Kl.call(r, pr), t = r[pr];
  try {
    r[pr] = void 0;
    var o = !0;
  } catch {
  }
  var n = Xl.call(r);
  return o && (e ? r[pr] = t : delete r[pr]), n;
}
s(Jl, "getRawTag");
var Ql = Jl, Zl = Object.prototype, ec = Zl.toString;
function rc(r) {
  return ec.call(r);
}
s(rc, "objectToString");
var tc = rc, oc = "[object Null]", nc = "[object Undefined]", Xn = Ge ? Ge.toStringTag : void 0;
function sc(r) {
  return r == null ? r === void 0 ? nc : oc : Xn && Xn in Object(r) ? Ql(r) : tc(r);
}
s(sc, "baseGetTag");
var ss = sc;
function ac(r) {
  return r != null && typeof r == "object";
}
s(ac, "isObjectLike");
var ic = ac, lc = "[object Symbol]";
function cc(r) {
  return typeof r == "symbol" || ic(r) && ss(r) == lc;
}
s(cc, "isSymbol");
var io = cc;
function pc(r, e) {
  for (var t = -1, o = r == null ? 0 : r.length, n = Array(o); ++t < o; )
    n[t] = e(r[t], t, r);
  return n;
}
s(pc, "arrayMap");
var dc = pc, uc = Array.isArray, lo = uc, fc = 1 / 0, Jn = Ge ? Ge.prototype : void 0, Qn = Jn ? Jn.toString : void 0;
function as(r) {
  if (typeof r == "string")
    return r;
  if (lo(r))
    return dc(r, as) + "";
  if (io(r))
    return Qn ? Qn.call(r) : "";
  var e = r + "";
  return e == "0" && 1 / r == -fc ? "-0" : e;
}
s(as, "baseToString");
var yc = as;
function mc(r) {
  var e = typeof r;
  return r != null && (e == "object" || e == "function");
}
s(mc, "isObject2");
var is = mc, hc = "[object AsyncFunction]", gc = "[object Function]", Sc = "[object GeneratorFunction]", bc = "[object Proxy]";
function Tc(r) {
  if (!is(r))
    return !1;
  var e = ss(r);
  return e == gc || e == Sc || e == hc || e == bc;
}
s(Tc, "isFunction");
var Ec = Tc, Rc = ao["__core-js_shared__"], no = Rc, Zn = function() {
  var r = /[^.]+$/.exec(no && no.keys && no.keys.IE_PROTO || "");
  return r ? "Symbol(src)_1." + r : "";
}();
function xc(r) {
  return !!Zn && Zn in r;
}
s(xc, "isMasked");
var Ac = xc, _c = Function.prototype, wc = _c.toString;
function vc(r) {
  if (r != null) {
    try {
      return wc.call(r);
    } catch {
    }
    try {
      return r + "";
    } catch {
    }
  }
  return "";
}
s(vc, "toSource");
var Pc = vc, Cc = /[\\^$.*+?()[\]{}|]/g, Oc = /^\[object .+?Constructor\]$/, Ic = Function.prototype, Fc = Object.prototype, Dc = Ic.toString,
kc = Fc.hasOwnProperty, Nc = RegExp(
  "^" + Dc.call(kc).replace(Cc, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function Lc(r) {
  if (!is(r) || Ac(r))
    return !1;
  var e = Ec(r) ? Nc : Oc;
  return e.test(Pc(r));
}
s(Lc, "baseIsNative");
var jc = Lc;
function Mc(r, e) {
  return r?.[e];
}
s(Mc, "getValue");
var qc = Mc;
function Uc(r, e) {
  var t = qc(r, e);
  return jc(t) ? t : void 0;
}
s(Uc, "getNative");
var ls = Uc;
function Bc(r, e) {
  return r === e || r !== r && e !== e;
}
s(Bc, "eq");
var Gc = Bc, Vc = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, Hc = /^\w*$/;
function zc(r, e) {
  if (lo(r))
    return !1;
  var t = typeof r;
  return t == "number" || t == "symbol" || t == "boolean" || r == null || io(r) ? !0 : Hc.test(r) || !Vc.test(r) || e != null && r in Object(
  e);
}
s(zc, "isKey");
var Wc = zc, $c = ls(Object, "create"), dr = $c;
function Yc() {
  this.__data__ = dr ? dr(null) : {}, this.size = 0;
}
s(Yc, "hashClear");
var Kc = Yc;
function Xc(r) {
  var e = this.has(r) && delete this.__data__[r];
  return this.size -= e ? 1 : 0, e;
}
s(Xc, "hashDelete");
var Jc = Xc, Qc = "__lodash_hash_undefined__", Zc = Object.prototype, ep = Zc.hasOwnProperty;
function rp(r) {
  var e = this.__data__;
  if (dr) {
    var t = e[r];
    return t === Qc ? void 0 : t;
  }
  return ep.call(e, r) ? e[r] : void 0;
}
s(rp, "hashGet");
var tp = rp, op = Object.prototype, np = op.hasOwnProperty;
function sp(r) {
  var e = this.__data__;
  return dr ? e[r] !== void 0 : np.call(e, r);
}
s(sp, "hashHas");
var ap = sp, ip = "__lodash_hash_undefined__";
function lp(r, e) {
  var t = this.__data__;
  return this.size += this.has(r) ? 0 : 1, t[r] = dr && e === void 0 ? ip : e, this;
}
s(lp, "hashSet");
var cp = lp;
function Ve(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.clear(); ++e < t; ) {
    var o = r[e];
    this.set(o[0], o[1]);
  }
}
s(Ve, "Hash");
Ve.prototype.clear = Kc;
Ve.prototype.delete = Jc;
Ve.prototype.get = tp;
Ve.prototype.has = ap;
Ve.prototype.set = cp;
var es = Ve;
function pp() {
  this.__data__ = [], this.size = 0;
}
s(pp, "listCacheClear");
var dp = pp;
function up(r, e) {
  for (var t = r.length; t--; )
    if (Gc(r[t][0], e))
      return t;
  return -1;
}
s(up, "assocIndexOf");
var Qr = up, fp = Array.prototype, yp = fp.splice;
function mp(r) {
  var e = this.__data__, t = Qr(e, r);
  if (t < 0)
    return !1;
  var o = e.length - 1;
  return t == o ? e.pop() : yp.call(e, t, 1), --this.size, !0;
}
s(mp, "listCacheDelete");
var hp = mp;
function gp(r) {
  var e = this.__data__, t = Qr(e, r);
  return t < 0 ? void 0 : e[t][1];
}
s(gp, "listCacheGet");
var Sp = gp;
function bp(r) {
  return Qr(this.__data__, r) > -1;
}
s(bp, "listCacheHas");
var Tp = bp;
function Ep(r, e) {
  var t = this.__data__, o = Qr(t, r);
  return o < 0 ? (++this.size, t.push([r, e])) : t[o][1] = e, this;
}
s(Ep, "listCacheSet");
var Rp = Ep;
function He(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.clear(); ++e < t; ) {
    var o = r[e];
    this.set(o[0], o[1]);
  }
}
s(He, "ListCache");
He.prototype.clear = dp;
He.prototype.delete = hp;
He.prototype.get = Sp;
He.prototype.has = Tp;
He.prototype.set = Rp;
var xp = He, Ap = ls(ao, "Map"), _p = Ap;
function wp() {
  this.size = 0, this.__data__ = {
    hash: new es(),
    map: new (_p || xp)(),
    string: new es()
  };
}
s(wp, "mapCacheClear");
var vp = wp;
function Pp(r) {
  var e = typeof r;
  return e == "string" || e == "number" || e == "symbol" || e == "boolean" ? r !== "__proto__" : r === null;
}
s(Pp, "isKeyable");
var Cp = Pp;
function Op(r, e) {
  var t = r.__data__;
  return Cp(e) ? t[typeof e == "string" ? "string" : "hash"] : t.map;
}
s(Op, "getMapData");
var Zr = Op;
function Ip(r) {
  var e = Zr(this, r).delete(r);
  return this.size -= e ? 1 : 0, e;
}
s(Ip, "mapCacheDelete");
var Fp = Ip;
function Dp(r) {
  return Zr(this, r).get(r);
}
s(Dp, "mapCacheGet");
var kp = Dp;
function Np(r) {
  return Zr(this, r).has(r);
}
s(Np, "mapCacheHas");
var Lp = Np;
function jp(r, e) {
  var t = Zr(this, r), o = t.size;
  return t.set(r, e), this.size += t.size == o ? 0 : 1, this;
}
s(jp, "mapCacheSet");
var Mp = jp;
function ze(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.clear(); ++e < t; ) {
    var o = r[e];
    this.set(o[0], o[1]);
  }
}
s(ze, "MapCache");
ze.prototype.clear = vp;
ze.prototype.delete = Fp;
ze.prototype.get = kp;
ze.prototype.has = Lp;
ze.prototype.set = Mp;
var cs = ze, qp = "Expected a function";
function co(r, e) {
  if (typeof r != "function" || e != null && typeof e != "function")
    throw new TypeError(qp);
  var t = /* @__PURE__ */ s(function() {
    var o = arguments, n = e ? e.apply(this, o) : o[0], a = t.cache;
    if (a.has(n))
      return a.get(n);
    var l = r.apply(this, o);
    return t.cache = a.set(n, l) || a, l;
  }, "memoized");
  return t.cache = new (co.Cache || cs)(), t;
}
s(co, "memoize");
co.Cache = cs;
var Up = co, Bp = 500;
function Gp(r) {
  var e = Up(r, function(o) {
    return t.size === Bp && t.clear(), o;
  }), t = e.cache;
  return e;
}
s(Gp, "memoizeCapped");
var Vp = Gp, Hp = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, zp = /\\(\\)?/g, Wp = Vp(
function(r) {
  var e = [];
  return r.charCodeAt(0) === 46 && e.push(""), r.replace(Hp, function(t, o, n, a) {
    e.push(n ? a.replace(zp, "$1") : o || t);
  }), e;
}), $p = Wp;
function Yp(r) {
  return r == null ? "" : yc(r);
}
s(Yp, "toString");
var Kp = Yp;
function Xp(r, e) {
  return lo(r) ? r : Wc(r, e) ? [r] : $p(Kp(r));
}
s(Xp, "castPath");
var Jp = Xp, Qp = 1 / 0;
function Zp(r) {
  if (typeof r == "string" || io(r))
    return r;
  var e = r + "";
  return e == "0" && 1 / r == -Qp ? "-0" : e;
}
s(Zp, "toKey");
var ed = Zp;
function rd(r, e) {
  e = Jp(e, r);
  for (var t = 0, o = e.length; r != null && t < o; )
    r = r[ed(e[t++])];
  return t && t == o ? r : void 0;
}
s(rd, "baseGet");
var td = rd;
function od(r, e, t) {
  var o = r == null ? void 0 : td(r, e);
  return o === void 0 ? t : o;
}
s(od, "get");
var nd = od, Jr = Vl, sd = /* @__PURE__ */ s((r) => {
  let e = null, t = !1, o = !1, n = !1, a = "";
  if (r.indexOf("//") >= 0 || r.indexOf("/*") >= 0)
    for (let l = 0; l < r.length; l += 1)
      !e && !t && !o && !n ? r[l] === '"' || r[l] === "'" || r[l] === "`" ? e = r[l] : r[l] === "/" && r[l + 1] === "*" ? t = !0 : r[l] === "\
/" && r[l + 1] === "/" ? o = !0 : r[l] === "/" && r[l + 1] !== "/" && (n = !0) : (e && (r[l] === e && r[l - 1] !== "\\" || r[l] === `
` && e !== "`") && (e = null), n && (r[l] === "/" && r[l - 1] !== "\\" || r[l] === `
`) && (n = !1), t && r[l - 1] === "/" && r[l - 2] === "*" && (t = !1), o && r[l] === `
` && (o = !1)), !t && !o && (a += r[l]);
  else
    a = r;
  return a;
}, "removeCodeComments"), ad = (0, ps.default)(1e4)(
  (r) => sd(r).replace(/\n\s*/g, "").trim()
), id = /* @__PURE__ */ s(function(e, t) {
  let o = t.slice(0, t.indexOf("{")), n = t.slice(t.indexOf("{"));
  if (o.includes("=>") || o.includes("function"))
    return t;
  let a = o;
  return a = a.replace(e, "function"), a + n;
}, "convertShorthandMethods2"), ld = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, ur = /* @__PURE__ */ s((r) => r.match(/^[\[\{\"\}].*[\]\}\"]$/),
"isJSON");
function ds(r) {
  if (!Jr(r))
    return r;
  let e = r, t = !1;
  return typeof Event < "u" && r instanceof Event && (e = Yn(e), t = !0), e = Object.keys(e).reduce((o, n) => {
    try {
      e[n] && e[n].toJSON, o[n] = e[n];
    } catch {
      t = !0;
    }
    return o;
  }, {}), t ? e : r;
}
s(ds, "convertUnconventionalData");
var cd = /* @__PURE__ */ s(function(e) {
  let t, o, n, a;
  return /* @__PURE__ */ s(function(c, i) {
    try {
      if (c === "")
        return a = [], t = /* @__PURE__ */ new Map([[i, "[]"]]), o = /* @__PURE__ */ new Map(), n = [], i;
      let p = o.get(this) || this;
      for (; n.length && p !== n[0]; )
        n.shift(), a.pop();
      if (typeof i == "boolean")
        return i;
      if (i === void 0)
        return e.allowUndefined ? "_undefined_" : void 0;
      if (i === null)
        return null;
      if (typeof i == "number")
        return i === -1 / 0 ? "_-Infinity_" : i === 1 / 0 ? "_Infinity_" : Number.isNaN(i) ? "_NaN_" : i;
      if (typeof i == "bigint")
        return `_bigint_${i.toString()}`;
      if (typeof i == "string")
        return ld.test(i) ? e.allowDate ? `_date_${i}` : void 0 : i;
      if ((0, Ul.default)(i))
        return e.allowRegExp ? `_regexp_${i.flags}|${i.source}` : void 0;
      if ((0, Bl.default)(i)) {
        if (!e.allowFunction)
          return;
        let { name: d } = i, y = i.toString();
        return y.match(
          /(\[native code\]|WEBPACK_IMPORTED_MODULE|__webpack_exports__|__webpack_require__)/
        ) ? `_function_${d}|${(() => {
        }).toString()}` : `_function_${d}|${ad(id(c, y))}`;
      }
      if ((0, Gl.default)(i)) {
        if (!e.allowSymbol)
          return;
        let d = Symbol.keyFor(i);
        return d !== void 0 ? `_gsymbol_${d}` : `_symbol_${i.toString().slice(7, -1)}`;
      }
      if (n.length >= e.maxDepth)
        return Array.isArray(i) ? `[Array(${i.length})]` : "[Object]";
      if (i === this)
        return `_duplicate_${JSON.stringify(a)}`;
      if (i instanceof Error && e.allowError)
        return {
          __isConvertedError__: !0,
          errorProperties: {
            ...i.cause ? { cause: i.cause } : {},
            ...i,
            name: i.name,
            message: i.message,
            stack: i.stack,
            "_constructor-name_": i.constructor.name
          }
        };
      if (i.constructor && i.constructor.name && i.constructor.name !== "Object" && !Array.isArray(i) && !e.allowClass)
        return;
      let u = t.get(i);
      if (!u) {
        let d = Array.isArray(i) ? i : ds(i);
        if (i.constructor && i.constructor.name && i.constructor.name !== "Object" && !Array.isArray(i) && e.allowClass)
          try {
            Object.assign(d, { "_constructor-name_": i.constructor.name });
          } catch {
          }
        return a.push(c), n.unshift(d), t.set(i, JSON.stringify(a)), i !== d && o.set(i, d), d;
      }
      return `_duplicate_${u}`;
    } catch {
      return;
    }
  }, "replace");
}, "replacer2"), pd = /* @__PURE__ */ s(function reviver(options) {
  let refs = [], root;
  return /* @__PURE__ */ s(function revive(key, value) {
    if (key === "" && (root = value, refs.forEach(({ target: r, container: e, replacement: t }) => {
      let o = ur(t) ? JSON.parse(t) : t.split(".");
      o.length === 0 ? e[r] = root : e[r] = nd(root, o);
    })), key === "_constructor-name_")
      return value;
    if (Jr(value) && value.__isConvertedError__) {
      let { message: r, ...e } = value.errorProperties, t = new Error(r);
      return Object.assign(t, e), t;
    }
    if (Jr(value) && value["_constructor-name_"] && options.allowFunction) {
      let r = value["_constructor-name_"];
      if (r !== "Object") {
        let e = new Function(`return function ${r.replace(/[^a-zA-Z0-9$_]+/g, "")}(){}`)();
        Object.setPrototypeOf(value, new e());
      }
      return delete value["_constructor-name_"], value;
    }
    if (typeof value == "string" && value.startsWith("_function_") && options.allowFunction) {
      let [, name, source] = value.match(/_function_([^|]*)\|(.*)/) || [], sourceSanitized = source.replace(/[(\(\))|\\| |\]|`]*$/, "");
      if (!options.lazyEval)
        return eval(`(${sourceSanitized})`);
      let result = /* @__PURE__ */ s((...args) => {
        let f = eval(`(${sourceSanitized})`);
        return f(...args);
      }, "result");
      return Object.defineProperty(result, "toString", {
        value: /* @__PURE__ */ s(() => sourceSanitized, "value")
      }), Object.defineProperty(result, "name", {
        value: name
      }), result;
    }
    if (typeof value == "string" && value.startsWith("_regexp_") && options.allowRegExp) {
      let [, r, e] = value.match(/_regexp_([^|]*)\|(.*)/) || [];
      return new RegExp(e, r);
    }
    return typeof value == "string" && value.startsWith("_date_") && options.allowDate ? new Date(value.replace("_date_", "")) : typeof value ==
    "string" && value.startsWith("_duplicate_") ? (refs.push({ target: key, container: this, replacement: value.replace(/^_duplicate_/, "") }),
    null) : typeof value == "string" && value.startsWith("_symbol_") && options.allowSymbol ? Symbol(value.replace("_symbol_", "")) : typeof value ==
    "string" && value.startsWith("_gsymbol_") && options.allowSymbol ? Symbol.for(value.replace("_gsymbol_", "")) : typeof value == "string" &&
    value === "_-Infinity_" ? -1 / 0 : typeof value == "string" && value === "_Infinity_" ? 1 / 0 : typeof value == "string" && value === "_\
NaN_" ? NaN : typeof value == "string" && value.startsWith("_bigint_") && typeof BigInt == "function" ? BigInt(value.replace("_bigint_", "")) :
    value;
  }, "revive");
}, "reviver"), us = {
  maxDepth: 10,
  space: void 0,
  allowFunction: !0,
  allowRegExp: !0,
  allowDate: !0,
  allowClass: !0,
  allowError: !0,
  allowUndefined: !0,
  allowSymbol: !0,
  lazyEval: !0
}, et = /* @__PURE__ */ s((r, e = {}) => {
  let t = { ...us, ...e };
  return JSON.stringify(ds(r), cd(t), e.space);
}, "stringify"), dd = /* @__PURE__ */ s(() => {
  let r = /* @__PURE__ */ new Map();
  return /* @__PURE__ */ s(function e(t) {
    Jr(t) && Object.entries(t).forEach(([o, n]) => {
      n === "_undefined_" ? t[o] = void 0 : r.get(n) || (r.set(n, !0), e(n));
    }), Array.isArray(t) && t.forEach((o, n) => {
      o === "_undefined_" ? (r.set(o, !0), t[n] = void 0) : r.get(o) || (r.set(o, !0), e(o));
    });
  }, "mutateUndefined");
}, "mutator"), rt = /* @__PURE__ */ s((r, e = {}) => {
  let t = { ...us, ...e }, o = JSON.parse(r, pd(t));
  return dd()(o), o;
}, "parse");

// ../node_modules/tiny-invariant/dist/esm/tiny-invariant.js
var ud = !0, po = "Invariant failed";
function ie(r, e) {
  if (!r) {
    if (ud)
      throw new Error(po);
    var t = typeof e == "function" ? e() : e, o = t ? "".concat(po, ": ").concat(t) : po;
    throw new Error(o);
  }
}
s(ie, "invariant");

// src/channels/postmessage/getEventSourceUrl.ts
var fs = /* @__PURE__ */ s((r) => {
  let e = Array.from(
    document.querySelectorAll("iframe[data-is-storybook]")
  ), [t, ...o] = e.filter((a) => {
    try {
      return a.contentWindow?.location.origin === r.source.location.origin && a.contentWindow?.location.pathname === r.source.location.pathname;
    } catch {
    }
    try {
      return a.contentWindow === r.source;
    } catch {
    }
    let l = a.getAttribute("src"), c;
    try {
      if (!l)
        return !1;
      ({ origin: c } = new URL(l, document.location.toString()));
    } catch {
      return !1;
    }
    return c === r.origin;
  }), n = t?.getAttribute("src");
  if (n && o.length === 0) {
    let { protocol: a, host: l, pathname: c } = new URL(n, document.location.toString());
    return `${a}//${l}${c}`;
  }
  return o.length > 0 && C.error("found multiple candidates for event source"), null;
}, "getEventSourceUrl");

// src/channels/postmessage/index.ts
var { document: uo, location: fo } = R, ys = "storybook-channel", fd = { allowFunction: !1, maxDepth: 25 }, yo = class yo {
  constructor(e) {
    this.config = e;
    this.connected = !1;
    if (this.buffer = [], typeof R?.addEventListener == "function" && R.addEventListener("message", this.handleEvent.bind(this), !1), e.page !==
    "manager" && e.page !== "preview")
      throw new Error(`postmsg-channel: "config.page" cannot be "${e.page}"`);
  }
  setHandler(e) {
    this.handler = (...t) => {
      e.apply(this, t), !this.connected && this.getLocalFrame().length && (this.flush(), this.connected = !0);
    };
  }
  /**
   * Sends `event` to the associated window. If the window does not yet exist the event will be
   * stored in a buffer and sent when the window exists.
   *
   * @param event
   */
  send(e, t) {
    let {
      target: o,
      // telejson options
      allowRegExp: n,
      allowFunction: a,
      allowSymbol: l,
      allowDate: c,
      allowError: i,
      allowUndefined: p,
      allowClass: u,
      maxDepth: d,
      space: y,
      lazyEval: g
    } = t || {}, m = Object.fromEntries(
      Object.entries({
        allowRegExp: n,
        allowFunction: a,
        allowSymbol: l,
        allowDate: c,
        allowError: i,
        allowUndefined: p,
        allowClass: u,
        maxDepth: d,
        space: y,
        lazyEval: g
      }).filter(([E, T]) => typeof T < "u")
    ), S = {
      ...fd,
      ...R.CHANNEL_OPTIONS || {},
      ...m
    }, h = this.getFrames(o), A = new URLSearchParams(fo?.search || ""), b = et(
      {
        key: ys,
        event: e,
        refId: A.get("refId")
      },
      S
    );
    return h.length ? (this.buffer.length && this.flush(), h.forEach((E) => {
      try {
        E.postMessage(b, "*");
      } catch {
        C.error("sending over postmessage fail");
      }
    }), Promise.resolve(null)) : new Promise((E, T) => {
      this.buffer.push({ event: e, resolve: E, reject: T });
    });
  }
  flush() {
    let { buffer: e } = this;
    this.buffer = [], e.forEach((t) => {
      this.send(t.event).then(t.resolve).catch(t.reject);
    });
  }
  getFrames(e) {
    if (this.config.page === "manager") {
      let o = Array.from(
        uo.querySelectorAll("iframe[data-is-storybook][data-is-loaded]")
      ).flatMap((n) => {
        try {
          return n.contentWindow && n.dataset.isStorybook !== void 0 && n.id === e ? [n.contentWindow] : [];
        } catch {
          return [];
        }
      });
      return o?.length ? o : this.getCurrentFrames();
    }
    return R && R.parent && R.parent !== R.self ? [R.parent] : [];
  }
  getCurrentFrames() {
    return this.config.page === "manager" ? Array.from(
      uo.querySelectorAll('[data-is-storybook="true"]')
    ).flatMap((t) => t.contentWindow ? [t.contentWindow] : []) : R && R.parent ? [R.parent] : [];
  }
  getLocalFrame() {
    return this.config.page === "manager" ? Array.from(
      uo.querySelectorAll("#storybook-preview-iframe")
    ).flatMap((t) => t.contentWindow ? [t.contentWindow] : []) : R && R.parent ? [R.parent] : [];
  }
  handleEvent(e) {
    try {
      let { data: t } = e, { key: o, event: n, refId: a } = typeof t == "string" && ur(t) ? rt(t, R.CHANNEL_OPTIONS || {}) : t;
      if (o === ys) {
        let l = this.config.page === "manager" ? '<span style="color: #37D5D3; background: black"> manager </span>' : '<span style="color: #\
1EA7FD; background: black"> preview </span>', c = Object.values(fe).includes(n.type) ? `<span style="color: #FF4785">${n.type}</span>` : `<s\
pan style="color: #FFAE00">${n.type}</span>`;
        if (a && (n.refId = a), n.source = this.config.page === "preview" ? e.origin : fs(e), !n.source) {
          Y.error(
            `${l} received ${c} but was unable to determine the source of the event`
          );
          return;
        }
        let i = `${l} received ${c} (${t.length})`;
        Y.debug(
          fo.origin !== n.source ? i : `${i} <span style="color: gray">(on ${fo.origin} from ${n.source})</span>`,
          ...n.args
        ), ie(this.handler, "ChannelHandler should be set"), this.handler(n);
      }
    } catch (t) {
      C.error(t);
    }
  }
};
s(yo, "PostMessageTransport");
var We = yo;

// src/channels/websocket/index.ts
var { WebSocket: yd } = R, mo = class mo {
  constructor({ url: e, onError: t, page: o }) {
    this.buffer = [];
    this.isReady = !1;
    this.socket = new yd(e), this.socket.onopen = () => {
      this.isReady = !0, this.flush();
    }, this.socket.onmessage = ({ data: n }) => {
      let a = typeof n == "string" && ur(n) ? rt(n) : n;
      ie(this.handler, "WebsocketTransport handler should be set"), this.handler(a);
    }, this.socket.onerror = (n) => {
      t && t(n);
    }, this.socket.onclose = () => {
      ie(this.handler, "WebsocketTransport handler should be set"), this.handler({ type: Dt, args: [], from: o || "preview" });
    };
  }
  setHandler(e) {
    this.handler = e;
  }
  send(e) {
    this.isReady ? this.sendNow(e) : this.sendLater(e);
  }
  sendLater(e) {
    this.buffer.push(e);
  }
  sendNow(e) {
    let t = et(e, {
      maxDepth: 15,
      allowFunction: !1,
      ...R.CHANNEL_OPTIONS
    });
    this.socket.send(t);
  }
  flush() {
    let { buffer: e } = this;
    this.buffer = [], e.forEach((t) => this.send(t));
  }
};
s(mo, "WebsocketTransport");
var $e = mo;

// src/channels/index.ts
var { CONFIG_TYPE: md } = R, hd = ye;
function gd({ page: r, extraTransports: e = [] }) {
  let t = [new We({ page: r }), ...e];
  if (md === "DEVELOPMENT") {
    let o = window.location.protocol === "http:" ? "ws" : "wss", { hostname: n, port: a } = window.location, l = `${o}://${n}:${a}/storybook\
-server-channel`;
    t.push(new $e({ url: l, onError: /* @__PURE__ */ s(() => {
    }, "onError"), page: r }));
  }
  return new ye({ transports: t });
}
s(gd, "createBrowserChannel");

// src/types/index.ts
var yr = {};
Re(yr, {
  Addon_TypesEnum: () => ms
});

// src/types/modules/addons.ts
var ms = /* @__PURE__ */ ((p) => (p.TAB = "tab", p.PANEL = "panel", p.TOOL = "tool", p.TOOLEXTRA = "toolextra", p.PREVIEW = "preview", p.experimental_PAGE =
"page", p.experimental_SIDEBAR_BOTTOM = "sidebar-bottom", p.experimental_SIDEBAR_TOP = "sidebar-top", p.experimental_TEST_PROVIDER = "test-p\
rovider", p))(ms || {});

// src/preview-api/index.ts
var qr = {};
Re(qr, {
  DocsContext: () => ce,
  HooksContext: () => he,
  Preview: () => Fe,
  PreviewWeb: () => jr,
  PreviewWithSelection: () => De,
  StoryStore: () => Oe,
  UrlStore: () => Le,
  WebView: () => Me,
  addons: () => Z,
  applyHooks: () => ot,
  combineArgs: () => Xe,
  combineParameters: () => W,
  composeConfigs: () => Ce,
  composeStepRunners: () => ht,
  composeStories: () => xa,
  composeStory: () => dn,
  createPlaywrightTest: () => Aa,
  decorateStory: () => an,
  defaultDecorateStory: () => ft,
  filterArgTypes: () => Pr,
  inferControls: () => er,
  makeDecorator: () => Ps,
  mockChannel: () => tt,
  normalizeStory: () => Qe,
  prepareMeta: () => yt,
  prepareStory: () => Ze,
  sanitizeStoryContextUpdate: () => ln,
  setDefaultProjectAnnotations: () => Ea,
  setProjectAnnotations: () => Ra,
  simulateDOMContentLoaded: () => Mr,
  simulatePageLoad: () => Bn,
  sortStoriesV7: () => Ia,
  useArgs: () => ws,
  useCallback: () => Ye,
  useChannel: () => As,
  useEffect: () => Ro,
  useGlobals: () => vs,
  useMemo: () => Ss,
  useParameter: () => _s,
  useReducer: () => xs,
  useRef: () => Ts,
  useState: () => Rs,
  useStoryContext: () => mr,
  userOrAutoTitle: () => Pa,
  userOrAutoTitleFromSpecifier: () => yn
});

// src/preview-api/modules/addons/storybook-channel-mock.ts
function tt() {
  let r = {
    setHandler: /* @__PURE__ */ s(() => {
    }, "setHandler"),
    send: /* @__PURE__ */ s(() => {
    }, "send")
  };
  return new ye({ transport: r });
}
s(tt, "mockChannel");

// src/preview-api/modules/addons/main.ts
var So = class So {
  constructor() {
    this.getChannel = /* @__PURE__ */ s(() => {
      if (!this.channel) {
        let e = tt();
        return this.setChannel(e), e;
      }
      return this.channel;
    }, "getChannel");
    this.ready = /* @__PURE__ */ s(() => this.promise, "ready");
    this.hasChannel = /* @__PURE__ */ s(() => !!this.channel, "hasChannel");
    this.setChannel = /* @__PURE__ */ s((e) => {
      this.channel = e, this.resolve();
    }, "setChannel");
    this.promise = new Promise((e) => {
      this.resolve = () => e(this.getChannel());
    });
  }
};
s(So, "AddonStore");
var go = So, ho = "__STORYBOOK_ADDONS_PREVIEW";
function Sd() {
  return R[ho] || (R[ho] = new go()), R[ho];
}
s(Sd, "getAddonsStore");
var Z = Sd();

// src/preview-api/modules/addons/hooks.ts
var xo = class xo {
  constructor() {
    this.hookListsMap = void 0;
    this.mountedDecorators = void 0;
    this.prevMountedDecorators = void 0;
    this.currentHooks = void 0;
    this.nextHookIndex = void 0;
    this.currentPhase = void 0;
    this.currentEffects = void 0;
    this.prevEffects = void 0;
    this.currentDecoratorName = void 0;
    this.hasUpdates = void 0;
    this.currentContext = void 0;
    this.renderListener = /* @__PURE__ */ s((e) => {
      e === this.currentContext?.id && (this.triggerEffects(), this.currentContext = null, this.removeRenderListeners());
    }, "renderListener");
    this.init();
  }
  init() {
    this.hookListsMap = /* @__PURE__ */ new WeakMap(), this.mountedDecorators = /* @__PURE__ */ new Set(), this.prevMountedDecorators = /* @__PURE__ */ new Set(),
    this.currentHooks = [], this.nextHookIndex = 0, this.currentPhase = "NONE", this.currentEffects = [], this.prevEffects = [], this.currentDecoratorName =
    null, this.hasUpdates = !1, this.currentContext = null;
  }
  clean() {
    this.prevEffects.forEach((e) => {
      e.destroy && e.destroy();
    }), this.init(), this.removeRenderListeners();
  }
  getNextHook() {
    let e = this.currentHooks[this.nextHookIndex];
    return this.nextHookIndex += 1, e;
  }
  triggerEffects() {
    this.prevEffects.forEach((e) => {
      !this.currentEffects.includes(e) && e.destroy && e.destroy();
    }), this.currentEffects.forEach((e) => {
      this.prevEffects.includes(e) || (e.destroy = e.create());
    }), this.prevEffects = this.currentEffects, this.currentEffects = [];
  }
  addRenderListeners() {
    this.removeRenderListeners(), Z.getChannel().on(Ue, this.renderListener);
  }
  removeRenderListeners() {
    Z.getChannel().removeListener(Ue, this.renderListener);
  }
};
s(xo, "HooksContext");
var he = xo;
function hs(r) {
  let e = /* @__PURE__ */ s((...t) => {
    let { hooks: o } = typeof t[0] == "function" ? t[1] : t[0], n = o.currentPhase, a = o.currentHooks, l = o.nextHookIndex, c = o.currentDecoratorName;
    o.currentDecoratorName = r.name, o.prevMountedDecorators.has(r) ? (o.currentPhase = "UPDATE", o.currentHooks = o.hookListsMap.get(r) || []) :
    (o.currentPhase = "MOUNT", o.currentHooks = [], o.hookListsMap.set(r, o.currentHooks), o.prevMountedDecorators.add(r)), o.nextHookIndex =
    0;
    let i = R.STORYBOOK_HOOKS_CONTEXT;
    R.STORYBOOK_HOOKS_CONTEXT = o;
    let p = r(...t);
    if (R.STORYBOOK_HOOKS_CONTEXT = i, o.currentPhase === "UPDATE" && o.getNextHook() != null)
      throw new Error(
        "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
      );
    return o.currentPhase = n, o.currentHooks = a, o.nextHookIndex = l, o.currentDecoratorName = c, p;
  }, "hookified");
  return e.originalFn = r, e;
}
s(hs, "hookify");
var bo = 0, bd = 25, ot = /* @__PURE__ */ s((r) => (e, t) => {
  let o = r(
    hs(e),
    t.map((n) => hs(n))
  );
  return (n) => {
    let { hooks: a } = n;
    a.prevMountedDecorators ??= /* @__PURE__ */ new Set(), a.mountedDecorators = /* @__PURE__ */ new Set([e, ...t]), a.currentContext = n, a.
    hasUpdates = !1;
    let l = o(n);
    for (bo = 1; a.hasUpdates; )
      if (a.hasUpdates = !1, a.currentEffects = [], l = o(n), bo += 1, bo > bd)
        throw new Error(
          "Too many re-renders. Storybook limits the number of renders to prevent an infinite loop."
        );
    return a.addRenderListeners(), l;
  };
}, "applyHooks"), Td = /* @__PURE__ */ s((r, e) => r.length === e.length && r.every((t, o) => t === e[o]), "areDepsEqual"), To = /* @__PURE__ */ s(
() => new Error("Storybook preview hooks can only be called inside decorators and story functions."), "invalidHooksError");
function gs() {
  return R.STORYBOOK_HOOKS_CONTEXT || null;
}
s(gs, "getHooksContextOrNull");
function Eo() {
  let r = gs();
  if (r == null)
    throw To();
  return r;
}
s(Eo, "getHooksContextOrThrow");
function Ed(r, e, t) {
  let o = Eo();
  if (o.currentPhase === "MOUNT") {
    t != null && !Array.isArray(t) && C.warn(
      `${r} received a final argument that is not an array (instead, received ${t}). When specified, the final argument must be an array.`
    );
    let n = { name: r, deps: t };
    return o.currentHooks.push(n), e(n), n;
  }
  if (o.currentPhase === "UPDATE") {
    let n = o.getNextHook();
    if (n == null)
      throw new Error("Rendered more hooks than during the previous render.");
    return n.name !== r && C.warn(
      `Storybook has detected a change in the order of Hooks${o.currentDecoratorName ? ` called by ${o.currentDecoratorName}` : ""}. This wi\
ll lead to bugs and errors if not fixed.`
    ), t != null && n.deps == null && C.warn(
      `${r} received a final argument during this render, but not during the previous render. Even though the final argument is optional, it\
s type cannot change between renders.`
    ), t != null && n.deps != null && t.length !== n.deps.length && C.warn(`The final argument passed to ${r} changed size between renders. \
The order and size of this array must remain constant.
Previous: ${n.deps}
Incoming: ${t}`), (t == null || n.deps == null || !Td(t, n.deps)) && (e(n), n.deps = t), n;
  }
  throw To();
}
s(Ed, "useHook");
function nt(r, e, t) {
  let { memoizedState: o } = Ed(
    r,
    (n) => {
      n.memoizedState = e();
    },
    t
  );
  return o;
}
s(nt, "useMemoLike");
function Ss(r, e) {
  return nt("useMemo", r, e);
}
s(Ss, "useMemo");
function Ye(r, e) {
  return nt("useCallback", () => r, e);
}
s(Ye, "useCallback");
function bs(r, e) {
  return nt(r, () => ({ current: e }), []);
}
s(bs, "useRefLike");
function Ts(r) {
  return bs("useRef", r);
}
s(Ts, "useRef");
function Rd() {
  let r = gs();
  if (r != null && r.currentPhase !== "NONE")
    r.hasUpdates = !0;
  else
    try {
      Z.getChannel().emit(sr);
    } catch {
      C.warn("State updates of Storybook preview hooks work only in browser");
    }
}
s(Rd, "triggerUpdate");
function Es(r, e) {
  let t = bs(
    r,
    // @ts-expect-error S type should never be function, but there's no way to tell that to TypeScript
    typeof e == "function" ? e() : e
  ), o = /* @__PURE__ */ s((n) => {
    t.current = typeof n == "function" ? n(t.current) : n, Rd();
  }, "setState");
  return [t.current, o];
}
s(Es, "useStateLike");
function Rs(r) {
  return Es("useState", r);
}
s(Rs, "useState");
function xs(r, e, t) {
  let o = t != null ? () => t(e) : e, [n, a] = Es("useReducer", o);
  return [n, /* @__PURE__ */ s((c) => a((i) => r(i, c)), "dispatch")];
}
s(xs, "useReducer");
function Ro(r, e) {
  let t = Eo(), o = nt("useEffect", () => ({ create: r }), e);
  t.currentEffects.includes(o) || t.currentEffects.push(o);
}
s(Ro, "useEffect");
function As(r, e = []) {
  let t = Z.getChannel();
  return Ro(() => (Object.entries(r).forEach(([o, n]) => t.on(o, n)), () => {
    Object.entries(r).forEach(
      ([o, n]) => t.removeListener(o, n)
    );
  }), [...Object.keys(r), ...e]), Ye(t.emit.bind(t), [t]);
}
s(As, "useChannel");
function mr() {
  let { currentContext: r } = Eo();
  if (r == null)
    throw To();
  return r;
}
s(mr, "useStoryContext");
function _s(r, e) {
  let { parameters: t } = mr();
  if (r)
    return t[r] ?? e;
}
s(_s, "useParameter");
function ws() {
  let r = Z.getChannel(), { id: e, args: t } = mr(), o = Ye(
    (a) => r.emit(lr, { storyId: e, updatedArgs: a }),
    [r, e]
  ), n = Ye(
    (a) => r.emit(ar, { storyId: e, argNames: a }),
    [r, e]
  );
  return [t, o, n];
}
s(ws, "useArgs");
function vs() {
  let r = Z.getChannel(), { globals: e } = mr(), t = Ye(
    (o) => r.emit(ir, { globals: o }),
    [r]
  );
  return [e, t];
}
s(vs, "useGlobals");

// src/preview-api/modules/addons/make-decorator.ts
var Ps = /* @__PURE__ */ s(({
  name: r,
  parameterName: e,
  wrapper: t,
  skipIfNoParametersOrOptions: o = !1
}) => {
  let n = /* @__PURE__ */ s((a) => (l, c) => {
    let i = c.parameters && c.parameters[e];
    return i && i.disable || o && !a && !i ? l(c) : t(l, c, {
      options: a,
      parameters: i
    });
  }, "decorator");
  return (...a) => typeof a[0] == "function" ? n()(...a) : (...l) => {
    if (l.length > 1)
      return a.length > 1 ? n(a)(...l) : n(...a)(...l);
    throw new Error(
      `Passing stories directly into ${r}() is not allowed,
        instead use addDecorator(${r}) and pass options with the '${e}' parameter`
    );
  };
}, "makeDecorator");

// src/preview-errors.ts
var vr = {};
Re(vr, {
  CalledExtractOnStoreError: () => gr,
  CalledPreviewMethodBeforeInitializationError: () => G,
  Category: () => Os,
  EmptyIndexError: () => Er,
  ImplicitActionsDuringRendering: () => Ao,
  MdxFileWithNoCsfReferencesError: () => Tr,
  MissingRenderToCanvasError: () => Sr,
  MissingStoryAfterHmrError: () => hr,
  MissingStoryFromCsfFileError: () => xr,
  MountMustBeDestructuredError: () => _e,
  NextJsSharpError: () => _o,
  NextjsRouterMocksNotAvailable: () => wo,
  NoRenderFunctionError: () => _r,
  NoStoryMatchError: () => Rr,
  NoStoryMountedError: () => wr,
  StoryIndexFetchError: () => br,
  StoryStoreAccessedBeforeInitializationError: () => Ar,
  UnknownArgTypesError: () => vo,
  UnsupportedViewportDimensionError: () => Po
});

// ../node_modules/ts-dedent/esm/index.js
function w(r) {
  for (var e = [], t = 1; t < arguments.length; t++)
    e[t - 1] = arguments[t];
  var o = Array.from(typeof r == "string" ? [r] : r);
  o[o.length - 1] = o[o.length - 1].replace(/\r?\n([\t ]*)$/, "");
  var n = o.reduce(function(c, i) {
    var p = i.match(/\n([\t ]+|(?!\s).)/g);
    return p ? c.concat(p.map(function(u) {
      var d, y;
      return (y = (d = u.match(/[\t ]/g)) === null || d === void 0 ? void 0 : d.length) !== null && y !== void 0 ? y : 0;
    })) : c;
  }, []);
  if (n.length) {
    var a = new RegExp(`
[	 ]{` + Math.min.apply(Math, n) + "}", "g");
    o = o.map(function(c) {
      return c.replace(a, `
`);
    });
  }
  o[0] = o[0].replace(/^\r?\n/, "");
  var l = o[0];
  return e.forEach(function(c, i) {
    var p = l.match(/(?:^|\n)( *)$/), u = p ? p[1] : "", d = c;
    typeof c == "string" && c.includes(`
`) && (d = String(c).split(`
`).map(function(y, g) {
      return g === 0 ? y : "" + u + y;
    }).join(`
`)), l += d + o[i + 1];
  }), l;
}
s(w, "dedent");

// src/storybook-error.ts
function Cs({
  code: r,
  category: e
}) {
  let t = String(r).padStart(4, "0");
  return `SB_${e}_${t}`;
}
s(Cs, "parseErrorCode");
var st = class st extends Error {
  constructor(t) {
    super(st.getFullMessage(t));
    /**
     * Data associated with the error. Used to provide additional information in the error message or
     * to be passed to telemetry.
     */
    this.data = {};
    /** Flag used to easily determine if the error originates from Storybook. */
    this.fromStorybook = !0;
    this.category = t.category, this.documentation = t.documentation ?? !1, this.code = t.code;
  }
  get fullErrorCode() {
    return Cs({ code: this.code, category: this.category });
  }
  /** Overrides the default `Error.name` property in the format: SB_<CATEGORY>_<CODE>. */
  get name() {
    let t = this.constructor.name;
    return `${this.fullErrorCode} (${t})`;
  }
  /** Generates the error message along with additional documentation link (if applicable). */
  static getFullMessage({
    documentation: t,
    code: o,
    category: n,
    message: a
  }) {
    let l;
    return t === !0 ? l = `https://storybook.js.org/error/${Cs({ code: o, category: n })}` : typeof t == "string" ? l = t : Array.isArray(t) &&
    (l = `
${t.map((c) => `	- ${c}`).join(`
`)}`), `${a}${l != null ? `

More info: ${l}
` : ""}`;
  }
};
s(st, "StorybookError");
var q = st;

// src/preview-errors.ts
var Os = /* @__PURE__ */ ((T) => (T.BLOCKS = "BLOCKS", T.DOCS_TOOLS = "DOCS-TOOLS", T.PREVIEW_CLIENT_LOGGER = "PREVIEW_CLIENT-LOGGER", T.PREVIEW_CHANNELS =
"PREVIEW_CHANNELS", T.PREVIEW_CORE_EVENTS = "PREVIEW_CORE-EVENTS", T.PREVIEW_INSTRUMENTER = "PREVIEW_INSTRUMENTER", T.PREVIEW_API = "PREVIEW\
_API", T.PREVIEW_REACT_DOM_SHIM = "PREVIEW_REACT-DOM-SHIM", T.PREVIEW_ROUTER = "PREVIEW_ROUTER", T.PREVIEW_THEMING = "PREVIEW_THEMING", T.RENDERER_HTML =
"RENDERER_HTML", T.RENDERER_PREACT = "RENDERER_PREACT", T.RENDERER_REACT = "RENDERER_REACT", T.RENDERER_SERVER = "RENDERER_SERVER", T.RENDERER_SVELTE =
"RENDERER_SVELTE", T.RENDERER_VUE = "RENDERER_VUE", T.RENDERER_VUE3 = "RENDERER_VUE3", T.RENDERER_WEB_COMPONENTS = "RENDERER_WEB-COMPONENTS",
T.FRAMEWORK_NEXTJS = "FRAMEWORK_NEXTJS", T.ADDON_VITEST = "ADDON_VITEST", T))(Os || {}), Co = class Co extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 1,
      message: w`
        Couldn't find story matching id '${t.storyId}' after HMR.
        - Did you just rename a story?
        - Did you remove it from your CSF file?
        - Are you sure a story with the id '${t.storyId}' exists?
        - Please check the values in the stories field of your main.js config and see if they would match your CSF File.
        - Also check the browser console and terminal for potential error messages.`
    });
    this.data = t;
  }
};
s(Co, "MissingStoryAfterHmrError");
var hr = Co, Oo = class Oo extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 2,
      documentation: "https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#using-implicit-actions-during-rendering-is-deprecated-\
for-example-in-the-play-function",
      message: w`
        We detected that you use an implicit action arg while ${t.phase} of your story.  
        ${t.deprecated ? `
This is deprecated and won't work in Storybook 8 anymore.
` : ""}
        Please provide an explicit spy to your args like this:
          import { fn } from '@storybook/test';
          ... 
          args: {
           ${t.name}: fn()
          }`
    });
    this.data = t;
  }
};
s(Oo, "ImplicitActionsDuringRendering");
var Ao = Oo, Io = class Io extends q {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 3,
      message: w`
        Cannot call \`storyStore.extract()\` without calling \`storyStore.cacheAllCsfFiles()\` first.

        You probably meant to call \`await preview.extract()\` which does the above for you.`
    });
  }
};
s(Io, "CalledExtractOnStoreError");
var gr = Io, Fo = class Fo extends q {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 4,
      message: w`
        Expected your framework's preset to export a \`renderToCanvas\` field.

        Perhaps it needs to be upgraded for Storybook 7.0?`,
      documentation: "https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#mainjs-framework-field"
    });
  }
};
s(Fo, "MissingRenderToCanvasError");
var Sr = Fo, Do = class Do extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 5,
      message: w`
        Called \`Preview.${t.methodName}()\` before initialization.
        
        The preview needs to load the story index before most methods can be called. If you want
        to call \`${t.methodName}\`, try \`await preview.initializationPromise;\` first.
        
        If you didn't call the above code, then likely it was called by an addon that needs to
        do the above.`
    });
    this.data = t;
  }
};
s(Do, "CalledPreviewMethodBeforeInitializationError");
var G = Do, ko = class ko extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 6,
      message: w`
        Error fetching \`/index.json\`:
        
        ${t.text}

        If you are in development, this likely indicates a problem with your Storybook process,
        check the terminal for errors.

        If you are in a deployed Storybook, there may have been an issue deploying the full Storybook
        build.`
    });
    this.data = t;
  }
};
s(ko, "StoryIndexFetchError");
var br = ko, No = class No extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 7,
      message: w`
        Tried to render docs entry ${t.storyId} but it is a MDX file that has no CSF
        references, or autodocs for a CSF file that some doesn't refer to itself.
        
        This likely is an internal error in Storybook's indexing, or you've attached the
        \`attached-mdx\` tag to an MDX file that is not attached.`
    });
    this.data = t;
  }
};
s(No, "MdxFileWithNoCsfReferencesError");
var Tr = No, Lo = class Lo extends q {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 8,
      message: w`
        Couldn't find any stories in your Storybook.

        - Please check your stories field of your main.js config: does it match correctly?
        - Also check the browser console and terminal for error messages.`
    });
  }
};
s(Lo, "EmptyIndexError");
var Er = Lo, jo = class jo extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 9,
      message: w`
        Couldn't find story matching '${t.storySpecifier}'.

        - Are you sure a story with that id exists?
        - Please check your stories field of your main.js config.
        - Also check the browser console and terminal for error messages.`
    });
    this.data = t;
  }
};
s(jo, "NoStoryMatchError");
var Rr = jo, Mo = class Mo extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 10,
      message: w`
        Couldn't find story matching id '${t.storyId}' after importing a CSF file.

        The file was indexed as if the story was there, but then after importing the file in the browser
        we didn't find the story. Possible reasons:
        - You are using a custom story indexer that is misbehaving.
        - You have a custom file loader that is removing or renaming exports.

        Please check your browser console and terminal for errors that may explain the issue.`
    });
    this.data = t;
  }
};
s(Mo, "MissingStoryFromCsfFileError");
var xr = Mo, qo = class qo extends q {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 11,
      message: w`
        Cannot access the Story Store until the index is ready.

        It is not recommended to use methods directly on the Story Store anyway, in Storybook 9 we will
        remove access to the store entirely`
    });
  }
};
s(qo, "StoryStoreAccessedBeforeInitializationError");
var Ar = qo, Uo = class Uo extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 12,
      message: w`
      Incorrect use of mount in the play function.
      
      To use mount in the play function, you must satisfy the following two requirements: 
      
      1. You *must* destructure the mount property from the \`context\` (the argument passed to your play function). 
         This makes sure that Storybook does not start rendering the story before the play function begins.
      
      2. Your Storybook framework or builder must be configured to transpile to ES2017 or newer. 
         This is because destructuring statements and async/await usages are otherwise transpiled away, 
         which prevents Storybook from recognizing your usage of \`mount\`.
      
      Note that Angular is not supported. As async/await is transpiled to support the zone.js polyfill. 
      
      More info: https://storybook.js.org/docs/writing-tests/interaction-testing#run-code-before-the-component-gets-rendered
      
      Received the following play function:
      ${t.playFunction}`
    });
    this.data = t;
  }
};
s(Uo, "MountMustBeDestructuredError");
var _e = Uo, Bo = class Bo extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 14,
      message: w`
        No render function available for storyId '${t.id}'
      `
    });
    this.data = t;
  }
};
s(Bo, "NoRenderFunctionError");
var _r = Bo, Go = class Go extends q {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 15,
      message: w`
        No component is mounted in your story.
        
        This usually occurs when you destructure mount in the play function, but forget to call it.
        
        For example:

        async play({ mount, canvasElement }) {
          // 👈 mount should be called: await mount(); 
          const canvas = within(canvasElement);
          const button = await canvas.findByRole('button');
          await userEvent.click(button);
        };

        Make sure to either remove it or call mount in your play function.
      `
    });
  }
};
s(Go, "NoStoryMountedError");
var wr = Go, Vo = class Vo extends q {
  constructor() {
    super({
      category: "FRAMEWORK_NEXTJS",
      code: 1,
      documentation: "https://storybook.js.org/docs/get-started/nextjs#faq",
      message: w`
      You are importing avif images, but you don't have sharp installed.

      You have to install sharp in order to use image optimization features in Next.js.
      `
    });
  }
};
s(Vo, "NextJsSharpError");
var _o = Vo, Ho = class Ho extends q {
  constructor(t) {
    super({
      category: "FRAMEWORK_NEXTJS",
      code: 2,
      message: w`
        Tried to access router mocks from "${t.importType}" but they were not created yet. You might be running code in an unsupported environment.
      `
    });
    this.data = t;
  }
};
s(Ho, "NextjsRouterMocksNotAvailable");
var wo = Ho, zo = class zo extends q {
  constructor(t) {
    super({
      category: "DOCS-TOOLS",
      code: 1,
      documentation: "https://github.com/storybookjs/storybook/issues/26606",
      message: w`
        There was a failure when generating detailed ArgTypes in ${t.language} for:
        ${JSON.stringify(t.type, null, 2)} 
        
        Storybook will fall back to use a generic type description instead.

        This type is either not supported or it is a bug in the docgen generation in Storybook.
        If you think this is a bug, please detail it as much as possible in the Github issue.
      `
    });
    this.data = t;
  }
};
s(zo, "UnknownArgTypesError");
var vo = zo, Wo = class Wo extends q {
  constructor(t) {
    super({
      category: "ADDON_VITEST",
      code: 1,
      // TODO: Add documentation about viewports support
      // documentation: '',
      message: w`
        Encountered an unsupported value "${t.value}" when setting the viewport ${t.dimension} dimension.
        
        The Storybook plugin only supports values in the following units:
        - px, vh, vw, em, rem and %.
        
        You can either change the viewport for this story to use one of the supported units or skip the test by adding '!test' to the story's tags per https://storybook.js.org/docs/writing-stories/tags
      `
    });
    this.data = t;
  }
};
s(Wo, "UnsupportedViewportDimensionError");
var Po = Wo;

// ../node_modules/es-toolkit/dist/object/omitBy.mjs
function $o(r, e) {
  let t = {}, o = Object.entries(r);
  for (let n = 0; n < o.length; n++) {
    let [a, l] = o[n];
    e(l, a) || (t[a] = l);
  }
  return t;
}
s($o, "omitBy");

// ../node_modules/es-toolkit/dist/object/pick.mjs
function Yo(r, e) {
  let t = {};
  for (let o = 0; o < e.length; o++) {
    let n = e[o];
    Object.prototype.hasOwnProperty.call(r, n) && (t[n] = r[n]);
  }
  return t;
}
s(Yo, "pick");

// ../node_modules/es-toolkit/dist/object/pickBy.mjs
function Ko(r, e) {
  let t = {}, o = Object.entries(r);
  for (let n = 0; n < o.length; n++) {
    let [a, l] = o[n];
    e(l, a) && (t[a] = l);
  }
  return t;
}
s(Ko, "pickBy");

// ../node_modules/es-toolkit/dist/predicate/isPlainObject.mjs
function z(r) {
  if (typeof r != "object" || r == null)
    return !1;
  if (Object.getPrototypeOf(r) === null)
    return !0;
  if (r.toString() !== "[object Object]")
    return !1;
  let e = r;
  for (; Object.getPrototypeOf(e) !== null; )
    e = Object.getPrototypeOf(e);
  return Object.getPrototypeOf(r) === e;
}
s(z, "isPlainObject");

// ../node_modules/es-toolkit/dist/object/mapValues.mjs
function ee(r, e) {
  let t = {}, o = Object.keys(r);
  for (let n = 0; n < o.length; n++) {
    let a = o[n], l = r[a];
    t[a] = e(l, a, r);
  }
  return t;
}
s(ee, "mapValues");

// ../node_modules/es-toolkit/dist/compat/_internal/tags.mjs
var Is = "[object RegExp]", Fs = "[object String]", Ds = "[object Number]", ks = "[object Boolean]", Xo = "[object Arguments]", Ns = "[objec\
t Symbol]", Ls = "[object Date]", js = "[object Map]", Ms = "[object Set]", qs = "[object Array]", Us = "[object Function]", Bs = "[object A\
rrayBuffer]", at = "[object Object]", Gs = "[object Error]", Vs = "[object DataView]", Hs = "[object Uint8Array]", zs = "[object Uint8Clampe\
dArray]", Ws = "[object Uint16Array]", $s = "[object Uint32Array]", Ys = "[object BigUint64Array]", Ks = "[object Int8Array]", Xs = "[object\
 Int16Array]", Js = "[object Int32Array]", Qs = "[object BigInt64Array]", Zs = "[object Float32Array]", ea = "[object Float64Array]";

// ../node_modules/es-toolkit/dist/compat/_internal/getSymbols.mjs
function Jo(r) {
  return Object.getOwnPropertySymbols(r).filter((e) => Object.prototype.propertyIsEnumerable.call(r, e));
}
s(Jo, "getSymbols");

// ../node_modules/es-toolkit/dist/compat/_internal/getTag.mjs
function Qo(r) {
  return r == null ? r === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(r);
}
s(Qo, "getTag");

// ../node_modules/es-toolkit/dist/predicate/isEqual.mjs
function Zo(r, e) {
  if (typeof r == typeof e)
    switch (typeof r) {
      case "bigint":
      case "string":
      case "boolean":
      case "symbol":
      case "undefined":
        return r === e;
      case "number":
        return r === e || Object.is(r, e);
      case "function":
        return r === e;
      case "object":
        return le(r, e);
    }
  return le(r, e);
}
s(Zo, "isEqual");
function le(r, e, t) {
  if (Object.is(r, e))
    return !0;
  let o = Qo(r), n = Qo(e);
  if (o === Xo && (o = at), n === Xo && (n = at), o !== n)
    return !1;
  switch (o) {
    case Fs:
      return r.toString() === e.toString();
    case Ds: {
      let c = r.valueOf(), i = e.valueOf();
      return c === i || Number.isNaN(c) && Number.isNaN(i);
    }
    case ks:
    case Ls:
    case Ns:
      return Object.is(r.valueOf(), e.valueOf());
    case Is:
      return r.source === e.source && r.flags === e.flags;
    case Us:
      return r === e;
  }
  t = t ?? /* @__PURE__ */ new Map();
  let a = t.get(r), l = t.get(e);
  if (a != null && l != null)
    return a === e;
  t.set(r, e), t.set(e, r);
  try {
    switch (o) {
      case js: {
        if (r.size !== e.size)
          return !1;
        for (let [c, i] of r.entries())
          if (!e.has(c) || !le(i, e.get(c), t))
            return !1;
        return !0;
      }
      case Ms: {
        if (r.size !== e.size)
          return !1;
        let c = Array.from(r.values()), i = Array.from(e.values());
        for (let p = 0; p < c.length; p++) {
          let u = c[p], d = i.findIndex((y) => le(u, y, t));
          if (d === -1)
            return !1;
          i.splice(d, 1);
        }
        return !0;
      }
      case qs:
      case Hs:
      case zs:
      case Ws:
      case $s:
      case Ys:
      case Ks:
      case Xs:
      case Js:
      case Qs:
      case Zs:
      case ea: {
        if (typeof Buffer < "u" && Buffer.isBuffer(r) !== Buffer.isBuffer(e) || r.length !== e.length)
          return !1;
        for (let c = 0; c < r.length; c++)
          if (!le(r[c], e[c], t))
            return !1;
        return !0;
      }
      case Bs:
        return r.byteLength !== e.byteLength ? !1 : le(new Uint8Array(r), new Uint8Array(e), t);
      case Vs:
        return r.byteLength !== e.byteLength || r.byteOffset !== e.byteOffset ? !1 : le(r.buffer, e.buffer, t);
      case Gs:
        return r.name === e.name && r.message === e.message;
      case at: {
        if (!(le(r.constructor, e.constructor, t) || z(r) && z(e)))
          return !1;
        let i = [...Object.keys(r), ...Jo(r)], p = [...Object.keys(e), ...Jo(e)];
        if (i.length !== p.length)
          return !1;
        for (let u = 0; u < i.length; u++) {
          let d = i[u], y = r[d];
          if (!Object.prototype.hasOwnProperty.call(e, d))
            return !1;
          let g = e[d];
          if (!le(y, g, t))
            return !1;
        }
        return !0;
      }
      default:
        return !1;
    }
  } finally {
    t.delete(r), t.delete(e);
  }
}
s(le, "areObjectsEqual");

// src/preview-api/modules/store/StoryStore.ts
var gt = ue(Xr(), 1);

// src/preview-api/modules/store/args.ts
var Ke = Symbol("incompatible"), en = /* @__PURE__ */ s((r, e) => {
  let t = e.type;
  if (r == null || !t || e.mapping)
    return r;
  switch (t.name) {
    case "string":
      return String(r);
    case "enum":
      return r;
    case "number":
      return Number(r);
    case "boolean":
      return String(r) === "true";
    case "array":
      return !t.value || !Array.isArray(r) ? Ke : r.reduce((o, n, a) => {
        let l = en(n, { type: t.value });
        return l !== Ke && (o[a] = l), o;
      }, new Array(r.length));
    case "object":
      return typeof r == "string" || typeof r == "number" ? r : !t.value || typeof r != "object" ? Ke : Object.entries(r).reduce((o, [n, a]) => {
        let l = en(a, { type: t.value[n] });
        return l === Ke ? o : Object.assign(o, { [n]: l });
      }, {});
    default:
      return Ke;
  }
}, "map"), ra = /* @__PURE__ */ s((r, e) => Object.entries(r).reduce((t, [o, n]) => {
  if (!e[o])
    return t;
  let a = en(n, e[o]);
  return a === Ke ? t : Object.assign(t, { [o]: a });
}, {}), "mapArgsToTypes"), Xe = /* @__PURE__ */ s((r, e) => Array.isArray(r) && Array.isArray(e) ? e.reduce(
  (t, o, n) => (t[n] = Xe(r[n], e[n]), t),
  [...r]
).filter((t) => t !== void 0) : !z(r) || !z(e) ? e : Object.keys({ ...r, ...e }).reduce((t, o) => {
  if (o in e) {
    let n = Xe(r[o], e[o]);
    n !== void 0 && (t[o] = n);
  } else
    t[o] = r[o];
  return t;
}, {}), "combineArgs"), ta = /* @__PURE__ */ s((r, e) => Object.entries(e).reduce((t, [o, { options: n }]) => {
  function a() {
    return o in r && (t[o] = r[o]), t;
  }
  if (s(a, "allowArg"), !n)
    return a();
  if (!Array.isArray(n))
    return L.error(w`
        Invalid argType: '${o}.options' should be an array.

        More info: https://storybook.js.org/docs/api/arg-types
      `), a();
  if (n.some((d) => d && ["object", "function"].includes(typeof d)))
    return L.error(w`
        Invalid argType: '${o}.options' should only contain primitives. Use a 'mapping' for complex values.

        More info: https://storybook.js.org/docs/writing-stories/args#mapping-to-complex-arg-values
      `), a();
  let l = Array.isArray(r[o]), c = l && r[o].findIndex((d) => !n.includes(d)), i = l && c === -1;
  if (r[o] === void 0 || n.includes(r[o]) || i)
    return a();
  let p = l ? `${o}[${c}]` : o, u = n.map((d) => typeof d == "string" ? `'${d}'` : String(d)).join(", ");
  return L.warn(`Received illegal value for '${p}'. Supported options: ${u}`), t;
}, {}), "validateOptions"), we = Symbol("Deeply equal"), Je = /* @__PURE__ */ s((r, e) => {
  if (typeof r != typeof e)
    return e;
  if (Zo(r, e))
    return we;
  if (Array.isArray(r) && Array.isArray(e)) {
    let t = e.reduce((o, n, a) => {
      let l = Je(r[a], n);
      return l !== we && (o[a] = l), o;
    }, new Array(e.length));
    return e.length >= r.length ? t : t.concat(new Array(r.length - e.length).fill(void 0));
  }
  return z(r) && z(e) ? Object.keys({ ...r, ...e }).reduce((t, o) => {
    let n = Je(r?.[o], e?.[o]);
    return n === we ? t : Object.assign(t, { [o]: n });
  }, {}) : e;
}, "deepDiff"), rn = "UNTARGETED";
function oa({
  args: r,
  argTypes: e
}) {
  let t = {};
  return Object.entries(r).forEach(([o, n]) => {
    let { target: a = rn } = e[o] || {};
    t[a] = t[a] || {}, t[a][o] = n;
  }), t;
}
s(oa, "groupArgsByTarget");

// src/preview-api/modules/store/ArgsStore.ts
function xd(r) {
  return Object.keys(r).forEach((e) => r[e] === void 0 && delete r[e]), r;
}
s(xd, "deleteUndefined");
var tn = class tn {
  constructor() {
    this.initialArgsByStoryId = {};
    this.argsByStoryId = {};
  }
  get(e) {
    if (!(e in this.argsByStoryId))
      throw new Error(`No args known for ${e} -- has it been rendered yet?`);
    return this.argsByStoryId[e];
  }
  setInitial(e) {
    if (!this.initialArgsByStoryId[e.id])
      this.initialArgsByStoryId[e.id] = e.initialArgs, this.argsByStoryId[e.id] = e.initialArgs;
    else if (this.initialArgsByStoryId[e.id] !== e.initialArgs) {
      let t = Je(this.initialArgsByStoryId[e.id], this.argsByStoryId[e.id]);
      this.initialArgsByStoryId[e.id] = e.initialArgs, this.argsByStoryId[e.id] = e.initialArgs, t !== we && this.updateFromDelta(e, t);
    }
  }
  updateFromDelta(e, t) {
    let o = ta(t, e.argTypes);
    this.argsByStoryId[e.id] = Xe(this.argsByStoryId[e.id], o);
  }
  updateFromPersisted(e, t) {
    let o = ra(t, e.argTypes);
    return this.updateFromDelta(e, o);
  }
  update(e, t) {
    if (!(e in this.argsByStoryId))
      throw new Error(`No args known for ${e} -- has it been rendered yet?`);
    this.argsByStoryId[e] = xd({
      ...this.argsByStoryId[e],
      ...t
    });
  }
};
s(tn, "ArgsStore");
var it = tn;

// src/preview-api/modules/store/csf/getValuesFromArgTypes.ts
var lt = /* @__PURE__ */ s((r = {}) => Object.entries(r).reduce((e, [t, { defaultValue: o }]) => (typeof o < "u" && (e[t] = o), e), {}), "ge\
tValuesFromArgTypes");

// src/preview-api/modules/store/GlobalsStore.ts
var on = class on {
  constructor({
    globals: e = {},
    globalTypes: t = {}
  }) {
    this.set({ globals: e, globalTypes: t });
  }
  set({ globals: e = {}, globalTypes: t = {} }) {
    let o = this.initialGlobals && Je(this.initialGlobals, this.globals);
    this.allowedGlobalNames = /* @__PURE__ */ new Set([...Object.keys(e), ...Object.keys(t)]);
    let n = lt(t);
    this.initialGlobals = { ...n, ...e }, this.globals = this.initialGlobals, o && o !== we && this.updateFromPersisted(o);
  }
  filterAllowedGlobals(e) {
    return Object.entries(e).reduce((t, [o, n]) => (this.allowedGlobalNames.has(o) ? t[o] = n : C.warn(
      `Attempted to set a global (${o}) that is not defined in initial globals or globalTypes`
    ), t), {});
  }
  updateFromPersisted(e) {
    let t = this.filterAllowedGlobals(e);
    this.globals = { ...this.globals, ...t };
  }
  get() {
    return this.globals;
  }
  update(e) {
    this.globals = { ...this.globals, ...this.filterAllowedGlobals(e) };
  }
};
s(on, "GlobalsStore");
var ct = on;

// src/preview-api/modules/store/StoryIndexStore.ts
var na = ue(Xr(), 1);
var Ad = (0, na.default)(1)(
  (r) => Object.values(r).reduce(
    (e, t) => (e[t.importPath] = e[t.importPath] || t, e),
    {}
  )
), nn = class nn {
  constructor({ entries: e } = { v: 5, entries: {} }) {
    this.entries = e;
  }
  entryFromSpecifier(e) {
    let t = Object.values(this.entries);
    if (e === "*")
      return t[0];
    if (typeof e == "string")
      return this.entries[e] ? this.entries[e] : t.find((a) => a.id.startsWith(e));
    let { name: o, title: n } = e;
    return t.find((a) => a.name === o && a.title === n);
  }
  storyIdToEntry(e) {
    let t = this.entries[e];
    if (!t)
      throw new hr({ storyId: e });
    return t;
  }
  importPathToEntry(e) {
    return Ad(this.entries)[e];
  }
};
s(nn, "StoryIndexStore");
var pt = nn;

// src/preview-api/modules/store/csf/normalizeInputTypes.ts
var _d = /* @__PURE__ */ s((r) => typeof r == "string" ? { name: r } : r, "normalizeType"), wd = /* @__PURE__ */ s((r) => typeof r == "strin\
g" ? { type: r } : r, "normalizeControl"), vd = /* @__PURE__ */ s((r, e) => {
  let { type: t, control: o, ...n } = r, a = {
    name: e,
    ...n
  };
  return t && (a.type = _d(t)), o ? a.control = wd(o) : o === !1 && (a.control = { disable: !0 }), a;
}, "normalizeInputType"), ve = /* @__PURE__ */ s((r) => ee(r, vd), "normalizeInputTypes");

// ../node_modules/@storybook/csf/dist/index.mjs
var Pd = Object.create, la = Object.defineProperty, Cd = Object.getOwnPropertyDescriptor, Od = Object.getOwnPropertyNames, Id = Object.getPrototypeOf,
Fd = Object.prototype.hasOwnProperty, Dd = /* @__PURE__ */ s((r, e) => () => (e || r((e = { exports: {} }).exports, e), e.exports), "v"), kd = /* @__PURE__ */ s(
(r, e, t, o) => {
  if (e && typeof e == "object" || typeof e == "function") for (let n of Od(e)) !Fd.call(r, n) && n !== t && la(r, n, { get: /* @__PURE__ */ s(
  () => e[n], "get"), enumerable: !(o = Cd(e, n)) || o.enumerable });
  return r;
}, "E"), Nd = /* @__PURE__ */ s((r, e, t) => (t = r != null ? Pd(Id(r)) : {}, kd(e || !r || !r.__esModule ? la(t, "default", { value: r, enumerable: !0 }) :
t, r)), "I"), Ld = Dd((r) => {
  Object.defineProperty(r, "__esModule", { value: !0 }), r.isEqual = /* @__PURE__ */ function() {
    var e = Object.prototype.toString, t = Object.getPrototypeOf, o = Object.getOwnPropertySymbols ? function(n) {
      return Object.keys(n).concat(Object.getOwnPropertySymbols(n));
    } : Object.keys;
    return function(n, a) {
      return (/* @__PURE__ */ s(function l(c, i, p) {
        var u, d, y, g = e.call(c), m = e.call(i);
        if (c === i) return !0;
        if (c == null || i == null) return !1;
        if (p.indexOf(c) > -1 && p.indexOf(i) > -1) return !0;
        if (p.push(c, i), g != m || (u = o(c), d = o(i), u.length != d.length || u.some(function(S) {
          return !l(c[S], i[S], p);
        }))) return !1;
        switch (g.slice(8, -1)) {
          case "Symbol":
            return c.valueOf() == i.valueOf();
          case "Date":
          case "Number":
            return +c == +i || +c != +c && +i != +i;
          case "RegExp":
          case "Function":
          case "String":
          case "Boolean":
            return "" + c == "" + i;
          case "Set":
          case "Map":
            u = c.entries(), d = i.entries();
            do
              if (!l((y = u.next()).value, d.next().value, p)) return !1;
            while (!y.done);
            return !0;
          case "ArrayBuffer":
            c = new Uint8Array(c), i = new Uint8Array(i);
          case "DataView":
            c = new Uint8Array(c.buffer), i = new Uint8Array(i.buffer);
          case "Float32Array":
          case "Float64Array":
          case "Int8Array":
          case "Int16Array":
          case "Int32Array":
          case "Uint8Array":
          case "Uint16Array":
          case "Uint32Array":
          case "Uint8ClampedArray":
          case "Arguments":
          case "Array":
            if (c.length != i.length) return !1;
            for (y = 0; y < c.length; y++) if ((y in c || y in i) && (y in c != y in i || !l(c[y], i[y], p))) return !1;
            return !0;
          case "Object":
            return l(t(c), t(i), p);
          default:
            return !1;
        }
      }, "i"))(n, a, []);
    };
  }();
});
function jd(r) {
  return r.replace(/_/g, " ").replace(/-/g, " ").replace(/\./g, " ").replace(/([^\n])([A-Z])([a-z])/g, (e, t, o, n) => `${t} ${o}${n}`).replace(
  /([a-z])([A-Z])/g, (e, t, o) => `${t} ${o}`).replace(/([a-z])([0-9])/gi, (e, t, o) => `${t} ${o}`).replace(/([0-9])([a-z])/gi, (e, t, o) => `${t}\
 ${o}`).replace(/(\s|^)(\w)/g, (e, t, o) => `${t}${o.toUpperCase()}`).replace(/ +/g, " ").trim();
}
s(jd, "R");
var sa = Nd(Ld()), ca = /* @__PURE__ */ s((r) => r.map((e) => typeof e < "u").filter(Boolean).length, "S"), Md = /* @__PURE__ */ s((r, e) => {
  let { exists: t, eq: o, neq: n, truthy: a } = r;
  if (ca([t, o, n, a]) > 1) throw new Error(`Invalid conditional test ${JSON.stringify({ exists: t, eq: o, neq: n })}`);
  if (typeof o < "u") return (0, sa.isEqual)(e, o);
  if (typeof n < "u") return !(0, sa.isEqual)(e, n);
  if (typeof t < "u") {
    let l = typeof e < "u";
    return t ? l : !l;
  }
  return typeof a > "u" || a ? !!e : !e;
}, "k"), pa = /* @__PURE__ */ s((r, e, t) => {
  if (!r.if) return !0;
  let { arg: o, global: n } = r.if;
  if (ca([o, n]) !== 1) throw new Error(`Invalid conditional value ${JSON.stringify({ arg: o, global: n })}`);
  let a = o ? e[o] : t[n];
  return Md(r.if, a);
}, "P"), sn = /* @__PURE__ */ s((r) => r.toLowerCase().replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "-").replace(
/-+/g, "-").replace(/^-+/, "").replace(/-+$/, ""), "O"), aa = /* @__PURE__ */ s((r, e) => {
  let t = sn(r);
  if (t === "") throw new Error(`Invalid ${e} '${r}', must include alphanumeric characters`);
  return t;
}, "m"), da = /* @__PURE__ */ s((r, e) => `${aa(r, "kind")}${e ? `--${aa(e, "name")}` : ""}`, "G"), ua = /* @__PURE__ */ s((r) => jd(r), "N");
function ia(r, e) {
  return Array.isArray(e) ? e.includes(r) : r.match(e);
}
s(ia, "f");
function dt(r, { includeStories: e, excludeStories: t }) {
  return r !== "__esModule" && (!e || ia(r, e)) && (!t || !ia(r, t));
}
s(dt, "M");
var fa = /* @__PURE__ */ s((...r) => {
  let e = r.reduce((t, o) => (o.startsWith("!") ? t.delete(o.slice(1)) : t.add(o), t), /* @__PURE__ */ new Set());
  return Array.from(e);
}, "z");

// src/preview-api/modules/store/csf/normalizeArrays.ts
var j = /* @__PURE__ */ s((r) => Array.isArray(r) ? r : r ? [r] : [], "normalizeArrays");

// src/preview-api/modules/store/csf/normalizeStory.ts
var qd = w`
CSF .story annotations deprecated; annotate story functions directly:
- StoryFn.story.name => StoryFn.storyName
- StoryFn.story.(parameters|decorators) => StoryFn.(parameters|decorators)
See https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#hoisted-csf-annotations for details and codemod.
`;
function Qe(r, e, t) {
  let o = e, n = typeof e == "function" ? e : null, { story: a } = o;
  a && (C.debug("deprecated story", a), te(qd));
  let l = ua(r), c = typeof o != "function" && o.name || o.storyName || a?.name || l, i = [
    ...j(o.decorators),
    ...j(a?.decorators)
  ], p = { ...a?.parameters, ...o.parameters }, u = { ...a?.args, ...o.args }, d = { ...a?.argTypes, ...o.argTypes }, y = [...j(o.loaders), ...j(
  a?.loaders)], g = [
    ...j(o.beforeEach),
    ...j(a?.beforeEach)
  ], { render: m, play: S, tags: h = [], globals: A = {} } = o, b = p.__id || da(t.id, l);
  return {
    moduleExport: e,
    id: b,
    name: c,
    tags: h,
    decorators: i,
    parameters: p,
    args: u,
    argTypes: ve(d),
    loaders: y,
    beforeEach: g,
    globals: A,
    ...m && { render: m },
    ...n && { userStoryFn: n },
    ...S && { play: S }
  };
}
s(Qe, "normalizeStory");

// src/preview-api/modules/store/csf/normalizeComponentAnnotations.ts
function ut(r, e = r.title, t) {
  let { id: o, argTypes: n } = r;
  return {
    id: sn(o || e),
    ...r,
    title: e,
    ...n && { argTypes: ve(n) },
    parameters: {
      fileName: t,
      ...r.parameters
    }
  };
}
s(ut, "normalizeComponentAnnotations");

// src/preview-api/modules/store/csf/processCSFFile.ts
var Ud = /* @__PURE__ */ s((r) => {
  let { globals: e, globalTypes: t } = r;
  (e || t) && C.error(
    "Global args/argTypes can only be set globally",
    JSON.stringify({
      globals: e,
      globalTypes: t
    })
  );
}, "checkGlobals"), Bd = /* @__PURE__ */ s((r) => {
  let { options: e } = r;
  e?.storySort && C.error("The storySort option parameter can only be set globally");
}, "checkStorySort"), ya = /* @__PURE__ */ s((r) => {
  r && (Ud(r), Bd(r));
}, "checkDisallowedParameters");
function ma(r, e, t) {
  let { default: o, __namedExportsOrder: n, ...a } = r, l = ut(
    o,
    t,
    e
  );
  ya(l.parameters);
  let c = { meta: l, stories: {}, moduleExports: r };
  return Object.keys(a).forEach((i) => {
    if (dt(i, l)) {
      let p = Qe(i, a[i], l);
      ya(p.parameters), c.stories[p.id] = p;
    }
  }), c;
}
s(ma, "processCSFFile");

// src/preview-api/modules/preview-web/render/mount-utils.ts
function ga(r) {
  return r != null && Gd(r).includes("mount");
}
s(ga, "mountDestructured");
function Gd(r) {
  let e = r.toString().match(/[^(]*\(([^)]*)/);
  if (!e)
    return [];
  let t = ha(e[1]);
  if (!t.length)
    return [];
  let o = t[0];
  return o.startsWith("{") && o.endsWith("}") ? ha(o.slice(1, -1).replace(/\s/g, "")).map((a) => a.replace(/:.*|=.*/g, "")) : [];
}
s(Gd, "getUsedProps");
function ha(r) {
  let e = [], t = [], o = 0;
  for (let a = 0; a < r.length; a++)
    if (r[a] === "{" || r[a] === "[")
      t.push(r[a] === "{" ? "}" : "]");
    else if (r[a] === t[t.length - 1])
      t.pop();
    else if (!t.length && r[a] === ",") {
      let l = r.substring(o, a).trim();
      l && e.push(l), o = a + 1;
    }
  let n = r.substring(o).trim();
  return n && e.push(n), e;
}
s(ha, "splitByComma");

// src/preview-api/modules/store/decorators.ts
function an(r, e, t) {
  let o = t(r);
  return (n) => e(o, n);
}
s(an, "decorateStory");
function ln({
  componentId: r,
  title: e,
  kind: t,
  id: o,
  name: n,
  story: a,
  parameters: l,
  initialArgs: c,
  argTypes: i,
  ...p
} = {}) {
  return p;
}
s(ln, "sanitizeStoryContextUpdate");
function ft(r, e) {
  let t = {}, o = /* @__PURE__ */ s((a) => (l) => {
    if (!t.value)
      throw new Error("Decorated function called without init");
    return t.value = {
      ...t.value,
      ...ln(l)
    }, a(t.value);
  }, "bindWithContext"), n = e.reduce(
    (a, l) => an(a, l, o),
    r
  );
  return (a) => (t.value = a, n(a));
}
s(ft, "defaultDecorateStory");

// src/preview-api/modules/store/parameters.ts
var W = /* @__PURE__ */ s((...r) => {
  let e = {}, t = r.filter(Boolean), o = t.reduce((n, a) => (Object.entries(a).forEach(([l, c]) => {
    let i = n[l];
    Array.isArray(c) || typeof i > "u" ? n[l] = c : z(c) && z(i) ? e[l] = !0 : typeof c < "u" && (n[l] = c);
  }), n), {});
  return Object.keys(e).forEach((n) => {
    let a = t.filter(Boolean).map((l) => l[n]).filter((l) => typeof l < "u");
    a.every((l) => z(l)) ? o[n] = W(...a) : o[n] = a[a.length - 1];
  }), o;
}, "combineParameters");

// src/preview-api/modules/store/csf/prepareStory.ts
function Ze(r, e, t) {
  let { moduleExport: o, id: n, name: a } = r || {}, l = Sa(
    r,
    e,
    t
  ), c = /* @__PURE__ */ s(async (_) => {
    let P = {};
    for (let D of [
      ..."__STORYBOOK_TEST_LOADERS__" in R && Array.isArray(R.__STORYBOOK_TEST_LOADERS__) ? [R.__STORYBOOK_TEST_LOADERS__] : [],
      j(t.loaders),
      j(e.loaders),
      j(r.loaders)
    ]) {
      if (_.abortSignal.aborted)
        return P;
      let O = await Promise.all(D.map((U) => U(_)));
      Object.assign(P, ...O);
    }
    return P;
  }, "applyLoaders"), i = /* @__PURE__ */ s(async (_) => {
    let P = new Array();
    for (let D of [
      ...j(t.beforeEach),
      ...j(e.beforeEach),
      ...j(r.beforeEach)
    ]) {
      if (_.abortSignal.aborted)
        return P;
      let O = await D(_);
      O && P.push(O);
    }
    return P;
  }, "applyBeforeEach"), p = /* @__PURE__ */ s((_) => _.originalStoryFn(_.args, _), "undecoratedStoryFn"), { applyDecorators: u = ft, runStep: d } = t,
  y = [
    ...j(r?.decorators),
    ...j(e?.decorators),
    ...j(t?.decorators)
  ], g = r?.userStoryFn || r?.render || e.render || t.render, m = ot(u)(p, y), S = /* @__PURE__ */ s((_) => m(_), "unboundStoryFn"), h = r?.
  play ?? e?.play, A = ga(h);
  if (!g && !A)
    throw new _r({ id: n });
  let b = /* @__PURE__ */ s((_) => async () => (await _.renderToCanvas(), _.canvas), "defaultMount"), E = r.mount ?? e.mount ?? t.mount ?? b,
  T = t.testingLibraryRender;
  return {
    storyGlobals: {},
    ...l,
    moduleExport: o,
    id: n,
    name: a,
    story: a,
    originalStoryFn: g,
    undecoratedStoryFn: p,
    unboundStoryFn: S,
    applyLoaders: c,
    applyBeforeEach: i,
    playFunction: h,
    runStep: d,
    mount: E,
    testingLibraryRender: T,
    renderToCanvas: t.renderToCanvas,
    usesMount: A
  };
}
s(Ze, "prepareStory");
function yt(r, e, t) {
  return {
    ...Sa(void 0, r, e),
    moduleExport: t
  };
}
s(yt, "prepareMeta");
function Sa(r, e, t) {
  let o = ["dev", "test"], n = R.DOCS_OPTIONS?.autodocs === !0 ? ["autodocs"] : [], a = fa(
    ...o,
    ...n,
    ...t.tags ?? [],
    ...e.tags ?? [],
    ...r?.tags ?? []
  ), l = W(
    t.parameters,
    e.parameters,
    r?.parameters
  ), { argTypesEnhancers: c = [], argsEnhancers: i = [] } = t, p = W(
    t.argTypes,
    e.argTypes,
    r?.argTypes
  );
  if (r) {
    let A = r?.userStoryFn || r?.render || e.render || t.render;
    l.__isArgsStory = A && A.length > 0;
  }
  let u = {
    ...t.args,
    ...e.args,
    ...r?.args
  }, d = {
    ...e.globals,
    ...r?.globals
  }, y = {
    componentId: e.id,
    title: e.title,
    kind: e.title,
    // Back compat
    id: r?.id || e.id,
    // if there's no story name, we create a fake one since enhancers expect a name
    name: r?.name || "__meta",
    story: r?.name || "__meta",
    // Back compat
    component: e.component,
    subcomponents: e.subcomponents,
    tags: a,
    parameters: l,
    initialArgs: u,
    argTypes: p,
    storyGlobals: d
  };
  y.argTypes = c.reduce(
    (A, b) => b({ ...y, argTypes: A }),
    y.argTypes
  );
  let g = { ...u };
  y.initialArgs = i.reduce(
    (A, b) => ({
      ...A,
      ...b({
        ...y,
        initialArgs: A
      })
    }),
    g
  );
  let { name: m, story: S, ...h } = y;
  return h;
}
s(Sa, "preparePartialAnnotations");
function mt(r) {
  let { args: e } = r, t = {
    ...r,
    allArgs: void 0,
    argsByTarget: void 0
  };
  if (R.FEATURES?.argTypeTargetsV7) {
    let a = oa(r);
    t = {
      ...r,
      allArgs: r.args,
      argsByTarget: a,
      args: a[rn] || {}
    };
  }
  let o = Object.entries(t.args).reduce((a, [l, c]) => {
    if (!t.argTypes[l]?.mapping)
      return a[l] = c, a;
    let i = /* @__PURE__ */ s((p) => {
      let u = t.argTypes[l].mapping;
      return u && p in u ? u[p] : p;
    }, "mappingFn");
    return a[l] = Array.isArray(c) ? c.map(i) : i(c), a;
  }, {}), n = Object.entries(o).reduce((a, [l, c]) => {
    let i = t.argTypes[l] || {};
    return pa(i, o, t.globals) && (a[l] = c), a;
  }, {});
  return { ...t, unmappedArgs: e, args: n };
}
s(mt, "prepareContext");

// src/preview-api/modules/store/inferArgTypes.ts
var cn = /* @__PURE__ */ s((r, e, t) => {
  let o = typeof r;
  switch (o) {
    case "boolean":
    case "string":
    case "number":
    case "function":
    case "symbol":
      return { name: o };
    default:
      break;
  }
  return r ? t.has(r) ? (C.warn(w`
        We've detected a cycle in arg '${e}'. Args should be JSON-serializable.

        Consider using the mapping feature or fully custom args:
        - Mapping: https://storybook.js.org/docs/writing-stories/args#mapping-to-complex-arg-values
        - Custom args: https://storybook.js.org/docs/essentials/controls#fully-custom-args
      `), { name: "other", value: "cyclic object" }) : (t.add(r), Array.isArray(r) ? { name: "array", value: r.length > 0 ? cn(r[0], e, new Set(
  t)) : { name: "other", value: "unknown" } } : { name: "object", value: ee(r, (a) => cn(a, e, new Set(t))) }) : { name: "object", value: {} };
}, "inferType"), pn = /* @__PURE__ */ s((r) => {
  let { id: e, argTypes: t = {}, initialArgs: o = {} } = r, n = ee(o, (l, c) => ({
    name: c,
    type: cn(l, `${e}.${c}`, /* @__PURE__ */ new Set())
  })), a = ee(t, (l, c) => ({
    name: c
  }));
  return W(n, a, t);
}, "inferArgTypes");
pn.secondPass = !0;

// src/preview-api/modules/store/filterArgTypes.ts
var ba = /* @__PURE__ */ s((r, e) => Array.isArray(e) ? e.includes(r) : r.match(e), "matches"), Pr = /* @__PURE__ */ s((r, e, t) => !e && !t ?
r : r && Ko(r, (o, n) => {
  let a = o.name || n.toString();
  return !!(!e || ba(a, e)) && (!t || !ba(a, t));
}), "filterArgTypes");

// src/preview-api/modules/store/inferControls.ts
var Vd = /* @__PURE__ */ s((r, e, t) => {
  let { type: o, options: n } = r;
  if (o) {
    if (t.color && t.color.test(e)) {
      let a = o.name;
      if (a === "string")
        return { control: { type: "color" } };
      a !== "enum" && C.warn(
        `Addon controls: Control of type color only supports string, received "${a}" instead`
      );
    }
    if (t.date && t.date.test(e))
      return { control: { type: "date" } };
    switch (o.name) {
      case "array":
        return { control: { type: "object" } };
      case "boolean":
        return { control: { type: "boolean" } };
      case "string":
        return { control: { type: "text" } };
      case "number":
        return { control: { type: "number" } };
      case "enum": {
        let { value: a } = o;
        return { control: { type: a?.length <= 5 ? "radio" : "select" }, options: a };
      }
      case "function":
      case "symbol":
        return null;
      default:
        return { control: { type: n ? "select" : "object" } };
    }
  }
}, "inferControl"), er = /* @__PURE__ */ s((r) => {
  let {
    argTypes: e,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    parameters: { __isArgsStory: t, controls: { include: o = null, exclude: n = null, matchers: a = {} } = {} }
  } = r;
  if (!t)
    return e;
  let l = Pr(e, o, n), c = ee(l, (i, p) => i?.type && Vd(i, p.toString(), a));
  return W(c, l);
}, "inferControls");
er.secondPass = !0;

// src/preview-api/modules/store/csf/normalizeProjectAnnotations.ts
function Cr({
  argTypes: r,
  globalTypes: e,
  argTypesEnhancers: t,
  decorators: o,
  loaders: n,
  beforeEach: a,
  globals: l,
  initialGlobals: c,
  ...i
}) {
  return l && Object.keys(l).length > 0 && te(w`
      The preview.js 'globals' field is deprecated and will be removed in Storybook 9.0.
      Please use 'initialGlobals' instead. Learn more:

      https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#previewjs-globals-renamed-to-initialglobals
    `), {
    ...r && { argTypes: ve(r) },
    ...e && { globalTypes: ve(e) },
    decorators: j(o),
    loaders: j(n),
    beforeEach: j(a),
    argTypesEnhancers: [
      ...t || [],
      pn,
      // inferControls technically should only run if the user is using the controls addon,
      // and so should be added by a preset there. However, as it seems some code relies on controls
      // annotations (in particular the angular implementation's `cleanArgsDecorator`), for backwards
      // compatibility reasons, we will leave this in the store until 7.0
      er
    ],
    initialGlobals: W(c, l),
    ...i
  };
}
s(Cr, "normalizeProjectAnnotations");

// src/preview-api/modules/store/csf/beforeAll.ts
var Ta = /* @__PURE__ */ s((r) => async () => {
  let e = [];
  for (let t of r) {
    let o = await t();
    o && e.unshift(o);
  }
  return async () => {
    for (let t of e)
      await t();
  };
}, "composeBeforeAllHooks");

// src/preview-api/modules/store/csf/stepRunners.ts
function ht(r) {
  return async (e, t, o) => {
    await r.reduceRight(
      (a, l) => async () => l(e, a, o),
      async () => t(o)
    )();
  };
}
s(ht, "composeStepRunners");

// src/preview-api/modules/store/csf/composeConfigs.ts
function Ir(r, e) {
  return r.map((t) => t.default?.[e] ?? t[e]).filter(Boolean);
}
s(Ir, "getField");
function Pe(r, e, t = {}) {
  return Ir(r, e).reduce((o, n) => {
    let a = j(n);
    return t.reverseFileOrder ? [...a, ...o] : [...o, ...a];
  }, []);
}
s(Pe, "getArrayField");
function Or(r, e) {
  return Object.assign({}, ...Ir(r, e));
}
s(Or, "getObjectField");
function rr(r, e) {
  return Ir(r, e).pop();
}
s(rr, "getSingletonField");
function Ce(r) {
  let e = Pe(r, "argTypesEnhancers"), t = Ir(r, "runStep"), o = Pe(r, "beforeAll");
  return {
    parameters: W(...Ir(r, "parameters")),
    decorators: Pe(r, "decorators", {
      reverseFileOrder: !(R.FEATURES?.legacyDecoratorFileOrder ?? !1)
    }),
    args: Or(r, "args"),
    argsEnhancers: Pe(r, "argsEnhancers"),
    argTypes: Or(r, "argTypes"),
    argTypesEnhancers: [
      ...e.filter((n) => !n.secondPass),
      ...e.filter((n) => n.secondPass)
    ],
    globals: Or(r, "globals"),
    initialGlobals: Or(r, "initialGlobals"),
    globalTypes: Or(r, "globalTypes"),
    loaders: Pe(r, "loaders"),
    beforeAll: Ta(o),
    beforeEach: Pe(r, "beforeEach"),
    render: rr(r, "render"),
    renderToCanvas: rr(r, "renderToCanvas"),
    renderToDOM: rr(r, "renderToDOM"),
    // deprecated
    applyDecorators: rr(r, "applyDecorators"),
    runStep: ht(t),
    tags: Pe(r, "tags"),
    mount: rr(r, "mount"),
    testingLibraryRender: rr(r, "testingLibraryRender")
  };
}
s(Ce, "composeConfigs");

// src/preview-api/modules/store/csf/portable-stories.ts
function Ea(r) {
  globalThis.defaultProjectAnnotations = r;
}
s(Ea, "setDefaultProjectAnnotations");
var Hd = "ComposedStory", zd = "Unnamed Story";
function Wd(r) {
  return r ? Ce([r]) : {};
}
s(Wd, "extractAnnotation");
function Ra(r) {
  let e = Array.isArray(r) ? r : [r];
  return globalThis.globalProjectAnnotations = Ce(e.map(Wd)), Ce([
    globalThis.defaultProjectAnnotations ?? {},
    globalThis.globalProjectAnnotations ?? {}
  ]);
}
s(Ra, "setProjectAnnotations");
var ge = [];
function dn(r, e, t, o, n) {
  if (r === void 0)
    throw new Error("Expected a story but received undefined.");
  e.title = e.title ?? Hd;
  let a = ut(e), l = n || r.storyName || r.story?.name || r.name || zd, c = Qe(
    l,
    r,
    a
  ), i = Cr(
    Ce([
      o && Object.keys(o).length > 0 ? o : globalThis.defaultProjectAnnotations ?? {},
      globalThis.globalProjectAnnotations ?? {},
      t ?? {}
    ])
  ), p = Ze(
    c,
    a,
    i
  ), d = {
    // TODO: remove loading from globalTypes in 9.0
    ...lt(i.globalTypes),
    ...i.initialGlobals,
    ...p.storyGlobals
  }, y = /* @__PURE__ */ s(() => {
    let b = mt({
      hooks: new he(),
      globals: d,
      args: { ...p.initialArgs },
      viewMode: "story",
      loaded: {},
      abortSignal: new AbortController().signal,
      step: /* @__PURE__ */ s((E, T) => p.runStep(E, T, b), "step"),
      canvasElement: null,
      canvas: {},
      globalTypes: i.globalTypes,
      ...p,
      context: null,
      mount: null
    });
    return b.context = b, p.renderToCanvas && (b.renderToCanvas = async () => {
      let E = await p.renderToCanvas?.(
        {
          componentId: p.componentId,
          title: p.title,
          id: p.id,
          name: p.name,
          tags: p.tags,
          showMain: /* @__PURE__ */ s(() => {
          }, "showMain"),
          showError: /* @__PURE__ */ s((T) => {
            throw new Error(`${T.title}
${T.description}`);
          }, "showError"),
          showException: /* @__PURE__ */ s((T) => {
            throw T;
          }, "showException"),
          forceRemount: !0,
          storyContext: b,
          storyFn: /* @__PURE__ */ s(() => p.unboundStoryFn(b), "storyFn"),
          unboundStoryFn: p.unboundStoryFn
        },
        b.canvasElement
      );
      E && ge.push(E);
    }), b.mount = p.mount(b), b;
  }, "initializeContext"), g, m = /* @__PURE__ */ s(async (b) => {
    let E = y();
    return E.canvasElement ??= globalThis?.document?.body, g && (E.loaded = g.loaded), Object.assign(E, b), p.playFunction(E);
  }, "play"), S = /* @__PURE__ */ s((b) => {
    let E = y();
    return Object.assign(E, b), Yd(p, E);
  }, "run"), h = p.playFunction ? m : void 0;
  return Object.assign(
    /* @__PURE__ */ s(function(E) {
      let T = y();
      return g && (T.loaded = g.loaded), T.args = {
        ...T.initialArgs,
        ...E
      }, p.unboundStoryFn(T);
    }, "storyFn"),
    {
      id: p.id,
      storyName: l,
      load: /* @__PURE__ */ s(async () => {
        for (let E of [...ge].reverse())
          await E();
        ge.length = 0;
        let b = y();
        b.loaded = await p.applyLoaders(b), ge.push(...(await p.applyBeforeEach(b)).filter(Boolean)), g = b;
      }, "load"),
      globals: d,
      args: p.initialArgs,
      parameters: p.parameters,
      argTypes: p.argTypes,
      play: h,
      run: S,
      tags: p.tags
    }
  );
}
s(dn, "composeStory");
var $d = /* @__PURE__ */ s((r, e, t, o) => dn(r, e, t, {}, o), "defaultComposeStory");
function xa(r, e, t = $d) {
  let { default: o, __esModule: n, __namedExportsOrder: a, ...l } = r;
  return Object.entries(l).reduce((i, [p, u]) => dt(p, o) ? Object.assign(i, {
    [p]: t(
      u,
      o,
      e,
      p
    )
  }) : i, {});
}
s(xa, "composeStories");
function Aa(r) {
  return r.extend({
    mount: /* @__PURE__ */ s(async ({ mount: e, page: t }, o) => {
      await o(async (n, ...a) => {
        if (!("__pw_type" in n) || "__pw_type" in n && n.__pw_type !== "jsx")
          throw new Error(w`
              Portable stories in Playwright CT only work when referencing JSX elements.
              Please use JSX format for your components such as:

              instead of:
              await mount(MyComponent, { props: { foo: 'bar' } })

              do:
              await mount(<MyComponent foo="bar"/>)

              More info: https://storybook.js.org/docs/api/portable-stories-playwright
            `);
        await t.evaluate(async (c) => {
          let i = await globalThis.__pwUnwrapObject?.(c);
          return ("__pw_type" in i ? i.type : i)?.load?.();
        }, n);
        let l = await e(n, ...a);
        return await t.evaluate(async (c) => {
          let i = await globalThis.__pwUnwrapObject?.(c), p = "__pw_type" in i ? i.type : i, u = document.querySelector("#root");
          return p?.play?.({ canvasElement: u });
        }, n), l;
      });
    }, "mount")
  });
}
s(Aa, "createPlaywrightTest");
async function Yd(r, e) {
  for (let n of [...ge].reverse())
    await n();
  if (ge.length = 0, !e.canvasElement) {
    let n = document.createElement("div");
    globalThis?.document?.body?.appendChild(n), e.canvasElement = n, ge.push(() => {
      globalThis?.document?.body?.contains(n) && globalThis?.document?.body?.removeChild(n);
    });
  }
  if (e.loaded = await r.applyLoaders(e), e.abortSignal.aborted)
    return;
  ge.push(...(await r.applyBeforeEach(e)).filter(Boolean));
  let t = r.playFunction, o = r.usesMount;
  o || await e.mount(), !e.abortSignal.aborted && t && (o || (e.mount = async () => {
    throw new _e({ playFunction: t.toString() });
  }), await t(e));
}
s(Yd, "runStory");

// src/preview-api/modules/store/StoryStore.ts
function _a(r, e) {
  return $o(Yo(r, e), (t) => t === void 0);
}
s(_a, "picky");
var wa = 1e3, Kd = 1e4, un = class un {
  constructor(e, t, o) {
    this.importFn = t;
    // TODO: Remove in 9.0
    // NOTE: this is legacy `stories.json` data for the `extract` script.
    // It is used to allow v7 Storybooks to be composed in v6 Storybooks, which expect a
    // `stories.json` file with legacy fields (`kind` etc).
    this.getStoriesJsonData = /* @__PURE__ */ s(() => {
      let e = this.getSetStoriesPayload(), t = ["fileName", "docsOnly", "framework", "__id", "__isArgsStory"];
      return {
        v: 3,
        stories: ee(e.stories, (n) => {
          let { importPath: a } = this.storyIndex.entries[n.id];
          return {
            ..._a(n, ["id", "name", "title"]),
            importPath: a,
            // These 3 fields were going to be dropped in v7, but instead we will keep them for the
            // 7.x cycle so that v7 Storybooks can be composed successfully in v6 Storybook.
            // In v8 we will (likely) completely drop support for `extract` and `getStoriesJsonData`
            kind: n.title,
            story: n.name,
            parameters: {
              ..._a(n.parameters, t),
              fileName: a
            }
          };
        })
      };
    }, "getStoriesJsonData");
    this.storyIndex = new pt(e), this.projectAnnotations = Cr(o);
    let { initialGlobals: n, globalTypes: a } = this.projectAnnotations;
    this.args = new it(), this.userGlobals = new ct({ globals: n, globalTypes: a }), this.hooks = {}, this.cleanupCallbacks = {}, this.processCSFFileWithCache =
    (0, gt.default)(wa)(ma), this.prepareMetaWithCache = (0, gt.default)(wa)(yt), this.prepareStoryWithCache = (0, gt.default)(Kd)(Ze);
  }
  setProjectAnnotations(e) {
    this.projectAnnotations = Cr(e);
    let { initialGlobals: t, globalTypes: o } = e;
    this.userGlobals.set({ globals: t, globalTypes: o });
  }
  // This means that one of the CSF files has changed.
  // If the `importFn` has changed, we will invalidate both caches.
  // If the `storyIndex` data has changed, we may or may not invalidate the caches, depending
  // on whether we've loaded the relevant files yet.
  async onStoriesChanged({
    importFn: e,
    storyIndex: t
  }) {
    e && (this.importFn = e), t && (this.storyIndex.entries = t.entries), this.cachedCSFFiles && await this.cacheAllCSFFiles();
  }
  // Get an entry from the index, waiting on initialization if necessary
  async storyIdToEntry(e) {
    return this.storyIndex.storyIdToEntry(e);
  }
  // To load a single CSF file to service a story we need to look up the importPath in the index
  async loadCSFFileByStoryId(e) {
    let { importPath: t, title: o } = this.storyIndex.storyIdToEntry(e), n = await this.importFn(t);
    return this.processCSFFileWithCache(n, t, o);
  }
  async loadAllCSFFiles() {
    let e = {};
    return Object.entries(this.storyIndex.entries).forEach(([o, { importPath: n }]) => {
      e[n] = o;
    }), (await Promise.all(
      Object.entries(e).map(async ([o, n]) => ({
        importPath: o,
        csfFile: await this.loadCSFFileByStoryId(n)
      }))
    )).reduce(
      (o, { importPath: n, csfFile: a }) => (o[n] = a, o),
      {}
    );
  }
  async cacheAllCSFFiles() {
    this.cachedCSFFiles = await this.loadAllCSFFiles();
  }
  preparedMetaFromCSFFile({ csfFile: e }) {
    let t = e.meta;
    return this.prepareMetaWithCache(
      t,
      this.projectAnnotations,
      e.moduleExports.default
    );
  }
  // Load the CSF file for a story and prepare the story from it and the project annotations.
  async loadStory({ storyId: e }) {
    let t = await this.loadCSFFileByStoryId(e);
    return this.storyFromCSFFile({ storyId: e, csfFile: t });
  }
  // This function is synchronous for convenience -- often times if you have a CSF file already
  // it is easier not to have to await `loadStory`.
  storyFromCSFFile({
    storyId: e,
    csfFile: t
  }) {
    let o = t.stories[e];
    if (!o)
      throw new xr({ storyId: e });
    let n = t.meta, a = this.prepareStoryWithCache(
      o,
      n,
      this.projectAnnotations
    );
    return this.args.setInitial(a), this.hooks[a.id] = this.hooks[a.id] || new he(), a;
  }
  // If we have a CSF file we can get all the stories from it synchronously
  componentStoriesFromCSFFile({
    csfFile: e
  }) {
    return Object.keys(this.storyIndex.entries).filter((t) => !!e.stories[t]).map((t) => this.storyFromCSFFile({ storyId: t, csfFile: e }));
  }
  async loadEntry(e) {
    let t = await this.storyIdToEntry(e), o = t.type === "docs" ? t.storiesImports : [], [n, ...a] = await Promise.all([
      this.importFn(t.importPath),
      ...o.map((l) => {
        let c = this.storyIndex.importPathToEntry(l);
        return this.loadCSFFileByStoryId(c.id);
      })
    ]);
    return { entryExports: n, csfFiles: a };
  }
  // A prepared story does not include args, globals or hooks. These are stored in the story store
  // and updated separtely to the (immutable) story.
  getStoryContext(e, { forceInitialArgs: t = !1 } = {}) {
    let o = this.userGlobals.get(), { initialGlobals: n } = this.userGlobals;
    return mt({
      ...e,
      args: t ? e.initialArgs : this.args.get(e.id),
      initialGlobals: n,
      globalTypes: this.projectAnnotations.globalTypes,
      userGlobals: o,
      globals: {
        ...o,
        ...e.storyGlobals
      },
      hooks: this.hooks[e.id]
    });
  }
  addCleanupCallbacks(e, t) {
    this.cleanupCallbacks[e.id] = t;
  }
  async cleanupStory(e) {
    this.hooks[e.id].clean();
    let t = this.cleanupCallbacks[e.id];
    if (t)
      for (let o of [...t].reverse())
        await o();
    delete this.cleanupCallbacks[e.id];
  }
  extract(e = { includeDocsOnly: !1 }) {
    let { cachedCSFFiles: t } = this;
    if (!t)
      throw new gr();
    return Object.entries(this.storyIndex.entries).reduce(
      (o, [n, { type: a, importPath: l }]) => {
        if (a === "docs")
          return o;
        let c = t[l], i = this.storyFromCSFFile({ storyId: n, csfFile: c });
        return !e.includeDocsOnly && i.parameters.docsOnly || (o[n] = Object.entries(i).reduce(
          (p, [u, d]) => u === "moduleExport" || typeof d == "function" ? p : Array.isArray(d) ? Object.assign(p, { [u]: d.slice().sort() }) :
          Object.assign(p, { [u]: d }),
          { args: i.initialArgs }
        )), o;
      },
      {}
    );
  }
  // TODO: Remove in 9.0
  getSetStoriesPayload() {
    let e = this.extract({ includeDocsOnly: !0 }), t = Object.values(e).reduce(
      (o, { title: n }) => (o[n] = {}, o),
      {}
    );
    return {
      v: 2,
      globals: this.userGlobals.get(),
      globalParameters: {},
      kindParameters: t,
      stories: e
    };
  }
  raw() {
    return te(
      "StoryStore.raw() is deprecated and will be removed in 9.0, please use extract() instead"
    ), Object.values(this.extract()).map(({ id: e }) => this.fromId(e)).filter(Boolean);
  }
  fromId(e) {
    if (te(
      "StoryStore.fromId() is deprecated and will be removed in 9.0, please use loadStory() instead"
    ), !this.cachedCSFFiles)
      throw new Error("Cannot call fromId/raw() unless you call cacheAllCSFFiles() first.");
    let t;
    try {
      ({ importPath: t } = this.storyIndex.storyIdToEntry(e));
    } catch {
      return null;
    }
    let o = this.cachedCSFFiles[t], n = this.storyFromCSFFile({ storyId: e, csfFile: o });
    return {
      ...n,
      storyFn: /* @__PURE__ */ s((a) => {
        let l = {
          ...this.getStoryContext(n),
          abortSignal: new AbortController().signal,
          canvasElement: null,
          loaded: {},
          step: /* @__PURE__ */ s((c, i) => n.runStep(c, i, l), "step"),
          context: null,
          mount: null,
          canvas: {},
          viewMode: "story"
        };
        return n.unboundStoryFn({ ...l, ...a });
      }, "storyFn")
    };
  }
};
s(un, "StoryStore");
var Oe = un;

// ../node_modules/slash/index.js
function fn(r) {
  return r.startsWith("\\\\?\\") ? r : r.replace(/\\/g, "/");
}
s(fn, "slash");

// src/preview-api/modules/store/autoTitle.ts
var Xd = /* @__PURE__ */ s((r) => {
  if (r.length === 0)
    return r;
  let e = r[r.length - 1], t = e?.replace(/(?:[.](?:story|stories))?([.][^.]+)$/i, "");
  if (r.length === 1)
    return [t];
  let o = r[r.length - 2];
  return t && o && t.toLowerCase() === o.toLowerCase() ? [...r.slice(0, -2), t] : t && (/^(story|stories)([.][^.]+)$/i.test(e) || /^index$/i.
  test(t)) ? r.slice(0, -1) : [...r.slice(0, -1), t];
}, "sanitize");
function va(r) {
  return r.flatMap((e) => e.split("/")).filter(Boolean).join("/");
}
s(va, "pathJoin");
var yn = /* @__PURE__ */ s((r, e, t) => {
  let { directory: o, importPathMatcher: n, titlePrefix: a = "" } = e || {};
  typeof r == "number" && L.warn(w`
      CSF Auto-title received a numeric fileName. This typically happens when
      webpack is mis-configured in production mode. To force webpack to produce
      filenames, set optimization.moduleIds = "named" in your webpack config.
    `);
  let l = fn(String(r));
  if (n.exec(l)) {
    if (!t) {
      let c = l.replace(o, ""), i = va([a, c]).split("/");
      return i = Xd(i), i.join("/");
    }
    return a ? va([a, t]) : t;
  }
}, "userOrAutoTitleFromSpecifier"), Pa = /* @__PURE__ */ s((r, e, t) => {
  for (let o = 0; o < e.length; o += 1) {
    let n = yn(r, e[o], t);
    if (n)
      return n;
  }
  return t || void 0;
}, "userOrAutoTitle");

// src/preview-api/modules/store/storySort.ts
var Ca = /\s*\/\s*/, Oa = /* @__PURE__ */ s((r = {}) => (e, t) => {
  if (e.title === t.title && !r.includeNames)
    return 0;
  let o = r.method || "configure", n = r.order || [], a = e.title.trim().split(Ca), l = t.title.trim().split(Ca);
  r.includeNames && (a.push(e.name), l.push(t.name));
  let c = 0;
  for (; a[c] || l[c]; ) {
    if (!a[c])
      return -1;
    if (!l[c])
      return 1;
    let i = a[c], p = l[c];
    if (i !== p) {
      let d = n.indexOf(i), y = n.indexOf(p), g = n.indexOf("*");
      return d !== -1 || y !== -1 ? (d === -1 && (g !== -1 ? d = g : d = n.length), y === -1 && (g !== -1 ? y = g : y = n.length), d - y) : o ===
      "configure" ? 0 : i.localeCompare(p, r.locales ? r.locales : void 0, {
        numeric: !0,
        sensitivity: "accent"
      });
    }
    let u = n.indexOf(i);
    u === -1 && (u = n.indexOf("*")), n = u !== -1 && Array.isArray(n[u + 1]) ? n[u + 1] : [], c += 1;
  }
  return 0;
}, "storySort");

// src/preview-api/modules/store/sortStories.ts
var Jd = /* @__PURE__ */ s((r, e, t) => {
  if (e) {
    let o;
    typeof e == "function" ? o = e : o = Oa(e), r.sort(o);
  } else
    r.sort(
      (o, n) => t.indexOf(o.importPath) - t.indexOf(n.importPath)
    );
  return r;
}, "sortStoriesCommon"), Ia = /* @__PURE__ */ s((r, e, t) => {
  try {
    return Jd(r, e, t);
  } catch (o) {
    throw new Error(w`
    Error sorting stories with sort parameter ${e}:

    > ${o.message}
    
    Are you using a V6-style sort function in V7 mode?

    More info: https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#v7-style-story-sort
  `);
  }
}, "sortStoriesV7");

// src/preview-api/modules/preview-web/render/Render.ts
var Se = new Error("prepareAborted");

// src/preview-api/modules/preview-web/render/StoryRender.ts
var { AbortController: Fa } = globalThis;
function Da(r) {
  try {
    let { name: e = "Error", message: t = String(r), stack: o } = r;
    return { name: e, message: t, stack: o };
  } catch {
    return { name: "Error", message: String(r) };
  }
}
s(Da, "serializeError");
var mn = class mn {
  constructor(e, t, o, n, a, l, c = { autoplay: !0, forceInitialArgs: !1 }, i) {
    this.channel = e;
    this.store = t;
    this.renderToScreen = o;
    this.callbacks = n;
    this.id = a;
    this.viewMode = l;
    this.renderOptions = c;
    this.type = "story";
    this.notYetRendered = !0;
    this.rerenderEnqueued = !1;
    this.disableKeyListeners = !1;
    this.teardownRender = /* @__PURE__ */ s(() => {
    }, "teardownRender");
    this.torndown = !1;
    this.abortController = new Fa(), i && (this.story = i, this.phase = "preparing");
  }
  async runPhase(e, t, o) {
    this.phase = t, this.channel.emit(Ae, { newPhase: this.phase, storyId: this.id }), o && (await o(), this.checkIfAborted(e));
  }
  checkIfAborted(e) {
    return e.aborted ? (this.phase = "aborted", this.channel.emit(Ae, { newPhase: this.phase, storyId: this.id }), !0) : !1;
  }
  async prepare() {
    if (await this.runPhase(this.abortController.signal, "preparing", async () => {
      this.story = await this.store.loadStory({ storyId: this.id });
    }), this.abortController.signal.aborted)
      throw await this.store.cleanupStory(this.story), Se;
  }
  // The two story "renders" are equal and have both loaded the same story
  isEqual(e) {
    return !!(this.id === e.id && this.story && this.story === e.story);
  }
  isPreparing() {
    return ["preparing"].includes(this.phase);
  }
  isPending() {
    return ["loading", "beforeEach", "rendering", "playing"].includes(this.phase);
  }
  async renderToElement(e) {
    return this.canvasElement = e, this.render({ initial: !0, forceRemount: !0 });
  }
  storyContext() {
    if (!this.story)
      throw new Error("Cannot call storyContext before preparing");
    let { forceInitialArgs: e } = this.renderOptions;
    return this.store.getStoryContext(this.story, { forceInitialArgs: e });
  }
  async render({
    initial: e = !1,
    forceRemount: t = !1
  } = {}) {
    let { canvasElement: o } = this;
    if (!this.story)
      throw new Error("cannot render when not prepared");
    let n = this.story;
    if (!o)
      throw new Error("cannot render when canvasElement is unset");
    let {
      id: a,
      componentId: l,
      title: c,
      name: i,
      tags: p,
      applyLoaders: u,
      applyBeforeEach: d,
      unboundStoryFn: y,
      playFunction: g,
      runStep: m
    } = n;
    t && !e && (this.cancelRender(), this.abortController = new Fa());
    let S = this.abortController.signal, h = !1, A = n.usesMount;
    try {
      let b = {
        ...this.storyContext(),
        viewMode: this.viewMode,
        abortSignal: S,
        canvasElement: o,
        loaded: {},
        step: /* @__PURE__ */ s((O, U) => m(O, U, b), "step"),
        context: null,
        canvas: {},
        renderToCanvas: /* @__PURE__ */ s(async () => {
          let O = await this.renderToScreen(E, o);
          this.teardownRender = O || (() => {
          }), h = !0;
        }, "renderToCanvas"),
        // The story provides (set in a renderer) a mount function that is a higher order function
        // (context) => (...args) => Canvas
        //
        // Before assigning it to the context, we resolve the context dependency,
        // so that a user can just call it as await mount(...args) in their play function.
        mount: /* @__PURE__ */ s(async (...O) => {
          this.callbacks.showStoryDuringRender?.();
          let U = null;
          return await this.runPhase(S, "rendering", async () => {
            U = await n.mount(b)(...O);
          }), A && await this.runPhase(S, "playing"), U;
        }, "mount")
      };
      b.context = b;
      let E = {
        componentId: l,
        title: c,
        kind: c,
        id: a,
        name: i,
        story: i,
        tags: p,
        ...this.callbacks,
        showError: /* @__PURE__ */ s((O) => (this.phase = "errored", this.callbacks.showError(O)), "showError"),
        showException: /* @__PURE__ */ s((O) => (this.phase = "errored", this.callbacks.showException(O)), "showException"),
        forceRemount: t || this.notYetRendered,
        storyContext: b,
        storyFn: /* @__PURE__ */ s(() => y(b), "storyFn"),
        unboundStoryFn: y
      };
      if (await this.runPhase(S, "loading", async () => {
        b.loaded = await u(b);
      }), S.aborted)
        return;
      let T = await d(b);
      if (this.store.addCleanupCallbacks(n, T), this.checkIfAborted(S) || (!h && !A && await b.mount(), this.notYetRendered = !1, S.aborted))
        return;
      let _ = this.story.parameters?.test?.dangerouslyIgnoreUnhandledErrors === !0, P = /* @__PURE__ */ new Set(), D = /* @__PURE__ */ s((O) => P.
      add("error" in O ? O.error : O.reason), "onError");
      if (this.renderOptions.autoplay && t && g && this.phase !== "errored") {
        window.addEventListener("error", D), window.addEventListener("unhandledrejection", D), this.disableKeyListeners = !0;
        try {
          if (A ? await g(b) : (b.mount = async () => {
            throw new _e({ playFunction: g.toString() });
          }, await this.runPhase(S, "playing", async () => g(b))), !h)
            throw new wr();
          this.checkIfAborted(S), !_ && P.size > 0 ? await this.runPhase(S, "errored") : await this.runPhase(S, "played");
        } catch (O) {
          if (this.callbacks.showStoryDuringRender?.(), await this.runPhase(S, "errored", async () => {
            this.channel.emit(jt, Da(O));
          }), this.story.parameters.throwPlayFunctionExceptions !== !1)
            throw O;
          console.error(O);
        }
        if (!_ && P.size > 0 && this.channel.emit(
          Mt,
          Array.from(P).map(Da)
        ), this.disableKeyListeners = !1, window.removeEventListener("unhandledrejection", D), window.removeEventListener("error", D), S.aborted)
          return;
      }
      await this.runPhase(
        S,
        "completed",
        async () => this.channel.emit(Ue, a)
      );
    } catch (b) {
      this.phase = "errored", this.callbacks.showException(b);
    }
    this.rerenderEnqueued && (this.rerenderEnqueued = !1, this.render());
  }
  /**
   * Rerender the story. If the story is currently pending (loading/rendering), the rerender will be
   * enqueued, and will be executed after the current render is completed. Rerendering while playing
   * will not be enqueued, and will be executed immediately, to support rendering args changes while
   * playing.
   */
  async rerender() {
    if (this.isPending() && this.phase !== "playing")
      this.rerenderEnqueued = !0;
    else
      return this.render();
  }
  async remount() {
    return await this.teardown(), this.render({ forceRemount: !0 });
  }
  // If the story is torn down (either a new story is rendered or the docs page removes it)
  // we need to consider the fact that the initial render may not be finished
  // (possibly the loaders or the play function are still running). We use the controller
  // as a method to abort them, ASAP, but this is not foolproof as we cannot control what
  // happens inside the user's code.
  cancelRender() {
    this.abortController?.abort();
  }
  async teardown() {
    this.torndown = !0, this.cancelRender(), this.story && await this.store.cleanupStory(this.story);
    for (let e = 0; e < 3; e += 1) {
      if (!this.isPending()) {
        await this.teardownRender();
        return;
      }
      await new Promise((t) => setTimeout(t, 0));
    }
    window.location.reload(), await new Promise(() => {
    });
  }
};
s(mn, "StoryRender");
var Ie = mn;

// src/preview-api/modules/preview-web/Preview.tsx
var { fetch: Qd } = R, Zd = "./index.json", hn = class hn {
  constructor(e, t, o = Z.getChannel(), n = !0) {
    this.importFn = e;
    this.getProjectAnnotations = t;
    this.channel = o;
    this.storyRenders = [];
    this.storeInitializationPromise = new Promise((a, l) => {
      this.resolveStoreInitializationPromise = a, this.rejectStoreInitializationPromise = l;
    }), n && this.initialize();
  }
  // Create a proxy object for `__STORYBOOK_STORY_STORE__` and `__STORYBOOK_PREVIEW__.storyStore`
  // That proxies through to the store once ready, and errors beforehand. This means we can set
  // `__STORYBOOK_STORY_STORE__ = __STORYBOOK_PREVIEW__.storyStore` without having to wait, and
  // similarly integrators can access the `storyStore` on the preview at any time, although
  // it is considered deprecated and we will no longer allow access in 9.0
  get storyStore() {
    return new Proxy(
      {},
      {
        get: /* @__PURE__ */ s((e, t) => {
          if (this.storyStoreValue)
            return te("Accessing the Story Store is deprecated and will be removed in 9.0"), this.storyStoreValue[t];
          throw new Ar();
        }, "get")
      }
    );
  }
  // INITIALIZATION
  async initialize() {
    this.setupListeners();
    try {
      let e = await this.getProjectAnnotationsOrRenderError();
      await this.runBeforeAllHook(e), await this.initializeWithProjectAnnotations(e);
    } catch (e) {
      this.rejectStoreInitializationPromise(e);
    }
  }
  ready() {
    return this.storeInitializationPromise;
  }
  setupListeners() {
    this.channel.on(Wt, this.onStoryIndexChanged.bind(this)), this.channel.on(ir, this.onUpdateGlobals.bind(this)), this.channel.on(lr, this.
    onUpdateArgs.bind(this)), this.channel.on(Zt, this.onRequestArgTypesInfo.bind(this)), this.channel.on(ar, this.onResetArgs.bind(this)), this.
    channel.on(sr, this.onForceReRender.bind(this)), this.channel.on(Lt, this.onForceRemount.bind(this));
  }
  async getProjectAnnotationsOrRenderError() {
    try {
      let e = await this.getProjectAnnotations();
      if (this.renderToCanvas = e.renderToCanvas, !this.renderToCanvas)
        throw new Sr();
      return e;
    } catch (e) {
      throw this.renderPreviewEntryError("Error reading preview.js:", e), e;
    }
  }
  // If initialization gets as far as project annotations, this function runs.
  async initializeWithProjectAnnotations(e) {
    this.projectAnnotationsBeforeInitialization = e;
    try {
      let t = await this.getStoryIndexFromServer();
      return this.initializeWithStoryIndex(t);
    } catch (t) {
      throw this.renderPreviewEntryError("Error loading story index:", t), t;
    }
  }
  async runBeforeAllHook(e) {
    try {
      await this.beforeAllCleanup?.(), this.beforeAllCleanup = await e.beforeAll?.();
    } catch (t) {
      throw this.renderPreviewEntryError("Error in beforeAll hook:", t), t;
    }
  }
  async getStoryIndexFromServer() {
    let e = await Qd(Zd);
    if (e.status === 200)
      return e.json();
    throw new br({ text: await e.text() });
  }
  // If initialization gets as far as the story index, this function runs.
  initializeWithStoryIndex(e) {
    if (!this.projectAnnotationsBeforeInitialization)
      throw new Error("Cannot call initializeWithStoryIndex until project annotations resolve");
    this.storyStoreValue = new Oe(
      e,
      this.importFn,
      this.projectAnnotationsBeforeInitialization
    ), delete this.projectAnnotationsBeforeInitialization, this.setInitialGlobals(), this.resolveStoreInitializationPromise();
  }
  async setInitialGlobals() {
    this.emitGlobals();
  }
  emitGlobals() {
    if (!this.storyStoreValue)
      throw new G({ methodName: "emitGlobals" });
    let e = {
      globals: this.storyStoreValue.userGlobals.get() || {},
      globalTypes: this.storyStoreValue.projectAnnotations.globalTypes || {}
    };
    this.channel.emit(Gt, e);
  }
  // EVENT HANDLERS
  // This happens when a config file gets reloaded
  async onGetProjectAnnotationsChanged({
    getProjectAnnotations: e
  }) {
    delete this.previewEntryError, this.getProjectAnnotations = e;
    let t = await this.getProjectAnnotationsOrRenderError();
    if (await this.runBeforeAllHook(t), !this.storyStoreValue) {
      await this.initializeWithProjectAnnotations(t);
      return;
    }
    this.storyStoreValue.setProjectAnnotations(t), this.emitGlobals();
  }
  async onStoryIndexChanged() {
    if (delete this.previewEntryError, !(!this.storyStoreValue && !this.projectAnnotationsBeforeInitialization))
      try {
        let e = await this.getStoryIndexFromServer();
        if (this.projectAnnotationsBeforeInitialization) {
          this.initializeWithStoryIndex(e);
          return;
        }
        await this.onStoriesChanged({ storyIndex: e });
      } catch (e) {
        throw this.renderPreviewEntryError("Error loading story index:", e), e;
      }
  }
  // This happens when a glob gets HMR-ed
  async onStoriesChanged({
    importFn: e,
    storyIndex: t
  }) {
    if (!this.storyStoreValue)
      throw new G({ methodName: "onStoriesChanged" });
    await this.storyStoreValue.onStoriesChanged({ importFn: e, storyIndex: t });
  }
  async onUpdateGlobals({
    globals: e,
    currentStory: t
  }) {
    if (this.storyStoreValue || await this.storeInitializationPromise, !this.storyStoreValue)
      throw new G({ methodName: "onUpdateGlobals" });
    if (this.storyStoreValue.userGlobals.update(e), t) {
      let { initialGlobals: o, storyGlobals: n, userGlobals: a, globals: l } = this.storyStoreValue.getStoryContext(t);
      this.channel.emit(xe, {
        initialGlobals: o,
        userGlobals: a,
        storyGlobals: n,
        globals: l
      });
    } else {
      let { initialGlobals: o, globals: n } = this.storyStoreValue.userGlobals;
      this.channel.emit(xe, {
        initialGlobals: o,
        userGlobals: n,
        storyGlobals: {},
        globals: n
      });
    }
    await Promise.all(this.storyRenders.map((o) => o.rerender()));
  }
  async onUpdateArgs({ storyId: e, updatedArgs: t }) {
    if (!this.storyStoreValue)
      throw new G({ methodName: "onUpdateArgs" });
    this.storyStoreValue.args.update(e, t), await Promise.all(
      this.storyRenders.filter((o) => o.id === e && !o.renderOptions.forceInitialArgs).map(
        (o) => (
          // We only run the play function, with in a force remount.
          // But when mount is destructured, the rendering happens inside of the play function.
          o.story && o.story.usesMount ? o.remount() : o.rerender()
        )
      )
    ), this.channel.emit(Vt, {
      storyId: e,
      args: this.storyStoreValue.args.get(e)
    });
  }
  async onRequestArgTypesInfo({ id: e, payload: t }) {
    try {
      await this.storeInitializationPromise;
      let o = await this.storyStoreValue?.loadStory(t);
      this.channel.emit(Yr, {
        id: e,
        success: !0,
        payload: { argTypes: o?.argTypes || {} },
        error: null
      });
    } catch (o) {
      this.channel.emit(Yr, {
        id: e,
        success: !1,
        error: o?.message
      });
    }
  }
  async onResetArgs({ storyId: e, argNames: t }) {
    if (!this.storyStoreValue)
      throw new G({ methodName: "onResetArgs" });
    let n = this.storyRenders.find((c) => c.id === e)?.story || await this.storyStoreValue.loadStory({ storyId: e }), l = (t || [
      .../* @__PURE__ */ new Set([
        ...Object.keys(n.initialArgs),
        ...Object.keys(this.storyStoreValue.args.get(e))
      ])
    ]).reduce((c, i) => (c[i] = n.initialArgs[i], c), {});
    await this.onUpdateArgs({ storyId: e, updatedArgs: l });
  }
  // ForceReRender does not include a story id, so we simply must
  // re-render all stories in case they are relevant
  async onForceReRender() {
    await Promise.all(this.storyRenders.map((e) => e.rerender()));
  }
  async onForceRemount({ storyId: e }) {
    await Promise.all(this.storyRenders.filter((t) => t.id === e).map((t) => t.remount()));
  }
  // Used by docs to render a story to a given element
  // Note this short-circuits the `prepare()` phase of the StoryRender,
  // main to be consistent with the previous behaviour. In the future,
  // we will change it to go ahead and load the story, which will end up being
  // "instant", although async.
  renderStoryToElement(e, t, o, n) {
    if (!this.renderToCanvas || !this.storyStoreValue)
      throw new G({
        methodName: "renderStoryToElement"
      });
    let a = new Ie(
      this.channel,
      this.storyStoreValue,
      this.renderToCanvas,
      o,
      e.id,
      "docs",
      n,
      e
    );
    return a.renderToElement(t), this.storyRenders.push(a), async () => {
      await this.teardownRender(a);
    };
  }
  async teardownRender(e, { viewModeChanged: t } = {}) {
    this.storyRenders = this.storyRenders.filter((o) => o !== e), await e?.teardown?.({ viewModeChanged: t });
  }
  // API
  async loadStory({ storyId: e }) {
    if (!this.storyStoreValue)
      throw new G({ methodName: "loadStory" });
    return this.storyStoreValue.loadStory({ storyId: e });
  }
  getStoryContext(e, { forceInitialArgs: t = !1 } = {}) {
    if (!this.storyStoreValue)
      throw new G({ methodName: "getStoryContext" });
    return this.storyStoreValue.getStoryContext(e, { forceInitialArgs: t });
  }
  async extract(e) {
    if (!this.storyStoreValue)
      throw new G({ methodName: "extract" });
    if (this.previewEntryError)
      throw this.previewEntryError;
    return await this.storyStoreValue.cacheAllCSFFiles(), this.storyStoreValue.extract(e);
  }
  // UTILITIES
  renderPreviewEntryError(e, t) {
    this.previewEntryError = t, C.error(e), C.error(t), this.channel.emit(kt, t);
  }
};
s(hn, "Preview");
var Fe = hn;

// src/preview-api/modules/preview-web/docs-context/DocsContext.ts
var gn = class gn {
  constructor(e, t, o, n) {
    this.channel = e;
    this.store = t;
    this.renderStoryToElement = o;
    this.storyIdByName = /* @__PURE__ */ s((e) => {
      let t = this.nameToStoryId.get(e);
      if (t)
        return t;
      throw new Error(`No story found with that name: ${e}`);
    }, "storyIdByName");
    this.componentStories = /* @__PURE__ */ s(() => this.componentStoriesValue, "componentStories");
    this.componentStoriesFromCSFFile = /* @__PURE__ */ s((e) => this.store.componentStoriesFromCSFFile({ csfFile: e }), "componentStoriesFro\
mCSFFile");
    this.storyById = /* @__PURE__ */ s((e) => {
      if (!e) {
        if (!this.primaryStory)
          throw new Error(
            "No primary story defined for docs entry. Did you forget to use `<Meta>`?"
          );
        return this.primaryStory;
      }
      let t = this.storyIdToCSFFile.get(e);
      if (!t)
        throw new Error(`Called \`storyById\` for story that was never loaded: ${e}`);
      return this.store.storyFromCSFFile({ storyId: e, csfFile: t });
    }, "storyById");
    this.getStoryContext = /* @__PURE__ */ s((e) => ({
      ...this.store.getStoryContext(e),
      loaded: {},
      viewMode: "docs"
    }), "getStoryContext");
    this.loadStory = /* @__PURE__ */ s((e) => this.store.loadStory({ storyId: e }), "loadStory");
    this.componentStoriesValue = [], this.storyIdToCSFFile = /* @__PURE__ */ new Map(), this.exportToStory = /* @__PURE__ */ new Map(), this.
    exportsToCSFFile = /* @__PURE__ */ new Map(), this.nameToStoryId = /* @__PURE__ */ new Map(), this.attachedCSFFiles = /* @__PURE__ */ new Set(),
    n.forEach((a, l) => {
      this.referenceCSFFile(a);
    });
  }
  // This docs entry references this CSF file and can synchronously load the stories, as well
  // as reference them by module export. If the CSF is part of the "component" stories, they
  // can also be referenced by name and are in the componentStories list.
  referenceCSFFile(e) {
    this.exportsToCSFFile.set(e.moduleExports, e), this.exportsToCSFFile.set(e.moduleExports.default, e), this.store.componentStoriesFromCSFFile(
    { csfFile: e }).forEach((o) => {
      let n = e.stories[o.id];
      this.storyIdToCSFFile.set(n.id, e), this.exportToStory.set(n.moduleExport, o);
    });
  }
  attachCSFFile(e) {
    if (!this.exportsToCSFFile.has(e.moduleExports))
      throw new Error("Cannot attach a CSF file that has not been referenced");
    if (this.attachedCSFFiles.has(e))
      return;
    this.attachedCSFFiles.add(e), this.store.componentStoriesFromCSFFile({ csfFile: e }).forEach((o) => {
      this.nameToStoryId.set(o.name, o.id), this.componentStoriesValue.push(o), this.primaryStory || (this.primaryStory = o);
    });
  }
  referenceMeta(e, t) {
    let o = this.resolveModuleExport(e);
    if (o.type !== "meta")
      throw new Error(
        "<Meta of={} /> must reference a CSF file module export or meta export. Did you mistakenly reference your component instead of your \
CSF file?"
      );
    t && this.attachCSFFile(o.csfFile);
  }
  get projectAnnotations() {
    let { projectAnnotations: e } = this.store;
    if (!e)
      throw new Error("Can't get projectAnnotations from DocsContext before they are initialized");
    return e;
  }
  resolveAttachedModuleExportType(e) {
    if (e === "story") {
      if (!this.primaryStory)
        throw new Error(
          "No primary story attached to this docs file, did you forget to use <Meta of={} />?"
        );
      return { type: "story", story: this.primaryStory };
    }
    if (this.attachedCSFFiles.size === 0)
      throw new Error(
        "No CSF file attached to this docs file, did you forget to use <Meta of={} />?"
      );
    let t = Array.from(this.attachedCSFFiles)[0];
    if (e === "meta")
      return { type: "meta", csfFile: t };
    let { component: o } = t.meta;
    if (!o)
      throw new Error(
        "Attached CSF file does not defined a component, did you forget to export one?"
      );
    return { type: "component", component: o };
  }
  resolveModuleExport(e) {
    let t = this.exportsToCSFFile.get(e);
    if (t)
      return { type: "meta", csfFile: t };
    let o = this.exportToStory.get(e);
    return o ? { type: "story", story: o } : { type: "component", component: e };
  }
  resolveOf(e, t = []) {
    let o;
    if (["component", "meta", "story"].includes(e)) {
      let n = e;
      o = this.resolveAttachedModuleExportType(n);
    } else
      o = this.resolveModuleExport(e);
    if (t.length && !t.includes(o.type)) {
      let n = o.type === "component" ? "component or unknown" : o.type;
      throw new Error(w`Invalid value passed to the 'of' prop. The value was resolved to a '${n}' type but the only types for this block are: ${t.
      join(
        ", "
      )}.
        - Did you pass a component to the 'of' prop when the block only supports a story or a meta?
        - ... or vice versa?
        - Did you pass a story, CSF file or meta to the 'of' prop that is not indexed, ie. is not targeted by the 'stories' globs in the main configuration?`);
    }
    switch (o.type) {
      case "component":
        return {
          ...o,
          projectAnnotations: this.projectAnnotations
        };
      case "meta":
        return {
          ...o,
          preparedMeta: this.store.preparedMetaFromCSFFile({ csfFile: o.csfFile })
        };
      case "story":
      default:
        return o;
    }
  }
};
s(gn, "DocsContext");
var ce = gn;

// src/preview-api/modules/preview-web/render/CsfDocsRender.ts
var Sn = class Sn {
  constructor(e, t, o, n) {
    this.channel = e;
    this.store = t;
    this.entry = o;
    this.callbacks = n;
    this.type = "docs";
    this.subtype = "csf";
    this.torndown = !1;
    this.disableKeyListeners = !1;
    this.preparing = !1;
    this.id = o.id;
  }
  isPreparing() {
    return this.preparing;
  }
  async prepare() {
    this.preparing = !0;
    let { entryExports: e, csfFiles: t = [] } = await this.store.loadEntry(this.id);
    if (this.torndown)
      throw Se;
    let { importPath: o, title: n } = this.entry, a = this.store.processCSFFileWithCache(
      e,
      o,
      n
    ), l = Object.keys(a.stories)[0];
    this.story = this.store.storyFromCSFFile({ storyId: l, csfFile: a }), this.csfFiles = [a, ...t], this.preparing = !1;
  }
  isEqual(e) {
    return !!(this.id === e.id && this.story && this.story === e.story);
  }
  docsContext(e) {
    if (!this.csfFiles)
      throw new Error("Cannot render docs before preparing");
    let t = new ce(
      this.channel,
      this.store,
      e,
      this.csfFiles
    );
    return this.csfFiles.forEach((o) => t.attachCSFFile(o)), t;
  }
  async renderToElement(e, t) {
    if (!this.story || !this.csfFiles)
      throw new Error("Cannot render docs before preparing");
    let o = this.docsContext(t), { docs: n } = this.story.parameters || {};
    if (!n)
      throw new Error(
        "Cannot render a story in viewMode=docs if `@storybook/addon-docs` is not installed"
      );
    let a = await n.renderer(), { render: l } = a, c = /* @__PURE__ */ s(async () => {
      try {
        await l(o, n, e), this.channel.emit(nr, this.id);
      } catch (i) {
        this.callbacks.showException(i);
      }
    }, "renderDocs");
    return this.rerender = async () => c(), this.teardownRender = async ({ viewModeChanged: i }) => {
      !i || !e || a.unmount(e);
    }, c();
  }
  async teardown({ viewModeChanged: e } = {}) {
    this.teardownRender?.({ viewModeChanged: e }), this.torndown = !0;
  }
};
s(Sn, "CsfDocsRender");
var Fr = Sn;

// src/preview-api/modules/preview-web/render/MdxDocsRender.ts
var bn = class bn {
  constructor(e, t, o, n) {
    this.channel = e;
    this.store = t;
    this.entry = o;
    this.callbacks = n;
    this.type = "docs";
    this.subtype = "mdx";
    this.torndown = !1;
    this.disableKeyListeners = !1;
    this.preparing = !1;
    this.id = o.id;
  }
  isPreparing() {
    return this.preparing;
  }
  async prepare() {
    this.preparing = !0;
    let { entryExports: e, csfFiles: t = [] } = await this.store.loadEntry(this.id);
    if (this.torndown)
      throw Se;
    this.csfFiles = t, this.exports = e, this.preparing = !1;
  }
  isEqual(e) {
    return !!(this.id === e.id && this.exports && this.exports === e.exports);
  }
  docsContext(e) {
    if (!this.csfFiles)
      throw new Error("Cannot render docs before preparing");
    return new ce(
      this.channel,
      this.store,
      e,
      this.csfFiles
    );
  }
  async renderToElement(e, t) {
    if (!this.exports || !this.csfFiles || !this.store.projectAnnotations)
      throw new Error("Cannot render docs before preparing");
    let o = this.docsContext(t), { docs: n } = this.store.projectAnnotations.parameters || {};
    if (!n)
      throw new Error(
        "Cannot render a story in viewMode=docs if `@storybook/addon-docs` is not installed"
      );
    let a = { ...n, page: this.exports.default }, l = await n.renderer(), { render: c } = l, i = /* @__PURE__ */ s(async () => {
      try {
        await c(o, a, e), this.channel.emit(nr, this.id);
      } catch (p) {
        this.callbacks.showException(p);
      }
    }, "renderDocs");
    return this.rerender = async () => i(), this.teardownRender = async ({ viewModeChanged: p } = {}) => {
      !p || !e || (l.unmount(e), this.torndown = !0);
    }, i();
  }
  async teardown({ viewModeChanged: e } = {}) {
    this.teardownRender?.({ viewModeChanged: e }), this.torndown = !0;
  }
};
s(bn, "MdxDocsRender");
var Dr = bn;

// src/preview-api/modules/preview-web/PreviewWithSelection.tsx
var eu = globalThis;
function ru(r) {
  let e = r.composedPath && r.composedPath()[0] || r.target;
  return /input|textarea/i.test(e.tagName) || e.getAttribute("contenteditable") !== null;
}
s(ru, "focusInInput");
var ka = "attached-mdx", tu = "unattached-mdx";
function ou({ tags: r }) {
  return r?.includes(tu) || r?.includes(ka);
}
s(ou, "isMdxEntry");
function Tn(r) {
  return r.type === "story";
}
s(Tn, "isStoryRender");
function nu(r) {
  return r.type === "docs";
}
s(nu, "isDocsRender");
function su(r) {
  return nu(r) && r.subtype === "csf";
}
s(su, "isCsfDocsRender");
var En = class En extends Fe {
  constructor(t, o, n, a) {
    super(t, o, void 0, !1);
    this.importFn = t;
    this.getProjectAnnotations = o;
    this.selectionStore = n;
    this.view = a;
    this.initialize();
  }
  setupListeners() {
    super.setupListeners(), eu.onkeydown = this.onKeydown.bind(this), this.channel.on(Bt, this.onSetCurrentStory.bind(this)), this.channel.on(
    Jt, this.onUpdateQueryParams.bind(this)), this.channel.on(qt, this.onPreloadStories.bind(this));
  }
  async setInitialGlobals() {
    if (!this.storyStoreValue)
      throw new G({ methodName: "setInitialGlobals" });
    let { globals: t } = this.selectionStore.selectionSpecifier || {};
    t && this.storyStoreValue.userGlobals.updateFromPersisted(t), this.emitGlobals();
  }
  // If initialization gets as far as the story index, this function runs.
  async initializeWithStoryIndex(t) {
    return await super.initializeWithStoryIndex(t), this.selectSpecifiedStory();
  }
  // Use the selection specifier to choose a story, then render it
  async selectSpecifiedStory() {
    if (!this.storyStoreValue)
      throw new G({
        methodName: "selectSpecifiedStory"
      });
    if (this.selectionStore.selection) {
      await this.renderSelection();
      return;
    }
    if (!this.selectionStore.selectionSpecifier) {
      this.renderMissingStory();
      return;
    }
    let { storySpecifier: t, args: o } = this.selectionStore.selectionSpecifier, n = this.storyStoreValue.storyIndex.entryFromSpecifier(t);
    if (!n) {
      t === "*" ? this.renderStoryLoadingException(t, new Er()) : this.renderStoryLoadingException(
        t,
        new Rr({ storySpecifier: t.toString() })
      );
      return;
    }
    let { id: a, type: l } = n;
    this.selectionStore.setSelection({ storyId: a, viewMode: l }), this.channel.emit(Yt, this.selectionStore.selection), this.channel.emit(Wr,
    this.selectionStore.selection), await this.renderSelection({ persistedArgs: o });
  }
  // EVENT HANDLERS
  // This happens when a config file gets reloaded
  async onGetProjectAnnotationsChanged({
    getProjectAnnotations: t
  }) {
    await super.onGetProjectAnnotationsChanged({ getProjectAnnotations: t }), this.selectionStore.selection && this.renderSelection();
  }
  // This happens when a glob gets HMR-ed
  async onStoriesChanged({
    importFn: t,
    storyIndex: o
  }) {
    await super.onStoriesChanged({ importFn: t, storyIndex: o }), this.selectionStore.selection ? await this.renderSelection() : await this.
    selectSpecifiedStory();
  }
  onKeydown(t) {
    if (!this.storyRenders.find((o) => o.disableKeyListeners) && !ru(t)) {
      let { altKey: o, ctrlKey: n, metaKey: a, shiftKey: l, key: c, code: i, keyCode: p } = t;
      this.channel.emit(Ut, {
        event: { altKey: o, ctrlKey: n, metaKey: a, shiftKey: l, key: c, code: i, keyCode: p }
      });
    }
  }
  async onSetCurrentStory(t) {
    this.selectionStore.setSelection({ viewMode: "story", ...t }), await this.storeInitializationPromise, this.channel.emit(Wr, this.selectionStore.
    selection), this.renderSelection();
  }
  onUpdateQueryParams(t) {
    this.selectionStore.setQueryParams(t);
  }
  async onUpdateGlobals({ globals: t }) {
    let o = this.currentRender instanceof Ie && this.currentRender.story || void 0;
    super.onUpdateGlobals({ globals: t, currentStory: o }), (this.currentRender instanceof Dr || this.currentRender instanceof Fr) && await this.
    currentRender.rerender?.();
  }
  async onUpdateArgs({ storyId: t, updatedArgs: o }) {
    super.onUpdateArgs({ storyId: t, updatedArgs: o });
  }
  async onPreloadStories({ ids: t }) {
    await this.storeInitializationPromise, this.storyStoreValue && await Promise.allSettled(t.map((o) => this.storyStoreValue?.loadEntry(o)));
  }
  // RENDERING
  // We can either have:
  // - a story selected in "story" viewMode,
  //     in which case we render it to the root element, OR
  // - a story selected in "docs" viewMode,
  //     in which case we render the docsPage for that story
  async renderSelection({ persistedArgs: t } = {}) {
    let { renderToCanvas: o } = this;
    if (!this.storyStoreValue || !o)
      throw new G({ methodName: "renderSelection" });
    let { selection: n } = this.selectionStore;
    if (!n)
      throw new Error("Cannot call renderSelection as no selection was made");
    let { storyId: a } = n, l;
    try {
      l = await this.storyStoreValue.storyIdToEntry(a);
    } catch (g) {
      this.currentRender && await this.teardownRender(this.currentRender), this.renderStoryLoadingException(a, g);
      return;
    }
    let c = this.currentSelection?.storyId !== a, i = this.currentRender?.type !== l.type;
    l.type === "story" ? this.view.showPreparingStory({ immediate: i }) : this.view.showPreparingDocs({ immediate: i }), this.currentRender?.
    isPreparing() && await this.teardownRender(this.currentRender);
    let p;
    l.type === "story" ? p = new Ie(
      this.channel,
      this.storyStoreValue,
      o,
      this.mainStoryCallbacks(a),
      a,
      "story"
    ) : ou(l) ? p = new Dr(
      this.channel,
      this.storyStoreValue,
      l,
      this.mainStoryCallbacks(a)
    ) : p = new Fr(
      this.channel,
      this.storyStoreValue,
      l,
      this.mainStoryCallbacks(a)
    );
    let u = this.currentSelection;
    this.currentSelection = n;
    let d = this.currentRender;
    this.currentRender = p;
    try {
      await p.prepare();
    } catch (g) {
      d && await this.teardownRender(d), g !== Se && this.renderStoryLoadingException(a, g);
      return;
    }
    let y = !c && d && !p.isEqual(d);
    if (t && Tn(p) && (ie(!!p.story), this.storyStoreValue.args.updateFromPersisted(p.story, t)), d && !d.torndown && !c && !y && !i) {
      this.currentRender = d, this.channel.emit(Xt, a), this.view.showMain();
      return;
    }
    if (d && await this.teardownRender(d, { viewModeChanged: i }), u && (c || i) && this.channel.emit(Ht, a), Tn(p)) {
      ie(!!p.story);
      let {
        parameters: g,
        initialArgs: m,
        argTypes: S,
        unmappedArgs: h,
        initialGlobals: A,
        userGlobals: b,
        storyGlobals: E,
        globals: T
      } = this.storyStoreValue.getStoryContext(p.story);
      this.channel.emit($t, {
        id: a,
        parameters: g,
        initialArgs: m,
        argTypes: S,
        args: h
      }), this.channel.emit(xe, { userGlobals: b, storyGlobals: E, globals: T, initialGlobals: A });
    } else {
      let { parameters: g } = this.storyStoreValue.projectAnnotations, { initialGlobals: m, globals: S } = this.storyStoreValue.userGlobals;
      if (this.channel.emit(xe, {
        globals: S,
        initialGlobals: m,
        storyGlobals: {},
        userGlobals: S
      }), su(p) || p.entry.tags?.includes(ka)) {
        if (!p.csfFiles)
          throw new Tr({ storyId: a });
        ({ parameters: g } = this.storyStoreValue.preparedMetaFromCSFFile({
          csfFile: p.csfFiles[0]
        }));
      }
      this.channel.emit(Nt, {
        id: a,
        parameters: g
      });
    }
    Tn(p) ? (ie(!!p.story), this.storyRenders.push(p), this.currentRender.renderToElement(
      this.view.prepareForStory(p.story)
    )) : this.currentRender.renderToElement(
      this.view.prepareForDocs(),
      // This argument is used for docs, which is currently only compatible with HTMLElements
      this.renderStoryToElement.bind(this)
    );
  }
  async teardownRender(t, { viewModeChanged: o = !1 } = {}) {
    this.storyRenders = this.storyRenders.filter((n) => n !== t), await t?.teardown?.({ viewModeChanged: o });
  }
  // UTILITIES
  mainStoryCallbacks(t) {
    return {
      showStoryDuringRender: /* @__PURE__ */ s(() => this.view.showStoryDuringRender(), "showStoryDuringRender"),
      showMain: /* @__PURE__ */ s(() => this.view.showMain(), "showMain"),
      showError: /* @__PURE__ */ s((o) => this.renderError(t, o), "showError"),
      showException: /* @__PURE__ */ s((o) => this.renderException(t, o), "showException")
    };
  }
  renderPreviewEntryError(t, o) {
    super.renderPreviewEntryError(t, o), this.view.showErrorDisplay(o);
  }
  renderMissingStory() {
    this.view.showNoPreview(), this.channel.emit($r);
  }
  renderStoryLoadingException(t, o) {
    C.error(o), this.view.showErrorDisplay(o), this.channel.emit($r, t);
  }
  // renderException is used if we fail to render the story and it is uncaught by the app layer
  renderException(t, o) {
    let { name: n = "Error", message: a = String(o), stack: l } = o;
    this.channel.emit(Kt, { name: n, message: a, stack: l }), this.channel.emit(Ae, { newPhase: "errored", storyId: t }), this.view.showErrorDisplay(
    o), C.error(`Error rendering story '${t}':`), C.error(o);
  }
  // renderError is used by the various app layers to inform the user they have done something
  // wrong -- for instance returned the wrong thing from a story
  renderError(t, { title: o, description: n }) {
    C.error(`Error rendering story ${o}: ${n}`), this.channel.emit(zt, { title: o, description: n }), this.channel.emit(Ae, { newPhase: "err\
ored", storyId: t }), this.view.showErrorDisplay({
      message: o,
      stack: n
    });
  }
};
s(En, "PreviewWithSelection");
var De = En;

// src/preview-api/modules/preview-web/UrlStore.ts
var Nr = ue(Rt(), 1);

// src/preview-api/modules/preview-web/parseArgsParam.ts
var $a = ue(Rt(), 1);
var Wa = /^[a-zA-Z0-9 _-]*$/, Ya = /^-?[0-9]+(\.[0-9]+)?$/, Iu = /^#([a-f0-9]{3,4}|[a-f0-9]{6}|[a-f0-9]{8})$/i, Ka = /^(rgba?|hsla?)\(([0-9]{1,3}),\s?([0-9]{1,3})%?,\s?([0-9]{1,3})%?,?\s?([0-9](\.[0-9]{1,2})?)?\)$/i,
Pn = /* @__PURE__ */ s((r = "", e) => r === null || r === "" || !Wa.test(r) ? !1 : e == null || e instanceof Date || typeof e == "number" ||
typeof e == "boolean" ? !0 : typeof e == "string" ? Wa.test(e) || Ya.test(e) || Iu.test(e) || Ka.test(e) : Array.isArray(e) ? e.every((t) => Pn(
r, t)) : z(e) ? Object.entries(e).every(([t, o]) => Pn(t, o)) : !1, "validateArgs"), Fu = {
  delimiter: ";",
  // we're parsing a single query param
  nesting: !0,
  arrayRepeat: !0,
  arrayRepeatSyntax: "bracket",
  nestingSyntax: "js",
  // objects are encoded using dot notation
  valueDeserializer(r) {
    if (r.startsWith("!")) {
      if (r === "!undefined")
        return;
      if (r === "!null")
        return null;
      if (r === "!true")
        return !0;
      if (r === "!false")
        return !1;
      if (r.startsWith("!date(") && r.endsWith(")"))
        return new Date(r.replaceAll(" ", "+").slice(6, -1));
      if (r.startsWith("!hex(") && r.endsWith(")"))
        return `#${r.slice(5, -1)}`;
      let e = r.slice(1).match(Ka);
      if (e)
        return r.startsWith("!rgba") || r.startsWith("!RGBA") ? `${e[1]}(${e[2]}, ${e[3]}, ${e[4]}, ${e[5]})` : r.startsWith("!hsla") || r.startsWith(
        "!HSLA") ? `${e[1]}(${e[2]}, ${e[3]}%, ${e[4]}%, ${e[5]})` : r.startsWith("!rgb") || r.startsWith("!RGB") ? `${e[1]}(${e[2]}, ${e[3]}\
, ${e[4]})` : `${e[1]}(${e[2]}, ${e[3]}%, ${e[4]}%)`;
    }
    return Ya.test(r) ? Number(r) : r;
  }
}, Cn = /* @__PURE__ */ s((r) => {
  let e = r.split(";").map((t) => t.replace("=", "~").replace(":", "="));
  return Object.entries((0, $a.parse)(e.join(";"), Fu)).reduce((t, [o, n]) => Pn(o, n) ? Object.assign(t, { [o]: n }) : (L.warn(w`
      Omitted potentially unsafe URL args.

      More info: https://storybook.js.org/docs/writing-stories/args#setting-args-through-the-url
    `), t), {});
}, "parseArgsParam");

// src/preview-api/modules/preview-web/UrlStore.ts
var { history: Xa, document: be } = R;
function Du(r) {
  let e = (r || "").match(/^\/story\/(.+)/);
  if (!e)
    throw new Error(`Invalid path '${r}',  must start with '/story/'`);
  return e[1];
}
s(Du, "pathToId");
var Ja = /* @__PURE__ */ s(({
  selection: r,
  extraParams: e
}) => {
  let t = be?.location.search.slice(1), { path: o, selectedKind: n, selectedStory: a, ...l } = (0, Nr.parse)(t);
  return `?${(0, Nr.stringify)({
    ...l,
    ...e,
    ...r && { id: r.storyId, viewMode: r.viewMode }
  })}`;
}, "getQueryString"), ku = /* @__PURE__ */ s((r) => {
  if (!r)
    return;
  let e = Ja({ selection: r }), { hash: t = "" } = be.location;
  be.title = r.storyId, Xa.replaceState({}, "", `${be.location.pathname}${e}${t}`);
}, "setPath"), Nu = /* @__PURE__ */ s((r) => r != null && typeof r == "object" && Array.isArray(r) === !1, "isObject"), kr = /* @__PURE__ */ s(
(r) => {
  if (r !== void 0) {
    if (typeof r == "string")
      return r;
    if (Array.isArray(r))
      return kr(r[0]);
    if (Nu(r))
      return kr(
        Object.values(r).filter(Boolean)
      );
  }
}, "getFirstString"), Lu = /* @__PURE__ */ s(() => {
  if (typeof be < "u") {
    let r = be.location.search.slice(1), e = (0, Nr.parse)(r), t = typeof e.args == "string" ? Cn(e.args) : void 0, o = typeof e.globals == "\
string" ? Cn(e.globals) : void 0, n = kr(e.viewMode);
    (typeof n != "string" || !n.match(/docs|story/)) && (n = "story");
    let a = kr(e.path), l = a ? Du(a) : kr(e.id);
    if (l)
      return { storySpecifier: l, args: t, globals: o, viewMode: n };
  }
  return null;
}, "getSelectionSpecifierFromPath"), On = class On {
  constructor() {
    this.selectionSpecifier = Lu();
  }
  setSelection(e) {
    this.selection = e, ku(this.selection);
  }
  setQueryParams(e) {
    let t = Ja({ extraParams: e }), { hash: o = "" } = be.location;
    Xa.replaceState({}, "", `${be.location.pathname}${t}${o}`);
  }
};
s(On, "UrlStore");
var Le = On;

// src/preview-api/modules/preview-web/WebView.ts
var Ci = ue(wi(), 1), Oi = ue(Rt(), 1);
var { document: H } = R, vi = 100, Ii = /* @__PURE__ */ ((a) => (a.MAIN = "MAIN", a.NOPREVIEW = "NOPREVIEW", a.PREPARING_STORY = "PREPARING_\
STORY", a.PREPARING_DOCS = "PREPARING_DOCS", a.ERROR = "ERROR", a))(Ii || {}), jn = {
  PREPARING_STORY: "sb-show-preparing-story",
  PREPARING_DOCS: "sb-show-preparing-docs",
  MAIN: "sb-show-main",
  NOPREVIEW: "sb-show-nopreview",
  ERROR: "sb-show-errordisplay"
}, Mn = {
  centered: "sb-main-centered",
  fullscreen: "sb-main-fullscreen",
  padded: "sb-main-padded"
}, Pi = new Ci.default({
  escapeXML: !0
}), qn = class qn {
  constructor() {
    this.testing = !1;
    if (typeof H < "u") {
      let { __SPECIAL_TEST_PARAMETER__: e } = (0, Oi.parse)(H.location.search.slice(1));
      switch (e) {
        case "preparing-story": {
          this.showPreparingStory(), this.testing = !0;
          break;
        }
        case "preparing-docs": {
          this.showPreparingDocs(), this.testing = !0;
          break;
        }
        default:
      }
    }
  }
  // Get ready to render a story, returning the element to render to
  prepareForStory(e) {
    return this.showStory(), this.applyLayout(e.parameters.layout), H.documentElement.scrollTop = 0, H.documentElement.scrollLeft = 0, this.
    storyRoot();
  }
  storyRoot() {
    return H.getElementById("storybook-root");
  }
  prepareForDocs() {
    return this.showMain(), this.showDocs(), this.applyLayout("fullscreen"), H.documentElement.scrollTop = 0, H.documentElement.scrollLeft =
    0, this.docsRoot();
  }
  docsRoot() {
    return H.getElementById("storybook-docs");
  }
  applyLayout(e = "padded") {
    if (e === "none") {
      H.body.classList.remove(this.currentLayoutClass), this.currentLayoutClass = null;
      return;
    }
    this.checkIfLayoutExists(e);
    let t = Mn[e];
    H.body.classList.remove(this.currentLayoutClass), H.body.classList.add(t), this.currentLayoutClass = t;
  }
  checkIfLayoutExists(e) {
    Mn[e] || C.warn(
      w`
          The desired layout: ${e} is not a valid option.
          The possible options are: ${Object.keys(Mn).join(", ")}, none.
        `
    );
  }
  showMode(e) {
    clearTimeout(this.preparingTimeout), Object.keys(Ii).forEach((t) => {
      t === e ? H.body.classList.add(jn[t]) : H.body.classList.remove(jn[t]);
    });
  }
  showErrorDisplay({ message: e = "", stack: t = "" }) {
    let o = e, n = t, a = e.split(`
`);
    a.length > 1 && ([o] = a, n = a.slice(1).join(`
`).replace(/^\n/, "")), H.getElementById("error-message").innerHTML = Pi.toHtml(o), H.getElementById("error-stack").innerHTML = Pi.toHtml(n),
    this.showMode("ERROR");
  }
  showNoPreview() {
    this.testing || (this.showMode("NOPREVIEW"), this.storyRoot()?.setAttribute("hidden", "true"), this.docsRoot()?.setAttribute("hidden", "\
true"));
  }
  showPreparingStory({ immediate: e = !1 } = {}) {
    clearTimeout(this.preparingTimeout), e ? this.showMode("PREPARING_STORY") : this.preparingTimeout = setTimeout(
      () => this.showMode("PREPARING_STORY"),
      vi
    );
  }
  showPreparingDocs({ immediate: e = !1 } = {}) {
    clearTimeout(this.preparingTimeout), e ? this.showMode("PREPARING_DOCS") : this.preparingTimeout = setTimeout(() => this.showMode("PREPA\
RING_DOCS"), vi);
  }
  showMain() {
    this.showMode("MAIN");
  }
  showDocs() {
    this.storyRoot().setAttribute("hidden", "true"), this.docsRoot().removeAttribute("hidden");
  }
  showStory() {
    this.docsRoot().setAttribute("hidden", "true"), this.storyRoot().removeAttribute("hidden");
  }
  showStoryDuringRender() {
    H.body.classList.add(jn.MAIN);
  }
};
s(qn, "WebView");
var Me = qn;

// src/preview-api/modules/preview-web/PreviewWeb.tsx
var Un = class Un extends De {
  constructor(t, o) {
    super(t, o, new Le(), new Me());
    this.importFn = t;
    this.getProjectAnnotations = o;
    R.__STORYBOOK_PREVIEW__ = this;
  }
};
s(Un, "PreviewWeb");
var jr = Un;

// src/preview-api/modules/preview-web/simulate-pageload.ts
var { document: qe } = R, Sf = [
  "application/javascript",
  "application/ecmascript",
  "application/x-ecmascript",
  "application/x-javascript",
  "text/ecmascript",
  "text/javascript",
  "text/javascript1.0",
  "text/javascript1.1",
  "text/javascript1.2",
  "text/javascript1.3",
  "text/javascript1.4",
  "text/javascript1.5",
  "text/jscript",
  "text/livescript",
  "text/x-ecmascript",
  "text/x-javascript",
  // Support modern javascript
  "module"
], bf = "script", Fi = "scripts-root";
function Mr() {
  let r = qe.createEvent("Event");
  r.initEvent("DOMContentLoaded", !0, !0), qe.dispatchEvent(r);
}
s(Mr, "simulateDOMContentLoaded");
function Tf(r, e, t) {
  let o = qe.createElement("script");
  o.type = r.type === "module" ? "module" : "text/javascript", r.src ? (o.onload = e, o.onerror = e, o.src = r.src) : o.textContent = r.innerText,
  t ? t.appendChild(o) : qe.head.appendChild(o), r.parentNode.removeChild(r), r.src || e();
}
s(Tf, "insertScript");
function Di(r, e, t = 0) {
  r[t](() => {
    t++, t === r.length ? e() : Di(r, e, t);
  });
}
s(Di, "insertScriptsSequentially");
function Bn(r) {
  let e = qe.getElementById(Fi);
  e ? e.innerHTML = "" : (e = qe.createElement("div"), e.id = Fi, qe.body.appendChild(e));
  let t = Array.from(r.querySelectorAll(bf));
  if (t.length) {
    let o = [];
    t.forEach((n) => {
      let a = n.getAttribute("type");
      (!a || Sf.includes(a)) && o.push((l) => Tf(n, l, e));
    }), o.length && Di(o, Mr, void 0);
  } else
    Mr();
}
s(Bn, "simulatePageLoad");

// src/preview/globals/runtime.ts
var ki = {
  "@storybook/global": It,
  "storybook/internal/channels": fr,
  "@storybook/channels": fr,
  "@storybook/core/channels": fr,
  "storybook/internal/client-logger": cr,
  "@storybook/client-logger": cr,
  "@storybook/core/client-logger": cr,
  "storybook/internal/core-events": fe,
  "@storybook/core-events": fe,
  "@storybook/core/core-events": fe,
  "storybook/internal/preview-errors": vr,
  "@storybook/core-events/preview-errors": vr,
  "@storybook/core/preview-errors": vr,
  "storybook/internal/preview-api": qr,
  "@storybook/preview-api": qr,
  "@storybook/core/preview-api": qr,
  "storybook/internal/types": yr,
  "@storybook/types": yr,
  "@storybook/core/types": yr
};

// src/preview/utils.ts
var Li = ue(Ni(), 1);
var Hn;
function Ef() {
  return Hn || (Hn = new Li.default(R.navigator?.userAgent).getBrowserInfo()), Hn;
}
s(Ef, "getBrowserInfo");
function ji(r) {
  return r.browserInfo = Ef(), r;
}
s(ji, "prepareForTelemetry");

// src/preview/runtime.ts
zn.forEach((r) => {
  R[eo[r]] = ki[r];
});
R.sendTelemetryError = (r) => {
  R.__STORYBOOK_ADDONS_CHANNEL__.emit(Qt, ji(r));
};
R.addEventListener("error", (r) => {
  let e = r.error || r;
  e.fromStorybook && R.sendTelemetryError(e);
});
R.addEventListener("unhandledrejection", ({ reason: r }) => {
  r.fromStorybook && R.sendTelemetryError(r);
});
