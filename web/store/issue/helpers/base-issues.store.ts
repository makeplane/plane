import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import update from "lodash/update";
import uniq from "lodash/uniq";
import concat from "lodash/concat";
import pull from "lodash/pull";
import orderBy from "lodash/orderBy";
import clone from "lodash/clone";
import indexOf from "lodash/indexOf";
import isEmpty from "lodash/isEmpty";
import set from "lodash/set";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import isNil from "lodash/isNil";
// types
import {
  TIssue,
  TIssueGroupByOptions,
  TIssueOrderByOptions,
  TGroupedIssues,
  TSubGroupedIssues,
  TLoader,
  IssuePaginationOptions,
  TIssuesResponse,
  TIssues,
  TIssuePaginationData,
  TGroupedIssueCount,
  TPaginationData,
} from "@plane/types";
import { IIssueRootStore } from "../root.store";
import { IBaseIssueFilterStore } from "./issue-filter-helper.store";
// constants
import { ISSUE_PRIORITIES } from "@/constants/issue";
import { STATE_GROUPS } from "@/constants/state";
// helpers
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// services
import { IssueArchiveService, IssueDraftService, IssueService } from "@/services/issue";
import { ModuleService } from "@/services/module.service";
import { CycleService } from "@/services/cycle.service";

export type TIssueDisplayFilterOptions = Exclude<TIssueGroupByOptions, null> | "target_date";

export enum EIssueGroupedAction {
  ADD = "ADD",
  DELETE = "DELETE",
  REORDER = "REORDER",
}

export const ALL_ISSUES = "All Issues";

export interface IBaseIssuesStore {
  // observable
  loader: Record<string, TLoader>;

  groupedIssueIds: TGroupedIssues | TSubGroupedIssues | undefined;
  groupedIssueCount: TGroupedIssueCount;
  issuePaginationData: TIssuePaginationData;

  //actions
  removeIssue(workspaceSlug: string, projectId: string, issueId: string): Promise<void>;
  // helper methods
  issueDisplayFiltersDefaultData(groupBy: string | null): string[];
  issuesSortWithOrderBy(issueIds: string[], key: Partial<TIssueOrderByOptions>): string[];
  getGroupArray(value: boolean | number | string | string[] | null, isDate?: boolean): string[];
  getPaginationData(groupId: string | undefined, subGroupId: string | undefined): TPaginationData | undefined;
  getIssueLoader(groupId?: string, subGroupId?: string): TLoader;
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;

  addIssueToCycle: (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    issueIds: string[],
    fetchAddedIssues?: boolean
  ) => Promise<void>;
  removeIssueFromCycle: (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) => Promise<void>;

  addIssuesToModule: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[],
    fetchAddedIssues?: boolean
  ) => Promise<void>;
  removeIssuesFromModule: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[]
  ) => Promise<void>;
  addModulesToIssue: (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) => Promise<void>;
  removeModulesFromIssue: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    moduleIds: string[]
  ) => Promise<void>;
}

const ISSUE_FILTER_DEFAULT_DATA: Record<TIssueDisplayFilterOptions, keyof TIssue> = {
  project: "project_id",
  state: "state_id",
  "state_detail.group": "state_id" as keyof TIssue, // state_detail.group is only being used for state_group display,
  priority: "priority",
  labels: "label_ids",
  created_by: "created_by",
  assignees: "assignee_ids",
  target_date: "target_date",
  cycle: "cycle_id",
  module: "module_ids",
};

const ISSUE_ORDERBY_KEY: Record<TIssueOrderByOptions, keyof TIssue> = {
  created_at: "created_at",
  "-created_at": "created_at",
  updated_at: "updated_at",
  "-updated_at": "updated_at",
  priority: "priority",
  "-priority": "priority",
  sort_order: "sort_order",
  state__name: "state_id",
  "-state__name": "state_id",
  assignees__first_name: "assignee_ids",
  "-assignees__first_name": "assignee_ids",
  labels__name: "label_ids",
  "-labels__name": "label_ids",
  issue_module__module__name: "module_ids",
  "-issue_module__module__name": "module_ids",
  issue_cycle__cycle__name: "cycle_id",
  "-issue_cycle__cycle__name": "cycle_id",
  target_date: "target_date",
  "-target_date": "target_date",
  estimate_point: "estimate_point",
  "-estimate_point": "estimate_point",
  start_date: "start_date",
  "-start_date": "start_date",
  link_count: "link_count",
  "-link_count": "link_count",
  attachment_count: "attachment_count",
  "-attachment_count": "attachment_count",
  sub_issues_count: "sub_issues_count",
  "-sub_issues_count": "sub_issues_count",
};

export class BaseIssuesStore implements IBaseIssuesStore {
  loader: Record<string, TLoader> = {};
  groupedIssueIds: TIssues | undefined = undefined;
  issuePaginationData: TIssuePaginationData = {};

  groupedIssueCount: TGroupedIssueCount = {};

  paginationOptions: IssuePaginationOptions | undefined = undefined;

  isArchived: boolean;

  // services
  issueService;
  issueArchiveService;
  issueDraftService;
  moduleService;
  cycleService;
  // root store
  rootIssueStore;
  issueFilterStore;

