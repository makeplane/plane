"use client";

import { createContext, useContext } from "react";
// mobx store
import { RootStore } from "store/root.store";

let rootStore: RootStore = new RootStore();

export const MobxStoreContext = createContext<RootStore>(rootStore);

const initializeStore = () => {
  const _rootStore: RootStore = rootStore ?? new RootStore();
  if (typeof window === "undefined") return _rootStore;
  if (!rootStore) rootStore = _rootStore;
  return _rootStore;
};

export const MobxIssueStoreProvider = ({ children }: any) => {
  const store: RootStore = initializeStore();
  return <MobxStoreContext.Provider value={store}>{children}</MobxStoreContext.Provider>;
};

// hook
export const useMobxIssueStore = () => {
  const context = useContext(MobxStoreContext);
  if (context === undefined) throw new Error("useMobxIssueStore must be used within MobxIssueStoreProvider");
  return context;
};
