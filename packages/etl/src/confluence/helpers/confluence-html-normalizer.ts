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
import { sanitizeHTMLThroughSchema } from "../../jira-server/helpers/html-sanitizer";

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

type DocRoot = VDocumentFragment | VHTMLDocument;

// ─── CSS color mapping helpers ──────────────────────────────────────────────

const NAMED_COLORS: Record<string, string> = {
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  orange: "#ffa500",
  purple: "#800080",
  pink: "#ffc0cb",
  gray: "#808080",
  grey: "#808080",
  black: "#000000",
  white: "#ffffff",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  brown: "#a52a2a",
  crimson: "#dc143c",
  darkred: "#8b0000",
  darkgreen: "#006400",
  darkblue: "#00008b",
  navy: "#000080",
  teal: "#008080",
  maroon: "#800000",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) {
    // 3-digit shorthand
    const m3 = hex.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    if (!m3) return null;
    return {
      r: parseInt(m3[1] + m3[1], 16),
      g: parseInt(m3[2] + m3[2], 16),
      b: parseInt(m3[3] + m3[3], 16),
    };
  }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

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

const HUE_BUCKETS: { key: PlaneColorKey; minHue: number; maxHue: number }[] = [
  { key: "peach", minHue: 345, maxHue: 360 },
  { key: "peach", minHue: 0, maxHue: 15 },
  { key: "orange", minHue: 15, maxHue: 50 },
  { key: "green", minHue: 80, maxHue: 175 },
  { key: "light-blue", minHue: 175, maxHue: 210 },
  { key: "dark-blue", minHue: 210, maxHue: 250 },
  { key: "purple", minHue: 250, maxHue: 310 },
  { key: "pink", minHue: 310, maxHue: 345 },
];

function mapToPlaneColorKey(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (hsl.l < 0.08 || hsl.l > 0.95) return null;
  if (hsl.s < 0.08) return "gray";
  for (const { key, minHue, maxHue } of HUE_BUCKETS) {
    if (hsl.h >= minHue && hsl.h < maxHue) return key;
  }
  return null;
}

/**
 * Extract a color hex value from a CSS style string.
 * Handles: `color: #c9372c`, `color: var(--ds-..., #c9372c)`, `color: red`
 */
