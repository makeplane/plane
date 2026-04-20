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

// Types and utilities for member filtering
import type { TMemberOrderByOptions } from "@plane/constants";
import type { IUserLite, TProjectMembership } from "@plane/types";
import type { WorkspaceMembership } from "./workspace/types";

export interface IMemberFilters {
  order_by?: TMemberOrderByOptions;
  roles?: string[];
}

// Helper function to parse order key and direction
export const parseOrderKey = (orderKey?: TMemberOrderByOptions): { field: string; direction: "asc" | "desc" } => {
  // Default to sorting by display_name in ascending order when no order key is provided
  if (!orderKey) {
    return {
      field: "display_name",
      direction: "asc",
    };
  }

  const isDescending = orderKey.startsWith("-");
  const field = isDescending ? orderKey.slice(1) : orderKey;
  return {
    field,
    direction: isDescending ? "desc" : "asc",
  };
};

// Unified function to get sort key for any member type
export const getMemberSortKey = (memberDetails: IUserLite, field: string, memberRole?: string): string | Date => {
  switch (field) {
    case "display_name":
      return memberDetails.display_name?.toLowerCase() || "";
    case "full_name": {
      const firstName = memberDetails.first_name || "";
      const lastName = memberDetails.last_name || "";
      return `${firstName} ${lastName}`.toLowerCase().trim();
    }
    case "email":
      return memberDetails.email?.toLowerCase() || "";
    case "joining_date": {
      if (!memberDetails.joining_date) {
        // Return a very old date for missing dates to sort them last
        return new Date(0);
      }
      const date = new Date(memberDetails.joining_date);
      // Return a very old date for invalid dates to sort them last
      return isNaN(date.getTime()) ? new Date(0) : date;
    }
    case "role":
      return (memberRole ?? "").toString().toLowerCase();
    default:
      return "";
  }
};

// Filter functions
export const filterProjectMembersByRole = (
  members: TProjectMembership[],
  roleFilters: string[]
): TProjectMembership[] => {
  if (roleFilters.length === 0) return members;

  return members.filter((member) => roleFilters.includes(member.role_slug));
};

export const filterWorkspaceMembersByRole = (
  members: WorkspaceMembership[],
  roleFilters: string[]
): WorkspaceMembership[] => {
  if (roleFilters.length === 0) return members;

  return members.filter((member) => {
    const memberRole = String(member.role_slug);
    const isSuspended = member.is_active === false;

    // Check if suspended is in the role filters
    const hasSuspendedFilter = roleFilters.includes("suspended");
    // Get non-suspended role filters
    const activeRoleFilters = roleFilters.filter((role) => role !== "suspended");

    // For suspended users, include them only if suspended filter is selected
    if (isSuspended) {
      return hasSuspendedFilter;
    }

    // For active users, include them only if their role matches any active role filter
    return activeRoleFilters.includes(memberRole);
  });
};

// Unified sorting function
export const sortMembers = <T>(
  members: T[],
  getUserDetails: (userId: string) => IUserLite | undefined,
  getMemberKey: (member: T) => string,
  getMemberRole: (member: T) => string,
  orderBy?: TMemberOrderByOptions
): T[] => {
  if (!orderBy) return members;

  const { field, direction } = parseOrderKey(orderBy);

  return [...members].sort((a, b) => {
    const aKey = getMemberKey(a);
    const bKey = getMemberKey(b);
    const aUserDetails = getUserDetails(aKey);
    const bUserDetails = getUserDetails(bKey);

    if (!aUserDetails || !bUserDetails) return 0;

    const aRole = getMemberRole(a);
    const bRole = getMemberRole(b);

    const aValue = getMemberSortKey(aUserDetails, field, aRole);
    const bValue = getMemberSortKey(bUserDetails, field, bRole);

    let comparison = 0;

    if (field === "joining_date") {
      // For dates, we need to handle Date objects and ensure they're valid
      const aDate = aValue instanceof Date ? aValue : new Date(aValue);
      const bDate = bValue instanceof Date ? bValue : new Date(bValue);

      // Handle invalid dates by treating them as very old dates
      const aTime = isNaN(aDate.getTime()) ? 0 : aDate.getTime();
      const bTime = isNaN(bDate.getTime()) ? 0 : bDate.getTime();

      comparison = aTime - bTime;
    } else {
      // For strings, use localeCompare for proper alphabetical sorting
      const aStr = String(aValue);
      const bStr = String(bValue);
      comparison = aStr.localeCompare(bStr);
    }

    return direction === "desc" ? -comparison : comparison;
  });
};

// Specific implementations using the unified functions
export const sortProjectMembers = (
  members: TProjectMembership[],
  getUserDetails: (userId: string) => IUserLite | undefined,
  getMemberKey: (member: TProjectMembership) => string,
  filters?: IMemberFilters
): TProjectMembership[] => {
  // Apply role filtering first
  const filteredMembers =
    filters?.roles && filters.roles.length > 0 ? filterProjectMembersByRole(members, filters.roles) : members;

  // If no order_by filter, return filtered members
  if (!filters?.order_by) return filteredMembers;

  // Apply sorting
  return sortMembers(filteredMembers, getUserDetails, getMemberKey, (member) => member.role_slug, filters.order_by);
};

export const sortWorkspaceMembers = (
  members: WorkspaceMembership[],
  getUserDetails: (userId: string) => IUserLite | undefined,
  getMemberKey: (member: WorkspaceMembership) => string,
  filters?: IMemberFilters
): WorkspaceMembership[] => {
  const filteredMembers =
    filters?.roles && filters.roles.length > 0 ? filterWorkspaceMembersByRole(members, filters.roles) : members;

  // If no order_by filter, return filtered members
  if (!filters?.order_by) return filteredMembers;

  // Apply sorting
  return sortMembers(
    filteredMembers,
    getUserDetails,
    getMemberKey,
    (member) => String(member.role_slug),
    filters.order_by
  );
};
