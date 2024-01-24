import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
import { IProjectPageStore } from "store/project-page.store";

export const useProjectPages = (): IProjectPageStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectPublish must be used within StoreProvider");
  return context.projectPages;
};
