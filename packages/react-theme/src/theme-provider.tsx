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

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { THEME_COLORS, THEME_DEFAULTS, ThemeContext } from "./theme-context";

const IS_BROWSER = typeof window !== "undefined";

export interface ThemeProviderProps {
  children: ReactNode;
  /** Valid theme values. Defaults to ["system", "light", "dark"]. */
  themes?: string[];
  /** Default theme when no stored preference exists. Defaults to "system". */
  defaultTheme?: string;
  /** localStorage key. Defaults to "theme". */
  storageKey?: string;
  /** DOM attribute set on document.documentElement. Defaults to "data-theme". */
  attribute?: string;
}

function normalizeTheme(value: string, themes: string[], defaultTheme: string): string {
  return themes.includes(value) ? value : defaultTheme;
}

function getSystemTheme(): string {
  if (!IS_BROWSER) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: string): string {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyToDOM(resolved: string, attribute: string): void {
  if (!IS_BROWSER) return;
  const root = document.documentElement;
  root.setAttribute(attribute, resolved);
  root.style.colorScheme = resolved.includes("dark") ? "dark" : "light";
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved.includes("dark") ? THEME_COLORS.dark : THEME_COLORS.light);
  }
}

function getInitialState(
  storageKey: string,
  attribute: string,
  themes: string[],
  defaultTheme: string
): { theme: string; resolved: string } {
  if (!IS_BROWSER) {
    return { theme: defaultTheme, resolved: resolveTheme(defaultTheme) };
  }

  let stored: string | null = null;
  try {
    stored = localStorage.getItem(storageKey);
  } catch {
    // localStorage may throw in sandboxed contexts
  }
  const theme = stored ? normalizeTheme(stored, themes, defaultTheme) : defaultTheme;
  const domResolved = document.documentElement.getAttribute(attribute);
  const resolved =
    domResolved && domResolved !== "system" && themes.includes(domResolved) ? domResolved : resolveTheme(theme);

  return { theme, resolved };
}

export function ThemeProvider({
  children,
  themes = [...THEME_DEFAULTS.themes],
  defaultTheme = THEME_DEFAULTS.defaultTheme,
  storageKey = THEME_DEFAULTS.storageKey,
  attribute = THEME_DEFAULTS.attribute,
}: ThemeProviderProps) {
  // Stabilize themes by content so inline arrays don't cause re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableThemes = useMemo(() => themes, [themes.join(",")]);

  const [{ theme: initialTheme, resolved: initialResolved }] = useState(() =>
    getInitialState(storageKey, attribute, stableThemes, defaultTheme)
  );
  const [themeState, setThemeState] = useState(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState(initialResolved);
  // Keep a ref to the latest resolved theme so the mount effect always
  // applies the current value, even if setTheme was called before mount.
  const resolvedRef = useRef(initialResolved);

  const setTheme = useCallback(
    (value: string) => {
      const normalized = normalizeTheme(value, stableThemes, defaultTheme);
      const resolved = resolveTheme(normalized);
      setThemeState(normalized);
      setResolvedTheme(resolved);
      resolvedRef.current = resolved;
      applyToDOM(resolved, attribute);
      try {
        localStorage.setItem(storageKey, normalized);
      } catch {
        // localStorage may throw in sandboxed contexts
      }
    },
    [stableThemes, defaultTheme, attribute, storageKey]
  );

  useEffect(() => {
    applyToDOM(resolvedRef.current, attribute);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (themeState !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      applyToDOM(resolved, attribute);
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [themeState, attribute]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      const normalized = normalizeTheme(e.newValue ?? defaultTheme, stableThemes, defaultTheme);
      const resolved = resolveTheme(normalized);
      setThemeState(normalized);
      setResolvedTheme(resolved);
      applyToDOM(resolved, attribute);
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [storageKey, stableThemes, defaultTheme, attribute]);

  const value = useMemo(() => ({ theme: themeState, resolvedTheme, setTheme }), [themeState, resolvedTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
