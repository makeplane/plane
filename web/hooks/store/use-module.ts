import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { IModuleStore } from "@/store/module.store";

export const useModule = (): IModuleStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useModule must be used within StoreProvider");
  return context.module;
};
