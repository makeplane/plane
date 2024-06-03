import concat from "lodash/concat";
import pull from "lodash/pull";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, observable, makeObservable, computed, runInAction } from "mobx";
// types
import { TIssue, TSubGroupedIssues, TGroupedIssues, TLoader, TUnGroupedIssues, ViewFlags } from "@plane/types";
// helpers
import { issueCountBasedOnFilters } from "@/helpers/issue.helper";
// services
import { CycleService } from "@/services/cycle.service";
import { IssueService } from "@/services/issue";
// types
import { IssueHelperStore } from "../helpers/issue-helper.store";
import { IIssueRootStore } from "../root.store";

export const ACTIVE_CYCLE_ISSUES = "ACTIVE_CYCLE_ISSUES";

export interface ICycleIssues {
  // observable
  loader: TLoader;
  issues: { [cycle_id: string]: string[] };
  viewFlags: ViewFlags;
  // computed
  issuesCount: number;
  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues | undefined;
  // actions
  getIssueIds: (groupId?: string, subGroupId?: string) => string[] | undefined;
  fetchIssues: (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader,
    cycleId: string
  ) => Promise<TIssue[] | undefined>;
  createIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    cycleId: string
  ) => Promise<TIssue | undefined>;
  updateIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    cycleId: string
  ) => Promise<void>;
  removeIssue: (workspaceSlug: string, projectId: string, issueId: string, cycleId: string) => Promise<void>;
  archiveIssue: (workspaceSlug: string, projectId: string, issueId: string, cycleId: string) => Promise<void>;
  quickAddIssue: (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    cycleId?: string | undefined
  ) => Promise<TIssue>;
  addIssueToCycle: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    issueIds: string[],
    fetchAddedIssues?: boolean
  ) => Promise<void>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  addCycleToIssue: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;
  removeCycleFromIssue: (workspaceSlug: string, projectId: string, issueId: string) => Promise<void>;
  transferIssuesFromCycle: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    payload: {
      new_cycle_id: string;
    }
  ) => Promise<TIssue>;
  fetchActiveCycleIssues: (workspaceSlug: string, projectId: string, cycleId: string) => Promise<TIssue[] | undefined>;
}

export class CycleIssues extends IssueHelperStore implements ICycleIssues {
  loader: TLoader = "init-loader";
  issues: { [cycle_id: string]: string[] } = {};
  viewFlags = {
    enableQuickAdd: true,
    enableIssueCreation: true,
    enableInlineEditing: true,
  };
  // root store
  rootIssueStore: IIssueRootStore;
  // service
  cycleService;
  issueService;

  constructor(_rootStore: IIssueRootStore) {
    super(_rootStore);
    makeObservable(this, {
      // observable
      loader: observable.ref,
      issues: observable,
      // computed
      issuesCount: computed,
      groupedIssueIds: computed,
      // action
      fetchIssues: action,
      createIssue: action,
      updateIssue: action,
      removeIssue: action,
      archiveIssue: action,
      quickAddIssue: action,
      addIssueToCycle: action,
      removeIssueFromCycle: action,
      addCycleToIssue: action,
      transferIssuesFromCycle: action,
      fetchActiveCycleIssues: action,
    });

    this.rootIssueStore = _rootStore;
    this.issueService = new IssueService();
    this.cycleService = new CycleService();
  }

  get issuesCount() {
    let issuesCount = 0;

    const displayFilters = this.rootStore?.cycleIssuesFilter?.issueFilters?.displayFilters;
    const groupedIssueIds = this.groupedIssueIds;
    if (!displayFilters || !groupedIssueIds) return issuesCount;

    const layout = displayFilters?.layout || undefined;
    const groupBy = displayFilters?.group_by || undefined;
    const subGroupBy = displayFilters?.sub_group_by || undefined;

    if (!layout) return issuesCount;
    issuesCount = issueCountBasedOnFilters(groupedIssueIds, layout, groupBy, subGroupBy);
    return issuesCount;
  }

