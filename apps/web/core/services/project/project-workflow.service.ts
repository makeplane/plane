/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type {
  IWorkflow,
  IWorkflowDetail,
  IWorkflowFlow,
  IWorkflowFlowActor,
  IWorkflowRevision,
  IWorkflowState,
  IWorkflowTypeAssignment,
  TWorkflowCreatePayload,
  TWorkflowFlowActorCreatePayload,
  TWorkflowFlowCreatePayload,
  TWorkflowFlowUpdatePayload,
  TWorkflowStateCreatePayload,
  TWorkflowStateUpdatePayload,
  TWorkflowTypeAssignmentCreatePayload,
  TWorkflowUpdatePayload,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

/**
 * §17.1 workflow administration + §17.2 flow configuration.
 *
 * Every method throws the **response body** (`error.response.data`) on a
 * 4xx/5xx so callers receive the §17.3 structured workflow envelope
 * (`{ code, detail, ... }`) verbatim, which is what §23.5 requires the UI
 * to render. The one exception is the 5xx case, where Django renders a
 * non-JSON body; consumers must therefore treat the payload as
 * `unknown` and narrow it.
 */
export class ProjectWorkflowService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  // -- §17.1 workflow CRUD -------------------------------------------------

  async getWorkflows(workspaceSlug: string, projectId: string): Promise<IWorkflow[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkflow(workspaceSlug: string, projectId: string, workflowId: string): Promise<IWorkflowDetail> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createWorkflow(
    workspaceSlug: string,
    projectId: string,
    data: TWorkflowCreatePayload
  ): Promise<IWorkflowDetail> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkflow(
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TWorkflowUpdatePayload
  ): Promise<IWorkflowDetail> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkflow(workspaceSlug: string, projectId: string, workflowId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // -- §24 draft / publish lifecycle --------------------------------------

  /**
   * Idempotent: returns the existing draft with **200** when one is already
   * open, and creates version+1 with **201** otherwise. Do not branch on 201.
   */
  async createDraft(workspaceSlug: string, projectId: string, workflowId: string): Promise<IWorkflowRevision> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/draft/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async publishWorkflow(workspaceSlug: string, projectId: string, workflowId: string): Promise<IWorkflowRevision> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/publish/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getRevisions(workspaceSlug: string, projectId: string, workflowId: string): Promise<IWorkflowRevision[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflows/${workflowId}/revisions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // -- §17.2 state inclusion (draft revisions only) ----------------------

  async addRevisionState(
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    data: TWorkflowStateCreatePayload
  ): Promise<IWorkflowState> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-revisions/${revisionId}/states/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateRevisionState(
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    stateId: string,
    data: TWorkflowStateUpdatePayload
  ): Promise<IWorkflowState> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-revisions/${revisionId}/states/${stateId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeRevisionState(
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    stateId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-revisions/${revisionId}/states/${stateId}/`
    )
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // -- §17.2 transition flows (draft revisions only) ---------------------
  //
  // NOTE the two id spaces: the write API takes `WorkflowState` PKs, while
  // the read API returns `State` UUIDs. Map via `IWorkflowState.state_id`
  // -> `IWorkflowState.id` before calling these.

  async addRevisionFlow(
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    data: TWorkflowFlowCreatePayload
  ): Promise<IWorkflowFlow> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-revisions/${revisionId}/flows/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateRevisionFlow(
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    flowId: string,
    data: TWorkflowFlowUpdatePayload
  ): Promise<IWorkflowFlow> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-revisions/${revisionId}/flows/${flowId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeRevisionFlow(
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    flowId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-revisions/${revisionId}/flows/${flowId}/`
    )
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // -- §17.2 flow actors --------------------------------------------------
  //
  // Write-only: the admin API exposes no GET for actors and
  // `WorkflowFlowReadSerializer` does not nest them, so actors cannot be
  // read back. The UI therefore keeps its own optimistic actor view for the
  // current draft and re-sends on every change.

  async addFlowActor(
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    flowId: string,
    data: TWorkflowFlowActorCreatePayload
  ): Promise<IWorkflowFlowActor> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-revisions/${revisionId}/flows/${flowId}/actors/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeFlowActor(
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    flowId: string,
    actorId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-revisions/${revisionId}/flows/${flowId}/actors/${actorId}/`
    )
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // -- §7.3 work item type assignment -------------------------------------

  async getTypeAssignments(workspaceSlug: string, projectId: string): Promise<IWorkflowTypeAssignment[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-type-assignments/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createTypeAssignment(
    workspaceSlug: string,
    projectId: string,
    data: TWorkflowTypeAssignmentCreatePayload
  ): Promise<IWorkflowTypeAssignment> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-type-assignments/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeTypeAssignment(workspaceSlug: string, projectId: string, assignmentId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-type-assignments/${assignmentId}/`
    )
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
