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

import { action, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type { IUserLite, TProjectMembership } from "@plane/types";
// local imports
import type { IMemberFilters } from "../utils";
import { sortProjectMembers } from "../utils";

export interface IProjectMemberFiltersStore {
  // observables
  filtersMap: Record<string, IMemberFilters>;
  // computed actions
  getFilteredMemberIds: (
    members: TProjectMembership[],
    memberDetailsMap: Record<string, IUserLite>,
    getMemberKey: (member: TProjectMembership) => string,
    projectId: string
  ) => string[];
  // actions
  updateFilters: (projectId: string, filters: Partial<IMemberFilters>) => void;
  getFilters: (projectId: string) => IMemberFilters | undefined;
}

export class ProjectMemberFiltersStore implements IProjectMemberFiltersStore {
  // observables
  filtersMap: Record<string, IMemberFilters> = {};

  constructor() {
    makeObservable(this, {
      // observables
      filtersMap: observable,
      // actions
      updateFilters: action,
    });
  }

  /**
   * @description get filtered and sorted member ids
   * @param members - array of project membership objects
   * @param memberDetailsMap - map of member details by user id
   * @param getMemberKey - function to get member key from membership object
   * @param projectId - project id to get filters for
   */
  getFilteredMemberIds = computedFn(
    (
      members: TProjectMembership[],
      memberDetailsMap: Record<string, IUserLite>,
      getMemberKey: (member: TProjectMembership) => string,
      projectId: string
    ): string[] => {
      if (!members || members.length === 0) return [];

      // Apply filters and sorting
      const sortedMembers = sortProjectMembers(members, memberDetailsMap, getMemberKey, this.filtersMap[projectId]);

      return sortedMembers.map(getMemberKey);
    }
  );

  getFilters = (projectId: string) => this.filtersMap[projectId];

  /**
   * @description update filters
   * @param projectId - project id
   * @param filters - partial filters to update
   */
  updateFilters = (projectId: string, filters: Partial<IMemberFilters>) => {
    const current = this.filtersMap[projectId] ?? {};
    this.filtersMap[projectId] = { ...current, ...filters };
  };
}
