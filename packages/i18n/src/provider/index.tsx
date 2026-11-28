/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useLayoutEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { i18nInstance } from "../core";
import { applyDocumentLanguage } from "../core/apply-language";
import type { TLanguage } from "../types";

interface TranslationProviderProps {
  children: React.ReactNode;
}

// Render the provider unconditionally: translation readiness is handled before
// hydration (entry.client awaits initPromise). Gating on init with `return null`
// makes the first client render diverge from the server HTML, and React 19
// leaves server DOM it could not adopt in place instead of clearing it.
export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  // Apply the restored language's `lang` and `dir` before the first paint. Running this
  // after hydration keeps the root layout's `<html lang="en">` from resetting
  // it, and covers apps that never call setLanguage (space, admin).
  useLayoutEffect(() => {
    const lng = i18nInstance.resolvedLanguage ?? i18nInstance.language;
    if (lng) applyDocumentLanguage(lng as TLanguage);
  }, []);

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
