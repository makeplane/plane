// Export all locale files to make them accessible from the package root
export { default as enCore } from "./en/core.json";
export { default as enTranslations } from "./en/translations.json";
export { default as enAccessibility } from "./en/accessibility.json";
export { default as enEditor } from "./en/editor.json";

// Export locale data for all supported languages
export const locales = {
  en: {
    core: () => import("./en/core.json"),
    translations: () => import("./en/translations.json"),
    accessibility: () => import("./en/accessibility.json"),
    editor: () => import("./en/editor.json"),
  },
  fr: {
    translations: () => import("./fr/translations.json"),
    accessibility: () => import("./fr/accessibility.json"),
    editor: () => import("./fr/editor.json"),
  },
  es: {
    translations: () => import("./es/translations.json"),
    accessibility: () => import("./es/accessibility.json"),
    editor: () => import("./es/editor.json"),
  },
  ja: {
    translations: () => import("./ja/translations.json"),
    accessibility: () => import("./ja/accessibility.json"),
    editor: () => import("./ja/editor.json"),
  },
  "zh-CN": {
    translations: () => import("./zh-CN/translations.json"),
    accessibility: () => import("./zh-CN/accessibility.json"),
    editor: () => import("./zh-CN/editor.json"),
  },
  "zh-TW": {
    translations: () => import("./zh-TW/translations.json"),
    accessibility: () => import("./zh-TW/accessibility.json"),
    editor: () => import("./zh-TW/editor.json"),
  },
  ru: {
    translations: () => import("./ru/translations.json"),
    accessibility: () => import("./ru/accessibility.json"),
    editor: () => import("./ru/editor.json"),
  },
  it: {
    translations: () => import("./it/translations.json"),
    accessibility: () => import("./it/accessibility.json"),
    editor: () => import("./it/editor.json"),
  },
  cs: {
    translations: () => import("./cs/translations.json"),
    accessibility: () => import("./cs/accessibility.json"),
    editor: () => import("./cs/editor.json"),
  },
  sk: {
    translations: () => import("./sk/translations.json"),
    accessibility: () => import("./sk/accessibility.json"),
    editor: () => import("./sk/editor.json"),
  },
  de: {
    translations: () => import("./de/translations.json"),
    accessibility: () => import("./de/accessibility.json"),
    editor: () => import("./de/editor.json"),
  },
  ua: {
    translations: () => import("./ua/translations.json"),
    accessibility: () => import("./ua/accessibility.json"),
    editor: () => import("./ua/editor.json"),
  },
  pl: {
    translations: () => import("./pl/translations.json"),
    accessibility: () => import("./pl/accessibility.json"),
    editor: () => import("./pl/editor.json"),
  },
  ko: {
    translations: () => import("./ko/translations.json"),
    accessibility: () => import("./ko/accessibility.json"),
    editor: () => import("./ko/editor.json"),
  },
  "pt-BR": {
    translations: () => import("./pt-BR/translations.json"),
    accessibility: () => import("./pt-BR/accessibility.json"),
    editor: () => import("./pt-BR/editor.json"),
  },
  id: {
    translations: () => import("./id/translations.json"),
    accessibility: () => import("./id/accessibility.json"),
    editor: () => import("./id/editor.json"),
  },
  ro: {
    translations: () => import("./ro/translations.json"),
    accessibility: () => import("./ro/accessibility.json"),
    editor: () => import("./ro/editor.json"),
  },
  "vi-VN": {
    translations: () => import("./vi-VN/translations.json"),
    accessibility: () => import("./vi-VN/accessibility.json"),
    editor: () => import("./vi-VN/editor.json"),
  },
  "tr-TR": {
    translations: () => import("./tr-TR/translations.json"),
    accessibility: () => import("./tr-TR/accessibility.json"),
    editor: () => import("./tr-TR/editor.json"),
  },
};
