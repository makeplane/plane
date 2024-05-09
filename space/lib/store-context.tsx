import { ReactElement, createContext } from "react";
// mobx store
import { RootStore } from "@/store/root.store";

export let rootStore = new RootStore();

export const StoreContext = createContext<RootStore>(rootStore);

const initializeStore = () => {
  const singletonRootStore = rootStore ?? new RootStore();
  if (typeof window === "undefined") return singletonRootStore;
  if (!rootStore) rootStore = singletonRootStore;
  return singletonRootStore;
};

export const StoreProvider = ({ children }: { children: ReactElement }) => {
  const store = initializeStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};
