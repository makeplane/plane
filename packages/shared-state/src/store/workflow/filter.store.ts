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

import isEqual from "lodash-es/isEqual";
import { action, computed, makeObservable, observable } from "mobx";
import type { TWorkflowStatusFilter, TWorkflowSortBy, TWorkflowSortOrder, IWorkflowFilterStore } from "@plane/types";

type TWorkflowDefaultFilters = {
  statuses: TWorkflowStatusFilter[];
  workItemTypeIds: string[];
  sortBy: TWorkflowSortBy;
  sortOrder: TWorkflowSortOrder;
};

export class WorkflowFilterStore implements IWorkflowFilterStore {
  searchQuery = "";
  statuses: TWorkflowStatusFilter[] = [];
  workItemTypeIds: string[] = [];
  sortBy: TWorkflowSortBy = "created_at";
  sortOrder: TWorkflowSortOrder = "asc";

  defaultFilters: TWorkflowDefaultFilters = {
    statuses: [],
    workItemTypeIds: [],
    sortBy: "created_at",
    sortOrder: "asc",
  };

  constructor() {
    makeObservable(this, {
      searchQuery: observable,
      statuses: observable,
      workItemTypeIds: observable,
      sortBy: observable,
      sortOrder: observable,
      isFiltersChanged: computed,
      isSortChanged: computed,
      setSearchQuery: action,
      setStatuses: action,
      setWorkItemTypeIds: action,
      setSortBy: action,
      setSortOrder: action,
      reset: action,
    });
  }

  get isFiltersChanged() {
    // filters other than default filters
    return !isEqual(
      {
        statuses: this.statuses,
        workItemTypeIds: this.workItemTypeIds,
      },
      {
        statuses: this.defaultFilters.statuses,
        workItemTypeIds: this.defaultFilters.workItemTypeIds,
      }
    );
  }

  get isSortChanged() {
    return !isEqual(this.sortBy, this.defaultFilters.sortBy) || !isEqual(this.sortOrder, this.defaultFilters.sortOrder);
  }

  setSearchQuery = (value: string) => {
    this.searchQuery = value;
  };

  setStatuses = (statuses: TWorkflowStatusFilter[]) => {
    this.statuses = statuses;
  };

  setWorkItemTypeIds = (ids: string[]) => {
    this.workItemTypeIds = ids;
  };

  setSortBy = (value: TWorkflowSortBy) => {
    this.sortBy = value;
  };

  setSortOrder = (value: TWorkflowSortOrder) => {
    this.sortOrder = value;
  };

  reset = () => {
    this.searchQuery = "";
    this.statuses = this.defaultFilters.statuses;
    this.workItemTypeIds = this.defaultFilters.workItemTypeIds;
    this.sortBy = this.defaultFilters.sortBy;
    this.sortOrder = this.defaultFilters.sortOrder;
  };
}
