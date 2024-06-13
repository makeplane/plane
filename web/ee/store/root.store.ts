// plane web store
import { IWorkspacePageStore, WorkspacePageStore } from "@/plane-web/store/pages/workspace-page.store";
// store
import { CoreRootStore } from "@/store/root.store";

export class RootStore extends CoreRootStore {
  workspacePages: IWorkspacePageStore;

  constructor() {
    super();
    this.workspacePages = new WorkspacePageStore(this);
  }

  resetOnSignOut() {
    super.resetOnSignOut();
    this.workspacePages = new WorkspacePageStore(this);
  }
}
