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

// Export all locale files to make them accessible from the package root
export { default as enTranslations } from "./en/translations";

export { default as enAccessibility } from "./en/accessibility";
// editor
export { default as enEditor } from "./en/editor";
export { default as enEmptyState } from "./en/empty-state";

// Define the locale data structure type
type LocaleData = {
  [key: string]: () => Promise<{ default: Record<string, unknown> }>;
};

// Export locale data for all supported languages
export const locales: Record<string, LocaleData> = {
  en: {
    translations: () => import("./en/translations"),
    accessibility: () => import("./en/accessibility"),
    editor: () => import("./en/editor"),
    "empty-state": () => import("./en/empty-state"),
    tour: () => import("./en/tour"),
  },
  fr: {
    translations: () => import("./fr/translations"),
    accessibility: () => import("./fr/accessibility"),
    editor: () => import("./fr/editor"),
    "empty-state": () => import("./fr/empty-state"),
    tour: () => import("./fr/tour"),
  },
  es: {
    translations: () => import("./es/translations"),
    accessibility: () => import("./es/accessibility"),
    editor: () => import("./es/editor"),
    "empty-state": () => import("./es/empty-state"),
    tour: () => import("./es/tour"),
  },
  ja: {
    translations: () => import("./ja/translations"),
    accessibility: () => import("./ja/accessibility"),
    editor: () => import("./ja/editor"),
    "empty-state": () => import("./ja/empty-state"),
    tour: () => import("./ja/tour"),
  },
  "zh-CN": {
    translations: () => import("./zh-CN/translations"),
    accessibility: () => import("./zh-CN/accessibility"),
    editor: () => import("./zh-CN/editor"),
    "empty-state": () => import("./zh-CN/empty-state"),
    tour: () => import("./zh-CN/tour"),
  },
  "zh-TW": {
    translations: () => import("./zh-TW/translations"),
    accessibility: () => import("./zh-TW/accessibility"),
    editor: () => import("./zh-TW/editor"),
    "empty-state": () => import("./zh-TW/empty-state"),
    tour: () => import("./zh-TW/tour"),
  },
  ru: {
    translations: () => import("./ru/translations"),
    accessibility: () => import("./ru/accessibility"),
    editor: () => import("./ru/editor"),
    "empty-state": () => import("./ru/empty-state"),
    tour: () => import("./ru/tour"),
  },
  it: {
    translations: () => import("./it/translations"),
    accessibility: () => import("./it/accessibility"),
    editor: () => import("./it/editor"),
    "empty-state": () => import("./it/empty-state"),
    tour: () => import("./it/tour"),
  },
  cs: {
    translations: () => import("./cs/translations"),
    accessibility: () => import("./cs/accessibility"),
    editor: () => import("./cs/editor"),
    "empty-state": () => import("./cs/empty-state"),
    tour: () => import("./cs/tour"),
  },
  sk: {
    translations: () => import("./sk/translations"),
    accessibility: () => import("./sk/accessibility"),
    editor: () => import("./sk/editor"),
    "empty-state": () => import("./sk/empty-state"),
    tour: () => import("./sk/tour"),
  },
  de: {
    translations: () => import("./de/translations"),
    accessibility: () => import("./de/accessibility"),
    editor: () => import("./de/editor"),
    "empty-state": () => import("./de/empty-state"),
    tour: () => import("./de/tour"),
  },
  ua: {
    translations: () => import("./ua/translations"),
    accessibility: () => import("./ua/accessibility"),
    editor: () => import("./ua/editor"),
    "empty-state": () => import("./ua/empty-state"),
    tour: () => import("./ua/tour"),
  },
  pl: {
    translations: () => import("./pl/translations"),
    accessibility: () => import("./pl/accessibility"),
    editor: () => import("./pl/editor"),
    "empty-state": () => import("./pl/empty-state"),
    tour: () => import("./pl/tour"),
  },
  ko: {
    translations: () => import("./ko/translations"),
    accessibility: () => import("./ko/accessibility"),
    editor: () => import("./ko/editor"),
    "empty-state": () => import("./ko/empty-state"),
    tour: () => import("./ko/tour"),
  },
  "pt-BR": {
    translations: () => import("./pt-BR/translations"),
    accessibility: () => import("./pt-BR/accessibility"),
    editor: () => import("./pt-BR/editor"),
    "empty-state": () => import("./pt-BR/empty-state"),
    tour: () => import("./pt-BR/tour"),
  },
  id: {
    translations: () => import("./id/translations"),
    accessibility: () => import("./id/accessibility"),
    editor: () => import("./id/editor"),
    "empty-state": () => import("./id/empty-state"),
    tour: () => import("./id/tour"),
  },
  ro: {
    translations: () => import("./ro/translations"),
    accessibility: () => import("./ro/accessibility"),
    editor: () => import("./ro/editor"),
    "empty-state": () => import("./ro/empty-state"),
    tour: () => import("./ro/tour"),
  },
  "vi-VN": {
    translations: () => import("./vi-VN/translations"),
    accessibility: () => import("./vi-VN/accessibility"),
    editor: () => import("./vi-VN/editor"),
    "empty-state": () => import("./vi-VN/empty-state"),
    tour: () => import("./vi-VN/tour"),
  },
  "tr-TR": {
    translations: () => import("./tr-TR/translations"),
    accessibility: () => import("./tr-TR/accessibility"),
    editor: () => import("./tr-TR/editor"),
    "empty-state": () => import("./tr-TR/empty-state"),
    tour: () => import("./tr-TR/tour"),
  },
};
