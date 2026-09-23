/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { i18nInstance } from "../core";

interface TranslationProviderProps {
  children: React.ReactNode;
}

// Render the provider unconditionally: translation readiness is handled before
// hydration (entry.client awaits initPromise). Gating on init with `return null`
// makes the first client render diverge from the server HTML, and React 19
// leaves server DOM it could not adopt in place instead of clearing it.
export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  // Keep <html lang> aligned with the active locale (stored preference, DEFAULT_LANGUAGE,
  // or a later change). Done in an effect rather than before hydration: React never patches
  // attribute mismatches while hydrating, and after a hydration failure it re-applies the
  // static lang from JSX, so only a post-commit write is guaranteed to stick.
  useEffect(() => {
    const syncDocumentLanguage = (lng: string | undefined) => {
      if (lng) document.documentElement.lang = lng;
    };
    syncDocumentLanguage(i18nInstance.language);
    i18nInstance.on("languageChanged", syncDocumentLanguage);
    return () => {
      i18nInstance.off("languageChanged", syncDocumentLanguage);
    };
  }, []);

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
