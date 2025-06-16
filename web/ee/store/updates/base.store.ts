import { update } from "lodash";
import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
// services
import { TUpdate, TUpdateComment, TUpdateReaction } from "@plane/types";
// types
import { IUpdateCommentStore, UpdateCommentStore } from "./comment.store";
import { IUpdatesReactionStore, UpdatesReactionStore } from "./reaction.store";

export interface IUpdateStoreActions {
  fetch: (callbackFn: () => Promise<TUpdate[]>, entityId: string) => Promise<TUpdate[]>;
  create: (callbackFn: () => Promise<TUpdate>, entity: string) => Promise<TUpdate>;
  patch: (callbackFn: () => Promise<void>, updateId: string, data: Partial<TUpdate>) => Promise<void>;
  remove: (callbackFn: () => Promise<void>, entityId: string, updateId: string) => Promise<void>;
  createComment: (callbackFn: () => Promise<TUpdateComment>, updateId: string) => Promise<void>;
  removeComment: (callbackFn: () => Promise<void>, updateId: string, commentId: string) => Promise<void>;
}

export interface IUpdateStore extends IUpdateStoreActions {
  // observables
  loader: boolean;
  updates: Record<string, string[]>;
  updatesMap: Record<string, TUpdate>;
  reactions: IUpdatesReactionStore;
  comments: IUpdateCommentStore;
  deleteModalId: string | null;
  // helper methods
  getUpdatesByEntityId: (entityId: string) => string[] | undefined;
  getUpdateById: (updateId: string) => TUpdate | undefined;
  setDeleteModalId: (updateId: string | null) => void;
}

export class UpdateStore implements IUpdateStore {
  // observables
  loader: boolean = true;
  updates: Record<string, string[]> = {};
  updatesMap: Record<string, TUpdate> = {};
  reactionMap: Record<string, TUpdateReaction> = {};
  deleteModalId: string | null = null;
  // root store
  reactions: IUpdatesReactionStore;
  comments: IUpdateCommentStore;

  constructor() {
    makeObservable(this, {
      // observables
      loader: observable,
      updates: observable,
      updatesMap: observable,
      deleteModalId: observable,
      // actions
      setDeleteModalId: action,
    });

    this.reactions = new UpdatesReactionStore();
    this.comments = new UpdateCommentStore(this.reactions);
  }

  // helper methods
  getUpdatesByEntityId = (entityId: string) => {
    if (!entityId) return undefined;
    return this.updates[entityId] ?? undefined;
  };

  getUpdateById = (updateId: string) => {
    if (!updateId) return undefined;
    return this.updatesMap[updateId] ?? undefined;
  };

  addUpdates = (entityId: string, updates: TUpdate[]) => {
    runInAction(() => {
      this.updates[entityId] = updates.map((update) => update.id);
      updates.forEach((update) => {
        set(this.updatesMap, update.id, update);
        this.reactions.addReactions(update.id, update.update_reactions);
      });
    });
  };

  setDeleteModalId = (updateId: string | null) => {
    this.deleteModalId = updateId;
  };

  public fetch = action(async (callbackFn: () => Promise<TUpdate[]>, entityId: string) => {
    const response = await callbackFn();
    this.addUpdates(entityId, response);
    this.loader = false;

    return response;
  });

  public create = action(async (callbackFn: () => Promise<TUpdate>, entity: string) => {
    const response = await callbackFn();
    runInAction(() => {
      this.updates[entity] = [response.id, ...this.updates[entity]];
      set(this.updatesMap, response.id, response);
    });

    return response;
  });

  public patch = action(async (callbackFn: () => Promise<void>, updateId: string, data: Partial<TUpdate>) => {
    runInAction(() => {
      Object.keys(data).forEach((key) => {
        set(this.updatesMap, [updateId, key], data[key as keyof TUpdate]);
      });
    });
    await callbackFn();
  });

  public remove = action(async (callbackFn: () => Promise<void>, entityId: string, updateId: string) => {
    await callbackFn();

    const updateIndex = this.updates[entityId].findIndex((_update) => _update === updateId);
    if (updateIndex >= 0)
      runInAction(() => {
        this.updates[entityId].splice(updateIndex, 1);
        delete this.updatesMap[updateId];
      });
  });

  createComment = action(async (callbackFn: () => Promise<TUpdateComment>, updateId: string) => {
    try {
      update(this.updatesMap, [updateId, "comments_count"], (prev: number) => prev + 1);
      await this.comments.createComment(callbackFn, updateId);
    } catch (error) {
      console.error(error);
      update(this.updatesMap, [updateId, "comments_count"], (prev: number) => prev - 1);
      throw error;
    }
  });

  removeComment = action(async (callbackFn: () => Promise<void>, updateId: string, commentId: string) => {
    try {
      update(this.updatesMap, [updateId, "comments_count"], (prev: number) => prev - 1);
      await this.comments.removeComment(callbackFn, updateId, commentId);
    } catch (error) {
      console.error(error);
      update(this.updatesMap, [updateId, "comments_count"], (prev: number) => prev + 1);
      throw error;
    }
  });
}
