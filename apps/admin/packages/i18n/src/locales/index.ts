// Export all locale files to make them accessible from the package root
export { default as enCore } from "./en/core";
export { default as enTranslations } from "./en/translations";
export { default as enAccessibility } from "./en/accessibility";
export { default as enEditor } from "./en/editor";

// Export locale data for all supported languages
export const locales = {
  en: {
    core: () => import("./en/core"),
    translations: () => import("./en/translations"),
    accessibility: () => import("./en/accessibility"),
    editor: () => import("./en/editor"),
  },
  fr: {
    translations: () => import("./fr/translations"),
    accessibility: () => import("./fr/accessibility"),
    editor: () => import("./fr/editor"),
  },
  es: {
    translations: () => import("./es/translations"),
    accessibility: () => import("./es/accessibility"),
    editor: () => import("./es/editor"),
  },
  ja: {
    translations: () => import("./ja/translations"),
    accessibility: () => import("./ja/accessibility"),
    editor: () => import("./ja/editor"),
  },
  "zh-CN": {
    translations: () => import("./zh-CN/translations"),
    accessibility: () => import("./zh-CN/accessibility"),
    editor: () => import("./zh-CN/editor"),
  },
  "zh-TW": {
    translations: () => import("./zh-TW/translations"),
    accessibility: () => import("./zh-TW/accessibility"),
    editor: () => import("./zh-TW/editor"),
  },
  ru: {
    translations: () => import("./ru/translations"),
    accessibility: () => import("./ru/accessibility"),
    editor: () => import("./ru/editor"),
  },
  it: {
    translations: () => import("./it/translations"),
    accessibility: () => import("./it/accessibility"),
    editor: () => import("./it/editor"),
  },
  cs: {
    translations: () => import("./cs/translations"),
    accessibility: () => import("./cs/accessibility"),
    editor: () => import("./cs/editor"),
  },
  sk: {
    translations: () => import("./sk/translations"),
    accessibility: () => import("./sk/accessibility"),
    editor: () => import("./sk/editor"),
  },
  de: {
    translations: () => import("./de/translations"),
    accessibility: () => import("./de/accessibility"),
    editor: () => import("./de/editor"),
  },
  ua: {
    translations: () => import("./ua/translations"),
    accessibility: () => import("./ua/accessibility"),
    editor: () => import("./ua/editor"),
  },
  pl: {
    translations: () => import("./pl/translations"),
    accessibility: () => import("./pl/accessibility"),
    editor: () => import("./pl/editor"),
  },
  ko: {
    translations: () => import("./ko/translations"),
    accessibility: () => import("./ko/accessibility"),
    editor: () => import("./ko/editor"),
  },
  "pt-BR": {
    translations: () => import("./pt-BR/translations"),
    accessibility: () => import("./pt-BR/accessibility"),
    editor: () => import("./pt-BR/editor"),
  },
  id: {
    translations: () => import("./id/translations"),
    accessibility: () => import("./id/accessibility"),
    editor: () => import("./id/editor"),
  },
  ro: {
    translations: () => import("./ro/translations"),
    accessibility: () => import("./ro/accessibility"),
    editor: () => import("./ro/editor"),
  },
  "vi-VN": {
    translations: () => import("./vi-VN/translations"),
    accessibility: () => import("./vi-VN/accessibility"),
    editor: () => import("./vi-VN/editor"),
  },
  "tr-TR": {
    translations: () => import("./tr-TR/translations"),
    accessibility: () => import("./tr-TR/accessibility"),
    editor: () => import("./tr-TR/editor"),
  },
};
