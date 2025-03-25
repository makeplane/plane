import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IProjectFilterStore } from "@/plane-web/store/workspace-project-states";

export const useProjectFilter = (): IProjectFilterStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectFilter must be used within StoreProvider");
  return context.projectFilter;
};
