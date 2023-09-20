import { action, computed, observable, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
import { IIssueLabels, IWorkspace } from "types";
// services
import { WorkspaceService } from "services/workspace.service";
import { ProjectServices } from "services/project.service";
import { ProjectIssuesServices as IssueServices } from "services/issues.service";

export interface IWorkspaceStore {
  loader: boolean;
  error: any | null;

  workspaces: {
    [key: string]: IWorkspace; // workspace_id: workspace
  } | null;
  labels: { [key: string]: { [key: string]: IIssueLabels } } | null; // workspace_id: label_id: labels
  workspaceId: string | null;

  // computed
  currentWorkspace: IWorkspace | null;
  workspaceLabels: { [key: string]: IIssueLabels } | null;

  // actions
  setWorkspaceId: (workspaceSlug: string) => void;

  workspaceById: (workspaceId: string) => IWorkspace | null;
  workspaceLabelById: (labelId: string) => IIssueLabels | null;

  getWorkspaces: () => Promise<void>;
  getWorkspaceLabels: (workspaceSlug: string) => Promise<void>;
}

class WorkspaceStore implements IWorkspaceStore {
  loader: boolean = false;
  error: any | null = null;

  workspaces: {
    [key: string]: IWorkspace;
  } | null = null;
  labels: {
    [key: string]: { [key: string]: IIssueLabels };
  } | null = null;
  workspaceId: string | null = null;

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

      workspaces: observable.ref,
      labels: observable.ref,
      workspaceId: observable.ref,

      // computed
      currentWorkspace: computed,
      workspaceLabels: computed,

      // actions
      setWorkspaceId: action,
      workspaceById: action,
      workspaceLabelById: action,

      getWorkspaces: action,
      getWorkspaceLabels: action,
    });

    this.rootStore = _rootStore;
    this.workspaceService = new WorkspaceService();
    this.projectService = new ProjectServices();
    this.issueService = new IssueServices();
  }

  // computed
  get currentWorkspace() {
    if (!this.workspaceId) return null;
    return this.workspaces?.[this.workspaceId] || null;
  }
  get workspaceLabels() {
    if (!this.workspaceId) return null;
    const _labels = this.labels?.[this.workspaceId];
    return _labels && Object.keys(_labels).length > 0 ? _labels : null;
  }

  // actions
  workspaceById = (workspaceId: string) => this.workspaces?.[workspaceId] || null;
  workspaceLabelById = (labelId: string) => {
    if (!this.workspaceId) return null;
    return this.labels?.[this.workspaceId]?.[labelId] || null;
  };

  setWorkspaceId = (workspaceSlug: string) => {
    this.workspaceId = workspaceSlug ?? null;
  };

  getWorkspaces = async () => {
    try {
      this.loader = true;
      this.error = null;

      const workspaceResponse = await this.workspaceService.userWorkspaces();

      let _workspaces: { [key: string]: IWorkspace } = {};
      workspaceResponse.map((_workspace) => {
        _workspaces = { ..._workspaces, [_workspace.slug]: _workspace };
      });

      runInAction(() => {
        this.workspaces = _workspaces;
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.log(error);
      this.loader = false;
      this.error = error;
    }
  };

  getWorkspaceLabels = async (workspaceSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const labelsResponse = await this.issueService.getWorkspaceLabels(workspaceSlug);
      let _labels: { [key: string]: IIssueLabels } = {};
      labelsResponse.map((_label) => {
        _labels = { ..._labels, [_label.id]: _label };
      });

      runInAction(() => {
        this.labels = {
          ...this.labels,
          [workspaceSlug]: _labels,
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
