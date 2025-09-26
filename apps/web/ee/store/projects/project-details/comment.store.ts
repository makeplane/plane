import { concat, pull, set, uniq, update } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
// services
// types
import { ProjectUpdateCommentService } from "@/plane-web/services";
import { TProjectUpdatesComment, TProjectUpdatesCommentMap } from "@/plane-web/types";
import { IProjectUpdatesReactionStore } from "./update_reaction.store";

export type TCommentLoader = "fetch" | "create" | "update" | "delete" | "mutate" | undefined;

export interface IUpdateCommentStoreActions {
  fetchComments: (
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    loaderType?: TCommentLoader
  ) => Promise<TProjectUpdatesComment[]>;
  createComment: (
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    data: Partial<TProjectUpdatesComment>
  ) => Promise<TProjectUpdatesComment>;
  updateComment: (
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    data: Partial<TProjectUpdatesComment>
  ) => Promise<TProjectUpdatesComment | void>;
  removeComment: (workspaceSlug: string, projectId: string, updateId: string, commentId: string) => Promise<any>;
}

export interface IUpdateCommentStore extends IUpdateCommentStoreActions {
  // observables
  loader: TCommentLoader;
  comments: TProjectUpdatesCommentMap;
  commentMap: Record<string, TProjectUpdatesComment>;
  // helper methods
  getCommentsByUpdateId: (updateId: string) => string[] | undefined;
  getCommentById: (activityId: string) => TProjectUpdatesComment | undefined;
}

export class ProjectUpdateCommentStore implements IUpdateCommentStore {
  // observables
  loader: TCommentLoader = "fetch";
  comments: TProjectUpdatesCommentMap = {};
  commentMap: Record<string, TProjectUpdatesComment> = {};
  // store
  reactions: IProjectUpdatesReactionStore;
  // services
  updateCommentService;

  constructor(reactions: IProjectUpdatesReactionStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      comments: observable,
      commentMap: observable,
      // actions
      fetchComments: action,
      createComment: action,
      updateComment: action,
      removeComment: action,
    });
    //store
    this.reactions = reactions;
    // services
    this.updateCommentService = new ProjectUpdateCommentService();
  }

  // helper methods
  getCommentsByUpdateId = (updateId: string) => {
    if (!updateId) return undefined;
    return this.comments[updateId] ?? undefined;
  };

  getCommentById = (commentId: string) => {
    if (!commentId) return undefined;
    return this.commentMap[commentId] ?? undefined;
  };

  fetchComments = async (
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    loaderType: TCommentLoader = "fetch"
  ) => {
    this.loader = loaderType;

    let props = {};
    const _commentIds = this.getCommentsByUpdateId(updateId);
    if (_commentIds && _commentIds.length > 0) {
      const _comment = this.getCommentById(_commentIds[_commentIds.length - 1]);
      if (_comment) props = { created_at__gt: _comment.created_at };
    }

    const comments = await this.updateCommentService.getProjectUpdateComments(workspaceSlug, projectId, updateId);

    const commentIds = comments.map((comment) => comment.id);
    runInAction(() => {
      update(this.comments, updateId, (_commentIds) => {
        if (!_commentIds) return commentIds;
        return uniq(concat(_commentIds, commentIds));
      });

      comments.forEach((comment) => {
        // this.rootUpdateDetail.commentReaction.applyCommentReactions(comment.id, comment?.comment_reactions || []);
        set(this.commentMap, comment.id, comment);
        this.reactions.addReactions(comment.id, comment.update_reactions);
      });
      this.loader = undefined;
    });

    return comments;
  };

  createComment = async (
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    data: Partial<TProjectUpdatesComment>
  ) => {
    const response = await this.updateCommentService.createProjectUpdateComment(
      workspaceSlug,
      projectId,
      updateId,
      data
    );

    runInAction(() => {
      update(this.comments, updateId, (_commentIds) => {
        if (!_commentIds) return [response.id];
        return uniq(concat(_commentIds, [response.id]));
      });
      set(this.commentMap, response.id, response);
    });

    return response;
  };

  updateComment = async (
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    data: Partial<TProjectUpdatesComment>
  ) => {
    try {
      runInAction(() => {
        Object.keys(data).forEach((key) => {
          set(this.commentMap, [commentId, key], data[key as keyof TProjectUpdatesComment]);
        });
      });

      const response = await this.updateCommentService.patchProjectUpdateComment(
        workspaceSlug,
        projectId,
        commentId,
        data
      );

      return response;
    } catch (error) {
      // this.rootUpdateDetail.activity.fetchActivities(workspaceSlug, projectId, updateId);
      throw error;
    }
  };

  removeComment = async (workspaceSlug: string, projectId: string, updateId: string, commentId: string) => {
    const response = await this.updateCommentService.deleteProjectUpdateComment(workspaceSlug, projectId, commentId);

    runInAction(() => {
      pull(this.comments[updateId], commentId);
      delete this.commentMap[commentId];
    });

    return response;
  };
}
