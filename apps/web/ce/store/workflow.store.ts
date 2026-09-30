/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type {
  IIssueWorkflowStatus,
  IProjectWorkflowStates,
  IWorkflow,
  IWorkflowApproval,
  IWorkflowHistory,
  TWorkflowBulkConfig,
} from "@plane/types";
import { ProjectWorkflowService } from "@/services/project/project-workflow.service";
import type { RootStore } from "@/plane-web/store/root.store";

export interface IWorkflowStore {
  fetchedMap: Record<string, boolean>;
  workflowMap: Record<string, IWorkflow>;
  projectWorkflowStatesMap: Record<string, IProjectWorkflowStates>;
  issueWorkflowStatusMap: Record<string, IIssueWorkflowStatus>;
  workflowHistoryMap: Record<string, IWorkflowHistory[]>;
  getWorkflowsByProjectId: (projectId: string | null | undefined) => IWorkflow[] | undefined;
  getProjectWorkflowStates: (projectId: string | null | undefined) => IProjectWorkflowStates | undefined;
  getIssueWorkflowStatus: (issueId: string | null | undefined) => IIssueWorkflowStatus | undefined;
  getAllowedStateIdsForIssue: (issueId: string | null | undefined) => string[] | null | undefined;
  getPendingApprovalForIssue: (issueId: string | null | undefined) => IWorkflowApproval | null | undefined;
  isWorkflowEnabledForProject: (projectId: string | null | undefined) => boolean;
  fetchProjectWorkflowStates: (workspaceSlug: string, projectId: string) => Promise<IProjectWorkflowStates>;
  fetchIssueWorkflowStatus: (
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ) => Promise<IIssueWorkflowStatus>;
  toggleWorkflowEnabled: (workspaceSlug: string, projectId: string, enabled: boolean) => Promise<void>;
  configureWorkflow: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TWorkflowBulkConfig
  ) => Promise<IWorkflow>;
  createWorkflow: (workspaceSlug: string, projectId: string, data: Partial<IWorkflow>) => Promise<IWorkflow>;
  updateWorkflow: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: Partial<IWorkflow>
  ) => Promise<IWorkflow>;
  deleteWorkflow: (workspaceSlug: string, projectId: string, workflowId: string) => Promise<void>;
  toggleWorkflowPause: (workspaceSlug: string, projectId: string, workflowId: string) => Promise<IWorkflow>;
  fetchWorkflowHistory: (workspaceSlug: string, projectId: string, workflowId: string) => Promise<IWorkflowHistory[]>;
  resolveApproval: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    approvalId: string,
    approvalAction: "approve" | "reject"
  ) => Promise<void>;
  canTransitionToState: (
    projectId: string | null | undefined,
    issueId: string | null | undefined,
    fromStateId: string | null | undefined,
    toStateId: string | null | undefined
  ) => { allowed: boolean; message?: string };
  getAllowedTargetStatesForProject: (
    projectId: string | null | undefined,
    fromStateId: string | null | undefined
  ) => string[] | null;
  isWorkItemCreationAllowed: (projectId: string | null | undefined, stateId: string | null | undefined) => boolean;
}