function extractColorFromStyle(style: string): string | null {
  // Match color: var(--xxx, #hex) — extract the fallback
  const varMatch = style.match(/color:\s*var\([^,]+,\s*(#[0-9a-fA-F]{3,6})\s*\)/);
  if (varMatch) return varMatch[1];
  // Match color: #hex
  const hexMatch = style.match(/color:\s*(#[0-9a-fA-F]{3,6})/);
  if (hexMatch) return hexMatch[1];
  // Match color: namedColor
  const namedMatch = style.match(/color:\s*([a-zA-Z]+)/);
  if (namedMatch && NAMED_COLORS[namedMatch[1].toLowerCase()]) return NAMED_COLORS[namedMatch[1].toLowerCase()];
  return null;
}

// ─── Callout config (shared with Jira normalizer) ───────────────────────────

type PanelCalloutConfig = {
  emojiUnicode: string;
  emojiUrl: string;
  background: PlaneColorKey | undefined;
};

const PANEL_TYPE_CALLOUT: Record<string, PanelCalloutConfig> = {
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

// ─── Helper: create a callout div ───────────────────────────────────────────

function createCalloutDiv(doc: DocRoot, config: PanelCalloutConfig): VElement {
  const callout = doc.createElement("div");
  callout.setAttribute(ECalloutAttributeNames.BLOCK_TYPE, "callout-component");
  callout.setAttribute(ECalloutAttributeNames.LOGO_IN_USE, "emoji");
  callout.setAttribute(ECalloutAttributeNames.EMOJI_UNICODE, config.emojiUnicode);
  callout.setAttribute(ECalloutAttributeNames.EMOJI_URL, config.emojiUrl);
  if (config.background) {
    callout.setAttribute(ECalloutAttributeNames.BACKGROUND, config.background);
  }
  return callout;
}

function ensureBlockContent(callout: VElement, doc: DocRoot): void {
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
}

// ─── 1. Extract body content ────────────────────────────────────────────────

function extractBodyContent(doc: DocRoot): DocRoot {
  const mainContent = doc.querySelector("#main-content.wiki-content") || doc.querySelector("#main-content");
  if (!mainContent) return doc;

  const fragment = parseHTML("");
  for (const child of [...(mainContent.childNodes as VNode[])]) {
    fragment.appendChild(child);
  }
  return fragment;
}

// ─── 1b. Transform Confluence emoticons → emoji text ────────────────────────
// Handles two cases:
// 1. Error placeholders: <img src="plugins/servlet/confluence/placeholder/error" data-encoded-xml="..."/>
//    where the encoded XML contains ac:emoji-id with a Unicode code point
// 2. Regular emoticon imgs: <img class="emoticon" data-emoji-id="1f465" data-emoji-fallback="\uD83D\uDC65" src="images/icons/emoticons/..."/>
//    where data-emoji-fallback has escaped unicode or data-emoji-id has the code point
// Must run before Tiptap round-trip since Tiptap strips <img> from headings.

function codePointToEmoji(codePoint: string): string {
  try {
    return String.fromCodePoint(parseInt(codePoint, 16));
  } catch {
    return "";
  }
}

function decodeEmojiFallback(fallback: string): string {
  // Convert escaped surrogate pairs like \uD83D\uDC65 or raw \\uXXXX to actual characters
  return fallback.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function transformConfluenceEmoticons(doc: DocRoot): void {
  // 1. Error placeholder images with encoded XML containing emoji info
  const errorImgs = doc.querySelectorAll("img.transform-error");
  for (const img of errorImgs) {
    const encodedXml = img.getAttribute("data-encoded-xml") || "";
    const decoded = decodeURIComponent(encodedXml.replace(/\+/g, " "));

    // Try emoji-id first (unicode code point like "1f5d3")
    const idMatch = decoded.match(/ac:emoji-id="([^"]+)"/);
    if (idMatch) {
      const emoji = codePointToEmoji(idMatch[1]);
      if (emoji) {
        img.replaceWith(doc.createTextNode(emoji));
        continue;
      }
    }

    // Fallback to emoji-fallback attribute
    const fallbackMatch = decoded.match(/ac:emoji-fallback="([^"]+)"/);
    if (fallbackMatch) {
      const emoji = decodeEmojiFallback(fallbackMatch[1]);
      if (emoji) {
        img.replaceWith(doc.createTextNode(emoji));
        continue;
      }
    }

    // If nothing worked, just remove the error image
    img.remove();
  }

  // 2. Regular emoticon images (src contains "emoticons" or has emoticon class)
  const emoticons = doc.querySelectorAll("img.emoticon, img[data-emoticon-name]");
  for (const img of emoticons) {
    // Try data-emoji-id (unicode code point)
    const emojiId = img.getAttribute("data-emoji-id");
    if (emojiId) {
      const emoji = codePointToEmoji(emojiId);
      if (emoji) {
        img.replaceWith(doc.createTextNode(emoji));
        continue;
      }
    }

    // Try data-emoji-fallback
    const fallback = img.getAttribute("data-emoji-fallback");
    if (fallback) {
      const emoji = decodeEmojiFallback(fallback);
      if (emoji) {
        img.replaceWith(doc.createTextNode(emoji));
        continue;
      }
    }

    // Remove unresolvable emoticon images
    img.remove();
  }

  // 3. Clean up remaining icon/thumbnail images from Confluence
  const iconImgs = doc.querySelectorAll("img[src*='icons/'], img[src*='thumbnails/']");
  for (const img of iconImgs) {
    img.remove();
  }

  // 4. Fix escaped unicode sequences in text content left by upstream parsers
  //    e.g. literal "\uD83D\uDC65" text → actual 👥 emoji
  const html = doc.render();
  const fixed = html.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  if (fixed !== html) {
    const newDoc = parseHTML(fixed);
    // Replace all children of doc with the fixed content
    for (const child of [...(doc.childNodes as VNode[])]) child.remove();
    for (const child of [...(newDoc.childNodes as VNode[])]) doc.appendChild(child);
  }
}

// ─── 2. Remove scripts and styles ───────────────────────────────────────────

function removeScriptsAndStyles(doc: DocRoot): void {
  for (const tag of ["script", "style"]) {
    const elements = doc.querySelectorAll(tag);
    for (const el of elements) {
      el.remove();
    }
  }
}

// ─── 3. Remove unwanted macros ──────────────────────────────────────────────

function removeUnwantedMacros(doc: DocRoot): void {
  // TOC macros: no content to preserve
  for (const el of doc.querySelectorAll("div.toc-macro")) el.remove();

  // Recently-updated macros: convert to a list of links for preservation
  for (const ru of doc.querySelectorAll("div.recently-updated")) {
    const items = ru.querySelectorAll("a[href]");
    if (items.length > 0) {
      const ul = doc.createElement("ul");
      for (const item of items) {
        const text = item.textContent?.trim();
        const href = item.getAttribute("href") || "";
        if (text && href) {
          const li = doc.createElement("li");
          const a = doc.createElement("a");
          a.setAttribute("href", href);
          a.appendChild(doc.createTextNode(text));
          li.appendChild(a);
          ul.appendChild(li);
        }
      }
      if (ul.childNodes.length > 0) {
        ru.replaceWith(ul);
      } else {
        ru.remove();
      }
    } else {
      ru.remove();
    }
  }

  // Forms (page history etc.) → remove
  for (const el of doc.querySelectorAll("form")) el.remove();

  // Error macros → preserve the error message as a callout
  for (const errDiv of [
    ...doc.querySelectorAll("div.aui-message.error"),
    ...doc.querySelectorAll("div.aui-message.aui-message-error"),
  ]) {
    const text = errDiv.textContent?.trim();
    if (text) {
      const callout = createCalloutDiv(doc, PANEL_TYPE_CALLOUT.warning);
      const p = doc.createElement("p");
      p.appendChild(doc.createTextNode(text));
      callout.appendChild(p);
      errDiv.replaceWith(callout);
    } else {
      errDiv.remove();
    }
  }

  // Unknown macros → remove (no meaningful content)
  for (const el of doc.querySelectorAll("img.wysiwyg-unknown-macro")) el.remove();

  // Jira filter tables → preserve as regular tables
  for (const jiraDiv of doc.querySelectorAll("div.refresh-module-id.jira-table")) {
    const table = jiraDiv.querySelector("table");
    if (table) {
      jiraDiv.replaceWith(table);
    } else {
      jiraDiv.remove();
    }
  }
}

// ─── 4. Code blocks ────────────────────────────────────────────────────────

function transformCodeBlocks(doc: DocRoot): void {
  const codePanels = doc.querySelectorAll("div.code.panel");
  for (const panel of codePanels) {
    const pre = panel.querySelector("pre");
    if (!pre) continue;

    // Extract language from data-syntaxhighlighter-params="brush: bash; gutter: false"
    const params = pre.getAttribute("data-syntaxhighlighter-params") || "";
    const brushMatch = params.match(/brush:\s*(\S+?)(?:;|$)/);
    const lang = brushMatch?.[1];

    // Also try class-based language (code-java style from Jira)
    const preClass = pre.className || "";
    const classLangMatch = preClass.match(/code-(\S+)/);
    const finalLang = lang || classLangMatch?.[1];

    const code = doc.createElement("code");
    if (finalLang) code.setAttribute("class", `language-${finalLang}`);
    for (const child of [...(pre.childNodes as VNode[])]) {
      code.appendChild(child);
    }

    const newPre = doc.createElement("pre");
    newPre.appendChild(code);
    panel.replaceWith(newPre);
  }

  // Noformat/preformatted panels
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

// ─── 5. Information macros → callouts ───────────────────────────────────────

function transformInformationMacros(doc: DocRoot): void {
  const macroTypeMap: Record<string, string> = {
    "confluence-information-macro-information": "info",
    "confluence-information-macro-warning": "warning",
    "confluence-information-macro-note": "note",
    "confluence-information-macro-tip": "tip",
  };

  const macros = doc.querySelectorAll("div.confluence-information-macro");
  for (const macro of macros) {
    let macroType = "info";
    for (const [cls, type] of Object.entries(macroTypeMap)) {
      if (macro.classList.contains(cls)) {
        macroType = type;
        break;
      }
    }

    const config = PANEL_TYPE_CALLOUT[macroType] || DEFAULT_PANEL_CALLOUT;
    const callout = createCalloutDiv(doc, config);

    // Preserve macro title (e.g. "Inhalt", "Protokoll der BA-Sitzung")
    const title = macro.querySelector("p.title");
    if (title) {
      const titleText = (title.textContent || "").trim();
      if (titleText) {
        const titleP = doc.createElement("p");
        const strong = doc.createElement("strong");
        strong.appendChild(doc.createTextNode(titleText));
        titleP.appendChild(strong);
        callout.appendChild(titleP);
      }
    }

    const body = macro.querySelector("div.confluence-information-macro-body");
    if (body) {
      for (const child of [...(body.childNodes as VNode[])]) {
        callout.appendChild(child);
      }
    }

    ensureBlockContent(callout, doc);
    macro.replaceWith(callout);
  }
}

// ─── 6. Panels → callouts ──────────────────────────────────────────────────

function detectPanelType(panel: VElement): string {
  const cls = panel.className || "";

  if (cls.includes("informationMacroPadding") || cls.includes("aui-message-info")) return "info";
  if (cls.includes("warningMacroPadding") || cls.includes("aui-message-warning")) return "warning";
  if (cls.includes("noteMacroPadding") || cls.includes("aui-message-problem")) return "note";
  if (cls.includes("tipMacroPadding") || cls.includes("aui-message-success")) return "tip";

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
    const config = PANEL_TYPE_CALLOUT[panelType] || DEFAULT_PANEL_CALLOUT;
    const callout = createCalloutDiv(doc, config);

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

    ensureBlockContent(callout, doc);
    panel.replaceWith(callout);
  }
}

// ─── 6b. Inline style colors → data-text-color ─────────────────────────────

function transformInlineColors(doc: DocRoot): void {
  const spans = doc.querySelectorAll("span[style]");
  for (const span of spans) {
    const style = span.getAttribute("style") || "";
    const hex = extractColorFromStyle(style);
    if (!hex) continue;

    const planeColor = mapToPlaneColorKey(hex);
    if (planeColor) {
      span.setAttribute("data-text-color", planeColor);
    }
    // Remove the style attribute — color is now in data-text-color or not mappable
    span.removeAttribute("style");
  }
}

// ─── 7. Content layouts → multi-column ──────────────────────────────────────

function transformContentLayouts(doc: DocRoot): void {
  const layouts = doc.querySelectorAll("div.contentLayout2");
  for (const layout of layouts) {
    const columnLayouts = layout.querySelectorAll("div.columnLayout");

    for (const colLayout of columnLayouts) {
      const dataLayout = colLayout.getAttribute("data-layout") || "";
      const cells = colLayout.querySelectorAll("div.cell");

      if (cells.length <= 1) {
        // Single column layout — flatten, no need for multi-column wrapper
        const innerCell = colLayout.querySelector("div.innerCell");
        if (innerCell) {
          colLayout.replaceWith(...(innerCell.childNodes as VNode[]));
        } else {
          colLayout.replaceWith(...(colLayout.childNodes as VNode[]));
        }
        continue;
      }

      // Multi-column layout → Plane column-list + columns
      const columnList = doc.createElement("div");
      columnList.setAttribute("data-node-type", "column-list");

      // Determine widths from data-layout
      const widths = getColumnWidths(dataLayout, cells.length);

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const column = doc.createElement("div");
        column.setAttribute("data-node-type", "column");
        column.setAttribute("data-width", widths[i].toString());

        const innerCell = cell.querySelector("div.innerCell");
        const source = innerCell || cell;
        for (const child of [...(source.childNodes as VNode[])]) {
          column.appendChild(child);
        }

        // Column must have at least one block child — add empty <p> if needed
        if (column.childNodes.length === 0) {
          column.appendChild(doc.createElement("p"));
        }

        columnList.appendChild(column);
      }

      colLayout.replaceWith(columnList);
    }

    // Unwrap the contentLayout2 wrapper itself
    layout.replaceWith(...(layout.childNodes as VNode[]));
  }
}

/**
 * Map Confluence layout types to column width ratios.
 * Confluence layouts: single, two-equal, two-left-sidebar, two-right-sidebar,
 * three-equal, three-with-sidebars
 */
function getColumnWidths(dataLayout: string, colCount: number): number[] {
  switch (dataLayout) {
    case "two-equal":
      return [1, 1];
    case "two-left-sidebar":
      return [1, 2];
    case "two-right-sidebar":
      return [2, 1];
    case "three-equal":
      return [1, 1, 1];
    case "three-with-sidebars":
      return [1, 2, 1];
    default:
      return Array(colCount).fill(1);
  }
}

// ─── 8. Flatten section macros ──────────────────────────────────────────────

function flattenSectionMacros(doc: DocRoot): void {
  const selectors = ["div.sectionColumnWrapper", "div.sectionMacro", "div.sectionMacroRow", "div.columnMacro"];
  for (const selector of selectors) {
    const elements = doc.querySelectorAll(selector);
    for (const el of elements) {
      el.replaceWith(...(el.childNodes as VNode[]));
    }
  }
}

// ─── 9. Unwrap table wrappers ───────────────────────────────────────────────

function unwrapTableWrappers(doc: DocRoot): void {
  for (const cls of ["table-wrap", "content-wrapper"]) {
    const wrappers = doc.querySelectorAll(`div.${cls}`);
    for (const wrapper of wrappers) {
      wrapper.replaceWith(...(wrapper.childNodes as VNode[]));
    }
  }
}

// ─── 10. User mentions ─────────────────────────────────────────────────────

function transformUserMentions(doc: DocRoot): void {
  const mentions = doc.querySelectorAll("a.confluence-userlink, a.user-mention");
  for (const mention of mentions) {
    const name = mention.textContent || "";
    mention.replaceWith(doc.createTextNode(`@${name}`));
  }
}

// ─── 11. Images ─────────────────────────────────────────────────────────────

function transformImages(doc: DocRoot): void {
  const imageWraps = doc.querySelectorAll("span.confluence-embedded-file-wrapper");
  for (const wrap of imageWraps) {
    const img = wrap.querySelector("img");
    if (img) {
      wrap.replaceWith(img);
    } else {
      wrap.replaceWith(...(wrap.childNodes as VNode[]));
    }
  }
}

// ─── 11b. Attachment links → attachment-component ───────────────────────────

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"]);

function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

/**
 * Guess MIME type from file extension for the attachment component.
 */
function guessFileType(filename: string): string {
  const ext = getFileExtension(filename);
  const map: Record<string, string> = {
    pdf: "application/pdf",
    zip: "application/zip",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
    msg: "application/vnd.ms-outlook",
  };
  return map[ext] || "application/octet-stream";
}

function transformAttachmentLinks(doc: DocRoot): void {
  // Find links pointing to local attachment paths (attachments/PAGEID/FILEID.ext)
  const links = doc.querySelectorAll("a[href]");
  for (const link of links) {
    const href = link.getAttribute("href") || "";
    if (!href.startsWith("attachments/")) continue;

    const filename = link.textContent?.trim() || href.split("/").pop() || "attachment";
    const ext = getFileExtension(filename);

    // Skip image attachments — those are handled by transformImages
    if (IMAGE_EXTENSIONS.has(ext)) continue;

    // Convert to <attachment-component> for Plane's attachment extension
    const attachment = doc.createElement("attachment-component");
    attachment.setAttribute("src", href);
    attachment.setAttribute("data-name", filename);
    attachment.setAttribute("data-file-type", guessFileType(filename));
    attachment.setAttribute("status", "uploaded");

    link.replaceWith(attachment);
  }
}

// ─── 12. Jira issue macros (inline spans) ───────────────────────────────────

function transformJiraIssueMacros(doc: DocRoot): void {
  const issueSpans = doc.querySelectorAll("span.jira-issue");
  for (const span of issueSpans) {
    const keyLink = span.querySelector("a.jira-issue-key");
    const summary = span.querySelector("span.summary");
    const status = span.querySelector("span.aui-lozenge");

    if (keyLink) {
      const href = keyLink.getAttribute("href") || "";
      // Build composite text: "JCSD-2887 — jvhanfland: Format Confluence [Closed]"
      const parts: string[] = [];
      const keyText = (keyLink.textContent || "").trim();
      if (keyText) parts.push(keyText);
      const summaryText = (summary?.textContent || "").trim();
      if (summaryText) parts.push(`— ${summaryText}`);
      const statusText = (status?.textContent || "").trim();
      if (statusText) parts.push(`[${statusText}]`);

      const displayText = parts.join(" ") || span.textContent || "";

      if (href) {
        const newLink = doc.createElement("a");
        newLink.setAttribute("href", href);
        newLink.appendChild(doc.createTextNode(displayText));
        span.replaceWith(newLink);
      } else {
        span.replaceWith(doc.createTextNode(displayText));
      }
    } else {
      span.replaceWith(doc.createTextNode(span.textContent || ""));
    }
  }
}

// ─── 13. Status lozenges → bold text ────────────────────────────────────────

function transformStatusLozenges(doc: DocRoot): void {
  const lozenges = doc.querySelectorAll("span.aui-lozenge");
  for (const lozenge of lozenges) {
    const text = lozenge.textContent || "";
    const strong = doc.createElement("strong");
    strong.appendChild(doc.createTextNode(text));
    lozenge.replaceWith(strong);
  }
}

// ─── 14. Inline tasks → Plane task list ─────────────────────────────────────

function transformInlineTasks(doc: DocRoot): void {
  const taskLists = doc.querySelectorAll("ul.inline-task-list");
  for (const taskList of taskLists) {
    const newUl = doc.createElement("ul");
    newUl.setAttribute("data-type", "taskList");
    const items = taskList.querySelectorAll("li");
    for (const item of items) {
      const newLi = doc.createElement("li");
      newLi.setAttribute("data-type", "taskItem");
      const isChecked = (item.getAttribute("class") || "").includes("checked");
      newLi.setAttribute("data-checked", isChecked ? "true" : "false");

      const taskSpan = item.querySelector("span.placeholder-inline-tasks");
      if (taskSpan) {
        // Preserve child nodes (may contain links, formatting, etc.)
        for (const child of [...(taskSpan.childNodes as VNode[])]) {
          newLi.appendChild(child);
        }
      } else {
        for (const child of [...(item.childNodes as VNode[])]) {
          newLi.appendChild(child);
        }
      }

      // taskItem requires block content — wrap inline-only content in a <p>
      const hasBlock = (newLi.childNodes as VNode[]).some(
        (n) =>
          n.nodeType === VNode.ELEMENT_NODE &&
          /^(p|ul|ol|h[1-6]|table|pre|blockquote|div)$/i.test((n as VElement).tagName || "")
      );
      if (!hasBlock) {
        const wrapper = doc.createElement("p");
        for (const child of [...(newLi.childNodes as VNode[])]) {
          wrapper.appendChild(child);
        }
        newLi.appendChild(wrapper);
      }

      newUl.appendChild(newLi);
    }
    taskList.replaceWith(newUl);
  }
}

// ─── 15. Date elements → text ───────────────────────────────────────────────

function transformDates(doc: DocRoot): void {
  const times = doc.querySelectorAll("time");
  for (const time of times) {
    time.replaceWith(doc.createTextNode(time.textContent || ""));
  }
}

// ─── 16. Tables — strip Confluence classes ──────────────────────────────────

function transformTables(doc: DocRoot): void {
  const confluenceClasses = ["confluenceTable", "confluenceTh", "confluenceTd", "wrapped"];
  for (const cls of confluenceClasses) {
    const elements = doc.querySelectorAll(`.${cls}`);
    for (const el of elements) {
      el.classList.remove(cls);
      if (!el.className.trim()) {
        el.removeAttribute("class");
      }
    }
  }
}

// ─── 17. Links cleanup ─────────────────────────────────────────────────────

function transformLinks(doc: DocRoot): void {
  const links = doc.querySelectorAll("a");
  for (const link of links) {
    // Unresolved links → just text
    if (link.classList.contains("unresolved")) {
      link.replaceWith(doc.createTextNode(link.textContent || ""));
      continue;
    }

    // Internal Confluence links (relative .html hrefs) → text only
    const href = link.getAttribute("href") || "";
    if (href.endsWith(".html") && !href.startsWith("http")) {
      link.replaceWith(doc.createTextNode(link.textContent || ""));
      continue;
    }

    // Strip external-link class
    if (link.classList.contains("external-link")) {
      link.classList.remove("external-link");
      if (!link.className.trim()) {
        link.removeAttribute("class");
      }
    }

    // Strip rel="nofollow"
    if (link.getAttribute("rel") === "nofollow") {
      link.removeAttribute("rel");
    }
  }
}

// ─── 18. Heading anchors ────────────────────────────────────────────────────

function transformHeadingAnchors(doc: DocRoot): void {
  for (const level of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
    const headings = doc.querySelectorAll(level);
    for (const heading of headings) {
      // Remove auto-generated IDs
      heading.removeAttribute("id");

      const anchors = heading.querySelectorAll("a");
      for (const anchor of anchors) {
        if (anchor.hasAttribute("name") && !anchor.hasAttribute("href")) {
          anchor.replaceWith(...(anchor.childNodes as VNode[]));
        }
      }
    }
  }
}

// ─── 19. Confluence anchors ─────────────────────────────────────────────────

function removeConfluenceAnchors(doc: DocRoot): void {
  const anchors = doc.querySelectorAll("span.confluence-anchor-link");
  for (const anchor of anchors) {
    anchor.remove();
  }
}

// ─── 20. Plugin artifacts ───────────────────────────────────────────────────

function removePluginArtifacts(doc: DocRoot): void {
  // AUI dropdown menus and inline dialogs — pure UI chrome
  for (const el of doc.querySelectorAll("aui-dropdown-menu")) el.remove();
  for (const el of doc.querySelectorAll("aui-inline-dialog")) el.remove();

  // Plugin tab-meta blocks: extract "Header: Value" pairs from the nested tables
  for (const meta of doc.querySelectorAll("div.plugin-tabmeta-details")) {
    const tables = meta.querySelectorAll("table");
    const pairs: { label: string; value: string }[] = [];

    for (const table of tables) {
      const th = table.querySelector("th");
      const label = (th?.textContent || "").trim();
      // Value is typically in a status lozenge span or the td text
      const td = table.querySelector("td");
      const lozenge = td?.querySelector("span.aui-lozenge");
      const value = (lozenge?.textContent || td?.textContent || "").trim();
      if (label && value) {
        pairs.push({ label, value });
      }
    }

    if (pairs.length > 0) {
      const p = doc.createElement("p");
      const text = pairs.map((pair) => `${pair.label}: ${pair.value}`).join(" | ");
      const strong = doc.createElement("strong");
      strong.appendChild(doc.createTextNode(text));
      p.appendChild(strong);
      meta.replaceWith(p);
    } else {
      meta.remove();
    }
  }

  // data-aui-trigger links that wrap lozenges — unwrap to keep children
  for (const el of doc.querySelectorAll("a[data-aui-trigger]")) {
    el.replaceWith(...(el.childNodes as VNode[]));
  }
}

// ─── 21. Horizontal rules ──────────────────────────────────────────────────

function transformHorizontalRules(doc: DocRoot): void {
  const hrs = doc.querySelectorAll("hr");
  for (const hr of hrs) {
    hr.removeAttribute("class");
  }
}

// ─── 22. Fix list nesting ───────────────────────────────────────────────────

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

// ─── 23. Block spacing cleanup ──────────────────────────────────────────────

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

function meaningfulSibling(children: VNode[], index: number, dir: -1 | 1): VNode | null {
  for (let i = index + dir; i >= 0 && i < children.length; i += dir) {
    if (!(children[i].nodeType === VNode.TEXT_NODE && !(children[i].textContent || "").trim())) {
      return children[i];
    }
  }
  return null;
}

function cleanUpBlockSpacing(node: VNode): void {
  if (node.nodeType === VNode.ELEMENT_NODE) {
    const tag = (node as VElement).tagName?.toLowerCase();
    if (tag === "pre" || tag === "code") return;
  }

  for (const child of [...(node.childNodes as VNode[])]) {
    cleanUpBlockSpacing(child);
  }

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
        break;
      }
    }
  }

  if (node.nodeType === VNode.ELEMENT_NODE) {
    const el = node as VElement;
    const tag = el.tagName?.toLowerCase() || "";

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

// ─── 24. Separate consecutive lists ─────────────────────────────────────────

function separateConsecutiveLists(doc: DocRoot): void {
  walkAndSeparateLists(doc, doc);
}

function walkAndSeparateLists(node: VNode, doc: DocRoot): void {
  for (const child of [...(node.childNodes as VNode[])]) {
    if (child.nodeType === VNode.ELEMENT_NODE) {
      walkAndSeparateLists(child, doc);
    }
  }

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

  for (const el of toSeparate.reverse()) {
    const separator = doc.createElement("p");
    node.insertBefore(separator, el);
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export type NormalizeConfluenceHTMLOptions = {
  /** Skip body extraction, image transforms, and attachment link transforms.
   *  Use when running after Silo's ContentParser which already handled assets. */
  postParser?: boolean;
};

export function normalizeConfluenceHTML(html: string, options?: NormalizeConfluenceHTMLOptions): string {
  const input = !html || !html.trim() ? "<p></p>" : html;
  const postParser = options?.postParser ?? false;

  let doc: DocRoot = parseHTML(input);

  // Apply transforms in order
  // When running post-parser, skip steps that overlap with Silo's asset pipeline
  if (!postParser) doc = extractBodyContent(doc);
  transformConfluenceEmoticons(doc);
  removeScriptsAndStyles(doc);
  removeUnwantedMacros(doc);
  transformCodeBlocks(doc);
  transformInformationMacros(doc);
  transformPanels(doc);
  transformInlineColors(doc);
  transformContentLayouts(doc);
  flattenSectionMacros(doc);
  unwrapTableWrappers(doc);
  transformUserMentions(doc);
  if (!postParser) transformImages(doc);
  if (!postParser) transformAttachmentLinks(doc);
  transformJiraIssueMacros(doc);
  if (!postParser) transformStatusLozenges(doc);
  transformInlineTasks(doc);
  transformDates(doc);
  transformTables(doc);
  transformLinks(doc);
  transformHeadingAnchors(doc);
  removeConfluenceAnchors(doc);
  removePluginArtifacts(doc);
  transformHorizontalRules(doc);
  fixListNesting(doc);
  cleanUpBlockSpacing(doc);
  separateConsecutiveLists(doc);

  // Round-trip through Tiptap schema to strip nodes the editor won't understand
  const rendered = sanitizeHTMLThroughSchema(doc.render());

  // Guarantee at least one empty paragraph so the Plane editor has a valid document
  return rendered || "<p></p>";
}
