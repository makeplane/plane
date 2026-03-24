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

import { set } from "lodash-es";
import { action, computed, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
import { DEFAULT_PQL_FILTER_VALUE, EIssueFilterType } from "@plane/constants";
import type { TSupportedFilterTypeForUpdate } from "@plane/constants";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilters,
  IssuePaginationOptions,
  TIssueKanbanFilters,
  TIssueParams,
  TSupportedFilterForUpdate,
} from "@plane/types";
import type { IBaseIssueFilterStore } from "../helpers/issue-filter-helper.store";
import { IssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
import type { IIssueRootStore } from "../root.store";

const DEFAULT_RELEASE_FILTERS: IIssueFilters = {
  displayFilters: {
    layout: "list",
    group_by: "state_detail.group",
    sub_group_by: null,
    order_by: "sort_order",
    show_empty_groups: true,
    filters: {},
  } as IIssueDisplayFilterOptions,
  displayProperties: {
    key: true,
    state: true,
    labels: true,
    priority: true,
    due_date: true,
  } as IIssueDisplayProperties,
  kanbanFilters: { group_by: [], sub_group_by: [] } as TIssueKanbanFilters,
  richFilters: {},
  pqlFilters: DEFAULT_PQL_FILTER_VALUE,
  lastUsedFilterType: undefined,
};

export interface IReleaseIssuesFilter extends IBaseIssueFilterStore {
  getIssueFilters(releaseId: string): IIssueFilters | undefined;
  getFilterParams(
    options: IssuePaginationOptions,
    releaseId: string,
    cursor: string | undefined,
    groupId: string | undefined,
    subGroupId: string | undefined
  ): Partial<Record<TIssueParams, string | boolean>>;
  updateFilters: (
    projectId: string,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate
  ) => Promise<void>;
}

export class ReleaseIssuesFilter extends IssueFilterHelperStore implements IReleaseIssuesFilter {
  filters: { [releaseId: string]: IIssueFilters } = {};
  rootIssueStore: IIssueRootStore;

  constructor(_rootStore: IIssueRootStore) {
    super();
    makeObservable(this, {
      filters: observable,
      issueFilters: computed,
      appliedFilters: computed,
      updateFilters: action,
    });
    this.rootIssueStore = _rootStore;
  }

  get issueFilters(): IIssueFilters | undefined {
    const releaseId = this.rootIssueStore.releaseId;
    if (!releaseId) return undefined;
    return this.getIssueFilters(releaseId);
  }

  get appliedFilters() {
    return undefined;
  }

  getIssueFilters(releaseId: string): IIssueFilters | undefined {
    return this.filters[releaseId] ?? { ...DEFAULT_RELEASE_FILTERS };
  }

  getFilterParams = computedFn(
    (
      options: IssuePaginationOptions,
      _releaseId: string,
      cursor: string | undefined,
      groupId: string | undefined,
      subGroupId: string | undefined
    ): Partial<Record<TIssueParams, string | boolean>> => {
      const filterParams: Partial<Record<TIssueParams, string | boolean>> = {
        group_by: "state__group",
        order_by: "-created_at",
      };
      return this.getPaginationParams(filterParams, options, cursor, groupId, subGroupId);
    }
  );

  updateFilters: IReleaseIssuesFilter["updateFilters"] = async (projectId, type, filters) => {
    const releaseId = this.rootIssueStore.releaseId;
    if (!releaseId) return;
    if (!this.filters[releaseId]) {
      set(this.filters, [releaseId], { ...DEFAULT_RELEASE_FILTERS });
    }
    if (type === EIssueFilterType.KANBAN_FILTERS) {
      const kanbanFilters = filters as TIssueKanbanFilters;
      set(this.filters, [releaseId, "kanbanFilters"], {
        ...this.filters[releaseId].kanbanFilters,
        ...kanbanFilters,
      });
    }
  };
}
