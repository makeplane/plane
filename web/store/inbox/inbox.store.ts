import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { set } from "lodash";
// services
import { InboxService } from "services/inbox.service";
// types
import { RootStore } from "store/root.store";
import { IInbox } from "types";

export interface IInboxStore {
  // states
  loader: boolean;
  error: any | null;
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
  // actions
  fetchInboxesList: (workspaceSlug: string, projectId: string) => Promise<IInbox[]>;
  fetchInboxDetails: (workspaceSlug: string, projectId: string, inboxId: string) => Promise<IInbox>;
}

export class InboxStore implements IInboxStore {
  // states
  loader: boolean = false;
  error: any | null = null;
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
      // states
      loader: observable.ref,
      error: observable.ref,
      // observables
      inboxesList: observable,
      inboxDetails: observable,
      // computed
      isInboxEnabled: computed,
      // computed actions
      getInboxId: action,
      // actions
      fetchInboxesList: action,
    });

    // root store
    this.rootStore = _rootStore;
    // services
    this.inboxService = new InboxService();
  }

  get isInboxEnabled() {
    const projectId = this.rootStore.app.router.projectId;

    if (!projectId) return false;

    const projectDetails = this.rootStore.projectRoot.project.currentProjectDetails;

    if (!projectDetails) return false;

    return projectDetails.inbox_view;
  }

  getInboxId = (projectId: string) => {
    const projectDetails = this.rootStore.projectRoot.project.getProjectById(projectId);

    if (!projectDetails || !projectDetails.inbox_view) return null;

    return this.inboxesList[projectId]?.[0]?.id ?? null;
  };

  fetchInboxesList = async (workspaceSlug: string, projectId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const inboxesResponse = await this.inboxService.getInboxes(workspaceSlug, projectId);

      runInAction(() => {
        this.loader = false;
        set(this.inboxesList, projectId, inboxesResponse);
      });

      return inboxesResponse;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  fetchInboxDetails = async (workspaceSlug: string, projectId: string, inboxId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const inboxDetailsResponse = await this.inboxService.getInboxById(workspaceSlug, projectId, inboxId);

      runInAction(() => {
        this.loader = false;
        set(this.inboxDetails, inboxId, inboxDetailsResponse);
      });

      return inboxDetailsResponse;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };
}
