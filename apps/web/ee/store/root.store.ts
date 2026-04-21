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

// plane web imports
import type { ICollectionStore } from "@/plane-web/store/pages/collection.store";
import { CollectionStore } from "@/plane-web/store/pages/collection.store";
import type { IPublishPageStore } from "@/plane-web/store/pages/publish-page.store";
import { PublishPageStore } from "@/plane-web/store/pages/publish-page.store";
import type { IWorkspacePageStore } from "@/plane-web/store/pages/workspace-page.store";
import { WorkspacePageStore } from "@/plane-web/store/pages/workspace-page.store";
import { TimeLineStore } from "@/plane-web/store/timeline";
// store
import { CoreRootStore } from "@/store/root.store";
// local imports
import type { ITimelineStore } from "./timeline";

export class RootStore extends CoreRootStore {
  // Override theme with extended type
  workspacePages: IWorkspacePageStore;
  collection: ICollectionStore;
  publishPage: IPublishPageStore;
  timelineStore: ITimelineStore;

  constructor() {
    super();
    this.collection = new CollectionStore(this);
    this.workspacePages = new WorkspacePageStore(this);
    this.publishPage = new PublishPageStore(this);
    this.timelineStore = new TimeLineStore(this);
  }

  resetOnSignOut() {
    super.resetOnSignOut();
    this.collection = new CollectionStore(this);
    this.workspacePages = new WorkspacePageStore(this);
    this.publishPage = new PublishPageStore(this);
    this.timelineStore = new TimeLineStore(this);
  }
}
