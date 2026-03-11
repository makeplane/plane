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

import orderBy from "lodash-es/orderBy";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import type {
  IWorkflowChangeHistoryStore,
  IWorkflowService,
  TLoader,
  TWorkflowChangeHistory,
  TWorkflowChangeHistorySortOrder,
} from "@plane/types";

export class WorkflowChangeHistoryStore implements IWorkflowChangeHistoryStore {
  sortOrder: TWorkflowChangeHistorySortOrder = "asc";
  loader: TLoader = undefined;
  activities: TWorkflowChangeHistory[] = [];

  private workflowId: string;
  private projectId: string;
  private workflowService: IWorkflowService;

  constructor(props: { workflowId: string; projectId: string; workflowService: IWorkflowService }) {
    makeObservable(this, {
      sortOrder: observable.ref,
      loader: observable.ref,
      activities: observable.ref,
      sortedActivities: computed,
      toggleSortOrder: action,
      fetch: action,
      reset: action,
    });

    this.workflowId = props.workflowId;
    this.projectId = props.projectId;
    this.workflowService = props.workflowService;
  }

  get sortedActivities() {
    return orderBy(this.activities, ["created_at"], [this.sortOrder]);
  }

  toggleSortOrder = () => {
    this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
  };

  reset = () => {
    this.loader = undefined;
    this.activities = [];
  };

  fetch = async (workspaceSlug: string) => {
    try {
      const isInitialLoad = this.activities.length === 0;
      this.loader = isInitialLoad ? "init-loader" : "mutation";

      let params = {};

      if (!isInitialLoad) {
        const maxCreatedAt = this.activities.reduce((max, item) => {
          return Date.parse(item.created_at) > Date.parse(max) ? item.created_at : max;
        }, this.activities[0].created_at);

        params = { created_at__gt: maxCreatedAt };
      }

      const response = await this.workflowService.fetchWorkflowChangeHistory(
        workspaceSlug,
        this.projectId,
        this.workflowId,
        params
      );

      runInAction(() => {
        this.activities = orderBy([...this.activities, ...response], ["created_at"], [this.sortOrder]);
      });
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };
}
