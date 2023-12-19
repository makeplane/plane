import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { set } from "lodash";
// services
import { InboxService } from "services/inbox.service";
// types
import { RootStore } from "store/root.store";
import { IInbox, IInboxFilterOptions, IInboxQueryParams } from "types";
import { EUserWorkspaceRoles } from "constants/workspace";
import { EUserProjectRoles } from "constants/project";

export interface IInboxFiltersStore {
  // states
  loader: boolean;
  error: any | null;
  // observables
  inboxFilters: Record<string, { filters: IInboxFilterOptions }>;
  // computed
  appliedFilters: IInboxQueryParams | null;
  // actions
  fetchInboxFilters: (workspaceSlug: string, projectId: string, inboxId: string) => Promise<IInbox>;
  updateInboxFilters: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    filters: Partial<IInboxFilterOptions>
  ) => Promise<void>;
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
      inboxFilters: observable,
      // computed
      appliedFilters: computed,
      // actions
      fetchInboxFilters: action,
      updateInboxFilters: action,
    });

    this.rootStore = _rootStore;
    this.inboxService = new InboxService();
  }

  get appliedFilters(): IInboxQueryParams | null {
    const inboxId = this.rootStore.app.router.inboxId;

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
        set(this.inboxFilters, [inboxId], issuesResponse.view_props);
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
        set(this.inboxFilters, [inboxId], newViewProps);
      });

      const userRole = this.rootStore.user.membership?.currentProjectRole || EUserProjectRoles.GUEST;
      if (userRole > EUserWorkspaceRoles.VIEWER)
        await this.inboxService.patchInbox(workspaceSlug, projectId, inboxId, { view_props: newViewProps });
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      this.fetchInboxFilters(workspaceSlug, projectId, inboxId);

      throw error;
    }
  };
}
