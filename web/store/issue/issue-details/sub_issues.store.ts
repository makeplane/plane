import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
import concat from "lodash/concat";
import update from "lodash/update";
import pull from "lodash/pull";
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
  fetchSubIssues: (workspaceSlug: string, projectId: string, parentIssueId: string) => Promise<TIssueSubIssues>;
  createSubIssues: (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    data: string[]
  ) => Promise<TIssueSubIssues>;
  updateSubIssue: (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string,
    data: Partial<TIssue>
  ) => any;
  removeSubIssue: (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string
  ) => Promise<TIssueSubIssues>;
  deleteSubIssue: (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string
  ) => Promise<TIssueSubIssues>;
}

type TSubIssueHelpers = {
  loaders: string[];
  visible: string[];
};
export interface IIssueSubIssuesStore extends IIssueSubIssuesStoreActions {
  // observables
  subIssuesStateDistribution: TIssueSubIssuesStateDistributionMap;
  subIssues: TIssueSubIssuesIdMap;
  subIssueHelpers: Record<string, TSubIssueHelpers>; // parent_issue_id -> TSubIssueHelpers
  // helper methods
  stateDistributionByIssueId: (issueId: string) => TSubIssuesStateDistribution | undefined;
  subIssuesByIssueId: (issueId: string) => string[] | undefined;
  subIssueHelpersByIssueId: (issueId: string) => TSubIssueHelpers;
  // actions
  setSubIssueHelpers: (parentIssueId: string, key: "visible" | "loaders", value: string) => void;
}

export class IssueSubIssuesStore implements IIssueSubIssuesStore {
  // observables
  subIssuesStateDistribution: TIssueSubIssuesStateDistributionMap = {};
  subIssues: TIssueSubIssuesIdMap = {};
  subIssueHelpers: Record<string, TSubIssueHelpers> = {};
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      subIssuesStateDistribution: observable,
      subIssues: observable,
      subIssueHelpers: observable,
      // actions
      setSubIssueHelpers: action,
      fetchSubIssues: action,
      createSubIssues: action,
      updateSubIssue: action,
      removeSubIssue: action,
      deleteSubIssue: action,
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

  subIssueHelpersByIssueId = (issueId: string) => ({
    loaders: this.subIssueHelpers?.[issueId]?.loaders || [],
    visible: this.subIssueHelpers?.[issueId]?.visible || [],
  });

  // actions

  setSubIssueHelpers = (parentIssueId: string, key: "visible" | "loaders", value: string) => {
    if (!parentIssueId || !key || !value) return;
    update(this.subIssueHelpers, [parentIssueId, key], (helpers: string[]) => {
      if (!helpers) return [value];
      else if (helpers.includes(value)) pull(this.subIssueHelpers[parentIssueId][key], value);
      else concat(helpers, value);
    });
  };

  fetchSubIssues = async (workspaceSlug: string, projectId: string, parentIssueId: string) => {
    try {
      this.setSubIssueHelpers(parentIssueId, "loaders", parentIssueId);
      this.setSubIssueHelpers(parentIssueId, "visible", parentIssueId);
      const response = await this.issueService.subIssues(workspaceSlug, projectId, parentIssueId);
      const subIssuesStateDistribution = response?.state_distribution ?? {};
      const subIssues = (response.sub_issues ?? []) as TIssue[];

      this.rootIssueDetailStore.rootIssueStore.issues.addIssue(subIssues);

      if (subIssues.length > 0) {
        runInAction(() => {
          set(this.subIssuesStateDistribution, parentIssueId, subIssuesStateDistribution);
          set(
            this.subIssues,
            parentIssueId,
            subIssues.map((issue) => issue.id)
          );
        });
      }
      this.setSubIssueHelpers(parentIssueId, "loaders", parentIssueId);
      return response;
    } catch (error) {
      throw error;
    }
  };

  createSubIssues = async (workspaceSlug: string, projectId: string, parentIssueId: string, data: string[]) => {
    try {
      const response = await this.issueService.addSubIssues(workspaceSlug, projectId, parentIssueId, {
        sub_issue_ids: data,
      });

      console.log("response", response);

      const subIssuesStateDistribution = response?.state_distribution;
      const subIssues = response.sub_issues as TIssue[];

      // this.rootIssueDetailStore.rootIssueStore.issues.addIssue(subIssues);

      // runInAction(() => {
      //   Object.keys(subIssuesStateDistribution).forEach((key) => {
      //     const stateGroup = key as keyof TSubIssuesStateDistribution;
      //     set(this.subIssuesStateDistribution, [parentIssueId, key], subIssuesStateDistribution[stateGroup]);
      //   });
      //   set(this.subIssuesStateDistribution, parentIssueId, data);
      // });

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
    data: Partial<TIssue>
  ) => {
    try {
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

  removeSubIssue = async (workspaceSlug: string, projectId: string, parentId: string, issueId: string) => {
    try {
      // const response = await this.issueService.addSubIssues(workspaceSlug, projectId, issueId, { sub_issue_ids: data });
      // const subIssuesStateDistribution = response?.state_distribution;
      // const subIssues = response.sub_issues as TIssue[];

      // this.rootIssueDetailStore.rootIssueStore.issues.addIssue(subIssues);

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

  deleteSubIssue = async (workspaceSlug: string, projectId: string, parentId: string, issueId: string) => {
    try {
      // const response = await this.issueService.addSubIssues(workspaceSlug, projectId, issueId, { sub_issue_ids: data });
      // const subIssuesStateDistribution = response?.state_distribution;
      // const subIssues = response.sub_issues as TIssue[];

      // this.rootIssueDetailStore.rootIssueStore.issues.addIssue(subIssues);

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
}
