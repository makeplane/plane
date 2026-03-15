/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { IWorkItemFilterInstance } from "@plane/shared-state";
import { CORE_LOGICAL_OPERATOR } from "@plane/types";
import { EMPTY_FILTER_VALUE, UNASSIGNED_VALUE } from "@plane/utils";

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
   * Whether the "unassigned" filter is currently active
   */
  isUnassignedActive: boolean;
  /**
   * Check if a specific member's issues are currently visible
   */
  isMemberVisible: (memberId: string) => boolean;
  /**
   * Toggle visibility of a member's issues
   */
  toggleMemberVisibility: (memberId: string, allMemberIds: string[]) => void;
  /**
   * Toggle visibility of unassigned issues
   */
  toggleUnassigned: () => void;
};

// Helper to get visible assignee IDs from condition value
const getVisibleIdsFromValue = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") return [value];
  return [];
};

export const useQuickFilters = (membersIds: string[], filter: IWorkItemFilterInstance | undefined): UseQuickFiltersReturn => {
  // Access multiple observables to ensure MobX tracks changes
  // 1. expression - the main observable that changes when conditions are added/updated/removed
  // 2. hasActiveFilters - computed that depends on expression
  // 3. allConditionsForDisplay - computed that extracts conditions from expression
  const _expression = filter?.expression;
  const _hasActiveFilters = filter?.hasActiveFilters;
  const allConditions = filter?.allConditionsForDisplay ?? [];

  // Find assignee condition from the computed conditions (reactive)
  const assigneeCondition = allConditions.find(
    (c) => c.property === "assignee_id" && (c.operator === "in" || c.operator === "exact")
  );

  // Helper to find condition for toggle operations (non-reactive, used inside actions)
  const findAssigneeCondition = () => {
    if (!filter) return undefined;
    const inCondition = filter.findFirstConditionByPropertyAndOperator("assignee_id", "in");
    if (inCondition) return inCondition;
    return filter.findFirstConditionByPropertyAndOperator("assignee_id", "exact");
  };

  // Get raw IDs from condition value
  const conditionValue = assigneeCondition?.value;
  const rawVisibleIds = assigneeCondition ? getVisibleIdsFromValue(conditionValue) : [];

  // Check if this is an empty filter (__empty__ means 0 results, all dimmed)
  const isEmptyFilter = rawVisibleIds.includes(EMPTY_FILTER_VALUE);

  // visibleAssigneeIds - IDs of users whose issues ARE currently visible
  // - Empty filter: [] (no one visible)
  // - No condition: all members + "none" (everyone visible)
  // - Has condition: values from condition
  const visibleAssigneeIds = isEmptyFilter
    ? []
    : assigneeCondition
      ? rawVisibleIds
      : [...membersIds, UNASSIGNED_VALUE];

  // hasActiveFilter - whether there's an active assignee filter
  const hasActiveFilter = visibleAssigneeIds.length > 0;

  // isUnassignedActive - whether unassigned issues are visible
  const isUnassignedActive = visibleAssigneeIds.includes(UNASSIGNED_VALUE);

  // Check if a specific member's issues are currently visible
  const isMemberVisible = (memberId: string): boolean => visibleAssigneeIds.includes(memberId);

  // Toggle visibility of a member's issues (unified logic for members and unassigned)
  const toggleMemberVisibility = (memberId: string, allMemberIds: string[]) => {
    if (!filter) return;

    // Re-fetch condition to ensure we have fresh data
    const currentCondition = findAssigneeCondition();
    const allIds = [...allMemberIds, UNASSIGNED_VALUE];

    // Determine current state
    const rawCurrentIds = currentCondition ? getVisibleIdsFromValue(currentCondition.value) : [];
    const isCurrentEmpty = rawCurrentIds.includes(EMPTY_FILTER_VALUE);

    // Calculate current visible IDs
    // - Empty filter: 0 visible
    // - No condition: all visible
    // - Has condition: values from condition
    const currentVisibleIds = isCurrentEmpty ? [] : currentCondition ? rawCurrentIds : [...allIds];

    const isCurrentlyVisible = currentVisibleIds.includes(memberId);

    if (isCurrentlyVisible) {
      // Click on bright (visible) → remove from filter (hide)
      const newIds = currentVisibleIds.filter((id) => id !== memberId);

      if (newIds.length === 0) {
        if (currentCondition) {
          filter.updateConditionValue(currentCondition.id, [EMPTY_FILTER_VALUE], true);
        } else {
          filter.addCondition(
            CORE_LOGICAL_OPERATOR.AND,
            {
              property: "assignee_id",
              operator: "in",
              value: [EMPTY_FILTER_VALUE],
            },
            false
          );
        }

        return;
      }

      // Update/create condition with remaining IDs
      if (currentCondition) {
        filter.updateConditionValue(currentCondition.id, newIds, true);
      } else {
        filter.addCondition(
          CORE_LOGICAL_OPERATOR.AND,
          {
            property: "assignee_id",
            operator: "in",
            value: newIds,
          },
          false
        );
      }
    } else {
      // Click on dim (hidden) → add to filter (show)
      // If was empty filter, start fresh with just this member
      const baseIds = isCurrentEmpty ? [] : currentVisibleIds;
      const newIds = [...baseIds, memberId];

      if (newIds.length >= allIds.length) {
        // All visible → remove condition (initial state)
        if (currentCondition) filter.removeCondition(currentCondition.id);
      } else {
        if (currentCondition) {
          filter.updateConditionValue(currentCondition.id, newIds, true);
        } else {
          filter.addCondition(
            CORE_LOGICAL_OPERATOR.AND,
            {
              property: "assignee_id",
              operator: "in",
              value: newIds,
            },
            false
          );
        }
      }
    }
  };

  // Toggle visibility of unassigned issues (uses the same logic as toggleMemberVisibility)
  const toggleUnassigned = () => {
    toggleMemberVisibility(UNASSIGNED_VALUE, membersIds);
  };

  return {
    visibleAssigneeIds,
    hasActiveFilter,
    isUnassignedActive,
    isMemberVisible,
    toggleMemberVisibility,
    toggleUnassigned,
  };
};
