import { makeObservable, observable } from "mobx";
// types
import { IIssueRootStore } from "../root.store";
import { IIssueStore, IssueStore, IIssueStoreActions } from "./issue.store";
import { IIssueReactionStore, IssueReactionStore, IIssueReactionStoreActions } from "./reaction.store";
import { IIssueActivityStore, IssueActivityStore, IIssueActivityStoreActions } from "./activity.store";
import { IIssueCommentStore, IssueCommentStore, IIssueCommentStoreActions } from "./comment.store";
import {
  IIssueCommentReactionStore,
  IssueCommentReactionStore,
  IIssueCommentReactionStoreActions,
} from "./comment_reaction.store";
import { IIssueLinkStore, IssueLinkStore, IIssueLinkStoreActions } from "./link.store";
import { IIssueSubscriptionStore, IssueSubscriptionStore, IIssueSubscriptionStoreActions } from "./subscription.store";

import { IIssue, IIssueActivity, IIssueLink } from "types";

export interface IIssueDetail
  extends IIssueStoreActions,
    IIssueReactionStoreActions,
    IIssueActivityStoreActions,
    IIssueCommentStoreActions,
    IIssueCommentReactionStoreActions,
    IIssueLinkStoreActions,
    IIssueSubscriptionStoreActions {
  // observables
  issueId: string | undefined;
  // store
  rootIssueStore: IIssueRootStore;
  issue: IIssueStore;
  reaction: IIssueReactionStore;
  activity: IIssueActivityStore;
  comment: IIssueCommentStore;
  commentReaction: IIssueCommentReactionStore;
  link: IIssueLinkStore;
  subscription: IIssueSubscriptionStore;
}

export class IssueDetail implements IIssueDetail {
  // observables
  issueId: string | undefined = undefined;
  // store
  rootIssueStore: IIssueRootStore;
  issue: IIssueStore;
  reaction: IIssueReactionStore;
  activity: IIssueActivityStore;
  comment: IIssueCommentStore;
  commentReaction: IIssueCommentReactionStore;
  link: IIssueLinkStore;
  subscription: IIssueSubscriptionStore;

  constructor(rootStore: IIssueRootStore) {
    makeObservable(this, {
      // observables
      issueId: observable.ref,
    });

    // store
    this.rootIssueStore = rootStore;
    this.issue = new IssueStore(this);
    this.reaction = new IssueReactionStore(this);
    this.activity = new IssueActivityStore(this);
    this.comment = new IssueCommentStore(this);
    this.commentReaction = new IssueCommentReactionStore(this);
    this.link = new IssueLinkStore(this);
    this.subscription = new IssueSubscriptionStore(this);
  }

  // issue
  fetchIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    this.issueId = issueId;
    return this.issue.fetchIssue(workspaceSlug, projectId, issueId);
  };
  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<IIssue>) =>
    this.issue.updateIssue(workspaceSlug, projectId, issueId, data);
  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.issue.removeIssue(workspaceSlug, projectId, issueId);
  addIssueToCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) =>
    this.issue.addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);
  removeIssueFromCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) =>
    this.issue.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
  addIssueToModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueIds: string[]) =>
    this.issue.addIssueToModule(workspaceSlug, projectId, moduleId, issueIds);
  removeIssueFromModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) =>
    this.issue.removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);

  // reactions
  createReaction = async (workspaceSlug: string, projectId: string, issueId: string, reaction: string) =>
    this.reaction.createReaction(workspaceSlug, projectId, issueId, reaction);
  removeReaction = async (workspaceSlug: string, projectId: string, issueId: string, reaction: string) =>
    this.reaction.removeReaction(workspaceSlug, projectId, issueId, reaction);

  // activity
  fetchActivities = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.activity.fetchActivities(workspaceSlug, projectId, issueId);

  // comment
  createComment = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<IIssueActivity>) =>
    this.comment.createComment(workspaceSlug, projectId, issueId, data);
  updateComment = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: Partial<IIssueActivity>
  ) => this.comment.updateComment(workspaceSlug, projectId, issueId, commentId, data);
  removeComment = async (workspaceSlug: string, projectId: string, issueId: string, commentId: string) =>
    this.comment.removeComment(workspaceSlug, projectId, issueId, commentId);

  // comment reaction
  fetchCommentReactions = async (workspaceSlug: string, projectId: string, commentId: string) =>
    this.commentReaction.fetchCommentReactions(workspaceSlug, projectId, commentId);
  createCommentReaction = async (workspaceSlug: string, projectId: string, commentId: string, reaction: string) =>
    this.commentReaction.createCommentReaction(workspaceSlug, projectId, commentId, reaction);
  removeCommentReaction = async (workspaceSlug: string, projectId: string, commentId: string, reaction: string) =>
    this.commentReaction.removeCommentReaction(workspaceSlug, projectId, commentId, reaction);

  // link
  createLink = async (workspaceSlug: string, projectId: string, issueId: string, data: IIssueLink) =>
    this.link.createLink(workspaceSlug, projectId, issueId, data);
  updateLink = async (workspaceSlug: string, projectId: string, issueId: string, linkId: string, data: IIssueLink) =>
    this.link.updateLink(workspaceSlug, projectId, issueId, linkId, data);
  removeLink = async (workspaceSlug: string, projectId: string, issueId: string, linkId: string) =>
    this.link.removeLink(workspaceSlug, projectId, issueId, linkId);

  // subscription
  fetchSubscriptions = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.subscription.fetchSubscriptions(workspaceSlug, projectId, issueId);
  createSubscription = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.subscription.createSubscription(workspaceSlug, projectId, issueId);
  removeSubscription = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.subscription.removeSubscription(workspaceSlug, projectId, issueId);
}
