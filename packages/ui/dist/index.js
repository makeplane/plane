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
  AdminProfileIcon: () => AdminProfileIcon,
  ArchiveIcon: () => ArchiveIcon,
  Button: () => Button,
  ContrastIcon: () => ContrastIcon,
  CopyIcon: () => CopyIcon,
  CreateIcon: () => CreateIcon,
  DiceIcon: () => DiceIcon,
  DoubleCircleIcon: () => DoubleCircleIcon,
  ExternalLinkIcon: () => ExternalLinkIcon,
  FullScreenPeekIcon: () => FullScreenPeekIcon,
  Input: () => Input,
  LayerStackIcon: () => LayerStackIcon,
  LayersIcon: () => LayersIcon,
  LinearProgressIndicator: () => LinearProgressIndicator,
  Loader: () => Loader,
  ModalPeekIcon: () => ModalPeekIcon,
  PhotoFilterIcon: () => PhotoFilterIcon,
  ProgressBar: () => ProgressBar,
  RadialProgressBar: () => RadialProgressBar,
  SidePeekIcon: () => SidePeekIcon,
  Spinner: () => Spinner,
  SubscribeIcon: () => SubscribeIcon,
  TextArea: () => TextArea,
  ToggleSwitch: () => ToggleSwitch,
  Tooltip: () => Tooltip,
  UserGroupIcon: () => UserGroupIcon
});
module.exports = __toCommonJS(src_exports);

// src/button/button.tsx
var React = __toESM(require("react"));

// src/button/helper.tsx
var buttonSizeStyling = /* @__PURE__ */ ((buttonSizeStyling2) => {
  buttonSizeStyling2["sm"] = `px-3 py-1.5 font-medium text-xs rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline`;
  buttonSizeStyling2["md"] = `px-4 py-1.5 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline`;
  buttonSizeStyling2["lg"] = `px-5 py-2 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline`;
  buttonSizeStyling2["xl"] = `px-5 py-3.5 font-medium text-sm rounded flex items-center gap-1.5 whitespace-nowrap transition-all justify-center inline`;
  return buttonSizeStyling2;
})(buttonSizeStyling || {});
var buttonIconStyling = /* @__PURE__ */ ((buttonIconStyling2) => {
  buttonIconStyling2["sm"] = "h-3 w-3 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0";
  buttonIconStyling2["md"] = "h-3.5 w-3.5 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0";
  buttonIconStyling2["lg"] = "h-4 w-4 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0";
  buttonIconStyling2["xl"] = "h-4 w-4 flex justify-center items-center overflow-hidden my-0.5 flex-shrink-0";
  return buttonIconStyling2;
})(buttonIconStyling || {});
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
  if (size)
    _size = buttonSizeStyling[size];
  return `${_variant} ${_size}`;
};
var getIconStyling = (size) => {
  let icon = ``;
  if (size)
    icon = buttonIconStyling[size];
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

// src/progress/linear-progress-indicator.tsx
var import_react5 = __toESM(require("react"));

// src/tooltip/tooltip.tsx
var import_react4 = __toESM(require("react"));
var import_next_themes = require("next-themes");
var import_popover2 = require("@blueprintjs/popover2");
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
  const { theme } = (0, import_next_themes.useTheme)();
  return /* @__PURE__ */ import_react4.default.createElement(import_popover2.Tooltip2, {
    disabled,
    hoverOpenDelay: openDelay,
    hoverCloseDelay: closeDelay,
    content: /* @__PURE__ */ import_react4.default.createElement("div", {
      className: `relative z-50 max-w-xs gap-1 rounded-md p-2 text-xs shadow-md ${theme === "custom" ? "bg-custom-background-100 text-custom-text-200" : "bg-black text-gray-400"} break-words overflow-hidden ${className}`
    }, tooltipHeading && /* @__PURE__ */ import_react4.default.createElement("h5", {
      className: `font-medium ${theme === "custom" ? "text-custom-text-100" : "text-white"}`
    }, tooltipHeading), tooltipContent),
    position,
    renderTarget: ({
      isOpen: isTooltipOpen,
      ref: eleReference,
      ...tooltipProps
    }) => import_react4.default.cloneElement(children, {
      ref: eleReference,
      ...tooltipProps,
      ...children.props
    })
  });
};

