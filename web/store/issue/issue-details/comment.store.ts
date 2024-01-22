import { action, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
import update from "lodash/update";
import concat from "lodash/concat";
import merge from "lodash/merge";
// services
import { IssueCommentService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { TIssueComment, TIssueCommentMap, TIssueCommentIdMap } from "@plane/types";

export type TCommentLoader = "fetch" | "create" | "update" | "delete" | "mutate" | undefined;

export interface IIssueCommentStoreActions {
  fetchComments: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    loaderType?: TCommentLoader
  ) => Promise<TIssueComment[]>;
  createComment: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueComment>
  ) => Promise<any>;
  updateComment: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: Partial<TIssueComment>
  ) => Promise<any>;
  removeComment: (workspaceSlug: string, projectId: string, issueId: string, commentId: string) => Promise<any>;
}

export interface IIssueCommentStore extends IIssueCommentStoreActions {
  // observables
  loader: TCommentLoader;
  comments: TIssueCommentIdMap;
  commentMap: TIssueCommentMap;
  // helper methods
  getCommentsByIssueId: (issueId: string) => string[] | undefined;
  getCommentById: (activityId: string) => TIssueComment | undefined;
}

export class IssueCommentStore implements IIssueCommentStore {
  // observables
  loader: TCommentLoader = "fetch";
  comments: TIssueCommentIdMap = {};
  commentMap: TIssueCommentMap = {};
  // root store
  rootIssueDetail: IIssueDetail;
  // services
  issueCommentService;

  constructor(rootStore: IIssueDetail) {
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
    // root store
    this.rootIssueDetail = rootStore;
    // services
    this.issueCommentService = new IssueCommentService();
  }

  // helper methods
  getCommentsByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.comments[issueId] ?? undefined;
  };

  getCommentById = (commentId: string) => {
    if (!commentId) return undefined;
    return this.commentMap[commentId] ?? undefined;
  };

  fetchComments = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    loaderType: TCommentLoader = "fetch"
  ) => {
    try {
      this.loader = loaderType;
      const comments = await this.issueCommentService.getIssueComments(workspaceSlug, projectId, issueId);

      const commentIds = comments.map((comment) => comment.id);
      runInAction(() => {
        update(this.comments, issueId, (_commentIds) => {
          if (!_commentIds) return commentIds;
          return merge(_commentIds, commentIds);
        });
        comments.forEach((comment) => {
          set(this.commentMap, comment.id, comment);
        });
        this.loader = undefined;
      });

      return comments;
    } catch (error) {
      throw error;
    }
  };

  createComment = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssueComment>) => {
    try {
      const response = await this.issueCommentService.createIssueComment(workspaceSlug, projectId, issueId, data);

      runInAction(() => {
        this.comments[issueId].push(response.id);
        set(this.rootIssueDetail.activity.activityMap, response.id, response);
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  updateComment = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: Partial<TIssueComment>
  ) => {
    try {
      runInAction(() => {
        Object.keys(data).forEach((key) => {
          set(this.commentMap, [commentId, key], data[key as keyof TIssueComment]);
        });
      });

      const response = await this.issueCommentService.patchIssueComment(
        workspaceSlug,
        projectId,
        issueId,
        commentId,
        data
      );

      return response;
    } catch (error) {
      this.rootIssueDetail.activity.fetchActivities(workspaceSlug, projectId, issueId);
      throw error;
    }
  };

  removeComment = async (workspaceSlug: string, projectId: string, issueId: string, commentId: string) => {
    try {
      const response = await this.issueCommentService.deleteIssueComment(workspaceSlug, projectId, issueId, commentId);

      const reactionIndex = this.comments[issueId].findIndex((_comment) => _comment === commentId);
      if (reactionIndex >= 0)
        runInAction(() => {
          this.comments[issueId].splice(reactionIndex, 1);
          delete this.commentMap[commentId];
        });

      return response;
    } catch (error) {
      throw error;
    }
  };
}
