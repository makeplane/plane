import { concat, set } from "lodash-es";
import { makeObservable, observable, runInAction } from "mobx";
// plane imports
import { groupReactions } from "@plane/utils";
// services
import { ProjectReactionService } from "@/plane-web/services/project/project_reaction.service";
// types
import { TProjectReaction } from "@/plane-web/types";

export interface IProjectReactionStore {
  projectReactions: Record<string, TProjectReaction[]>;
  addReactions: (projectId: string, reactions: TProjectReaction[]) => void;
  createProjectReaction: (workspaceSlug: string, projectId: string, reaction: string) => Promise<TProjectReaction>;
  getProjectReactionsByProjectId: (projectId: string) => { [key: string]: TProjectReaction[] } | undefined;
  getReactionsByProjectId: (projectId: string) => TProjectReaction[] | undefined;
  getReactionById: (reactionId: string) => TProjectReaction | undefined;
  reactionsByUser: (projectId: string, userId: string) => TProjectReaction[];
  removeProjectReaction: (
    workspaceSlug: string,
    projectId: string,
    reaction: string,
    userId: string
  ) => Promise<TProjectReaction>;
  fetchProjectReactions: (workspaceSlug: string, projectId: string) => Promise<TProjectReaction[]>;
}

export class ProjectReactionStore implements IProjectReactionStore {
  projectReactions: Record<string, TProjectReaction[]> = {};
  reactionMap: Record<string, TProjectReaction> = {};
  reactionService;

  constructor() {
    makeObservable(this, {
      // observables
      projectReactions: observable,
    });

    // services
    this.reactionService = new ProjectReactionService();
  }

  addReactions = (projectId: string, reactions: TProjectReaction[]) => {
    runInAction(() => {
      this.projectReactions[projectId] = [...reactions];
      this.projectReactions[projectId].forEach((reaction) => {
        set(this.reactionMap, reaction.id, reaction);
      });
    });
  };

  getReactionsByProjectId = (projectId: string) => {
    if (!projectId) return undefined;
    return this.projectReactions[projectId] ?? undefined;
  };

  getReactionById = (reactionId: string) => {
    if (!reactionId) return undefined;
    return this.reactionMap[reactionId] ?? undefined;
  };

  reactionsByUser = (projectId: string, userId: string) => {
    if (!projectId || !userId) return [];

    const reactions = this.getProjectReactionsByProjectId(projectId);
    if (!reactions) return [];

    const _userReactions: TProjectReaction[] = [];
    Object.keys(reactions).forEach((reaction: string) => {
      if (reactions?.[reaction])
        reactions?.[reaction].map((_reaction) => {
          if (_reaction && _reaction.actor === userId) _userReactions.push(_reaction);
        });
    });

    return _userReactions;
  };

  getProjectReactionsByProjectId = (projectId: string) => {
    if (!projectId) return undefined;
    if (this.projectReactions[projectId]) return groupReactions(this.projectReactions[projectId] || [], "reaction");
    else return undefined;
  };

  fetchProjectReactions = async (workspaceSlug: string, projectId: string) => {
    const response = await this.reactionService.getProjectReactions(workspaceSlug, projectId);
    this.addReactions(projectId, response);
    return response;
  };

  createProjectReaction = async (workspaceSlug: string, projectId: string, reaction: string) => {
    const response = await this.reactionService.createProjectReaction(workspaceSlug, projectId, {
      reaction,
    });

    runInAction(() => {
      this.projectReactions[projectId] = concat(this.projectReactions[projectId], response);
    });

    return response;
  };

  removeProjectReaction = async (workspaceSlug: string, projectId: string, reaction: string, userId: string) => {
    const initialState = this.projectReactions[projectId];
    const index = this.projectReactions[projectId].findIndex(
      (_reaction) => _reaction.reaction === reaction && _reaction.actor === userId
    );
    try {
      runInAction(() => {
        this.projectReactions[projectId].splice(index, 1);
      });

      const response = await this.reactionService.deleteProjectReaction(workspaceSlug, projectId, reaction);

      return response;
    } catch (error) {
      this.projectReactions[projectId] = initialState;
      throw error;
    }
  };
}
