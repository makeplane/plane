import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { IssueService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import {
  TIssue,
  TIssueSubIssues,
  TIssueSubIssuesStateDistributionMap,
  TIssueSubIssuesIdMap,
  TSubIssuesStateDistribution,
} from "@plane/types";

export interface IIssueSubIssuesStoreActions {
  fetchSubIssues: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueSubIssues>;
  createSubIssues: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: string[]
  ) => Promise<TIssueSubIssues>;
  updateSubIssue: (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string,
    data: { oldParentId: string; newParentId: string }
  ) => any;
  removeSubIssue: (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueIds: string[]
  ) => Promise<TIssueSubIssues>;
}

export interface IIssueSubIssuesStore extends IIssueSubIssuesStoreActions {
  // observables
  subIssuesStateDistribution: TIssueSubIssuesStateDistributionMap;
  subIssues: TIssueSubIssuesIdMap;
  // helper methods
  stateDistributionByIssueId: (issueId: string) => TSubIssuesStateDistribution | undefined;
  subIssuesByIssueId: (issueId: string) => string[] | undefined;
}

export class IssueSubIssuesStore implements IIssueSubIssuesStore {
  // observables
  subIssuesStateDistribution: TIssueSubIssuesStateDistributionMap = {};
  subIssues: TIssueSubIssuesIdMap = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      subIssuesStateDistribution: observable,
      subIssues: observable,
      // actions
      fetchSubIssues: action,
      createSubIssues: action,
      updateSubIssue: action,
      removeSubIssue: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueService = new IssueService();
  }

  // helper methods
  stateDistributionByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.subIssuesStateDistribution[issueId] ?? undefined;
  };

  subIssuesByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.subIssues[issueId] ?? undefined;
  };

  // actions
  fetchSubIssues = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueService.subIssues(workspaceSlug, projectId, issueId);
      const subIssuesStateDistribution = response?.state_distribution ?? {};
      const subIssues = (response.sub_issues ?? []) as TIssue[];

      this.rootIssueDetailStore.rootIssueStore.issues.addIssue(subIssues);

      if (subIssues.length > 0) {
        runInAction(() => {
          set(this.subIssuesStateDistribution, issueId, subIssuesStateDistribution);
          set(
            this.subIssues,
            issueId,
            subIssues.map((issue) => issue.id)
          );
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  createSubIssues = async (workspaceSlug: string, projectId: string, issueId: string, data: string[]) => {
    try {
      const response = await this.issueService.addSubIssues(workspaceSlug, projectId, issueId, { sub_issue_ids: data });
      const subIssuesStateDistribution = response?.state_distribution;
      const subIssues = response.sub_issues as TIssue[];

      this.rootIssueDetailStore.rootIssueStore.issues.addIssue(subIssues);

      runInAction(() => {
        Object.keys(subIssuesStateDistribution).forEach((key) => {
          const stateGroup = key as keyof TSubIssuesStateDistribution;
          set(this.subIssuesStateDistribution, [issueId, key], subIssuesStateDistribution[stateGroup]);
        });
        set(this.subIssuesStateDistribution, issueId, data);
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateSubIssue = async (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string,
    data: { oldParentId: string; newParentId: string }
  ) => {
    try {
      const oldIssueParentId = data.oldParentId;
      const newIssueParentId = data.newParentId;

      // const issue = this.rootIssueDetailStore.rootIssueStore.issues.getIssueById(issueId);

      // runInAction(() => {
      //   Object.keys(subIssuesStateDistribution).forEach((key) => {
      //     const stateGroup = key as keyof TSubIssuesStateDistribution;
      //     set(this.subIssuesStateDistribution, [issueId, key], subIssuesStateDistribution[stateGroup]);
      //   });
      //   set(this.subIssuesStateDistribution, issueId, data);
      // });

      return {} as any;
    } catch (error) {
      throw error;
    }
  };

  removeSubIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: string[]) => {
    try {
      const response = await this.issueService.addSubIssues(workspaceSlug, projectId, issueId, { sub_issue_ids: data });
      const subIssuesStateDistribution = response?.state_distribution;
      const subIssues = response.sub_issues as TIssue[];

      this.rootIssueDetailStore.rootIssueStore.issues.addIssue(subIssues);

      runInAction(() => {
        Object.keys(subIssuesStateDistribution).forEach((key) => {
          const stateGroup = key as keyof TSubIssuesStateDistribution;
          set(this.subIssuesStateDistribution, [issueId, key], subIssuesStateDistribution[stateGroup]);
        });
        set(this.subIssuesStateDistribution, issueId, data);
      });

      return response;
    } catch (error) {
      throw error;
    }
  };
}
