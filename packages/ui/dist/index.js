"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
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
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../node_modules/tsup/assets/cjs_shims.js
var init_cjs_shims = __esm({
  "../../node_modules/tsup/assets/cjs_shims.js"() {
  }
});

// src/index.tsx
var src_exports = {};
__export(src_exports, {
  Button: () => Button,
  Input: () => Input,
  Loader: () => Loader,
  ProgressBar: () => ProgressBar,
  RadialProgressBar: () => RadialProgressBar,
  Spinner: () => Spinner,
  TextArea: () => TextArea,
  ToggleSwitch: () => ToggleSwitch
});
module.exports = __toCommonJS(src_exports);
init_cjs_shims();

// src/button/button.tsx
init_cjs_shims();
var React = __toESM(require("react"));

// src/button/helper.tsx
init_cjs_shims();
var buttonStyling = {
  primary: {
    default: `text-white bg-custom-primary-100`,
    hover: `hover:bg-custom-primary-200`,
    pressed: `focus:text-custom-brand-40 focus:bg-custom-primary-200`,
    disabled: `cursor-not-allowed !bg-custom-primary-60 hover:bg-custom-primary-60`
  },
  "accent-primary": {
    default: `bg-custom-primary-10 text-custom-primary-100`,
    hover: `hover:bg-custom-primary-20 hover:text-custom-primary-200`,
    pressed: `focus:bg-custom-primary-20`,
    disabled: `cursor-not-allowed !text-custom-primary-60`
  },
  "outline-primary": {
    default: `text-custom-primary-100 bg-custom-background-100 border border-custom-primary-100`,
    hover: `hover:border-custom-primary-80 hover:bg-custom-primary-10`,
    pressed: `focus:text-custom-primary-80 focus:bg-custom-primary-10 focus:border-custom-primary-80`,
    disabled: `cursor-not-allowed !text-custom-primary-60 !border-custom-primary-60 `
  },
  "neutral-primary": {
    default: `text-custom-text-200 bg-custom-background-100 border border-custom-border-200`,
    hover: `hover:bg-custom-background-90`,
    pressed: `focus:text-custom-text-300 focus:bg-custom-background-90`,
    disabled: `cursor-not-allowed !text-custom-text-400`
  },
  "link-primary": {
    default: `text-custom-primary-100 bg-custom-background-100`,
    hover: `hover:text-custom-primary-200`,
    pressed: `focus:text-custom-primary-80 `,
    disabled: `cursor-not-allowed !text-custom-primary-60`
  },
  danger: {
    default: `text-white bg-red-500`,
    hover: ` hover:bg-red-600`,
    pressed: `focus:text-red-200 focus:bg-red-600`,
    disabled: `cursor-not-allowed !bg-red-300`
  },
  "accent-danger": {
    default: `text-red-500 bg-red-50`,
    hover: `hover:text-red-600 hover:bg-red-100`,
    pressed: `focus:text-red-500 focus:bg-red-100`,
    disabled: `cursor-not-allowed !text-red-300`
  },
  "outline-danger": {
    default: `text-red-500 bg-custom-background-100 border border-red-500`,
    hover: `hover:text-red-400 hover:border-red-400`,
    pressed: `focus:text-red-400 focus:border-red-400`,
    disabled: `cursor-not-allowed !text-red-300 !border-red-300`
  },
  "link-danger": {
    default: `text-red-500 bg-custom-background-100`,
    hover: `hover:text-red-400`,
    pressed: `focus:text-red-400`,
    disabled: `cursor-not-allowed !text-red-300`
  },
  "tertiary-danger": {
    default: `text-red-500 bg-custom-background-100 border border-red-200`,
    hover: `hover:bg-red-50 hover:border-red-300`,
    pressed: `focus:text-red-400`,
    disabled: `cursor-not-allowed !text-red-300`
  }
};
var getButtonStyling = (variant, size, disabled = false) => {
  let _variant = ``;
  const currentVariant = buttonStyling[variant];
  _variant = `${currentVariant.default} ${disabled ? currentVariant.disabled : currentVariant.hover} ${currentVariant.pressed}`;
  let _size = ``;
  if (size === "sm")
    _size = "px-3 py-1.5 font-medium text-xs rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline" /* sm */;
  if (size === "md")
    _size = "px-4 py-1.5 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline" /* md */;
  if (size === "lg")
    _size = "px-5 py-2 font-medium text-base rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline" /* lg */;
  return `${_variant} ${_size}`;
};
var getIconStyling = (size) => {
  let icon = ``;
  if (size === "sm")
    icon = "h-3 w-3 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0" /* sm */;
  if (size === "md")
    icon = "h-3.5 w-3.5 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0" /* md */;
  if (size === "lg")
    icon = "h-4 w-4 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0" /* lg */;
  return icon;
};

