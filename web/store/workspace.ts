import { action, computed, observable, makeObservable, runInAction } from "mobx";
import { RootStore } from "./root";
// types
import { IIssueLabels, IProject, IWorkspace } from "types";
// services
import { WorkspaceService } from "services/workspace.service";
import { ProjectService } from "services/project.service";
import { IssueService } from "services/issue.service";

export interface IWorkspaceStore {
  loader: boolean;
  error: any | null;
  // observables
  workspaces: IWorkspace[];
  labels: { [key: string]: IIssueLabels[] } | {}; // workspace_id: labels[]
  workspaceSlug: string | null;
  // computed
  currentWorkspace: IWorkspace | null;
  workspaceLabels: IIssueLabels[];
  // actions
  setWorkspaceSlug: (workspaceSlug: string) => void;
  getWorkspaceBySlug: (workspaceSlug: string) => IWorkspace | null;
  getWorkspaceLabelById: (workspaceSlug: string, labelId: string) => IIssueLabels | null;
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspaceLabels: (workspaceSlug: string) => Promise<void>;
}

class WorkspaceStore implements IWorkspaceStore {
  loader: boolean = false;
  error: any | null = null;
  // observables
  workspaceSlug: string | null = null;
  workspaces: IWorkspace[] = [];
  projects: { [workspaceSlug: string]: IProject[] } = {}; // workspace_id: project[]
  labels: { [workspaceSlug: string]: IIssueLabels[] } = {};
  // root store
  rootStore;
  // services
  workspaceService;
  projectService;
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,
      // objects
      workspaces: observable.ref,
      labels: observable.ref,
      workspaceSlug: observable.ref,
      // computed
      currentWorkspace: computed,
      workspaceLabels: computed,
      // actions
      setWorkspaceSlug: action,
      getWorkspaceBySlug: action,
      getWorkspaceLabelById: action,
      fetchWorkspaces: action,
      fetchWorkspaceLabels: action,
    });

    this.rootStore = _rootStore;
    this.workspaceService = new WorkspaceService();
    this.projectService = new ProjectService();
    this.issueService = new IssueService();
  }

  /**
   * computed value of current workspace based on workspace id saved in the store
   */
  get currentWorkspace() {
    if (!this.workspaceSlug) return null;
    return this.workspaces?.find((workspace) => workspace.slug === this.workspaceSlug) || null;
  }

  /**
   * computed value of workspace labels using the workspace id from the store
   */
  get workspaceLabels() {
    if (!this.workspaceSlug) return [];
    const _labels = this.labels?.[this.workspaceSlug];
    return _labels && Object.keys(_labels).length > 0 ? _labels : [];
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
      this.loader = true;
      this.error = null;

      const labelsResponse = await this.issueService.getWorkspaceLabels(workspaceSlug);

      runInAction(() => {
        this.labels = {
          ...this.labels,
          [workspaceSlug]: labelsResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.log(error);
      this.loader = false;
      this.error = error;
    }
  };
}

export default WorkspaceStore;
