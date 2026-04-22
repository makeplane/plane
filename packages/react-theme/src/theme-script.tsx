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

import { THEME_COLORS, THEME_DEFAULTS } from "./theme-context";

export interface ThemeScriptProps {
  /** Must match ThemeProvider's defaultTheme. Defaults to "system". */
  defaultTheme?: string;
  /** Must match ThemeProvider's storageKey. Defaults to "theme". */
  storageKey?: string;
  /** Must match ThemeProvider's attribute. Defaults to "data-theme". */
  attribute?: string;
}

export function ThemeScript({
  defaultTheme = THEME_DEFAULTS.defaultTheme,
  storageKey = THEME_DEFAULTS.storageKey,
  attribute = THEME_DEFAULTS.attribute,
}: ThemeScriptProps) {
  return (
    <script
      id="theme-init"
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var d=document.documentElement,s=localStorage.getItem(${JSON.stringify(storageKey)})||${JSON.stringify(defaultTheme)},t=s==="system"?window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light":s;d.setAttribute(${JSON.stringify(attribute)},t);d.style.colorScheme=t.includes("dark")?"dark":"light";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t.includes("dark")?${JSON.stringify(THEME_COLORS.dark)}:${JSON.stringify(THEME_COLORS.light)})}catch(e){}})()`,
      }}
    />
  );
}
