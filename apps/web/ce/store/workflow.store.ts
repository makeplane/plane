import { action, makeObservable, observable, ObservableMap, runInAction } from "mobx";
// types
import type {
  IProjectWorkflow,
  IProjectWorkflowStore,
  IWorkflowActivity,
  IWorkflowBlockerModal,
} from "@plane/types";
// service
import { WorkflowService } from "../services/workflow.service";

export interface IWorkflowStore {
  // observables
  workflowByProject: ObservableMap<string, IProjectWorkflowStore>;
  blockerModal: IWorkflowBlockerModal | null;
  // computed
  isLive: (projectId: string) => boolean;
  // actions
  fetchWorkflow: (workspaceSlug: string, projectId: string) => Promise<void>;
  updateIsLive: (workspaceSlug: string, projectId: string, isLive: boolean) => Promise<IProjectWorkflow>;
  updateStateConfig: (
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    allowIssueCreation: boolean
  ) => Promise<void>;
  addTransition: (
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    transitionStateId: string
  ) => Promise<void>;
  removeTransition: (workspaceSlug: string, projectId: string, stateId: string, transitionId: string) => Promise<void>;
  addApprovers: (
    workspaceSlug: string,
    projectId: string,
    transitionId: string,
    stateId: string,
    approverIds: string[]
  ) => Promise<void>;
  removeApprover: (
    workspaceSlug: string,
    projectId: string,
    transitionId: string,
    stateId: string,
    approverId: string
  ) => Promise<void>;
  resetWorkflow: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchActivity: (workspaceSlug: string, projectId: string) => Promise<IWorkflowActivity[]>;
  isTransitionAllowed: (projectId: string, fromStateId: string, toStateId: string) => boolean;
  getTransitionReviewers: (projectId: string, fromStateId: string, toStateId: string) => string[];
  openBlockerModal: (payload: { allowedReviewers: string[]; fromState: string; toState: string }) => void;
  closeBlockerModal: () => void;
}

export class WorkflowStore implements IWorkflowStore {
  // observables
  workflowByProject: ObservableMap<string, IProjectWorkflowStore> = new ObservableMap();
  blockerModal: IWorkflowBlockerModal | null = null;

  // service
  private service: WorkflowService;

  constructor() {
    this.service = new WorkflowService();

    makeObservable(this, {
      workflowByProject: observable,
      blockerModal: observable,

      fetchWorkflow: action,
      updateIsLive: action,
      updateStateConfig: action,
      addTransition: action,
      removeTransition: action,
      addApprovers: action,
      removeApprover: action,
      resetWorkflow: action,
      openBlockerModal: action,
      closeBlockerModal: action,
    });
  }

  /** Returns true if workflow is live for the given project. */
  isLive = (projectId: string): boolean => {
    return this.workflowByProject.get(projectId)?.isLive ?? false;
  };

  /**
   * Checks if a transition from→to is defined in the store.
   * Returns true if workflow is not live OR a matching transition exists.
   */
  isTransitionAllowed = (projectId: string, fromStateId: string, toStateId: string): boolean => {
    const data = this.workflowByProject.get(projectId);
    if (!data?.isLive) return true;
    const stateData = data.states[fromStateId];
    // Fail closed: if state not in store, treat as blocked to avoid silent bypass
    if (!stateData) return false;
    return Object.values(stateData.transitions).some((t) => t.transition_state === toStateId);
  };

  /**
   * Returns the list of approver user IDs for a given transition.
   * Empty array means "All Members" can perform it.
   */
  getTransitionReviewers = (projectId: string, fromStateId: string, toStateId: string): string[] => {
    const data = this.workflowByProject.get(projectId);
    if (!data) return [];
    const stateData = data.states[fromStateId];
    if (!stateData) return [];
    const transition = Object.values(stateData.transitions).find((t) => t.transition_state === toStateId);
    return transition?.approvers ?? [];
  };

  /** Fetch both workflow (is_live) and workflow-states (state configs + transitions) for a project. */
  fetchWorkflow = async (workspaceSlug: string, projectId: string): Promise<void> => {
    const [workflowData, stateData] = await Promise.all([
      this.service.getProjectWorkflow(workspaceSlug, projectId),
      this.service.getWorkflowStates(workspaceSlug, projectId),
    ]);

    runInAction(() => {
      this.workflowByProject.set(projectId, {
        isLive: workflowData.is_live,
        states: stateData,
      });
    });
  };

