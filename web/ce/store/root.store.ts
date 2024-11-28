// store
import { CoreRootStore } from "@/store/root.store";
import { IWorkspaceNotificationStore, WorkspaceNotificationStore } from "./notifications/workspace-notifications.store";
import { ITimelineStore, TimeLineStore } from "./timeline";

export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;
  workspaceNotification: IWorkspaceNotificationStore;

  constructor() {
    super();
    this.workspaceNotification = new WorkspaceNotificationStore(this)
    this.timelineStore = new TimeLineStore(this);
  }

  resetOnSignOut() {
    super.resetOnSignOut();
    this.workspaceNotification = new WorkspaceNotificationStore(this);
  }
}
