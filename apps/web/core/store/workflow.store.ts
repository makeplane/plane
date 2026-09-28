/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type {
  IWorkflow,
  IWorkflowDetail,
  IWorkflowFlowActor,
  IWorkflowRevision,
  IWorkflowState,
  IWorkflowTypeAssignment,
  TWorkflowCreatePayload,
  TWorkflowFlowActorCreatePayload,
  TWorkflowStateCreatePayload,
  TWorkflowTypeAssignmentCreatePayload,
  TWorkflowUpdatePayload,
} from "@plane/types";
// services
import { ProjectWorkflowService } from "@/services/project/project-workflow.service";
// helpers
import { getDraftRevision, getEditableRevision, getPublishedRevision } from "@/utils/workflow";
// store
import type { CoreRootStore } from "./root.store";

export interface IWorkflowStore {
  // loaders
  fetchedMap: Record<string, boolean>;
  detailLoadingMap: Record<string, boolean>;
  // observables
  workflowMap: Record<string, IWorkflowDetail>;
  projectWorkflowIdsMap: Record<string, string[]>;
  /**
   * §17.2 actors are write-only — the admin API has no actor GET and the
   * flow read serializer does not nest them. This holds the actors created
   * in the current draft so the editor can show and remove them. It is
   * explicitly a client-side cache, not server state.
   */
  flowActorCacheMap: Record<string, IWorkflowFlowActor[]>;
  typeAssignmentMap: Record<string, IWorkflowTypeAssignment[]>;
  // computed
  /** Project workflows in §23.1 list order, detail-shaped (revisions included). */
  projectWorkflows: IWorkflowDetail[] | undefined;
  getWorkflowById: (workflowId: string | null | undefined) => IWorkflowDetail | undefined;
  getDraftRevisionByWorkflowId: (workflowId: string | null | undefined) => IWorkflowRevision | undefined;
  getPublishedRevisionByWorkflowId: (workflowId: string | null | undefined) => IWorkflowRevision | undefined;
  getEditableRevisionByWorkflowId: (workflowId: string | null | undefined) => IWorkflowRevision | undefined;
  getFlowActors: (flowId: string) => IWorkflowFlowActor[];
  getTypeAssignmentsByProjectId: (projectId: string | null | undefined) => IWorkflowTypeAssignment[] | undefined;
  getAssignedIssueTypeIds: (workflowId: string) => string[];
  // fetch actions
  fetchProjectWorkflows: (workspaceSlug: string, projectId: string) => Promise<IWorkflow[]>;
  fetchWorkflowDetail: (workspaceSlug: string, projectId: string, workflowId: string) => Promise<IWorkflowDetail>;
  fetchTypeAssignments: (workspaceSlug: string, projectId: string) => Promise<IWorkflowTypeAssignment[]>;
  // workflow crud
  createWorkflow: (workspaceSlug: string, projectId: string, data: TWorkflowCreatePayload) => Promise<IWorkflowDetail>;
  updateWorkflow: (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TWorkflowUpdatePayload
  ) => Promise<IWorkflowDetail>;
  deleteWorkflow: (workspaceSlug: string, projectId: string, workflowId: string) => Promise<void>;
  // §24 draft / publish
  createDraftRevision: (workspaceSlug: string, projectId: string, workflowId: string) => Promise<IWorkflowRevision>;
  publishRevision: (workspaceSlug: string, projectId: string, workflowId: string) => Promise<IWorkflowRevision>;
  // §17.2 state inclusion
  addRevisionState: (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    data: TWorkflowStateCreatePayload
  ) => Promise<IWorkflowState>;
  updateRevisionState: (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    workflowStateId: string,
    data: { sequence?: number; allow_new_work_items?: boolean }
  ) => Promise<IWorkflowState>;
  removeRevisionState: (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    workflowStateId: string
  ) => Promise<void>;
  // §17.2 flows
  addRevisionFlow: (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    data: { source_state_id: string; target_state_id: string }
  ) => Promise<void>;
  updateRevisionFlow: (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    flowId: string,
    data: { is_active?: boolean }
  ) => Promise<void>;
  removeRevisionFlow: (workspaceSlug: string, projectId: string, revisionId: string, flowId: string) => Promise<void>;
  // §17.2 actors
  addFlowActor: (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    flowId: string,
    data: TWorkflowFlowActorCreatePayload
  ) => Promise<IWorkflowFlowActor>;
  removeFlowActor: (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    flowId: string,
    actorId: string
  ) => Promise<void>;
  // §7.3 type assignment
  createTypeAssignment: (
    workspaceSlug: string,
    projectId: string,
    data: TWorkflowTypeAssignmentCreatePayload
  ) => Promise<IWorkflowTypeAssignment>;
  removeTypeAssignment: (workspaceSlug: string, projectId: string, assignmentId: string) => Promise<void>;
}

