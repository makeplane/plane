// src/buttons/index.tsx
import * as React from "react";
import clsx from "clsx";
var Button = React.forwardRef(
  (props, ref) => {
    const {
      children,
      className = "",
      type = "button",
      disabled = false,
      loading = false,
      size = "sm",
      outline = false,
      variant = "primary",
      ...rest
    } = props;
    const buttonStyleClasses = {
      primary: {
        variantStyle: "text-white bg-custom-primary hover:border-opacity-90 hover:bg-opacity-90",
        variantOutlineStyle: "text-custom-primary hover:bg-custom-primary hover:text-white",
        variantBorderStyles: "border-custom-primary"
      },
      secondary: {
        variantStyle: "bg-custom-background-100 hover:border-opacity-70 hover:bg-opacity-70",
        variantOutlineStyle: "hover:bg-custom-background-80",
        variantBorderStyles: "border-custom-border-200"
      },
      danger: {
        variantStyle: "text-white bg-red-500 hover:border-opacity-90 hover:bg-opacity-90",
        variantOutlineStyle: " text-red-500 hover:bg-red-500 hover:text-white",
        variantBorderStyles: "border-red-500"
      }
    };
    return /* @__PURE__ */ React.createElement("button", {
      type,
      ref,
      className: `${className} border font-medium duration-300 ${size === "sm" ? "rounded px-3 py-2 text-xs" : size === "md" ? "rounded-md px-3.5 py-2 text-sm" : "rounded-lg px-4 py-2 text-base"} ${disabled ? "cursor-not-allowed opacity-70" : ""} ${outline ? clsx({
        [buttonStyleClasses.primary.variantOutlineStyle]: variant === "primary",
        [buttonStyleClasses.secondary.variantOutlineStyle]: variant === "secondary",
        [buttonStyleClasses.danger.variantOutlineStyle]: variant === "danger"
      }) : clsx({
        [buttonStyleClasses.primary.variantStyle]: variant === "primary",
        [buttonStyleClasses.secondary.variantStyle]: variant === "secondary",
        [buttonStyleClasses.danger.variantStyle]: variant === "danger"
      })}  ${loading ? "cursor-wait" : ""} ${clsx({
        [buttonStyleClasses.primary.variantBorderStyles]: variant === "primary",
        [buttonStyleClasses.secondary.variantBorderStyles]: variant === "secondary",
        [buttonStyleClasses.danger.variantBorderStyles]: variant === "danger"
      })}`,
      disabled: disabled || loading,
      ...rest
    }, children);
  }
);
Button.displayName = "plane-ui-button";

// src/form-fields/input.tsx
import * as React2 from "react";
var Input = React2.forwardRef((props, ref) => {
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
  return /* @__PURE__ */ React2.createElement("input", {
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
      value = "",
      rows = 1,
      cols = 1,
      mode = "primary",
      hasError = false,
      className = "",
      ...rest
    } = props;
    const textAreaRef = React3.useRef(ref);
    ref && useAutoSizeTextArea(textAreaRef == null ? void 0 : textAreaRef.current, value);
    return /* @__PURE__ */ React3.createElement("textarea", {
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
