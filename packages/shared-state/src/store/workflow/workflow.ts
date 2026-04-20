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

import type {
  TWorkflow,
  TWorkflowState,
  TWorkflowStateDependencies,
  TWorkflowStateType,
  TWorkflowUpdatePayload,
  TWorkflowInstancePermissions,
  IWorkflow,
  TAddStatesToWorkflowPayload,
  IWorkflowService,
  IWorkflowState,
  TWorkflowSidebarStep,
  IWorkflowChangeHistoryStore,
} from "@plane/types";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { set } from "lodash-es";
import { WorkflowState } from "./state";
import { computedFn } from "mobx-utils";
import { WorkflowChangeHistoryStore } from "./change-history.store";

export class Workflow implements IWorkflow {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  work_item_type_ids: string[];
  states: TWorkflowState[] = [];
  missing_states?: boolean;
  created_by: string;
  created_at: string;
  activeSidebarTransitionId: string | null = null;
  activeSidebarStateId: string | null = null;
  editingTransitionIds: string[] = [];
  changeHistory: IWorkflowChangeHistoryStore;
  permissionAccessor: () => TWorkflowInstancePermissions;

  statesMap: Map<string, IWorkflowState> = new Map();
  workflowService: IWorkflowService;

  constructor(
    data: TWorkflow,
    _workflowService: IWorkflowService,
    permissionAccessor: () => TWorkflowInstancePermissions = () => ({ canEdit: false, canDelete: false })
  ) {
    makeObservable(this, {
      id: observable.ref,
      workspace_id: observable.ref,
      project_id: observable.ref,
      name: observable.ref,
      description: observable.ref,
      is_default: observable.ref,
      is_active: observable.ref,
      work_item_type_ids: observable,
      states: observable,
      missing_states: observable.ref,
      created_by: observable.ref,
      created_at: observable.ref,
      statesMap: observable,
      activeSidebarTransitionId: observable.ref,
      activeSidebarStateId: observable.ref,
      editingTransitionIds: observable,
      changeHistory: observable.ref,
      permissionAccessor: observable.ref,
      permissions: computed,
      asJSON: computed,
      stateIds: computed,
      isSidebarOpen: computed,
      mutate: action,
      openSidebar: action,
      closeSidebar: action,
      switchMode: action,
      startEditing: action,
      stopEditing: action,
      hydrateStates: action,
      removeStates: action,
      update: action,
      addStates: action,
      deleteState: action,
      transferAndDeleteState: action,
      clearDraftTransitions: action,
    });
    this.id = data.id;
    this.workspace_id = data.workspace_id;
    this.project_id = data.project_id;
    this.name = data.name;
    this.description = data.description;
    this.is_default = data.is_default;
    this.is_active = data.is_active;
    this.work_item_type_ids = data.work_item_type_ids ?? [];
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.workflowService = _workflowService;
    this.permissionAccessor = permissionAccessor;
    this.changeHistory = new WorkflowChangeHistoryStore({
      workflowId: data.id,
      projectId: data.project_id,
      workflowService: _workflowService,
    });
    this.initStates(data.states ?? []);
  }

  /**
   * @description Initialize states map
   * @states TWorkflowState[]
   */
  initStates(states: TWorkflowState[]) {
    this.states = states;
    states.forEach((state) => {
      this.statesMap.set(state.id, new WorkflowState(state, this.workflowService));
    });
  }

  get asJSON(): TWorkflow {
    return {
      id: this.id,
      workspace_id: this.workspace_id,
      project_id: this.project_id,
      name: this.name,
      description: this.description,
      is_default: this.is_default,
      is_active: this.is_active,
      work_item_type_ids: this.work_item_type_ids,
      states: this.stateIds.map((id) => this.statesMap.get(id)?.asJSON).filter(Boolean) as TWorkflowState[],
      created_by: this.created_by,
      created_at: this.created_at,
    };
  }

  get permissions(): TWorkflowInstancePermissions {
    return this.permissionAccessor();
  }

  get stateIds(): string[] {
    return Array.from(this.statesMap.keys());
  }

  get isSidebarOpen(): boolean {
    return this.activeSidebarTransitionId !== null;
  }

  getStateById = computedFn((stateId: string): IWorkflowState | undefined => {
    return this.statesMap.get(stateId);
  });

  isEditing = (transitionId: string): boolean => {
    return this.editingTransitionIds.includes(transitionId);
  };

  openSidebar = (stateId: string, transitionId: string, tab: TWorkflowSidebarStep) => {
    if (this.activeSidebarStateId && this.activeSidebarStateId !== stateId) {
      const prevState = this.statesMap.get(this.activeSidebarStateId);
      prevState?.sidebarHelper.closeTab();
    }
    this.activeSidebarStateId = stateId;
    this.activeSidebarTransitionId = transitionId;
    const state = this.statesMap.get(stateId);
    state?.sidebarHelper.selectTab(tab);
  };

  closeSidebar = () => {
    if (this.activeSidebarStateId) {
      const state = this.statesMap.get(this.activeSidebarStateId);
      state?.sidebarHelper.closeTab();
    }
    this.activeSidebarStateId = null;
    this.activeSidebarTransitionId = null;
  };

  /**
   * @description All transitions will go to view mode if editing.
   * @description New draft transitions will be removed
   */
  clearDraftTransitions = () => {
    runInAction(() => {
      this.editingTransitionIds = [];
      this.statesMap.forEach((state) => state.clearAllDraftTransitions());
    });
  };

