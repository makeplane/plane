/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { IWorkItemFilterInstance } from "@plane/shared-state";
import { CORE_LOGICAL_OPERATOR } from "@plane/types";

type UseQuickFiltersReturn = {
  /**
   * IDs of users whose issues ARE currently visible.
   * Empty array means no filter (all visible).
   */
  visibleAssigneeIds: string[];
  /**
   * Whether there's an active assignee filter
   */
  hasActiveFilter: boolean;
  /**
   * Check if a specific member's issues are currently visible
   */
  isMemberVisible: (memberId: string) => boolean;
  /**
   * Toggle visibility of a member's issues
   */
  toggleMemberVisibility: (memberId: string, allMemberIds: string[]) => void;
};

// Helper to get visible assignee IDs from condition value
const getVisibleIdsFromValue = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") return [value];
  return [];
};

export const useQuickFilters = (membersIds: string[], filter: IWorkItemFilterInstance | undefined): UseQuickFiltersReturn => {
  // Access filter.expression directly to ensure MobX tracks changes
  // This is critical for reactivity - without this, the component won't re-render when filter changes
  const _expression = filter?.expression;

  // Find existing assignee condition (can be "in" for multiple values or "exact" for single)
  const findAssigneeCondition = () => {
    if (!filter) return undefined;
    // Try "in" operator first (multiple values)
    const inCondition = filter.findFirstConditionByPropertyAndOperator("assignee_id", "in");
    if (inCondition) return inCondition;
    // Fall back to "exact" operator (single value)
    return filter.findFirstConditionByPropertyAndOperator("assignee_id", "exact");
  };

  const assigneeCondition = findAssigneeCondition();

  // Get assignee IDs from the filter condition (these are users whose issues ARE visible)
  // Also access assigneeCondition.value to ensure MobX tracks value changes
  const conditionValue = assigneeCondition?.value;
  const visibleAssigneeIds = assigneeCondition ? getVisibleIdsFromValue(conditionValue) : [...membersIds];

  const hasActiveFilter = visibleAssigneeIds.length > 0;

  // Check if a specific member's issues are currently visible
  // NOTE: Not using useCallback - we want this to always use fresh values
  const isMemberVisible = (memberId: string): boolean => {
    // If no filter, all members are visible
    if (!hasActiveFilter) return true;
    // If filter exists, member is visible if they're in the filter
    return visibleAssigneeIds.includes(memberId);
  };

  // Toggle visibility of a member's issues
  // NOTE: Not using useCallback - we want this to always use fresh values from the filter
  const toggleMemberVisibility = (memberId: string, allMemberIds: string[]) => {
    if (!filter) return;

    // Re-fetch condition to ensure we have fresh data
    const currentCondition = findAssigneeCondition();
    const currentVisibleIds = currentCondition ? getVisibleIdsFromValue(currentCondition.value) : [];
    const currentHasActiveFilter = currentVisibleIds.length > 0;
    const isCurrentlyVisible = !currentHasActiveFilter || currentVisibleIds.includes(memberId);

    if (!currentHasActiveFilter) {
      // No filter exists, user clicks on a highlighted avatar
      // → Create filter with ALL users EXCEPT this one (hide this user's issues)
      const newVisibleIds = allMemberIds.filter((id) => id !== memberId);

      if (newVisibleIds.length === 0) {
        // Edge case: only one user in project, can't hide them
        return;
      }

      filter.addCondition(
        CORE_LOGICAL_OPERATOR.AND,
        {
          property: "assignee_id",
          operator: "in",
          value: newVisibleIds,
        },
        false
      );
    } else if (isCurrentlyVisible) {
      // Filter exists, user clicks on a highlighted avatar (visible user)
      // → Remove this user from filter (hide their issues)
      const newVisibleIds = currentVisibleIds.filter((id) => id !== memberId);

      if (newVisibleIds.length === 0) {
        // Can't hide everyone, remove the filter instead
        filter.removeCondition(currentCondition!.id);
      } else {
        filter.updateConditionValue(currentCondition!.id, newVisibleIds, true);
      }
    } else {
      // Filter exists, user clicks on a dimmed avatar (hidden user)
      // → Add this user to filter (show their issues)
      const newVisibleIds = [...currentVisibleIds, memberId];

      // If all users are now visible, remove the filter entirely
      if (newVisibleIds.length >= allMemberIds.length) {
        filter.removeCondition(currentCondition!.id);
      } else {
        filter.updateConditionValue(currentCondition!.id, newVisibleIds, true);
      }
    }
  };

  return {
    visibleAssigneeIds,
    hasActiveFilter,
    isMemberVisible,
    toggleMemberVisibility,
  };
};
