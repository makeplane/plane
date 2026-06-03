/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// store
import { CoreRootStore } from "@/store/root.store";
import type { ICEWorklogStore } from "./worklog.store";
import { CEWorklogStore } from "./worklog.store";
import type { ITimelineStore } from "./timeline";
import { TimeLineStore } from "./timeline";
import { DashboardStore } from "./dashboards/dashboard.store";
import type { IWorkflowStore } from "./workflow.store";
import { WorkflowStore } from "./workflow.store";
import type { IModuleActivityStore } from "./module-activity.store";
import { ModuleActivityStore } from "./module-activity.store";
import type { ITaskCategoryStore } from "./task-category.store";
import { TaskCategoryStore } from "./task-category.store";
import type { IHoIssueStore } from "./ho/ho-issue.store";
import { HoIssueStore } from "./ho/ho-issue.store";
import type { IProjectFieldPermissionStore } from "./project-field-permission.store";
import { ProjectFieldPermissionStore } from "./project-field-permission.store";
import type { IProjectCopyStore } from "./project-copy.store";
import { ProjectCopyStore } from "./project-copy.store";
import type { IHelpCenterStore } from "./help-center/help-center.store";
import { HelpCenterStore } from "./help-center/help-center.store";

export class RootStore extends CoreRootStore {
  timelineStore: ITimelineStore;
  worklog: ICEWorklogStore;
  customDashboard: DashboardStore;
  workflowStore: IWorkflowStore;
  moduleActivity: IModuleActivityStore;
  taskCategoryStore: ITaskCategoryStore;
  hoIssue: IHoIssueStore;
  projectFieldPermission: IProjectFieldPermissionStore;
  projectCopy: IProjectCopyStore;
  helpCenter: IHelpCenterStore;

  constructor() {
    super();

    this.timelineStore = new TimeLineStore(this);
    this.worklog = new CEWorklogStore();
    this.customDashboard = new DashboardStore(this);
    this.workflowStore = new WorkflowStore();
    this.moduleActivity = new ModuleActivityStore();
    this.taskCategoryStore = new TaskCategoryStore();
    this.hoIssue = new HoIssueStore();
    this.projectFieldPermission = new ProjectFieldPermissionStore();
    this.projectCopy = new ProjectCopyStore();
    this.helpCenter = new HelpCenterStore();
  }
}
