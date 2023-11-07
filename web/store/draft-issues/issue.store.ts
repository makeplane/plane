import { observable, action, computed, makeObservable, runInAction, autorun } from "mobx";
// store
import { RootStore } from "../root";
// types
import { IIssue } from "types";
// services
import { IssueDraftService } from "services/issue";
import { sortArrayByDate, sortArrayByPriority } from "constants/kanban-helpers";
import {
  IIssueGroupWithSubGroupsStructure,
  IIssueGroupedStructure,
  IIssueType,
  IIssueUnGroupedStructure,
} from "store/issue";

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
  getDraftIssues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null;

  // actions
  fetchIssues: (workspaceSlug: string, projectId: string) => Promise<any>;
  createDraftIssue: (workspaceSlug: string, projectId: string, issueForm: Partial<IIssue>) => Promise<any>;
  updateIssueStructure: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
  deleteDraftIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<any>;
  updateDraftIssue: (workspaceSlug: string, projectId: string, issueForm: Partial<IIssue>) => Promise<any>;
  convertDraftIssueToIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<any>;

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
      getDraftIssues: computed,
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

    autorun(() => {
      const workspaceSlug = this.rootStore.workspace.workspaceSlug;
      const projectId = this.rootStore.project.projectId;

      if (
        workspaceSlug &&
        projectId &&
        this.rootStore.draftIssueFilters.userFilters &&
        this.rootStore.draftIssueFilters.userDisplayFilters &&
        this.rootStore.draftIssueFilters.appliedFilters
      )
        this.fetchIssues(workspaceSlug, projectId);
    });
  }

  get getIssueType() {
    const groupedLayouts = ["kanban", "list", "calendar"];
    const ungroupedLayouts = ["spreadsheet", "gantt_chart"];

    const issueLayout = this.rootStore?.draftIssueFilters?.userDisplayFilters?.layout || null;
    const issueSubGroup = this.rootStore?.draftIssueFilters?.userDisplayFilters?.sub_group_by || null;
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

  fetchIssues = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      this.rootStore.workspace.setWorkspaceSlug(workspaceSlug);
      this.rootStore.project.setProjectId(projectId);

      const params = this.rootStore?.draftIssueFilters?.appliedFilters;
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
          this.loader = false;
          this.error = null;
          this.draftIssues = _issues;
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
      const currentIssue = issues?.[group_id]?.find((i: IIssue) => i?.id === issue?.id);

      // if issue is already present in the list then update it
      if (currentIssue)
        issues = {
          ...issues,
          [group_id]: issues[group_id].map((i: IIssue) => (i?.id === issue?.id ? { ...i, ...issue } : i)),
        };
      // if issue is not present in the list then append it
      else issues = { ...issues, [group_id]: [...issues[group_id], issue] };
    }
    if (issueType === "groupWithSubGroups" && group_id && sub_group_id) {
      issues = issues as IIssueGroupWithSubGroupsStructure;
      const currentIssue = issues?.[sub_group_id]?.[group_id]?.find((i: IIssue) => i?.id === issue?.id);

      // if issue is already present in the list then update it
      if (currentIssue)
        issues = {
          ...issues,
          [sub_group_id]: {
            ...issues[sub_group_id],
            [group_id]: issues[sub_group_id][group_id].map((i: IIssue) =>
              i?.id === issue?.id ? { ...i, ...issue } : i
            ),
          },
        };
      // if issue is not present in the list then append it
      else
        issues = {
          ...issues,
          [sub_group_id]: {
            ...issues[sub_group_id],
            [group_id]: [...issues[sub_group_id][group_id], issue],
          },
        };
    }
    if (issueType === "ungrouped") {
      issues = (issues || []) as IIssueUnGroupedStructure;
      const currentIssue = issues?.find((i: IIssue) => i?.id === issue?.id);
      if (currentIssue) issues = issues?.map((i: IIssue) => (i?.id === issue?.id ? { ...i, ...issue } : i));
      else issues = [...issues, issue];
    }

    const orderBy = this.rootStore?.draftIssueFilters?.userDisplayFilters?.order_by || "";
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

    runInAction(() => {
      this.loader = true;
      this.error = null;
    });

    try {
      const response = await this.draftIssueService.updateDraftIssue(
        workspaceSlug,
        projectId,
        issueForm?.id!,
        issueForm
      );
      runInAction(() => {
        this.loader = false;
        this.error = null;
      });

      return response;
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
    await this.updateDraftIssue(workspaceSlug, projectId, { id: issueId, is_draft: false });
    await this.fetchIssues(workspaceSlug, projectId);
  };

  deleteDraftIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const originalIssues = { ...this.draftIssues };

    runInAction(() => {
      this.loader = true;
      this.error = null;
    });

    try {
      // deleting using api
      await this.draftIssueService.deleteDraftIssue(workspaceSlug, projectId, issueId);
      await this.fetchIssues(workspaceSlug, projectId);

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
