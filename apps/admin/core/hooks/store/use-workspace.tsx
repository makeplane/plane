import { useContext } from "react";
// store
import { StoreContext } from "@/lib/store-provider";
import { IWorkspaceStore } from "@/store/workspace.store";

export const useWorkspace = (): IWorkspaceStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspace must be used within StoreProvider");
  return context.workspace;
};
