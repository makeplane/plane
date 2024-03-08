import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { RootStore } from "store/root.store";

export const useStore = (): RootStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useStore must be used within StoreProvider");
  return context;
};
