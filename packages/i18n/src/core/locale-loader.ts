/**
 * Locale Loader
 *
 * Import map for locale files. Each entry is a lazy import function
 * that returns the translations. This allows bundlers (Vite/webpack)
 * to properly code-split each locale file.
 *
 * Currently uses a single "translation" namespace per locale.
 * Can be extended to multiple namespaces for code-splitting in the future.
 */

import type { LanguageCode, Namespace } from "../config/languages";

type TranslationData = Record<string, unknown>;
type LocaleImportFn = () => Promise<{ default: TranslationData }>;

/**
 * Import map for all locale files
 * Structure: localeImports[language][namespace] = () => import("...")
 */
const localeImports: Record<string, Record<string, LocaleImportFn>> = {
  en: {
    translation: () => import("../locales/en/translation.json"),
  },
  fr: {
    translation: () => import("../locales/fr/translation.json"),
  },
  es: {
    translation: () => import("../locales/es/translation.json"),
  },
  ja: {
    translation: () => import("../locales/ja/translation.json"),
  },
  "zh-CN": {
    translation: () => import("../locales/zh-CN/translation.json"),
  },
  "zh-TW": {
    translation: () => import("../locales/zh-TW/translation.json"),
  },
  ru: {
    translation: () => import("../locales/ru/translation.json"),
  },
  it: {
    translation: () => import("../locales/it/translation.json"),
  },
  cs: {
    translation: () => import("../locales/cs/translation.json"),
  },
  sk: {
    translation: () => import("../locales/sk/translation.json"),
  },
  de: {
    translation: () => import("../locales/de/translation.json"),
  },
  uk: {
    translation: () => import("../locales/uk/translation.json"),
  },
  pl: {
    translation: () => import("../locales/pl/translation.json"),
  },
  ko: {
    translation: () => import("../locales/ko/translation.json"),
  },
  "pt-BR": {
    translation: () => import("../locales/pt-BR/translation.json"),
  },
  id: {
    translation: () => import("../locales/id/translation.json"),
  },
  ro: {
    translation: () => import("../locales/ro/translation.json"),
  },
  vi: {
    translation: () => import("../locales/vi/translation.json"),
  },
  tr: {
    translation: () => import("../locales/tr/translation.json"),
  },
};

/**
 * Load translations for a specific language and namespace
 *
 * @param language - The language code
 * @param namespace - The namespace to load
 * @returns The translations data, or empty object if not found
 */
export async function loadLocale(language: LanguageCode, namespace: Namespace): Promise<TranslationData> {
  const langImports = localeImports[language];
  if (!langImports) {
    console.warn(`[i18n] Unknown language: ${language}`);
    return {};
  }

  const importFn = langImports[namespace];
  if (!importFn) {
    console.warn(`[i18n] Unknown namespace: ${namespace} for language: ${language}`);
    return {};
  }

  try {
    const module = await importFn();
    return module.default || module;
  } catch (error) {
    console.warn(`[i18n] Failed to load ${namespace} for ${language}:`, error);
    return {};
  }
}
