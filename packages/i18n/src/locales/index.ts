// Export all locale files to make them accessible from the package root
export { default as enCore } from "./en/core.json";
export { default as enTranslations } from "./en/translations.json";
export { default as enAccessibility } from "./en/accessibility.json";
export { default as enEditor } from "./en/editor.json";
export { default as enCoreExtended } from "./en/core-extended.json";
export { default as enTranslationsExtended } from "./en/translations-extended.json";
export { default as enEditorExtended } from "./en/editor-extended.json";

// Define the locale data structure type
type LocaleData = {
  [key: string]: () => Promise<{ default: Record<string, unknown> }>;
};

// Export locale data for all supported languages
export const locales: Record<string, LocaleData> = {
  en: {
    core: () => import("./en/core.json"),
    translations: () => import("./en/translations.json"),
    accessibility: () => import("./en/accessibility.json"),
    editor: () => import("./en/editor.json"),
    "core-extended": () => import("./en/core-extended.json"),
    "translations-extended": () => import("./en/translations-extended.json"),
    "editor-extended": () => import("./en/editor-extended.json"),
  },
  fr: {
    translations: () => import("./fr/translations.json"),
    accessibility: () => import("./fr/accessibility.json"),
    editor: () => import("./fr/editor.json"),
    "translations-extended": () => import("./fr/translations-extended.json"),
    "editor-extended": () => import("./fr/editor-extended.json"),
  },
  es: {
    translations: () => import("./es/translations.json"),
    accessibility: () => import("./es/accessibility.json"),
    editor: () => import("./es/editor.json"),
    "translations-extended": () => import("./es/translations-extended.json"),
    "editor-extended": () => import("./es/editor-extended.json"),
  },
  ja: {
    translations: () => import("./ja/translations.json"),
    accessibility: () => import("./ja/accessibility.json"),
    editor: () => import("./ja/editor.json"),
    "translations-extended": () => import("./ja/translations-extended.json"),
    "editor-extended": () => import("./ja/editor-extended.json"),
  },
  "zh-CN": {
    translations: () => import("./zh-CN/translations.json"),
    accessibility: () => import("./zh-CN/accessibility.json"),
    editor: () => import("./zh-CN/editor.json"),
    "translations-extended": () => import("./zh-CN/translations-extended.json"),
    "editor-extended": () => import("./zh-CN/editor-extended.json"),
  },
  "zh-TW": {
    translations: () => import("./zh-TW/translations.json"),
    accessibility: () => import("./zh-TW/accessibility.json"),
    editor: () => import("./zh-TW/editor.json"),
    "translations-extended": () => import("./zh-TW/translations-extended.json"),
    "editor-extended": () => import("./zh-TW/editor-extended.json"),
  },
  ru: {
    translations: () => import("./ru/translations.json"),
    accessibility: () => import("./ru/accessibility.json"),
    editor: () => import("./ru/editor.json"),
    "translations-extended": () => import("./ru/translations-extended.json"),
    "editor-extended": () => import("./ru/editor-extended.json"),
  },
  it: {
    translations: () => import("./it/translations.json"),
    accessibility: () => import("./it/accessibility.json"),
    editor: () => import("./it/editor.json"),
    "translations-extended": () => import("./it/translations-extended.json"),
    "editor-extended": () => import("./it/editor-extended.json"),
  },
  cs: {
    translations: () => import("./cs/translations.json"),
    accessibility: () => import("./cs/accessibility.json"),
    editor: () => import("./cs/editor.json"),
    "translations-extended": () => import("./cs/translations-extended.json"),
    "editor-extended": () => import("./cs/editor-extended.json"),
  },
  sk: {
    translations: () => import("./sk/translations.json"),
    accessibility: () => import("./sk/accessibility.json"),
    editor: () => import("./sk/editor.json"),
    "translations-extended": () => import("./sk/translations-extended.json"),
    "editor-extended": () => import("./sk/editor-extended.json"),
  },
  de: {
    translations: () => import("./de/translations.json"),
    accessibility: () => import("./de/accessibility.json"),
    editor: () => import("./de/editor.json"),
    "translations-extended": () => import("./de/translations-extended.json"),
    "editor-extended": () => import("./de/editor-extended.json"),
  },
  ua: {
    translations: () => import("./ua/translations.json"),
    accessibility: () => import("./ua/accessibility.json"),
    editor: () => import("./ua/editor.json"),
    "translations-extended": () => import("./ua/translations-extended.json"),
    "editor-extended": () => import("./ua/editor-extended.json"),
  },
  pl: {
    translations: () => import("./pl/translations.json"),
    accessibility: () => import("./pl/accessibility.json"),
    editor: () => import("./pl/editor.json"),
    "translations-extended": () => import("./pl/translations-extended.json"),
    "editor-extended": () => import("./pl/editor-extended.json"),
  },
  ko: {
    translations: () => import("./ko/translations.json"),
    accessibility: () => import("./ko/accessibility.json"),
    editor: () => import("./ko/editor.json"),
    "translations-extended": () => import("./ko/translations-extended.json"),
    "editor-extended": () => import("./ko/editor-extended.json"),
  },
  "pt-BR": {
    translations: () => import("./pt-BR/translations.json"),
    accessibility: () => import("./pt-BR/accessibility.json"),
    editor: () => import("./pt-BR/editor.json"),
    "translations-extended": () => import("./pt-BR/translations-extended.json"),
    "editor-extended": () => import("./pt-BR/editor-extended.json"),
  },
  id: {
    translations: () => import("./id/translations.json"),
    accessibility: () => import("./id/accessibility.json"),
    editor: () => import("./id/editor.json"),
    "translations-extended": () => import("./id/translations-extended.json"),
    "editor-extended": () => import("./id/editor-extended.json"),
  },
  ro: {
    translations: () => import("./ro/translations.json"),
    accessibility: () => import("./ro/accessibility.json"),
    editor: () => import("./ro/editor.json"),
    "translations-extended": () => import("./ro/translations-extended.json"),
    "editor-extended": () => import("./ro/editor-extended.json"),
  },
  "vi-VN": {
    translations: () => import("./vi-VN/translations.json"),
    accessibility: () => import("./vi-VN/accessibility.json"),
    editor: () => import("./vi-VN/editor.json"),
    "translations-extended": () => import("./vi-VN/translations-extended.json"),
    "editor-extended": () => import("./vi-VN/editor-extended.json"),
  },
  "tr-TR": {
    translations: () => import("./tr-TR/translations.json"),
    accessibility: () => import("./tr-TR/accessibility.json"),
    editor: () => import("./tr-TR/editor.json"),
    "translations-extended": () => import("./tr-TR/translations-extended.json"),
    "editor-extended": () => import("./tr-TR/editor-extended.json"),
  },
};
