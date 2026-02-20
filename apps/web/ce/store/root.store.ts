/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// store
import { CoreRootStore } from "@/store/root.store";
import type { IWorklogStore } from "@/store/worklog.store";
import { WorklogStore } from "@/store/worklog.store";
import type { IAnalyticsDashboardStore } from "./analytics-dashboard.store";
import { AnalyticsDashboardStore } from "./analytics-dashboard.store";
import type { ITimelineStore } from "./timeline";
import { TimeLineStore } from "./timeline";

export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;
  worklog: IWorklogStore;
  analyticsDashboard: IAnalyticsDashboardStore;

  constructor() {
    super();

    this.timelineStore = new TimeLineStore(this);
    this.worklog = new WorklogStore();
    this.analyticsDashboard = new AnalyticsDashboardStore(this);
  }
}
