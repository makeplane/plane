import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import { IProjectFilterStore } from "@/store/project/project_filter.store";

export const useProjectFilter = (): IProjectFilterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectFilter must be used within StoreProvider");
  return context.projectRoot.projectFilter;
};
