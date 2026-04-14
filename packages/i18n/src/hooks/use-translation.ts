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
    // oxlint-disable-next-line typescript/no-explicit-any - i18next handles numbers, booleans, etc. natively
    t: (key: string, params?: any) => t(key, params) as string,
    currentLocale: i18n.language as TLanguage,
    changeLanguage,
    languages: SUPPORTED_LANGUAGES,
  };
}
