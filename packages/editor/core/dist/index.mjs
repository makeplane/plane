var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
var getEditorClassNames = ({ noBorder, borderOnFocus, customClassName }) => cn(
  "relative w-full max-w-full sm:rounded-lg mt-2 p-3 relative focus:outline-none rounded-md",
  noBorder ? "" : "border border-custom-border-200",
  borderOnFocus ? "focus:border border-custom-border-300" : "focus:border-0",
  customClassName
);
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
var findTableAncestor = (node) => {
  while (node !== null && node.nodeName !== "TABLE") {
    node = node.parentNode;
  }
  return node;
};
var getTrimmedHTML = (html) => {
  html = html.replace(/^(<p><\/p>)+/, "");
  html = html.replace(/(<p><\/p>)+$/, "");
  return html;
};

// src/ui/plugins/upload-image.tsx
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
var uploadKey = new PluginKey("upload-image");
var UploadImagesPlugin = () => new Plugin({
  key: uploadKey,
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, set) {
      set = set.map(tr.mapping, tr.doc);
      const action = tr.getMeta(uploadKey);
      if (action && action.add) {
        const { id, pos, src } = action.add;
        const placeholder = document.createElement("div");
        placeholder.setAttribute("class", "img-placeholder");
        const image = document.createElement("img");
        image.setAttribute("class", "opacity-10 rounded-lg border border-custom-border-300");
        image.src = src;
        placeholder.appendChild(image);
        const deco = Decoration.widget(pos + 1, placeholder, {
          id
        });
        set = set.add(tr.doc, [deco]);
      } else if (action && action.remove) {
        set = set.remove(set.find(void 0, void 0, (spec) => spec.id == action.remove.id));
      }
      return set;
    }
  },
  props: {
    decorations(state) {
      return this.getState(state);
    }
  }
});
var upload_image_default = UploadImagesPlugin;
function findPlaceholder(state, id) {
  const decos = uploadKey.getState(state);
  const found = decos.find(
    void 0,
    void 0,
    (spec) => spec.id == id
  );
  return found.length ? found[0].from : null;
}
function startImageUpload(file, view, pos, uploadFile, setIsSubmitting) {
  return __async(this, null, function* () {
    if (!file.type.includes("image/")) {
      return;
    }
    const id = {};
    const tr = view.state.tr;
    if (!tr.selection.empty)
      tr.deleteSelection();
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      tr.setMeta(uploadKey, {
        add: {
          id,
          pos,
          src: reader.result
        }
      });
      view.dispatch(tr);
    };
    setIsSubmitting == null ? void 0 : setIsSubmitting("submitting");
    const src = yield UploadImageHandler(file, uploadFile);
    const { schema } = view.state;
    pos = findPlaceholder(view.state, id);
    if (pos == null)
      return;
    const imageSrc = typeof src === "object" ? reader.result : src;
    const node = schema.nodes.image.create({ src: imageSrc });
    const transaction = view.state.tr.replaceWith(pos, pos, node).setMeta(uploadKey, { remove: { id } });
    view.dispatch(transaction);
  });
}
var UploadImageHandler = (file, uploadFile) => {
  try {
    return new Promise((resolve, reject) => __async(void 0, null, function* () {
      try {
        const imageUrl = yield uploadFile(file);
        const image = new Image();
        image.src = imageUrl;
        image.onload = () => {
          resolve(imageUrl);
        };
      } catch (error) {
        if (error instanceof Error) {
          console.log(error.message);
        }
        reject(error);
      }
    }));
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    }
    return Promise.reject(error);
  }
};

// src/ui/components/editor-container.tsx
import { jsx } from "react/jsx-runtime";
var EditorContainer = ({ editor, editorClassNames, children }) => /* @__PURE__ */ jsx(
  "div",
  {
    id: "editor-container",
    onClick: () => {
      editor == null ? void 0 : editor.chain().focus().run();
    },
    className: `cursor-text ${editorClassNames}`,
    children
  }
);

// src/ui/components/editor-content.tsx
import { EditorContent } from "@tiptap/react";

// ../../../node_modules/@egjs/agent/dist/agent.esm.js
function some(arr, callback) {
  var length = arr.length;
  for (var i = 0; i < length; ++i) {
    if (callback(arr[i], i)) {
      return true;
    }
  }
  return false;
}
function find(arr, callback) {
  var length = arr.length;
  for (var i = 0; i < length; ++i) {
    if (callback(arr[i], i)) {
      return arr[i];
    }
  }
  return null;
}
function getUserAgentString(agent3) {
  var userAgent = agent3;
  if (typeof userAgent === "undefined") {
    if (typeof navigator === "undefined" || !navigator) {
      return "";
    }
    userAgent = navigator.userAgent || "";
  }
  return userAgent.toLowerCase();
}
function execRegExp(pattern, text) {
  try {
    return new RegExp(pattern, "g").exec(text);
  } catch (e) {
    return null;
  }
}
function hasUserAgentData() {
  if (typeof navigator === "undefined" || !navigator || !navigator.userAgentData) {
    return false;
  }
  var userAgentData = navigator.userAgentData;
  var brands = userAgentData.brands || userAgentData.uaList;
  return !!(brands && brands.length);
}
function findVersion(versionTest, userAgent) {
  var result = execRegExp("(" + versionTest + ")((?:\\/|\\s|:)([0-9|\\.|_]+))", userAgent);
  return result ? result[3] : "";
}
function convertVersion(text) {
  return text.replace(/_/g, ".");
}
function findPreset(presets, userAgent) {
  var userPreset = null;
  var version2 = "-1";
  some(presets, function(preset) {
    var result = execRegExp("(" + preset.test + ")((?:\\/|\\s|:)([0-9|\\.|_]+))?", userAgent);
    if (!result || preset.brand) {
      return false;
    }
    userPreset = preset;
    version2 = result[3] || "-1";
    if (preset.versionAlias) {
      version2 = preset.versionAlias;
    } else if (preset.versionTest) {
      version2 = findVersion(preset.versionTest.toLowerCase(), userAgent) || version2;
    }
    version2 = convertVersion(version2);
    return true;
  });
  return {
    preset: userPreset,
    version: version2
  };
}
function findPresetBrand(presets, brands) {
  var brandInfo = {
    brand: "",
    version: "-1"
  };
  some(presets, function(preset) {
    var result = findBrand(brands, preset);
    if (!result) {
      return false;
    }
    brandInfo.brand = preset.id;
    brandInfo.version = preset.versionAlias || result.version;
    return brandInfo.version !== "-1";
  });
  return brandInfo;
}
function findBrand(brands, preset) {
  return find(brands, function(_a) {
    var brand = _a.brand;
    return execRegExp("" + preset.test, brand.toLowerCase());
  });
}
var BROWSER_PRESETS = [{
  test: "phantomjs",
  id: "phantomjs"
}, {
  test: "whale",
  id: "whale"
}, {
  test: "edgios|edge|edg",
  id: "edge"
}, {
  test: "msie|trident|windows phone",
  id: "ie",
  versionTest: "iemobile|msie|rv"
}, {
  test: "miuibrowser",
  id: "miui browser"
}, {
  test: "samsungbrowser",
  id: "samsung internet"
}, {
  test: "samsung",
  id: "samsung internet",
  versionTest: "version"
}, {
  test: "chrome|crios",
  id: "chrome"
}, {
  test: "firefox|fxios",
  id: "firefox"
}, {
  test: "android",
  id: "android browser",
  versionTest: "version"
}, {
  test: "safari|iphone|ipad|ipod",
  id: "safari",
  versionTest: "version"
}];
var CHROMIUM_PRESETS = [{
  test: "(?=.*applewebkit/(53[0-7]|5[0-2]|[0-4]))(?=.*\\schrome)",
  id: "chrome",
  versionTest: "chrome"
}, {
  test: "chromium",
  id: "chrome"
}, {
  test: "whale",
  id: "chrome",
  versionAlias: "-1",
  brand: true
}];
var WEBKIT_PRESETS = [{
  test: "applewebkit",
  id: "webkit",
  versionTest: "applewebkit|safari"
}];
var WEBVIEW_PRESETS = [{
  test: "(?=(iphone|ipad))(?!(.*version))",
  id: "webview"
}, {
  test: "(?=(android|iphone|ipad))(?=.*(naver|daum|; wv))",
  id: "webview"
}, {
  // test webview
  test: "webview",
  id: "webview"
}];
var OS_PRESETS = [{
  test: "windows phone",
  id: "windows phone"
}, {
  test: "windows 2000",
  id: "window",
  versionAlias: "5.0"
}, {
  test: "windows nt",
  id: "window"
}, {
  test: "win32|windows",
  id: "window"
}, {
  test: "iphone|ipad|ipod",
  id: "ios",
  versionTest: "iphone os|cpu os"
}, {
  test: "macos|macintel|mac os x",
  id: "mac"
}, {
  test: "android|linux armv81",
  id: "android"
}, {
  test: "tizen",
  id: "tizen"
}, {
  test: "webos|web0s",
  id: "webos"
}];
function isWebView(userAgent) {
  return !!findPreset(WEBVIEW_PRESETS, userAgent).preset;
}
function getLegacyAgent(userAgent) {
  var nextAgent = getUserAgentString(userAgent);
  var isMobile = !!/mobi/g.exec(nextAgent);
  var browser = {
    name: "unknown",
    version: "-1",
    majorVersion: -1,
    webview: isWebView(nextAgent),
    chromium: false,
    chromiumVersion: "-1",
    webkit: false,
    webkitVersion: "-1"
  };
  var os = {
    name: "unknown",
    version: "-1",
    majorVersion: -1
  };
  var _a = findPreset(BROWSER_PRESETS, nextAgent), browserPreset = _a.preset, browserVersion2 = _a.version;
  var _b = findPreset(OS_PRESETS, nextAgent), osPreset = _b.preset, osVersion = _b.version;
  var chromiumPreset = findPreset(CHROMIUM_PRESETS, nextAgent);
  browser.chromium = !!chromiumPreset.preset;
  browser.chromiumVersion = chromiumPreset.version;
  if (!browser.chromium) {
    var webkitPreset = findPreset(WEBKIT_PRESETS, nextAgent);
    browser.webkit = !!webkitPreset.preset;
    browser.webkitVersion = webkitPreset.version;
  }
  if (osPreset) {
    os.name = osPreset.id;
    os.version = osVersion;
    os.majorVersion = parseInt(osVersion, 10);
  }
  if (browserPreset) {
    browser.name = browserPreset.id;
    browser.version = browserVersion2;
    if (browser.webview && os.name === "ios" && browser.name !== "safari") {
      browser.webview = false;
    }
  }
  browser.majorVersion = parseInt(browser.version, 10);
  return {
    browser,
    os,
    isMobile,
    isHints: false
  };
}
function getClientHintsAgent(osData) {
  var userAgentData = navigator.userAgentData;
  var brands = (userAgentData.uaList || userAgentData.brands).slice();
  var fullVersionList = osData && osData.fullVersionList;
  var isMobile = userAgentData.mobile || false;
  var firstBrand = brands[0];
  var platform = (osData && osData.platform || userAgentData.platform || navigator.platform).toLowerCase();
  var browser = {
    name: firstBrand.brand,
    version: firstBrand.version,
    majorVersion: -1,
    webkit: false,
    webkitVersion: "-1",
    chromium: false,
    chromiumVersion: "-1",
    webview: !!findPresetBrand(WEBVIEW_PRESETS, brands).brand || isWebView(getUserAgentString())
  };
  var os = {
    name: "unknown",
    version: "-1",
    majorVersion: -1
  };
  browser.webkit = !browser.chromium && some(WEBKIT_PRESETS, function(preset) {
    return findBrand(brands, preset);
  });
  var chromiumBrand = findPresetBrand(CHROMIUM_PRESETS, brands);
  browser.chromium = !!chromiumBrand.brand;
  browser.chromiumVersion = chromiumBrand.version;
  if (!browser.chromium) {
    var webkitBrand = findPresetBrand(WEBKIT_PRESETS, brands);
    browser.webkit = !!webkitBrand.brand;
    browser.webkitVersion = webkitBrand.version;
  }
  var platfomResult = find(OS_PRESETS, function(preset) {
    return new RegExp("" + preset.test, "g").exec(platform);
  });
  os.name = platfomResult ? platfomResult.id : "";
  if (osData) {
    os.version = osData.platformVersion;
  }
  if (fullVersionList && fullVersionList.length) {
    var browserBrandByFullVersionList = findPresetBrand(BROWSER_PRESETS, fullVersionList);
    browser.name = browserBrandByFullVersionList.brand || browser.name;
    browser.version = browserBrandByFullVersionList.version || browser.version;
  } else {
    var browserBrand = findPresetBrand(BROWSER_PRESETS, brands);
    browser.name = browserBrand.brand || browser.name;
    browser.version = browserBrand.brand && osData ? osData.uaFullVersion : browserBrand.version;
  }
  if (browser.webkit) {
    os.name = isMobile ? "ios" : "mac";
  }
  if (os.name === "ios" && browser.webview) {
    browser.version = "-1";
  }
  os.version = convertVersion(os.version);
  browser.version = convertVersion(browser.version);
  os.majorVersion = parseInt(os.version, 10);
  browser.majorVersion = parseInt(browser.version, 10);
  return {
    browser,
    os,
    isMobile,
    isHints: true
  };
}
function agent(userAgent) {
  if (typeof userAgent === "undefined" && hasUserAgentData()) {
    return getClientHintsAgent();
  } else {
    return getLegacyAgent(userAgent);
  }
}
var agent_esm_default = agent;

// ../../../node_modules/framework-utils/dist/utils.esm.js
function prefixNames(prefix2) {
  var classNames = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    classNames[_i - 1] = arguments[_i];
  }
  return classNames.map(function(className) {
    return className.split(" ").map(function(name) {
      return name ? "" + prefix2 + name : "";
    }).join(" ");
  }).join(" ");
}
function prefixCSS(prefix2, css2) {
  return css2.replace(/([^}{]*){/gm, function(_, selector) {
    return selector.replace(/\.([^{,\s\d.]+)/g, "." + prefix2 + "$1") + "{";
  });
}
function ref(target, name) {
  return function(e) {
    e && (target[name] = e);
  };
}
function refs(target, name, i) {
  return function(e) {
    e && (target[name][i] = e);
  };
}
function withMethods(methods, duplicate) {
  if (duplicate === void 0) {
    duplicate = {};
  }
  return function(prototype, propertyName) {
    methods.forEach(function(name) {
      var methodName = duplicate[name] || name;
      if (methodName in prototype) {
        return;
      }
      prototype[methodName] = function() {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var result = (_a = this[propertyName])[name].apply(_a, args);
        if (result === this[propertyName]) {
          return this;
        } else {
          return result;
        }
      };
    });
  };
}

// ../../../node_modules/@daybrush/utils/dist/utils.esm.js
var FUNCTION = "function";
var OBJECT = "object";
var STRING = "string";
var NUMBER = "number";
var UNDEFINED = "undefined";
var IS_WINDOW = typeof window !== UNDEFINED;
var doc = typeof document !== UNDEFINED && document;
var OPEN_CLOSED_CHARACTERS = [{
  open: "(",
  close: ")"
}, {
  open: '"',
  close: '"'
}, {
  open: "'",
  close: "'"
}, {
  open: '\\"',
  close: '\\"'
}, {
  open: "\\'",
  close: "\\'"
}];
var TINY_NUM = 1e-7;
var REVERSE_TINY_NUM = 1 / TINY_NUM;
var DEFAULT_UNIT_PRESETS = {
  "cm": function(pos) {
    return pos * 96 / 2.54;
  },
  "mm": function(pos) {
    return pos * 96 / 254;
  },
  "in": function(pos) {
    return pos * 96;
  },
  "pt": function(pos) {
    return pos * 96 / 72;
  },
  "pc": function(pos) {
    return pos * 96 / 6;
  },
  "%": function(pos, size) {
    return pos * size / 100;
  },
  "vw": function(pos, size) {
    if (size === void 0) {
      size = window.innerWidth;
    }
    return pos / 100 * size;
  },
  "vh": function(pos, size) {
    if (size === void 0) {
      size = window.innerHeight;
    }
    return pos / 100 * size;
  },
  "vmax": function(pos, size) {
    if (size === void 0) {
      size = Math.max(window.innerWidth, window.innerHeight);
    }
    return pos / 100 * size;
  },
  "vmin": function(pos, size) {
    if (size === void 0) {
      size = Math.min(window.innerWidth, window.innerHeight);
    }
    return pos / 100 * size;
  }
};
function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++)
    s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
      r[k] = a[j];
  return r;
}
function dot(a1, a2, b1, b2) {
  return (a1 * b2 + a2 * b1) / (b1 + b2);
}
function isUndefined(value) {
  return typeof value === UNDEFINED;
}
function isObject(value) {
  return value && typeof value === OBJECT;
}
function isArray(value) {
  return Array.isArray(value);
}
function isString(value) {
  return typeof value === STRING;
}
function isNumber(value) {
  return typeof value === NUMBER;
}
function isFunction(value) {
  return typeof value === FUNCTION;
}
function isEqualSeparator(character, separator) {
  var isCharacterSpace = character === "" || character == " ";
  var isSeparatorSpace = separator === "" || separator == " ";
  return isSeparatorSpace && isCharacterSpace || character === separator;
}
function findOpen(openCharacter, texts, index, length, openCloseCharacters) {
  var isIgnore = findIgnore(openCharacter, texts, index);
  if (!isIgnore) {
    return findClose(openCharacter, texts, index + 1, length, openCloseCharacters);
  }
  return index;
}
function findIgnore(character, texts, index) {
  if (!character.ignore) {
    return null;
  }
  var otherText = texts.slice(Math.max(index - 3, 0), index + 3).join("");
  return new RegExp(character.ignore).exec(otherText);
}
function findClose(closeCharacter, texts, index, length, openCloseCharacters) {
  var _loop_1 = function(i2) {
    var character = texts[i2].trim();
    if (character === closeCharacter.close && !findIgnore(closeCharacter, texts, i2)) {
      return {
        value: i2
      };
    }
    var nextIndex = i2;
    var openCharacter = find2(openCloseCharacters, function(_a) {
      var open = _a.open;
      return open === character;
    });
    if (openCharacter) {
      nextIndex = findOpen(openCharacter, texts, i2, length, openCloseCharacters);
    }
    if (nextIndex === -1) {
      return out_i_1 = i2, "break";
    }
    i2 = nextIndex;
    out_i_1 = i2;
  };
  var out_i_1;
  for (var i = index; i < length; ++i) {
    var state_1 = _loop_1(i);
    i = out_i_1;
    if (typeof state_1 === "object")
      return state_1.value;
    if (state_1 === "break")
      break;
  }
  return -1;
}
function splitText(text, splitOptions) {
  var _a = isString(splitOptions) ? {
    separator: splitOptions
  } : splitOptions, _b = _a.separator, separator = _b === void 0 ? "," : _b, isSeparateFirst = _a.isSeparateFirst, isSeparateOnlyOpenClose = _a.isSeparateOnlyOpenClose, _c = _a.isSeparateOpenClose, isSeparateOpenClose = _c === void 0 ? isSeparateOnlyOpenClose : _c, _d = _a.openCloseCharacters, openCloseCharacters = _d === void 0 ? OPEN_CLOSED_CHARACTERS : _d;
  var openClosedText = openCloseCharacters.map(function(_a2) {
    var open = _a2.open, close = _a2.close;
    if (open === close) {
      return open;
    }
    return open + "|" + close;
  }).join("|");
  var regexText = "(\\s*" + separator + "\\s*|" + openClosedText + "|\\s+)";
  var regex = new RegExp(regexText, "g");
  var texts = text.split(regex).filter(function(chr) {
    return chr && chr !== "undefined";
  });
  var length = texts.length;
  var values = [];
  var tempValues = [];
  function resetTemp() {
    if (tempValues.length) {
      values.push(tempValues.join(""));
      tempValues = [];
      return true;
    }
    return false;
  }
  var _loop_2 = function(i2) {
    var character = texts[i2].trim();
    var nextIndex = i2;
    var openCharacter = find2(openCloseCharacters, function(_a2) {
      var open = _a2.open;
      return open === character;
    });
    var closeCharacter = find2(openCloseCharacters, function(_a2) {
      var close = _a2.close;
      return close === character;
    });
    if (openCharacter) {
      nextIndex = findOpen(openCharacter, texts, i2, length, openCloseCharacters);
      if (nextIndex !== -1 && isSeparateOpenClose) {
        if (resetTemp() && isSeparateFirst) {
          return out_i_2 = i2, "break";
        }
        values.push(texts.slice(i2, nextIndex + 1).join(""));
        i2 = nextIndex;
        if (isSeparateFirst) {
          return out_i_2 = i2, "break";
        }
        return out_i_2 = i2, "continue";
      }
    } else if (closeCharacter && !findIgnore(closeCharacter, texts, i2)) {
      var nextOpenCloseCharacters = __spreadArrays(openCloseCharacters);
      nextOpenCloseCharacters.splice(openCloseCharacters.indexOf(closeCharacter), 1);
      return {
        value: splitText(text, {
          separator,
          isSeparateFirst,
          isSeparateOnlyOpenClose,
          isSeparateOpenClose,
          openCloseCharacters: nextOpenCloseCharacters
        })
      };
    } else if (isEqualSeparator(character, separator) && !isSeparateOnlyOpenClose) {
      resetTemp();
      if (isSeparateFirst) {
        return out_i_2 = i2, "break";
      }
      return out_i_2 = i2, "continue";
    }
    if (nextIndex === -1) {
      nextIndex = length - 1;
    }
    tempValues.push(texts.slice(i2, nextIndex + 1).join(""));
    i2 = nextIndex;
    out_i_2 = i2;
  };
  var out_i_2;
  for (var i = 0; i < length; ++i) {
    var state_2 = _loop_2(i);
    i = out_i_2;
    if (typeof state_2 === "object")
      return state_2.value;
    if (state_2 === "break")
      break;
  }
  if (tempValues.length) {
    values.push(tempValues.join(""));
  }
  return values;
}
function splitSpace(text) {
  return splitText(text, "");
}
function splitComma(text) {
  return splitText(text, ",");
}
function splitBracket(text) {
  var matches = /([^(]*)\(([\s\S]*)\)([\s\S]*)/g.exec(text);
  if (!matches || matches.length < 4) {
    return {};
  } else {
    return {
      prefix: matches[1],
      value: matches[2],
      suffix: matches[3]
    };
  }
}
function splitUnit(text) {
  var matches = /^([^\d|e|\-|\+]*)((?:\d|\.|-|e-|e\+)+)(\S*)$/g.exec(text);
  if (!matches) {
    return {
      prefix: "",
      unit: "",
      value: NaN
    };
  }
  var prefix2 = matches[1];
  var value = matches[2];
  var unit = matches[3];
  return {
    prefix: prefix2,
    unit,
    value: parseFloat(value)
  };
}
function decamelize(str, separator) {
  if (separator === void 0) {
    separator = "-";
  }
  return str.replace(/([a-z])([A-Z])/g, function(all, letter, letter2) {
    return "" + letter + separator + letter2.toLowerCase();
  });
}
function now() {
  return Date.now ? Date.now() : (/* @__PURE__ */ new Date()).getTime();
}
function findIndex(arr, callback, defaultIndex) {
  if (defaultIndex === void 0) {
    defaultIndex = -1;
  }
  var length = arr.length;
  for (var i = 0; i < length; ++i) {
    if (callback(arr[i], i, arr)) {
      return i;
    }
  }
  return defaultIndex;
}
function find2(arr, callback, defalutValue) {
  var index = findIndex(arr, callback);
  return index > -1 ? arr[index] : defalutValue;
}
var requestAnimationFrame2 = /* @__PURE__ */ function() {
  var firstTime = now();
  var raf = IS_WINDOW && (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame);
  return raf ? raf.bind(window) : function(callback) {
    var currTime = now();
    var id = setTimeout(function() {
      callback(currTime - firstTime);
    }, 1e3 / 60);
    return id;
  };
}();
var cancelAnimationFrame = /* @__PURE__ */ function() {
  var caf = IS_WINDOW && (window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame);
  return caf ? caf.bind(window) : function(handle) {
    clearTimeout(handle);
  };
}();
function getKeys(obj) {
  return Object.keys(obj);
}
function convertUnitSize(pos, size) {
  var _a = splitUnit(pos), value = _a.value, unit = _a.unit;
  if (isObject(size)) {
    var sizeFunction = size[unit];
    if (sizeFunction) {
      if (isFunction(sizeFunction)) {
        return sizeFunction(value);
      } else if (DEFAULT_UNIT_PRESETS[unit]) {
        return DEFAULT_UNIT_PRESETS[unit](value, sizeFunction);
      }
    }
  } else if (unit === "%") {
    return value * size / 100;
  }
  if (DEFAULT_UNIT_PRESETS[unit]) {
    return DEFAULT_UNIT_PRESETS[unit](value);
  }
  return value;
}
function between(value, min, max) {
  return Math.max(min, Math.min(value, max));
}
function checkBoundSize(targetSize, compareSize, isMax, ratio) {
  if (ratio === void 0) {
    ratio = targetSize[0] / targetSize[1];
  }
  return [[throttle(compareSize[0], TINY_NUM), throttle(compareSize[0] / ratio, TINY_NUM)], [throttle(compareSize[1] * ratio, TINY_NUM), throttle(compareSize[1], TINY_NUM)]].filter(function(size) {
    return size.every(function(value, i) {
      var defaultSize = compareSize[i];
      var throttledSize = throttle(defaultSize, TINY_NUM);
      return isMax ? value <= defaultSize || value <= throttledSize : value >= defaultSize || value >= throttledSize;
    });
  })[0] || targetSize;
}
function calculateBoundSize(size, minSize, maxSize, keepRatio) {
  if (!keepRatio) {
    return size.map(function(value, i) {
      return between(value, minSize[i], maxSize[i]);
    });
  }
  var width = size[0], height = size[1];
  var ratio = keepRatio === true ? width / height : keepRatio;
  var _a = checkBoundSize(size, minSize, false, ratio), minWidth = _a[0], minHeight = _a[1];
  var _b = checkBoundSize(size, maxSize, true, ratio), maxWidth = _b[0], maxHeight = _b[1];
  if (width < minWidth || height < minHeight) {
    width = minWidth;
    height = minHeight;
  } else if (width > maxWidth || height > maxHeight) {
    width = maxWidth;
    height = maxHeight;
  }
  return [width, height];
}
function sum(nums) {
  var length = nums.length;
  var total = 0;
  for (var i = length - 1; i >= 0; --i) {
    total += nums[i];
  }
  return total;
}
function average(nums) {
  var length = nums.length;
  var total = 0;
  for (var i = length - 1; i >= 0; --i) {
    total += nums[i];
  }
  return length ? total / length : 0;
}
function getRad(pos1, pos2) {
  var distX = pos2[0] - pos1[0];
  var distY = pos2[1] - pos1[1];
  var rad = Math.atan2(distY, distX);
  return rad >= 0 ? rad : rad + Math.PI * 2;
}
function getCenterPoint(points) {
  return [0, 1].map(function(i) {
    return average(points.map(function(pos) {
      return pos[i];
    }));
  });
}
function getShapeDirection(points) {
  var center = getCenterPoint(points);
  var pos1Rad = getRad(center, points[0]);
  var pos2Rad = getRad(center, points[1]);
  return pos1Rad < pos2Rad && pos2Rad - pos1Rad < Math.PI || pos1Rad > pos2Rad && pos2Rad - pos1Rad < -Math.PI ? 1 : -1;
}
function getDist(a, b) {
  return Math.sqrt(Math.pow((b ? b[0] : 0) - a[0], 2) + Math.pow((b ? b[1] : 0) - a[1], 2));
}
function throttle(num, unit) {
  if (!unit) {
    return num;
  }
  var reverseUnit = 1 / unit;
  return Math.round(num / unit) / reverseUnit;
}
function throttleArray(nums, unit) {
  nums.forEach(function(_, i) {
    nums[i] = throttle(nums[i], unit);
  });
  return nums;
}
function counter(num) {
  var nums = [];
  for (var i = 0; i < num; ++i) {
    nums.push(i);
  }
  return nums;
}
function hasClass(element, className) {
  if (element.classList) {
    return element.classList.contains(className);
  }
  return !!element.className.match(new RegExp("(\\s|^)" + className + "(\\s|$)"));
}
function addClass(element, className) {
  if (element.classList) {
    element.classList.add(className);
  } else {
    element.className += " " + className;
  }
}
function removeClass(element, className) {
  if (element.classList) {
    element.classList.remove(className);
  } else {
    var reg = new RegExp("(\\s|^)" + className + "(\\s|$)");
    element.className = element.className.replace(reg, " ");
  }
}
function addEvent(el, type, listener, options) {
  el.addEventListener(type, listener, options);
}
function removeEvent(el, type, listener, options) {
  el.removeEventListener(type, listener, options);
}
function getDocument(el) {
  return (el === null || el === void 0 ? void 0 : el.ownerDocument) || doc;
}
function getDocumentElement(el) {
  return getDocument(el).documentElement;
}
function getDocumentBody(el) {
  return getDocument(el).body;
}
function getWindow(el) {
  var _a;
  return ((_a = el === null || el === void 0 ? void 0 : el.ownerDocument) === null || _a === void 0 ? void 0 : _a.defaultView) || window;
}
function isWindow(val) {
  return val && "postMessage" in val && "blur" in val && "self" in val;
}
function isNode(el) {
  return isObject(el) && el.nodeName && el.nodeType && "ownerDocument" in el;
}

// ../../../node_modules/@scena/matrix/dist/matrix.esm.js
function add(matrix, inverseMatrix, startIndex, fromIndex, n, k) {
  for (var i = 0; i < n; ++i) {
    var x = startIndex + i * n;
    var fromX = fromIndex + i * n;
    matrix[x] += matrix[fromX] * k;
    inverseMatrix[x] += inverseMatrix[fromX] * k;
  }
}
function swap(matrix, inverseMatrix, startIndex, fromIndex, n) {
  for (var i = 0; i < n; ++i) {
    var x = startIndex + i * n;
    var fromX = fromIndex + i * n;
    var v = matrix[x];
    var iv = inverseMatrix[x];
    matrix[x] = matrix[fromX];
    matrix[fromX] = v;
    inverseMatrix[x] = inverseMatrix[fromX];
    inverseMatrix[fromX] = iv;
  }
}
function divide(matrix, inverseMatrix, startIndex, n, k) {
  for (var i = 0; i < n; ++i) {
    var x = startIndex + i * n;
    matrix[x] /= k;
    inverseMatrix[x] /= k;
  }
}
function ignoreDimension(matrix, m, n) {
  if (n === void 0) {
    n = Math.sqrt(matrix.length);
  }
  var newMatrix = matrix.slice();
  for (var i = 0; i < n; ++i) {
    newMatrix[i * n + m - 1] = 0;
    newMatrix[(m - 1) * n + i] = 0;
  }
  newMatrix[(m - 1) * (n + 1)] = 1;
  return newMatrix;
}
function invert(matrix, n) {
  if (n === void 0) {
    n = Math.sqrt(matrix.length);
  }
  var newMatrix = matrix.slice();
  var inverseMatrix = createIdentityMatrix(n);
  for (var i = 0; i < n; ++i) {
    var identityIndex = n * i + i;
    if (!throttle(newMatrix[identityIndex], TINY_NUM)) {
      for (var j = i + 1; j < n; ++j) {
        if (newMatrix[n * i + j]) {
          swap(newMatrix, inverseMatrix, i, j, n);
          break;
        }
      }
    }
    if (!throttle(newMatrix[identityIndex], TINY_NUM)) {
      return [];
    }
    divide(newMatrix, inverseMatrix, i, n, newMatrix[identityIndex]);
    for (var j = 0; j < n; ++j) {
      var targetStartIndex = j;
      var targetIndex = j + i * n;
      var target = newMatrix[targetIndex];
      if (!throttle(target, TINY_NUM) || i === j) {
        continue;
      }
      add(newMatrix, inverseMatrix, targetStartIndex, i, n, -target);
    }
  }
  return inverseMatrix;
}
function transpose(matrix, n) {
  if (n === void 0) {
    n = Math.sqrt(matrix.length);
  }
  var newMatrix = [];
  for (var i = 0; i < n; ++i) {
    for (var j = 0; j < n; ++j) {
      newMatrix[j * n + i] = matrix[n * i + j];
    }
  }
  return newMatrix;
}
function getOrigin(matrix, n) {
  if (n === void 0) {
    n = Math.sqrt(matrix.length);
  }
  var originMatrix = [];
  var w = matrix[n * n - 1];
  for (var i = 0; i < n - 1; ++i) {
    originMatrix[i] = matrix[n * (n - 1) + i] / w;
  }
  originMatrix[n - 1] = 0;
  return originMatrix;
}
function fromTranslation(pos, n) {
  var newMatrix = createIdentityMatrix(n);
  for (var i = 0; i < n - 1; ++i) {
    newMatrix[n * (n - 1) + i] = pos[i] || 0;
  }
  return newMatrix;
}
function convertPositionMatrix(matrix, n) {
  var newMatrix = matrix.slice();
  for (var i = matrix.length; i < n - 1; ++i) {
    newMatrix[i] = 0;
  }
  newMatrix[n - 1] = 1;
  return newMatrix;
}
function convertDimension(matrix, n, m) {
  if (n === void 0) {
    n = Math.sqrt(matrix.length);
  }
  if (n === m) {
    return matrix;
  }
  var newMatrix = createIdentityMatrix(m);
  var length = Math.min(n, m);
  for (var i = 0; i < length - 1; ++i) {
    for (var j = 0; j < length - 1; ++j) {
      newMatrix[i * m + j] = matrix[i * n + j];
    }
    newMatrix[(i + 1) * m - 1] = matrix[(i + 1) * n - 1];
    newMatrix[(m - 1) * m + i] = matrix[(n - 1) * n + i];
  }
  newMatrix[m * m - 1] = matrix[n * n - 1];
  return newMatrix;
}
function multiplies(n) {
  var matrixes = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    matrixes[_i - 1] = arguments[_i];
  }
  var m = createIdentityMatrix(n);
  matrixes.forEach(function(matrix) {
    m = multiply(m, matrix, n);
  });
  return m;
}
function multiply(matrix, matrix2, n) {
  if (n === void 0) {
    n = Math.sqrt(matrix.length);
  }
  var newMatrix = [];
  var m = matrix.length / n;
  var k = matrix2.length / m;
  if (!m) {
    return matrix2;
  } else if (!k) {
    return matrix;
  }
  for (var i = 0; i < n; ++i) {
    for (var j = 0; j < k; ++j) {
      newMatrix[j * n + i] = 0;
      for (var l = 0; l < m; ++l) {
        newMatrix[j * n + i] += matrix[l * n + i] * matrix2[j * m + l];
      }
    }
  }
  return newMatrix;
}
function plus(pos1, pos2) {
  var length = Math.min(pos1.length, pos2.length);
  var nextPos = pos1.slice();
  for (var i = 0; i < length; ++i) {
    nextPos[i] = nextPos[i] + pos2[i];
  }
  return nextPos;
}
function minus(pos1, pos2) {
  var length = Math.min(pos1.length, pos2.length);
  var nextPos = pos1.slice();
  for (var i = 0; i < length; ++i) {
    nextPos[i] = nextPos[i] - pos2[i];
  }
  return nextPos;
}
function convertCSStoMatrix(a, is2d) {
  if (is2d === void 0) {
    is2d = a.length === 6;
  }
  if (is2d) {
    return [a[0], a[1], 0, a[2], a[3], 0, a[4], a[5], 1];
  }
  return a;
}
function convertMatrixtoCSS(a, is2d) {
  if (is2d === void 0) {
    is2d = a.length === 9;
  }
  if (is2d) {
    return [a[0], a[1], a[3], a[4], a[6], a[7]];
  }
  return a;
}
function calculate(matrix, matrix2, n) {
  if (n === void 0) {
    n = matrix2.length;
  }
  var result = multiply(matrix, matrix2, n);
  var k = result[n - 1];
  return result.map(function(v) {
    return v / k;
  });
}
function rotateX3d(matrix, rad) {
  return multiply(matrix, [1, 0, 0, 0, 0, Math.cos(rad), Math.sin(rad), 0, 0, -Math.sin(rad), Math.cos(rad), 0, 0, 0, 0, 1], 4);
}
function rotateY3d(matrix, rad) {
  return multiply(matrix, [Math.cos(rad), 0, -Math.sin(rad), 0, 0, 1, 0, 0, Math.sin(rad), 0, Math.cos(rad), 0, 0, 0, 0, 1], 4);
}
function rotateZ3d(matrix, rad) {
  return multiply(matrix, createRotateMatrix(rad, 4));
}
function scale3d(matrix, _a) {
  var _b = _a[0], sx = _b === void 0 ? 1 : _b, _c = _a[1], sy = _c === void 0 ? 1 : _c, _d = _a[2], sz = _d === void 0 ? 1 : _d;
  return multiply(matrix, [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1], 4);
}
function rotate(pos, rad) {
  return calculate(createRotateMatrix(rad, 3), convertPositionMatrix(pos, 3));
}
function translate3d(matrix, _a) {
  var _b = _a[0], tx = _b === void 0 ? 0 : _b, _c = _a[1], ty = _c === void 0 ? 0 : _c, _d = _a[2], tz = _d === void 0 ? 0 : _d;
  return multiply(matrix, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1], 4);
}
function matrix3d(matrix1, matrix2) {
  return multiply(matrix1, matrix2, 4);
}
function createRotateMatrix(rad, n) {
  var cos = Math.cos(rad);
  var sin = Math.sin(rad);
  var m = createIdentityMatrix(n);
  m[0] = cos;
  m[1] = sin;
  m[n] = -sin;
  m[n + 1] = cos;
  return m;
}
function createIdentityMatrix(n) {
  var length = n * n;
  var matrix = [];
  for (var i = 0; i < length; ++i) {
    matrix[i] = i % (n + 1) ? 0 : 1;
  }
  return matrix;
}
function createScaleMatrix(scale, n) {
  var m = createIdentityMatrix(n);
  var length = Math.min(scale.length, n - 1);
  for (var i = 0; i < length; ++i) {
    m[(n + 1) * i] = scale[i];
  }
  return m;
}
function createOriginMatrix(origin, n) {
  var m = createIdentityMatrix(n);
  var length = Math.min(origin.length, n - 1);
  for (var i = 0; i < length; ++i) {
    m[n * (n - 1) + i] = origin[i];
  }
  return m;
}
function createWarpMatrix(pos0, pos1, pos2, pos3, nextPos0, nextPos1, nextPos2, nextPos3) {
  var x0 = pos0[0], y0 = pos0[1];
  var x1 = pos1[0], y1 = pos1[1];
  var x2 = pos2[0], y2 = pos2[1];
  var x3 = pos3[0], y3 = pos3[1];
  var u0 = nextPos0[0], v0 = nextPos0[1];
  var u1 = nextPos1[0], v1 = nextPos1[1];
  var u2 = nextPos2[0], v2 = nextPos2[1];
  var u3 = nextPos3[0], v3 = nextPos3[1];
  var matrix = [x0, 0, x1, 0, x2, 0, x3, 0, y0, 0, y1, 0, y2, 0, y3, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, x0, 0, x1, 0, x2, 0, x3, 0, y0, 0, y1, 0, y2, 0, y3, 0, 1, 0, 1, 0, 1, 0, 1, -u0 * x0, -v0 * x0, -u1 * x1, -v1 * x1, -u2 * x2, -v2 * x2, -u3 * x3, -v3 * x3, -u0 * y0, -v0 * y0, -u1 * y1, -v1 * y1, -u2 * y2, -v2 * y2, -u3 * y3, -v3 * y3];
  var inverseMatrix = invert(matrix, 8);
  if (!inverseMatrix.length) {
    return [];
  }
  var h = multiply(inverseMatrix, [u0, v0, u1, v1, u2, v2, u3, v3], 8);
  h[8] = 1;
  return convertDimension(transpose(h), 3, 4);
}

// ../../../node_modules/css-to-mat/dist/css-to-mat.esm.js
var __assign = function() {
  __assign = Object.assign || function __assign7(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
function createMatrix() {
  return [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1
  ];
}
function parseMat(transform, size) {
  if (size === void 0) {
    size = 0;
  }
  return toMat(parse(transform, size));
}
function calculateMatrixDist(matrix, pos) {
  var res = calculate(matrix, [pos[0], pos[1] || 0, pos[2] || 0, 1], 4);
  var w = res[3] || 1;
  return [
    res[0] / w,
    res[1] / w,
    res[2] / w
  ];
}
function toMat(matrixInfos) {
  var target = createMatrix();
  matrixInfos.forEach(function(info) {
    var matrixFunction = info.matrixFunction, functionValue = info.functionValue;
    if (!matrixFunction) {
      return;
    }
    target = matrixFunction(target, functionValue);
  });
  return target;
}
function parse(transform, size) {
  if (size === void 0) {
    size = 0;
  }
  var transforms = isArray(transform) ? transform : splitSpace(transform);
  return transforms.map(function(t) {
    var _a = splitBracket(t), name = _a.prefix, value = _a.value;
    var matrixFunction = null;
    var functionName = name;
    var functionValue = "";
    if (name === "translate" || name === "translateX" || name === "translate3d") {
      var nextSize_1 = isObject(size) ? __assign(__assign({}, size), { "o%": size["%"] }) : {
        "%": size,
        "o%": size
      };
      var _b = splitComma(value).map(function(v, i) {
        if (i === 0 && "x%" in nextSize_1) {
          nextSize_1["%"] = size["x%"];
        } else if (i === 1 && "y%" in nextSize_1) {
          nextSize_1["%"] = size["y%"];
        } else {
          nextSize_1["%"] = size["o%"];
        }
        return convertUnitSize(v, nextSize_1);
      }), posX = _b[0], _c = _b[1], posY = _c === void 0 ? 0 : _c, _d = _b[2], posZ = _d === void 0 ? 0 : _d;
      matrixFunction = translate3d;
      functionValue = [posX, posY, posZ];
    } else if (name === "translateY") {
      var nextSize = isObject(size) ? __assign({ "%": size["y%"] }, size) : {
        "%": size
      };
      var posY = convertUnitSize(value, nextSize);
      matrixFunction = translate3d;
      functionValue = [0, posY, 0];
    } else if (name === "translateZ") {
      var posZ = parseFloat(value);
      matrixFunction = translate3d;
      functionValue = [0, 0, posZ];
    } else if (name === "scale" || name === "scale3d") {
      var _e = splitComma(value).map(function(v) {
        return parseFloat(v);
      }), sx = _e[0], _f = _e[1], sy = _f === void 0 ? sx : _f, _g = _e[2], sz = _g === void 0 ? 1 : _g;
      matrixFunction = scale3d;
      functionValue = [sx, sy, sz];
    } else if (name === "scaleX") {
      var sx = parseFloat(value);
      matrixFunction = scale3d;
      functionValue = [sx, 1, 1];
    } else if (name === "scaleY") {
      var sy = parseFloat(value);
      matrixFunction = scale3d;
      functionValue = [1, sy, 1];
    } else if (name === "scaleZ") {
      var sz = parseFloat(value);
      matrixFunction = scale3d;
      functionValue = [1, 1, sz];
    } else if (name === "rotate" || name === "rotateZ" || name === "rotateX" || name === "rotateY") {
      var _h = splitUnit(value), unit = _h.unit, unitValue = _h.value;
      var rad = unit === "rad" ? unitValue : unitValue * Math.PI / 180;
      if (name === "rotate" || name === "rotateZ") {
        functionName = "rotateZ";
        matrixFunction = rotateZ3d;
      } else if (name === "rotateX") {
        matrixFunction = rotateX3d;
      } else if (name === "rotateY") {
        matrixFunction = rotateY3d;
      }
      functionValue = rad;
    } else if (name === "matrix3d") {
      matrixFunction = matrix3d;
      functionValue = splitComma(value).map(function(v) {
        return parseFloat(v);
      });
    } else if (name === "matrix") {
      var m = splitComma(value).map(function(v) {
        return parseFloat(v);
      });
      matrixFunction = matrix3d;
      functionValue = [
        m[0],
        m[1],
        0,
        0,
        m[2],
        m[3],
        0,
        0,
        0,
        0,
        1,
        0,
        m[4],
        m[5],
        0,
        1
      ];
    } else {
      functionName = "";
    }
    return {
      name,
      functionName,
      value,
      matrixFunction,
      functionValue
    };
  });
}

// ../../../node_modules/@egjs/list-differ/dist/list-differ.esm.js
var PolyMap = /* @__PURE__ */ function() {
  function PolyMap2() {
    this.keys = [];
    this.values = [];
  }
  var __proto = PolyMap2.prototype;
  __proto.get = function(key) {
    return this.values[this.keys.indexOf(key)];
  };
  __proto.set = function(key, value) {
    var keys = this.keys;
    var values = this.values;
    var prevIndex = keys.indexOf(key);
    var index = prevIndex === -1 ? keys.length : prevIndex;
    keys[index] = key;
    values[index] = value;
  };
  return PolyMap2;
}();
var HashMap = /* @__PURE__ */ function() {
  function HashMap2() {
    this.object = {};
  }
  var __proto = HashMap2.prototype;
  __proto.get = function(key) {
    return this.object[key];
  };
  __proto.set = function(key, value) {
    this.object[key] = value;
  };
  return HashMap2;
}();
var SUPPORT_MAP = typeof Map === "function";
var Link = /* @__PURE__ */ function() {
  function Link2() {
  }
  var __proto = Link2.prototype;
  __proto.connect = function(prevLink, nextLink) {
    this.prev = prevLink;
    this.next = nextLink;
    prevLink && (prevLink.next = this);
    nextLink && (nextLink.prev = this);
  };
  __proto.disconnect = function() {
    var prevLink = this.prev;
    var nextLink = this.next;
    prevLink && (prevLink.next = nextLink);
    nextLink && (nextLink.prev = prevLink);
  };
  __proto.getIndex = function() {
    var link = this;
    var index = -1;
    while (link) {
      link = link.prev;
      ++index;
    }
    return index;
  };
  return Link2;
}();
function orderChanged(changed, fixed) {
  var fromLinks = [];
  var toLinks = [];
  changed.forEach(function(_a) {
    var from = _a[0], to = _a[1];
    var link = new Link();
    fromLinks[from] = link;
    toLinks[to] = link;
  });
  fromLinks.forEach(function(link, i) {
    link.connect(fromLinks[i - 1]);
  });
  return changed.filter(function(_, i) {
    return !fixed[i];
  }).map(function(_a, i) {
    var from = _a[0], to = _a[1];
    if (from === to) {
      return [0, 0];
    }
    var fromLink = fromLinks[from];
    var toLink = toLinks[to - 1];
    var fromIndex = fromLink.getIndex();
    fromLink.disconnect();
    if (!toLink) {
      fromLink.connect(void 0, fromLinks[0]);
    } else {
      fromLink.connect(toLink, toLink.next);
    }
    var toIndex = fromLink.getIndex();
    return [fromIndex, toIndex];
  });
}
var Result = /* @__PURE__ */ function() {
  function Result2(prevList, list, added, removed, changed, maintained, changedBeforeAdded, fixed) {
    this.prevList = prevList;
    this.list = list;
    this.added = added;
    this.removed = removed;
    this.changed = changed;
    this.maintained = maintained;
    this.changedBeforeAdded = changedBeforeAdded;
    this.fixed = fixed;
  }
  var __proto = Result2.prototype;
  Object.defineProperty(__proto, "ordered", {
    get: function() {
      if (!this.cacheOrdered) {
        this.caculateOrdered();
      }
      return this.cacheOrdered;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(__proto, "pureChanged", {
    get: function() {
      if (!this.cachePureChanged) {
        this.caculateOrdered();
      }
      return this.cachePureChanged;
    },
    enumerable: true,
    configurable: true
  });
  __proto.caculateOrdered = function() {
    var ordered = orderChanged(this.changedBeforeAdded, this.fixed);
    var changed = this.changed;
    var pureChanged = [];
    this.cacheOrdered = ordered.filter(function(_a, i) {
      var from = _a[0], to = _a[1];
      var _b = changed[i], fromBefore = _b[0], toBefore = _b[1];
      if (from !== to) {
        pureChanged.push([fromBefore, toBefore]);
        return true;
      }
    });
    this.cachePureChanged = pureChanged;
  };
  return Result2;
}();
function diff(prevList, list, findKeyCallback2) {
  var mapClass = SUPPORT_MAP ? Map : findKeyCallback2 ? HashMap : PolyMap;
  var callback = findKeyCallback2 || function(e) {
    return e;
  };
  var added = [];
  var removed = [];
  var maintained = [];
  var prevKeys = prevList.map(callback);
  var keys = list.map(callback);
  var prevKeyMap = new mapClass();
  var keyMap = new mapClass();
  var changedBeforeAdded = [];
  var fixed = [];
  var removedMap = {};
  var changed = [];
  var addedCount = 0;
  var removedCount = 0;
  prevKeys.forEach(function(key, prevListIndex) {
    prevKeyMap.set(key, prevListIndex);
  });
  keys.forEach(function(key, listIndex) {
    keyMap.set(key, listIndex);
  });
  prevKeys.forEach(function(key, prevListIndex) {
    var listIndex = keyMap.get(key);
    if (typeof listIndex === "undefined") {
      ++removedCount;
      removed.push(prevListIndex);
    } else {
      removedMap[listIndex] = removedCount;
    }
  });
  keys.forEach(function(key, listIndex) {
    var prevListIndex = prevKeyMap.get(key);
    if (typeof prevListIndex === "undefined") {
      added.push(listIndex);
      ++addedCount;
    } else {
      maintained.push([prevListIndex, listIndex]);
      removedCount = removedMap[listIndex] || 0;
      changedBeforeAdded.push([prevListIndex - removedCount, listIndex - addedCount]);
      fixed.push(listIndex === prevListIndex);
      if (prevListIndex !== listIndex) {
        changed.push([prevListIndex, listIndex]);
      }
    }
  });
  removed.reverse();
  return new Result(prevList, list, added, removed, changed, maintained, changedBeforeAdded, fixed);
}
var ListDiffer = /* @__PURE__ */ function() {
  function ListDiffer2(list, findKeyCallback2) {
    if (list === void 0) {
      list = [];
    }
    this.findKeyCallback = findKeyCallback2;
    this.list = [].slice.call(list);
  }
  var __proto = ListDiffer2.prototype;
  __proto.update = function(list) {
    var newData = [].slice.call(list);
    var result = diff(this.list, newData, this.findKeyCallback);
    this.list = newData;
    return result;
  };
  return ListDiffer2;
}();
var list_differ_esm_default = ListDiffer;

// ../../../node_modules/@egjs/children-differ/dist/children-differ.esm.js
var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf || {
    __proto__: []
  } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2)
      if (b2.hasOwnProperty(p))
        d2[p] = b2[p];
  };
  return extendStatics(d, b);
};
function __extends(d, b) {
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var findKeyCallback = typeof Map === "function" ? void 0 : function() {
  var childrenCount = 0;
  return function(el) {
    return el.__DIFF_KEY__ || (el.__DIFF_KEY__ = ++childrenCount);
  };
}();
var ChildrenDiffer = /* @__PURE__ */ function(_super) {
  __extends(ChildrenDiffer2, _super);
  function ChildrenDiffer2(list) {
    if (list === void 0) {
      list = [];
    }
    return _super.call(this, list, findKeyCallback) || this;
  }
  return ChildrenDiffer2;
}(list_differ_esm_default);
function diff2(prevList, list) {
  return diff(prevList, list, findKeyCallback);
}
var children_differ_esm_default = ChildrenDiffer;

// ../../../node_modules/@scena/event-emitter/dist/event-emitter.esm.js
var __assign2 = function() {
  __assign2 = Object.assign || function __assign7(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign2.apply(this, arguments);
};
function __spreadArrays2() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++)
    s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
      r[k] = a[j];
  return r;
}
var EventEmitter = /* @__PURE__ */ function() {
  function EventEmitter2() {
    this._events = {};
  }
  var __proto = EventEmitter2.prototype;
  __proto.on = function(eventName, listener) {
    if (isObject(eventName)) {
      for (var name in eventName) {
        this.on(name, eventName[name]);
      }
    } else {
      this._addEvent(eventName, listener, {});
    }
    return this;
  };
  __proto.off = function(eventName, listener) {
    if (!eventName) {
      this._events = {};
    } else if (isObject(eventName)) {
      for (var name in eventName) {
        this.off(name);
      }
    } else if (!listener) {
      this._events[eventName] = [];
    } else {
      var events = this._events[eventName];
      if (events) {
        var index = findIndex(events, function(e) {
          return e.listener === listener;
        });
        if (index > -1) {
          events.splice(index, 1);
        }
      }
    }
    return this;
  };
  __proto.once = function(eventName, listener) {
    var _this = this;
    if (listener) {
      this._addEvent(eventName, listener, {
        once: true
      });
    }
    return new Promise(function(resolve) {
      _this._addEvent(eventName, resolve, {
        once: true
      });
    });
  };
  __proto.emit = function(eventName, param) {
    var _this = this;
    if (param === void 0) {
      param = {};
    }
    var events = this._events[eventName];
    if (!eventName || !events) {
      return true;
    }
    var isStop = false;
    param.eventType = eventName;
    param.stop = function() {
      isStop = true;
    };
    param.currentTarget = this;
    __spreadArrays2(events).forEach(function(info) {
      info.listener(param);
      if (info.once) {
        _this.off(eventName, info.listener);
      }
    });
    return !isStop;
  };
  __proto.trigger = function(eventName, param) {
    if (param === void 0) {
      param = {};
    }
    return this.emit(eventName, param);
  };
  __proto._addEvent = function(eventName, listener, options) {
    var events = this._events;
    events[eventName] = events[eventName] || [];
    var listeners = events[eventName];
    listeners.push(__assign2({
      listener
    }, options));
  };
  return EventEmitter2;
}();
var event_emitter_esm_default = EventEmitter;

// ../../../node_modules/@scena/dragscroll/dist/dragscroll.esm.js
var extendStatics2 = function(d, b) {
  extendStatics2 = Object.setPrototypeOf || {
    __proto__: []
  } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2)
      if (b2.hasOwnProperty(p))
        d2[p] = b2[p];
  };
  return extendStatics2(d, b);
};
function __extends2(d, b) {
  extendStatics2(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign3 = function() {
  __assign3 = Object.assign || function __assign7(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign3.apply(this, arguments);
};
function getDefaultScrollPosition(e) {
  var container = e.container;
  if (container === document.body) {
    return [container.scrollLeft || document.documentElement.scrollLeft, container.scrollTop || document.documentElement.scrollTop];
  }
  return [container.scrollLeft, container.scrollTop];
}
function checkDefaultScrollEvent(container, callback) {
  container.addEventListener("scroll", callback);
  return function() {
    container.removeEventListener("scroll", callback);
  };
}
function getContainerElement(container) {
  if (!container) {
    return null;
  } else if (isString(container)) {
    return document.querySelector(container);
  }
  if (isFunction(container)) {
    return container();
  } else if (container instanceof Element) {
    return container;
  } else if ("current" in container) {
    return container.current;
  } else if ("value" in container) {
    return container.value;
  }
}
var DragScroll = /* @__PURE__ */ function(_super) {
  __extends2(DragScroll2, _super);
  function DragScroll2() {
    var _this = _super !== null && _super.apply(this, arguments) || this;
    _this._startRect = null;
    _this._startPos = [];
    _this._prevTime = 0;
    _this._timer = 0;
    _this._prevScrollPos = [0, 0];
    _this._isWait = false;
    _this._flag = false;
    _this._currentOptions = null;
    _this._lock = false;
    _this._unregister = null;
    _this._onScroll = function() {
      var options = _this._currentOptions;
      if (_this._lock || !options) {
        return;
      }
      _this.emit("scrollDrag", {
        next: function(inputEvent) {
          _this.checkScroll({
            container: options.container,
            inputEvent
          });
        }
      });
    };
    return _this;
  }
  var __proto = DragScroll2.prototype;
  __proto.dragStart = function(e, options) {
    var container = getContainerElement(options.container);
    if (!container) {
      this._flag = false;
      return;
    }
    var top = 0;
    var left = 0;
    var width = 0;
    var height = 0;
    if (container === document.body) {
      width = window.innerWidth;
      height = window.innerHeight;
    } else {
      var rect = container.getBoundingClientRect();
      top = rect.top;
      left = rect.left;
      width = rect.width;
      height = rect.height;
    }
    this._flag = true;
    this._startPos = [e.clientX, e.clientY];
    this._startRect = {
      top,
      left,
      width,
      height
    };
    this._prevScrollPos = this._getScrollPosition([0, 0], options);
    this._currentOptions = options;
    this._registerScrollEvent(options);
  };
  __proto.drag = function(e, options) {
    clearTimeout(this._timer);
    if (!this._flag) {
      return;
    }
    var clientX = e.clientX, clientY = e.clientY;
    var _a = options.threshold, threshold = _a === void 0 ? 0 : _a;
    var _b = this, _startRect = _b._startRect, _startPos = _b._startPos;
    this._currentOptions = options;
    var direction = [0, 0];
    if (_startRect.top > clientY - threshold) {
      if (_startPos[1] > _startRect.top || clientY < _startPos[1]) {
        direction[1] = -1;
      }
    } else if (_startRect.top + _startRect.height < clientY + threshold) {
      if (_startPos[1] < _startRect.top + _startRect.height || clientY > _startPos[1]) {
        direction[1] = 1;
      }
    }
    if (_startRect.left > clientX - threshold) {
      if (_startPos[0] > _startRect.left || clientX < _startPos[0]) {
        direction[0] = -1;
      }
    } else if (_startRect.left + _startRect.width < clientX + threshold) {
      if (_startPos[0] < _startRect.left + _startRect.width || clientX > _startPos[0]) {
        direction[0] = 1;
      }
    }
    if (!direction[0] && !direction[1]) {
      return false;
    }
    return this._continueDrag(__assign3(__assign3({}, options), {
      direction,
      inputEvent: e,
      isDrag: true
    }));
  };
  __proto.checkScroll = function(options) {
    var _this = this;
    if (this._isWait) {
      return false;
    }
    var _a = options.prevScrollPos, prevScrollPos = _a === void 0 ? this._prevScrollPos : _a, direction = options.direction, _b = options.throttleTime, throttleTime = _b === void 0 ? 0 : _b, inputEvent = options.inputEvent, isDrag = options.isDrag;
    var nextScrollPos = this._getScrollPosition(direction || [0, 0], options);
    var offsetX = nextScrollPos[0] - prevScrollPos[0];
    var offsetY = nextScrollPos[1] - prevScrollPos[1];
    var nextDirection = direction || [offsetX ? Math.abs(offsetX) / offsetX : 0, offsetY ? Math.abs(offsetY) / offsetY : 0];
    this._prevScrollPos = nextScrollPos;
    this._lock = false;
    if (!offsetX && !offsetY) {
      return false;
    }
    this.emit("move", {
      offsetX: nextDirection[0] ? offsetX : 0,
      offsetY: nextDirection[1] ? offsetY : 0,
      inputEvent
    });
    if (throttleTime && isDrag) {
      clearTimeout(this._timer);
      this._timer = window.setTimeout(function() {
        _this._continueDrag(options);
      }, throttleTime);
    }
    return true;
  };
  __proto.dragEnd = function() {
    this._flag = false;
    this._lock = false;
    clearTimeout(this._timer);
    this._unregisterScrollEvent();
  };
  __proto._getScrollPosition = function(direction, options) {
    var container = options.container, _a = options.getScrollPosition, getScrollPosition = _a === void 0 ? getDefaultScrollPosition : _a;
    return getScrollPosition({
      container: getContainerElement(container),
      direction
    });
  };
  __proto._continueDrag = function(options) {
    var _this = this;
    var _a;
    var container = options.container, direction = options.direction, throttleTime = options.throttleTime, useScroll = options.useScroll, isDrag = options.isDrag, inputEvent = options.inputEvent;
    if (!this._flag || isDrag && this._isWait) {
      return;
    }
    var nowTime = now();
    var distTime = Math.max(throttleTime + this._prevTime - nowTime, 0);
    if (distTime > 0) {
      clearTimeout(this._timer);
      this._timer = window.setTimeout(function() {
        _this._continueDrag(options);
      }, distTime);
      return false;
    }
    this._prevTime = nowTime;
    var prevScrollPos = this._getScrollPosition(direction, options);
    this._prevScrollPos = prevScrollPos;
    if (isDrag) {
      this._isWait = true;
    }
    if (!useScroll) {
      this._lock = true;
    }
    var param = {
      container: getContainerElement(container),
      direction,
      inputEvent
    };
    (_a = options.requestScroll) === null || _a === void 0 ? void 0 : _a.call(options, param);
    this.emit("scroll", param);
    this._isWait = false;
    return useScroll || this.checkScroll(__assign3(__assign3({}, options), {
      prevScrollPos,
      direction,
      inputEvent
    }));
  };
  __proto._registerScrollEvent = function(options) {
    this._unregisterScrollEvent();
    var checkScrollEvent = options.checkScrollEvent;
    if (!checkScrollEvent) {
      return;
    }
    var callback = checkScrollEvent === true ? checkDefaultScrollEvent : checkScrollEvent;
    var container = getContainerElement(options.container);
    if (checkScrollEvent === true && (container === document.body || container === document.documentElement)) {
      this._unregister = checkDefaultScrollEvent(window, this._onScroll);
    } else {
      this._unregister = callback(container, this._onScroll);
    }
  };
  __proto._unregisterScrollEvent = function() {
    var _a;
    (_a = this._unregister) === null || _a === void 0 ? void 0 : _a.call(this);
    this._unregister = null;
  };
  return DragScroll2;
}(event_emitter_esm_default);
var dragscroll_esm_default = DragScroll;

// ../../../node_modules/overlap-area/dist/overlap-area.esm.js
function __spreadArrays3() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++)
    s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
      r[k] = a[j];
  return r;
}
function tinyThrottle(num) {
  return throttle(num, TINY_NUM);
}
function isSameConstants(linearConstants1, linearConstants2) {
  return linearConstants1.every(function(v, i) {
    return tinyThrottle(v - linearConstants2[i]) === 0;
  });
}
function isSamePoint(point1, point2) {
  return !tinyThrottle(point1[0] - point2[0]) && !tinyThrottle(point1[1] - point2[1]);
}
function getAreaSize(points) {
  if (points.length < 3) {
    return 0;
  }
  return Math.abs(sum(points.map(function(point, i) {
    var nextPoint = points[i + 1] || points[0];
    return point[0] * nextPoint[1] - nextPoint[0] * point[1];
  }))) / 2;
}
function fitPoints(points, rect) {
  var width = rect.width, height = rect.height, left = rect.left, top = rect.top;
  var _a = getMinMaxs(points), minX = _a.minX, minY = _a.minY, maxX = _a.maxX, maxY = _a.maxY;
  var ratioX = width / (maxX - minX);
  var ratioY = height / (maxY - minY);
  return points.map(function(point) {
    return [left + (point[0] - minX) * ratioX, top + (point[1] - minY) * ratioY];
  });
}
function getMinMaxs(points) {
  var xs = points.map(function(point) {
    return point[0];
  });
  var ys = points.map(function(point) {
    return point[1];
  });
  return {
    minX: Math.min.apply(Math, xs),
    minY: Math.min.apply(Math, ys),
    maxX: Math.max.apply(Math, xs),
    maxY: Math.max.apply(Math, ys)
  };
}
function isInside(pos, points, excludeLine) {
  var x = pos[0], y = pos[1];
  var _a = getMinMaxs(points), minX = _a.minX, maxX = _a.maxX;
  var xLine = [[minX, y], [maxX, y]];
  var xLinearConstants = getLinearConstants(xLine[0], xLine[1]);
  var lines = convertLines(points);
  var intersectionPosInfos = [];
  lines.forEach(function(line) {
    var linearConstants = getLinearConstants(line[0], line[1]);
    var standardPoint = line[0];
    if (isSameConstants(xLinearConstants, linearConstants)) {
      intersectionPosInfos.push({
        pos,
        line,
        type: "line"
      });
    } else {
      var xPoints = getPointsOnLines(getIntersectionPointsByConstants(xLinearConstants, linearConstants), [xLine, line]);
      xPoints.forEach(function(point) {
        if (line.some(function(linePoint) {
          return isSamePoint(linePoint, point);
        })) {
          intersectionPosInfos.push({
            pos: point,
            line,
            type: "point"
          });
        } else if (tinyThrottle(standardPoint[1] - y) !== 0) {
          intersectionPosInfos.push({
            pos: point,
            line,
            type: "intersection"
          });
        }
      });
    }
  });
  if (!excludeLine) {
    if (find2(intersectionPosInfos, function(p) {
      return p[0] === x;
    })) {
      return true;
    }
  }
  var intersectionCount = 0;
  var xMap = {};
  intersectionPosInfos.forEach(function(_a2) {
    var pos2 = _a2.pos, type = _a2.type, line = _a2.line;
    if (pos2[0] > x) {
      return;
    }
    if (type === "intersection") {
      ++intersectionCount;
    } else if (type === "line") {
      return;
    } else if (type === "point") {
      var point = find2(line, function(linePoint) {
        return linePoint[1] !== y;
      });
      var prevValue = xMap[pos2[0]];
      var nextValue = point[1] > y ? 1 : -1;
      if (!prevValue) {
        xMap[pos2[0]] = nextValue;
      } else if (prevValue !== nextValue) {
        ++intersectionCount;
      }
    }
  });
  return intersectionCount % 2 === 1;
}
function getLinearConstants(point1, point2) {
  var x1 = point1[0], y1 = point1[1];
  var x2 = point2[0], y2 = point2[1];
  var dx = x2 - x1;
  var dy = y2 - y1;
  if (Math.abs(dx) < TINY_NUM) {
    dx = 0;
  }
  if (Math.abs(dy) < TINY_NUM) {
    dy = 0;
  }
  var a = 0;
  var b = 0;
  var c = 0;
  if (!dx) {
    if (dy) {
      a = -1;
      c = x1;
    }
  } else if (!dy) {
    b = 1;
    c = -y1;
  } else {
    a = -dy / dx;
    b = 1;
    c = -a * x1 - y1;
  }
  return [a, b, c];
}
function getIntersectionPointsByConstants(linearConstants1, linearConstants2) {
  var a1 = linearConstants1[0], b1 = linearConstants1[1], c1 = linearConstants1[2];
  var a2 = linearConstants2[0], b2 = linearConstants2[1], c2 = linearConstants2[2];
  var isZeroA = a1 === 0 && a2 === 0;
  var isZeroB = b1 === 0 && b2 === 0;
  var results = [];
  if (isZeroA && isZeroB) {
    return [];
  } else if (isZeroA) {
    var y1 = -c1 / b1;
    var y2 = -c2 / b2;
    if (y1 !== y2) {
      return [];
    } else {
      return [[-Infinity, y1], [Infinity, y1]];
    }
  } else if (isZeroB) {
    var x1 = -c1 / a1;
    var x2 = -c2 / a2;
    if (x1 !== x2) {
      return [];
    } else {
      return [[x1, -Infinity], [x1, Infinity]];
    }
  } else if (a1 === 0) {
    var y = -c1 / b1;
    var x = -(b2 * y + c2) / a2;
    results = [[x, y]];
  } else if (a2 === 0) {
    var y = -c2 / b2;
    var x = -(b1 * y + c1) / a1;
    results = [[x, y]];
  } else if (b1 === 0) {
    var x = -c1 / a1;
    var y = -(a2 * x + c2) / b2;
    results = [[x, y]];
  } else if (b2 === 0) {
    var x = -c2 / a2;
    var y = -(a1 * x + c1) / b1;
    results = [[x, y]];
  } else {
    var x = (b1 * c2 - b2 * c1) / (b2 * a1 - b1 * a2);
    var y = -(a1 * x + c1) / b1;
    results = [[x, y]];
  }
  return results.map(function(result) {
    return [result[0], result[1]];
  });
}
function getPointsOnLines(points, lines) {
  var minMaxs = lines.map(function(line) {
    return [0, 1].map(function(order) {
      return [Math.min(line[0][order], line[1][order]), Math.max(line[0][order], line[1][order])];
    });
  });
  var results = [];
  if (points.length === 2) {
    var _a = points[0], x = _a[0], y = _a[1];
    if (!tinyThrottle(x - points[1][0])) {
      var top = Math.max.apply(Math, minMaxs.map(function(minMax) {
        return minMax[1][0];
      }));
      var bottom = Math.min.apply(Math, minMaxs.map(function(minMax) {
        return minMax[1][1];
      }));
      if (tinyThrottle(top - bottom) > 0) {
        return [];
      }
      results = [[x, top], [x, bottom]];
    } else if (!tinyThrottle(y - points[1][1])) {
      var left = Math.max.apply(Math, minMaxs.map(function(minMax) {
        return minMax[0][0];
      }));
      var right = Math.min.apply(Math, minMaxs.map(function(minMax) {
        return minMax[0][1];
      }));
      if (tinyThrottle(left - right) > 0) {
        return [];
      }
      results = [[left, y], [right, y]];
    }
  }
  if (!results.length) {
    results = points.filter(function(point) {
      var pointX = point[0], pointY = point[1];
      return minMaxs.every(function(minMax) {
        return 0 <= tinyThrottle(pointX - minMax[0][0]) && 0 <= tinyThrottle(minMax[0][1] - pointX) && 0 <= tinyThrottle(pointY - minMax[1][0]) && 0 <= tinyThrottle(minMax[1][1] - pointY);
      });
    });
  }
  return results.map(function(result) {
    return [tinyThrottle(result[0]), tinyThrottle(result[1])];
  });
}
function convertLines(points) {
  return __spreadArrays3(points.slice(1), [points[0]]).map(function(point, i) {
    return [points[i], point];
  });
}
function getOverlapPointInfos(points1, points2) {
  var targetPoints1 = points1.slice();
  var targetPoints2 = points2.slice();
  if (getShapeDirection(targetPoints1) === -1) {
    targetPoints1.reverse();
  }
  if (getShapeDirection(targetPoints2) === -1) {
    targetPoints2.reverse();
  }
  var lines1 = convertLines(targetPoints1);
  var lines2 = convertLines(targetPoints2);
  var linearConstantsList1 = lines1.map(function(line1) {
    return getLinearConstants(line1[0], line1[1]);
  });
  var linearConstantsList2 = lines2.map(function(line2) {
    return getLinearConstants(line2[0], line2[1]);
  });
  var overlapInfos = [];
  linearConstantsList1.forEach(function(linearConstants1, i) {
    var line1 = lines1[i];
    var linePointInfos = [];
    linearConstantsList2.forEach(function(linearConstants2, j) {
      var intersectionPoints = getIntersectionPointsByConstants(linearConstants1, linearConstants2);
      var points = getPointsOnLines(intersectionPoints, [line1, lines2[j]]);
      linePointInfos.push.apply(linePointInfos, points.map(function(pos) {
        return {
          index1: i,
          index2: j,
          pos,
          type: "intersection"
        };
      }));
    });
    linePointInfos.sort(function(a, b) {
      return getDist(line1[0], a.pos) - getDist(line1[0], b.pos);
    });
    overlapInfos.push.apply(overlapInfos, linePointInfos);
    if (isInside(line1[1], targetPoints2)) {
      overlapInfos.push({
        index1: i,
        index2: -1,
        pos: line1[1],
        type: "inside"
      });
    }
  });
  lines2.forEach(function(line2, i) {
    if (!isInside(line2[1], targetPoints1)) {
      return;
    }
    var isNext = false;
    var index = findIndex(overlapInfos, function(_a) {
      var index2 = _a.index2;
      if (index2 === i) {
        isNext = true;
        return false;
      }
      if (isNext) {
        return true;
      }
      return false;
    });
    if (index === -1) {
      isNext = false;
      index = findIndex(overlapInfos, function(_a) {
        var index1 = _a.index1, index2 = _a.index2;
        if (index1 === -1 && index2 + 1 === i) {
          isNext = true;
          return false;
        }
        if (isNext) {
          return true;
        }
        return false;
      });
    }
    if (index === -1) {
      overlapInfos.push({
        index1: -1,
        index2: i,
        pos: line2[1],
        type: "inside"
      });
    } else {
      overlapInfos.splice(index, 0, {
        index1: -1,
        index2: i,
        pos: line2[1],
        type: "inside"
      });
    }
  });
  var pointMap = {};
  return overlapInfos.filter(function(_a) {
    var pos = _a.pos;
    var key = pos[0] + "x" + pos[1];
    if (pointMap[key]) {
      return false;
    }
    pointMap[key] = true;
    return true;
  });
}
function getOverlapPoints(points1, points2) {
  var infos = getOverlapPointInfos(points1, points2);
  return infos.map(function(_a) {
    var pos = _a.pos;
    return pos;
  });
}
function getOverlapSize(points1, points2) {
  var points = getOverlapPoints(points1, points2);
  return getAreaSize(points);
}

// ../../../node_modules/react-moveable/dist/moveable.esm.js
import * as React from "react";
import { createElement as createElement3 } from "react";

// ../../../node_modules/gesto/dist/gesto.esm.js
var extendStatics3 = function(d, b) {
  extendStatics3 = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2)
      if (b2.hasOwnProperty(p))
        d2[p] = b2[p];
  };
  return extendStatics3(d, b);
};
function __extends3(d, b) {
  extendStatics3(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign4 = function() {
  __assign4 = Object.assign || function __assign7(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign4.apply(this, arguments);
};
function getRad2(pos1, pos2) {
  var distX = pos2[0] - pos1[0];
  var distY = pos2[1] - pos1[1];
  var rad = Math.atan2(distY, distX);
  return rad >= 0 ? rad : rad + Math.PI * 2;
}
function getRotatiion(touches) {
  return getRad2([
    touches[0].clientX,
    touches[0].clientY
  ], [
    touches[1].clientX,
    touches[1].clientY
  ]) / Math.PI * 180;
}
function isMultiTouch(e) {
  return e.touches && e.touches.length >= 2;
}
function getEventClients(e) {
  if (!e) {
    return [];
  }
  if (e.touches) {
    return getClients(e.touches);
  } else {
    return [getClient(e)];
  }
}
function isMouseEvent(e) {
  return e && (e.type.indexOf("mouse") > -1 || "button" in e);
}
function getPosition(clients, prevClients, startClients) {
  var length = startClients.length;
  var _a = getAverageClient(clients, length), clientX = _a.clientX, clientY = _a.clientY, originalClientX = _a.originalClientX, originalClientY = _a.originalClientY;
  var _b = getAverageClient(prevClients, length), prevX = _b.clientX, prevY = _b.clientY;
  var _c = getAverageClient(startClients, length), startX = _c.clientX, startY = _c.clientY;
  var deltaX = clientX - prevX;
  var deltaY = clientY - prevY;
  var distX = clientX - startX;
  var distY = clientY - startY;
  return {
    clientX: originalClientX,
    clientY: originalClientY,
    deltaX,
    deltaY,
    distX,
    distY
  };
}
function getDist2(clients) {
  return Math.sqrt(Math.pow(clients[0].clientX - clients[1].clientX, 2) + Math.pow(clients[0].clientY - clients[1].clientY, 2));
}
function getClients(touches) {
  var length = Math.min(touches.length, 2);
  var clients = [];
  for (var i = 0; i < length; ++i) {
    clients.push(getClient(touches[i]));
  }
  return clients;
}
function getClient(e) {
  return {
    clientX: e.clientX,
    clientY: e.clientY
  };
}
function getAverageClient(clients, length) {
  if (length === void 0) {
    length = clients.length;
  }
  var sumClient = {
    clientX: 0,
    clientY: 0,
    originalClientX: 0,
    originalClientY: 0
  };
  var minLength = Math.min(clients.length, length);
  for (var i = 0; i < minLength; ++i) {
    var client = clients[i];
    sumClient.originalClientX += "originalClientX" in client ? client.originalClientX : client.clientX;
    sumClient.originalClientY += "originalClientY" in client ? client.originalClientY : client.clientY;
    sumClient.clientX += client.clientX;
    sumClient.clientY += client.clientY;
  }
  if (!length) {
    return sumClient;
  }
  return {
    clientX: sumClient.clientX / length,
    clientY: sumClient.clientY / length,
    originalClientX: sumClient.originalClientX / length,
    originalClientY: sumClient.originalClientY / length
  };
}
var ClientStore = /* @__PURE__ */ function() {
  function ClientStore2(clients) {
    this.prevClients = [];
    this.startClients = [];
    this.movement = 0;
    this.length = 0;
    this.startClients = clients;
    this.prevClients = clients;
    this.length = clients.length;
  }
  ClientStore2.prototype.getAngle = function(clients) {
    if (clients === void 0) {
      clients = this.prevClients;
    }
    return getRotatiion(clients);
  };
  ClientStore2.prototype.getRotation = function(clients) {
    if (clients === void 0) {
      clients = this.prevClients;
    }
    return getRotatiion(clients) - getRotatiion(this.startClients);
  };
  ClientStore2.prototype.getPosition = function(clients, isAdd) {
    if (clients === void 0) {
      clients = this.prevClients;
    }
    var position = getPosition(clients || this.prevClients, this.prevClients, this.startClients);
    var deltaX = position.deltaX, deltaY = position.deltaY;
    this.movement += Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    this.prevClients = clients;
    return position;
  };
  ClientStore2.prototype.getPositions = function(clients) {
    if (clients === void 0) {
      clients = this.prevClients;
    }
    var prevClients = this.prevClients;
    var startClients = this.startClients;
    var minLength = Math.min(this.length, prevClients.length);
    var positions = [];
    for (var i = 0; i < minLength; ++i) {
      positions[i] = getPosition([clients[i]], [prevClients[i]], [startClients[i]]);
    }
    return positions;
  };
  ClientStore2.prototype.getMovement = function(clients) {
    var movement = this.movement;
    if (!clients) {
      return movement;
    }
    var currentClient = getAverageClient(clients, this.length);
    var prevClient = getAverageClient(this.prevClients, this.length);
    var deltaX = currentClient.clientX - prevClient.clientX;
    var deltaY = currentClient.clientY - prevClient.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY) + movement;
  };
  ClientStore2.prototype.getDistance = function(clients) {
    if (clients === void 0) {
      clients = this.prevClients;
    }
    return getDist2(clients);
  };
  ClientStore2.prototype.getScale = function(clients) {
    if (clients === void 0) {
      clients = this.prevClients;
    }
    return getDist2(clients) / getDist2(this.startClients);
  };
  ClientStore2.prototype.move = function(deltaX, deltaY) {
    this.startClients.forEach(function(client) {
      client.clientX -= deltaX;
      client.clientY -= deltaY;
    });
    this.prevClients.forEach(function(client) {
      client.clientX -= deltaX;
      client.clientY -= deltaY;
    });
  };
  return ClientStore2;
}();
var INPUT_TAGNAMES = ["textarea", "input"];
var Gesto = /* @__PURE__ */ function(_super) {
  __extends3(Gesto2, _super);
  function Gesto2(targets, options) {
    if (options === void 0) {
      options = {};
    }
    var _this = _super.call(this) || this;
    _this.options = {};
    _this.flag = false;
    _this.pinchFlag = false;
    _this.data = {};
    _this.isDrag = false;
    _this.isPinch = false;
    _this.clientStores = [];
    _this.targets = [];
    _this.prevTime = 0;
    _this.doubleFlag = false;
    _this._useMouse = false;
    _this._useTouch = false;
    _this._useDrag = false;
    _this._dragFlag = false;
    _this._isTrusted = false;
    _this._isMouseEvent = false;
    _this._isSecondaryButton = false;
    _this._preventMouseEvent = false;
    _this._prevInputEvent = null;
    _this._isDragAPI = false;
    _this._isIdle = true;
    _this._window = window;
    _this.onDragStart = function(e, isTrusted) {
      if (isTrusted === void 0) {
        isTrusted = true;
      }
      if (!_this.flag && e.cancelable === false) {
        return;
      }
      var isDragAPI = e.type.indexOf("drag") >= -1;
      if (_this.flag && isDragAPI) {
        return;
      }
      _this._isDragAPI = true;
      var _a2 = _this.options, container2 = _a2.container, pinchOutside = _a2.pinchOutside, preventWheelClick = _a2.preventWheelClick, preventRightClick = _a2.preventRightClick, preventDefault = _a2.preventDefault, checkInput = _a2.checkInput, dragFocusedInput = _a2.dragFocusedInput, preventClickEventOnDragStart = _a2.preventClickEventOnDragStart, preventClickEventOnDrag = _a2.preventClickEventOnDrag, preventClickEventByCondition = _a2.preventClickEventByCondition;
      var useTouch = _this._useTouch;
      var isDragStart = !_this.flag;
      _this._isSecondaryButton = e.which === 3 || e.button === 2;
      if (preventWheelClick && (e.which === 2 || e.button === 1) || preventRightClick && (e.which === 3 || e.button === 2)) {
        _this.stop();
        return false;
      }
      if (isDragStart) {
        var activeElement = _this._window.document.activeElement;
        var target = e.target;
        if (target) {
          var tagName = target.tagName.toLowerCase();
          var hasInput = INPUT_TAGNAMES.indexOf(tagName) > -1;
          var hasContentEditable = target.isContentEditable;
          if (hasInput || hasContentEditable) {
            if (checkInput || !dragFocusedInput && activeElement === target) {
              return false;
            }
            if (activeElement && (activeElement === target || hasContentEditable && activeElement.isContentEditable && activeElement.contains(target))) {
              if (dragFocusedInput) {
                target.blur();
              } else {
                return false;
              }
            }
          } else if ((preventDefault || e.type === "touchstart") && activeElement) {
            var activeTagName = activeElement.tagName.toLowerCase();
            if (activeElement.isContentEditable || INPUT_TAGNAMES.indexOf(activeTagName) > -1) {
              activeElement.blur();
            }
          }
          if (preventClickEventOnDragStart || preventClickEventOnDrag || preventClickEventByCondition) {
            addEvent(_this._window, "click", _this._onClick, true);
          }
        }
        _this.clientStores = [new ClientStore(getEventClients(e))];
        _this._isIdle = false;
        _this.flag = true;
        _this.isDrag = false;
        _this._isTrusted = isTrusted;
        _this._dragFlag = true;
        _this._prevInputEvent = e;
        _this.data = {};
        _this.doubleFlag = now() - _this.prevTime < 200;
        _this._isMouseEvent = isMouseEvent(e);
        if (!_this._isMouseEvent && _this._preventMouseEvent) {
          _this._preventMouseEvent = false;
        }
        var result = _this._preventMouseEvent || _this.emit("dragStart", __assign4(__assign4({ data: _this.data, datas: _this.data, inputEvent: e, isMouseEvent: _this._isMouseEvent, isSecondaryButton: _this._isSecondaryButton, isTrusted, isDouble: _this.doubleFlag }, _this.getCurrentStore().getPosition()), { preventDefault: function() {
          e.preventDefault();
        }, preventDrag: function() {
          _this._dragFlag = false;
        } }));
        if (result === false) {
          _this.stop();
        }
        if (_this._isMouseEvent && _this.flag && preventDefault) {
          e.preventDefault();
        }
      }
      if (!_this.flag) {
        return false;
      }
      var timer = 0;
      if (isDragStart) {
        _this._attchDragEvent();
        if (useTouch && pinchOutside) {
          timer = setTimeout(function() {
            addEvent(container2, "touchstart", _this.onDragStart, {
              passive: false
            });
          });
        }
      } else if (useTouch && pinchOutside) {
        removeEvent(container2, "touchstart", _this.onDragStart);
      }
      if (_this.flag && isMultiTouch(e)) {
        clearTimeout(timer);
        if (isDragStart && e.touches.length !== e.changedTouches.length) {
          return;
        }
        if (!_this.pinchFlag) {
          _this.onPinchStart(e);
        }
      }
    };
    _this.onDrag = function(e, isScroll) {
      if (!_this.flag) {
        return;
      }
      var preventDefault = _this.options.preventDefault;
      if (!_this._isMouseEvent && preventDefault) {
        e.preventDefault();
      }
      _this._prevInputEvent = e;
      var clients = getEventClients(e);
      var result = _this.moveClients(clients, e, false);
      if (_this._dragFlag) {
        if (_this.pinchFlag || result.deltaX || result.deltaY) {
          var dragResult = _this._preventMouseEvent || _this.emit("drag", __assign4(__assign4({}, result), { isScroll: !!isScroll, inputEvent: e }));
          if (dragResult === false) {
            _this.stop();
            return;
          }
        }
        if (_this.pinchFlag) {
          _this.onPinch(e, clients);
        }
      }
      _this.getCurrentStore().getPosition(clients, true);
    };
    _this.onDragEnd = function(e) {
      if (!_this.flag) {
        return;
      }
      var _a2 = _this.options, pinchOutside = _a2.pinchOutside, container2 = _a2.container, preventClickEventOnDrag = _a2.preventClickEventOnDrag, preventClickEventOnDragStart = _a2.preventClickEventOnDragStart, preventClickEventByCondition = _a2.preventClickEventByCondition;
      var isDrag = _this.isDrag;
      if (preventClickEventOnDrag || preventClickEventOnDragStart || preventClickEventByCondition) {
        requestAnimationFrame(function() {
          _this._allowClickEvent();
        });
      }
      if (!preventClickEventByCondition && !preventClickEventOnDragStart && preventClickEventOnDrag && !isDrag) {
        _this._allowClickEvent();
      }
      if (_this._useTouch && pinchOutside) {
        removeEvent(container2, "touchstart", _this.onDragStart);
      }
      if (_this.pinchFlag) {
        _this.onPinchEnd(e);
      }
      var clients = (e === null || e === void 0 ? void 0 : e.touches) ? getEventClients(e) : [];
      var clientsLength = clients.length;
      if (clientsLength === 0 || !_this.options.keepDragging) {
        _this.flag = false;
      } else {
        _this._addStore(new ClientStore(clients));
      }
      var position = _this._getPosition();
      var currentTime = now();
      var isDouble = !isDrag && _this.doubleFlag;
      _this._prevInputEvent = null;
      _this.prevTime = isDrag || isDouble ? 0 : currentTime;
      if (!_this.flag) {
        _this._dettachDragEvent();
        _this._preventMouseEvent || _this.emit("dragEnd", __assign4({ data: _this.data, datas: _this.data, isDouble, isDrag, isClick: !isDrag, isMouseEvent: _this._isMouseEvent, isSecondaryButton: _this._isSecondaryButton, inputEvent: e, isTrusted: _this._isTrusted }, position));
        _this.clientStores = [];
        if (!_this._isMouseEvent) {
          _this._preventMouseEvent = true;
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              _this._preventMouseEvent = false;
            });
          });
        }
        _this._isIdle = true;
      }
    };
    _this.onBlur = function() {
      _this.onDragEnd();
    };
    _this._allowClickEvent = function() {
      removeEvent(_this._window, "click", _this._onClick, true);
    };
    _this._onClick = function(e) {
      _this._allowClickEvent();
      _this._preventMouseEvent = false;
      var preventClickEventByCondition = _this.options.preventClickEventByCondition;
      if (preventClickEventByCondition === null || preventClickEventByCondition === void 0 ? void 0 : preventClickEventByCondition(e)) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
    };
    _this._onContextMenu = function(e) {
      var options2 = _this.options;
      if (!options2.preventRightClick) {
        e.preventDefault();
      } else {
        _this.onDragEnd(e);
      }
    };
    _this._passCallback = function() {
    };
    var elements = [].concat(targets);
    var firstTarget = elements[0];
    _this._window = isWindow(firstTarget) ? firstTarget : getWindow(firstTarget);
    _this.options = __assign4({ checkInput: false, container: firstTarget && !("document" in firstTarget) ? getWindow(firstTarget) : firstTarget, preventRightClick: true, preventWheelClick: true, preventClickEventOnDragStart: false, preventClickEventOnDrag: false, preventClickEventByCondition: null, preventDefault: true, checkWindowBlur: false, keepDragging: false, pinchThreshold: 0, events: ["touch", "mouse"] }, options);
    var _a = _this.options, container = _a.container, events = _a.events, checkWindowBlur = _a.checkWindowBlur;
    _this._useDrag = events.indexOf("drag") > -1;
    _this._useTouch = events.indexOf("touch") > -1;
    _this._useMouse = events.indexOf("mouse") > -1;
    _this.targets = elements;
    if (_this._useDrag) {
      elements.forEach(function(el) {
        addEvent(el, "dragstart", _this.onDragStart);
      });
    }
    if (_this._useMouse) {
      elements.forEach(function(el) {
        addEvent(el, "mousedown", _this.onDragStart);
        addEvent(el, "mousemove", _this._passCallback);
      });
      addEvent(container, "contextmenu", _this._onContextMenu);
    }
    if (checkWindowBlur) {
      addEvent(getWindow(), "blur", _this.onBlur);
    }
    if (_this._useTouch) {
      var passive_1 = {
        passive: false
      };
      elements.forEach(function(el) {
        addEvent(el, "touchstart", _this.onDragStart, passive_1);
        addEvent(el, "touchmove", _this._passCallback, passive_1);
      });
    }
    return _this;
  }
  Gesto2.prototype.stop = function() {
    this.isDrag = false;
    this.data = {};
    this.clientStores = [];
    this.pinchFlag = false;
    this.doubleFlag = false;
    this.prevTime = 0;
    this.flag = false;
    this._isIdle = true;
    this._allowClickEvent();
    this._dettachDragEvent();
    this._isDragAPI = false;
  };
  Gesto2.prototype.getMovement = function(clients) {
    return this.getCurrentStore().getMovement(clients) + this.clientStores.slice(1).reduce(function(prev, cur) {
      return prev + cur.movement;
    }, 0);
  };
  Gesto2.prototype.isDragging = function() {
    return this.isDrag;
  };
  Gesto2.prototype.isIdle = function() {
    return this._isIdle;
  };
  Gesto2.prototype.isFlag = function() {
    return this.flag;
  };
  Gesto2.prototype.isPinchFlag = function() {
    return this.pinchFlag;
  };
  Gesto2.prototype.isDoubleFlag = function() {
    return this.doubleFlag;
  };
  Gesto2.prototype.isPinching = function() {
    return this.isPinch;
  };
  Gesto2.prototype.scrollBy = function(deltaX, deltaY, e, isCallDrag) {
    if (isCallDrag === void 0) {
      isCallDrag = true;
    }
    if (!this.flag) {
      return;
    }
    this.clientStores[0].move(deltaX, deltaY);
    isCallDrag && this.onDrag(e, true);
  };
  Gesto2.prototype.move = function(_a, inputEvent) {
    var deltaX = _a[0], deltaY = _a[1];
    var store = this.getCurrentStore();
    var nextClients = store.prevClients;
    return this.moveClients(nextClients.map(function(_a2) {
      var clientX = _a2.clientX, clientY = _a2.clientY;
      return {
        clientX: clientX + deltaX,
        clientY: clientY + deltaY,
        originalClientX: clientX,
        originalClientY: clientY
      };
    }), inputEvent, true);
  };
  Gesto2.prototype.triggerDragStart = function(e) {
    this.onDragStart(e, false);
  };
  Gesto2.prototype.setEventData = function(data) {
    var currentData = this.data;
    for (var name_1 in data) {
      currentData[name_1] = data[name_1];
    }
    return this;
  };
  Gesto2.prototype.setEventDatas = function(data) {
    return this.setEventData(data);
  };
  Gesto2.prototype.getCurrentEvent = function(inputEvent) {
    if (inputEvent === void 0) {
      inputEvent = this._prevInputEvent;
    }
    return __assign4(__assign4({ data: this.data, datas: this.data }, this._getPosition()), { movement: this.getMovement(), isDrag: this.isDrag, isPinch: this.isPinch, isScroll: false, inputEvent });
  };
  Gesto2.prototype.getEventData = function() {
    return this.data;
  };
  Gesto2.prototype.getEventDatas = function() {
    return this.data;
  };
  Gesto2.prototype.unset = function() {
    var _this = this;
    var targets = this.targets;
    var container = this.options.container;
    this.off();
    removeEvent(this._window, "blur", this.onBlur);
    if (this._useDrag) {
      targets.forEach(function(el) {
        removeEvent(el, "dragstart", _this.onDragStart);
      });
    }
    if (this._useMouse) {
      targets.forEach(function(target) {
        removeEvent(target, "mousedown", _this.onDragStart);
      });
      removeEvent(container, "contextmenu", this._onContextMenu);
    }
    if (this._useTouch) {
      targets.forEach(function(target) {
        removeEvent(target, "touchstart", _this.onDragStart);
      });
      removeEvent(container, "touchstart", this.onDragStart);
    }
    this._prevInputEvent = null;
    this._allowClickEvent();
    this._dettachDragEvent();
  };
  Gesto2.prototype.onPinchStart = function(e) {
    var _this = this;
    var pinchThreshold = this.options.pinchThreshold;
    if (this.isDrag && this.getMovement() > pinchThreshold) {
      return;
    }
    var store = new ClientStore(getEventClients(e));
    this.pinchFlag = true;
    this._addStore(store);
    var result = this.emit("pinchStart", __assign4(__assign4({ data: this.data, datas: this.data, angle: store.getAngle(), touches: this.getCurrentStore().getPositions() }, store.getPosition()), { inputEvent: e, isTrusted: this._isTrusted, preventDefault: function() {
      e.preventDefault();
    }, preventDrag: function() {
      _this._dragFlag = false;
    } }));
    if (result === false) {
      this.pinchFlag = false;
    }
  };
  Gesto2.prototype.onPinch = function(e, clients) {
    if (!this.flag || !this.pinchFlag || clients.length < 2) {
      return;
    }
    var store = this.getCurrentStore();
    this.isPinch = true;
    this.emit("pinch", __assign4(__assign4({ data: this.data, datas: this.data, movement: this.getMovement(clients), angle: store.getAngle(clients), rotation: store.getRotation(clients), touches: store.getPositions(clients), scale: store.getScale(clients), distance: store.getDistance(clients) }, store.getPosition(clients)), { inputEvent: e, isTrusted: this._isTrusted }));
  };
  Gesto2.prototype.onPinchEnd = function(e) {
    if (!this.pinchFlag) {
      return;
    }
    var isPinch = this.isPinch;
    this.isPinch = false;
    this.pinchFlag = false;
    var store = this.getCurrentStore();
    this.emit("pinchEnd", __assign4(__assign4({ data: this.data, datas: this.data, isPinch, touches: store.getPositions() }, store.getPosition()), { inputEvent: e }));
  };
  Gesto2.prototype.getCurrentStore = function() {
    return this.clientStores[0];
  };
  Gesto2.prototype.moveClients = function(clients, inputEvent, isAdd) {
    var position = this._getPosition(clients, isAdd);
    var isPrevDrag = this.isDrag;
    if (position.deltaX || position.deltaY) {
      this.isDrag = true;
    }
    var isFirstDrag = false;
    if (!isPrevDrag && this.isDrag) {
      isFirstDrag = true;
    }
    return __assign4(__assign4({ data: this.data, datas: this.data }, position), { movement: this.getMovement(clients), isDrag: this.isDrag, isPinch: this.isPinch, isScroll: false, isMouseEvent: this._isMouseEvent, isSecondaryButton: this._isSecondaryButton, inputEvent, isTrusted: this._isTrusted, isFirstDrag });
  };
  Gesto2.prototype._addStore = function(store) {
    this.clientStores.splice(0, 0, store);
  };
  Gesto2.prototype._getPosition = function(clients, isAdd) {
    var store = this.getCurrentStore();
    var position = store.getPosition(clients, isAdd);
    var _a = this.clientStores.slice(1).reduce(function(prev, cur) {
      var storePosition = cur.getPosition();
      prev.distX += storePosition.distX;
      prev.distY += storePosition.distY;
      return prev;
    }, position), distX = _a.distX, distY = _a.distY;
    return __assign4(__assign4({}, position), { distX, distY });
  };
  Gesto2.prototype._attchDragEvent = function() {
    var win = this._window;
    var container = this.options.container;
    var passive = {
      passive: false
    };
    if (this._isDragAPI) {
      addEvent(container, "dragover", this.onDrag, passive);
      addEvent(win, "dragend", this.onDragEnd);
    }
    if (this._useMouse) {
      addEvent(container, "mousemove", this.onDrag);
      addEvent(win, "mouseup", this.onDragEnd);
    }
    if (this._useTouch) {
      addEvent(container, "touchmove", this.onDrag, passive);
      addEvent(win, "touchend", this.onDragEnd, passive);
      addEvent(win, "touchcancel", this.onDragEnd, passive);
    }
  };
  Gesto2.prototype._dettachDragEvent = function() {
    var win = this._window;
    var container = this.options.container;
    if (this._isDragAPI) {
      removeEvent(container, "dragover", this.onDrag);
      removeEvent(win, "dragend", this.onDragEnd);
    }
    if (this._useMouse) {
      removeEvent(container, "mousemove", this.onDrag);
      removeEvent(win, "mouseup", this.onDragEnd);
    }
    if (this._useTouch) {
      removeEvent(container, "touchstart", this.onDragStart);
      removeEvent(container, "touchmove", this.onDrag);
      removeEvent(win, "touchend", this.onDragEnd);
      removeEvent(win, "touchcancel", this.onDragEnd);
    }
  };
  return Gesto2;
}(event_emitter_esm_default);

// ../../../node_modules/css-styled/dist/styled.esm.js
function hash(str) {
  var hash2 = 5381, i = str.length;
  while (i) {
    hash2 = hash2 * 33 ^ str.charCodeAt(--i);
  }
  return hash2 >>> 0;
}
var stringHash = hash;
function getHash(str) {
  return stringHash(str).toString(36);
}
function getShadowRoot(parentElement) {
  if (parentElement && parentElement.getRootNode) {
    var rootNode = parentElement.getRootNode();
    if (rootNode.nodeType === 11) {
      return rootNode;
    }
  }
  return;
}
function replaceStyle(className, css2, options) {
  if (options.original) {
    return css2;
  }
  return css2.replace(/([^};{\s}][^};{]*|^\s*){/mg, function(_, selector) {
    var trimmedSelector = selector.trim();
    return (trimmedSelector ? splitComma(trimmedSelector) : [""]).map(function(subSelector) {
      var trimmedSubSelector = subSelector.trim();
      if (trimmedSubSelector.indexOf("@") === 0) {
        return trimmedSubSelector;
      } else if (trimmedSubSelector.indexOf(":global") > -1) {
        return trimmedSubSelector.replace(/\:global/g, "");
      } else if (trimmedSubSelector.indexOf(":host") > -1) {
        return "".concat(trimmedSubSelector.replace(/\:host/g, ".".concat(className)));
      } else if (trimmedSubSelector) {
        return ".".concat(className, " ").concat(trimmedSubSelector);
      } else {
        return ".".concat(className);
      }
    }).join(", ") + " {";
  });
}
function injectStyle(className, css2, options, el, shadowRoot) {
  var doc2 = getDocument(el);
  var style = doc2.createElement("style");
  style.setAttribute("type", "text/css");
  style.setAttribute("data-styled-id", className);
  style.setAttribute("data-styled-count", "1");
  if (options.nonce) {
    style.setAttribute("nonce", options.nonce);
  }
  style.innerHTML = replaceStyle(className, css2, options);
  (shadowRoot || doc2.head || doc2.body).appendChild(style);
  return style;
}
function styled(css2) {
  var injectClassName = "rCS" + getHash(css2);
  return {
    className: injectClassName,
    inject: function(el, options) {
      if (options === void 0) {
        options = {};
      }
      var shadowRoot = getShadowRoot(el);
      var styleElement = (shadowRoot || el.ownerDocument || document).querySelector('style[data-styled-id="'.concat(injectClassName, '"]'));
      if (!styleElement) {
        styleElement = injectStyle(injectClassName, css2, options, el, shadowRoot);
      } else {
        var count = parseFloat(styleElement.getAttribute("data-styled-count")) || 0;
        styleElement.setAttribute("data-styled-count", "".concat(count + 1));
      }
      return {
        destroy: function() {
          var _a;
          var injectCount = parseFloat(styleElement.getAttribute("data-styled-count")) || 0;
          if (injectCount <= 1) {
            if (styleElement.remove) {
              styleElement.remove();
            } else {
              (_a = styleElement.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(styleElement);
            }
            styleElement = null;
          } else {
            styleElement.setAttribute("data-styled-count", "".concat(injectCount - 1));
          }
        }
      };
    }
  };
}
var styled_esm_default = styled;

// ../../../node_modules/react-css-styled/dist/styled.esm.js
import { version, createElement, Component, forwardRef, useRef, useImperativeHandle, useEffect } from "react";
var __assign5 = function() {
  __assign5 = Object.assign || function __assign7(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign5.apply(this, arguments);
};
function __rest(s, e) {
  var t = {};
  for (var p in s)
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
}
function styled2(Tag, css2) {
  var injector = styled_esm_default(css2);
  var cssId = injector.className;
  return forwardRef(function(props, ref2) {
    var _a = props.className, className = _a === void 0 ? "" : _a, cspNonce = props.cspNonce, attributes = __rest(props, ["className", "cspNonce"]);
    var targetRef = useRef();
    useImperativeHandle(ref2, function() {
      return targetRef.current;
    }, []);
    useEffect(function() {
      var injectResult = injector.inject(targetRef.current, {
        nonce: props.cspNonce
      });
      return function() {
        injectResult.destroy();
      };
    }, []);
    return createElement(Tag, __assign5({
      "ref": targetRef,
      "data-styled-id": cssId,
      "className": "".concat(className, " ").concat(cssId)
    }, attributes));
  });
}

// ../../../node_modules/react-moveable/dist/moveable.esm.js
var extendStatics4 = function(d, b) {
  extendStatics4 = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2)
      if (Object.prototype.hasOwnProperty.call(b2, p))
        d2[p] = b2[p];
  };
  return extendStatics4(d, b);
};
function __extends4(d, b) {
  if (typeof b !== "function" && b !== null)
    throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics4(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign6 = function() {
  __assign6 = Object.assign || function __assign7(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign6.apply(this, arguments);
};
function __rest2(s, e) {
  var t = {};
  for (var p in s)
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
}
function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
}
function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2)
    for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar)
          ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
  return to.concat(ar || Array.prototype.slice.call(from));
}
function makeAble(name, able) {
  return __assign6({ events: [], props: [], name }, able);
}
var DIRECTIONS4 = ["n", "w", "s", "e"];
var DIRECTIONS = ["n", "w", "s", "e", "nw", "ne", "sw", "se"];
function getSVGCursor(scale, degree) {
  return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="'.concat(32 * scale, 'px" height="').concat(32 * scale, 'px" viewBox="0 0 32 32" ><path d="M 16,5 L 12,10 L 14.5,10 L 14.5,22 L 12,22 L 16,27 L 20,22 L 17.5,22 L 17.5,10 L 20, 10 L 16,5 Z" stroke-linejoin="round" stroke-width="1.2" fill="black" stroke="white" style="transform:rotate(').concat(degree, 'deg);transform-origin: 16px 16px"></path></svg>');
}
function getCursorCSS(degree) {
  var x1 = getSVGCursor(1, degree);
  var degree45 = Math.round(degree / 45) * 45 % 180;
  var defaultCursor = "ns-resize";
  if (degree45 === 135) {
    defaultCursor = "nwse-resize";
  } else if (degree45 === 45) {
    defaultCursor = "nesw-resize";
  } else if (degree45 === 90) {
    defaultCursor = "ew-resize";
  }
  return "cursor:".concat(defaultCursor, ";cursor: url('").concat(x1, "') 16 16, ").concat(defaultCursor, ";");
}
var agent2 = agent_esm_default();
var IS_WEBKIT = agent2.browser.webkit;
var IS_WEBKIT605 = IS_WEBKIT && function() {
  var navi = typeof window === "undefined" ? { userAgent: "" } : window.navigator;
  var res = /applewebkit\/([^\s]+)/g.exec(navi.userAgent.toLowerCase());
  return res ? parseFloat(res[1]) < 605 : false;
}();
var browserName = agent2.browser.name;
var browserVersion = parseInt(agent2.browser.version, 10);
var IS_CHROME = browserName === "chrome";
var IS_CHROMIUM = agent2.browser.chromium;
var chromiumVersion = parseInt(agent2.browser.chromiumVersion, 10) || 0;
var IS_CHROMIUM109 = IS_CHROME && browserVersion >= 109 || IS_CHROMIUM && chromiumVersion >= 109;
var IS_FIREFOX = browserName === "firefox";
var IS_SAFARI_ABOVE15 = parseInt(agent2.browser.webkitVersion, 10) >= 612 || browserVersion >= 15;
var PREFIX = "moveable-";
var directionCSS = DIRECTIONS.map(function(dir) {
  var top = "";
  var left = "";
  var originX = "center";
  var originY = "center";
  var offset = "calc(var(--moveable-control-padding, 20) * -1px)";
  if (dir.indexOf("n") > -1) {
    top = "top: ".concat(offset, ";");
    originY = "bottom";
  }
  if (dir.indexOf("s") > -1) {
    top = "top: 0px;";
    originY = "top";
  }
  if (dir.indexOf("w") > -1) {
    left = "left: ".concat(offset, ";");
    originX = "right";
  }
  if (dir.indexOf("e") > -1) {
    left = "left: 0px;";
    originX = "left";
  }
  return '.around-control[data-direction*="'.concat(dir, '"] {\n        ').concat(left).concat(top, "\n        transform-origin: ").concat(originX, " ").concat(originY, ";\n    }");
}).join("\n");
var MOVEABLE_CSS = "\n{\nposition: absolute;\nwidth: 1px;\nheight: 1px;\nleft: 0;\ntop: 0;\nz-index: 3000;\n--moveable-color: #4af;\n--zoom: 1;\n--zoompx: 1px;\n--moveable-line-padding: 0;\n--moveable-control-padding: 0;\nwill-change: transform;\noutline: 1px solid transparent;\n}\n.control-box {\nz-index: 0;\n}\n.line, .control {\nposition: absolute;\nleft: 0;\ntop: 0;\nwill-change: transform;\n}\n.control {\nwidth: 14px;\nheight: 14px;\nborder-radius: 50%;\nborder: 2px solid #fff;\nbox-sizing: border-box;\nbackground: #4af;\nbackground: var(--moveable-color);\nmargin-top: -7px;\nmargin-left: -7px;\nborder: 2px solid #fff;\nz-index: 10;\n}\n.around-control {\nposition: absolute;\nwill-change: transform;\nwidth: calc(var(--moveable-control-padding, 20) * 1px);\nheight: calc(var(--moveable-control-padding, 20) * 1px);\nleft: calc(var(--moveable-control-padding, 20) * -0.5px);\ntop: calc(var(--moveable-control-padding, 20) * -0.5px);\nbox-sizing: border-box;\nbackground: transparent;\nz-index: 8;\ncursor: alias;\ntransform-origin: center center;\n}\n".concat(directionCSS, "\n.padding {\nposition: absolute;\ntop: 0px;\nleft: 0px;\nwidth: 100px;\nheight: 100px;\ntransform-origin: 0 0;\n}\n.line {\nwidth: 1px;\nheight: 1px;\nbackground: #4af;\nbackground: var(--moveable-color);\ntransform-origin: 0px 50%;\n}\n.line.edge {\nz-index: 1;\nbackground: transparent;\n}\n.line.dashed {\nbox-sizing: border-box;\nbackground: transparent;\n}\n.line.dashed.horizontal {\nborder-top: 1px dashed #4af;\nborder-top-color: #4af;\nborder-top-color: var(--moveable-color);\n}\n.line.dashed.vertical {\nborder-left: 1px dashed #4af;\nborder-left-color: #4af;\nborder-left-color: var(--moveable-color);\n}\n.line.vertical {\ntransform: translateX(-50%);\n}\n.line.horizontal {\ntransform: translateY(-50%);\n}\n.line.vertical.bold {\nwidth: 2px;\n}\n.line.horizontal.bold {\nheight: 2px;\n}\n\n.control.origin {\nborder-color: #f55;\nbackground: #fff;\nwidth: 12px;\nheight: 12px;\nmargin-top: -6px;\nmargin-left: -6px;\npointer-events: none;\n}\n").concat([0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165].map(function(degree) {
  return '\n.direction[data-rotation="'.concat(degree, '"], :global .view-control-rotation').concat(degree, " {\n").concat(getCursorCSS(degree), "\n}\n");
}).join("\n"), '\n\n.line.direction:before {\ncontent: "";\nposition: absolute;\nwidth: 100%;\nheight: calc(var(--moveable-line-padding, 0) * 1px);\nbottom: 0;\nleft: 0;\n}\n.group {\nz-index: -1;\n}\n.area {\nposition: absolute;\n}\n.area-pieces {\nposition: absolute;\ntop: 0;\nleft: 0;\ndisplay: none;\n}\n.area.avoid, .area.pass {\npointer-events: none;\n}\n.area.avoid+.area-pieces {\ndisplay: block;\n}\n.area-piece {\nposition: absolute;\n}\n\n').concat(IS_WEBKIT605 ? ':global svg *:before {\ncontent:"";\ntransform-origin: inherit;\n}' : "", "\n");
var NEARBY_POS = [
  [0, 1, 2],
  [1, 0, 3],
  [2, 0, 3],
  [3, 1, 2]
];
var FLOAT_POINT_NUM = 1e-4;
var TINY_NUM2 = 1e-7;
var MIN_SCALE = 1e-9;
var MAX_NUM = Math.pow(10, 10);
var MIN_NUM = -MAX_NUM;
var DIRECTION_REGION_TO_DIRECTION = {
  n: [0, -1],
  e: [1, 0],
  s: [0, 1],
  w: [-1, 0],
  nw: [-1, -1],
  ne: [1, -1],
  sw: [-1, 1],
  se: [1, 1]
};
var DIRECTION_INDEXES = {
  n: [0, 1],
  e: [1, 3],
  s: [3, 2],
  w: [2, 0],
  nw: [0],
  ne: [1],
  sw: [2],
  se: [3]
};
var DIRECTION_ROTATIONS = {
  n: 0,
  s: 180,
  w: 270,
  e: 90,
  nw: 315,
  ne: 45,
  sw: 225,
  se: 135
};
var MOVEABLE_METHODS = [
  "isMoveableElement",
  "updateRect",
  "updateTarget",
  "destroy",
  "dragStart",
  "isInside",
  "hitTest",
  "setState",
  "getRect",
  "request",
  "isDragging",
  "getManager",
  "forceUpdate",
  "waitToChangeTarget",
  "updateSelectors",
  "getTargets",
  "stopDrag",
  "getControlBoxElement",
  "getMoveables",
  "getDragElement"
];
function setCustomDrag(e, state, delta, isPinch, isConvert, ableName) {
  var _a, _b;
  if (ableName === void 0) {
    ableName = "draggable";
  }
  var result = (_b = (_a = state.gestos[ableName]) === null || _a === void 0 ? void 0 : _a.move(delta, e.inputEvent)) !== null && _b !== void 0 ? _b : {};
  var datas = result.originalDatas || result.datas;
  var ableDatas = datas[ableName] || (datas[ableName] = {});
  return __assign6(__assign6({}, isConvert ? convertDragDist(state, result) : result), { isPinch: !!isPinch, parentEvent: true, datas: ableDatas, originalDatas: e.originalDatas });
}
var CustomGesto = /* @__PURE__ */ function() {
  function CustomGesto2(ableName) {
    var _a;
    if (ableName === void 0) {
      ableName = "draggable";
    }
    this.ableName = ableName;
    this.prevX = 0;
    this.prevY = 0;
    this.startX = 0;
    this.startY = 0;
    this.isDrag = false;
    this.isFlag = false;
    this.datas = {
      draggable: {}
    };
    this.datas = (_a = {}, _a[ableName] = {}, _a);
  }
  CustomGesto2.prototype.dragStart = function(client, e) {
    this.isDrag = false;
    this.isFlag = false;
    var originalDatas = e.originalDatas;
    this.datas = originalDatas;
    if (!originalDatas[this.ableName]) {
      originalDatas[this.ableName] = {};
    }
    return __assign6(__assign6({}, this.move(client, e.inputEvent)), { type: "dragstart" });
  };
  CustomGesto2.prototype.drag = function(client, inputEvent) {
    return this.move([
      client[0] - this.prevX,
      client[1] - this.prevY
    ], inputEvent);
  };
  CustomGesto2.prototype.move = function(delta, inputEvent) {
    var clientX;
    var clientY;
    var isFirstDrag = false;
    if (!this.isFlag) {
      this.prevX = delta[0];
      this.prevY = delta[1];
      this.startX = delta[0];
      this.startY = delta[1];
      clientX = delta[0];
      clientY = delta[1];
      this.isFlag = true;
    } else {
      var isPrevDrag = this.isDrag;
      clientX = this.prevX + delta[0];
      clientY = this.prevY + delta[1];
      if (delta[0] || delta[1]) {
        this.isDrag = true;
      }
      if (!isPrevDrag && this.isDrag) {
        isFirstDrag = true;
      }
    }
    this.prevX = clientX;
    this.prevY = clientY;
    return {
      type: "drag",
      clientX,
      clientY,
      inputEvent,
      isFirstDrag,
      isDrag: this.isDrag,
      distX: clientX - this.startX,
      distY: clientY - this.startY,
      deltaX: delta[0],
      deltaY: delta[1],
      datas: this.datas[this.ableName],
      originalDatas: this.datas,
      parentEvent: true,
      parentGesto: this
    };
  };
  return CustomGesto2;
}();
function calculateElementPosition(matrix, origin, width, height) {
  var is3d = matrix.length === 16;
  var n = is3d ? 4 : 3;
  var poses = calculatePoses(matrix, width, height, n);
  var _a = __read(poses, 4), _b = __read(_a[0], 2), x1 = _b[0], y1 = _b[1], _c = __read(_a[1], 2), x2 = _c[0], y2 = _c[1], _d = __read(_a[2], 2), x3 = _d[0], y3 = _d[1], _e = __read(_a[3], 2), x4 = _e[0], y4 = _e[1];
  var _f = __read(calculatePosition(matrix, origin, n), 2), originX = _f[0], originY = _f[1];
  var left = Math.min(x1, x2, x3, x4);
  var top = Math.min(y1, y2, y3, y4);
  var right = Math.max(x1, x2, x3, x4);
  var bottom = Math.max(y1, y2, y3, y4);
  x1 = x1 - left || 0;
  x2 = x2 - left || 0;
  x3 = x3 - left || 0;
  x4 = x4 - left || 0;
  y1 = y1 - top || 0;
  y2 = y2 - top || 0;
  y3 = y3 - top || 0;
  y4 = y4 - top || 0;
  originX = originX - left || 0;
  originY = originY - top || 0;
  var sx = matrix[0];
  var sy = matrix[n + 1];
  var direction = sign(sx * sy);
  return {
    left,
    top,
    right,
    bottom,
    origin: [originX, originY],
    pos1: [x1, y1],
    pos2: [x2, y2],
    pos3: [x3, y3],
    pos4: [x4, y4],
    direction
  };
}
function calculatePointerDist(moveable, e) {
  var clientX = e.clientX, clientY = e.clientY, datas = e.datas;
  var _a = moveable.state, moveableClientRect = _a.moveableClientRect, rootMatrix = _a.rootMatrix, is3d = _a.is3d, pos1 = _a.pos1;
  var left = moveableClientRect.left, top = moveableClientRect.top;
  var n = is3d ? 4 : 3;
  var _b = __read(minus(calculateInversePosition(rootMatrix, [clientX - left, clientY - top], n), pos1), 2), posX = _b[0], posY = _b[1];
  var _c = __read(getDragDist({ datas, distX: posX, distY: posY }), 2), distX = _c[0], distY = _c[1];
  return [distX, distY];
}
function setDragStart(moveable, _a) {
  var datas = _a.datas;
  var _b = moveable.state, allMatrix = _b.allMatrix, beforeMatrix = _b.beforeMatrix, is3d = _b.is3d, left = _b.left, top = _b.top, origin = _b.origin, offsetMatrix = _b.offsetMatrix, targetMatrix = _b.targetMatrix, transformOrigin = _b.transformOrigin;
  var n = is3d ? 4 : 3;
  datas.is3d = is3d;
  datas.matrix = allMatrix;
  datas.targetMatrix = targetMatrix;
  datas.beforeMatrix = beforeMatrix;
  datas.offsetMatrix = offsetMatrix;
  datas.transformOrigin = transformOrigin;
  datas.inverseMatrix = invert(allMatrix, n);
  datas.inverseBeforeMatrix = invert(beforeMatrix, n);
  datas.absoluteOrigin = convertPositionMatrix(plus([left, top], origin), n);
  datas.startDragBeforeDist = calculate(datas.inverseBeforeMatrix, datas.absoluteOrigin, n);
  datas.startDragDist = calculate(datas.inverseMatrix, datas.absoluteOrigin, n);
}
function getTransformDirection(e) {
  return calculateElementPosition(e.datas.beforeTransform, [50, 50], 100, 100).direction;
}
function resolveTransformEvent(moveable, event, functionName) {
  var datas = event.datas, originalDatas = event.originalDatas.beforeRenderable;
  var index = datas.transformIndex;
  var nextTransforms = originalDatas.nextTransforms;
  var length = nextTransforms.length;
  var nextTransformAppendedIndexes = originalDatas.nextTransformAppendedIndexes;
  var nextIndex = -1;
  if (index === -1) {
    if (functionName === "translate") {
      nextIndex = 0;
    } else if (functionName === "rotate") {
      nextIndex = findIndex(nextTransforms, function(text) {
        return text.match(/scale\(/g);
      });
    }
    if (nextIndex === -1) {
      nextIndex = nextTransforms.length;
    }
    datas.transformIndex = nextIndex;
  } else if (find2(nextTransformAppendedIndexes, function(info) {
    return info.index === index && info.functionName === functionName;
  })) {
    nextIndex = index;
  } else {
    nextIndex = index + nextTransformAppendedIndexes.filter(function(info) {
      return info.index < index;
    }).length;
  }
  var result = convertTransformInfo(nextTransforms, moveable.state, nextIndex);
  var targetFunction = result.targetFunction;
  var matFunctionName = functionName === "rotate" ? "rotateZ" : functionName;
  datas.beforeFunctionTexts = result.beforeFunctionTexts;
  datas.afterFunctionTexts = result.afterFunctionTexts;
  datas.beforeTransform = result.beforeFunctionMatrix;
  datas.beforeTransform2 = result.beforeFunctionMatrix2;
  datas.targetTansform = result.targetFunctionMatrix;
  datas.afterTransform = result.afterFunctionMatrix;
  datas.afterTransform2 = result.afterFunctionMatrix2;
  datas.targetAllTransform = result.allFunctionMatrix;
  if (targetFunction.functionName === matFunctionName) {
    datas.afterFunctionTexts.splice(0, 1);
    datas.isAppendTransform = false;
  } else if (length > nextIndex) {
    datas.isAppendTransform = true;
    originalDatas.nextTransformAppendedIndexes = __spreadArray(__spreadArray([], __read(nextTransformAppendedIndexes), false), [{
      functionName,
      index: nextIndex,
      isAppend: true
    }], false);
  }
}
function convertTransformFormat(datas, value, dist) {
  return "".concat(datas.beforeFunctionTexts.join(" "), " ").concat(datas.isAppendTransform ? dist : value, " ").concat(datas.afterFunctionTexts.join(" "));
}
function getTransformDist(_a) {
  var datas = _a.datas, distX = _a.distX, distY = _a.distY;
  var _b = __read(getBeforeDragDist({ datas, distX, distY }), 2), bx = _b[0], by = _b[1];
  var res = getTransfromMatrix(datas, fromTranslation([bx, by], 4));
  return calculate(res, convertPositionMatrix([0, 0, 0], 4), 4);
}
function getTransfromMatrix(datas, targetMatrix, isAfter) {
  var beforeTransform = datas.beforeTransform, afterTransform = datas.afterTransform, beforeTransform2 = datas.beforeTransform2, afterTransform2 = datas.afterTransform2, targetAllTransform = datas.targetAllTransform;
  var nextTargetMatrix = isAfter ? multiply(targetAllTransform, targetMatrix, 4) : multiply(targetMatrix, targetAllTransform, 4);
  var res1 = multiply(invert(isAfter ? beforeTransform2 : beforeTransform, 4), nextTargetMatrix, 4);
  var afterTargetMatrix = multiply(res1, invert(isAfter ? afterTransform2 : afterTransform, 4), 4);
  return afterTargetMatrix;
}
function getBeforeDragDist(_a) {
  var datas = _a.datas, distX = _a.distX, distY = _a.distY;
  var inverseBeforeMatrix = datas.inverseBeforeMatrix, is3d = datas.is3d, startDragBeforeDist = datas.startDragBeforeDist, absoluteOrigin = datas.absoluteOrigin;
  var n = is3d ? 4 : 3;
  return minus(calculate(inverseBeforeMatrix, plus(absoluteOrigin, [distX, distY]), n), startDragBeforeDist);
}
function getDragDist(_a, isBefore) {
  var datas = _a.datas, distX = _a.distX, distY = _a.distY;
  var inverseBeforeMatrix = datas.inverseBeforeMatrix, inverseMatrix = datas.inverseMatrix, is3d = datas.is3d, startDragBeforeDist = datas.startDragBeforeDist, startDragDist = datas.startDragDist, absoluteOrigin = datas.absoluteOrigin;
  var n = is3d ? 4 : 3;
  return minus(calculate(isBefore ? inverseBeforeMatrix : inverseMatrix, plus(absoluteOrigin, [distX, distY]), n), isBefore ? startDragBeforeDist : startDragDist);
}
function getInverseDragDist(_a, isBefore) {
  var datas = _a.datas, distX = _a.distX, distY = _a.distY;
  var beforeMatrix = datas.beforeMatrix, matrix = datas.matrix, is3d = datas.is3d, startDragBeforeDist = datas.startDragBeforeDist, startDragDist = datas.startDragDist, absoluteOrigin = datas.absoluteOrigin;
  var n = is3d ? 4 : 3;
  return minus(calculate(isBefore ? beforeMatrix : matrix, plus(isBefore ? startDragBeforeDist : startDragDist, [distX, distY]), n), absoluteOrigin);
}
function calculateTransformOrigin(transformOrigin, width, height, prevWidth, prevHeight, prevOrigin) {
  if (prevWidth === void 0) {
    prevWidth = width;
  }
  if (prevHeight === void 0) {
    prevHeight = height;
  }
  if (prevOrigin === void 0) {
    prevOrigin = [0, 0];
  }
  if (!transformOrigin) {
    return prevOrigin;
  }
  return transformOrigin.map(function(pos, i) {
    var _a = splitUnit(pos), value = _a.value, unit = _a.unit;
    var prevSize = i ? prevHeight : prevWidth;
    var size = i ? height : width;
    if (pos === "%" || isNaN(value)) {
      var measureRatio = prevSize ? prevOrigin[i] / prevSize : 0;
      return size * measureRatio;
    } else if (unit !== "%") {
      return value;
    }
    return size * value / 100;
  });
}
function getPosIndexesByDirection(direction) {
  var indexes = [];
  if (direction[1] >= 0) {
    if (direction[0] >= 0) {
      indexes.push(3);
    }
    if (direction[0] <= 0) {
      indexes.push(2);
    }
  }
  if (direction[1] <= 0) {
    if (direction[0] >= 0) {
      indexes.push(1);
    }
    if (direction[0] <= 0) {
      indexes.push(0);
    }
  }
  return indexes;
}
function getPosesByDirection(poses, direction) {
  return getPosIndexesByDirection(direction).map(function(index) {
    return poses[index];
  });
}
function getPosByDirection(poses, direction) {
  var xRatio = (direction[0] + 1) / 2;
  var yRatio = (direction[1] + 1) / 2;
  var top = [
    dot(poses[0][0], poses[1][0], xRatio, 1 - xRatio),
    dot(poses[0][1], poses[1][1], xRatio, 1 - xRatio)
  ];
  var bottom = [
    dot(poses[2][0], poses[3][0], xRatio, 1 - xRatio),
    dot(poses[2][1], poses[3][1], xRatio, 1 - xRatio)
  ];
  return [
    dot(top[0], bottom[0], yRatio, 1 - yRatio),
    dot(top[1], bottom[1], yRatio, 1 - yRatio)
  ];
}
function getDist3(startPos, matrix, width, height, n, fixedDirection) {
  var poses = calculatePoses(matrix, width, height, n);
  var fixedPos = getPosByDirection(poses, fixedDirection);
  var distX = startPos[0] - fixedPos[0];
  var distY = startPos[1] - fixedPos[1];
  return [distX, distY];
}
function getNextMatrix(offsetMatrix, targetMatrix, origin, n) {
  return multiply(offsetMatrix, getAbsoluteMatrix(targetMatrix, n, origin), n);
}
function getNextTransformMatrix(state, datas, transform, isAllTransform) {
  var transformOrigin = state.transformOrigin, offsetMatrix = state.offsetMatrix, is3d = state.is3d;
  var n = is3d ? 4 : 3;
  var targetTransform;
  if (isString(transform)) {
    var beforeTransform = datas.beforeTransform, afterTransform = datas.afterTransform;
    if (isAllTransform) {
      targetTransform = convertDimension(parseMat(transform), 4, n);
    } else {
      targetTransform = convertDimension(multiply(multiply(beforeTransform, parseMat([transform]), 4), afterTransform, 4), 4, n);
    }
  } else {
    targetTransform = transform;
  }
  return getNextMatrix(offsetMatrix, targetTransform, transformOrigin, n);
}
function scaleMatrix(state, scale) {
  var transformOrigin = state.transformOrigin, offsetMatrix = state.offsetMatrix, is3d = state.is3d, targetMatrix = state.targetMatrix, targetAllTransform = state.targetAllTransform;
  var n = is3d ? 4 : 3;
  return getNextMatrix(offsetMatrix, multiply(targetAllTransform || targetMatrix, createScaleMatrix(scale, n), n), transformOrigin, n);
}
function fillTransformStartEvent(moveable, e) {
  var originalDatas = getBeforeRenderableDatas(e);
  return {
    setTransform: function(transform, index) {
      if (index === void 0) {
        index = -1;
      }
      originalDatas.startTransforms = isArray(transform) ? transform : splitSpace(transform);
      setTransformIndex(moveable, e, index);
    },
    setTransformIndex: function(index) {
      setTransformIndex(moveable, e, index);
    }
  };
}
function setDefaultTransformIndex(moveable, e, property) {
  var originalDatas = getBeforeRenderableDatas(e);
  var startTransforms = originalDatas.startTransforms;
  setTransformIndex(moveable, e, findIndex(startTransforms, function(func) {
    return func.indexOf("".concat(property, "(")) === 0;
  }));
}
function setTransformIndex(moveable, e, index) {
  var originalDatas = getBeforeRenderableDatas(e);
  var datas = e.datas;
  datas.transformIndex = index;
  if (index === -1) {
    return;
  }
  var transform = originalDatas.startTransforms[index];
  if (!transform) {
    return;
  }
  var state = moveable.state;
  var info = parse([transform], {
    "x%": function(v) {
      return v / 100 * state.offsetWidth;
    },
    "y%": function(v) {
      return v / 100 * state.offsetHeight;
    }
  });
  datas.startValue = info[0].functionValue;
}
function fillOriginalTransform(e, transform) {
  var originalDatas = getBeforeRenderableDatas(e);
  originalDatas.nextTransforms = splitSpace(transform);
}
function getBeforeRenderableDatas(e) {
  return e.originalDatas.beforeRenderable;
}
function getNextTransforms(e) {
  var originalDatas = e.originalDatas.beforeRenderable;
  return originalDatas.nextTransforms;
}
function getNextTransformText(e) {
  return (getNextTransforms(e) || []).join(" ");
}
function getNextStyle(e) {
  return getBeforeRenderableDatas(e).nextStyle;
}
function fillTransformEvent(moveable, nextTransform, delta, isPinch, e) {
  fillOriginalTransform(e, nextTransform);
  var drag = Draggable.drag(moveable, setCustomDrag(e, moveable.state, delta, isPinch, false));
  var afterTransform = drag ? drag.transform : nextTransform;
  return __assign6(__assign6({ transform: nextTransform, drag }, fillCSSObject({
    transform: afterTransform
  }, e)), { afterTransform });
}
function getTranslateFixedPosition(moveable, transform, fixedDirection, fixedOffset, datas, isAllTransform) {
  var nextMatrix = getNextTransformMatrix(moveable.state, datas, transform, isAllTransform);
  var nextFixedPosition = getDirectionOffset(moveable, fixedDirection, fixedOffset, nextMatrix);
  return nextFixedPosition;
}
function getTranslateDist(moveable, transform, fixedDirection, fixedPosition, fixedOffset, datas, isAllTransform) {
  var nextFixedPosition = getTranslateFixedPosition(moveable, transform, fixedDirection, fixedOffset, datas, isAllTransform);
  var state = moveable.state;
  var left = state.left, top = state.top;
  var groupable = moveable.props.groupable;
  var groupLeft = groupable ? left : 0;
  var groupTop = groupable ? top : 0;
  var dist = minus(fixedPosition, nextFixedPosition);
  return minus(dist, [groupLeft, groupTop]);
}
function getScaleDist(moveable, transform, fixedDirection, fixedPosition, fixedOffset, datas, isAllTransform) {
  var dist = getTranslateDist(moveable, transform, fixedDirection, fixedPosition, fixedOffset, datas, isAllTransform);
  return dist;
}
function getDirectionByPos(pos, width, height) {
  return [
    width ? -1 + pos[0] / (width / 2) : 0,
    height ? -1 + pos[1] / (height / 2) : 0
  ];
}
function getDirectionOffset(moveable, fixedDirection, fixedOffset, nextMatrix) {
  if (nextMatrix === void 0) {
    nextMatrix = moveable.state.allMatrix;
  }
  var _a = moveable.state, width = _a.width, height = _a.height, is3d = _a.is3d;
  var n = is3d ? 4 : 3;
  var fixedOffsetPosition = [
    width / 2 * (1 + fixedDirection[0]) + fixedOffset[0],
    height / 2 * (1 + fixedDirection[1]) + fixedOffset[1]
  ];
  return calculatePosition(nextMatrix, fixedOffsetPosition, n);
}
function getRotateDist(moveable, rotateDist, datas) {
  var fixedDirection = datas.fixedDirection;
  var fixedPosition = datas.fixedPosition;
  var fixedOffset = datas.fixedOffset;
  return getTranslateDist(moveable, "rotate(".concat(rotateDist, "deg)"), fixedDirection, fixedPosition, fixedOffset, datas);
}
function getResizeDist(moveable, width, height, fixedPosition, transformOrigin, datas) {
  var groupable = moveable.props.groupable;
  var state = moveable.state;
  var prevOrigin = state.transformOrigin, offsetMatrix = state.offsetMatrix, is3d = state.is3d, prevWidth = state.width, prevHeight = state.height, left = state.left, top = state.top;
  var fixedDirection = datas.fixedDirection;
  var targetMatrix = datas.nextTargetMatrix || state.targetMatrix;
  var n = is3d ? 4 : 3;
  var nextOrigin = calculateTransformOrigin(transformOrigin, width, height, prevWidth, prevHeight, prevOrigin);
  var groupLeft = groupable ? left : 0;
  var groupTop = groupable ? top : 0;
  var nextMatrix = getNextMatrix(offsetMatrix, targetMatrix, nextOrigin, n);
  var dist = getDist3(fixedPosition, nextMatrix, width, height, n, fixedDirection);
  return minus(dist, [groupLeft, groupTop]);
}
function getAbsolutePosition(moveable, direction) {
  return getPosByDirection(getAbsolutePosesByState(moveable.state), direction);
}
function getGestoData(moveable, ableName) {
  var targetGesto = moveable.targetGesto;
  var controlGesto = moveable.controlGesto;
  var data;
  if (targetGesto === null || targetGesto === void 0 ? void 0 : targetGesto.isFlag()) {
    data = targetGesto.getEventData()[ableName];
  }
  if (!data && (controlGesto === null || controlGesto === void 0 ? void 0 : controlGesto.isFlag())) {
    data = controlGesto.getEventData()[ableName];
  }
  return data || {};
}
function getShadowRoot2(parentElement) {
  if (parentElement && parentElement.getRootNode) {
    var rootNode = parentElement.getRootNode();
    if (rootNode.nodeType === 11) {
      return rootNode;
    }
  }
  return;
}
function getIndividualTransforms(getStyle) {
  var scale = getStyle("scale");
  var rotate2 = getStyle("rotate");
  var translate = getStyle("translate");
  var individualTransforms = [];
  if (translate && translate !== "0px" && translate !== "none") {
    individualTransforms.push("translate(".concat(translate.split(/\s+/).join(","), ")"));
  }
  if (rotate2 && rotate2 !== "1" && rotate2 !== "none") {
    individualTransforms.push("rotate(".concat(rotate2, ")"));
  }
  if (scale && scale !== "1" && scale !== "none") {
    individualTransforms.push("scale(".concat(scale.split(/\s+/).join(","), ")"));
  }
  return individualTransforms;
}
function getMatrixStackInfo(target, container, checkContainer) {
  var el = target;
  var matrixes = [];
  var documentElement = getDocumentElement(target) || getDocumentBody(target);
  var requestEnd = !checkContainer && target === container || target === documentElement;
  var isEnd = requestEnd;
  var is3d = false;
  var n = 3;
  var transformOrigin;
  var targetTransformOrigin;
  var targetMatrix;
  var hasFixed = false;
  var offsetContainer = getOffsetInfo(container, container, true).offsetParent;
  var zoom = 1;
  while (el && !isEnd) {
    isEnd = requestEnd;
    var getStyle = getCachedStyle(el);
    var position = getStyle("position");
    var transform = getElementTransform(el);
    var isFixed = position === "fixed";
    var individualTransforms = getIndividualTransforms(getStyle);
    var matrix = convertCSStoMatrix(getTransformMatrix(transform));
    var offsetParent = void 0;
    var isOffsetEnd = false;
    var isStatic = false;
    var parentClientLeft = 0;
    var parentClientTop = 0;
    var fixedClientLeft = 0;
    var fixedClientTop = 0;
    var fixedInfo = {
      hasTransform: false,
      fixedContainer: null
    };
    if (isFixed) {
      hasFixed = true;
      fixedInfo = getPositionFixedInfo(el);
      offsetContainer = fixedInfo.fixedContainer;
    }
    var length_1 = matrix.length;
    if (!is3d && (length_1 === 16 || individualTransforms.length)) {
      is3d = true;
      n = 4;
      convert3DMatrixes(matrixes);
      if (targetMatrix) {
        targetMatrix = convertDimension(targetMatrix, 3, 4);
      }
    }
    if (is3d && length_1 === 9) {
      matrix = convertDimension(matrix, 3, 4);
    }
    var _a = getOffsetPosInfo(el, target), tagName = _a.tagName, hasOffset = _a.hasOffset, isSVG = _a.isSVG, origin_1 = _a.origin, targetOrigin = _a.targetOrigin, offsetPos = _a.offset;
    var _b = __read(offsetPos, 2), offsetLeft = _b[0], offsetTop = _b[1];
    if (tagName === "svg" && targetMatrix) {
      matrixes.push({
        type: "target",
        target: el,
        matrix: getSVGMatrix(el, n)
      });
      matrixes.push({
        type: "offset",
        target: el,
        matrix: createIdentityMatrix(n)
      });
    }
    var targetZoom = parseFloat(getStyle("zoom")) || 1;
    if (isFixed) {
      offsetParent = fixedInfo.fixedContainer;
      isOffsetEnd = true;
    } else {
      var offsetInfo = getOffsetInfo(el, container, false, true, getStyle);
      var offsetZoom = offsetInfo.offsetZoom;
      offsetParent = offsetInfo.offsetParent;
      isOffsetEnd = offsetInfo.isEnd;
      isStatic = offsetInfo.isStatic;
      zoom *= offsetZoom;
      if ((offsetInfo.isCustomElement || offsetZoom !== 1) && isStatic) {
        offsetLeft -= offsetParent.offsetLeft;
        offsetTop -= offsetParent.offsetTop;
      } else if (IS_FIREFOX || IS_CHROMIUM109) {
        var parentSlotElement = offsetInfo.parentSlotElement;
        if (parentSlotElement) {
          var customOffsetParent = offsetParent;
          var customOffsetLeft = 0;
          var customOffsetTop = 0;
          while (customOffsetParent) {
            if (!getShadowRoot2(customOffsetParent)) {
              break;
            }
            customOffsetLeft += customOffsetParent.offsetLeft;
            customOffsetTop += customOffsetParent.offsetTop;
            customOffsetParent = customOffsetParent.offsetParent;
          }
          offsetLeft -= customOffsetLeft;
          offsetTop -= customOffsetTop;
        }
      }
    }
    if (IS_WEBKIT && !IS_SAFARI_ABOVE15 && hasOffset && !isSVG && isStatic && (position === "relative" || position === "static")) {
      offsetLeft -= offsetParent.offsetLeft;
      offsetTop -= offsetParent.offsetTop;
      requestEnd = requestEnd || isOffsetEnd;
    }
    if (isFixed) {
      if (hasOffset && fixedInfo.hasTransform) {
        fixedClientLeft = offsetParent.clientLeft;
        fixedClientTop = offsetParent.clientTop;
      }
    } else {
      if (hasOffset && offsetContainer !== offsetParent) {
        parentClientLeft = offsetParent.clientLeft;
        parentClientTop = offsetParent.clientTop;
      }
      if (hasOffset && offsetParent === documentElement) {
        var margin = getBodyOffset(el, false);
        offsetLeft += margin[0];
        offsetTop += margin[1];
      }
    }
    matrixes.push({
      type: "target",
      target: el,
      matrix: getAbsoluteMatrix(matrix, n, origin_1)
    });
    if (individualTransforms.length) {
      matrixes.push({
        type: "offset",
        target: el,
        matrix: createIdentityMatrix(n)
      });
      matrixes.push({
        type: "target",
        target: el,
        matrix: getAbsoluteMatrix(parseMat(individualTransforms), n, origin_1)
      });
    }
    if (hasOffset) {
      var isElementTarget = el === target;
      var scrollLeft = isElementTarget ? 0 : el.scrollLeft;
      var scrollTop = isElementTarget ? 0 : el.scrollTop;
      matrixes.push({
        type: "offset",
        target: el,
        matrix: createOriginMatrix([
          offsetLeft - scrollLeft + parentClientLeft - fixedClientLeft,
          offsetTop - scrollTop + parentClientTop - fixedClientTop
        ], n)
      });
    } else {
      matrixes.push({
        type: "offset",
        target: el,
        origin: origin_1
      });
    }
    if (targetZoom !== 1) {
      matrixes.push({
        type: "zoom",
        target: el,
        matrix: getAbsoluteMatrix(createScaleMatrix([targetZoom, targetZoom], n), n, [0, 0])
      });
    }
    if (!targetMatrix) {
      targetMatrix = matrix;
    }
    if (!transformOrigin) {
      transformOrigin = origin_1;
    }
    if (!targetTransformOrigin) {
      targetTransformOrigin = targetOrigin;
    }
    if (isEnd || isFixed) {
      break;
    } else {
      el = offsetParent;
      requestEnd = isOffsetEnd;
    }
    if (!checkContainer || el === documentElement) {
      isEnd = requestEnd;
    }
  }
  if (!targetMatrix) {
    targetMatrix = createIdentityMatrix(n);
  }
  if (!transformOrigin) {
    transformOrigin = [0, 0];
  }
  if (!targetTransformOrigin) {
    targetTransformOrigin = [0, 0];
  }
  return {
    zoom,
    offsetContainer,
    matrixes,
    targetMatrix,
    transformOrigin,
    targetOrigin: targetTransformOrigin,
    is3d,
    hasFixed
  };
}
var cacheStyleMap = null;
var clientRectStyleMap = null;
var matrixContainerInfos = null;
function setStoreCache(useCache) {
  if (useCache) {
    if (window.Map) {
      cacheStyleMap = /* @__PURE__ */ new Map();
      clientRectStyleMap = /* @__PURE__ */ new Map();
    }
    matrixContainerInfos = [];
  } else {
    cacheStyleMap = null;
    matrixContainerInfos = null;
    clientRectStyleMap = null;
  }
}
function getCachedClientRect(el) {
  var clientRect = clientRectStyleMap === null || clientRectStyleMap === void 0 ? void 0 : clientRectStyleMap.get(el);
  if (clientRect) {
    return clientRect;
  }
  var nextClientRect = getClientRect(el, true);
  if (clientRectStyleMap) {
    clientRectStyleMap.set(el, nextClientRect);
  }
  return nextClientRect;
}
function getCachedMatrixContainerInfo(target, container) {
  if (matrixContainerInfos) {
    var result_1 = find2(matrixContainerInfos, function(info) {
      return info[0][0] == target && info[0][1] == container;
    });
    if (result_1) {
      return result_1[1];
    }
  }
  var result = getMatrixStackInfo(target, container, true);
  if (matrixContainerInfos) {
    matrixContainerInfos.push([[target, container], result]);
  }
  return result;
}
function getCachedStyle(element) {
  var cache = cacheStyleMap === null || cacheStyleMap === void 0 ? void 0 : cacheStyleMap.get(element);
  if (!cache) {
    var nextStyle_1 = getWindow(element).getComputedStyle(element);
    if (!cacheStyleMap) {
      return function(property) {
        return nextStyle_1[property];
      };
    }
    cache = {
      style: nextStyle_1,
      cached: {}
    };
    cacheStyleMap.set(element, cache);
  }
  var cached = cache.cached;
  var style = cache.style;
  return function(property) {
    if (!(property in cached)) {
      cached[property] = style[property];
    }
    return cached[property];
  };
}
function fillChildEvents(moveable, name, e) {
  var datas = e.originalDatas;
  datas.groupable = datas.groupable || {};
  var groupableDatas = datas.groupable;
  groupableDatas.childDatas = groupableDatas.childDatas || [];
  var childDatas = groupableDatas.childDatas;
  return moveable.moveables.map(function(_, i) {
    childDatas[i] = childDatas[i] || {};
    childDatas[i][name] = childDatas[i][name] || {};
    return __assign6(__assign6({}, e), { isRequestChild: true, datas: childDatas[i][name], originalDatas: childDatas[i] });
  });
}
function triggerChildGesto(moveable, able, type, delta, e, isConvert, ableName) {
  var isStart = !!type.match(/Start$/g);
  var isEnd = !!type.match(/End$/g);
  var isPinch = e.isPinch;
  var datas = e.datas;
  var events = fillChildEvents(moveable, able.name, e);
  var moveables = moveable.moveables;
  var childs = events.map(function(ev, i) {
    var childMoveable = moveables[i];
    var state = childMoveable.state;
    var gestos = state.gestos;
    var childEvent = ev;
    if (isStart) {
      childEvent = new CustomGesto(ableName).dragStart(delta, ev);
    } else {
      if (!gestos[ableName]) {
        gestos[ableName] = datas.childGestos[i];
      }
      if (!gestos[ableName]) {
        return;
      }
      childEvent = setCustomDrag(ev, state, delta, isPinch, isConvert, ableName);
    }
    var result = able[type](childMoveable, __assign6(__assign6({}, childEvent), { parentFlag: true }));
    if (isEnd) {
      gestos[ableName] = null;
    }
    return result;
  });
  if (isStart) {
    datas.childGestos = moveables.map(function(child) {
      return child.state.gestos[ableName];
    });
  }
  return childs;
}
function triggerChildAbles(moveable, able, type, e, eachEvent, callback) {
  if (eachEvent === void 0) {
    eachEvent = function(_, ev) {
      return ev;
    };
  }
  var isEnd = !!type.match(/End$/g);
  var events = fillChildEvents(moveable, able.name, e);
  var moveables = moveable.moveables;
  var childs = events.map(function(ev, i) {
    var childMoveable = moveables[i];
    var childEvent = ev;
    childEvent = eachEvent(childMoveable, ev);
    var result = able[type](childMoveable, __assign6(__assign6({}, childEvent), { parentFlag: true }));
    result && callback && callback(childMoveable, ev, result, i);
    if (isEnd) {
      childMoveable.state.gestos = {};
    }
    return result;
  });
  return childs;
}
function startChildDist(moveable, child, parentDatas, childEvent) {
  var fixedDirection = parentDatas.fixedDirection;
  var fixedPosition = parentDatas.fixedPosition;
  var startPositions = childEvent.datas.startPositions || getAbsolutePosesByState(child.state);
  var pos = getPosByDirection(startPositions, fixedDirection);
  var _a = __read(calculate(createRotateMatrix(-moveable.rotation / 180 * Math.PI, 3), [pos[0] - fixedPosition[0], pos[1] - fixedPosition[1], 1], 3), 2), originalX = _a[0], originalY = _a[1];
  childEvent.datas.originalX = originalX;
  childEvent.datas.originalY = originalY;
  return childEvent;
}
function renderDirectionControlsByInfos(moveable, ableName, renderDirections, React3) {
  var _a = moveable.getState(), renderPoses = _a.renderPoses, rotationRad = _a.rotation, direction = _a.direction;
  var zoom = getProps(moveable.props, ableName).zoom;
  var degRotation = absDegree(rotationRad / Math.PI * 180);
  var directionMap = {};
  var renderState = moveable.renderState;
  if (!renderState.renderDirectionMap) {
    renderState.renderDirectionMap = {};
  }
  var renderDirectionMap = renderState.renderDirectionMap;
  renderDirections.forEach(function(_a2) {
    var dir = _a2.dir;
    directionMap[dir] = true;
  });
  var directionSign = sign(direction);
  return renderDirections.map(function(_a2) {
    var data = _a2.data, classNames = _a2.classNames, dir = _a2.dir;
    var indexes = DIRECTION_INDEXES[dir];
    if (!indexes || !directionMap[dir]) {
      return null;
    }
    renderDirectionMap[dir] = true;
    var directionRotation = (throttle(degRotation, 15) + directionSign * DIRECTION_ROTATIONS[dir] + 720) % 180;
    var dataAttrs = {};
    getKeys(data).forEach(function(name) {
      dataAttrs["data-".concat(name)] = data[name];
    });
    return React3.createElement("div", __assign6({ className: prefix.apply(void 0, __spreadArray(["control", "direction", dir, ableName], __read(classNames), false)), "data-rotation": directionRotation, "data-direction": dir }, dataAttrs, { key: "direction-".concat(dir), style: getControlTransform.apply(void 0, __spreadArray([rotationRad, zoom], __read(indexes.map(function(index) {
      return renderPoses[index];
    })), false)) }));
  });
}
function renderDirectionControls(moveable, defaultDirections, ableName, React3) {
  var _a = getProps(moveable.props, ableName), _b = _a.renderDirections, directions = _b === void 0 ? defaultDirections : _b, displayAroundControls = _a.displayAroundControls;
  if (!directions) {
    return [];
  }
  var renderDirections = directions === true ? DIRECTIONS : directions;
  return __spreadArray(__spreadArray([], __read(displayAroundControls ? renderAroundControls(moveable, React3, ableName, renderDirections) : []), false), __read(renderDirectionControlsByInfos(moveable, ableName, renderDirections.map(function(dir) {
    return {
      data: {},
      classNames: [],
      dir
    };
  }), React3)), false);
}
function renderLine(React3, direction, pos1, pos2, zoom, key) {
  var classNames = [];
  for (var _i = 6; _i < arguments.length; _i++) {
    classNames[_i - 6] = arguments[_i];
  }
  var rad = getRad(pos1, pos2);
  var rotation = direction ? throttle(rad / Math.PI * 180, 15) % 180 : -1;
  return React3.createElement("div", { key: "line-".concat(key), className: prefix.apply(void 0, __spreadArray(["line", "direction", direction ? "edge" : "", direction], __read(classNames), false)), "data-rotation": rotation, "data-line-key": key, "data-direction": direction, style: getLineStyle(pos1, pos2, zoom, rad) });
}
function renderEdgeLines(React3, ableName, edge, poses, zoom) {
  var directions = edge === true ? DIRECTIONS4 : edge;
  return directions.map(function(direction, i) {
    var _a = __read(DIRECTION_INDEXES[direction], 2), index1 = _a[0], index2 = _a[1];
    if (index2 == null) {
      return;
    }
    return renderLine(React3, direction, poses[index1], poses[index2], zoom, "".concat(ableName, "Edge").concat(i), ableName);
  }).filter(Boolean);
}
function getRenderDirections(ableName) {
  return function(moveable, React3) {
    var edge = getProps(moveable.props, ableName).edge;
    if (edge && (edge === true || edge.length)) {
      return __spreadArray(__spreadArray([], __read(renderEdgeLines(React3, ableName, edge, moveable.getState().renderPoses, moveable.props.zoom)), false), __read(renderDiagonalDirections(moveable, ableName, React3)), false);
    }
    return renderAllDirections(moveable, ableName, React3);
  };
}
function renderAllDirections(moveable, ableName, React3) {
  return renderDirectionControls(moveable, DIRECTIONS, ableName, React3);
}
function renderDiagonalDirections(moveable, ableName, React3) {
  return renderDirectionControls(moveable, ["nw", "ne", "sw", "se"], ableName, React3);
}
function renderAroundControls(moveable, React3, ableName, renderDirections) {
  var renderState = moveable.renderState;
  if (!renderState.renderDirectionMap) {
    renderState.renderDirectionMap = {};
  }
  var _a = moveable.getState(), renderPoses = _a.renderPoses, rotationRad = _a.rotation, direction = _a.direction;
  var renderDirectionMap = renderState.renderDirectionMap;
  var zoom = moveable.props.zoom;
  var directionSign = sign(direction);
  var degRotation = rotationRad / Math.PI * 180;
  return (renderDirections || getKeys(renderDirectionMap)).map(function(dir) {
    var indexes = DIRECTION_INDEXES[dir];
    if (!indexes) {
      return null;
    }
    var directionRotation = (throttle(degRotation, 15) + directionSign * DIRECTION_ROTATIONS[dir] + 720) % 180;
    var classNames = ["around-control"];
    if (ableName) {
      classNames.push("direction", ableName);
    }
    return React3.createElement("div", { className: prefix.apply(void 0, __spreadArray([], __read(classNames), false)), "data-rotation": directionRotation, "data-direction": dir, key: "direction-around-".concat(dir), style: getControlTransform.apply(void 0, __spreadArray([rotationRad, zoom], __read(indexes.map(function(index) {
      return renderPoses[index];
    })), false)) });
  });
}
function checkBoundPoses(bounds, verticalPoses, horizontalPoses) {
  var _a = bounds || {}, _b = _a.position, position = _b === void 0 ? "client" : _b, _c = _a.left, left = _c === void 0 ? -Infinity : _c, _d = _a.top, top = _d === void 0 ? -Infinity : _d, _e = _a.right, right = _e === void 0 ? Infinity : _e, _f = _a.bottom, bottom = _f === void 0 ? Infinity : _f;
  var nextBounds = {
    position,
    left,
    top,
    right,
    bottom
  };
  return {
    vertical: checkBounds(nextBounds, verticalPoses, true),
    horizontal: checkBounds(nextBounds, horizontalPoses, false)
  };
}
function getBounds(moveable, externalBounds) {
  var _a = moveable.state, _b = _a.containerClientRect, containerHeight = _b.clientHeight, containerWidth = _b.clientWidth, clientLeft = _b.clientLeft, clientTop = _b.clientTop, _c = _a.snapOffset, snapOffsetLeft = _c.left, snapOffsetTop = _c.top, snapOffsetRight = _c.right, snapOffsetBottom = _c.bottom;
  var bounds = externalBounds || moveable.props.bounds || {};
  var position = bounds.position || "client";
  var isCSS = position === "css";
  var _d = bounds.left, left = _d === void 0 ? -Infinity : _d, _e = bounds.top, top = _e === void 0 ? -Infinity : _e;
  var _f = bounds.right, right = _f === void 0 ? isCSS ? -Infinity : Infinity : _f, _g = bounds.bottom, bottom = _g === void 0 ? isCSS ? -Infinity : Infinity : _g;
  if (isCSS) {
    right = containerWidth + snapOffsetRight - snapOffsetLeft - right;
    bottom = containerHeight + snapOffsetBottom - snapOffsetTop - bottom;
  }
  return {
    left: left + snapOffsetLeft - clientLeft,
    right: right + snapOffsetLeft - clientLeft,
    top: top + snapOffsetTop - clientTop,
    bottom: bottom + snapOffsetTop - clientTop
  };
}
function checkBoundKeepRatio(moveable, startPos, endPos) {
  var _a = getBounds(moveable), left = _a.left, top = _a.top, right = _a.right, bottom = _a.bottom;
  var _b = __read(endPos, 2), endX = _b[0], endY = _b[1];
  var _c = __read(minus(endPos, startPos), 2), dx = _c[0], dy = _c[1];
  if (abs(dx) < TINY_NUM2) {
    dx = 0;
  }
  if (abs(dy) < TINY_NUM2) {
    dy = 0;
  }
  var isBottom = dy > 0;
  var isRight = dx > 0;
  var verticalInfo = {
    isBound: false,
    offset: 0,
    pos: 0
  };
  var horizontalInfo = {
    isBound: false,
    offset: 0,
    pos: 0
  };
  if (dx === 0 && dy === 0) {
    return {
      vertical: verticalInfo,
      horizontal: horizontalInfo
    };
  } else if (dx === 0) {
    if (isBottom) {
      if (bottom < endY) {
        horizontalInfo.pos = bottom;
        horizontalInfo.offset = endY - bottom;
      }
    } else {
      if (top > endY) {
        horizontalInfo.pos = top;
        horizontalInfo.offset = endY - top;
      }
    }
  } else if (dy === 0) {
    if (isRight) {
      if (right < endX) {
        verticalInfo.pos = right;
        verticalInfo.offset = endX - right;
      }
    } else {
      if (left > endX) {
        verticalInfo.pos = left;
        verticalInfo.offset = endX - left;
      }
    }
  } else {
    var a = dy / dx;
    var b = endPos[1] - a * endX;
    var y = 0;
    var x = 0;
    var isBound = false;
    if (isRight && right <= endX) {
      y = a * right + b;
      x = right;
      isBound = true;
    } else if (!isRight && endX <= left) {
      y = a * left + b;
      x = left;
      isBound = true;
    }
    if (isBound) {
      if (y < top || y > bottom) {
        isBound = false;
      }
    }
    if (!isBound) {
      if (isBottom && bottom <= endY) {
        y = bottom;
        x = (y - b) / a;
        isBound = true;
      } else if (!isBottom && endY <= top) {
        y = top;
        x = (y - b) / a;
        isBound = true;
      }
    }
    if (isBound) {
      verticalInfo.isBound = true;
      verticalInfo.pos = x;
      verticalInfo.offset = endX - x;
      horizontalInfo.isBound = true;
      horizontalInfo.pos = y;
      horizontalInfo.offset = endY - y;
    }
  }
  return {
    vertical: verticalInfo,
    horizontal: horizontalInfo
  };
}
function checkBounds(bounds, poses, isVertical) {
  var startBoundPos = bounds[isVertical ? "left" : "top"];
  var endBoundPos = bounds[isVertical ? "right" : "bottom"];
  var minPos = Math.min.apply(Math, __spreadArray([], __read(poses), false));
  var maxPos = Math.max.apply(Math, __spreadArray([], __read(poses), false));
  var boundInfos = [];
  if (startBoundPos + 1 > minPos) {
    boundInfos.push({
      direction: "start",
      isBound: true,
      offset: minPos - startBoundPos,
      pos: startBoundPos
    });
  }
  if (endBoundPos - 1 < maxPos) {
    boundInfos.push({
      direction: "end",
      isBound: true,
      offset: maxPos - endBoundPos,
      pos: endBoundPos
    });
  }
  if (!boundInfos.length) {
    boundInfos.push({
      isBound: false,
      offset: 0,
      pos: 0
    });
  }
  return boundInfos.sort(function(a, b) {
    return abs(b.offset) - abs(a.offset);
  });
}
function isBoundRotate$1(relativePoses, boundRect, rad) {
  var nextPoses = rad ? relativePoses.map(function(pos) {
    return rotate(pos, rad);
  }) : relativePoses;
  return nextPoses.some(function(pos) {
    return pos[0] < boundRect.left && abs(pos[0] - boundRect.left) > 0.1 || pos[0] > boundRect.right && abs(pos[0] - boundRect.right) > 0.1 || pos[1] < boundRect.top && abs(pos[1] - boundRect.top) > 0.1 || pos[1] > boundRect.bottom && abs(pos[1] - boundRect.bottom) > 0.1;
  });
}
function boundRotate(vec, boundPos, index) {
  var r = getDistSize(vec);
  var nextPos = Math.sqrt(r * r - boundPos * boundPos) || 0;
  return [nextPos, -nextPos].sort(function(a, b) {
    return abs(a - vec[index ? 0 : 1]) - abs(b - vec[index ? 0 : 1]);
  }).map(function(pos) {
    return getRad([0, 0], index ? [pos, boundPos] : [boundPos, pos]);
  });
}
function checkRotateBounds(moveable, prevPoses, nextPoses, origin, rotation) {
  if (!moveable.props.bounds) {
    return [];
  }
  var rad = rotation * Math.PI / 180;
  var _a = getBounds(moveable), left = _a.left, top = _a.top, right = _a.right, bottom = _a.bottom;
  var relativeLeft = left - origin[0];
  var relativeRight = right - origin[0];
  var relativeTop = top - origin[1];
  var relativeBottom = bottom - origin[1];
  var boundRect = {
    left: relativeLeft,
    top: relativeTop,
    right: relativeRight,
    bottom: relativeBottom
  };
  if (!isBoundRotate$1(nextPoses, boundRect, 0)) {
    return [];
  }
  var result = [];
  [
    [relativeLeft, 0],
    [relativeRight, 0],
    [relativeTop, 1],
    [relativeBottom, 1]
  ].forEach(function(_a2) {
    var _b = __read(_a2, 2), boundPos = _b[0], index = _b[1];
    nextPoses.forEach(function(nextPos) {
      var relativeRad1 = getRad([0, 0], nextPos);
      result.push.apply(result, __spreadArray([], __read(boundRotate(nextPos, boundPos, index).map(function(relativeRad2) {
        return rad + relativeRad2 - relativeRad1;
      }).filter(function(nextRad) {
        return !isBoundRotate$1(prevPoses, boundRect, nextRad);
      }).map(function(nextRad) {
        return throttle(nextRad * 180 / Math.PI, TINY_NUM2);
      })), false));
    });
  });
  return result;
}
var VERTICAL_NAMES = ["left", "right", "center"];
var HORIZONTAL_NAMES = ["top", "bottom", "middle"];
var SNAP_SKIP_NAMES_MAP = {
  "left": "start",
  "right": "end",
  "center": "center",
  "top": "start",
  "bottom": "end",
  "middle": "center"
};
var VERTICAL_NAMES_MAP = {
  start: "left",
  end: "right",
  center: "center"
};
var HORIZONTAL_NAMES_MAP = {
  start: "top",
  end: "bottom",
  center: "middle"
};
function getInitialBounds() {
  return {
    left: false,
    top: false,
    right: false,
    bottom: false
  };
}
function hasGuidelines(moveable, ableName) {
  var _a = moveable.props, snappable = _a.snappable, bounds = _a.bounds, innerBounds = _a.innerBounds, verticalGuidelines = _a.verticalGuidelines, horizontalGuidelines = _a.horizontalGuidelines, snapGridWidth = _a.snapGridWidth, snapGridHeight = _a.snapGridHeight, _b = moveable.state, guidelines = _b.guidelines, enableSnap = _b.enableSnap;
  if (!snappable || !enableSnap || ableName && snappable !== true && snappable.indexOf(ableName) < 0) {
    return false;
  }
  if (snapGridWidth || snapGridHeight || bounds || innerBounds || guidelines && guidelines.length || verticalGuidelines && verticalGuidelines.length || horizontalGuidelines && horizontalGuidelines.length) {
    return true;
  }
  return false;
}
function getSnapDirections(snapDirections) {
  if (snapDirections === false) {
    return {};
  } else if (snapDirections === true || !snapDirections) {
    return { left: true, right: true, top: true, bottom: true };
  }
  return snapDirections;
}
function mapSnapDirectionPoses(snapDirections, snapPoses) {
  var nextSnapDirections = getSnapDirections(snapDirections);
  var nextSnapPoses = {};
  for (var name_1 in nextSnapDirections) {
    if (name_1 in snapPoses && nextSnapDirections[name_1]) {
      nextSnapPoses[name_1] = snapPoses[name_1];
    }
  }
  return nextSnapPoses;
}
function splitSnapDirectionPoses(snapDirections, snapPoses) {
  var nextSnapPoses = mapSnapDirectionPoses(snapDirections, snapPoses);
  var horizontalNames = HORIZONTAL_NAMES.filter(function(name) {
    return name in nextSnapPoses;
  });
  var verticalNames = VERTICAL_NAMES.filter(function(name) {
    return name in nextSnapPoses;
  });
  return {
    horizontalNames,
    verticalNames,
    horizontal: horizontalNames.map(function(name) {
      return nextSnapPoses[name];
    }),
    vertical: verticalNames.map(function(name) {
      return nextSnapPoses[name];
    })
  };
}
function calculateContainerPos(rootMatrix, containerRect, n) {
  var clientPos = calculatePosition(rootMatrix, [containerRect.clientLeft, containerRect.clientTop], n);
  return [
    containerRect.left + clientPos[0],
    containerRect.top + clientPos[1]
  ];
}
function solveLineConstants(_a) {
  var _b = __read(_a, 2), point1 = _b[0], point2 = _b[1];
  var dx = point2[0] - point1[0];
  var dy = point2[1] - point1[1];
  if (Math.abs(dx) < TINY_NUM) {
    dx = 0;
  }
  if (Math.abs(dy) < TINY_NUM) {
    dy = 0;
  }
  var a = 0;
  var b = 0;
  var c = 0;
  if (!dx) {
    a = -1;
    c = point1[0];
  } else if (!dy) {
    b = 1;
    c = -point1[1];
  } else {
    a = -dy / dx;
    b = 1;
    c = a * point1[0] - point1[1];
  }
  return [a, b, c].map(function(v) {
    return throttle(v, TINY_NUM);
  });
}
function checkMoveableSnapPoses(moveable, posesX, posesY, dirXs, dirYs, customSnapThreshold) {
  if (dirXs === void 0) {
    dirXs = [];
  }
  if (dirYs === void 0) {
    dirYs = [];
  }
  var props = moveable.props;
  var snapThreshold = selectValue(customSnapThreshold, props.snapThreshold, 5);
  return checkSnapPoses(moveable.state.guidelines, posesX, posesY, dirXs, dirYs, snapThreshold);
}
function checkSnapPoses(guidelines, posesX, posesY, dirXs, dirYs, snapThreshold) {
  return {
    vertical: checkSnap(guidelines, "vertical", posesX, snapThreshold, dirXs),
    horizontal: checkSnap(guidelines, "horizontal", posesY, snapThreshold, dirYs)
  };
}
function checkSnapKeepRatio(moveable, startPos, endPos) {
  var _a = __read(endPos, 2), endX = _a[0], endY = _a[1];
  var _b = __read(startPos, 2), startX = _b[0], startY = _b[1];
  var _c = __read(minus(endPos, startPos), 2), dx = _c[0], dy = _c[1];
  var isBottom = dy > 0;
  var isRight = dx > 0;
  dx = getTinyDist(dx);
  dy = getTinyDist(dy);
  var verticalInfo = {
    isSnap: false,
    offset: 0,
    pos: 0
  };
  var horizontalInfo = {
    isSnap: false,
    offset: 0,
    pos: 0
  };
  if (dx === 0 && dy === 0) {
    return {
      vertical: verticalInfo,
      horizontal: horizontalInfo
    };
  }
  var _d = checkMoveableSnapPoses(moveable, dx ? [endX] : [], dy ? [endY] : []), verticalSnapInfo = _d.vertical, horizontalSnapInfo = _d.horizontal;
  verticalSnapInfo.posInfos.filter(function(_a2) {
    var pos = _a2.pos;
    return isRight ? pos >= startX : pos <= startX;
  });
  horizontalSnapInfo.posInfos.filter(function(_a2) {
    var pos = _a2.pos;
    return isBottom ? pos >= startY : pos <= startY;
  });
  verticalSnapInfo.isSnap = verticalSnapInfo.posInfos.length > 0;
  horizontalSnapInfo.isSnap = horizontalSnapInfo.posInfos.length > 0;
  var _e = getNearestSnapGuidelineInfo(verticalSnapInfo), isVerticalSnap = _e.isSnap, verticalGuideline = _e.guideline;
  var _f = getNearestSnapGuidelineInfo(horizontalSnapInfo), isHorizontalSnap = _f.isSnap, horizontalGuideline = _f.guideline;
  var horizontalPos = isHorizontalSnap ? horizontalGuideline.pos[1] : 0;
  var verticalPos = isVerticalSnap ? verticalGuideline.pos[0] : 0;
  if (dx === 0) {
    if (isHorizontalSnap) {
      horizontalInfo.isSnap = true;
      horizontalInfo.pos = horizontalGuideline.pos[1];
      horizontalInfo.offset = endY - horizontalInfo.pos;
    }
  } else if (dy === 0) {
    if (isVerticalSnap) {
      verticalInfo.isSnap = true;
      verticalInfo.pos = verticalPos;
      verticalInfo.offset = endX - verticalPos;
    }
  } else {
    var a = dy / dx;
    var b = endPos[1] - a * endX;
    var y = 0;
    var x = 0;
    var isSnap = false;
    if (isVerticalSnap) {
      x = verticalPos;
      y = a * x + b;
      isSnap = true;
    } else if (isHorizontalSnap) {
      y = horizontalPos;
      x = (y - b) / a;
      isSnap = true;
    }
    if (isSnap) {
      verticalInfo.isSnap = true;
      verticalInfo.pos = x;
      verticalInfo.offset = endX - x;
      horizontalInfo.isSnap = true;
      horizontalInfo.pos = y;
      horizontalInfo.offset = endY - y;
    }
  }
  return {
    vertical: verticalInfo,
    horizontal: horizontalInfo
  };
}
function getStringDirection(dir) {
  var stringDirection = "";
  if (dir === -1 || dir === "top" || dir === "left") {
    stringDirection = "start";
  } else if (dir === 0 || dir === "center" || dir === "middle") {
    stringDirection = "center";
  } else if (dir === 1 || dir === "right" || dir === "bottom") {
    stringDirection = "end";
  }
  return stringDirection;
}
function checkSnaps(moveable, rect, customSnapThreshold) {
  var poses = splitSnapDirectionPoses(moveable.props.snapDirections, rect);
  var result = checkMoveableSnapPoses(moveable, poses.vertical, poses.horizontal, poses.verticalNames.map(function(name) {
    return getStringDirection(name);
  }), poses.horizontalNames.map(function(name) {
    return getStringDirection(name);
  }), customSnapThreshold);
  var horizontalDirection = getStringDirection(poses.horizontalNames[result.horizontal.index]);
  var verticalDirection = getStringDirection(poses.verticalNames[result.vertical.index]);
  return {
    vertical: __assign6(__assign6({}, result.vertical), { direction: verticalDirection }),
    horizontal: __assign6(__assign6({}, result.horizontal), { direction: horizontalDirection })
  };
}
function getNearestSnapGuidelineInfo(snapInfo) {
  var isSnap = snapInfo.isSnap;
  if (!isSnap) {
    return {
      isSnap: false,
      offset: 0,
      dist: -1,
      pos: 0,
      guideline: null
    };
  }
  var posInfo = snapInfo.posInfos[0];
  var guidelineInfo = posInfo.guidelineInfos[0];
  var offset = guidelineInfo.offset;
  var dist = guidelineInfo.dist;
  var guideline = guidelineInfo.guideline;
  return {
    isSnap,
    offset,
    dist,
    pos: posInfo.pos,
    guideline
  };
}
function checkSnap(guidelines, targetType, targetPoses, snapThreshold, dirs) {
  var _a, _b;
  if (dirs === void 0) {
    dirs = [];
  }
  if (!guidelines || !guidelines.length) {
    return {
      isSnap: false,
      index: -1,
      direction: "",
      posInfos: []
    };
  }
  var isVertical = targetType === "vertical";
  var posType = isVertical ? 0 : 1;
  var snapPosInfos = targetPoses.map(function(targetPos, index) {
    var direction = dirs[index] || "";
    var guidelineInfos = guidelines.map(function(guideline) {
      var pos = guideline.pos;
      var offset = targetPos - pos[posType];
      return {
        offset,
        dist: abs(offset),
        guideline,
        direction
      };
    }).filter(function(_a2) {
      var guideline = _a2.guideline, dist = _a2.dist;
      var type = guideline.type;
      if (type !== targetType || dist > snapThreshold) {
        return false;
      }
      return true;
    }).sort(function(a, b) {
      return a.dist - b.dist;
    });
    return {
      pos: targetPos,
      index,
      guidelineInfos,
      direction
    };
  }).filter(function(snapPosInfo) {
    return snapPosInfo.guidelineInfos.length > 0;
  }).sort(function(a, b) {
    return a.guidelineInfos[0].dist - b.guidelineInfos[0].dist;
  });
  var isSnap = snapPosInfos.length > 0;
  return {
    isSnap,
    index: isSnap ? snapPosInfos[0].index : -1,
    direction: (_b = (_a = snapPosInfos[0]) === null || _a === void 0 ? void 0 : _a.direction) !== null && _b !== void 0 ? _b : "",
    posInfos: snapPosInfos
  };
}
function getSnapInfosByDirection(moveable, poses, snapDirection, snapThreshold) {
  if (snapThreshold === void 0) {
    snapThreshold = 1;
  }
  var dirs = [];
  if (snapDirection[0] && snapDirection[1]) {
    dirs = [
      snapDirection,
      [-snapDirection[0], snapDirection[1]],
      [snapDirection[0], -snapDirection[1]]
    ];
  } else if (!snapDirection[0] && !snapDirection[1]) {
    [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1]
    ].forEach(function(dir, i, arr) {
      var nextDir = arr[i + 1] || arr[0];
      dirs.push(dir);
      dirs.push([
        (dir[0] + nextDir[0]) / 2,
        (dir[1] + nextDir[1]) / 2
      ]);
    });
  } else {
    if (moveable.props.keepRatio) {
      dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1], snapDirection);
    } else {
      dirs.push.apply(dirs, __spreadArray([], __read(getPosesByDirection([
        [-1, -1],
        [1, -1],
        [-1, -1],
        [1, 1]
      ], snapDirection)), false));
      if (dirs.length > 1) {
        dirs.push([
          (dirs[0][0] + dirs[1][0]) / 2,
          (dirs[0][1] + dirs[1][1]) / 2
        ]);
      }
    }
  }
  var nextPoses = dirs.map(function(dir) {
    return getPosByDirection(poses, dir);
  });
  var xs = nextPoses.map(function(pos) {
    return pos[0];
  });
  var ys = nextPoses.map(function(pos) {
    return pos[1];
  });
  var result = checkMoveableSnapPoses(moveable, xs, ys, dirs.map(function(dir) {
    return getStringDirection(dir[0]);
  }), dirs.map(function(dir) {
    return getStringDirection(dir[1]);
  }), snapThreshold);
  var verticalDirection = getStringDirection(dirs.map(function(dir) {
    return dir[0];
  })[result.vertical.index]);
  var horizontalDirection = getStringDirection(dirs.map(function(dir) {
    return dir[1];
  })[result.horizontal.index]);
  return {
    vertical: __assign6(__assign6({}, result.vertical), { direction: verticalDirection }),
    horizontal: __assign6(__assign6({}, result.horizontal), { direction: horizontalDirection })
  };
}
function checkSnapBoundPriority(a, b) {
  var aDist = abs(a.offset);
  var bDist = abs(b.offset);
  if (a.isBound && b.isBound) {
    return bDist - aDist;
  } else if (a.isBound) {
    return -1;
  } else if (b.isBound) {
    return 1;
  } else if (a.isSnap && b.isSnap) {
    return bDist - aDist;
  } else if (a.isSnap) {
    return -1;
  } else if (b.isSnap) {
    return 1;
  } else if (aDist < TINY_NUM2) {
    return 1;
  } else if (bDist < TINY_NUM2) {
    return -1;
  }
  return aDist - bDist;
}
function getNearOffsetInfo(offsets, index) {
  return offsets.slice().sort(function(a, b) {
    var aSign = a.sign[index];
    var bSign = b.sign[index];
    var aOffset = a.offset[index];
    var bOffset = b.offset[index];
    if (!aSign) {
      return 1;
    } else if (!bSign) {
      return -1;
    }
    return checkSnapBoundPriority({ isBound: a.isBound, isSnap: a.isSnap, offset: aOffset }, { isBound: b.isBound, isSnap: b.isSnap, offset: bOffset });
  })[0];
}
function getCheckSnapDirections(direction, fixedDirection, keepRatio) {
  var directions = [];
  if (keepRatio) {
    if (abs(fixedDirection[0]) !== 1 || abs(fixedDirection[1]) !== 1) {
      directions.push([fixedDirection, [-1, -1]], [fixedDirection, [-1, 1]], [fixedDirection, [1, -1]], [fixedDirection, [1, 1]]);
    } else {
      directions.push([fixedDirection, [direction[0], -direction[1]]], [fixedDirection, [-direction[0], direction[1]]]);
    }
    directions.push([fixedDirection, direction]);
  } else {
    if (direction[0] && direction[1] || !direction[0] && !direction[1]) {
      var endDirection_1 = direction[0] ? direction : [1, 1];
      [1, -1].forEach(function(signX) {
        [1, -1].forEach(function(signY) {
          var nextDirection = [signX * endDirection_1[0], signY * endDirection_1[1]];
          if (fixedDirection[0] === nextDirection[0] && fixedDirection[1] === nextDirection[1]) {
            return;
          }
          directions.push([fixedDirection, nextDirection]);
        });
      });
    } else if (direction[0]) {
      var signs = abs(fixedDirection[0]) === 1 ? [1] : [1, -1];
      signs.forEach(function(sign2) {
        directions.push([
          [fixedDirection[0], -1],
          [sign2 * direction[0], -1]
        ], [
          [fixedDirection[0], 0],
          [sign2 * direction[0], 0]
        ], [
          [fixedDirection[0], 1],
          [sign2 * direction[0], 1]
        ]);
      });
    } else if (direction[1]) {
      var signs = abs(fixedDirection[1]) === 1 ? [1] : [1, -1];
      signs.forEach(function(sign2) {
        directions.push([
          [-1, fixedDirection[1]],
          [-1, sign2 * direction[1]]
        ], [
          [0, fixedDirection[1]],
          [0, sign2 * direction[1]]
        ], [
          [1, fixedDirection[1]],
          [1, sign2 * direction[1]]
        ]);
      });
    }
  }
  return directions;
}
function isStartLine(dot2, line) {
  var cx = average([line[0][0], line[1][0]]);
  var cy = average([line[0][1], line[1][1]]);
  return {
    vertical: cx <= dot2[0],
    horizontal: cy <= dot2[1]
  };
}
function hitTestLine(dot2, _a) {
  var _b = __read(_a, 2), pos1 = _b[0], pos2 = _b[1];
  var dx = pos2[0] - pos1[0];
  var dy = pos2[1] - pos1[1];
  if (abs(dx) < TINY_NUM2) {
    dx = 0;
  }
  if (abs(dy) < TINY_NUM2) {
    dy = 0;
  }
  var test1;
  var test2;
  if (!dx) {
    test1 = pos1[0];
    test2 = dot2[0];
  } else if (!dy) {
    test1 = pos1[1];
    test2 = dot2[1];
  } else {
    var a = dy / dx;
    test1 = a * (dot2[0] - pos1[0]) + pos1[1];
    test2 = dot2[1];
  }
  return test1 - test2;
}
function isSameStartLine(dots, line, centerSign, error) {
  if (error === void 0) {
    error = TINY_NUM2;
  }
  return dots.every(function(dot2) {
    var value = hitTestLine(dot2, line);
    var sign2 = value <= 0;
    return sign2 === centerSign || abs(value) <= error;
  });
}
function checkInnerBoundDot(pos, start, end, isStart, threshold) {
  if (threshold === void 0) {
    threshold = 0;
  }
  if (isStart && start - threshold <= pos || !isStart && pos <= end + threshold) {
    return {
      isBound: true,
      offset: isStart ? start - pos : end - pos
    };
  }
  return {
    isBound: false,
    offset: 0
  };
}
function checkInnerBound(moveable, _a) {
  var line = _a.line, centerSign = _a.centerSign, verticalSign = _a.verticalSign, horizontalSign = _a.horizontalSign, lineConstants = _a.lineConstants;
  var bounds = moveable.props.innerBounds;
  if (!bounds) {
    return {
      isAllBound: false,
      isBound: false,
      isVerticalBound: false,
      isHorizontalBound: false,
      offset: [0, 0]
    };
  }
  var left = bounds.left, top = bounds.top, width = bounds.width, height = bounds.height;
  var leftLine = [[left, top], [left, top + height]];
  var topLine = [[left, top], [left + width, top]];
  var rightLine = [[left + width, top], [left + width, top + height]];
  var bottomLine = [[left, top + height], [left + width, top + height]];
  if (isSameStartLine([
    [left, top],
    [left + width, top],
    [left, top + height],
    [left + width, top + height]
  ], line, centerSign)) {
    return {
      isAllBound: false,
      isBound: false,
      isVerticalBound: false,
      isHorizontalBound: false,
      offset: [0, 0]
    };
  }
  var topBoundInfo = checkLineBoundCollision(line, lineConstants, topLine, verticalSign);
  var bottomBoundInfo = checkLineBoundCollision(line, lineConstants, bottomLine, verticalSign);
  var leftBoundInfo = checkLineBoundCollision(line, lineConstants, leftLine, horizontalSign);
  var rightBoundInfo = checkLineBoundCollision(line, lineConstants, rightLine, horizontalSign);
  var isAllVerticalBound = topBoundInfo.isBound && bottomBoundInfo.isBound;
  var isVerticalBound = topBoundInfo.isBound || bottomBoundInfo.isBound;
  var isAllHorizontalBound = leftBoundInfo.isBound && rightBoundInfo.isBound;
  var isHorizontalBound = leftBoundInfo.isBound || rightBoundInfo.isBound;
  var verticalOffset = maxOffset(topBoundInfo.offset, bottomBoundInfo.offset);
  var horizontalOffset = maxOffset(leftBoundInfo.offset, rightBoundInfo.offset);
  var offset = [0, 0];
  var isBound = false;
  var isAllBound = false;
  if (abs(horizontalOffset) < abs(verticalOffset)) {
    offset = [verticalOffset, 0];
    isBound = isVerticalBound;
    isAllBound = isAllVerticalBound;
  } else {
    offset = [0, horizontalOffset];
    isBound = isHorizontalBound;
    isAllBound = isAllHorizontalBound;
  }
  return {
    isAllBound,
    isVerticalBound,
    isHorizontalBound,
    isBound,
    offset
  };
}
function checkLineBoundCollision(line, _a, boundLine, isStart, threshold, isRender) {
  var _b = __read(_a, 2), a = _b[0], b = _b[1];
  var dot1 = line[0];
  var boundDot1 = boundLine[0];
  var boundDot2 = boundLine[1];
  var dy2 = getTinyDist(boundDot2[1] - boundDot1[1]);
  var dx2 = getTinyDist(boundDot2[0] - boundDot1[0]);
  var hasDx = b;
  var hasDy = a;
  var slope = -a / b;
  if (!dx2) {
    if (isRender && !hasDy) {
      return {
        isBound: false,
        offset: 0
      };
    } else if (hasDx) {
      var y = slope * (boundDot1[0] - dot1[0]) + dot1[1];
      return checkInnerBoundDot(y, boundDot1[1], boundDot2[1], isStart, threshold);
    } else {
      var offset = boundDot1[0] - dot1[0];
      var isBound = abs(offset) <= (threshold || 0);
      return {
        isBound,
        offset: isBound ? offset : 0
      };
    }
  } else if (!dy2) {
    if (isRender && !hasDx) {
      return {
        isBound: false,
        offset: 0
      };
    } else if (hasDy) {
      var x = (boundDot1[1] - dot1[1]) / slope + dot1[0];
      return checkInnerBoundDot(x, boundDot1[0], boundDot2[0], isStart, threshold);
    } else {
      var offset = boundDot1[1] - dot1[1];
      var isBound = abs(offset) <= (threshold || 0);
      return {
        isBound,
        offset: isBound ? offset : 0
      };
    }
  }
  return {
    isBound: false,
    offset: 0
  };
}
function getInnerBoundInfo(moveable, lineInfos, datas) {
  return lineInfos.map(function(info) {
    var _a = checkInnerBound(moveable, info), isBound = _a.isBound, offset = _a.offset, isVerticalBound = _a.isVerticalBound, isHorizontalBound = _a.isHorizontalBound;
    var multiple = info.multiple;
    var sizeOffset = getDragDist({
      datas,
      distX: offset[0],
      distY: offset[1]
    }).map(function(size, i) {
      return size * (multiple[i] ? 2 / multiple[i] : 0);
    });
    return {
      sign: multiple,
      isBound,
      isVerticalBound,
      isHorizontalBound,
      isSnap: false,
      offset: sizeOffset
    };
  });
}
function getInnerBoundDragInfo(moveable, poses, datas) {
  var _a;
  var lines = getCheckInnerBoundLineInfos(moveable, poses, [0, 0], false).map(function(info) {
    return __assign6(__assign6({}, info), { multiple: info.multiple.map(function(dir) {
      return abs(dir) * 2;
    }) });
  });
  var innerBoundInfo = getInnerBoundInfo(moveable, lines, datas);
  var widthOffsetInfo = getNearOffsetInfo(innerBoundInfo, 0);
  var heightOffsetInfo = getNearOffsetInfo(innerBoundInfo, 1);
  var verticalOffset = 0;
  var horizontalOffset = 0;
  var isVerticalBound = widthOffsetInfo.isVerticalBound || heightOffsetInfo.isVerticalBound;
  var isHorizontalBound = widthOffsetInfo.isHorizontalBound || heightOffsetInfo.isHorizontalBound;
  if (isVerticalBound || isHorizontalBound) {
    _a = __read(getInverseDragDist({
      datas,
      distX: -widthOffsetInfo.offset[0],
      distY: -heightOffsetInfo.offset[1]
    }), 2), verticalOffset = _a[0], horizontalOffset = _a[1];
  }
  return {
    vertical: {
      isBound: isVerticalBound,
      offset: verticalOffset
    },
    horizontal: {
      isBound: isHorizontalBound,
      offset: horizontalOffset
    }
  };
}
function getCheckSnapLineDirections(direction, keepRatio) {
  var lineDirections = [];
  var x = direction[0];
  var y = direction[1];
  if (x && y) {
    lineDirections.push([[0, y * 2], direction, [-x, y]], [[x * 2, 0], direction, [x, -y]]);
  } else if (x) {
    lineDirections.push([[x * 2, 0], [x, 1], [x, -1]]);
    if (keepRatio) {
      lineDirections.push([[0, -1], [x, -1], [-x, -1]], [[0, 1], [x, 1], [-x, 1]]);
    }
  } else if (y) {
    lineDirections.push([[0, y * 2], [1, y], [-1, y]]);
    if (keepRatio) {
      lineDirections.push([[-1, 0], [-1, y], [-1, -y]], [[1, 0], [1, y], [1, -y]]);
    }
  } else {
    lineDirections.push([[-1, 0], [-1, -1], [-1, 1]], [[1, 0], [1, -1], [1, 1]], [[0, -1], [-1, -1], [1, -1]], [[0, 1], [-1, 1], [1, 1]]);
  }
  return lineDirections;
}
function getCheckInnerBoundLineInfos(moveable, poses, direction, keepRatio) {
  var _a = moveable.state, allMatrix = _a.allMatrix, is3d = _a.is3d;
  var virtualPoses = calculatePoses(allMatrix, 100, 100, is3d ? 4 : 3);
  var center = getPosByDirection(virtualPoses, [0, 0]);
  return getCheckSnapLineDirections(direction, keepRatio).map(function(_a2) {
    var _b = __read(_a2, 3), multiple = _b[0], dir1 = _b[1], dir2 = _b[2];
    var virtualLine = [
      getPosByDirection(virtualPoses, dir1),
      getPosByDirection(virtualPoses, dir2)
    ];
    var lineConstants = solveLineConstants(virtualLine);
    var _c = isStartLine(center, virtualLine), verticalSign = _c.vertical, horizontalSign = _c.horizontal;
    var centerSign = hitTestLine(center, virtualLine) <= 0;
    return {
      multiple,
      centerSign,
      verticalSign,
      horizontalSign,
      lineConstants,
      line: [
        getPosByDirection(poses, dir1),
        getPosByDirection(poses, dir2)
      ]
    };
  });
}
function isBoundRotate(relativePoses, boundDots, center, rad) {
  var nextPoses = rad ? relativePoses.map(function(pos) {
    return rotate(pos, rad);
  }) : relativePoses;
  return [
    [nextPoses[0], nextPoses[1]],
    [nextPoses[1], nextPoses[3]],
    [nextPoses[3], nextPoses[2]],
    [nextPoses[2], nextPoses[0]]
  ].some(function(line) {
    var centerSign = hitTestLine(center, line) <= 0;
    return !isSameStartLine(boundDots, line, centerSign);
  });
}
function getDistPointLine(_a) {
  var _b = __read(_a, 2), pos1 = _b[0], pos2 = _b[1];
  var dx = pos2[0] - pos1[0];
  var dy = pos2[1] - pos1[1];
  if (!dx) {
    return abs(pos1[0]);
  }
  if (!dy) {
    return abs(pos1[1]);
  }
  var a = dy / dx;
  return abs((-a * pos1[0] + pos1[1]) / Math.sqrt(Math.pow(a, 2) + 1));
}
function solveReverseLine(_a) {
  var _b = __read(_a, 2), pos1 = _b[0], pos2 = _b[1];
  var dx = pos2[0] - pos1[0];
  var dy = pos2[1] - pos1[1];
  if (!dx) {
    return [pos1[0], 0];
  }
  if (!dy) {
    return [0, pos1[1]];
  }
  var a = dy / dx;
  var b = -a * pos1[0] + pos1[1];
  return [
    -b / (a + 1 / a),
    b / (a * a + 1)
  ];
}
function checkRotateInnerBounds(moveable, prevPoses, nextPoses, origin, rotation) {
  var bounds = moveable.props.innerBounds;
  var rad = rotation * Math.PI / 180;
  if (!bounds) {
    return [];
  }
  var left = bounds.left, top = bounds.top, width = bounds.width, height = bounds.height;
  var relativeLeft = left - origin[0];
  var relativeRight = left + width - origin[0];
  var relativeTop = top - origin[1];
  var relativeBottom = top + height - origin[1];
  var dots = [
    [relativeLeft, relativeTop],
    [relativeRight, relativeTop],
    [relativeLeft, relativeBottom],
    [relativeRight, relativeBottom]
  ];
  var center = getPosByDirection(nextPoses, [0, 0]);
  if (!isBoundRotate(nextPoses, dots, center, 0)) {
    return [];
  }
  var result = [];
  var dotInfos = dots.map(function(dot2) {
    return [
      getDistSize(dot2),
      getRad([0, 0], dot2)
    ];
  });
  [
    [nextPoses[0], nextPoses[1]],
    [nextPoses[1], nextPoses[3]],
    [nextPoses[3], nextPoses[2]],
    [nextPoses[2], nextPoses[0]]
  ].forEach(function(line) {
    var lineRad = getRad([0, 0], solveReverseLine(line));
    var lineDist = getDistPointLine(line);
    result.push.apply(result, __spreadArray([], __read(dotInfos.filter(function(_a) {
      var _b = __read(_a, 1), dotDist = _b[0];
      return dotDist && lineDist <= dotDist;
    }).map(function(_a) {
      var _b = __read(_a, 2), dotDist = _b[0], dotRad = _b[1];
      var distRad = Math.acos(dotDist ? lineDist / dotDist : 0);
      var nextRad1 = dotRad + distRad;
      var nextRad2 = dotRad - distRad;
      return [
        rad + nextRad1 - lineRad,
        rad + nextRad2 - lineRad
      ];
    }).reduce(function(prev, cur) {
      prev.push.apply(prev, __spreadArray([], __read(cur), false));
      return prev;
    }, []).filter(function(nextRad) {
      return !isBoundRotate(prevPoses, dots, center, nextRad);
    }).map(function(nextRad) {
      return throttle(nextRad * 180 / Math.PI, TINY_NUM2);
    })), false));
  });
  return result;
}
function checkInnerBoundPoses(moveable) {
  var innerBounds = moveable.props.innerBounds;
  var boundMap = getInitialBounds();
  if (!innerBounds) {
    return {
      boundMap,
      vertical: [],
      horizontal: []
    };
  }
  var _a = moveable.getRect(), pos1 = _a.pos1, pos2 = _a.pos2, pos3 = _a.pos3, pos4 = _a.pos4;
  var poses = [pos1, pos2, pos3, pos4];
  var center = getPosByDirection(poses, [0, 0]);
  var left = innerBounds.left, top = innerBounds.top, width = innerBounds.width, height = innerBounds.height;
  var leftLine = [[left, top], [left, top + height]];
  var topLine = [[left, top], [left + width, top]];
  var rightLine = [[left + width, top], [left + width, top + height]];
  var bottomLine = [[left, top + height], [left + width, top + height]];
  var lineInfos = getCheckInnerBoundLineInfos(moveable, poses, [0, 0], false);
  var horizontalPoses = [];
  var verticalPoses = [];
  lineInfos.forEach(function(lineInfo) {
    var line = lineInfo.line, lineConstants = lineInfo.lineConstants;
    var _a2 = isStartLine(center, line), isHorizontalStart = _a2.horizontal, isVerticalStart = _a2.vertical;
    var topBoundInfo = checkLineBoundCollision(line, lineConstants, topLine, isVerticalStart, 1, true);
    var bottomBoundInfo = checkLineBoundCollision(line, lineConstants, bottomLine, isVerticalStart, 1, true);
    var leftBoundInfo = checkLineBoundCollision(line, lineConstants, leftLine, isHorizontalStart, 1, true);
    var rightBoundInfo = checkLineBoundCollision(line, lineConstants, rightLine, isHorizontalStart, 1, true);
    if (topBoundInfo.isBound && !boundMap.top) {
      horizontalPoses.push(top);
      boundMap.top = true;
    }
    if (bottomBoundInfo.isBound && !boundMap.bottom) {
      horizontalPoses.push(top + height);
      boundMap.bottom = true;
    }
    if (leftBoundInfo.isBound && !boundMap.left) {
      verticalPoses.push(left);
      boundMap.left = true;
    }
    if (rightBoundInfo.isBound && !boundMap.right) {
      verticalPoses.push(left + width);
      boundMap.right = true;
    }
  });
  return {
    boundMap,
    horizontal: horizontalPoses,
    vertical: verticalPoses
  };
}
function solveEquation(pos1, pos2, snapOffset, isVertical) {
  var dx = pos2[0] - pos1[0];
  var dy = pos2[1] - pos1[1];
  if (abs(dx) < TINY_NUM) {
    dx = 0;
  }
  if (abs(dy) < TINY_NUM) {
    dy = 0;
  }
  if (!dx) {
    if (!isVertical) {
      return [0, snapOffset];
    }
    return [0, 0];
  }
  if (!dy) {
    if (isVertical) {
      return [snapOffset, 0];
    }
    return [0, 0];
  }
  var a = dy / dx;
  var b = pos1[1] - a * pos1[0];
  if (isVertical) {
    var y = a * (pos2[0] + snapOffset) + b;
    return [snapOffset, y - pos2[1]];
  } else {
    var x = (pos2[1] + snapOffset - b) / a;
    return [x - pos2[0], snapOffset];
  }
}
function solveNextOffset(pos1, pos2, offset, isVertical, datas) {
  var sizeOffset = solveEquation(pos1, pos2, offset, isVertical);
  if (!sizeOffset) {
    return {
      isOutside: false,
      offset: [0, 0]
    };
  }
  var size = getDist(pos1, pos2);
  var dist1 = getDist(sizeOffset, pos1);
  var dist2 = getDist(sizeOffset, pos2);
  var isOutside = dist1 > size || dist2 > size;
  var _a = __read(getDragDist({
    datas,
    distX: sizeOffset[0],
    distY: sizeOffset[1]
  }), 2), widthOffset = _a[0], heightOffset = _a[1];
  return {
    offset: [widthOffset, heightOffset],
    isOutside
  };
}
function getSnapBound(boundInfo, snapInfo) {
  if (boundInfo.isBound) {
    return boundInfo.offset;
  } else if (snapInfo.isSnap) {
    return getNearestSnapGuidelineInfo(snapInfo).offset;
  }
  return 0;
}
function checkThrottleDragRotate(throttleDragRotate, _a, _b, _c, _d) {
  var _e = __read(_a, 2), distX = _e[0], distY = _e[1];
  var _f = __read(_b, 2), isVerticalBound = _f[0], isHorizontalBound = _f[1];
  var _g = __read(_c, 2), isVerticalSnap = _g[0], isHorizontalSnap = _g[1];
  var _h = __read(_d, 2), verticalOffset = _h[0], horizontalOffset = _h[1];
  var offsetX = -verticalOffset;
  var offsetY = -horizontalOffset;
  if (throttleDragRotate && distX && distY) {
    offsetX = 0;
    offsetY = 0;
    var adjustPoses = [];
    if (isVerticalBound && isHorizontalBound) {
      adjustPoses.push([0, horizontalOffset], [verticalOffset, 0]);
    } else if (isVerticalBound) {
      adjustPoses.push([verticalOffset, 0]);
    } else if (isHorizontalBound) {
      adjustPoses.push([0, horizontalOffset]);
    } else if (isVerticalSnap && isHorizontalSnap) {
      adjustPoses.push([0, horizontalOffset], [verticalOffset, 0]);
    } else if (isVerticalSnap) {
      adjustPoses.push([verticalOffset, 0]);
    } else if (isHorizontalSnap) {
      adjustPoses.push([0, horizontalOffset]);
    }
    if (adjustPoses.length) {
      adjustPoses.sort(function(a, b) {
        return getDistSize(minus([distX, distY], a)) - getDistSize(minus([distX, distY], b));
      });
      var adjustPos = adjustPoses[0];
      if (adjustPos[0] && abs(distX) > TINY_NUM) {
        offsetX = -adjustPos[0];
        offsetY = distY * abs(distX + offsetX) / abs(distX) - distY;
      } else if (adjustPos[1] && abs(distY) > TINY_NUM) {
        var prevDistY = distY;
        offsetY = -adjustPos[1];
        offsetX = distX * abs(distY + offsetY) / abs(prevDistY) - distX;
      }
      if (throttleDragRotate && isHorizontalBound && isVerticalBound) {
        if (abs(offsetX) > TINY_NUM && abs(offsetX) < abs(verticalOffset)) {
          var scale = abs(verticalOffset) / abs(offsetX);
          offsetX *= scale;
          offsetY *= scale;
        } else if (abs(offsetY) > TINY_NUM && abs(offsetY) < abs(horizontalOffset)) {
          var scale = abs(horizontalOffset) / abs(offsetY);
          offsetX *= scale;
          offsetY *= scale;
        } else {
          offsetX = maxOffset(-verticalOffset, offsetX);
          offsetY = maxOffset(-horizontalOffset, offsetY);
        }
      }
    }
  } else {
    offsetX = distX || isVerticalBound ? -verticalOffset : 0;
    offsetY = distY || isHorizontalBound ? -horizontalOffset : 0;
  }
  return [offsetX, offsetY];
}
function checkSnapBoundsDrag(moveable, distX, distY, throttleDragRotate, ignoreSnap, datas) {
  if (!hasGuidelines(moveable, "draggable")) {
    return [
      {
        isSnap: false,
        isBound: false,
        offset: 0
      },
      {
        isSnap: false,
        isBound: false,
        offset: 0
      }
    ];
  }
  var poses = getAbsolutePoses(datas.absolutePoses, [distX, distY]);
  var _a = getRect(poses), left = _a.left, right = _a.right, top = _a.top, bottom = _a.bottom;
  var boundPoses = {
    horizontal: poses.map(function(pos) {
      return pos[1];
    }),
    vertical: poses.map(function(pos) {
      return pos[0];
    })
  };
  var snapDirections = getSnapDirections(moveable.props.snapDirections);
  var snapPoses = splitSnapDirectionPoses(snapDirections, {
    left,
    right,
    top,
    bottom,
    center: (left + right) / 2,
    middle: (top + bottom) / 2
  });
  var _b = checkMoveableSnapBounds(moveable, ignoreSnap, snapPoses, boundPoses), verticalSnapBoundInfo = _b.vertical, horizontalSnapBoundInfo = _b.horizontal;
  var _c = getInnerBoundDragInfo(moveable, poses, datas), verticalInnerBoundInfo = _c.vertical, horizontalInnerBoundInfo = _c.horizontal;
  var isVerticalSnap = verticalSnapBoundInfo.isSnap;
  var isHorizontalSnap = horizontalSnapBoundInfo.isSnap;
  var isVerticalBound = verticalSnapBoundInfo.isBound || verticalInnerBoundInfo.isBound;
  var isHorizontalBound = horizontalSnapBoundInfo.isBound || horizontalInnerBoundInfo.isBound;
  var verticalOffset = maxOffset(verticalSnapBoundInfo.offset, verticalInnerBoundInfo.offset);
  var horizontalOffset = maxOffset(horizontalSnapBoundInfo.offset, horizontalInnerBoundInfo.offset);
  var _d = __read(checkThrottleDragRotate(throttleDragRotate, [distX, distY], [isVerticalBound, isHorizontalBound], [isVerticalSnap, isHorizontalSnap], [verticalOffset, horizontalOffset]), 2), offsetX = _d[0], offsetY = _d[1];
  return [
    {
      isBound: isVerticalBound,
      isSnap: isVerticalSnap,
      offset: offsetX
    },
    {
      isBound: isHorizontalBound,
      isSnap: isHorizontalSnap,
      offset: offsetY
    }
  ];
}
function checkMoveableSnapBounds(moveable, ignoreSnap, poses, boundPoses) {
  if (boundPoses === void 0) {
    boundPoses = poses;
  }
  var _a = checkBoundPoses(getBounds(moveable), boundPoses.vertical, boundPoses.horizontal), horizontalBoundInfos = _a.horizontal, verticalBoundInfos = _a.vertical;
  var _b = ignoreSnap ? {
    horizontal: { isSnap: false, index: -1 },
    vertical: { isSnap: false, index: -1 }
  } : checkMoveableSnapPoses(moveable, poses.vertical, poses.horizontal), horizontalSnapInfo = _b.horizontal, verticalSnapInfo = _b.vertical;
  var horizontalOffset = getSnapBound(horizontalBoundInfos[0], horizontalSnapInfo);
  var verticalOffset = getSnapBound(verticalBoundInfos[0], verticalSnapInfo);
  var horizontalDist = abs(horizontalOffset);
  var verticalDist = abs(verticalOffset);
  return {
    horizontal: {
      isBound: horizontalBoundInfos[0].isBound,
      isSnap: horizontalSnapInfo.isSnap,
      snapIndex: horizontalSnapInfo.index,
      offset: horizontalOffset,
      dist: horizontalDist,
      bounds: horizontalBoundInfos,
      snap: horizontalSnapInfo
    },
    vertical: {
      isBound: verticalBoundInfos[0].isBound,
      isSnap: verticalSnapInfo.isSnap,
      snapIndex: verticalSnapInfo.index,
      offset: verticalOffset,
      dist: verticalDist,
      bounds: verticalBoundInfos,
      snap: verticalSnapInfo
    }
  };
}
function checkSnapBounds(guideines, bounds, posesX, posesY, snapThreshold) {
  var _a = checkBoundPoses(bounds, posesX, posesY), horizontalBoundInfos = _a.horizontal, verticalBoundInfos = _a.vertical;
  var _b = checkSnapPoses(guideines, posesX, posesY, [], [], snapThreshold), horizontalSnapInfo = _b.horizontal, verticalSnapInfo = _b.vertical;
  var horizontalOffset = getSnapBound(horizontalBoundInfos[0], horizontalSnapInfo);
  var verticalOffset = getSnapBound(verticalBoundInfos[0], verticalSnapInfo);
  var horizontalDist = abs(horizontalOffset);
  var verticalDist = abs(verticalOffset);
  return {
    horizontal: {
      isBound: horizontalBoundInfos[0].isBound,
      isSnap: horizontalSnapInfo.isSnap,
      snapIndex: horizontalSnapInfo.index,
      offset: horizontalOffset,
      dist: horizontalDist,
      bounds: horizontalBoundInfos,
      snap: horizontalSnapInfo
    },
    vertical: {
      isBound: verticalBoundInfos[0].isBound,
      isSnap: verticalSnapInfo.isSnap,
      snapIndex: verticalSnapInfo.index,
      offset: verticalOffset,
      dist: verticalDist,
      bounds: verticalBoundInfos,
      snap: verticalSnapInfo
    }
  };
}
function checkSnapRightLine(startPos, endPos, snapBoundInfo, keepRatio) {
  var rad = getRad(startPos, endPos) / Math.PI * 180;
  var _a = snapBoundInfo.vertical, isVerticalBound = _a.isBound, isVerticalSnap = _a.isSnap, verticalDist = _a.dist, _b = snapBoundInfo.horizontal, isHorizontalBound = _b.isBound, isHorizontalSnap = _b.isSnap, horizontalDist = _b.dist;
  var rad180 = rad % 180;
  var isHorizontalLine = rad180 < 3 || rad180 > 177;
  var isVerticalLine = rad180 > 87 && rad180 < 93;
  if (horizontalDist < verticalDist) {
    if (isVerticalBound || isVerticalSnap && !isVerticalLine && (!keepRatio || !isHorizontalLine)) {
      return "vertical";
    }
  }
  if (isHorizontalBound || isHorizontalSnap && !isHorizontalLine && (!keepRatio || !isVerticalLine)) {
    return "horizontal";
  }
  return "";
}
function getSnapBoundInfo(moveable, poses, directions, keepRatio, isRequest, datas) {
  return directions.map(function(_a) {
    var _b = __read(_a, 2), startDirection = _b[0], endDirection = _b[1];
    var otherStartPos = getPosByDirection(poses, startDirection);
    var otherEndPos = getPosByDirection(poses, endDirection);
    var snapBoundInfo = keepRatio ? checkSnapBoundsKeepRatio(moveable, otherStartPos, otherEndPos, isRequest) : checkMoveableSnapBounds(moveable, isRequest, {
      vertical: [otherEndPos[0]],
      horizontal: [otherEndPos[1]]
    });
    var _c = snapBoundInfo.horizontal, otherHorizontalOffset = _c.offset, isOtherHorizontalBound = _c.isBound, isOtherHorizontalSnap = _c.isSnap, _d = snapBoundInfo.vertical, otherVerticalOffset = _d.offset, isOtherVerticalBound = _d.isBound, isOtherVerticalSnap = _d.isSnap;
    var multiple = minus(endDirection, startDirection);
    if (!otherVerticalOffset && !otherHorizontalOffset) {
      return {
        isBound: isOtherVerticalBound || isOtherHorizontalBound,
        isSnap: isOtherVerticalSnap || isOtherHorizontalSnap,
        sign: multiple,
        offset: [0, 0]
      };
    }
    var snapLine = checkSnapRightLine(otherStartPos, otherEndPos, snapBoundInfo, keepRatio);
    if (!snapLine) {
      return {
        sign: multiple,
        isBound: false,
        isSnap: false,
        offset: [0, 0]
      };
    }
    var isVertical = snapLine === "vertical";
    var sizeOffset = [0, 0];
    if (!keepRatio && abs(endDirection[0]) === 1 && abs(endDirection[1]) === 1 && startDirection[0] !== endDirection[0] && startDirection[1] !== endDirection[1]) {
      sizeOffset = getDragDist({
        datas,
        distX: -otherVerticalOffset,
        distY: -otherHorizontalOffset
      });
    } else {
      sizeOffset = solveNextOffset(otherStartPos, otherEndPos, -(isVertical ? otherVerticalOffset : otherHorizontalOffset), isVertical, datas).offset;
    }
    sizeOffset = sizeOffset.map(function(size, i) {
      return size * (multiple[i] ? 2 / multiple[i] : 0);
    });
    return {
      sign: multiple,
      isBound: isVertical ? isOtherVerticalBound : isOtherHorizontalBound,
      isSnap: isVertical ? isOtherVerticalSnap : isOtherHorizontalSnap,
      offset: sizeOffset
    };
  });
}
function getSnapBoundOffset(boundInfo, snapInfo) {
  if (boundInfo.isBound) {
    return boundInfo.offset;
  } else if (snapInfo.isSnap) {
    return snapInfo.offset;
  }
  return 0;
}
function checkSnapBoundsKeepRatio(moveable, startPos, endPos, isRequest) {
  var _a = checkBoundKeepRatio(moveable, startPos, endPos), horizontalBoundInfo = _a.horizontal, verticalBoundInfo = _a.vertical;
  var _b = isRequest ? {
    horizontal: { isSnap: false },
    vertical: { isSnap: false }
  } : checkSnapKeepRatio(moveable, startPos, endPos), horizontalSnapInfo = _b.horizontal, verticalSnapInfo = _b.vertical;
  var horizontalOffset = getSnapBoundOffset(horizontalBoundInfo, horizontalSnapInfo);
  var verticalOffset = getSnapBoundOffset(verticalBoundInfo, verticalSnapInfo);
  var horizontalDist = abs(horizontalOffset);
  var verticalDist = abs(verticalOffset);
  return {
    horizontal: {
      isBound: horizontalBoundInfo.isBound,
      isSnap: horizontalSnapInfo.isSnap,
      offset: horizontalOffset,
      dist: horizontalDist
    },
    vertical: {
      isBound: verticalBoundInfo.isBound,
      isSnap: verticalSnapInfo.isSnap,
      offset: verticalOffset,
      dist: verticalDist
    }
  };
}
function checkMaxBounds(moveable, poses, direction, fixedPosition, datas) {
  var fixedDirection = [-direction[0], -direction[1]];
  var _a = moveable.state, width = _a.width, height = _a.height;
  var bounds = moveable.props.bounds;
  var maxWidth = Infinity;
  var maxHeight = Infinity;
  if (bounds) {
    var directions = [
      [direction[0], -direction[1]],
      [-direction[0], direction[1]]
    ];
    var _b = bounds.left, left_1 = _b === void 0 ? -Infinity : _b, _c = bounds.top, top_1 = _c === void 0 ? -Infinity : _c, _d = bounds.right, right_1 = _d === void 0 ? Infinity : _d, _e = bounds.bottom, bottom_1 = _e === void 0 ? Infinity : _e;
    directions.forEach(function(otherDirection) {
      var isCheckVertical = otherDirection[0] !== fixedDirection[0];
      var isCheckHorizontal = otherDirection[1] !== fixedDirection[1];
      var otherPos = getPosByDirection(poses, otherDirection);
      var deg = getRad(fixedPosition, otherPos) * 360 / Math.PI;
      if (isCheckHorizontal) {
        var nextOtherPos = otherPos.slice();
        if (abs(deg - 360) < 2 || abs(deg - 180) < 2) {
          nextOtherPos[1] = fixedPosition[1];
        }
        var _a2 = solveNextOffset(fixedPosition, nextOtherPos, (fixedPosition[1] < otherPos[1] ? bottom_1 : top_1) - otherPos[1], false, datas), _b2 = __read(_a2.offset, 2), heightOffset = _b2[1], isHeightOutside = _a2.isOutside;
        if (!isNaN(heightOffset)) {
          maxHeight = height + (isHeightOutside ? 1 : -1) * abs(heightOffset);
        }
      }
      if (isCheckVertical) {
        var nextOtherPos = otherPos.slice();
        if (abs(deg - 90) < 2 || abs(deg - 270) < 2) {
          nextOtherPos[0] = fixedPosition[0];
        }
        var _c2 = solveNextOffset(fixedPosition, nextOtherPos, (fixedPosition[0] < otherPos[0] ? right_1 : left_1) - otherPos[0], true, datas), _d2 = __read(_c2.offset, 1), widthOffset = _d2[0], isWidthOutside = _c2.isOutside;
        if (!isNaN(widthOffset)) {
          maxWidth = width + (isWidthOutside ? 1 : -1) * abs(widthOffset);
        }
      }
    });
  }
  return {
    maxWidth,
    maxHeight
  };
}
var Draggable = {
  name: "draggable",
  props: [
    "draggable",
    "throttleDrag",
    "throttleDragRotate",
    "hideThrottleDragRotateLine",
    "startDragRotate",
    "edgeDraggable"
  ],
  events: [
    "dragStart",
    "drag",
    "dragEnd",
    "dragGroupStart",
    "dragGroup",
    "dragGroupEnd"
  ],
  requestStyle: function() {
    return ["left", "top", "right", "bottom"];
  },
  requestChildStyle: function() {
    return ["left", "top", "right", "bottom"];
  },
  render: function(moveable, React3) {
    var _a = moveable.props, hideThrottleDragRotateLine = _a.hideThrottleDragRotateLine, throttleDragRotate = _a.throttleDragRotate, zoom = _a.zoom;
    var _b = moveable.getState(), dragInfo = _b.dragInfo, beforeOrigin = _b.beforeOrigin;
    if (hideThrottleDragRotateLine || !throttleDragRotate || !dragInfo) {
      return [];
    }
    var dist = dragInfo.dist;
    if (!dist[0] && !dist[1]) {
      return [];
    }
    var width = getDistSize(dist);
    var rad = getRad(dist, [0, 0]);
    return [React3.createElement("div", { className: prefix("line", "horizontal", "dragline", "dashed"), key: "dragRotateGuideline", style: {
      width: "".concat(width, "px"),
      transform: "translate(".concat(beforeOrigin[0], "px, ").concat(beforeOrigin[1], "px) rotate(").concat(rad, "rad) scaleY(").concat(zoom, ")")
    } })];
  },
  dragStart: function(moveable, e) {
    var datas = e.datas, parentEvent = e.parentEvent, parentGesto = e.parentGesto;
    var state = moveable.state;
    var gestos = state.gestos, style = state.style;
    if (gestos.draggable) {
      return false;
    }
    gestos.draggable = parentGesto || moveable.targetGesto;
    datas.datas = {};
    datas.left = parseFloat(style.left || "") || 0;
    datas.top = parseFloat(style.top || "") || 0;
    datas.bottom = parseFloat(style.bottom || "") || 0;
    datas.right = parseFloat(style.right || "") || 0;
    datas.startValue = [0, 0];
    setDragStart(moveable, e);
    setDefaultTransformIndex(moveable, e, "translate");
    startCheckSnapDrag(moveable, datas);
    datas.prevDist = [0, 0];
    datas.prevBeforeDist = [0, 0];
    datas.isDrag = false;
    datas.deltaOffset = [0, 0];
    var params = fillParams(moveable, e, __assign6({ set: function(translate) {
      datas.startValue = translate;
    } }, fillTransformStartEvent(moveable, e)));
    var result = parentEvent || triggerEvent(moveable, "onDragStart", params);
    if (result !== false) {
      datas.isDrag = true;
      moveable.state.dragInfo = {
        startRect: moveable.getRect(),
        dist: [0, 0]
      };
    } else {
      gestos.draggable = null;
      datas.isPinch = false;
    }
    return datas.isDrag ? params : false;
  },
  drag: function(moveable, e) {
    if (!e) {
      return;
    }
    resolveTransformEvent(moveable, e, "translate");
    var datas = e.datas, parentEvent = e.parentEvent, parentFlag = e.parentFlag, isPinch = e.isPinch, deltaOffset = e.deltaOffset, useSnap = e.useSnap, isRequest = e.isRequest;
    var distX = e.distX, distY = e.distY;
    var isDrag = datas.isDrag, prevDist = datas.prevDist, prevBeforeDist = datas.prevBeforeDist, startValue = datas.startValue;
    if (!isDrag) {
      return;
    }
    if (deltaOffset) {
      distX += deltaOffset[0];
      distY += deltaOffset[1];
    }
    var props = moveable.props;
    var parentMoveable = props.parentMoveable;
    var throttleDrag = parentEvent ? 0 : props.throttleDrag || 0;
    var throttleDragRotate = parentEvent ? 0 : props.throttleDragRotate || 0;
    var dragRotateRad = 0;
    var isVerticalSnap = false;
    var isVerticalBound = false;
    var isHorizontalSnap = false;
    var isHorizontalBound = false;
    if (!parentEvent && throttleDragRotate > 0 && (distX || distY)) {
      var startDragRotate = props.startDragRotate || 0;
      var deg = throttle(startDragRotate + getRad([0, 0], [distX, distY]) * 180 / Math.PI, throttleDragRotate) - startDragRotate;
      var ry = distY * Math.abs(Math.cos((deg - 90) / 180 * Math.PI));
      var rx = distX * Math.abs(Math.cos(deg / 180 * Math.PI));
      var r = getDistSize([rx, ry]);
      dragRotateRad = deg * Math.PI / 180;
      distX = r * Math.cos(dragRotateRad);
      distY = r * Math.sin(dragRotateRad);
    }
    if (!isPinch && !parentEvent && !parentFlag) {
      var _a = __read(checkSnapBoundsDrag(moveable, distX, distY, throttleDragRotate, !useSnap && isRequest || deltaOffset, datas), 2), verticalInfo = _a[0], horizontalInfo = _a[1];
      isVerticalSnap = verticalInfo.isSnap;
      isVerticalBound = verticalInfo.isBound;
      isHorizontalSnap = horizontalInfo.isSnap;
      isHorizontalBound = horizontalInfo.isBound;
      var verticalOffset = verticalInfo.offset;
      var horizontalOffset = horizontalInfo.offset;
      distX += verticalOffset;
      distY += horizontalOffset;
    }
    var beforeTranslate = plus(getBeforeDragDist({ datas, distX, distY }), startValue);
    var translate = plus(getTransformDist({ datas, distX, distY }), startValue);
    throttleArray(translate, TINY_NUM2);
    throttleArray(beforeTranslate, TINY_NUM2);
    if (!throttleDragRotate) {
      if (!isVerticalSnap && !isVerticalBound) {
        translate[0] = throttle(translate[0], throttleDrag);
        beforeTranslate[0] = throttle(beforeTranslate[0], throttleDrag);
      }
      if (!isHorizontalSnap && !isHorizontalBound) {
        translate[1] = throttle(translate[1], throttleDrag);
        beforeTranslate[1] = throttle(beforeTranslate[1], throttleDrag);
      }
    }
    var beforeDist = minus(beforeTranslate, startValue);
    var dist = minus(translate, startValue);
    var delta = minus(dist, prevDist);
    var beforeDelta = minus(beforeDist, prevBeforeDist);
    datas.prevDist = dist;
    datas.prevBeforeDist = beforeDist;
    datas.passDelta = delta;
    datas.passDist = dist;
    var left = datas.left + beforeDist[0];
    var top = datas.top + beforeDist[1];
    var right = datas.right - beforeDist[0];
    var bottom = datas.bottom - beforeDist[1];
    var nextTransform = convertTransformFormat(datas, "translate(".concat(translate[0], "px, ").concat(translate[1], "px)"), "translate(".concat(dist[0], "px, ").concat(dist[1], "px)"));
    fillOriginalTransform(e, nextTransform);
    moveable.state.dragInfo.dist = parentEvent ? [0, 0] : dist;
    if (!parentEvent && !parentMoveable && delta.every(function(num) {
      return !num;
    }) && beforeDelta.some(function(num) {
      return !num;
    })) {
      return;
    }
    var _b = moveable.state, width = _b.width, height = _b.height;
    var params = fillParams(moveable, e, __assign6({ transform: nextTransform, dist, delta, translate, beforeDist, beforeDelta, beforeTranslate, left, top, right, bottom, width, height, isPinch }, fillCSSObject({
      transform: nextTransform
    }, e)));
    !parentEvent && triggerEvent(moveable, "onDrag", params);
    return params;
  },
  dragAfter: function(moveable, e) {
    var datas = e.datas;
    var deltaOffset = datas.deltaOffset;
    if (deltaOffset[0] || deltaOffset[1]) {
      datas.deltaOffset = [0, 0];
      return this.drag(moveable, __assign6(__assign6({}, e), { deltaOffset }));
    }
    return false;
  },
  dragEnd: function(moveable, e) {
    var parentEvent = e.parentEvent, datas = e.datas;
    moveable.state.dragInfo = null;
    if (!datas.isDrag) {
      return;
    }
    datas.isDrag = false;
    var param = fillEndParams(moveable, e, {});
    !parentEvent && triggerEvent(moveable, "onDragEnd", param);
    return param;
  },
  dragGroupStart: function(moveable, e) {
    var datas = e.datas, clientX = e.clientX, clientY = e.clientY;
    var params = this.dragStart(moveable, e);
    if (!params) {
      return false;
    }
    var events = triggerChildGesto(moveable, this, "dragStart", [
      clientX || 0,
      clientY || 0
    ], e, false, "draggable");
    var nextParams = __assign6(__assign6({}, params), { targets: moveable.props.targets, events });
    var result = triggerEvent(moveable, "onDragGroupStart", nextParams);
    datas.isDrag = result !== false;
    return datas.isDrag ? params : false;
  },
  dragGroup: function(moveable, e) {
    var datas = e.datas;
    if (!datas.isDrag) {
      return;
    }
    var params = this.drag(moveable, e);
    var passDelta = e.datas.passDelta;
    var events = triggerChildGesto(moveable, this, "drag", passDelta, e, false, "draggable");
    if (!params) {
      return;
    }
    var nextParams = __assign6({ targets: moveable.props.targets, events }, params);
    triggerEvent(moveable, "onDragGroup", nextParams);
    return nextParams;
  },
  dragGroupEnd: function(moveable, e) {
    var isDrag = e.isDrag, datas = e.datas;
    if (!datas.isDrag) {
      return;
    }
    this.dragEnd(moveable, e);
    var events = triggerChildGesto(moveable, this, "dragEnd", [0, 0], e, false, "draggable");
    triggerEvent(moveable, "onDragGroupEnd", fillEndParams(moveable, e, {
      targets: moveable.props.targets,
      events
    }));
    return isDrag;
  },
  /**
       * @method Moveable.Draggable#request
       * @param {object} [e] - the draggable's request parameter
       * @param {number} [e.x] - x position
       * @param {number} [e.y] - y position
       * @param {number} [e.deltaX] - X number to move
       * @param {number} [e.deltaY] - Y number to move
       * @return {Moveable.Requester} Moveable Requester
       * @example
  
       * // Instantly Request (requestStart - request - requestEnd)
       * // Use Relative Value
       * moveable.request("draggable", { deltaX: 10, deltaY: 10 }, true);
       * // Use Absolute Value
       * moveable.request("draggable", { x: 200, y: 100 }, true);
       *
       * // requestStart
       * const requester = moveable.request("draggable");
       *
       * // request
       * // Use Relative Value
       * requester.request({ deltaX: 10, deltaY: 10 });
       * requester.request({ deltaX: 10, deltaY: 10 });
       * requester.request({ deltaX: 10, deltaY: 10 });
       * // Use Absolute Value
       * moveable.request("draggable", { x: 200, y: 100 });
       * moveable.request("draggable", { x: 220, y: 100 });
       * moveable.request("draggable", { x: 240, y: 100 });
       *
       * // requestEnd
       * requester.requestEnd();
       */
  request: function(moveable) {
    var datas = {};
    var rect = moveable.getRect();
    var distX = 0;
    var distY = 0;
    var useSnap = false;
    return {
      isControl: false,
      requestStart: function(e) {
        useSnap = e.useSnap;
        return { datas, useSnap };
      },
      request: function(e) {
        if ("x" in e) {
          distX = e.x - rect.left;
        } else if ("deltaX" in e) {
          distX += e.deltaX;
        }
        if ("y" in e) {
          distY = e.y - rect.top;
        } else if ("deltaY" in e) {
          distY += e.deltaY;
        }
        return { datas, distX, distY, useSnap };
      },
      requestEnd: function() {
        return { datas, isDrag: true, useSnap };
      }
    };
  },
  unset: function(moveable) {
    moveable.state.gestos.draggable = null;
    moveable.state.dragInfo = null;
  }
};
function getFixedDirectionInfo(startPositions, fixedDirection) {
  var fixedPosition = getPosByDirection(startPositions, fixedDirection);
  var fixedOffset = [0, 0];
  return {
    fixedPosition,
    fixedDirection,
    fixedOffset
  };
}
function getOffsetFixedDirectionInfo(state, fixedDirection) {
  var allMatrix = state.allMatrix, is3d = state.is3d, width = state.width, height = state.height;
  var n = is3d ? 4 : 3;
  var nextFixedOffset = [
    width / 2 * (1 + fixedDirection[0]),
    height / 2 * (1 + fixedDirection[1])
  ];
  var fixedPosition = calculatePosition(allMatrix, nextFixedOffset, n);
  var fixedOffset = [0, 0];
  return {
    fixedPosition,
    fixedDirection,
    fixedOffset
  };
}
function getOffsetFixedPositionInfo(state, offsetFixedPosition) {
  var allMatrix = state.allMatrix, is3d = state.is3d, width = state.width, height = state.height;
  var n = is3d ? 4 : 3;
  var fixedDirection = getDirectionByPos(offsetFixedPosition, width, height);
  var nextFixedPosition = calculatePosition(allMatrix, offsetFixedPosition, n);
  var fixedOffset = [
    width ? 0 : offsetFixedPosition[0],
    height ? 0 : offsetFixedPosition[1]
  ];
  return {
    fixedPosition: nextFixedPosition,
    fixedDirection,
    fixedOffset
  };
}
var directionCondition$2 = getDirectionCondition("resizable");
var Resizable = {
  name: "resizable",
  ableGroup: "size",
  canPinch: true,
  props: [
    "resizable",
    "throttleResize",
    "renderDirections",
    "displayAroundControls",
    "keepRatio",
    "resizeFormat",
    "keepRatioFinally",
    "edge",
    "checkResizableError"
  ],
  events: [
    "resizeStart",
    "beforeResize",
    "resize",
    "resizeEnd",
    "resizeGroupStart",
    "beforeResizeGroup",
    "resizeGroup",
    "resizeGroupEnd"
  ],
  render: getRenderDirections("resizable"),
  dragControlCondition: directionCondition$2,
  viewClassName: getDirectionViewClassName("resizable"),
  dragControlStart: function(moveable, e) {
    var _a;
    var inputEvent = e.inputEvent, isPinch = e.isPinch, isGroup = e.isGroup, parentDirection = e.parentDirection, parentGesto = e.parentGesto, datas = e.datas, parentFixedDirection = e.parentFixedDirection, parentEvent = e.parentEvent;
    var direction = getTotalDirection(parentDirection, isPinch, inputEvent, datas);
    var state = moveable.state;
    var target = state.target, width = state.width, height = state.height, gestos = state.gestos;
    if (!direction || !target) {
      return false;
    }
    if (gestos.resizable) {
      return false;
    }
    gestos.resizable = parentGesto || moveable.controlGesto;
    !isPinch && setDragStart(moveable, e);
    datas.datas = {};
    datas.direction = direction;
    datas.startOffsetWidth = width;
    datas.startOffsetHeight = height;
    datas.prevWidth = 0;
    datas.prevHeight = 0;
    datas.minSize = [0, 0];
    datas.startWidth = state.inlineCSSWidth || state.cssWidth;
    datas.startHeight = state.inlineCSSHeight || state.cssHeight;
    datas.maxSize = [Infinity, Infinity];
    if (!isGroup) {
      datas.minSize = [
        state.minOffsetWidth,
        state.minOffsetHeight
      ];
      datas.maxSize = [
        state.maxOffsetWidth,
        state.maxOffsetHeight
      ];
    }
    var transformOrigin = moveable.props.transformOrigin || "% %";
    datas.transformOrigin = transformOrigin && isString(transformOrigin) ? transformOrigin.split(" ") : transformOrigin;
    datas.startOffsetMatrix = state.offsetMatrix;
    datas.startTransformOrigin = state.transformOrigin;
    datas.isWidth = (_a = e === null || e === void 0 ? void 0 : e.parentIsWidth) !== null && _a !== void 0 ? _a : !direction[0] && !direction[1] || direction[0] || !direction[1];
    function setRatio(ratio) {
      datas.ratio = ratio && isFinite(ratio) ? ratio : 0;
    }
    datas.startPositions = getAbsolutePosesByState(moveable.state);
    function setFixedDirection(fixedDirection) {
      var result2 = getFixedDirectionInfo(datas.startPositions, fixedDirection);
      datas.fixedDirection = result2.fixedDirection;
      datas.fixedPosition = result2.fixedPosition;
      datas.fixedOffset = result2.fixedOffset;
    }
    function setFixedPosition(fixedPosition) {
      var result2 = getOffsetFixedPositionInfo(moveable.state, fixedPosition);
      datas.fixedDirection = result2.fixedDirection;
      datas.fixedPosition = result2.fixedPosition;
      datas.fixedOffset = result2.fixedOffset;
    }
    function setMin(minSize) {
      datas.minSize = [
        convertUnitSize("".concat(minSize[0]), 0) || 0,
        convertUnitSize("".concat(minSize[1]), 0) || 0
      ];
    }
    function setMax(maxSize) {
      var nextMaxSize = [
        maxSize[0] || Infinity,
        maxSize[1] || Infinity
      ];
      if (!isNumber(nextMaxSize[0]) || isFinite(nextMaxSize[0])) {
        nextMaxSize[0] = convertUnitSize("".concat(nextMaxSize[0]), 0) || Infinity;
      }
      if (!isNumber(nextMaxSize[1]) || isFinite(nextMaxSize[1])) {
        nextMaxSize[1] = convertUnitSize("".concat(nextMaxSize[1]), 0) || Infinity;
      }
      datas.maxSize = nextMaxSize;
    }
    setRatio(width / height);
    setFixedDirection(parentFixedDirection || [-direction[0], -direction[1]]);
    datas.setFixedDirection = setFixedDirection;
    datas.setFixedPosition = setFixedPosition;
    datas.setMin = setMin;
    datas.setMax = setMax;
    var params = fillParams(moveable, e, {
      direction,
      startRatio: datas.ratio,
      set: function(_a2) {
        var _b = __read(_a2, 2), startWidth = _b[0], startHeight = _b[1];
        datas.startWidth = startWidth;
        datas.startHeight = startHeight;
      },
      setMin,
      setMax,
      setRatio,
      setFixedDirection,
      setFixedPosition,
      setOrigin: function(origin) {
        datas.transformOrigin = origin;
      },
      dragStart: Draggable.dragStart(moveable, new CustomGesto().dragStart([0, 0], e))
    });
    var result = parentEvent || triggerEvent(moveable, "onResizeStart", params);
    datas.startFixedDirection = datas.fixedDirection;
    datas.startFixedPosition = datas.fixedPosition;
    if (result !== false) {
      datas.isResize = true;
      moveable.state.snapRenderInfo = {
        request: e.isRequest,
        direction
      };
    }
    return datas.isResize ? params : false;
  },
  dragControl: function(moveable, e) {
    var _a;
    var datas = e.datas, parentFlag = e.parentFlag, isPinch = e.isPinch, parentKeepRatio = e.parentKeepRatio, dragClient = e.dragClient, parentDist = e.parentDist, useSnap = e.useSnap, isRequest = e.isRequest, isGroup = e.isGroup, parentEvent = e.parentEvent, resolveMatrix = e.resolveMatrix;
    var isResize = datas.isResize, transformOrigin = datas.transformOrigin, startWidth = datas.startWidth, startHeight = datas.startHeight, prevWidth = datas.prevWidth, prevHeight = datas.prevHeight, minSize = datas.minSize, maxSize = datas.maxSize, ratio = datas.ratio, startOffsetWidth = datas.startOffsetWidth, startOffsetHeight = datas.startOffsetHeight, isWidth = datas.isWidth;
    if (!isResize) {
      return;
    }
    if (resolveMatrix) {
      var is3d = moveable.state.is3d;
      var startOffsetMatrix = datas.startOffsetMatrix, startTransformOrigin = datas.startTransformOrigin;
      var n = is3d ? 4 : 3;
      var targetMatrix = parseMat(getNextTransforms(e));
      var targetN = Math.sqrt(targetMatrix.length);
      if (n !== targetN) {
        targetMatrix = convertDimension(targetMatrix, targetN, n);
      }
      var nextAllMatrix = getNextMatrix(startOffsetMatrix, targetMatrix, startTransformOrigin, n);
      var poses = calculatePoses(nextAllMatrix, startOffsetWidth, startOffsetHeight, n);
      datas.startPositions = poses;
      datas.nextTargetMatrix = targetMatrix;
      datas.nextAllMatrix = nextAllMatrix;
    }
    var props = getProps(moveable.props, "resizable");
    var resizeFormat = props.resizeFormat, _b = props.throttleResize, throttleResize = _b === void 0 ? parentFlag ? 0 : 1 : _b, parentMoveable = props.parentMoveable, keepRatioFinally = props.keepRatioFinally;
    var direction = datas.direction;
    var sizeDirection = direction;
    var distWidth = 0;
    var distHeight = 0;
    if (!direction[0] && !direction[1]) {
      sizeDirection = [1, 1];
    }
    var keepRatio = ratio && (parentKeepRatio != null ? parentKeepRatio : props.keepRatio) || false;
    function getNextBoundingSize() {
      var fixedDirection = datas.fixedDirection;
      var nextSize = getOffsetSizeDist(sizeDirection, keepRatio, datas, e);
      distWidth = nextSize.distWidth;
      distHeight = nextSize.distHeight;
      var nextWidth2 = sizeDirection[0] - fixedDirection[0] || keepRatio ? Math.max(startOffsetWidth + distWidth, TINY_NUM2) : startOffsetWidth;
      var nextHeight2 = sizeDirection[1] - fixedDirection[1] || keepRatio ? Math.max(startOffsetHeight + distHeight, TINY_NUM2) : startOffsetHeight;
      if (keepRatio && startOffsetWidth && startOffsetHeight) {
        if (isWidth) {
          nextHeight2 = nextWidth2 / ratio;
        } else {
          nextWidth2 = nextHeight2 * ratio;
        }
      }
      return [nextWidth2, nextHeight2];
    }
    var _c = __read(getNextBoundingSize(), 2), boundingWidth = _c[0], boundingHeight = _c[1];
    if (!parentEvent) {
      datas.setFixedDirection(datas.fixedDirection);
      triggerEvent(moveable, "onBeforeResize", fillParams(moveable, e, {
        startFixedDirection: datas.startFixedDirection,
        startFixedPosition: datas.startFixedPosition,
        setFixedDirection: function(nextFixedDirection) {
          var _a2;
          datas.setFixedDirection(nextFixedDirection);
          _a2 = __read(getNextBoundingSize(), 2), boundingWidth = _a2[0], boundingHeight = _a2[1];
          return [boundingWidth, boundingHeight];
        },
        setFixedPosition: function(nextFixedPosition) {
          var _a2;
          datas.setFixedPosition(nextFixedPosition);
          _a2 = __read(getNextBoundingSize(), 2), boundingWidth = _a2[0], boundingHeight = _a2[1];
          return [boundingWidth, boundingHeight];
        },
        boundingWidth,
        boundingHeight,
        setSize: function(size) {
          var _a2;
          _a2 = __read(size, 2), boundingWidth = _a2[0], boundingHeight = _a2[1];
        }
      }, true));
    }
    var fixedPosition = dragClient;
    if (!dragClient) {
      if (!parentFlag && isPinch) {
        fixedPosition = getAbsolutePosition(moveable, [0, 0]);
      } else {
        fixedPosition = datas.fixedPosition;
      }
    }
    var snapDist = [0, 0];
    if (!isPinch) {
      snapDist = checkSnapResize(moveable, boundingWidth, boundingHeight, direction, fixedPosition, !useSnap && isRequest, datas);
    }
    if (parentDist) {
      !parentDist[0] && (snapDist[0] = 0);
      !parentDist[1] && (snapDist[1] = 0);
    }
    function computeSize() {
      var _a2;
      if (resizeFormat) {
        _a2 = __read(resizeFormat([boundingWidth, boundingHeight]), 2), boundingWidth = _a2[0], boundingHeight = _a2[1];
      }
      boundingWidth = throttle(boundingWidth, throttleResize);
      boundingHeight = throttle(boundingHeight, throttleResize);
    }
    if (keepRatio) {
      if (sizeDirection[0] && sizeDirection[1] && snapDist[0] && snapDist[1]) {
        if (abs(snapDist[0]) > abs(snapDist[1])) {
          snapDist[1] = 0;
        } else {
          snapDist[0] = 0;
        }
      }
      var isNoSnap = !snapDist[0] && !snapDist[1];
      if (isNoSnap) {
        computeSize();
      }
      if (sizeDirection[0] && !sizeDirection[1] || snapDist[0] && !snapDist[1] || isNoSnap && isWidth) {
        boundingWidth += snapDist[0];
        boundingHeight = boundingWidth / ratio;
      } else if (!sizeDirection[0] && sizeDirection[1] || !snapDist[0] && snapDist[1] || isNoSnap && !isWidth) {
        boundingHeight += snapDist[1];
        boundingWidth = boundingHeight * ratio;
      }
    } else {
      boundingWidth += snapDist[0];
      boundingHeight += snapDist[1];
      boundingWidth = Math.max(0, boundingWidth);
      boundingHeight = Math.max(0, boundingHeight);
    }
    _a = __read(calculateBoundSize([boundingWidth, boundingHeight], minSize, maxSize, keepRatio ? ratio : false), 2), boundingWidth = _a[0], boundingHeight = _a[1];
    computeSize();
    if (keepRatio && (isGroup || keepRatioFinally)) {
      if (isWidth) {
        boundingHeight = boundingWidth / ratio;
      } else {
        boundingWidth = boundingHeight * ratio;
      }
    }
    distWidth = boundingWidth - startOffsetWidth;
    distHeight = boundingHeight - startOffsetHeight;
    var delta = [distWidth - prevWidth, distHeight - prevHeight];
    datas.prevWidth = distWidth;
    datas.prevHeight = distHeight;
    var inverseDelta = getResizeDist(moveable, boundingWidth, boundingHeight, fixedPosition, transformOrigin, datas);
    if (!parentMoveable && delta.every(function(num) {
      return !num;
    }) && inverseDelta.every(function(num) {
      return !num;
    })) {
      return;
    }
    var drag = Draggable.drag(moveable, setCustomDrag(e, moveable.state, inverseDelta, !!isPinch, false, "draggable"));
    var transform = drag.transform;
    var nextWidth = startWidth + distWidth;
    var nextHeight = startHeight + distHeight;
    var params = fillParams(moveable, e, __assign6({ width: nextWidth, height: nextHeight, offsetWidth: Math.round(boundingWidth), offsetHeight: Math.round(boundingHeight), startRatio: ratio, boundingWidth, boundingHeight, direction, dist: [distWidth, distHeight], delta, isPinch: !!isPinch, drag }, fillAfterTransform({
      style: {
        width: "".concat(nextWidth, "px"),
        height: "".concat(nextHeight, "px")
      },
      transform
    }, drag, e)));
    !parentEvent && triggerEvent(moveable, "onResize", params);
    return params;
  },
  dragControlAfter: function(moveable, e) {
    var datas = e.datas;
    var isResize = datas.isResize, startOffsetWidth = datas.startOffsetWidth, startOffsetHeight = datas.startOffsetHeight, prevWidth = datas.prevWidth, prevHeight = datas.prevHeight;
    if (!isResize || moveable.props.checkResizableError === false) {
      return;
    }
    var _a = moveable.state, width = _a.width, height = _a.height;
    var errorWidth = width - (startOffsetWidth + prevWidth);
    var errorHeight = height - (startOffsetHeight + prevHeight);
    var isErrorWidth = abs(errorWidth) > 3;
    var isErrorHeight = abs(errorHeight) > 3;
    if (isErrorWidth) {
      datas.startWidth += errorWidth;
      datas.startOffsetWidth += errorWidth;
      datas.prevWidth += errorWidth;
    }
    if (isErrorHeight) {
      datas.startHeight += errorHeight;
      datas.startOffsetHeight += errorHeight;
      datas.prevHeight += errorHeight;
    }
    if (isErrorWidth || isErrorHeight) {
      return this.dragControl(moveable, e);
    }
  },
  dragControlEnd: function(moveable, e) {
    var datas = e.datas, parentEvent = e.parentEvent;
    if (!datas.isResize) {
      return;
    }
    datas.isResize = false;
    var params = fillEndParams(moveable, e, {});
    !parentEvent && triggerEvent(moveable, "onResizeEnd", params);
    return params;
  },
  dragGroupControlCondition: directionCondition$2,
  dragGroupControlStart: function(moveable, e) {
    var datas = e.datas;
    var params = this.dragControlStart(moveable, __assign6(__assign6({}, e), { isGroup: true }));
    if (!params) {
      return false;
    }
    var originalEvents = fillChildEvents(moveable, "resizable", e);
    var parentStartOffsetWidth = datas.startOffsetWidth, parentStartOffsetHeight = datas.startOffsetHeight;
    function updateGroupMin() {
      var originalMinSize = datas.minSize;
      originalEvents.forEach(function(ev) {
        var _a = ev.datas, childMinSize = _a.minSize, childStartOffsetWidth = _a.startOffsetWidth, childStartOffsetHeight = _a.startOffsetHeight;
        var parentMinWidth = parentStartOffsetWidth * (childStartOffsetWidth ? childMinSize[0] / childStartOffsetWidth : 0);
        var parentMinHeight = parentStartOffsetHeight * (childStartOffsetHeight ? childMinSize[1] / childStartOffsetHeight : 0);
        originalMinSize[0] = Math.max(originalMinSize[0], parentMinWidth);
        originalMinSize[1] = Math.max(originalMinSize[1], parentMinHeight);
      });
    }
    function updateGroupMax() {
      var originalMaxSize = datas.maxSize;
      originalEvents.forEach(function(ev) {
        var _a = ev.datas, childMaxSize = _a.maxSize, childStartOffsetWidth = _a.startOffsetWidth, childStartOffsetHeight = _a.startOffsetHeight;
        var parentMaxWidth = parentStartOffsetWidth * (childStartOffsetWidth ? childMaxSize[0] / childStartOffsetWidth : 0);
        var parentMaxHeight = parentStartOffsetHeight * (childStartOffsetHeight ? childMaxSize[1] / childStartOffsetHeight : 0);
        originalMaxSize[0] = Math.min(originalMaxSize[0], parentMaxWidth);
        originalMaxSize[1] = Math.min(originalMaxSize[1], parentMaxHeight);
      });
    }
    var events = triggerChildAbles(moveable, this, "dragControlStart", e, function(child, ev) {
      return startChildDist(moveable, child, datas, ev);
    });
    updateGroupMin();
    updateGroupMax();
    var setFixedDirection = function(fixedDirection) {
      params.setFixedDirection(fixedDirection);
      events.forEach(function(ev, i) {
        ev.setFixedDirection(fixedDirection);
        startChildDist(moveable, ev.moveable, datas, originalEvents[i]);
      });
    };
    datas.setFixedDirection = setFixedDirection;
    var nextParams = __assign6(__assign6({}, params), { targets: moveable.props.targets, events: events.map(function(ev) {
      return __assign6(__assign6({}, ev), { setMin: function(minSize) {
        ev.setMin(minSize);
        updateGroupMin();
      }, setMax: function(maxSize) {
        ev.setMax(maxSize);
        updateGroupMax();
      } });
    }), setFixedDirection, setMin: function(minSize) {
      params.setMin(minSize);
      updateGroupMin();
    }, setMax: function(maxSize) {
      params.setMax(maxSize);
      updateGroupMax();
    } });
    var result = triggerEvent(moveable, "onResizeGroupStart", nextParams);
    datas.isResize = result !== false;
    return datas.isResize ? params : false;
  },
  dragGroupControl: function(moveable, e) {
    var datas = e.datas;
    if (!datas.isResize) {
      return;
    }
    var props = getProps(moveable.props, "resizable");
    catchEvent(moveable, "onBeforeResize", function(parentEvent) {
      triggerEvent(moveable, "onBeforeResizeGroup", fillParams(moveable, e, __assign6(__assign6({}, parentEvent), { targets: props.targets }), true));
    });
    var params = this.dragControl(moveable, __assign6(__assign6({}, e), { isGroup: true }));
    if (!params) {
      return;
    }
    var boundingWidth = params.boundingWidth, boundingHeight = params.boundingHeight, dist = params.dist;
    var keepRatio = props.keepRatio;
    var parentScale = [
      boundingWidth / (boundingWidth - dist[0]),
      boundingHeight / (boundingHeight - dist[1])
    ];
    var fixedPosition = datas.fixedPosition;
    var events = triggerChildAbles(moveable, this, "dragControl", e, function(_, ev) {
      var _a = __read(calculate(createRotateMatrix(moveable.rotation / 180 * Math.PI, 3), [
        ev.datas.originalX * parentScale[0],
        ev.datas.originalY * parentScale[1],
        1
      ], 3), 2), clientX = _a[0], clientY = _a[1];
      return __assign6(__assign6({}, ev), { parentDist: null, parentScale, dragClient: plus(fixedPosition, [clientX, clientY]), parentKeepRatio: keepRatio });
    });
    var nextParams = __assign6({ targets: props.targets, events }, params);
    triggerEvent(moveable, "onResizeGroup", nextParams);
    return nextParams;
  },
  dragGroupControlEnd: function(moveable, e) {
    var isDrag = e.isDrag, datas = e.datas;
    if (!datas.isResize) {
      return;
    }
    this.dragControlEnd(moveable, e);
    var events = triggerChildAbles(moveable, this, "dragControlEnd", e);
    var nextParams = fillEndParams(moveable, e, {
      targets: moveable.props.targets,
      events
    });
    triggerEvent(moveable, "onResizeGroupEnd", nextParams);
    return isDrag;
  },
  /**
       * @method Moveable.Resizable#request
       * @param {Moveable.Resizable.ResizableRequestParam} e - the Resizable's request parameter
       * @return {Moveable.Requester} Moveable Requester
       * @example
  
       * // Instantly Request (requestStart - request - requestEnd)
       * // Use Relative Value
       * moveable.request("resizable", { deltaWidth: 10, deltaHeight: 10 }, true);
       *
       * // Use Absolute Value
       * moveable.request("resizable", { offsetWidth: 100, offsetHeight: 100 }, true);
       *
       * // requestStart
       * const requester = moveable.request("resizable");
       *
       * // request
       * // Use Relative Value
       * requester.request({ deltaWidth: 10, deltaHeight: 10 });
       * requester.request({ deltaWidth: 10, deltaHeight: 10 });
       * requester.request({ deltaWidth: 10, deltaHeight: 10 });
       *
       * // Use Absolute Value
       * moveable.request("resizable", { offsetWidth: 100, offsetHeight: 100 });
       * moveable.request("resizable", { offsetWidth: 110, offsetHeight: 100 });
       * moveable.request("resizable", { offsetWidth: 120, offsetHeight: 100 });
       *
       * // requestEnd
       * requester.requestEnd();
       */
  request: function(moveable) {
    var datas = {};
    var distWidth = 0;
    var distHeight = 0;
    var useSnap = false;
    var rect = moveable.getRect();
    return {
      isControl: true,
      requestStart: function(e) {
        var _a;
        useSnap = e.useSnap;
        return {
          datas,
          parentDirection: e.direction || [1, 1],
          parentIsWidth: (_a = e === null || e === void 0 ? void 0 : e.horizontal) !== null && _a !== void 0 ? _a : true,
          useSnap
        };
      },
      request: function(e) {
        if ("offsetWidth" in e) {
          distWidth = e.offsetWidth - rect.offsetWidth;
        } else if ("deltaWidth" in e) {
          distWidth += e.deltaWidth;
        }
        if ("offsetHeight" in e) {
          distHeight = e.offsetHeight - rect.offsetHeight;
        } else if ("deltaHeight" in e) {
          distHeight += e.deltaHeight;
        }
        return {
          datas,
          parentDist: [distWidth, distHeight],
          parentKeepRatio: e.keepRatio,
          useSnap
        };
      },
      requestEnd: function() {
        return { datas, isDrag: true, useSnap };
      }
    };
  },
  unset: function(moveable) {
    moveable.state.gestos.resizable = null;
  }
};
function setRotateStartInfo(moveable, datas, clientX, clientY, rect) {
  var groupable = moveable.props.groupable;
  var state = moveable.state;
  var n = state.is3d ? 4 : 3;
  var origin = datas.origin;
  var nextOrigin = calculatePosition(
    moveable.state.rootMatrix,
    // TO-DO #710
    minus([origin[0], origin[1]], groupable ? [0, 0] : [state.left, state.top]),
    n
  );
  var startAbsoluteOrigin = plus([rect.left, rect.top], nextOrigin);
  datas.startAbsoluteOrigin = startAbsoluteOrigin;
  datas.prevDeg = getRad(startAbsoluteOrigin, [clientX, clientY]) / Math.PI * 180;
  datas.defaultDeg = datas.prevDeg;
  datas.prevSnapDeg = 0;
  datas.loop = 0;
  datas.startDist = getDist(startAbsoluteOrigin, [clientX, clientY]);
}
function getAbsoluteDist(deg, direction, datas) {
  var defaultDeg = datas.defaultDeg, prevDeg = datas.prevDeg;
  var normalizedPrevDeg = prevDeg % 360;
  var loop = Math.floor(prevDeg / 360);
  if (normalizedPrevDeg < 0) {
    normalizedPrevDeg += 360;
  }
  if (normalizedPrevDeg > deg && normalizedPrevDeg > 270 && deg < 90) {
    ++loop;
  } else if (normalizedPrevDeg < deg && normalizedPrevDeg < 90 && deg > 270) {
    --loop;
  }
  var dist = direction * (loop * 360 + deg - defaultDeg);
  datas.prevDeg = defaultDeg + dist;
  return dist;
}
function getAbsoluteDistByClient(clientX, clientY, direction, datas) {
  return getAbsoluteDist(getRad(datas.startAbsoluteOrigin, [clientX, clientY]) / Math.PI * 180, direction, datas);
}
function getRotateInfo(moveable, moveableRect, datas, dist, startValue, checkSnap2) {
  var _a = moveable.props.throttleRotate, throttleRotate = _a === void 0 ? 0 : _a;
  var prevSnapDeg = datas.prevSnapDeg;
  var snapRotation = 0;
  var isSnap = false;
  if (checkSnap2) {
    var result = checkSnapRotate(moveable, moveableRect, dist, startValue + dist);
    isSnap = result.isSnap;
    snapRotation = startValue + result.dist;
  }
  if (!isSnap) {
    snapRotation = throttle(startValue + dist, throttleRotate);
  }
  var snapDeg = snapRotation - startValue;
  datas.prevSnapDeg = snapDeg;
  return [snapDeg - prevSnapDeg, snapDeg, snapRotation];
}
function getRotationPositions(rotationPosition, _a, direction) {
  var _b = __read(_a, 4), pos1 = _b[0], pos2 = _b[1], pos3 = _b[2], pos4 = _b[3];
  if (rotationPosition === "none") {
    return [];
  }
  if (isArray(rotationPosition)) {
    return rotationPosition.map(function(child) {
      return getRotationPositions(child, [pos1, pos2, pos3, pos4], direction)[0];
    });
  }
  var _c = __read((rotationPosition || "top").split("-"), 2), dir1 = _c[0], dir2 = _c[1];
  var radPoses = [pos1, pos2];
  if (dir1 === "left") {
    radPoses = [pos3, pos1];
  } else if (dir1 === "right") {
    radPoses = [pos2, pos4];
  } else if (dir1 === "bottom") {
    radPoses = [pos4, pos3];
  }
  var pos = [
    (radPoses[0][0] + radPoses[1][0]) / 2,
    (radPoses[0][1] + radPoses[1][1]) / 2
  ];
  var rad = getRotationRad(radPoses, direction);
  if (dir2) {
    var isStart = dir2 === "top" || dir2 === "left";
    var isReverse = dir1 === "bottom" || dir1 === "left";
    pos = radPoses[isStart && !isReverse || !isStart && isReverse ? 0 : 1];
  }
  return [[pos, rad]];
}
function dragControlCondition(moveable, e) {
  if (e.isRequest) {
    return e.requestAble === "rotatable";
  }
  var target = e.inputEvent.target;
  if (hasClass(target, prefix("rotation-control")) || moveable.props.rotateAroundControls && hasClass(target, prefix("around-control")) || hasClass(target, prefix("control")) && hasClass(target, prefix("rotatable"))) {
    return true;
  }
  var rotationTarget = moveable.props.rotationTarget;
  if (rotationTarget) {
    return getRefTargets(rotationTarget, true).some(function(element) {
      if (!element) {
        return false;
      }
      return target === element || target.contains(element);
    });
  }
  return false;
}
var css = ".rotation {\nposition: absolute;\nheight: 40px;\nwidth: 1px;\ntransform-origin: 50% 100%;\nheight: calc(40px * var(--zoom));\ntop: auto;\nleft: 0;\nbottom: 100%;\nwill-change: transform;\n}\n.rotation .rotation-line {\ndisplay: block;\nwidth: 100%;\nheight: 100%;\ntransform-origin: 50% 50%;\n}\n.rotation .rotation-control {\nborder-color: #4af;\nborder-color: var(--moveable-color);\nbackground:#fff;\ncursor: alias;\n}\n:global .view-rotation-dragging, .rotatable.direction.control {\ncursor: alias;\n}\n.rotatable.direction.control.move {\ncursor: move;\n}\n";
var Rotatable = {
  name: "rotatable",
  canPinch: true,
  props: [
    "rotatable",
    "rotationPosition",
    "throttleRotate",
    "renderDirections",
    "rotationTarget",
    "rotateAroundControls",
    "edge",
    "resolveAblesWithRotatable",
    "displayAroundControls"
  ],
  events: [
    "rotateStart",
    "beforeRotate",
    "rotate",
    "rotateEnd",
    "rotateGroupStart",
    "beforeRotateGroup",
    "rotateGroup",
    "rotateGroupEnd"
  ],
  css: [css],
  viewClassName: function(moveable) {
    if (!moveable.isDragging("rotatable")) {
      return "";
    }
    return prefix("view-rotation-dragging");
  },
  render: function(moveable, React3) {
    var _a = getProps(moveable.props, "rotatable"), rotatable = _a.rotatable, rotationPosition = _a.rotationPosition, zoom = _a.zoom, renderDirections = _a.renderDirections, rotateAroundControls = _a.rotateAroundControls, resolveAblesWithRotatable = _a.resolveAblesWithRotatable;
    var _b = moveable.getState(), renderPoses = _b.renderPoses, direction = _b.direction;
    if (!rotatable) {
      return null;
    }
    var positions = getRotationPositions(rotationPosition, renderPoses, direction);
    var jsxs3 = [];
    positions.forEach(function(_a2, i) {
      var _b2 = __read(_a2, 2), pos = _b2[0], rad = _b2[1];
      jsxs3.push(React3.createElement(
        "div",
        { key: "rotation".concat(i), className: prefix("rotation"), style: {
          // tslint:disable-next-line: max-line-length
          transform: "translate(-50%) translate(".concat(pos[0], "px, ").concat(pos[1], "px) rotate(").concat(rad, "rad)")
        } },
        React3.createElement("div", { className: prefix("line rotation-line"), style: {
          transform: "scaleX(".concat(zoom, ")")
        } }),
        React3.createElement("div", { className: prefix("control rotation-control"), style: {
          transform: "translate(0.5px) scale(".concat(zoom, ")")
        } })
      ));
    });
    if (renderDirections) {
      var ables = getKeys(resolveAblesWithRotatable || {});
      var resolveMap_1 = {};
      ables.forEach(function(name) {
        resolveAblesWithRotatable[name].forEach(function(direction2) {
          resolveMap_1[direction2] = name;
        });
      });
      var directionControlInfos = [];
      if (isArray(renderDirections)) {
        directionControlInfos = renderDirections.map(function(dir) {
          var able = resolveMap_1[dir];
          return {
            data: able ? { resolve: able } : {},
            classNames: able ? ["move"] : [],
            dir
          };
        });
      }
      jsxs3.push.apply(jsxs3, __spreadArray([], __read(renderDirectionControlsByInfos(moveable, "rotatable", directionControlInfos, React3)), false));
    }
    if (rotateAroundControls) {
      jsxs3.push.apply(jsxs3, __spreadArray([], __read(renderAroundControls(moveable, React3)), false));
    }
    return jsxs3;
  },
  dragControlCondition,
  dragControlStart: function(moveable, e) {
    var _a;
    var _b;
    var datas = e.datas, clientX = e.clientX, clientY = e.clientY, parentRotate = e.parentRotate, parentFlag = e.parentFlag, isPinch = e.isPinch, isRequest = e.isRequest;
    var state = moveable.state;
    var target = state.target, left = state.left, top = state.top, direction = state.direction, beforeDirection = state.beforeDirection, targetTransform = state.targetTransform, moveableClientRect = state.moveableClientRect, offsetMatrix = state.offsetMatrix, targetMatrix = state.targetMatrix, allMatrix = state.allMatrix, width = state.width, height = state.height;
    if (!isRequest && !target) {
      return false;
    }
    var rect = moveable.getRect();
    datas.rect = rect;
    datas.transform = targetTransform;
    datas.left = left;
    datas.top = top;
    var setFixedPosition = function(fixedPosition) {
      var result2 = getOffsetFixedPositionInfo(moveable.state, fixedPosition);
      datas.fixedDirection = result2.fixedDirection;
      datas.fixedOffset = result2.fixedOffset;
      datas.fixedPosition = result2.fixedPosition;
      if (resizeStart) {
        resizeStart.setFixedPosition(fixedPosition);
      }
    };
    var setFixedDirection = function(fixedDirection) {
      var result2 = getOffsetFixedDirectionInfo(moveable.state, fixedDirection);
      datas.fixedDirection = result2.fixedDirection;
      datas.fixedOffset = result2.fixedOffset;
      datas.fixedPosition = result2.fixedPosition;
      if (resizeStart) {
        resizeStart.setFixedDirection(fixedDirection);
      }
    };
    var startClientX = clientX;
    var startClientY = clientY;
    if (isRequest || isPinch || parentFlag) {
      var externalRotate = parentRotate || 0;
      datas.beforeInfo = {
        origin: rect.beforeOrigin,
        prevDeg: externalRotate,
        defaultDeg: externalRotate,
        prevSnapDeg: 0,
        startDist: 0
      };
      datas.afterInfo = __assign6(__assign6({}, datas.beforeInfo), { origin: rect.origin });
      datas.absoluteInfo = __assign6(__assign6({}, datas.beforeInfo), { origin: rect.origin, startValue: externalRotate });
    } else {
      var inputTarget = (_b = e.inputEvent) === null || _b === void 0 ? void 0 : _b.target;
      if (inputTarget) {
        var regionDirection = inputTarget.getAttribute("data-direction") || "";
        var controlDirection = DIRECTION_REGION_TO_DIRECTION[regionDirection];
        if (controlDirection) {
          datas.isControl = true;
          datas.isAroundControl = hasClass(inputTarget, prefix("around-control"));
          datas.controlDirection = controlDirection;
          var resolve = inputTarget.getAttribute("data-resolve");
          if (resolve) {
            datas.resolveAble = resolve;
          }
          var clientPoses = calculateMoveableClientPositions(state.rootMatrix, state.renderPoses, moveableClientRect);
          _a = __read(getPosByDirection(clientPoses, controlDirection), 2), startClientX = _a[0], startClientY = _a[1];
        }
      }
      datas.beforeInfo = { origin: rect.beforeOrigin };
      datas.afterInfo = { origin: rect.origin };
      datas.absoluteInfo = {
        origin: rect.origin,
        startValue: rect.rotation
      };
      var originalFixedPosition_1 = setFixedPosition;
      setFixedPosition = function(fixedPosition) {
        var n = state.is3d ? 4 : 3;
        var _a2 = __read(plus(getOrigin(targetMatrix, n), fixedPosition), 2), originX = _a2[0], originY = _a2[1];
        var fixedBeforeOrigin = calculate(offsetMatrix, convertPositionMatrix([originX, originY], n));
        var fixedAfterOrigin = calculate(allMatrix, convertPositionMatrix([fixedPosition[0], fixedPosition[1]], n));
        originalFixedPosition_1(fixedPosition);
        var posDelta = state.posDelta;
        datas.beforeInfo.origin = minus(fixedBeforeOrigin, posDelta);
        datas.afterInfo.origin = minus(fixedAfterOrigin, posDelta);
        datas.absoluteInfo.origin = minus(fixedAfterOrigin, posDelta);
        setRotateStartInfo(moveable, datas.beforeInfo, startClientX, startClientY, moveableClientRect);
        setRotateStartInfo(moveable, datas.afterInfo, startClientX, startClientY, moveableClientRect);
        setRotateStartInfo(moveable, datas.absoluteInfo, startClientX, startClientY, moveableClientRect);
      };
      setFixedDirection = function(fixedDirection) {
        var fixedPosition = getPosByDirection([
          [0, 0],
          [width, 0],
          [0, height],
          [width, height]
        ], fixedDirection);
        setFixedPosition(fixedPosition);
      };
    }
    datas.startClientX = startClientX;
    datas.startClientY = startClientY;
    datas.direction = direction;
    datas.beforeDirection = beforeDirection;
    datas.startValue = 0;
    datas.datas = {};
    setDefaultTransformIndex(moveable, e, "rotate");
    var dragStart = false;
    var resizeStart = false;
    if (datas.isControl && datas.resolveAble) {
      var resolveAble = datas.resolveAble;
      if (resolveAble === "resizable") {
        resizeStart = Resizable.dragControlStart(moveable, __assign6(__assign6({}, new CustomGesto("resizable").dragStart([0, 0], e)), { parentPosition: datas.controlPosition, parentFixedPosition: datas.fixedPosition }));
      }
    }
    if (!resizeStart) {
      dragStart = Draggable.dragStart(moveable, new CustomGesto().dragStart([0, 0], e));
    }
    setFixedPosition(getTotalOrigin(moveable));
    var params = fillParams(moveable, e, __assign6(__assign6({ set: function(rotatation) {
      datas.startValue = rotatation * Math.PI / 180;
    }, setFixedDirection, setFixedPosition }, fillTransformStartEvent(moveable, e)), { dragStart, resizeStart }));
    var result = triggerEvent(moveable, "onRotateStart", params);
    datas.isRotate = result !== false;
    state.snapRenderInfo = {
      request: e.isRequest
    };
    return datas.isRotate ? params : false;
  },
  dragControl: function(moveable, e) {
    var _a, _b, _c;
    var datas = e.datas, clientDistX = e.clientDistX, clientDistY = e.clientDistY, parentRotate = e.parentRotate, parentFlag = e.parentFlag, isPinch = e.isPinch, groupDelta = e.groupDelta, resolveMatrix = e.resolveMatrix;
    var beforeDirection = datas.beforeDirection, beforeInfo = datas.beforeInfo, afterInfo = datas.afterInfo, absoluteInfo = datas.absoluteInfo, isRotate = datas.isRotate, startValue = datas.startValue, rect = datas.rect, startClientX = datas.startClientX, startClientY = datas.startClientY;
    if (!isRotate) {
      return;
    }
    resolveTransformEvent(moveable, e, "rotate");
    var targetDirection = getTransformDirection(e);
    var direction = beforeDirection * targetDirection;
    var parentMoveable = moveable.props.parentMoveable;
    var beforeDelta = 0;
    var beforeDist;
    var beforeRotation;
    var delta = 0;
    var dist;
    var rotation;
    var absoluteDelta = 0;
    var absoluteDist;
    var absoluteRotation;
    var startRotation = 180 / Math.PI * startValue;
    var absoluteStartRotation = absoluteInfo.startValue;
    var isSnap = false;
    var nextClientX = startClientX + clientDistX;
    var nextClientY = startClientY + clientDistY;
    if (!parentFlag && "parentDist" in e) {
      var parentDist = e.parentDist;
      beforeDist = parentDist;
      dist = parentDist;
      absoluteDist = parentDist;
    } else if (isPinch || parentFlag) {
      beforeDist = getAbsoluteDist(parentRotate, beforeDirection, beforeInfo);
      dist = getAbsoluteDist(parentRotate, direction, afterInfo);
      absoluteDist = getAbsoluteDist(parentRotate, direction, absoluteInfo);
    } else {
      beforeDist = getAbsoluteDistByClient(nextClientX, nextClientY, beforeDirection, beforeInfo);
      dist = getAbsoluteDistByClient(nextClientX, nextClientY, direction, afterInfo);
      absoluteDist = getAbsoluteDistByClient(nextClientX, nextClientY, direction, absoluteInfo);
      isSnap = true;
    }
    beforeRotation = startRotation + beforeDist;
    rotation = startRotation + dist;
    absoluteRotation = absoluteStartRotation + absoluteDist;
    triggerEvent(moveable, "onBeforeRotate", fillParams(moveable, e, {
      beforeRotation,
      rotation,
      absoluteRotation,
      setRotation: function(nextRotation) {
        dist = nextRotation - startRotation;
        beforeDist = dist;
        absoluteDist = dist;
      }
    }, true));
    _a = __read(getRotateInfo(moveable, rect, beforeInfo, beforeDist, startRotation, isSnap), 3), beforeDelta = _a[0], beforeDist = _a[1], beforeRotation = _a[2];
    _b = __read(getRotateInfo(moveable, rect, afterInfo, dist, startRotation, isSnap), 3), delta = _b[0], dist = _b[1], rotation = _b[2];
    _c = __read(getRotateInfo(moveable, rect, absoluteInfo, absoluteDist, absoluteStartRotation, isSnap), 3), absoluteDelta = _c[0], absoluteDist = _c[1], absoluteRotation = _c[2];
    if (!absoluteDelta && !delta && !beforeDelta && !parentMoveable && !resolveMatrix) {
      return;
    }
    var nextTransform = convertTransformFormat(datas, "rotate(".concat(rotation, "deg)"), "rotate(".concat(dist, "deg)"));
    if (resolveMatrix) {
      datas.fixedPosition = getTranslateFixedPosition(moveable, datas.targetAllTransform, datas.fixedDirection, datas.fixedOffset, datas);
    }
    var inverseDist = getRotateDist(moveable, dist, datas);
    var inverseDelta = minus(plus(groupDelta || [0, 0], inverseDist), datas.prevInverseDist || [0, 0]);
    datas.prevInverseDist = inverseDist;
    datas.requestValue = null;
    var dragEvent = fillTransformEvent(moveable, nextTransform, inverseDelta, isPinch, e);
    var transformEvent = dragEvent;
    var parentDistance = getDist([nextClientX, nextClientY], absoluteInfo.startAbsoluteOrigin) - absoluteInfo.startDist;
    var resize = void 0;
    if (datas.resolveAble === "resizable") {
      var resizeEvent = Resizable.dragControl(moveable, __assign6(__assign6({}, setCustomDrag(e, moveable.state, [e.deltaX, e.deltaY], !!isPinch, false, "resizable")), { resolveMatrix: true, parentDistance }));
      if (resizeEvent) {
        resize = resizeEvent;
        transformEvent = fillAfterTransform(transformEvent, resizeEvent, e);
      }
    }
    var params = fillParams(moveable, e, __assign6(__assign6({ delta, dist, rotate: rotation, rotation, beforeDist, beforeDelta, beforeRotate: beforeRotation, beforeRotation, absoluteDist, absoluteDelta, absoluteRotate: absoluteRotation, absoluteRotation, isPinch: !!isPinch, resize }, dragEvent), transformEvent));
    triggerEvent(moveable, "onRotate", params);
    return params;
  },
  dragControlEnd: function(moveable, e) {
    var datas = e.datas;
    if (!datas.isRotate) {
      return;
    }
    datas.isRotate = false;
    var params = fillEndParams(moveable, e, {});
    triggerEvent(moveable, "onRotateEnd", params);
    return params;
  },
  dragGroupControlCondition: dragControlCondition,
  dragGroupControlStart: function(moveable, e) {
    var datas = e.datas;
    var _a = moveable.state, parentLeft = _a.left, parentTop = _a.top, parentBeforeOrigin = _a.beforeOrigin;
    var params = this.dragControlStart(moveable, e);
    if (!params) {
      return false;
    }
    params.set(datas.beforeDirection * moveable.rotation);
    var events = triggerChildAbles(moveable, this, "dragControlStart", e, function(child, ev) {
      var _a2 = child.state, left = _a2.left, top = _a2.top, beforeOrigin = _a2.beforeOrigin;
      var childClient = plus(minus([left, top], [parentLeft, parentTop]), minus(beforeOrigin, parentBeforeOrigin));
      ev.datas.startGroupClient = childClient;
      ev.datas.groupClient = childClient;
      return __assign6(__assign6({}, ev), { parentRotate: 0 });
    });
    var nextParams = __assign6(__assign6({}, params), { targets: moveable.props.targets, events });
    var result = triggerEvent(moveable, "onRotateGroupStart", nextParams);
    datas.isRotate = result !== false;
    return datas.isRotate ? params : false;
  },
  dragGroupControl: function(moveable, e) {
    var datas = e.datas;
    if (!datas.isRotate) {
      return;
    }
    catchEvent(moveable, "onBeforeRotate", function(parentEvent) {
      triggerEvent(moveable, "onBeforeRotateGroup", fillParams(moveable, e, __assign6(__assign6({}, parentEvent), { targets: moveable.props.targets }), true));
    });
    var params = this.dragControl(moveable, e);
    if (!params) {
      return;
    }
    var direction = datas.beforeDirection;
    var parentRotate = params.beforeDist;
    var rad = parentRotate / 180 * Math.PI;
    var events = triggerChildAbles(moveable, this, "dragControl", e, function(_, ev) {
      var startGroupClient = ev.datas.startGroupClient;
      var _a = __read(ev.datas.groupClient, 2), prevClientX = _a[0], prevClientY = _a[1];
      var _b = __read(rotate(startGroupClient, rad * direction), 2), clientX = _b[0], clientY = _b[1];
      var delta = [clientX - prevClientX, clientY - prevClientY];
      ev.datas.groupClient = [clientX, clientY];
      return __assign6(__assign6({}, ev), { parentRotate, groupDelta: delta });
    });
    moveable.rotation = direction * params.beforeRotation;
    var nextParams = __assign6({ targets: moveable.props.targets, events, set: function(rotation) {
      moveable.rotation = rotation;
    }, setGroupRotation: function(rotation) {
      moveable.rotation = rotation;
    } }, params);
    triggerEvent(moveable, "onRotateGroup", nextParams);
    return nextParams;
  },
  dragGroupControlEnd: function(moveable, e) {
    var isDrag = e.isDrag, datas = e.datas;
    if (!datas.isRotate) {
      return;
    }
    this.dragControlEnd(moveable, e);
    var events = triggerChildAbles(moveable, this, "dragControlEnd", e);
    var nextParams = fillEndParams(moveable, e, {
      targets: moveable.props.targets,
      events
    });
    triggerEvent(moveable, "onRotateGroupEnd", nextParams);
    return isDrag;
  },
  /**
       * @method Moveable.Rotatable#request
       * @param {object} [e] - the Resizable's request parameter
       * @param {number} [e.deltaRotate=0] -  delta number of rotation
       * @param {number} [e.rotate=0] - absolute number of moveable's rotation
       * @return {Moveable.Requester} Moveable Requester
       * @example
  
       * // Instantly Request (requestStart - request - requestEnd)
       * moveable.request("rotatable", { deltaRotate: 10 }, true);
       *
       * * moveable.request("rotatable", { rotate: 10 }, true);
       *
       * // requestStart
       * const requester = moveable.request("rotatable");
       *
       * // request
       * requester.request({ deltaRotate: 10 });
       * requester.request({ deltaRotate: 10 });
       * requester.request({ deltaRotate: 10 });
       *
       * requester.request({ rotate: 10 });
       * requester.request({ rotate: 20 });
       * requester.request({ rotate: 30 });
       *
       * // requestEnd
       * requester.requestEnd();
       */
  request: function(moveable) {
    var datas = {};
    var distRotate = 0;
    var startRotation = moveable.getRotation();
    return {
      isControl: true,
      requestStart: function() {
        return { datas };
      },
      request: function(e) {
        if ("deltaRotate" in e) {
          distRotate += e.deltaRotate;
        } else if ("rotate" in e) {
          distRotate = e.rotate - startRotation;
        }
        return { datas, parentDist: distRotate };
      },
      requestEnd: function() {
        return { datas, isDrag: true };
      }
    };
  }
};
function renderGuideline(info, React3) {
  var _a;
  var direction = info.direction, classNames = info.classNames, size = info.size, pos = info.pos, zoom = info.zoom, key = info.key;
  var isHorizontal = direction === "horizontal";
  var scaleType = isHorizontal ? "Y" : "X";
  return React3.createElement("div", {
    key,
    className: classNames.join(" "),
    style: (_a = {}, _a[isHorizontal ? "width" : "height"] = "".concat(size), _a.transform = "translate(".concat(pos[0], ", ").concat(pos[1], ") translate").concat(scaleType, "(-50%) scale").concat(scaleType, "(").concat(zoom, ")"), _a)
  });
}
function renderInnerGuideline(info, React3) {
  return renderGuideline(__assign6(__assign6({}, info), { classNames: __spreadArray([
    prefix("line", "guideline", info.direction)
  ], __read(info.classNames), false).filter(function(className) {
    return className;
  }), size: info.size || "".concat(info.sizeValue, "px"), pos: info.pos || info.posValue.map(function(v) {
    return "".concat(throttle(v, 0.1), "px");
  }) }), React3);
}
function renderSnapPoses(moveable, direction, snapPoses, minPos, targetPos, size, index, React3) {
  var zoom = moveable.props.zoom;
  return snapPoses.map(function(_a, i) {
    var type = _a.type, pos = _a.pos;
    var renderPos = [0, 0];
    renderPos[index] = minPos;
    renderPos[index ? 0 : 1] = -targetPos + pos;
    return renderInnerGuideline({
      key: "".concat(direction, "TargetGuideline").concat(i),
      classNames: [prefix("target", "bold", type)],
      posValue: renderPos,
      sizeValue: size,
      zoom,
      direction
    }, React3);
  });
}
function renderGuidelines(moveable, type, guidelines, targetPos, targetRect, React3) {
  var _a = moveable.props, zoom = _a.zoom, isDisplayInnerSnapDigit = _a.isDisplayInnerSnapDigit;
  var mainNames = type === "horizontal" ? VERTICAL_NAMES_MAP : HORIZONTAL_NAMES_MAP;
  var targetStart = targetRect[mainNames.start];
  var targetEnd = targetRect[mainNames.end];
  return guidelines.filter(function(_a2) {
    var hide = _a2.hide, elementRect = _a2.elementRect;
    if (hide) {
      return false;
    }
    if (isDisplayInnerSnapDigit && elementRect) {
      var rect = elementRect.rect;
      if (rect[mainNames.start] <= targetStart && targetEnd <= rect[mainNames.end]) {
        return false;
      }
    }
    return true;
  }).map(function(guideline, i) {
    var pos = guideline.pos, size = guideline.size, element = guideline.element, className = guideline.className;
    var renderPos = [
      -targetPos[0] + pos[0],
      -targetPos[1] + pos[1]
    ];
    return renderInnerGuideline({
      key: "".concat(type, "-default-guideline-").concat(i),
      classNames: element ? [prefix("bold"), className] : [prefix("normal"), className],
      direction: type,
      posValue: renderPos,
      sizeValue: size,
      zoom
    }, React3);
  });
}
function renderDigitLine(moveable, type, lineType, index, gap, renderPos, className, React3) {
  var _a;
  var _b = moveable.props, _c = _b.snapDigit, snapDigit = _c === void 0 ? 0 : _c, _d = _b.isDisplaySnapDigit, isDisplaySnapDigit = _d === void 0 ? true : _d, _e = _b.snapDistFormat, snapDistFormat = _e === void 0 ? function(v, type2) {
    if (type2 === "vertical") {
      return v;
    }
    return v;
  } : _e, zoom = _b.zoom;
  var scaleType = type === "horizontal" ? "X" : "Y";
  var sizeName = type === "vertical" ? "height" : "width";
  var absGap = Math.abs(gap);
  var snapSize = isDisplaySnapDigit ? parseFloat(absGap.toFixed(snapDigit)) : 0;
  return React3.createElement(
    "div",
    { key: "".concat(type, "-").concat(lineType, "-guideline-").concat(index), className: prefix("guideline-group", type), style: (_a = {
      left: "".concat(renderPos[0], "px"),
      top: "".concat(renderPos[1], "px")
    }, _a[sizeName] = "".concat(absGap, "px"), _a) },
    renderInnerGuideline({
      direction: type,
      classNames: [prefix(lineType), className],
      size: "100%",
      posValue: [0, 0],
      sizeValue: absGap,
      zoom
    }, React3),
    React3.createElement("div", { className: prefix("size-value", "gap"), style: {
      transform: "translate".concat(scaleType, "(-50%) scale(").concat(zoom, ")")
    } }, snapSize > 0 ? snapDistFormat(snapSize, type) : "")
  );
}
function groupByElementGuidelines(type, guidelines, targetRect, isDisplayInnerSnapDigit) {
  var index = type === "vertical" ? 0 : 1;
  var otherIndex = type === "vertical" ? 1 : 0;
  var names = index ? VERTICAL_NAMES_MAP : HORIZONTAL_NAMES_MAP;
  var targetStart = targetRect[names.start];
  var targetEnd = targetRect[names.end];
  return groupBy(guidelines, function(guideline) {
    return guideline.pos[index];
  }).map(function(nextGuidelines) {
    var start = [];
    var end = [];
    var inner = [];
    nextGuidelines.forEach(function(guideline) {
      var _a, _b;
      var element = guideline.element;
      var rect = guideline.elementRect.rect;
      if (rect[names.end] < targetStart) {
        start.push(guideline);
      } else if (targetEnd < rect[names.start]) {
        end.push(guideline);
      } else if (rect[names.start] <= targetStart && targetEnd <= rect[names.end] && isDisplayInnerSnapDigit) {
        var pos = guideline.pos;
        var elementRect1 = { element, rect: __assign6(__assign6({}, rect), (_a = {}, _a[names.end] = rect[names.start], _a)) };
        var elementRect2 = { element, rect: __assign6(__assign6({}, rect), (_b = {}, _b[names.start] = rect[names.end], _b)) };
        var nextPos1 = [0, 0];
        var nextPos2 = [0, 0];
        nextPos1[index] = pos[index];
        nextPos1[otherIndex] = pos[otherIndex];
        nextPos2[index] = pos[index];
        nextPos2[otherIndex] = pos[otherIndex] + guideline.size;
        start.push({
          type,
          pos: nextPos1,
          size: 0,
          elementRect: elementRect1,
          direction: "",
          elementDirection: "end"
        });
        end.push({
          type,
          pos: nextPos2,
          size: 0,
          elementRect: elementRect2,
          direction: "",
          elementDirection: "start"
        });
      }
    });
    start.sort(function(a, b) {
      return b.pos[otherIndex] - a.pos[otherIndex];
    });
    end.sort(function(a, b) {
      return a.pos[otherIndex] - b.pos[otherIndex];
    });
    return {
      total: nextGuidelines,
      start,
      end,
      inner
    };
  });
}
function renderDashedGuidelines(moveable, guidelines, targetPos, targetRect, React3) {
  var isDisplayInnerSnapDigit = moveable.props.isDisplayInnerSnapDigit;
  var rendered = [];
  ["vertical", "horizontal"].forEach(function(type) {
    var nextGuidelines = guidelines.filter(function(guideline) {
      return guideline.type === type;
    });
    var index = type === "vertical" ? 1 : 0;
    var otherIndex = index ? 0 : 1;
    var groups = groupByElementGuidelines(type, nextGuidelines, targetRect, isDisplayInnerSnapDigit);
    var mainNames = index ? HORIZONTAL_NAMES_MAP : VERTICAL_NAMES_MAP;
    var sideNames = index ? VERTICAL_NAMES_MAP : HORIZONTAL_NAMES_MAP;
    var targetStart = targetRect[mainNames.start];
    var targetEnd = targetRect[mainNames.end];
    groups.forEach(function(_a) {
      var total = _a.total, start = _a.start, end = _a.end, inner = _a.inner;
      var sidePos = targetPos[otherIndex] + total[0].pos[otherIndex] - targetRect[sideNames.start];
      var prevRect = targetRect;
      start.forEach(function(guideline) {
        var nextRect = guideline.elementRect.rect;
        var size = prevRect[mainNames.start] - nextRect[mainNames.end];
        if (size > 0) {
          var renderPos = [0, 0];
          renderPos[index] = targetPos[index] + prevRect[mainNames.start] - targetStart - size;
          renderPos[otherIndex] = sidePos;
          rendered.push(renderDigitLine(moveable, type, "dashed", rendered.length, size, renderPos, guideline.className, React3));
        }
        prevRect = nextRect;
      });
      prevRect = targetRect;
      end.forEach(function(guideline) {
        var nextRect = guideline.elementRect.rect;
        var size = nextRect[mainNames.start] - prevRect[mainNames.end];
        if (size > 0) {
          var renderPos = [0, 0];
          renderPos[index] = targetPos[index] + prevRect[mainNames.end] - targetStart;
          renderPos[otherIndex] = sidePos;
          rendered.push(renderDigitLine(moveable, type, "dashed", rendered.length, size, renderPos, guideline.className, React3));
        }
        prevRect = nextRect;
      });
      inner.forEach(function(guideline) {
        var nextRect = guideline.elementRect.rect;
        var size1 = targetStart - nextRect[mainNames.start];
        var size2 = nextRect[mainNames.end] - targetEnd;
        var renderPos1 = [0, 0];
        var renderPos2 = [0, 0];
        renderPos1[index] = targetPos[index] - size1;
        renderPos1[otherIndex] = sidePos;
        renderPos2[index] = targetPos[index] + targetEnd - targetStart;
        renderPos2[otherIndex] = sidePos;
        rendered.push(renderDigitLine(moveable, type, "dashed", rendered.length, size1, renderPos1, guideline.className, React3));
        rendered.push(renderDigitLine(moveable, type, "dashed", rendered.length, size2, renderPos2, guideline.className, React3));
      });
    });
  });
  return rendered;
}
function renderGapGuidelines(moveable, guidelines, targetPos, targetRect, React3) {
  var rendered = [];
  ["horizontal", "vertical"].forEach(function(type) {
    var nextGuidelines = guidelines.filter(function(guideline) {
      return guideline.type === type;
    }).slice(0, 1);
    var index = type === "vertical" ? 0 : 1;
    var otherIndex = index ? 0 : 1;
    var mainNames = index ? HORIZONTAL_NAMES_MAP : VERTICAL_NAMES_MAP;
    var sideNames = index ? VERTICAL_NAMES_MAP : HORIZONTAL_NAMES_MAP;
    var targetStart = targetRect[mainNames.start];
    var targetEnd = targetRect[mainNames.end];
    var targetSideStart = targetRect[sideNames.start];
    var targetSideEnd = targetRect[sideNames.end];
    nextGuidelines.forEach(function(_a) {
      var gap = _a.gap, gapRects = _a.gapRects;
      var sideStartPos = Math.max.apply(Math, __spreadArray([targetSideStart], __read(gapRects.map(function(_a2) {
        var rect = _a2.rect;
        return rect[sideNames.start];
      })), false));
      var sideEndPos = Math.min.apply(Math, __spreadArray([targetSideEnd], __read(gapRects.map(function(_a2) {
        var rect = _a2.rect;
        return rect[sideNames.end];
      })), false));
      var sideCenterPos = (sideStartPos + sideEndPos) / 2;
      if (sideStartPos === sideEndPos || sideCenterPos === (targetSideStart + targetSideEnd) / 2) {
        return;
      }
      gapRects.forEach(function(_a2) {
        var rect = _a2.rect, className = _a2.className;
        var renderPos = [targetPos[0], targetPos[1]];
        if (rect[mainNames.end] < targetStart) {
          renderPos[index] += rect[mainNames.end] - targetStart;
        } else if (targetEnd < rect[mainNames.start]) {
          renderPos[index] += rect[mainNames.start] - targetStart - gap;
        } else {
          return;
        }
        renderPos[otherIndex] += sideCenterPos - targetSideStart;
        rendered.push(renderDigitLine(moveable, index ? "vertical" : "horizontal", "gap", rendered.length, gap, renderPos, className, React3));
      });
    });
  });
  return rendered;
}
function getTotalGuidelines(moveable) {
  var state = moveable.state;
  var containerClientRect = state.containerClientRect, hasFixed = state.hasFixed;
  var overflow = containerClientRect.overflow, containerHeight = containerClientRect.scrollHeight, containerWidth = containerClientRect.scrollWidth, containerClientHeight = containerClientRect.clientHeight, containerClientWidth = containerClientRect.clientWidth, clientLeft = containerClientRect.clientLeft, clientTop = containerClientRect.clientTop;
  var _a = moveable.props, _b = _a.snapGap, snapGap = _b === void 0 ? true : _b, verticalGuidelines = _a.verticalGuidelines, horizontalGuidelines = _a.horizontalGuidelines, _c = _a.snapThreshold, snapThreshold = _c === void 0 ? 5 : _c, _d = _a.snapGridWidth, snapGridWidth = _d === void 0 ? 0 : _d, _e = _a.snapGridHeight, snapGridHeight = _e === void 0 ? 0 : _e, _f = _a.maxSnapElementGuidelineDistance, maxSnapElementGuidelineDistance = _f === void 0 ? Infinity : _f, isDisplayGridGuidelines = _a.isDisplayGridGuidelines;
  var _g = getRect(getAbsolutePosesByState(moveable.state)), top = _g.top, left = _g.left, bottom = _g.bottom, right = _g.right;
  var targetRect = { top, left, bottom, right, center: (left + right) / 2, middle: (top + bottom) / 2 };
  var elementGuidelines = getElementGuidelines(moveable);
  var totalGuidelines = __spreadArray([], __read(elementGuidelines), false);
  if (snapGap) {
    totalGuidelines.push.apply(totalGuidelines, __spreadArray([], __read(getGapGuidelines(moveable, targetRect, snapThreshold)), false));
  }
  var snapOffset = __assign6({}, state.snapOffset || {
    left: 0,
    top: 0,
    bottom: 0,
    right: 0
  });
  totalGuidelines.push.apply(totalGuidelines, __spreadArray([], __read(getGridGuidelines(snapGridWidth, snapGridHeight, overflow ? containerWidth : containerClientWidth, overflow ? containerHeight : containerClientHeight, clientLeft, clientTop, snapOffset, isDisplayGridGuidelines)), false));
  if (hasFixed) {
    var left_1 = containerClientRect.left, top_1 = containerClientRect.top;
    snapOffset.left += left_1;
    snapOffset.top += top_1;
    snapOffset.right += left_1;
    snapOffset.bottom += top_1;
  }
  totalGuidelines.push.apply(totalGuidelines, __spreadArray([], __read(getDefaultGuidelines(horizontalGuidelines || false, verticalGuidelines || false, overflow ? containerWidth : containerClientWidth, overflow ? containerHeight : containerClientHeight, clientLeft, clientTop, snapOffset)), false));
  totalGuidelines = totalGuidelines.filter(function(_a2) {
    var element = _a2.element, elementRect = _a2.elementRect, type = _a2.type;
    if (!element || !elementRect) {
      return true;
    }
    var rect = elementRect.rect;
    return checkBetweenRects(targetRect, rect, type, maxSnapElementGuidelineDistance);
  });
  return totalGuidelines;
}
function getGapGuidelines(moveable, targetRect, snapThreshold) {
  var _a = moveable.props, _b = _a.maxSnapElementGuidelineDistance, maxSnapElementGuidelineDistance = _b === void 0 ? Infinity : _b, _c = _a.maxSnapElementGapDistance, maxSnapElementGapDistance = _c === void 0 ? Infinity : _c;
  var elementRects = moveable.state.elementRects;
  var gapGuidelines = [];
  [
    ["vertical", VERTICAL_NAMES_MAP, HORIZONTAL_NAMES_MAP],
    ["horizontal", HORIZONTAL_NAMES_MAP, VERTICAL_NAMES_MAP]
  ].forEach(function(_a2) {
    var _b2 = __read(_a2, 3), type = _b2[0], mainNames = _b2[1], sideNames = _b2[2];
    var targetStart = targetRect[mainNames.start];
    var targetEnd = targetRect[mainNames.end];
    var targetCenter = targetRect[mainNames.center];
    var targetStart2 = targetRect[sideNames.start];
    var targetEnd2 = targetRect[sideNames.end];
    function getDist4(elementRect) {
      var rect = elementRect.rect;
      if (rect[mainNames.end] < targetStart + snapThreshold) {
        return targetStart - rect[mainNames.end];
      } else if (targetEnd - snapThreshold < rect[mainNames.start]) {
        return rect[mainNames.start] - targetEnd;
      } else {
        return -1;
      }
    }
    var nextElementRects = elementRects.filter(function(elementRect) {
      var rect = elementRect.rect;
      if (rect[sideNames.start] > targetEnd2 || rect[sideNames.end] < targetStart2) {
        return false;
      }
      return getDist4(elementRect) > 0;
    }).sort(function(a, b) {
      return getDist4(a) - getDist4(b);
    });
    var groups = [];
    nextElementRects.forEach(function(snapRect1) {
      nextElementRects.forEach(function(snapRect2) {
        if (snapRect1 === snapRect2) {
          return;
        }
        var rect1 = snapRect1.rect;
        var rect2 = snapRect2.rect;
        var rect1Start = rect1[sideNames.start];
        var rect1End = rect1[sideNames.end];
        var rect2Start = rect2[sideNames.start];
        var rect2End = rect2[sideNames.end];
        if (rect1Start > rect2End || rect2Start > rect1End) {
          return;
        }
        groups.push([snapRect1, snapRect2]);
      });
    });
    groups.forEach(function(_a3) {
      var _b3 = __read(_a3, 2), snapRect1 = _b3[0], snapRect2 = _b3[1];
      var rect1 = snapRect1.rect;
      var rect2 = snapRect2.rect;
      var rect1Start = rect1[mainNames.start];
      var rect1End = rect1[mainNames.end];
      var rect2Start = rect2[mainNames.start];
      var rect2End = rect2[mainNames.end];
      var gap = 0;
      var pos = 0;
      var isStart = false;
      var isCenter = false;
      var isEnd = false;
      if (rect1End <= targetStart && targetEnd <= rect2Start) {
        isCenter = true;
        gap = (rect2Start - rect1End - (targetEnd - targetStart)) / 2;
        pos = rect1End + gap + (targetEnd - targetStart) / 2;
        if (abs(pos - targetCenter) > snapThreshold) {
          return;
        }
      } else if (rect1End < rect2Start && rect2End < targetStart + snapThreshold) {
        isStart = true;
        gap = rect2Start - rect1End;
        pos = rect2End + gap;
        if (abs(pos - targetStart) > snapThreshold) {
          return;
        }
      } else if (rect1End < rect2Start && targetEnd - snapThreshold < rect1Start) {
        isEnd = true;
        gap = rect2Start - rect1End;
        pos = rect1Start - gap;
        if (abs(pos - targetEnd) > snapThreshold) {
          return;
        }
      } else {
        return;
      }
      if (!gap) {
        return;
      }
      if (!checkBetweenRects(targetRect, rect2, type, maxSnapElementGuidelineDistance)) {
        return;
      }
      if (gap > maxSnapElementGapDistance) {
        return;
      }
      gapGuidelines.push({
        type,
        pos: type === "vertical" ? [pos, 0] : [0, pos],
        element: snapRect2.element,
        size: 0,
        className: snapRect2.className,
        isStart,
        isCenter,
        isEnd,
        gap,
        hide: true,
        gapRects: [snapRect1, snapRect2],
        direction: "",
        elementDirection: ""
      });
    });
  });
  return gapGuidelines;
}
function getGridGuidelines(snapGridWidth, snapGridHeight, containerWidth, containerHeight, clientLeft, clientTop, snapOffset, isDisplayGridGuidelines) {
  if (clientLeft === void 0) {
    clientLeft = 0;
  }
  if (clientTop === void 0) {
    clientTop = 0;
  }
  var guidelines = [];
  var snapOffsetLeft = snapOffset.left, snapOffsetTop = snapOffset.top;
  if (snapGridHeight) {
    for (var pos = 0; pos <= containerHeight; pos += snapGridHeight) {
      guidelines.push({
        type: "horizontal",
        pos: [
          snapOffsetLeft,
          throttle(pos - clientTop + snapOffsetTop, 0.1)
        ],
        className: prefix("grid-guideline"),
        size: containerWidth,
        hide: !isDisplayGridGuidelines,
        direction: ""
      });
    }
  }
  if (snapGridWidth) {
    for (var pos = 0; pos <= containerWidth; pos += snapGridWidth) {
      guidelines.push({
        type: "vertical",
        pos: [
          throttle(pos - clientLeft + snapOffsetLeft, 0.1),
          snapOffsetTop
        ],
        className: prefix("grid-guideline"),
        size: containerHeight,
        hide: !isDisplayGridGuidelines,
        direction: ""
      });
    }
  }
  return guidelines;
}
function checkBetweenRects(rect1, rect2, type, distance) {
  if (type === "horizontal") {
    return abs(rect1.right - rect2.left) <= distance || abs(rect1.left - rect2.right) <= distance || rect1.left <= rect2.right && rect2.left <= rect1.right;
  } else if (type === "vertical") {
    return abs(rect1.bottom - rect2.top) <= distance || abs(rect1.top - rect2.bottom) <= distance || rect1.top <= rect2.bottom && rect2.top <= rect1.bottom;
  }
  return true;
}
function getElementGuidelines(moveable) {
  var state = moveable.state;
  var _a = moveable.props.elementGuidelines, elementGuidelines = _a === void 0 ? [] : _a;
  if (!elementGuidelines.length) {
    state.elementRects = [];
    return [];
  }
  var prevValues = (state.elementRects || []).filter(function(snapRect) {
    return !snapRect.refresh;
  });
  var nextElementGuidelines = elementGuidelines.map(function(el) {
    if (isObject(el) && "element" in el) {
      return __assign6(__assign6({}, el), { element: getRefTarget(el.element, true) });
    }
    return {
      element: getRefTarget(el, true)
    };
  }).filter(function(value) {
    return value.element;
  });
  var _b = diff2(prevValues.map(function(v) {
    return v.element;
  }), nextElementGuidelines.map(function(v) {
    return v.element;
  })), maintained = _b.maintained, added = _b.added;
  var nextValues = [];
  maintained.forEach(function(_a2) {
    var _b2 = __read(_a2, 2), prevIndex = _b2[0], nextIndex = _b2[1];
    nextValues[nextIndex] = prevValues[prevIndex];
  });
  getSnapElementRects(moveable, added.map(function(index) {
    return nextElementGuidelines[index];
  })).map(function(rect, i) {
    nextValues[added[i]] = rect;
  });
  state.elementRects = nextValues;
  var elementSnapDirections = getSnapDirections(moveable.props.elementSnapDirections);
  var nextGuidelines = [];
  nextValues.forEach(function(snapRect) {
    var element = snapRect.element, _a2 = snapRect.top, topValue = _a2 === void 0 ? elementSnapDirections.top : _a2, _b2 = snapRect.left, leftValue = _b2 === void 0 ? elementSnapDirections.left : _b2, _c = snapRect.right, rightValue = _c === void 0 ? elementSnapDirections.right : _c, _d = snapRect.bottom, bottomValue = _d === void 0 ? elementSnapDirections.bottom : _d, _e = snapRect.center, centerValue = _e === void 0 ? elementSnapDirections.center : _e, _f = snapRect.middle, middleValue = _f === void 0 ? elementSnapDirections.middle : _f, className = snapRect.className, rect = snapRect.rect;
    var _g = splitSnapDirectionPoses({
      top: topValue,
      right: rightValue,
      left: leftValue,
      bottom: bottomValue,
      center: centerValue,
      middle: middleValue
    }, rect), horizontal = _g.horizontal, vertical = _g.vertical, horizontalNames = _g.horizontalNames, verticalNames = _g.verticalNames;
    var rectTop = rect.top;
    var rectLeft = rect.left;
    var width = rect.right - rectLeft;
    var height = rect.bottom - rectTop;
    var sizes = [width, height];
    vertical.forEach(function(pos, i) {
      nextGuidelines.push({
        type: "vertical",
        element,
        pos: [
          throttle(pos, 0.1),
          rectTop
        ],
        size: height,
        sizes,
        className,
        elementRect: snapRect,
        elementDirection: SNAP_SKIP_NAMES_MAP[verticalNames[i]] || verticalNames[i],
        direction: ""
      });
    });
    horizontal.forEach(function(pos, i) {
      nextGuidelines.push({
        type: "horizontal",
        element,
        pos: [
          rectLeft,
          throttle(pos, 0.1)
        ],
        size: width,
        sizes,
        className,
        elementRect: snapRect,
        elementDirection: SNAP_SKIP_NAMES_MAP[horizontalNames[i]] || horizontalNames[i],
        direction: ""
      });
    });
  });
  return nextGuidelines;
}
function getObjectGuidelines(guidelines, containerSize) {
  return guidelines ? guidelines.map(function(info) {
    var posGuideline = isObject(info) ? info : { pos: info };
    var pos = posGuideline.pos;
    if (isNumber(pos)) {
      return posGuideline;
    } else {
      return __assign6(__assign6({}, posGuideline), { pos: convertUnitSize(pos, containerSize) });
    }
  }) : [];
}
function getDefaultGuidelines(horizontalGuidelines, verticalGuidelines, width, height, clientLeft, clientTop, snapOffset) {
  if (clientLeft === void 0) {
    clientLeft = 0;
  }
  if (clientTop === void 0) {
    clientTop = 0;
  }
  if (snapOffset === void 0) {
    snapOffset = { left: 0, top: 0, right: 0, bottom: 0 };
  }
  var guidelines = [];
  var snapOffsetLeft = snapOffset.left, snapOffsetTop = snapOffset.top, snapOffsetBottom = snapOffset.bottom, snapOffsetRight = snapOffset.right;
  var snapWidth = width + snapOffsetRight - snapOffsetLeft;
  var snapHeight = height + snapOffsetBottom - snapOffsetTop;
  getObjectGuidelines(horizontalGuidelines, snapHeight).forEach(function(posInfo) {
    guidelines.push({
      type: "horizontal",
      pos: [
        snapOffsetLeft,
        throttle(posInfo.pos - clientTop + snapOffsetTop, 0.1)
      ],
      size: snapWidth,
      className: posInfo.className,
      direction: ""
    });
  });
  getObjectGuidelines(verticalGuidelines, snapWidth).forEach(function(posInfo) {
    guidelines.push({
      type: "vertical",
      pos: [
        throttle(posInfo.pos - clientLeft + snapOffsetLeft, 0.1),
        snapOffsetTop
      ],
      size: snapHeight,
      className: posInfo.className,
      direction: ""
    });
  });
  return guidelines;
}
function getSnapElementRects(moveable, values) {
  if (!values.length) {
    return [];
  }
  var groupable = moveable.props.groupable;
  var state = moveable.state;
  var containerClientRect = state.containerClientRect, rootMatrix = state.rootMatrix, is3d = state.is3d, offsetDelta = state.offsetDelta;
  var n = is3d ? 4 : 3;
  var _a = __read(calculateContainerPos(rootMatrix, containerClientRect, n), 2), containerLeft = _a[0], containerTop = _a[1];
  var offsetLeft = groupable ? 0 : offsetDelta[0];
  var offsetTop = groupable ? 0 : offsetDelta[1];
  return values.map(function(value) {
    var rect = value.element.getBoundingClientRect();
    var left = rect.left - containerLeft - offsetLeft;
    var top = rect.top - containerTop - offsetTop;
    var bottom = top + rect.height;
    var right = left + rect.width;
    var _a2 = __read(calculateInversePosition(rootMatrix, [left, top], n), 2), elementLeft = _a2[0], elementTop = _a2[1];
    var _b = __read(calculateInversePosition(rootMatrix, [right, bottom], n), 2), elementRight = _b[0], elementBottom = _b[1];
    return __assign6(__assign6({}, value), { rect: {
      left: elementLeft,
      right: elementRight,
      top: elementTop,
      bottom: elementBottom,
      center: (elementLeft + elementRight) / 2,
      middle: (elementTop + elementBottom) / 2
    } });
  });
}
function checkSnapInfo(moveable) {
  var state = moveable.state;
  var container = state.container;
  var snapContainer = moveable.props.snapContainer || container;
  if (state.snapContainer === snapContainer && state.guidelines && state.guidelines.length) {
    return false;
  }
  var containerClientRect = state.containerClientRect;
  var snapOffset = {
    left: 0,
    top: 0,
    bottom: 0,
    right: 0
  };
  if (container !== snapContainer) {
    var snapContainerTarget = getRefTarget(snapContainer, true);
    if (snapContainerTarget) {
      var snapContainerRect = getClientRect(snapContainerTarget);
      var offset1 = getDragDistByState(state, [
        snapContainerRect.left - containerClientRect.left,
        snapContainerRect.top - containerClientRect.top
      ]);
      var offset2 = getDragDistByState(state, [
        snapContainerRect.right - containerClientRect.right,
        snapContainerRect.bottom - containerClientRect.bottom
      ]);
      snapOffset.left = throttle(offset1[0], 1e-5);
      snapOffset.top = throttle(offset1[1], 1e-5);
      snapOffset.right = throttle(offset2[0], 1e-5);
      snapOffset.bottom = throttle(offset2[1], 1e-5);
    }
  }
  state.snapContainer = snapContainer;
  state.snapOffset = snapOffset;
  state.guidelines = getTotalGuidelines(moveable);
  state.enableSnap = true;
  return true;
}
function getNextFixedPoses(matrix, width, height, fixedDirection, fixedPos, is3d) {
  var nextPoses = calculatePoses(matrix, width, height, is3d ? 4 : 3);
  var nextFixedPos = getPosByDirection(nextPoses, fixedDirection);
  return getAbsolutePoses(nextPoses, minus(fixedPos, nextFixedPos));
}
function normalized(value) {
  return value ? value / abs(value) : 0;
}
function getSizeOffsetInfo(moveable, poses, direction, keepRatio, isRequest, datas) {
  var fixedDirection = datas.fixedDirection;
  var directions = getCheckSnapDirections(direction, fixedDirection, keepRatio);
  var innerBoundLineInfos = getCheckInnerBoundLineInfos(moveable, poses, direction, keepRatio);
  var offsets = __spreadArray(__spreadArray([], __read(getSnapBoundInfo(moveable, poses, directions, keepRatio, isRequest, datas)), false), __read(getInnerBoundInfo(moveable, innerBoundLineInfos, datas)), false);
  var widthOffsetInfo = getNearOffsetInfo(offsets, 0);
  var heightOffsetInfo = getNearOffsetInfo(offsets, 1);
  return {
    width: {
      isBound: widthOffsetInfo.isBound,
      offset: widthOffsetInfo.offset[0]
    },
    height: {
      isBound: heightOffsetInfo.isBound,
      offset: heightOffsetInfo.offset[1]
    }
  };
}
function recheckSizeByTwoDirection(moveable, poses, width, height, maxWidth, maxHeight, direction, isRequest, datas) {
  var snapPos = getPosByDirection(poses, direction);
  var _a = checkMoveableSnapBounds(moveable, isRequest, {
    vertical: [snapPos[0]],
    horizontal: [snapPos[1]]
  }), horizontalOffset = _a.horizontal.offset, verticalOffset = _a.vertical.offset;
  if (throttle(verticalOffset, FLOAT_POINT_NUM) || throttle(horizontalOffset, FLOAT_POINT_NUM)) {
    var _b = __read(getDragDist({
      datas,
      distX: -verticalOffset,
      distY: -horizontalOffset
    }), 2), nextWidthOffset = _b[0], nextHeightOffset = _b[1];
    var nextWidth = Math.min(maxWidth || Infinity, width + direction[0] * nextWidthOffset);
    var nextHeight = Math.min(maxHeight || Infinity, height + direction[1] * nextHeightOffset);
    return [nextWidth - width, nextHeight - height];
  }
  return [0, 0];
}
function checkSizeDist(moveable, getNextPoses, width, height, direction, fixedPosition, isRequest, datas) {
  var poses = getAbsolutePosesByState(moveable.state);
  var keepRatio = moveable.props.keepRatio;
  var widthOffset = 0;
  var heightOffset = 0;
  for (var i = 0; i < 2; ++i) {
    var nextPoses = getNextPoses(widthOffset, heightOffset);
    var _a = getSizeOffsetInfo(moveable, nextPoses, direction, keepRatio, isRequest, datas), widthOffsetInfo = _a.width, heightOffsetInfo = _a.height;
    var isWidthBound = widthOffsetInfo.isBound;
    var isHeightBound = heightOffsetInfo.isBound;
    var nextWidthOffset = widthOffsetInfo.offset;
    var nextHeightOffset = heightOffsetInfo.offset;
    if (i === 1) {
      if (!isWidthBound) {
        nextWidthOffset = 0;
      }
      if (!isHeightBound) {
        nextHeightOffset = 0;
      }
    }
    if (i === 0 && isRequest && !isWidthBound && !isHeightBound) {
      return [0, 0];
    }
    if (keepRatio) {
      var widthDist = abs(nextWidthOffset) * (width ? 1 / width : 1);
      var heightDist = abs(nextHeightOffset) * (height ? 1 / height : 1);
      var isGetWidthOffset = isWidthBound && isHeightBound ? widthDist < heightDist : isHeightBound || !isWidthBound && widthDist < heightDist;
      if (isGetWidthOffset) {
        nextWidthOffset = width * nextHeightOffset / height;
      } else {
        nextHeightOffset = height * nextWidthOffset / width;
      }
    }
    widthOffset += nextWidthOffset;
    heightOffset += nextHeightOffset;
  }
  if (!keepRatio && direction[0] && direction[1]) {
    var _b = checkMaxBounds(moveable, poses, direction, fixedPosition, datas), maxWidth = _b.maxWidth, maxHeight = _b.maxHeight;
    var _c = __read(recheckSizeByTwoDirection(moveable, getNextPoses(widthOffset, heightOffset).map(function(pos) {
      return pos.map(function(p) {
        return throttle(p, FLOAT_POINT_NUM);
      });
    }), width + widthOffset, height + heightOffset, maxWidth, maxHeight, direction, isRequest, datas), 2), nextWidthOffset = _c[0], nextHeightOffset = _c[1];
    widthOffset += nextWidthOffset;
    heightOffset += nextHeightOffset;
  }
  return [widthOffset, heightOffset];
}
function absDegree(deg) {
  if (deg < 0) {
    deg = deg % 360 + 360;
  }
  deg %= 360;
  return deg;
}
function bumpDegree(baseDeg, snapDeg) {
  snapDeg = absDegree(snapDeg);
  var count = Math.floor(baseDeg / 360);
  var deg1 = count * 360 + 360 - snapDeg;
  var deg2 = count * 360 + snapDeg;
  return abs(baseDeg - deg1) < abs(baseDeg - deg2) ? deg1 : deg2;
}
function getMinDegreeDistance(deg1, deg2) {
  deg1 = absDegree(deg1);
  deg2 = absDegree(deg2);
  var deg3 = absDegree(deg1 - deg2);
  return Math.min(deg3, 360 - deg3);
}
function checkSnapRotate(moveable, rect, dist, rotation) {
  var _a;
  var props = moveable.props;
  var snapRotationThreshold = (_a = props[NAME_snapRotationThreshold]) !== null && _a !== void 0 ? _a : 5;
  var snapRotationDegrees = props[NAME_snapRotationDegrees];
  if (hasGuidelines(moveable, "rotatable")) {
    var pos1 = rect.pos1, pos2 = rect.pos2, pos3 = rect.pos3, pos4 = rect.pos4, origin2_1 = rect.origin;
    var rad_1 = dist * Math.PI / 180;
    var prevPoses = [pos1, pos2, pos3, pos4].map(function(pos) {
      return minus(pos, origin2_1);
    });
    var nextPoses = prevPoses.map(function(pos) {
      return rotate(pos, rad_1);
    });
    var result = __spreadArray(__spreadArray([], __read(checkRotateBounds(moveable, prevPoses, nextPoses, origin2_1, dist)), false), __read(checkRotateInnerBounds(moveable, prevPoses, nextPoses, origin2_1, dist)), false);
    result.sort(function(a, b) {
      return abs(a - dist) - abs(b - dist);
    });
    var isSnap = result.length > 0;
    if (isSnap) {
      return {
        isSnap,
        dist: isSnap ? result[0] : dist
      };
    }
  }
  if ((snapRotationDegrees === null || snapRotationDegrees === void 0 ? void 0 : snapRotationDegrees.length) && snapRotationThreshold) {
    var sorted = snapRotationDegrees.slice().sort(function(a, b) {
      return getMinDegreeDistance(a, rotation) - getMinDegreeDistance(b, rotation);
    });
    var firstDegree = sorted[0];
    if (getMinDegreeDistance(firstDegree, rotation) <= snapRotationThreshold) {
      return {
        isSnap: true,
        dist: dist + bumpDegree(rotation, firstDegree) - rotation
      };
    }
  }
  return {
    isSnap: false,
    dist
  };
}
function checkSnapResize(moveable, width, height, direction, fixedPosition, isRequest, datas) {
  if (!hasGuidelines(moveable, "resizable")) {
    return [0, 0];
  }
  var fixedDirection = datas.fixedDirection, nextAllMatrix = datas.nextAllMatrix;
  var _a = moveable.state, allMatrix = _a.allMatrix, is3d = _a.is3d;
  return checkSizeDist(moveable, function(widthOffset, heightOffset) {
    return getNextFixedPoses(nextAllMatrix || allMatrix, width + widthOffset, height + heightOffset, fixedDirection, fixedPosition, is3d);
  }, width, height, direction, fixedPosition, isRequest, datas);
}
function checkSnapScale(moveable, scale, direction, isRequest, datas) {
  if (!hasGuidelines(moveable, "scalable")) {
    return [0, 0];
  }
  var startOffsetWidth = datas.startOffsetWidth, startOffsetHeight = datas.startOffsetHeight, fixedPosition = datas.fixedPosition, fixedDirection = datas.fixedDirection, is3d = datas.is3d;
  var sizeDist = checkSizeDist(moveable, function(widthOffset, heightOffset) {
    return getNextFixedPoses(scaleMatrix(datas, plus(scale, [widthOffset / startOffsetWidth, heightOffset / startOffsetHeight])), startOffsetWidth, startOffsetHeight, fixedDirection, fixedPosition, is3d);
  }, startOffsetWidth, startOffsetHeight, direction, fixedPosition, isRequest, datas);
  return [sizeDist[0] / startOffsetWidth, sizeDist[1] / startOffsetHeight];
}
function startCheckSnapDrag(moveable, datas) {
  datas.absolutePoses = getAbsolutePosesByState(moveable.state);
}
function getSnapGuidelines(posInfos) {
  var guidelines = [];
  posInfos.forEach(function(posInfo) {
    posInfo.guidelineInfos.forEach(function(_a) {
      var guideline = _a.guideline;
      if (find2(guidelines, function(info) {
        return info.guideline === guideline;
      })) {
        return;
      }
      guideline.direction = "";
      guidelines.push({ guideline, posInfo });
    });
  });
  return guidelines.map(function(_a) {
    var guideline = _a.guideline, posInfo = _a.posInfo;
    return __assign6(__assign6({}, guideline), { direction: posInfo.direction });
  });
}
function addBoundGuidelines(moveable, verticalPoses, horizontalPoses, verticalSnapPoses, horizontalSnapPoses, externalBounds) {
  var _a = checkBoundPoses(getBounds(moveable, externalBounds), verticalPoses, horizontalPoses), verticalBoundInfos = _a.vertical, horizontalBoundInfos = _a.horizontal;
  var boundMap = getInitialBounds();
  verticalBoundInfos.forEach(function(info) {
    if (info.isBound) {
      if (info.direction === "start") {
        boundMap.left = true;
      }
      if (info.direction === "end") {
        boundMap.right = true;
      }
      verticalSnapPoses.push({
        type: "bounds",
        pos: info.pos
      });
    }
  });
  horizontalBoundInfos.forEach(function(info) {
    if (info.isBound) {
      if (info.direction === "start") {
        boundMap.top = true;
      }
      if (info.direction === "end") {
        boundMap.bottom = true;
      }
      horizontalSnapPoses.push({
        type: "bounds",
        pos: info.pos
      });
    }
  });
  var _b = checkInnerBoundPoses(moveable), innerBoundMap = _b.boundMap, verticalInnerBoundPoses = _b.vertical, horizontalInnerBoundPoses = _b.horizontal;
  verticalInnerBoundPoses.forEach(function(innerPos) {
    if (findIndex(verticalSnapPoses, function(_a2) {
      var type = _a2.type, pos = _a2.pos;
      return type === "bounds" && pos === innerPos;
    }) >= 0) {
      return;
    }
    verticalSnapPoses.push({
      type: "bounds",
      pos: innerPos
    });
  });
  horizontalInnerBoundPoses.forEach(function(innerPos) {
    if (findIndex(horizontalSnapPoses, function(_a2) {
      var type = _a2.type, pos = _a2.pos;
      return type === "bounds" && pos === innerPos;
    }) >= 0) {
      return;
    }
    horizontalSnapPoses.push({
      type: "bounds",
      pos: innerPos
    });
  });
  return {
    boundMap,
    innerBoundMap
  };
}
var directionCondition$1 = getDirectionCondition("", ["resizable", "scalable"]);
var NAME_snapRotationThreshold = "snapRotationThreshold";
var NAME_snapRotationDegrees = "snapRotationDegrees";
var Snappable = {
  name: "snappable",
  dragRelation: "strong",
  props: [
    "snappable",
    "snapContainer",
    "snapDirections",
    "elementSnapDirections",
    "snapGap",
    "snapGridWidth",
    "snapGridHeight",
    "isDisplaySnapDigit",
    "isDisplayInnerSnapDigit",
    "isDisplayGridGuidelines",
    "snapDigit",
    "snapThreshold",
    "snapRenderThreshold",
    NAME_snapRotationThreshold,
    NAME_snapRotationDegrees,
    "horizontalGuidelines",
    "verticalGuidelines",
    "elementGuidelines",
    "bounds",
    "innerBounds",
    "snapDistFormat",
    "maxSnapElementGuidelineDistance",
    "maxSnapElementGapDistance"
  ],
  events: ["snap", "bound"],
  css: [
    ":host {\n--bounds-color: #d66;\n}\n.guideline {\npointer-events: none;\nz-index: 2;\n}\n.guideline.bounds {\nbackground: #d66;\nbackground: var(--bounds-color);\n}\n.guideline-group {\nposition: absolute;\ntop: 0;\nleft: 0;\n}\n.guideline-group .size-value {\nposition: absolute;\ncolor: #f55;\nfont-size: 12px;\nfont-size: calc(12px * var(--zoom));\nfont-weight: bold;\n}\n.guideline-group.horizontal .size-value {\ntransform-origin: 50% 100%;\ntransform: translateX(-50%);\nleft: 50%;\nbottom: 5px;\nbottom: calc(2px + 3px * var(--zoom));\n}\n.guideline-group.vertical .size-value {\ntransform-origin: 0% 50%;\ntop: 50%;\ntransform: translateY(-50%);\nleft: 5px;\nleft: calc(2px + 3px * var(--zoom));\n}\n.guideline.gap {\nbackground: #f55;\n}\n.size-value.gap {\ncolor: #f55;\n}\n"
  ],
  render: function(moveable, React3) {
    var state = moveable.state;
    var targetTop = state.top, targetLeft = state.left, pos1 = state.pos1, pos2 = state.pos2, pos3 = state.pos3, pos4 = state.pos4, snapRenderInfo = state.snapRenderInfo;
    var _a = moveable.props.snapRenderThreshold, snapRenderThreshold = _a === void 0 ? 1 : _a;
    if (!snapRenderInfo || !snapRenderInfo.render || !hasGuidelines(moveable, "")) {
      watchValue(moveable, "boundMap", getInitialBounds(), function(v) {
        return JSON.stringify(v);
      });
      watchValue(moveable, "innerBoundMap", getInitialBounds(), function(v) {
        return JSON.stringify(v);
      });
      return [];
    }
    state.guidelines = getTotalGuidelines(moveable);
    var minLeft = Math.min(pos1[0], pos2[0], pos3[0], pos4[0]);
    var minTop = Math.min(pos1[1], pos2[1], pos3[1], pos4[1]);
    var externalPoses = snapRenderInfo.externalPoses || [];
    var poses = getAbsolutePosesByState(moveable.state);
    var verticalSnapPoses = [];
    var horizontalSnapPoses = [];
    var verticalGuidelines = [];
    var horizontalGuidelines = [];
    var snapInfos = [];
    var _b = getRect(poses), width = _b.width, height = _b.height, top = _b.top, left = _b.left, bottom = _b.bottom, right = _b.right;
    var targetRect = { left, right, top, bottom, center: (left + right) / 2, middle: (top + bottom) / 2 };
    var hasExternalPoses = externalPoses.length > 0;
    var externalRect = hasExternalPoses ? getRect(externalPoses) : {};
    if (!snapRenderInfo.request) {
      if (snapRenderInfo.direction) {
        snapInfos.push(getSnapInfosByDirection(moveable, poses, snapRenderInfo.direction, snapRenderThreshold));
      }
      if (snapRenderInfo.snap) {
        var rect = getRect(poses);
        if (snapRenderInfo.center) {
          rect.middle = (rect.top + rect.bottom) / 2;
          rect.center = (rect.left + rect.right) / 2;
        }
        snapInfos.push(checkSnaps(moveable, rect, snapRenderThreshold));
      }
      if (hasExternalPoses) {
        if (snapRenderInfo.center) {
          externalRect.middle = (externalRect.top + externalRect.bottom) / 2;
          externalRect.center = (externalRect.left + externalRect.right) / 2;
        }
        snapInfos.push(checkSnaps(moveable, externalRect, snapRenderThreshold));
      }
      snapInfos.forEach(function(snapInfo) {
        var verticalPosInfos = snapInfo.vertical.posInfos, horizontalPosInfos = snapInfo.horizontal.posInfos;
        verticalSnapPoses.push.apply(verticalSnapPoses, __spreadArray([], __read(verticalPosInfos.filter(function(_a2) {
          var guidelineInfos = _a2.guidelineInfos;
          return guidelineInfos.some(function(_a3) {
            var guideline = _a3.guideline;
            return !guideline.hide;
          });
        }).map(function(posInfo) {
          return {
            type: "snap",
            pos: posInfo.pos
          };
        })), false));
        horizontalSnapPoses.push.apply(horizontalSnapPoses, __spreadArray([], __read(horizontalPosInfos.filter(function(_a2) {
          var guidelineInfos = _a2.guidelineInfos;
          return guidelineInfos.some(function(_a3) {
            var guideline = _a3.guideline;
            return !guideline.hide;
          });
        }).map(function(posInfo) {
          return {
            type: "snap",
            pos: posInfo.pos
          };
        })), false));
        verticalGuidelines.push.apply(verticalGuidelines, __spreadArray([], __read(getSnapGuidelines(verticalPosInfos)), false));
        horizontalGuidelines.push.apply(horizontalGuidelines, __spreadArray([], __read(getSnapGuidelines(horizontalPosInfos)), false));
      });
    }
    var _c = addBoundGuidelines(moveable, [left, right], [top, bottom], verticalSnapPoses, horizontalSnapPoses), boundMap = _c.boundMap, innerBoundMap = _c.innerBoundMap;
    if (hasExternalPoses) {
      addBoundGuidelines(moveable, [externalRect.left, externalRect.right], [externalRect.top, externalRect.bottom], verticalSnapPoses, horizontalSnapPoses, snapRenderInfo.externalBounds);
    }
    var allGuidelines = __spreadArray(__spreadArray([], __read(verticalGuidelines), false), __read(horizontalGuidelines), false);
    var elementGuidelines = allGuidelines.filter(function(guideline) {
      return guideline.element && !guideline.gapRects;
    });
    var gapGuidelines = allGuidelines.filter(function(guideline) {
      return guideline.gapRects;
    }).sort(function(a, b) {
      return a.gap - b.gap;
    });
    triggerEvent(moveable, "onSnap", {
      guidelines: allGuidelines.filter(function(_a2) {
        var element = _a2.element;
        return !element;
      }),
      elements: elementGuidelines,
      gaps: gapGuidelines
    }, true);
    var nextBoundMap = watchValue(moveable, "boundMap", boundMap, function(v) {
      return JSON.stringify(v);
    }, getInitialBounds());
    var nextInnerBoundMap = watchValue(moveable, "innerBoundMap", innerBoundMap, function(v) {
      return JSON.stringify(v);
    }, getInitialBounds());
    if (boundMap === nextBoundMap || innerBoundMap === nextInnerBoundMap) {
      triggerEvent(moveable, "onBound", {
        bounds: boundMap,
        innerBounds: innerBoundMap
      }, true);
    }
    return __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], __read(renderDashedGuidelines(moveable, elementGuidelines, [minLeft, minTop], targetRect, React3)), false), __read(renderGapGuidelines(moveable, gapGuidelines, [minLeft, minTop], targetRect, React3)), false), __read(renderGuidelines(moveable, "horizontal", horizontalGuidelines, [targetLeft, targetTop], targetRect, React3)), false), __read(renderGuidelines(moveable, "vertical", verticalGuidelines, [targetLeft, targetTop], targetRect, React3)), false), __read(renderSnapPoses(moveable, "horizontal", horizontalSnapPoses, minLeft, targetTop, width, 0, React3)), false), __read(renderSnapPoses(moveable, "vertical", verticalSnapPoses, minTop, targetLeft, height, 1, React3)), false);
  },
  dragStart: function(moveable, e) {
    moveable.state.snapRenderInfo = {
      request: e.isRequest,
      snap: true,
      center: true
    };
    checkSnapInfo(moveable);
  },
  drag: function(moveable) {
    var state = moveable.state;
    if (!checkSnapInfo(moveable)) {
      state.guidelines = getTotalGuidelines(moveable);
    }
    if (state.snapRenderInfo) {
      state.snapRenderInfo.render = true;
    }
  },
  pinchStart: function(moveable) {
    this.unset(moveable);
  },
  dragEnd: function(moveable) {
    this.unset(moveable);
  },
  dragControlCondition: function(moveable, e) {
    if (directionCondition$1(moveable, e) || dragControlCondition(moveable, e)) {
      return true;
    }
    if (!e.isRequest && e.inputEvent) {
      return hasClass(e.inputEvent.target, prefix("snap-control"));
    }
  },
  dragControlStart: function(moveable) {
    moveable.state.snapRenderInfo = null;
    checkSnapInfo(moveable);
  },
  dragControl: function(moveable) {
    this.drag(moveable);
  },
  dragControlEnd: function(moveable) {
    this.unset(moveable);
  },
  dragGroupStart: function(moveable, e) {
    this.dragStart(moveable, e);
  },
  dragGroup: function(moveable) {
    this.drag(moveable);
  },
  dragGroupEnd: function(moveable) {
    this.unset(moveable);
  },
  dragGroupControlStart: function(moveable) {
    moveable.state.snapRenderInfo = null;
    checkSnapInfo(moveable);
  },
  dragGroupControl: function(moveable) {
    this.drag(moveable);
  },
  dragGroupControlEnd: function(moveable) {
    this.unset(moveable);
  },
  unset: function(moveable) {
    var state = moveable.state;
    state.enableSnap = false;
    state.guidelines = [];
    state.snapRenderInfo = null;
    state.elementRects = [];
  }
};
function multiply2(pos1, pos2) {
  return [
    pos1[0] * pos2[0],
    pos1[1] * pos2[1]
  ];
}
function prefix() {
  var classNames = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    classNames[_i] = arguments[_i];
  }
  return prefixNames.apply(void 0, __spreadArray([PREFIX], __read(classNames), false));
}
function defaultSync(fn) {
  fn();
}
function getTransformMatrix(transform) {
  if (!transform || transform === "none") {
    return [1, 0, 0, 1, 0, 0];
  }
  if (isObject(transform)) {
    return transform;
  }
  return parseMat(transform);
}
function getAbsoluteMatrix(matrix, n, origin) {
  return multiplies(n, createOriginMatrix(origin, n), matrix, createOriginMatrix(origin.map(function(a) {
    return -a;
  }), n));
}
function measureSVGSize(el, unit, isHorizontal) {
  if (unit === "%") {
    var viewBox = getSVGViewBox(el.ownerSVGElement);
    return viewBox[isHorizontal ? "width" : "height"] / 100;
  }
  return 1;
}
function getBeforeTransformOrigin(el) {
  var relativeOrigin = getTransformOrigin(getComputedStyle2(el, ":before"));
  return relativeOrigin.map(function(o, i) {
    var _a = splitUnit(o), value = _a.value, unit = _a.unit;
    return value * measureSVGSize(el, unit, i === 0);
  });
}
function getTransformOriginArray(transformOrigin) {
  return transformOrigin ? transformOrigin.split(" ") : ["0", "0"];
}
function getTransformOrigin(style) {
  return getTransformOriginArray(style.transformOrigin);
}
function getElementTransform(target) {
  var getStyle = getCachedStyle(target);
  var computedTransform = getStyle("transform");
  if (computedTransform && computedTransform !== "none") {
    return computedTransform;
  }
  if ("transform" in target) {
    var list = target.transform;
    var baseVal = list.baseVal;
    if (!baseVal) {
      return "";
    }
    var length_1 = baseVal.length;
    if (!length_1) {
      return "";
    }
    var matrixes = [];
    var _loop_1 = function(i2) {
      var matrix = baseVal[i2].matrix;
      matrixes.push("matrix(".concat(["a", "b", "c", "d", "e", "f"].map(function(chr) {
        return matrix[chr];
      }).join(", "), ")"));
    };
    for (var i = 0; i < length_1; ++i) {
      _loop_1(i);
    }
    return matrixes.join(" ");
  }
  return "";
}
function getOffsetInfo(el, lastParent, isParent, checkZoom, getTargetStyle) {
  var _a, _b;
  var documentElement = getDocumentElement(el) || getDocumentBody(el);
  var hasSlot = false;
  var target;
  var parentSlotElement;
  if (!el || isParent) {
    target = el;
  } else {
    var assignedSlotParentElement = (_a = el === null || el === void 0 ? void 0 : el.assignedSlot) === null || _a === void 0 ? void 0 : _a.parentElement;
    var parentElement = el.parentElement;
    if (assignedSlotParentElement) {
      hasSlot = true;
      parentSlotElement = parentElement;
      target = assignedSlotParentElement;
    } else {
      target = parentElement;
    }
  }
  var isCustomElement = false;
  var isEnd = el === lastParent || target === lastParent;
  var position = "relative";
  var offsetZoom = 1;
  var targetZoom = parseFloat(getTargetStyle === null || getTargetStyle === void 0 ? void 0 : getTargetStyle("zoom")) || 1;
  var targetPosition = getTargetStyle === null || getTargetStyle === void 0 ? void 0 : getTargetStyle("position");
  while (target && target !== documentElement) {
    if (lastParent === target) {
      isEnd = true;
    }
    var getStyle = getCachedStyle(target);
    var tagName = target.tagName.toLowerCase();
    var transform = getElementTransform(target);
    var willChange = getStyle("willChange");
    var zoom = parseFloat(getStyle("zoom")) || 1;
    position = getStyle("position");
    if (checkZoom && zoom !== 1) {
      offsetZoom = zoom;
      break;
    }
    if (
      // offsetParent is the parentElement if the target's zoom is not 1 and not absolute.
      !isParent && checkZoom && targetZoom !== 1 && targetPosition && targetPosition !== "absolute" || tagName === "svg" || position !== "static" || transform && transform !== "none" || willChange === "transform"
    ) {
      break;
    }
    var slotParentNode = (_b = el === null || el === void 0 ? void 0 : el.assignedSlot) === null || _b === void 0 ? void 0 : _b.parentNode;
    var targetParentNode = target.parentNode;
    if (slotParentNode) {
      hasSlot = true;
      parentSlotElement = targetParentNode;
    }
    var parentNode = targetParentNode;
    if (parentNode && parentNode.nodeType === 11) {
      target = parentNode.host;
      isCustomElement = true;
      position = getCachedStyle(target)("position");
      break;
    }
    target = parentNode;
    position = "relative";
  }
  return {
    offsetZoom,
    hasSlot,
    parentSlotElement,
    isCustomElement,
    isStatic: position === "static",
    isEnd: isEnd || !target || target === documentElement,
    offsetParent: target || documentElement
  };
}
function getOffsetPosInfo(el, target) {
  var _a;
  var tagName = el.tagName.toLowerCase();
  var offsetLeft = el.offsetLeft;
  var offsetTop = el.offsetTop;
  var getStyle = getCachedStyle(el);
  var isSVG = isUndefined(offsetLeft);
  var hasOffset = !isSVG;
  var origin;
  var targetOrigin;
  if (!hasOffset && tagName !== "svg") {
    origin = IS_WEBKIT605 ? getBeforeTransformOrigin(el) : getTransformOriginArray(getStyle("transformOrigin")).map(function(pos) {
      return parseFloat(pos);
    });
    targetOrigin = origin.slice();
    hasOffset = true;
    _a = __read(getSVGGraphicsOffset(el, origin, el === target && target.tagName.toLowerCase() === "g"), 4), offsetLeft = _a[0], offsetTop = _a[1], origin[0] = _a[2], origin[1] = _a[3];
  } else {
    origin = getTransformOriginArray(getStyle("transformOrigin")).map(function(pos) {
      return parseFloat(pos);
    });
    targetOrigin = origin.slice();
  }
  return {
    tagName,
    isSVG,
    hasOffset,
    offset: [offsetLeft || 0, offsetTop || 0],
    origin,
    targetOrigin
  };
}
function getBodyOffset(el, isSVG) {
  var getStyle = getCachedStyle(el);
  var getBodyStyle = getCachedStyle(getDocumentBody(el));
  var bodyPosition = getBodyStyle("position");
  if (!isSVG && (!bodyPosition || bodyPosition === "static")) {
    return [0, 0];
  }
  var marginLeft = parseInt(getBodyStyle("marginLeft"), 10);
  var marginTop = parseInt(getBodyStyle("marginTop"), 10);
  if (getStyle("position") === "absolute") {
    if (getStyle("top") !== "auto" || getStyle("bottom") !== "auto") {
      marginTop = 0;
    }
    if (getStyle("left") !== "auto" || getStyle("right") !== "auto") {
      marginLeft = 0;
    }
  }
  return [marginLeft, marginTop];
}
function convert3DMatrixes(matrixes) {
  matrixes.forEach(function(info) {
    var matrix = info.matrix;
    if (matrix) {
      info.matrix = convertDimension(matrix, 3, 4);
    }
  });
}
function getPositionFixedInfo(el) {
  var fixedContainer = el.parentElement;
  var hasTransform = false;
  var body = getDocumentBody(el);
  while (fixedContainer) {
    var transform = getComputedStyle2(fixedContainer).transform;
    if (transform && transform !== "none") {
      hasTransform = true;
      break;
    }
    if (fixedContainer === body) {
      break;
    }
    fixedContainer = fixedContainer.parentElement;
  }
  return {
    fixedContainer: fixedContainer || body,
    hasTransform
  };
}
function makeMatrixCSS(matrix, is3d) {
  if (is3d === void 0) {
    is3d = matrix.length > 9;
  }
  return "".concat(is3d ? "matrix3d" : "matrix", "(").concat(convertMatrixtoCSS(matrix, !is3d).join(","), ")");
}
function getSVGViewBox(el) {
  var clientWidth = el.clientWidth;
  var clientHeight = el.clientHeight;
  if (!el) {
    return { x: 0, y: 0, width: 0, height: 0, clientWidth, clientHeight };
  }
  var viewBox = el.viewBox;
  var baseVal = viewBox && viewBox.baseVal || { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: baseVal.x,
    y: baseVal.y,
    width: baseVal.width || clientWidth,
    height: baseVal.height || clientHeight,
    clientWidth,
    clientHeight
  };
}
function getSVGMatrix(el, n) {
  var _a;
  var _b = getSVGViewBox(el), viewBoxWidth = _b.width, viewBoxHeight = _b.height, clientWidth = _b.clientWidth, clientHeight = _b.clientHeight;
  var scaleX = clientWidth / viewBoxWidth;
  var scaleY = clientHeight / viewBoxHeight;
  var preserveAspectRatio = el.preserveAspectRatio.baseVal;
  var align = preserveAspectRatio.align;
  var meetOrSlice = preserveAspectRatio.meetOrSlice;
  var svgOrigin = [0, 0];
  var scale = [scaleX, scaleY];
  var translate = [0, 0];
  if (align !== 1) {
    var xAlign = (align - 2) % 3;
    var yAlign = Math.floor((align - 2) / 3);
    svgOrigin[0] = viewBoxWidth * xAlign / 2;
    svgOrigin[1] = viewBoxHeight * yAlign / 2;
    var scaleDimension = meetOrSlice === 2 ? Math.max(scaleY, scaleX) : Math.min(scaleX, scaleY);
    scale[0] = scaleDimension;
    scale[1] = scaleDimension;
    translate[0] = (clientWidth - viewBoxWidth) / 2 * xAlign;
    translate[1] = (clientHeight - viewBoxHeight) / 2 * yAlign;
  }
  var scaleMatrix2 = createScaleMatrix(scale, n);
  _a = __read(translate, 2), scaleMatrix2[n * (n - 1)] = _a[0], scaleMatrix2[n * (n - 1) + 1] = _a[1];
  return getAbsoluteMatrix(scaleMatrix2, n, svgOrigin);
}
function getSVGGraphicsOffset(el, origin, isGTarget) {
  if (!el.getBBox || !isGTarget && el.tagName.toLowerCase() === "g") {
    return [0, 0, 0, 0];
  }
  var getStyle = getCachedStyle(el);
  var isFillBox = getStyle("transform-box") === "fill-box";
  var bbox = el.getBBox();
  var viewBox = getSVGViewBox(el.ownerSVGElement);
  var left = bbox.x - viewBox.x;
  var top = bbox.y - viewBox.y;
  var originX = isFillBox ? origin[0] : origin[0] - left;
  var originY = isFillBox ? origin[1] : origin[1] - top;
  return [left, top, originX, originY];
}
function calculatePosition(matrix, pos, n) {
  return calculate(matrix, convertPositionMatrix(pos, n), n);
}
function calculatePoses(matrix, width, height, n) {
  return [[0, 0], [width, 0], [0, height], [width, height]].map(function(pos) {
    return calculatePosition(matrix, pos, n);
  });
}
function getRect(poses) {
  var posesX = poses.map(function(pos) {
    return pos[0];
  });
  var posesY = poses.map(function(pos) {
    return pos[1];
  });
  var left = Math.min.apply(Math, __spreadArray([], __read(posesX), false));
  var top = Math.min.apply(Math, __spreadArray([], __read(posesY), false));
  var right = Math.max.apply(Math, __spreadArray([], __read(posesX), false));
  var bottom = Math.max.apply(Math, __spreadArray([], __read(posesY), false));
  var rectWidth = right - left;
  var rectHeight = bottom - top;
  return {
    left,
    top,
    right,
    bottom,
    width: rectWidth,
    height: rectHeight
  };
}
function calculateRect(matrix, width, height, n) {
  var poses = calculatePoses(matrix, width, height, n);
  return getRect(poses);
}
function getSVGOffset(offsetInfo, targetInfo, container, n, beforeMatrix) {
  var _a;
  var target = offsetInfo.target;
  var origin = offsetInfo.origin;
  var targetMatrix = targetInfo.matrix;
  var _b = getSize(target), width = _b.offsetWidth, height = _b.offsetHeight;
  var containerClientRect = container.getBoundingClientRect();
  var margin = [0, 0];
  if (container === getDocumentBody(container)) {
    margin = getBodyOffset(target, true);
  }
  var rect = target.getBoundingClientRect();
  var rectLeft = rect.left - containerClientRect.left + container.scrollLeft - (container.clientLeft || 0) + margin[0];
  var rectTop = rect.top - containerClientRect.top + container.scrollTop - (container.clientTop || 0) + margin[1];
  var rectWidth = rect.width;
  var rectHeight = rect.height;
  var mat = multiplies(n, beforeMatrix, targetMatrix);
  var _c = calculateRect(mat, width, height, n), prevLeft = _c.left, prevTop = _c.top, prevWidth = _c.width, prevHeight = _c.height;
  var posOrigin = calculatePosition(mat, origin, n);
  var prevOrigin = minus(posOrigin, [prevLeft, prevTop]);
  var rectOrigin = [
    rectLeft + prevOrigin[0] * rectWidth / prevWidth,
    rectTop + prevOrigin[1] * rectHeight / prevHeight
  ];
  var offset = [0, 0];
  var count = 0;
  while (++count < 10) {
    var inverseBeforeMatrix = invert(beforeMatrix, n);
    _a = __read(minus(calculatePosition(inverseBeforeMatrix, rectOrigin, n), calculatePosition(inverseBeforeMatrix, posOrigin, n)), 2), offset[0] = _a[0], offset[1] = _a[1];
    var mat2 = multiplies(n, beforeMatrix, createOriginMatrix(offset, n), targetMatrix);
    var _d = calculateRect(mat2, width, height, n), nextLeft = _d.left, nextTop = _d.top;
    var distLeft = nextLeft - rectLeft;
    var distTop = nextTop - rectTop;
    if (abs(distLeft) < 2 && abs(distTop) < 2) {
      break;
    }
    rectOrigin[0] -= distLeft;
    rectOrigin[1] -= distTop;
  }
  return offset.map(function(p) {
    return Math.round(p);
  });
}
function calculateMoveableClientPositions(rootMatrix, poses, rootClientRect) {
  var is3d = rootMatrix.length === 16;
  var n = is3d ? 4 : 3;
  var rootPoses = poses.map(function(pos) {
    return calculatePosition(rootMatrix, pos, n);
  });
  var left = rootClientRect.left, top = rootClientRect.top;
  return rootPoses.map(function(pos) {
    return [pos[0] + left, pos[1] + top];
  });
}
function getDistSize(vec) {
  return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
}
function getDiagonalSize(pos1, pos2) {
  return getDistSize([
    pos2[0] - pos1[0],
    pos2[1] - pos1[1]
  ]);
}
function getLineStyle(pos1, pos2, zoom, rad) {
  if (zoom === void 0) {
    zoom = 1;
  }
  if (rad === void 0) {
    rad = getRad(pos1, pos2);
  }
  var width = getDiagonalSize(pos1, pos2);
  return {
    transform: "translateY(-50%) translate(".concat(pos1[0], "px, ").concat(pos1[1], "px) rotate(").concat(rad, "rad) scaleY(").concat(zoom, ")"),
    width: "".concat(width, "px")
  };
}
function getControlTransform(rotation, zoom) {
  var poses = [];
  for (var _i = 2; _i < arguments.length; _i++) {
    poses[_i - 2] = arguments[_i];
  }
  var length = poses.length;
  var x = poses.reduce(function(prev, pos) {
    return prev + pos[0];
  }, 0) / length;
  var y = poses.reduce(function(prev, pos) {
    return prev + pos[1];
  }, 0) / length;
  return {
    transform: "translateZ(0px) translate(".concat(x, "px, ").concat(y, "px) rotate(").concat(rotation, "rad) scale(").concat(zoom, ")")
  };
}
function getProps(props, ableName) {
  var self = props[ableName];
  if (isObject(self)) {
    return __assign6(__assign6({}, props), self);
  }
  return props;
}
function getSize(target) {
  var hasOffset = target && !isUndefined(target.offsetWidth);
  var offsetWidth = 0;
  var offsetHeight = 0;
  var clientWidth = 0;
  var clientHeight = 0;
  var cssWidth = 0;
  var cssHeight = 0;
  var contentWidth = 0;
  var contentHeight = 0;
  var minWidth = 0;
  var minHeight = 0;
  var minOffsetWidth = 0;
  var minOffsetHeight = 0;
  var maxWidth = Infinity;
  var maxHeight = Infinity;
  var maxOffsetWidth = Infinity;
  var maxOffsetHeight = Infinity;
  var inlineCSSWidth = 0;
  var inlineCSSHeight = 0;
  var svg = false;
  if (target) {
    if (!hasOffset && target.tagName.toLowerCase() !== "svg") {
      var bbox = target.getBBox();
      svg = true;
      offsetWidth = bbox.width;
      offsetHeight = bbox.height;
      cssWidth = offsetWidth;
      cssHeight = offsetHeight;
      contentWidth = offsetWidth;
      contentHeight = offsetHeight;
      clientWidth = offsetWidth;
      clientHeight = offsetHeight;
    } else {
      var getStyle = getCachedStyle(target);
      var targetStyle = target.style;
      var boxSizing = getStyle("boxSizing") === "border-box";
      var borderLeft = parseFloat(getStyle("borderLeftWidth")) || 0;
      var borderRight = parseFloat(getStyle("borderRightWidth")) || 0;
      var borderTop = parseFloat(getStyle("borderTopWidth")) || 0;
      var borderBottom = parseFloat(getStyle("borderBottomWidth")) || 0;
      var paddingLeft = parseFloat(getStyle("paddingLeft")) || 0;
      var paddingRight = parseFloat(getStyle("paddingRight")) || 0;
      var paddingTop = parseFloat(getStyle("paddingTop")) || 0;
      var paddingBottom = parseFloat(getStyle("paddingBottom")) || 0;
      var horizontalPadding = paddingLeft + paddingRight;
      var verticalPadding = paddingTop + paddingBottom;
      var horizontalBorder = borderLeft + borderRight;
      var verticalBorder = borderTop + borderBottom;
      var horizontalOffset = horizontalPadding + horizontalBorder;
      var verticalOffset = verticalPadding + verticalBorder;
      var position = getStyle("position");
      var containerWidth = 0;
      var containerHeight = 0;
      if ("clientLeft" in target) {
        var parentElement = null;
        if (position === "absolute") {
          var offsetInfo = getOffsetInfo(target, getDocumentBody(target));
          parentElement = offsetInfo.offsetParent;
        } else {
          parentElement = target.parentElement;
        }
        if (parentElement) {
          var getParentStyle = getCachedStyle(parentElement);
          containerWidth = parseFloat(getParentStyle("width"));
          containerHeight = parseFloat(getParentStyle("height"));
        }
      }
      minWidth = Math.max(horizontalPadding, convertUnitSize(getStyle("minWidth"), containerWidth) || 0);
      minHeight = Math.max(verticalPadding, convertUnitSize(getStyle("minHeight"), containerHeight) || 0);
      maxWidth = convertUnitSize(getStyle("maxWidth"), containerWidth);
      maxHeight = convertUnitSize(getStyle("maxHeight"), containerHeight);
      if (isNaN(maxWidth)) {
        maxWidth = Infinity;
      }
      if (isNaN(maxHeight)) {
        maxHeight = Infinity;
      }
      inlineCSSWidth = convertUnitSize(targetStyle.width, 0) || 0;
      inlineCSSHeight = convertUnitSize(targetStyle.height, 0) || 0;
      cssWidth = parseFloat(getStyle("width")) || 0;
      cssHeight = parseFloat(getStyle("height")) || 0;
      contentWidth = abs(cssWidth - inlineCSSWidth) < 1 ? between(minWidth, inlineCSSWidth || cssWidth, maxWidth) : cssWidth;
      contentHeight = abs(cssHeight - inlineCSSHeight) < 1 ? between(minHeight, inlineCSSHeight || cssHeight, maxHeight) : cssHeight;
      offsetWidth = contentWidth;
      offsetHeight = contentHeight;
      clientWidth = contentWidth;
      clientHeight = contentHeight;
      if (boxSizing) {
        maxOffsetWidth = maxWidth;
        maxOffsetHeight = maxHeight;
        minOffsetWidth = minWidth;
        minOffsetHeight = minHeight;
        contentWidth = offsetWidth - horizontalOffset;
        contentHeight = offsetHeight - verticalOffset;
      } else {
        maxOffsetWidth = maxWidth + horizontalOffset;
        maxOffsetHeight = maxHeight + verticalOffset;
        minOffsetWidth = minWidth + horizontalOffset;
        minOffsetHeight = minHeight + verticalOffset;
        offsetWidth = contentWidth + horizontalOffset;
        offsetHeight = contentHeight + verticalOffset;
      }
      clientWidth = contentWidth + horizontalPadding;
      clientHeight = contentHeight + verticalPadding;
    }
  }
  return {
    svg,
    offsetWidth,
    offsetHeight,
    clientWidth,
    clientHeight,
    contentWidth,
    contentHeight,
    inlineCSSWidth,
    inlineCSSHeight,
    cssWidth,
    cssHeight,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    minOffsetWidth,
    minOffsetHeight,
    maxOffsetWidth,
    maxOffsetHeight
  };
}
function getRotationRad(poses, direction) {
  return getRad(direction > 0 ? poses[0] : poses[1], direction > 0 ? poses[1] : poses[0]);
}
function resetClientRect() {
  return {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    right: 0,
    bottom: 0,
    clientLeft: 0,
    clientTop: 0,
    clientWidth: 0,
    clientHeight: 0,
    scrollWidth: 0,
    scrollHeight: 0
  };
}
function getExtendsRect(el, rect) {
  var isRoot = el === getDocumentBody(el) || el === getDocumentElement(el);
  var extendsRect = {
    clientLeft: el.clientLeft,
    clientTop: el.clientTop,
    clientWidth: el.clientWidth,
    clientHeight: el.clientHeight,
    scrollWidth: el.scrollWidth,
    scrollHeight: el.scrollHeight,
    overflow: false
  };
  if (isRoot) {
    extendsRect.clientHeight = Math.max(rect.height, extendsRect.clientHeight);
    extendsRect.scrollHeight = Math.max(rect.height, extendsRect.scrollHeight);
  }
  extendsRect.overflow = getCachedStyle(el)("overflow") !== "visible";
  return __assign6(__assign6({}, rect), extendsRect);
}
function getClientRectByPosition(position, base, el, isExtends) {
  var left = position.left, right = position.right, top = position.top, bottom = position.bottom;
  var baseTop = base.top;
  var baseLeft = base.left;
  var rect = {
    left: baseLeft + left,
    top: baseTop + top,
    right: baseLeft + right,
    bottom: baseTop + bottom,
    width: right - left,
    height: bottom - top
  };
  if (el && isExtends) {
    return getExtendsRect(el, rect);
  }
  return rect;
}
function getClientRect(el, isExtends) {
  var left = 0;
  var top = 0;
  var width = 0;
  var height = 0;
  if (el) {
    var clientRect = el.getBoundingClientRect();
    left = clientRect.left;
    top = clientRect.top;
    width = clientRect.width;
    height = clientRect.height;
  }
  var rect = {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height
  };
  if (el && isExtends) {
    return getExtendsRect(el, rect);
  }
  return rect;
}
function getTotalOrigin(moveable) {
  var _a = moveable.props, groupable = _a.groupable, svgOrigin = _a.svgOrigin;
  var _b = moveable.getState(), offsetWidth = _b.offsetWidth, offsetHeight = _b.offsetHeight, svg = _b.svg, transformOrigin = _b.transformOrigin;
  if (!groupable && svg && svgOrigin) {
    return convertTransformOriginArray(svgOrigin, offsetWidth, offsetHeight);
  }
  return transformOrigin;
}
function getTotalDirection(parentDirection, isPinch, inputEvent, datas) {
  var direction;
  if (parentDirection) {
    direction = parentDirection;
  } else if (isPinch) {
    direction = [0, 0];
  } else {
    var target = inputEvent.target;
    direction = getDirection(target, datas);
  }
  return direction;
}
function getDirection(target, datas) {
  if (!target) {
    return;
  }
  var deg = target.getAttribute("data-rotation") || "";
  var direciton = target.getAttribute("data-direction");
  datas.deg = deg;
  if (!direciton) {
    return;
  }
  var dir = [0, 0];
  direciton.indexOf("w") > -1 && (dir[0] = -1);
  direciton.indexOf("e") > -1 && (dir[0] = 1);
  direciton.indexOf("n") > -1 && (dir[1] = -1);
  direciton.indexOf("s") > -1 && (dir[1] = 1);
  return dir;
}
function getAbsolutePoses(poses, dist) {
  return [
    plus(dist, poses[0]),
    plus(dist, poses[1]),
    plus(dist, poses[2]),
    plus(dist, poses[3])
  ];
}
function getAbsolutePosesByState(_a) {
  var left = _a.left, top = _a.top, pos1 = _a.pos1, pos2 = _a.pos2, pos3 = _a.pos3, pos4 = _a.pos4;
  return getAbsolutePoses([pos1, pos2, pos3, pos4], [left, top]);
}
function unsetAbles(self, isControl) {
  self[isControl ? "controlAbles" : "targetAbles"].forEach(function(able) {
    able.unset && able.unset(self);
  });
}
function unsetGesto(self, isControl) {
  var gestoName = isControl ? "controlGesto" : "targetGesto";
  var gesto = self[gestoName];
  if ((gesto === null || gesto === void 0 ? void 0 : gesto.isIdle()) === false) {
    unsetAbles(self, isControl);
  }
  gesto === null || gesto === void 0 ? void 0 : gesto.unset();
  self[gestoName] = null;
}
function fillCSSObject(style, resolvedEvent) {
  if (resolvedEvent) {
    var originalDatas = getBeforeRenderableDatas(resolvedEvent);
    originalDatas.nextStyle = __assign6(__assign6({}, originalDatas.nextStyle), style);
  }
  return {
    style,
    cssText: getKeys(style).map(function(name) {
      return "".concat(decamelize(name, "-"), ": ").concat(style[name], ";");
    }).join("")
  };
}
function fillAfterTransform(prevEvent, nextEvent, resolvedEvent) {
  var afterTransform = nextEvent.afterTransform || nextEvent.transform;
  return __assign6(__assign6({}, fillCSSObject(__assign6(__assign6(__assign6({}, prevEvent.style), nextEvent.style), { transform: afterTransform }), resolvedEvent)), { afterTransform, transform: prevEvent.transform });
}
function fillParams(moveable, e, params, isBeforeEvent) {
  var datas = e.datas;
  if (!datas.datas) {
    datas.datas = {};
  }
  var nextParams = __assign6(__assign6({}, params), { target: moveable.state.target, clientX: e.clientX, clientY: e.clientY, inputEvent: e.inputEvent, currentTarget: moveable, moveable, datas: datas.datas, isRequest: e.isRequest, isRequestChild: e.isRequestChild, isFirstDrag: !!e.isFirstDrag, isTrusted: e.isTrusted !== false, stopAble: function() {
    datas.isEventStart = false;
  }, stopDrag: function() {
    var _a;
    (_a = e.stop) === null || _a === void 0 ? void 0 : _a.call(e);
  } });
  if (!datas.isStartEvent) {
    datas.isStartEvent = true;
  } else if (!isBeforeEvent) {
    datas.lastEvent = nextParams;
  }
  return nextParams;
}
function fillEndParams(moveable, e, params) {
  var datas = e.datas;
  var isDrag = "isDrag" in params ? params.isDrag : e.isDrag;
  if (!datas.datas) {
    datas.datas = {};
  }
  return __assign6(__assign6({ isDrag }, params), { moveable, target: moveable.state.target, clientX: e.clientX, clientY: e.clientY, inputEvent: e.inputEvent, currentTarget: moveable, lastEvent: datas.lastEvent, isDouble: e.isDouble, datas: datas.datas, isFirstDrag: !!e.isFirstDrag });
}
function catchEvent(moveable, name, callback) {
  moveable._emitter.on(name, callback);
}
function triggerEvent(moveable, name, params, isManager, isRequest) {
  return moveable.triggerEvent(name, params, isManager, isRequest);
}
function getComputedStyle2(el, pseudoElt) {
  return getWindow(el).getComputedStyle(el, pseudoElt);
}
function filterAbles(ables, methods, triggerAblesSimultaneously) {
  var enabledAbles = {};
  var ableGroups = {};
  return ables.filter(function(able) {
    var name = able.name;
    if (enabledAbles[name] || !methods.some(function(method) {
      return able[method];
    })) {
      return false;
    }
    if (!triggerAblesSimultaneously && able.ableGroup) {
      if (ableGroups[able.ableGroup]) {
        return false;
      }
      ableGroups[able.ableGroup] = true;
    }
    enabledAbles[name] = true;
    return true;
  });
}
function equals(a1, a2) {
  return a1 === a2 || a1 == null && a2 == null;
}
function selectValue() {
  var values = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    values[_i] = arguments[_i];
  }
  var length = values.length - 1;
  for (var i = 0; i < length; ++i) {
    var value = values[i];
    if (!isUndefined(value)) {
      return value;
    }
  }
  return values[length];
}
function groupBy(arr, func) {
  var groups = [];
  var groupKeys = [];
  arr.forEach(function(el, index) {
    var groupKey = func(el, index, arr);
    var keyIndex = groupKeys.indexOf(groupKey);
    var group = groups[keyIndex] || [];
    if (keyIndex === -1) {
      groupKeys.push(groupKey);
      groups.push(group);
    }
    group.push(el);
  });
  return groups;
}
function groupByMap(arr, func) {
  var groups = [];
  var groupKeys = {};
  arr.forEach(function(el, index) {
    var groupKey = func(el, index, arr);
    var group = groupKeys[groupKey];
    if (!group) {
      group = [];
      groupKeys[groupKey] = group;
      groups.push(group);
    }
    group.push(el);
  });
  return groups;
}
function flat(arr) {
  return arr.reduce(function(prev, cur) {
    return prev.concat(cur);
  }, []);
}
function maxOffset() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  args.sort(function(a, b) {
    return abs(b) - abs(a);
  });
  return args[0];
}
function calculateInversePosition(matrix, pos, n) {
  return calculate(invert(matrix, n), convertPositionMatrix(pos, n), n);
}
function convertDragDist(state, e) {
  var _a;
  var is3d = state.is3d, rootMatrix = state.rootMatrix;
  var n = is3d ? 4 : 3;
  _a = __read(calculateInversePosition(rootMatrix, [e.distX, e.distY], n), 2), e.distX = _a[0], e.distY = _a[1];
  return e;
}
function calculatePadding(matrix, pos, added, n) {
  if (!added[0] && !added[1]) {
    return pos;
  }
  var xAdded = calculatePosition(matrix, [normalized(added[0]), 0], n);
  var yAdded = calculatePosition(matrix, [0, normalized(added[1])], n);
  var nextAdded = calculatePosition(matrix, [
    added[0] / getDistSize(xAdded),
    added[1] / getDistSize(yAdded)
  ], n);
  return plus(pos, nextAdded);
}
function convertCSSSize(value, size, isRelative) {
  return isRelative ? "".concat(value / size * 100, "%") : "".concat(value, "px");
}
function getTinyDist(v) {
  return abs(v) <= TINY_NUM2 ? 0 : v;
}
function getDirectionViewClassName(ableName) {
  return function(moveable) {
    if (!moveable.isDragging(ableName)) {
      return "";
    }
    var data = getGestoData(moveable, ableName);
    var deg = data.deg;
    if (!deg) {
      return "";
    }
    return prefix("view-control-rotation".concat(deg));
  };
}
function getDirectionCondition(ableName, checkAbles) {
  if (checkAbles === void 0) {
    checkAbles = [ableName];
  }
  return function(moveable, e) {
    if (e.isRequest) {
      if (checkAbles.some(function(name) {
        return e.requestAble === name;
      })) {
        return e.parentDirection;
      } else {
        return false;
      }
    }
    var target = e.inputEvent.target;
    return hasClass(target, prefix("direction")) && (!ableName || hasClass(target, prefix(ableName)));
  };
}
function convertTransformInfo(transforms, state, index) {
  var _a;
  var matrixInfos = parse(transforms, {
    "x%": function(v) {
      return v / 100 * state.offsetWidth;
    },
    "y%": function(v) {
      return v / 100 * state.offsetHeight;
    }
  });
  var beforeFunctionTexts = transforms.slice(0, index < 0 ? void 0 : index);
  var beforeFunctionTexts2 = transforms.slice(0, index < 0 ? void 0 : index + 1);
  var targetFunctionText = transforms[index] || "";
  var afterFunctionTexts = index < 0 ? [] : transforms.slice(index);
  var afterFunctionTexts2 = index < 0 ? [] : transforms.slice(index + 1);
  var beforeFunctions = matrixInfos.slice(0, index < 0 ? void 0 : index);
  var beforeFunctions2 = matrixInfos.slice(0, index < 0 ? void 0 : index + 1);
  var targetFunction = (_a = matrixInfos[index]) !== null && _a !== void 0 ? _a : parse([""])[0];
  var afterFunctions = index < 0 ? [] : matrixInfos.slice(index);
  var afterFunctions2 = index < 0 ? [] : matrixInfos.slice(index + 1);
  var targetFunctions = targetFunction ? [targetFunction] : [];
  var beforeFunctionMatrix = toMat(beforeFunctions);
  var beforeFunctionMatrix2 = toMat(beforeFunctions2);
  var afterFunctionMatrix = toMat(afterFunctions);
  var afterFunctionMatrix2 = toMat(afterFunctions2);
  var allFunctionMatrix = multiply(beforeFunctionMatrix, afterFunctionMatrix, 4);
  return {
    transforms,
    beforeFunctionMatrix,
    beforeFunctionMatrix2,
    targetFunctionMatrix: toMat(targetFunctions),
    afterFunctionMatrix,
    afterFunctionMatrix2,
    allFunctionMatrix,
    beforeFunctions,
    beforeFunctions2,
    targetFunction: targetFunctions[0],
    afterFunctions,
    afterFunctions2,
    beforeFunctionTexts,
    beforeFunctionTexts2,
    targetFunctionText,
    afterFunctionTexts,
    afterFunctionTexts2
  };
}
function isArrayFormat(arr) {
  if (!arr || !isObject(arr)) {
    return false;
  }
  if (isNode(arr)) {
    return false;
  }
  return isArray(arr) || "length" in arr;
}
function getRefTarget(target, isSelector) {
  if (!target) {
    return null;
  }
  if (isNode(target)) {
    return target;
  }
  if (isString(target)) {
    if (isSelector) {
      return document.querySelector(target);
    }
    return target;
  }
  if (isFunction(target)) {
    return target();
  }
  if (isWindow(target)) {
    return target;
  }
  if ("current" in target) {
    return target.current;
  }
  return target;
}
function getRefTargets(targets, isSelector) {
  if (!targets) {
    return [];
  }
  var userTargets = isArrayFormat(targets) ? [].slice.call(targets) : [targets];
  return userTargets.reduce(function(prev, target) {
    if (isString(target) && isSelector) {
      return __spreadArray(__spreadArray([], __read(prev), false), __read([].slice.call(document.querySelectorAll(target))), false);
    }
    if (isArray(target)) {
      prev.push(getRefTargets(target, isSelector));
    } else {
      prev.push(getRefTarget(target, isSelector));
    }
    return prev;
  }, []);
}
function getAbsoluteRotation(pos1, pos2, direction) {
  var deg = getRad(pos1, pos2) / Math.PI * 180;
  deg = direction >= 0 ? deg : 180 - deg;
  deg = deg >= 0 ? deg : 360 + deg;
  return deg;
}
function getDragDistByState(state, dist) {
  var rootMatrix = state.rootMatrix, is3d = state.is3d;
  var n = is3d ? 4 : 3;
  var inverseMatrix = invert(rootMatrix, n);
  if (!is3d) {
    inverseMatrix = convertDimension(inverseMatrix, 3, 4);
  }
  inverseMatrix[12] = 0;
  inverseMatrix[13] = 0;
  inverseMatrix[14] = 0;
  return calculateMatrixDist(inverseMatrix, dist);
}
function getSizeDistByDist(startSize, dist, ratio, direction, keepRatio) {
  var _a = __read(startSize, 2), startOffsetWidth = _a[0], startOffsetHeight = _a[1];
  var distWidth = 0;
  var distHeight = 0;
  if (keepRatio && startOffsetWidth && startOffsetHeight) {
    var rad = getRad([0, 0], dist);
    var standardRad = getRad([0, 0], direction);
    var size = getDistSize(dist);
    var signSize = Math.cos(rad - standardRad) * size;
    if (!direction[0]) {
      distHeight = signSize;
      distWidth = distHeight * ratio;
    } else if (!direction[1]) {
      distWidth = signSize;
      distHeight = distWidth / ratio;
    } else {
      var startWidthSize = direction[0] * startOffsetWidth;
      var startHeightSize = direction[1] * startOffsetHeight;
      var secondRad = Math.atan2(startWidthSize + dist[0], startHeightSize + dist[1]);
      var firstRad = Math.atan2(startWidthSize, startHeightSize);
      if (secondRad < 0) {
        secondRad += Math.PI * 2;
      }
      if (firstRad < 0) {
        firstRad += Math.PI * 2;
      }
      var rad_1 = 0;
      if (abs(secondRad - firstRad) < Math.PI / 2 || abs(secondRad - firstRad) > Math.PI / 2 * 3) {
        rad_1 = secondRad - firstRad;
      } else {
        firstRad += Math.PI;
        rad_1 = secondRad - firstRad;
      }
      if (rad_1 > Math.PI * 2) {
        rad_1 -= Math.PI * 2;
      } else if (rad_1 > Math.PI) {
        rad_1 = 2 * Math.PI - rad_1;
      } else if (rad_1 < -Math.PI) {
        rad_1 = -2 * Math.PI - rad_1;
      }
      var distSize = getDistSize([startWidthSize + dist[0], startHeightSize + dist[1]]) * Math.cos(rad_1);
      distWidth = distSize * Math.sin(firstRad) - startWidthSize;
      distHeight = distSize * Math.cos(firstRad) - startHeightSize;
      if (direction[0] < 0) {
        distWidth *= -1;
      }
      if (direction[1] < 0) {
        distHeight *= -1;
      }
    }
  } else {
    distWidth = direction[0] * dist[0];
    distHeight = direction[1] * dist[1];
  }
  return [distWidth, distHeight];
}
function getOffsetSizeDist(sizeDirection, keepRatio, datas, e) {
  var _a;
  var ratio = datas.ratio, startOffsetWidth = datas.startOffsetWidth, startOffsetHeight = datas.startOffsetHeight;
  var distWidth = 0;
  var distHeight = 0;
  var distX = e.distX, distY = e.distY, pinchScale = e.pinchScale, parentDistance = e.parentDistance, parentDist = e.parentDist, parentScale = e.parentScale;
  var startFixedDirection = datas.fixedDirection;
  var directionsDists = [0, 1].map(function(index) {
    return abs(sizeDirection[index] - startFixedDirection[index]);
  });
  var directionRatios = [0, 1].map(function(index) {
    var dist = directionsDists[index];
    if (dist !== 0) {
      dist = 2 / dist;
    }
    return dist;
  });
  if (parentDist) {
    distWidth = parentDist[0];
    distHeight = parentDist[1];
    if (keepRatio) {
      if (!distWidth) {
        distWidth = distHeight * ratio;
      } else if (!distHeight) {
        distHeight = distWidth / ratio;
      }
    }
  } else if (isNumber(pinchScale)) {
    distWidth = (pinchScale - 1) * startOffsetWidth;
    distHeight = (pinchScale - 1) * startOffsetHeight;
  } else if (parentScale) {
    distWidth = (parentScale[0] - 1) * startOffsetWidth;
    distHeight = (parentScale[1] - 1) * startOffsetHeight;
  } else if (parentDistance) {
    var scaleX = startOffsetWidth * directionsDists[0];
    var scaleY = startOffsetHeight * directionsDists[1];
    var ratioDistance = getDistSize([scaleX, scaleY]);
    distWidth = parentDistance / ratioDistance * scaleX * directionRatios[0];
    distHeight = parentDistance / ratioDistance * scaleY * directionRatios[1];
  } else {
    var dist_1 = getDragDist({ datas, distX, distY });
    dist_1 = directionRatios.map(function(ratio2, i) {
      return dist_1[i] * ratio2;
    });
    _a = __read(getSizeDistByDist([startOffsetWidth, startOffsetHeight], dist_1, ratio, sizeDirection, keepRatio), 2), distWidth = _a[0], distHeight = _a[1];
  }
  return {
    // direction,
    // sizeDirection,
    distWidth,
    distHeight
  };
}
function convertTransformUnit(origin, xy) {
  if (xy) {
    if (origin === "left") {
      return { x: "0%", y: "50%" };
    } else if (origin === "top") {
      return { x: "50%", y: "50%" };
    } else if (origin === "center") {
      return { x: "50%", y: "50%" };
    } else if (origin === "right") {
      return { x: "100%", y: "50%" };
    } else if (origin === "bottom") {
      return { x: "50%", y: "100%" };
    }
    var _a = __read(origin.split(" "), 2), left = _a[0], right = _a[1];
    var leftOrigin = convertTransformUnit(left || "");
    var rightOrigin = convertTransformUnit(right || "");
    var originObject = __assign6(__assign6({}, leftOrigin), rightOrigin);
    var nextOriginObject = {
      x: "50%",
      y: "50%"
    };
    if (originObject.x) {
      nextOriginObject.x = originObject.x;
    }
    if (originObject.y) {
      nextOriginObject.y = originObject.y;
    }
    if (originObject.value) {
      if (originObject.x && !originObject.y) {
        nextOriginObject.y = originObject.value;
      }
      if (!originObject.x && originObject.y) {
        nextOriginObject.x = originObject.value;
      }
    }
    return nextOriginObject;
  }
  if (origin === "left") {
    return { x: "0%" };
  }
  if (origin === "right") {
    return { x: "100%" };
  }
  if (origin === "top") {
    return { y: "0%" };
  }
  if (origin === "bottom") {
    return { y: "100%" };
  }
  if (!origin) {
    return {};
  }
  if (origin === "center") {
    return { value: "50%" };
  }
  return { value: origin };
}
function convertTransformOriginArray(transformOrigin, width, height) {
  var _a = convertTransformUnit(transformOrigin, true), x = _a.x, y = _a.y;
  return [
    convertUnitSize(x, width) || 0,
    convertUnitSize(y, height) || 0
  ];
}
function rotatePosesInfo(poses, origin, rad) {
  var prevPoses = poses.map(function(pos) {
    return minus(pos, origin);
  });
  var nextPoses = prevPoses.map(function(pos) {
    return rotate(pos, rad);
  });
  return {
    prev: prevPoses,
    next: nextPoses,
    result: nextPoses.map(function(pos) {
      return plus(pos, origin);
    })
  };
}
function isDeepArrayEquals(arr1, arr2) {
  return arr1.length === arr2.length && arr1.every(function(value1, i) {
    var value2 = arr2[i];
    var isArray1 = isArray(value1);
    var isArray2 = isArray(value2);
    if (isArray1 && isArray2) {
      return isDeepArrayEquals(value1, value2);
    } else if (!isArray1 && !isArray2) {
      return value1 === value2;
    }
    return false;
  });
}
function watchValue(moveable, property, nextValue, valueKey, defaultValue) {
  var store = moveable._store;
  var prevValue = store[property];
  if (!(property in store)) {
    if (defaultValue != null) {
      store[property] = defaultValue;
      prevValue = defaultValue;
    } else {
      store[property] = nextValue;
      return nextValue;
    }
  }
  if (prevValue === nextValue || valueKey(prevValue) === valueKey(nextValue)) {
    return prevValue;
  }
  store[property] = nextValue;
  return nextValue;
}
function sign(value) {
  return value >= 0 ? 1 : -1;
}
function abs(value) {
  return Math.abs(value);
}
function countEach(count, callback) {
  return counter(count).map(function(index) {
    return callback(index);
  });
}
function getPaddingBox(padding) {
  if (isNumber(padding)) {
    return {
      top: padding,
      left: padding,
      right: padding,
      bottom: padding
    };
  }
  return {
    left: padding.left || 0,
    top: padding.top || 0,
    right: padding.right || 0,
    bottom: padding.bottom || 0
  };
}
var Pinchable = makeAble("pinchable", {
  props: [
    "pinchable"
  ],
  events: [
    "pinchStart",
    "pinch",
    "pinchEnd",
    "pinchGroupStart",
    "pinchGroup",
    "pinchGroupEnd"
  ],
  dragStart: function() {
    return true;
  },
  pinchStart: function(moveable, e) {
    var datas = e.datas, targets = e.targets, angle = e.angle, originalDatas = e.originalDatas;
    var _a = moveable.props, pinchable = _a.pinchable, ables = _a.ables;
    if (!pinchable) {
      return false;
    }
    var eventName = "onPinch".concat(targets ? "Group" : "", "Start");
    var controlEventName = "drag".concat(targets ? "Group" : "", "ControlStart");
    var pinchAbles = (pinchable === true ? moveable.controlAbles : ables.filter(function(able) {
      return pinchable.indexOf(able.name) > -1;
    })).filter(function(able) {
      return able.canPinch && able[controlEventName];
    });
    var params = fillParams(moveable, e, {});
    if (targets) {
      params.targets = targets;
    }
    var result = triggerEvent(moveable, eventName, params);
    datas.isPinch = result !== false;
    datas.ables = pinchAbles;
    var isPinch = datas.isPinch;
    if (!isPinch) {
      return false;
    }
    pinchAbles.forEach(function(able) {
      originalDatas[able.name] = originalDatas[able.name] || {};
      if (!able[controlEventName]) {
        return;
      }
      var ableEvent = __assign6(__assign6({}, e), { datas: originalDatas[able.name], parentRotate: angle, isPinch: true });
      able[controlEventName](moveable, ableEvent);
    });
    moveable.state.snapRenderInfo = {
      request: e.isRequest,
      direction: [0, 0]
    };
    return isPinch;
  },
  pinch: function(moveable, e) {
    var datas = e.datas, pinchScale = e.scale, distance = e.distance, originalDatas = e.originalDatas, inputEvent = e.inputEvent, targets = e.targets, angle = e.angle;
    if (!datas.isPinch) {
      return;
    }
    var parentDistance = distance * (1 - 1 / pinchScale);
    var params = fillParams(moveable, e, {});
    if (targets) {
      params.targets = targets;
    }
    var eventName = "onPinch".concat(targets ? "Group" : "");
    triggerEvent(moveable, eventName, params);
    var ables = datas.ables;
    var controlEventName = "drag".concat(targets ? "Group" : "", "Control");
    ables.forEach(function(able) {
      if (!able[controlEventName]) {
        return;
      }
      able[controlEventName](moveable, __assign6(__assign6({}, e), { datas: originalDatas[able.name], inputEvent, resolveMatrix: true, pinchScale, parentDistance, parentRotate: angle, isPinch: true }));
    });
    return params;
  },
  pinchEnd: function(moveable, e) {
    var datas = e.datas, isPinch = e.isPinch, inputEvent = e.inputEvent, targets = e.targets, originalDatas = e.originalDatas;
    if (!datas.isPinch) {
      return;
    }
    var eventName = "onPinch".concat(targets ? "Group" : "", "End");
    var params = fillEndParams(moveable, e, { isDrag: isPinch });
    if (targets) {
      params.targets = targets;
    }
    triggerEvent(moveable, eventName, params);
    var ables = datas.ables;
    var controlEventName = "drag".concat(targets ? "Group" : "", "ControlEnd");
    ables.forEach(function(able) {
      if (!able[controlEventName]) {
        return;
      }
      able[controlEventName](moveable, __assign6(__assign6({}, e), { isDrag: isPinch, datas: originalDatas[able.name], inputEvent, isPinch: true }));
    });
    return isPinch;
  },
  pinchGroupStart: function(moveable, e) {
    return this.pinchStart(moveable, __assign6(__assign6({}, e), { targets: moveable.props.targets }));
  },
  pinchGroup: function(moveable, e) {
    return this.pinch(moveable, __assign6(__assign6({}, e), { targets: moveable.props.targets }));
  },
  pinchGroupEnd: function(moveable, e) {
    return this.pinchEnd(moveable, __assign6(__assign6({}, e), { targets: moveable.props.targets }));
  }
});
var directionCondition = getDirectionCondition("scalable");
var Scalable = {
  name: "scalable",
  ableGroup: "size",
  canPinch: true,
  props: [
    "scalable",
    "throttleScale",
    "renderDirections",
    "keepRatio",
    "edge",
    "displayAroundControls"
  ],
  events: [
    "scaleStart",
    "beforeScale",
    "scale",
    "scaleEnd",
    "scaleGroupStart",
    "beforeScaleGroup",
    "scaleGroup",
    "scaleGroupEnd"
  ],
  render: getRenderDirections("scalable"),
  dragControlCondition: directionCondition,
  viewClassName: getDirectionViewClassName("scalable"),
  dragControlStart: function(moveable, e) {
    var datas = e.datas, isPinch = e.isPinch, inputEvent = e.inputEvent, parentDirection = e.parentDirection;
    var direction = getTotalDirection(parentDirection, isPinch, inputEvent, datas);
    var _a = moveable.state, width = _a.width, height = _a.height, targetTransform = _a.targetTransform, target = _a.target, pos1 = _a.pos1, pos2 = _a.pos2, pos4 = _a.pos4;
    if (!direction || !target) {
      return false;
    }
    if (!isPinch) {
      setDragStart(moveable, e);
    }
    datas.datas = {};
    datas.transform = targetTransform;
    datas.prevDist = [1, 1];
    datas.direction = direction;
    datas.startOffsetWidth = width;
    datas.startOffsetHeight = height;
    datas.startValue = [1, 1];
    var isWidth = !direction[0] && !direction[1] || direction[0] || !direction[1];
    setDefaultTransformIndex(moveable, e, "scale");
    datas.isWidth = isWidth;
    function setRatio(ratio) {
      datas.ratio = ratio && isFinite(ratio) ? ratio : 0;
    }
    datas.startPositions = getAbsolutePosesByState(moveable.state);
    function setFixedDirection(fixedDirection) {
      var result2 = getFixedDirectionInfo(datas.startPositions, fixedDirection);
      datas.fixedDirection = result2.fixedDirection;
      datas.fixedPosition = result2.fixedPosition;
      datas.fixedOffset = result2.fixedOffset;
    }
    datas.setFixedDirection = setFixedDirection;
    setRatio(getDist(pos1, pos2) / getDist(pos2, pos4));
    setFixedDirection([-direction[0], -direction[1]]);
    var setMinScaleSize = function(min) {
      datas.minScaleSize = min;
    };
    var setMaxScaleSize = function(max) {
      datas.maxScaleSize = max;
    };
    setMinScaleSize([-Infinity, -Infinity]);
    setMaxScaleSize([Infinity, Infinity]);
    var params = fillParams(moveable, e, __assign6(__assign6({ direction, set: function(scale) {
      datas.startValue = scale;
    }, setRatio, setFixedDirection, setMinScaleSize, setMaxScaleSize }, fillTransformStartEvent(moveable, e)), { dragStart: Draggable.dragStart(moveable, new CustomGesto().dragStart([0, 0], e)) }));
    var result = triggerEvent(moveable, "onScaleStart", params);
    datas.startFixedDirection = datas.fixedDirection;
    if (result !== false) {
      datas.isScale = true;
      moveable.state.snapRenderInfo = {
        request: e.isRequest,
        direction
      };
    }
    return datas.isScale ? params : false;
  },
  dragControl: function(moveable, e) {
    resolveTransformEvent(moveable, e, "scale");
    var datas = e.datas, parentKeepRatio = e.parentKeepRatio, parentFlag = e.parentFlag, isPinch = e.isPinch, dragClient = e.dragClient, isRequest = e.isRequest, useSnap = e.useSnap, resolveMatrix = e.resolveMatrix;
    var prevDist = datas.prevDist, direction = datas.direction, startOffsetWidth = datas.startOffsetWidth, startOffsetHeight = datas.startOffsetHeight, isScale = datas.isScale, startValue = datas.startValue, isWidth = datas.isWidth, ratio = datas.ratio;
    if (!isScale) {
      return false;
    }
    var props = moveable.props;
    var throttleScale = props.throttleScale, parentMoveable = props.parentMoveable;
    var sizeDirection = direction;
    if (!direction[0] && !direction[1]) {
      sizeDirection = [1, 1];
    }
    var keepRatio = ratio && (parentKeepRatio != null ? parentKeepRatio : props.keepRatio) || false;
    var state = moveable.state;
    var tempScaleValue = [
      startValue[0],
      startValue[1]
    ];
    function getNextScale() {
      var _a = getOffsetSizeDist(sizeDirection, keepRatio, datas, e), distWidth = _a.distWidth, distHeight = _a.distHeight;
      var distX = startOffsetWidth ? (startOffsetWidth + distWidth) / startOffsetWidth : 1;
      var distY = startOffsetHeight ? (startOffsetHeight + distHeight) / startOffsetHeight : 1;
      if (!startValue[0]) {
        tempScaleValue[0] = distWidth / startOffsetWidth;
      }
      if (!startValue[1]) {
        tempScaleValue[1] = distHeight / startOffsetHeight;
      }
      var scaleX = (sizeDirection[0] || keepRatio ? distX : 1) * tempScaleValue[0];
      var scaleY = (sizeDirection[1] || keepRatio ? distY : 1) * tempScaleValue[1];
      if (scaleX === 0) {
        scaleX = sign(prevDist[0]) * MIN_SCALE;
      }
      if (scaleY === 0) {
        scaleY = sign(prevDist[1]) * MIN_SCALE;
      }
      return [scaleX, scaleY];
    }
    var scale = getNextScale();
    if (!isPinch && moveable.props.groupable) {
      var snapRenderInfo = state.snapRenderInfo || {};
      var stateDirection = snapRenderInfo.direction;
      if (isArray(stateDirection) && (stateDirection[0] || stateDirection[1])) {
        state.snapRenderInfo = { direction, request: e.isRequest };
      }
    }
    triggerEvent(moveable, "onBeforeScale", fillParams(moveable, e, {
      scale,
      setFixedDirection: function(nextFixedDirection) {
        datas.setFixedDirection(nextFixedDirection);
        scale = getNextScale();
        return scale;
      },
      startFixedDirection: datas.startFixedDirection,
      setScale: function(nextScale) {
        scale = nextScale;
      }
    }, true));
    var dist = [
      scale[0] / tempScaleValue[0],
      scale[1] / tempScaleValue[1]
    ];
    var fixedPosition = dragClient;
    var snapDist = [0, 0];
    var isSelfPinch = !dragClient && !parentFlag && isPinch;
    if (isSelfPinch || resolveMatrix) {
      fixedPosition = getTranslateFixedPosition(moveable, datas.targetAllTransform, [0, 0], [0, 0], datas);
    } else if (!dragClient) {
      fixedPosition = datas.fixedPosition;
    }
    if (!isPinch) {
      snapDist = checkSnapScale(moveable, dist, direction, !useSnap && isRequest, datas);
    }
    if (keepRatio) {
      if (sizeDirection[0] && sizeDirection[1] && snapDist[0] && snapDist[1]) {
        if (Math.abs(snapDist[0] * startOffsetWidth) > Math.abs(snapDist[1] * startOffsetHeight)) {
          snapDist[1] = 0;
        } else {
          snapDist[0] = 0;
        }
      }
      var isNoSnap = !snapDist[0] && !snapDist[1];
      if (isNoSnap) {
        if (isWidth) {
          dist[0] = throttle(dist[0] * tempScaleValue[0], throttleScale) / tempScaleValue[0];
        } else {
          dist[1] = throttle(dist[1] * tempScaleValue[1], throttleScale) / tempScaleValue[1];
        }
      }
      if (sizeDirection[0] && !sizeDirection[1] || snapDist[0] && !snapDist[1] || isNoSnap && isWidth) {
        dist[0] += snapDist[0];
        var snapHeight = startOffsetWidth * dist[0] * tempScaleValue[0] / ratio;
        dist[1] = snapHeight / startOffsetHeight / tempScaleValue[1];
      } else if (!sizeDirection[0] && sizeDirection[1] || !snapDist[0] && snapDist[1] || isNoSnap && !isWidth) {
        dist[1] += snapDist[1];
        var snapWidth = startOffsetHeight * dist[1] * tempScaleValue[1] * ratio;
        dist[0] = snapWidth / startOffsetWidth / tempScaleValue[0];
      }
    } else {
      dist[0] += snapDist[0];
      dist[1] += snapDist[1];
      if (!snapDist[0]) {
        dist[0] = throttle(dist[0] * tempScaleValue[0], throttleScale) / tempScaleValue[0];
      }
      if (!snapDist[1]) {
        dist[1] = throttle(dist[1] * tempScaleValue[1], throttleScale) / tempScaleValue[1];
      }
    }
    if (dist[0] === 0) {
      dist[0] = sign(prevDist[0]) * MIN_SCALE;
    }
    if (dist[1] === 0) {
      dist[1] = sign(prevDist[1]) * MIN_SCALE;
    }
    scale = multiply2(dist, [tempScaleValue[0], tempScaleValue[1]]);
    var startOffsetSize = [
      startOffsetWidth,
      startOffsetHeight
    ];
    var scaleSize = [
      startOffsetWidth * scale[0],
      startOffsetHeight * scale[1]
    ];
    scaleSize = calculateBoundSize(scaleSize, datas.minScaleSize, datas.maxScaleSize, keepRatio ? ratio : false);
    scale = countEach(2, function(i) {
      return startOffsetSize[i] ? scaleSize[i] / startOffsetSize[i] : scaleSize[i];
    });
    dist = countEach(2, function(i) {
      return scale[i] / tempScaleValue[i];
    });
    var delta = countEach(2, function(i) {
      return prevDist[i] ? dist[i] / prevDist[i] : dist[i];
    });
    var distText = "scale(".concat(dist.join(", "), ")");
    var scaleText = "scale(".concat(scale.join(", "), ")");
    var nextTransform = convertTransformFormat(datas, scaleText, distText);
    var isZeroScale = !startValue[0] || !startValue[1];
    var inverseDist = getScaleDist(moveable, isZeroScale ? scaleText : distText, datas.fixedDirection, fixedPosition, datas.fixedOffset, datas, isZeroScale);
    var inverseDelta = isSelfPinch ? inverseDist : minus(inverseDist, datas.prevInverseDist || [0, 0]);
    datas.prevDist = dist;
    datas.prevInverseDist = inverseDist;
    if (scale[0] === prevDist[0] && scale[1] === prevDist[1] && inverseDelta.every(function(num) {
      return !num;
    }) && !parentMoveable && !isSelfPinch) {
      return false;
    }
    var params = fillParams(moveable, e, __assign6({ offsetWidth: startOffsetWidth, offsetHeight: startOffsetHeight, direction, scale, dist, delta, isPinch: !!isPinch }, fillTransformEvent(moveable, nextTransform, inverseDelta, isPinch, e)));
    triggerEvent(moveable, "onScale", params);
    return params;
  },
  dragControlEnd: function(moveable, e) {
    var datas = e.datas;
    if (!datas.isScale) {
      return false;
    }
    datas.isScale = false;
    var scaleEndParam = fillEndParams(moveable, e, {});
    triggerEvent(moveable, "onScaleEnd", scaleEndParam);
    return scaleEndParam;
  },
  dragGroupControlCondition: directionCondition,
  dragGroupControlStart: function(moveable, e) {
    var datas = e.datas;
    var params = this.dragControlStart(moveable, e);
    if (!params) {
      return false;
    }
    var originalEvents = fillChildEvents(moveable, "resizable", e);
    datas.moveableScale = moveable.scale;
    var events = triggerChildAbles(moveable, this, "dragControlStart", e, function(child, ev) {
      return startChildDist(moveable, child, datas, ev);
    });
    var setFixedDirection = function(fixedDirection) {
      params.setFixedDirection(fixedDirection);
      events.forEach(function(ev, i) {
        ev.setFixedDirection(fixedDirection);
        startChildDist(moveable, ev.moveable, datas, originalEvents[i]);
      });
    };
    datas.setFixedDirection = setFixedDirection;
    var nextParams = __assign6(__assign6({}, params), { targets: moveable.props.targets, events, setFixedDirection });
    var result = triggerEvent(moveable, "onScaleGroupStart", nextParams);
    datas.isScale = result !== false;
    return datas.isScale ? nextParams : false;
  },
  dragGroupControl: function(moveable, e) {
    var datas = e.datas;
    if (!datas.isScale) {
      return;
    }
    catchEvent(moveable, "onBeforeScale", function(parentEvent) {
      triggerEvent(moveable, "onBeforeScaleGroup", fillParams(moveable, e, __assign6(__assign6({}, parentEvent), { targets: moveable.props.targets }), true));
    });
    var params = this.dragControl(moveable, e);
    if (!params) {
      return;
    }
    var dist = params.dist;
    var moveableScale = datas.moveableScale;
    moveable.scale = [
      dist[0] * moveableScale[0],
      dist[1] * moveableScale[1]
    ];
    var keepRatio = moveable.props.keepRatio;
    var fixedPosition = datas.fixedPosition;
    var events = triggerChildAbles(moveable, this, "dragControl", e, function(_, ev) {
      var _a = __read(calculate(createRotateMatrix(moveable.rotation / 180 * Math.PI, 3), [
        ev.datas.originalX * dist[0],
        ev.datas.originalY * dist[1],
        1
      ], 3), 2), clientX = _a[0], clientY = _a[1];
      return __assign6(__assign6({}, ev), {
        parentDist: null,
        parentScale: dist,
        parentKeepRatio: keepRatio,
        // recalculate child fixed position for parent group's dragging.
        dragClient: plus(fixedPosition, [clientX, clientY])
      });
    });
    var nextParams = __assign6({ targets: moveable.props.targets, events }, params);
    triggerEvent(moveable, "onScaleGroup", nextParams);
    return nextParams;
  },
  dragGroupControlEnd: function(moveable, e) {
    var isDrag = e.isDrag, datas = e.datas;
    if (!datas.isScale) {
      return;
    }
    this.dragControlEnd(moveable, e);
    var events = triggerChildAbles(moveable, this, "dragControlEnd", e);
    var nextParams = fillEndParams(moveable, e, {
      targets: moveable.props.targets,
      events
    });
    triggerEvent(moveable, "onScaleGroupEnd", nextParams);
    return isDrag;
  },
  /**
       * @method Moveable.Scalable#request
       * @param {Moveable.Scalable.ScalableRequestParam} e - the Scalable's request parameter
       * @return {Moveable.Requester} Moveable Requester
       * @example
  
       * // Instantly Request (requestStart - request - requestEnd)
       * moveable.request("scalable", { deltaWidth: 10, deltaHeight: 10 }, true);
       *
       * // requestStart
       * const requester = moveable.request("scalable");
       *
       * // request
       * requester.request({ deltaWidth: 10, deltaHeight: 10 });
       * requester.request({ deltaWidth: 10, deltaHeight: 10 });
       * requester.request({ deltaWidth: 10, deltaHeight: 10 });
       *
       * // requestEnd
       * requester.requestEnd();
       */
  request: function() {
    var datas = {};
    var distWidth = 0;
    var distHeight = 0;
    var useSnap = false;
    return {
      isControl: true,
      requestStart: function(e) {
        useSnap = e.useSnap;
        return {
          datas,
          parentDirection: e.direction || [1, 1],
          useSnap
        };
      },
      request: function(e) {
        distWidth += e.deltaWidth;
        distHeight += e.deltaHeight;
        return {
          datas,
          parentDist: [distWidth, distHeight],
          parentKeepRatio: e.keepRatio,
          useSnap
        };
      },
      requestEnd: function() {
        return { datas, isDrag: true, useSnap };
      }
    };
  }
};
function getMiddleLinePos(pos1, pos2) {
  return pos1.map(function(pos, i) {
    return dot(pos, pos2[i], 1, 2);
  });
}
function getTriangleRad(pos1, pos2, pos3) {
  var rad1 = getRad(pos1, pos2);
  var rad2 = getRad(pos1, pos3);
  var rad = rad2 - rad1;
  return rad >= 0 ? rad : rad + 2 * Math.PI;
}
function isValidPos(poses1, poses2) {
  var rad1 = getTriangleRad(poses1[0], poses1[1], poses1[2]);
  var rad2 = getTriangleRad(poses2[0], poses2[1], poses2[2]);
  var pi = Math.PI;
  if (rad1 >= pi && rad2 <= pi || rad1 <= pi && rad2 >= pi) {
    return false;
  }
  return true;
}
var Warpable = {
  name: "warpable",
  ableGroup: "size",
  props: [
    "warpable",
    "renderDirections",
    "edge",
    "displayAroundControls"
  ],
  events: [
    "warpStart",
    "warp",
    "warpEnd"
  ],
  viewClassName: getDirectionViewClassName("warpable"),
  render: function(moveable, React3) {
    var _a = moveable.props, resizable = _a.resizable, scalable = _a.scalable, warpable = _a.warpable, zoom = _a.zoom;
    if (resizable || scalable || !warpable) {
      return [];
    }
    var _b = moveable.state, pos1 = _b.pos1, pos2 = _b.pos2, pos3 = _b.pos3, pos4 = _b.pos4;
    var linePosFrom1 = getMiddleLinePos(pos1, pos2);
    var linePosFrom2 = getMiddleLinePos(pos2, pos1);
    var linePosFrom3 = getMiddleLinePos(pos1, pos3);
    var linePosFrom4 = getMiddleLinePos(pos3, pos1);
    var linePosTo1 = getMiddleLinePos(pos3, pos4);
    var linePosTo2 = getMiddleLinePos(pos4, pos3);
    var linePosTo3 = getMiddleLinePos(pos2, pos4);
    var linePosTo4 = getMiddleLinePos(pos4, pos2);
    return __spreadArray([
      React3.createElement("div", { className: prefix("line"), key: "middeLine1", style: getLineStyle(linePosFrom1, linePosTo1, zoom) }),
      React3.createElement("div", { className: prefix("line"), key: "middeLine2", style: getLineStyle(linePosFrom2, linePosTo2, zoom) }),
      React3.createElement("div", { className: prefix("line"), key: "middeLine3", style: getLineStyle(linePosFrom3, linePosTo3, zoom) }),
      React3.createElement("div", { className: prefix("line"), key: "middeLine4", style: getLineStyle(linePosFrom4, linePosTo4, zoom) })
    ], __read(renderAllDirections(moveable, "warpable", React3)), false);
  },
  dragControlCondition: function(moveable, e) {
    if (e.isRequest) {
      return false;
    }
    var target = e.inputEvent.target;
    return hasClass(target, prefix("direction")) && hasClass(target, prefix("warpable"));
  },
  dragControlStart: function(moveable, e) {
    var datas = e.datas, inputEvent = e.inputEvent;
    var target = moveable.props.target;
    var inputTarget = inputEvent.target;
    var direction = getDirection(inputTarget, datas);
    if (!direction || !target) {
      return false;
    }
    var state = moveable.state;
    var transformOrigin = state.transformOrigin, is3d = state.is3d, targetTransform = state.targetTransform, targetMatrix = state.targetMatrix, width = state.width, height = state.height, left = state.left, top = state.top;
    datas.datas = {};
    datas.targetTransform = targetTransform;
    datas.warpTargetMatrix = is3d ? targetMatrix : convertDimension(targetMatrix, 3, 4);
    datas.targetInverseMatrix = ignoreDimension(invert(datas.warpTargetMatrix, 4), 3, 4);
    datas.direction = direction;
    datas.left = left;
    datas.top = top;
    datas.poses = [
      [0, 0],
      [width, 0],
      [0, height],
      [width, height]
    ].map(function(p) {
      return minus(p, transformOrigin);
    });
    datas.nextPoses = datas.poses.map(function(_a) {
      var _b = __read(_a, 2), x = _b[0], y = _b[1];
      return calculate(datas.warpTargetMatrix, [x, y, 0, 1], 4);
    });
    datas.startValue = createIdentityMatrix(4);
    datas.prevMatrix = createIdentityMatrix(4);
    datas.absolutePoses = getAbsolutePosesByState(state);
    datas.posIndexes = getPosIndexesByDirection(direction);
    setDragStart(moveable, e);
    setDefaultTransformIndex(moveable, e, "matrix3d");
    state.snapRenderInfo = {
      request: e.isRequest,
      direction
    };
    var params = fillParams(moveable, e, __assign6({ set: function(matrix) {
      datas.startValue = matrix;
    } }, fillTransformStartEvent(moveable, e)));
    var result = triggerEvent(moveable, "onWarpStart", params);
    if (result !== false) {
      datas.isWarp = true;
    }
    return datas.isWarp;
  },
  dragControl: function(moveable, e) {
    var datas = e.datas, isRequest = e.isRequest;
    var distX = e.distX, distY = e.distY;
    var targetInverseMatrix = datas.targetInverseMatrix, prevMatrix = datas.prevMatrix, isWarp = datas.isWarp, startValue = datas.startValue, poses = datas.poses, posIndexes = datas.posIndexes, absolutePoses = datas.absolutePoses;
    if (!isWarp) {
      return false;
    }
    resolveTransformEvent(moveable, e, "matrix3d");
    if (hasGuidelines(moveable, "warpable")) {
      var selectedPoses = posIndexes.map(function(index) {
        return absolutePoses[index];
      });
      if (selectedPoses.length > 1) {
        selectedPoses.push([
          (selectedPoses[0][0] + selectedPoses[1][0]) / 2,
          (selectedPoses[0][1] + selectedPoses[1][1]) / 2
        ]);
      }
      var _a = checkMoveableSnapBounds(moveable, isRequest, {
        horizontal: selectedPoses.map(function(pos) {
          return pos[1] + distY;
        }),
        vertical: selectedPoses.map(function(pos) {
          return pos[0] + distX;
        })
      }), horizontalSnapInfo = _a.horizontal, verticalSnapInfo = _a.vertical;
      distY -= horizontalSnapInfo.offset;
      distX -= verticalSnapInfo.offset;
    }
    var dist = getDragDist({ datas, distX, distY }, true);
    var nextPoses = datas.nextPoses.slice();
    posIndexes.forEach(function(index) {
      nextPoses[index] = plus(nextPoses[index], dist);
    });
    if (!NEARBY_POS.every(function(nearByPoses) {
      return isValidPos(nearByPoses.map(function(i) {
        return poses[i];
      }), nearByPoses.map(function(i) {
        return nextPoses[i];
      }));
    })) {
      return false;
    }
    var h = createWarpMatrix(poses[0], poses[2], poses[1], poses[3], nextPoses[0], nextPoses[2], nextPoses[1], nextPoses[3]);
    if (!h.length) {
      return false;
    }
    var afterMatrix = multiply(targetInverseMatrix, h, 4);
    var matrix = getTransfromMatrix(datas, afterMatrix, true);
    var delta = multiply(invert(prevMatrix, 4), matrix, 4);
    datas.prevMatrix = matrix;
    var totalMatrix = multiply(startValue, matrix, 4);
    var nextTransform = convertTransformFormat(datas, "matrix3d(".concat(totalMatrix.join(", "), ")"), "matrix3d(".concat(matrix.join(", "), ")"));
    fillOriginalTransform(e, nextTransform);
    triggerEvent(moveable, "onWarp", fillParams(moveable, e, __assign6({ delta, matrix: totalMatrix, dist: matrix, multiply, transform: nextTransform }, fillCSSObject({
      transform: nextTransform
    }, e))));
    return true;
  },
  dragControlEnd: function(moveable, e) {
    var datas = e.datas, isDrag = e.isDrag;
    if (!datas.isWarp) {
      return false;
    }
    datas.isWarp = false;
    triggerEvent(moveable, "onWarpEnd", fillEndParams(moveable, e, {}));
    return isDrag;
  }
};
var AREA_PIECES = /* @__PURE__ */ prefix("area-pieces");
var AREA_PIECE = /* @__PURE__ */ prefix("area-piece");
var AVOID = /* @__PURE__ */ prefix("avoid");
var VIEW_DRAGGING = prefix("view-dragging");
function restoreStyle(moveable) {
  var el = moveable.areaElement;
  if (!el) {
    return;
  }
  var _a = moveable.state, width = _a.width, height = _a.height;
  removeClass(el, AVOID);
  el.style.cssText += "left: 0px; top: 0px; width: ".concat(width, "px; height: ").concat(height, "px");
}
function renderPieces(React3) {
  return React3.createElement(
    "div",
    { key: "area_pieces", className: AREA_PIECES },
    React3.createElement("div", { className: AREA_PIECE }),
    React3.createElement("div", { className: AREA_PIECE }),
    React3.createElement("div", { className: AREA_PIECE }),
    React3.createElement("div", { className: AREA_PIECE })
  );
}
var DragArea = {
  name: "dragArea",
  props: [
    "dragArea",
    "passDragArea"
  ],
  events: [
    "click",
    "clickGroup"
  ],
  render: function(moveable, React3) {
    var _a = moveable.props, target = _a.target, dragArea = _a.dragArea, groupable = _a.groupable, passDragArea = _a.passDragArea;
    var _b = moveable.getState(), width = _b.width, height = _b.height, renderPoses = _b.renderPoses;
    var className = passDragArea ? prefix("area", "pass") : prefix("area");
    if (groupable) {
      return [
        React3.createElement("div", { key: "area", ref: ref(moveable, "areaElement"), className }),
        renderPieces(React3)
      ];
    }
    if (!target || !dragArea) {
      return [];
    }
    var h = createWarpMatrix([0, 0], [width, 0], [0, height], [width, height], renderPoses[0], renderPoses[1], renderPoses[2], renderPoses[3]);
    var transform = h.length ? makeMatrixCSS(h, true) : "none";
    return [
      React3.createElement("div", { key: "area", ref: ref(moveable, "areaElement"), className, style: {
        top: "0px",
        left: "0px",
        width: "".concat(width, "px"),
        height: "".concat(height, "px"),
        transformOrigin: "0 0",
        transform
      } }),
      renderPieces(React3)
    ];
  },
  dragStart: function(moveable, _a) {
    var datas = _a.datas, clientX = _a.clientX, clientY = _a.clientY, inputEvent = _a.inputEvent;
    if (!inputEvent) {
      return false;
    }
    datas.isDragArea = false;
    var areaElement = moveable.areaElement;
    var state = moveable.state;
    var moveableClientRect = state.moveableClientRect, renderPoses = state.renderPoses, rootMatrix = state.rootMatrix, is3d = state.is3d;
    var left = moveableClientRect.left, top = moveableClientRect.top;
    var _b = getRect(renderPoses), relativeLeft = _b.left, relativeTop = _b.top, width = _b.width, height = _b.height;
    var n = is3d ? 4 : 3;
    var _c = __read(calculateInversePosition(rootMatrix, [clientX - left, clientY - top], n), 2), posX = _c[0], posY = _c[1];
    posX -= relativeLeft;
    posY -= relativeTop;
    var rects = [
      { left: relativeLeft, top: relativeTop, width, height: posY - 10 },
      { left: relativeLeft, top: relativeTop, width: posX - 10, height },
      { left: relativeLeft, top: relativeTop + posY + 10, width, height: height - posY - 10 },
      { left: relativeLeft + posX + 10, top: relativeTop, width: width - posX - 10, height }
    ];
    var children = [].slice.call(areaElement.nextElementSibling.children);
    rects.forEach(function(rect, i) {
      children[i].style.cssText = "left: ".concat(rect.left, "px;top: ").concat(rect.top, "px; width: ").concat(rect.width, "px; height: ").concat(rect.height, "px;");
    });
    addClass(areaElement, AVOID);
    state.disableNativeEvent = true;
    return;
  },
  drag: function(moveable, _a) {
    var datas = _a.datas, inputEvent = _a.inputEvent;
    this.enableNativeEvent(moveable);
    if (!inputEvent) {
      return false;
    }
    if (!datas.isDragArea) {
      datas.isDragArea = true;
      restoreStyle(moveable);
    }
  },
  dragEnd: function(moveable, e) {
    this.enableNativeEvent(moveable);
    var inputEvent = e.inputEvent, datas = e.datas;
    if (!inputEvent) {
      return false;
    }
    if (!datas.isDragArea) {
      restoreStyle(moveable);
    }
  },
  dragGroupStart: function(moveable, e) {
    return this.dragStart(moveable, e);
  },
  dragGroup: function(moveable, e) {
    return this.drag(moveable, e);
  },
  dragGroupEnd: function(moveable, e) {
    return this.dragEnd(moveable, e);
  },
  unset: function(moveable) {
    restoreStyle(moveable);
    moveable.state.disableNativeEvent = false;
  },
  enableNativeEvent: function(moveable) {
    var state = moveable.state;
    if (state.disableNativeEvent) {
      requestAnimationFrame2(function() {
        state.disableNativeEvent = false;
      });
    }
  }
};
var Origin = makeAble("origin", {
  props: ["origin", "svgOrigin"],
  render: function(moveable, React3) {
    var _a = moveable.props, zoom = _a.zoom, svgOrigin = _a.svgOrigin, groupable = _a.groupable;
    var _b = moveable.getState(), beforeOrigin = _b.beforeOrigin, rotation = _b.rotation, svg = _b.svg, allMatrix = _b.allMatrix, is3d = _b.is3d, left = _b.left, top = _b.top, offsetWidth = _b.offsetWidth, offsetHeight = _b.offsetHeight;
    var originStyle;
    if (!groupable && svg && svgOrigin) {
      var _c = __read(convertTransformOriginArray(svgOrigin, offsetWidth, offsetHeight), 2), originX = _c[0], originY = _c[1];
      var n = is3d ? 4 : 3;
      var result = calculatePosition(allMatrix, [originX, originY], n);
      originStyle = getControlTransform(rotation, zoom, minus(result, [left, top]));
    } else {
      originStyle = getControlTransform(rotation, zoom, beforeOrigin);
    }
    return [
      React3.createElement("div", { className: prefix("control", "origin"), style: originStyle, key: "beforeOrigin" })
    ];
  }
});
function getDefaultScrollPosition2(e) {
  var scrollContainer = e.scrollContainer;
  return [
    scrollContainer.scrollLeft,
    scrollContainer.scrollTop
  ];
}
var Scrollable = {
  name: "scrollable",
  canPinch: true,
  props: [
    "scrollable",
    "scrollContainer",
    "scrollThreshold",
    "scrollThrottleTime",
    "getScrollPosition",
    "scrollOptions"
  ],
  events: [
    "scroll",
    "scrollGroup"
  ],
  dragRelation: "strong",
  dragStart: function(moveable, e) {
    var props = moveable.props;
    var _a = props.scrollContainer, scrollContainer = _a === void 0 ? moveable.getContainer() : _a, scrollOptions = props.scrollOptions;
    var dragScroll = new dragscroll_esm_default();
    var scrollContainerElement = getRefTarget(scrollContainer, true);
    e.datas.dragScroll = dragScroll;
    moveable.state.dragScroll = dragScroll;
    var gestoName = e.isControl ? "controlGesto" : "targetGesto";
    var targets = e.targets;
    dragScroll.on("scroll", function(_a2) {
      var container = _a2.container, direction = _a2.direction;
      var params = fillParams(moveable, e, {
        scrollContainer: container,
        direction
      });
      var eventName = targets ? "onScrollGroup" : "onScroll";
      if (targets) {
        params.targets = targets;
      }
      triggerEvent(moveable, eventName, params);
    }).on("move", function(_a2) {
      var offsetX = _a2.offsetX, offsetY = _a2.offsetY, inputEvent = _a2.inputEvent;
      moveable[gestoName].scrollBy(offsetX, offsetY, inputEvent.inputEvent, false);
    }).on("scrollDrag", function(_a2) {
      var next = _a2.next;
      next(moveable[gestoName].getCurrentEvent());
    });
    dragScroll.dragStart(e, __assign6({ container: scrollContainerElement }, scrollOptions));
  },
  checkScroll: function(moveable, e) {
    var dragScroll = e.datas.dragScroll;
    if (!dragScroll) {
      return;
    }
    var _a = moveable.props, _b = _a.scrollContainer, scrollContainer = _b === void 0 ? moveable.getContainer() : _b, _c = _a.scrollThreshold, scrollThreshold = _c === void 0 ? 0 : _c, _d = _a.scrollThrottleTime, scrollThrottleTime = _d === void 0 ? 0 : _d, _e = _a.getScrollPosition, getScrollPosition = _e === void 0 ? getDefaultScrollPosition2 : _e, scrollOptions = _a.scrollOptions;
    dragScroll.drag(e, __assign6({ container: scrollContainer, threshold: scrollThreshold, throttleTime: scrollThrottleTime, getScrollPosition: function(ev) {
      return getScrollPosition({ scrollContainer: ev.container, direction: ev.direction });
    } }, scrollOptions));
    return true;
  },
  drag: function(moveable, e) {
    return this.checkScroll(moveable, e);
  },
  dragEnd: function(moveable, e) {
    e.datas.dragScroll.dragEnd();
    e.datas.dragScroll = null;
  },
  dragControlStart: function(moveable, e) {
    return this.dragStart(moveable, __assign6(__assign6({}, e), { isControl: true }));
  },
  dragControl: function(moveable, e) {
    return this.drag(moveable, e);
  },
  dragControlEnd: function(moveable, e) {
    return this.dragEnd(moveable, e);
  },
  dragGroupStart: function(moveable, e) {
    return this.dragStart(moveable, __assign6(__assign6({}, e), { targets: moveable.props.targets }));
  },
  dragGroup: function(moveable, e) {
    return this.drag(moveable, __assign6(__assign6({}, e), { targets: moveable.props.targets }));
  },
  dragGroupEnd: function(moveable, e) {
    return this.dragEnd(moveable, __assign6(__assign6({}, e), { targets: moveable.props.targets }));
  },
  dragGroupControlStart: function(moveable, e) {
    return this.dragStart(moveable, __assign6(__assign6({}, e), { targets: moveable.props.targets, isControl: true }));
  },
  dragGroupControl: function(moveable, e) {
    return this.drag(moveable, __assign6(__assign6({}, e), { targets: moveable.props.targets }));
  },
  dragGroupControEnd: function(moveable, e) {
    return this.dragEnd(moveable, __assign6(__assign6({}, e), { targets: moveable.props.targets }));
  },
  unset: function(moveable) {
    var _a;
    var state = moveable.state;
    (_a = state.dragScroll) === null || _a === void 0 ? void 0 : _a.dragEnd();
    state.dragScroll = null;
  }
};
var Default = {
  name: "",
  props: [
    "target",
    "dragTargetSelf",
    "dragTarget",
    "dragContainer",
    "container",
    "warpSelf",
    "rootContainer",
    "useResizeObserver",
    "useMutationObserver",
    "zoom",
    "dragFocusedInput",
    "transformOrigin",
    "ables",
    "className",
    "pinchThreshold",
    "pinchOutside",
    "triggerAblesSimultaneously",
    "checkInput",
    "cspNonce",
    "translateZ",
    "hideDefaultLines",
    "props",
    "flushSync",
    "stopPropagation",
    "preventClickEventOnDrag",
    "preventClickDefault",
    "viewContainer",
    "persistData",
    "useAccuratePosition",
    "firstRenderState",
    "linePadding",
    "controlPadding",
    "preventDefault",
    "requestStyles"
  ],
  events: [
    "changeTargets"
  ]
};
var Padding = makeAble("padding", {
  props: ["padding"],
  render: function(moveable, React3) {
    var props = moveable.props;
    if (props.dragArea) {
      return [];
    }
    var _a = getPaddingBox(props.padding || {}), left = _a.left, top = _a.top, right = _a.right, bottom = _a.bottom;
    var _b = moveable.getState(), renderPoses = _b.renderPoses, pos1 = _b.pos1, pos2 = _b.pos2, pos3 = _b.pos3, pos4 = _b.pos4;
    var poses = [pos1, pos2, pos3, pos4];
    var paddingDirections = [];
    if (left > 0) {
      paddingDirections.push([0, 2]);
    }
    if (top > 0) {
      paddingDirections.push([0, 1]);
    }
    if (right > 0) {
      paddingDirections.push([1, 3]);
    }
    if (bottom > 0) {
      paddingDirections.push([2, 3]);
    }
    return paddingDirections.map(function(_a2, i) {
      var _b2 = __read(_a2, 2), dir1 = _b2[0], dir2 = _b2[1];
      var paddingPos1 = poses[dir1];
      var paddingPos2 = poses[dir2];
      var paddingPos3 = renderPoses[dir1];
      var paddingPos4 = renderPoses[dir2];
      var h = createWarpMatrix([0, 0], [100, 0], [0, 100], [100, 100], paddingPos1, paddingPos2, paddingPos3, paddingPos4);
      if (!h.length) {
        return void 0;
      }
      return React3.createElement("div", { key: "padding".concat(i), className: prefix("padding"), style: {
        transform: makeMatrixCSS(h, true)
      } });
    });
  }
});
var RADIUS_DIRECTIONS = ["nw", "ne", "se", "sw"];
function calculateRatio(values, size) {
  var sumSize = values[0] + values[1];
  var sumRatio = sumSize > size ? size / sumSize : 1;
  values[0] *= sumRatio;
  values[1] = size - values[1] * sumRatio;
  return values;
}
var HORIZONTAL_RADIUS_ORDER = [1, 2, 5, 6];
var VERTICAL_RADIUS_ORDER = [0, 3, 4, 7];
var HORIZONTAL_RADIUS_DIRECTIONS = [1, -1, -1, 1];
var VERTICAL_RADIUS_DIRECTIONS = [1, 1, -1, -1];
function getRadiusStyles(nextPoses, isRelative, width, height, left, top, right, bottom) {
  if (left === void 0) {
    left = 0;
  }
  if (top === void 0) {
    top = 0;
  }
  if (right === void 0) {
    right = width;
  }
  if (bottom === void 0) {
    bottom = height;
  }
  var clipStyles = [];
  var isVertical = false;
  var radiusPoses = nextPoses.filter(function(pos) {
    return !pos.virtual;
  });
  var raws = radiusPoses.map(function(posInfo) {
    var horizontal = posInfo.horizontal, vertical = posInfo.vertical, pos = posInfo.pos;
    if (vertical && !isVertical) {
      isVertical = true;
      clipStyles.push("/");
    }
    if (isVertical) {
      var rawPos = Math.max(0, vertical === 1 ? pos[1] - top : bottom - pos[1]);
      clipStyles.push(convertCSSSize(rawPos, height, isRelative));
      return rawPos;
    } else {
      var rawPos = Math.max(0, horizontal === 1 ? pos[0] - left : right - pos[0]);
      clipStyles.push(convertCSSSize(rawPos, width, isRelative));
      return rawPos;
    }
  });
  return {
    radiusPoses,
    styles: clipStyles,
    raws
  };
}
function getRadiusRange(controlPoses) {
  var horizontalRange = [0, 0];
  var verticalRange = [0, 0];
  var length = controlPoses.length;
  for (var i = 0; i < length; ++i) {
    var clipPose = controlPoses[i];
    if (!clipPose.sub) {
      continue;
    }
    if (clipPose.horizontal) {
      if (horizontalRange[1] === 0) {
        horizontalRange[0] = i;
      }
      horizontalRange[1] = i - horizontalRange[0] + 1;
      verticalRange[0] = i + 1;
    }
    if (clipPose.vertical) {
      if (verticalRange[1] === 0) {
        verticalRange[0] = i;
      }
      verticalRange[1] = i - verticalRange[0] + 1;
    }
  }
  return {
    horizontalRange,
    verticalRange
  };
}
function getRadiusValues(values, width, height, left, top, minCounts, full) {
  var _a, _b, _c, _d;
  if (minCounts === void 0) {
    minCounts = [0, 0];
  }
  if (full === void 0) {
    full = false;
  }
  var splitIndex = values.indexOf("/");
  var splitLength = (splitIndex > -1 ? values.slice(0, splitIndex) : values).length;
  var horizontalValues = values.slice(0, splitLength);
  var verticalValues = values.slice(splitLength + 1);
  var horizontalValuesLength = horizontalValues.length;
  var verticalValuesLength = verticalValues.length;
  var hasVerticalValues = verticalValuesLength > 0;
  var _e = __read(horizontalValues, 4), _f = _e[0], nwValue = _f === void 0 ? "0px" : _f, _g = _e[1], neValue = _g === void 0 ? nwValue : _g, _h = _e[2], seValue = _h === void 0 ? nwValue : _h, _j = _e[3], swValue = _j === void 0 ? neValue : _j;
  var _k = __read(verticalValues, 4), _l = _k[0], wnValue = _l === void 0 ? nwValue : _l, _m = _k[1], enValue = _m === void 0 ? hasVerticalValues ? wnValue : neValue : _m, _o = _k[2], esValue = _o === void 0 ? hasVerticalValues ? wnValue : seValue : _o, _p = _k[3], wsValue = _p === void 0 ? hasVerticalValues ? enValue : swValue : _p;
  var horizontalRawPoses = [nwValue, neValue, seValue, swValue].map(function(pos) {
    return convertUnitSize(pos, width);
  });
  var verticalRawPoses = [wnValue, enValue, esValue, wsValue].map(function(pos) {
    return convertUnitSize(pos, height);
  });
  var horizontalPoses = horizontalRawPoses.slice();
  var verticalPoses = verticalRawPoses.slice();
  _a = __read(calculateRatio([horizontalPoses[0], horizontalPoses[1]], width), 2), horizontalPoses[0] = _a[0], horizontalPoses[1] = _a[1];
  _b = __read(calculateRatio([horizontalPoses[3], horizontalPoses[2]], width), 2), horizontalPoses[3] = _b[0], horizontalPoses[2] = _b[1];
  _c = __read(calculateRatio([verticalPoses[0], verticalPoses[3]], height), 2), verticalPoses[0] = _c[0], verticalPoses[3] = _c[1];
  _d = __read(calculateRatio([verticalPoses[1], verticalPoses[2]], height), 2), verticalPoses[1] = _d[0], verticalPoses[2] = _d[1];
  var nextHorizontalPoses = full ? horizontalPoses : horizontalPoses.slice(0, Math.max(minCounts[0], horizontalValuesLength));
  var nextVerticalPoses = full ? verticalPoses : verticalPoses.slice(0, Math.max(minCounts[1], verticalValuesLength));
  return __spreadArray(__spreadArray([], __read(nextHorizontalPoses.map(function(pos, i) {
    var direction = RADIUS_DIRECTIONS[i];
    return {
      virtual: i >= horizontalValuesLength,
      horizontal: HORIZONTAL_RADIUS_DIRECTIONS[i],
      vertical: 0,
      pos: [left + pos, top + (VERTICAL_RADIUS_DIRECTIONS[i] === -1 ? height : 0)],
      sub: true,
      raw: horizontalRawPoses[i],
      direction
    };
  })), false), __read(nextVerticalPoses.map(function(pos, i) {
    var direction = RADIUS_DIRECTIONS[i];
    return {
      virtual: i >= verticalValuesLength,
      horizontal: 0,
      vertical: VERTICAL_RADIUS_DIRECTIONS[i],
      pos: [left + (HORIZONTAL_RADIUS_DIRECTIONS[i] === -1 ? width : 0), top + pos],
      sub: true,
      raw: verticalRawPoses[i],
      direction
    };
  })), false);
}
function removeRadiusPos(controlPoses, poses, index, startIndex, length) {
  if (length === void 0) {
    length = poses.length;
  }
  var _a = getRadiusRange(controlPoses.slice(startIndex)), horizontalRange = _a.horizontalRange, verticalRange = _a.verticalRange;
  var radiuslIndex = index - startIndex;
  var deleteCount = 0;
  if (radiuslIndex === 0) {
    deleteCount = length;
  } else if (radiuslIndex > 0 && radiuslIndex < horizontalRange[1]) {
    deleteCount = horizontalRange[1] - radiuslIndex;
  } else if (radiuslIndex >= verticalRange[0]) {
    deleteCount = verticalRange[0] + verticalRange[1] - radiuslIndex;
  } else {
    return;
  }
  controlPoses.splice(index, deleteCount);
  poses.splice(index, deleteCount);
}
function addRadiusPos(controlPoses, poses, startIndex, horizontalIndex, verticalIndex, distX, distY, right, bottom, left, top) {
  if (left === void 0) {
    left = 0;
  }
  if (top === void 0) {
    top = 0;
  }
  var _a = getRadiusRange(controlPoses.slice(startIndex)), horizontalRange = _a.horizontalRange, verticalRange = _a.verticalRange;
  if (horizontalIndex > -1) {
    var radiusX = HORIZONTAL_RADIUS_DIRECTIONS[horizontalIndex] === 1 ? distX - left : right - distX;
    for (var i = horizontalRange[1]; i <= horizontalIndex; ++i) {
      var y = VERTICAL_RADIUS_DIRECTIONS[i] === 1 ? top : bottom;
      var x = 0;
      if (horizontalIndex === i) {
        x = distX;
      } else if (i === 0) {
        x = left + radiusX;
      } else if (HORIZONTAL_RADIUS_DIRECTIONS[i] === -1) {
        x = right - (poses[startIndex][0] - left);
      }
      controlPoses.splice(startIndex + i, 0, {
        horizontal: HORIZONTAL_RADIUS_DIRECTIONS[i],
        vertical: 0,
        pos: [x, y]
      });
      poses.splice(startIndex + i, 0, [x, y]);
      if (i === 0) {
        break;
      }
    }
  } else if (verticalIndex > -1) {
    var radiusY = VERTICAL_RADIUS_DIRECTIONS[verticalIndex] === 1 ? distY - top : bottom - distY;
    if (horizontalRange[1] === 0 && verticalRange[1] === 0) {
      var pos = [
        left + radiusY,
        top
      ];
      controlPoses.push({
        horizontal: HORIZONTAL_RADIUS_DIRECTIONS[0],
        vertical: 0,
        pos
      });
      poses.push(pos);
    }
    var startVerticalIndex = verticalRange[0];
    for (var i = verticalRange[1]; i <= verticalIndex; ++i) {
      var x = HORIZONTAL_RADIUS_DIRECTIONS[i] === 1 ? left : right;
      var y = 0;
      if (verticalIndex === i) {
        y = distY;
      } else if (i === 0) {
        y = top + radiusY;
      } else if (VERTICAL_RADIUS_DIRECTIONS[i] === 1) {
        y = poses[startIndex + startVerticalIndex][1];
      } else if (VERTICAL_RADIUS_DIRECTIONS[i] === -1) {
        y = bottom - (poses[startIndex + startVerticalIndex][1] - top);
      }
      controlPoses.push({
        horizontal: 0,
        vertical: VERTICAL_RADIUS_DIRECTIONS[i],
        pos: [x, y]
      });
      poses.push([x, y]);
      if (i === 0) {
        break;
      }
    }
  }
}
function splitRadiusPoses(controlPoses, raws) {
  if (raws === void 0) {
    raws = controlPoses.map(function(pos) {
      return pos.raw;
    });
  }
  var horizontals = controlPoses.map(function(pos, i) {
    return pos.horizontal ? raws[i] : null;
  }).filter(function(pos) {
    return pos != null;
  });
  var verticals = controlPoses.map(function(pos, i) {
    return pos.vertical ? raws[i] : null;
  }).filter(function(pos) {
    return pos != null;
  });
  return {
    horizontals,
    verticals
  };
}
var CLIP_DIRECTIONS = [
  [0, -1, "n"],
  [1, 0, "e"]
];
var CLIP_RECT_DIRECTIONS = [
  [-1, -1, "nw"],
  [0, -1, "n"],
  [1, -1, "ne"],
  [1, 0, "e"],
  [1, 1, "se"],
  [0, 1, "s"],
  [-1, 1, "sw"],
  [-1, 0, "w"]
];
function getClipStyles(moveable, clipPath, poses) {
  var clipRelative = moveable.props.clipRelative;
  var _a = moveable.state, width = _a.width, height = _a.height;
  var _b = clipPath, clipType = _b.type, clipPoses = _b.poses;
  var isRect = clipType === "rect";
  var isCircle = clipType === "circle";
  if (clipType === "polygon") {
    return poses.map(function(pos) {
      return "".concat(convertCSSSize(pos[0], width, clipRelative), " ").concat(convertCSSSize(pos[1], height, clipRelative));
    });
  } else if (isRect || clipType === "inset") {
    var top_1 = poses[1][1];
    var right = poses[3][0];
    var left = poses[7][0];
    var bottom = poses[5][1];
    if (isRect) {
      return [
        top_1,
        right,
        bottom,
        left
      ].map(function(pos) {
        return "".concat(pos, "px");
      });
    }
    var clipStyles = [top_1, width - right, height - bottom, left].map(function(pos, i) {
      return convertCSSSize(pos, i % 2 ? width : height, clipRelative);
    });
    if (poses.length > 8) {
      var _c = __read(minus(poses[4], poses[0]), 2), subWidth = _c[0], subHeight = _c[1];
      clipStyles.push.apply(clipStyles, __spreadArray(["round"], __read(getRadiusStyles(clipPoses.slice(8).map(function(info, i) {
        return __assign6(__assign6({}, info), { pos: poses[i] });
      }), clipRelative, subWidth, subHeight, left, top_1, right, bottom).styles), false));
    }
    return clipStyles;
  } else if (isCircle || clipType === "ellipse") {
    var center = poses[0];
    var ry = convertCSSSize(abs(poses[1][1] - center[1]), isCircle ? Math.sqrt((width * width + height * height) / 2) : height, clipRelative);
    var clipStyles = isCircle ? [ry] : [convertCSSSize(abs(poses[2][0] - center[0]), width, clipRelative), ry];
    clipStyles.push("at", convertCSSSize(center[0], width, clipRelative), convertCSSSize(center[1], height, clipRelative));
    return clipStyles;
  }
}
function getRectPoses(top, right, bottom, left) {
  var xs = [left, (left + right) / 2, right];
  var ys = [top, (top + bottom) / 2, bottom];
  return CLIP_RECT_DIRECTIONS.map(function(_a) {
    var _b = __read(_a, 3), dirx = _b[0], diry = _b[1], dir = _b[2];
    var x = xs[dirx + 1];
    var y = ys[diry + 1];
    return {
      vertical: abs(diry),
      horizontal: abs(dirx),
      direction: dir,
      pos: [x, y]
    };
  });
}
function getControlSize(controlPoses) {
  var xRange = [Infinity, -Infinity];
  var yRange = [Infinity, -Infinity];
  controlPoses.forEach(function(_a) {
    var pos = _a.pos;
    xRange[0] = Math.min(xRange[0], pos[0]);
    xRange[1] = Math.max(xRange[1], pos[0]);
    yRange[0] = Math.min(yRange[0], pos[1]);
    yRange[1] = Math.max(yRange[1], pos[1]);
  });
  return [
    abs(xRange[1] - xRange[0]),
    abs(yRange[1] - yRange[0])
  ];
}
function getClipPath(target, width, height, defaultClip, customClip) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j;
  if (!target) {
    return;
  }
  var clipText = customClip;
  if (!clipText) {
    var getStyle = getCachedStyle(target);
    var clipPath = getStyle("clipPath");
    clipText = clipPath !== "none" ? clipPath : getStyle("clip");
  }
  if (!clipText || clipText === "none" || clipText === "auto") {
    clipText = defaultClip;
    if (!clipText) {
      return;
    }
  }
  var _k = splitBracket(clipText), _l = _k.prefix, clipPrefix = _l === void 0 ? clipText : _l, _m = _k.value, value = _m === void 0 ? "" : _m;
  var isCircle = clipPrefix === "circle";
  var splitter = " ";
  if (clipPrefix === "polygon") {
    var values = splitComma(value || "0% 0%, 100% 0%, 100% 100%, 0% 100%");
    splitter = ",";
    var poses = values.map(function(pos) {
      var _a2 = __read(pos.split(" "), 2), xPos2 = _a2[0], yPos2 = _a2[1];
      return {
        vertical: 1,
        horizontal: 1,
        pos: [
          convertUnitSize(xPos2, width),
          convertUnitSize(yPos2, height)
        ]
      };
    });
    var minMaxs = getMinMaxs(poses.map(function(pos) {
      return pos.pos;
    }));
    return {
      type: clipPrefix,
      clipText,
      poses,
      splitter,
      left: minMaxs.minX,
      right: minMaxs.maxX,
      top: minMaxs.minY,
      bottom: minMaxs.maxY
    };
  } else if (isCircle || clipPrefix === "ellipse") {
    var xPos = "";
    var yPos = "";
    var radiusX_1 = 0;
    var radiusY_1 = 0;
    var values = splitSpace(value);
    if (isCircle) {
      var radius = "";
      _a = __read(values, 4), _b = _a[0], radius = _b === void 0 ? "50%" : _b, _c = _a[2], xPos = _c === void 0 ? "50%" : _c, _d = _a[3], yPos = _d === void 0 ? "50%" : _d;
      radiusX_1 = convertUnitSize(radius, Math.sqrt((width * width + height * height) / 2));
      radiusY_1 = radiusX_1;
    } else {
      var xRadius = "";
      var yRadius = "";
      _e = __read(values, 5), _f = _e[0], xRadius = _f === void 0 ? "50%" : _f, _g = _e[1], yRadius = _g === void 0 ? "50%" : _g, _h = _e[3], xPos = _h === void 0 ? "50%" : _h, _j = _e[4], yPos = _j === void 0 ? "50%" : _j;
      radiusX_1 = convertUnitSize(xRadius, width);
      radiusY_1 = convertUnitSize(yRadius, height);
    }
    var centerPos_1 = [
      convertUnitSize(xPos, width),
      convertUnitSize(yPos, height)
    ];
    var poses = __spreadArray([
      {
        vertical: 1,
        horizontal: 1,
        pos: centerPos_1,
        direction: "nesw"
      }
    ], __read(CLIP_DIRECTIONS.slice(0, isCircle ? 1 : 2).map(function(dir) {
      return {
        vertical: abs(dir[1]),
        horizontal: dir[0],
        direction: dir[2],
        sub: true,
        pos: [
          centerPos_1[0] + dir[0] * radiusX_1,
          centerPos_1[1] + dir[1] * radiusY_1
        ]
      };
    })), false);
    return {
      type: clipPrefix,
      clipText,
      radiusX: radiusX_1,
      radiusY: radiusY_1,
      left: centerPos_1[0] - radiusX_1,
      top: centerPos_1[1] - radiusY_1,
      right: centerPos_1[0] + radiusX_1,
      bottom: centerPos_1[1] + radiusY_1,
      poses,
      splitter
    };
  } else if (clipPrefix === "inset") {
    var values = splitSpace(value || "0 0 0 0");
    var roundIndex = values.indexOf("round");
    var rectLength = (roundIndex > -1 ? values.slice(0, roundIndex) : values).length;
    var radiusValues = values.slice(rectLength + 1);
    var _o = __read(values.slice(0, rectLength), 4), topValue = _o[0], _p = _o[1], rightValue = _p === void 0 ? topValue : _p, _q = _o[2], bottomValue = _q === void 0 ? topValue : _q, _r = _o[3], leftValue = _r === void 0 ? rightValue : _r;
    var _s = __read([topValue, bottomValue].map(function(pos) {
      return convertUnitSize(pos, height);
    }), 2), top_2 = _s[0], bottom = _s[1];
    var _t = __read([leftValue, rightValue].map(function(pos) {
      return convertUnitSize(pos, width);
    }), 2), left = _t[0], right = _t[1];
    var nextRight = width - right;
    var nextBottom = height - bottom;
    var radiusPoses = getRadiusValues(radiusValues, nextRight - left, nextBottom - top_2, left, top_2);
    var poses = __spreadArray(__spreadArray([], __read(getRectPoses(top_2, nextRight, nextBottom, left)), false), __read(radiusPoses), false);
    return {
      type: "inset",
      clipText,
      poses,
      top: top_2,
      left,
      right: nextRight,
      bottom: nextBottom,
      radius: radiusValues,
      splitter
    };
  } else if (clipPrefix === "rect") {
    var values = splitComma(value || "0px, ".concat(width, "px, ").concat(height, "px, 0px"));
    splitter = ",";
    var _u = __read(values.map(function(pos) {
      var posValue = splitUnit(pos).value;
      return posValue;
    }), 4), top_3 = _u[0], right = _u[1], bottom = _u[2], left = _u[3];
    var poses = getRectPoses(top_3, right, bottom, left);
    return {
      type: "rect",
      clipText,
      poses,
      top: top_3,
      right,
      bottom,
      left,
      values,
      splitter
    };
  }
  return;
}
function moveControlPos(controlPoses, index, dist, isRect, keepRatio) {
  var _a = controlPoses[index], direction = _a.direction, sub = _a.sub;
  var dists = controlPoses.map(function() {
    return [0, 0];
  });
  var directions = direction ? direction.split("") : [];
  if (isRect && index < 8) {
    var verticalDirections = directions.filter(function(dir) {
      return dir === "w" || dir === "e";
    });
    var horizontalDirections = directions.filter(function(dir) {
      return dir === "n" || dir === "s";
    });
    var verticalDirection_1 = verticalDirections[0];
    var horizontalDirection_1 = horizontalDirections[0];
    dists[index] = dist;
    var _b = __read(getControlSize(controlPoses), 2), width = _b[0], height = _b[1];
    var ratio = width && height ? width / height : 0;
    if (ratio && keepRatio) {
      var fixedIndex = (index + 4) % 8;
      var fixedPosition = controlPoses[fixedIndex].pos;
      var sizeDirection = [0, 0];
      if (direction.indexOf("w") > -1) {
        sizeDirection[0] = -1;
      } else if (direction.indexOf("e") > -1) {
        sizeDirection[0] = 1;
      }
      if (direction.indexOf("n") > -1) {
        sizeDirection[1] = -1;
      } else if (direction.indexOf("s") > -1) {
        sizeDirection[1] = 1;
      }
      var nextDist = getSizeDistByDist([width, height], dist, ratio, sizeDirection, true);
      var nextWidth = width + nextDist[0];
      var nextHeight = height + nextDist[1];
      var top_1 = fixedPosition[1];
      var bottom = fixedPosition[1];
      var left = fixedPosition[0];
      var right = fixedPosition[0];
      if (sizeDirection[0] === -1) {
        left = right - nextWidth;
      } else if (sizeDirection[0] === 1) {
        right = left + nextWidth;
      } else {
        left = left - nextWidth / 2;
        right = right + nextWidth / 2;
      }
      if (sizeDirection[1] === -1) {
        top_1 = bottom - nextHeight;
      } else if (sizeDirection[1] === 1) {
        bottom = top_1 + nextHeight;
      } else {
        top_1 = bottom - nextHeight / 2;
        bottom = top_1 + nextHeight;
      }
      var nextControlPoses_1 = getRectPoses(top_1, right, bottom, left);
      controlPoses.forEach(function(controlPose, i) {
        dists[i][0] = nextControlPoses_1[i].pos[0] - controlPose.pos[0];
        dists[i][1] = nextControlPoses_1[i].pos[1] - controlPose.pos[1];
      });
    } else {
      controlPoses.forEach(function(controlPose, i) {
        var controlDir = controlPose.direction;
        if (!controlDir) {
          return;
        }
        if (controlDir.indexOf(verticalDirection_1) > -1) {
          dists[i][0] = dist[0];
        }
        if (controlDir.indexOf(horizontalDirection_1) > -1) {
          dists[i][1] = dist[1];
        }
      });
      if (verticalDirection_1) {
        dists[1][0] = dist[0] / 2;
        dists[5][0] = dist[0] / 2;
      }
      if (horizontalDirection_1) {
        dists[3][1] = dist[1] / 2;
        dists[7][1] = dist[1] / 2;
      }
    }
  } else if (direction && !sub) {
    directions.forEach(function(dir) {
      var isVertical = dir === "n" || dir === "s";
      controlPoses.forEach(function(controlPose, i) {
        var dirDir = controlPose.direction, dirHorizontal = controlPose.horizontal, dirVertical = controlPose.vertical;
        if (!dirDir || dirDir.indexOf(dir) === -1) {
          return;
        }
        dists[i] = [
          isVertical || !dirHorizontal ? 0 : dist[0],
          !isVertical || !dirVertical ? 0 : dist[1]
        ];
      });
    });
  } else {
    dists[index] = dist;
  }
  return dists;
}
function addClipPath(moveable, e) {
  var _a = __read(calculatePointerDist(moveable, e), 2), distX = _a[0], distY = _a[1];
  var _b = e.datas, clipPath = _b.clipPath, clipIndex = _b.clipIndex;
  var _c = clipPath, clipType = _c.type, clipPoses = _c.poses, splitter = _c.splitter;
  var poses = clipPoses.map(function(pos) {
    return pos.pos;
  });
  if (clipType === "polygon") {
    poses.splice(clipIndex, 0, [distX, distY]);
  } else if (clipType === "inset") {
    var horizontalIndex = HORIZONTAL_RADIUS_ORDER.indexOf(clipIndex);
    var verticalIndex = VERTICAL_RADIUS_ORDER.indexOf(clipIndex);
    var length_1 = clipPoses.length;
    addRadiusPos(clipPoses, poses, 8, horizontalIndex, verticalIndex, distX, distY, poses[4][0], poses[4][1], poses[0][0], poses[0][1]);
    if (length_1 === clipPoses.length) {
      return;
    }
  } else {
    return;
  }
  var clipStyles = getClipStyles(moveable, clipPath, poses);
  var clipStyle = "".concat(clipType, "(").concat(clipStyles.join(splitter), ")");
  triggerEvent(moveable, "onClip", fillParams(moveable, e, __assign6({ clipEventType: "added", clipType, poses, clipStyles, clipStyle, distX: 0, distY: 0 }, fillCSSObject({
    clipPath: clipStyle
  }, e))));
}
function removeClipPath(moveable, e) {
  var _a = e.datas, clipPath = _a.clipPath, clipIndex = _a.clipIndex;
  var _b = clipPath, clipType = _b.type, clipPoses = _b.poses, splitter = _b.splitter;
  var poses = clipPoses.map(function(pos) {
    return pos.pos;
  });
  var length = poses.length;
  if (clipType === "polygon") {
    clipPoses.splice(clipIndex, 1);
    poses.splice(clipIndex, 1);
  } else if (clipType === "inset") {
    if (clipIndex < 8) {
      return;
    }
    removeRadiusPos(clipPoses, poses, clipIndex, 8, length);
    if (length === clipPoses.length) {
      return;
    }
  } else {
    return;
  }
  var clipStyles = getClipStyles(moveable, clipPath, poses);
  var clipStyle = "".concat(clipType, "(").concat(clipStyles.join(splitter), ")");
  triggerEvent(moveable, "onClip", fillParams(moveable, e, __assign6({ clipEventType: "removed", clipType, poses, clipStyles, clipStyle, distX: 0, distY: 0 }, fillCSSObject({
    clipPath: clipStyle
  }, e))));
}
var Clippable = {
  name: "clippable",
  props: [
    "clippable",
    "defaultClipPath",
    "customClipPath",
    "keepRatio",
    "clipRelative",
    "clipArea",
    "dragWithClip",
    "clipTargetBounds",
    "clipVerticalGuidelines",
    "clipHorizontalGuidelines",
    "clipSnapThreshold"
  ],
  events: [
    "clipStart",
    "clip",
    "clipEnd"
  ],
  css: [
    ".control.clip-control {\nbackground: #6d6;\ncursor: pointer;\n}\n.control.clip-control.clip-radius {\nbackground: #d66;\n}\n.line.clip-line {\nbackground: #6e6;\ncursor: move;\nz-index: 1;\n}\n.clip-area {\nposition: absolute;\ntop: 0;\nleft: 0;\n}\n.clip-ellipse {\nposition: absolute;\ncursor: move;\nborder: 1px solid #6d6;\nborder: var(--zoompx) solid #6d6;\nborder-radius: 50%;\ntransform-origin: 0px 0px;\n}",
    ":host {\n--bounds-color: #d66;\n}",
    ".guideline {\npointer-events: none;\nz-index: 2;\n}",
    ".line.guideline.bounds {\nbackground: #d66;\nbackground: var(--bounds-color);\n}"
  ],
  render: function(moveable, React3) {
    var _a = moveable.props, customClipPath = _a.customClipPath, defaultClipPath = _a.defaultClipPath, clipArea = _a.clipArea, zoom = _a.zoom, groupable = _a.groupable;
    var _b = moveable.getState(), target = _b.target, width = _b.width, height = _b.height, allMatrix = _b.allMatrix, is3d = _b.is3d, left = _b.left, top = _b.top, pos1 = _b.pos1, pos2 = _b.pos2, pos3 = _b.pos3, pos4 = _b.pos4, clipPathState = _b.clipPathState, snapBoundInfos = _b.snapBoundInfos, rotationRad = _b.rotation;
    if (!target || groupable) {
      return [];
    }
    var clipPath = getClipPath(target, width, height, defaultClipPath || "inset", clipPathState || customClipPath);
    if (!clipPath) {
      return [];
    }
    var n = is3d ? 4 : 3;
    var type = clipPath.type;
    var clipPoses = clipPath.poses;
    var poses = clipPoses.map(function(pos) {
      var calculatedPos = calculatePosition(allMatrix, pos.pos, n);
      return [
        calculatedPos[0] - left,
        calculatedPos[1] - top
      ];
    });
    var controls = [];
    var lines = [];
    var isRect = type === "rect";
    var isInset = type === "inset";
    var isPolygon = type === "polygon";
    if (isRect || isInset || isPolygon) {
      var linePoses_1 = isInset ? poses.slice(0, 8) : poses;
      lines = linePoses_1.map(function(to, i2) {
        var from = i2 === 0 ? linePoses_1[linePoses_1.length - 1] : linePoses_1[i2 - 1];
        var rad2 = getRad(from, to);
        var dist = getDiagonalSize(from, to);
        return React3.createElement("div", { key: "clipLine".concat(i2), className: prefix("line", "clip-line", "snap-control"), "data-clip-index": i2, style: {
          width: "".concat(dist, "px"),
          transform: "translate(".concat(from[0], "px, ").concat(from[1], "px) rotate(").concat(rad2, "rad) scaleY(").concat(zoom, ")")
        } });
      });
    }
    controls = poses.map(function(pos, i2) {
      return React3.createElement("div", { key: "clipControl".concat(i2), className: prefix("control", "clip-control", "snap-control"), "data-clip-index": i2, style: {
        transform: "translate(".concat(pos[0], "px, ").concat(pos[1], "px) rotate(").concat(rotationRad, "rad) scale(").concat(zoom, ")")
      } });
    });
    if (isInset) {
      controls.push.apply(controls, __spreadArray([], __read(poses.slice(8).map(function(pos, i2) {
        return React3.createElement("div", { key: "clipRadiusControl".concat(i2), className: prefix("control", "clip-control", "clip-radius", "snap-control"), "data-clip-index": 8 + i2, style: {
          transform: "translate(".concat(pos[0], "px, ").concat(pos[1], "px) rotate(").concat(rotationRad, "rad) scale(").concat(zoom, ")")
        } });
      })), false));
    }
    if (type === "circle" || type === "ellipse") {
      var clipLeft = clipPath.left, clipTop = clipPath.top, radiusX = clipPath.radiusX, radiusY = clipPath.radiusY;
      var _c = __read(minus(calculatePosition(allMatrix, [clipLeft, clipTop], n), calculatePosition(allMatrix, [0, 0], n)), 2), distLeft = _c[0], distTop = _c[1];
      var ellipseClipPath = "none";
      if (!clipArea) {
        var piece = Math.max(10, radiusX / 5, radiusY / 5);
        var areaPoses = [];
        for (var i = 0; i <= piece; ++i) {
          var rad = Math.PI * 2 / piece * i;
          areaPoses.push([
            radiusX + (radiusX - zoom) * Math.cos(rad),
            radiusY + (radiusY - zoom) * Math.sin(rad)
          ]);
        }
        areaPoses.push([radiusX, -2]);
        areaPoses.push([-2, -2]);
        areaPoses.push([-2, radiusY * 2 + 2]);
        areaPoses.push([radiusX * 2 + 2, radiusY * 2 + 2]);
        areaPoses.push([radiusX * 2 + 2, -2]);
        areaPoses.push([radiusX, -2]);
        ellipseClipPath = "polygon(".concat(areaPoses.map(function(pos) {
          return "".concat(pos[0], "px ").concat(pos[1], "px");
        }).join(", "), ")");
      }
      controls.push(React3.createElement("div", { key: "clipEllipse", className: prefix("clip-ellipse", "snap-control"), style: {
        width: "".concat(radiusX * 2, "px"),
        height: "".concat(radiusY * 2, "px"),
        clipPath: ellipseClipPath,
        transform: "translate(".concat(-left + distLeft, "px, ").concat(-top + distTop, "px) ").concat(makeMatrixCSS(allMatrix))
      } }));
    }
    if (clipArea) {
      var _d = getRect(__spreadArray([pos1, pos2, pos3, pos4], __read(poses), false)), allWidth = _d.width, allHeight = _d.height, allLeft_1 = _d.left, allTop_1 = _d.top;
      if (isPolygon || isRect || isInset) {
        var areaPoses = isInset ? poses.slice(0, 8) : poses;
        controls.push(React3.createElement("div", { key: "clipArea", className: prefix("clip-area", "snap-control"), style: {
          width: "".concat(allWidth, "px"),
          height: "".concat(allHeight, "px"),
          transform: "translate(".concat(allLeft_1, "px, ").concat(allTop_1, "px)"),
          clipPath: "polygon(".concat(areaPoses.map(function(pos) {
            return "".concat(pos[0] - allLeft_1, "px ").concat(pos[1] - allTop_1, "px");
          }).join(", "), ")")
        } }));
      }
    }
    if (snapBoundInfos) {
      ["vertical", "horizontal"].forEach(function(directionType) {
        var info = snapBoundInfos[directionType];
        var isHorizontal = directionType === "horizontal";
        if (info.isSnap) {
          lines.push.apply(lines, __spreadArray([], __read(info.snap.posInfos.map(function(_a2, i2) {
            var pos = _a2.pos;
            var snapPos1 = minus(calculatePosition(allMatrix, isHorizontal ? [0, pos] : [pos, 0], n), [left, top]);
            var snapPos2 = minus(calculatePosition(allMatrix, isHorizontal ? [width, pos] : [pos, height], n), [left, top]);
            return renderLine(React3, "", snapPos1, snapPos2, zoom, "clip".concat(directionType, "snap").concat(i2), "guideline");
          })), false));
        }
        if (info.isBound) {
          lines.push.apply(lines, __spreadArray([], __read(info.bounds.map(function(_a2, i2) {
            var pos = _a2.pos;
            var snapPos1 = minus(calculatePosition(allMatrix, isHorizontal ? [0, pos] : [pos, 0], n), [left, top]);
            var snapPos2 = minus(calculatePosition(allMatrix, isHorizontal ? [width, pos] : [pos, height], n), [left, top]);
            return renderLine(React3, "", snapPos1, snapPos2, zoom, "clip".concat(directionType, "bounds").concat(i2), "guideline", "bounds", "bold");
          })), false));
        }
      });
    }
    return __spreadArray(__spreadArray([], __read(controls), false), __read(lines), false);
  },
  dragControlCondition: function(moveable, e) {
    return e.inputEvent && (e.inputEvent.target.getAttribute("class") || "").indexOf("clip") > -1;
  },
  dragStart: function(moveable, e) {
    var props = moveable.props;
    var _a = props.dragWithClip, dragWithClip = _a === void 0 ? true : _a;
    if (dragWithClip) {
      return false;
    }
    return this.dragControlStart(moveable, e);
  },
  drag: function(moveable, e) {
    return this.dragControl(moveable, __assign6(__assign6({}, e), { isDragTarget: true }));
  },
  dragEnd: function(moveable, e) {
    return this.dragControlEnd(moveable, e);
  },
  dragControlStart: function(moveable, e) {
    var state = moveable.state;
    var _a = moveable.props, defaultClipPath = _a.defaultClipPath, customClipPath = _a.customClipPath;
    var target = state.target, width = state.width, height = state.height;
    var inputTarget = e.inputEvent ? e.inputEvent.target : null;
    var className = inputTarget && inputTarget.getAttribute("class") || "";
    var datas = e.datas;
    var clipPath = getClipPath(target, width, height, defaultClipPath || "inset", customClipPath);
    if (!clipPath) {
      return false;
    }
    var clipText = clipPath.clipText, type = clipPath.type, poses = clipPath.poses;
    var result = triggerEvent(moveable, "onClipStart", fillParams(moveable, e, {
      clipType: type,
      clipStyle: clipText,
      poses: poses.map(function(pos) {
        return pos.pos;
      })
    }));
    if (result === false) {
      datas.isClipStart = false;
      return false;
    }
    datas.isControl = className && className.indexOf("clip-control") > -1;
    datas.isLine = className.indexOf("clip-line") > -1;
    datas.isArea = className.indexOf("clip-area") > -1 || className.indexOf("clip-ellipse") > -1;
    datas.clipIndex = inputTarget ? parseInt(inputTarget.getAttribute("data-clip-index"), 10) : -1;
    datas.clipPath = clipPath;
    datas.isClipStart = true;
    state.clipPathState = clipText;
    setDragStart(moveable, e);
    return true;
  },
  dragControl: function(moveable, e) {
    var _a, _b, _c;
    var datas = e.datas, originalDatas = e.originalDatas, isDragTarget = e.isDragTarget;
    if (!datas.isClipStart) {
      return false;
    }
    var _d = datas, isControl = _d.isControl, isLine = _d.isLine, isArea = _d.isArea, clipIndex = _d.clipIndex, clipPath = _d.clipPath;
    if (!clipPath) {
      return false;
    }
    var props = getProps(moveable.props, "clippable");
    var keepRatio = props.keepRatio;
    var distX = 0;
    var distY = 0;
    var originalDraggable = originalDatas.draggable;
    var originalDist = getDragDist(e);
    if (isDragTarget && originalDraggable) {
      _a = __read(originalDraggable.prevBeforeDist, 2), distX = _a[0], distY = _a[1];
    } else {
      _b = __read(originalDist, 2), distX = _b[0], distY = _b[1];
    }
    var firstDist = [distX, distY];
    var state = moveable.state;
    var width = state.width, height = state.height;
    var isDragWithTarget = !isArea && !isControl && !isLine;
    var clipType = clipPath.type, clipPoses = clipPath.poses, splitter = clipPath.splitter;
    var poses = clipPoses.map(function(pos) {
      return pos.pos;
    });
    if (isDragWithTarget) {
      distX = -distX;
      distY = -distY;
    }
    var isAll = !isControl || clipPoses[clipIndex].direction === "nesw";
    var isRect = clipType === "inset" || clipType === "rect";
    var dists = clipPoses.map(function() {
      return [0, 0];
    });
    if (isControl && !isAll) {
      var _e = clipPoses[clipIndex], horizontal = _e.horizontal, vertical = _e.vertical;
      var dist = [
        distX * abs(horizontal),
        distY * abs(vertical)
      ];
      dists = moveControlPos(clipPoses, clipIndex, dist, isRect, keepRatio);
    } else if (isAll) {
      dists = poses.map(function() {
        return [distX, distY];
      });
    }
    var nextPoses = poses.map(function(pos, i) {
      return plus(pos, dists[i]);
    });
    var guidePoses = __spreadArray([], __read(nextPoses), false);
    state.snapBoundInfos = null;
    var isCircle = clipPath.type === "circle";
    var isEllipse = clipPath.type === "ellipse";
    if (isCircle || isEllipse) {
      var guideRect = getRect(nextPoses);
      var ry = abs(guideRect.bottom - guideRect.top);
      var rx = abs(isEllipse ? guideRect.right - guideRect.left : ry);
      var bottom = nextPoses[0][1] + ry;
      var left = nextPoses[0][0] - rx;
      var right = nextPoses[0][0] + rx;
      if (isCircle) {
        guidePoses.push([right, guideRect.bottom]);
        dists.push([1, 0]);
      }
      guidePoses.push([guideRect.left, bottom]);
      dists.push([0, 1]);
      guidePoses.push([left, guideRect.bottom]);
      dists.push([1, 0]);
    }
    var guidelines = getDefaultGuidelines((props.clipHorizontalGuidelines || []).map(function(v) {
      return convertUnitSize("".concat(v), height);
    }), (props.clipVerticalGuidelines || []).map(function(v) {
      return convertUnitSize("".concat(v), width);
    }), width, height);
    var guideXPoses = [];
    var guideYPoses = [];
    if (isCircle || isEllipse) {
      guideXPoses = [guidePoses[4][0], guidePoses[2][0]];
      guideYPoses = [guidePoses[1][1], guidePoses[3][1]];
    } else if (isRect) {
      var rectPoses = [guidePoses[0], guidePoses[2], guidePoses[4], guidePoses[6]];
      var rectDists_1 = [dists[0], dists[2], dists[4], dists[6]];
      guideXPoses = rectPoses.filter(function(_, i) {
        return rectDists_1[i][0];
      }).map(function(pos) {
        return pos[0];
      });
      guideYPoses = rectPoses.filter(function(_, i) {
        return rectDists_1[i][1];
      }).map(function(pos) {
        return pos[1];
      });
    } else {
      guideXPoses = guidePoses.filter(function(_, i) {
        return dists[i][0];
      }).map(function(pos) {
        return pos[0];
      });
      guideYPoses = guidePoses.filter(function(_, i) {
        return dists[i][1];
      }).map(function(pos) {
        return pos[1];
      });
    }
    var boundDelta = [0, 0];
    var _f = checkSnapBounds(guidelines, props.clipTargetBounds && { left: 0, top: 0, right: width, bottom: height }, guideXPoses, guideYPoses, 5), horizontalSnapInfo = _f.horizontal, verticalSnapInfo = _f.vertical;
    var snapOffsetY = horizontalSnapInfo.offset;
    var snapOffsetX = verticalSnapInfo.offset;
    if (horizontalSnapInfo.isBound) {
      boundDelta[1] += snapOffsetY;
    }
    if (verticalSnapInfo.isBound) {
      boundDelta[0] += snapOffsetX;
    }
    if ((isEllipse || isCircle) && dists[0][0] === 0 && dists[0][1] === 0) {
      var guideRect = getRect(nextPoses);
      var cy = guideRect.bottom - guideRect.top;
      var cx = isEllipse ? guideRect.right - guideRect.left : cy;
      var distSnapX = verticalSnapInfo.isBound ? abs(snapOffsetX) : verticalSnapInfo.snapIndex === 0 ? -snapOffsetX : snapOffsetX;
      var distSnapY = horizontalSnapInfo.isBound ? abs(snapOffsetY) : horizontalSnapInfo.snapIndex === 0 ? -snapOffsetY : snapOffsetY;
      cx -= distSnapX;
      cy -= distSnapY;
      if (isCircle) {
        cy = checkSnapBoundPriority(verticalSnapInfo, horizontalSnapInfo) > 0 ? cy : cx;
        cx = cy;
      }
      var center = guidePoses[0];
      guidePoses[1][1] = center[1] - cy;
      guidePoses[2][0] = center[0] + cx;
      guidePoses[3][1] = center[1] + cy;
      guidePoses[4][0] = center[0] - cx;
    } else if (isRect && keepRatio && isControl) {
      var _g = __read(getControlSize(clipPoses), 2), width_1 = _g[0], height_1 = _g[1];
      var ratio = width_1 && height_1 ? width_1 / height_1 : 0;
      var clipPose = clipPoses[clipIndex];
      var direction = clipPose.direction || "";
      var top_2 = guidePoses[1][1];
      var bottom = guidePoses[5][1];
      var left = guidePoses[7][0];
      var right = guidePoses[3][0];
      if (abs(snapOffsetY) <= abs(snapOffsetX)) {
        snapOffsetY = sign(snapOffsetY) * abs(snapOffsetX) / ratio;
      } else {
        snapOffsetX = sign(snapOffsetX) * abs(snapOffsetY) * ratio;
      }
      if (direction.indexOf("w") > -1) {
        left -= snapOffsetX;
      } else if (direction.indexOf("e") > -1) {
        right -= snapOffsetX;
      } else {
        left += snapOffsetX / 2;
        right -= snapOffsetX / 2;
      }
      if (direction.indexOf("n") > -1) {
        top_2 -= snapOffsetY;
      } else if (direction.indexOf("s") > -1) {
        bottom -= snapOffsetY;
      } else {
        top_2 += snapOffsetY / 2;
        bottom -= snapOffsetY / 2;
      }
      var nextControlPoses_2 = getRectPoses(top_2, right, bottom, left);
      guidePoses.forEach(function(pos, i) {
        var _a2;
        _a2 = __read(nextControlPoses_2[i].pos, 2), pos[0] = _a2[0], pos[1] = _a2[1];
      });
    } else {
      guidePoses.forEach(function(pos, j) {
        var dist2 = dists[j];
        if (dist2[0]) {
          pos[0] -= snapOffsetX;
        }
        if (dist2[1]) {
          pos[1] -= snapOffsetY;
        }
      });
    }
    var nextClipStyles = getClipStyles(moveable, clipPath, nextPoses);
    var clipStyle = "".concat(clipType, "(").concat(nextClipStyles.join(splitter), ")");
    state.clipPathState = clipStyle;
    if (isCircle || isEllipse) {
      guideXPoses = [guidePoses[4][0], guidePoses[2][0]];
      guideYPoses = [guidePoses[1][1], guidePoses[3][1]];
    } else if (isRect) {
      var rectPoses = [guidePoses[0], guidePoses[2], guidePoses[4], guidePoses[6]];
      guideXPoses = rectPoses.map(function(pos) {
        return pos[0];
      });
      guideYPoses = rectPoses.map(function(pos) {
        return pos[1];
      });
    } else {
      guideXPoses = guidePoses.map(function(pos) {
        return pos[0];
      });
      guideYPoses = guidePoses.map(function(pos) {
        return pos[1];
      });
    }
    state.snapBoundInfos = checkSnapBounds(guidelines, props.clipTargetBounds && { left: 0, top: 0, right: width, bottom: height }, guideXPoses, guideYPoses, 1);
    if (originalDraggable) {
      var is3d = state.is3d, allMatrix = state.allMatrix;
      var n = is3d ? 4 : 3;
      var dragDist = boundDelta;
      if (isDragTarget) {
        dragDist = [
          firstDist[0] + boundDelta[0] - originalDist[0],
          firstDist[1] + boundDelta[1] - originalDist[1]
        ];
      }
      originalDraggable.deltaOffset = multiply(allMatrix, [dragDist[0], dragDist[1], 0, 0], n);
    }
    triggerEvent(moveable, "onClip", fillParams(moveable, e, __assign6({ clipEventType: "changed", clipType, poses: nextPoses, clipStyle, clipStyles: nextClipStyles, distX, distY }, fillCSSObject((_c = {}, _c[clipType === "rect" ? "clip" : "clipPath"] = clipStyle, _c), e))));
    return true;
  },
  dragControlEnd: function(moveable, e) {
    this.unset(moveable);
    var isDrag = e.isDrag, datas = e.datas, isDouble = e.isDouble;
    var isLine = datas.isLine, isClipStart = datas.isClipStart, isControl = datas.isControl;
    if (!isClipStart) {
      return false;
    }
    triggerEvent(moveable, "onClipEnd", fillEndParams(moveable, e, {}));
    if (isDouble) {
      if (isControl) {
        removeClipPath(moveable, e);
      } else if (isLine) {
        addClipPath(moveable, e);
      }
    }
    return isDouble || isDrag;
  },
  unset: function(moveable) {
    moveable.state.clipPathState = "";
    moveable.state.snapBoundInfos = null;
  }
};
var OriginDraggable = {
  name: "originDraggable",
  props: [
    "originDraggable",
    "originRelative"
  ],
  events: [
    "dragOriginStart",
    "dragOrigin",
    "dragOriginEnd"
  ],
  css: [
    ":host[data-able-origindraggable] .control.origin {\npointer-events: auto;\n}"
  ],
  dragControlCondition: function(_, e) {
    if (e.isRequest) {
      return e.requestAble === "originDraggable";
    }
    return hasClass(e.inputEvent.target, prefix("origin"));
  },
  dragControlStart: function(moveable, e) {
    var datas = e.datas;
    setDragStart(moveable, e);
    var params = fillParams(moveable, e, {
      dragStart: Draggable.dragStart(moveable, new CustomGesto().dragStart([0, 0], e))
    });
    var result = triggerEvent(moveable, "onDragOriginStart", params);
    datas.startOrigin = moveable.state.transformOrigin;
    datas.startTargetOrigin = moveable.state.targetOrigin;
    datas.prevOrigin = [0, 0];
    datas.isDragOrigin = true;
    if (result === false) {
      datas.isDragOrigin = false;
      return false;
    }
    return params;
  },
  dragControl: function(moveable, e) {
    var datas = e.datas, isPinch = e.isPinch, isRequest = e.isRequest;
    if (!datas.isDragOrigin) {
      return false;
    }
    var _a = __read(getDragDist(e), 2), distX = _a[0], distY = _a[1];
    var state = moveable.state;
    var width = state.width, height = state.height, offsetMatrix = state.offsetMatrix, targetMatrix = state.targetMatrix, is3d = state.is3d;
    var _b = moveable.props.originRelative, originRelative = _b === void 0 ? true : _b;
    var n = is3d ? 4 : 3;
    var dist = [distX, distY];
    if (isRequest) {
      var distOrigin = e.distOrigin;
      if (distOrigin[0] || distOrigin[1]) {
        dist = distOrigin;
      }
    }
    var origin = plus(datas.startOrigin, dist);
    var targetOrigin = plus(datas.startTargetOrigin, dist);
    var delta = minus(dist, datas.prevOrigin);
    var nextMatrix = getNextMatrix(offsetMatrix, targetMatrix, origin, n);
    var rect = moveable.getRect();
    var nextRect = getRect(calculatePoses(nextMatrix, width, height, n));
    var dragDelta = [
      rect.left - nextRect.left,
      rect.top - nextRect.top
    ];
    datas.prevOrigin = dist;
    var transformOrigin = [
      convertCSSSize(targetOrigin[0], width, originRelative),
      convertCSSSize(targetOrigin[1], height, originRelative)
    ].join(" ");
    var result = Draggable.drag(moveable, setCustomDrag(e, moveable.state, dragDelta, !!isPinch, false));
    var params = fillParams(moveable, e, __assign6(__assign6({ width, height, origin, dist, delta, transformOrigin, drag: result }, fillCSSObject({
      transformOrigin,
      transform: result.transform
    }, e)), { afterTransform: result.transform }));
    triggerEvent(moveable, "onDragOrigin", params);
    return params;
  },
  dragControlEnd: function(moveable, e) {
    var datas = e.datas;
    if (!datas.isDragOrigin) {
      return false;
    }
    triggerEvent(moveable, "onDragOriginEnd", fillEndParams(moveable, e, {}));
    return true;
  },
  dragGroupControlCondition: function(moveable, e) {
    return this.dragControlCondition(moveable, e);
  },
  dragGroupControlStart: function(moveable, e) {
    var params = this.dragControlStart(moveable, e);
    if (!params) {
      return false;
    }
    return true;
  },
  dragGroupControl: function(moveable, e) {
    var params = this.dragControl(moveable, e);
    if (!params) {
      return false;
    }
    moveable.transformOrigin = params.transformOrigin;
    return true;
  },
  /**
      * @method Moveable.OriginDraggable#request
      * @param {object} e - the OriginDraggable's request parameter
      * @param {number} [e.x] - x position
      * @param {number} [e.y] - y position
      * @param {number} [e.deltaX] - x number to move
      * @param {number} [e.deltaY] - y number to move
      * @param {array} [e.deltaOrigin] - left, top number to move transform-origin
      * @param {array} [e.origin] - transform-origin position
      * @param {number} [e.isInstant] - Whether to execute the request instantly
      * @return {Moveable.Requester} Moveable Requester
      * @example
  
      * // Instantly Request (requestStart - request - requestEnd)
      * // Use Relative Value
      * moveable.request("originDraggable", { deltaX: 10, deltaY: 10 }, true);
      * // Use Absolute Value
      * moveable.request("originDraggable", { x: 200, y: 100 }, true);
      * // Use Transform Value
      * moveable.request("originDraggable", { deltaOrigin: [10, 0] }, true);
      * moveable.request("originDraggable", { origin: [100, 0] }, true);
      * // requestStart
      * const requester = moveable.request("originDraggable");
      *
      * // request
      * // Use Relative Value
      * requester.request({ deltaX: 10, deltaY: 10 });
      * requester.request({ deltaX: 10, deltaY: 10 });
      * requester.request({ deltaX: 10, deltaY: 10 });
      * // Use Absolute Value
      * moveable.request("originDraggable", { x: 200, y: 100 });
      * moveable.request("originDraggable", { x: 220, y: 100 });
      * moveable.request("originDraggable", { x: 240, y: 100 });
      *
      * // requestEnd
      * requester.requestEnd();
      */
  request: function(moveable) {
    var datas = {};
    var rect = moveable.getRect();
    var distX = 0;
    var distY = 0;
    var transformOrigin = rect.transformOrigin;
    var distOrigin = [0, 0];
    return {
      isControl: true,
      requestStart: function() {
        return { datas };
      },
      request: function(e) {
        if ("deltaOrigin" in e) {
          distOrigin[0] += e.deltaOrigin[0];
          distOrigin[1] += e.deltaOrigin[1];
        } else if ("origin" in e) {
          distOrigin[0] = e.origin[0] - transformOrigin[0];
          distOrigin[1] = e.origin[1] - transformOrigin[1];
        } else {
          if ("x" in e) {
            distX = e.x - rect.left;
          } else if ("deltaX" in e) {
            distX += e.deltaX;
          }
          if ("y" in e) {
            distY = e.y - rect.top;
          } else if ("deltaY" in e) {
            distY += e.deltaY;
          }
        }
        return { datas, distX, distY, distOrigin };
      },
      requestEnd: function() {
        return { datas, isDrag: true };
      }
    };
  }
};
function addBorderRadiusByLine(controlPoses, lineIndex, distX, distY) {
  var horizontalsLength = controlPoses.filter(function(_a) {
    var virtual = _a.virtual, horizontal = _a.horizontal;
    return horizontal && !virtual;
  }).length;
  var verticalsLength = controlPoses.filter(function(_a) {
    var virtual = _a.virtual, vertical = _a.vertical;
    return vertical && !virtual;
  }).length;
  var controlIndex = -1;
  if (lineIndex === 0) {
    if (horizontalsLength === 0) {
      controlIndex = 0;
    } else if (horizontalsLength === 1) {
      controlIndex = 1;
    }
  }
  if (lineIndex === 2) {
    if (horizontalsLength <= 2) {
      controlIndex = 2;
    } else if (horizontalsLength <= 3) {
      controlIndex = 3;
    }
  }
  if (lineIndex === 3) {
    if (verticalsLength === 0) {
      controlIndex = 4;
    } else if (verticalsLength < 4) {
      controlIndex = 7;
    }
  }
  if (lineIndex === 1) {
    if (verticalsLength <= 1) {
      controlIndex = 5;
    } else if (verticalsLength <= 2) {
      controlIndex = 6;
    }
  }
  if (controlIndex === -1 || !controlPoses[controlIndex].virtual) {
    return;
  }
  var controlPoseInfo = controlPoses[controlIndex];
  addBorderRadius(controlPoses, controlIndex);
  if (controlIndex < 4) {
    controlPoseInfo.pos[0] = distX;
  } else {
    controlPoseInfo.pos[1] = distY;
  }
}
function addBorderRadius(controlPoses, index) {
  if (index < 4) {
    controlPoses.slice(0, index + 1).forEach(function(info) {
      info.virtual = false;
    });
  } else {
    if (controlPoses[0].virtual) {
      controlPoses[0].virtual = false;
    }
    controlPoses.slice(4, index + 1).forEach(function(info) {
      info.virtual = false;
    });
  }
}
function removeBorderRadius(controlPoses, index) {
  if (index < 4) {
    controlPoses.slice(index, 4).forEach(function(info) {
      info.virtual = true;
    });
  } else {
    controlPoses.slice(index).forEach(function(info) {
      info.virtual = true;
    });
  }
}
function getBorderRadius(borderRadius, width, height, minCounts, full) {
  if (minCounts === void 0) {
    minCounts = [0, 0];
  }
  var values = [];
  if (!borderRadius || borderRadius === "0px") {
    values = [];
  } else {
    values = splitSpace(borderRadius);
  }
  return getRadiusValues(values, width, height, 0, 0, minCounts, full);
}
function triggerRoundEvent(moveable, e, dist, delta, nextPoses) {
  var state = moveable.state;
  var width = state.width, height = state.height;
  var _a = getRadiusStyles(nextPoses, moveable.props.roundRelative, width, height), raws = _a.raws, styles = _a.styles, radiusPoses = _a.radiusPoses;
  var _b = splitRadiusPoses(radiusPoses, raws), horizontals = _b.horizontals, verticals = _b.verticals;
  var borderRadius = styles.join(" ");
  state.borderRadiusState = borderRadius;
  var params = fillParams(moveable, e, __assign6({ horizontals, verticals, borderRadius, width, height, delta, dist }, fillCSSObject({
    borderRadius
  }, e)));
  triggerEvent(moveable, "onRound", params);
  return params;
}
function getStyleBorderRadius(moveable) {
  var _a, _b;
  var style = moveable.getState().style;
  var borderRadius = style.borderRadius || "";
  if (!borderRadius && moveable.props.groupable) {
    var firstMoveable = moveable.moveables[0];
    var firstTarget = moveable.getTargets()[0];
    if (firstTarget) {
      if ((firstMoveable === null || firstMoveable === void 0 ? void 0 : firstMoveable.props.target) === firstTarget) {
        borderRadius = (_b = (_a = moveable.moveables[0]) === null || _a === void 0 ? void 0 : _a.state.style.borderRadius) !== null && _b !== void 0 ? _b : "";
        style.borderRadius = borderRadius;
      } else {
        borderRadius = getComputedStyle2(firstTarget).borderRadius;
        style.borderRadius = borderRadius;
      }
    }
  }
  return borderRadius;
}
var Roundable = {
  name: "roundable",
  props: [
    "roundable",
    "roundRelative",
    "minRoundControls",
    "maxRoundControls",
    "roundClickable",
    "roundPadding",
    "isDisplayShadowRoundControls"
  ],
  events: [
    "roundStart",
    "round",
    "roundEnd",
    "roundGroupStart",
    "roundGroup",
    "roundGroupEnd"
  ],
  css: [
    ".control.border-radius {\nbackground: #d66;\ncursor: pointer;\nz-index: 3;\n}",
    ".control.border-radius.vertical {\nbackground: #d6d;\nz-index: 2;\n}",
    ".control.border-radius.virtual {\nopacity: 0.5;\nz-index: 1;\n}",
    ":host.round-line-clickable .line.direction {\ncursor: pointer;\n}"
  ],
  className: function(moveable) {
    var roundClickable = moveable.props.roundClickable;
    return roundClickable === true || roundClickable === "line" ? prefix("round-line-clickable") : "";
  },
  requestStyle: function() {
    return ["borderRadius"];
  },
  requestChildStyle: function() {
    return ["borderRadius"];
  },
  render: function(moveable, React3) {
    var _a = moveable.getState(), target = _a.target, width = _a.width, height = _a.height, allMatrix = _a.allMatrix, is3d = _a.is3d, left = _a.left, top = _a.top, borderRadiusState = _a.borderRadiusState;
    var _b = moveable.props, _c = _b.minRoundControls, minRoundControls = _c === void 0 ? [0, 0] : _c, _d = _b.maxRoundControls, maxRoundControls = _d === void 0 ? [4, 4] : _d, zoom = _b.zoom, _e = _b.roundPadding, roundPadding = _e === void 0 ? 0 : _e, isDisplayShadowRoundControls = _b.isDisplayShadowRoundControls, groupable = _b.groupable;
    if (!target) {
      return null;
    }
    var borderRadius = borderRadiusState || getStyleBorderRadius(moveable);
    var n = is3d ? 4 : 3;
    var radiusValues = getBorderRadius(borderRadius, width, height, minRoundControls, true);
    if (!radiusValues) {
      return null;
    }
    var verticalCount = 0;
    var horizontalCount = 0;
    var basePos = groupable ? [0, 0] : [left, top];
    return radiusValues.map(function(v, i) {
      var horizontal = v.horizontal;
      var vertical = v.vertical;
      var direction = v.direction || "";
      var originalPos = __spreadArray([], __read(v.pos), false);
      horizontalCount += Math.abs(horizontal);
      verticalCount += Math.abs(vertical);
      if (horizontal && direction.indexOf("n") > -1) {
        originalPos[1] -= roundPadding;
      }
      if (vertical && direction.indexOf("w") > -1) {
        originalPos[0] -= roundPadding;
      }
      if (horizontal && direction.indexOf("s") > -1) {
        originalPos[1] += roundPadding;
      }
      if (vertical && direction.indexOf("e") > -1) {
        originalPos[0] += roundPadding;
      }
      var pos = minus(calculatePosition(allMatrix, originalPos, n), basePos);
      var isDisplayVerticalShadow = isDisplayShadowRoundControls && isDisplayShadowRoundControls !== "horizontal";
      var isDisplay = v.vertical ? verticalCount <= maxRoundControls[1] && (isDisplayVerticalShadow || !v.virtual) : horizontalCount <= maxRoundControls[0] && (isDisplayShadowRoundControls || !v.virtual);
      return React3.createElement("div", { key: "borderRadiusControl".concat(i), className: prefix("control", "border-radius", v.vertical ? "vertical" : "", v.virtual ? "virtual" : ""), "data-radius-index": i, style: {
        display: isDisplay ? "block" : "none",
        transform: "translate(".concat(pos[0], "px, ").concat(pos[1], "px) scale(").concat(zoom, ")")
      } });
    });
  },
  dragControlCondition: function(moveable, e) {
    if (!e.inputEvent || e.isRequest) {
      return false;
    }
    var className = e.inputEvent.target.getAttribute("class") || "";
    return className.indexOf("border-radius") > -1 || className.indexOf("moveable-line") > -1 && className.indexOf("moveable-direction") > -1;
  },
  dragGroupControlCondition: function(moveable, e) {
    return this.dragControlCondition(moveable, e);
  },
  dragControlStart: function(moveable, e) {
    var inputEvent = e.inputEvent, datas = e.datas;
    var inputTarget = inputEvent.target;
    var className = inputTarget.getAttribute("class") || "";
    var isControl = className.indexOf("border-radius") > -1;
    var isLine = className.indexOf("moveable-line") > -1 && className.indexOf("moveable-direction") > -1;
    var controlIndex = isControl ? parseInt(inputTarget.getAttribute("data-radius-index"), 10) : -1;
    var lineIndex = -1;
    if (isLine) {
      var indexAttr = inputTarget.getAttribute("data-line-key") || "";
      if (indexAttr) {
        lineIndex = parseInt(indexAttr.replace(/render-line-/g, ""), 10);
        if (isNaN(lineIndex)) {
          lineIndex = -1;
        }
      }
    }
    if (!isControl && !isLine) {
      return false;
    }
    var params = fillParams(moveable, e, {});
    var result = triggerEvent(moveable, "onRoundStart", params);
    if (result === false) {
      return false;
    }
    datas.lineIndex = lineIndex;
    datas.controlIndex = controlIndex;
    datas.isControl = isControl;
    datas.isLine = isLine;
    setDragStart(moveable, e);
    var _a = moveable.props, roundRelative = _a.roundRelative, _b = _a.minRoundControls, minRoundControls = _b === void 0 ? [0, 0] : _b;
    var state = moveable.state;
    var width = state.width, height = state.height;
    datas.isRound = true;
    datas.prevDist = [0, 0];
    var borderRadius = getStyleBorderRadius(moveable);
    var controlPoses = getBorderRadius(borderRadius || "", width, height, minRoundControls, true) || [];
    datas.controlPoses = controlPoses;
    state.borderRadiusState = getRadiusStyles(controlPoses, roundRelative, width, height).styles.join(" ");
    return params;
  },
  dragControl: function(moveable, e) {
    var datas = e.datas;
    var controlPoses = datas.controlPoses;
    if (!datas.isRound || !datas.isControl || !controlPoses.length) {
      return false;
    }
    var index = datas.controlIndex;
    var _a = __read(getDragDist(e), 2), distX = _a[0], distY = _a[1];
    var dist = [distX, distY];
    var delta = minus(dist, datas.prevDist);
    var _b = moveable.props.maxRoundControls, maxRoundControls = _b === void 0 ? [4, 4] : _b;
    var _c = moveable.state, width = _c.width, height = _c.height;
    var selectedControlPose = controlPoses[index];
    var selectedVertical = selectedControlPose.vertical;
    var selectedHorizontal = selectedControlPose.horizontal;
    var dists = controlPoses.map(function(pose) {
      var horizontal = pose.horizontal, vertical = pose.vertical;
      var poseDist = [
        horizontal * selectedHorizontal * dist[0],
        vertical * selectedVertical * dist[1]
      ];
      if (horizontal) {
        if (maxRoundControls[0] === 1) {
          return poseDist;
        } else if (maxRoundControls[0] < 4 && horizontal !== selectedHorizontal) {
          return poseDist;
        }
      } else if (maxRoundControls[1] === 0) {
        poseDist[1] = vertical * selectedHorizontal * dist[0] / width * height;
        return poseDist;
      } else if (selectedVertical) {
        if (maxRoundControls[1] === 1) {
          return poseDist;
        } else if (maxRoundControls[1] < 4 && vertical !== selectedVertical) {
          return poseDist;
        }
      }
      return [0, 0];
    });
    dists[index] = dist;
    var nextPoses = controlPoses.map(function(info, i) {
      return __assign6(__assign6({}, info), { pos: plus(info.pos, dists[i]) });
    });
    if (index < 4) {
      nextPoses.slice(0, index + 1).forEach(function(info) {
        info.virtual = false;
      });
    } else {
      nextPoses.slice(4, index + 1).forEach(function(info) {
        info.virtual = false;
      });
    }
    datas.prevDist = [distX, distY];
    return triggerRoundEvent(moveable, e, dist, delta, nextPoses);
  },
  dragControlEnd: function(moveable, e) {
    var state = moveable.state;
    state.borderRadiusState = "";
    var datas = e.datas, isDouble = e.isDouble;
    if (!datas.isRound) {
      return false;
    }
    var isControl = datas.isControl, controlIndex = datas.controlIndex, isLine = datas.isLine, lineIndex = datas.lineIndex;
    var controlPoses = datas.controlPoses;
    var length = controlPoses.filter(function(_a2) {
      var virtual = _a2.virtual;
      return virtual;
    }).length;
    var _a = moveable.props.roundClickable, roundClickable = _a === void 0 ? true : _a;
    if (isDouble && roundClickable) {
      if (isControl && (roundClickable === true || roundClickable === "control")) {
        removeBorderRadius(controlPoses, controlIndex);
      } else if (isLine && (roundClickable === true || roundClickable === "line")) {
        var _b = __read(calculatePointerDist(moveable, e), 2), distX = _b[0], distY = _b[1];
        addBorderRadiusByLine(controlPoses, lineIndex, distX, distY);
      }
      if (length !== controlPoses.filter(function(_a2) {
        var virtual = _a2.virtual;
        return virtual;
      }).length) {
        triggerRoundEvent(moveable, e, [0, 0], [0, 0], controlPoses);
      }
    }
    var params = fillEndParams(moveable, e, {});
    triggerEvent(moveable, "onRoundEnd", params);
    state.borderRadiusState = "";
    return params;
  },
  dragGroupControlStart: function(moveable, e) {
    var result = this.dragControlStart(moveable, e);
    if (!result) {
      return false;
    }
    var moveables = moveable.moveables;
    var targets = moveable.props.targets;
    var events = fillChildEvents(moveable, "roundable", e);
    var nextParams = __assign6({ targets: moveable.props.targets, events: events.map(function(ev, i) {
      return __assign6(__assign6({}, ev), { target: targets[i], moveable: moveables[i], currentTarget: moveables[i] });
    }) }, result);
    triggerEvent(moveable, "onRoundGroupStart", nextParams);
    return result;
  },
  dragGroupControl: function(moveable, e) {
    var result = this.dragControl(moveable, e);
    if (!result) {
      return false;
    }
    var moveables = moveable.moveables;
    var targets = moveable.props.targets;
    var events = fillChildEvents(moveable, "roundable", e);
    var nextParams = __assign6({ targets: moveable.props.targets, events: events.map(function(ev, i) {
      return __assign6(__assign6(__assign6({}, ev), { target: targets[i], moveable: moveables[i], currentTarget: moveables[i] }), fillCSSObject({
        borderRadius: result.borderRadius
      }, ev));
    }) }, result);
    triggerEvent(moveable, "onRoundGroup", nextParams);
    return nextParams;
  },
  dragGroupControlEnd: function(moveable, e) {
    var moveables = moveable.moveables;
    var targets = moveable.props.targets;
    var events = fillChildEvents(moveable, "roundable", e);
    catchEvent(moveable, "onRound", function(parentEvent) {
      var nextParams2 = __assign6({ targets: moveable.props.targets, events: events.map(function(ev, i) {
        return __assign6(__assign6(__assign6({}, ev), { target: targets[i], moveable: moveables[i], currentTarget: moveables[i] }), fillCSSObject({
          borderRadius: parentEvent.borderRadius
        }, ev));
      }) }, parentEvent);
      triggerEvent(moveable, "onRoundGroup", nextParams2);
    });
    var result = this.dragControlEnd(moveable, e);
    if (!result) {
      return false;
    }
    var nextParams = __assign6({ targets: moveable.props.targets, events: events.map(function(ev, i) {
      var _a;
      return __assign6(__assign6({}, ev), { target: targets[i], moveable: moveables[i], currentTarget: moveables[i], lastEvent: (_a = ev.datas) === null || _a === void 0 ? void 0 : _a.lastEvent });
    }) }, result);
    triggerEvent(moveable, "onRoundGroupEnd", nextParams);
    return nextParams;
  },
  unset: function(moveable) {
    moveable.state.borderRadiusState = "";
  }
};
function isIdentityMatrix(matrix, is3d) {
  var n = is3d ? 4 : 3;
  var identityMatrix = createIdentityMatrix(n);
  var value = "matrix".concat(is3d ? "3d" : "", "(").concat(identityMatrix.join(","), ")");
  return matrix === value || matrix === "matrix(1,0,0,1,0,0)";
}
var BeforeRenderable = {
  isPinch: true,
  name: "beforeRenderable",
  props: [],
  events: [
    "beforeRenderStart",
    "beforeRender",
    "beforeRenderEnd",
    "beforeRenderGroupStart",
    "beforeRenderGroup",
    "beforeRenderGroupEnd"
  ],
  dragRelation: "weak",
  setTransform: function(moveable, e) {
    var _a = moveable.state, is3d = _a.is3d, targetMatrix = _a.targetMatrix, inlineTransform = _a.inlineTransform;
    var cssMatrix = is3d ? "matrix3d(".concat(targetMatrix.join(","), ")") : "matrix(".concat(convertMatrixtoCSS(targetMatrix, true), ")");
    var startTransform = !inlineTransform || inlineTransform === "none" ? cssMatrix : inlineTransform;
    e.datas.startTransforms = isIdentityMatrix(startTransform, is3d) ? [] : splitSpace(startTransform);
  },
  resetStyle: function(e) {
    var datas = e.datas;
    datas.nextStyle = {};
    datas.nextTransforms = e.datas.startTransforms;
    datas.nextTransformAppendedIndexes = [];
  },
  fillDragStartParams: function(moveable, e) {
    return fillParams(moveable, e, {
      setTransform: function(transform) {
        e.datas.startTransforms = isArray(transform) ? transform : splitSpace(transform);
      },
      isPinch: !!e.isPinch
    });
  },
  fillDragParams: function(moveable, e) {
    return fillParams(moveable, e, {
      isPinch: !!e.isPinch
    });
  },
  dragStart: function(moveable, e) {
    this.setTransform(moveable, e);
    this.resetStyle(e);
    triggerEvent(moveable, "onBeforeRenderStart", this.fillDragStartParams(moveable, e));
  },
  drag: function(moveable, e) {
    if (!e.datas.startTransforms) {
      this.setTransform(moveable, e);
    }
    this.resetStyle(e);
    triggerEvent(moveable, "onBeforeRender", fillParams(moveable, e, {
      isPinch: !!e.isPinch
    }));
  },
  dragEnd: function(moveable, e) {
    if (!e.datas.startTransforms) {
      this.setTransform(moveable, e);
      this.resetStyle(e);
    }
    triggerEvent(moveable, "onBeforeRenderEnd", fillParams(moveable, e, {
      isPinch: !!e.isPinch,
      isDrag: e.isDrag
    }));
  },
  dragGroupStart: function(moveable, e) {
    var _this = this;
    this.dragStart(moveable, e);
    var events = fillChildEvents(moveable, "beforeRenderable", e);
    var moveables = moveable.moveables;
    var params = events.map(function(childEvent, i) {
      var childMoveable = moveables[i];
      _this.setTransform(childMoveable, childEvent);
      _this.resetStyle(childEvent);
      return _this.fillDragStartParams(childMoveable, childEvent);
    });
    triggerEvent(moveable, "onBeforeRenderGroupStart", fillParams(moveable, e, {
      isPinch: !!e.isPinch,
      targets: moveable.props.targets,
      setTransform: function() {
      },
      events: params
    }));
  },
  dragGroup: function(moveable, e) {
    var _this = this;
    this.drag(moveable, e);
    var events = fillChildEvents(moveable, "beforeRenderable", e);
    var moveables = moveable.moveables;
    var params = events.map(function(childEvent, i) {
      var childMoveable = moveables[i];
      _this.resetStyle(childEvent);
      return _this.fillDragParams(childMoveable, childEvent);
    });
    triggerEvent(moveable, "onBeforeRenderGroup", fillParams(moveable, e, {
      isPinch: !!e.isPinch,
      targets: moveable.props.targets,
      events: params
    }));
  },
  dragGroupEnd: function(moveable, e) {
    this.dragEnd(moveable, e);
    triggerEvent(moveable, "onBeforeRenderGroupEnd", fillParams(moveable, e, {
      isPinch: !!e.isPinch,
      isDrag: e.isDrag,
      targets: moveable.props.targets
    }));
  },
  dragControlStart: function(moveable, e) {
    return this.dragStart(moveable, e);
  },
  dragControl: function(moveable, e) {
    return this.drag(moveable, e);
  },
  dragControlEnd: function(moveable, e) {
    return this.dragEnd(moveable, e);
  },
  dragGroupControlStart: function(moveable, e) {
    return this.dragGroupStart(moveable, e);
  },
  dragGroupControl: function(moveable, e) {
    return this.dragGroup(moveable, e);
  },
  dragGroupControlEnd: function(moveable, e) {
    return this.dragGroupEnd(moveable, e);
  }
};
var Renderable = {
  name: "renderable",
  props: [],
  events: [
    "renderStart",
    "render",
    "renderEnd",
    "renderGroupStart",
    "renderGroup",
    "renderGroupEnd"
  ],
  dragRelation: "weak",
  dragStart: function(moveable, e) {
    triggerEvent(moveable, "onRenderStart", fillParams(moveable, e, {
      isPinch: !!e.isPinch
    }));
  },
  drag: function(moveable, e) {
    triggerEvent(moveable, "onRender", this.fillDragParams(moveable, e));
  },
  dragAfter: function(moveable, e) {
    return this.drag(moveable, e);
  },
  dragEnd: function(moveable, e) {
    triggerEvent(moveable, "onRenderEnd", this.fillDragEndParams(moveable, e));
  },
  dragGroupStart: function(moveable, e) {
    triggerEvent(moveable, "onRenderGroupStart", fillParams(moveable, e, {
      isPinch: !!e.isPinch,
      targets: moveable.props.targets
    }));
  },
  dragGroup: function(moveable, e) {
    var _this = this;
    var events = fillChildEvents(moveable, "beforeRenderable", e);
    var moveables = moveable.moveables;
    var params = events.map(function(childEvent, i) {
      var childMoveable = moveables[i];
      return _this.fillDragParams(childMoveable, childEvent);
    });
    triggerEvent(moveable, "onRenderGroup", fillParams(moveable, e, __assign6(__assign6({ isPinch: !!e.isPinch, targets: moveable.props.targets, transform: getNextTransformText(e), transformObject: {} }, fillCSSObject(getNextStyle(e))), { events: params })));
  },
  dragGroupEnd: function(moveable, e) {
    var _this = this;
    var events = fillChildEvents(moveable, "beforeRenderable", e);
    var moveables = moveable.moveables;
    var params = events.map(function(childEvent, i) {
      var childMoveable = moveables[i];
      return _this.fillDragEndParams(childMoveable, childEvent);
    });
    triggerEvent(moveable, "onRenderGroupEnd", fillParams(moveable, e, __assign6({ isPinch: !!e.isPinch, isDrag: e.isDrag, targets: moveable.props.targets, events: params, transformObject: {}, transform: getNextTransformText(e) }, fillCSSObject(getNextStyle(e)))));
  },
  dragControlStart: function(moveable, e) {
    return this.dragStart(moveable, e);
  },
  dragControl: function(moveable, e) {
    return this.drag(moveable, e);
  },
  dragControlAfter: function(moveable, e) {
    return this.dragAfter(moveable, e);
  },
  dragControlEnd: function(moveable, e) {
    return this.dragEnd(moveable, e);
  },
  dragGroupControlStart: function(moveable, e) {
    return this.dragGroupStart(moveable, e);
  },
  dragGroupControl: function(moveable, e) {
    return this.dragGroup(moveable, e);
  },
  dragGroupControlEnd: function(moveable, e) {
    return this.dragGroupEnd(moveable, e);
  },
  fillDragParams: function(moveable, e) {
    var transformObject = {};
    parse(getNextTransforms(e) || []).forEach(function(matrixInfo) {
      transformObject[matrixInfo.name] = matrixInfo.functionValue;
    });
    return fillParams(moveable, e, __assign6({ isPinch: !!e.isPinch, transformObject, transform: getNextTransformText(e) }, fillCSSObject(getNextStyle(e))));
  },
  fillDragEndParams: function(moveable, e) {
    var transformObject = {};
    parse(getNextTransforms(e) || []).forEach(function(matrixInfo) {
      transformObject[matrixInfo.name] = matrixInfo.functionValue;
    });
    return fillParams(moveable, e, __assign6({ isPinch: !!e.isPinch, isDrag: e.isDrag, transformObject, transform: getNextTransformText(e) }, fillCSSObject(getNextStyle(e))));
  }
};
function triggerAble(moveable, moveableAbles, eventOperations, eventAffix, eventType, e, requestInstant) {
  e.clientDistX = e.distX;
  e.clientDistY = e.distY;
  var isStart = eventType === "Start";
  var isEnd = eventType === "End";
  var isAfter = eventType === "After";
  var target = moveable.state.target;
  var isRequest = e.isRequest;
  var isControl = eventAffix.indexOf("Control") > -1;
  if (!target || isStart && isControl && !isRequest && moveable.areaElement === e.inputEvent.target) {
    return false;
  }
  var ables = __spreadArray([], __read(moveableAbles), false);
  if (isRequest) {
    var requestAble_1 = e.requestAble;
    if (!ables.some(function(able) {
      return able.name === requestAble_1;
    })) {
      ables.push.apply(ables, __spreadArray([], __read(moveable.props.ables.filter(function(able) {
        return able.name === requestAble_1;
      })), false));
    }
  }
  if (!ables.length || ables.every(function(able) {
    return able.dragRelation;
  })) {
    return false;
  }
  var inputEvent = e.inputEvent;
  var inputTarget;
  if (isEnd && inputEvent) {
    inputTarget = document.elementFromPoint(e.clientX, e.clientY) || inputEvent.target;
  }
  var isDragStop = false;
  var stop = function() {
    var _a;
    isDragStop = true;
    (_a = e.stop) === null || _a === void 0 ? void 0 : _a.call(e);
  };
  var isFirstStart = isStart && (!moveable.targetGesto || !moveable.controlGesto || (!moveable.targetGesto.isFlag() || !moveable.controlGesto.isFlag()));
  if (isFirstStart) {
    moveable.updateRect(eventType, true, false);
  }
  var datas = e.datas;
  var gestoType = isControl ? "controlGesto" : "targetGesto";
  var prevGesto = moveable[gestoType];
  var trigger = function(able, eventName, conditionName) {
    if (!(eventName in able) || prevGesto !== moveable[gestoType]) {
      return false;
    }
    var ableName = able.name;
    var nextDatas = datas[ableName] || (datas[ableName] = {});
    if (isStart) {
      nextDatas.isEventStart = !conditionName || !able[conditionName] || able[conditionName](moveable, e);
    }
    if (!nextDatas.isEventStart) {
      return false;
    }
    var result = able[eventName](moveable, __assign6(__assign6({}, e), { stop, datas: nextDatas, originalDatas: datas, inputTarget }));
    moveable._emitter.off();
    if (isStart && result === false) {
      nextDatas.isEventStart = false;
    }
    return result;
  };
  if (isFirstStart) {
    ables.forEach(function(able) {
      able.unset && able.unset(moveable);
    });
  }
  trigger(BeforeRenderable, "drag".concat(eventAffix).concat(eventType));
  var forceEndedCount = 0;
  var updatedCount = 0;
  eventOperations.forEach(function(eventOperation) {
    if (isDragStop) {
      return false;
    }
    var eventName = "".concat(eventOperation).concat(eventAffix).concat(eventType);
    var conditionName = "".concat(eventOperation).concat(eventAffix, "Condition");
    if (eventType === "" && !isRequest) {
      convertDragDist(moveable.state, e);
    }
    var eventAbles = ables.filter(function(able) {
      return able[eventName];
    });
    eventAbles = eventAbles.filter(function(able, i) {
      return able.name && eventAbles.indexOf(able) === i;
    });
    var results = eventAbles.filter(function(able) {
      return trigger(able, eventName, conditionName);
    });
    var isUpdate = results.length;
    if (isDragStop) {
      ++forceEndedCount;
    }
    if (isUpdate) {
      ++updatedCount;
    }
    if (!isDragStop && isStart && eventAbles.length && !isUpdate) {
      forceEndedCount += eventAbles.filter(function(able) {
        var ableName = able.name;
        var nextDatas = datas[ableName];
        if (nextDatas.isEventStart) {
          if (able.dragRelation === "strong") {
            return false;
          }
          return true;
        }
        return false;
      }).length ? 1 : 0;
    }
  });
  if (!isAfter || updatedCount) {
    trigger(Renderable, "drag".concat(eventAffix).concat(eventType));
  }
  var isForceEnd = prevGesto !== moveable[gestoType] || forceEndedCount === eventOperations.length;
  if (isEnd || isDragStop || isForceEnd) {
    moveable.state.gestos = {};
    if (moveable.moveables) {
      moveable.moveables.forEach(function(childMoveable) {
        childMoveable.state.gestos = {};
      });
    }
    ables.forEach(function(able) {
      able.unset && able.unset(moveable);
    });
  }
  if (isStart && !isForceEnd && !isRequest && updatedCount && moveable.props.preventDefault) {
    e === null || e === void 0 ? void 0 : e.preventDefault();
  }
  if (moveable.isUnmounted || isForceEnd) {
    return false;
  }
  if (!isStart && updatedCount && !requestInstant || isEnd) {
    var flushSync = moveable.props.flushSync || defaultSync;
    flushSync(function() {
      moveable.updateRect(isEnd ? eventType : "", true, false);
      moveable.forceUpdate();
    });
  }
  if (!isStart && !isEnd && !isAfter && updatedCount && !requestInstant) {
    triggerAble(moveable, moveableAbles, eventOperations, eventAffix, eventType + "After", e);
  }
  return true;
}
function checkMoveableTarget(moveable) {
  return function(e) {
    var _a;
    var eventTarget = e.inputEvent.target;
    var areaElement = moveable.areaElement;
    var dragTargetElement = moveable._dragTarget;
    if (!dragTargetElement || ((_a = moveable.controlGesto) === null || _a === void 0 ? void 0 : _a.isFlag())) {
      return false;
    }
    return eventTarget === dragTargetElement || dragTargetElement.contains(eventTarget) || eventTarget === areaElement || !moveable.isMoveableElement(eventTarget) && !moveable.controlBox.contains(eventTarget) || hasClass(eventTarget, "moveable-area") || hasClass(eventTarget, "moveable-padding") || hasClass(eventTarget, "moveable-edgeDraggable");
  };
}
function getTargetAbleGesto(moveable, moveableTarget, eventAffix) {
  var controlBox = moveable.controlBox;
  var targets = [];
  var props = moveable.props;
  var dragArea = props.dragArea;
  var target = moveable.state.target;
  var dragTarget = props.dragTarget;
  targets.push(controlBox);
  if (!dragArea || dragTarget) {
    targets.push(moveableTarget);
  }
  if (!dragArea && dragTarget && target && moveableTarget !== target && props.dragTargetSelf) {
    targets.push(target);
  }
  return getAbleGesto(moveable, targets, "targetAbles", eventAffix, {
    dragStart: checkMoveableTarget(moveable),
    pinchStart: checkMoveableTarget(moveable)
  });
}
function getAbleGesto(moveable, target, ableType, eventAffix, conditionFunctions) {
  if (conditionFunctions === void 0) {
    conditionFunctions = {};
  }
  var isTargetAbles = ableType === "targetAbles";
  var _a = moveable.props, pinchOutside = _a.pinchOutside, pinchThreshold = _a.pinchThreshold, preventClickEventOnDrag = _a.preventClickEventOnDrag, preventClickDefault = _a.preventClickDefault, checkInput = _a.checkInput, dragFocusedInput = _a.dragFocusedInput, _b = _a.preventDefault, preventDefault = _b === void 0 ? true : _b, dragContaienrOption = _a.dragContainer;
  var dragContainer = getRefTarget(dragContaienrOption, true);
  var options = {
    preventDefault,
    preventRightClick: true,
    preventWheelClick: true,
    container: dragContainer || getWindow(moveable.getControlBoxElement()),
    pinchThreshold,
    pinchOutside,
    preventClickEventOnDrag: isTargetAbles ? preventClickEventOnDrag : false,
    preventClickEventOnDragStart: isTargetAbles ? preventClickDefault : false,
    preventClickEventByCondition: isTargetAbles ? null : function(e) {
      return moveable.controlBox.contains(e.target);
    },
    checkInput: isTargetAbles ? checkInput : false,
    dragFocusedInput
  };
  var gesto = new Gesto(target, options);
  var isControl = eventAffix === "Control";
  ["drag", "pinch"].forEach(function(eventOperation) {
    ["Start", "", "End"].forEach(function(eventType) {
      gesto.on("".concat(eventOperation).concat(eventType), function(e) {
        var _a2;
        var eventName = e.eventType;
        var isPinchScheduled = eventOperation === "drag" && e.isPinch;
        if (conditionFunctions[eventName] && !conditionFunctions[eventName](e)) {
          e.stop();
          return;
        }
        if (isPinchScheduled) {
          return;
        }
        var eventOperations = eventOperation === "drag" ? [eventOperation] : ["drag", eventOperation];
        var moveableAbles = __spreadArray([], __read(moveable[ableType]), false);
        var result = triggerAble(moveable, moveableAbles, eventOperations, eventAffix, eventType, e);
        if (!result) {
          e.stop();
        } else if (moveable.props.stopPropagation || eventType === "Start" && isControl) {
          (_a2 = e === null || e === void 0 ? void 0 : e.inputEvent) === null || _a2 === void 0 ? void 0 : _a2.stopPropagation();
        }
      });
    });
  });
  return gesto;
}
var EventManager = /* @__PURE__ */ function() {
  function EventManager2(target, moveable, eventName) {
    var _this = this;
    this.target = target;
    this.moveable = moveable;
    this.eventName = eventName;
    this.ables = [];
    this._onEvent = function(e) {
      var eventName2 = _this.eventName;
      var moveable2 = _this.moveable;
      if (moveable2.state.disableNativeEvent) {
        return;
      }
      _this.ables.forEach(function(able) {
        able[eventName2](moveable2, {
          inputEvent: e
        });
      });
    };
    target.addEventListener(eventName.toLowerCase(), this._onEvent);
  }
  EventManager2.prototype.setAbles = function(ables) {
    this.ables = ables;
  };
  EventManager2.prototype.destroy = function() {
    this.target.removeEventListener(this.eventName.toLowerCase(), this._onEvent);
    this.target = null;
    this.moveable = null;
  };
  return EventManager2;
}();
function calculateMatrixStack(target, container, rootContainer, isAbsolute3d) {
  var _a;
  if (rootContainer === void 0) {
    rootContainer = container;
  }
  var _b = getMatrixStackInfo(target, container), matrixes = _b.matrixes, is3d = _b.is3d, prevTargetMatrix = _b.targetMatrix, transformOrigin = _b.transformOrigin, targetOrigin = _b.targetOrigin, offsetContainer = _b.offsetContainer, hasFixed = _b.hasFixed, containerZoom = _b.zoom;
  var _c = getCachedMatrixContainerInfo(offsetContainer, rootContainer), rootMatrixes = _c.matrixes, isRoot3d = _c.is3d, offsetRootContainer = _c.offsetContainer, rootZoom = _c.zoom;
  var isNext3d = isAbsolute3d || isRoot3d || is3d;
  var n = isNext3d ? 4 : 3;
  var isSVGGraphicElement = target.tagName.toLowerCase() !== "svg" && "ownerSVGElement" in target;
  var targetMatrix = prevTargetMatrix;
  var allMatrix = createIdentityMatrix(n);
  var rootMatrix = createIdentityMatrix(n);
  var beforeMatrix = createIdentityMatrix(n);
  var offsetMatrix = createIdentityMatrix(n);
  var length = matrixes.length;
  var nextRootMatrixes = rootMatrixes.map(function(info) {
    return __assign6(__assign6({}, info), { matrix: info.matrix ? __spreadArray([], __read(info.matrix), false) : void 0 });
  }).reverse();
  matrixes.reverse();
  if (!is3d && isNext3d) {
    targetMatrix = convertDimension(targetMatrix, 3, 4);
    convert3DMatrixes(matrixes);
  }
  if (!isRoot3d && isNext3d) {
    convert3DMatrixes(nextRootMatrixes);
  }
  nextRootMatrixes.forEach(function(info) {
    rootMatrix = multiply(rootMatrix, info.matrix, n);
  });
  var originalRootContainer = rootContainer || getDocumentBody(target);
  var endContainer = ((_a = nextRootMatrixes[0]) === null || _a === void 0 ? void 0 : _a.target) || getOffsetInfo(originalRootContainer, originalRootContainer, true).offsetParent;
  var rootMatrixBeforeOffset = nextRootMatrixes.slice(1).reduce(function(matrix, info) {
    return multiply(matrix, info.matrix, n);
  }, createIdentityMatrix(n));
  matrixes.forEach(function(info, i) {
    if (length - 2 === i) {
      beforeMatrix = allMatrix.slice();
    }
    if (length - 1 === i) {
      offsetMatrix = allMatrix.slice();
    }
    if (!info.matrix) {
      var nextInfo = matrixes[i + 1];
      var offset = getSVGOffset(info, nextInfo, endContainer, n, multiply(rootMatrixBeforeOffset, allMatrix, n));
      info.matrix = createOriginMatrix(offset, n);
    }
    allMatrix = multiply(allMatrix, info.matrix, n);
  });
  var isMatrix3d = !isSVGGraphicElement && is3d;
  if (!targetMatrix) {
    targetMatrix = createIdentityMatrix(isMatrix3d ? 4 : 3);
  }
  var targetTransform = makeMatrixCSS(isSVGGraphicElement && targetMatrix.length === 16 ? convertDimension(targetMatrix, 4, 3) : targetMatrix, isMatrix3d);
  var originalRootMatrix = rootMatrix;
  rootMatrix = ignoreDimension(rootMatrix, n, n);
  return {
    hasZoom: containerZoom !== 1 || rootZoom !== 1,
    hasFixed,
    matrixes,
    rootMatrix,
    originalRootMatrix,
    beforeMatrix,
    offsetMatrix,
    allMatrix,
    targetMatrix,
    targetTransform,
    inlineTransform: target.style.transform,
    transformOrigin,
    targetOrigin,
    is3d: isNext3d,
    offsetContainer,
    offsetRootContainer
  };
}
function calculateElementInfo(target, container, rootContainer, isAbsolute3d) {
  if (rootContainer === void 0) {
    rootContainer = container;
  }
  var width = 0;
  var height = 0;
  var rotation = 0;
  var allResult = {};
  var sizes = getSize(target);
  if (target) {
    width = sizes.offsetWidth;
    height = sizes.offsetHeight;
  }
  if (target) {
    var result = calculateMatrixStack(target, container, rootContainer, isAbsolute3d);
    var position = calculateElementPosition(result.allMatrix, result.transformOrigin, width, height);
    allResult = __assign6(__assign6({}, result), position);
    var rotationPosition = calculateElementPosition(result.allMatrix, [50, 50], 100, 100);
    rotation = getRotationRad([rotationPosition.pos1, rotationPosition.pos2], rotationPosition.direction);
  }
  var n = isAbsolute3d ? 4 : 3;
  return __assign6(__assign6(__assign6({ hasZoom: false, width, height, rotation }, sizes), { originalRootMatrix: createIdentityMatrix(n), rootMatrix: createIdentityMatrix(n), beforeMatrix: createIdentityMatrix(n), offsetMatrix: createIdentityMatrix(n), allMatrix: createIdentityMatrix(n), targetMatrix: createIdentityMatrix(n), targetTransform: "", inlineTransform: "", transformOrigin: [0, 0], targetOrigin: [0, 0], is3d: !!isAbsolute3d, left: 0, top: 0, right: 0, bottom: 0, origin: [0, 0], pos1: [0, 0], pos2: [0, 0], pos3: [0, 0], pos4: [0, 0], direction: 1, hasFixed: false, offsetContainer: null, offsetRootContainer: null, matrixes: [] }), allResult);
}
function getMoveableTargetInfo(moveableElement, target, container, parentContainer, rootContainer, requestStyles) {
  if (requestStyles === void 0) {
    requestStyles = [];
  }
  var beforeDirection = 1;
  var beforeOrigin = [0, 0];
  var targetClientRect = resetClientRect();
  var moveableClientRect = resetClientRect();
  var containerClientRect = resetClientRect();
  var rootContainerClientRect = resetClientRect();
  var offsetDelta = [0, 0];
  var style = {};
  var result = calculateElementInfo(target, container, rootContainer, true);
  if (target) {
    var getStyle_1 = getCachedStyle(target);
    requestStyles.forEach(function(name) {
      style[name] = getStyle_1(name);
    });
    var n = result.is3d ? 4 : 3;
    var beforePosition = calculateElementPosition(result.offsetMatrix, plus(result.transformOrigin, getOrigin(result.targetMatrix, n)), result.width, result.height);
    beforeDirection = beforePosition.direction;
    beforeOrigin = plus(beforePosition.origin, [beforePosition.left - result.left, beforePosition.top - result.top]);
    rootContainerClientRect = getClientRect(result.offsetRootContainer);
    var offsetContainer = getOffsetInfo(parentContainer, parentContainer, true).offsetParent || result.offsetRootContainer;
    if (result.hasZoom) {
      var absoluteTargetPosition = calculateElementPosition(multiply(result.originalRootMatrix, result.allMatrix), result.transformOrigin, result.width, result.height);
      var absoluteContainerPosition = calculateElementPosition(result.originalRootMatrix, getTransformOriginArray(getCachedStyle(offsetContainer)("transformOrigin")).map(function(pos) {
        return parseFloat(pos);
      }), offsetContainer.offsetWidth, offsetContainer.offsetHeight);
      targetClientRect = getClientRectByPosition(absoluteTargetPosition, rootContainerClientRect);
      containerClientRect = getClientRectByPosition(absoluteContainerPosition, rootContainerClientRect, offsetContainer, true);
      if (moveableElement) {
        var left = absoluteTargetPosition.left;
        var top_1 = absoluteTargetPosition.top;
        moveableClientRect = getClientRectByPosition({
          left,
          top: top_1,
          bottom: top_1,
          right: top_1
        }, rootContainerClientRect);
      }
    } else {
      targetClientRect = getClientRect(target);
      containerClientRect = getCachedClientRect(offsetContainer);
      if (moveableElement) {
        moveableClientRect = getClientRect(moveableElement);
      }
      var containerClientRectLeft = containerClientRect.left, containerClientRectTop = containerClientRect.top, containterClientLeft = containerClientRect.clientLeft, containerClientTop = containerClientRect.clientTop;
      var clientDelta = [
        targetClientRect.left - containerClientRectLeft,
        targetClientRect.top - containerClientRectTop
      ];
      offsetDelta = minus(calculateInversePosition(result.rootMatrix, clientDelta, 4), [containterClientLeft + result.left, containerClientTop + result.top]);
    }
  }
  return __assign6({ targetClientRect, containerClientRect, moveableClientRect, rootContainerClientRect, beforeDirection, beforeOrigin, originalBeforeOrigin: beforeOrigin, target, style, offsetDelta }, result);
}
function getPersistState(rect) {
  var pos1 = rect.pos1, pos2 = rect.pos2, pos3 = rect.pos3, pos4 = rect.pos4;
  if (!pos1 || !pos2 || !pos3 || !pos4) {
    return null;
  }
  var minPos = getMinMaxs([pos1, pos2, pos3, pos4]);
  var posDelta = [minPos.minX, minPos.minY];
  var origin = minus(rect.origin, posDelta);
  pos1 = minus(pos1, posDelta);
  pos2 = minus(pos2, posDelta);
  pos3 = minus(pos3, posDelta);
  pos4 = minus(pos4, posDelta);
  return __assign6(__assign6({}, rect), {
    left: rect.left,
    top: rect.top,
    posDelta,
    pos1,
    pos2,
    pos3,
    pos4,
    origin,
    beforeOrigin: origin,
    // originalBeforeOrigin: origin,
    isPersisted: true
  });
}
var MoveableManager = /* @__PURE__ */ function(_super) {
  __extends4(MoveableManager2, _super);
  function MoveableManager2() {
    var _this = _super !== null && _super.apply(this, arguments) || this;
    _this.state = __assign6({ container: null, gestos: {}, renderPoses: [[0, 0], [0, 0], [0, 0], [0, 0]], disableNativeEvent: false, posDelta: [0, 0] }, getMoveableTargetInfo(null));
    _this.renderState = {};
    _this.enabledAbles = [];
    _this.targetAbles = [];
    _this.controlAbles = [];
    _this.rotation = 0;
    _this.scale = [1, 1];
    _this.isMoveableMounted = false;
    _this.isUnmounted = false;
    _this.events = {
      "mouseEnter": null,
      "mouseLeave": null
    };
    _this._emitter = new event_emitter_esm_default();
    _this._prevOriginalDragTarget = null;
    _this._originalDragTarget = null;
    _this._prevDragTarget = null;
    _this._dragTarget = null;
    _this._prevPropTarget = null;
    _this._propTarget = null;
    _this._prevDragArea = false;
    _this._isPropTargetChanged = false;
    _this._hasFirstTarget = false;
    _this._reiszeObserver = null;
    _this._observerId = 0;
    _this._mutationObserver = null;
    _this._rootContainer = null;
    _this._viewContainer = null;
    _this._viewClassNames = [];
    _this._store = {};
    _this.checkUpdateRect = function() {
      if (_this.isDragging()) {
        return;
      }
      var parentMoveable = _this.props.parentMoveable;
      if (parentMoveable) {
        parentMoveable.checkUpdateRect();
        return;
      }
      cancelAnimationFrame(_this._observerId);
      _this._observerId = requestAnimationFrame2(function() {
        if (_this.isDragging()) {
          return;
        }
        _this.updateRect();
      });
    };
    _this._onPreventClick = function(e) {
      e.stopPropagation();
      e.preventDefault();
    };
    return _this;
  }
  MoveableManager2.prototype.render = function() {
    var props = this.props;
    var state = this.getState();
    var parentPosition = props.parentPosition, className = props.className, propsTarget = props.target, zoom = props.zoom, cspNonce = props.cspNonce, translateZ = props.translateZ, ControlBoxElement = props.cssStyled, groupable = props.groupable, linePadding = props.linePadding, controlPadding = props.controlPadding;
    this._checkUpdateRootContainer();
    this.checkUpdate();
    this.updateRenderPoses();
    var _a = __read(parentPosition || [0, 0], 2), parentLeft = _a[0], parentTop = _a[1];
    var left = state.left, top = state.top, stateTarget = state.target, direction = state.direction, hasFixed = state.hasFixed, offsetDelta = state.offsetDelta;
    var groupTargets = props.targets;
    var isDragging = this.isDragging();
    var ableAttributes = {};
    this.getEnabledAbles().forEach(function(able) {
      ableAttributes["data-able-".concat(able.name.toLowerCase())] = true;
    });
    var ableClassName = this._getAbleClassName();
    var isDisplay = groupTargets && groupTargets.length && (stateTarget || groupable) || propsTarget || !this._hasFirstTarget && this.state.isPersisted;
    var isVisible = this.controlBox || this.props.firstRenderState || this.props.persistData;
    var translate = [left - parentLeft, top - parentTop];
    if (!groupable && props.useAccuratePosition) {
      translate[0] += offsetDelta[0];
      translate[1] += offsetDelta[1];
    }
    var style = {
      "position": hasFixed ? "fixed" : "absolute",
      "display": isDisplay ? "block" : "none",
      "visibility": isVisible ? "visible" : "hidden",
      "transform": "translate3d(".concat(translate[0], "px, ").concat(translate[1], "px, ").concat(translateZ, ")"),
      "--zoom": zoom,
      "--zoompx": "".concat(zoom, "px")
    };
    if (linePadding) {
      style["--moveable-line-padding"] = linePadding;
    }
    if (controlPadding) {
      style["--moveable-control-padding"] = controlPadding;
    }
    return React.createElement(
      ControlBoxElement,
      __assign6({ cspNonce, ref: ref(this, "controlBox"), className: "".concat(prefix("control-box", direction === -1 ? "reverse" : "", isDragging ? "dragging" : ""), " ").concat(ableClassName, " ").concat(className) }, ableAttributes, { onClick: this._onPreventClick, style }),
      this.renderAbles(),
      this._renderLines()
    );
  };
  MoveableManager2.prototype.componentDidMount = function() {
    this.isMoveableMounted = true;
    this.isUnmounted = false;
    var props = this.props;
    var parentMoveable = props.parentMoveable, container = props.container;
    this._checkUpdateRootContainer();
    this._checkUpdateViewContainer();
    this._updateTargets();
    this._updateNativeEvents();
    this._updateEvents();
    this.updateCheckInput();
    this._updateObserver(this.props);
    if (!container && !parentMoveable && !this.state.isPersisted) {
      this.updateRect("", false, false);
      this.forceUpdate();
    }
  };
  MoveableManager2.prototype.componentDidUpdate = function(prevProps) {
    this._checkUpdateRootContainer();
    this._checkUpdateViewContainer();
    this._updateNativeEvents();
    this._updateTargets();
    this._updateEvents();
    this.updateCheckInput();
    this._updateObserver(prevProps);
  };
  MoveableManager2.prototype.componentWillUnmount = function() {
    var _a, _b;
    this.isMoveableMounted = false;
    this.isUnmounted = true;
    this._emitter.off();
    (_a = this._reiszeObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
    (_b = this._mutationObserver) === null || _b === void 0 ? void 0 : _b.disconnect();
    var viewContainer = this._viewContainer;
    if (viewContainer) {
      this._changeAbleViewClassNames([]);
    }
    unsetGesto(this, false);
    unsetGesto(this, true);
    var events = this.events;
    for (var name_1 in events) {
      var manager = events[name_1];
      manager && manager.destroy();
    }
  };
  MoveableManager2.prototype.getTargets = function() {
    var target = this.props.target;
    return target ? [target] : [];
  };
  MoveableManager2.prototype.getAble = function(ableName) {
    var ables = this.props.ables || [];
    return find2(ables, function(able) {
      return able.name === ableName;
    });
  };
  MoveableManager2.prototype.getContainer = function() {
    var _a = this.props, parentMoveable = _a.parentMoveable, wrapperMoveable = _a.wrapperMoveable, container = _a.container;
    return container || wrapperMoveable && wrapperMoveable.getContainer() || parentMoveable && parentMoveable.getContainer() || this.controlBox.parentElement;
  };
  MoveableManager2.prototype.getControlBoxElement = function() {
    return this.controlBox;
  };
  MoveableManager2.prototype.getDragElement = function() {
    return this._dragTarget;
  };
  MoveableManager2.prototype.isMoveableElement = function(target) {
    var _a;
    return target && (((_a = target.getAttribute) === null || _a === void 0 ? void 0 : _a.call(target, "class")) || "").indexOf(PREFIX) > -1;
  };
  MoveableManager2.prototype.dragStart = function(e) {
    var targetGesto = this.targetGesto;
    var controlGesto = this.controlGesto;
    if (targetGesto && checkMoveableTarget(this)({ inputEvent: e })) {
      if (!targetGesto.isFlag()) {
        targetGesto.triggerDragStart(e);
      }
    } else if (controlGesto && this.isMoveableElement(e.target)) {
      if (!controlGesto.isFlag()) {
        controlGesto.triggerDragStart(e);
      }
    }
    return this;
  };
  MoveableManager2.prototype.hitTest = function(el) {
    var _a = this.state, target = _a.target, pos1 = _a.pos1, pos2 = _a.pos2, pos3 = _a.pos3, pos4 = _a.pos4, targetClientRect = _a.targetClientRect;
    if (!target) {
      return 0;
    }
    var rect;
    if (isNode(el)) {
      var clientRect = el.getBoundingClientRect();
      rect = {
        left: clientRect.left,
        top: clientRect.top,
        width: clientRect.width,
        height: clientRect.height
      };
    } else {
      rect = __assign6({ width: 0, height: 0 }, el);
    }
    var rectLeft = rect.left, rectTop = rect.top, rectWidth = rect.width, rectHeight = rect.height;
    var points = fitPoints([pos1, pos2, pos4, pos3], targetClientRect);
    var size = getOverlapSize(points, [
      [rectLeft, rectTop],
      [rectLeft + rectWidth, rectTop],
      [rectLeft + rectWidth, rectTop + rectHeight],
      [rectLeft, rectTop + rectHeight]
    ]);
    var totalSize = getAreaSize(points);
    if (!size || !totalSize) {
      return 0;
    }
    return Math.min(100, size / totalSize * 100);
  };
  MoveableManager2.prototype.isInside = function(clientX, clientY) {
    var _a = this.state, target = _a.target, pos1 = _a.pos1, pos2 = _a.pos2, pos3 = _a.pos3, pos4 = _a.pos4, targetClientRect = _a.targetClientRect;
    if (!target) {
      return false;
    }
    return isInside([clientX, clientY], fitPoints([pos1, pos2, pos4, pos3], targetClientRect));
  };
  MoveableManager2.prototype.updateRect = function(type, isTarget, isSetState) {
    if (isSetState === void 0) {
      isSetState = true;
    }
    var props = this.props;
    var isSingle = !props.parentPosition && !props.wrapperMoveable;
    if (isSingle) {
      setStoreCache(true);
    }
    var parentMoveable = props.parentMoveable;
    var state = this.state;
    var target = state.target || props.target;
    var container = this.getContainer();
    var rootContainer = parentMoveable ? parentMoveable._rootContainer : this._rootContainer;
    var nextState = getMoveableTargetInfo(this.controlBox, target, container, container, rootContainer || container, this._getRequestStyles());
    if (!target && this._hasFirstTarget && props.persistData) {
      var persistState = getPersistState(props.persistData);
      for (var name_2 in persistState) {
        nextState[name_2] = persistState[name_2];
      }
    }
    if (isSingle) {
      setStoreCache();
    }
    this.updateState(nextState, parentMoveable ? false : isSetState);
  };
  MoveableManager2.prototype.isDragging = function(ableName) {
    var _a, _b;
    var targetGesto = this.targetGesto;
    var controlGesto = this.controlGesto;
    if (targetGesto === null || targetGesto === void 0 ? void 0 : targetGesto.isFlag()) {
      if (!ableName) {
        return true;
      }
      var data = targetGesto.getEventData();
      return !!((_a = data[ableName]) === null || _a === void 0 ? void 0 : _a.isEventStart);
    }
    if (controlGesto === null || controlGesto === void 0 ? void 0 : controlGesto.isFlag()) {
      if (!ableName) {
        return true;
      }
      var data = controlGesto.getEventData();
      return !!((_b = data[ableName]) === null || _b === void 0 ? void 0 : _b.isEventStart);
    }
    return false;
  };
  MoveableManager2.prototype.updateTarget = function(type) {
    this.updateRect(type, true);
  };
  MoveableManager2.prototype.getRect = function() {
    var state = this.state;
    var poses = getAbsolutePosesByState(this.state);
    var _a = __read(poses, 4), pos1 = _a[0], pos2 = _a[1], pos3 = _a[2], pos4 = _a[3];
    var rect = getRect(poses);
    var offsetWidth = state.width, offsetHeight = state.height;
    var width = rect.width, height = rect.height, left = rect.left, top = rect.top;
    var statePos = [state.left, state.top];
    var origin = plus(statePos, state.origin);
    var beforeOrigin = plus(statePos, state.beforeOrigin);
    var transformOrigin = state.transformOrigin;
    return {
      width,
      height,
      left,
      top,
      pos1,
      pos2,
      pos3,
      pos4,
      offsetWidth,
      offsetHeight,
      beforeOrigin,
      origin,
      transformOrigin,
      rotation: this.getRotation()
    };
  };
  MoveableManager2.prototype.getManager = function() {
    return this;
  };
  MoveableManager2.prototype.stopDrag = function(type) {
    if (!type || type === "target") {
      var gesto = this.targetGesto;
      if ((gesto === null || gesto === void 0 ? void 0 : gesto.isIdle()) === false) {
        unsetAbles(this, false);
      }
      gesto === null || gesto === void 0 ? void 0 : gesto.stop();
    }
    if (!type || type === "control") {
      var gesto = this.controlGesto;
      if ((gesto === null || gesto === void 0 ? void 0 : gesto.isIdle()) === false) {
        unsetAbles(this, true);
      }
      gesto === null || gesto === void 0 ? void 0 : gesto.stop();
    }
  };
  MoveableManager2.prototype.getRotation = function() {
    var _a = this.state, pos1 = _a.pos1, pos2 = _a.pos2, direction = _a.direction;
    return getAbsoluteRotation(pos1, pos2, direction);
  };
  MoveableManager2.prototype.request = function(ableName, param, isInstant) {
    if (param === void 0) {
      param = {};
    }
    var self = this;
    var props = self.props;
    var manager = props.parentMoveable || props.wrapperMoveable || self;
    var allAbles = manager.props.ables;
    var groupable = props.groupable;
    var requsetAble = find2(allAbles, function(able) {
      return able.name === ableName;
    });
    if (this.isDragging() || !requsetAble || !requsetAble.request) {
      return {
        request: function() {
          return this;
        },
        requestEnd: function() {
          return this;
        }
      };
    }
    var ableRequester = requsetAble.request(self);
    var requestInstant = isInstant || param.isInstant;
    var ableType = ableRequester.isControl ? "controlAbles" : "targetAbles";
    var eventAffix = "".concat(groupable ? "Group" : "").concat(ableRequester.isControl ? "Control" : "");
    var moveableAbles = __spreadArray([], __read(manager[ableType]), false);
    var requester = {
      request: function(ableParam) {
        triggerAble(self, moveableAbles, ["drag"], eventAffix, "", __assign6(__assign6({}, ableRequester.request(ableParam)), { requestAble: ableName, isRequest: true }), requestInstant);
        return requester;
      },
      requestEnd: function() {
        triggerAble(self, moveableAbles, ["drag"], eventAffix, "End", __assign6(__assign6({}, ableRequester.requestEnd()), { requestAble: ableName, isRequest: true }), requestInstant);
        return requester;
      }
    };
    triggerAble(self, moveableAbles, ["drag"], eventAffix, "Start", __assign6(__assign6({}, ableRequester.requestStart(param)), { requestAble: ableName, isRequest: true }), requestInstant);
    return requestInstant ? requester.request(param).requestEnd() : requester;
  };
  MoveableManager2.prototype.getMoveables = function() {
    return [this];
  };
  MoveableManager2.prototype.destroy = function() {
    this.componentWillUnmount();
  };
  MoveableManager2.prototype.updateRenderPoses = function() {
    var state = this.getState();
    var props = this.props;
    var padding = props.padding;
    var originalBeforeOrigin = state.originalBeforeOrigin, transformOrigin = state.transformOrigin, allMatrix = state.allMatrix, is3d = state.is3d, pos1 = state.pos1, pos2 = state.pos2, pos3 = state.pos3, pos4 = state.pos4, stateLeft = state.left, stateTop = state.top, isPersisted = state.isPersisted;
    if (!padding) {
      state.renderPoses = [
        pos1,
        pos2,
        pos3,
        pos4
      ];
      return;
    }
    var _a = getPaddingBox(padding), left = _a.left, top = _a.top, bottom = _a.bottom, right = _a.right;
    var n = is3d ? 4 : 3;
    var absoluteOrigin = [];
    if (isPersisted) {
      absoluteOrigin = transformOrigin;
    } else if (this.controlBox && props.groupable) {
      absoluteOrigin = originalBeforeOrigin;
    } else {
      absoluteOrigin = plus(originalBeforeOrigin, [stateLeft, stateTop]);
    }
    var nextMatrix = multiplies(n, createOriginMatrix(absoluteOrigin.map(function(v) {
      return -v;
    }), n), allMatrix, createOriginMatrix(transformOrigin, n));
    state.renderPoses = [
      calculatePadding(nextMatrix, pos1, [-left, -top], n),
      calculatePadding(nextMatrix, pos2, [right, -top], n),
      calculatePadding(nextMatrix, pos3, [-left, bottom], n),
      calculatePadding(nextMatrix, pos4, [right, bottom], n)
    ];
  };
  MoveableManager2.prototype.checkUpdate = function() {
    this._isPropTargetChanged = false;
    var _a = this.props, target = _a.target, container = _a.container, parentMoveable = _a.parentMoveable;
    var _b = this.state, stateTarget = _b.target, stateContainer = _b.container;
    if (!stateTarget && !target) {
      return;
    }
    this.updateAbles();
    var isTargetChanged = !equals(stateTarget, target);
    var isChanged = isTargetChanged || !equals(stateContainer, container);
    if (!isChanged) {
      return;
    }
    var moveableContainer = container || this.controlBox;
    if (moveableContainer) {
      this.unsetAbles();
    }
    this.updateState({ target, container });
    if (!parentMoveable && moveableContainer) {
      this.updateRect("End", false, false);
    }
    this._isPropTargetChanged = isTargetChanged;
  };
  MoveableManager2.prototype.waitToChangeTarget = function() {
    return new Promise(function() {
    });
  };
  MoveableManager2.prototype.triggerEvent = function(name, e) {
    var props = this.props;
    this._emitter.trigger(name, e);
    if (props.parentMoveable && e.isRequest && !e.isRequestChild) {
      return props.parentMoveable.triggerEvent(name, e, true);
    }
    var callback = props[name];
    return callback && callback(e);
  };
  MoveableManager2.prototype.useCSS = function(tag, css2) {
    var customStyleMap = this.props.customStyledMap;
    var key = tag + css2;
    if (!customStyleMap[key]) {
      customStyleMap[key] = styled2(tag, css2);
    }
    return customStyleMap[key];
  };
  MoveableManager2.prototype.getState = function() {
    var _a;
    var props = this.props;
    if (props.target || ((_a = props.targets) === null || _a === void 0 ? void 0 : _a.length)) {
      this._hasFirstTarget = true;
    }
    var hasControlBox = this.controlBox;
    var persistData = props.persistData;
    var firstRenderState = props.firstRenderState;
    if (firstRenderState && !hasControlBox) {
      return firstRenderState;
    }
    if (!this._hasFirstTarget && persistData) {
      var persistState = getPersistState(persistData);
      if (persistState) {
        this.updateState(persistState, false);
        return this.state;
      }
    }
    this.state.isPersisted = false;
    return this.state;
  };
  MoveableManager2.prototype.updateSelectors = function() {
  };
  MoveableManager2.prototype.unsetAbles = function() {
    var _this = this;
    this.targetAbles.forEach(function(able) {
      if (able.unset) {
        able.unset(_this);
      }
    });
  };
  MoveableManager2.prototype.updateAbles = function(ables, eventAffix) {
    if (ables === void 0) {
      ables = this.props.ables;
    }
    if (eventAffix === void 0) {
      eventAffix = "";
    }
    var props = this.props;
    var triggerAblesSimultaneously = props.triggerAblesSimultaneously;
    var enabledAbles = this.getEnabledAbles(ables);
    var dragStart = "drag".concat(eventAffix, "Start");
    var pinchStart = "pinch".concat(eventAffix, "Start");
    var dragControlStart = "drag".concat(eventAffix, "ControlStart");
    var targetAbles = filterAbles(enabledAbles, [dragStart, pinchStart], triggerAblesSimultaneously);
    var controlAbles = filterAbles(enabledAbles, [dragControlStart], triggerAblesSimultaneously);
    this.enabledAbles = enabledAbles;
    this.targetAbles = targetAbles;
    this.controlAbles = controlAbles;
  };
  MoveableManager2.prototype.updateState = function(nextState, isSetState) {
    if (isSetState) {
      if (this.isUnmounted) {
        return;
      }
      this.setState(nextState);
    } else {
      var state = this.state;
      for (var name_3 in nextState) {
        state[name_3] = nextState[name_3];
      }
    }
  };
  MoveableManager2.prototype.getEnabledAbles = function(ables) {
    if (ables === void 0) {
      ables = this.props.ables;
    }
    var props = this.props;
    return ables.filter(function(able) {
      return able && (able.always && props[able.name] !== false || props[able.name]);
    });
  };
  MoveableManager2.prototype.renderAbles = function() {
    var _this = this;
    var props = this.props;
    var triggerAblesSimultaneously = props.triggerAblesSimultaneously;
    var Renderer = {
      createElement: createElement3
    };
    this.renderState = {};
    return groupByMap(flat(filterAbles(this.getEnabledAbles(), ["render"], triggerAblesSimultaneously).map(function(_a) {
      var render = _a.render;
      return render(_this, Renderer) || [];
    })).filter(function(el) {
      return el;
    }), function(_a) {
      var key = _a.key;
      return key;
    }).map(function(group) {
      return group[0];
    });
  };
  MoveableManager2.prototype.updateCheckInput = function() {
    this.targetGesto && (this.targetGesto.options.checkInput = this.props.checkInput);
  };
  MoveableManager2.prototype._getRequestStyles = function() {
    var styleNames = this.getEnabledAbles().reduce(function(names, able) {
      var _a, _b;
      var ableStyleNames = (_b = (_a = able.requestStyle) === null || _a === void 0 ? void 0 : _a.call(able)) !== null && _b !== void 0 ? _b : [];
      return __spreadArray(__spreadArray([], __read(names), false), __read(ableStyleNames), false);
    }, __spreadArray([], __read(this.props.requestStyles || []), false));
    return styleNames;
  };
  MoveableManager2.prototype._updateObserver = function(prevProps) {
    this._updateResizeObserver(prevProps);
    this._updateMutationObserver(prevProps);
  };
  MoveableManager2.prototype._updateEvents = function() {
    var controlBoxElement = this.controlBox;
    var hasTargetAble = this.targetAbles.length;
    var hasControlAble = this.controlAbles.length;
    var target = this._dragTarget;
    var isUnset = !hasTargetAble && this.targetGesto || this._isTargetChanged(true);
    if (isUnset) {
      unsetGesto(this, false);
      this.updateState({ gestos: {} });
    }
    if (!hasControlAble) {
      unsetGesto(this, true);
    }
    if (target && hasTargetAble && !this.targetGesto) {
      this.targetGesto = getTargetAbleGesto(this, target, "");
    }
    if (!this.controlGesto && hasControlAble) {
      this.controlGesto = getAbleGesto(this, controlBoxElement, "controlAbles", "Control");
    }
  };
  MoveableManager2.prototype._updateTargets = function() {
    var props = this.props;
    this._prevPropTarget = this._propTarget;
    this._prevDragTarget = this._dragTarget;
    this._prevOriginalDragTarget = this._originalDragTarget;
    this._prevDragArea = props.dragArea;
    this._propTarget = props.target;
    this._originalDragTarget = props.dragTarget || props.target;
    this._dragTarget = getRefTarget(this._originalDragTarget, true);
  };
  MoveableManager2.prototype._renderLines = function() {
    var props = this.props;
    var _a = props, zoom = _a.zoom, hideDefaultLines = _a.hideDefaultLines, hideChildMoveableDefaultLines = _a.hideChildMoveableDefaultLines, parentMoveable = _a.parentMoveable;
    if (hideDefaultLines || parentMoveable && hideChildMoveableDefaultLines) {
      return [];
    }
    var renderPoses = this.getState().renderPoses;
    var Renderer = {
      createElement: createElement3
    };
    return [
      [0, 1],
      [1, 3],
      [3, 2],
      [2, 0]
    ].map(function(_a2, i) {
      var _b = __read(_a2, 2), from = _b[0], to = _b[1];
      return renderLine(Renderer, "", renderPoses[from], renderPoses[to], zoom, "render-line-".concat(i));
    });
  };
  MoveableManager2.prototype._isTargetChanged = function(useDragArea) {
    var props = this.props;
    var nextTarget = props.dragTarget || props.target;
    var prevTarget = this._prevOriginalDragTarget;
    var prevDragArea = this._prevDragArea;
    var dragArea = props.dragArea;
    var isDragTargetChanged = !dragArea && prevTarget !== nextTarget;
    var isDragAreaChanged = (useDragArea || dragArea) && prevDragArea !== dragArea;
    return isDragTargetChanged || isDragAreaChanged || this._prevPropTarget != this._propTarget;
  };
  MoveableManager2.prototype._updateNativeEvents = function() {
    var _this = this;
    var props = this.props;
    var target = props.dragArea ? this.areaElement : this.state.target;
    var events = this.events;
    var eventKeys = getKeys(events);
    if (this._isTargetChanged()) {
      for (var eventName in events) {
        var manager = events[eventName];
        manager && manager.destroy();
        events[eventName] = null;
      }
    }
    if (!target) {
      return;
    }
    var enabledAbles = this.enabledAbles;
    eventKeys.forEach(function(eventName2) {
      var ables = filterAbles(enabledAbles, [eventName2]);
      var hasAbles = ables.length > 0;
      var manager2 = events[eventName2];
      if (!hasAbles) {
        if (manager2) {
          manager2.destroy();
          events[eventName2] = null;
        }
        return;
      }
      if (!manager2) {
        manager2 = new EventManager(target, _this, eventName2);
        events[eventName2] = manager2;
      }
      manager2.setAbles(ables);
    });
  };
  MoveableManager2.prototype._checkUpdateRootContainer = function() {
    var rootContainer = this.props.rootContainer;
    if (!this._rootContainer && rootContainer) {
      this._rootContainer = getRefTarget(rootContainer, true);
    }
  };
  MoveableManager2.prototype._checkUpdateViewContainer = function() {
    var viewContainerOption = this.props.viewContainer;
    if (!this._viewContainer && viewContainerOption) {
      this._viewContainer = getRefTarget(viewContainerOption, true);
    }
    var viewContainer = this._viewContainer;
    if (viewContainer) {
      this._changeAbleViewClassNames(__spreadArray(__spreadArray([], __read(this._getAbleViewClassNames()), false), [
        this.isDragging() ? VIEW_DRAGGING : ""
      ], false));
    }
  };
  MoveableManager2.prototype._changeAbleViewClassNames = function(classNames) {
    var viewContainer = this._viewContainer;
    var nextClassNames = groupBy(classNames.filter(Boolean), function(el) {
      return el;
    }).map(function(_a2) {
      var _b = __read(_a2, 1), className = _b[0];
      return className;
    });
    var prevClassNames = this._viewClassNames;
    var _a = diff(prevClassNames, nextClassNames), removed = _a.removed, added = _a.added;
    removed.forEach(function(index) {
      removeClass(viewContainer, prevClassNames[index]);
    });
    added.forEach(function(index) {
      addClass(viewContainer, nextClassNames[index]);
    });
    this._viewClassNames = nextClassNames;
  };
  MoveableManager2.prototype._getAbleViewClassNames = function() {
    var _this = this;
    return (this.getEnabledAbles().map(function(able) {
      var _a;
      return ((_a = able.viewClassName) === null || _a === void 0 ? void 0 : _a.call(able, _this)) || "";
    }).join(" ") + " ".concat(this._getAbleClassName("-view"))).split(/\s+/g);
  };
  MoveableManager2.prototype._getAbleClassName = function(classPrefix) {
    var _this = this;
    if (classPrefix === void 0) {
      classPrefix = "";
    }
    var ables = this.getEnabledAbles();
    var targetGesto = this.targetGesto;
    var controlGesto = this.controlGesto;
    var targetGestoData = (targetGesto === null || targetGesto === void 0 ? void 0 : targetGesto.isFlag()) ? targetGesto.getEventData() : {};
    var controlGestoData = (controlGesto === null || controlGesto === void 0 ? void 0 : controlGesto.isFlag()) ? controlGesto.getEventData() : {};
    return ables.map(function(able) {
      var _a, _b, _c;
      var name = able.name;
      var className = ((_a = able.className) === null || _a === void 0 ? void 0 : _a.call(able, _this)) || "";
      if (((_b = targetGestoData[name]) === null || _b === void 0 ? void 0 : _b.isEventStart) || ((_c = controlGestoData[name]) === null || _c === void 0 ? void 0 : _c.isEventStart)) {
        className += " ".concat(prefix("".concat(name).concat(classPrefix, "-dragging")));
      }
      return className.trim();
    }).filter(Boolean).join(" ");
  };
  MoveableManager2.prototype._updateResizeObserver = function(prevProps) {
    var _a;
    var props = this.props;
    var target = props.target;
    var win = getWindow(this.getControlBoxElement());
    if (!win.ResizeObserver || !target || !props.useResizeObserver) {
      (_a = this._reiszeObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
      return;
    }
    if (prevProps.target === target && this._reiszeObserver) {
      return;
    }
    var observer = new win.ResizeObserver(this.checkUpdateRect);
    observer.observe(target, {
      box: "border-box"
    });
    this._reiszeObserver = observer;
  };
  MoveableManager2.prototype._updateMutationObserver = function(prevProps) {
    var _this = this;
    var _a;
    var props = this.props;
    var target = props.target;
    var win = getWindow(this.getControlBoxElement());
    if (!win.MutationObserver || !target || !props.useMutationObserver) {
      (_a = this._mutationObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
      return;
    }
    if (prevProps.target === target && this._mutationObserver) {
      return;
    }
    var observer = new win.MutationObserver(function(records) {
      var e_1, _a2;
      try {
        for (var records_1 = __values(records), records_1_1 = records_1.next(); !records_1_1.done; records_1_1 = records_1.next()) {
          var mutation = records_1_1.value;
          if (mutation.type === "attributes" && mutation.attributeName === "style") {
            _this.checkUpdateRect();
          }
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (records_1_1 && !records_1_1.done && (_a2 = records_1.return))
            _a2.call(records_1);
        } finally {
          if (e_1)
            throw e_1.error;
        }
      }
    });
    observer.observe(target, {
      attributes: true
    });
    this._mutationObserver = observer;
  };
  MoveableManager2.defaultProps = {
    dragTargetSelf: false,
    target: null,
    dragTarget: null,
    container: null,
    rootContainer: null,
    origin: true,
    parentMoveable: null,
    wrapperMoveable: null,
    isWrapperMounted: false,
    parentPosition: null,
    warpSelf: false,
    svgOrigin: "",
    dragContainer: null,
    useResizeObserver: false,
    useMutationObserver: false,
    preventDefault: true,
    linePadding: 0,
    controlPadding: 0,
    ables: [],
    pinchThreshold: 20,
    dragArea: false,
    passDragArea: false,
    transformOrigin: "",
    className: "",
    zoom: 1,
    triggerAblesSimultaneously: false,
    padding: {},
    pinchOutside: true,
    checkInput: false,
    dragFocusedInput: false,
    groupable: false,
    hideDefaultLines: false,
    cspNonce: "",
    translateZ: 0,
    cssStyled: null,
    customStyledMap: {},
    props: {},
    stopPropagation: false,
    preventClickDefault: false,
    preventClickEventOnDrag: true,
    flushSync: defaultSync,
    firstRenderState: null,
    persistData: null,
    viewContainer: null,
    requestStyles: [],
    useAccuratePosition: false
  };
  return MoveableManager2;
}(React.PureComponent);
var Groupable = {
  name: "groupable",
  props: [
    "defaultGroupRotate",
    "useDefaultGroupRotate",
    "defaultGroupOrigin",
    "groupable",
    "groupableProps",
    "targetGroups",
    "hideChildMoveableDefaultLines"
  ],
  events: [],
  render: function(moveable, React3) {
    var _a;
    var props = moveable.props;
    var targets = props.targets || [];
    var _b = moveable.getState(), left = _b.left, top = _b.top, isPersisted = _b.isPersisted;
    var zoom = props.zoom || 1;
    var renderGroupRects = moveable.renderGroupRects;
    var persistDatChildren = ((_a = props.persistData) === null || _a === void 0 ? void 0 : _a.children) || [];
    if (isPersisted) {
      targets = persistDatChildren.map(function() {
        return null;
      });
    } else {
      persistDatChildren = [];
    }
    var parentPosition = watchValue(moveable, "parentPosition", [left, top], function(styles) {
      return styles.join(",");
    });
    var requestStyles = watchValue(moveable, "requestStyles", moveable.getRequestChildStyles(), function(styles) {
      return styles.join(",");
    });
    moveable.moveables = moveable.moveables.slice(0, targets.length);
    return __spreadArray(__spreadArray([], __read(targets.map(function(target, i) {
      return React3.createElement(MoveableManager, { key: "moveable" + i, ref: refs(moveable, "moveables", i), target, origin: false, requestStyles, cssStyled: props.cssStyled, customStyledMap: props.customStyledMap, useResizeObserver: props.useResizeObserver, useMutationObserver: props.useMutationObserver, hideChildMoveableDefaultLines: props.hideChildMoveableDefaultLines, parentMoveable: moveable, parentPosition: [left, top], persistData: persistDatChildren[i], zoom });
    })), false), __read(flat(renderGroupRects.map(function(_a2, i) {
      var pos1 = _a2.pos1, pos2 = _a2.pos2, pos3 = _a2.pos3, pos4 = _a2.pos4;
      var poses = [pos1, pos2, pos3, pos4];
      return [
        [0, 1],
        [1, 3],
        [3, 2],
        [2, 0]
      ].map(function(_a3, j) {
        var _b2 = __read(_a3, 2), from = _b2[0], to = _b2[1];
        return renderLine(React3, "", minus(poses[from], parentPosition), minus(poses[to], parentPosition), zoom, "group-rect-".concat(i, "-").concat(j));
      });
    }))), false);
  }
};
var Clickable = makeAble("clickable", {
  props: [
    "clickable"
  ],
  events: [
    "click",
    "clickGroup"
  ],
  always: true,
  dragRelation: "weak",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dragStart: function() {
    return;
  },
  dragControlStart: function() {
    return;
  },
  dragGroupStart: function(moveable, e) {
    e.datas.inputTarget = e.inputEvent && e.inputEvent.target;
  },
  dragEnd: function(moveable, e) {
    var target = moveable.props.target;
    var inputEvent = e.inputEvent;
    var inputTarget = e.inputTarget;
    var isMoveableElement = moveable.isMoveableElement(inputTarget);
    var containsElement = !isMoveableElement && moveable.controlBox.contains(inputTarget);
    if (!inputEvent || !inputTarget || e.isDrag || moveable.isMoveableElement(inputTarget) || containsElement) {
      return;
    }
    var containsTarget = target.contains(inputTarget);
    triggerEvent(moveable, "onClick", fillParams(moveable, e, {
      isDouble: e.isDouble,
      inputTarget,
      isTarget: target === inputTarget,
      moveableTarget: moveable.props.target,
      containsTarget
    }));
  },
  dragGroupEnd: function(moveable, e) {
    var inputEvent = e.inputEvent;
    var inputTarget = e.inputTarget;
    if (!inputEvent || !inputTarget || e.isDrag || moveable.isMoveableElement(inputTarget) || e.datas.inputTarget === inputTarget) {
      return;
    }
    var targets = moveable.props.targets;
    var targetIndex = targets.indexOf(inputTarget);
    var isTarget = targetIndex > -1;
    var containsTarget = false;
    if (targetIndex === -1) {
      targetIndex = findIndex(targets, function(parentTarget) {
        return parentTarget.contains(inputTarget);
      });
      containsTarget = targetIndex > -1;
    }
    triggerEvent(moveable, "onClickGroup", fillParams(moveable, e, {
      isDouble: e.isDouble,
      targets,
      inputTarget,
      targetIndex,
      isTarget,
      containsTarget,
      moveableTarget: targets[targetIndex]
    }));
  },
  dragControlEnd: function(moveable, e) {
    this.dragEnd(moveable, e);
  },
  dragGroupControlEnd: function(moveable, e) {
    this.dragEnd(moveable, e);
  }
});
function getDraggableEvent(e) {
  var datas = e.originalDatas.draggable;
  if (!datas) {
    e.originalDatas.draggable = {};
    datas = e.originalDatas.draggable;
  }
  return __assign6(__assign6({}, e), { datas });
}
var edgeDraggable = makeAble("edgeDraggable", {
  css: [
    ".edge.edgeDraggable.line {\ncursor: move;\n}"
  ],
  render: function(moveable, React3) {
    var props = moveable.props;
    var edge = props.edgeDraggable;
    if (!edge) {
      return [];
    }
    return renderEdgeLines(React3, "edgeDraggable", edge, moveable.getState().renderPoses, props.zoom);
  },
  dragCondition: function(moveable, e) {
    var _a;
    var props = moveable.props;
    var target = (_a = e.inputEvent) === null || _a === void 0 ? void 0 : _a.target;
    if (!props.edgeDraggable || !target) {
      return false;
    }
    return !props.draggable && hasClass(target, prefix("direction")) && hasClass(target, prefix("edge")) && hasClass(target, prefix("edgeDraggable"));
  },
  dragStart: function(moveable, e) {
    return Draggable.dragStart(moveable, getDraggableEvent(e));
  },
  drag: function(moveable, e) {
    return Draggable.drag(moveable, getDraggableEvent(e));
  },
  dragEnd: function(moveable, e) {
    return Draggable.dragEnd(moveable, getDraggableEvent(e));
  },
  dragGroupCondition: function(moveable, e) {
    var _a;
    var props = moveable.props;
    var target = (_a = e.inputEvent) === null || _a === void 0 ? void 0 : _a.target;
    if (!props.edgeDraggable || !target) {
      return false;
    }
    return !props.draggable && hasClass(target, prefix("direction")) && hasClass(target, prefix("line"));
  },
  dragGroupStart: function(moveable, e) {
    return Draggable.dragGroupStart(moveable, getDraggableEvent(e));
  },
  dragGroup: function(moveable, e) {
    return Draggable.dragGroup(moveable, getDraggableEvent(e));
  },
  dragGroupEnd: function(moveable, e) {
    return Draggable.dragGroupEnd(moveable, getDraggableEvent(e));
  },
  unset: function(moveable) {
    return Draggable.unset(moveable);
  }
});
var IndividualGroupable = {
  name: "individualGroupable",
  props: [
    "individualGroupable",
    "individualGroupableProps"
  ],
  events: []
};
var MOVEABLE_ABLES = [
  BeforeRenderable,
  Default,
  Snappable,
  Pinchable,
  Draggable,
  edgeDraggable,
  Resizable,
  Scalable,
  Warpable,
  Rotatable,
  Scrollable,
  Padding,
  Origin,
  OriginDraggable,
  Clippable,
  Roundable,
  Groupable,
  IndividualGroupable,
  Clickable,
  DragArea,
  Renderable
];
function solveConstantsDistance(_a, pos) {
  var _b = __read(_a, 3), a = _b[0], b = _b[1], c = _b[2];
  return (a * pos[0] + b * pos[1] + c) / Math.sqrt(a * a + b * b);
}
function solveC(_a, pos) {
  var _b = __read(_a, 2), a = _b[0], b = _b[1];
  return -a * pos[0] - b * pos[1];
}
function getMaxPos(poses, index) {
  return Math.max.apply(Math, __spreadArray([], __read(poses.map(function(_a) {
    var _b = __read(_a, 4), pos1 = _b[0], pos2 = _b[1], pos3 = _b[2], pos4 = _b[3];
    return Math.max(pos1[index], pos2[index], pos3[index], pos4[index]);
  })), false));
}
function getMinPos(poses, index) {
  return Math.min.apply(Math, __spreadArray([], __read(poses.map(function(_a) {
    var _b = __read(_a, 4), pos1 = _b[0], pos2 = _b[1], pos3 = _b[2], pos4 = _b[3];
    return Math.min(pos1[index], pos2[index], pos3[index], pos4[index]);
  })), false));
}
function getGroupRect(parentPoses, rotation) {
  var _a, _b, _c;
  var pos1 = [0, 0];
  var pos2 = [0, 0];
  var pos3 = [0, 0];
  var pos4 = [0, 0];
  var width = 0;
  var height = 0;
  if (!parentPoses.length) {
    return {
      pos1,
      pos2,
      pos3,
      pos4,
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width,
      height,
      rotation
    };
  }
  var fixedRotation = throttle(rotation, TINY_NUM2);
  if (fixedRotation % 90) {
    var rad = fixedRotation / 180 * Math.PI;
    var a1_1 = Math.tan(rad);
    var a2_1 = -1 / a1_1;
    var a1MinMax_1 = [MAX_NUM, MIN_NUM];
    var a1MinMaxPos_1 = [[0, 0], [0, 0]];
    var a2MinMax_1 = [MAX_NUM, MIN_NUM];
    var a2MinMaxPos_1 = [[0, 0], [0, 0]];
    parentPoses.forEach(function(poses) {
      poses.forEach(function(pos) {
        var a1Dist = solveConstantsDistance([-a1_1, 1, 0], pos);
        var a2Dist = solveConstantsDistance([-a2_1, 1, 0], pos);
        if (a1MinMax_1[0] > a1Dist) {
          a1MinMaxPos_1[0] = pos;
          a1MinMax_1[0] = a1Dist;
        }
        if (a1MinMax_1[1] < a1Dist) {
          a1MinMaxPos_1[1] = pos;
          a1MinMax_1[1] = a1Dist;
        }
        if (a2MinMax_1[0] > a2Dist) {
          a2MinMaxPos_1[0] = pos;
          a2MinMax_1[0] = a2Dist;
        }
        if (a2MinMax_1[1] < a2Dist) {
          a2MinMaxPos_1[1] = pos;
          a2MinMax_1[1] = a2Dist;
        }
      });
    });
    var _d = __read(a1MinMaxPos_1, 2), a1MinPos = _d[0], a1MaxPos = _d[1];
    var _e = __read(a2MinMaxPos_1, 2), a2MinPos = _e[0], a2MaxPos = _e[1];
    var minHorizontalLine = [-a1_1, 1, solveC([-a1_1, 1], a1MinPos)];
    var maxHorizontalLine = [-a1_1, 1, solveC([-a1_1, 1], a1MaxPos)];
    var minVerticalLine = [-a2_1, 1, solveC([-a2_1, 1], a2MinPos)];
    var maxVerticalLine = [-a2_1, 1, solveC([-a2_1, 1], a2MaxPos)];
    _a = __read([
      [minHorizontalLine, minVerticalLine],
      [minHorizontalLine, maxVerticalLine],
      [maxHorizontalLine, minVerticalLine],
      [maxHorizontalLine, maxVerticalLine]
    ].map(function(_a2) {
      var _b2 = __read(_a2, 2), line1 = _b2[0], line2 = _b2[1];
      return getIntersectionPointsByConstants(line1, line2)[0];
    }), 4), pos1 = _a[0], pos2 = _a[1], pos3 = _a[2], pos4 = _a[3];
    width = a2MinMax_1[1] - a2MinMax_1[0];
    height = a1MinMax_1[1] - a1MinMax_1[0];
  } else {
    var minX_1 = getMinPos(parentPoses, 0);
    var minY_1 = getMinPos(parentPoses, 1);
    var maxX_1 = getMaxPos(parentPoses, 0);
    var maxY_1 = getMaxPos(parentPoses, 1);
    pos1 = [minX_1, minY_1];
    pos2 = [maxX_1, minY_1];
    pos3 = [minX_1, maxY_1];
    pos4 = [maxX_1, maxY_1];
    width = maxX_1 - minX_1;
    height = maxY_1 - minY_1;
    if (fixedRotation % 180) {
      var changedX = [pos3, pos1, pos4, pos2];
      _b = __read(changedX, 4), pos1 = _b[0], pos2 = _b[1], pos3 = _b[2], pos4 = _b[3];
      width = maxY_1 - minY_1;
      height = maxX_1 - minX_1;
    }
  }
  if (fixedRotation % 360 > 180) {
    var changedX = [pos4, pos3, pos2, pos1];
    _c = __read(changedX, 4), pos1 = _c[0], pos2 = _c[1], pos3 = _c[2], pos4 = _c[3];
  }
  var _f = getMinMaxs([pos1, pos2, pos3, pos4]), minX = _f.minX, minY = _f.minY, maxX = _f.maxX, maxY = _f.maxY;
  return {
    pos1,
    pos2,
    pos3,
    pos4,
    width,
    height,
    minX,
    minY,
    maxX,
    maxY,
    rotation
  };
}
function findMoveableGroups(moveables, childTargetGroups) {
  var groups = childTargetGroups.map(function(targetGroup) {
    if (isArray(targetGroup)) {
      var childMoveableGroups = findMoveableGroups(moveables, targetGroup);
      var length_1 = childMoveableGroups.length;
      if (length_1 > 1) {
        return childMoveableGroups;
      } else if (length_1 === 1) {
        return childMoveableGroups[0];
      } else {
        return null;
      }
    } else {
      var checked = find2(moveables, function(_a) {
        var manager = _a.manager;
        return manager.props.target === targetGroup;
      });
      if (checked) {
        checked.finded = true;
        return checked.manager;
      }
      return null;
    }
  }).filter(Boolean);
  if (groups.length === 1 && isArray(groups[0])) {
    return groups[0];
  }
  return groups;
}
var MoveableGroup = /* @__PURE__ */ function(_super) {
  __extends4(MoveableGroup2, _super);
  function MoveableGroup2() {
    var _this = _super !== null && _super.apply(this, arguments) || this;
    _this.differ = new children_differ_esm_default();
    _this.moveables = [];
    _this.transformOrigin = "50% 50%";
    _this.renderGroupRects = [];
    _this._targetGroups = [];
    _this._hasFirstTargets = false;
    return _this;
  }
  MoveableGroup2.prototype.componentDidMount = function() {
    _super.prototype.componentDidMount.call(this);
  };
  MoveableGroup2.prototype.checkUpdate = function() {
    this._isPropTargetChanged = false;
    this.updateAbles();
  };
  MoveableGroup2.prototype.getTargets = function() {
    return this.props.targets;
  };
  MoveableGroup2.prototype.updateRect = function(type, isTarget, isSetState) {
    var _a;
    if (isSetState === void 0) {
      isSetState = true;
    }
    var state = this.state;
    if (!this.controlBox || state.isPersisted) {
      return;
    }
    setStoreCache(true);
    this.moveables.forEach(function(moveable) {
      moveable.updateRect(type, false, false);
    });
    var props = this.props;
    var moveables = this.moveables;
    var target = state.target || props.target;
    var checkeds = moveables.map(function(moveable) {
      return { finded: false, manager: moveable };
    });
    var targetGroups = this.props.targetGroups || [];
    var moveableGroups = findMoveableGroups(checkeds, targetGroups);
    var useDefaultGroupRotate = props.useDefaultGroupRotate;
    moveableGroups.push.apply(moveableGroups, __spreadArray([], __read(checkeds.filter(function(_a2) {
      var finded = _a2.finded;
      return !finded;
    }).map(function(_a2) {
      var manager = _a2.manager;
      return manager;
    })), false));
    var renderGroupRects = [];
    var isReset = !isTarget || type !== "" && props.updateGroup;
    var defaultGroupRotate = props.defaultGroupRotate || 0;
    if (!this._hasFirstTargets) {
      var persistedRoatation = (_a = props.persistData) === null || _a === void 0 ? void 0 : _a.rotation;
      if (persistedRoatation != null) {
        defaultGroupRotate = persistedRoatation;
      }
    }
    function getMoveableGroupRect(group, parentRotation, isRoot) {
      var posesRotations = group.map(function(moveable) {
        if (isArray(moveable)) {
          var rect = getMoveableGroupRect(moveable, parentRotation);
          var poses = [rect.pos1, rect.pos2, rect.pos3, rect.pos4];
          renderGroupRects.push(rect);
          return { poses, rotation: rect.rotation };
        } else {
          return {
            poses: getAbsolutePosesByState(moveable.state),
            rotation: moveable.getRotation()
          };
        }
      });
      var rotations = posesRotations.map(function(_a2) {
        var rotation2 = _a2.rotation;
        return rotation2;
      });
      var groupRotation = 0;
      var firstRotation = rotations[0];
      var isSameRotation = rotations.every(function(nextRotation) {
        return Math.abs(firstRotation - nextRotation) < 0.1;
      });
      if (isReset) {
        groupRotation = !useDefaultGroupRotate && isSameRotation ? firstRotation : defaultGroupRotate;
      } else {
        groupRotation = !useDefaultGroupRotate && !isRoot && isSameRotation ? firstRotation : parentRotation;
      }
      var groupPoses = posesRotations.map(function(_a2) {
        var poses = _a2.poses;
        return poses;
      });
      var groupRect = getGroupRect(groupPoses, groupRotation);
      return groupRect;
    }
    var rootGroupRect = getMoveableGroupRect(moveableGroups, this.rotation, true);
    if (isReset) {
      this.rotation = rootGroupRect.rotation;
      this.transformOrigin = props.defaultGroupOrigin || "50% 50%";
      this.scale = [1, 1];
    }
    this._targetGroups = targetGroups;
    this.renderGroupRects = renderGroupRects;
    var transformOrigin = this.transformOrigin;
    var rotation = this.rotation;
    var scale = this.scale;
    var width = rootGroupRect.width, height = rootGroupRect.height, minX = rootGroupRect.minX, minY = rootGroupRect.minY;
    var posesInfo = rotatePosesInfo([
      [0, 0],
      [width, 0],
      [0, height],
      [width, height]
    ], convertTransformOriginArray(transformOrigin, width, height), this.rotation / 180 * Math.PI);
    var _b = getMinMaxs(posesInfo.result), deltaX = _b.minX, deltaY = _b.minY;
    var rotateScale = " rotate(".concat(rotation, "deg)") + " scale(".concat(sign(scale[0]), ", ").concat(sign(scale[1]), ")");
    var transform = "translate(".concat(-deltaX, "px, ").concat(-deltaY, "px)").concat(rotateScale);
    this.controlBox.style.transform = "translate3d(".concat(minX, "px, ").concat(minY, "px, ").concat(this.props.translateZ || 0, ")");
    target.style.cssText += "left:0px;top:0px;" + "transform-origin:".concat(transformOrigin, ";") + "width:".concat(width, "px;height:").concat(height, "px;") + "transform: ".concat(transform);
    state.width = width;
    state.height = height;
    var container = this.getContainer();
    var info = getMoveableTargetInfo(this.controlBox, target, this.controlBox, this.getContainer(), this._rootContainer || container, []);
    var pos = [info.left, info.top];
    var _c = __read(getAbsolutePosesByState(info), 4), pos1 = _c[0], pos2 = _c[1], pos3 = _c[2], pos4 = _c[3];
    var minPos = getMinMaxs([pos1, pos2, pos3, pos4]);
    var delta = [minPos.minX, minPos.minY];
    var direction = sign(scale[0] * scale[1]);
    info.pos1 = minus(pos1, delta);
    info.pos2 = minus(pos2, delta);
    info.pos3 = minus(pos3, delta);
    info.pos4 = minus(pos4, delta);
    info.left = minX - info.left + delta[0];
    info.top = minY - info.top + delta[1];
    info.origin = minus(plus(pos, info.origin), delta);
    info.beforeOrigin = minus(plus(pos, info.beforeOrigin), delta);
    info.originalBeforeOrigin = plus(pos, info.originalBeforeOrigin);
    info.transformOrigin = minus(plus(pos, info.transformOrigin), delta);
    target.style.transform = "translate(".concat(-deltaX - delta[0], "px, ").concat(-deltaY - delta[1], "px)") + rotateScale;
    setStoreCache();
    this.updateState(__assign6(__assign6({}, info), { posDelta: delta, direction, beforeDirection: direction }), isSetState);
  };
  MoveableGroup2.prototype.getRect = function() {
    return __assign6(__assign6({}, _super.prototype.getRect.call(this)), { children: this.moveables.map(function(child) {
      return child.getRect();
    }) });
  };
  MoveableGroup2.prototype.triggerEvent = function(name, e, isManager) {
    if (isManager || name.indexOf("Group") > -1) {
      return _super.prototype.triggerEvent.call(this, name, e);
    } else {
      this._emitter.trigger(name, e);
    }
  };
  MoveableGroup2.prototype.getRequestChildStyles = function() {
    var styleNames = this.getEnabledAbles().reduce(function(names, able) {
      var _a, _b;
      var ableStyleNames = (_b = (_a = able.requestChildStyle) === null || _a === void 0 ? void 0 : _a.call(able)) !== null && _b !== void 0 ? _b : [];
      return __spreadArray(__spreadArray([], __read(names), false), __read(ableStyleNames), false);
    }, []);
    return styleNames;
  };
  MoveableGroup2.prototype.getMoveables = function() {
    return __spreadArray([], __read(this.moveables), false);
  };
  MoveableGroup2.prototype.updateAbles = function() {
    _super.prototype.updateAbles.call(this, __spreadArray(__spreadArray([], __read(this.props.ables), false), [Groupable], false), "Group");
  };
  MoveableGroup2.prototype._updateTargets = function() {
    _super.prototype._updateTargets.call(this);
    this._originalDragTarget = this.props.dragTarget || this.areaElement;
    this._dragTarget = getRefTarget(this._originalDragTarget, true);
  };
  MoveableGroup2.prototype._updateEvents = function() {
    var state = this.state;
    var props = this.props;
    var prevTarget = this._prevDragTarget;
    var nextTarget = props.dragTarget || this.areaElement;
    var targets = props.targets;
    var _a = this.differ.update(targets), added = _a.added, changed = _a.changed, removed = _a.removed;
    var isTargetChanged = added.length || removed.length;
    if (isTargetChanged || this._prevOriginalDragTarget !== this._originalDragTarget) {
      unsetGesto(this, false);
      unsetGesto(this, true);
      this.updateState({ gestos: {} });
    }
    if (prevTarget !== nextTarget) {
      state.target = null;
    }
    if (!state.target) {
      state.target = this.areaElement;
      this.controlBox.style.display = "block";
    }
    if (state.target) {
      if (!this.targetGesto) {
        this.targetGesto = getTargetAbleGesto(this, this._dragTarget, "Group");
      }
      if (!this.controlGesto) {
        this.controlGesto = getAbleGesto(this, this.controlBox, "controlAbles", "GroupControl");
      }
    }
    var isContainerChanged = !equals(state.container, props.container);
    if (isContainerChanged) {
      state.container = props.container;
    }
    if (isContainerChanged || isTargetChanged || this.transformOrigin !== (props.defaultGroupOrigin || "50% 50%") || changed.length || targets.length && !isDeepArrayEquals(this._targetGroups, props.targetGroups || [])) {
      this.updateRect();
      this._hasFirstTargets = true;
    }
    this._isPropTargetChanged = !!isTargetChanged;
  };
  MoveableGroup2.prototype._updateObserver = function() {
  };
  MoveableGroup2.defaultProps = __assign6(__assign6({}, MoveableManager.defaultProps), { transformOrigin: ["50%", "50%"], groupable: true, dragArea: true, keepRatio: true, targets: [], defaultGroupRotate: 0, defaultGroupOrigin: "50% 50%" });
  return MoveableGroup2;
}(MoveableManager);
var MoveableIndividualGroup = /* @__PURE__ */ function(_super) {
  __extends4(MoveableIndividualGroup2, _super);
  function MoveableIndividualGroup2() {
    var _this = _super !== null && _super.apply(this, arguments) || this;
    _this.moveables = [];
    return _this;
  }
  MoveableIndividualGroup2.prototype.render = function() {
    var _this = this;
    var _a;
    var props = this.props;
    var cspNonce = props.cspNonce, ControlBoxElement = props.cssStyled, persistData = props.persistData;
    var targets = props.targets || [];
    var length = targets.length;
    var canPersist = this.isUnmounted || !length;
    var persistDatChildren = (_a = persistData === null || persistData === void 0 ? void 0 : persistData.children) !== null && _a !== void 0 ? _a : [];
    if (canPersist && !length && persistDatChildren.length) {
      targets = persistDatChildren.map(function() {
        return null;
      });
    } else if (!canPersist) {
      persistDatChildren = [];
    }
    return React.createElement(ControlBoxElement, { cspNonce, ref: ref(this, "controlBox"), className: prefix("control-box") }, targets.map(function(target, i) {
      var _a2, _b;
      var individualProps = (_b = (_a2 = props.individualGroupableProps) === null || _a2 === void 0 ? void 0 : _a2.call(props, target, i)) !== null && _b !== void 0 ? _b : {};
      return React.createElement(MoveableManager, __assign6({ key: "moveable" + i, ref: refs(_this, "moveables", i) }, props, individualProps, { target, wrapperMoveable: _this, isWrapperMounted: _this.isMoveableMounted, persistData: persistDatChildren[i] }));
    }));
  };
  MoveableIndividualGroup2.prototype.componentDidMount = function() {
  };
  MoveableIndividualGroup2.prototype.componentDidUpdate = function() {
  };
  MoveableIndividualGroup2.prototype.getTargets = function() {
    return this.props.targets;
  };
  MoveableIndividualGroup2.prototype.updateRect = function(type, isTarget, isSetState) {
    if (isSetState === void 0) {
      isSetState = true;
    }
    setStoreCache(true);
    this.moveables.forEach(function(moveable) {
      moveable.updateRect(type, isTarget, isSetState);
    });
    setStoreCache();
  };
  MoveableIndividualGroup2.prototype.getRect = function() {
    return __assign6(__assign6({}, _super.prototype.getRect.call(this)), { children: this.moveables.map(function(child) {
      return child.getRect();
    }) });
  };
  MoveableIndividualGroup2.prototype.request = function(ableName, param, isInstant) {
    if (param === void 0) {
      param = {};
    }
    var results = this.moveables.map(function(m) {
      return m.request(ableName, __assign6(__assign6({}, param), { isInstant: false }), false);
    });
    var requestInstant = isInstant || param.isInstant;
    var requester = {
      request: function(ableParam) {
        results.forEach(function(r) {
          return r.request(ableParam);
        });
        return this;
      },
      requestEnd: function() {
        results.forEach(function(r) {
          return r.requestEnd();
        });
        return this;
      }
    };
    return requestInstant ? requester.request(param).requestEnd() : requester;
  };
  MoveableIndividualGroup2.prototype.dragStart = function(e) {
    var inputTarget = e.target;
    var childMoveable = find2(this.moveables, function(child) {
      var target = child.getTargets()[0];
      var controlBoxElement = child.getControlBoxElement();
      var dragElement = child.getDragElement();
      if (!target || !dragElement) {
        return false;
      }
      return dragElement === inputTarget || dragElement.contains(inputTarget) || (dragElement !== target && target === inputTarget || target.contains(inputTarget)) || controlBoxElement === inputTarget || controlBoxElement.contains(inputTarget);
    });
    if (childMoveable) {
      childMoveable.dragStart(e);
    }
    return this;
  };
  MoveableIndividualGroup2.prototype.hitTest = function() {
    return 0;
  };
  MoveableIndividualGroup2.prototype.isInside = function() {
    return false;
  };
  MoveableIndividualGroup2.prototype.isDragging = function() {
    return false;
  };
  MoveableIndividualGroup2.prototype.getDragElement = function() {
    return null;
  };
  MoveableIndividualGroup2.prototype.getMoveables = function() {
    return __spreadArray([], __read(this.moveables), false);
  };
  MoveableIndividualGroup2.prototype.updateRenderPoses = function() {
  };
  MoveableIndividualGroup2.prototype.checkUpdate = function() {
  };
  MoveableIndividualGroup2.prototype.triggerEvent = function() {
  };
  MoveableIndividualGroup2.prototype.updateAbles = function() {
  };
  MoveableIndividualGroup2.prototype._updateEvents = function() {
  };
  MoveableIndividualGroup2.prototype._updateObserver = function() {
  };
  return MoveableIndividualGroup2;
}(MoveableManager);
function getElementTargets(refTargets, selectorMap) {
  var elementTargets = [];
  refTargets.forEach(function(target) {
    if (!target) {
      return;
    }
    if (isString(target)) {
      if (selectorMap[target]) {
        elementTargets.push.apply(elementTargets, __spreadArray([], __read(selectorMap[target]), false));
      }
      return;
    }
    if (isArray(target)) {
      elementTargets.push.apply(elementTargets, __spreadArray([], __read(getElementTargets(target, selectorMap)), false));
    } else {
      elementTargets.push(target);
    }
  });
  return elementTargets;
}
function getTargetGroups(refTargets, selectorMap) {
  var targetGroups = [];
  refTargets.forEach(function(target) {
    if (!target) {
      return;
    }
    if (isString(target)) {
      if (selectorMap[target]) {
        targetGroups.push.apply(targetGroups, __spreadArray([], __read(selectorMap[target]), false));
      }
      return;
    }
    if (isArray(target)) {
      targetGroups.push(getTargetGroups(target, selectorMap));
    } else {
      targetGroups.push(target);
    }
  });
  return targetGroups;
}
function compareRefTargets(prevRefTargets, nextRefTargets) {
  return prevRefTargets.length !== nextRefTargets.length || prevRefTargets.some(function(target, i) {
    var nextTarget = nextRefTargets[i];
    if (!target && !nextTarget) {
      return false;
    } else if (target != nextTarget) {
      if (isArray(target) && isArray(nextTarget)) {
        return compareRefTargets(target, nextTarget);
      }
      return true;
    }
    return false;
  });
}
var InitialMoveable = /* @__PURE__ */ function(_super) {
  __extends4(InitialMoveable2, _super);
  function InitialMoveable2() {
    var _this = _super !== null && _super.apply(this, arguments) || this;
    _this.refTargets = [];
    _this.selectorMap = {};
    _this._differ = new children_differ_esm_default();
    _this._elementTargets = [];
    _this._tmpRefTargets = [];
    _this._tmpSelectorMap = {};
    _this._onChangeTargets = null;
    return _this;
  }
  InitialMoveable2.makeStyled = function() {
    var cssMap = {};
    var ables = this.getTotalAbles();
    ables.forEach(function(_a) {
      var css2 = _a.css;
      if (!css2) {
        return;
      }
      css2.forEach(function(text) {
        cssMap[text] = true;
      });
    });
    var style = getKeys(cssMap).join("\n");
    this.defaultStyled = styled2("div", prefixCSS(PREFIX, MOVEABLE_CSS + style));
  };
  InitialMoveable2.getTotalAbles = function() {
    return __spreadArray([Default, Groupable, IndividualGroupable, DragArea], __read(this.defaultAbles), false);
  };
  InitialMoveable2.prototype.render = function() {
    var _a;
    var moveableContructor = this.constructor;
    if (!moveableContructor.defaultStyled) {
      moveableContructor.makeStyled();
    }
    var _b = this.props, userAbles = _b.ables, userProps = _b.props, props = __rest2(_b, ["ables", "props"]);
    var _c = __read(this._updateRefs(true), 2), refTargets = _c[0], nextSelectorMap = _c[1];
    var elementTargets = getElementTargets(refTargets, nextSelectorMap);
    var isGroup = elementTargets.length > 1;
    var totalAbles = moveableContructor.getTotalAbles();
    var ables = __spreadArray(__spreadArray([], __read(totalAbles), false), __read(userAbles || []), false);
    var nextProps = __assign6(__assign6(__assign6({}, props), userProps || {}), { ables, cssStyled: moveableContructor.defaultStyled, customStyledMap: moveableContructor.customStyledMap });
    this._elementTargets = elementTargets;
    var firstRenderState = null;
    var prevMoveable = this.moveable;
    var persistData = props.persistData;
    if (persistData === null || persistData === void 0 ? void 0 : persistData.children) {
      isGroup = true;
    }
    if (props.individualGroupable) {
      return React.createElement(MoveableIndividualGroup, __assign6({ key: "individual-group", ref: ref(this, "moveable") }, nextProps, { target: null, targets: elementTargets }));
    }
    if (isGroup) {
      var targetGroups = getTargetGroups(refTargets, nextSelectorMap);
      if (prevMoveable && !prevMoveable.props.groupable && !prevMoveable.props.individualGroupable) {
        var target = prevMoveable.props.target;
        if (target && elementTargets.indexOf(target) > -1) {
          firstRenderState = __assign6({}, prevMoveable.state);
        }
      }
      return React.createElement(MoveableGroup, __assign6({ key: "group", ref: ref(this, "moveable") }, nextProps, (_a = props.groupableProps) !== null && _a !== void 0 ? _a : {}, { target: null, targets: elementTargets, targetGroups, firstRenderState }));
    } else {
      var target_1 = elementTargets[0];
      if (prevMoveable && (prevMoveable.props.groupable || prevMoveable.props.individualGroupable)) {
        var moveables = prevMoveable.moveables || [];
        var prevTargetMoveable = find2(moveables, function(mv) {
          return mv.props.target === target_1;
        });
        if (prevTargetMoveable) {
          firstRenderState = __assign6({}, prevTargetMoveable.state);
        }
      }
      return React.createElement(MoveableManager, __assign6({ key: "single", ref: ref(this, "moveable") }, nextProps, { target: target_1, firstRenderState }));
    }
  };
  InitialMoveable2.prototype.componentDidMount = function() {
    this._checkChangeTargets();
  };
  InitialMoveable2.prototype.componentDidUpdate = function() {
    this._checkChangeTargets();
  };
  InitialMoveable2.prototype.componentWillUnmount = function() {
    this.selectorMap = {};
    this.refTargets = [];
  };
  InitialMoveable2.prototype.getTargets = function() {
    var _a, _b;
    return (_b = (_a = this.moveable) === null || _a === void 0 ? void 0 : _a.getTargets()) !== null && _b !== void 0 ? _b : [];
  };
  InitialMoveable2.prototype.updateSelectors = function() {
    this.selectorMap = {};
    this._updateRefs();
  };
  InitialMoveable2.prototype.waitToChangeTarget = function() {
    var _this = this;
    var resolvePromise;
    this._onChangeTargets = function() {
      _this._onChangeTargets = null;
      resolvePromise();
    };
    return new Promise(function(resolve) {
      resolvePromise = resolve;
    });
  };
  InitialMoveable2.prototype.waitToChangeTargets = function() {
    return this.waitToChangeTarget();
  };
  InitialMoveable2.prototype.getManager = function() {
    return this.moveable;
  };
  InitialMoveable2.prototype.getMoveables = function() {
    return this.moveable.getMoveables();
  };
  InitialMoveable2.prototype.getDragElement = function() {
    return this.moveable.getDragElement();
  };
  InitialMoveable2.prototype._updateRefs = function(isRender) {
    var prevRefTargets = this.refTargets;
    var nextRefTargets = getRefTargets(this.props.target || this.props.targets);
    var isBrowser = typeof document !== "undefined";
    var isUpdate = compareRefTargets(prevRefTargets, nextRefTargets);
    var selectorMap = this.selectorMap;
    var nextSelectorMap = {};
    this.refTargets.forEach(function updateSelectorMap(target) {
      if (isString(target)) {
        var selectorTarget = selectorMap[target];
        if (selectorTarget) {
          nextSelectorMap[target] = selectorMap[target];
        } else if (isBrowser) {
          isUpdate = true;
          nextSelectorMap[target] = [].slice.call(document.querySelectorAll(target));
        }
      } else if (isArray(target)) {
        target.forEach(updateSelectorMap);
      }
    });
    this._tmpRefTargets = nextRefTargets;
    this._tmpSelectorMap = nextSelectorMap;
    return [
      nextRefTargets,
      nextSelectorMap,
      !isRender && isUpdate
    ];
  };
  InitialMoveable2.prototype._checkChangeTargets = function() {
    var _a, _b, _c;
    this.refTargets = this._tmpRefTargets;
    this.selectorMap = this._tmpSelectorMap;
    var _d = this._differ.update(this._elementTargets), added = _d.added, removed = _d.removed;
    var isTargetChanged = added.length || removed.length;
    if (isTargetChanged) {
      (_b = (_a = this.props).onChangeTargets) === null || _b === void 0 ? void 0 : _b.call(_a, {
        moveable: this.moveable,
        targets: this._elementTargets
      });
      (_c = this._onChangeTargets) === null || _c === void 0 ? void 0 : _c.call(this);
    }
    var _e = __read(this._updateRefs(), 3), refTargets = _e[0], selectorMap = _e[1], isUpdate = _e[2];
    this.refTargets = refTargets;
    this.selectorMap = selectorMap;
    if (isUpdate) {
      this.forceUpdate();
    }
  };
  InitialMoveable2.defaultAbles = [];
  InitialMoveable2.customStyledMap = {};
  InitialMoveable2.defaultStyled = null;
  __decorate([
    withMethods(MOVEABLE_METHODS)
  ], InitialMoveable2.prototype, "moveable", void 0);
  return InitialMoveable2;
}(React.PureComponent);
var Moveable = /* @__PURE__ */ function(_super) {
  __extends4(Moveable2, _super);
  function Moveable2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  Moveable2.defaultAbles = MOVEABLE_ABLES;
  return Moveable2;
}(InitialMoveable);

// src/ui/extensions/image/image-resize.tsx
import { Fragment, jsx as jsx2 } from "react/jsx-runtime";
var ImageResizer = ({ editor }) => {
  const updateMediaSize = () => {
    const imageInfo = document.querySelector(".ProseMirror-selectednode");
    if (imageInfo) {
      const selection = editor.state.selection;
      editor.commands.setImage({
        src: imageInfo.src,
        width: Number(imageInfo.style.width.replace("px", "")),
        height: Number(imageInfo.style.height.replace("px", ""))
      });
      editor.commands.setNodeSelection(selection.from);
    }
  };
  return /* @__PURE__ */ jsx2(Fragment, { children: /* @__PURE__ */ jsx2(
    Moveable,
    {
      target: document.querySelector(".ProseMirror-selectednode"),
      container: null,
      origin: false,
      edge: false,
      throttleDrag: 0,
      keepRatio: true,
      resizable: true,
      throttleResize: 0,
      onResize: ({ target, width, height, delta }) => {
        delta[0] && (target.style.width = `${width}px`);
        delta[1] && (target.style.height = `${height}px`);
      },
      onResizeEnd: () => {
        updateMediaSize();
      },
      scalable: true,
      renderDirections: ["w", "e"],
      onScale: ({ target, transform }) => {
        target.style.transform = transform;
      }
    }
  ) });
};

// src/ui/menus/table-menu/index.tsx
import { useState, useEffect as useEffect2 } from "react";
import { Rows, Columns, ToggleRight } from "lucide-react";

// src/ui/menus/table-menu/InsertLeftTableIcon.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
var InsertLeftTableIcon = (props) => /* @__PURE__ */ jsx3(
  "svg",
  __spreadProps(__spreadValues({
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 -960 960 960"
  }, props), {
    children: /* @__PURE__ */ jsx3(
      "path",
      {
        d: "M224.617-140.001q-30.307 0-51.307-21-21-21-21-51.308v-535.382q0-30.308 21-51.308t51.307-21H360q30.307 0 51.307 21 21 21 21 51.308v535.382q0 30.308-21 51.308t-51.307 21H224.617Zm375.383 0q-30.307 0-51.307-21-21-21-21-51.308v-535.382q0-30.308 21-51.308t51.307-21h135.383q30.307 0 51.307 21 21 21 21 51.308v535.382q0 30.308-21 51.308t-51.307 21H600Zm147.691-607.69q0-4.616-3.846-8.463-3.846-3.846-8.462-3.846H600q-4.616 0-8.462 3.846-3.847 3.847-3.847 8.463v535.382q0 4.616 3.847 8.463Q595.384-200 600-200h135.383q4.616 0 8.462-3.846 3.846-3.847 3.846-8.463v-535.382ZM587.691-200h160-160Z",
        fill: "rgb(var(--color-text-300))"
      }
    )
  })
);
var InsertLeftTableIcon_default = InsertLeftTableIcon;

// src/ui/menus/table-menu/InsertRightTableIcon.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
var InsertRightTableIcon = (props) => /* @__PURE__ */ jsx4(
  "svg",
  __spreadProps(__spreadValues({
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 -960 960 960"
  }, props), {
    children: /* @__PURE__ */ jsx4(
      "path",
      {
        d: "M600-140.001q-30.307 0-51.307-21-21-21-21-51.308v-535.382q0-30.308 21-51.308t51.307-21h135.383q30.307 0 51.307 21 21 21 21 51.308v535.382q0 30.308-21 51.308t-51.307 21H600Zm-375.383 0q-30.307 0-51.307-21-21-21-21-51.308v-535.382q0-30.308 21-51.308t51.307-21H360q30.307 0 51.307 21 21 21 21 51.308v535.382q0 30.308-21 51.308t-51.307 21H224.617Zm-12.308-607.69v535.382q0 4.616 3.846 8.463 3.846 3.846 8.462 3.846H360q4.616 0 8.462-3.846 3.847-3.847 3.847-8.463v-535.382q0-4.616-3.847-8.463Q364.616-760 360-760H224.617q-4.616 0-8.462 3.846-3.846 3.847-3.846 8.463Zm160 547.691h-160 160Z",
        fill: "rgb(var(--color-text-300))"
      }
    )
  })
);
var InsertRightTableIcon_default = InsertRightTableIcon;

// src/ui/menus/table-menu/InsertTopTableIcon.tsx
import { jsx as jsx5 } from "react/jsx-runtime";
var InsertTopTableIcon = (props) => /* @__PURE__ */ jsx5(
  "svg",
  __spreadProps(__spreadValues({
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 -960 960 960"
  }, props), {
    children: /* @__PURE__ */ jsx5(
      "path",
      {
        d: "M212.309-527.693q-30.308 0-51.308-21t-21-51.307v-135.383q0-30.307 21-51.307 21-21 51.308-21h535.382q30.308 0 51.308 21t21 51.307V-600q0 30.307-21 51.307-21 21-51.308 21H212.309Zm0 375.383q-30.308 0-51.308-21t-21-51.307V-360q0-30.307 21-51.307 21-21 51.308-21h535.382q30.308 0 51.308 21t21 51.307v135.383q0 30.307-21 51.307-21 21-51.308 21H212.309Zm0-59.999h535.382q4.616 0 8.463-3.846 3.846-3.846 3.846-8.462V-360q0-4.616-3.846-8.462-3.847-3.847-8.463-3.847H212.309q-4.616 0-8.463 3.847Q200-364.616 200-360v135.383q0 4.616 3.846 8.462 3.847 3.846 8.463 3.846Zm-12.309-160v160-160Z",
        fill: "rgb(var(--color-text-300))"
      }
    )
  })
);
var InsertTopTableIcon_default = InsertTopTableIcon;

// src/ui/menus/table-menu/InsertBottomTableIcon.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
var InsertBottomTableIcon = (props) => /* @__PURE__ */ jsx6(
  "svg",
  __spreadProps(__spreadValues({
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 -960 960 960"
  }, props), {
    children: /* @__PURE__ */ jsx6(
      "path",
      {
        d: "M212.309-152.31q-30.308 0-51.308-21t-21-51.307V-360q0-30.307 21-51.307 21-21 51.308-21h535.382q30.308 0 51.308 21t21 51.307v135.383q0 30.307-21 51.307-21 21-51.308 21H212.309Zm0-375.383q-30.308 0-51.308-21t-21-51.307v-135.383q0-30.307 21-51.307 21-21 51.308-21h535.382q30.308 0 51.308 21t21 51.307V-600q0 30.307-21 51.307-21 21-51.308 21H212.309Zm535.382-219.998H212.309q-4.616 0-8.463 3.846-3.846 3.846-3.846 8.462V-600q0 4.616 3.846 8.462 3.847 3.847 8.463 3.847h535.382q4.616 0 8.463-3.847Q760-595.384 760-600v-135.383q0-4.616-3.846-8.462-3.847-3.846-8.463-3.846ZM200-587.691v-160 160Z",
        fill: "rgb(var(--color-text-300))"
      }
    )
  })
);
var InsertBottomTableIcon_default = InsertBottomTableIcon;

// src/ui/menus/table-menu/tooltip.tsx
import * as React2 from "react";
import { useTheme } from "next-themes";
import { Tooltip2 } from "@blueprintjs/popover2";
import { jsx as jsx7, jsxs } from "react/jsx-runtime";
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
  const { theme } = useTheme();
  return /* @__PURE__ */ jsx7(
    Tooltip2,
    {
      disabled,
      hoverOpenDelay: openDelay,
      hoverCloseDelay: closeDelay,
      content: /* @__PURE__ */ jsxs(
        "div",
        {
          className: `relative z-50 max-w-xs gap-1 rounded-md p-2 text-xs shadow-md ${theme === "custom" ? "bg-custom-background-100 text-custom-text-200" : "bg-black text-gray-400"} break-words overflow-hidden ${className}`,
          children: [
            tooltipHeading && /* @__PURE__ */ jsx7(
              "h5",
              {
                className: `font-medium ${theme === "custom" ? "text-custom-text-100" : "text-white"}`,
                children: tooltipHeading
              }
            ),
            tooltipContent
          ]
        }
      ),
      position,
      renderTarget: (_a) => {
        var _b = _a, { isOpen: isTooltipOpen, ref: eleReference } = _b, tooltipProps = __objRest(_b, ["isOpen", "ref"]);
        return React2.cloneElement(children, __spreadValues(__spreadValues({ ref: eleReference }, tooltipProps), children.props));
      }
    }
  );
};

// src/ui/menus/table-menu/index.tsx
import { jsx as jsx8 } from "react/jsx-runtime";
var TableMenu = ({ editor }) => {
  const [tableLocation, setTableLocation] = useState({ bottom: 0, left: 0 });
  const isOpen = editor == null ? void 0 : editor.isActive("table");
  const items = [
    {
      command: () => editor.chain().focus().addColumnBefore().run(),
      icon: InsertLeftTableIcon_default,
      key: "insert-column-left",
      name: "Insert 1 column left"
    },
    {
      command: () => editor.chain().focus().addColumnAfter().run(),
      icon: InsertRightTableIcon_default,
      key: "insert-column-right",
      name: "Insert 1 column right"
    },
    {
      command: () => editor.chain().focus().addRowBefore().run(),
      icon: InsertTopTableIcon_default,
      key: "insert-row-above",
      name: "Insert 1 row above"
    },
    {
      command: () => editor.chain().focus().addRowAfter().run(),
      icon: InsertBottomTableIcon_default,
      key: "insert-row-below",
      name: "Insert 1 row below"
    },
    {
      command: () => editor.chain().focus().deleteColumn().run(),
      icon: Columns,
      key: "delete-column",
      name: "Delete column"
    },
    {
      command: () => editor.chain().focus().deleteRow().run(),
      icon: Rows,
      key: "delete-row",
      name: "Delete row"
    },
    {
      command: () => editor.chain().focus().toggleHeaderRow().run(),
      icon: ToggleRight,
      key: "toggle-header-row",
      name: "Toggle header row"
    }
  ];
  useEffect2(() => {
    if (!window)
      return;
    const handleWindowClick = () => {
      const selection = window == null ? void 0 : window.getSelection();
      if (selection.rangeCount !== 0) {
        const range = selection.getRangeAt(0);
        const tableNode = findTableAncestor(range.startContainer);
        if (tableNode) {
          const tableRect = tableNode.getBoundingClientRect();
          const tableCenter = tableRect.left + tableRect.width / 2;
          const menuWidth = 45;
          const menuLeft = tableCenter - menuWidth / 2;
          const tableBottom = tableRect.bottom;
          setTableLocation({ bottom: tableBottom, left: menuLeft });
        }
      }
    };
    window.addEventListener("click", handleWindowClick);
    return () => {
      window.removeEventListener("click", handleWindowClick);
    };
  }, [tableLocation, editor]);
  return /* @__PURE__ */ jsx8(
    "section",
    {
      className: `absolute z-20 left-1/2 -translate-x-1/2 overflow-hidden rounded border border-custom-border-300 bg-custom-background-100 shadow-custom-shadow-sm p-1 ${isOpen ? "block" : "hidden"}`,
      children: items.map((item, index) => /* @__PURE__ */ jsx8(Tooltip, { tooltipContent: item.name, children: /* @__PURE__ */ jsx8(
        "button",
        {
          onClick: item.command,
          className: "p-1.5 text-custom-text-200 hover:bg-text-custom-text-100 hover:bg-custom-background-80 active:bg-custom-background-80 rounded",
          title: item.name,
          children: /* @__PURE__ */ jsx8(
            item.icon,
            {
              className: cn("h-4 w-4 text-lg", {
                "text-red-600": item.key.includes("delete")
              })
            }
          )
        }
      ) }, index))
    }
  );
};

// src/ui/components/editor-content.tsx
import { jsx as jsx9, jsxs as jsxs2 } from "react/jsx-runtime";
var EditorContentWrapper = ({ editor, editorContentCustomClassNames = "", children }) => /* @__PURE__ */ jsxs2("div", { className: `${editorContentCustomClassNames}`, children: [
  /* @__PURE__ */ jsx9(EditorContent, { editor }),
  /* @__PURE__ */ jsx9(TableMenu, { editor }),
  (editor == null ? void 0 : editor.isActive("image")) && /* @__PURE__ */ jsx9(ImageResizer, { editor }),
  children
] });

// src/ui/hooks/useEditor.tsx
import { useEditor as useCustomEditor } from "@tiptap/react";
import { useImperativeHandle as useImperativeHandle2, useRef as useRef2 } from "react";
import { useDebouncedCallback } from "use-debounce";

// src/ui/props.tsx
function CoreEditorProps(uploadFile, setIsSubmitting) {
  return {
    attributes: {
      class: `prose prose-brand max-w-full prose-headings:font-display font-default focus:outline-none`
    },
    handleDOMEvents: {
      keydown: (_view, event) => {
        if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
          const slashCommand = document.querySelector("#slash-command");
          if (slashCommand) {
            return true;
          }
        }
      }
    },
    handlePaste: (view, event) => {
      if (typeof window !== "undefined") {
        const selection = window == null ? void 0 : window.getSelection();
        if (selection.rangeCount !== 0) {
          const range = selection.getRangeAt(0);
          if (findTableAncestor(range.startContainer)) {
            return;
          }
        }
      }
      if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
        event.preventDefault();
        const file = event.clipboardData.files[0];
        const pos = view.state.selection.from;
        startImageUpload(file, view, pos, uploadFile, setIsSubmitting);
        return true;
      }
      return false;
    },
    handleDrop: (view, event, _slice, moved) => {
      if (typeof window !== "undefined") {
        const selection = window == null ? void 0 : window.getSelection();
        if (selection.rangeCount !== 0) {
          const range = selection.getRangeAt(0);
          if (findTableAncestor(range.startContainer)) {
            return;
          }
        }
      }
      if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        const coordinates = view.posAtCoords({
          left: event.clientX,
          top: event.clientY
        });
        if (coordinates) {
          startImageUpload(file, view, coordinates.pos - 1, uploadFile, setIsSubmitting);
        }
        return true;
      }
      return false;
    }
  };
}

// src/ui/extensions/index.tsx
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapUnderline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "tiptap-markdown";

// ../../../node_modules/@tiptap/extension-gapcursor/dist/index.js
import { Extension, callOrReturn, getExtensionField } from "@tiptap/core";
import { gapCursor } from "@tiptap/pm/gapcursor";
var Gapcursor = Extension.create({
  name: "gapCursor",
  addProseMirrorPlugins() {
    return [
      gapCursor()
    ];
  },
  extendNodeSchema(extension) {
    var _a;
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage
    };
    return {
      allowGapCursor: (_a = callOrReturn(getExtensionField(extension, "allowGapCursor", context))) !== null && _a !== void 0 ? _a : null
    };
  }
});

// src/ui/extensions/table/table-cell.ts
import { TableCell } from "@tiptap/extension-table-cell";
var CustomTableCell = TableCell.extend({
  addAttributes() {
    var _a;
    return __spreadProps(__spreadValues({}, (_a = this.parent) == null ? void 0 : _a.call(this)), {
      isHeader: {
        default: false,
        parseHTML: (element) => {
          isHeader:
            element.tagName === "TD";
        },
        renderHTML: (attributes) => {
          tag:
            attributes.isHeader ? "th" : "td";
        }
      }
    });
  },
  renderHTML({ HTMLAttributes }) {
    if (HTMLAttributes.isHeader) {
      return [
        "th",
        __spreadProps(__spreadValues({}, HTMLAttributes), {
          class: `relative ${HTMLAttributes.class}`
        }),
        ["span", { class: "absolute top-0 right-0" }],
        0
      ];
    }
    return ["td", HTMLAttributes, 0];
  }
});

// src/ui/extensions/table/index.ts
import { Table as BaseTable } from "@tiptap/extension-table";
var Table = BaseTable.configure({
  resizable: true,
  cellMinWidth: 100,
  allowTableNodeSelection: true
});

// src/ui/extensions/table/table-header.ts
import { TableHeader as BaseTableHeader } from "@tiptap/extension-table-header";
var TableHeader = BaseTableHeader.extend({
  content: "paragraph"
});

// src/ui/extensions/index.tsx
import { TableRow } from "@tiptap/extension-table-row";

// src/ui/extensions/image/index.tsx
import Image2 from "@tiptap/extension-image";

// src/ui/plugins/delete-image.tsx
import { Plugin as Plugin2, PluginKey as PluginKey2 } from "@tiptap/pm/state";
var deleteKey = new PluginKey2("delete-image");
var IMAGE_NODE_TYPE = "image";
var TrackImageDeletionPlugin = (deleteImage) => new Plugin2({
  key: deleteKey,
  appendTransaction: (transactions, oldState, newState) => {
    const newImageSources = /* @__PURE__ */ new Set();
    newState.doc.descendants((node) => {
      if (node.type.name === IMAGE_NODE_TYPE) {
        newImageSources.add(node.attrs.src);
      }
    });
    transactions.forEach((transaction) => {
      if (!transaction.docChanged)
        return;
      const removedImages = [];
      oldState.doc.descendants((oldNode, oldPos) => {
        if (oldNode.type.name !== IMAGE_NODE_TYPE)
          return;
        if (oldPos < 0 || oldPos > newState.doc.content.size)
          return;
        if (!newState.doc.resolve(oldPos).parent)
          return;
        const newNode = newState.doc.nodeAt(oldPos);
        if (!newNode || newNode.type.name !== IMAGE_NODE_TYPE) {
          if (!newImageSources.has(oldNode.attrs.src)) {
            removedImages.push(oldNode);
          }
        }
      });
      removedImages.forEach((node) => __async(void 0, null, function* () {
        const src = node.attrs.src;
        yield onNodeDeleted(src, deleteImage);
      }));
    });
    return null;
  }
});
var delete_image_default = TrackImageDeletionPlugin;
function onNodeDeleted(src, deleteImage) {
  return __async(this, null, function* () {
    try {
      const assetUrlWithWorkspaceId = new URL(src).pathname.substring(1);
      const resStatus = yield deleteImage(assetUrlWithWorkspaceId);
      if (resStatus === 204) {
        console.log("Image deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting image: ", error);
    }
  });
}

// src/ui/extensions/image/index.tsx
var ImageExtension = (deleteImage) => Image2.extend({
  addProseMirrorPlugins() {
    return [upload_image_default(), delete_image_default(deleteImage)];
  },
  addAttributes() {
    var _a;
    return __spreadProps(__spreadValues({}, (_a = this.parent) == null ? void 0 : _a.call(this)), {
      width: {
        default: "35%"
      },
      height: {
        default: null
      }
    });
  }
});
var image_default = ImageExtension;

// src/ui/menus/bubble-menu/utils/index.tsx
function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

// src/ui/extensions/index.tsx
var CoreEditorExtensions = (deleteFile) => [
  StarterKit.configure({
    bulletList: {
      HTMLAttributes: {
        class: "list-disc list-outside leading-3 -mt-2"
      }
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal list-outside leading-3 -mt-2"
      }
    },
    listItem: {
      HTMLAttributes: {
        class: "leading-normal -mb-2"
      }
    },
    blockquote: {
      HTMLAttributes: {
        class: "border-l-4 border-custom-border-300"
      }
    },
    code: {
      HTMLAttributes: {
        class: "rounded-md bg-custom-primary-30 mx-1 px-1 py-1 font-mono font-medium text-custom-text-1000",
        spellcheck: "false"
      }
    },
    codeBlock: false,
    horizontalRule: false,
    dropcursor: {
      color: "rgba(var(--color-text-100))",
      width: 2
    },
    gapcursor: false
  }),
  Gapcursor,
  TiptapLink.configure({
    protocols: ["http", "https"],
    validate: (url) => isValidHttpUrl(url),
    HTMLAttributes: {
      class: "text-custom-primary-300 underline underline-offset-[3px] hover:text-custom-primary-500 transition-colors cursor-pointer"
    }
  }),
  image_default(deleteFile).configure({
    HTMLAttributes: {
      class: "rounded-lg border border-custom-border-300"
    }
  }),
  TiptapUnderline,
  TextStyle,
  Color,
  TaskList.configure({
    HTMLAttributes: {
      class: "not-prose pl-2"
    }
  }),
  TaskItem.configure({
    HTMLAttributes: {
      class: "flex items-start my-4"
    },
    nested: true
  }),
  Markdown.configure({
    html: true,
    transformCopiedText: true
  }),
  Table,
  TableHeader,
  CustomTableCell,
  TableRow
];

// src/ui/hooks/useEditor.tsx
var DEBOUNCE_DELAY = 1500;
var useEditor = ({ uploadFile, editable, deleteFile, editorProps = {}, value, extensions = [], onChange, setIsSubmitting, debouncedUpdatesEnabled, forwardedRef, setShouldShowAlert }) => {
  const editor = useCustomEditor({
    editable: editable != null ? editable : true,
    editorProps: __spreadValues(__spreadValues({}, CoreEditorProps(uploadFile, setIsSubmitting)), editorProps),
    extensions: [...CoreEditorExtensions(deleteFile), ...extensions],
    content: typeof value === "string" && value.trim() !== "" ? value : "<p></p>",
    onUpdate: (_0) => __async(void 0, [_0], function* ({ editor: editor2 }) {
      setIsSubmitting == null ? void 0 : setIsSubmitting("submitting");
      setShouldShowAlert == null ? void 0 : setShouldShowAlert(true);
      if (debouncedUpdatesEnabled) {
        debouncedUpdates({ onChange, editor: editor2 });
      } else {
        onChange == null ? void 0 : onChange(editor2.getJSON(), getTrimmedHTML(editor2.getHTML()));
      }
    })
  });
  const editorRef = useRef2(null);
  editorRef.current = editor;
  useImperativeHandle2(forwardedRef, () => ({
    clearEditor: () => {
      var _a;
      (_a = editorRef.current) == null ? void 0 : _a.commands.clearContent();
    },
    setEditorValue: (content) => {
      var _a;
      (_a = editorRef.current) == null ? void 0 : _a.commands.setContent(content);
    }
  }));
  const debouncedUpdates = useDebouncedCallback((_0) => __async(void 0, [_0], function* ({ onChange: onChange2, editor: editor2 }) {
    if (onChange2) {
      onChange2(editor2.getJSON(), getTrimmedHTML(editor2.getHTML()));
    }
  }), DEBOUNCE_DELAY);
  if (!editor) {
    return null;
  }
  return editor;
};

// src/ui/hooks/useReadOnlyEditor.tsx
import { useEditor as useCustomEditor2 } from "@tiptap/react";
import { useImperativeHandle as useImperativeHandle3, useRef as useRef3 } from "react";

// src/ui/read-only/extensions.tsx
import StarterKit2 from "@tiptap/starter-kit";
import TiptapLink2 from "@tiptap/extension-link";
import TiptapUnderline2 from "@tiptap/extension-underline";
import TextStyle2 from "@tiptap/extension-text-style";
import { Color as Color2 } from "@tiptap/extension-color";
import TaskItem2 from "@tiptap/extension-task-item";
import TaskList2 from "@tiptap/extension-task-list";
import { Markdown as Markdown2 } from "tiptap-markdown";
import { TableRow as TableRow2 } from "@tiptap/extension-table-row";

// src/ui/extensions/image/read-only-image.tsx
import Image3 from "@tiptap/extension-image";
var ReadOnlyImageExtension = Image3.extend({
  addAttributes() {
    var _a;
    return __spreadProps(__spreadValues({}, (_a = this.parent) == null ? void 0 : _a.call(this)), {
      width: {
        default: "35%"
      },
      height: {
        default: null
      }
    });
  }
});
var read_only_image_default = ReadOnlyImageExtension;

// src/ui/read-only/extensions.tsx
var CoreReadOnlyEditorExtensions = [
  StarterKit2.configure({
    bulletList: {
      HTMLAttributes: {
        class: "list-disc list-outside leading-3 -mt-2"
      }
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal list-outside leading-3 -mt-2"
      }
    },
    listItem: {
      HTMLAttributes: {
        class: "leading-normal -mb-2"
      }
    },
    blockquote: {
      HTMLAttributes: {
        class: "border-l-4 border-custom-border-300"
      }
    },
    code: {
      HTMLAttributes: {
        class: "rounded-md bg-custom-primary-30 mx-1 px-1 py-1 font-mono font-medium text-custom-text-1000",
        spellcheck: "false"
      }
    },
    codeBlock: false,
    horizontalRule: false,
    dropcursor: {
      color: "rgba(var(--color-text-100))",
      width: 2
    },
    gapcursor: false
  }),
  Gapcursor,
  TiptapLink2.configure({
    protocols: ["http", "https"],
    validate: (url) => isValidHttpUrl(url),
    HTMLAttributes: {
      class: "text-custom-primary-300 underline underline-offset-[3px] hover:text-custom-primary-500 transition-colors cursor-pointer"
    }
  }),
  read_only_image_default.configure({
    HTMLAttributes: {
      class: "rounded-lg border border-custom-border-300"
    }
  }),
  TiptapUnderline2,
  TextStyle2,
  Color2,
  TaskList2.configure({
    HTMLAttributes: {
      class: "not-prose pl-2"
    }
  }),
  TaskItem2.configure({
    HTMLAttributes: {
      class: "flex items-start my-4"
    },
    nested: true
  }),
  Markdown2.configure({
    html: true,
    transformCopiedText: true
  }),
  Table,
  TableHeader,
  CustomTableCell,
  TableRow2
];

// src/ui/read-only/props.tsx
var CoreReadOnlyEditorProps = {
  attributes: {
    class: `prose prose-brand max-w-full prose-headings:font-display font-default focus:outline-none`
  }
};

// src/ui/hooks/useReadOnlyEditor.tsx
var useReadOnlyEditor = ({ value, forwardedRef }) => {
  const editor = useCustomEditor2({
    editable: false,
    content: typeof value === "string" && value.trim() !== "" ? value : "<p></p>",
    editorProps: CoreReadOnlyEditorProps,
    extensions: CoreReadOnlyEditorExtensions
  });
  const editorRef = useRef3(null);
  editorRef.current = editor;
  useImperativeHandle3(forwardedRef, () => ({
    clearEditor: () => {
      var _a;
      (_a = editorRef.current) == null ? void 0 : _a.commands.clearContent();
    },
    setEditorValue: (content) => {
      var _a;
      (_a = editorRef.current) == null ? void 0 : _a.commands.setContent(content);
    }
  }));
  if (!editor) {
    return null;
  }
  return editor;
};

// src/ui/menus/menu-items/index.tsx
import { BoldIcon, QuoteIcon, ImageIcon, TableIcon, ListIcon, ListOrderedIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CodeIcon } from "lucide-react";

// src/lib/editor-commands.ts
var toggleBold = (editor, range) => {
  if (range)
    editor.chain().focus().deleteRange(range).toggleBold().run();
  else
    editor.chain().focus().toggleBold().run();
};
var toggleItalic = (editor, range) => {
  if (range)
    editor.chain().focus().deleteRange(range).toggleItalic().run();
  else
    editor.chain().focus().toggleItalic().run();
};
var toggleUnderline = (editor, range) => {
  if (range)
    editor.chain().focus().deleteRange(range).toggleUnderline().run();
  else
    editor.chain().focus().toggleUnderline().run();
};
var toggleCode = (editor, range) => {
  if (range)
    editor.chain().focus().deleteRange(range).toggleCode().run();
  else
    editor.chain().focus().toggleCode().run();
};
var toggleOrderedList = (editor, range) => {
  if (range)
    editor.chain().focus().deleteRange(range).toggleOrderedList().run();
  else
    editor.chain().focus().toggleOrderedList().run();
};
var toggleBulletList = (editor, range) => {
  if (range)
    editor.chain().focus().deleteRange(range).toggleBulletList().run();
  else
    editor.chain().focus().toggleBulletList().run();
};
var toggleStrike = (editor, range) => {
  if (range)
    editor.chain().focus().deleteRange(range).toggleStrike().run();
  else
    editor.chain().focus().toggleStrike().run();
};
var toggleBlockquote = (editor, range) => {
  if (range)
    editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").toggleBlockquote().run();
  else
    editor.chain().focus().toggleNode("paragraph", "paragraph").toggleBlockquote().run();
};
var insertTableCommand = (editor, range) => {
  if (range)
    editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  else
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
};
var insertImageCommand = (editor, uploadFile, setIsSubmitting, range) => {
  if (range)
    editor.chain().focus().deleteRange(range).run();
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => __async(void 0, null, function* () {
    var _a;
    if ((_a = input.files) == null ? void 0 : _a.length) {
      const file = input.files[0];
      const pos = editor.view.state.selection.from;
      startImageUpload(file, editor.view, pos, uploadFile, setIsSubmitting);
    }
  });
  input.click();
};

// src/ui/menus/menu-items/index.tsx
var BoldItem = (editor) => ({
  name: "bold",
  isActive: () => editor == null ? void 0 : editor.isActive("bold"),
  command: () => toggleBold(editor),
  icon: BoldIcon
});
var ItalicItem = (editor) => ({
  name: "italic",
  isActive: () => editor == null ? void 0 : editor.isActive("italic"),
  command: () => toggleItalic(editor),
  icon: ItalicIcon
});
var UnderLineItem = (editor) => ({
  name: "underline",
  isActive: () => editor == null ? void 0 : editor.isActive("underline"),
  command: () => toggleUnderline(editor),
  icon: UnderlineIcon
});
var StrikeThroughItem = (editor) => ({
  name: "strike",
  isActive: () => editor == null ? void 0 : editor.isActive("strike"),
  command: () => toggleStrike(editor),
  icon: StrikethroughIcon
});
var CodeItem = (editor) => ({
  name: "code",
  isActive: () => editor == null ? void 0 : editor.isActive("code"),
  command: () => toggleCode(editor),
  icon: CodeIcon
});
var BulletListItem = (editor) => ({
  name: "bullet-list",
  isActive: () => editor == null ? void 0 : editor.isActive("bulletList"),
  command: () => toggleBulletList(editor),
  icon: ListIcon
});
var NumberedListItem = (editor) => ({
  name: "ordered-list",
  isActive: () => editor == null ? void 0 : editor.isActive("orderedList"),
  command: () => toggleOrderedList(editor),
  icon: ListOrderedIcon
});
var QuoteItem = (editor) => ({
  name: "quote",
  isActive: () => editor == null ? void 0 : editor.isActive("quote"),
  command: () => toggleBlockquote(editor),
  icon: QuoteIcon
});
var TableItem = (editor) => ({
  name: "quote",
  isActive: () => editor == null ? void 0 : editor.isActive("table"),
  command: () => insertTableCommand(editor),
  icon: TableIcon
});
var ImageItem = (editor, uploadFile, setIsSubmitting) => ({
  name: "image",
  isActive: () => editor == null ? void 0 : editor.isActive("image"),
  command: () => insertImageCommand(editor, uploadFile, setIsSubmitting),
  icon: ImageIcon
});
export {
  BoldItem,
  BulletListItem,
  CodeItem,
  EditorContainer,
  EditorContentWrapper,
  ImageItem,
  ItalicItem,
  NumberedListItem,
  QuoteItem,
  StrikeThroughItem,
  TableItem,
  UnderLineItem,
  cn,
  getEditorClassNames,
  insertImageCommand,
  insertTableCommand,
  startImageUpload,
  toggleBlockquote,
  toggleBold,
  toggleBulletList,
  toggleCode,
  toggleItalic,
  toggleOrderedList,
  toggleStrike,
  toggleUnderline,
  useEditor,
  useReadOnlyEditor
};
/*! Bundled license information:

@daybrush/utils/dist/utils.esm.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** *)

@egjs/children-differ/dist/children-differ.esm.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0
  
  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.
  
  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** *)

@scena/event-emitter/dist/event-emitter.esm.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** *)

@scena/dragscroll/dist/dragscroll.esm.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** *)

overlap-area/dist/overlap-area.esm.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** *)

gesto/dist/gesto.esm.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** *)
*/
