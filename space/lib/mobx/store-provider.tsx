"use client";

import { createContext, useContext } from "react";
// mobx store
import { RootStore } from "@/store/root";

let rootStore: RootStore = new RootStore();

export const MobxStoreContext = createContext<RootStore>(rootStore);

const initializeStore = () => {
  const singletonRootStore: RootStore = rootStore ?? new RootStore();
  if (typeof window === "undefined") return singletonRootStore;
  if (!rootStore) rootStore = singletonRootStore;
  return singletonRootStore;
};

export const MobxStoreProvider = ({ children }: any) => {
  const store: RootStore = initializeStore();
  return <MobxStoreContext.Provider value={store}>{children}</MobxStoreContext.Provider>;
};

// hook
export const useMobxStore = () => {
  const context = useContext(MobxStoreContext);
  if (context === undefined) throw new Error("useMobxStore must be used within MobxStoreProvider");
  return context;
};
