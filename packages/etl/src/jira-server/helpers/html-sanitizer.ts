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

import { generateJSON, generateHTML } from "@tiptap/html";
import type { Extensions, JSONContent } from "@tiptap/core";
import { parseHTML, VElement } from "zeed-dom";
import { CoreEditorExtensionsWithoutProps, DocumentEditorExtensionsWithoutProps } from "@plane/editor/lib";

const EXTENSIONS: Extensions = [...CoreEditorExtensionsWithoutProps, ...DocumentEditorExtensionsWithoutProps];
const LANGUAGE_CLASS_PREFIX = "language-";

/**
 * Extract code-block languages from HTML before the Tiptap round-trip.
 *
 * zeed-dom (used by @tiptap/html's generateJSON) does not implement
 * `firstElementChild` on elements, so the CodeBlock extension's parseHTML
 * callback silently fails to read the `<code class="language-*">` class,
 * stripping language metadata.  We extract languages here and patch
 * them back into the ProseMirror JSON after parsing.
 */
function extractCodeBlockLanguages(html: string): string[] {
  const doc = parseHTML(html);
  const pres = doc.querySelectorAll("pre");
  const languages: string[] = [];
  for (const pre of pres) {
    const code = pre.firstChild as VElement | undefined;
    const cls: string = code?.getAttribute?.("class") ?? code?.className ?? "";
    const lang = cls
      .split(/\s+/)
      .find((c) => c.startsWith(LANGUAGE_CLASS_PREFIX))
      ?.replace(LANGUAGE_CLASS_PREFIX, "");
    languages.push(lang ?? "");
  }
  return languages;
}

/**
 * Walk JSON tree and patch codeBlock nodes with the pre-extracted languages.
 */
function patchCodeBlockLanguages(json: JSONContent, languages: string[]): void {
  let idx = 0;
  const walk = (node: JSONContent) => {
    if (node.type === "codeBlock") {
      const lang = languages[idx++];
      if (lang) {
        node.attrs = { ...node.attrs, language: lang };
      }
    }
    node.content?.forEach(walk);
  };
  walk(json);
}

/**
 * Round-trip HTML through Plane's Tiptap schema to strip anything the editor won't understand.
 * HTML → ProseMirror JSON → HTML ensures only schema-valid nodes survive.
 */
export function sanitizeHTMLThroughSchema(html: string): string {
  if (!html || html === "<p></p>") return html;
  const languages = extractCodeBlockLanguages(html);
  const json = generateJSON(html, EXTENSIONS) as JSONContent;
  patchCodeBlockLanguages(json, languages);
  return generateHTML(json, EXTENSIONS);
}
