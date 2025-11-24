import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IModuleFilterStore } from "@/store/module_filter.store";

export const useModuleFilter = (): IModuleFilterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useModuleFilter must be used within StoreProvider");
  return context.moduleFilter;
};