  switchMode = async (stateId: string, newType: TWorkflowStateType, workspaceSlug: string, projectId: string) => {
    const state = this.statesMap.get(stateId);
    if (!state) return;

    await state.update(workspaceSlug, projectId, this.id, { type: newType });

    runInAction(() => {
      const transitionIdsToRemove = new Set(state.transitionIds);
      this.editingTransitionIds = this.editingTransitionIds.filter((id) => !transitionIdsToRemove.has(id));
      state.clearTransitions();
      if (this.activeSidebarStateId === stateId) {
        this.closeSidebar();
      }
      // Create a draft transition and open the sidebar for that
      const draftId = state.addDraftTransition();
      this.openSidebar(stateId, draftId, "flow_type");
      this.startEditing(draftId);
    });
  };

  startEditing = (transitionId: string) => {
    if (!this.editingTransitionIds.includes(transitionId)) {
      this.editingTransitionIds = [...this.editingTransitionIds, transitionId];
    }
  };

  stopEditing = (transitionId: string) => {
    this.editingTransitionIds = this.editingTransitionIds.filter((id) => id !== transitionId);
  };

  mutate(data: Partial<TWorkflow>) {
    runInAction(() => {
      Object.keys(data).map((key) => {
        const dataKey = key as keyof TWorkflow;
        set(this, [dataKey], data[dataKey]);
      });
    });
  }

  hydrateStates = (states: TWorkflowState[]) => {
    const statesToHydrate = states.filter((state) => !this.statesMap.has(state.id));
    if (statesToHydrate.length === 0) return;

    runInAction(() => {
      this.mutate({
        states: [...this.states, ...statesToHydrate],
      });

      statesToHydrate.forEach((state) => {
        this.statesMap.set(state.id, new WorkflowState(state, this.workflowService));
      });
    });
  };

  removeStates = (stateIds: string[]) => {
    const stateIdsToRemove = stateIds.filter((stateId) => this.statesMap.has(stateId));
    if (stateIdsToRemove.length === 0) return;

    const stateIdsToRemoveSet = new Set(stateIdsToRemove);

    runInAction(() => {
      this.mutate({
        states: this.states.filter((state) => !stateIdsToRemoveSet.has(state.id)),
      });

      stateIdsToRemove.forEach((stateId) => {
        this.statesMap.delete(stateId);
      });
    });
  };

  update = async (workspaceSlug: string, projectId: string, data: Partial<TWorkflowUpdatePayload>) => {
    const beforeUpdate = { ...this.asJSON };
    try {
      // optimistic update for active toggle
      if (Object.keys(data).includes("is_active")) {
        this.mutate({ is_active: data.is_active });
      }
      const response = await this.workflowService.update(workspaceSlug, projectId, this.id, data);
      this.mutate(response);
    } catch (error) {
      // revert changes
      this.mutate(beforeUpdate);
      console.error("Error updating workflow", error);
      throw error;
    }
  };

  addStates = async (workspaceSlug: string, projectId: string, data: TAddStatesToWorkflowPayload) => {
    try {
      await this.workflowService.addStates(workspaceSlug, projectId, this.id, data);
      this.hydrateStates(
        data.state_ids.map(
          (stateId): TWorkflowState => ({
            id: stateId,
            allow_issue_creation: true,
            transitions: [],
            type: "transition",
          })
        )
      );
    } catch (error) {
      console.error("Error adding states to workflow", error);
      throw error;
    }
  };

  deleteState = async (workspaceSlug: string, projectId: string, stateId: string) => {
    try {
      await this.workflowService.deleteState(workspaceSlug, projectId, this.id, stateId);
      this.removeStates([stateId]);
    } catch (error) {
      // revert changes
      console.error("Error deleting state from workflow", error);
      throw error;
    }
  };

  getStateDependencies = (stateId: string): TWorkflowStateDependencies => {
    const targetState = this.statesMap.get(stateId);
    if (!targetState) return { transitionCount: 0, approvalCount: 0 };

    // Count the target state's own persisted transitions
    let transitionCount = targetState.type === "transition" ? targetState.persistedTransitionIds.length : 0;
    let approvalCount = targetState.type === "approval" ? targetState.persistedTransitionIds.length : 0;

    // Scan other states for transitions referencing this state
    this.statesMap.forEach((ws, wsId) => {
      if (wsId === stateId) return;
      ws.persistedTransitionIds.forEach((tId) => {
        const t = ws.getTransitionById(tId);
        if (!t) return;
        const references = t.transition_state_id === stateId || t.rejection_state_id === stateId;
        if (!references) return;
        if (ws.type === "approval") {
          approvalCount++;
        } else {
          transitionCount++;
        }
      });
    });

    return { transitionCount, approvalCount };
  };

  transferAndDeleteState = async (workspaceSlug: string, projectId: string, stateId: string, newStateId: string) => {
    try {
      await this.workflowService.transferAndDeleteState(workspaceSlug, projectId, this.id, stateId, {
        new_state_id: newStateId,
      });
      this.removeStates([stateId]);

      // The destination state becomes the new default if the current state is default and must allow creation.
      runInAction(() => {
        const currentState = this.getStateById(stateId);
        const isCurrentStateDefault = currentState && currentState.is_default;
        const destinationState = this.getStateById(newStateId);
        if (destinationState && isCurrentStateDefault) {
          destinationState.mutate({ allow_issue_creation: true, is_default: true });
        }
      });
    } catch (error) {
      console.error("Error migrating and deleting state from workflow", error);
      throw error;
    }
  };
}
