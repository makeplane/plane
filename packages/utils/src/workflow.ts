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

import { sortBy, values } from "lodash-es";
// plane imports
import type {
  IState,
  IStateTransition,
  IStateTransitionTree,
  TWorkflowChangeHistoryKeys,
  TWorkflowChangeHistoryFields,
  TWorkflowChangeHistoryVerbs,
  TIssue,
  TIssueGroupByOptions,
  TWorkflowStateType,
} from "@plane/types";

/**
 * Get the key for the workflow change history based on the field and verb
 * @param changeHistoryField - The field of the change history
 * @param changeHistoryVerb - The verb of the change history
 * @returns The key for the workflow change history
 */
export const getWorkflowChangeHistoryKey = (
  changeHistoryField: TWorkflowChangeHistoryFields | undefined,
  changeHistoryVerb: TWorkflowChangeHistoryVerbs
) => `${changeHistoryField ? `${changeHistoryField}_` : ""}${changeHistoryVerb}` as TWorkflowChangeHistoryKeys;

/**
 * Converts an array of IStateTransition to an array of IStateTransitionTree
 * by merging transitions with identical approvers.
 *
 * @param transitions - Array of IStateTransition objects
 * @returns Array of IStateTransitionTree objects
 */
export function convertToStateTransitionTree(transitions: IStateTransition[]): IStateTransitionTree[] {
  // Create a map to track transitions by approvers
  const transitionMap: Record<string, IStateTransitionTree> = {};

  // Process each transition
  transitions.forEach((transition) => {
    // Sort approvers for consistent comparisons
    const sortedApprovers = sortBy(transition.approvers);
    // Create a key using the sorted approvers joined by a delimiter that won't appear in UUIDs
    const key = sortedApprovers.join("|");

    if (transitionMap[key]) {
      // If this approver set already exists, add this transition_state_id to the array
      transitionMap[key].transition_state_ids.push(transition.transition_state_id);
    } else {
      // Otherwise, create a new entry in the map
      transitionMap[key] = {
        transition_state_ids: [transition.transition_state_id],
        approvers: sortedApprovers,
      };
    }
  });

  // Convert the map values to an array
  return values(transitionMap);
}

type TGroupedStates = Record<string, IState[]>;

type TFilterGroupedStates = {
  groupedStates?: TGroupedStates;
  includedStateIds?: string[];
  excludedStateIds?: string[];
  searchQuery?: string;
};

export const filterGroupedStates = ({
  groupedStates,
  includedStateIds,
  excludedStateIds = [],
  searchQuery = "",
}: TFilterGroupedStates): TGroupedStates => {
  if (!groupedStates) return {};

  const includedStateIdSet = includedStateIds ? new Set(includedStateIds) : undefined;
  const excludedStateIdSet = new Set(excludedStateIds);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  return Object.entries(groupedStates).reduce<TGroupedStates>((acc, [groupKey, groupStates]) => {
    const filteredStates = groupStates.filter((state) => {
      if (includedStateIdSet && !includedStateIdSet.has(state.id)) return false;
      if (excludedStateIdSet.has(state.id)) return false;
      if (normalizedSearchQuery && !state.name.toLowerCase().includes(normalizedSearchQuery)) return false;

      return true;
    });

    if (filteredStates.length > 0) {
      acc[groupKey] = filteredStates;
    }

    return acc;
  }, {});
};

export const countGroupedStates = (groupedStates: TGroupedStates): number =>
  Object.values(groupedStates).reduce((total, states) => total + states.length, 0);

type TResolveStateHeaderCreationArgs = {
  groupBy: TIssueGroupByOptions | undefined;
  groupId: string;
  workItemPayload: Partial<TIssue>;
  disableIssueCreation?: boolean;
  projectId?: string;
  workflowsEnabled: boolean;
  canCreateInStateAcrossTypes: (projectId: string, stateId: string) => boolean;
  getCreationTypeForState: (projectId: string, stateId: string) => string | undefined;
  isWorkItemTypeEnabled: boolean;
  getFirstCreationAllowedStateForType: (projectId: string, typeId: string) => string | undefined;
  isTypeActive: (typeId: string) => boolean;
};

type TResolveStateHeaderCreationResult = {
  isCreationDisabled: boolean;
  createModalData: Partial<TIssue>;
};

type TIssueTypeProperty = {
  is_required?: boolean;
};

type TIssueTypeWithProperties = {
  id?: string;
  activeProperties?: TIssueTypeProperty[];
};

