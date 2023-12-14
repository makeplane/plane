import { useContext } from "react";
// mobx store
import { MobxStoreContext } from "lib/mobx/store-provider";
// types
import { IWorkspaceRootStore } from "store/workspace";

export const useWorkspace = (): IWorkspaceRootStore => {
  const context = useContext(MobxStoreContext);
  if (context === undefined) throw new Error("useMobxStore must be used within MobxStoreProvider");
  return context.workspaceRoot;
};
