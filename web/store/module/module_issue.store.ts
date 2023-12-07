import { observable, action, computed, makeObservable, runInAction, autorun } from "mobx";
// store
import { RootStore } from "../root";
// services
import { ModuleService } from "services/module.service";
// helpers
import { sortArrayByDate, sortArrayByPriority } from "constants/kanban-helpers";
// types
import { IIssue } from "types";
import { IBlockUpdateData } from "components/gantt-chart";
import {
  IIssueGroupWithSubGroupsStructure,
  IIssueGroupedStructure,
  IIssueType,
  IIssueUnGroupedStructure,
} from "store/issue";

export interface IModuleIssueStore {
  loader: boolean;
  error: any | null;
  // issues
  issues: {
    [module_id: string]: {
      grouped: IIssueGroupedStructure;
      groupWithSubGroups: IIssueGroupWithSubGroupsStructure;
      ungrouped: IIssueUnGroupedStructure;
    };
  };
  // computed
  getIssueType: IIssueType | null;
  getIssues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null;
  getIssuesCount: number;
  // action
  fetchIssues: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<any>;
  updateIssueStructure: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
  updateGanttIssueStructure: (
    workspaceSlug: string,
    moduleId: string,
    issue: IIssue,
    payload: IBlockUpdateData
  ) => void;
  deleteIssue: (group_id: string | null, sub_group_id: string | null, issue: IIssue) => void;
  addIssueToModule: (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => Promise<void>;
  removeIssueFromModule: (workspaceSlug: string, projectId: string, moduleId: string, bridgeId: string) => Promise<any>;
}

export class ModuleIssueStore implements IModuleIssueStore {
  loader: boolean = false;
  error: any | null = null;
  issues: {
    [module_id: string]: {
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

  // services
  rootStore;
  moduleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      issues: observable.ref,
      // computed
      getIssueType: computed,
      getIssues: computed,
      getIssuesCount: computed,
      // actions
      fetchIssues: action,
      updateIssueStructure: action,
      updateGanttIssueStructure: action,
      deleteIssue: action,
      addIssueToModule: action,
      removeIssueFromModule: action,
    });

    this.rootStore = _rootStore;
    this.moduleService = new ModuleService();

    autorun(() => {
      const workspaceSlug = this.rootStore.workspace.workspaceSlug;
      const projectId = this.rootStore.project.projectId;
      const moduleId = this.rootStore.module.moduleId;

      if (
        workspaceSlug &&
        projectId &&
        moduleId &&
        this.rootStore.moduleFilter.moduleFilters &&
        this.rootStore.issueFilter.userDisplayFilters
      )
        this.fetchIssues(workspaceSlug, projectId, moduleId);
    });
  }

