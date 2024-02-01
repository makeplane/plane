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
    issueIds: string[]
  ) => Promise<void>;
  updateSubIssue: (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string,
    issueData: Partial<TIssue>,
    oldIssue?: Partial<TIssue>,
    fromModal?: boolean
  ) => Promise<void>;
  removeSubIssue: (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => Promise<void>;
  deleteSubIssue: (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => Promise<void>;
}

type TSubIssueHelpersKeys = "issue_visibility" | "preview_loader" | "issue_loader";
type TSubIssueHelpers = Record<TSubIssueHelpersKeys, string[]>;
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
  setSubIssueHelpers: (parentIssueId: string, key: TSubIssueHelpersKeys, value: string) => void;
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
    preview_loader: this.subIssueHelpers?.[issueId]?.preview_loader || [],
    issue_visibility: this.subIssueHelpers?.[issueId]?.issue_visibility || [],
    issue_loader: this.subIssueHelpers?.[issueId]?.issue_loader || [],
  });

  // actions
  setSubIssueHelpers = (parentIssueId: string, key: TSubIssueHelpersKeys, value: string) => {
    if (!parentIssueId || !key || !value) return;

    update(this.subIssueHelpers, [parentIssueId, key], (_subIssueHelpers: string[] = []) => {
      if (_subIssueHelpers.includes(value)) return pull(_subIssueHelpers, value);
      return concat(_subIssueHelpers, value);
    });
  };

  fetchSubIssues = async (workspaceSlug: string, projectId: string, parentIssueId: string) => {
    try {
      const response = await this.issueService.subIssues(workspaceSlug, projectId, parentIssueId);
      const subIssuesStateDistribution = response?.state_distribution ?? {};
      const subIssues = (response.sub_issues ?? []) as TIssue[];

      this.rootIssueDetailStore.rootIssueStore.issues.addIssue(subIssues);

      runInAction(() => {
        set(this.subIssuesStateDistribution, parentIssueId, subIssuesStateDistribution);
        set(
          this.subIssues,
          parentIssueId,
          subIssues.map((issue) => issue.id)
        );
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  createSubIssues = async (workspaceSlug: string, projectId: string, parentIssueId: string, issueIds: string[]) => {
    try {
      const response = await this.issueService.addSubIssues(workspaceSlug, projectId, parentIssueId, {
        sub_issue_ids: issueIds,
      });

      const subIssuesStateDistribution = response?.state_distribution;
      const subIssues = response.sub_issues as TIssue[];

      runInAction(() => {
        Object.keys(subIssuesStateDistribution).forEach((key) => {
          const stateGroup = key as keyof TSubIssuesStateDistribution;
          update(this.subIssuesStateDistribution, [parentIssueId, stateGroup], (stateDistribution) => {
            if (!stateDistribution) return subIssuesStateDistribution[stateGroup];
            return concat(stateDistribution, subIssuesStateDistribution[stateGroup]);
          });
        });

        const issueIds = subIssues.map((issue) => issue.id);
        update(this.subIssues, [parentIssueId], (issues) => {
          if (!issues) return issueIds;
          return concat(issues, issueIds);
        });
      });

      this.rootIssueDetailStore.rootIssueStore.issues.addIssue(subIssues);

      return;
    } catch (error) {
      throw error;
    }
  };

  updateSubIssue = async (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string,
    issueData: Partial<TIssue>,
    oldIssue: Partial<TIssue> = {},
    fromModal: boolean = false
  ) => {
    try {
      if (!fromModal)
        await this.rootIssueDetailStore.rootIssueStore.projectIssues.updateIssue(
          workspaceSlug,
          projectId,
          issueId,
          issueData
        );

      // parent update
      if (issueData.hasOwnProperty("parent_id") && issueData.parent_id !== oldIssue.parent_id) {
        runInAction(() => {
          if (oldIssue.parent_id) pull(this.subIssues[oldIssue.parent_id], issueId);
          if (issueData.parent_id)
            set(this.subIssues, [issueData.parent_id], concat(this.subIssues[issueData.parent_id], issueId));
        });
      }

      // state update
      if (issueData.hasOwnProperty("state_id") && issueData.state_id !== oldIssue.state_id) {
        let oldIssueStateGroup: string | undefined = undefined;
        let issueStateGroup: string | undefined = undefined;

        if (oldIssue.state_id) {
          const state = this.rootIssueDetailStore.rootIssueStore.state.getStateById(oldIssue.state_id);
          if (state?.group) oldIssueStateGroup = state.group;
        }

        if (issueData.state_id) {
          const state = this.rootIssueDetailStore.rootIssueStore.state.getStateById(issueData.state_id);
          if (state?.group) issueStateGroup = state.group;
        }

        if (oldIssueStateGroup && issueStateGroup && issueStateGroup !== oldIssueStateGroup) {
          runInAction(() => {
            if (oldIssueStateGroup)
              update(this.subIssuesStateDistribution, [parentIssueId, oldIssueStateGroup], (stateDistribution) => {
                if (!stateDistribution) return;
                return pull(stateDistribution, issueId);
              });

            if (issueStateGroup)
              update(this.subIssuesStateDistribution, [parentIssueId, issueStateGroup], (stateDistribution) => {
                if (!stateDistribution) return [issueId];
                return concat(stateDistribution, issueId);
              });
          });
        }
      }

      return;
    } catch (error) {
      throw error;
    }
  };

  removeSubIssue = async (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => {
    try {
      await this.rootIssueDetailStore.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, {
        parent_id: null,
      });

      const issue = this.rootIssueDetailStore.issue.getIssueById(issueId);
      if (issue && issue.state_id) {
        let issueStateGroup: string | undefined = undefined;
        const state = this.rootIssueDetailStore.rootIssueStore.state.getStateById(issue.state_id);
        if (state?.group) issueStateGroup = state.group;

        if (issueStateGroup) {
          runInAction(() => {
            if (issueStateGroup)
              update(this.subIssuesStateDistribution, [parentIssueId, issueStateGroup], (stateDistribution) => {
                if (!stateDistribution) return;
                return pull(stateDistribution, issueId);
              });
          });
        }
      }

      runInAction(() => {
        pull(this.subIssues[parentIssueId], issueId);
      });

      return;
    } catch (error) {
      throw error;
    }
  };

  deleteSubIssue = async (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => {
    try {
      await this.rootIssueDetailStore.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);

      const issue = this.rootIssueDetailStore.issue.getIssueById(issueId);
      if (issue && issue.state_id) {
        let issueStateGroup: string | undefined = undefined;
        const state = this.rootIssueDetailStore.rootIssueStore.state.getStateById(issue.state_id);
        if (state?.group) issueStateGroup = state.group;

        if (issueStateGroup) {
          runInAction(() => {
            if (issueStateGroup)
              update(this.subIssuesStateDistribution, [parentIssueId, issueStateGroup], (stateDistribution) => {
                if (!stateDistribution) return;
                return pull(stateDistribution, issueId);
              });
          });
        }
      }

      runInAction(() => {
        pull(this.subIssues[parentIssueId], issueId);
      });

      return;
    } catch (error) {
      throw error;
    }
  };
}
