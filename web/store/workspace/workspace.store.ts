import { action, computed, observable, makeObservable, runInAction } from "mobx";
import { RootStore } from "../root";
// types
import { IIssueLabels, IProject, IWorkspace, IWorkspaceMember } from "types";
// services
import { WorkspaceService } from "services/workspace.service";
import { ProjectService } from "services/project";
import { IssueService, IssueLabelService } from "services/issue";

export interface IWorkspaceStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  workspaceSlug: string | null;
  workspaces: IWorkspace[];
  labels: { [workspaceSlug: string]: IIssueLabels[] } | {}; // workspaceSlug: labels[]
  members: { [workspaceSlug: string]: IWorkspaceMember[] } | {}; // workspaceSlug: members[]

  // actions
  setWorkspaceSlug: (workspaceSlug: string) => void;
  getWorkspaceBySlug: (workspaceSlug: string) => IWorkspace | null;
  getWorkspaceLabelById: (workspaceSlug: string, labelId: string) => IIssueLabels | null;
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspaceLabels: (workspaceSlug: string) => Promise<void>;
  fetchWorkspaceMembers: (workspaceSlug: string) => Promise<void>;

  // computed
  currentWorkspace: IWorkspace | null;
  workspaceLabels: IIssueLabels[] | null;
  workspaceMembers: IWorkspaceMember[] | null;
}

export class WorkspaceStore implements IWorkspaceStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  workspaceSlug: string | null = null;
  workspaces: IWorkspace[] = [];
  projects: { [workspaceSlug: string]: IProject[] } = {}; // workspace_id: project[]
  labels: { [workspaceSlug: string]: IIssueLabels[] } = {};
  members: { [workspaceSlug: string]: IWorkspaceMember[] } = {};

  // services
  workspaceService;
  projectService;
  issueService;
  issueLabelService;
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      workspaceSlug: observable.ref,
      workspaces: observable.ref,
      labels: observable.ref,
      members: observable.ref,

      // actions
      setWorkspaceSlug: action,
      getWorkspaceBySlug: action,
      getWorkspaceLabelById: action,
      fetchWorkspaces: action,
      fetchWorkspaceLabels: action,
      fetchWorkspaceMembers: action,

      // computed
      currentWorkspace: computed,
      workspaceLabels: computed,
      workspaceMembers: computed,
    });

    this.rootStore = _rootStore;
    this.workspaceService = new WorkspaceService();
    this.projectService = new ProjectService();
    this.issueService = new IssueService();
    this.issueLabelService = new IssueLabelService();
  }

  /**
   * computed value of current workspace based on workspace id saved in the store
   */
  get currentWorkspace() {
    if (!this.workspaceSlug) return null;

    return this.workspaces?.find((workspace) => workspace.slug === this.workspaceSlug) || null;
  }

  /**
   * computed value of workspace labels using the workspace slug from the store
   */
  get workspaceLabels() {
    if (!this.workspaceSlug) return [];
    const _labels = this.labels?.[this.workspaceSlug];
    return _labels && Object.keys(_labels).length > 0 ? _labels : [];
  }

  /**
   * computed value of workspace members using the workspace slug from the store
   */
  get workspaceMembers() {
    if (!this.workspaceSlug) return [];
    const _members = this.members?.[this.workspaceSlug];
    return _members && Object.keys(_members).length > 0 ? _members : [];
  }

  /**
   * set workspace slug in the store
   * @param workspaceSlug
   * @returns
   */
  setWorkspaceSlug = (workspaceSlug: string) => (this.workspaceSlug = workspaceSlug);

  /**
   * fetch workspace info from the array of workspaces in the store.
   * @param workspaceSlug
   */
  getWorkspaceBySlug = (workspaceSlug: string) => this.workspaces.find((w) => w.slug == workspaceSlug) || null;

  /**
   * get workspace label information from the workspace labels
   * @param labelId
   * @returns
   */
  getWorkspaceLabelById = (workspaceSlug: string, labelId: string) =>
    this.labels?.[workspaceSlug].find((label) => label.id === labelId) || null;

  /**
   * fetch user workspaces from API
   */
  fetchWorkspaces = async () => {
    try {
      this.loader = true;
      this.error = null;

      const workspaceResponse = await this.workspaceService.userWorkspaces();

      runInAction(() => {
        this.workspaces = workspaceResponse;
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.log("Failed to fetch user workspaces in workspace store", error);
      this.loader = false;
      this.error = error;
      this.workspaces = [];
    }
  };

  /**
   * fetch workspace labels using workspace slug
   * @param workspaceSlug
   */
  fetchWorkspaceLabels = async (workspaceSlug: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const labelsResponse = await this.issueLabelService.getWorkspaceIssueLabels(workspaceSlug);

      runInAction(() => {
        this.labels = {
          ...this.labels,
          [workspaceSlug]: labelsResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });
    }
  };

  /**
   * fetch workspace members using workspace slug
   * @param workspaceSlug
   */

  fetchWorkspaceMembers = async (workspaceSlug: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const membersResponse = await this.workspaceService.workspaceMembers(workspaceSlug);

      runInAction(() => {
        this.members = {
          ...this.members,
          [workspaceSlug]: membersResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });
    }
  };
}
