/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { uniq, update, isEmpty, omit, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { isIntakeInActionableStatus, isIntakeInDisabledStatus } from "@plane/constants";
import type { EPastDurationFilters } from "@plane/constants";
// types
import type {
  TInboxIssue,
  TInboxIssueCurrentTab,
  TInboxIssueFilter,
  TInboxIssueSorting,
  TInboxIssuePaginationInfo,
  TInboxIssueSortingOrderByQueryParam,
  IInboxIssueStore,
} from "@plane/types";
import { EInboxIssueCurrentTab, EInboxIssueStatus } from "@plane/types";
import { getCustomDates } from "@plane/utils";
// helpers
// services
import { InboxIssueService } from "@/services/inbox";
// root store
import { InboxIssueStore } from "@/store/inbox/inbox-issue.store";
import type { CoreRootStore } from "../root.store";
import { IntakeWorkItemPermissionsInstance } from "./permissions/root";
import type { IntakeWorkItemPermissions } from "./permissions/root";

type TLoader =
  | "init-loading"
  | "mutation-loading"
  | "filter-loading"
  | "pagination-loading"
  | "issue-loading"
  | undefined;

export interface IProjectInboxStore {
  currentTab: TInboxIssueCurrentTab;
  loader: TLoader;
  error: { message: string; status: "init-error" | "pagination-error" } | undefined;
  currentInboxProjectId: string;
  filtersMap: Record<string, Partial<TInboxIssueFilter>>; // projectId -> Partial<TInboxIssueFilter>
  sortingMap: Record<string, Partial<TInboxIssueSorting>>; // projectId -> Partial<TInboxIssueSorting>
  inboxIssuePaginationInfo: TInboxIssuePaginationInfo | undefined;
  inboxIssues: Record<string, IInboxIssueStore>; // issue_id -> IInboxIssueStore
  inboxIssueIds: string[];
  permissions: IntakeWorkItemPermissions;
  // computed
  inboxFilters: Partial<TInboxIssueFilter>; // computed project inbox filters
  inboxSorting: Partial<TInboxIssueSorting>; // computed project inbox sorting
  getAppliedFiltersCount: number;
  filteredInboxIssueIds: string[];
  // computed functions
  getIssueInboxByIssueId: (issueId: string) => IInboxIssueStore;
  getIsIssueAvailable: (inboxIssueId: string) => boolean;
  // helper actions
  inboxIssueQueryParams: (
    inboxFilters: Partial<TInboxIssueFilter>,
    inboxSorting: Partial<TInboxIssueSorting>,
    pagePerCount: number,
    paginationCursor: string
  ) => Partial<Record<keyof TInboxIssueFilter, string>>;
  createOrUpdateInboxIssue: (inboxIssues: TInboxIssue[], workspaceSlug: string, projectId: string) => void;
  initializeDefaultFilters: (projectId: string, tab: TInboxIssueCurrentTab) => void;
  // actions
  handleCurrentTab: (workspaceSlug: string, projectId: string, tab: TInboxIssueCurrentTab) => void;
  handleInboxIssueFilters: <T extends keyof TInboxIssueFilter>(key: T, value: TInboxIssueFilter[T]) => void; // if user sends me undefined, I will remove the value from the filter key
  handleInboxIssueSorting: <T extends keyof TInboxIssueSorting>(key: T, value: TInboxIssueSorting[T]) => void; // if user sends me undefined, I will remove the value from the filter key
  fetchInboxIssues: (
    workspaceSlug: string,
    projectId: string,
    loadingType?: TLoader,
    tab?: TInboxIssueCurrentTab
  ) => Promise<void>;
  fetchInboxPaginationIssues: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchInboxIssueById: (workspaceSlug: string, projectId: string, inboxIssueId: string) => Promise<TInboxIssue>;
  createInboxIssue: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TInboxIssue>
  ) => Promise<TInboxIssue | undefined>;
  deleteInboxIssue: (workspaceSlug: string, projectId: string, inboxIssueId: string) => Promise<void>;
}

export abstract class ProjectInboxStore implements IProjectInboxStore {
  // constants
  PER_PAGE_COUNT = 10;
  // observables
  currentTab: TInboxIssueCurrentTab = EInboxIssueCurrentTab.OPEN;
  loader: TLoader = "init-loading";
  error: { message: string; status: "init-error" | "pagination-error" } | undefined = undefined;
  currentInboxProjectId: string = "";
  filtersMap: Record<string, Partial<TInboxIssueFilter>> = {};
  sortingMap: Record<string, Partial<TInboxIssueSorting>> = {};
  inboxIssuePaginationInfo: TInboxIssuePaginationInfo | undefined = undefined;
  inboxIssues: Record<string, IInboxIssueStore> = {};
  inboxIssueIds: string[] = [];
  permissions: IntakeWorkItemPermissions;
  // services
  inboxIssueService;