  /** Toggle the is_live flag for a project workflow. */
  updateIsLive = async (workspaceSlug: string, projectId: string, isLive: boolean): Promise<IProjectWorkflow> => {
    const result = await this.service.updateProjectWorkflow(workspaceSlug, projectId, { is_live: isLive });

    runInAction(() => {
      const current = this.workflowByProject.get(projectId);
      if (current) {
        this.workflowByProject.set(projectId, { ...current, isLive: result.is_live });
      }
    });

    return result;
  };

  /** Toggle allow_issue_creation for a specific state. */
  updateStateConfig = async (
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    allowIssueCreation: boolean
  ): Promise<void> => {
    await this.service.updateWorkflowStateConfig(workspaceSlug, stateId, { allow_issue_creation: allowIssueCreation });

    runInAction(() => {
      const current = this.workflowByProject.get(projectId);
      if (current?.states[stateId] !== undefined) {
        current.states[stateId] = { ...current.states[stateId], allow_issue_creation: allowIssueCreation };
        this.workflowByProject.set(projectId, { ...current });
      }
    });
  };

  /** Add a permitted transition between two states. */
  addTransition = async (
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    transitionStateId: string
  ): Promise<void> => {
    const result = await this.service.addTransition(workspaceSlug, projectId, stateId, transitionStateId);

    runInAction(() => {
      const current = this.workflowByProject.get(projectId);
      if (current?.states[stateId]) {
        current.states[stateId].transitions[result.id] = {
          transition_state: transitionStateId,
          approvers: [],
        };
        this.workflowByProject.set(projectId, { ...current });
      }
    });
  };

  /** Remove a transition by ID. */
  removeTransition = async (
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    transitionId: string
  ): Promise<void> => {
    await this.service.deleteTransition(workspaceSlug, projectId, transitionId);

    runInAction(() => {
      const current = this.workflowByProject.get(projectId);
      if (current?.states[stateId]) {
        delete current.states[stateId].transitions[transitionId];
        this.workflowByProject.set(projectId, { ...current });
      }
    });
  };

  /** Add approvers to a transition. */
  addApprovers = async (
    workspaceSlug: string,
    projectId: string,
    transitionId: string,
    stateId: string,
    approverIds: string[]
  ): Promise<void> => {
    const result = await this.service.addApprovers(workspaceSlug, projectId, transitionId, approverIds);

    runInAction(() => {
      const current = this.workflowByProject.get(projectId);
      if (current?.states[stateId]?.transitions[transitionId]) {
        current.states[stateId].transitions[transitionId].approvers = result.approvers;
        this.workflowByProject.set(projectId, { ...current });
      }
    });
  };

  /** Remove a single approver from a transition. */
  removeApprover = async (
    workspaceSlug: string,
    projectId: string,
    transitionId: string,
    stateId: string,
    approverId: string
  ): Promise<void> => {
    await this.service.deleteApprover(workspaceSlug, projectId, transitionId, approverId);

    runInAction(() => {
      const current = this.workflowByProject.get(projectId);
      if (current?.states[stateId]?.transitions[transitionId]) {
        current.states[stateId].transitions[transitionId].approvers = current.states[stateId].transitions[
          transitionId
        ].approvers.filter((id) => id !== approverId);
        this.workflowByProject.set(projectId, { ...current });
      }
    });
  };

  /** Full workflow reset: clears all transitions and state configs, sets is_live=false. */
  resetWorkflow = async (workspaceSlug: string, projectId: string): Promise<void> => {
    await this.service.resetWorkflow(workspaceSlug, projectId);

    runInAction(() => {
      const current = this.workflowByProject.get(projectId);
      if (current) {
        const resetStates = Object.fromEntries(
          Object.keys(current.states).map((stateId) => [
            stateId,
            { allow_issue_creation: true, transitions: {} },
          ])
        );
        this.workflowByProject.set(projectId, { isLive: false, states: resetStates });
      }
    });
  };

  /** Fetch workflow activity log. */
  fetchActivity = async (workspaceSlug: string, projectId: string): Promise<IWorkflowActivity[]> => {
    return this.service.getWorkflowActivity(workspaceSlug, projectId);
  };

  /** Open the blocker modal for non-Kanban layout rejections. */
  openBlockerModal = (payload: { allowedReviewers: string[]; fromState: string; toState: string }): void => {
    this.blockerModal = { isOpen: true, ...payload };
  };

  /** Close the blocker modal. */
  closeBlockerModal = (): void => {
    this.blockerModal = null;
  };
}