  constructor(_rootStore: IIssueRootStore, issueFilterStore: IBaseIssueFilterStore, isArchived = false) {
    makeObservable(this, {
      // observable
      loader: observable,
      groupedIssueIds: observable,
      issuePaginationData: observable,
      groupedIssueCount: observable,

      paginationOptions: observable,
      // computed
      moduleId: computed,
      cycleId: computed,
      orderBy: computed,
      groupBy: computed,
      subGroupBy: computed,
      orderByKey: computed,
      issueGroupKey: computed,
      issueSubGroupKey: computed,
      // action
      storePreviousPaginationValues: action.bound,

      onfetchIssues: action.bound,
      onfetchNexIssues: action.bound,
      clear: action.bound,
      setLoader: action.bound,
      addIssue: action.bound,
      removeIssueFromList: action.bound,

      createIssue: action,
      updateIssue: action,
      createDraftIssue: action,
      updateDraftIssue: action,
      issueQuickAdd: action.bound,
      removeIssue: action.bound,
      archiveIssue: action.bound,
      removeBulkIssues: action.bound,

      addIssueToCycle: action.bound,
      removeIssueFromCycle: action.bound,

      addIssuesToModule: action.bound,
      removeIssuesFromModule: action.bound,
      addModulesToIssue: action.bound,
      removeModulesFromIssue: action.bound,
    });
    this.rootIssueStore = _rootStore;
    this.issueFilterStore = issueFilterStore;

    this.isArchived = isArchived;

    this.issueService = new IssueService();
    this.issueArchiveService = new IssueArchiveService();
    this.issueDraftService = new IssueDraftService();
    this.moduleService = new ModuleService();
    this.cycleService = new CycleService();
  }

  get moduleId() {
    return this.rootIssueStore.moduleId;
  }

  get cycleId() {
    return this.rootIssueStore.cycleId;
  }