  constructor(private store: CoreRootStore) {
    makeObservable(this, {
      currentTab: observable.ref,
      loader: observable.ref,
      error: observable,
      currentInboxProjectId: observable.ref,
      filtersMap: observable,
      sortingMap: observable,
      inboxIssuePaginationInfo: observable,
      inboxIssues: observable,
      inboxIssueIds: observable,
      // computed
      inboxFilters: computed,
      inboxSorting: computed,
      getAppliedFiltersCount: computed,
      filteredInboxIssueIds: computed,
      // actions
      handleInboxIssueFilters: action,
      handleInboxIssueSorting: action,
      fetchInboxIssues: action,
      fetchInboxPaginationIssues: action,
      fetchInboxIssueById: action,
      createInboxIssue: action,
      deleteInboxIssue: action,
    });
    this.inboxIssueService = new InboxIssueService();
    this.permissions = new IntakeWorkItemPermissionsInstance({
      can: this.store.permissionAccessStore.can,
      getIntakeConditionContext: this.getIntakeConditionContext.bind(this),
      getWorkItemCommentConditionContext: this.getWorkItemCommentConditionContext.bind(this),
      getAdditionalWorkItemPermissionMeta: this.getAdditionalWorkItemPermissionMeta.bind(this),
    });
  }

  private getIntakeConditionContext(intakeWorkItemId: string): { creator: boolean } {
    const intakeWorkItem = this.getIssueInboxByIssueId(intakeWorkItemId);
    const currentUserId = this.store.user.data?.id;
    return { creator: !!(intakeWorkItem?.created_by && currentUserId && intakeWorkItem.created_by === currentUserId) };
  }

  private getWorkItemCommentConditionContext(_workItemId: string, commentId: string): { creator: boolean } {
    const comment = this.store.issue.issueDetail.comment.getCommentById(commentId);
    const currentUserId = this.store.user.data?.id;
    return { creator: !!(comment?.created_by && currentUserId && comment.created_by === currentUserId) };
  }

  private getAdditionalWorkItemPermissionMeta = (intakeWorkItemId: string) => {
    const intakeWorkItem = this.getIssueInboxByIssueId(intakeWorkItemId);
    if (!intakeWorkItem) return { isInDisabledStatus: false, isInActionableStatus: false };
    return {
      isInDisabledStatus: isIntakeInDisabledStatus(intakeWorkItem.status),
      isInActionableStatus: isIntakeInActionableStatus(intakeWorkItem.status),
    };
  };

  // computed
  /**
   * @description computed project inbox filters
   */
  get inboxFilters() {
    if (!this.currentInboxProjectId) return {} as TInboxIssueFilter;
    return this.filtersMap?.[this.currentInboxProjectId];
  }

  /**
   * @description computed project inbox sorting
   */
  get inboxSorting() {
    if (!this.currentInboxProjectId) return {} as TInboxIssueSorting;
    return this.sortingMap?.[this.currentInboxProjectId];
  }

  get getAppliedFiltersCount() {
    let count = 0;
    if (this.inboxFilters != undefined)
      Object.keys(this.inboxFilters).forEach((key) => {
        const filterKey = key as keyof TInboxIssueFilter;
        if (this.inboxFilters[filterKey] && this.inboxFilters?.[filterKey])
          count = count + (this.inboxFilters?.[filterKey]?.length ?? 0);
      });
    return count;
  }

  get filteredInboxIssueIds() {
    let appliedFilters =
      this.currentTab === EInboxIssueCurrentTab.OPEN
        ? [EInboxIssueStatus.PENDING, EInboxIssueStatus.SNOOZED]
        : [EInboxIssueStatus.ACCEPTED, EInboxIssueStatus.DECLINED, EInboxIssueStatus.DUPLICATE];
    appliedFilters = appliedFilters.filter((filter) => this.inboxFilters?.status?.includes(filter));
    const currentTime = new Date().getTime();

    return this.currentTab === EInboxIssueCurrentTab.OPEN
      ? this.inboxIssueIds.filter((id) => {
          if (appliedFilters.length == 2) return true;
          if (appliedFilters[0] === EInboxIssueStatus.SNOOZED)
            return (
              this.inboxIssues[id].status === EInboxIssueStatus.SNOOZED &&
              currentTime < new Date(this.inboxIssues[id].snoozed_till!).getTime()
            );
          if (appliedFilters[0] === EInboxIssueStatus.PENDING)
            return (
              appliedFilters.includes(this.inboxIssues[id].status) ||
              (this.inboxIssues[id].status === EInboxIssueStatus.SNOOZED &&
                currentTime > new Date(this.inboxIssues[id].snoozed_till!).getTime())
            );
        })
      : this.inboxIssueIds.filter((id) => appliedFilters.includes(this.inboxIssues[id].status));
  }

