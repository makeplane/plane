import { useContext } from "react";
// context
import { StoreContext } from "@/lib/store-context";
// plane web stores
import { IProjectState } from "@/plane-web/store/workspace-project-states";

export const useProjectState = (projectStateId: string | undefined): IProjectState => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectState must be used within StoreProvider");
  if (!projectStateId) return {} as IProjectState;

  return context.workspaceProjectStates.projectStates[projectStateId];
};
