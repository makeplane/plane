import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IAppRootStore } from "store/application";

export const useApplication = (): IAppRootStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useApplication must be used within StoreProvider");
  return context.app;
};
