import { observable, action, computed, makeObservable, runInAction } from "mobx";
// store
import { RootStore } from "../root";
// types
import { IIssue } from "types";
// services
import { IssueDraftService } from "services/issue";
import { sortArrayByDate, sortArrayByPriority } from "constants/kanban-helpers";

export type IIssueType = "grouped" | "groupWithSubGroups" | "ungrouped";
export type IIssueGroupedStructure = { [group_id: string]: IIssue[] };
export type IIssueGroupWithSubGroupsStructure = {
  [group_id: string]: {
    [sub_group_id: string]: IIssue[];
  };
};
export type IIssueUnGroupedStructure = IIssue[];

export interface IIssueDraftStore {
  loader: boolean;
  error: any | null;

  draftIssues: {
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
  };
  rootStore: RootStore;

  // computed
  getIssueType: IIssueType | null;
  getIssues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null;

  // actions
  fetchIssues: (workspaceSlug: string, projectId: string) => Promise<any>;
  createDraftIssue: (workspaceSlug: string, projectId: string, issueForm: Partial<IIssue>) => Promise<any>;
  updateIssueStructure: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
  deleteDraftIssue: (workspaceSlug: string, projectId: string, issueId: string) => void;
  updateDraftIssue: (workspaceSlug: string, projectId: string, issueForm: Partial<IIssue>) => void;
  convertDraftIssueToIssue: (workspaceSlug: string, projectId: string, issueId: string) => void;

  // service
  draftIssueService: IssueDraftService;
}

