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
  IWorkflowService,
  IWorkflowSidebarHelper,
  IWorkflowState,
  IWorkflowTransition,
  TUpdateWorkflowStatePayload,
  TWorkflowState,
  TWorkflowStateTransition,
  TWorkflowStateType,
} from "@plane/types";
import set from "lodash-es/set";
import { makeObservable, observable, computed, action, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
import { WorkflowSidebarHelper } from "./sidebar-helper";
import { WorkflowTransition } from "./transition";

export class WorkflowState implements IWorkflowState {
  id: string;
  allow_issue_creation: boolean;
  transitions: TWorkflowStateTransition[];
  type: TWorkflowStateType;

  transitionsMap: Map<string, IWorkflowTransition> = new Map();

  workflowService: IWorkflowService;
  sidebarHelper: IWorkflowSidebarHelper;

  constructor(data: TWorkflowState, _workflowService: IWorkflowService) {
    makeObservable(this, {
      id: observable,
      allow_issue_creation: observable,
      transitions: observable,
      type: observable,
      transitionsMap: observable,
      transitionIds: computed,
      persistedTransitionIds: computed,
      draftTransitionIds: computed,
      asJSON: computed,
      mutate: action,
      addDraftTransition: action,
      removeDraftTransition: action,
      addTransition: action,
      deleteTransition: action,
      clearTransitions: action,
      update: action,
    });

    this.id = data.id;
    this.transitions = data.transitions ?? [];
    this.type = data.type ?? "transition";
    this.allow_issue_creation = data.allow_issue_creation ?? true;
    this.workflowService = _workflowService;
    this.sidebarHelper = new WorkflowSidebarHelper();

    this.transitions.forEach((t) => {
      const transition = new WorkflowTransition(
        {
          ...t,
          member_ids: t.member_ids ?? [],
          isDraft: t.isDraft ?? false,
          stateType: this.type,
        },
        _workflowService
      );
      this.transitionsMap.set(t.id, transition);
    });
  }

  get transitionIds(): string[] {
    return Array.from(this.transitionsMap.keys());
  }

  get persistedTransitionIds(): string[] {
    return this.transitionIds.filter((id) => !this.transitionsMap.get(id)?.isDraft);
  }

  get draftTransitionIds(): string[] {
    return this.transitionIds.filter((id) => this.transitionsMap.get(id)?.isDraft);
  }

  getTransitionById = computedFn((id: string): IWorkflowTransition | undefined => {
    return this.transitionsMap.get(id);
  });

  getOccupiedStateIds = computedFn((excludeTransitionId?: string): string[] => {
    if (this.type !== "transition") return [];

    return this.transitionIds
      .filter((id) => id !== excludeTransitionId)
      .map((id) => this.transitionsMap.get(id)?.transition_state_id)
      .filter((stateId): stateId is string => !!stateId);
  });

  get asJSON(): TWorkflowState {
    const transitions = this.persistedTransitionIds
      .map((id) => this.transitionsMap.get(id)?.asJSON)
      .filter((t): t is TWorkflowStateTransition => !!t);
    return {
      id: this.id,
      allow_issue_creation: this.allow_issue_creation,
      transitions,
      type: this.type,
    };
  }

  mutate(data: Partial<TWorkflowState>) {
    runInAction(() => {
      Object.keys(data).forEach((key) => {
        const dataKey = key as keyof TWorkflowState;
        if (data[dataKey] !== undefined) {
          set(this, [dataKey], data[dataKey]);
        }
      });
    });
  }

  addDraftTransition = (): string => {
    const draftId = `draft_${uuidv4()}`;
    runInAction(() => {
      const transition = new WorkflowTransition(
        {
          id: draftId,
          transition_state_id: "",
          member_ids: [],
          isDraft: true,
          stateType: this.type,
        },
        this.workflowService
      );
      this.transitionsMap.set(draftId, transition);
      this.transitions = [...this.transitions, transition.asJSON];
    });
    return draftId;
  };

  /**
   * @description Clears all draft transitions: All transitions will go to view mode if editing.
   */
  clearAllDraftTransitions = () => {
    runInAction(() => {
      this.transitionsMap.forEach((transition) => {
        if (transition.isDraft) {
          this.transitionsMap.delete(transition.id);
        } else {
          transition.revertToSnapshot();
        }
      });
    });
  };

  removeDraftTransition = (draftId: string) => {
    runInAction(() => {
      this.transitionsMap.delete(draftId);
      this.transitions = this.persistedTransitionIds
        .map((id) => this.transitionsMap.get(id)?.asJSON)
        .filter((t): t is TWorkflowStateTransition => !!t);
    });
  };

  addTransition = async (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: Omit<TWorkflowStateTransition, "id" | "isDraft">,
    draftId?: string
  ): Promise<IWorkflowTransition> => {
    const payload = {
      state_id: this.id,
      transition_state_id: data.transition_state_id,
      rejection_state_id: data.rejection_state_id,
      member_ids: data.member_ids,
      pre_rules: data.pre_rules ?? [],
      post_rules: data.post_rules ?? [],
    };
    const response = await this.workflowService.addStateTransition(workspaceSlug, projectId, workflowId, payload);

    return runInAction(() => {
      if (draftId) {
        this.transitionsMap.delete(draftId);
      }
      const transition = new WorkflowTransition({ ...response, stateType: this.type }, this.workflowService);
      this.transitionsMap.set(transition.id, transition);
      this.transitions = this.persistedTransitionIds
        .map((id) => this.transitionsMap.get(id)?.asJSON)
        .filter((t): t is TWorkflowStateTransition => !!t);
      return transition;
    });
  };

  deleteTransition = async (workspaceSlug: string, projectId: string, workflowId: string, transitionId: string) => {
    const transition = this.transitionsMap.get(transitionId);
    if (transition?.isDraft) {
      runInAction(() => this.removeDraftTransition(transitionId));
      return;
    }
    await this.workflowService.deleteStateTransition(workspaceSlug, projectId, workflowId, transitionId);
    runInAction(() => {
      this.transitionsMap.delete(transitionId);
      this.transitions = this.persistedTransitionIds
        .map((id) => this.transitionsMap.get(id)?.asJSON)
        .filter((t): t is TWorkflowStateTransition => !!t);
    });
  };

  update = async (workspaceSlug: string, projectId: string, workflowId: string, data: TUpdateWorkflowStatePayload) => {
    const beforeUpdate = { ...this.asJSON };
    try {
      runInAction(() => this.mutate(data));
      await this.workflowService.updateState(workspaceSlug, projectId, workflowId, this.id, data);
    } catch (error) {
      console.error("Error updating workflow state", error);
      runInAction(() => this.mutate(beforeUpdate));
      throw error;
    }
  };

  clearTransitions = () => {
    runInAction(() => {
      this.transitionsMap.clear();
      this.transitions = [];
    });
  };
}