// src/button/button.tsx
var Button = React.forwardRef(
  (props, ref) => {
    const {
      variant = "primary",
      size = "md",
      className = "",
      type = "button",
      loading = false,
      disabled = false,
      prependIcon = null,
      appendIcon = null,
      children,
      ...rest
    } = props;
    const buttonStyle = getButtonStyling(variant, size, disabled || loading);
    const buttonIconStyle = getIconStyling(size);
    return /* @__PURE__ */ React.createElement("button", {
      ref,
      type,
      className: `${buttonStyle} ${className}`,
      disabled: disabled || loading,
      ...rest
    }, prependIcon && /* @__PURE__ */ React.createElement("div", {
      className: buttonIconStyle
    }, React.cloneElement(prependIcon, { "stroke-width": 2 })), children, appendIcon && /* @__PURE__ */ React.createElement("div", {
      className: buttonIconStyle
    }, React.cloneElement(appendIcon, { "stroke-width": 2 })));
  }
);
Button.displayName = "plane-ui-button";

// src/button/toggle-switch.tsx
init_cjs_shims();
var React2 = __toESM(require("react"));

// ../../node_modules/@headlessui/react/dist/hooks/use-iso-morphic-effect.js
init_cjs_shims();
var import_react = require("react");

// ../../node_modules/@headlessui/react/dist/utils/env.js
init_cjs_shims();
var i = Object.defineProperty;
var d = (t7, e, n) => e in t7 ? i(t7, e, { enumerable: true, configurable: true, writable: true, value: n }) : t7[e] = n;
var r = (t7, e, n) => (d(t7, typeof e != "symbol" ? e + "" : e, n), n);
var o = class {
  constructor() {
    r(this, "current", this.detect());
    r(this, "handoffState", "pending");
    r(this, "currentId", 0);
  }
  set(e) {
    this.current !== e && (this.handoffState = "pending", this.currentId = 0, this.current = e);
  }
  reset() {
    this.set(this.detect());
  }
  nextId() {
    return ++this.currentId;
  }
  get isServer() {
    return this.current === "server";
  }
  get isClient() {
    return this.current === "client";
  }
  detect() {
    return typeof window == "undefined" || typeof document == "undefined" ? "server" : "client";
  }
  handoff() {
    this.handoffState === "pending" && (this.handoffState = "complete");
  }
  get isHandoffComplete() {
    return this.handoffState === "complete";
  }
};
var s = new o();

// ../../node_modules/@headlessui/react/dist/hooks/use-iso-morphic-effect.js
var l = (e, f4) => {
  s.isServer ? (0, import_react.useEffect)(e, f4) : (0, import_react.useLayoutEffect)(e, f4);
};

// ../../node_modules/@headlessui/react/dist/hooks/use-latest-value.js
init_cjs_shims();
var import_react2 = require("react");
function s2(e) {
  let r3 = (0, import_react2.useRef)(e);
  return l(() => {
    r3.current = e;
  }, [e]), r3;
}

// ../../node_modules/@headlessui/react/dist/hooks/use-disposables.js
init_cjs_shims();
var import_react3 = require("react");

// ../../node_modules/@headlessui/react/dist/utils/disposables.js
init_cjs_shims();

// ../../node_modules/@headlessui/react/dist/utils/micro-task.js
init_cjs_shims();
function t3(e) {
  typeof queueMicrotask == "function" ? queueMicrotask(e) : Promise.resolve().then(e).catch((o9) => setTimeout(() => {
    throw o9;
  }));
}

// ../../node_modules/@headlessui/react/dist/utils/disposables.js
function o2() {
  let n = [], r3 = { addEventListener(e, t7, s7, a3) {
    return e.addEventListener(t7, s7, a3), r3.add(() => e.removeEventListener(t7, s7, a3));
  }, requestAnimationFrame(...e) {
    let t7 = requestAnimationFrame(...e);
    return r3.add(() => cancelAnimationFrame(t7));
  }, nextFrame(...e) {
    return r3.requestAnimationFrame(() => r3.requestAnimationFrame(...e));
  }, setTimeout(...e) {
    let t7 = setTimeout(...e);
    return r3.add(() => clearTimeout(t7));
  }, microTask(...e) {
    let t7 = { current: true };
    return t3(() => {
      t7.current && e[0]();
    }), r3.add(() => {
      t7.current = false;
    });
  }, style(e, t7, s7) {
    let a3 = e.style.getPropertyValue(t7);
    return Object.assign(e.style, { [t7]: s7 }), this.add(() => {
      Object.assign(e.style, { [t7]: a3 });
    });
  }, group(e) {
    let t7 = o2();
    return e(t7), this.add(() => t7.dispose());
  }, add(e) {
    return n.push(e), () => {
      let t7 = n.indexOf(e);
      if (t7 >= 0)
        for (let s7 of n.splice(t7, 1))
          s7();
    };
  }, dispose() {
    for (let e of n.splice(0))
      e();
  } };
  return r3;
}

