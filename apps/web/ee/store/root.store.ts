/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane web store
import type { ICycleStore } from "@/plane-web/store/cycle";
import { CycleStore } from "@/plane-web/store/cycle";
import type { IWorkspaceNotificationStore } from "@/plane-web/store/notifications/notifications.store";
import { WorkspaceNotificationStore } from "@/plane-web/store/notifications/notifications.store";
import type { IPublishPageStore } from "@/plane-web/store/pages/publish-page.store";
import { PublishPageStore } from "@/plane-web/store/pages/publish-page.store";
import type { IWorkspacePageStore } from "@/plane-web/store/pages/workspace-page.store";
import { WorkspacePageStore } from "@/plane-web/store/pages/workspace-page.store";
import { TimeLineStore } from "@/plane-web/store/timeline";
// store
import { CoreRootStore } from "@/store/root.store";
// theme
import type { IThemeStore } from "./theme.store";
import { ThemeStore } from "./theme.store";
import type { IGlobalViewStore } from "./global-view.store";
import { GlobalViewStore } from "./global-view.store";

// timeline
import type { IProjectInboxStore } from "./project-inbox.store";
import { ProjectInboxStore } from "./project-inbox.store";
// project view
import type { IProjectViewStore } from "./project-view.store";
import { ProjectViewStore } from "./project-view.store";
// timeline
import type { ITimelineStore } from "./timeline";

export class RootStore extends CoreRootStore {
  // Override theme with extended type
  theme: IThemeStore;
  workspacePages: IWorkspacePageStore;
  publishPage: IPublishPageStore;
  cycle: ICycleStore;
  timelineStore: ITimelineStore;
  workspaceNotification: IWorkspaceNotificationStore;
  projectInbox: IProjectInboxStore;
  projectView: IProjectViewStore;
  globalView: IGlobalViewStore;

  constructor() {
    super();
    // Override the theme store with extended version
    this.theme = new ThemeStore();
    this.workspacePages = new WorkspacePageStore(this);
    this.publishPage = new PublishPageStore(this);
    this.cycle = new CycleStore(this);
    this.timelineStore = new TimeLineStore(this);
    this.workspaceNotification = new WorkspaceNotificationStore(this);
    this.projectInbox = new ProjectInboxStore(this);
    // project view
    this.projectView = new ProjectViewStore(this);
    this.globalView = new GlobalViewStore(this);
  }

  resetOnSignOut() {
    super.resetOnSignOut();
    // Override theme store reset
    this.theme = new ThemeStore();
    this.workspacePages = new WorkspacePageStore(this);
    this.publishPage = new PublishPageStore(this);
    this.cycle = new CycleStore(this);
    this.timelineStore = new TimeLineStore(this);
    this.projectView = new ProjectViewStore(this);
    this.globalView = new GlobalViewStore(this);
  }
}
