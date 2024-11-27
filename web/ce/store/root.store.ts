// store
import { CoreRootStore } from "@/store/root.store";
import { ITimelineStore, TimeLineStore } from "./timeline";
import { IWorkspaceNotificationStore, WorkspaceNotificationStore } from "./notifications/workspace-notifications.store";

export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;
  workspaceNotification: IWorkspaceNotificationStore;

  constructor() {
    super();
    this.workspaceNotification = new WorkspaceNotificationStore(this)
    this.timelineStore = new TimeLineStore(this);
  }

  resetOnSignOut() {
    this.workspaceNotification = new WorkspaceNotificationStore(this);
  }
}
