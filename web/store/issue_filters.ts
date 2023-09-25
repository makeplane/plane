import { observable, action, computed, makeObservable, runInAction } from "mobx";
// services
import { ProjectService } from "services/project.service";
import { IssueService } from "services/issue.service";
// types
import { RootStore } from "./root";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IProjectViewProps,
  TIssueParams,
} from "types";
import { handleIssueQueryParamsByLayout } from "helpers/issue.helper";

export interface IIssueFilterStore {
  loader: boolean;
  error: any | null;
  userDisplayProperties: IIssueDisplayProperties;
  userDisplayFilters: IIssueDisplayFilterOptions;
  userFilters: IIssueFilterOptions;
  defaultDisplayFilters: IIssueDisplayFilterOptions;
  defaultFilters: IIssueFilterOptions;

  // action
  fetchUserProjectFilters: (workspaceSlug: string, projectSlug: string) => Promise<void>;
  updateUserFilters: (
    workspaceSlug: string,
    projectSlug: string,
    filterToUpdate: Partial<IProjectViewProps>
  ) => Promise<void>;
  updateDisplayProperties: (
    workspaceSlug: string,
    projectSlug: string,
    properties: Partial<IIssueDisplayProperties>
  ) => Promise<void>;

  // computed
  appliedFilters: TIssueParams[] | null;
}

class IssueFilterStore implements IIssueFilterStore {
  loader: boolean = false;
  error: any | null = null;

  // observables
  userDisplayProperties: any = {};
  userDisplayFilters: IIssueDisplayFilterOptions = {};
  userFilters: IIssueFilterOptions = {};
  defaultDisplayFilters: IIssueDisplayFilterOptions = {};
  defaultFilters: IIssueFilterOptions = {};
  defaultDisplayProperties: IIssueDisplayProperties = {
    assignee: true,
    start_date: true,
    due_date: true,
    labels: true,
    key: true,
    priority: true,
    state: true,
    sub_issue_count: true,
    link: true,
    attachment_count: true,
    estimate: true,
    created_on: true,
    updated_on: true,
  };

  // root store
  rootStore;

  // services
  projectService;
  issueService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,

      // observables
      defaultDisplayFilters: observable.ref,
      defaultFilters: observable.ref,
      userDisplayProperties: observable.ref,
      userDisplayFilters: observable.ref,
      userFilters: observable.ref,

      // actions
      fetchUserProjectFilters: action,
      updateUserFilters: action,
      updateDisplayProperties: action,

      // computed
      appliedFilters: computed,
    });

    this.rootStore = _rootStore;

    this.projectService = new ProjectService();
    this.issueService = new IssueService();
  }

  get appliedFilters(): TIssueParams[] | null {
    return handleIssueQueryParamsByLayout(this.userDisplayFilters.layout);
  }

  fetchUserProjectFilters = async (workspaceSlug: string, projectId: string) => {
    try {
      const memberResponse = await this.projectService.projectMemberMe(workspaceSlug, projectId);
      const issueProperties = await this.issueService.getIssueProperties(workspaceSlug, projectId);

      runInAction(() => {
        this.userFilters = memberResponse?.view_props?.filters;
        this.userDisplayFilters = memberResponse?.view_props?.display_filters ?? {};
        this.userDisplayProperties = issueProperties?.properties || this.defaultDisplayProperties;
        // default props from api
        this.defaultFilters = memberResponse.default_props.filters;
        this.defaultDisplayFilters = memberResponse.default_props.display_filters ?? {};
      });
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to fetch user filters in issue filter store", error);
    }
  };

  updateUserFilters = async (workspaceSlug: string, projectId: string, filterToUpdate: Partial<IProjectViewProps>) => {
    const newViewProps = {
      display_filters: {
        ...this.userDisplayFilters,
        ...filterToUpdate.display_filters,
      },
      filters: {
        ...this.userFilters,
        ...filterToUpdate.filters,
      },
    };

    try {
      runInAction(() => {
        this.userFilters = newViewProps.filters;
        this.userDisplayFilters = newViewProps.display_filters;
      });

      await this.projectService.setProjectView(workspaceSlug, projectId, {
        view_props: newViewProps,
      });
    } catch (error) {
      this.fetchUserProjectFilters(workspaceSlug, projectId);

      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to update user filters in issue filter store", error);
    }
  };

  updateDisplayProperties = async (
    workspaceSlug: string,
    projectId: string,
    properties: Partial<IIssueDisplayProperties>
  ) => {
    const newProperties = {
      ...this.userDisplayProperties,
      ...properties,
    };

    try {
      runInAction(() => {
        this.userDisplayProperties = newProperties;
      });

      // await this.issueService.patchIssueProperties(workspaceSlug, projectId, newProperties);
    } catch (error) {
      this.fetchUserProjectFilters(workspaceSlug, projectId);

      runInAction(() => {
        this.error = error;
      });

      console.log("Failed to update user filters in issue filter store", error);
    }
  };
}

export default IssueFilterStore;
