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

import React, { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { i18nInstance, initPromise } from "../core";

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(i18nInstance.isInitialized);

  useEffect(() => {
    initPromise
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error("Failed to initialize i18n:", err);
        setIsReady(true);
      });
  }, []);

  if (!isReady) return null;
  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};
