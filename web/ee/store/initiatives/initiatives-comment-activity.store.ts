import concat from "lodash/concat";
import sortBy from "lodash/sortBy";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// PLane-web
import { EActivityFilterType } from "@/plane-web/constants";
import {
  TInitiativeComment,
  TInitiativeReaction,
  TInitiativeActivity,
  TInitiativeActivityComment,
} from "@/plane-web/types/initiative";
//
import { InitiativeStore } from "./initiatives.store";

export interface IInitiativeCommentActivityStore {
  initiativeCommentsMap: Record<string, TInitiativeComment[]>;
  initiativeActivityMap: Record<string, TInitiativeActivity[]>;

  getInitiativeComments: (initiativeId: string) => TInitiativeComment[] | undefined;
  getActivityCommentByIssueId: (initiativeId: string) => TInitiativeActivityComment[] | undefined;

  fetchInitiativeComments: (workspaceSlug: string, initiativeId: string) => Promise<TInitiativeComment[]>;
  createInitiativeComment: (
    workspaceSlug: string,
    initiativeId: string,
    payload: Partial<TInitiativeComment>
  ) => Promise<TInitiativeComment>;
  updateInitiativeComment: (
    workspaceSlug: string,
    initiativeId: string,
    commentId: string,
    payload: Partial<TInitiativeComment>
  ) => Promise<void>;
  deleteInitiativeComment: (workspaceSlug: string, initiativeId: string, commentId: string) => Promise<void>;

  fetchActivities: (workspaceSlug: string, initiativeId: string) => Promise<TInitiativeActivity[]>;

  addCommentReaction: (
    workspaceSlug: string,
    initiativeId: string,
    commentId: string,
    payload: Partial<TInitiativeReaction>
  ) => Promise<TInitiativeReaction>;
  deleteCommentReaction: (
    workspaceSlug: string,
    initiativeId: string,
    commentId: string,
    reactionId: string,
    reactionEmoji: string
  ) => Promise<void>;
}

export class InitiativeCommentActivityStore implements IInitiativeCommentActivityStore {
  initiativeCommentsMap: Record<string, TInitiativeComment[]> = {};
  initiativeActivityMap: Record<string, TInitiativeActivity[]> = {};

  initiativeStore: InitiativeStore;

  constructor(_initiativeStore: InitiativeStore) {
    makeObservable(this, {
      // observables
      initiativeCommentsMap: observable,
      initiativeActivityMap: observable,
      // actions
      getInitiativeComments: action,
      createInitiativeComment: action,
      updateInitiativeComment: action,
      deleteInitiativeComment: action,
      fetchActivities: action,
      addCommentReaction: action,
      deleteCommentReaction: action,
    });

    this.initiativeStore = _initiativeStore;
  }

  getInitiativeComments = computedFn((initiativeId: string) => this.initiativeCommentsMap[initiativeId]);

  getActivityCommentByIssueId = computedFn((initiativeId: string) => {
    if (!initiativeId) return undefined;

    let activityComments: TInitiativeActivityComment[] = [];

    const activities = this.initiativeActivityMap[initiativeId] || [];
    const comments = this.initiativeCommentsMap[initiativeId] || [];

    activities.forEach((activity) => {
      if (!activity) return;
      activityComments.push({
        id: activity.id,
        activity_type: EActivityFilterType.ACTIVITY,
        created_at: activity.created_at,
        detail: activity,
      });
    });

    comments.forEach((comment) => {
      if (!comment) return;
      activityComments.push({
        id: comment.id,
        activity_type: EActivityFilterType.COMMENT,
        created_at: comment.created_at,
        detail: comment,
      });
    });

    activityComments = sortBy(activityComments, "created_at");

    return activityComments;
  });

  async fetchInitiativeComments(workspaceSlug: string, initiativeId: string): Promise<TInitiativeComment[]> {
    try {
      const response = await this.initiativeStore.initiativeService.getInitiativeComments(workspaceSlug, initiativeId);

      runInAction(() => {
        this.initiativeCommentsMap[initiativeId] = response;
      });

      return response;
    } catch (e) {
      console.log("error while fetching initiative comments", e);
      throw e;
    }
  }

  createInitiativeComment = async (
    workspaceSlug: string,
    initiativeId: string,
    payload: Partial<TInitiativeComment>
  ): Promise<TInitiativeComment> => {
    try {
      const response = await this.initiativeStore.initiativeService.createInitiativeComment(
        workspaceSlug,
        initiativeId,
        payload
      );

      runInAction(() => {
        if (!this.initiativeCommentsMap[initiativeId] || !Array.isArray(this.initiativeCommentsMap[initiativeId]))
          this.initiativeCommentsMap[initiativeId] = [];
        this.initiativeCommentsMap[initiativeId].push(response);
      });

      return response;
    } catch (e) {
      console.log("error while creating initiative comment", e);
      throw e;
    }
  };

