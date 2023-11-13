import { observable, action, makeObservable, runInAction, computed } from "mobx";
// types
import { RootStore } from "../root";
// services
import { InboxService } from "services/inbox.service";
// types
import { IInbox } from "types";

export interface IInboxStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
  inboxId: string | null;

  inboxesList: {
    [projectId: string]: IInbox[];
  };
  inboxDetails: {
    [inboxId: string]: IInbox;
  };

  // actions
  setInboxId: (inboxId: string | null) => void;

  getInboxId: (projectId: string) => string | null;

  fetchInboxesList: (workspaceSlug: string, projectId: string) => Promise<IInbox[]>;
  fetchInboxDetails: (workspaceSlug: string, projectId: string, inboxId: string) => Promise<IInbox>;

  // computed
  isInboxEnabled: boolean;
}

export class InboxStore implements IInboxStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
  inboxId: string | null = null;

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
      inboxId: observable.ref,

      inboxesList: observable.ref,
      inboxDetails: observable.ref,

      // actions
      setInboxId: action,

      fetchInboxesList: action,
      getInboxId: action,

      // computed
      isInboxEnabled: computed,
    });

    this.rootStore = _rootStore;
    this.inboxService = new InboxService();
  }

  get isInboxEnabled() {
    const projectId = this.rootStore.project.projectId;

    if (!projectId) return false;

    const projectDetails = this.rootStore.project.project_details[projectId];

    if (!projectDetails) return false;

    return projectDetails.inbox_view;
  }

  getInboxId = (projectId: string) => {
    const projectDetails = this.rootStore.project.project_details[projectId];

    if (!projectDetails || !projectDetails.inbox_view) return null;

    return this.inboxesList[projectId]?.[0]?.id ?? null;
  };

  setInboxId = (inboxId: string | null) => {
    runInAction(() => {
      this.inboxId = inboxId;
    });
  };

  fetchInboxesList = async (workspaceSlug: string, projectId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const inboxesResponse = await this.inboxService.getInboxes(workspaceSlug, projectId);

      runInAction(() => {
        this.loader = false;
        this.inboxesList = {
          ...this.inboxesList,
          [projectId]: inboxesResponse,
        };
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
        this.inboxDetails = {
          ...this.inboxDetails,
          [inboxId]: inboxDetailsResponse,
        };
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