// ../../node_modules/@headlessui/react/dist/hooks/use-disposables.js
function p() {
  let [e] = (0, import_react3.useState)(o2);
  return (0, import_react3.useEffect)(() => () => e.dispose(), [e]), e;
}

// ../../node_modules/@headlessui/react/dist/hooks/use-event.js
init_cjs_shims();
var import_react4 = __toESM(require("react"), 1);
var o4 = function(t7) {
  let e = s2(t7);
  return import_react4.default.useCallback((...r3) => e.current(...r3), [e]);
};

// ../../node_modules/@headlessui/react/dist/hooks/use-id.js
init_cjs_shims();
var import_react5 = __toESM(require("react"), 1);

// ../../node_modules/@headlessui/react/dist/hooks/use-server-handoff-complete.js
init_cjs_shims();
var t4 = __toESM(require("react"), 1);
function s4() {
  let r3 = typeof document == "undefined";
  return "useSyncExternalStore" in t4 ? ((o9) => o9.useSyncExternalStore)(t4)(() => () => {
  }, () => false, () => !r3) : false;
}
function l2() {
  let r3 = s4(), [e, n] = t4.useState(s.isHandoffComplete);
  return e && s.isHandoffComplete === false && n(false), t4.useEffect(() => {
    e !== true && n(true);
  }, [e]), t4.useEffect(() => s.handoff(), []), r3 ? false : e;
}

// ../../node_modules/@headlessui/react/dist/hooks/use-id.js
var o5;
var I = (o5 = import_react5.default.useId) != null ? o5 : function() {
  let n = l2(), [e, u5] = import_react5.default.useState(n ? () => s.nextId() : null);
  return l(() => {
    e === null && u5(s.nextId());
  }, [e]), e != null ? "" + e : void 0;
};

// ../../node_modules/@headlessui/react/dist/utils/match.js
init_cjs_shims();
function u(r3, n, ...a3) {
  if (r3 in n) {
    let e = n[r3];
    return typeof e == "function" ? e(...a3) : e;
  }
  let t7 = new Error(`Tried to handle "${r3}" but there is no handler defined. Only defined handlers are: ${Object.keys(n).map((e) => `"${e}"`).join(", ")}.`);
  throw Error.captureStackTrace && Error.captureStackTrace(t7, u), t7;
}

// ../../node_modules/@headlessui/react/dist/hooks/use-resolve-button-type.js
init_cjs_shims();
var import_react6 = require("react");
function i2(t7) {
  var n;
  if (t7.type)
    return t7.type;
  let e = (n = t7.as) != null ? n : "button";
  if (typeof e == "string" && e.toLowerCase() === "button")
    return "button";
}
function s5(t7, e) {
  let [n, u5] = (0, import_react6.useState)(() => i2(t7));
  return l(() => {
    u5(i2(t7));
  }, [t7.type, t7.as]), l(() => {
    n || e.current && e.current instanceof HTMLButtonElement && !e.current.hasAttribute("type") && u5("button");
  }, [n, e]), n;
}

// ../../node_modules/@headlessui/react/dist/hooks/use-sync-refs.js
init_cjs_shims();
var import_react7 = require("react");
var u2 = Symbol();
function y(...t7) {
  let n = (0, import_react7.useRef)(t7);
  (0, import_react7.useEffect)(() => {
    n.current = t7;
  }, [t7]);
  let c5 = o4((e) => {
    for (let o9 of n.current)
      o9 != null && (typeof o9 == "function" ? o9(e) : o9.current = e);
  });
  return t7.every((e) => e == null || (e == null ? void 0 : e[u2])) ? void 0 : c5;
}

// ../../node_modules/@headlessui/react/dist/utils/render.js
init_cjs_shims();
var import_react8 = require("react");

// ../../node_modules/@headlessui/react/dist/utils/class-names.js
init_cjs_shims();
function t6(...r3) {
  return Array.from(new Set(r3.flatMap((n) => typeof n == "string" ? n.split(" ") : []))).filter(Boolean).join(" ");
}