export class WorkflowStore implements IWorkflowStore {
  fetchedMap: Record<string, boolean> = {};
  workflowMap: Record<string, IWorkflow> = {};
  projectWorkflowStatesMap: Record<string, IProjectWorkflowStates> = {};
  issueWorkflowStatusMap: Record<string, IIssueWorkflowStatus> = {};
  workflowHistoryMap: Record<string, IWorkflowHistory[]> = {};
  rootStore: RootStore;
  workflowService: ProjectWorkflowService;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      fetchedMap: observable,
      workflowMap: observable,
      projectWorkflowStatesMap: observable,
      issueWorkflowStatusMap: observable,
      workflowHistoryMap: observable,
      fetchProjectWorkflowStates: action,
      fetchIssueWorkflowStatus: action,
      toggleWorkflowEnabled: action,
      configureWorkflow: action,
      createWorkflow: action,
      updateWorkflow: action,
      deleteWorkflow: action,
      toggleWorkflowPause: action,
      fetchWorkflowHistory: action,
      resolveApproval: action,
    });
    this.rootStore = rootStore;
    this.workflowService = new ProjectWorkflowService();
  }

  getWorkflowsByProjectId = computedFn((projectId: string | null | undefined) => {
    if (!projectId) return undefined;
    return this.projectWorkflowStatesMap[projectId]?.workflows;
  });

  getProjectWorkflowStates = computedFn((projectId: string | null | undefined) => {
    if (!projectId) return undefined;
    return this.projectWorkflowStatesMap[projectId];
  });

  getIssueWorkflowStatus = computedFn((issueId: string | null | undefined) => {
    if (!issueId) return undefined;
    return this.issueWorkflowStatusMap[issueId];
  });

  getAllowedStateIdsForIssue = computedFn((issueId: string | null | undefined) => {
    return this.getIssueWorkflowStatus(issueId)?.allowed_state_ids;
  });

  getPendingApprovalForIssue = computedFn((issueId: string | null | undefined) => {
    return this.getIssueWorkflowStatus(issueId)?.pending_approval ?? null;
  });

  isWorkflowEnabledForProject = computedFn((projectId: string | null | undefined) => {
    if (!projectId) return false;
    const project = this.rootStore.projectRoot.project.getProjectById(projectId);
    if (project?.is_workflow_enabled) return true;
    return this.projectWorkflowStatesMap[projectId]?.is_workflow_enabled ?? false;
  });

  getAllowedTargetStatesForProject = computedFn(
    (projectId: string | null | undefined, fromStateId: string | null | undefined) => {
      if (!projectId || !fromStateId) return null;
      if (!this.isWorkflowEnabledForProject(projectId)) return null;

      const defaultWorkflow = this.projectWorkflowStatesMap[projectId]?.workflows.find(
        (workflow) => workflow.is_default
      );
      const flows = defaultWorkflow?.flows.filter((flow) => flow.source_state_id === fromStateId) ?? [];

      if (flows.length === 0) return null;

      return [...new Set(flows.map((flow) => flow.target_state_id))];
    }
  );

  canTransitionToState = computedFn(
    (
      projectId: string | null | undefined,
      issueId: string | null | undefined,
      fromStateId: string | null | undefined,
      toStateId: string | null | undefined
    ) => {
      if (!projectId || !toStateId) return { allowed: true };
      if (!this.isWorkflowEnabledForProject(projectId)) return { allowed: true };
      if (fromStateId === toStateId) return { allowed: true };

      const status = issueId ? this.getIssueWorkflowStatus(issueId) : undefined;
      if (status?.pending_approval) {
        return { allowed: false, message: status.blocker_message ?? "Work item has a pending approval." };
      }

      const allowedIds = issueId
        ? (status?.allowed_state_ids ?? this.getAllowedTargetStatesForProject(projectId, fromStateId))
        : this.getAllowedTargetStatesForProject(projectId, fromStateId);

      if (allowedIds === null) return { allowed: true };
      if (allowedIds.includes(toStateId)) return { allowed: true };

      return {
        allowed: false,
        message: "This state transition is not allowed by the workflow.",
      };
    }
  );

  isWorkItemCreationAllowed = computedFn((projectId: string | null | undefined, stateId: string | null | undefined) => {
    if (!projectId || !stateId) return true;
    if (!this.isWorkflowEnabledForProject(projectId)) return true;

    const defaultWorkflow = this.projectWorkflowStatesMap[projectId]?.workflows.find((workflow) => workflow.is_default);
    if (!defaultWorkflow) return true;

    const config = defaultWorkflow.state_configs.find((item) => item.state_id === stateId);
    return config ? config.allow_work_item_creation : true;
  });

  fetchProjectWorkflowStates = async (workspaceSlug: string, projectId: string) => {
    const data = await this.workflowService.getProjectWorkflowStates(workspaceSlug, projectId);
    runInAction(() => {
      this.projectWorkflowStatesMap = set(this.projectWorkflowStatesMap, projectId, data);
      data.workflows.forEach((workflow) => {
        this.workflowMap = set(this.workflowMap, workflow.id, workflow);
      });
      this.fetchedMap = set(this.fetchedMap, projectId, true);
    });
    return data;
  };

  fetchIssueWorkflowStatus = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const data = await this.workflowService.getIssueWorkflowStatus(workspaceSlug, projectId, issueId);
    runInAction(() => {
      this.issueWorkflowStatusMap = set(this.issueWorkflowStatusMap, issueId, data);
    });
    return data;
  };

  toggleWorkflowEnabled = async (workspaceSlug: string, projectId: string, enabled: boolean) => {
    const response = await this.workflowService.toggleWorkflowEnabled(workspaceSlug, projectId, enabled);
    runInAction(() => {
      const project = this.rootStore.projectRoot.project.getProjectById(projectId);
      if (project) project.is_workflow_enabled = response.is_workflow_enabled;
      if (this.projectWorkflowStatesMap[projectId]) {
        this.projectWorkflowStatesMap = set(this.projectWorkflowStatesMap, projectId, {
          ...this.projectWorkflowStatesMap[projectId],
          is_workflow_enabled: response.is_workflow_enabled,
        });
      }
    });
    await this.fetchProjectWorkflowStates(workspaceSlug, projectId);
  };

  configureWorkflow = async (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TWorkflowBulkConfig
  ) => {
    const workflow = await this.workflowService.configureWorkflow(workspaceSlug, projectId, workflowId, data);
    runInAction(() => {
      this.workflowMap = set(this.workflowMap, workflow.id, workflow);
    });
    await this.fetchProjectWorkflowStates(workspaceSlug, projectId);
    return workflow;
  };

  createWorkflow = async (workspaceSlug: string, projectId: string, data: Partial<IWorkflow>) => {
    const workflow = await this.workflowService.createWorkflow(workspaceSlug, projectId, data);
    runInAction(() => {
      this.workflowMap = set(this.workflowMap, workflow.id, workflow);
    });
    await this.fetchProjectWorkflowStates(workspaceSlug, projectId);
    return workflow;
  };

  updateWorkflow = async (workspaceSlug: string, projectId: string, workflowId: string, data: Partial<IWorkflow>) => {
    const workflow = await this.workflowService.updateWorkflow(workspaceSlug, projectId, workflowId, data);
    runInAction(() => {
      this.workflowMap = set(this.workflowMap, workflow.id, workflow);
    });
    await this.fetchProjectWorkflowStates(workspaceSlug, projectId);
    return workflow;
  };

  deleteWorkflow = async (workspaceSlug: string, projectId: string, workflowId: string) => {
    await this.workflowService.deleteWorkflow(workspaceSlug, projectId, workflowId);
    runInAction(() => {
      const nextMap = { ...this.workflowMap };
      delete nextMap[workflowId];
      this.workflowMap = nextMap;
    });
    await this.fetchProjectWorkflowStates(workspaceSlug, projectId);
  };

  toggleWorkflowPause = async (workspaceSlug: string, projectId: string, workflowId: string) => {
    const workflow = await this.workflowService.toggleWorkflowPause(workspaceSlug, projectId, workflowId);
    runInAction(() => {
      this.workflowMap = set(this.workflowMap, workflow.id, workflow);
    });
    await this.fetchProjectWorkflowStates(workspaceSlug, projectId);
    return workflow;
  };

  fetchWorkflowHistory = async (workspaceSlug: string, projectId: string, workflowId: string) => {
    const history = await this.workflowService.getWorkflowHistory(workspaceSlug, projectId, workflowId);
    runInAction(() => {
      this.workflowHistoryMap = set(this.workflowHistoryMap, workflowId, history);
    });
    return history;
  };

  resolveApproval = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    approvalId: string,
    approvalAction: "approve" | "reject"
  ) => {
    const response = await this.workflowService.resolveApproval(
      workspaceSlug,
      projectId,
      issueId,
      approvalId,
      approvalAction
    );
    await this.fetchIssueWorkflowStatus(workspaceSlug, projectId, issueId);
    if (response.state_id) {
      await this.rootStore.issue.issueDetail.fetchIssue(workspaceSlug, projectId, issueId);
    }
  };
}
