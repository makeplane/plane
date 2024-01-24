import { observable, action, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import set from "lodash/set";
import update from "lodash/update";
import concat from "lodash/concat";
import uniq from "lodash/uniq";
// services
import { InboxService } from "services/inbox/inbox.service";
// types
import { RootStore } from "store/root.store";
import { TInboxDetailMap, TInboxDetailIdMap, TInbox } from "@plane/types";

export interface IInbox {
  // observables
  inboxes: TInboxDetailIdMap;
  inboxMap: TInboxDetailMap;
  // helper methods
  getInboxesByProjectId: (projectId: string) => string[] | undefined;
  getInboxById: (inboxId: string) => TInbox | undefined;
  // fetch actions
  fetchInboxes: (workspaceSlug: string, projectId: string) => Promise<TInbox[]>;
  fetchInboxById: (workspaceSlug: string, projectId: string, inboxId: string) => Promise<TInbox>;
  updateInbox: (workspaceSlug: string, projectId: string, inboxId: string, data: Partial<TInbox>) => Promise<TInbox>;
}

export class Inbox implements IInbox {
  // observables
  inboxes: TInboxDetailIdMap = {};
  inboxMap: TInboxDetailMap = {};
  // root store
  rootStore;
  // services
  inboxService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      inboxMap: observable,
      inboxes: observable,
      // actions
      fetchInboxes: action,
      fetchInboxById: action,
      updateInbox: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.inboxService = new InboxService();
  }

  // helper methods
  getInboxesByProjectId = computedFn((projectId: string) => {
    if (!projectId) return undefined;
    return this.inboxes?.[projectId] ?? undefined;
  });

  getInboxById = computedFn((inboxId: string) => {
    if (!inboxId) return undefined;
    return this.inboxMap[inboxId] ?? undefined;
  });

  // actions
  fetchInboxes = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = await this.inboxService.fetchInboxes(workspaceSlug, projectId);

      const _inboxIds = response.map((inbox) => inbox.id);
      runInAction(() => {
        response.forEach((inbox) => {
          set(this.inboxMap, inbox.id, inbox);
        });
        set(this.inboxes, projectId, _inboxIds);
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  fetchInboxById = async (workspaceSlug: string, projectId: string, inboxId: string) => {
    try {
      const response = await this.inboxService.fetchInboxById(workspaceSlug, projectId, inboxId);

      runInAction(() => {
        set(this.inboxMap, inboxId, response);
        update(this.inboxes, projectId, (inboxIds: string[] = []) => {
          if (inboxIds.includes(inboxId)) return inboxIds;
          return uniq(concat(inboxIds, inboxId));
        });
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateInbox = async (workspaceSlug: string, projectId: string, inboxId: string, data: Partial<TInbox>) => {
    try {
      const response = await this.inboxService.updateInbox(workspaceSlug, projectId, inboxId, data);

      runInAction(() => {
        Object.keys(response).forEach((key) => {
          set(this.inboxMap, [inboxId, key], response[key as keyof TInbox]);
        });
      });

      return response;
    } catch (error) {
      throw error;
    }
  };
}
