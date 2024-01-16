import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IProjectPageStore } from "store/project-page.store";

export const useProjectPages = (): IProjectPageStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePage must be used within StoreProvider");
  return context.projectPages;
};
