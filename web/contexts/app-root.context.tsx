import { createContext, useContext } from "react";
// mobx store
import { AppRootStore, IAppRootStore } from "store/application";

let appRootStore: IAppRootStore = new AppRootStore();

export const AppRootStoreContext = createContext<IAppRootStore>(appRootStore);

const initializeStore = () => {
  const _appRootStore: IAppRootStore = appRootStore ?? new AppRootStore();
  if (typeof window === "undefined") return _appRootStore;
  if (!appRootStore) appRootStore = _appRootStore;
  return _appRootStore;
};

export const AppRootStoreProvider = ({ children }: any) => {
  const store: IAppRootStore = initializeStore();
  return <AppRootStoreContext.Provider value={store}>{children}</AppRootStoreContext.Provider>;
};

export const useAppRootStore = () => {
  const context = useContext(AppRootStoreContext);
  if (context === undefined) throw new Error("useMobxStore must be used within MobxStoreProvider");
  return context;
};
