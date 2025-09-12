// Types and utilities for member filtering
import type { EUserPermissions, TMemberOrderByOptions } from "@plane/constants";
import type { IUserLite, TProjectMembership } from "@plane/types";

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
    case "joining_date":
      return new Date(memberDetails.joining_date || 0);
    case "role":
      return String(memberRole || "");
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

  return members.filter((member) => {
    const memberWithRole = member as TProjectMembership & { original_role?: string | null };
    const memberRole = String(member.role || memberWithRole.original_role || "");
    return roleFilters.includes(memberRole);
  });
};

export const filterWorkspaceMembersByRole = <T extends { role: string | EUserPermissions }>(
  members: T[],
  roleFilters: string[]
): T[] => {
  if (roleFilters.length === 0) return members;

  return members.filter((member) => {
    const memberRole = String(member.role || "");
    return roleFilters.includes(memberRole);
  });
};

// Unified sorting function
export const sortMembers = <T>(
  members: T[],
  memberDetailsMap: Record<string, IUserLite>,
  getMemberKey: (member: T) => string,
  getMemberRole: (member: T) => string,
  orderBy?: TMemberOrderByOptions
): T[] => {
  if (!orderBy) return members;

  const { field, direction } = parseOrderKey(orderBy);

  return [...members].sort((a, b) => {
    const aKey = getMemberKey(a);
    const bKey = getMemberKey(b);
    const aMemberDetails = memberDetailsMap[aKey];
    const bMemberDetails = memberDetailsMap[bKey];

    if (!aMemberDetails || !bMemberDetails) return 0;

    const aRole = getMemberRole(a);
    const bRole = getMemberRole(b);

    const aValue = getMemberSortKey(aMemberDetails, field, aRole);
    const bValue = getMemberSortKey(bMemberDetails, field, bRole);

    let comparison = 0;

    if (field === "joining_date") {
      // For dates, we need to handle Date objects
      const aDate = aValue instanceof Date ? aValue : new Date(aValue);
      const bDate = bValue instanceof Date ? bValue : new Date(bValue);
      comparison = aDate.getTime() - bDate.getTime();
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
  memberDetailsMap: Record<string, IUserLite>,
  getMemberKey: (member: TProjectMembership) => string,
  filters?: IMemberFilters
): TProjectMembership[] => {
  // Apply role filtering first
  const filteredMembers =
    filters?.roles && filters.roles.length > 0 ? filterProjectMembersByRole(members, filters.roles) : members;

  // If no order_by filter, return filtered members
  if (!filters?.order_by) return filteredMembers;

  // Apply sorting
  return sortMembers(
    filteredMembers,
    memberDetailsMap,
    getMemberKey,
    (member) => {
      const memberWithRole = member as TProjectMembership & { original_role?: string | null };
      return String(member.role || memberWithRole.original_role || "");
    },
    filters.order_by
  );
};

export const sortWorkspaceMembers = <T extends { role: string | EUserPermissions }>(
  members: T[],
  memberDetailsMap: Record<string, IUserLite>,
  getMemberKey: (member: T) => string,
  filters?: IMemberFilters
): T[] => {
  // Apply role filtering first
  const filteredMembers =
    filters?.roles && filters.roles.length > 0 ? filterWorkspaceMembersByRole(members, filters.roles) : members;

  // If no order_by filter, return filtered members
  if (!filters?.order_by) return filteredMembers;

  // Apply sorting
  return sortMembers(
    filteredMembers,
    memberDetailsMap,
    getMemberKey,
    (member) => String(member.role || ""),
    filters.order_by
  );
};