  getIssueInboxByIssueId = computedFn((issueId: string) => this.inboxIssues?.[issueId]);

  getIsIssueAvailable = computedFn((inboxIssueId: string) => {
    if (!this.inboxIssueIds) return true;
    return this.inboxIssueIds.includes(inboxIssueId);
  });

  inboxIssueQueryParams = (
    inboxFilters: Partial<TInboxIssueFilter>,
    inboxSorting: Partial<TInboxIssueSorting>,
    pagePerCount: number,
    paginationCursor: string
  ) => {
    const filters: Partial<Record<keyof TInboxIssueFilter, string>> = {};
    if (!isEmpty(inboxFilters))
      Object.keys(inboxFilters).forEach((key) => {
        const filterKey = key as keyof TInboxIssueFilter;
        if (inboxFilters[filterKey] && inboxFilters[filterKey]?.length) {
          if (["created_at", "updated_at"].includes(filterKey) && (inboxFilters[filterKey] || [])?.length > 0) {
            const appliedDateFilters: string[] = [];
            inboxFilters[filterKey]?.forEach((value) => {
              const dateValue = value as EPastDurationFilters;
              appliedDateFilters.push(getCustomDates(dateValue));
            });
            filters[filterKey] = appliedDateFilters?.join(",");
          } else filters[filterKey] = inboxFilters[filterKey]?.join(",");
        }
      });

    const sorting: TInboxIssueSortingOrderByQueryParam = {
      order_by: "-issue__created_at",
    };
    if (inboxSorting?.order_by && inboxSorting?.sort_by) {
      switch (inboxSorting.order_by) {
        case "issue__created_at":
          if (inboxSorting.sort_by === "desc") sorting.order_by = `-issue__created_at`;
          else sorting.order_by = "issue__created_at";
          break;
        case "issue__updated_at":
          if (inboxSorting.sort_by === "desc") sorting.order_by = `-issue__updated_at`;
          else sorting.order_by = "issue__updated_at";
          break;
        case "issue__sequence_id":
          if (inboxSorting.sort_by === "desc") sorting.order_by = `-issue__sequence_id`;
          else sorting.order_by = "issue__sequence_id";
          break;
        default:
          sorting.order_by = "-issue__created_at";
          break;
      }
    }

    return {
      ...filters,
      ...sorting,
      per_page: pagePerCount,
      cursor: paginationCursor,
    };
  };

  createOrUpdateInboxIssue = (inboxIssues: TInboxIssue[], workspaceSlug: string, projectId: string) => {
    if (inboxIssues && inboxIssues.length > 0) {
      inboxIssues.forEach((inbox: TInboxIssue) => {
        if (!inbox?.issue?.id) return;
        const existingInboxIssueDetail = this.getIssueInboxByIssueId(inbox.issue.id);
        if (existingInboxIssueDetail)
          Object.assign(existingInboxIssueDetail, {
            ...inbox,
            issue: {
              ...existingInboxIssueDetail.issue,
              ...inbox.issue,
            },
          });
        else set(this.inboxIssues, [inbox.issue.id], new InboxIssueStore(workspaceSlug, projectId, inbox, this.store));
      });
    }
  };

  // actions
  handleCurrentTab = (workspaceSlug: string, projectId: string, tab: TInboxIssueCurrentTab) => {
    if (workspaceSlug && projectId) {
      runInAction(() => {
        set(this, "currentTab", tab);
        set(this, ["inboxIssueIds"], []);
        set(this, ["inboxIssuePaginationInfo"], undefined);
        set(this.sortingMap, [projectId], { order_by: "issue__created_at", sort_by: "desc" });
        set(this.filtersMap, [projectId], {
          status:
            tab === EInboxIssueCurrentTab.OPEN
              ? [EInboxIssueStatus.PENDING]
              : [EInboxIssueStatus.ACCEPTED, EInboxIssueStatus.DECLINED, EInboxIssueStatus.DUPLICATE],
        });
      });
      this.fetchInboxIssues(workspaceSlug, projectId, "filter-loading");
    }
  };

