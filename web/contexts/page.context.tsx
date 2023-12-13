import { createContext, useContext } from "react";
// mobx store
import { PageStore } from "store/page.store";
import { AppRootStore } from "store/application";
import { useAppRootStore } from "./app-root.context";

export const PageContext = createContext<PageStore | undefined>(undefined);

let pageStore: PageStore | undefined;

export const PageStoreProvider = ({ children }: any) => {
  const appRootStore = useAppRootStore();
  pageStore = pageStore ?? new PageStore(appRootStore);
  return <PageContext.Provider value={pageStore}>{children}</PageContext.Provider>;
};

export const usePage = () => {
  const context = useContext(PageContext);
  if (context === undefined) throw new Error("usePage must be used within AppRootStoreContext");
  return context;
};
