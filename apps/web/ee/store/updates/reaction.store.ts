import concat from "lodash/concat";
import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
// services
// types
// helpers
import { TUpdateReaction } from "@plane/types";
import { groupReactions  } from "@plane/utils";

export interface IUpdatesReactionStore {
  // observables
  updateReactions: Record<string, TUpdateReaction[]>;
  // helper methods
  addReactions: (updateId: string, reactions: TUpdateReaction[]) => void;
  getUpdateReactionsByUpdateId: (updateId: string) => { [key: string]: TUpdateReaction[] } | undefined;
  getReactionsByUpdateId: (updateId: string) => TUpdateReaction[] | undefined;
  getReactionById: (reactionId: string) => TUpdateReaction | undefined;
  reactionsByUser: (updateId: string, userId: string) => TUpdateReaction[];
  createReaction: (
    callbackFn: () => Promise<TUpdateReaction>,
    updateId: string,
    reaction: string
  ) => Promise<TUpdateReaction>;
  removeReaction: (
    callbackFn: () => Promise<void>,
    updateId: string,
    reaction: string,
    userId: string
  ) => Promise<void>;
}

export class UpdatesReactionStore implements IUpdatesReactionStore {
  // observables
  updateReactions: Record<string, TUpdateReaction[]> = {};
  reactionMap: Record<string, TUpdateReaction> = {};

  constructor() {
    makeObservable(this, {
      // observables
      updateReactions: observable,
    });
  }

  // helper methods
  addReactions = (updateId: string, reactions: TUpdateReaction[]) => {
    runInAction(() => {
      this.updateReactions[updateId] = [...reactions];
      this.updateReactions[updateId].forEach((reaction) => {
        set(this.reactionMap, reaction.id, reaction);
      });
    });
  };

  getReactionsByUpdateId = (updateId: string) => {
    if (!updateId) return undefined;
    return this.updateReactions[updateId] ?? undefined;
  };

  getReactionById = (reactionId: string) => {
    if (!reactionId) return undefined;
    return this.reactionMap[reactionId] ?? undefined;
  };

  reactionsByUser = (updateId: string, userId: string) => {
    if (!updateId || !userId) return [];

    const reactions = this.getUpdateReactionsByUpdateId(updateId);
    if (!reactions) return [];

    const _userReactions: TUpdateReaction[] = [];
    Object.keys(reactions).forEach((reaction: string) => {
      if (reactions?.[reaction])
        reactions?.[reaction].map((_reaction) => {
          if (_reaction && _reaction.actor === userId) _userReactions.push(_reaction);
        });
    });

    return _userReactions;
  };

  getUpdateReactionsByUpdateId = (updateId: string) => {
    if (!updateId) return undefined;
    if (this.updateReactions[updateId]) return groupReactions(this.updateReactions[updateId] || [], "reaction");
    else return undefined;
  };

  // actions
  public createReaction = action(
    async (callbackFn: () => Promise<TUpdateReaction>, updateId: string, reaction: string) => {
      const response = await callbackFn();
      runInAction(() => {
        if (!this.updateReactions[updateId]) this.updateReactions[updateId] = [response];
        else this.updateReactions[updateId] = concat(this.updateReactions[updateId], response);
      });

      return response;
    }
  );

  public removeReaction = action(
    async (callbackFn: () => Promise<void>, updateId: string, reaction: string, userId: string) => {
      const initialState = this.updateReactions[updateId];
      const index = this.updateReactions[updateId].findIndex(
        (_reaction) => _reaction.reaction === reaction && _reaction.actor === userId
      );
      try {
        runInAction(() => {
          this.updateReactions[updateId].splice(index, 1);
        });

        const response = await callbackFn();

        return response;
      } catch (error) {
        this.updateReactions[updateId] = initialState;
        throw error;
      }
    }
  );
}