export class WorkflowStore implements IWorkflowStore {
  rootStore: CoreRootStore;
  workflowService: ProjectWorkflowService;

  fetchedMap: Record<string, boolean> = {};
  detailLoadingMap: Record<string, boolean> = {};
  workflowMap: Record<string, IWorkflowDetail> = {};
  projectWorkflowIdsMap: Record<string, string[]> = {};
  flowActorCacheMap: Record<string, IWorkflowFlowActor[]> = {};
  typeAssignmentMap: Record<string, IWorkflowTypeAssignment[]> = {};

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      fetchedMap: observable,
      detailLoadingMap: observable,
      workflowMap: observable,
      projectWorkflowIdsMap: observable,
      flowActorCacheMap: observable,
      typeAssignmentMap: observable,
      projectWorkflows: computed,
      fetchProjectWorkflows: action,
      fetchWorkflowDetail: action,
      fetchTypeAssignments: action,
      createWorkflow: action,
      updateWorkflow: action,
      deleteWorkflow: action,
      createDraftRevision: action,
      publishRevision: action,
      addRevisionState: action,
      updateRevisionState: action,
      removeRevisionState: action,
      addRevisionFlow: action,
      updateRevisionFlow: action,
      removeRevisionFlow: action,
      addFlowActor: action,
      removeFlowActor: action,
      createTypeAssignment: action,
      removeTypeAssignment: action,
    });

    this.workflowService = new ProjectWorkflowService();
    this.rootStore = _rootStore;
  }

  // -- selectors ----------------------------------------------------------

  get projectWorkflows(): IWorkflowDetail[] | undefined {
    const projectId = this.rootStore.router.projectId;
    if (!projectId || !this.fetchedMap[projectId]) return undefined;
    return (this.projectWorkflowIdsMap[projectId] ?? [])
      .map((id) => this.workflowMap[id])
      .filter((workflow): workflow is IWorkflowDetail => workflow !== undefined);
  }

  getWorkflowById = (workflowId: string | null | undefined) => (workflowId ? this.workflowMap[workflowId] : undefined);

  getDraftRevisionByWorkflowId = (workflowId: string | null | undefined) =>
    getDraftRevision(this.getWorkflowById(workflowId)?.revisions);

  getPublishedRevisionByWorkflowId = (workflowId: string | null | undefined) =>
    getPublishedRevision(this.getWorkflowById(workflowId)?.revisions);

  getEditableRevisionByWorkflowId = (workflowId: string | null | undefined) =>
    getEditableRevision(this.getWorkflowById(workflowId)?.revisions);

  getFlowActors = (flowId: string) => this.flowActorCacheMap[flowId] ?? [];

  getTypeAssignmentsByProjectId = (projectId: string | null | undefined) =>
    projectId ? this.typeAssignmentMap[projectId] : undefined;

  getAssignedIssueTypeIds = (workflowId: string) =>
    Object.values(this.typeAssignmentMap)
      .flat()
      .filter((assignment) => assignment.workflow === workflowId)
      .map((assignment) => assignment.issue_type);

  // -- internals ----------------------------------------------------------

  /**
   * `GET /workflows/:id/` is the only read path for states and flows, so
   * every revision-scoped mutation is followed by a re-read of the owning
   * workflow. The list endpoint returns lite rows without revisions, so the
   * detail response is what we keep.
   */
  private refetchWorkflowDetail = async (workspaceSlug: string, projectId: string, workflowId: string) => {
    const detail = await this.workflowService.getWorkflow(workspaceSlug, projectId, workflowId);
    runInAction(() => {
      this.workflowMap[workflowId] = detail;
      this.rememberWorkflowForProject(projectId, workflowId);
    });
    return detail;
  };

  private rememberWorkflowForProject = (projectId: string, workflowId: string) => {
    const existing = this.projectWorkflowIdsMap[projectId] ?? [];
    if (!existing.includes(workflowId)) {
      this.projectWorkflowIdsMap[projectId] = [...existing, workflowId];
    }
  };

  /** Revision-scoped writes do not echo the workflow, so resolve it locally. */
  private getWorkflowIdForRevision = (revisionId: string) =>
    Object.values(this.workflowMap).find((workflow) =>
      workflow.revisions?.some((revision) => revision.id === revisionId)
    )?.id;

  // -- fetch actions ------------------------------------------------------

  fetchProjectWorkflows = async (workspaceSlug: string, projectId: string) => {
    const response = await this.workflowService.getWorkflows(workspaceSlug, projectId);
    runInAction(() => {
      this.projectWorkflowIdsMap[projectId] = response.map((workflow) => workflow.id);
      response.forEach((workflow) => {
        // The list payload is a lite row without revisions; keep it until the
        // detail read replaces it so the list renders without N detail calls.
        this.workflowMap[workflow.id] = {
          ...workflow,
          created_by: null,
          updated_by: null,
          revisions: this.workflowMap[workflow.id]?.revisions ?? [],
        };
      });
      this.fetchedMap[projectId] = true;
    });
    return response;
  };

  fetchWorkflowDetail = async (workspaceSlug: string, projectId: string, workflowId: string) => {
    runInAction(() => {
      this.detailLoadingMap[workflowId] = true;
    });
    try {
      return await this.refetchWorkflowDetail(workspaceSlug, projectId, workflowId);
    } finally {
      runInAction(() => {
        this.detailLoadingMap[workflowId] = false;
      });
    }
  };

  fetchTypeAssignments = async (workspaceSlug: string, projectId: string) => {
    const response = await this.workflowService.getTypeAssignments(workspaceSlug, projectId);
    runInAction(() => {
      this.typeAssignmentMap[projectId] = response;
    });
    return response;
  };

  // -- workflow crud ------------------------------------------------------

  createWorkflow = async (workspaceSlug: string, projectId: string, data: TWorkflowCreatePayload) => {
    const response = await this.workflowService.createWorkflow(workspaceSlug, projectId, data);
    runInAction(() => {
      this.workflowMap[response.id] = response;
      this.rememberWorkflowForProject(projectId, response.id);
    });
    return response;
  };

  updateWorkflow = async (
    workspaceSlug: string,
    projectId: string,
    workflowId: string,
    data: TWorkflowUpdatePayload
  ) => {
    const response = await this.workflowService.updateWorkflow(workspaceSlug, projectId, workflowId, data);
    runInAction(() => {
      this.workflowMap[workflowId] = response;
    });
    return response;
  };

  deleteWorkflow = async (workspaceSlug: string, projectId: string, workflowId: string) => {
    await this.workflowService.deleteWorkflow(workspaceSlug, projectId, workflowId);
    runInAction(() => {
      delete this.workflowMap[workflowId];
      this.projectWorkflowIdsMap[projectId] = (this.projectWorkflowIdsMap[projectId] ?? []).filter(
        (id) => id !== workflowId
      );
    });
  };

  // -- §24 draft / publish ------------------------------------------------

  createDraftRevision = async (workspaceSlug: string, projectId: string, workflowId: string) => {
    const response = await this.workflowService.createDraft(workspaceSlug, projectId, workflowId);
    await this.refetchWorkflowDetail(workspaceSlug, projectId, workflowId);
    return response;
  };

  publishRevision = async (workspaceSlug: string, projectId: string, workflowId: string) => {
    const response = await this.workflowService.publishWorkflow(workspaceSlug, projectId, workflowId);
    await this.refetchWorkflowDetail(workspaceSlug, projectId, workflowId);
    return response;
  };

  // -- §17.2 state inclusion ---------------------------------------------

  addRevisionState = async (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    data: TWorkflowStateCreatePayload
  ) => {
    const response = await this.workflowService.addRevisionState(workspaceSlug, projectId, revisionId, data);
    await this.refetchRevisionWorkflow(workspaceSlug, projectId, revisionId);
    return response;
  };

  updateRevisionState = async (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    workflowStateId: string,
    data: { sequence?: number; allow_new_work_items?: boolean }
  ) => {
    const response = await this.workflowService.updateRevisionState(
      workspaceSlug,
      projectId,
      revisionId,
      workflowStateId,
      data
    );
    await this.refetchRevisionWorkflow(workspaceSlug, projectId, revisionId);
    return response;
  };

  removeRevisionState = async (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    workflowStateId: string
  ) => {
    await this.workflowService.removeRevisionState(workspaceSlug, projectId, revisionId, workflowStateId);
    await this.refetchRevisionWorkflow(workspaceSlug, projectId, revisionId);
  };

  // -- §17.2 flows --------------------------------------------------------

  addRevisionFlow = async (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    data: { source_state_id: string; target_state_id: string }
  ) => {
    await this.workflowService.addRevisionFlow(workspaceSlug, projectId, revisionId, data);
    await this.refetchRevisionWorkflow(workspaceSlug, projectId, revisionId);
  };

  updateRevisionFlow = async (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    flowId: string,
    data: { is_active?: boolean }
  ) => {
    await this.workflowService.updateRevisionFlow(workspaceSlug, projectId, revisionId, flowId, data);
    await this.refetchRevisionWorkflow(workspaceSlug, projectId, revisionId);
  };

  removeRevisionFlow = async (workspaceSlug: string, projectId: string, revisionId: string, flowId: string) => {
    await this.workflowService.removeRevisionFlow(workspaceSlug, projectId, revisionId, flowId);
    runInAction(() => {
      delete this.flowActorCacheMap[flowId];
    });
    await this.refetchRevisionWorkflow(workspaceSlug, projectId, revisionId);
  };

  // -- §17.2 actors -------------------------------------------------------

  addFlowActor = async (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    flowId: string,
    data: TWorkflowFlowActorCreatePayload
  ) => {
    const response = await this.workflowService.addFlowActor(workspaceSlug, projectId, revisionId, flowId, data);
    runInAction(() => {
      const existing = this.flowActorCacheMap[flowId] ?? [];
      this.flowActorCacheMap[flowId] = [...existing, response];
    });
    return response;
  };

  removeFlowActor = async (
    workspaceSlug: string,
    projectId: string,
    revisionId: string,
    flowId: string,
    actorId: string
  ) => {
    await this.workflowService.removeFlowActor(workspaceSlug, projectId, revisionId, flowId, actorId);
    runInAction(() => {
      const existing = this.flowActorCacheMap[flowId] ?? [];
      this.flowActorCacheMap[flowId] = existing.filter((actor) => actor.id !== actorId);
    });
  };

  // -- §7.3 type assignment ----------------------------------------------

  createTypeAssignment = async (
    workspaceSlug: string,
    projectId: string,
    data: TWorkflowTypeAssignmentCreatePayload
  ) => {
    const response = await this.workflowService.createTypeAssignment(workspaceSlug, projectId, data);
    await this.fetchTypeAssignments(workspaceSlug, projectId);
    return response;
  };

  removeTypeAssignment = async (workspaceSlug: string, projectId: string, assignmentId: string) => {
    await this.workflowService.removeTypeAssignment(workspaceSlug, projectId, assignmentId);
    await this.fetchTypeAssignments(workspaceSlug, projectId);
  };

  private refetchRevisionWorkflow = async (workspaceSlug: string, projectId: string, revisionId: string) => {
    const workflowId = this.getWorkflowIdForRevision(revisionId);
    if (!workflowId) return;
    await this.refetchWorkflowDetail(workspaceSlug, projectId, workflowId);
  };
}
