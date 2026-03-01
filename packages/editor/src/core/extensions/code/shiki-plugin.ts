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

import { createHighlightPlugin } from "prosemirror-highlight";
import { createParser } from "prosemirror-highlight/shiki";
import type { Plugin } from "@tiptap/pm/state";
import type { Parser } from "prosemirror-highlight";
import type { HighlighterCore } from "@shikijs/core";

import { getHighlighter, isLanguageSupported, loadLanguage, resolveLanguage } from "./utils/shiki";

let cachedParser: Parser | null = null;
let cachedHighlighter: HighlighterCore | null = null;

/**
 * Lazy parser that handles dynamic language loading.
 * Returns a promise when highlighter or language needs to be loaded,
 * otherwise returns decorations immediately.
 */
const lazyParser: Parser = (options) => {
  const { content, pos, language, size } = options;

  // If highlighter not yet loaded, load it
  if (!cachedHighlighter) {
    return getHighlighter().then((h) => {
      cachedHighlighter = h;
      return;
    });
  }

  // Resolve language alias to canonical name
  const resolvedLang = language ? resolveLanguage(language) : undefined;

  // If unsupported or empty, fall back to plaintext and never try to load
  const effectiveLang = resolvedLang && isLanguageSupported(resolvedLang) ? resolvedLang : "plaintext";

  // Only load languages that are both supported *and* not already loaded.
  // Plaintext is built into Shiki core and doesn't need loading.
  if (effectiveLang !== "plaintext" && !cachedHighlighter.getLoadedLanguages().includes(effectiveLang)) {
    return loadLanguage(effectiveLang).then(() => {
      // Language loaded, plugin will re-run parser
      return;
    });
  }

  // Create parser if needed
  if (!cachedParser) {
    cachedParser = createParser(cachedHighlighter, {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
    });
  }

  // Return decorations using the effective language
  return cachedParser({
    content,
    pos,
    language: effectiveLang,
    size,
  });
};

/**
 * Creates a ProseMirror plugin that applies Shiki syntax highlighting
 * decorations to code blocks.
 *
 * Features:
 * - Lazy-loads the Shiki highlighter on first use
 * - Dynamically loads language grammars on demand
 * - Supports both light and dark themes
 * - No perceivable input lag when typing
 *
 * @param name - The node type name for code blocks (e.g., "codeBlock")
 */
export function ShikiPlugin({ name }: { name: string }): Plugin {
  return createHighlightPlugin({
    parser: lazyParser,
    nodeTypes: [name],
    languageExtractor: (node) => node.attrs.language as string | undefined,
  });
}
