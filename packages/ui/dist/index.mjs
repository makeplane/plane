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

// src/form-fields/textarea.tsx
import * as React3 from "react";
var useAutoSizeTextArea = (textAreaRef, value) => {
  React3.useEffect(() => {
    if (textAreaRef) {
      textAreaRef.style.height = "0px";
      const scrollHeight = textAreaRef.scrollHeight;
      textAreaRef.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, value]);
};
var TextArea = React3.forwardRef(
  (props, ref) => {
    const {
      id,
      name,
      placeholder = "",
      value = "",
      rows = 1,
      cols = 1,
      disabled,
      onChange,
      mode = "primary",
      hasError = false,
      className = ""
    } = props;
    const textAreaRef = React3.useRef(ref);
    ref && useAutoSizeTextArea(textAreaRef == null ? void 0 : textAreaRef.current, value);
    return /* @__PURE__ */ React3.createElement("textarea", {
      id,
      name,
      ref: textAreaRef,
      placeholder,
      value,
      rows,
      cols,
      disabled,
      onChange,
      className: `no-scrollbar w-full bg-transparent placeholder-custom-text-400 px-3 py-2 outline-none ${mode === "primary" ? "rounded-md border border-custom-border-200" : mode === "transparent" ? "rounded border-none bg-transparent ring-0 transition-all focus:ring-1 focus:ring-theme" : ""} ${hasError ? "border-red-500" : ""} ${hasError && mode === "primary" ? "bg-red-100" : ""} ${className}`
    });
  }
);

// src/progress/radial-progress.tsx
import React4, { useState, useEffect as useEffect2 } from "react";
var RadialProgressBar = (props) => {
  const { progress } = props;
  const [circumference, setCircumference] = useState(0);
  useEffect2(() => {
    const radius = 40;
    const circumference2 = 2 * Math.PI * radius;
    setCircumference(circumference2);
  }, []);
  const progressOffset = (100 - progress) / 100 * circumference;
  return /* @__PURE__ */ React4.createElement("div", {
    className: "relative h-4 w-4"
  }, /* @__PURE__ */ React4.createElement("svg", {
    className: "absolute top-0 left-0",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ React4.createElement("circle", {
    className: "stroke-current opacity-10",
    cx: "50",
    cy: "50",
    r: "40",
    strokeWidth: "12",
    fill: "none",
    strokeDasharray: `${circumference} ${circumference}`
  }), /* @__PURE__ */ React4.createElement("circle", {
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
export {
  Button,
  Input,
  RadialProgressBar,
  TextArea
};