type TResolveQuickAddCreationContextArgs = {
  isEpic: boolean;
  prePopulatedData?: Partial<TIssue>;
  defaultIssueTypeId?: string;
  workflowsEnabled: boolean;
  getCreationTypeForState: (projectId: string, stateId: string) => string | undefined;
  projectId: string;
  isWorkItemTypeEnabled: boolean;
  groupBy: TIssueGroupByOptions;
  subGroupBy: TIssueGroupByOptions;
  isStateCreationAllowedForType: (projectId: string, typeId: string, stateId: string) => boolean;
  getFirstCreationAllowedStateForType: (projectId: string, typeId: string) => string | undefined;
  isTypeActive: (typeId: string) => boolean;
};

type TResolveQuickAddCreationContextResult = {
  creationTypeId?: string;
  modalData?: Partial<TIssue>;
  resolvedPrePopulatedData?: Partial<TIssue>;
  shouldHideQuickAdd: boolean;
  shouldUseModalWithFallbackType: boolean;
};

export const resolveStateHeaderCreation = ({
  groupBy,
  groupId,
  workItemPayload,
  disableIssueCreation,
  projectId,
  workflowsEnabled,
  canCreateInStateAcrossTypes,
  getCreationTypeForState,
  isWorkItemTypeEnabled,
  getFirstCreationAllowedStateForType,
  isTypeActive,
}: TResolveStateHeaderCreationArgs): TResolveStateHeaderCreationResult => {
  const defaultResult: TResolveStateHeaderCreationResult = {
    isCreationDisabled: Boolean(disableIssueCreation),
    createModalData: workItemPayload,
  };

  if (!projectId || !isWorkItemTypeEnabled) return defaultResult;

  if (groupBy === "type") {
    // Disabled types cannot have new work items created
    if (!isTypeActive(groupId)) {
      return { isCreationDisabled: true, createModalData: workItemPayload };
    }
    if (!workflowsEnabled) {
      return {
        isCreationDisabled: defaultResult.isCreationDisabled,
        createModalData: { ...workItemPayload, type_id: groupId },
      };
    }
    const allowedStateId = getFirstCreationAllowedStateForType(projectId, groupId);
    return {
      isCreationDisabled: defaultResult.isCreationDisabled || !allowedStateId,
      createModalData: allowedStateId
        ? { ...workItemPayload, type_id: groupId, state_id: allowedStateId }
        : workItemPayload,
    };
  }

  if (groupBy !== "state") return defaultResult;

  if (!workflowsEnabled) {
    return {
      isCreationDisabled: defaultResult.isCreationDisabled,
      createModalData: { ...workItemPayload, state_id: groupId },
    };
  }

  const workflowCreationTypeId = getCreationTypeForState(projectId, groupId);
  const isWorkflowStateCreationDisabled = !canCreateInStateAcrossTypes(projectId, groupId);

  return {
    isCreationDisabled: defaultResult.isCreationDisabled || isWorkflowStateCreationDisabled,
    createModalData: workflowCreationTypeId
      ? { ...workItemPayload, state_id: groupId, type_id: workflowCreationTypeId }
      : workItemPayload,
  };
};

