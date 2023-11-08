import { observable, action, computed, makeObservable, runInAction, autorun } from "mobx";
// store
import { RootStore } from "../root";
// types
import { IIssue } from "types";
// services
import { IssueService } from "services/issue";
import { sortArrayByDate, sortArrayByPriority } from "constants/kanban-helpers";
import { IBlockUpdateData } from "components/gantt-chart";

export type IIssueType = "grouped" | "groupWithSubGroups" | "ungrouped";
export type IIssueGroupedStructure = { [group_id: string]: IIssue[] };
export type IIssueGroupWithSubGroupsStructure = {
  [group_id: string]: {
    [sub_group_id: string]: IIssue[];
  };
};
export type IIssueUnGroupedStructure = IIssue[];

export interface IIssueStore {
  loader: boolean;
  error: any | null;
  // issues
  issues: {
    [project_id: string]: IIssue[];
  };
  // computed
  getIssueType: IIssueType | null;
  getIssues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null;
  getIssuesCount: number;
  // action
  fetchIssues: (workspaceSlug: string, projectId: string) => Promise<any>;
  updateIssueStructure: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
  removeIssueFromStructure: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
  deleteIssue: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
  updateGanttIssueStructure: (workspaceSlug: string, issue: IIssue, payload: IBlockUpdateData) => void;
}

export class IssueStore implements IIssueStore {
  loader: boolean = false;
  error: any | null = null;
  issues: {
    [project_id: string]: IIssue[];
  } = {};
  // service
  issueService;
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      issues: observable.ref,
      // computed
      getIssues: computed,
      // actions
      fetchIssues: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueService();
  }

  fetchIssues = async (workspaceSlug: string, projectId: string) => {
    try {
      const issues = await this.issueService.getV2Issues(workspaceSlug, projectId);
      runInAction(() => {
        this.issues = {
          ...this.issues,
          [projectId]: issues,
        };
      });
    } catch (error) {
      throw error;
    }
  };

  get getIssues() {
    const displayProperties = this.rootStore.issueFilter.userDisplayProperties;
    return;
  }
}
