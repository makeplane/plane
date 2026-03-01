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
import type { EUserPermissions } from "@plane/constants";
import type { IUserLite } from "@plane/types";
// local imports
import type { IMemberFilters } from "../utils";
import { sortWorkspaceMembers } from "../utils";

// Workspace membership interface matching the store structure
interface IWorkspaceMembership {
  id: string;
  member: string;
  role: EUserPermissions;
  is_active?: boolean;
}

export interface IWorkspaceMemberFiltersStore {
  // observables
  filters: IMemberFilters;
  // computed actions
  getFilteredMemberIds: (
    members: IWorkspaceMembership[],
    memberDetailsMap: Record<string, IUserLite>,
    getMemberKey: (member: IWorkspaceMembership) => string
  ) => string[];
  // actions
  updateFilters: (filters: Partial<IMemberFilters>) => void;
}

export class WorkspaceMemberFiltersStore implements IWorkspaceMemberFiltersStore {
  // observables
  filters: IMemberFilters = {};

  constructor() {
    makeObservable(this, {
      // observables
      filters: observable,
      // actions
      updateFilters: action,
    });
  }

  /**
   * @description get filtered and sorted member ids
   * @param members - array of workspace membership objects
   * @param memberDetailsMap - map of member details by user id
   * @param getMemberKey - function to get member key from membership object
   */
  getFilteredMemberIds = computedFn(
    (
      members: IWorkspaceMembership[],
      memberDetailsMap: Record<string, IUserLite>,
      getMemberKey: (member: IWorkspaceMembership) => string
    ): string[] => {
      if (!members || members.length === 0) return [];

      // Apply filters and sorting
      const sortedMembers = sortWorkspaceMembers(members, memberDetailsMap, getMemberKey, this.filters);

      return sortedMembers.map(getMemberKey);
    }
  );

  /**
   * @description update filters
   * @param filters - partial filters to update
   */
  updateFilters = (filters: Partial<IMemberFilters>) => {
    this.filters = { ...this.filters, ...filters };
  };
}
