import { observable, action, computed, makeObservable, runInAction, autorun } from "mobx";
// store
import { RootStore } from "../root";
// types
import { IIssue } from "types";
// services
import { IssueArchiveService } from "services/issue";
import { sortArrayByDate, sortArrayByPriority } from "constants/kanban-helpers";
import {
  IIssueGroupWithSubGroupsStructure,
  IIssueGroupedStructure,
  IIssueType,
  IIssueUnGroupedStructure,
} from "store/issue";

export interface IArchivedIssueStore {
  loader: boolean;
  error: any | null;
  // issues
  issues: {
    [project_id: string]: {
      grouped: IIssueGroupedStructure;
      groupWithSubGroups: IIssueGroupWithSubGroupsStructure;
      ungrouped: IIssueUnGroupedStructure;
    };
  };
  issueDetail: {
    [project_id: string]: {
      [issue_id: string]: IIssue;
    };
  };

  // services
  archivedIssueService: IssueArchiveService;

  // computed
  getIssueType: IIssueType | null;
  getIssues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null;

  // action
  fetchIssues: (workspaceSlug: string, projectId: string) => Promise<any>;
  updateIssueStructure: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
  deleteArchivedIssue: (group: string | null, sub_group: string | null, issue: IIssue) => Promise<any>;
}

export class ArchivedIssueStore implements IArchivedIssueStore {
  loader: boolean = false;
  error: any | null = null;
  issues: {
    [project_id: string]: {
      grouped: {
        [group_id: string]: IIssue[];
      };
      groupWithSubGroups: {
        [group_id: string]: {
          [sub_group_id: string]: IIssue[];
        };
      };
      ungrouped: IIssue[];
    };
  } = {};
  issueDetail: IArchivedIssueStore["issueDetail"] = {};

  // service
  archivedIssueService;
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      issues: observable.ref,

      // computed
      getIssueType: computed,
      getIssues: computed,

      // actions
      fetchIssues: action,
      updateIssueStructure: action,
      deleteArchivedIssue: action,
    });
    this.rootStore = _rootStore;
    this.archivedIssueService = new IssueArchiveService();

    autorun(() => {
      const workspaceSlug = this.rootStore.workspace.workspaceSlug;
      const projectId = this.rootStore.project.projectId;

      if (
        workspaceSlug &&
        projectId &&
        this.rootStore.archivedIssueFilters.userDisplayFilters &&
        this.rootStore.archivedIssueFilters.userFilters
      )
        this.fetchIssues(workspaceSlug, projectId);
    });
  }

  get getIssueType() {
    const issueSubGroup = this.rootStore.archivedIssueFilters.userDisplayFilters?.sub_group_by || null;
    return issueSubGroup ? "groupWithSubGroups" : "grouped";
  }

  get getIssues() {
    const projectId: string | null = this.rootStore?.project?.projectId;
    const issueType = this.getIssueType;
    if (!projectId || !issueType) return null;

    return this.issues?.[projectId]?.[issueType] || null;
  }

  updateIssueStructure = async (group_id: string | null, sub_group_id: string | null, issue: IIssue) => {
    const projectId: string | null = issue?.project;
    const issueType = this.getIssueType;
    if (!projectId || !issueType) return null;

    let issues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null =
      this.getIssues;
    if (!issues) return null;

    if (issueType === "grouped" && group_id) {
      issues = issues as IIssueGroupedStructure;
      issues = {
        ...issues,
        [group_id]: issues[group_id].map((i: IIssue) => (i?.id === issue?.id ? { ...i, ...issue } : i)),
      };
    }
    if (issueType === "groupWithSubGroups" && group_id && sub_group_id) {
      issues = issues as IIssueGroupWithSubGroupsStructure;
      issues = {
        ...issues,
        [sub_group_id]: {
          ...issues[sub_group_id],
          [group_id]: issues[sub_group_id][group_id].map((i: IIssue) => (i?.id === issue?.id ? { ...i, ...issue } : i)),
        },
      };
    }

    const orderBy = this.rootStore?.issueFilter?.userDisplayFilters?.order_by || "";
    if (orderBy === "-created_at") {
      issues = sortArrayByDate(issues as any, "created_at");
    }
    if (orderBy === "-updated_at") {
      issues = sortArrayByDate(issues as any, "updated_at");
    }
    if (orderBy === "start_date") {
      issues = sortArrayByDate(issues as any, "updated_at");
    }
    if (orderBy === "priority") {
      issues = sortArrayByPriority(issues as any, "priority");
    }

    runInAction(() => {
      this.issues = { ...this.issues, [projectId]: { ...this.issues[projectId], [issueType]: issues } };
    });
  };

  fetchIssues = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      this.rootStore.workspace.setWorkspaceSlug(workspaceSlug);
      this.rootStore.project.setProjectId(projectId);

      const params = this.rootStore.archivedIssueFilters.appliedFilters;
      const issueResponse = await this.archivedIssueService.getArchivedIssues(workspaceSlug, projectId, params);

      const issueType = this.getIssueType;
      if (issueType != null) {
        const _issues = {
          ...this.issues,
          [projectId]: {
            ...this.issues[projectId],
            [issueType]: issueResponse,
          },
        };
        runInAction(() => {
          this.issues = _issues;
          this.loader = false;
          this.error = null;
        });
      }

      return issueResponse;
    } catch (error) {
      console.error("Error: Fetching error in issues", error);
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  /**
   * @description Function to delete issue from the store. NOTE: This function is not deleting issue from the backend.
   */
  deleteArchivedIssue = async (group_id: string | null, sub_group_id: string | null, issue: IIssue) => {
    const projectId: string | null = issue?.project;
    const issueType = this.getIssueType;
    if (!projectId || !issueType) return null;

    let issues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null =
      this.getIssues;
    if (!issues) return null;

    if (issueType === "grouped" && group_id) {
      issues = issues as IIssueGroupedStructure;
      issues = {
        ...issues,
        [group_id]: issues?.[group_id]?.filter((i) => i?.id !== issue?.id),
      };
    }
    if (issueType === "groupWithSubGroups" && group_id && sub_group_id) {
      issues = issues as IIssueGroupWithSubGroupsStructure;
      issues = {
        ...issues,
        [sub_group_id]: {
          ...issues?.[sub_group_id],
          [group_id]: issues?.[sub_group_id]?.[group_id]?.filter((i) => i?.id !== issue?.id),
        },
      };
    }

    runInAction(() => {
      this.issues = { ...this.issues, [projectId]: { ...this.issues[projectId], [issueType]: issues } };
    });
  };
}
