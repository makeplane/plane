import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IWorkspaceProjectStatesStore } from "@/plane-web/store/workspace-project-states";

export const useWorkspaceProjectStates = (): IWorkspaceProjectStatesStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorkspaceProjectStates must be used within StoreProvider");
  return context.workspaceProjectStates;
};
