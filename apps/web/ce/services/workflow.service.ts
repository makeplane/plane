import { API_BASE_URL } from "@plane/constants";
import type { IProjectWorkflow, IWorkflowActivity, IWorkflowStateData } from "@plane/types";
import { APIService } from "@/services/api.service";

export class WorkflowService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /** GET /workspaces/{slug}/workflow-states/?project_id={id} — flat dict keyed by state UUID */
  async getWorkflowStates(
    workspaceSlug: string,
    projectId: string
  ): Promise<Record<string, IWorkflowStateData>> {
    return this.get(`/api/workspaces/${workspaceSlug}/workflow-states/`, {
      params: { project_id: projectId },
    })
      .then((res: { data: Record<string, IWorkflowStateData> }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** GET /workspaces/{slug}/projects/{id}/workflow/ */
  async getProjectWorkflow(workspaceSlug: string, projectId: string): Promise<IProjectWorkflow> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow/`)
      .then((res: { data: IProjectWorkflow }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** PATCH /workspaces/{slug}/projects/{id}/workflow/ — toggle is_live */
  async updateProjectWorkflow(
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IProjectWorkflow>
  ): Promise<IProjectWorkflow> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow/`, payload)
      .then((res: { data: IProjectWorkflow }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** PATCH /workspaces/{slug}/workflow-states/{state_id}/ — toggle allow_issue_creation */
  async updateWorkflowStateConfig(
    workspaceSlug: string,
    stateId: string,
    payload: { allow_issue_creation: boolean }
  ): Promise<{ id: string; state: string; allow_issue_creation: boolean }> {
    return this.patch(`/api/workspaces/${workspaceSlug}/workflow-states/${stateId}/`, payload)
      .then((res: { data: { id: string; state: string; allow_issue_creation: boolean } }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** POST /workspaces/{slug}/projects/{id}/workflow-transitions/ */
  async addTransition(
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    transitionStateId: string
  ): Promise<{ id: string; state: string; transition_state: string; approvers: string[] }> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-transitions/`,
      { state_id: stateId, transition_state_id: transitionStateId }
    )
      .then((res: { data: { id: string; state: string; transition_state: string; approvers: string[] } }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** DELETE /workspaces/{slug}/projects/{id}/workflow-transitions/{tid}/ */
  async deleteTransition(workspaceSlug: string, projectId: string, transitionId: string): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-transitions/${transitionId}/`
    )
      .then(() => undefined)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** POST /workspaces/{slug}/projects/{id}/workflow-transitions/{tid}/approvers/ */
  async addApprovers(
    workspaceSlug: string,
    projectId: string,
    transitionId: string,
    approverIds: string[]
  ): Promise<{ id: string; state: string; transition_state: string; approvers: string[] }> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-transitions/${transitionId}/approvers/`,
      { approver_ids: approverIds }
    )
      .then((res: { data: { id: string; state: string; transition_state: string; approvers: string[] } }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** DELETE /workspaces/{slug}/projects/{id}/workflow-transitions/{tid}/approvers/{aid}/ */
  async deleteApprover(
    workspaceSlug: string,
    projectId: string,
    transitionId: string,
    approverId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-transitions/${transitionId}/approvers/${approverId}/`
    )
      .then(() => undefined)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** POST /workspaces/{slug}/projects/{id}/workflow/reset/ */
  async resetWorkflow(workspaceSlug: string, projectId: string): Promise<void> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow/reset/`,
      {}
    )
      .then(() => undefined)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }

  /** GET /workspaces/{slug}/projects/{id}/workflow/activity/ */
  async getWorkflowActivity(workspaceSlug: string, projectId: string): Promise<IWorkflowActivity[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow/activity/`)
      .then((res: { data: IWorkflowActivity[] }) => res.data)
      .catch((err: { response?: { data: unknown } }) => {
        throw err?.response?.data;
      });
  }
}

export const workflowService = new WorkflowService();
