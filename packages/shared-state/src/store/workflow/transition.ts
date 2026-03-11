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
  IWorkflowTransition,
  TUpdateStateTransitionPayload,
  TWorkflowStateTransition,
  TWorkflowStateType,
} from "@plane/types";
import { getChangedFields } from "@plane/utils";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash-es/set";

export class WorkflowTransition implements IWorkflowTransition {
  id: string;
  transition_state_id: string;
  rejection_state_id?: string;
  member_ids: string[];
  isDraft: boolean;

  private _snapshot: TWorkflowStateTransition;
  private stateType: TWorkflowStateType;
  private workflowService: IWorkflowService;

  constructor(data: TWorkflowStateTransition & { stateType?: TWorkflowStateType }, _workflowService: IWorkflowService) {
    makeObservable(this, {
      id: observable.ref,
      transition_state_id: observable.ref,
      rejection_state_id: observable.ref,
      member_ids: observable,
      isDraft: observable,
      asJSON: computed,
      isValid: computed,
      hasUnsavedChanges: computed,
      unsavedChangesPayload: computed,
      mutate: action,
      update: action,
      revertToSnapshot: action,
    });

    this.id = data.id;
    this.transition_state_id = data.transition_state_id;
    this.rejection_state_id = data.rejection_state_id;
    this.member_ids = data.member_ids;
    this.isDraft = data.isDraft ?? false;
    this.stateType = data.stateType ?? "transition";
    this.workflowService = _workflowService;
    this._snapshot = this._captureSnapshot();
  }

  private _captureSnapshot(): TWorkflowStateTransition {
    return {
      id: this.id,
      transition_state_id: this.transition_state_id,
      rejection_state_id: this.rejection_state_id,
      member_ids: [...this.member_ids],
      isDraft: this.isDraft,
    };
  }

  get asJSON(): TWorkflowStateTransition {
    return {
      id: this.id,
      transition_state_id: this.transition_state_id,
      rejection_state_id: this.rejection_state_id,
      member_ids: [...this.member_ids],
      isDraft: this.isDraft,
    };
  }

  get hasUnsavedChanges(): boolean {
    return Object.keys(this.unsavedChangesPayload).length > 0;
  }

  get unsavedChangesPayload(): TUpdateStateTransitionPayload {
    const sortedMembers = [...this.member_ids].sort();
    const sortedSnapshotMembers = [...(this._snapshot.member_ids ?? [])].sort();
    const hasMembersChanged = JSON.stringify(sortedMembers) !== JSON.stringify(sortedSnapshotMembers);

    return getChangedFields<TUpdateStateTransitionPayload>(
      {
        transition_state_id: this.transition_state_id,
        rejection_state_id: this.rejection_state_id,
        member_ids: this.member_ids,
      },
      {
        transition_state_id: this.transition_state_id !== this._snapshot.transition_state_id,
        rejection_state_id: this.rejection_state_id !== this._snapshot.rejection_state_id,
        member_ids: hasMembersChanged,
      }
    );
  }

  get isValid(): boolean {
    if (this.stateType === "approval") {
      return !!this.transition_state_id && !!this.rejection_state_id && this.member_ids.length > 0;
    }
    return !!this.transition_state_id;
  }

  mutate(data: Partial<TWorkflowStateTransition>) {
    runInAction(() => {
      Object.keys(data).forEach((key) => {
        const dataKey = key as keyof TWorkflowStateTransition;
        if (data[dataKey] !== undefined) {
          set(this, [dataKey], data[dataKey]);
        }
      });
    });
  }

  update = async (workspaceSlug: string, projectId: string, workflowId: string) => {
    if (this.isDraft) return;
    const payload = this.unsavedChangesPayload;
    if (Object.keys(payload).length === 0) return;
    await this.workflowService.updateStateTransition(workspaceSlug, projectId, workflowId, this.id, payload);
    runInAction(() => {
      this._snapshot = this._captureSnapshot();
    });
  };

  revertToSnapshot = () => {
    runInAction(() => {
      this.transition_state_id = this._snapshot.transition_state_id;
      this.rejection_state_id = this._snapshot.rejection_state_id;
      this.member_ids = [...this._snapshot.member_ids];
    });
  };
}
