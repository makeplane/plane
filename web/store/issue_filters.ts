import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
import { ProjectService } from "services/project.service";
import { IssueService } from "services/issue.service";

export interface IIssueFilterStore {
  loader: boolean;
  error: any | null;
  userDisplayProperties: any;
  userDisplayFilters: any;
  userFilters: any;
  defaultDisplayFilters: any;
  defaultFilters: any;

  fetchUserFilters: (workspaceSlug: string, projectSlug: string) => void;
}

class IssueFilterStore implements IIssueFilterStore {
  loader: boolean = false;
  error: any | null = null;
  // observables
  userDisplayProperties: any = {};
  userDisplayFilters: any = {};
  userFilters: any = {};
  defaultDisplayFilters: any = {};
  defaultFilters: any = {};
  defaultDisplayProperties: any = {
    assignee: true,
    due_date: true,
    key: true,
    labels: true,
    priority: true,
    start_date: true,
    state: true,
    sub_issue_count: true,
  };
  // root store
  rootStore;

  projectService;
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,
      defaultDisplayFilters: observable.ref,
      defaultFilters: observable.ref,
      userDisplayProperties: observable.ref,
      userDisplayFilters: observable.ref,
      userFilters: observable.ref,
      fetchUserFilters: action,
    });

    this.rootStore = _rootStore;

    this.projectService = new ProjectService();
    this.issueService = new IssueService();
  }

  fetchUserFilters = async (workspaceSlug: string, projectId: string) => {
    try {
      const memberResponse = await this.projectService.projectMemberMe(workspaceSlug, projectId);
      const issueProperties = await this.issueService.getIssueProperties(workspaceSlug, projectId);

      console.log("memberResponse", memberResponse);

      console.log("issueProperties", issueProperties);

      runInAction(() => {
        this.userFilters = memberResponse?.view_props?.filters;
        this.userDisplayFilters = memberResponse?.view_props?.display_filters;
        this.userDisplayProperties = issueProperties?.properties || this.defaultDisplayProperties;
        // default props from api
        this.defaultFilters = memberResponse.default_props.filters;
        this.defaultDisplayFilters = memberResponse.default_props.display_filters;
      });
    } catch (error) {
      console.log("Failed to fetch user filters in issue filter store", error);
    }
  };
}

export default IssueFilterStore;
