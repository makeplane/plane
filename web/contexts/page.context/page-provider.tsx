import { createContext } from "react";
// mobx store
import { PageStore } from "store/page.store";
import { AppRootStore } from "store/application";

let pageStore: PageStore = new PageStore(new AppRootStore());

export const PageContext = createContext<PageStore>(pageStore);

const initializeStore = () => {
  const _pageStore: PageStore = pageStore ?? new PageStore(pageStore);
  if (typeof window === "undefined") return _pageStore;
  if (!pageStore) pageStore = _pageStore;
  return _pageStore;
};

export const AppRootStoreProvider = ({ children }: any) => {
  const store: PageStore = initializeStore();
  return <PageContext.Provider value={store}>{children}</PageContext.Provider>;
};
