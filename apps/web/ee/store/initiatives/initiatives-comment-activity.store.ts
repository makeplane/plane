import { find, pull, set } from "lodash";
import concat from "lodash/concat";
import sortBy from "lodash/sortBy";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// PLane-web
import { EActivityFilterType } from "@plane/constants";
import { TIssueCommentReaction, TIssueCommentReactionIdMap, TIssueCommentReactionMap } from "@plane/types";
import { groupReactions } from "@plane/utils";
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
  // observables
  commentReactions: TIssueCommentReactionIdMap;
  commentReactionMap: TIssueCommentReactionMap;

  getCommentReactionsByCommentId: (commentId: string) => { [reaction: string]: string[] } | undefined;
  getCommentReactionById: (reactionId: string) => TIssueCommentReaction | undefined;
  commentReactionsByUser: (commentId: string, userId: string) => TIssueCommentReaction[];

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
  commentReactions: TIssueCommentReactionIdMap = {};
  commentReactionMap: TIssueCommentReactionMap = {};
  initiativeCommentsMap: Record<string, TInitiativeComment[]> = {};
  initiativeActivityMap: Record<string, TInitiativeActivity[]> = {};

  initiativeStore: InitiativeStore;

  constructor(_initiativeStore: InitiativeStore) {
    makeObservable(this, {
      // observables
      commentReactions: observable,
      commentReactionMap: observable,
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

  // helper methods
  getCommentReactionsByCommentId = (commentId: string) => {
    if (!commentId) return undefined;
    return this.commentReactions[commentId] ?? undefined;
  };

  getCommentReactionById = (reactionId: string) => {
    if (!reactionId) return undefined;
    return this.commentReactionMap[reactionId] ?? undefined;
  };

  commentReactionsByUser = (commentId: string, userId: string) => {
    if (!commentId || !userId) return [];

    const reactions = this.getCommentReactionsByCommentId(commentId);
    if (!reactions) return [];

    const _userReactions: TIssueCommentReaction[] = [];
    Object.keys(reactions).forEach((reaction) => {
      if (reactions?.[reaction])
        reactions?.[reaction].map((reactionId) => {
          const currentReaction = this.getCommentReactionById(reactionId);
          if (currentReaction && currentReaction.actor === userId) _userReactions.push(currentReaction);
        });
    });

    return _userReactions;
  };

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

        response.map((comment) => {
          const groupedReactions = groupReactions(comment.comment_reactions || [], "reaction");

          const commentReactionIdsMap: { [reaction: string]: string[] } = {};

          Object.keys(groupedReactions).map((reactionId) => {
            const reactionIds = (groupedReactions[reactionId] || []).map((reaction) => reaction.id);
            commentReactionIdsMap[reactionId] = reactionIds;
          });

          runInAction(() => {
            set(this.commentReactions, comment.id, commentReactionIdsMap);
            (comment.comment_reactions || []).forEach((reaction) =>
              set(this.commentReactionMap, reaction.id, reaction)
            );
          });
        });
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
      const response = await this.initiativeStore.initiativeService.updateInitiativeComment(
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

        this.initiativeCommentsMap[initiativeId][initiativeCommentIndex] = { ...initiativeComment, ...response };
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

        update(this.initiativeCommentsMap, [initiativeId], (comments: TInitiativeComment[]) =>
          comments.filter((comment) => comment.id !== commentId)
        );
      });
    } catch (e) {
      console.log("error while updating initiative Comment", e);
      throw e;
    }
  };

  fetchActivities = async (workspaceSlug: string, initiativeId: string) => {
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

        // Find if the activity already exists
        const updatedActivities = currentActivities.map((activity: TInitiativeActivity) => {
          const matchingNewActivity = activities.find((newActivity) => newActivity.id === activity.id);
          if (matchingNewActivity) {
            // Update existing activity with new updated_at
            return {
              ...activity,
              created_at: matchingNewActivity.created_at,
            };
          }
          return activity;
        });

        // Add any new activities that don't exist yet
        const existingIds = new Set(updatedActivities.map((activity: TInitiativeActivity) => activity.id));
        const newActivities = activities.filter((activity) => !existingIds.has(activity.id));

        return uniq([...updatedActivities, ...newActivities]);
      });
    });

    return activities;
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

      if (!this.commentReactions[commentId]) this.commentReactions[commentId] = {};
      runInAction(() => {
        update(this.commentReactions, `${commentId}.${payload.reaction}`, (reactionId) => {
          if (!reactionId) return [response.id];
          return concat(reactionId, response.id);
        });
        set(this.commentReactionMap, response.id, response);
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
    userId: string,
    reactionEmoji: string
  ): Promise<void> => {
    try {
      const userReactions = this.commentReactionsByUser(commentId, userId);
      const currentReaction = find(userReactions, { actor: userId, reaction: reactionEmoji });

      if (currentReaction && currentReaction.id) {
        runInAction(() => {
          pull(this.commentReactions[commentId][reactionEmoji], currentReaction.id);
          delete this.commentReactionMap[reactionEmoji];
        });
      }

      await this.initiativeStore.initiativeService.deleteInitiativeCommentReaction(
        workspaceSlug,
        initiativeId,
        commentId,
        reactionEmoji
      );
    } catch (error) {
      throw error;
    }
  };
}