  get getIssueType() {
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

  get getIssues() {
    const moduleId: string | null = this.rootStore?.module?.moduleId;
    const issueType = this.getIssueType;
    if (!moduleId || !issueType) return null;

    return this.issues?.[moduleId]?.[issueType] || null;
  }

  get getIssuesCount() {
    const issueType = this.getIssueType;

    let issuesCount = 0;

    if (issueType === "grouped") {
      const issues = this.getIssues as IIssueGroupedStructure;

      if (!issues) return 0;

      Object.keys(issues).map((group_id) => {
        issuesCount += issues[group_id].length;
      });
    }

    if (issueType === "groupWithSubGroups") {
      const issues = this.getIssues as IIssueGroupWithSubGroupsStructure;

      if (!issues) return 0;

      Object.keys(issues).map((sub_group_id) => {
        Object.keys(issues[sub_group_id]).map((group_id) => {
          issuesCount += issues[sub_group_id][group_id].length;
        });
      });
    }

    if (issueType === "ungrouped") {
      const issues = this.getIssues as IIssueUnGroupedStructure;

      if (!issues) return 0;

      issuesCount = issues.length;
    }

    return issuesCount;
  }

  updateIssueStructure = async (group_id: string | null, sub_group_id: string | null, issue: IIssue) => {
    const moduleId: string | null = this.rootStore?.module?.moduleId;
    const issueType = this.getIssueType;
    if (!moduleId || !issueType) return null;

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
      this.issues = { ...this.issues, [moduleId]: { ...this.issues[moduleId], [issueType]: issues } };
    });
  };

  updateGanttIssueStructure = async (
    workspaceSlug: string,
    moduleId: string,
    issue: IIssue,
    payload: IBlockUpdateData
  ) => {
    if (!issue || !workspaceSlug) return;

    const issues = this.getIssues as IIssueUnGroupedStructure;

    const newIssues = issues.map((i) => ({
      ...i,
      ...(i.id === issue.id
        ? {
            sort_order: payload.sort_order?.newSortOrder ?? i.sort_order,
            start_date: payload.start_date,
            target_date: payload.target_date,
          }
        : {}),
    }));

    if (payload.sort_order) {
      const removedElement = newIssues.splice(payload.sort_order.sourceIndex, 1)[0];
      removedElement.sort_order = payload.sort_order.newSortOrder;
      newIssues.splice(payload.sort_order.destinationIndex, 0, removedElement);
    }

    runInAction(() => {
      this.issues = {
        ...this.issues,
        [moduleId]: {
          ...this.issues[moduleId],
          ungrouped: newIssues,
        },
      };
    });

    const newPayload: any = { ...payload };

    if (newPayload.sort_order && payload.sort_order) newPayload.sort_order = payload.sort_order.newSortOrder;

    this.rootStore.projectIssues.updateIssue(workspaceSlug, issue.project, issue.id, newPayload);
  };

  deleteIssue = async (group_id: string | null, sub_group_id: string | null, issue: IIssue) => {
    const moduleId: string | null = this.rootStore.module.moduleId;
    const issueType = this.getIssueType;
    if (!moduleId || !issueType) return null;

    let issues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null =
      this.getIssues;
    if (!issues) return null;

    if (issueType === "grouped" && group_id) {
      issues = issues as IIssueGroupedStructure;
      issues = {
        ...issues,
        [group_id]: issues[group_id].filter((i) => i?.id !== issue?.id),
      };
    }
    if (issueType === "groupWithSubGroups" && group_id && sub_group_id) {
      issues = issues as IIssueGroupWithSubGroupsStructure;
      issues = {
        ...issues,
        [sub_group_id]: {
          ...issues[sub_group_id],
          [group_id]: issues[sub_group_id][group_id].filter((i) => i?.id !== issue?.id),
        },
      };
    }
    if (issueType === "ungrouped") {
      issues = issues as IIssueUnGroupedStructure;
      issues = issues.filter((i) => i?.id !== issue?.id);
    }

    runInAction(() => {
      this.issues = { ...this.issues, [moduleId]: { ...this.issues[moduleId], [issueType]: issues } };
    });
  };

  fetchIssues = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const params = this.rootStore?.moduleFilter?.appliedFilters;
      const issueResponse = await this.moduleService.getModuleIssuesWithParams(
        workspaceSlug,
        projectId,
        moduleId,
        params
      );

      const issueType = this.getIssueType;
      if (issueType != null) {
        const _issues = {
          ...this.issues,
          [moduleId]: {
            ...this.issues[moduleId],
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
      return error;
    }
  };

  addIssueToModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) => {
    try {
      await this.moduleService.addIssuesToModule(workspaceSlug, projectId, moduleId, {
        issues: issueIds,
      });

      this.fetchIssues(workspaceSlug, projectId, moduleId);
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  removeIssueFromModule = async (workspaceSlug: string, projectId: string, moduleId: string, bridgeId: string) => {
    try {
      await this.moduleService.removeIssueFromModule(workspaceSlug, projectId, moduleId, bridgeId);
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };
}
