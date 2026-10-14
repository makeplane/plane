/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { I18nextProvider } from "react-i18next";
import { i18nInstance } from "../core";

interface TranslationProviderProps {
  children: React.ReactNode;
}

// Render the provider unconditionally: translation readiness is handled before
// hydration (entry.client awaits initPromise). Gating on init with `return null`
// makes the first client render diverge from the server HTML, and React 19
// leaves server DOM it could not adopt in place instead of clearing it.
export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => (
  <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
);