// ../../node_modules/@headlessui/react/dist/utils/render.js
var S = ((a3) => (a3[a3.None = 0] = "None", a3[a3.RenderStrategy = 1] = "RenderStrategy", a3[a3.Static = 2] = "Static", a3))(S || {});
var j = ((e) => (e[e.Unmount = 0] = "Unmount", e[e.Hidden = 1] = "Hidden", e))(j || {});
function X({ ourProps: r3, theirProps: t7, slot: e, defaultTag: a3, features: s7, visible: n = true, name: f4 }) {
  let o9 = N(t7, r3);
  if (n)
    return c2(o9, e, a3, f4);
  let u5 = s7 != null ? s7 : 0;
  if (u5 & 2) {
    let { static: l5 = false, ...p4 } = o9;
    if (l5)
      return c2(p4, e, a3, f4);
  }
  if (u5 & 1) {
    let { unmount: l5 = true, ...p4 } = o9;
    return u(l5 ? 0 : 1, { [0]() {
      return null;
    }, [1]() {
      return c2({ ...p4, hidden: true, style: { display: "none" } }, e, a3, f4);
    } });
  }
  return c2(o9, e, a3, f4);
}
function c2(r3, t7 = {}, e, a3) {
  let { as: s7 = e, children: n, refName: f4 = "ref", ...o9 } = g(r3, ["unmount", "static"]), u5 = r3.ref !== void 0 ? { [f4]: r3.ref } : {}, l5 = typeof n == "function" ? n(t7) : n;
  "className" in o9 && o9.className && typeof o9.className == "function" && (o9.className = o9.className(t7));
  let p4 = {};
  if (t7) {
    let i6 = false, m3 = [];
    for (let [y4, d4] of Object.entries(t7))
      typeof d4 == "boolean" && (i6 = true), d4 === true && m3.push(y4);
    i6 && (p4["data-headlessui-state"] = m3.join(" "));
  }
  if (s7 === import_react8.Fragment && Object.keys(R(o9)).length > 0) {
    if (!(0, import_react8.isValidElement)(l5) || Array.isArray(l5) && l5.length > 1)
      throw new Error(['Passing props on "Fragment"!', "", `The current component <${a3} /> is rendering a "Fragment".`, "However we need to passthrough the following props:", Object.keys(o9).map((d4) => `  - ${d4}`).join(`
`), "", "You can apply a few solutions:", ['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".', "Render a single element as the child so that we can forward the props onto that element."].map((d4) => `  - ${d4}`).join(`
`)].join(`
`));
    let i6 = l5.props, m3 = typeof (i6 == null ? void 0 : i6.className) == "function" ? (...d4) => t6(i6 == null ? void 0 : i6.className(...d4), o9.className) : t6(i6 == null ? void 0 : i6.className, o9.className), y4 = m3 ? { className: m3 } : {};
    return (0, import_react8.cloneElement)(l5, Object.assign({}, N(l5.props, R(g(o9, ["ref"]))), p4, u5, w(l5.ref, u5.ref), y4));
  }
  return (0, import_react8.createElement)(s7, Object.assign({}, g(o9, ["ref"]), s7 !== import_react8.Fragment && u5, s7 !== import_react8.Fragment && p4), l5);
}
function w(...r3) {
  return { ref: r3.every((t7) => t7 == null) ? void 0 : (t7) => {
    for (let e of r3)
      e != null && (typeof e == "function" ? e(t7) : e.current = t7);
  } };
}
function N(...r3) {
  var a3;
  if (r3.length === 0)
    return {};
  if (r3.length === 1)
    return r3[0];
  let t7 = {}, e = {};
  for (let s7 of r3)
    for (let n in s7)
      n.startsWith("on") && typeof s7[n] == "function" ? ((a3 = e[n]) != null || (e[n] = []), e[n].push(s7[n])) : t7[n] = s7[n];
  if (t7.disabled || t7["aria-disabled"])
    return Object.assign(t7, Object.fromEntries(Object.keys(e).map((s7) => [s7, void 0])));
  for (let s7 in e)
    Object.assign(t7, { [s7](n, ...f4) {
      let o9 = e[s7];
      for (let u5 of o9) {
        if ((n instanceof Event || (n == null ? void 0 : n.nativeEvent) instanceof Event) && n.defaultPrevented)
          return;
        u5(n, ...f4);
      }
    } });
  return t7;
}
function D(r3) {
  var t7;
  return Object.assign((0, import_react8.forwardRef)(r3), { displayName: (t7 = r3.displayName) != null ? t7 : r3.name });
}
function R(r3) {
  let t7 = Object.assign({}, r3);
  for (let e in t7)
    t7[e] === void 0 && delete t7[e];
  return t7;
}
function g(r3, t7 = []) {
  let e = Object.assign({}, r3);
  for (let a3 of t7)
    a3 in e && delete e[a3];
  return e;
}

// ../../node_modules/@headlessui/react/dist/utils/bugs.js
init_cjs_shims();
function r2(n) {
  let e = n.parentElement, l5 = null;
  for (; e && !(e instanceof HTMLFieldSetElement); )
    e instanceof HTMLLegendElement && (l5 = e), e = e.parentElement;
  let t7 = (e == null ? void 0 : e.getAttribute("disabled")) === "";
  return t7 && i4(l5) ? false : t7;
}
function i4(n) {
  if (!n)
    return false;
  let e = n.previousElementSibling;
  for (; e !== null; ) {
    if (e instanceof HTMLLegendElement)
      return false;
    e = e.previousElementSibling;
  }
  return true;
}

