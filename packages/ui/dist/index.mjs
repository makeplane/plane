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

// src/spinners/circular-spinner.tsx
import * as React5 from "react";
var Spinner = () => /* @__PURE__ */ React5.createElement("div", {
  role: "status"
}, /* @__PURE__ */ React5.createElement("svg", {
  "aria-hidden": "true",
  className: "mr-2 h-8 w-8 animate-spin fill-blue-600 text-custom-text-200",
  viewBox: "0 0 100 101",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, /* @__PURE__ */ React5.createElement("path", {
  d: "M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z",
  fill: "currentColor"
}), /* @__PURE__ */ React5.createElement("path", {
  d: "M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z",
  fill: "currentFill"
})), /* @__PURE__ */ React5.createElement("span", {
  className: "sr-only"
}, "Loading..."));
export {
  Button,
  Input,
  RadialProgressBar,
  Spinner,
  TextArea
};
