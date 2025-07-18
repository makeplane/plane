import concat from "lodash/concat";
import set from "lodash/set";
import { makeObservable, observable, runInAction } from "mobx";
// services
// types
// helpers
import { groupReactions } from "@plane/utils";
import { ProjectUpdateReactionService } from "@/plane-web/services/project/project_update_reaction.service";
import { TProjectUpdateReaction } from "@/plane-web/types";

export interface IProjectUpdatesReactionStore {
  // observables
  updateReactions: Record<string, TProjectUpdateReaction[]>;
  // helper methods
  addReactions: (updateId: string, reactions: TProjectUpdateReaction[]) => void;
  createUpdateReaction: (
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    reaction: string
  ) => Promise<TProjectUpdateReaction>;
  getUpdateReactionsByUpdateId: (updateId: string) => { [key: string]: TProjectUpdateReaction[] } | undefined;
  getReactionsByUpdateId: (updateId: string) => TProjectUpdateReaction[] | undefined;
  getReactionById: (reactionId: string) => TProjectUpdateReaction | undefined;
  reactionsByUser: (updateId: string, userId: string) => TProjectUpdateReaction[];
  removeUpdateReaction: (
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    reaction: string,
    userId: string
  ) => Promise<TProjectUpdateReaction>;
}

export class ProjectUpdatesReactionStore implements IProjectUpdatesReactionStore {
  // observables
  updateReactions: Record<string, TProjectUpdateReaction[]> = {};
  reactionMap: Record<string, TProjectUpdateReaction> = {};
  // services
  reactionService;

  constructor() {
    makeObservable(this, {
      // observables
      updateReactions: observable,
    });

    // services
    this.reactionService = new ProjectUpdateReactionService();
  }

  // helper methods
  addReactions = (updateId: string, reactions: TProjectUpdateReaction[]) => {
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

    const _userReactions: TProjectUpdateReaction[] = [];
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

  // reactions
  createUpdateReaction = async (workspaceSlug: string, projectId: string, updateId: string, reaction: string) => {
    const response = await this.reactionService.createUpdateReaction(workspaceSlug, projectId, updateId, {
      reaction,
    });

    runInAction(() => {
      this.updateReactions[updateId] = concat(this.updateReactions[updateId], response);
    });

    return response;
  };

  removeUpdateReaction = async (
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    reaction: string,
    userId: string
  ) => {
    const initialState = this.updateReactions[updateId];
    const index = this.updateReactions[updateId].findIndex(
      (_reaction) => _reaction.reaction === reaction && _reaction.actor === userId
    );
    try {
      runInAction(() => {
        this.updateReactions[updateId].splice(index, 1);
      });

      const response = await this.reactionService.deleteUpdateReaction(workspaceSlug, projectId, updateId, reaction);

      return response;
    } catch (error) {
      this.updateReactions[updateId] = initialState;
      throw error;
    }
  };
}
