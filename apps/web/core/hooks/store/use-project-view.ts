import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IProjectViewStore } from "@/plane-web/store/project-view.store";

export const useProjectView = (): IProjectViewStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectView must be used within StoreProvider");
  return context.projectView;
};
