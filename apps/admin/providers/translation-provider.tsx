/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { TranslationProvider, useTranslation } from "@plane/i18n";

type TAdminTranslationProviderProps = {
  children: React.ReactNode;
};

function DocumentLanguageSync({ children }: TAdminTranslationProviderProps) {
  const { currentLocale } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = currentLocale;
  }, [currentLocale]);

  return children;
}

export function AdminTranslationProvider({ children }: TAdminTranslationProviderProps) {
  return (
    <TranslationProvider>
      <DocumentLanguageSync>{children}</DocumentLanguageSync>
    </TranslationProvider>
  );
}
