import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { computedFn } from "mobx-utils";
import { set } from "lodash";
// services
import { InboxService } from "services/inbox.service";
// types
import { RootStore } from "store/root.store";
import { IInbox } from "@plane/types";

export interface IInboxStore {
  // observables
  inboxesList: {
    [projectId: string]: IInbox[];
  };
  inboxDetails: {
    [inboxId: string]: IInbox;
  };
  // computed
  isInboxEnabled: boolean;
  // computed actions
  getInboxId: (projectId: string) => string | null;
  // fetch actions
  fetchInboxesList: (workspaceSlug: string, projectId: string) => Promise<IInbox[]>;
  fetchInboxDetails: (workspaceSlug: string, projectId: string, inboxId: string) => Promise<IInbox>;
}

export class InboxStore implements IInboxStore {
  // observables
  inboxesList: {
    [projectId: string]: IInbox[];
  } = {};
  inboxDetails: {
    [inboxId: string]: IInbox;
  } = {};
  // root store
  rootStore;
  // services
  inboxService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      inboxesList: observable,
      inboxDetails: observable,
      // computed
      isInboxEnabled: computed,
      // actions
      fetchInboxesList: action,
    });

    // root store
    this.rootStore = _rootStore;
    // services
    this.inboxService = new InboxService();
  }

  /**
   * Returns true if inbox is enabled for current project
   */
  get isInboxEnabled() {
    const projectId = this.rootStore.app.router.projectId;
    if (!projectId) return false;
    const projectDetails = this.rootStore.projectRoot.project.currentProjectDetails;
    if (!projectDetails) return false;
    return projectDetails.inbox_view;
  }

  /**
   * Returns the inbox Id belongs to a specific project
   */
  getInboxId = computedFn((projectId: string) => {
    const projectDetails = this.rootStore.projectRoot.project.getProjectById(projectId);
    if (!projectDetails || !projectDetails.inbox_view) return null;
    return this.inboxesList[projectId]?.[0]?.id ?? null;
  });

  /**
   * Fetches the inboxes list belongs to a specific project
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IInbox[]>
   */
  fetchInboxesList = async (workspaceSlug: string, projectId: string) => {
    return await this.inboxService.getInboxes(workspaceSlug, projectId).then((inboxes) => {
      runInAction(() => {
        set(this.inboxesList, projectId, inboxes);
      });
      return inboxes;
    });
  };

  /**
   * Fetches the inbox details belongs to a specific inbox
   * @param workspaceSlug
   * @param projectId
   * @param inboxId
   * @returns Promise<IInbox>
   */
  fetchInboxDetails = async (workspaceSlug: string, projectId: string, inboxId: string) => {
    return await this.inboxService.getInboxById(workspaceSlug, projectId, inboxId).then((inboxDetailsResponse) => {
      runInAction(() => {
        set(this.inboxDetails, inboxId, inboxDetailsResponse);
      });
      return inboxDetailsResponse;
    });
  };
}
