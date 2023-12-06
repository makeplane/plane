import { observable, action, computed, makeObservable, runInAction } from "mobx";
// services
import IssueService from "services/issue.service";
// store
import { RootStore } from "./root";
// types
// import { IssueDetailType, TIssueBoardKeys } from "types/issue";
import { IIssue, IIssueState, IIssueLabel } from "types/issue";

export interface IIssueStore {
  loader: boolean;
  error: any;
  // issue options
  issues: IIssue[] | null;
  states: IIssueState[] | null;
  labels: IIssueLabel[] | null;
  // filtering
  filteredStates: string[];
  filteredLabels: string[];
  filteredPriorities: string[];
  // service
  issueService: any;
  // actions
  fetchPublicIssues: (workspace_slug: string, project_slug: string, params: any) => void;
  getCountOfIssuesByState: (state: string) => number;
  getFilteredIssuesByState: (state: string) => IIssue[];
}

class IssueStore implements IIssueStore {
  loader: boolean = false;
  error: any | null = null;

  states: IIssueState[] | null = [];
  labels: IIssueLabel[] | null = [];

  filteredStates: string[] = [];
  filteredLabels: string[] = [];
  filteredPriorities: string[] = [];

  issues: IIssue[] | null = [];
  issue_detail: any = {};

  rootStore: RootStore;
  issueService: any;

  constructor(_rootStore: any) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,
      // issue options
      states: observable.ref,
      labels: observable.ref,
      // filtering
      filteredStates: observable.ref,
      filteredLabels: observable.ref,
      filteredPriorities: observable.ref,
      // issues
      issues: observable.ref,
      issue_detail: observable.ref,
      // actions
      fetchPublicIssues: action,
      getFilteredIssuesByState: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }

  fetchPublicIssues = async (workspaceSlug: string, projectId: string, params: any) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.issueService.getPublicIssues(workspaceSlug, projectId, params);

      if (response) {
        const _states: IIssueState[] = [...response?.states];
        const _labels: IIssueLabel[] = [...response?.labels];
        const _issues: IIssue[] = [...response?.issues];
        runInAction(() => {
          this.states = _states;
          this.labels = _labels;
          this.issues = _issues;
          this.loader = false;
        });
      }
    } catch (error) {
      this.loader = false;
      this.error = error;
    }
  };

  // computed
  getCountOfIssuesByState(state_id: string): number {
    return this.issues?.filter((issue) => issue.state == state_id).length || 0;
  }

  getFilteredIssuesByState = (state_id: string): IIssue[] | [] =>
    this.issues?.filter((issue) => issue.state == state_id) || [];
}

export default IssueStore;
