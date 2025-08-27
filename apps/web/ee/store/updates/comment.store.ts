import concat from "lodash/concat";
import pull from "lodash/pull";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
// services
// types
import { TUpdateComment, TUpdatesCommentMap } from "@plane/types";
import { IUpdatesReactionStore } from "./reaction.store";

export type TCommentLoader = "fetch" | "create" | "update" | "delete" | "mutate" | undefined;

export interface IUpdateCommentStoreActions {
  fetchComments: (
    callbackFn: () => Promise<TUpdateComment[]>,
    updateId: string,
    loaderType?: TCommentLoader
  ) => Promise<TUpdateComment[]>;
  createComment: (callbackFn: () => Promise<TUpdateComment>, updateId: string) => Promise<TUpdateComment>;
  patchComment: (
    callbackFn: () => Promise<void>,
    commentId: string,
    data: Partial<TUpdateComment>
  ) => Promise<TUpdateComment | void>;
  removeComment: (callbackFn: () => Promise<void>, updateId: string, commentId: string) => Promise<void>;
}

export interface IUpdateCommentStore extends IUpdateCommentStoreActions {
  // observables
  loader: TCommentLoader;
  comments: TUpdatesCommentMap;
  commentMap: Record<string, TUpdateComment>;
  // helper methods
  getCommentsByUpdateId: (updateId: string) => string[] | undefined;
  getCommentById: (activityId: string) => TUpdateComment | undefined;
}

export class UpdateCommentStore implements IUpdateCommentStore {
  // observables
  loader: TCommentLoader = "fetch";
  comments: TUpdatesCommentMap = {};
  commentMap: Record<string, TUpdateComment> = {};
  // store
  reactions: IUpdatesReactionStore;

  constructor(reactions: IUpdatesReactionStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      comments: observable,
      commentMap: observable,
    });
    //store
    this.reactions = reactions;
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

  public fetchComments = action(
    async (callbackFn: () => Promise<TUpdateComment[]>, updateId: string, loaderType: TCommentLoader = "fetch") => {
      this.loader = loaderType;

      let props = {};
      const _commentIds = this.getCommentsByUpdateId(updateId);
      if (_commentIds && _commentIds.length > 0) {
        const _comment = this.getCommentById(_commentIds[_commentIds.length - 1]);
        if (_comment) props = { created_at__gt: _comment.created_at };
      }

      const comments = await callbackFn();

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
    }
  );

  public createComment = action(async (callbackFn: () => Promise<TUpdateComment>, updateId: string) => {
    const response = await callbackFn();

    runInAction(() => {
      update(this.comments, updateId, (_commentIds) => {
        if (!_commentIds) return [response.id];
        return uniq(concat(_commentIds, [response.id]));
      });
      set(this.commentMap, response.id, response);
    });

    return response;
  });

  public patchComment = action(
    async (callbackFn: () => Promise<void>, commentId: string, data: Partial<TUpdateComment>) => {
      runInAction(() => {
        Object.keys(data).forEach((key) => {
          set(this.commentMap, [commentId, key], data[key as keyof TUpdateComment]);
        });
      });

      await callbackFn();
    }
  );

  public removeComment = action(async (callbackFn: () => Promise<void>, updateId: string, commentId: string) => {
    await callbackFn();

    runInAction(() => {
      pull(this.comments[updateId], commentId);
      delete this.commentMap[commentId];
    });
  });
}
