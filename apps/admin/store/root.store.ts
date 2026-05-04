/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { enableStaticRendering } from "mobx-react";
// stores
import type { IInstanceStore } from "./instance.store";
import { InstanceStore } from "./instance.store";
import type { IThemeStore } from "./theme.store";
import { ThemeStore } from "./theme.store";
import type { IInstanceUserStore } from "./instance-user.store";
import { InstanceUserStore } from "./instance-user.store";
import type { IUserStore } from "./user.store";
import { UserStore } from "./user.store";
import type { IWorkspaceStore } from "./workspace.store";
import { WorkspaceStore } from "./workspace.store";
import type { IInstanceDepartmentStore } from "./instance-department.store";
import { InstanceDepartmentStore } from "./instance-department.store";
import type { IInstanceStaffStore } from "./instance-staff.store";
import { InstanceStaffStore } from "./instance-staff.store";
import type { IMonitoringStore } from "./monitoring.store";
import { MonitoringStore } from "./monitoring.store";
import type { IInstanceTaskCategoryStore } from "./instance-task-category.store";
import { InstanceTaskCategoryStore } from "./instance-task-category.store";
import type { IInstanceJobPositionStore } from "./instance-job-position.store";
import { InstanceJobPositionStore } from "./instance-job-position.store";
import type { IBusinessCalendarStore } from "./business-calendar.store";
import { BusinessCalendarStore } from "./business-calendar.store";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  theme: IThemeStore;
  instance: IInstanceStore;
  user: IUserStore;
  instanceUser: IInstanceUserStore;
  workspace: IWorkspaceStore;
  instanceDepartment: IInstanceDepartmentStore;
  instanceStaff: IInstanceStaffStore;
  monitoring: IMonitoringStore;
  instanceTaskCategory: IInstanceTaskCategoryStore;
  instanceJobPosition: IInstanceJobPositionStore;
  businessCalendar: IBusinessCalendarStore;

  constructor() {
    this.theme = new ThemeStore(this);
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.instanceUser = new InstanceUserStore(this);
    this.workspace = new WorkspaceStore(this);
    this.instanceDepartment = new InstanceDepartmentStore(this);
    this.instanceStaff = new InstanceStaffStore(this);
    this.monitoring = new MonitoringStore(this);
    this.instanceTaskCategory = new InstanceTaskCategoryStore();
    this.instanceJobPosition = new InstanceJobPositionStore();
    this.businessCalendar = new BusinessCalendarStore();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pre-existing hydrate pattern
  hydrate(initialData: Record<string, any>) {
    this.theme.hydrate(initialData.theme as string);
    this.instance.hydrate(initialData.instance as Parameters<typeof this.instance.hydrate>[0]);
    this.user.hydrate(initialData.user);
    this.workspace.hydrate(initialData.workspace as Record<string, never>);
  }

  resetOnSignOut() {
    localStorage.setItem("theme", "system");
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.instanceUser = new InstanceUserStore(this);
    this.theme = new ThemeStore(this);
    this.workspace = new WorkspaceStore(this);
    this.instanceDepartment = new InstanceDepartmentStore(this);
    this.instanceStaff = new InstanceStaffStore(this);
    this.monitoring = new MonitoringStore(this);
    this.instanceTaskCategory = new InstanceTaskCategoryStore();
    this.instanceJobPosition = new InstanceJobPositionStore();
    this.businessCalendar = new BusinessCalendarStore();
  }
}
