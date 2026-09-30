/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { useTranslation as useI18nextTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, LANGUAGE_STORAGE_KEY } from "../constants/language";
import type { TLanguage, ILanguageOption } from "../types";

export type TTranslationStore = {
  t: (key: string, params?: Record<string, unknown>) => string;
  currentLocale: TLanguage;
  changeLanguage: (lng: TLanguage) => void;
  languages: ILanguageOption[];
};

// Crash guard: i18next-icu unconditionally returns raw objects when t() is called
// with a branch (namespace-node) key, regardless of returnObjects:false. Without
// this wrapper, React unmounts the subtree with "Objects are not valid as a React
// child". Strings pass through; numbers/booleans are stringified; objects/null/
// undefined fall back to the key itself plus a dev-mode warning. Can be removed
// once t() gains key-level type safety (Phase 2 of the i18n roadmap).
function coerceToString(key: string, value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      `[i18n] Translation for key "${key}" is not a string (got ${
        value === null ? "null" : typeof value
      }). This is likely a missing key or a namespace-node lookup. Returning the key as fallback.`
    );
  }
  return key;
}

export function useTranslation(): TTranslationStore {
  // No namespace arg — fallbackNS in the i18next config ensures all namespaces
  // are searched for any key. Passing NAMESPACES here would trigger concurrent
  // async loads per component, causing a re-render cascade.
  const { t, i18n } = useI18nextTranslation();

  const changeLanguage = useCallback(
    (lng: TLanguage) => {
      void (async () => {
        try {
          await i18n.changeLanguage(lng);
          if (typeof window === "undefined") return;
          localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
          document.documentElement.lang = lng;
        } catch (err) {
          console.error("Failed to change language:", err);
        }
      })();
    },
    [i18n]
  );

  return {
    t: (key: string, params?: Record<string, unknown>) =>
      coerceToString(key, params === undefined ? t(key) : t(key, params)),
    currentLocale: i18n.language as TLanguage,
    changeLanguage,
    languages: SUPPORTED_LANGUAGES,
  };
}
