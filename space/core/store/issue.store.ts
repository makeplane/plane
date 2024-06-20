import { observable, action, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { IStateLite } from "@plane/types";
// services
import IssueService from "@/services/issue.service";
// store
import { CoreRootStore } from "@/store/root.store";
// types
import { IIssue, IIssueLabel } from "@/types/issue";

export interface IIssueStore {
  loader: boolean;
  error: any;
  // observables
  issues: IIssue[];
  states: IStateLite[];
  labels: IIssueLabel[];
  // filter observables
  filteredStates: string[];
  filteredLabels: string[];
  filteredPriorities: string[];
  // actions
  fetchPublicIssues: (anchor: string, params: any) => Promise<void>;
  // helpers
  getCountOfIssuesByState: (stateID: string) => number;
  getFilteredIssuesByState: (stateID: string) => IIssue[];
}

export class IssueStore implements IIssueStore {
  loader: boolean = false;
  error: any | null = null;
  // observables
  states: IStateLite[] = [];
  labels: IIssueLabel[] = [];
  issues: IIssue[] = [];
  // filter observables
  filteredStates: string[] = [];
  filteredLabels: string[] = [];
  filteredPriorities: string[] = [];
  // root store
  rootStore: CoreRootStore;
  // services
  issueService: IssueService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable,
      // observables
      states: observable,
      labels: observable,
      issues: observable,
      // filter observables
      filteredStates: observable,
      filteredLabels: observable,
      filteredPriorities: observable,
      // actions
      fetchPublicIssues: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }

  /**
   * @description fetch issues, states and labels
   * @param {string} anchor
   * @param params
   */
  fetchPublicIssues = async (anchor: string, params: any) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const response = await this.issueService.fetchPublicIssues(anchor, params);

      if (response) {
        runInAction(() => {
          this.states = response.states;
          this.labels = response.labels;
          this.issues = response.issues;
          this.loader = false;
        });
      }
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  /**
   * @description get total count of issues under a particular state
   * @param {string} stateID
   * @returns {number}
   */
  getCountOfIssuesByState = computedFn(
    (stateID: string) => this.issues?.filter((issue) => issue.state == stateID).length || 0
  );

  /**
   * @description get array of issues under a particular state
   * @param {string} stateID
   * @returns {IIssue[]}
   */
  getFilteredIssuesByState = computedFn(
    (stateID: string) => this.issues?.filter((issue) => issue.state == stateID) || []
  );
}
