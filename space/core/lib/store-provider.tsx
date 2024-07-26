"use client";

import { ReactNode, createContext } from "react";
import { ThemeProvider } from "next-themes";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

let rootStore = new RootStore();

export const StoreContext = createContext(rootStore);

function initializeStore(initialData = {}) {
  const singletonRootStore = rootStore ?? new RootStore();
  // If your page has Next.js data fetching methods that use a Mobx store, it will
  // get hydrated here, check `pages/ssg.js` and `pages/ssr.js` for more details
  if (initialData) {
    singletonRootStore.hydrate(initialData);
  }
  // For SSG and SSR always create a new store
  if (typeof window === "undefined") return singletonRootStore;
  // Create the store once in the client
  if (!rootStore) rootStore = singletonRootStore;
  return singletonRootStore;
}

export type StoreProviderProps = {
  children: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialState?: any;
};

export const StoreProvider = ({ children, initialState = {} }: StoreProviderProps) => {
  const store = initializeStore(initialState);
  return (
    <ThemeProvider themes={["light", "dark"]} defaultTheme="system" enableSystem>
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    </ThemeProvider>
  );
};
