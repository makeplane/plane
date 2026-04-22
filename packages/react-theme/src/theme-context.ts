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

import { createContext } from "react";

export const THEME_DEFAULTS = {
  themes: ["system", "light", "dark"],
  defaultTheme: "system",
  storageKey: "theme",
  attribute: "data-theme",
} as const;

export const THEME_COLORS = {
  dark: "#0e0f10",
  light: "#eff0f0",
} as const;

export interface ThemeContextValue {
  theme: string;
  resolvedTheme: string;
  setTheme: (theme: string) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
