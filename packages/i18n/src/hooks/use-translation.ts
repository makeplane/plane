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

import { useCallback, useMemo } from "react";
import { useTranslation as useI18nextTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, LANGUAGE_STORAGE_KEY } from "../constants/language";
import type { TLanguage, ILanguageOption } from "../types";

export type TTranslationStore = {
  t: (key: string, params?: Record<string, unknown>) => string;
  currentLocale: TLanguage;
  changeLanguage: (lng: TLanguage) => void;
  languages: ILanguageOption[];
};

// Guards React from crashing when a key resolves to a namespace node (i18next-icu
// bypasses returnObjects). Remove once t() is type-safe at the key level.
function coerceToString(key: string, value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value == null) {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      console.warn(`[i18n] Missing translation for key "${key}"`);
    }
    return key;
  }
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.warn(
      `[i18n] Translation for key "${key}" is not a string (got ${typeof value}). ` +
        `This usually means the key resolves to a namespace node. Use a leaf key instead.`
    );
  }
  return key;
}

export function useTranslation(): TTranslationStore {
  // No ns arg — fallbackNS handles lookup; passing NAMESPACES triggers a re-render cascade.
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

  const safeT = useMemo<TTranslationStore["t"]>(
    // oxlint-disable-next-line typescript/no-explicit-any - i18next handles numbers, booleans, etc. natively
    () => (key, params) => coerceToString(key, t(key, params as any)),
    [t]
  );

  return {
    t: safeT,
    currentLocale: i18n.language as TLanguage,
    changeLanguage,
    languages: SUPPORTED_LANGUAGES,
  };
}