export const resolveQuickAddCreationContext = ({
  isEpic,
  prePopulatedData,
  defaultIssueTypeId,
  workflowsEnabled,
  getCreationTypeForState,
  projectId,
  isWorkItemTypeEnabled,
  groupBy,
  subGroupBy,
  isStateCreationAllowedForType,
  getFirstCreationAllowedStateForType,
  isTypeActive,
}: TResolveQuickAddCreationContextArgs): TResolveQuickAddCreationContextResult => {
  if (!isWorkItemTypeEnabled)
    return {
      creationTypeId: defaultIssueTypeId,
      modalData: prePopulatedData,
      resolvedPrePopulatedData: prePopulatedData,
      shouldHideQuickAdd: false,
      shouldUseModalWithFallbackType: false,
    };

  const prePopulatedTypeId = prePopulatedData?.type_id ?? undefined;
  const targetStateId = prePopulatedData?.state_id ?? undefined;

  // Type-aware logic: when type_id is pre-populated (from type grouping)
  if (prePopulatedTypeId) {
    // Disabled types cannot have new work items created
    if (!isTypeActive(prePopulatedTypeId)) {
      return {
        shouldHideQuickAdd: true,
        shouldUseModalWithFallbackType: false,
      };
    }
    const isStateFromGrouping = groupBy === "state" || subGroupBy === "state";

    if (isStateFromGrouping && targetStateId) {
      if (!workflowsEnabled) {
        return {
          creationTypeId: prePopulatedTypeId,
          modalData: { ...prePopulatedData, type_id: prePopulatedTypeId },
          resolvedPrePopulatedData: prePopulatedData,
          shouldHideQuickAdd: false,
          shouldUseModalWithFallbackType: false,
        };
      }
      // Case 1: Both type and state from explicit grouping
      const isAllowed = isStateCreationAllowedForType(projectId, prePopulatedTypeId, targetStateId);
      return {
        creationTypeId: prePopulatedTypeId,
        modalData: { ...prePopulatedData, type_id: prePopulatedTypeId },
        resolvedPrePopulatedData: prePopulatedData,
        shouldHideQuickAdd: !isAllowed,
        shouldUseModalWithFallbackType: false,
      };
    } else {
      if (!workflowsEnabled) {
        const resolvedData = { ...prePopulatedData, type_id: prePopulatedTypeId };
        return {
          creationTypeId: prePopulatedTypeId,
          modalData: resolvedData,
          resolvedPrePopulatedData: resolvedData,
          shouldHideQuickAdd: false,
          shouldUseModalWithFallbackType: false,
        };
      }
      // Case 2: Type from grouping, state not from grouping — find best state
      const allowedStateId = getFirstCreationAllowedStateForType(projectId, prePopulatedTypeId);
      const resolvedData = allowedStateId
        ? { ...prePopulatedData, type_id: prePopulatedTypeId, state_id: allowedStateId }
        : prePopulatedData;
      return {
        creationTypeId: prePopulatedTypeId,
        modalData: resolvedData,
        resolvedPrePopulatedData: resolvedData,
        shouldHideQuickAdd: !allowedStateId,
        shouldUseModalWithFallbackType: false,
      };
    }
  }

  if (!workflowsEnabled) {
    const resultData =
      !isEpic && defaultIssueTypeId ? { ...prePopulatedData, type_id: defaultIssueTypeId } : prePopulatedData;

    return {
      creationTypeId: defaultIssueTypeId,
      modalData: resultData,
      resolvedPrePopulatedData: resultData,
      shouldHideQuickAdd: false,
      shouldUseModalWithFallbackType: false,
    };
  }

  // Existing logic for non-type grouping
  const creationTypeId =
    !isEpic && targetStateId ? getCreationTypeForState(projectId, targetStateId) : defaultIssueTypeId;
  const shouldHideQuickAdd = !isEpic && Boolean(targetStateId) && !creationTypeId;
  const shouldUseModalWithFallbackType =
    !isEpic &&
    Boolean(targetStateId) &&
    Boolean(creationTypeId) &&
    Boolean(defaultIssueTypeId) &&
    creationTypeId !== defaultIssueTypeId;

  const resultData = !isEpic && creationTypeId ? { ...prePopulatedData, type_id: creationTypeId } : prePopulatedData;

  return {
    creationTypeId,
    modalData: resultData,
    resolvedPrePopulatedData: resultData,
    shouldHideQuickAdd,
    shouldUseModalWithFallbackType,
  };
};

export const getMandatoryFields = (issueType?: TIssueTypeWithProperties): TIssueTypeProperty[] => {
  return issueType?.activeProperties?.filter((property) => Boolean(property.is_required)) ?? [];
};

// State Flow Card
export type TStateFlowCardMode = "view" | "edit" | "create";

export const isStateSelectionComplete = (
  stateType: TWorkflowStateType | undefined,
  hasTransitionState: boolean,
  hasRejectionState: boolean
): boolean => (stateType === "approval" ? hasTransitionState && hasRejectionState : hasTransitionState);

export const getFlowProgress = (
  stateType: TWorkflowStateType | undefined,
  hasStateSelection: boolean,
  hasMembers: boolean
): number => {
  if (!stateType) return 0;

  const eachSection = 100 / 3;
  const typeProgress = eachSection;
  const statesProgress = hasStateSelection ? eachSection : 0;
  const membersProgress = hasMembers ? eachSection : 0;

  return Math.round(typeProgress + statesProgress + membersProgress);
};

export const shouldShowProgress = (mode: TStateFlowCardMode, progress: number): boolean =>
  mode !== "view" && progress > 0;

export const canSaveTransition = (
  mode: TStateFlowCardMode,
  isValid: boolean,
  hasUnsavedChanges: boolean | undefined
): boolean => (mode === "create" ? isValid : isValid && !!hasUnsavedChanges);
