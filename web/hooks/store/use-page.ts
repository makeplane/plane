import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IPageStore } from "store/page.store";

export const usePage = (): any => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePage must be used within StoreProvider");
  return context as any;
};