  get groupedIssueIds() {
    const cycleId = this.rootIssueStore?.cycleId;
    if (!cycleId) return undefined;

    const displayFilters = this.rootIssueStore?.cycleIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;
    const orderBy = displayFilters?.order_by;
    const layout = displayFilters?.layout;

    const cycleIssueIds = this.issues[cycleId];
    if (!cycleIssueIds) return;

    const currentIssues = this.rootIssueStore.issues.getIssuesByIds(cycleIssueIds, "un-archived");
    if (!currentIssues) return [];

    let issues: TGroupedIssues | TSubGroupedIssues | TUnGroupedIssues = [];

    if (layout === "list" && orderBy) {
      if (groupBy) issues = this.groupedIssues(groupBy, orderBy, currentIssues);
      else issues = this.unGroupedIssues(orderBy, currentIssues);
    } else if (layout === "kanban" && groupBy && orderBy) {
      if (subGroupBy) issues = this.subGroupedIssues(subGroupBy, groupBy, orderBy, currentIssues);
      else issues = this.groupedIssues(groupBy, orderBy, currentIssues);
    } else if (layout === "calendar") issues = this.groupedIssues("target_date", "target_date", currentIssues, true);
    else if (layout === "spreadsheet") issues = this.unGroupedIssues(orderBy ?? "-created_at", currentIssues);
    else if (layout === "gantt_chart") issues = this.unGroupedIssues(orderBy ?? "sort_order", currentIssues);

    return issues;
  }

  getIssueIds = (groupId?: string, subGroupId?: string) => {
    const groupedIssueIds = this.groupedIssueIds;

    const displayFilters = this.rootIssueStore?.cycleIssuesFilter?.issueFilters?.displayFilters;
    if (!displayFilters || !groupedIssueIds) return undefined;

    const subGroupBy = displayFilters?.sub_group_by;
    const groupBy = displayFilters?.group_by;

    if (!groupBy && !subGroupBy) {
      return groupedIssueIds as string[];
    }

    if (groupBy && subGroupBy && groupId && subGroupId) {
      return (groupedIssueIds as TSubGroupedIssues)?.[subGroupId]?.[groupId] as string[];
    }

    if (groupBy && groupId) {
      return (groupedIssueIds as TGroupedIssues)?.[groupId] as string[];
    }

    return undefined;
  };

  fetchIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadType: TLoader = "init-loader",
    cycleId: string
  ) => {
    try {
      this.loader = loadType;

      const params = this.rootIssueStore?.cycleIssuesFilter?.appliedFilters;
      const response = await this.cycleService.getCycleIssuesWithParams(workspaceSlug, projectId, cycleId, params);
      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);

      runInAction(() => {
        set(
          this.issues,
          [cycleId],
          response.map((issue) => issue.id)
        );
        this.loader = undefined;
      });

      this.rootIssueStore.issues.addIssue(response);

      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };

  createIssue = async (workspaceSlug: string, projectId: string, data: Partial<TIssue>, cycleId: string) => {
    try {
      const response = await this.rootIssueStore.projectIssues.createIssue(workspaceSlug, projectId, data);
      await this.addIssueToCycle(workspaceSlug, projectId, cycleId, [response.id], false);
      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    cycleId: string
  ) => {
    try {
      await this.rootIssueStore.projectIssues.updateIssue(workspaceSlug, projectId, issueId, data);
      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);
    } catch (error) {
      this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
      throw error;
    }
  };

  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string, cycleId: string) => {
    try {
      await this.rootIssueStore.projectIssues.removeIssue(workspaceSlug, projectId, issueId);
      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);

      const issueIndex = this.issues[cycleId].findIndex((_issueId) => _issueId === issueId);
      if (issueIndex >= 0)
        runInAction(() => {
          this.issues[cycleId].splice(issueIndex, 1);
        });
    } catch (error) {
      throw error;
    }
  };

  archiveIssue = async (workspaceSlug: string, projectId: string, issueId: string, cycleId: string) => {
    try {
      await this.rootIssueStore.projectIssues.archiveIssue(workspaceSlug, projectId, issueId);
      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);

      runInAction(() => {
        pull(this.issues[cycleId], issueId);
      });
    } catch (error) {
      throw error;
    }
  };

  quickAddIssue = async (
    workspaceSlug: string,
    projectId: string,
    data: TIssue,
    cycleId: string | undefined = undefined
  ) => {
    try {
      if (!cycleId) throw new Error("Cycle Id is required");

      runInAction(() => {
        this.issues[cycleId].push(data.id);
        this.rootIssueStore.issues.addIssue([data]);
      });

      const response = await this.createIssue(workspaceSlug, projectId, data, cycleId);

      const quickAddIssueIndex = this.issues[cycleId].findIndex((_issueId) => _issueId === data.id);
      if (quickAddIssueIndex >= 0) {
        runInAction(() => {
          this.issues[cycleId].splice(quickAddIssueIndex, 1);
          this.rootIssueStore.issues.removeIssue(data.id);
        });
      }

      const currentModuleIds =
        data.module_ids && data.module_ids.length > 0 ? data.module_ids.filter((moduleId) => moduleId != "None") : [];

      if (currentModuleIds.length > 0) {
        await this.rootStore.moduleIssues.changeModulesInIssue(
          workspaceSlug,
          projectId,
          response.id,
          currentModuleIds,
          []
        );
      }

      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);

      return response;
    } catch (error) {
      if (cycleId) this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);
      throw error;
    }
  };

  addIssueToCycle = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    issueIds: string[],
    fetchAddedIssues = true
  ) => {
    try {
      await this.issueService.addIssueToCycle(workspaceSlug, projectId, cycleId, {
        issues: issueIds,
      });

      if (fetchAddedIssues) await this.rootIssueStore.issues.getIssues(workspaceSlug, projectId, issueIds);

      // add the new issue ids to the cycle issues map
      runInAction(() => {
        update(this.issues, cycleId, (cycleIssueIds = []) => uniq(concat(cycleIssueIds, issueIds)));
      });
      issueIds.forEach((issueId) => {
        const issueCycleId = this.rootIssueStore.issues.getIssueById(issueId)?.cycle_id;
        // remove issue from previous cycle if it exists
        if (issueCycleId && issueCycleId !== cycleId) {
          runInAction(() => {
            pull(this.issues[issueCycleId], issueId);
          });
        }
        // update the root issue map with the new cycle id
        this.rootStore.issues.updateIssue(issueId, { cycle_id: cycleId });
      });

      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Remove a cycle from issue
   * @param workspaceSlug
   * @param projectId
   * @param issueId
   * @returns
   */
  removeCycleFromIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const issueCycleId = this.rootIssueStore.issues.getIssueById(issueId)?.cycle_id;
    if (!issueCycleId) return;
    try {
      // perform optimistic update, update store
      runInAction(() => {
        pull(this.issues[issueCycleId], issueId);
      });
      this.rootStore.issues.updateIssue(issueId, { cycle_id: null });

      // make API call
      await this.issueService.removeIssueFromCycle(workspaceSlug, projectId, issueCycleId, issueId);
      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, issueCycleId);
    } catch (error) {
      // revert back changes if fails
      runInAction(() => {
        update(this.issues, issueCycleId, (cycleIssueIds = []) => uniq(concat(cycleIssueIds, [issueId])));
      });
      this.rootStore.issues.updateIssue(issueId, { cycle_id: issueCycleId });
      throw error;
    }
  };

  removeIssueFromCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
    try {
      runInAction(() => {
        pull(this.issues[cycleId], issueId);
      });

      this.rootStore.issues.updateIssue(issueId, { cycle_id: null });

      await this.issueService.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);
    } catch (error) {
      throw error;
    }
  };

  addCycleToIssue = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => {
    const issueCycleId = this.rootIssueStore.issues.getIssueById(issueId)?.cycle_id;
    try {
      // add the new issue ids to the cycle issues map
      runInAction(() => {
        update(this.issues, cycleId, (cycleIssueIds = []) => uniq(concat(cycleIssueIds, [issueId])));
      });
      // remove issue from previous cycle if it exists
      if (issueCycleId && issueCycleId !== cycleId) {
        runInAction(() => {
          pull(this.issues[issueCycleId], issueId);
        });
      }
      // update the root issue map with the new cycle id
      this.rootStore.issues.updateIssue(issueId, { cycle_id: cycleId });

      await this.issueService.addIssueToCycle(workspaceSlug, projectId, cycleId, {
        issues: [issueId],
      });

      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);
    } catch (error) {
      // remove the new issue ids from the cycle issues map
      runInAction(() => {
        pull(this.issues[cycleId], issueId);
      });
      // add issue back to the previous cycle if it exists
      if (issueCycleId)
        runInAction(() => {
          update(this.issues, issueCycleId, (cycleIssueIds = []) => uniq(concat(cycleIssueIds, [issueId])));
        });
      // update the root issue map with the original cycle id
      this.rootStore.issues.updateIssue(issueId, { cycle_id: issueCycleId ?? null });
      throw error;
    }
  };

  transferIssuesFromCycle = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    payload: {
      new_cycle_id: string;
    }
  ) => {
    try {
      const response = await this.cycleService.transferIssues(
        workspaceSlug as string,
        projectId as string,
        cycleId as string,
        payload
      );
      await this.fetchIssues(workspaceSlug, projectId, "mutation", cycleId);

      return response;
    } catch (error) {
      throw error;
    }
  };

  fetchActiveCycleIssues = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    try {
      const params = { priority: `urgent,high` };
      const response = await this.cycleService.getCycleIssuesWithParams(workspaceSlug, projectId, cycleId, params);

      runInAction(() => {
        set(this.issues, [ACTIVE_CYCLE_ISSUES], Object.keys(response));
        this.loader = undefined;
      });

      this.rootIssueStore.issues.addIssue(Object.values(response));

      return response;
    } catch (error) {
      this.loader = undefined;
      throw error;
    }
  };
}
