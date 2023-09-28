"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/index.tsx
var src_exports = {};
__export(src_exports, {
  Button: () => Button,
  Input: () => Input
});
module.exports = __toCommonJS(src_exports);

// src/buttons/index.tsx
var React = __toESM(require("react"));
var Button = () => {
  return /* @__PURE__ */ React.createElement("button", null, "button");
};

// src/form-fields/input.tsx
var React2 = __toESM(require("react"));
var Input = React2.forwardRef((props, ref) => {
  const {
    id,
    type,
    value,
    name,
    onChange,
    className = "",
    mode = "primary",
    size = "md",
    hasError = false,
    placeholder = "",
    disabled = false
  } = props;
  return /* @__PURE__ */ React2.createElement("input", {
    id,
    ref,
    type,
    value,
    name,
    onChange,
    placeholder,
    disabled,
    className: `block rounded-md bg-transparent text-sm focus:outline-none placeholder-custom-text-400 ${mode === "primary" ? "rounded-md border border-custom-border-200" : mode === "transparent" ? "rounded border-none bg-transparent ring-0 transition-all focus:ring-1 focus:ring-custom-primary" : mode === "true-transparent" ? "rounded border-none bg-transparent ring-0" : ""} ${hasError ? "border-red-500" : ""} ${hasError && mode === "primary" ? "bg-red-500/20" : ""} ${size === "sm" ? "px-3 py-2" : size === "lg" ? "p-3" : ""} ${className}`
  });
});
Input.displayName = "form-input-field";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Button,
  Input
});
