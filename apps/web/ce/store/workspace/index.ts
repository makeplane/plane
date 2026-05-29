// store
import { BaseWorkspaceRootStore } from "@/store/workspace";
import type { RootStore } from "@/plane-web/store/root.store";

export class WorkspaceRootStore extends BaseWorkspaceRootStore {
  // actions
  /**
   * Mutate workspace members activity
   * @param workspaceSlug
   */
  mutateWorkspaceMembersActivity = async (_workspaceSlug: string) => {
    // No-op in default/CE version
  };
}
