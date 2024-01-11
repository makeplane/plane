import makeInspectable from "mobx-devtools-mst";
import { createContext } from "react";
// mobx store
import { RootStore } from "store/root.store";

let rootStore = new RootStore();

export const StoreContext = createContext<RootStore>(rootStore);

const initializeStore = () => {
  const _rootStore = rootStore ?? new RootStore();
  makeInspectable(_rootStore);
  if (typeof window === "undefined") return _rootStore;
  if (!rootStore) rootStore = _rootStore;
  return _rootStore;
};

export const StoreProvider = ({ children }: any) => {
  const store = initializeStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};
