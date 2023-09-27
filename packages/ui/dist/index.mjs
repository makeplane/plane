// src/buttons/index.tsx
import * as React from "react";
var Button = () => {
  return /* @__PURE__ */ React.createElement("button", null, "button");
};

// src/form-fields/input.tsx
import * as React2 from "react";
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
export {
  Button,
  Input
};
