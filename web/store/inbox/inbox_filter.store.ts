import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { set } from "lodash";
// services
import { InboxService } from "services/inbox.service";
// types
import { RootStore } from "store/root.store";
import { IInbox, IInboxFilterOptions, IInboxQueryParams } from "@plane/types";
import { EUserWorkspaceRoles } from "constants/workspace";
import { EUserProjectRoles } from "constants/project";

export interface IInboxFiltersStore {
  // observables
  inboxFilters: Record<string, { filters: IInboxFilterOptions }>;
  // computed
  appliedFilters: IInboxQueryParams | null;
  // fetch action
  fetchInboxFilters: (workspaceSlug: string, projectId: string, inboxId: string) => Promise<IInbox>;
  // update action
  updateInboxFilters: (
    workspaceSlug: string,
    projectId: string,
    inboxId: string,
    filters: Partial<IInboxFilterOptions>
  ) => Promise<void>;
}

export class InboxFiltersStore implements IInboxFiltersStore {
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
      // observables
      inboxFilters: observable,
      // computed
      appliedFilters: computed,
      // fetch action
      fetchInboxFilters: action,
      // update action
      updateInboxFilters: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.inboxService = new InboxService();
  }

  /**
   * Returns applied filters to specific inbox
   */
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

  /**
   * Fetches filters of a specific inbox and adds it to the store
   * @param workspaceSlug
   * @param projectId
   * @param inboxId
   * @returns Promise<IInbox[]>
   *
   */
  fetchInboxFilters = async (workspaceSlug: string, projectId: string, inboxId: string) => {
    return await this.inboxService.getInboxById(workspaceSlug, projectId, inboxId).then((issuesResponse) => {
      runInAction(() => {
        set(this.inboxFilters, [inboxId], issuesResponse.view_props);
      });
      return issuesResponse;
    });
  };

  /**
   * Updates filters of a specific inbox and updates it in the store
   * @param workspaceSlug
   * @param projectId
   * @param inboxId
   * @param filters
   * @returns Promise<void>
   *
   */
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
    const userRole = this.rootStore.user.membership?.currentProjectRole || EUserProjectRoles.GUEST;
    if (userRole > EUserWorkspaceRoles.VIEWER)
      await this.inboxService
        .patchInbox(workspaceSlug, projectId, inboxId, { view_props: newViewProps })
        .then((response) => {
          runInAction(() => {
            set(this.inboxFilters, [inboxId], newViewProps);
          });
          return response;
        });
  };
}
