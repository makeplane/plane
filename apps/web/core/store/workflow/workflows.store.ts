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

import { Workflow, WorkflowFilterStore } from "@plane/shared-state";
import { WorkflowsService } from "@plane/services";
import { action, comparer, makeObservable, observable, reaction, runInAction } from "mobx";
import type { RootStore } from "@/plane-web/store/root.store";
import type {
  TWorkflow,
  TWorkflowCreatePayload,
  TWorkflowResponse,
  TWorkflowState,
  TWorkflowStateTransition,
  TWorkflowStateType,
  IWorkflow,
  TLoader,
  IWorkflowFilterStore,
  IWorkflowState,
} from "@plane/types";
import { computedFn } from "mobx-utils";

export type TWorkflowStateInfo = {
  type: TWorkflowStateType;
  transitions: TWorkflowStateTransition[];
  allowCreation: boolean;
  isUnconstrained: boolean;
};

export type TWorkflowInfoTreeSection = {
  sectionKind: "default-workflow" | "type-scoped";
  showTypeHeader: boolean;
  typeId?: string;
  typeName?: string;
  defaultWorkflowTypeIds?: string[];
  stateType: TWorkflowStateType;
  allowCreation: boolean;
  transitions: TWorkflowStateTransition[];
};

export type TWorkflowInfoTree = {
  stateId: string;
  sections: TWorkflowInfoTreeSection[];
};

export interface IWorkflowsStore {
  // observables
  loader: TLoader;
  workflowsMap: Map<string, IWorkflow>;
  filters: IWorkflowFilterStore;
  // computed
  isMultipleWorkflowModeEnabled: (workspaceSlug: string, projectId: string) => boolean;
  isWorkflowsEnabled: (workspaceSlug: string, projectId: string) => boolean;
  isApprovalsEnabled: (workspaceSlug: string, projectId: string) => boolean;
  getWorkflowById: (workflowId: string) => IWorkflow | undefined;
  getFilteredProjectWorkflows: (projectId: string) => IWorkflow[];
  getProjectDefaultWorkflow: (projectId: string) => IWorkflow | undefined;
  getProjectWorkflows: (projectId: string) => IWorkflow[];
  getOccupiedWorkItemTypeIds: (projectId: string, workflowId?: string) => string[];
  getUnassignedWorkItemTypeIds: (projectId: string, workflowId?: string) => string[];
  // workflow resolution
  getApplicableWorkflowForType: (projectId: string, typeId: string) => IWorkflow | null;
  isStateCreationAllowedForType: (projectId: string, typeId: string, stateId: string) => boolean;
  getEligibleTypeIdsForState: (projectId: string, stateId: string) => string[];
  getCreationTypeForState: (projectId: string, stateId: string) => string | undefined;
  canCreateInStateAcrossTypes: (projectId: string, stateId: string) => boolean;
  getFirstCreationAllowedStateForType: (projectId: string, typeId: string) => string | undefined;
  hasTransitionsForState: (
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    typeId?: string | null
  ) => boolean;
  getWorkflowInfoTree: (
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    typeId?: string | null
  ) => TWorkflowInfoTree;
  resolveWorkflowForType: (projectId: string, typeId?: string | null) => IWorkflow | null;
  getWorkflowStateInfo: (projectId: string, typeId: string | null | undefined, stateId: string) => TWorkflowStateInfo;
  getAllowedTransitionStateIds: (
    workspaceSlug: string,
    projectId: string,
    typeId: string | null | undefined,
    currentStateId: string | null | undefined,
    currentUserId: string | undefined
  ) => { [key: string]: boolean };
  getCreationAllowedStateIds: (projectId: string, typeId?: string | null) => { [key: string]: boolean };
  isApprovalPending: (
    workspaceSlug: string,
    projectId: string,
    typeId: string | null | undefined,
    stateId: string
  ) => boolean;
  isCurrentUserApprover: (
    workspaceSlug: string,
    projectId: string,
    typeId: string | null | undefined,
    stateId: string,
    userId: string
  ) => boolean;
  // actions
  fetchAllWorkflows: (workspaceSlug: string) => Promise<void>;
  fetchProjectWorkflows: (workspaceSlug: string, projectId: string) => Promise<TWorkflow[]>;
  syncProjectStateToDefaultWorkflow: (projectId: string) => void;
  createWorkflow: (workspaceSlug: string, projectId: string, data: TWorkflowCreatePayload) => Promise<void>;
  deleteWorkflow: (workspaceSlug: string, projectId: string, workflowId: string) => Promise<void>;
  toggleWorkflows: (workspaceSlug: string, projectId: string, isEnabled: boolean) => Promise<void>;
  dispose: () => void;
}

