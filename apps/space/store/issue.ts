// mobx
import { observable, action, computed, makeObservable, runInAction } from "mobx";
// service
import IssueService from "services/issue.service";
// types
import { TIssueBoardKeys } from "store/types/issue";
import { IIssueStore, IIssue, IIssueState, IIssueLabel } from "./types";

class IssueStore implements IIssueStore {
  currentIssueBoardView: TIssueBoardKeys | null = null;

  loader: boolean = false;
  error: any | null = null;

  states: IIssueState[] | null = null;
  labels: IIssueLabel[] | null = null;
  issues: IIssue[] | null = null;

  userSelectedStates: string[] = [];
  userSelectedLabels: string[] = [];
  // root store
  rootStore;
  // service
  issueService;

  constructor(_rootStore: any) {
    makeObservable(this, {
      // observable
      currentIssueBoardView: observable,

      loader: observable,
      error: observable,

      states: observable.ref,
      labels: observable.ref,
      issues: observable.ref,

      userSelectedStates: observable,
      userSelectedLabels: observable,
      // action
      setCurrentIssueBoardView: action,
      getIssuesAsync: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }

  // computed
  getCountOfIssuesByState(state_id: string): number {
    return this.issues?.filter((issue) => issue.state == state_id).length || 0;
  }

  getFilteredIssuesByState(state_id: string): IIssue[] | [] {
    return this.issues?.filter((issue) => issue.state == state_id) || [];
  }

  // action
  setCurrentIssueBoardView = async (view: TIssueBoardKeys) => {
    this.currentIssueBoardView = view;
  };

  getIssuesAsync = async (workspace_slug: string, project_slug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.issueService.getPublicIssues(workspace_slug, project_slug);

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
        return response;
      }
    } catch (error) {
      this.loader = false;
      this.error = error;
      return error;
    }
  };
}

export default IssueStore;