export class IssueDraftStore implements IIssueDraftStore {
  loader: boolean = false;
  error: any | null = null;
  draftIssues: IIssueDraftStore["draftIssues"] = {};
  // service
  draftIssueService: IssueDraftService;
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      draftIssues: observable.ref,
      // computed
      getIssueType: computed,
      getIssues: computed,
      // actions
      fetchIssues: action,
      createDraftIssue: action,
      updateIssueStructure: action,
      deleteDraftIssue: action,
      updateDraftIssue: action,
      convertDraftIssueToIssue: action,
    });
    this.rootStore = _rootStore;
    this.draftIssueService = new IssueDraftService();
  }

  get getIssueType() {
    // FIXME: this is temporary for development
    return "ungrouped";

    const groupedLayouts = ["kanban", "list", "calendar"];
    const ungroupedLayouts = ["spreadsheet", "gantt_chart"];

    const issueLayout = this.rootStore?.issueFilter?.userDisplayFilters?.layout || null;
    const issueSubGroup = this.rootStore?.issueFilter?.userDisplayFilters?.sub_group_by || null;
    if (!issueLayout) return null;

    const _issueState = groupedLayouts.includes(issueLayout)
      ? issueSubGroup
        ? "groupWithSubGroups"
        : "grouped"
      : ungroupedLayouts.includes(issueLayout)
      ? "ungrouped"
      : null;

    return _issueState || null;
  }

  get getDraftIssues() {
    const issueType = this.getIssueType;
    const projectId = this.rootStore?.project?.projectId;
    if (!projectId || !issueType) return null;

    return this.draftIssues?.[projectId]?.[issueType] || null;
  }

  get getIssues() {
    const projectId: string | null = this.rootStore?.project?.projectId;
    const issueType = this.getIssueType;
    if (!projectId || !issueType) return null;

    return this.draftIssues?.[projectId]?.[issueType] || null;
  }

  fetchIssues = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      this.rootStore.workspace.setWorkspaceSlug(workspaceSlug);
      this.rootStore.project.setProjectId(projectId);

      // const params = this.rootStore?.issueFilter?.appliedFilters;
      // TODO: use actual params using applied filters
      const params = {};
      const issueResponse = await this.draftIssueService.getDraftIssues(workspaceSlug, projectId, params);

      const issueType = this.getIssueType;
      if (issueType != null) {
        const _issues = {
          ...this.draftIssues,
          [projectId]: {
            ...this.draftIssues[projectId],
            [issueType]: issueResponse,
          },
        };
        runInAction(() => {
          this.draftIssues = _issues;
          this.loader = false;
          this.error = null;
        });
      }

      return issueResponse;
    } catch (error) {
      console.error("Error: Fetching error in issues", error);
      this.loader = false;
      this.error = error;
      return error;
    }
  };

  createDraftIssue = async (workspaceSlug: string, projectId: string, issueForm: Partial<IIssue>) => {
    const originalIssues = { ...this.draftIssues };

    runInAction(() => {
      this.loader = true;
      this.error = null;
    });

    try {
      const response = await this.draftIssueService.createDraftIssue(workspaceSlug, projectId, issueForm);
      runInAction(() => {
        this.loader = false;
        this.error = null;
      });

      return response;
    } catch (error) {
      console.error("Creating issue error", error);
      // reverting back to original issues in case of error
      runInAction(() => {
        this.loader = false;
        this.error = error;
        this.draftIssues = originalIssues;
      });
    }
  };

  updateIssueStructure = async (group_id: string | null, sub_group_id: string | null, issue: IIssue) => {
    const projectId: string | null = issue?.project;
    const issueType = this.getIssueType;
    if (!projectId || !issueType) return null;

    let issues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null =
      this.getDraftIssues;
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
    if (issueType === "ungrouped") {
      issues = issues as IIssueUnGroupedStructure;
      issues = issues.map((i: IIssue) => (i?.id === issue?.id ? { ...i, ...issue } : i));
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
      this.draftIssues = { ...this.draftIssues, [projectId]: { ...this.draftIssues[projectId], [issueType]: issues } };
    });
  };

  updateDraftIssue = async (workspaceSlug: string, projectId: string, issueForm: Partial<IIssue>) => {
    const originalIssues = { ...this.draftIssues };

    // FIXME: use real group_id and sub_group_id from filters
    const group_id = "1";
    const sub_group_id = "1";

    runInAction(() => {
      this.loader = true;
      this.error = null;
    });

    // optimistic updating draft issue
    this.updateIssueStructure(group_id, sub_group_id, issueForm as IIssue);

    try {
      await this.draftIssueService.updateDraftIssue(workspaceSlug, projectId, issueForm?.id!, issueForm);
      runInAction(() => {
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Updating issue error", error);
      // reverting back to original issues in case of error
      runInAction(() => {
        this.loader = false;
        this.error = error;
        this.draftIssues = originalIssues;
      });
    }
  };

  convertDraftIssueToIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    // update draft issue with is_draft being false
    this.updateDraftIssue(workspaceSlug, projectId, { id: issueId, is_draft: false });
  };

  deleteDraftIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const originalIssues = { ...this.draftIssues };

    const issueType = this.getIssueType;

    runInAction(() => {
      this.loader = true;
      this.error = null;
    });

    // FIXME: use real group_id and sub_group_id from filters
    const group_id = "1";
    const sub_group_id = "1";

    if (issueType) {
      let issues = originalIssues?.[projectId]?.[issueType] || null;
      if (!issues) return null;

      if (issueType === "grouped") {
        issues = issues as IIssueGroupedStructure;
        issues = {
          ...issues,
          [group_id]: issues[group_id].filter((i) => i?.id !== issueId),
        };
      }

      if (issueType === "groupWithSubGroups") {
        issues = issues as IIssueGroupWithSubGroupsStructure;
        issues = {
          ...issues,
          [sub_group_id]: {
            ...issues[sub_group_id],
            [group_id]: issues[sub_group_id][group_id].filter((i) => i?.id !== issueId),
          },
        };
      }

      if (issueType === "ungrouped") {
        issues = issues as IIssueUnGroupedStructure;
        issues = issues.filter((i) => i?.id !== issueId);
      }

      // optimistic removing draft issue
      runInAction(() => {
        this.draftIssues = {
          ...this.draftIssues,
          [projectId]: { ...this.draftIssues[projectId], [issueType]: issues },
        };
      });
    }

    try {
      // deleting using api
      await this.draftIssueService.deleteDraftIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Deleting issue error", error);
      // reverting back to original issues in case of error
      runInAction(() => {
        this.loader = false;
        this.error = error;
        this.draftIssues = originalIssues;
      });
    }
  };
}
