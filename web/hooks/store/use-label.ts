import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { ILabelRootStore } from "store/label";

export const useLabel = (): ILabelRootStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useLabel must be used within StoreProvider");
  return context.labelRoot;
};
