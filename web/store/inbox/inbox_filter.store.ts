import { observable, action, makeObservable, runInAction, computed } from "mobx";
import set from "lodash/set";
import isEmpty from "lodash/isEmpty";
// services
import { InboxService } from "services/inbox.service";
// types
import { RootStore } from "store/root.store";
import { TInboxIssueFilterOptions, TInboxIssueFilters, TInboxIssueQueryParams, TInbox } from "@plane/types";

export interface IInboxFilter {
  // observables
  filters: Record<string, TInboxIssueFilters>; // inbox_id -> TInboxIssueFilters
  // computed
  inboxFilters: TInboxIssueFilters | undefined;
  inboxAppliedFilters: Partial<Record<TInboxIssueQueryParams, string>> | undefined;
  // actions
  fetchInboxFilters: (workspaceSlug: string, projectId: string, inboxId: string) => Promise<TInbox>;
  updateInboxFilters: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    filters: Partial<TInboxIssueFilterOptions>
  ) => Promise<TInbox>;
}

export class InboxFilter implements IInboxFilter {
  // observables
  filters: Record<string, TInboxIssueFilters> = {};
  // root store
  rootStore;
  // services
  inboxService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      filters: observable,
      // computed
      inboxFilters: computed,
      inboxAppliedFilters: computed,
      // actions
      fetchInboxFilters: action,
      updateInboxFilters: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.inboxService = new InboxService();
  }

  get inboxFilters() {
    const inboxId = this.rootStore.app.router.inboxId;
    if (!inboxId) return undefined;

    const displayFilters = this.filters[inboxId] || undefined;
    if (isEmpty(displayFilters)) return undefined;

    const _filters: TInboxIssueFilters = {
      filters: {
        priority: isEmpty(displayFilters?.filters?.priority) ? [] : displayFilters?.filters?.priority,
        inbox_status: isEmpty(displayFilters?.filters?.inbox_status) ? [] : displayFilters?.filters?.inbox_status,
      },
    };
    return _filters;
  }

  get inboxAppliedFilters() {
    const userFilters = this.inboxFilters;
    if (!userFilters) return undefined;

    const filteredParams = {
      priority: userFilters?.filters?.priority?.join(",") || undefined,
      inbox_status: userFilters?.filters?.inbox_status?.join(",") || undefined,
    };
    return filteredParams;
  }

  fetchInboxFilters = async (workspaceSlug: string, projectId: string, inboxId: string) => {
    try {
      const response = await this.rootStore.inbox.inbox.fetchInboxById(workspaceSlug, projectId, inboxId);

      const filters: TInboxIssueFilterOptions = {
        priority: response?.view_props?.filters?.priority || [],
        inbox_status: response?.view_props?.filters?.inbox_status || [],
      };

      runInAction(() => {
        set(this.filters, [inboxId], { filters: filters });
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateInboxFilters = async (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    filters: Partial<TInboxIssueFilterOptions>
  ) => {
    try {
      runInAction(() => {
        Object.keys(filters).forEach((_key) => {
          const _filterKey = _key as keyof TInboxIssueFilterOptions;
          set(this.filters, [inboxId, "filters", _key], filters[_filterKey]);
        });
      });

      const inboxFilters = this.inboxFilters;
      let _filters: TInboxIssueFilterOptions = {
        priority: inboxFilters?.filters?.priority || [],
        inbox_status: inboxFilters?.filters?.inbox_status || [],
      };
      _filters = { ..._filters, ...filters };

      this.rootStore.inbox.inboxIssue.fetchInboxIssues(workspaceSlug, projectId, inboxId, "mutation");

      const response = await this.rootStore.inbox.inbox.updateInbox(workspaceSlug, projectId, inboxId, {
        view_props: { filters: _filters },
      });

      return response;
    } catch (error) {
      throw error;
    }
  };
}
