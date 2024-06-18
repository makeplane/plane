// plane web store
import { IWorkspacePageStore, WorkspacePageStore } from "@/plane-web/store/pages/workspace-page.store";
// store
import {
  IWorkspaceSubscriptionStore,
  WorkspaceSubscriptionStore,
} from "@/plane-web/store/subscription/subscription.store";
import { CoreRootStore } from "@/store/root.store";

export class RootStore extends CoreRootStore {
  workspacePages: IWorkspacePageStore;
  workspaceSubscription: IWorkspaceSubscriptionStore;

  constructor() {
    super();
    this.workspacePages = new WorkspacePageStore(this);
    this.workspaceSubscription = new WorkspaceSubscriptionStore();
  }

  resetOnSignOut() {
    super.resetOnSignOut();
    this.workspacePages = new WorkspacePageStore(this);
    this.workspaceSubscription = new WorkspaceSubscriptionStore();
  }
}
