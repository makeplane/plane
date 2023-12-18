import { createContext } from "react";
// mobx store
import { RootStore } from "store/root.store";

let rootStore: RootStore = new RootStore();

export const StoreContext = createContext<RootStore>(rootStore);

const initializeStore = () => {
  const _rootStore: RootStore = rootStore ?? new RootStore();
  if (typeof window === "undefined") return _rootStore;
  if (!rootStore) rootStore = _rootStore;
  return _rootStore;
};

export const StoreProvider = ({ children }: any) => {
  const store = initializeStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};
