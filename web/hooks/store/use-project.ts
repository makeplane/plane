import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IProjectStore } from "store/project/project.store";

export const useProject = (): IProjectStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProject must be used within StoreProvider");
  return context.projectRoot.project;
};
