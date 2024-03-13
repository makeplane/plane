"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";

import { createContext } from "react";
// mobx store
import { ThemeStore } from "store/theme.store";

let themeStore = new ThemeStore();

export const ThemeContext = createContext<ThemeStore>(themeStore);

const initializeStore = () => {
  const store = themeStore ?? new ThemeStore();
  if (typeof window === "undefined") return store;
  if (!themeStore) themeStore = store;
  return store;
};

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const store = initializeStore();
  return (
    <>
      <ThemeContext.Provider value={store}>
        <NextThemesProvider {...props}>{children}</NextThemesProvider>
      </ThemeContext.Provider>
    </>
  );
}
