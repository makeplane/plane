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

import { set, unset } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TDashboard, TDashboardLevel } from "@plane/types";
// plane web store
import type { RootStore } from "@/plane-web/store/root.store";
import type { IDashboardInstance, TDashboardCombinedHelpers } from "./dashboard";
import { DashboardInstance } from "./dashboard";
import type { IWorkspaceDashboardsStore } from "./workspace-dashboards.store";
import { WorkspaceDashboardsStore } from "./workspace-dashboards.store";

export interface IBaseDashboardsStore {
  // helpers
  getAllDashboardsByLevel: (dashboardLevel: TDashboardLevel) => IDashboardInstance[];
  getDashboardById: (dashboardId: string) => IDashboardInstance | undefined;
  // actions
  addDashboard: (
    dashboard: TDashboard,
    dashboardLevel: TDashboardLevel,
    combinedHelpers: TDashboardCombinedHelpers
  ) => void;
  removeDashboard: (dashboardId: string) => void;
  // sub-stores
  workspaceDashboards: IWorkspaceDashboardsStore;
}

export class BaseDashboardsStore implements IBaseDashboardsStore {
  // observables
  private data: Record<string, DashboardInstance> = {}; // dashboardId => DashboardInstance
  // root store
  rootStore: RootStore;
  // sub-stores
  workspaceDashboards: WorkspaceDashboardsStore;

  constructor(store: RootStore) {
    makeObservable<BaseDashboardsStore, "data">(this, {
      // observables,
      data: observable,
      // actions
      addDashboard: action,
      removeDashboard: action,
    });
    // initialize root store
    this.rootStore = store;
    // sub-stores
    this.workspaceDashboards = new WorkspaceDashboardsStore(this, store);
  }

  getAllDashboardsByLevel: IBaseDashboardsStore["getAllDashboardsByLevel"] = computedFn((dashboardLevel) => {
    const dashboardIds = Object.values(this.data);
    return dashboardIds.filter((d) => d.dashboardLevel === dashboardLevel);
  });

  getDashboardById: IBaseDashboardsStore["getDashboardById"] = computedFn((dashboardId) => {
    const dashboardInstance = this.data[dashboardId];
    return dashboardInstance ?? undefined;
  });

  addDashboard: IBaseDashboardsStore["addDashboard"] = (dashboard, dashboardLevel, combinedHelpers) => {
    try {
      const dashboardId = dashboard.id;
      if (!dashboardId) throw new Error("dashboardId not present");
      runInAction(() => {
        set(
          this.data,
          [dashboardId],
          new DashboardInstance(this.rootStore, dashboard, dashboardLevel, combinedHelpers)
        );
      });
    } catch (error) {
      console.error("Failed to add dashboard instance:", error);
      throw error;
    }
  };

  removeDashboard: IBaseDashboardsStore["removeDashboard"] = (dashboardId) => {
    try {
      runInAction(() => {
        unset(this.data, [dashboardId]);
      });
    } catch (error) {
      console.error("Failed to remove dashboard instance:", error);
      throw error;
    }
  };
}
