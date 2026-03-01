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

function escapeHtml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function extractTextFromDivs(divsHtml: string): string {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = divsHtml.replace(/<br\s*\/?>/gi, "\n");

  const lines: string[] = [];
  for (const child of Array.from(wrapper.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName === "DIV") {
      lines.push(child.textContent ?? "");
    } else {
      lines.push(child.textContent ?? "");
    }
  }
  return lines.join("\n");
}

/**
 * Normalizes `<pre>` blocks that contain `<div>` children into proper
 * `<pre><code>...</code></pre>` structure. This prevents ProseMirror's
 * browser-based parser from splitting code blocks when it encounters
 * block-level elements inside `<pre>`.
 *
 * This is needed because clipboard HTML from various sources (e.g., Slack,
 * web pages) often wraps code content in `<div>` tags inside `<pre>`,
 * which is technically invalid HTML and causes browser parsers to
 * restructure the DOM in ways that corrupt the editor's document model.
 */
export function normalizeCodeBlockHTML(html: string): string {
  if (!html.includes("<pre")) return html;

  return html.replace(
    /<pre([^>]*)>\s*((?:<div[^>]*>[\s\S]*?<\/div>\s*)+)\s*<\/pre>/gi,
    (_match, preAttrs: string, divsHtml: string) => {
      const text = extractTextFromDivs(divsHtml).replace(/\r\n?/g, "\n");
      const safe = escapeHtml(text);
      return `<pre${preAttrs}><code>${safe}</code></pre>`;
    }
  );
}
