"use client";

import { createContext } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";
// mobx store
import { InstanceStore } from "store/instance.store";

let instanceStore = new InstanceStore();

export const InstanceContext = createContext<InstanceStore>(instanceStore);

const initializeStore = () => {
  const _instanceStore = instanceStore ?? new InstanceStore();
  if (typeof window === "undefined") return _instanceStore;
  if (!instanceStore) instanceStore = _instanceStore;
  return _instanceStore;
};

export function InstanceProvider({ children, ...props }: ThemeProviderProps) {
  const store = initializeStore();
  return (
    <>
      <InstanceContext.Provider value={store}>
        <NextThemesProvider {...props}>{children}</NextThemesProvider>
      </InstanceContext.Provider>
    </>
  );
}
