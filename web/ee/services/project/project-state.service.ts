// plane imports
import { IStateWorkFlowResponse, TWorkflowChangeHistory } from "@plane/types";
// services
import { ProjectStateService as CoreProjectStateService } from "@/services/project/project-state.service";

export class ProjectStateService extends CoreProjectStateService {
  constructor() {
    super();
  }

  /**
   * Fetch Workflow states for the given project if projectId is provided, else fetch all workflows
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  async fetchWorkflowStates(workspaceSlug: string, projectId?: string): Promise<IStateWorkFlowResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/workflow-states/`, {
      params: projectId ? { project_id: projectId } : undefined,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Fetch workflow change history
   * @param workspaceSlug
   * @param projectId
   * @param props
   * @returns
   */
  async fetchWorkflowChangeHistory(
    workspaceSlug: string,
    projectId: string,
    params:
      | {
        created_at__gt: string;
      }
      | object = {}
  ): Promise<TWorkflowChangeHistory[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-activity/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Update workflow state
   * @param workspaceSlug
   * @param stateId
   * @param data
   * @returns
   */
  async updateWorkflowState(
    workspaceSlug: string,
    stateId: string,
    data: { allow_issue_creation: boolean }
  ): Promise<void> {
    return this.patch(`/api/workspaces/${workspaceSlug}/workflow-states/${stateId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * create as state transition
   * @param workspaceSlug
   * @param projectId
   * @param parentStateId
   * @param transitionStateId
   * @returns
   */
  async createStateTransition(
    workspaceSlug: string,
    projectId: string,
    parentStateId: string,
    transitionStateId: string
  ): Promise<string> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-transitions/`, {
      state_id: parentStateId,
      transition_state_id: transitionStateId,
    })
      .then((response) => response?.data?.id)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * update permission of state transition approvers
   * @param workspaceSlug
   * @param projectId
   * @param transitionId
   * @param approvers
   * @returns
   */
  async updateStateTransitionApprovers(
    workspaceSlug: string,
    projectId: string,
    transitionId: string,
    approvers: string[]
  ): Promise<void> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-transitions/${transitionId}/approvers/`,
      {
        approver_ids: approvers,
      }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * update transition state of state transition
   * @param workspaceSlug
   * @param projectId
   * @param transitionId
   * @param stateId
   * @returns
   */
  async updateStateTransitionState(
    workspaceSlug: string,
    projectId: string,
    transitionId: string,
    stateId: string
  ): Promise<void> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-transitions/${transitionId}/`, {
      transition_state_id: stateId,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Delete current state transition
   * @param workspaceSlug
   * @param projectId
   * @param transitionId
   * @returns
   */
  async deleteStateTransition(workspaceSlug: string, projectId: string, transitionId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-transitions/${transitionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Reset workflow
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  async resetWorkflowStates(workspaceSlug: string, projectId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/workflow-reset/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