// ../../node_modules/@headlessui/react/dist/utils/form.js
init_cjs_shims();
function p2(i6) {
  var t7, r3;
  let s7 = (t7 = i6 == null ? void 0 : i6.form) != null ? t7 : i6.closest("form");
  if (s7) {
    for (let n of s7.elements)
      if (n !== i6 && (n.tagName === "INPUT" && n.type === "submit" || n.tagName === "BUTTON" && n.type === "submit" || n.nodeName === "INPUT" && n.type === "image")) {
        n.click();
        return;
      }
    (r3 = s7.requestSubmit) == null || r3.call(s7);
  }
}

// ../../node_modules/@headlessui/react/dist/internal/hidden.js
init_cjs_shims();
var a2 = "div";
var p3 = ((e) => (e[e.None = 1] = "None", e[e.Focusable = 2] = "Focusable", e[e.Hidden = 4] = "Hidden", e))(p3 || {});
function s6(t7, o9) {
  let { features: n = 1, ...e } = t7, d4 = { ref: o9, "aria-hidden": (n & 2) === 2 ? true : void 0, style: { position: "fixed", top: 1, left: 1, width: 1, height: 0, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: "0", ...(n & 4) === 4 && (n & 2) !== 2 && { display: "none" } } };
  return X({ ourProps: d4, theirProps: e, slot: {}, defaultTag: a2, name: "Hidden" });
}
var c3 = D(s6);

// ../../node_modules/@headlessui/react/dist/components/keyboard.js
init_cjs_shims();
var o7 = ((r3) => (r3.Space = " ", r3.Enter = "Enter", r3.Escape = "Escape", r3.Backspace = "Backspace", r3.Delete = "Delete", r3.ArrowLeft = "ArrowLeft", r3.ArrowUp = "ArrowUp", r3.ArrowRight = "ArrowRight", r3.ArrowDown = "ArrowDown", r3.Home = "Home", r3.End = "End", r3.PageUp = "PageUp", r3.PageDown = "PageDown", r3.Tab = "Tab", r3))(o7 || {});

// ../../node_modules/@headlessui/react/dist/hooks/use-controllable.js
init_cjs_shims();
var import_react9 = require("react");
function T2(l5, r3, c5) {
  let [i6, s7] = (0, import_react9.useState)(c5), e = l5 !== void 0, t7 = (0, import_react9.useRef)(e), u5 = (0, import_react9.useRef)(false), d4 = (0, import_react9.useRef)(false);
  return e && !t7.current && !u5.current ? (u5.current = true, t7.current = e, console.error("A component is changing from uncontrolled to controlled. This may be caused by the value changing from undefined to a defined value, which should not happen.")) : !e && t7.current && !d4.current && (d4.current = true, t7.current = e, console.error("A component is changing from controlled to uncontrolled. This may be caused by the value changing from a defined value to undefined, which should not happen.")), [e ? l5 : i6, o4((n) => (e || s7(n), r3 == null ? void 0 : r3(n)))];
}

