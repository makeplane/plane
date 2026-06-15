// GENERATED from dc-runtime/src/*.ts — do not edit. Rebuild with `cd dc-runtime && bun run build`.
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/react.ts
  function getReact() {
    const R = window.React;
    if (!R) throw new Error("dc-runtime: window.React is not available yet");
    return R;
  }
  function getReactDOM() {
    const RD = window.ReactDOM;
    if (!RD) throw new Error("dc-runtime: window.ReactDOM is not available yet");
    return RD;
  }
  var h = ((...args) => getReact().createElement(
    ...args
  ));

  // src/parse.ts
  function parseDcDocument(doc) {
    const dc = doc.querySelector("x-dc");
    if (!dc) return null;
    const scriptEl = doc.querySelector("script[data-dc-script]");
    const { props, preview } = parseDataProps(
      scriptEl?.getAttribute("data-props") ?? null
    );
    return {
      template: dc.innerHTML,
      js: scriptEl ? scriptEl.textContent || "" : "",
      props,
      preview
    };
  }
  function parseDcText(src) {
    const openMatch = /<x-dc(?:\s[^>]*)?>/.exec(src);
    if (!openMatch) return null;
    const close = src.lastIndexOf("</x-dc>");
    if (close === -1 || close < openMatch.index) return null;
    const template = src.slice(openMatch.index + openMatch[0].length, close);
    const doc = new DOMParser().parseFromString(src, "text/html");
    const scriptEl = doc.querySelector("script[data-dc-script]");
    const { props, preview } = parseDataProps(
      scriptEl?.getAttribute("data-props") ?? null
    );
    return {
      template,
      js: scriptEl ? scriptEl.textContent || "" : "",
      props,
      preview
    };
  }
  function parseDataProps(raw) {
    if (!raw) return { props: null, preview: null };
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { props: null, preview: null };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { props: null, preview: null };
    }
    const obj = parsed;
    const preview = obj.$preview && typeof obj.$preview === "object" ? obj.$preview : null;
    const rest = {};
    for (const k of Object.keys(obj)) {
      if (k[0] !== "$") rest[k] = obj[k];
    }
    return { props: Object.keys(rest).length ? rest : null, preview };
  }
  function dcNameFromPath(pathname) {
    let p = pathname || "";
    try {
      p = decodeURIComponent(p);
    } catch {
    }
    const base = p.split("/").pop() || "Root";
    return base.replace(/\.dc\.html$/, "").replace(/\.html?$/, "") || "Root";
  }

  // src/boot.ts
  var BASE_CSS = `
    .sc-placeholder{background:rgba(255,255,255,.3);border:1px solid rgba(0,0,0,.5);
      border-radius:2px;box-sizing:border-box;overflow:hidden}
    @keyframes sc-shine{0%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes sc-veil-pulse{0%,100%{opacity:.4}50%{opacity:1}}
    html.sc-dc-streaming .sc-placeholder,
    html.sc-dc-streaming .sc-interp.sc-missing{position:relative;
      background:color-mix(in srgb,currentColor 5%,transparent);
      border-color:transparent}
    html.sc-dc-streaming .sc-placeholder::before,
    html.sc-dc-streaming .sc-interp.sc-missing::before{content:'';
      position:absolute;inset:0;pointer-events:none;
      background:linear-gradient(90deg,rgba(217,119,87,0) 25%,rgba(247,225,211,.95) 37%,rgba(217,119,87,0) 63%);
      background-size:400% 100%;animation:sc-shine .73s ease infinite}
    html.sc-dc-streaming::after{content:'';position:fixed;inset:0;
      z-index:2147483646;pointer-events:none;
      box-shadow:inset 0 0 90px rgba(217,119,87,.16),inset 0 0 22px rgba(217,119,87,.1);
      animation:sc-veil-pulse 1.36s ease-in-out infinite}
    .sc-placeholder-error{padding:4px 8px;font:11px/1.4 ui-monospace,monospace;
      color:rgba(0,0,0,.7);word-break:break-word}
    .sc-interp.sc-missing{display:inline-block;width:2em;height:1em;overflow:hidden;
      vertical-align:text-bottom;background:rgba(255,255,255,.3);border:1px solid rgba(0,0,0,.5);
      border-radius:2px;box-sizing:border-box;color:transparent;
      user-select:none}
    .sc-interp.sc-unresolved{font-family:ui-monospace,monospace;font-size:.85em;
      color:rgba(0,0,0,.5);background:rgba(0,0,0,.05);border-radius:3px;
      padding:0 3px}
    .sc-host.sc-has-error{position:relative}
    .sc-logic-error{position:absolute;top:8px;left:8px;z-index:2147483647;max-width:60ch;
      padding:6px 10px;background:#b00020;color:#fff;font:12px/1.4 ui-monospace,monospace;
      border-radius:4px;white-space:pre-wrap;pointer-events:none}
    /* Mirrors PRINT_BASELINE_CSS in apps/web deck-stage-export.ts \u2014 keep both
       in sync until dc-runtime regains a build step. */
    @media print {
      @page { margin: 0.5cm; }
      html, body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      section, article, figure, table { break-inside: avoid; }
      *, *::before, *::after {
        animation-delay: -99s !important; animation-duration: .001s !important;
        animation-iteration-count: 1 !important; animation-fill-mode: both !important;
        animation-play-state: running !important; transition-duration: 0s !important;
      }
    }
  `;
  var FULL_PAGE_CSS = "html,body{height:100%;margin:0}#dc-root,#dc-root>.sc-host{height:100%}";
  function rootNameForDocument(doc, loc) {
    let bootPath = loc.pathname || "";
    if (!/\.dc\.html?$/i.test(safeDecode(bootPath))) {
      try {
        bootPath = new URL(doc.baseURI || "/").pathname;
      } catch {
      }
    }
    return dcNameFromPath(bootPath);
  }
  function safeDecode(s) {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  }
  function boot(runtime, doc = document) {
    const parsed = parseDcDocument(doc);
    if (!parsed) return null;
    const React = getReact();
    const rootName = rootNameForDocument(doc, location);
    runtime.markFetched(rootName);
    runtime.adoptParsed(rootName, parsed);
    fetch(location.href).then((res) => res.ok ? res.text() : "").then((t) => {
      const raw = t ? parseDcText(t) : null;
      if (raw?.template) runtime.updateHtml(rootName, raw.template);
    }).catch(() => {
    });
    const dc = doc.querySelector("x-dc");
    const hostEl = doc.createElement("div");
    hostEl.id = "dc-root";
    dc.replaceWith(hostEl);
    if (!parsed.preview) {
      const s = doc.createElement("style");
      s.textContent = FULL_PAGE_CSS;
      doc.head.appendChild(s);
    }
    const Root = runtime.getDC(rootName);
    const entry = runtime.registry.get(rootName);
    function StandaloneRoot() {
      const [, setTick] = React.useState(0);
      React.useEffect(() => {
        const sub = () => setTick((n) => n + 1);
        entry.subs.add(sub);
        return () => {
          entry.subs.delete(sub);
        };
      }, []);
      return h(Root, entry.propOverrides || null);
    }
    const ReactDOM = getReactDOM();
    if (ReactDOM.createRoot)
      ReactDOM.createRoot(hostEl).render(h(StandaloneRoot));
    else ReactDOM.render(h(StandaloneRoot), hostEl);
    return rootName;
  }

  // src/expr.ts
  var IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*/;
  var NUMBER_RE = /^-?\d+(\.\d+)?$/;
  function resolve(vals, src) {
    const expr = String(src).trim();
    if (!expr) return void 0;
    if (expr[0] === "(" && expr[expr.length - 1] === ")" && parensWrapWhole(expr)) {
      return resolve(vals, expr.slice(1, -1));
    }
    const eq = findTopLevelEquality(expr);
    if (eq) {
      const lv = resolve(vals, expr.slice(0, eq.index));
      const rv = resolve(vals, expr.slice(eq.index + eq.op.length));
      switch (eq.op) {
        case "===":
          return lv === rv;
        case "!==":
          return lv !== rv;
        case "==":
          return lv == rv;
        default:
          return lv != rv;
      }
    }
    if (expr[0] === "!") return !resolve(vals, expr.slice(1));
    if (expr === "true") return true;
    if (expr === "false") return false;
    if (expr === "null") return null;
    if (expr === "undefined") return void 0;
    if (NUMBER_RE.test(expr)) return Number(expr);
    if (expr.length >= 2 && (expr[0] === '"' || expr[0] === "'") && expr[expr.length - 1] === expr[0]) {
      return expr.slice(1, -1);
    }
    return resolvePath(vals, expr);
  }
  function parensWrapWhole(expr) {
    let depth = 0;
    for (let i = 0; i < expr.length - 1; i++) {
      if (expr[i] === "(") depth++;
      else if (expr[i] === ")") {
        depth--;
        if (depth === 0) return false;
      }
    }
    return true;
  }
  function findTopLevelEquality(expr) {
    let depth = 0;
    for (let i = 0; i < expr.length; i++) {
      const c = expr[i];
      if (c === "[" || c === "(") depth++;
      else if (c === "]" || c === ")") depth--;
      else if (depth === 0 && (c === "=" || c === "!") && expr[i + 1] === "=") {
        if (i > 0 && (expr[i - 1] === "=" || expr[i - 1] === "!")) continue;
        if (!expr.slice(0, i).trim()) continue;
        const op = expr[i + 2] === "=" ? c + "==" : c + "=";
        return { index: i, op };
      }
    }
    return null;
  }
  function resolvePath(vals, expr) {
    const head = expr.match(IDENT_RE);
    if (!head) return void 0;
    let cur = vals == null ? void 0 : vals[head[0]];
    let i = head[0].length;
    while (i < expr.length) {
      if (expr[i] === ".") {
        const m = expr.slice(i + 1).match(IDENT_RE) || expr.slice(i + 1).match(/^\d+/);
        if (!m) return void 0;
        cur = cur == null ? void 0 : cur[m[0]];
        i += 1 + m[0].length;
      } else if (expr[i] === "[") {
        let depth = 1;
        let j = i + 1;
        while (j < expr.length && depth > 0) {
          if (expr[j] === "[") depth++;
          else if (expr[j] === "]") {
            depth--;
            if (depth === 0) break;
          }
          j++;
        }
        if (depth !== 0) return void 0;
        const key = resolve(vals, expr.slice(i + 1, j));
        cur = cur == null ? void 0 : cur[key];
        i = j + 1;
      } else {
        return void 0;
      }
    }
    return cur;
  }

  // src/encode.ts
  var CAMEL_ATTR = "sc-camel-";
  var RAW_WRAP = {
    select: "sc-raw-select",
    table: "sc-raw-table",
    tbody: "sc-raw-tbody",
    thead: "sc-raw-thead",
    tfoot: "sc-raw-tfoot",
    tr: "sc-raw-tr",
    td: "sc-raw-td",
    th: "sc-raw-th",
    caption: "sc-raw-caption"
  };
  var RAW_UNWRAP = Object.fromEntries(
    Object.entries(RAW_WRAP).map(([k, v]) => [v, k])
  );
  var EVENT_MAP = {
    onclick: "onClick",
    onchange: "onChange",
    oninput: "onInput",
    onsubmit: "onSubmit",
    onkeydown: "onKeyDown",
    onkeyup: "onKeyUp",
    onkeypress: "onKeyPress",
    onmousedown: "onMouseDown",
    onmouseup: "onMouseUp",
    onmouseenter: "onMouseEnter",
    onmouseleave: "onMouseLeave",
    onfocus: "onFocus",
    onblur: "onBlur",
    ondoubleclick: "onDoubleClick",
    oncontextmenu: "onContextMenu"
  };
  var ATTRS = `(?:[^>"']|"[^"]*"|'[^']*')*`;
  var IMPORT_SELF_CLOSE_RE = new RegExp(
    "<(x-import|dc-import)(" + ATTRS + ")/>",
    "gi"
  );
  var CAMEL_ATTR_RE = /(\s)([a-z]+[A-Z][A-Za-z0-9]*)(\s*=)/g;
  function encodeCase(html) {
    html = html.replace(
      IMPORT_SELF_CLOSE_RE,
      (_, t, a) => "<" + t + a + "></" + t + ">"
    );
    html = html.replace(/<helmet(\s|>)/gi, "<sc-helmet$1");
    html = html.replace(/<\/helmet\s*>/gi, "</sc-helmet>");
    html = html.replace(
      CAMEL_ATTR_RE,
      (_, sp, name, eq) => sp + CAMEL_ATTR + name.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()) + eq
    );
    for (const [real, alias] of Object.entries(RAW_WRAP)) {
      html = html.replace(
        new RegExp("(</?)" + real + "(?=[\\s>])", "gi"),
        "$1" + alias
      );
    }
    return html;
  }
  function kebabToCamel(s) {
    return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }
  function cssToObj(css) {
    const o = {};
    for (const decl of css.split(";")) {
      const i = decl.indexOf(":");
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim();
      o[prop.startsWith("--") ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim();
    }
    return o;
  }
  function compileAttr(raw) {
    const whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
    if (whole) {
      const path = whole[1];
      return (vals) => resolve(vals, path);
    }
    if (raw.includes("{{")) {
      const parts = raw.split(/\{\{([\s\S]+?)\}\}/g);
      return (vals) => parts.map((s, i) => i & 1 ? resolve(vals, s) ?? "" : s).join("");
    }
    return () => raw;
  }

  // src/compile.ts
  function collectProps(node, isComponent, host) {
    const propGetters = [];
    const pseudoClasses = [];
    let hintSize = null;
    for (const { name, value } of [...node.attributes]) {
      if (name === "sc-name" || name === "data-dc-tpl") continue;
      let key = name;
      if (key.startsWith(CAMEL_ATTR))
        key = kebabToCamel(key.slice(CAMEL_ATTR.length));
      if (key === "hint-size") {
        hintSize = value;
        continue;
      }
      if (key.startsWith("style-")) {
        pseudoClasses.push(host.pseudoClass(key.slice(6), value));
        continue;
      }
      if (isComponent) {
        if (key.includes("-")) key = kebabToCamel(key);
      } else {
        if (key === "class") key = "className";
        else if (key === "for") key = "htmlFor";
        else if (key.startsWith("on"))
          key = EVENT_MAP[key] || "on" + key[2].toUpperCase() + key.slice(3);
      }
      propGetters.push([key, compileAttr(value)]);
    }
    return { propGetters, pseudoClasses, hintSize };
  }
  var HOST_STYLE_PROPS = /* @__PURE__ */ new Set([
    "position",
    "left",
    "right",
    "top",
    "bottom",
    "inset",
    "width",
    "height",
    "z-index",
    "transform"
  ]);
  function hostPositionStyle(style) {
    const all = typeof style === "string" ? cssToObj(style) : style != null && typeof style === "object" ? style : null;
    if (!all) return void 0;
    const out = {};
    for (const [k, v] of Object.entries(all)) {
      const kebab = k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
      if (HOST_STYLE_PROPS.has(kebab)) out[k] = v;
    }
    return Object.keys(out).length ? out : void 0;
  }
  function compileTemplate(html, host) {
    const tpl = document.createElement("template");
    //! nosemgrep: direct-inner-html-assignment
    tpl.innerHTML = encodeCase(html);
    let tplN = 0;
    (function stamp(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.setAttribute("data-dc-tpl", String(tplN++));
      }
      for (const c of node.childNodes) stamp(c);
    })(tpl.content);
    const builders = walkChildren(tpl.content, host);
    const render = ((vals, ctx) => builders.map((b, i) => b(vals || {}, ctx, i)));
    render.__annotated = tpl.innerHTML;
    return render;
  }
  function walkChildren(node, host) {
    return [...node.childNodes].map((c) => walk(c, host)).filter((b) => b != null);
  }
  function walk(node, host) {
    if (node.nodeType === Node.TEXT_NODE) return walkText(node);
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node;
    const tag = el.tagName.toLowerCase();
    if (tag === "sc-for") return walkFor(el, host);
    if (tag === "sc-if") return walkIf(el, host);
    if (tag === "x-import") return walkXImport(el, host);
    if (tag === "sc-helmet") return host.helmet(el);
    if (tag === "dc-import") return walkComponent(el, host);
    return walkElement(el, host);
  }
  var warnedHoles = /* @__PURE__ */ new Set();
  function warnUnresolved(ctx, what) {
    const key = (ctx?.__name || "?") + "\0" + what;
    if (warnedHoles.has(key)) return;
    warnedHoles.add(key);
    console.warn("[dc-runtime] " + (ctx?.__name || "template") + ": " + what);
  }
  function walkText(node) {
    const txt = node.nodeValue ?? "";
    if (!txt.includes("{{")) {
      if (!txt.trim() && !txt.includes(" ")) return null;
      return () => txt;
    }
    const parts = txt.split(/\{\{([\s\S]+?)\}\}/g);
    return (vals, ctx, key) => h(
      getReact().Fragment,
      { key },
      ...parts.map((p, i) => {
        if (!(i & 1)) return p;
        const v = resolve(vals, p);
        if (v === void 0) {
          if (!ctx?.__streamingNow) {
            if (document.body?.hasAttribute("data-dc-editor-on")) {
              return h(
                "span",
                { key: i, className: "sc-interp sc-unresolved" },
                "{{ " + p.trim() + " }}"
              );
            }
            warnUnresolved(
              ctx,
              "{{ " + p.trim() + " }} never resolved \u2014 rendered as empty"
            );
            return null;
          }
          return h(
            "span",
            { key: i, className: "sc-interp sc-missing" },
            p.trim()
          );
        }
        if (getReact().isValidElement(v) || Array.isArray(v)) {
          return h(getReact().Fragment, { key: i }, v);
        }
        if (v === null || typeof v === "boolean") return null;
        return h("span", { key: i, className: "sc-interp" }, String(v));
      })
    );
  }
  function walkFor(el, host) {
    const listGet = compileAttr(el.getAttribute("list") || "");
    const asName = el.getAttribute("as") || "item";
    const hintN = parseInt(el.getAttribute("hint-placeholder-count") || "0", 10);
    const kids = walkChildren(el, host);
    const listSrc = el.getAttribute("list") || "";
    return (vals, ctx, key) => {
      let list = listGet(vals);
      if (!Array.isArray(list)) {
        if (!ctx?.__streamingNow) {
          if (list !== void 0 && list !== null) {
            warnUnresolved(
              ctx,
              'sc-for list="' + listSrc + '" is not an array (' + typeof list + ")"
            );
          }
          list = [];
        } else {
          list = hintN > 0 ? Array(hintN).fill(void 0) : [];
        }
      }
      return h(
        getReact().Fragment,
        { key },
        list.map((item, i) => {
          const sub = { ...vals, [asName]: item, $index: i };
          return h(
            getReact().Fragment,
            { key: i },
            kids.map((b, j) => b(sub, ctx, j))
          );
        })
      );
    };
  }
  function walkIf(el, host) {
    const valGet = compileAttr(el.getAttribute("value") || "");
    const hintRaw = el.getAttribute("hint-placeholder-val");
    const hintGet = hintRaw != null ? compileAttr(hintRaw) : null;
    const kids = walkChildren(el, host);
    return (vals, ctx, key) => {
      let v = valGet(vals);
      if (v === void 0 && hintGet && ctx?.__streamingNow) v = hintGet(vals);
      return v ? h(
        getReact().Fragment,
        { key },
        kids.map((b, j) => b(vals, ctx, j))
      ) : null;
    };
  }
  function walkComponent(el, host) {
    const name = el.getAttribute("name") || el.getAttribute("component") || "";
    el.removeAttribute("name");
    el.removeAttribute("component");
    const tplId = el.getAttribute("data-dc-tpl");
    const styleRaw = el.getAttribute("style");
    el.removeAttribute("style");
    const styleGet = styleRaw != null ? compileAttr(styleRaw) : null;
    const { propGetters, hintSize } = collectProps(el, true, host);
    const kids = walkChildren(el, host);
    return (vals, ctx, key) => {
      const props = {
        key,
        __hintSize: hintSize,
        __tplId: tplId,
        __hostStyle: styleGet ? hostPositionStyle(styleGet(vals)) : void 0
      };
      for (const [k, g] of propGetters) props[k] = g(vals);
      if (kids.length) props.children = kids.map((b, j) => b(vals, ctx, j));
      return h(host.component(name), props);
    };
  }
  function walkXImport(el, host) {
    const globalNameGet = compileAttr(
      el.getAttribute("component-from-global-scope") || ""
    );
    const exportNameGet = compileAttr(
      el.getAttribute("component") || el.getAttribute("name") || ""
    );
    const url = el.getAttribute("from") || el.getAttribute("src") || el.getAttribute("import") || "";
    const kind = /\.(jsx|tsx)(\?|#|$)/i.test(url) ? "jsx" : "js";
    const tplId = el.getAttribute("data-dc-tpl");
    const styleRaw = el.getAttribute("style");
    el.removeAttribute("style");
    const styleGet = styleRaw != null ? compileAttr(styleRaw) : null;
    const wrap = tplId != null || styleGet != null;
    const { propGetters, hintSize } = collectProps(el, true, host);
    const hasContent = el.children.length > 0 || !!(el.textContent || "").trim();
    const kids = hasContent ? walkChildren(el, host) : [];
    const urlBindable = url.includes("{{");
    if (url && !urlBindable) host.loadExternal(kind, url);
    const evalName = (g, vals) => {
      const v = g(vals);
      const s = v == null ? "" : String(v);
      return s.includes("{{") ? "" : s;
    };
    return (vals, ctx, key) => {
      const globalName = evalName(globalNameGet, vals);
      const name = globalName || evalName(exportNameGet, vals);
      const C = !name || urlBindable ? null : globalName ? host.resolveExternalGlobal(url, globalName) : host.resolveExternal(url, name);
      const hostStyle = styleGet ? hostPositionStyle(styleGet(vals)) : void 0;
      const wrapper = wrap ? {
        key,
        className: "sc-host-x",
        "data-dc-tpl": tplId,
        style: hostStyle || { display: "contents" }
      } : null;
      if (!C) {
        const error = urlBindable ? "x-import `from` cannot contain {{ \u2026 }} \u2014 module URLs are resolved at parse time; use a literal URL" : host.resolveExternalError(url, name);
        const ph = host.placeholder({
          key: wrapper ? void 0 : key,
          name,
          hintSize,
          error
        });
        return wrapper ? h("div", wrapper, ph) : ph;
      }
      const props = wrapper ? {} : { key };
      for (const [k, g] of propGetters) {
        if (k === "component" || k === "componentFromGlobalScope" || k === "name" || k === "from" || k === "src" || k === "import") {
          continue;
        }
        props[k] = g(vals);
      }
      if (kids.length) props.children = kids.map((b, j) => b(vals, ctx, j));
      return wrapper ? h("div", wrapper, h(C, props)) : h(C, props);
    };
  }
  function walkElement(el, host) {
    const realTag = RAW_UNWRAP[el.localName] || el.localName;
    const tplId = el.getAttribute("data-dc-tpl");
    const { propGetters, pseudoClasses } = collectProps(el, false, host);
    const kids = walkChildren(el, host);
    return (vals, ctx, key) => {
      const props = { key, "data-dc-tpl": tplId };
      for (const [k, g] of propGetters) {
        let v = g(vals);
        if (k === "style" && typeof v === "string") v = cssToObj(v);
        if ((k === "value" || k === "checked") && v === void 0) {
          v = k === "checked" ? false : "";
        }
        props[k] = v;
      }
      if (pseudoClasses.length) {
        props.className = [props.className, ...pseudoClasses].filter(Boolean).join(" ");
      }
      return h(realTag, props, ...kids.map((b, j) => b(vals, ctx, j)));
    };
  }

  // src/logic.ts
  var StreamableLogic = class {
    constructor(props) {
      __publicField(this, "props");
      __publicField(this, "state", {});
      /** Back-pointer to the wrapper component, installed after construction. */
      __publicField(this, "__host");
      this.props = props || {};
    }
    setState(update, cb) {
      this.__host && this.__host.__setLogicState(update, cb);
    }
    forceUpdate() {
      this.__host && this.__host.forceUpdate();
    }
    componentDidMount() {
    }
    componentDidUpdate(_prevProps) {
    }
    componentWillUnmount() {
    }
    /** The flat object the template renders against (merged over props). */
    renderVals() {
      return {};
    }
  };
  function evalDcLogic(src) {
    //! nosemgrep: eval-and-function-constructor
    const fn = new Function(
      "DCLogic",
      "StreamableLogic",
      "React",
      src + '\n;return (typeof Component!=="undefined"&&Component)||undefined;'
    );
    return fn(StreamableLogic, StreamableLogic, getReact());
  }

  // src/component.ts
  function Placeholder({
    name,
    hintSize,
    streaming,
    error
  }) {
    const [w, hgt] = (hintSize || "100%,60px").split(",");
    return h(
      "div",
      {
        className: "sc-placeholder" + (streaming ? " sc-streaming" : ""),
        style: { width: w.trim(), height: hgt && hgt.trim() },
        title: name
      },
      error ? h(
        "div",
        { className: "sc-placeholder-error" },
        (name ? name + ": " : "") + error
      ) : null
    );
  }
  function hintToMin(hint) {
    if (!hint) return void 0;
    const [w, hgt] = hint.split(",");
    return { minWidth: w.trim(), minHeight: hgt && hgt.trim() };
  }
  function createComponentFactory(registry, ensureFetched) {
    const React = getReact();
    const AncestorContext = React.createContext([]);
    class StreamableComponent extends React.Component {
      constructor(props) {
        super(props);
        __publicField(this, "__name");
        __publicField(this, "__sub");
        __publicField(this, "__needsDidMount", false);
        /** Snapshot of the registry's streaming flags taken at render time —
         *  builders read it off the RenderCtx (this) to pick placeholder vs
         *  render-nothing for unresolved values. */
        __publicField(this, "__streamingNow", false);
        __publicField(this, "logic");
        this.__name = props.__name;
        this.state = { __v: 0, __err: null };
        this.__sub = () => {
          this.__reconcileLogic();
          if (this.state.__err) this.setState({ __err: null });
          this.forceUpdate();
        };
        this.__makeLogic(registry.get(this.__name).Logic, null);
        ensureFetched(this.__name);
      }
      /** Error-boundary hook: a render crash anywhere in this DC's subtree
       *  (its own template, an x-import'd component, a child DC without its
       *  own deeper boundary) lands here instead of unmounting the page. */
      static getDerivedStateFromError(e) {
        return { __err: e instanceof Error && e.message ? e.message : String(e) };
      }
      componentDidCatch(e, info) {
        console.error(
          "[dc-runtime] render error in <" + this.__name + ">:",
          e,
          info?.componentStack || ""
        );
      }
      /** Instantiate the logic class (or the no-op base) and adopt `prevState`
       *  over its initial state — used both at mount and on hot-swap. */
      __makeLogic(Logic, prevState) {
        const L = Logic || StreamableLogic;
        try {
          this.logic = new L(this.__userProps());
        } catch (e) {
          console.error(e);
          registry.get(this.__name).logicError = this.__name + ": " + (e instanceof Error && e.message ? e.message : String(e));
          this.logic = new StreamableLogic(
            this.__userProps()
          );
        }
        this.logic.__host = this;
        if (prevState)
          this.logic.state = { ...this.logic.state || {}, ...prevState };
      }
      /** The props the author's logic + template see — internal __-prefixed
       *  wiring stripped. */
      __userProps() {
        const { __name, __hintSize, __tplId, __hostStyle, ...rest } = this.props;
        return rest;
      }
      __setLogicState(update, cb) {
        const prev = this.logic.state;
        const patch = typeof update === "function" ? update(prev) : update;
        this.logic.state = { ...prev, ...patch };
        this.setState((s) => ({ __v: s.__v + 1 }), cb);
      }
      /** Swap the logic instance when the registry's Logic class changed
       *  (streaming completion, hot reload). State carries over; didMount
       *  re-fires after the swap commits so refs exist. */
      __reconcileLogic() {
        const Next = registry.get(this.__name).Logic;
        const Cur = this.logic.constructor;
        if (Next === Cur || !Next && Cur === StreamableLogic)
          return;
        try {
          this.logic.componentWillUnmount();
        } catch (e) {
          console.error(e);
        }
        this.__makeLogic(Next, this.logic.state);
        this.__needsDidMount = true;
      }
      componentDidMount() {
        registry.get(this.__name).subs.add(this.__sub);
        try {
          this.logic.componentDidMount();
        } catch (e) {
          console.error(e);
        }
      }
      componentDidUpdate(prevProps) {
        this.logic.props = this.__userProps();
        if (this.__needsDidMount) {
          this.__needsDidMount = false;
          try {
            this.logic.componentDidMount();
          } catch (e) {
            console.error(e);
          }
        } else {
          try {
            this.logic.componentDidUpdate(prevProps);
          } catch (e) {
            console.error(e);
          }
        }
      }
      componentWillUnmount() {
        registry.get(this.__name).subs.delete(this.__sub);
        try {
          this.logic.componentWillUnmount();
        } catch (e) {
          console.error(e);
        }
      }
      render() {
        const r = registry.get(this.__name);
        const cls = "sc-host" + (r.htmlStreaming ? " sc-streaming-html" : "") + (r.jsStreaming ? " sc-streaming-js" : "");
        const hintStyle = r.htmlStreaming ? hintToMin(this.props.__hintSize) : void 0;
        const hostStyle = this.props.__hostStyle || hintStyle ? { ...hintStyle || {}, ...this.props.__hostStyle || {} } : void 0;
        const hostBase = {
          className: cls,
          style: hostStyle,
          "data-sc-name": this.__name,
          "data-dc-tpl": this.props.__tplId
        };
        const chain = Array.isArray(this.context) ? this.context : [];
        if (chain.includes(this.__name)) {
          const cycle = [
            ...chain.slice(chain.indexOf(this.__name)),
            this.__name
          ].join(" \u2192 ");
          return h(
            "div",
            { ...hostBase, className: cls + " sc-has-error" },
            h(Placeholder, {
              name: this.__name,
              hintSize: this.props.__hintSize,
              error: "circular import: " + cycle
            })
          );
        }
        if (this.state.__err) {
          return h(
            "div",
            { ...hostBase, className: cls + " sc-has-error" },
            h(
              "div",
              { className: "sc-logic-error" },
              this.__name + ": " + this.state.__err
            ),
            h(Placeholder, {
              name: this.__name,
              hintSize: this.props.__hintSize,
              error: this.state.__err
            })
          );
        }
        if (!r.tpl) {
          return h(
            "div",
            hostBase,
            h(Placeholder, { name: this.__name, hintSize: this.props.__hintSize })
          );
        }
        const userProps = this.__userProps();
        this.logic.props = userProps;
        let vals = userProps;
        let renderErr = r.logicError;
        try {
          vals = { ...userProps, ...this.logic.renderVals() || {} };
        } catch (e) {
          console.error(e);
          renderErr = this.__name + ".renderVals(): " + (e instanceof Error && e.message ? e.message : String(e));
        }
        this.__streamingNow = !!(r.htmlStreaming || r.jsStreaming);
        return h(
          "div",
          { ...hostBase, className: cls + (renderErr ? " sc-has-error" : "") },
          renderErr && h("div", { className: "sc-logic-error" }, renderErr),
          h(
            AncestorContext.Provider,
            { value: [...chain, this.__name] },
            r.tpl(vals, this)
          )
        );
      }
    }
    __publicField(StreamableComponent, "contextType", AncestorContext);
    const named = /* @__PURE__ */ new Map();
    function getDC(name) {
      const hit = named.get(name);
      if (hit) return hit;
      function Dispatcher(p) {
        const [, setTick] = React.useState(0);
        React.useEffect(() => {
          const sub = () => setTick((n) => n + 1);
          registry.get(name).subs.add(sub);
          return () => {
            registry.get(name).subs.delete(sub);
          };
        }, []);
        ensureFetched(name);
        return h(StreamableComponent, { ...p, __name: name });
      }
      Dispatcher.displayName = name;
      named.set(name, Dispatcher);
      return Dispatcher;
    }
    return {
      getDC,
      StreamableComponent
    };
  }

  // src/external.ts
  var isCustomElementName = (n) => !n.includes(".") && n.includes("-");
  function isRenderableType(g) {
    if (typeof g === "function") return !isElementClass(g);
    return typeof g === "object" && g !== null && typeof g.$$typeof === "symbol";
  }
  function resolveDottedPath(root, name) {
    let cur = root;
    for (const seg of name.split(".")) {
      if (cur == null) return void 0;
      cur = cur[seg];
    }
    return cur;
  }
  var BABEL_URL = "https://unpkg.com/@babel/standalone@7.26.4/babel.min.js";
  var GLOBAL_POLL_INTERVAL_MS = 50;
  var GLOBAL_POLL_TIMEOUT_MS = 3e4;
  function createExternalModules(onResolved) {
    const cache = /* @__PURE__ */ new Map();
    let babelLoading = null;
    const reportedMissing = /* @__PURE__ */ new Map();
    const polling = /* @__PURE__ */ new Set();
    function ensureBabel() {
      if (window.Babel) return Promise.resolve();
      if (babelLoading) return babelLoading;
      babelLoading = new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = BABEL_URL;
        s.crossOrigin = "anonymous";
        s.onload = () => res();
        s.onerror = rej;
        document.head.appendChild(s);
      });
      return babelLoading;
    }
    function load(kind, url) {
      if (cache.has(url)) return;
      cache.set(url, null);
      console.info("[dc-runtime] x-import: loading", url, "(" + kind + ")");
      const ready = kind === "jsx" ? ensureBabel() : Promise.resolve();
      ready.then(() => fetch(url)).then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      }).then((src) => {
        const code = kind === "jsx" ? window.Babel.transform(src, {
          filename: url,
          presets: ["react", "typescript"]
        }).code : src;
        const module = { exports: {} };
        const before = new Set(Object.keys(window));
        //! nosemgrep: eval-and-function-constructor
        new Function("React", "module", "exports", "require", code)(
          getReact(),
          module,
          module.exports,
          () => ({})
        );
        const globals = {};
        for (const k of Object.keys(window)) {
          if (!before.has(k) && typeof window[k] === "function") {
            globals[k] = window[k];
          }
        }
        cache.set(url, { mod: module.exports, globals });
        console.info(
          "[dc-runtime] x-import: loaded",
          url,
          "\u2014 exports:",
          Object.keys(module.exports),
          "window globals:",
          Object.keys(globals)
        );
        onResolved();
      }).catch((e) => {
        cache.set(url, {
          mod: {},
          globals: {},
          error: "failed to load: " + (e instanceof Error && e.message ? e.message : String(e))
        });
        console.error(
          "[dc-runtime] x-import: FAILED to load",
          url,
          "(" + kind + ")",
          e
        );
        onResolved();
      });
    }
    function resolve2(url, name) {
      const entry = cache.get(url);
      if (!entry) return null;
      const { mod, globals } = entry;
      const C = mod && mod[name] || globals && globals[name] || typeof window !== "undefined" && window[name] || mod && mod.default;
      if (typeof C === "function") return C;
      const key = url + "\0" + name;
      if (!reportedMissing.has(key)) {
        reportedMissing.set(
          key,
          entry.error || 'no export named "' + name + '" (has: ' + Object.keys(mod).join(", ") + ")"
        );
        console.error(
          "[dc-runtime] x-import: module",
          url,
          "loaded but has no component named",
          JSON.stringify(name),
          "\u2014 available exports:",
          Object.keys(mod),
          "window globals:",
          Object.keys(globals),
          ". The module must `module.exports = {" + name + "}` or set `window." + name + "`."
        );
      }
      return null;
    }
    function waitForGlobal(name) {
      if (polling.has(name)) return;
      polling.add(name);
      const started = Date.now();
      const isCE = isCustomElementName(name);
      const tick = () => {
        const found = isCE ? customElements.get(name) : isRenderableType(resolveDottedPath(window, name));
        if (found) {
          polling.delete(name);
          onResolved();
          return;
        }
        if (Date.now() - started >= GLOBAL_POLL_TIMEOUT_MS) {
          console.warn(
            "[dc-runtime] x-import: global",
            JSON.stringify(name),
            "never appeared on window after " + GLOBAL_POLL_TIMEOUT_MS + "ms"
          );
          return;
        }
        setTimeout(tick, GLOBAL_POLL_INTERVAL_MS);
      };
      setTimeout(tick, GLOBAL_POLL_INTERVAL_MS);
    }
    function resolveGlobal(url, name) {
      const isCE = isCustomElementName(name);
      if (!url) {
        if (isCE) {
          if (customElements.get(name)) return name;
          waitForGlobal(name);
          return null;
        }
        const g2 = resolveDottedPath(window, name);
        if (isRenderableType(g2)) return g2;
        waitForGlobal(name);
        return null;
      }
      const entry = cache.get(url);
      if (!entry) return null;
      if (isCE && customElements.get(name)) return name;
      const g = entry.globals[name] ?? resolveDottedPath(window, name);
      if (isRenderableType(g)) return g;
      if (name.includes(".")) return null;
      const key = url + "\0global\0" + name;
      if (!reportedMissing.has(key)) {
        reportedMissing.set(key, null);
        if (isCE && !customElements.get(name)) {
          console.warn(
            "[dc-runtime] x-import:",
            url,
            "loaded but no custom element",
            JSON.stringify(name),
            "is registered and window." + name + " is not a function \u2014 rendering <" + name + "> as an unknown element."
          );
        }
      }
      return name;
    }
    function getError(url, name) {
      const entry = cache.get(url);
      if (entry?.error) return entry.error;
      return reportedMissing.get(url + "\0" + name) || null;
    }
    return { load, resolve: resolve2, resolveGlobal, getError };
  }
  function isElementClass(g) {
    try {
      return typeof g === "function" && typeof HTMLElement !== "undefined" && g.prototype instanceof HTMLElement;
    } catch {
      return false;
    }
  }

  // src/helmet.ts
  function createHelmetManager(doc, isStreaming) {
    const mounted = /* @__PURE__ */ new Set();
    const live = /* @__PURE__ */ new Map();
    function compile(node) {
      const raw = [...node.children];
      const helmetClosed = node.nextSibling != null || node.parentNode?.nextSibling != null;
      return (_vals, ctx) => {
        const name = ctx && ctx.__name || "";
        const streaming = !!(name && isStreaming(name));
        for (let i = 0; i < raw.length; i++) {
          const child = raw[i];
          const tag = child.tagName;
          const mayBePartial = streaming && !helmetClosed && i === raw.length - 1;
          if (tag === "SCRIPT") {
            if (mayBePartial) continue;
            const key = "SCRIPT|" + (child.getAttribute("src") || child.textContent || "");
            if (mounted.has(key)) continue;
            mounted.add(key);
            const el = doc.createElement("script");
            for (const { name: an, value } of [...child.attributes])
              el.setAttribute(an, value);
            if (child.textContent) el.textContent = child.textContent;
            doc.head.appendChild(el);
          } else if (tag === "LINK" || tag === "META") {
            if (mayBePartial) continue;
            const key = tag + "|" + (child.getAttribute("href") || child.getAttribute("src") || child.outerHTML);
            if (mounted.has(key)) continue;
            mounted.add(key);
            doc.head.appendChild(child.cloneNode(true));
          } else {
            const key = name + "|" + i;
            let el = live.get(key);
            if (!el || el.tagName !== tag) {
              if (el) el.remove();
              el = doc.createElement(tag.toLowerCase());
              live.set(key, el);
              doc.head.appendChild(el);
            }
            for (const { name: an, value } of [...child.attributes]) {
              if (el.getAttribute(an) !== value) el.setAttribute(an, value);
            }
            if (el.textContent !== child.textContent)
              el.textContent = child.textContent;
          }
        }
        return null;
      };
    }
    return { compile };
  }

  // src/pseudo.ts
  function createPseudoSheet(doc) {
    let el = null;
    const cache = /* @__PURE__ */ new Map();
    let n = 0;
    return (pseudo, css) => {
      const k = pseudo + "|" + css;
      const hit = cache.get(k);
      if (hit) return hit;
      if (!el) {
        el = doc.createElement("style");
        doc.head.appendChild(el);
      }
      const cls = "scp" + (n++).toString(36);
      const sel = pseudo === "before" || pseudo === "after" ? "." + cls + "::" + pseudo : "." + cls + ":" + pseudo;
      el.sheet.insertRule(sel + "{" + css + "}", el.sheet.cssRules.length);
      cache.set(k, cls);
      return cls;
    };
  }

  // src/registry.ts
  function createRegistry() {
    const entries = /* @__PURE__ */ Object.create(null);
    function get(name) {
      return entries[name] || (entries[name] = {
        html: "",
        tpl: null,
        Logic: null,
        jsStreaming: false,
        htmlStreaming: false,
        ver: 0,
        subs: /* @__PURE__ */ new Set(),
        fetched: false
      });
    }
    function bump(name) {
      const r = get(name);
      r.ver++;
      for (const fn of r.subs) fn();
    }
    return {
      entries,
      get,
      bump,
      bumpAll() {
        for (const n in entries) bump(n);
      }
    };
  }

  // src/runtime.ts
  var COMPONENT_DIR = ".";
  function createRuntime(doc = document) {
    const registry = createRegistry();
    const pseudoClass = createPseudoSheet(doc);
    const helmet = createHelmetManager(
      doc,
      (name) => registry.get(name).htmlStreaming
    );
    const external = createExternalModules(() => registry.bumpAll());
    const factory = createComponentFactory(registry, ensureFetched);
    const host = {
      component: (name) => factory.getDC(name),
      placeholder: (props) => h(Placeholder, props),
      helmet: (node) => helmet.compile(node),
      loadExternal: (kind, url) => external.load(kind, url),
      resolveExternal: (url, name) => external.resolve(url, name),
      resolveExternalGlobal: (url, name) => external.resolveGlobal(url, name),
      resolveExternalError: (url, name) => external.getError(url, name),
      pseudoClass
    };
    function ensureFetched(name) {
      const r = registry.get(name);
      if (r.fetched) return;
      r.fetched = true;
      const url = COMPONENT_DIR + "/" + name + ".dc.html";
      fetch(url).then((res) => {
        if (!res.ok) {
          console.error(
            "[dc-runtime] sibling fetch for <" + name + "/> failed:",
            url,
            "returned",
            res.status,
            "\u2014 the reference renders as an empty placeholder."
          );
          return "";
        }
        return res.text();
      }).then((t) => {
        if (!t) return;
        const parsed = parseDcText(t);
        if (!parsed) {
          console.error(
            "[dc-runtime] sibling fetch for <" + name + "/>:",
            url,
            "has no <x-dc> block \u2014 not a Design Component."
          );
          return;
        }
        if (parsed.props) r.propsMeta = parsed.props;
        if (parsed.preview) r.preview = parsed.preview;
        if (parsed.template && !r.html) updateHtml(name, parsed.template);
        if (parsed.js && !r.Logic) updateJs(name, parsed.js);
      }).catch(
        (e) => console.error(
          "[dc-runtime] sibling fetch for <" + name + "/> threw:",
          url,
          e
        )
      );
    }
    function updateHtml(name, html) {
      const r = registry.get(name);
      r.html = html;
      try {
        r.tpl = compileTemplate(html, host);
      } catch (e) {
        console.error("[dc-runtime] template compile FAILED for", name, e);
      }
      registry.bump(name);
    }
    function updateJs(name, src) {
      const r = registry.get(name);
      const seq = r.jsSeq = (r.jsSeq || 0) + 1;
      try {
        const Cls = evalDcLogic(src);
        if (r.jsSeq !== seq) return;
        if (typeof Cls !== "function") {
          r.logicError = name + ".dc.html: <script data-dc-script> must define `class Component extends DCLogic`";
        } else {
          r.logicError = null;
          r.Logic = Cls;
        }
      } catch (e) {
        if (r.jsSeq !== seq) return;
        console.error(
          "[dc-runtime] logic class eval FAILED for",
          name,
          "\u2014 the template renders with props only.",
          e
        );
        r.logicError = name + ": " + (e instanceof Error && e.message ? e.message : String(e));
      }
      registry.bump(name);
    }
    function setStreaming(name, kind, on) {
      const r = registry.get(name);
      if (kind === "html") r.htmlStreaming = !!on;
      else r.jsStreaming = !!on;
      let any = false;
      for (const n in registry.entries) {
        const e = registry.entries[n];
        if (e && (e.htmlStreaming || e.jsStreaming)) {
          any = true;
          break;
        }
      }
      doc.documentElement.classList.toggle("sc-dc-streaming", any);
      registry.bump(name);
    }
    function dcUpdate(name, kind, content, streaming) {
      if (streaming) registry.get(name).fetched = true;
      if (kind === "html") {
        setStreaming(name, "html", !!streaming);
        updateHtml(name, content);
      } else if (kind === "js") {
        setStreaming(name, "js", !!streaming);
        if (!streaming) updateJs(name, content);
      } else if (kind === "props") {
        const { props, preview } = parseDataProps(content);
        const r = registry.get(name);
        r.propsMeta = props ?? void 0;
        r.preview = preview;
        registry.bump(name);
      }
    }
    function setProps(name, overrides) {
      registry.get(name).propOverrides = overrides && typeof overrides === "object" ? { ...overrides } : null;
      registry.bump(name);
    }
    function adoptParsed(name, parsed) {
      if (!parsed) return;
      const r = registry.get(name);
      if (parsed.props) r.propsMeta = parsed.props;
      if (parsed.preview) r.preview = parsed.preview;
      if (parsed.template) updateHtml(name, parsed.template);
      if (parsed.js) updateJs(name, parsed.js);
    }
    return {
      registry,
      getDC: factory.getDC,
      updateHtml,
      updateJs,
      dcUpdate,
      setProps,
      adoptParsed,
      markFetched: (name) => {
        registry.get(name).fetched = true;
      },
      annotatedTemplate: (name) => {
        const r = registry.get(name);
        return r.tpl && r.tpl.__annotated || null;
      },
      templateSource: (name) => registry.get(name).html || null,
      StreamableLogic
    };
  }

  // src/index.ts
  var REACT_URL = "https://unpkg.com/react@18.3.1/umd/react.production.min.js";
  var REACT_SRI = "sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z";
  var REACT_DOM_URL = "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js";
  var REACT_DOM_SRI = "sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1";
  function hideRawTemplate() {
    const s = document.createElement("style");
    s.textContent = "x-dc{display:none!important}";
    document.head.appendChild(s);
  }
  function loadScript(src, integrity) {
    return new Promise((resolve2, reject) => {
      //! nosemgrep: create-script-element
      const s = document.createElement("script");
      s.src = src;
      s.integrity = integrity;
      s.crossOrigin = "anonymous";
      s.async = false;
      s.onload = () => resolve2();
      s.onerror = () => reject(new Error(`failed to load ${src}`));
      document.head.appendChild(s);
    });
  }
  function loadReactUmd() {
    const w = window;
    if (w.React && w.ReactDOM) return Promise.resolve();
    return Promise.all([
      loadScript(REACT_URL, REACT_SRI),
      loadScript(REACT_DOM_URL, REACT_DOM_SRI)
    ]).then(() => void 0);
  }
  function init() {
    const runtime = createRuntime(document);
    let rootName = "Root";
    const baseCss = document.createElement("style");
    baseCss.textContent = BASE_CSS;
    document.head.prepend(baseCss);
    const notifyHost = () => {
      if (window.parent === window) return;
      const r = runtime.registry.entries[rootName];
      try {
        window.parent.postMessage(
          {
            type: "__dc_booted",
            rootName,
            propsMeta: r && r.propsMeta || null,
            preview: r && r.preview || null
          },
          "*"
        );
      } catch {
      }
    };
    const api = {
      __dcUpdate: (name, kind, content, streaming) => {
        runtime.dcUpdate(name, kind, content, streaming);
        if (name === rootName && !streaming && kind === "props") notifyHost();
      },
      __dcSetProps: (name, overrides) => runtime.setProps(name, overrides),
      /** Name of the component currently mounted as the page root — DC tools
       *  push their template-stream here when targeting "the open page". */
      __dcRootName: () => rootName,
      /** Editor bridge — the encoded, `data-dc-tpl`-annotated template source.
       *  The host editor parses this into its own template DOM so it can map a
       *  rendered node (carrying the same `data-dc-tpl`) back to the source
       *  node that emitted it. Returns the encoded form (`<sc-comp>`,
       *  `sc-camel-*` attrs); the editor decodes on serialize. */
      __dcAnnotatedTemplate: (name) => runtime.annotatedTemplate(name),
      /** Editor bridge — the *original* (decoded) template source. */
      __dcTemplateSource: (name) => runtime.templateSource(name),
      __dcBoot: () => {
        rootName = boot(runtime, document) ?? rootName;
        notifyHost();
      },
      __dcRegistry: runtime.registry.entries,
      getDC: (name) => runtime.getDC(name),
      // `DCLogic` is the documented base class name; `StreamableLogic` is the
      // implementation alias kept for any project that already references it.
      DCLogic: runtime.StreamableLogic,
      StreamableLogic: runtime.StreamableLogic
    };
    Object.assign(window, api);
    if (document.readyState !== "loading") api.__dcBoot();
    else document.addEventListener("DOMContentLoaded", () => api.__dcBoot());
  }
  hideRawTemplate();
  loadReactUmd().then(init).catch((err) => {
    console.error("[dc] failed to load React or boot:", err);
    throw err;
  });
})();