  get orderBy() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters) return;

    return displayFilters?.order_by;
  }

  get groupBy() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters) return;

    const layout = displayFilters?.layout;

    return layout === "calendar"
      ? "target_date"
      : ["list", "kanban"]?.includes(layout)
      ? displayFilters?.group_by
      : undefined;
  }

  get subGroupBy() {
    const displayFilters = this.issueFilterStore?.issueFilters?.displayFilters;
    if (!displayFilters || displayFilters.group_by === displayFilters.sub_group_by) return;

    return displayFilters?.layout === "kanban" ? displayFilters?.sub_group_by : undefined;
  }

  get orderByKey() {
    const orderBy = this.orderBy;
    if (!orderBy) return;

    return ISSUE_ORDERBY_KEY[orderBy];
  }

  get issueGroupKey() {
    const groupBy = this.groupBy;

    if (!groupBy) return;

    return ISSUE_FILTER_DEFAULT_DATA[groupBy];
  }

  get issueSubGroupKey() {
    const subGroupBy = this.subGroupBy;

    if (!subGroupBy) return;

    return ISSUE_FILTER_DEFAULT_DATA[subGroupBy];
  }

  onfetchIssues(issuesResponse: TIssuesResponse, options: IssuePaginationOptions) {
    const { issueList, groupedIssues, groupedIssueCount } = this.processIssueResponse(issuesResponse);

    this.rootIssueStore.issues.addIssue(issueList);

    runInAction(() => {
      this.updateGroupedIssueIds(groupedIssues, groupedIssueCount);
      this.loader[this.getGroupKey()] = undefined;
    });

    this.storePreviousPaginationValues(issuesResponse, options);
  }

  onfetchNexIssues(issuesResponse: TIssuesResponse, groupId?: string, subGroupId?: string) {
    const { issueList, groupedIssues, groupedIssueCount } = this.processIssueResponse(issuesResponse);

    this.rootIssueStore.issues.addIssue(issueList);

    runInAction(() => {
      this.updateGroupedIssueIds(groupedIssues, groupedIssueCount, groupId, subGroupId);
      this.loader[this.getGroupKey(groupId, subGroupId)] = undefined;
    });

    this.storePreviousPaginationValues(issuesResponse, undefined, groupId, subGroupId);
  }

  updateGroupedIssueIds(
    groupedIssues: TIssues,
    groupedIssueCount: TGroupedIssueCount,
    groupId?: string,
    subGroupId?: string
  ) {
    if (groupId && groupedIssues[ALL_ISSUES] && Array.isArray(groupedIssues[ALL_ISSUES])) {
      const issueGroup = groupedIssues[ALL_ISSUES];
      const issueGroupCount = groupedIssueCount[ALL_ISSUES];
      const issuesPath = [groupId];

      if (subGroupId) issuesPath.push(subGroupId);

      set(this.groupedIssueCount, [this.getGroupKey(groupId, subGroupId)], issueGroupCount);

      this.updateIssueGroup(issueGroup, issuesPath);
      return;
    }

    set(this.groupedIssueCount, [ALL_ISSUES], groupedIssueCount[ALL_ISSUES]);

    for (const groupId in groupedIssues) {
      const issueGroup = groupedIssues[groupId];
      const issueGroupCount = groupedIssueCount[groupId];

      set(this.groupedIssueCount, [groupId], issueGroupCount);

      const shouldContinue = this.updateIssueGroup(issueGroup, [groupId]);
      if (shouldContinue) continue;

      for (const subGroupId in issueGroup) {
        const issueSubGroup = (issueGroup as TGroupedIssues)[subGroupId];
        const issueSubGroupCount = groupedIssueCount[this.getGroupKey(groupId, subGroupId)];

        set(this.groupedIssueCount, [this.getGroupKey(groupId, subGroupId)], issueSubGroupCount);
        this.updateIssueGroup(issueSubGroup, [groupId, subGroupId]);
      }
    }
  }

  updateIssueGroup(groupedIssueIds: TGroupedIssues | string[], issuePath: string[]): boolean {
    if (!groupedIssueIds) return true;

    if (groupedIssueIds && Array.isArray(groupedIssueIds)) {
      update(this, ["groupedIssueIds", ...issuePath], (issueIds: string[] = []) => {
        return this.issuesSortWithOrderBy(uniq(concat(issueIds, groupedIssueIds as string[])), this.orderBy);
      });

      return true;
    }

    return false;
  }

  async createIssue(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    id?: string,
    shouldUpdateList = true
  ) {
    try {
      const response = await this.issueService.createIssue(workspaceSlug, projectId, data);

      this.addIssue(response, shouldUpdateList);

      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateIssue(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssue>,
    shouldSync = true
  ) {
    const issueBeforeUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));
    try {
      this.rootIssueStore.issues.updateIssue(issueId, data);
      this.updateIssueList({ ...issueBeforeUpdate, ...data } as TIssue, issueBeforeUpdate);

      if (!shouldSync) return;

      await this.issueService.patchIssue(workspaceSlug, projectId, issueId, data);
    } catch (error) {
      this.rootIssueStore.issues.updateIssue(issueId, issueBeforeUpdate ?? {});
      this.updateIssueList(issueBeforeUpdate, { ...issueBeforeUpdate, ...data } as TIssue);
      throw error;
    }
  }

  async createDraftIssue(workspaceSlug: string, projectId: string, data: Partial<TIssue>) {
    try {
      const response = await this.issueDraftService.createDraftIssue(workspaceSlug, projectId, data);

      this.addIssue(response);

      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateDraftIssue(workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) {
    const issueBeforeUpdate = clone(this.rootIssueStore.issues.getIssueById(issueId));
    try {
      this.rootIssueStore.issues.updateIssue(issueId, data);
      this.updateIssueList({ ...issueBeforeUpdate, ...data } as TIssue, issueBeforeUpdate);

      await this.issueDraftService.updateDraftIssue(workspaceSlug, projectId, issueId, data);

      if (!isNil(data.is_draft) && !data.is_draft) this.removeIssueFromList(issueId);
    } catch (error) {
      this.rootIssueStore.issues.updateIssue(issueId, issueBeforeUpdate ?? {});
      this.updateIssueList(issueBeforeUpdate, { ...issueBeforeUpdate, ...data } as TIssue);
      throw error;
    }
  }

  async removeIssue(workspaceSlug: string, projectId: string, issueId: string) {
    try {
      await this.issueService.deleteIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.removeIssueFromList(issueId);
      });

      this.rootIssueStore.issues.removeIssue(issueId);
    } catch (error) {
      throw error;
    }
  }

  async archiveIssue(workspaceSlug: string, projectId: string, issueId: string) {
    try {
      const response = await this.issueArchiveService.archiveIssue(workspaceSlug, projectId, issueId);

      runInAction(() => {
        this.rootIssueStore.issues.updateIssue(issueId, {
          archived_at: response.archived_at,
        });
        this.removeIssueFromList(issueId);
      });
    } catch (error) {
      throw error;
    }
  }

  async issueQuickAdd(workspaceSlug: string, projectId: string, data: TIssue) {
    try {
      this.addIssue(data);

      const response = await this.createIssue(workspaceSlug, projectId, data);
      return response;
    } catch (error) {
      throw error;
    } finally {
      runInAction(() => {
        this.removeIssueFromList(data.id);
        this.rootIssueStore.issues.removeIssue(data.id);
      });
    }
  }

  async removeBulkIssues(workspaceSlug: string, projectId: string, issueIds: string[]) {
    try {
      const response = await this.issueService.bulkDeleteIssues(workspaceSlug, projectId, { issue_ids: issueIds });

      runInAction(() => {
        issueIds.forEach((issueId) => {
          this.removeIssueFromList(issueId);
          this.rootIssueStore.issues.removeIssue(issueId);
        });
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async addIssueToCycle(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    issueIds: string[],
    fetchAddedIssues = true
  ) {
    try {
      await this.issueService.addIssueToCycle(workspaceSlug, projectId, cycleId, {
        issues: issueIds,
      });

      if (fetchAddedIssues) await this.rootIssueStore.issues.getIssues(workspaceSlug, projectId, issueIds);

      runInAction(() => {
        if (this.cycleId === cycleId) issueIds.forEach((issueId) => this.addIssueToList(issueId));
        else if (this.cycleId) issueIds.forEach((issueId) => this.removeIssueFromList(issueId));
      });

      issueIds.forEach((issueId) => {
        this.updateIssue(workspaceSlug, projectId, issueId, { cycle_id: cycleId }, false);
      });

      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);
    } catch (error) {
      throw error;
    }
  }

  async removeIssueFromCycle(workspaceSlug: string, projectId: string, cycleId: string, issueId: string) {
    try {
      await this.issueService.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
      runInAction(() => {
        this.cycleId === cycleId && this.removeIssueFromList(issueId);
      });

      this.updateIssue(workspaceSlug, projectId, issueId, { cycle_id: null }, false);
      this.rootIssueStore.rootStore.cycle.fetchCycleDetails(workspaceSlug, projectId, cycleId);
    } catch (error) {
      throw error;
    }
  }

  async addIssuesToModule(
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    issueIds: string[],
    fetchAddedIssues = true
  ) {
    try {
      await this.moduleService.addIssuesToModule(workspaceSlug, projectId, moduleId, {
        issues: issueIds,
      });

      if (fetchAddedIssues) await this.rootIssueStore.issues.getIssues(workspaceSlug, projectId, issueIds);

      runInAction(() => {
        this.moduleId === moduleId && issueIds.forEach((issueId) => this.addIssueToList(issueId));
      });

      issueIds.forEach((issueId) => {
        const issueModuleIds = get(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"]) ?? [];
        const updatedIssueModuleIds = uniq(concat(issueModuleIds, [moduleId]));
        this.updateIssue(workspaceSlug, projectId, issueId, { module_ids: updatedIssueModuleIds }, false);
      });

      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);
    } catch (error) {
      throw error;
    }
  }

  async removeIssuesFromModule(workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) {
    try {
      const response = await this.moduleService.removeIssuesFromModuleBulk(
        workspaceSlug,
        projectId,
        moduleId,
        issueIds
      );

      runInAction(() => {
        this.moduleId === moduleId && issueIds.forEach((issueId) => this.removeIssueFromList(issueId));
      });

      runInAction(() => {
        issueIds.forEach((issueId) => {
          const issueModuleIds = get(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"]) ?? [];
          const updatedIssueModuleIds = pull(issueModuleIds, moduleId);
          this.updateIssue(workspaceSlug, projectId, issueId, { module_ids: updatedIssueModuleIds }, false);
        });
      });

      this.rootIssueStore.rootStore.module.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      return response;
    } catch (error) {
      throw error;
    }
  }

  async addModulesToIssue(workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) {
    try {
      const issueToModule = await this.moduleService.addModulesToIssue(workspaceSlug, projectId, issueId, {
        modules: moduleIds,
      });

      runInAction(() => {
        moduleIds.forEach((moduleId) => {
          this.moduleId === moduleId && this.addIssueToList(issueId);
        });

        const issueModuleIds = get(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"]) ?? [];
        const updatedIssueModuleIds = uniq(concat(issueModuleIds, moduleIds));
        this.updateIssue(workspaceSlug, projectId, issueId, { module_ids: updatedIssueModuleIds }, false);
      });

      return issueToModule;
    } catch (error) {
      throw error;
    }
  }

  async removeModulesFromIssue(workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) {
    try {
      runInAction(() => {
        let issueModuleIds = get(this.rootIssueStore.issues.issuesMap, [issueId, "module_ids"]) ?? [];

        moduleIds.forEach((moduleId) => {
          this.moduleId === moduleId && this.removeIssueFromList(issueId);
          issueModuleIds = pull(issueModuleIds, moduleId);
        });

        this.updateIssue(workspaceSlug, projectId, issueId, { module_ids: issueModuleIds }, false);
      });

      const response = await this.moduleService.removeModulesFromIssueBulk(
        workspaceSlug,
        projectId,
        issueId,
        moduleIds
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  addIssue(issue: TIssue, shouldUpdateList = true) {
    runInAction(() => {
      this.rootIssueStore.issues.addIssue([issue]);
    });

    if (shouldUpdateList) this.updateIssueList(issue, undefined, EIssueGroupedAction.ADD);
  }

  clear() {
    runInAction(() => {
      this.groupedIssueIds = undefined;
      this.issuePaginationData = {};
      this.groupedIssueCount = {};
      this.paginationOptions = undefined;
    });
  }

  addIssueToList(issueId: string) {
    const issue = this.rootIssueStore.issues.getIssueById(issueId);
    this.updateIssueList(issue, undefined, EIssueGroupedAction.ADD);
  }

  removeIssueFromList(issueId: string) {
    const issue = this.rootIssueStore.issues.getIssueById(issueId);
    this.updateIssueList(issue, undefined, EIssueGroupedAction.DELETE);
  }

  updateIssueList(
    issue?: TIssue,
    issueBeforeUpdate?: TIssue,
    action?: EIssueGroupedAction.ADD | EIssueGroupedAction.DELETE
  ) {
    if (!issue) return;
    const issueUpdates = this.getUpdateDetails(issue, issueBeforeUpdate, action);
    runInAction(() => {
      for (const issueUpdate of issueUpdates) {
        //if update is add, add it at a particular path
        if (issueUpdate.action === EIssueGroupedAction.ADD) {
          update(this, ["groupedIssueIds", ...issueUpdate.path], (issueIds: string[] = []) => {
            return this.issuesSortWithOrderBy(uniq(concat(issueIds, issue.id)), this.orderBy);
          });
          this.updateIssueCount(issueUpdate.path, 1);
        }

        //if update is delete, remove it at a particular path
        if (issueUpdate.action === EIssueGroupedAction.DELETE) {
          update(this, ["groupedIssueIds", ...issueUpdate.path], (issueIds: string[] = []) => {
            return pull(issueIds, issue.id);
          });
          this.updateIssueCount(issueUpdate.path, -1);
        }

        //if update is reorder, reorder it at a particular path
        if (issueUpdate.action === EIssueGroupedAction.REORDER) {
          update(this, ["groupedIssueIds", ...issueUpdate.path], (issueIds: string[] = []) => {
            return this.issuesSortWithOrderBy(issueIds, this.orderBy);
          });
        }
      }
    });
  }

  updateIssueCount(path: string[], increment: number) {
    const [groupId, subGroupId] = path;

    if (subGroupId && groupId) {
      const groupKey = this.getGroupKey(groupId, subGroupId);
      const subGroupIssueCount = get(this.groupedIssueCount, groupKey) ?? 0;

      set(this.groupedIssueCount, groupKey, subGroupIssueCount + increment);
    }

    if (groupId) {
      const groupIssueCount = get(this.groupedIssueCount, [groupId]) ?? 0;

      set(this.groupedIssueCount, groupId, groupIssueCount + increment);
    }

    if (groupId !== ALL_ISSUES) {
      const totalIssueCount = get(this.groupedIssueCount, [ALL_ISSUES]) ?? 0;

      set(this.groupedIssueCount, ALL_ISSUES, totalIssueCount + increment);
    }
  }

  getUpdateDetails = (
    issue?: Partial<TIssue>,
    issueBeforeUpdate?: Partial<TIssue>,
    action?: EIssueGroupedAction.ADD | EIssueGroupedAction.DELETE
  ): { path: string[]; action: EIssueGroupedAction }[] => {
    const orderByUpdates = this.getOrderByUpdateDetails(issue, issueBeforeUpdate);
    if (!this.issueGroupKey || !issue)
      return action ? [{ path: [ALL_ISSUES], action }, ...orderByUpdates] : orderByUpdates;

    const groupActionsArray = this.getDifference(
      this.getArrayStringArray(issue[this.issueGroupKey], this.groupBy),
      this.getArrayStringArray(issueBeforeUpdate?.[this.issueGroupKey], this.groupBy),
      action
    );

    if (!this.issueSubGroupKey)
      return [
        ...this.getGroupIssueKeyActions(
          groupActionsArray[EIssueGroupedAction.ADD],
          groupActionsArray[EIssueGroupedAction.DELETE]
        ),
        ...orderByUpdates,
      ];

    const subGroupActionsArray = this.getDifference(
      this.getArrayStringArray(issue[this.issueSubGroupKey], this.subGroupBy),
      this.getArrayStringArray(issueBeforeUpdate?.[this.issueSubGroupKey], this.subGroupBy),
      action
    );

    return [
      ...this.getSubGroupIssueKeyActions(
        groupActionsArray,
        subGroupActionsArray,
        this.getArrayStringArray(issueBeforeUpdate?.[this.issueGroupKey] ?? issue[this.issueGroupKey], this.groupBy),
        this.getArrayStringArray(issue[this.issueGroupKey], this.groupBy),
        this.getArrayStringArray(
          issueBeforeUpdate?.[this.issueSubGroupKey] ?? issue[this.issueSubGroupKey],
          this.subGroupBy
        ),
        this.getArrayStringArray(issue[this.issueSubGroupKey], this.subGroupBy)
      ),
      ...orderByUpdates,
    ];
  };

  getOrderByUpdateDetails(issue: Partial<TIssue> | undefined, issueBeforeUpdate: Partial<TIssue> | undefined) {
    if (
      !issue ||
      !issueBeforeUpdate ||
      !this.orderByKey ||
      isEqual(issue[this.orderByKey], issueBeforeUpdate[this.orderByKey])
    )
      return [];

    if (!this.issueGroupKey) return [{ path: [ALL_ISSUES], action: EIssueGroupedAction.REORDER }];

    const issueKeyActions = [];
    const groupByValues = this.getArrayStringArray(issue[this.issueGroupKey]);

    if (!this.issueSubGroupKey) {
      for (const groupKey of groupByValues) {
        issueKeyActions.push({ path: [groupKey], action: EIssueGroupedAction.REORDER });
      }

      return issueKeyActions;
    }

    const subGroupByValues = this.getArrayStringArray(issue[this.issueSubGroupKey]);

    for (const groupKey of groupByValues) {
      for (const subGroupKey of subGroupByValues) {
        issueKeyActions.push({ path: [groupKey, subGroupKey], action: EIssueGroupedAction.REORDER });
      }
    }

    return issueKeyActions;
  }

  getArrayStringArray = (
    value: string | string[] | undefined | null,
    groupByKey?: TIssueGroupByOptions | undefined
  ): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    if (groupByKey === "state_detail.group") {
      return [this.rootIssueStore.rootStore.state.stateMap?.[value]?.group];
    }

    return [value];
  };

  getSubGroupIssueKeyActions = (
    groupActionsArray: {
      [EIssueGroupedAction.ADD]: string[];
      [EIssueGroupedAction.DELETE]: string[];
    },
    subGroupActionsArray: {
      [EIssueGroupedAction.ADD]: string[];
      [EIssueGroupedAction.DELETE]: string[];
    },
    previousIssueGroupProperties: string[],
    currentIssueGroupProperties: string[],
    previousIssueSubGroupProperties: string[],
    currentIssueSubGroupProperties: string[]
  ): { path: string[]; action: EIssueGroupedAction }[] => {
    const issueKeyActions: { [key: string]: { path: string[]; action: EIssueGroupedAction } } = {};

    for (const addKey of groupActionsArray[EIssueGroupedAction.ADD]) {
      for (const subGroupProperty of currentIssueSubGroupProperties) {
        issueKeyActions[this.getGroupKey(addKey, subGroupProperty)] = {
          path: [addKey, subGroupProperty],
          action: EIssueGroupedAction.ADD,
        };
      }
    }

    for (const deleteKey of groupActionsArray[EIssueGroupedAction.DELETE]) {
      for (const subGroupProperty of previousIssueSubGroupProperties) {
        issueKeyActions[this.getGroupKey(deleteKey, subGroupProperty)] = {
          path: [deleteKey, subGroupProperty],
          action: EIssueGroupedAction.DELETE,
        };
      }
    }

    for (const addKey of subGroupActionsArray[EIssueGroupedAction.ADD]) {
      for (const groupProperty of currentIssueGroupProperties) {
        issueKeyActions[this.getGroupKey(groupProperty, addKey)] = {
          path: [groupProperty, addKey],
          action: EIssueGroupedAction.ADD,
        };
      }
    }

    for (const deleteKey of subGroupActionsArray[EIssueGroupedAction.DELETE]) {
      for (const groupProperty of previousIssueGroupProperties) {
        issueKeyActions[this.getGroupKey(groupProperty, deleteKey)] = {
          path: [groupProperty, deleteKey],
          action: EIssueGroupedAction.DELETE,
        };
      }
    }

    return Object.values(issueKeyActions);
  };

  getGroupIssueKeyActions = (
    addArray: string[],
    deleteArray: string[]
  ): { path: string[]; action: EIssueGroupedAction }[] => {
    const issueKeyActions = [];

    for (const addKey of addArray) {
      issueKeyActions.push({ path: [addKey], action: EIssueGroupedAction.ADD });
    }

    for (const deleteKey of deleteArray) {
      issueKeyActions.push({ path: [deleteKey], action: EIssueGroupedAction.DELETE });
    }

    return issueKeyActions;
  };

  getDifference = (
    current: string[],
    previous: string[],
    action?: EIssueGroupedAction.ADD | EIssueGroupedAction.DELETE
  ): { [EIssueGroupedAction.ADD]: string[]; [EIssueGroupedAction.DELETE]: string[] } => {
    const ADD = [];
    const DELETE = [];
    if (isEmpty(current)) ADD.push("None");
    else {
      for (const currentValue of current) {
        if (previous.includes(currentValue)) continue;
        ADD.push(currentValue);
      }
    }

    if (isEmpty(previous)) DELETE.push("None");
    else {
      for (const previousValue of previous) {
        if (current.includes(previousValue)) continue;
        DELETE.push(previousValue);
      }
    }

    if (!action) return { [EIssueGroupedAction.ADD]: ADD, [EIssueGroupedAction.DELETE]: DELETE };

    if (action === EIssueGroupedAction.ADD)
      return { [EIssueGroupedAction.ADD]: [...ADD, ...DELETE], [EIssueGroupedAction.DELETE]: [] };
    else return { [EIssueGroupedAction.DELETE]: [...ADD, ...DELETE], [EIssueGroupedAction.ADD]: [] };
  };

  issueDisplayFiltersDefaultData = (groupBy: string | null): string[] => {
    switch (groupBy) {
      case "state":
        return Object.keys(this.rootIssueStore?.stateMap || {});
      case "state_detail.group":
        return Object.keys(STATE_GROUPS);
      case "priority":
        return ISSUE_PRIORITIES.map((i) => i.key);
      case "labels":
        return Object.keys(this.rootIssueStore?.labelMap || {});
      case "created_by":
        return Object.keys(this.rootIssueStore?.workSpaceMemberRolesMap || {});
      case "assignees":
        return Object.keys(this.rootIssueStore?.workSpaceMemberRolesMap || {});
      case "project":
        return Object.keys(this.rootIssueStore?.projectMap || {});
      default:
        return [];
    }
  };

  /**
   * This Method is used to get data of the issue based on the ids of the data for states, labels adn assignees
   * @param dataType what type of data is being sent
   * @param dataIds id/ids of the data that is to be populated
   * @param order ascending or descending for arrays of data
   * @returns string | string[] of sortable fields to be used for sorting
   */
  populateIssueDataForSorting(
    dataType: "state_id" | "label_ids" | "assignee_ids" | "module_ids" | "cycle_id",
    dataIds: string | string[] | null | undefined,
    order?: "asc" | "desc"
  ) {
    if (!dataIds) return;

    const dataValues: string[] = [];
    const isDataIdsArray = Array.isArray(dataIds);
    const dataIdsArray = isDataIdsArray ? dataIds : [dataIds];

    switch (dataType) {
      case "state_id":
        const stateMap = this.rootIssueStore?.stateMap;
        if (!stateMap) break;
        for (const dataId of dataIdsArray) {
          const state = stateMap[dataId];
          if (state && state.name) dataValues.push(state.name.toLocaleLowerCase());
        }
        break;
      case "label_ids":
        const labelMap = this.rootIssueStore?.labelMap;
        if (!labelMap) break;
        for (const dataId of dataIdsArray) {
          const label = labelMap[dataId];
          if (label && label.name) dataValues.push(label.name.toLocaleLowerCase());
        }
        break;
      case "assignee_ids":
        const memberMap = this.rootIssueStore?.memberMap;
        if (!memberMap) break;
        for (const dataId of dataIdsArray) {
          const member = memberMap[dataId];
          if (member && member.first_name) dataValues.push(member.first_name.toLocaleLowerCase());
        }
        break;
      case "module_ids":
        const moduleMap = this.rootIssueStore?.moduleMap;
        if (!moduleMap) break;
        for (const dataId of dataIdsArray) {
          const currentModule = moduleMap[dataId];
          if (currentModule && currentModule.name) dataValues.push(currentModule.name.toLocaleLowerCase());
        }
        break;
      case "cycle_id":
        const cycleMap = this.rootIssueStore?.cycleMap;
        if (!cycleMap) break;
        for (const dataId of dataIdsArray) {
          const cycle = cycleMap[dataId];
          if (cycle && cycle.name) dataValues.push(cycle.name.toLocaleLowerCase());
        }
        break;
    }

    return isDataIdsArray ? dataValues : dataValues[0];
  }

  /**
   * This Method is mainly used to filter out empty values in the beginning
   * @param key key of the value that is to be checked if empty
   * @param object any object in which the key's value is to be checked
   * @returns 1 if empty, 0 if not empty
   */
  getSortOrderToFilterEmptyValues(key: string, object: any) {
    const value = object?.[key];

    if (typeof value !== "number" && isEmpty(value)) return 1;

    return 0;
  }

  getIssueIds(issues: TIssue[]) {
    return issues.map((issue) => issue?.id);
  }

  issuesSortWithOrderBy = (issueIds: string[], key: TIssueOrderByOptions | undefined): string[] => {
    const issues = this.rootIssueStore.issues.getIssuesByIds(issueIds, this.isArchived ? "archived" : "un-archived");
    const array = orderBy(issues, "created_at", ["desc"]);

    switch (key) {
      case "sort_order":
        return this.getIssueIds(orderBy(array, "sort_order"));
      case "state__name":
        return this.getIssueIds(
          orderBy(array, (issue) => this.populateIssueDataForSorting("state_id", issue?.["state_id"]))
        );
      case "-state__name":
        return this.getIssueIds(
          orderBy(array, (issue) => this.populateIssueDataForSorting("state_id", issue?.["state_id"]), ["desc"])
        );
      // dates
      case "created_at":
        return this.getIssueIds(orderBy(array, "created_at"));
      case "-created_at":
        return this.getIssueIds(orderBy(array, "created_at", ["desc"]));
      case "updated_at":
        return this.getIssueIds(orderBy(array, "updated_at"));
      case "-updated_at":
        return this.getIssueIds(orderBy(array, "updated_at", ["desc"]));
      case "start_date":
        return this.getIssueIds(
          orderBy(array, [this.getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"])
        ); //preferring sorting based on empty values to always keep the empty values below
      case "-start_date":
        return this.getIssueIds(
          orderBy(
            array,
            [this.getSortOrderToFilterEmptyValues.bind(null, "start_date"), "start_date"], //preferring sorting based on empty values to always keep the empty values below
            ["asc", "desc"]
          )
        );

      case "target_date":
        return this.getIssueIds(
          orderBy(array, [this.getSortOrderToFilterEmptyValues.bind(null, "target_date"), "target_date"])
        ); //preferring sorting based on empty values to always keep the empty values below
      case "-target_date":
        return this.getIssueIds(
          orderBy(
            array,
            [this.getSortOrderToFilterEmptyValues.bind(null, "target_date"), "target_date"], //preferring sorting based on empty values to always keep the empty values below
            ["asc", "desc"]
          )
        );

      // custom
      case "priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return this.getIssueIds(orderBy(array, (currentIssue: TIssue) => indexOf(sortArray, currentIssue?.priority)));
      }
      case "-priority": {
        const sortArray = ISSUE_PRIORITIES.map((i) => i.key);
        return this.getIssueIds(
          orderBy(array, (currentIssue: TIssue) => indexOf(sortArray, currentIssue?.priority), ["desc"])
        );
      }

      // number
      case "attachment_count":
        return this.getIssueIds(orderBy(array, "attachment_count"));
      case "-attachment_count":
        return this.getIssueIds(orderBy(array, "attachment_count", ["desc"]));

      case "estimate_point":
        return this.getIssueIds(
          orderBy(array, [this.getSortOrderToFilterEmptyValues.bind(null, "estimate_point"), "estimate_point"])
        ); //preferring sorting based on empty values to always keep the empty values below
      case "-estimate_point":
        return this.getIssueIds(
          orderBy(
            array,
            [this.getSortOrderToFilterEmptyValues.bind(null, "estimate_point"), "estimate_point"], //preferring sorting based on empty values to always keep the empty values below
            ["asc", "desc"]
          )
        );

      case "link_count":
        return this.getIssueIds(orderBy(array, "link_count"));
      case "-link_count":
        return this.getIssueIds(orderBy(array, "link_count", ["desc"]));

      case "sub_issues_count":
        return this.getIssueIds(orderBy(array, "sub_issues_count"));
      case "-sub_issues_count":
        return this.getIssueIds(orderBy(array, "sub_issues_count", ["desc"]));

      // Array
      case "labels__name":
        return this.getIssueIds(
          orderBy(
            array, //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("label_ids", issue?.["label_ids"], "asc")
          )
        );
      case "-labels__name":
        return this.getIssueIds(
          orderBy(
            array, //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("label_ids", issue?.["label_ids"], "desc"),
            "desc"
          )
        );

      case "issue_module__module__name":
        return this.getIssueIds(
          orderBy(array, [
            this.getSortOrderToFilterEmptyValues.bind(null, "module_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("module_ids", issue?.["module_ids"], "asc"),
          ])
        );
      case "-issue_module__module__name":
        return this.getIssueIds(
          orderBy(
            array,
            [
              this.getSortOrderToFilterEmptyValues.bind(null, "module_ids"), //preferring sorting based on empty values to always keep the empty values below
              (issue) => this.populateIssueDataForSorting("module_ids", issue?.["module_ids"], "desc"),
            ],
            ["asc", "desc"]
          )
        );

      case "issue_cycle__cycle__name":
        return this.getIssueIds(
          orderBy(array, [
            this.getSortOrderToFilterEmptyValues.bind(null, "cycle_id"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("cycle_id", issue?.["cycle_id"], "asc"),
          ])
        );
      case "-issue_cycle__cycle__name":
        return this.getIssueIds(
          orderBy(
            array,
            [
              this.getSortOrderToFilterEmptyValues.bind(null, "cycle_id"), //preferring sorting based on empty values to always keep the empty values below
              (issue) => this.populateIssueDataForSorting("cycle_id", issue?.["cycle_id"], "desc"),
            ],
            ["asc", "desc"]
          )
        );

      case "assignees__first_name":
        return this.getIssueIds(
          orderBy(array, [
            this.getSortOrderToFilterEmptyValues.bind(null, "assignee_ids"), //preferring sorting based on empty values to always keep the empty values below
            (issue) => this.populateIssueDataForSorting("assignee_ids", issue?.["assignee_ids"], "asc"),
          ])
        );
      case "-assignees__first_name":
        return this.getIssueIds(
          orderBy(
            array,
            [
              this.getSortOrderToFilterEmptyValues.bind(null, "assignee_ids"), //preferring sorting based on empty values to always keep the empty values below
              (issue) => this.populateIssueDataForSorting("assignee_ids", issue?.["assignee_ids"], "desc"),
            ],
            ["asc", "desc"]
          )
        );

      default:
        return this.getIssueIds(array);
    }
  };

  getGroupArray(value: boolean | number | string | string[] | null, isDate: boolean = false): string[] {
    if (!value || value === null || value === undefined) return ["None"];
    if (Array.isArray(value))
      if (value && value.length) return value;
      else return ["None"];
    else if (typeof value === "boolean") return [value ? "True" : "False"];
    else if (typeof value === "number") return [value.toString()];
    else if (isDate) return [renderFormattedPayloadDate(value) || "None"];
    else return [value || "None"];
  }

  storePreviousPaginationValues = (
    issuesResponse: TIssuesResponse,
    options?: IssuePaginationOptions,
    groupId?: string,
    subGroupId?: string
  ) => {
    if (options) this.paginationOptions = options;

    this.setPaginationData(
      issuesResponse.prev_cursor,
      issuesResponse.next_cursor,
      issuesResponse.next_page_results,
      groupId,
      subGroupId
    );
  };

  processIssueResponse(issueResponse: TIssuesResponse): {
    issueList: TIssue[];
    groupedIssues: TIssues;
    groupedIssueCount: TGroupedIssueCount;
  } {
    const issueResult = issueResponse?.results;

    if (!issueResult)
      return {
        issueList: [],
        groupedIssues: {},
        groupedIssueCount: {},
      };

    if (Array.isArray(issueResult)) {
      return {
        issueList: issueResult,
        groupedIssues: {
          [ALL_ISSUES]: issueResult.map((issue) => issue.id),
        },
        groupedIssueCount: {
          [ALL_ISSUES]: issueResponse.total_count,
        },
      };
    }

    const issueList: TIssue[] = [];
    const groupedIssues: TGroupedIssues | TSubGroupedIssues = {};
    const groupedIssueCount: TGroupedIssueCount = {};

    set(groupedIssueCount, [ALL_ISSUES], issueResponse.total_count);

    for (const groupId in issueResult) {
      const groupIssuesObject = issueResult[groupId];
      const groupIssueResult = groupIssuesObject?.results;

      if (!groupIssueResult) continue;

      set(groupedIssueCount, [groupId], groupIssuesObject.total_results);

      if (Array.isArray(groupIssueResult)) {
        issueList.push(...groupIssueResult);
        set(
          groupedIssues,
          [groupId],
          groupIssueResult.map((issue) => issue.id)
        );
        continue;
      }

      for (const subGroupId in groupIssueResult) {
        const subGroupIssuesObject = groupIssueResult[subGroupId];
        const subGroupIssueResult = subGroupIssuesObject?.results;

        if (!subGroupIssueResult) continue;

        set(groupedIssueCount, [this.getGroupKey(groupId, subGroupId)], subGroupIssuesObject.total_results);

        if (Array.isArray(subGroupIssueResult)) {
          issueList.push(...subGroupIssueResult);
          set(
            groupedIssues,
            [groupId, subGroupId],
            subGroupIssueResult.map((issue) => issue.id)
          );

          continue;
        }
      }
    }

    return { issueList, groupedIssues, groupedIssueCount };
  }

  setPaginationData(
    prevCursor: string,
    nextCursor: string,
    nextPageResults: boolean,
    groupId?: string,
    subGroupId?: string
  ) {
    const cursorObject = {
      prevCursor,
      nextCursor,
      nextPageResults,
    };

    set(this.issuePaginationData, [this.getGroupKey(groupId, subGroupId)], cursorObject);
  }

  setLoader(loaderValue: TLoader, groupId?: string, subGroupId?: string) {
    runInAction(() => {
      set(this.loader, this.getGroupKey(groupId, subGroupId), loaderValue);
    });
  }

  getIssueLoader = (groupId?: string, subGroupId?: string) => {
    return get(this.loader, this.getGroupKey(groupId, subGroupId));
  };

  getGroupKey = (groupId?: string, subGroupId?: string) => {
    if (groupId && subGroupId && subGroupId !== "null") return `${groupId}_${subGroupId}`;

    if (groupId) return groupId;

    return ALL_ISSUES;
  };

  getPaginationData = computedFn(
    (groupId: string | undefined, subGroupId: string | undefined): TPaginationData | undefined => {
      return get(this.issuePaginationData, [this.getGroupKey(groupId, subGroupId)]);
    }
  );

  getGroupIssueCount = computedFn(
    (
      groupId: string | undefined,
      subGroupId: string | undefined,
      isSubGroupCumulative: boolean
    ): number | undefined => {
      if (isSubGroupCumulative && subGroupId) {
        const groupIssuesKeys = Object.keys(this.groupedIssueCount);
        let subGroupCumulativeCount = 0;

        for (const groupKey of groupIssuesKeys) {
          if (groupKey.includes(subGroupId)) subGroupCumulativeCount += this.groupedIssueCount[groupKey];
        }

        return subGroupCumulativeCount;
      }

      return get(this.groupedIssueCount, [this.getGroupKey(groupId, subGroupId)]);
    }
  );
}
