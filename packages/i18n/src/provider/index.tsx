/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { i18nInstance } from "../core";
import { getLanguageDirection } from "../constants/language";
import type { TLanguage } from "../types";

interface TranslationProviderProps {
  children: React.ReactNode;
}

// Render the provider unconditionally: translation readiness is handled before
// hydration (entry.client awaits initPromise). Gating on init with `return null`
// makes the first client render diverge from the server HTML, and React 19
// leaves server DOM it could not adopt in place instead of clearing it.
export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  useEffect(() => {
    // Apply document direction for initial language so RTL locales (e.g. Persian)
    // render mirrored on first load, not only after a language switch.
    if (typeof window !== "undefined") {
      const lng = (i18nInstance.language || "en") as TLanguage;
      document.documentElement.lang = lng;
      document.documentElement.dir = getLanguageDirection(lng);
    }
  }, []);

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
