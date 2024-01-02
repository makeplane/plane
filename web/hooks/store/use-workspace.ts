import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";
// types
import { IWorkspaceRootStore } from "store/workspace";

export const useWorkspace = (): IWorkspaceRootStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspace must be used within StoreProvider");
  return context.workspaceRoot;
};
