/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { set } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { RepliesService } from "@plane/services";
import { WorkItemCommentInstance } from "@plane/shared-state";
import type { TIssueComment, TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// services
import { IssueCommentService } from "@/services/issue";
// types
import type { IIssueDetail } from "@/store/work-items/details/root.store";

export interface IRepliesStore {
  // observables
  repliesMap: Map<string, Map<string, WorkItemCommentInstance>>; // commentId -> replyId -> WorkItemCommentInstance
  // computed
  getReplyIdsByCommentId: (commentId: string) => string[] | undefined;
  // reply actions
  fetchReplies: (workspaceSlug: string, projectId: string, issueId: string, commentId: string) => Promise<void>;
  createReply: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: Partial<TIssueComment>
  ) => Promise<TIssueComment>;
  updateReply: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    replyId: string,
    data: Partial<TIssueComment>
  ) => Promise<TIssueComment>;
  deleteReply: (workspaceSlug: string, projectId: string, issueId: string, replyId: string) => Promise<void>;
}

export class RepliesStore implements IRepliesStore {
  // observables
  repliesMap: Map<string, Map<string, WorkItemCommentInstance>> = new Map(); // commentId -> replyId -> WorkItemCommentInstance

  // root store
  rootIssueDetail: IIssueDetail;
  // services
  private repliesService: RepliesService;
  private issueCommentService: IssueCommentService;

  constructor(rootStore: IIssueDetail, serviceType: TIssueServiceType = EIssueServiceType.ISSUES) {
    makeObservable(this, {
      // observables
      repliesMap: observable,
      // actions
      fetchReplies: action,
      createReply: action,
      updateReply: action,
      deleteReply: action,
    });

    this.rootIssueDetail = rootStore;
    this.repliesService = new RepliesService();
    this.issueCommentService = new IssueCommentService(serviceType);
  }

  // computed
  getReplyIdsByCommentId = computedFn((commentId: string): string[] | undefined => {
    const commentMap = this.repliesMap.get(commentId);
    if (!commentMap) return undefined;

    // order ids by created_at
    const orderedIds = Array.from(commentMap.keys()).sort((a, b) => {
      const aCreatedAt = commentMap.get(a)?.created_at;
      const bCreatedAt = commentMap.get(b)?.created_at;
      if (!aCreatedAt || !bCreatedAt) return 0;
      return new Date(aCreatedAt).getTime() - new Date(bCreatedAt).getTime();
    });

    return orderedIds;
  });

  fetchReplies = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string
  ): Promise<void> => {
    const replies = await this.repliesService.list(workspaceSlug, projectId, issueId, commentId);

    runInAction(() => {
      // Get or create comment map
      if (!this.repliesMap.has(commentId)) {
        this.repliesMap.set(commentId, new Map());
      }

      const commentMap = this.repliesMap.get(commentId)!;

      // Create WorkItemCommentInstance for each reply and initialize reactions
      replies.forEach((reply: TIssueComment) => {
        const instance = new WorkItemCommentInstance(reply);
        commentMap.set(reply.id, instance);
        // Initialize reactions from reply data (same as comments)
        this.rootIssueDetail.commentReaction.applyCommentReactions(reply.id, reply?.comment_reactions || []);
      });
    });
  };

  createReply = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: Partial<TIssueComment>
  ): Promise<TIssueComment> => {
    const reply = await this.issueCommentService.createIssueComment(workspaceSlug, projectId, issueId, {
      ...data,
      parent_id: commentId,
    });

    runInAction(() => {
      let commentMap = this.repliesMap.get(commentId);
      if (!commentMap) {
        commentMap = new Map();
      }

      // Create and store WorkItemCommentInstance
      const instance = new WorkItemCommentInstance(reply);
      commentMap.set(reply.id, instance);
      // Initialize reactions from reply data (same as comments)
      this.rootIssueDetail.commentReaction.applyCommentReactions(reply.id, reply?.comment_reactions || []);

      // update reply count for parent comment
      const comment = this.rootIssueDetail.comment.getCommentById(commentId);
      if (comment) {
        comment.reply_count = (comment.reply_count || 0) + 1;
        comment.last_reply_at = reply.created_at;
        comment.replied_user_ids = [...(comment.replied_user_ids || []), reply.actor];

        // update agent activity if it exists
        if (comment.agent_run) {
          this.rootIssueDetail.rootIssueStore.rootStore.agent.fetchRunActivities(workspaceSlug, comment.agent_run.id);
        }
      }
      set(this.rootIssueDetail.comment.commentMap, commentId, comment);
    });

    return reply;
  };

  updateReply = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    replyId: string,
    data: Partial<TIssueComment>
  ): Promise<TIssueComment> => {
    // Find the reply instance to get the commentId
    let commentId: string | undefined;
    for (const [cid, replyMap] of this.repliesMap.entries()) {
      if (replyMap.has(replyId)) {
        commentId = cid;
        break;
      }
    }

    if (!commentId) {
      throw new Error("Reply not found");
    }

    const instance = this.repliesMap.get(commentId)?.get(replyId);
    if (!instance) throw new Error("Reply instance not found");

    const oldValues = instance.asJSON;

    // Optimistic update with the data being sent
    runInAction(() => {
      instance.update(data);
    });

    try {
      const updatedReply = await this.issueCommentService.patchIssueComment(
        workspaceSlug,
        projectId,
        issueId,
        replyId,
        data
      );

      runInAction(() => {
        instance.update({
          updated_at: updatedReply.updated_at,
          edited_at: updatedReply.edited_at,
        });
      });

      return updatedReply;
    } catch (error) {
      runInAction(() => {
        instance.update(oldValues);
      });
      console.error("Failed to update reply", error);
      throw error;
    }
  };

  deleteReply = async (workspaceSlug: string, projectId: string, issueId: string, replyId: string): Promise<void> => {
    // Find the reply instance to get the commentId
    let commentId: string | undefined;
    for (const [cid, replyMap] of this.repliesMap.entries()) {
      if (replyMap.has(replyId)) {
        commentId = cid;
        break;
      }
    }

    if (!commentId) {
      throw new Error("Reply not found");
    }

    await this.issueCommentService.deleteIssueComment(workspaceSlug, projectId, issueId, replyId);

    runInAction(() => {
      const commentMap = this.repliesMap.get(commentId);
      if (commentMap) {
        commentMap.delete(replyId);
      }
    });
  };
}
