import { useContext } from "react";
// store
import { StoreContext } from "@/providers/store.provider";
import type { IWorkspaceStore } from "@/store/workspace.store";

export const useWorkspace = (): IWorkspaceStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspace must be used within StoreProvider");
  return context.workspace;
};
