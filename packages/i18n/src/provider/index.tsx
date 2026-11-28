/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useLayoutEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { i18nInstance, initPromise } from "../core";
import { applyDocumentLanguage } from "../core/apply-language";
import type { TLanguage } from "../types";

interface TranslationProviderProps {
  children: React.ReactNode;
}

// Render the provider unconditionally: translation readiness is handled before
// hydration (web and space await initPromise in entry.client). Gating on init with `return null`
// makes the first client render diverge from the server HTML, and React 19
// leaves server DOM it could not adopt in place instead of clearing it.
export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  // Apply the restored language's `lang` and `dir` before the first paint. Running this
  // after hydration keeps the root layout's `<html lang="en">` from resetting
  // it, and covers apps that never call setLanguage (space, admin).
  // Apply again once init settles, for apps that hydrate before awaiting
  // initPromise (admin).
  useLayoutEffect(() => {
    let active = true;
    const apply = () => {
      const lng = i18nInstance.resolvedLanguage ?? i18nInstance.language;
      if (active && lng) applyDocumentLanguage(lng as TLanguage);
    };
    apply();
    void initPromise.then(apply, apply);
    return () => {
      active = false;
    };
  }, []);

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
