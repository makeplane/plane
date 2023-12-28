import { action, computed, makeObservable, observable } from "mobx";
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
import { IIssueAttachmentStore, IssueAttachmentStore, IIssueAttachmentStoreActions } from "./attachment.store";
import { IIssueSubIssuesStore, IssueSubIssuesStore, IIssueSubIssuesStoreActions } from "./sub_issues.store";

import { TIssue, IIssueActivity, TIssueLink } from "types";

export interface IIssueDetail
  extends IIssueStoreActions,
    IIssueReactionStoreActions,
    IIssueActivityStoreActions,
    IIssueCommentStoreActions,
    IIssueCommentReactionStoreActions,
    IIssueLinkStoreActions,
    IIssueSubIssuesStoreActions,
    IIssueSubscriptionStoreActions,
    IIssueAttachmentStoreActions {
  // observables
  issueId: string | undefined;
  isIssueLinkModalOpen: boolean;
  isParentIssueModalOpen: boolean;
  isDeleteIssueModalOpen: boolean;
  // computed
  isAnyModalOpen: boolean;
  // actions
  setIssueId: (issueId: string | undefined) => void;
  toggleIssueLinkModal: (value: boolean) => void;
  toggleParentIssueModal: (value: boolean) => void;
  toggleDeleteIssueModal: (value: boolean) => void;
  // store
  rootIssueStore: IIssueRootStore;
  issue: IIssueStore;
  reaction: IIssueReactionStore;
  attachment: IIssueAttachmentStore;
  activity: IIssueActivityStore;
  comment: IIssueCommentStore;
  commentReaction: IIssueCommentReactionStore;
  subIssues: IIssueSubIssuesStore;
  link: IIssueLinkStore;
  subscription: IIssueSubscriptionStore;
}

export class IssueDetail implements IIssueDetail {
  // observables
  issueId: string | undefined = undefined;
  isIssueLinkModalOpen: boolean = false;
  isParentIssueModalOpen: boolean = false;
  isDeleteIssueModalOpen: boolean = false;
  // store
  rootIssueStore: IIssueRootStore;
  issue: IIssueStore;
  reaction: IIssueReactionStore;
  attachment: IIssueAttachmentStore;
  activity: IIssueActivityStore;
  comment: IIssueCommentStore;
  commentReaction: IIssueCommentReactionStore;
  subIssues: IIssueSubIssuesStore;
  link: IIssueLinkStore;
  subscription: IIssueSubscriptionStore;

  constructor(rootStore: IIssueRootStore) {
    makeObservable(this, {
      // observables
      issueId: observable.ref,
      isIssueLinkModalOpen: observable.ref,
      isParentIssueModalOpen: observable.ref,
      isDeleteIssueModalOpen: observable.ref,
      // computed
      isAnyModalOpen: computed,
      // action
      setIssueId: action,
      toggleIssueLinkModal: action,
      toggleParentIssueModal: action,
      toggleDeleteIssueModal: action,
    });

    // store
    this.rootIssueStore = rootStore;
    this.issue = new IssueStore(this);
    this.reaction = new IssueReactionStore(this);
    this.attachment = new IssueAttachmentStore(this);
    this.activity = new IssueActivityStore(this);
    this.comment = new IssueCommentStore(this);
    this.commentReaction = new IssueCommentReactionStore(this);
    this.subIssues = new IssueSubIssuesStore(this);
    this.link = new IssueLinkStore(this);
    this.subscription = new IssueSubscriptionStore(this);
  }

  // computed
  get isAnyModalOpen() {
    return this.isIssueLinkModalOpen || this.isParentIssueModalOpen || this.isDeleteIssueModalOpen;
  }

  // actions
  setIssueId = (issueId: string | undefined) => (this.issueId = issueId);
  toggleIssueLinkModal = (value: boolean) => (this.isIssueLinkModalOpen = value);
  toggleParentIssueModal = (value: boolean) => (this.isParentIssueModalOpen = value);
  toggleDeleteIssueModal = (value: boolean) => (this.isDeleteIssueModalOpen = value);

  // issue
  fetchIssue = async (workspaceSlug: string, projectId: string, issueId: string) => {
    this.issueId = issueId;
    return this.issue.fetchIssue(workspaceSlug, projectId, issueId);
  };
  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) =>
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
  fetchReactions = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.reaction.fetchReactions(workspaceSlug, projectId, issueId);
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

  // attachments
  fetchAttachments = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.attachment.fetchAttachments(workspaceSlug, projectId, issueId);
  createAttachment = async (workspaceSlug: string, projectId: string, issueId: string, data: FormData) =>
    this.attachment.createAttachment(workspaceSlug, projectId, issueId, data);
  removeAttachment = async (workspaceSlug: string, projectId: string, issueId: string, attachmentId: string) =>
    this.attachment.removeAttachment(workspaceSlug, projectId, issueId, attachmentId);

  // link
  fetchLinks = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.link.fetchLinks(workspaceSlug, projectId, issueId);
  createLink = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssueLink>) =>
    this.link.createLink(workspaceSlug, projectId, issueId, data);
  updateLink = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    linkId: string,
    data: Partial<TIssueLink>
  ) => this.link.updateLink(workspaceSlug, projectId, issueId, linkId, data);
  removeLink = async (workspaceSlug: string, projectId: string, issueId: string, linkId: string) =>
    this.link.removeLink(workspaceSlug, projectId, issueId, linkId);

  // sub issues
  fetchSubIssues = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.subIssues.fetchSubIssues(workspaceSlug, projectId, issueId);
  createSubIssues = async (workspaceSlug: string, projectId: string, issueId: string, data: string[]) =>
    this.subIssues.createSubIssues(workspaceSlug, projectId, issueId, data);

  // subscription
  fetchSubscriptions = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.subscription.fetchSubscriptions(workspaceSlug, projectId, issueId);
  createSubscription = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.subscription.createSubscription(workspaceSlug, projectId, issueId);
  removeSubscription = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.subscription.removeSubscription(workspaceSlug, projectId, issueId);
}
