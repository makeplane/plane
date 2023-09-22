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
  projects: { [key: string]: IProject[] };
  labels: { [key: string]: IIssueLabels[] } | {}; // workspace_id: labels[]
  workspaceSlug: string | null;
  // computed
  currentWorkspace: IWorkspace | null;
  workspaceLabels: IIssueLabels[] | null;
  // actions
  setWorkspaceSlug: (workspaceSlug: string) => void;
  getWorkspaceBySlug: (workspaceSlug: string) => IWorkspace | null;
  getWorkspaceLabelById: (workspaceSlug: string, labelId: string) => IIssueLabels | null;
  getWorkspaceProjects: (workspaceSlug: string) => IProject[];
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
      loader: observable,
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
      getWorkspaceProjects: action,
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
    return _labels && Object.keys(_labels).length > 0 ? _labels : null;
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
   * get Workspace projects using workspace slug
   * @param workspaceSlug
   * @returns
   */
  getWorkspaceProjects = (workspaceSlug: string) => this.projects[workspaceSlug];

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

  // getMyIssuesAsync = async (workspaceId: string, fetchFilterToggle: boolean = true) => {
  //   try {
  //     this.loader = true;
  //     this.error = null;

  //     if (fetchFilterToggle) await this.rootStore.issueFilters.getWorkspaceMyIssuesFilters(workspaceId);
  //     const filteredParams = this.rootStore.issueFilters.getComputedFilters(
  //       workspaceId,
  //       null,
  //       null,
  //       null,
  //       null,
  //       "my_issues"
  //     );
  //     const issuesResponse = await this.userService.userIssues(workspaceId, filteredParams);

  //     if (issuesResponse) {
  //       const _issueResponse: any = {
  //         ...this.issues,
  //         [workspaceId]: {
  //           ...this?.issues[workspaceId],
  //           my_issues: {
  //             ...this?.issues[workspaceId]?.my_issues,
  //             [this.rootStore?.issueFilters?.userFilters?.display_filters?.layout as string]: issuesResponse,
  //           },
  //         },
  //       };

  //       runInAction(() => {
  //         this.issues = _issueResponse;
  //         this.loader = false;
  //         this.error = null;
  //       });
  //     }

  //     return issuesResponse;
  //   } catch (error) {
  //     console.warn("error in fetching the my issues", error);
  //     this.loader = false;
  //     this.error = null;
  //     return error;
  //   }
  // };
}

export default WorkspaceStore;