export class WorkflowsStore implements IWorkflowsStore {
  // observables
  loader: TLoader = undefined;
  workflowsMap: Map<string, IWorkflow> = new Map();
  filters: IWorkflowFilterStore = new WorkflowFilterStore();
  // services
  workflowService: WorkflowsService;
  // root store
  rootStore: RootStore;
  private disposers: Array<() => void> = [];

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable,
      workflowsMap: observable,
      filters: observable.ref,
      // actions
      fetchAllWorkflows: action,
      syncProjectStateToDefaultWorkflow: action,
      createWorkflow: action,
      deleteWorkflow: action,
      toggleWorkflows: action,
    });

    // services
    this.workflowService = new WorkflowsService();
    // root store
    this.rootStore = _rootStore;

    const syncProjectStatesReaction = reaction(
      () => ({
        projectStates: Object.values(this.rootStore.state.stateMap).map((state) => ({
          id: state.id,
          projectId: state.project_id,
        })),
        defaultWorkflows: Array.from(this.workflowsMap.values())
          .filter((workflow) => workflow.is_default)
          .map((workflow) => ({
            id: workflow.id,
            projectId: workflow.project_id,
            stateIds: workflow.stateIds,
          })),
      }),
      ({ defaultWorkflows }) => {
        defaultWorkflows.forEach(({ projectId }) => this.syncProjectStateToDefaultWorkflow(projectId));
      },
      { equals: comparer.structural }
    );

    this.disposers.push(syncProjectStatesReaction);
  }

  private buildScopedStateMap = (
    projectId: string,
    workflow: IWorkflow | null,
    initialValue: boolean
  ): { [key: string]: boolean } => {
    const projectStates = this.rootStore.state.getProjectStates(projectId);
    const allIds = projectStates?.map((s) => s.id) ?? [];

    if (!workflow) {
      return allIds.reduce<Record<string, boolean>>((map, id) => {
        map[id] = initialValue;
        return map;
      }, {});
    }

    const workflowStateIds = new Set(workflow.stateIds);
    return allIds.reduce<Record<string, boolean>>((map, id) => {
      map[id] = workflowStateIds.has(id) ? initialValue : false;
      return map;
    }, {});
  };

  // computed

  isMultipleWorkflowModeEnabled = computedFn((workspaceSlug: string, projectId: string): boolean => {
    const isMultipleWorkflowsFeatureEnabled = this.rootStore.featureFlags.getFeatureFlag(
      workspaceSlug,
      "MULTIPLE_WORKFLOWS",
      false
    );
    const isWorkflowFeatureEnabled = this.rootStore.featureFlags.getFeatureFlag(workspaceSlug, "WORKFLOWS", false);
    const isWorkItemTypesEnabled = this.rootStore.workItemTypeBridge.isWorkItemTypeEnabledForProject(
      workspaceSlug,
      projectId
    );

    return isMultipleWorkflowsFeatureEnabled && isWorkItemTypesEnabled && isWorkflowFeatureEnabled;
  });

  isWorkflowsEnabled = computedFn((workspaceSlug: string, projectId: string): boolean => {
    const isWorkflowFeatureEnabled = this.rootStore.featureFlags.getFeatureFlag(workspaceSlug, "WORKFLOWS", false);
    const isWorkflowEnabled = this.rootStore.projectDetails.isProjectFeatureEnabled(projectId, "is_workflow_enabled");
    return isWorkflowFeatureEnabled && isWorkflowEnabled;
  });

  isApprovalsEnabled = computedFn((workspaceSlug: string, projectId: string): boolean => {
    const isMultipleWorkflowsFeatureEnabled = this.rootStore.featureFlags.getFeatureFlag(
      workspaceSlug,
      "MULTIPLE_WORKFLOWS",
      false
    );
    return this.isWorkflowsEnabled(workspaceSlug, projectId) && isMultipleWorkflowsFeatureEnabled;
  });

  getProjectDefaultWorkflow = computedFn((projectId: string): IWorkflow | undefined => {
    const projectWorkflows = this.getProjectWorkflows(projectId);
    return projectWorkflows.find((workflow) => workflow.is_default);
  });

  getProjectWorkflows = computedFn((projectId: string): IWorkflow[] => {
    return Array.from(this.workflowsMap.values()).filter((workflow: IWorkflow) => workflow.project_id === projectId);
  });

  getProjectActiveWorkflows = computedFn((projectId: string): IWorkflow[] => {
    return this.getProjectWorkflows(projectId).filter((workflow) => workflow.is_active);
  });

  getProjectActiveDefaultWorkflow = computedFn((projectId: string): IWorkflow | undefined => {
    return this.getProjectActiveWorkflows(projectId).find((workflow) => workflow.is_default);
  });

  getFilteredProjectWorkflows = computedFn((projectId: string): IWorkflow[] => {
    const workflows = this.getProjectWorkflows(projectId);
    const searchQuery = this.filters.searchQuery.trim().toLowerCase();
    const statuses = this.filters.statuses;
    const workItemTypeIds = this.filters.workItemTypeIds;
    const sortBy = this.filters.sortBy;
    const sortOrder = this.filters.sortOrder;

    let next = [...workflows];

    if (searchQuery) {
      next = next.filter((workflow) => {
        const haystack = `${workflow.name} ${workflow.description}`.toLowerCase();
        return haystack.includes(searchQuery);
      });
    }

    if (statuses.length > 0) {
      next = next.filter((workflow) => {
        const status = workflow.is_active ? "active" : "inactive";
        return statuses.includes(status);
      });
    }

    if (workItemTypeIds.length > 0) {
      next = next.filter((workflow) => {
        const workflowTypeIds = workflow.is_default
          ? this.getUnassignedWorkItemTypeIds(projectId, undefined)
          : workflow.work_item_type_ids;

        return workflowTypeIds.some((id) => workItemTypeIds.includes(id));
      });
    }

    next.sort((a, b) => {
      let left: string | number = a.name.toLowerCase();
      let right: string | number = b.name.toLowerCase();

      if (sortBy === "created_at") {
        left = new Date(a.created_at).getTime();
        right = new Date(b.created_at).getTime();
      } else if (sortBy === "updated_at") {
        left = new Date((a as TWorkflow & { updated_at?: string }).updated_at ?? a.created_at).getTime();
        right = new Date((b as TWorkflow & { updated_at?: string }).updated_at ?? b.created_at).getTime();
      }

      if (left < right) return sortOrder === "asc" ? -1 : 1;
      if (left > right) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return next;
  });

  getWorkflowById = computedFn((workflowId: string): IWorkflow | undefined => {
    return this.workflowsMap.get(workflowId);
  });

  /**
   * Returns a list of work item type ids that are used in the project workflows.
   */
  getOccupiedWorkItemTypeIds = computedFn((projectId: string, workflowId?: string): string[] => {
    const workflows = this.getProjectWorkflows(projectId).filter((w) => w.id !== workflowId);
    return workflows.flatMap((w) => w.work_item_type_ids);
  });

  getUnassignedWorkItemTypeIds = computedFn((projectId: string, workflowId?: string): string[] => {
    const projectWorkItemTypeIds = this.rootStore.workItemTypeBridge.getProjectIssueTypeIds(projectId);
    const occupiedWorkItemTypeIds = new Set(this.getOccupiedWorkItemTypeIds(projectId, workflowId));

    return projectWorkItemTypeIds.filter((typeId) => !occupiedWorkItemTypeIds.has(typeId));
  });

  /**
   * Resolves the applicable workflow for a given project + work item type.
   * For epics, always resolves to the project default workflow.
   */
  getApplicableWorkflowForType = computedFn((projectId: string, typeId: string): IWorkflow | null => {
    const workItemType = this.rootStore.workItemTypeBridge.getIssueTypeById(typeId);

    // Epics always follow the project's default workflow.
    if (workItemType?.is_epic) {
      return this.getProjectActiveDefaultWorkflow(projectId) ?? null;
    }

    const workflows = this.getProjectWorkflows(projectId);
    const match = workflows.find((w) => w.is_active && w.work_item_type_ids.includes(typeId));
    if (match) return match;

    return this.getProjectActiveDefaultWorkflow(projectId) ?? null;
  });

  isStateCreationAllowedForType = computedFn((projectId: string, typeId: string, stateId: string): boolean => {
    const workflow = this.getApplicableWorkflowForType(projectId, typeId);
    if (!workflow) return true;

    const workflowState = workflow.getStateById(stateId);
    if (!workflowState) return false;

    return workflowState.allow_issue_creation;
  });

  getEligibleTypeIdsForState = computedFn((projectId: string, stateId: string): string[] => {
    const projectWorkItemTypes = this.rootStore.workItemTypeBridge.getProjectIssueTypes(projectId, true);

    return Object.keys(projectWorkItemTypes).filter((typeId) =>
      this.isStateCreationAllowedForType(projectId, typeId, stateId)
    );
  });

  getCreationTypeForState = computedFn((projectId: string, stateId: string): string | undefined => {
    const defaultWorkItemType = this.rootStore.workItemTypeBridge.getProjectDefaultIssueType(projectId);
    const defaultWorkItemTypeId = defaultWorkItemType?.id;

    if (defaultWorkItemTypeId && this.isStateCreationAllowedForType(projectId, defaultWorkItemTypeId, stateId)) {
      return defaultWorkItemTypeId;
    }

    const eligibleTypeIds = this.getEligibleTypeIdsForState(projectId, stateId).filter(
      (id) => id !== defaultWorkItemTypeId
    );

    if (eligibleTypeIds.length > 0) return eligibleTypeIds[0];
    if (!defaultWorkItemTypeId) return this.getEligibleTypeIdsForState(projectId, stateId)[0];

    return undefined;
  });

  canCreateInStateAcrossTypes = computedFn((projectId: string, stateId: string): boolean => {
    const creationTypeId = this.getCreationTypeForState(projectId, stateId);
    if (creationTypeId) return true;
    const workflow = this.resolveWorkflowForType(projectId, undefined);
    if (!workflow) return false;
    const workflowState = workflow.getStateById(stateId);
    if (!workflowState) return false;
    return workflowState.allow_issue_creation;
  });

  getFirstCreationAllowedStateForType = computedFn((projectId: string, typeId: string): string | undefined => {
    // Prioritize the project default state
    const defaultStateId = this.rootStore.state.getProjectDefaultStateId(projectId);
    if (defaultStateId && this.isStateCreationAllowedForType(projectId, typeId, defaultStateId)) {
      return defaultStateId;
    }

    // Fallback: iterate states in group order (backlog → unstarted → started → completed → cancelled)
    const projectStates = this.rootStore.state.getProjectStates(projectId);
    if (!projectStates) return undefined;

    for (const state of projectStates) {
      if (state.id === defaultStateId) continue; // already checked
      if (this.isStateCreationAllowedForType(projectId, typeId, state.id)) {
        return state.id;
      }
    }

    return undefined;
  });

  hasTransitionsForState = computedFn(
    (workspaceSlug: string, projectId: string, stateId: string, typeId?: string | null): boolean => {
      const approvalsEnabled = this.isApprovalsEnabled(workspaceSlug, projectId);
      const isMultipleWorkflowModeEnabled = this.isMultipleWorkflowModeEnabled(workspaceSlug, projectId);
      const hasTransitions = (transitions: TWorkflowStateTransition[]) =>
        transitions.some((t) => Boolean(t.transition_state_id || (!approvalsEnabled && t.rejection_state_id)));

      if (typeId) {
        const info = this.getWorkflowStateInfo(projectId, typeId, stateId);
        return hasTransitions(info.transitions);
      }

      if (isMultipleWorkflowModeEnabled) {
        const projectWorkItemTypes = this.rootStore.workItemTypeBridge.getProjectIssueTypes(projectId, true);
        const typeIds = Object.keys(projectWorkItemTypes);
        if (typeIds.length > 0) {
          return typeIds.some((currentTypeId) => {
            const workflow = this.getApplicableWorkflowForType(projectId, currentTypeId);
            const workflowState = workflow?.getStateById(stateId);
            if (!workflowState) return false;
            const transitions = Array.from(workflowState.transitionsMap.values()).map(
              (transition) => transition.asJSON
            );
            return hasTransitions(transitions);
          });
        }
      }

      const defaultWorkflow = this.getProjectActiveDefaultWorkflow(projectId);
      const defaultWorkflowState = defaultWorkflow?.getStateById(stateId);
      if (!defaultWorkflowState) return false;
      const defaultTransitions = Array.from(defaultWorkflowState.transitionsMap.values()).map(
        (transition) => transition.asJSON
      );
      return hasTransitions(defaultTransitions);
    }
  );

  getWorkflowInfoTree = computedFn(
    (workspaceSlug: string, projectId: string, stateId: string, typeId?: string | null): TWorkflowInfoTree => {
      const approvalsEnabled = this.isApprovalsEnabled(workspaceSlug, projectId);
      const isMultipleWorkflowModeEnabled = this.isMultipleWorkflowModeEnabled(workspaceSlug, projectId);
      const sections: TWorkflowInfoTreeSection[] = [];

      const getNormalizedTransitions = (workflowState: IWorkflowState) => {
        const transitions = Array.from(workflowState.transitionsMap.values()).map((transition) => transition.asJSON);
        if (approvalsEnabled || workflowState.type !== "approval") return transitions;
        return transitions.flatMap((transition) => {
          const flattened: TWorkflowStateTransition[] = [];
          if (transition.transition_state_id) {
            flattened.push({
              ...transition,
              id: `${transition.id}-approve`,
              rejection_state_id: undefined,
            });
          }
          if (transition.rejection_state_id) {
            flattened.push({
              ...transition,
              id: `${transition.id}-reject`,
              transition_state_id: transition.rejection_state_id,
              rejection_state_id: undefined,
            });
          }
          return flattened;
        });
      };

      const getSectionForWorkflow = (
        workflow: IWorkflow | null,
        workflowStateId: string,
        sectionKind: "default-workflow" | "type-scoped",
        meta?: { typeId?: string; typeName?: string; defaultWorkflowTypeIds?: string[] }
      ): TWorkflowInfoTreeSection | null => {
        if (!workflow) return null;
        // Skip empty default-workflow groups when no work item types resolve to the default workflow.
        if (
          sectionKind === "default-workflow" &&
          meta?.defaultWorkflowTypeIds?.length === 0 &&
          isMultipleWorkflowModeEnabled
        )
          return null;

        const workflowState = workflow.getStateById(workflowStateId);
        if (!workflowState) return null;

        return {
          sectionKind,
          showTypeHeader: sectionKind === "type-scoped",
          typeId: meta?.typeId,
          typeName: meta?.typeName,
          defaultWorkflowTypeIds: meta?.defaultWorkflowTypeIds,
          stateType: approvalsEnabled ? workflowState.type : "transition",
          allowCreation: workflowState.allow_issue_creation,
          transitions: getNormalizedTransitions(workflowState),
        };
      };

      const projectWorkItemTypes = this.rootStore.workItemTypeBridge.getProjectIssueTypes(projectId, true);
      const defaultWorkItemTypeId = this.rootStore.workItemTypeBridge.getProjectDefaultIssueType(projectId)?.id;
      const sortedTypeIds = Object.keys(projectWorkItemTypes).sort((leftTypeId, rightTypeId) => {
        if (leftTypeId === defaultWorkItemTypeId) return -1;
        if (rightTypeId === defaultWorkItemTypeId) return 1;
        const leftTypeName = projectWorkItemTypes[leftTypeId]?.name?.toLowerCase() ?? "";
        const rightTypeName = projectWorkItemTypes[rightTypeId]?.name?.toLowerCase() ?? "";
        return leftTypeName.localeCompare(rightTypeName);
      });

      if (typeId) {
        const workflow = this.getApplicableWorkflowForType(projectId, typeId);
        const workItemType = this.rootStore.workItemTypeBridge.getIssueTypeById(typeId);
        const isDefaultWorkflowSection = workflow?.is_default ?? false;
        const defaultWorkflow = this.getProjectActiveDefaultWorkflow(projectId);
        const otherTypeIdsInDefaultWorkflow = sortedTypeIds.filter(
          (currentTypeId) =>
            currentTypeId !== typeId &&
            this.getApplicableWorkflowForType(projectId, currentTypeId)?.id === defaultWorkflow?.id
        );
        const section = getSectionForWorkflow(
          workflow,
          stateId,
          isDefaultWorkflowSection ? "default-workflow" : "type-scoped",
          isDefaultWorkflowSection
            ? { defaultWorkflowTypeIds: otherTypeIdsInDefaultWorkflow }
            : { typeId, typeName: workItemType?.name ?? "Work item" }
        );
        if (section) sections.push(section);
        return { stateId, sections };
      }

      if (!isMultipleWorkflowModeEnabled) {
        const defaultWorkflow = this.getProjectActiveDefaultWorkflow(projectId);
        const section = getSectionForWorkflow(defaultWorkflow ?? null, stateId, "default-workflow", {
          defaultWorkflowTypeIds: sortedTypeIds,
        });
        if (section) sections.push(section);
        return { stateId, sections };
      }

      const defaultWorkflow = this.getProjectActiveDefaultWorkflow(projectId);
      const defaultWorkflowTypeIds = sortedTypeIds.filter(
        (currentTypeId) => this.getApplicableWorkflowForType(projectId, currentTypeId)?.id === defaultWorkflow?.id
      );

      sortedTypeIds.forEach((currentTypeId) => {
        const workflow = this.getApplicableWorkflowForType(projectId, currentTypeId);
        if (workflow?.id === defaultWorkflow?.id) return;
        const workItemType = this.rootStore.workItemTypeBridge.getIssueTypeById(currentTypeId);
        const section = getSectionForWorkflow(workflow, stateId, "type-scoped", {
          typeId: currentTypeId,
          typeName: workItemType?.name ?? "Work item",
        });
        if (section) sections.push(section);
      });

      const defaultSection = getSectionForWorkflow(defaultWorkflow ?? null, stateId, "default-workflow", {
        defaultWorkflowTypeIds,
      });
      if (defaultSection) sections.push(defaultSection);

      return { stateId, sections };
    }
  );

  /**
   * Resolves the applicable workflow for a given project + work item type.
   * Falls back to the project default workflow when no type-specific match exists.
   */
  resolveWorkflowForType = computedFn((projectId: string, typeId?: string | null): IWorkflow | null => {
    if (typeId) return this.getApplicableWorkflowForType(projectId, typeId);

    return this.getProjectActiveDefaultWorkflow(projectId) ?? null;
  });

  /**
   * Returns transition/approval metadata for a specific state within
   * the resolved workflow. When no workflow or state rule exists the
   * result is marked `isUnconstrained` so callers can allow all states.
   */
  getWorkflowStateInfo = computedFn(
    (projectId: string, typeId: string | null | undefined, stateId: string): TWorkflowStateInfo => {
      const unconstrained: TWorkflowStateInfo = {
        type: "transition",
        transitions: [],
        allowCreation: true,
        isUnconstrained: true,
      };
      const workflow = this.resolveWorkflowForType(projectId, typeId);
      if (!workflow) return unconstrained;
      const wfState: IWorkflowState | undefined = workflow.getStateById(stateId);
      if (!wfState) return unconstrained;
      return {
        type: wfState.type,
        transitions: Array.from(wfState.transitionsMap.values()).map((t) => t.asJSON),
        allowCreation: wfState.allow_issue_creation,
        isUnconstrained: false,
      };
    }
  );

  /**
   * Returns a `{ stateId: true }` map of state IDs the user is allowed
   * to transition into from `currentStateId`. Always includes
   * `currentStateId` itself. For approval states only the current state
   * is returned (all normal transitions blocked).
   */
  getAllowedTransitionStateIds = computedFn(
    (
      workspaceSlug: string,
      projectId: string,
      typeId: string | null | undefined,
      currentStateId: string | null | undefined,
      currentUserId: string | undefined
    ): { [key: string]: boolean } => {
      const workflow = this.resolveWorkflowForType(projectId, typeId);
      const allMap = this.buildScopedStateMap(projectId, workflow, true);

      if (!currentStateId) return allMap;
      allMap[currentStateId] = true;

      const approvalsEnabled = this.isApprovalsEnabled(workspaceSlug, projectId);
      const info = this.getWorkflowStateInfo(projectId, typeId, currentStateId);
      if (info.isUnconstrained) return allMap;
      // If no transitions are defined, any state inside the workflow should be allowed
      if (info.transitions.length === 0) return allMap;
      // If the state is an approval state, only the current state should be allowed
      if (info.type === "approval" && approvalsEnabled) return { [currentStateId]: true };

      const allowedTransitions = info.transitions.filter(
        (t) => t.member_ids.length === 0 || (currentUserId && t.member_ids.includes(currentUserId))
      );

      Object.keys(allMap).forEach((id) => {
        if (
          !allowedTransitions.some((t) =>
            approvalsEnabled
              ? t.transition_state_id === id
              : t.transition_state_id === id || t.rejection_state_id === id
          )
        ) {
          allMap[id] = false;
        }
      });

      return allMap;
    }
  );

  /**
   * Returns a `{ stateId: true }` map of state IDs where work item
   * creation is allowed within the resolved workflow.
   */
  getCreationAllowedStateIds = computedFn((projectId: string, typeId?: string | null): { [key: string]: boolean } => {
    const workflow = this.resolveWorkflowForType(projectId, typeId);
    const allMap = this.buildScopedStateMap(projectId, workflow, true);
    if (!workflow) return allMap;

    workflow.stateIds.map((id) => {
      const ws = workflow.getStateById(id);
      if (ws) allMap[id] = ws.allow_issue_creation;
    });
    return allMap;
  });

  /**
   * Returns true when the state's workflow flow type is "approval",
   * meaning regular state updates should be blocked.
   */
  isApprovalPending = computedFn(
    (workspaceSlug: string, projectId: string, typeId: string | null | undefined, stateId: string): boolean => {
      if (!this.isApprovalsEnabled(workspaceSlug, projectId)) return false;
      const info = this.getWorkflowStateInfo(projectId, typeId, stateId);
      return info.type === "approval" && !info.isUnconstrained;
    }
  );

  /**
   * Returns true when the current user is an authorized approver for
   * the given approval state (empty `member_ids` means open to all).
   */
  isCurrentUserApprover = computedFn(
    (
      workspaceSlug: string,
      projectId: string,
      typeId: string | null | undefined,
      stateId: string,
      userId: string
    ): boolean => {
      if (!this.isApprovalsEnabled(workspaceSlug, projectId)) return false;
      const info = this.getWorkflowStateInfo(projectId, typeId, stateId);
      if (info.type !== "approval" || info.isUnconstrained) return false;
      return info.transitions.some((t) => t.member_ids.length === 0 || t.member_ids.includes(userId));
    }
  );

  // actions
  fetchAllWorkflows = async (workspaceSlug: string): Promise<void> => {
    try {
      this.loader = "init-loader";
      const response: TWorkflowResponse = await this.workflowService.fetchAll(workspaceSlug);

      runInAction(() => {
        response.results.forEach((workflow: TWorkflow) => {
          this.workflowsMap.set(workflow.id, new Workflow(workflow, this.workflowService));
        });
      });
    } catch (error) {
      console.error("Failed to fetch workflows", error);
      throw error;
    } finally {
      this.loader = undefined;
    }
  };
  //FIXME: right now this fetch is used only to show missing states warning in bulk. Remove the project fetch when new endpoint is added for states check.
  fetchProjectWorkflows = async (workspaceSlug: string, projectId: string): Promise<TWorkflow[]> => {
    try {
      this.loader = "init-loader";
      const response: TWorkflow[] = await this.workflowService.fetchProjectWorkflows(workspaceSlug, projectId);
      runInAction(() => {
        response.forEach((workflow: TWorkflow) => {
          const workflowInstance = this.getWorkflowById(workflow.id);
          if (workflowInstance) {
            workflowInstance.mutate({
              missing_states: workflow.missing_states ?? false,
            });
          }
        });
      });
      return response;
    } catch (error) {
      console.error("Failed to fetch project workflows", error);
      throw error;
    } finally {
      this.loader = undefined;
    }
  };

  _createDefaultWorkflow = async (workspaceSlug: string, projectId: string): Promise<void> => {
    const defaultWorkflow = this.getProjectDefaultWorkflow(projectId);
    if (defaultWorkflow) {
      return;
    }
    try {
      const response: TWorkflow = await this.workflowService.createDefault(workspaceSlug, projectId);
      runInAction(() => {
        this.workflowsMap.set(
          response.id,
          new Workflow({ ...response, states: response.states ?? [] }, this.workflowService)
        );
      });
    } catch (error) {
      console.error("Failed to create default workflow", error);
      throw error;
    }
  };

  syncProjectStateToDefaultWorkflow = (projectId: string): void => {
    const defaultWorkflow = this.getProjectDefaultWorkflow(projectId);
    if (!defaultWorkflow) return;
    const projectStates = this.rootStore.state.getProjectStates(projectId);
    if (!projectStates) return;

    const projectStateIds = projectStates.map((state) => state.id);
    const workflowStateIds = defaultWorkflow.stateIds;
    const workflowStateIdSet = new Set(workflowStateIds);
    const projectStateIdSet = new Set(projectStateIds);

    const statesToAdd: TWorkflowState[] = projectStateIds
      .filter((stateId) => !workflowStateIdSet.has(stateId))
      .map((stateId) => ({
        id: stateId,
        allow_issue_creation: true,
        transitions: [],
        type: "transition",
      }));
    const stateIdsToRemove = workflowStateIds.filter((stateId) => !projectStateIdSet.has(stateId));

    if (statesToAdd.length > 0) {
      defaultWorkflow.hydrateStates(statesToAdd);
    }

    if (stateIdsToRemove.length > 0) {
      defaultWorkflow.removeStates(stateIdsToRemove);
    }
  };

  createWorkflow = async (workspaceSlug: string, projectId: string, data: TWorkflowCreatePayload): Promise<void> => {
    try {
      const response: TWorkflow = await this.workflowService.create(workspaceSlug, projectId, data);
      runInAction(() => {
        this.workflowsMap.set(
          response.id,
          new Workflow({ ...response, states: response.states ?? [] }, this.workflowService)
        );
      });
    } catch (error) {
      console.error("Failed to create workflow", error);
      throw error;
    }
  };

  deleteWorkflow = async (workspaceSlug: string, projectId: string, workflowId: string): Promise<void> => {
    try {
      await this.workflowService.destroy(workspaceSlug, projectId, workflowId);
      runInAction(() => {
        this.workflowsMap.delete(workflowId);
      });
    } catch (error) {
      console.error("Failed to delete workflow", error);
      throw error;
    }
  };

  toggleWorkflows = async (workspaceSlug: string, projectId: string, isEnabled: boolean): Promise<void> => {
    try {
      await this.rootStore.projectDetails.toggleProjectFeatures(workspaceSlug, projectId, {
        is_workflow_enabled: isEnabled,
      });
      runInAction(() => {
        this.rootStore.projectDetails.features[projectId].is_workflow_enabled = isEnabled;
      });

      if (!isEnabled) {
        runInAction(() => {
          this.filters.reset();
        });
      }

      // Create default workflow
      if (isEnabled) {
        await this._createDefaultWorkflow(workspaceSlug, projectId);
      }
    } catch (error) {
      console.error("Failed to toggle workflows", error);
      throw error;
    }
  };

  dispose = () => {
    this.disposers.forEach((dispose) => dispose());
    this.disposers = [];
  };
}
