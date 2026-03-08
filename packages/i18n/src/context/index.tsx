/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import React, { createContext } from "react";
// store
import { TranslationStore } from "../store";

export const TranslationContext = createContext<TranslationStore | null>(null);

interface TranslationProviderProps {
  children: React.ReactNode;
}

/**
 * Provides the translation store to the application
 */
export const TranslationProvider = observer(function TranslationProvider({ children }: TranslationProviderProps) {
  const [store] = React.useState(() => new TranslationStore());

  return <TranslationContext.Provider value={store}>{children}</TranslationContext.Provider>;
});
