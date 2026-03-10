/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { parseHTML, VDocumentFragment, VElement, VHTMLDocument, VNode } from "zeed-dom";
import { sanitizeHTMLThroughSchema } from "./html-sanitizer";

// Inlined from @plane/editor — keep in sync with packages/editor
const COLORS_LIST = [
  { key: "gray" },
  { key: "peach" },
  { key: "pink" },
  { key: "orange" },
  { key: "green" },
  { key: "light-blue" },
  { key: "dark-blue" },
  { key: "purple" },
] as const;

const ECalloutAttributeNames = {
  ICON_COLOR: "data-icon-color",
  ICON_NAME: "data-icon-name",
  EMOJI_UNICODE: "data-emoji-unicode",
  EMOJI_URL: "data-emoji-url",
  LOGO_IN_USE: "data-logo-in-use",
  BACKGROUND: "data-background",
  BLOCK_TYPE: "data-block-type",
} as const;

type PlaneColorKey = (typeof COLORS_LIST)[number]["key"];

const NAMED_COLORS: Record<string, string> = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
};

function namedColorToHex(color: string): string {
  if (color.startsWith("#")) return color;
  return NAMED_COLORS[color.toLowerCase()] ?? color;
}

type DocRoot = VDocumentFragment | VHTMLDocument;

// ─── 1. Code blocks ─────────────────────────────────────────────────────────

function transformCodeBlocks(doc: DocRoot): void {
  // Code panels: <div class="code panel"> ... <pre class="code-*">
  const codePanels = doc.querySelectorAll("div.code.panel");
  for (const panel of codePanels) {
    const pre = panel.querySelector("pre");
    if (!pre) continue;

    // Extract language from class like "code-java" → "java"
    const preClass = pre.className || "";
    const langMatch = preClass.match(/code-(\S+)/);
    const lang = langMatch?.[1];

    const code = doc.createElement("code");
    if (lang) code.setAttribute("class", `language-${lang}`);
    // Move pre's children into code
    for (const child of [...(pre.childNodes as VNode[])]) {
      code.appendChild(child);
    }

    const newPre = doc.createElement("pre");
    newPre.appendChild(code);
    panel.replaceWith(newPre);
  }

  // Noformat panels: <div class="preformatted panel"> ... <pre>
  const noformatPanels = doc.querySelectorAll("div.preformatted.panel");
  for (const panel of noformatPanels) {
    const pre = panel.querySelector("pre");
    if (!pre) continue;

    const code = doc.createElement("code");
    for (const child of [...(pre.childNodes as VNode[])]) {
      code.appendChild(child);
    }

    const newPre = doc.createElement("pre");
    newPre.appendChild(code);
    panel.replaceWith(newPre);
  }
}

// ─── 2. Panel blocks → callout ───────────────────────────────────────────────

// Jira panel type → Plane callout attributes
// Uses emoji mode (data-logo-in-use="emoji") which is the default and always renders.
// data-background uses Plane's color keys from COLORS_LIST
type JiraPanelCalloutConfig = {
  emojiUnicode: string;
  emojiUrl: string;
  background: PlaneColorKey | undefined;
};

const PANEL_TYPE_CALLOUT: Record<string, JiraPanelCalloutConfig> = {
  info: {
    emojiUnicode: "8505", // ℹ️
    emojiUrl: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/2139-fe0f.png",
    background: "light-blue",
  },
  warning: {
    emojiUnicode: "9888", // ⚠️
    emojiUrl: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/26a0-fe0f.png",
    background: "orange",
  },
  note: {
    emojiUnicode: "128221", // 📝
    emojiUrl: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4dd.png",
    background: "purple",
  },
  tip: {
    emojiUnicode: "128161", // 💡
    emojiUrl: "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a1.png",
    background: "green",
  },
};

const DEFAULT_PANEL_CALLOUT = PANEL_TYPE_CALLOUT.tip;

