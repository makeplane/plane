import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// mobx store
import { IProjectPageStore } from "@/store/pages/project-page.store";

export const useProjectPages = (projectId: string | undefined): IProjectPageStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectPage must be used within StoreProvider");

  if (!projectId) throw new Error("projectId must be passed as a property");

  return context.projectPages;
};
