// Export all locale files to make them accessible from the package root
export { default as enCore } from "./en/core";
export { default as enTranslations } from "./en/translations";
export { default as enAccessibility } from "./en/accessibility";
export { default as enEditor } from "./en/editor";
export { default as enEmptyState } from "./en/empty-state";

// Export locale data for all supported languages
export const locales = {
  en: {
    core: () => import("./en/core"),
    translations: () => import("./en/translations"),
    accessibility: () => import("./en/accessibility"),
    editor: () => import("./en/editor"),
    "empty-state": () => import("./en/empty-state"),
  },
  fr: {
    translations: () => import("./fr/translations"),
    accessibility: () => import("./fr/accessibility"),
    editor: () => import("./fr/editor"),
    "empty-state": () => import("./fr/empty-state"),
  },
  es: {
    translations: () => import("./es/translations"),
    accessibility: () => import("./es/accessibility"),
    editor: () => import("./es/editor"),
    "empty-state": () => import("./es/empty-state"),
  },
  ja: {
    translations: () => import("./ja/translations"),
    accessibility: () => import("./ja/accessibility"),
    editor: () => import("./ja/editor"),
    "empty-state": () => import("./ja/empty-state"),
  },
  "zh-CN": {
    translations: () => import("./zh-CN/translations"),
    accessibility: () => import("./zh-CN/accessibility"),
    editor: () => import("./zh-CN/editor"),
    "empty-state": () => import("./zh-CN/empty-state"),
  },
  "zh-TW": {
    translations: () => import("./zh-TW/translations"),
    accessibility: () => import("./zh-TW/accessibility"),
    editor: () => import("./zh-TW/editor"),
    "empty-state": () => import("./zh-TW/empty-state"),
  },
  ru: {
    translations: () => import("./ru/translations"),
    accessibility: () => import("./ru/accessibility"),
    editor: () => import("./ru/editor"),
    "empty-state": () => import("./ru/empty-state"),
  },
  it: {
    translations: () => import("./it/translations"),
    accessibility: () => import("./it/accessibility"),
    editor: () => import("./it/editor"),
    "empty-state": () => import("./it/empty-state"),
  },
  cs: {
    translations: () => import("./cs/translations"),
    accessibility: () => import("./cs/accessibility"),
    editor: () => import("./cs/editor"),
    "empty-state": () => import("./cs/empty-state"),
  },
  sk: {
    translations: () => import("./sk/translations"),
    accessibility: () => import("./sk/accessibility"),
    editor: () => import("./sk/editor"),
    "empty-state": () => import("./sk/empty-state"),
  },
  de: {
    translations: () => import("./de/translations"),
    accessibility: () => import("./de/accessibility"),
    editor: () => import("./de/editor"),
    "empty-state": () => import("./de/empty-state"),
  },
  ua: {
    translations: () => import("./ua/translations"),
    accessibility: () => import("./ua/accessibility"),
    editor: () => import("./ua/editor"),
    "empty-state": () => import("./ua/empty-state"),
  },
  pl: {
    translations: () => import("./pl/translations"),
    accessibility: () => import("./pl/accessibility"),
    editor: () => import("./pl/editor"),
    "empty-state": () => import("./pl/empty-state"),
  },
  ko: {
    translations: () => import("./ko/translations"),
    accessibility: () => import("./ko/accessibility"),
    editor: () => import("./ko/editor"),
    "empty-state": () => import("./ko/empty-state"),
  },
  "pt-BR": {
    translations: () => import("./pt-BR/translations"),
    accessibility: () => import("./pt-BR/accessibility"),
    editor: () => import("./pt-BR/editor"),
    "empty-state": () => import("./pt-BR/empty-state"),
  },
  id: {
    translations: () => import("./id/translations"),
    accessibility: () => import("./id/accessibility"),
    editor: () => import("./id/editor"),
    "empty-state": () => import("./id/empty-state"),
  },
  ro: {
    translations: () => import("./ro/translations"),
    accessibility: () => import("./ro/accessibility"),
    editor: () => import("./ro/editor"),
    "empty-state": () => import("./ro/empty-state"),
  },
  "vi-VN": {
    translations: () => import("./vi-VN/translations"),
    accessibility: () => import("./vi-VN/accessibility"),
    editor: () => import("./vi-VN/editor"),
    "empty-state": () => import("./vi-VN/empty-state"),
  },
  "tr-TR": {
    translations: () => import("./tr-TR/translations"),
    accessibility: () => import("./tr-TR/accessibility"),
    editor: () => import("./tr-TR/editor"),
    "empty-state": () => import("./tr-TR/empty-state"),
  },
};
