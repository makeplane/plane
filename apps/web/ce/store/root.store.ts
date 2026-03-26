/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// store
import { CoreRootStore } from "@/store/root.store";
import type { IWorklogStore } from "@/store/worklog.store";
import { WorklogStore } from "@/store/worklog.store";
import type { ITimelineStore } from "./timeline";
import { TimeLineStore } from "./timeline";
import { DashboardStore } from "./dashboards/dashboard.store";
import { ProjectWorklogStore } from "./project/worklog.store";
import type { IWorkflowStore } from "./workflow.store";
import { WorkflowStore } from "./workflow.store";
import type { IModuleActivityStore } from "./module-activity.store";
import { ModuleActivityStore } from "./module-activity.store";
import type { ITaskCategoryStore } from "./task-category.store";
import { TaskCategoryStore } from "./task-category.store";

export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;
  worklog: IWorklogStore;
  customDashboard: DashboardStore;
  projectWorklog: ProjectWorklogStore;
  workflowStore: IWorkflowStore;
  moduleActivity: IModuleActivityStore;
  taskCategory: ITaskCategoryStore;

  constructor() {
    super();

    this.timelineStore = new TimeLineStore(this);
    this.worklog = new WorklogStore();
    this.customDashboard = new DashboardStore(this);
    this.projectWorklog = new ProjectWorklogStore();
    this.workflowStore = new WorkflowStore();
    this.moduleActivity = new ModuleActivityStore();
    this.taskCategory = new TaskCategoryStore();
  }
}
