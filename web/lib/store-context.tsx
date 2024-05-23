import { ReactElement, createContext } from "react";
// mobx store
import { RootStore } from "@/store/root.store";

export let rootStore = new RootStore();

export const StoreContext = createContext<RootStore>(rootStore);

const initializeStore = () => {
  const newRootStore = rootStore ?? new RootStore();
  if (typeof window === "undefined") return newRootStore;
  if (!rootStore) rootStore = newRootStore;
  return newRootStore;
};

export const StoreProvider = ({ children }: { children: ReactElement }) => {
  const store = initializeStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};
