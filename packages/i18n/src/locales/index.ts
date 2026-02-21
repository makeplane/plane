/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
  ko: {
    core: () => import("./ko/core"),
    translations: () => import("./ko/translations"),
    accessibility: () => import("./ko/accessibility"),
    editor: () => import("./ko/editor"),
    "empty-state": () => import("./ko/empty-state"),
  },
  vi: {
    core: () => import("./vi/core"),
    translations: () => import("./vi/translations"),
    accessibility: () => import("./vi/accessibility"),
    editor: () => import("./vi/editor"),
    "empty-state": () => import("./vi/empty-state"),
  },
};