// ../../node_modules/@headlessui/react/dist/components/description/description.js
init_cjs_shims();
var import_react10 = __toESM(require("react"), 1);
var d2 = (0, import_react10.createContext)(null);
function f2() {
  let r3 = (0, import_react10.useContext)(d2);
  if (r3 === null) {
    let t7 = new Error("You used a <Description /> component, but it is not inside a relevant parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(t7, f2), t7;
  }
  return r3;
}
function M() {
  let [r3, t7] = (0, import_react10.useState)([]);
  return [r3.length > 0 ? r3.join(" ") : void 0, (0, import_react10.useMemo)(() => function(e) {
    let i6 = o4((s7) => (t7((o9) => [...o9, s7]), () => t7((o9) => {
      let p4 = o9.slice(), c5 = p4.indexOf(s7);
      return c5 !== -1 && p4.splice(c5, 1), p4;
    }))), n = (0, import_react10.useMemo)(() => ({ register: i6, slot: e.slot, name: e.name, props: e.props }), [i6, e.slot, e.name, e.props]);
    return import_react10.default.createElement(d2.Provider, { value: n }, e.children);
  }, [t7])];
}
var S2 = "p";
function h2(r3, t7) {
  let a3 = I(), { id: e = `headlessui-description-${a3}`, ...i6 } = r3, n = f2(), s7 = y(t7);
  l(() => n.register(e), [e, n.register]);
  let o9 = { ref: s7, ...n.props, id: e };
  return X({ ourProps: o9, theirProps: i6, slot: n.slot || {}, defaultTag: S2, name: n.name || "Description" });
}
var y2 = D(h2);
var b2 = Object.assign(y2, {});

// ../../node_modules/@headlessui/react/dist/components/label/label.js
init_cjs_shims();
var import_react11 = __toESM(require("react"), 1);
var d3 = (0, import_react11.createContext)(null);
function u4() {
  let o9 = (0, import_react11.useContext)(d3);
  if (o9 === null) {
    let t7 = new Error("You used a <Label /> component, but it is not inside a relevant parent.");
    throw Error.captureStackTrace && Error.captureStackTrace(t7, u4), t7;
  }
  return o9;
}
function H() {
  let [o9, t7] = (0, import_react11.useState)([]);
  return [o9.length > 0 ? o9.join(" ") : void 0, (0, import_react11.useMemo)(() => function(e) {
    let s7 = o4((r3) => (t7((l5) => [...l5, r3]), () => t7((l5) => {
      let n = l5.slice(), p4 = n.indexOf(r3);
      return p4 !== -1 && n.splice(p4, 1), n;
    }))), a3 = (0, import_react11.useMemo)(() => ({ register: s7, slot: e.slot, name: e.name, props: e.props }), [s7, e.slot, e.name, e.props]);
    return import_react11.default.createElement(d3.Provider, { value: a3 }, e.children);
  }, [t7])];
}
var A = "label";
function h3(o9, t7) {
  let i6 = I(), { id: e = `headlessui-label-${i6}`, passive: s7 = false, ...a3 } = o9, r3 = u4(), l5 = y(t7);
  l(() => r3.register(e), [e, r3.register]);
  let n = { ref: l5, ...r3.props, id: e };
  return s7 && ("onClick" in n && (delete n.htmlFor, delete n.onClick), "onClick" in a3 && delete a3.onClick), X({ ourProps: n, theirProps: a3, slot: r3.slot || {}, defaultTag: A, name: r3.name || "Label" });
}
var v = D(h3);
var M2 = Object.assign(v, {});

// ../../node_modules/@headlessui/react/dist/components/switch/switch.js
init_cjs_shims();
var import_react12 = __toESM(require("react"), 1);
var y3 = (0, import_react12.createContext)(null);
y3.displayName = "GroupContext";
var Y = import_react12.Fragment;
function Z(s7) {
  var d4;
  let [n, p4] = (0, import_react12.useState)(null), [c5, f4] = H(), [r3, h4] = M(), l5 = (0, import_react12.useMemo)(() => ({ switch: n, setSwitch: p4, labelledby: c5, describedby: r3 }), [n, p4, c5, r3]), T4 = {}, b4 = s7;
  return import_react12.default.createElement(h4, { name: "Switch.Description" }, import_react12.default.createElement(f4, { name: "Switch.Label", props: { htmlFor: (d4 = l5.switch) == null ? void 0 : d4.id, onClick(t7) {
    n && (t7.currentTarget.tagName === "LABEL" && t7.preventDefault(), n.click(), n.focus({ preventScroll: true }));
  } } }, import_react12.default.createElement(y3.Provider, { value: l5 }, X({ ourProps: T4, theirProps: b4, defaultTag: Y, name: "Switch.Group" }))));
}
var ee = "button";
function te(s7, n) {
  let p4 = I(), { id: c5 = `headlessui-switch-${p4}`, checked: f4, defaultChecked: r3 = false, onChange: h4, name: l5, value: T4, form: b4, ...d4 } = s7, t7 = (0, import_react12.useContext)(y3), u5 = (0, import_react12.useRef)(null), D3 = y(u5, n, t7 === null ? null : t7.setSwitch), [o9, a3] = T2(f4, h4, r3), S3 = o4(() => a3 == null ? void 0 : a3(!o9)), C = o4((e) => {
    if (r2(e.currentTarget))
      return e.preventDefault();
    e.preventDefault(), S3();
  }), L2 = o4((e) => {
    e.key === o7.Space ? (e.preventDefault(), S3()) : e.key === o7.Enter && p2(e.currentTarget);
  }), v2 = o4((e) => e.preventDefault()), G = (0, import_react12.useMemo)(() => ({ checked: o9 }), [o9]), R2 = { id: c5, ref: D3, role: "switch", type: s5(s7, u5), tabIndex: 0, "aria-checked": o9, "aria-labelledby": t7 == null ? void 0 : t7.labelledby, "aria-describedby": t7 == null ? void 0 : t7.describedby, onClick: C, onKeyUp: L2, onKeyPress: v2 }, k = p();
  return (0, import_react12.useEffect)(() => {
    var w2;
    let e = (w2 = u5.current) == null ? void 0 : w2.closest("form");
    e && r3 !== void 0 && k.addEventListener(e, "reset", () => {
      a3(r3);
    });
  }, [u5, a3]), import_react12.default.createElement(import_react12.default.Fragment, null, l5 != null && o9 && import_react12.default.createElement(c3, { features: p3.Hidden, ...R({ as: "input", type: "checkbox", hidden: true, readOnly: true, form: b4, checked: o9, name: l5, value: T4 }) }), X({ ourProps: R2, theirProps: d4, slot: G, defaultTag: ee, name: "Switch" }));
}
var ne = D(te);
var re = Z;
var Ge = Object.assign(ne, { Group: re, Label: M2, Description: b2 });

// src/button/toggle-switch.tsx
var ToggleSwitch = (props) => {
  const { value, onChange, label, size = "sm", disabled, className } = props;
  return /* @__PURE__ */ React2.createElement(Ge, {
    checked: value,
    disabled,
    onChange,
    className: `relative flex-shrink-0 inline-flex ${size === "sm" ? "h-4 w-6" : size === "md" ? "h-5 w-8" : "h-6 w-10"} flex-shrink-0 cursor-pointer rounded-full border border-custom-border-200 transition-colors duration-200 ease-in-out focus:outline-none ${value ? "bg-custom-primary-100" : "bg-gray-700"} ${className || ""} ${disabled ? "cursor-not-allowed" : ""}`
  }, /* @__PURE__ */ React2.createElement("span", {
    className: "sr-only"
  }, label), /* @__PURE__ */ React2.createElement("span", {
    "aria-hidden": "true",
    className: `self-center inline-block ${size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4"} transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${value ? (size === "sm" ? "translate-x-3" : size === "md" ? "translate-x-4" : "translate-x-5") + " bg-white" : "translate-x-0.5 bg-custom-background-90"} ${disabled ? "cursor-not-allowed" : ""}`
  }));
};
ToggleSwitch.displayName = "plane-ui-toggle-switch";

// src/form-fields/input.tsx
init_cjs_shims();
var React3 = __toESM(require("react"));
var Input = React3.forwardRef((props, ref) => {
  const {
    id,
    type,
    name,
    mode = "primary",
    inputSize = "sm",
    hasError = false,
    className = "",
    ...rest
  } = props;
  return /* @__PURE__ */ React3.createElement("input", {
    id,
    ref,
    type,
    name,
    className: `block rounded-md bg-transparent text-sm focus:outline-none placeholder-custom-text-400 ${mode === "primary" ? "rounded-md border border-custom-border-200" : mode === "transparent" ? "rounded border-none bg-transparent ring-0 transition-all focus:ring-1 focus:ring-custom-primary" : mode === "true-transparent" ? "rounded border-none bg-transparent ring-0" : ""} ${hasError ? "border-red-500" : ""} ${hasError && mode === "primary" ? "bg-red-500/20" : ""} ${inputSize === "sm" ? "px-3 py-2" : inputSize === "md" ? "p-3" : ""} ${className}`,
    ...rest
  });
});
Input.displayName = "form-input-field";

// src/form-fields/textarea.tsx
init_cjs_shims();
var React4 = __toESM(require("react"));
var useAutoSizeTextArea = (textAreaRef, value) => {
  React4.useEffect(() => {
    if (textAreaRef) {
      textAreaRef.style.height = "0px";
      const scrollHeight = textAreaRef.scrollHeight;
      textAreaRef.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, value]);
};
var TextArea = React4.forwardRef(
  (props, ref) => {
    const {
      id,
      name,
      value = "",
      rows = 1,
      cols = 1,
      mode = "primary",
      hasError = false,
      className = "",
      ...rest
    } = props;
    const textAreaRef = React4.useRef(ref);
    ref && useAutoSizeTextArea(textAreaRef == null ? void 0 : textAreaRef.current, value);
    return /* @__PURE__ */ React4.createElement("textarea", {
      id,
      name,
      ref: textAreaRef,
      value,
      rows,
      cols,
      className: `no-scrollbar w-full bg-transparent placeholder-custom-text-400 px-3 py-2 outline-none ${mode === "primary" ? "rounded-md border border-custom-border-200" : mode === "transparent" ? "rounded border-none bg-transparent ring-0 transition-all focus:ring-1 focus:ring-theme" : ""} ${hasError ? "border-red-500" : ""} ${hasError && mode === "primary" ? "bg-red-100" : ""} ${className}`,
      ...rest
    });
  }
);

// src/progress/radial-progress.tsx
init_cjs_shims();
var import_react14 = __toESM(require("react"));
var RadialProgressBar = (props) => {
  const { progress } = props;
  const [circumference, setCircumference] = (0, import_react14.useState)(0);
  (0, import_react14.useEffect)(() => {
    const radius = 40;
    const circumference2 = 2 * Math.PI * radius;
    setCircumference(circumference2);
  }, []);
  const progressOffset = (100 - progress) / 100 * circumference;
  return /* @__PURE__ */ import_react14.default.createElement("div", {
    className: "relative h-4 w-4"
  }, /* @__PURE__ */ import_react14.default.createElement("svg", {
    className: "absolute top-0 left-0",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ import_react14.default.createElement("circle", {
    className: "stroke-current opacity-10",
    cx: "50",
    cy: "50",
    r: "40",
    strokeWidth: "12",
    fill: "none",
    strokeDasharray: `${circumference} ${circumference}`
  }), /* @__PURE__ */ import_react14.default.createElement("circle", {
    className: `stroke-current`,
    cx: "50",
    cy: "50",
    r: "40",
    strokeWidth: "12",
    fill: "none",
    strokeDasharray: `${circumference} ${circumference}`,
    strokeDashoffset: progressOffset,
    transform: "rotate(-90 50 50)"
  })));
};

// src/progress/progress-bar.tsx
init_cjs_shims();
var import_react15 = __toESM(require("react"));
var ProgressBar = ({
  maxValue = 0,
  value = 0,
  radius = 8,
  strokeWidth = 2,
  activeStrokeColor = "#3e98c7",
  inactiveStrokeColor = "#ddd"
}) => {
  const generatePie = (value2) => {
    const x3 = radius - Math.cos(2 * Math.PI / (100 / value2)) * radius;
    const y4 = radius + Math.sin(2 * Math.PI / (100 / value2)) * radius;
    const long = value2 <= 50 ? 0 : 1;
    const d4 = `M${radius} ${radius} L${radius} ${0} A${radius} ${radius} 0 ${long} 1 ${y4} ${x3} Z`;
    return d4;
  };
  const calculatePieValue = (numberOfBars) => {
    const angle = 360 / numberOfBars;
    const pieValue = Math.floor(angle / 4);
    return pieValue < 1 ? 1 : Math.floor(angle / 4);
  };
  const renderPie = (i6) => {
    const DIRECTION = -1;
    const primaryRotationAngle = (maxValue - 1) * (360 / maxValue);
    const rotationAngle = -1 * DIRECTION * primaryRotationAngle + i6 * DIRECTION * primaryRotationAngle;
    const rotationTransformation = `rotate(${rotationAngle}, ${radius}, ${radius})`;
    const pieValue = calculatePieValue(maxValue);
    const dValue = generatePie(pieValue);
    const fillColor = value > 0 && i6 <= value ? activeStrokeColor : inactiveStrokeColor;
    return /* @__PURE__ */ import_react15.default.createElement("path", {
      style: { opacity: i6 === 0 ? 0 : 1 },
      key: i6,
      d: dValue,
      fill: fillColor,
      transform: rotationTransformation
    });
  };
  const renderOuterCircle = () => [...Array(maxValue + 1)].map((e, i6) => renderPie(i6));
  return /* @__PURE__ */ import_react15.default.createElement("svg", {
    width: radius * 2,
    height: radius * 2
  }, renderOuterCircle(), /* @__PURE__ */ import_react15.default.createElement("circle", {
    r: radius - strokeWidth,
    cx: radius,
    cy: radius,
    className: "progress-bar"
  }));
};

// src/spinners/circular-spinner.tsx
init_cjs_shims();
var React7 = __toESM(require("react"));
var Spinner = () => /* @__PURE__ */ React7.createElement("div", {
  role: "status"
}, /* @__PURE__ */ React7.createElement("svg", {
  "aria-hidden": "true",
  className: "mr-2 h-8 w-8 animate-spin fill-blue-600 text-custom-text-200",
  viewBox: "0 0 100 101",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, /* @__PURE__ */ React7.createElement("path", {
  d: "M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z",
  fill: "currentColor"
}), /* @__PURE__ */ React7.createElement("path", {
  d: "M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z",
  fill: "currentFill"
})), /* @__PURE__ */ React7.createElement("span", {
  className: "sr-only"
}, "Loading..."));

// src/loader.tsx
init_cjs_shims();
var import_react16 = __toESM(require("react"));
var Loader = ({ children, className = "" }) => /* @__PURE__ */ import_react16.default.createElement("div", {
  className: `${className} animate-pulse`,
  role: "status"
}, children);
var Item = ({ height = "auto", width = "auto" }) => /* @__PURE__ */ import_react16.default.createElement("div", {
  className: "rounded-md bg-custom-background-80",
  style: { height, width }
});
Loader.Item = Item;
Loader.displayName = "plane-ui-loader";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Button,
  Input,
  Loader,
  ProgressBar,
  RadialProgressBar,
  Spinner,
  TextArea,
  ToggleSwitch
});