function detectPanelType(panel: VElement): string {
  const style = (panel.getAttribute("style") || "").toLowerCase();
  const cls = panel.className || "";

  if (cls.includes("informationMacroPadding") || cls.includes("aui-message-info") || style.includes("#dfe1e6"))
    return "info";
  if (cls.includes("warningMacroPadding") || cls.includes("aui-message-warning") || style.includes("#fffae6"))
    return "warning";
  if (cls.includes("noteMacroPadding") || cls.includes("aui-message-problem") || style.includes("#deebff"))
    return "note";
  if (cls.includes("tipMacroPadding") || cls.includes("aui-message-success") || style.includes("#e3fcef")) return "tip";

  const header = panel.querySelector("div.panelHeader");
  if (header) {
    const text = (header.textContent || "").toLowerCase().trim();
    if (text.includes("warning") || text.includes("caution")) return "warning";
    if (text.includes("info") || text.includes("information")) return "info";
    if (text.includes("note")) return "note";
    if (text.includes("tip") || text.includes("hint")) return "tip";
  }

  return "tip";
}

function transformPanels(doc: DocRoot): void {
  const panels = doc.querySelectorAll("div.panel");
  for (const panel of panels) {
    if (panel.classList.contains("code") || panel.classList.contains("preformatted")) continue;

    const panelType = detectPanelType(panel);
    const calloutAttrs = PANEL_TYPE_CALLOUT[panelType] || DEFAULT_PANEL_CALLOUT;

    const callout = doc.createElement("div");
    callout.setAttribute(ECalloutAttributeNames.BLOCK_TYPE, "callout-component");
    callout.setAttribute(ECalloutAttributeNames.LOGO_IN_USE, "emoji");
    callout.setAttribute(ECalloutAttributeNames.EMOJI_UNICODE, calloutAttrs.emojiUnicode);
    callout.setAttribute(ECalloutAttributeNames.EMOJI_URL, calloutAttrs.emojiUrl);
    if (calloutAttrs.background) {
      callout.setAttribute(ECalloutAttributeNames.BACKGROUND, calloutAttrs.background);
    }

    const header = panel.querySelector("div.panelHeader");
    if (header) {
      const headerP = doc.createElement("p");
      const strong = doc.createElement("strong");
      strong.appendChild(doc.createTextNode(header.textContent || ""));
      headerP.appendChild(strong);
      callout.appendChild(headerP);
    }

    const content = panel.querySelector("div.panelContent");
    if (content) {
      for (const child of [...(content.childNodes as VNode[])]) {
        callout.appendChild(child);
      }
    }

    // Callout requires block+ content; wrap inline-only content in a paragraph
    const hasBlockChild = (callout.childNodes as VNode[]).some(
      (n) =>
        n.nodeType === VNode.ELEMENT_NODE &&
        /^(p|ul|ol|h[1-6]|table|pre|blockquote|div)$/i.test((n as VElement).tagName || "")
    );
    if (!hasBlockChild) {
      const wrapper = doc.createElement("p");
      for (const child of [...(callout.childNodes as VNode[])]) {
        wrapper.appendChild(child);
      }
      callout.appendChild(wrapper);
    }

    panel.replaceWith(callout);
  }
}

// ─── 3. Font color → span with data-text-color ──────────────────────────────

