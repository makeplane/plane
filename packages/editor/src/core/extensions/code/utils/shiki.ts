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

import { createHighlighterCore } from "@shikijs/core";
import type { HighlighterCore, LanguageRegistration } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import { CODE_LANGUAGES } from "../constants";

// Singleton highlighter instance
let highlighter: HighlighterCore | null = null;
let highlighterPromise: Promise<HighlighterCore> | null = null;

// Set of languages currently being loaded to prevent duplicate loads
const loadingLanguages = new Set<string>();

// Cache for resolved language aliases
const resolvedLanguageCache = new Map<string, string>();

// Build alias map from CODE_LANGUAGES (single source of truth)
const LANGUAGE_ALIASES: Record<string, string> = {};
for (const lang of CODE_LANGUAGES) {
  if (lang.aliases) {
    for (const alias of lang.aliases) {
      LANGUAGE_ALIASES[alias] = lang.id;
    }
  }
}

/**
 * Creates a standalone mermaid grammar from the original markdown-injection grammar.
 */
async function createStandaloneMermaidGrammar(): Promise<{ default: LanguageRegistration[] }> {
  const originalModule = await import("@shikijs/langs-precompiled/mermaid");
  const originalGrammar = originalModule.default[0];

  return {
    default: [
      {
        ...originalGrammar,
        name: "mermaid",
        scopeName: "source.mermaid",
        patterns: [{ include: "#mermaid" }],
      },
    ],
  };
}

// Dynamic import map for Shiki languages.
// NOTE: These must be explicit string literals for bundlers to statically analyze.
// Do not refactor to use template strings like `import(\`@shikijs/langs-precompiled/${id}\`)`.
const LANGUAGE_IMPORTS: Record<string, () => Promise<{ default: LanguageRegistration[] }>> = {
  typescript: () => import("@shikijs/langs-precompiled/typescript"),
  javascript: () => import("@shikijs/langs-precompiled/javascript"),
  jsx: () => import("@shikijs/langs-precompiled/jsx"),
  tsx: () => import("@shikijs/langs-precompiled/tsx"),
  json: () => import("@shikijs/langs-precompiled/json"),
  yaml: () => import("@shikijs/langs-precompiled/yaml"),
  markdown: () => import("@shikijs/langs-precompiled/markdown"),
  html: () => import("@shikijs/langs-precompiled/html"),
  css: () => import("@shikijs/langs-precompiled/css"),
  scss: () => import("@shikijs/langs-precompiled/scss"),
  python: () => import("@shikijs/langs-precompiled/python"),
  java: () => import("@shikijs/langs-precompiled/java"),
  c: () => import("@shikijs/langs-precompiled/c"),
  cpp: () => import("@shikijs/langs-precompiled/cpp"),
  csharp: () => import("@shikijs/langs-precompiled/csharp"),
  go: () => import("@shikijs/langs-precompiled/go"),
  rust: () => import("@shikijs/langs-precompiled/rust"),
  ruby: () => import("@shikijs/langs-precompiled/ruby"),
  php: () => import("@shikijs/langs-precompiled/php"),
  swift: () => import("@shikijs/langs-precompiled/swift"),
  kotlin: () => import("@shikijs/langs-precompiled/kotlin"),
  scala: () => import("@shikijs/langs-precompiled/scala"),
  r: () => import("@shikijs/langs-precompiled/r"),
  julia: () => import("@shikijs/langs-precompiled/julia"),
  lua: () => import("@shikijs/langs-precompiled/lua"),
  haskell: () => import("@shikijs/langs-precompiled/haskell"),
  sql: () => import("@shikijs/langs-precompiled/sql"),
  shellscript: () => import("@shikijs/langs-precompiled/shellscript"),
  graphql: () => import("@shikijs/langs-precompiled/graphql"),
  xml: () => import("@shikijs/langs-precompiled/xml"),
  latex: () => import("@shikijs/langs-precompiled/latex"),
  mermaid: createStandaloneMermaidGrammar,
};

/**
 * Resolves a language alias to its canonical id.
 */
export function resolveLanguage(lang: string): string {
  const cached = resolvedLanguageCache.get(lang);
  if (cached) return cached;

  const normalized = lang.toLowerCase().trim();
  const resolved = LANGUAGE_ALIASES[normalized] ?? normalized;

  resolvedLanguageCache.set(lang, resolved);
  return resolved;
}

/**
 * Gets the cached Shiki highlighter instance, creating it if necessary.
 */
export async function getHighlighter(): Promise<HighlighterCore> {
  if (highlighter) return highlighter;
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = Promise.all([
    import("@shikijs/themes/github-dark"),
    import("@shikijs/themes/github-light"),
  ]).then(([githubDarkModule, githubLightModule]) =>
    createHighlighterCore({
      themes: [githubDarkModule.default, githubLightModule.default],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    })
  );

  highlighter = await highlighterPromise;
  return highlighter;
}

/**
 * Loads a language into the highlighter if not already loaded.
 */
export async function loadLanguage(lang: string): Promise<string> {
  const resolvedLang = resolveLanguage(lang);

  if (!LANGUAGE_IMPORTS[resolvedLang]) return "plaintext";

  const shiki = await getHighlighter();
  if (shiki.getLoadedLanguages().includes(resolvedLang)) return resolvedLang;

  if (loadingLanguages.has(resolvedLang)) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return shiki.getLoadedLanguages().includes(resolvedLang) ? resolvedLang : "plaintext";
  }

  try {
    loadingLanguages.add(resolvedLang);
    const langModule = await LANGUAGE_IMPORTS[resolvedLang]();
    await shiki.loadLanguage(...langModule.default);
    return resolvedLang;
  } catch (error) {
    console.warn(`[Shiki] Failed to load language "${resolvedLang}":`, error);
    return "plaintext";
  } finally {
    loadingLanguages.delete(resolvedLang);
  }
}

/**
 * Checks if a language is currently loaded in the highlighter.
 */
export function isLanguageLoaded(lang: string): boolean {
  const resolvedLang = resolveLanguage(lang);
  if (resolvedLang === "plaintext") return true;
  return highlighter?.getLoadedLanguages().includes(resolvedLang) ?? false;
}

/**
 * Checks if a language is supported by our highlighter.
 */
export function isLanguageSupported(lang: string): boolean {
  const resolvedLang = resolveLanguage(lang);
  return resolvedLang in LANGUAGE_IMPORTS || resolvedLang === "plaintext";
}
