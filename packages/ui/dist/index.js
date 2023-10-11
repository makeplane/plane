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
  Input: () => Input,
  Loader: () => Loader,
  ProgressBar: () => ProgressBar,
  RadialProgressBar: () => RadialProgressBar,
  Spinner: () => Spinner,
  TextArea: () => TextArea,
  ToggleSwitch: () => ToggleSwitch
});
module.exports = __toCommonJS(src_exports);

// src/button/button.tsx
var React = __toESM(require("react"));

// src/button/helper.tsx
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
var React2 = __toESM(require("react"));
var import_react = require("@headlessui/react");
var ToggleSwitch = (props) => {
  const { value, onChange, label, size = "sm", disabled, className } = props;
  return /* @__PURE__ */ React2.createElement(import_react.Switch, {
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
var import_react2 = __toESM(require("react"));
var RadialProgressBar = (props) => {
  const { progress } = props;
  const [circumference, setCircumference] = (0, import_react2.useState)(0);
  (0, import_react2.useEffect)(() => {
    const radius = 40;
    const circumference2 = 2 * Math.PI * radius;
    setCircumference(circumference2);
  }, []);
  const progressOffset = (100 - progress) / 100 * circumference;
  return /* @__PURE__ */ import_react2.default.createElement("div", {
    className: "relative h-4 w-4"
  }, /* @__PURE__ */ import_react2.default.createElement("svg", {
    className: "absolute top-0 left-0",
    viewBox: "0 0 100 100"
  }, /* @__PURE__ */ import_react2.default.createElement("circle", {
    className: "stroke-current opacity-10",
    cx: "50",
    cy: "50",
    r: "40",
    strokeWidth: "12",
    fill: "none",
    strokeDasharray: `${circumference} ${circumference}`
  }), /* @__PURE__ */ import_react2.default.createElement("circle", {
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
var import_react3 = __toESM(require("react"));
var ProgressBar = ({
  maxValue = 0,
  value = 0,
  radius = 8,
  strokeWidth = 2,
  activeStrokeColor = "#3e98c7",
  inactiveStrokeColor = "#ddd"
}) => {
  const generatePie = (value2) => {
    const x = radius - Math.cos(2 * Math.PI / (100 / value2)) * radius;
    const y = radius + Math.sin(2 * Math.PI / (100 / value2)) * radius;
    const long = value2 <= 50 ? 0 : 1;
    const d = `M${radius} ${radius} L${radius} ${0} A${radius} ${radius} 0 ${long} 1 ${y} ${x} Z`;
    return d;
  };
  const calculatePieValue = (numberOfBars) => {
    const angle = 360 / numberOfBars;
    const pieValue = Math.floor(angle / 4);
    return pieValue < 1 ? 1 : Math.floor(angle / 4);
  };
  const renderPie = (i) => {
    const DIRECTION = -1;
    const primaryRotationAngle = (maxValue - 1) * (360 / maxValue);
    const rotationAngle = -1 * DIRECTION * primaryRotationAngle + i * DIRECTION * primaryRotationAngle;
    const rotationTransformation = `rotate(${rotationAngle}, ${radius}, ${radius})`;
    const pieValue = calculatePieValue(maxValue);
    const dValue = generatePie(pieValue);
    const fillColor = value > 0 && i <= value ? activeStrokeColor : inactiveStrokeColor;
    return /* @__PURE__ */ import_react3.default.createElement("path", {
      style: { opacity: i === 0 ? 0 : 1 },
      key: i,
      d: dValue,
      fill: fillColor,
      transform: rotationTransformation
    });
  };
  const renderOuterCircle = () => [...Array(maxValue + 1)].map((e, i) => renderPie(i));
  return /* @__PURE__ */ import_react3.default.createElement("svg", {
    width: radius * 2,
    height: radius * 2
  }, renderOuterCircle(), /* @__PURE__ */ import_react3.default.createElement("circle", {
    r: radius - strokeWidth,
    cx: radius,
    cy: radius,
    className: "progress-bar"
  }));
};

// src/spinners/circular-spinner.tsx
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
var import_react4 = __toESM(require("react"));
var Loader = ({ children, className = "" }) => /* @__PURE__ */ import_react4.default.createElement("div", {
  className: `${className} animate-pulse`,
  role: "status"
}, children);
var Item = ({ height = "auto", width = "auto" }) => /* @__PURE__ */ import_react4.default.createElement("div", {
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