// Plane's editor color keys and their hex values (from variables.css)
// data-text-color accepts these keys for theme-aware rendering.
// Keys are derived from COLORS_LIST; hex values are the resolved CSS variable values
// needed server-side for nearest-color matching (CSS vars can't be resolved here).
const PLANE_TEXT_COLOR_HEX: Record<PlaneColorKey, string> = {
  gray: "#5c5e63",
  peach: "#ff5b59",
  pink: "#f65385",
  orange: "#fd9038",
  green: "#0fc27b",
  "light-blue": "#17bee9",
  "dark-blue": "#266df0",
  purple: "#9162f9",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

// Convert RGB (0-255) to HSL (h: 0-360, s: 0-1, l: 0-1)
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

// Hue-weighted color distance. Prioritizes hue so that e.g. dark green (#008000)
// maps to Plane's "green" rather than "gray".
// - Hue is circular (0-360°) and weighted heavily (weight 2.5)
// - Saturation difference (weight 1.5) separates chromatic from achromatic
// - Lightness difference (weight 0.8) is least important
function hslColorDistance(a: { h: number; s: number; l: number }, b: { h: number; s: number; l: number }): number {
  // Circular hue distance (0-180), normalized to 0-1
  let dh = Math.abs(a.h - b.h);
  if (dh > 180) dh = 360 - dh;
  const hueDist = dh / 180;

  const satDist = Math.abs(a.s - b.s);
  const lightDist = Math.abs(a.l - b.l);

  // If either color is nearly achromatic (very low saturation), ignore hue
  // because hue is meaningless for grays/whites/blacks
  const minSat = Math.min(a.s, b.s);
  const hueWeight = minSat < 0.1 ? 0.3 : 3.0;

  return Math.sqrt((hueWeight * hueDist) ** 2 + (1.0 * satDist) ** 2 + (0.6 * lightDist) ** 2);
}

// Pre-compute HSL values for Plane colors
const PLANE_COLORS_HSL = Object.entries(PLANE_TEXT_COLOR_HEX).map(([key, hex]) => {
  const rgb = hexToRgb(hex)!;
  return { key, hsl: rgbToHsl(rgb.r, rgb.g, rgb.b) };
});

// Hue-range buckets for chromatic colors. Each Plane color "owns" a hue range.
// For saturated inputs we first check which bucket the hue falls into,
// then fall back to HSL distance for edge cases.
// Ranges are [inclusive, exclusive) and wrap around 360°.
const HUE_BUCKETS: { key: PlaneColorKey; minHue: number; maxHue: number }[] = [
  { key: "peach", minHue: 345, maxHue: 360 }, // red wraps around
  { key: "peach", minHue: 0, maxHue: 15 }, // red continuation
  { key: "orange", minHue: 15, maxHue: 50 },
  { key: "green", minHue: 80, maxHue: 175 },
  { key: "light-blue", minHue: 175, maxHue: 210 },
  { key: "dark-blue", minHue: 210, maxHue: 250 },
  { key: "purple", minHue: 250, maxHue: 310 },
  { key: "pink", minHue: 310, maxHue: 345 },
];

function mapToPlaneColorKey(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const inputHsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // Near-black or near-white: don't color-map, keep as hex for inline fallback
  if (inputHsl.l < 0.08 || inputHsl.l > 0.95) return hex;

  // Very low saturation (true grays): map to "gray"
  if (inputHsl.s < 0.08) return "gray";

  // For chromatic colors, try hue bucket first
  for (const { key, minHue, maxHue } of HUE_BUCKETS) {
    if (inputHsl.h >= minHue && inputHsl.h < maxHue) return key;
  }

  // Fallback: HSL distance (shouldn't normally reach here since buckets cover 0-360)
  let bestKey = hex;
  let bestDist = Infinity;

  for (const { key, hsl } of PLANE_COLORS_HSL) {
    if (key === "gray") continue;
    const dist = hslColorDistance(inputHsl, hsl);
    if (dist < bestDist) {
      bestDist = dist;
      bestKey = key;
    }
  }

  return bestDist < 2.0 ? bestKey : hex;
}

function transformFontColors(doc: DocRoot): void {
  const fonts = doc.querySelectorAll("font");
  for (const font of fonts) {
    const color = font.getAttribute("color");
    if (!color) continue;

    const hex = namedColorToHex(color);
    const planeColor = mapToPlaneColorKey(hex);

    const span = doc.createElement("span");
    span.setAttribute("data-text-color", planeColor);
    for (const child of [...(font.childNodes as VNode[])]) {
      span.appendChild(child);
    }
    font.replaceWith(span);
  }
}

// ─── 4. Tag replacements: tt→code, ins→u, cite→em ───────────────────────────

function transformTagReplacements(doc: DocRoot): void {
  const replacements: Record<string, string> = { tt: "code", ins: "u", cite: "em" };
  for (const [from, to] of Object.entries(replacements)) {
    const elements = doc.querySelectorAll(from);
    for (const el of [...elements]) {
      // zeed-dom's setTagName updates the property but render() still uses the
      // original tag. Work around by creating a new element and transplanting children.
      const replacement = doc.createElement(to);
      for (const attr of el.attributes || []) {
        replacement.setAttribute(attr.name, attr.value);
      }
      for (const child of [...(el.childNodes as VNode[])]) {
        replacement.appendChild(child);
      }
      el.replaceWith(replacement);
    }
  }
}

// ─── 5. User mentions ───────────────────────────────────────────────────────

function transformUserMentions(doc: DocRoot): void {
  const mentions = doc.querySelectorAll("a.user-hover");
  for (const mention of mentions) {
    const name = mention.textContent || "";
    mention.replaceWith(doc.createTextNode(`@${name}`));
  }
}

// ─── 6. Images ──────────────────────────────────────────────────────────────

function transformImages(doc: DocRoot): void {
  // Unwrap images from <span class="image-wrap">
  const imageWraps = doc.querySelectorAll("span.image-wrap");
  for (const wrap of imageWraps) {
    const img = wrap.querySelector("img");
    if (img) {
      wrap.replaceWith(img);
    } else {
      wrap.replaceWith(...(wrap.childNodes as VNode[]));
    }
  }
}

// ─── 7. Emoticons → Plane emoji nodes ───────────────────────────────────────

// Jira DC emoticon alt text → GitHub emoji shortcode (used by Plane's emoji extension).
// The `name` field maps to `data-name` on the emoji node (Tiptap shortcode).
type JiraEmoticonMapping = { name: string; emoji: string };

const JIRA_EMOTICON_TO_EMOJI: Record<string, JiraEmoticonMapping> = {
  "(smile)": { name: "smile", emoji: "😄" },
  "(sad)": { name: "cry", emoji: "😢" },
  "(tongue)": { name: "stuck_out_tongue", emoji: "😛" },
  "(biggrin)": { name: "grinning", emoji: "😀" },
  "(wink)": { name: "wink", emoji: "😉" },
  "(thumbs-up)": { name: "+1", emoji: "👍" },
  "(thumbsup)": { name: "+1", emoji: "👍" },
  "(thumbs-down)": { name: "-1", emoji: "👎" },
  "(thumbsdown)": { name: "-1", emoji: "👎" },
  "(information)": { name: "information_source", emoji: "ℹ" },
  "(tick)": { name: "white_check_mark", emoji: "✅" },
  "(cross)": { name: "x", emoji: "❌" },
  "(error)": { name: "x", emoji: "❌" },
  "(warning)": { name: "warning", emoji: "⚠" },
  "(plus)": { name: "heavy_plus_sign", emoji: "➕" },
  "(minus)": { name: "heavy_minus_sign", emoji: "➖" },
  "(question)": { name: "question", emoji: "❓" },
  "(on)": { name: "bulb", emoji: "💡" },
  "(off)": { name: "bulb", emoji: "💡" },
  "(lightbulb)": { name: "bulb", emoji: "💡" },
  "(star)": { name: "star", emoji: "⭐" },
  "(flag)": { name: "checkered_flag", emoji: "🏁" },
  "(flagged)": { name: "checkered_flag", emoji: "🏁" },
  "(heart)": { name: "heart", emoji: "❤" },
  "(broken-heart)": { name: "broken_heart", emoji: "💔" },
  "(laugh)": { name: "laughing", emoji: "😆" },
  "(angry)": { name: "angry", emoji: "😠" },
  "(forbidden)": { name: "no_entry_sign", emoji: "🚫" },
  "(cheeky)": { name: "stuck_out_tongue_winking_eye", emoji: "😜" },
};

function transformEmoticons(doc: DocRoot): void {
  const emoticons = doc.querySelectorAll("img.emoticon");
  for (const emoticon of emoticons) {
    const alt = emoticon.getAttribute("alt") || "";
    const mapped = JIRA_EMOTICON_TO_EMOJI[alt];

    if (mapped) {
      // Create <span data-type="emoji" data-name="...">emoji</span>
      // This matches Plane's emoji extension parseHTML rule
      const span = doc.createElement("span");
      span.setAttribute("data-type", "emoji");
      span.setAttribute("data-name", mapped.name);
      span.appendChild(doc.createTextNode(mapped.emoji));
      emoticon.replaceWith(span);
    } else {
      // Unmapped emoticon: fall back to alt text
      emoticon.replaceWith(doc.createTextNode(alt));
    }
  }
}

// ─── 8. Heading anchors ─────────────────────────────────────────────────────

function transformHeadingAnchors(doc: DocRoot): void {
  for (const level of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
    const headings = doc.querySelectorAll(level);
    for (const heading of headings) {
      const anchors = heading.querySelectorAll("a");
      for (const anchor of anchors) {
        if (anchor.hasAttribute("name") && !anchor.hasAttribute("href")) {
          // Unwrap: keep children (visible text), remove the <a> wrapper
          anchor.replaceWith(...(anchor.childNodes as VNode[]));
        }
      }
    }
  }
}

// ─── 9. Tables ──────────────────────────────────────────────────────────────

function transformTables(doc: DocRoot): void {
  const confluenceClasses = ["confluenceTable", "confluenceTh", "confluenceTd"];
  for (const cls of confluenceClasses) {
    const elements = doc.querySelectorAll(`.${cls}`);
    for (const el of elements) {
      el.classList.remove(cls);
      // Clean up empty class attribute
      if (!el.className.trim()) {
        el.removeAttribute("class");
      }
    }
  }
}

// ─── 10. Links ──────────────────────────────────────────────────────────────

function transformLinks(doc: DocRoot): void {
  const links = doc.querySelectorAll("a");
  for (const link of links) {
    // Strip external-link class
    if (link.classList.contains("external-link")) {
      link.classList.remove("external-link");
      if (!link.className.trim()) {
        link.removeAttribute("class");
      }
    }
  }
}

// ─── 11. Confluence anchors ─────────────────────────────────────────────────

function transformConfluenceAnchors(doc: DocRoot): void {
  const anchors = doc.querySelectorAll("span.confluence-anchor-link");
  for (const anchor of anchors) {
    anchor.remove();
  }
}

// ─── 12. Dash lists ─────────────────────────────────────────────────────────

function transformDashLists(doc: DocRoot): void {
  const altLists = doc.querySelectorAll("ul.alternate");
  for (const list of altLists) {
    list.classList.remove("alternate");
    if (!list.className.trim()) {
      list.removeAttribute("class");
    }
    list.removeAttribute("type");
  }
}

// ─── 13. List structure fix ──────────────────────────────────────────────────
// Jira DC renders lists with correct nesting already (nested lists inside <li>).
// We only fix edge cases where a nested list is a direct child of <ol>/<ul>
// instead of being inside an <li> — move it into the preceding <li>.

function fixListNesting(doc: DocRoot): void {
  const lists = doc.querySelectorAll("ol, ul");
  for (const list of lists) {
    const listChildren = [...(list.childNodes as VNode[])];
    for (let j = 0; j < listChildren.length; j++) {
      const listChild = listChildren[j];
      if (listChild.nodeType !== VNode.ELEMENT_NODE) continue;

      const listChildEl = listChild as VElement;
      const listChildTag = listChildEl.tagName?.toLowerCase();

      if (listChildTag === "ol" || listChildTag === "ul") {
        let prevLi: VElement | null = null;
        for (let k = j - 1; k >= 0; k--) {
          const prev = listChildren[k];
          if (prev.nodeType === VNode.ELEMENT_NODE && (prev as VElement).tagName?.toLowerCase() === "li") {
            prevLi = prev as VElement;
            break;
          }
        }

        if (prevLi) {
          prevLi.appendChild(listChildEl);
        }
      }
    }
  }
}

// ─── 14. Separate consecutive lists ─────────────────────────────────────────
// Plane's editor has an appendTransaction plugin ("ordered-list-merging" in
// keymap.ts) that auto-joins adjacent orderedList/bulletList/taskList nodes.
// To preserve intentionally separate lists from Jira, insert an empty <p>
// between consecutive same-type list siblings so the editor won't merge them.

function separateConsecutiveLists(doc: DocRoot): void {
  walkAndSeparateLists(doc, doc);
}

function walkAndSeparateLists(node: VNode, doc: DocRoot): void {
  for (const child of [...(node.childNodes as VNode[])]) {
    if (child.nodeType === VNode.ELEMENT_NODE) {
      walkAndSeparateLists(child, doc);
    }
  }

  // Snapshot children, find consecutive same-type list elements (skipping whitespace text)
  const elements: VElement[] = [];
  for (const child of node.childNodes as VNode[]) {
    if (child.nodeType === VNode.ELEMENT_NODE) {
      elements.push(child as VElement);
    }
  }

  const listTags = new Set(["ol", "ul"]);
  const toSeparate: VElement[] = [];

  for (let i = 1; i < elements.length; i++) {
    const prev = elements[i - 1];
    const curr = elements[i];
    const prevTag = prev.tagName?.toLowerCase();
    const currTag = curr.tagName?.toLowerCase();

    if (listTags.has(prevTag) && listTags.has(currTag) && prevTag === currTag) {
      toSeparate.push(curr);
    }
  }

  // Insert empty <p> before each list that needs separation (reverse to keep positions stable)
  for (const el of toSeparate.reverse()) {
    const separator = doc.createElement("p");
    node.insertBefore(separator, el);
  }
}

// ─── 15. Block spacing cleanup ──────────────────────────────────────────────
// Jira DC produces spacer <br> tags and whitespace-only text that become
// unwanted hardBreak nodes or empty paragraphs in ProseMirror.
//
// The rule: remove <br> or whitespace-only text nodes when they appear
// at the start/end of a text block, or adjacent to a block-level child.
// Preserve interior <br> (e.g. "Line 1<br/>Line 2") and never touch pre/code.

const BLOCK_RE = /^(p|ul|ol|li|table|thead|tbody|tfoot|tr|td|th|pre|blockquote|div|h[1-6])$/;
const REMOVABLE_EMPTY_RE = /^(p|h[1-6])$/;

function isBrOrWhitespace(node: VNode): boolean {
  if (node.nodeType === VNode.TEXT_NODE) return !(node.textContent || "").trim();
  if (node.nodeType === VNode.ELEMENT_NODE) return (node as VElement).tagName?.toLowerCase() === "br";
  return false;
}

function isBlockEl(node: VNode): boolean {
  return node.nodeType === VNode.ELEMENT_NODE && BLOCK_RE.test((node as VElement).tagName?.toLowerCase() || "");
}

// Find the nearest non-whitespace-text sibling in a direction
function meaningfulSibling(children: VNode[], index: number, dir: -1 | 1): VNode | null {
  for (let i = index + dir; i >= 0 && i < children.length; i += dir) {
    if (!(children[i].nodeType === VNode.TEXT_NODE && !(children[i].textContent || "").trim())) {
      return children[i];
    }
  }
  return null;
}

function cleanUpBlockSpacing(node: VNode): void {
  // Skip pre/code subtrees entirely — whitespace is meaningful there
  if (node.nodeType === VNode.ELEMENT_NODE) {
    const tag = (node as VElement).tagName?.toLowerCase();
    if (tag === "pre" || tag === "code") return;
  }

  // Recurse depth-first so children are clean before we process this node
  for (const child of [...(node.childNodes as VNode[])]) {
    cleanUpBlockSpacing(child);
  }

  // Determine if this node is a cleanup container:
  // - text blocks (p, h1-h6, li, td, th, blockquote)
  // - block wrappers that contain block children (div with blocks, callouts)
  // - the document root
  const isRoot = node.nodeType !== VNode.ELEMENT_NODE;
  if (!isRoot) {
    const el = node as VElement;
    const tag = el.tagName?.toLowerCase() || "";
    if (tag === "pre" || tag === "code") return;
    const isTextBlock = /^(p|li|td|th|blockquote|h[1-6])$/.test(tag);
    const isCallout = tag === "div" && el.getAttribute(ECalloutAttributeNames.BLOCK_TYPE) === "callout-component";
    const hasBlockChildren = (el.childNodes as VNode[]).some(isBlockEl);
    if (!isTextBlock && !isCallout && !hasBlockChildren) return;
  }

  // Walk children: remove <br>/whitespace nodes at edges or adjacent to block elements.
  // Loop until no more removals since removing one spacer may expose another at the edge.
  let changed = true;
  while (changed) {
    changed = false;
    const children = [...(node.childNodes as VNode[])];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!isBrOrWhitespace(child)) continue;

      const prev = meaningfulSibling(children, i, -1);
      const next = meaningfulSibling(children, i, 1);

      if (!prev || !next || isBlockEl(prev) || isBlockEl(next)) {
        child.remove();
        changed = true;
        break; // Restart scan with fresh children
      }
    }
  }

  // Remove paragraphs/headings that became empty after cleanup
  if (node.nodeType === VNode.ELEMENT_NODE) {
    const el = node as VElement;
    const tag = el.tagName?.toLowerCase() || "";

    // Trim leading/trailing whitespace from first/last text children of text blocks
    // (handles leftover spaces after <br> removal, e.g. "<p> <br/> What:</p>" → "<p>What:</p>")
    if (/^(p|li|td|th|h[1-6])$/.test(tag)) {
      const first = (el.childNodes as VNode[])[0] as VNode | undefined;
      if (first?.nodeType === VNode.TEXT_NODE) {
        const trimmed = (first.textContent || "").replace(/^\s+/, "");
        if (trimmed !== first.textContent) {
          const replacement = (parseHTML(trimmed).childNodes as VNode[])[0] as VNode | undefined;
          if (replacement) first.replaceWith(replacement);
          else first.remove();
        }
      }
      const last = (el.childNodes as VNode[])[(el.childNodes as VNode[]).length - 1] as VNode | undefined;
      if (last?.nodeType === VNode.TEXT_NODE && last !== (el.childNodes as VNode[])[0]) {
        const trimmed = (last.textContent || "").replace(/\s+$/, "");
        if (trimmed !== last.textContent) {
          const replacement = (parseHTML(trimmed).childNodes as VNode[])[0] as VNode | undefined;
          if (replacement) last.replaceWith(replacement);
          else last.remove();
        }
      }
    }

    if (REMOVABLE_EMPTY_RE.test(tag) && el.childNodes.length === 0) {
      el.remove();
    }
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function normalizeJiraHTML(html: string): string {
  const input = !html || !html.trim() ? "<p></p>" : html;

  const doc = parseHTML(input);

  // Apply transforms in order
  transformCodeBlocks(doc);
  transformPanels(doc);
  transformFontColors(doc);
  transformTagReplacements(doc);
  transformUserMentions(doc);
  transformImages(doc);
  transformEmoticons(doc);
  transformHeadingAnchors(doc);
  transformTables(doc);
  transformLinks(doc);
  transformConfluenceAnchors(doc);
  transformDashLists(doc);
  fixListNesting(doc);
  cleanUpBlockSpacing(doc);
  separateConsecutiveLists(doc);

  // Round-trip through Tiptap schema to strip nodes the editor won't understand
  const rendered = sanitizeHTMLThroughSchema(doc.render());

  // Guarantee at least one empty paragraph so the Plane editor has a valid document
  return rendered || "<p></p>";
}