// src/progress/linear-progress-indicator.tsx
var LinearProgressIndicator = ({
  data,
  noTooltip = false
}) => {
  const total = data.reduce((acc, cur) => acc + cur.value, 0);
  let progress = 0;
  const bars = data.map((item) => {
    const width = `${item.value / total * 100}%`;
    const style = {
      width,
      backgroundColor: item.color
    };
    progress += item.value;
    if (noTooltip)
      return /* @__PURE__ */ import_react5.default.createElement("div", {
        style
      });
    else
      return /* @__PURE__ */ import_react5.default.createElement(Tooltip, {
        key: item.id,
        tooltipContent: `${item.name} ${Math.round(item.value)}%`
      }, /* @__PURE__ */ import_react5.default.createElement("div", {
        style
      }));
  });
  return /* @__PURE__ */ import_react5.default.createElement("div", {
    className: "flex h-1 w-full items-center justify-between gap-1"
  }, total === 0 ? /* @__PURE__ */ import_react5.default.createElement("div", {
    className: "flex h-full w-full gap-1 bg-neutral-500"
  }, bars) : /* @__PURE__ */ import_react5.default.createElement("div", {
    className: "flex h-full w-full gap-1"
  }, bars));
};

// src/spinners/circular-spinner.tsx
var React9 = __toESM(require("react"));
var Spinner = () => /* @__PURE__ */ React9.createElement("div", {
  role: "status"
}, /* @__PURE__ */ React9.createElement("svg", {
  "aria-hidden": "true",
  className: "mr-2 h-8 w-8 animate-spin fill-blue-600 text-custom-text-200",
  viewBox: "0 0 100 101",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, /* @__PURE__ */ React9.createElement("path", {
  d: "M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z",
  fill: "currentColor"
}), /* @__PURE__ */ React9.createElement("path", {
  d: "M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z",
  fill: "currentFill"
})), /* @__PURE__ */ React9.createElement("span", {
  className: "sr-only"
}, "Loading..."));

// src/loader.tsx
var import_react6 = __toESM(require("react"));
var Loader = ({ children, className = "" }) => /* @__PURE__ */ import_react6.default.createElement("div", {
  className: `${className} animate-pulse`,
  role: "status"
}, children);
var Item = ({ height = "auto", width = "auto" }) => /* @__PURE__ */ import_react6.default.createElement("div", {
  className: "rounded-md bg-custom-background-80",
  style: { height, width }
});
Loader.Item = Item;
Loader.displayName = "plane-ui-loader";

// src/icons/user-group-icon.tsx
var import_react7 = __toESM(require("react"));
var UserGroupIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react7.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react7.default.createElement("path", {
  d: "M18 19C18 17.4087 17.3679 15.8826 16.2426 14.7574C15.1174 13.6321 13.5913 13 12 13C10.4087 13 8.88258 13.6321 7.75736 14.7574C6.63214 15.8826 6 17.4087 6 19",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react7.default.createElement("path", {
  d: "M12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react7.default.createElement("path", {
  d: "M23 18C23 16.636 22.4732 15.3279 21.5355 14.3635C20.5979 13.399 19.3261 12.8571 18 12.8571C18.8841 12.8571 19.7319 12.4959 20.357 11.8529C20.9821 11.21 21.3333 10.3379 21.3333 9.42857C21.3333 8.51926 20.9821 7.64719 20.357 7.00421C19.7319 6.36122 18.8841 6 18 6",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react7.default.createElement("path", {
  d: "M1 18C1 16.636 1.52678 15.3279 2.46447 14.3635C3.40215 13.399 4.67392 12.8571 6 12.8571C5.11595 12.8571 4.2681 12.4959 3.64298 11.8529C3.01786 11.21 2.66667 10.3379 2.66667 9.42857C2.66667 8.51926 3.01786 7.64719 3.64298 7.00421C4.2681 6.36122 5.11595 6 6 6",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/contrast-icon.tsx
var import_react8 = __toESM(require("react"));
var ContrastIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react8.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react8.default.createElement("path", {
  d: "M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react8.default.createElement("path", {
  d: "M12 18C13.5913 18 15.1174 17.3679 16.2426 16.2426C17.3679 15.1174 18 13.5913 18 12C18 10.4087 17.3679 8.88258 16.2426 7.75736C15.1174 6.63214 13.5913 6 12 6V18Z",
  fill: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/dice-icon.tsx
var import_react9 = __toESM(require("react"));
var DiceIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react9.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react9.default.createElement("path", {
  d: "M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react9.default.createElement("path", {
  d: "M8.77778 7H7.22222C7.09949 7 7 7.09949 7 7.22222V8.77778C7 8.90051 7.09949 9 7.22222 9H8.77778C8.90051 9 9 8.90051 9 8.77778V7.22222C9 7.09949 8.90051 7 8.77778 7Z",
  fill: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react9.default.createElement("path", {
  d: "M8.77778 15H7.22222C7.09949 15 7 15.0995 7 15.2222V16.7778C7 16.9005 7.09949 17 7.22222 17H8.77778C8.90051 17 9 16.9005 9 16.7778V15.2222C9 15.0995 8.90051 15 8.77778 15Z",
  fill: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react9.default.createElement("path", {
  d: "M16.7778 7H15.2222C15.0995 7 15 7.09949 15 7.22222V8.77778C15 8.90051 15.0995 9 15.2222 9H16.7778C16.9005 9 17 8.90051 17 8.77778V7.22222C17 7.09949 16.9005 7 16.7778 7Z",
  fill: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react9.default.createElement("path", {
  d: "M16.7778 15H15.2222C15.0995 15 15 15.0995 15 15.2222V16.7778C15 16.9005 15.0995 17 15.2222 17H16.7778C16.9005 17 17 16.9005 17 16.7778V15.2222C17 15.0995 16.9005 15 16.7778 15Z",
  fill: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/layers-icon.tsx
var import_react10 = __toESM(require("react"));
var LayersIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react10.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react10.default.createElement("g", {
  "clip-path": "url(#clip0_7258_81938)"
}, /* @__PURE__ */ import_react10.default.createElement("path", {
  d: "M16.5953 6.69606L16.6072 5.17376L6.85812 8.92381L6.85812 19.4238L9.00319 18.6961",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react10.default.createElement("path", {
  d: "M12.0953 3.69606L12.1072 2.17376L2.35812 5.92381L2.35812 16.4238L4.50319 15.6961",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react10.default.createElement("path", {
  d: "M21.7438 17.9461L21.7511 7.44434L12.0021 11.1944L12.0021 21.6944L21.7438 17.9461Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
})), /* @__PURE__ */ import_react10.default.createElement("defs", null, /* @__PURE__ */ import_react10.default.createElement("clipPath", {
  id: "clip0_7258_81938"
}, /* @__PURE__ */ import_react10.default.createElement("rect", {
  width: "24",
  height: "24",
  fill: "white",
  transform: "translate(24) rotate(90)"
}))));

// src/icons/photo-filter-icon.tsx
var import_react11 = __toESM(require("react"));
var PhotoFilterIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react11.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react11.default.createElement("path", {
  d: "M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react11.default.createElement("path", {
  d: "M19 3L18.5778 4.28889C18.5562 4.35583 18.519 4.41668 18.4692 4.46643C18.4195 4.51619 18.3587 4.55344 18.2918 4.57511L17 5L18.2889 5.42222C18.3558 5.44384 18.4167 5.48104 18.4664 5.53076C18.5162 5.58048 18.5534 5.6413 18.5751 5.70822L19 7L19.4222 5.71111C19.4438 5.64417 19.481 5.58332 19.5308 5.53357C19.5805 5.48381 19.6413 5.44656 19.7082 5.42489L21 5L19.7111 4.57778C19.6442 4.55616 19.5833 4.51896 19.5336 4.46924C19.4838 4.41952 19.4466 4.3587 19.4249 4.29178L19 3Z",
  fill: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react11.default.createElement("path", {
  d: "M12 9L11.3667 10.9333C11.3342 11.0337 11.2784 11.125 11.2039 11.1997C11.1293 11.2743 11.038 11.3302 10.9377 11.3627L9 12L10.9333 12.6333C11.0337 12.6658 11.125 12.7216 11.1997 12.7961C11.2743 12.8707 11.3302 12.962 11.3627 13.0623L12 15L12.6333 13.0667C12.6658 12.9663 12.7216 12.875 12.7961 12.8003C12.8707 12.7257 12.962 12.6698 13.0623 12.6373L15 12L13.0667 11.3667C12.9663 11.3342 12.875 11.2784 12.8003 11.2039C12.7257 11.1293 12.6698 11.038 12.6373 10.9377L12 9Z",
  fill: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/archive-icon.tsx
var import_react12 = __toESM(require("react"));
var ArchiveIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react12.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react12.default.createElement("path", {
  d: "M21 3H3C2.44772 3 2 3.44772 2 4V7C2 7.55228 2.44772 8 3 8H21C21.5523 8 22 7.55228 22 7V4C22 3.44772 21.5523 3 21 3Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react12.default.createElement("path", {
  d: "M4 8V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H8",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react12.default.createElement("path", {
  d: "M20 8V19C20 19.5304 19.7893 20.0391 19.4142 20.4142C19.0391 20.7893 18.5304 21 18 21H16",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react12.default.createElement("path", {
  d: "M15 18L12 21L9 18",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react12.default.createElement("path", {
  d: "M12 21L12 12",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/admin-profile-icon.tsx
var import_react13 = __toESM(require("react"));
var AdminProfileIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react13.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react13.default.createElement("path", {
  d: "M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react13.default.createElement("path", {
  d: "M8 19V18C8 16.9391 8.42143 15.9217 9.17157 15.1716C9.92172 14.4214 10.9391 14 12 14C13.0609 14 14.0783 14.4214 14.8284 15.1716C15.5786 15.9217 16 16.9391 16 18V19",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react13.default.createElement("path", {
  d: "M12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8C10.3431 8 9 9.34315 9 11C9 12.6569 10.3431 14 12 14Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/create-icon.tsx
var import_react14 = __toESM(require("react"));
var CreateIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react14.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react14.default.createElement("path", {
  d: "M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react14.default.createElement("path", {
  d: "M16 5H22",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react14.default.createElement("path", {
  d: "M19 2V8",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/subscribe-icon.tsx
var import_react15 = __toESM(require("react"));
var SubscribeIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react15.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react15.default.createElement("path", {
  d: "M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react15.default.createElement("path", {
  d: "M15 5.1C15 4.54305 15.2107 4.0089 15.5858 3.61508C15.9609 3.22125 16.4696 3 17 3C17.5304 3 18.0391 3.22125 18.4142 3.61508C18.7893 4.0089 19 4.54305 19 5.1C19 7.55 20 8.25 20 8.25H14C14 8.25 15 7.55 15 5.1Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react15.default.createElement("path", {
  d: "M16.25 11C16.3238 11 16.4324 11 16.5643 11C16.6963 11 16.8467 11 17 11C17.1533 11 17.3037 11 17.4357 11C17.5676 11 17.6762 11 17.75 11",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/double-circle-icon.tsx
var import_react16 = __toESM(require("react"));
var DoubleCircleIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react16.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react16.default.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9"
}), /* @__PURE__ */ import_react16.default.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "5.625"
}));

// src/icons/external-link-icon.tsx
var import_react17 = __toESM(require("react"));
var ExternalLinkIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react17.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-[1.5]`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react17.default.createElement("path", {
  d: "M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react17.default.createElement("path", {
  d: "M15 3H21V9",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react17.default.createElement("path", {
  d: "M10 14L21 3",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/copy-icon.tsx
var import_react18 = __toESM(require("react"));
var CopyIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react18.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react18.default.createElement("path", {
  d: "M20 8H10C8.89543 8 8 8.89543 8 10V20C8 21.1046 8.89543 22 10 22H20C21.1046 22 22 21.1046 22 20V10C22 8.89543 21.1046 8 20 8Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react18.default.createElement("path", {
  d: "M4 16C2.9 16 2 15.1 2 14V4C2 2.9 2.9 2 4 2H14C15.1 2 16 2.9 16 4",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/layer-stack-icon.tsx
var import_react19 = __toESM(require("react"));
var LayerStackIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react19.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react19.default.createElement("path", {
  d: "M19 22H4C3.46957 22 2.96086 21.8119 2.58579 21.477C2.21071 21.1421 2 20.6879 2 20.2143V11.2857C2 10.8121 2.21071 10.3579 2.58579 10.023C2.96086 9.68814 3.46957 9.5 4 9.5H20C20.5304 9.5 21.0391 9.68814 21.4142 10.023C21.7893 10.3579 22 10.8121 22 11.2857V20.2143C22 20.6879 21.7893 21.1421 21.4142 21.477C21.0391 21.8119 20.5304 22 20 22H19Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react19.default.createElement("path", {
  d: "M4.5 9.5V6.82143C4.5 6.53727 4.65804 6.26475 4.93934 6.06381C5.22064 5.86288 5.60218 5.75 6 5.75H18C18.3978 5.75 18.7794 5.86288 19.0607 6.06381C19.342 6.26475 19.5 6.53727 19.5 6.82143V9.5",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react19.default.createElement("path", {
  d: "M7 4.5V2.71429C7 2.52485 7.10536 2.34316 7.29289 2.20921C7.48043 2.07525 7.73478 2 8 2H16C16.2652 2 16.5196 2.07525 16.7071 2.20921C16.8946 2.34316 17 2.52485 17 2.71429V4.5",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/side-peek-icon.tsx
var import_react20 = __toESM(require("react"));
var SidePeekIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react20.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react20.default.createElement("path", {
  d: "M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react20.default.createElement("path", {
  d: "M20 3H12V5V19V21H20C20.5523 21 21 20.1046 21 19V5C21 3.89543 20.5523 3 20 3Z",
  fill: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/modal-peek-icon.tsx
var import_react21 = __toESM(require("react"));
var ModalPeekIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react21.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react21.default.createElement("path", {
  d: "M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react21.default.createElement("path", {
  d: "M16.6667 6.00001H7.20015C6.50001 5.99999 6.00005 6.00003 6.00017 7.33335C6.00027 8.4402 6.00021 13.8198 6.00018 15.8823L6.00017 16.6667C6.00017 18 6.00017 18 7.20015 18H16.6667C18 18 18 18 18 16.6667V7.33335C18 6.00001 18 6.00001 16.6667 6.00001H16.6667Z",
  fill: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));

// src/icons/full-screen-peek-icon.tsx
var import_react22 = __toESM(require("react"));
var FullScreenPeekIcon = ({
  className = "text-current",
  ...rest
}) => /* @__PURE__ */ import_react22.default.createElement("svg", {
  viewBox: "0 0 24 24",
  className: `${className} stroke-2`,
  stroke: "currentColor",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  ...rest
}, /* @__PURE__ */ import_react22.default.createElement("path", {
  d: "M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}), /* @__PURE__ */ import_react22.default.createElement("path", {
  d: "M20 3H12V5V19V21H20C20.5523 21 21 20.1046 21 19V5C21 3.89543 20.5523 3 20 3Z",
  fill: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdminProfileIcon,
  ArchiveIcon,
  Button,
  ContrastIcon,
  CopyIcon,
  CreateIcon,
  DiceIcon,
  DoubleCircleIcon,
  ExternalLinkIcon,
  FullScreenPeekIcon,
  Input,
  LayerStackIcon,
  LayersIcon,
  LinearProgressIndicator,
  Loader,
  ModalPeekIcon,
  PhotoFilterIcon,
  ProgressBar,
  RadialProgressBar,
  SidePeekIcon,
  Spinner,
  SubscribeIcon,
  TextArea,
  ToggleSwitch,
  Tooltip,
  UserGroupIcon
});
