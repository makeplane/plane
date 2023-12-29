import { action, makeObservable, runInAction } from "mobx";
import set from "lodash/set";
// services
import { IssueCommentService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { TIssueActivity } from "@plane/types";

export interface IIssueCommentStoreActions {
  createComment: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: Partial<TIssueActivity>
  ) => Promise<any>;
  updateComment: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: Partial<TIssueActivity>
  ) => Promise<any>;
  removeComment: (workspaceSlug: string, projectId: string, issueId: string, commentId: string) => Promise<any>;
}

export interface IIssueCommentStore extends IIssueCommentStoreActions {}

export class IssueCommentStore implements IIssueCommentStore {
  // root store
  rootIssueDetail: IIssueDetail;
  // services
  issueCommentService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // actions
      createComment: action,
      updateComment: action,
      removeComment: action,
    });
    // root store
    this.rootIssueDetail = rootStore;
    // services
    this.issueCommentService = new IssueCommentService();
  }

  createComment = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssueActivity>) => {
    try {
      const response = await this.issueCommentService.createIssueComment(workspaceSlug, projectId, issueId, data);

      runInAction(() => {
        this.rootIssueDetail.activity.activities[issueId].push(response.id);
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
    data: Partial<TIssueActivity>
  ) => {
    try {
      runInAction(() => {
        Object.keys(data).forEach((key) => {
          set(this.rootIssueDetail.activity.activityMap, [commentId, key], data[key as keyof TIssueActivity]);
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

      const reactionIndex = this.rootIssueDetail.activity.activities[issueId].findIndex(
        (_comment) => _comment === commentId
      );
      if (reactionIndex >= 0)
        runInAction(() => {
          this.rootIssueDetail.activity.activities[issueId].splice(reactionIndex, 1);
          delete this.rootIssueDetail.activity.activityMap[commentId];
        });

      return response;
    } catch (error) {
      throw error;
    }
  };
}