  handleInboxIssueFilters = <T extends keyof TInboxIssueFilter>(key: T, value: TInboxIssueFilter[T]) => {
    const { workspaceSlug } = this.store.router;
    const projectId = this.currentInboxProjectId;
    if (workspaceSlug && projectId) {
      runInAction(() => {
        set(this.filtersMap, [projectId, key], value);
        set(this, ["inboxIssuePaginationInfo"], undefined);
      });
      this.fetchInboxIssues(workspaceSlug, projectId, "filter-loading");
    }
  };

  handleInboxIssueSorting = <T extends keyof TInboxIssueSorting>(key: T, value: TInboxIssueSorting[T]) => {
    const { workspaceSlug } = this.store.router;
    const projectId = this.currentInboxProjectId;
    if (workspaceSlug && projectId) {
      runInAction(() => {
        set(this.sortingMap, [projectId, key], value);
        set(this, ["inboxIssuePaginationInfo"], undefined);
      });
      this.fetchInboxIssues(workspaceSlug, projectId, "filter-loading");
    }
  };

  initializeDefaultFilters = (projectId: string, tab: TInboxIssueCurrentTab) => {
    if (!projectId || !tab) return;
    if (isEmpty(this.inboxFilters)) {
      set(this.filtersMap, [projectId], {
        status:
          tab === EInboxIssueCurrentTab.OPEN
            ? [EInboxIssueStatus.PENDING]
            : [EInboxIssueStatus.ACCEPTED, EInboxIssueStatus.DECLINED, EInboxIssueStatus.DUPLICATE],
      });
    }
    if (isEmpty(this.inboxSorting)) {
      set(this.sortingMap, [projectId], { order_by: "issue__created_at", sort_by: "desc" });
    }
  };

  /**
   * @description fetch intake issues with paginated data
   * @param workspaceSlug
   * @param projectId
   */
  fetchInboxIssues = async (
    workspaceSlug: string,
    projectId: string,
    loadingType: TLoader = undefined,
    tab: TInboxIssueCurrentTab | undefined = undefined
  ) => {
    try {
      if (loadingType === undefined && tab) this.initializeDefaultFilters(projectId, tab);

      if (this.currentInboxProjectId != projectId) {
        runInAction(() => {
          set(this, ["currentInboxProjectId"], projectId);
          set(this, ["inboxIssues"], {});
          set(this, ["inboxIssueIds"], []);
          set(this, ["inboxIssuePaginationInfo"], undefined);
        });
      }
      if (Object.keys(this.inboxIssueIds).length === 0) this.loader = "init-loading";
      else this.loader = "mutation-loading";
      if (loadingType) this.loader = loadingType;

      const status = this.inboxFilters?.status;
      const queryParams = this.inboxIssueQueryParams(
        { ...this.inboxFilters, status },
        this.inboxSorting,
        this.PER_PAGE_COUNT,
        `${this.PER_PAGE_COUNT}:0:0`
      );
      const { results, ...paginationInfo } = await this.inboxIssueService.list(workspaceSlug, projectId, queryParams);

      runInAction(() => {
        this.loader = undefined;
        set(this, "inboxIssuePaginationInfo", paginationInfo);
        if (results) {
          const issueIds = results.map((value) => value?.issue?.id);
          set(this, ["inboxIssueIds"], issueIds);
          this.createOrUpdateInboxIssue(results, workspaceSlug, projectId);
        }
      });
    } catch (error) {
      console.error("Error fetching the intake issues", error);
      this.loader = undefined;
      this.error = {
        message: "Error fetching the intake work items please try again later.",
        status: "init-error",
      };
      throw error;
    }
  };

  /**
   * @description fetch intake issues with paginated data
   * @param workspaceSlug
   * @param projectId
   */
  fetchInboxPaginationIssues = async (workspaceSlug: string, projectId: string) => {
    try {
      if (
        this.inboxIssuePaginationInfo &&
        (!this.inboxIssuePaginationInfo?.total_results ||
          (this.inboxIssuePaginationInfo?.total_results &&
            this.inboxIssueIds.length < this.inboxIssuePaginationInfo?.total_results))
      ) {
        const queryParams = this.inboxIssueQueryParams(
          this.inboxFilters,
          this.inboxSorting,
          this.PER_PAGE_COUNT,
          this.inboxIssuePaginationInfo?.next_cursor || `${this.PER_PAGE_COUNT}:0:0`
        );
        const { results, ...paginationInfo } = await this.inboxIssueService.list(workspaceSlug, projectId, queryParams);

        runInAction(() => {
          set(this, "inboxIssuePaginationInfo", paginationInfo);
          if (results && results.length > 0) {
            const issueIds = results.map((value) => value?.issue?.id);
            update(this, ["inboxIssueIds"], (ids) => uniq([...ids, ...issueIds]));
            this.createOrUpdateInboxIssue(results, workspaceSlug, projectId);
          }
        });
      } else set(this, ["inboxIssuePaginationInfo", "next_page_results"], false);
    } catch (error) {
      console.error("Error fetching the intake issues", error);
      this.error = {
        message: "Error fetching the paginated intake work items please try again later.",
        status: "pagination-error",
      };
      throw error;
    }
  };