  updateInitiativeComment = async (
    workspaceSlug: string,
    initiativeId: string,
    commentId: string,
    payload: Partial<TInitiativeComment>
  ): Promise<void> => {
    try {
      await this.initiativeStore.initiativeService.updateInitiativeComment(
        workspaceSlug,
        initiativeId,
        commentId,
        payload
      );

      runInAction(() => {
        if (!this.initiativeCommentsMap[initiativeId] || !Array.isArray(this.initiativeCommentsMap[initiativeId]))
          return;

        const initiativeCommentIndex = this.initiativeCommentsMap[initiativeId].findIndex(
          (initiativeComment) => initiativeComment.id === commentId
        );

        if (initiativeCommentIndex < 0) return;

        const initiativeComment = this.initiativeCommentsMap[initiativeId][initiativeCommentIndex];

        this.initiativeCommentsMap[initiativeId][initiativeCommentIndex] = { ...initiativeComment, ...payload };
      });
    } catch (e) {
      console.log("error while updating initiative Comment", e);
      throw e;
    }
  };

  deleteInitiativeComment = async (workspaceSlug: string, initiativeId: string, commentId: string): Promise<void> => {
    try {
      await this.initiativeStore.initiativeService.deleteInitiativeComment(workspaceSlug, initiativeId, commentId);

      runInAction(() => {
        if (!this.initiativeCommentsMap[initiativeId] || !Array.isArray(this.initiativeCommentsMap[initiativeId]))
          return;

        update(this.initiativeCommentsMap, [initiativeId], (comments: TInitiativeComment[]) => comments.filter((comment) => comment.id !== commentId));
      });
    } catch (e) {
      console.log("error while updating initiative Comment", e);
      throw e;
    }
  };

  fetchActivities = async (workspaceSlug: string, initiativeId: string) => {
    try {
      let props = {};
      const currentActivities = this.initiativeActivityMap[initiativeId];
      if (currentActivities && currentActivities.length > 0) {
        const currentActivity = currentActivities[currentActivities.length - 1];
        if (currentActivity) props = { created_at__gt: currentActivity.created_at };
      }

      const activities = await this.initiativeStore.initiativeService.getInitiativeActivities(
        workspaceSlug,
        initiativeId,
        props
      );

      runInAction(() => {
        update(this.initiativeActivityMap, initiativeId, (currentActivities) => {
          if (!currentActivities) return activities;
          return uniq(concat(currentActivities, activities));
        });
      });

      return activities;
    } catch (error) {
      throw error;
    }
  };

  addCommentReaction = async (
    workspaceSlug: string,
    initiativeId: string,
    commentId: string,
    payload: Partial<TInitiativeReaction>
  ): Promise<TInitiativeReaction> => {
    try {
      const response = await this.initiativeStore.initiativeService.createInitiativeCommentReaction(
        workspaceSlug,
        initiativeId,
        commentId,
        payload
      );

      runInAction(() => {
        if (!this.initiativeCommentsMap[initiativeId] || !Array.isArray(this.initiativeCommentsMap[initiativeId]))
          return;

        const initiativeCommentIndex = this.initiativeCommentsMap[initiativeId].findIndex(
          (initiativeComment) => initiativeComment.id === commentId
        );

        if (initiativeCommentIndex < 0) return;

        const initiativeComment = this.initiativeCommentsMap[initiativeId][initiativeCommentIndex];

        if (!initiativeComment.comment_reactions || !Array.isArray(initiativeComment.comment_reactions))
          initiativeComment.comment_reactions = [];

        initiativeComment.comment_reactions.push(response);
      });
      return response;
    } catch (e) {
      console.error("error while adding reaction to initiative comment", e);
      throw e;
    }
  };

  deleteCommentReaction = async (
    workspaceSlug: string,
    initiativeId: string,
    commentId: string,
    reactionId: string,
    reactionEmoji: string
  ): Promise<void> => {
    try {
      await this.initiativeStore.initiativeService.deleteInitiativeCommentReaction(
        workspaceSlug,
        initiativeId,
        commentId,
        reactionEmoji
      );

      runInAction(() => {
        if (!this.initiativeCommentsMap[initiativeId] || !Array.isArray(this.initiativeCommentsMap[initiativeId]))
          return;

        const initiativeCommentIndex = this.initiativeCommentsMap[initiativeId].findIndex(
          (initiativeComment) => initiativeComment.id === commentId
        );

        if (initiativeCommentIndex < 0) return;

        const initiativeComment = this.initiativeCommentsMap[initiativeId][initiativeCommentIndex];

        if (!initiativeComment.comment_reactions || !Array.isArray(initiativeComment.comment_reactions)) return;

        update(
          this.initiativeCommentsMap[initiativeId][initiativeCommentIndex],
          ["comment_reactions"],
          (reactions: TInitiativeReaction[]) => reactions.filter((reaction) => reaction.id !== reactionId)
        );
      });
    } catch (e) {
      console.error("error while deleting reaction to initiative Comment", e);
      throw e;
    }
  };
}
