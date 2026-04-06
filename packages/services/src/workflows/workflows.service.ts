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

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";
import type {
  IWorkflowService,
  TTransferAndDeleteStatePayload,
  TAddStatesToWorkflowPayload,
  TAddStateTransitionPayload,
  TUpdateStateTransitionPayload,
  TUpdateWorkflowStatePayload,
  TWorkflow,
  TWorkflowChangeHistory,
  TWorkflowWorkItemTypeCheckResponse,
  TWorkflowCreatePayload,
  TWorkflowResponse,
  TWorkflowState,
  TWorkflowStateTransition,
  TWorkflowUpdatePayload,
} from "@plane/types";

export class WorkflowsService extends APIService implements IWorkflowService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  // Fetch all workflows
  async fetchAll(workspaceSlug: string): Promise<TWorkflowResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/workflows/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // Fetch project workflows
  async fetchProjectWorkflows(workspaceSlug: string, projectId: string): Promise<TWorkflow[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // Create a default workflow on creation.
  async createDefault(workspaceSlug: string, projectId: string): Promise<TWorkflow> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/default-workflow/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, projectId: string, data: TWorkflowCreatePayload): Promise<TWorkflow> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TWorkflowUpdatePayload
  ): Promise<TWorkflow> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, projectId: string, workflowId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Add states to a workflow
   */
  async addStates(
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TAddStatesToWorkflowPayload
  ): Promise<TWorkflowState[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/states/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Update state in a workflow
   */
  async updateState(
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    stateId: string,
    data: TUpdateWorkflowStatePayload
  ): Promise<void> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/states/${stateId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Delete a state in a workflow
   */
  async deleteState(workspaceSlug: string, projectId: string, workflowId: string, stateId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/states/${stateId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Transfer work items to a new state and delete the old state from a workflow
   */
  async transferAndDeleteState(
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    stateId: string,
    data: TTransferAndDeleteStatePayload
  ): Promise<void> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/states/${stateId}/transfer/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Add a transition to a state in a workflow
   */
  async addStateTransition(
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TAddStateTransitionPayload
  ): Promise<TWorkflowStateTransition> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/state-transitions/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Delete a transition in a workflow
   */
  async deleteStateTransition(
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    transitionId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/state-transitions/${transitionId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Update a transition in a workflow
   */
  async updateStateTransition(
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    transitionId: string,
    data: TUpdateStateTransitionPayload
  ): Promise<void> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/state-transitions/${transitionId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description Fetch workflows change history
   */
  async fetchWorkflowChangeHistory(
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    params:
      | {
          created_at__gt: string;
        }
      | object = {}
  ): Promise<TWorkflowChangeHistory[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/activities/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchWorkflowWorkItemTypeCheck(
    workspaceSlug: string,
    projectId: string,
    workflowId: string
  ): Promise<TWorkflowWorkItemTypeCheckResponse> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/work-item-type-check/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