  /**
   * @description fetch intake issue with issue id
   * @param workspaceSlug
   * @param projectId
   * @param inboxIssueId
   */
  fetchInboxIssueById = async (
    workspaceSlug: string,
    projectId: string,
    inboxIssueId: string
  ): Promise<TInboxIssue> => {
    try {
      this.loader = "issue-loading";
      const inboxIssue = await this.inboxIssueService.retrieve(workspaceSlug, projectId, inboxIssueId);
      const issueId = inboxIssue?.issue?.id || undefined;

      if (inboxIssue && issueId) {
        runInAction(() => {
          this.createOrUpdateInboxIssue([inboxIssue], workspaceSlug, projectId);
          set(this, "loader", undefined);
        });
        await Promise.all([
          // fetching reactions
          this.store.issue.issueDetail.fetchReactions(workspaceSlug, projectId, issueId),
          // fetching activity
          this.store.issue.issueDetail.fetchActivities(workspaceSlug, projectId, issueId),
          // fetching comments
          this.store.issue.issueDetail.fetchComments(workspaceSlug, projectId, issueId),
          // fetching attachments
          this.store.issue.issueDetail.fetchAttachments(workspaceSlug, projectId, issueId),
        ]);
      }
      return inboxIssue;
    } catch (error) {
      console.error("Error fetching the intake issue with intake issue id");
      this.loader = undefined;
      throw error;
    }
  };

  /**
   * @description create intake issue
   * @param workspaceSlug
   * @param projectId
   * @param data
   */
  createInboxIssue = async (workspaceSlug: string, projectId: string, data: Partial<TInboxIssue>) => {
    try {
      const inboxIssueResponse = await this.inboxIssueService.create(workspaceSlug, projectId, data);
      if (inboxIssueResponse)
        runInAction(() => {
          if (!inboxIssueResponse?.issue) return;
          update(this, ["inboxIssueIds"], (ids) => [...ids, inboxIssueResponse.issue?.id]);
          set(
            this.inboxIssues,
            [inboxIssueResponse.issue.id],
            new InboxIssueStore(workspaceSlug, projectId, inboxIssueResponse, this.store)
          );
          set(
            this,
            ["inboxIssuePaginationInfo", "total_results"],
            (this.inboxIssuePaginationInfo?.total_results || 0) + 1
          );
          // Increment intake_count if the new issue is PENDING
          if (inboxIssueResponse.status === EInboxIssueStatus.PENDING) {
            const currentCount = this.store.projectRoot.project.projectMap[projectId]?.intake_count ?? 0;
            set(this.store.projectRoot.project.projectMap, [projectId, "intake_count"], currentCount + 1);
          }
        });
      return inboxIssueResponse;
    } catch (error) {
      console.error("Error creating the intake issue");
      throw error;
    }
  };

  /**
   * @description delete intake issue
   * @param workspaceSlug
   * @param projectId
   * @param inboxIssueId
   */
  deleteInboxIssue = async (workspaceSlug: string, projectId: string, inboxIssueId: string) => {
    const currentIssue = this.inboxIssues?.[inboxIssueId];
    const wasPending = currentIssue?.status === EInboxIssueStatus.PENDING;
    try {
      if (!currentIssue) return;
      await this.inboxIssueService.destroy(workspaceSlug, projectId, inboxIssueId).then(() => {
        runInAction(() => {
          set(
            this,
            ["inboxIssuePaginationInfo", "total_results"],
            (this.inboxIssuePaginationInfo?.total_results || 0) - 1
          );
          set(this, "inboxIssues", omit(this.inboxIssues, inboxIssueId));
          set(
            this,
            ["inboxIssueIds"],
            this.inboxIssueIds.filter((id) => id !== inboxIssueId)
          );
          // Decrement intake_count if the deleted issue was PENDING
          if (wasPending) {
            const currentCount = this.store.projectRoot.project.projectMap[projectId]?.intake_count ?? 0;
            set(this.store.projectRoot.project.projectMap, [projectId, "intake_count"], Math.max(0, currentCount - 1));
          }
        });
      });
    } catch (error) {
      console.error("Error removing the intake issue");
      throw error;
    }
  };
}
