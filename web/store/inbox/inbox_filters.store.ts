import { observable, action, makeObservable, runInAction, computed } from "mobx";
// types
import { RootStore } from "../root";
// services
import { InboxService } from "services/inbox.service";
// types
import { IInbox, IInboxFilterOptions, IInboxQueryParams } from "types";

export interface IInboxFiltersStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  inboxFilters: {
    [inboxId: string]: { filters: IInboxFilterOptions };
  };

  // actions
  fetchInboxFilters: (workspaceSlug: string, projectId: string, inboxId: string) => Promise<IInbox>;
  updateInboxFilters: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    filters: Partial<IInboxFilterOptions>
  ) => Promise<void>;

  // computed
  appliedFilters: IInboxQueryParams | null;
}

export class InboxFiltersStore implements IInboxFiltersStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  inboxFilters: {
    [inboxId: string]: { filters: IInboxFilterOptions };
  } = {};

  // root store
  rootStore;

  // services
  inboxService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable.ref,
      error: observable.ref,

      // observables
      inboxFilters: observable.ref,

      // actions
      fetchInboxFilters: action,
      updateInboxFilters: action,

      // computed
      appliedFilters: computed,
    });

    this.rootStore = _rootStore;
    this.inboxService = new InboxService();
  }

  get appliedFilters(): IInboxQueryParams | null {
    const inboxId = this.rootStore.inbox.inboxId;

    if (!inboxId) return null;

    const filtersList = this.inboxFilters[inboxId]?.filters;

    if (!filtersList) return null;

    const filteredRouteParams: IInboxQueryParams = {
      priority: filtersList.priority ? filtersList.priority.join(",") : null,
      inbox_status: filtersList.inbox_status ? filtersList.inbox_status.join(",") : null,
    };

    return filteredRouteParams;
  }

  fetchInboxFilters = async (workspaceSlug: string, projectId: string, inboxId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const issuesResponse = await this.inboxService.getInboxById(workspaceSlug, projectId, inboxId);

      runInAction(() => {
        this.loader = false;
        this.inboxFilters = {
          ...this.inboxFilters,
          [inboxId]: issuesResponse.view_props,
        };
      });

      return issuesResponse;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  updateInboxFilters = async (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    filters: Partial<IInboxFilterOptions>
  ) => {
    const newViewProps = {
      ...this.inboxFilters[inboxId],
      filters: {
        ...this.inboxFilters[inboxId]?.filters,
        ...filters,
      },
    };

    try {
      runInAction(() => {
        this.inboxFilters = {
          ...this.inboxFilters,
          [inboxId]: newViewProps,
        };
      });

      const userRole = this.rootStore.user?.projectMemberInfo?.[projectId]?.role || 0;
      if (userRole > 10) {
        await this.inboxService.patchInbox(workspaceSlug, projectId, inboxId, { view_props: newViewProps });
      }
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      this.fetchInboxFilters(workspaceSlug, projectId, inboxId);

      throw error;
    }
  };
}
