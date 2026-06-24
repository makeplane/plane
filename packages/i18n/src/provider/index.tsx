/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { i18nInstance, initPromise } from "../core";
import { getLanguageDirection } from "../constants/language";
import type { TLanguage } from "../types";

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(i18nInstance.isInitialized);

  useEffect(() => {
    initPromise
      .then(() => {
        // Apply the document direction for the initial language so RTL locales
        // (e.g. Persian) render mirrored on first load, not only after a switch.
        if (typeof window !== "undefined") {
          const lng = (i18nInstance.language || "en") as TLanguage;
          document.documentElement.lang = lng;
          document.documentElement.dir = getLanguageDirection(lng);
        }
        setIsReady(true);
      })
      .catch((err) => {
        console.error("Failed to initialize i18n:", err);
        setIsReady(true);
      });
  }, []);

  if (!isReady) return null;
  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
