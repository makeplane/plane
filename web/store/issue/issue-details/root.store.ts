import { action, computed, makeObservable, observable } from "mobx";
// types
import { IIssueRootStore } from "../root.store";
import { IIssueStore, IssueStore, IIssueStoreActions } from "./issue.store";
import { IIssueReactionStore, IssueReactionStore, IIssueReactionStoreActions } from "./reaction.store";
import { IIssueLinkStore, IssueLinkStore, IIssueLinkStoreActions } from "./link.store";
import { IIssueSubscriptionStore, IssueSubscriptionStore, IIssueSubscriptionStoreActions } from "./subscription.store";
import { IIssueAttachmentStore, IssueAttachmentStore, IIssueAttachmentStoreActions } from "./attachment.store";
import { IIssueSubIssuesStore, IssueSubIssuesStore, IIssueSubIssuesStoreActions } from "./sub_issues.store";
import { IIssueRelationStore, IssueRelationStore, IIssueRelationStoreActions } from "./relation.store";
import { IIssueActivityStore, IssueActivityStore, IIssueActivityStoreActions, TActivityLoader } from "./activity.store";
import { IIssueCommentStore, IssueCommentStore, IIssueCommentStoreActions, TCommentLoader } from "./comment.store";
import {
  IIssueCommentReactionStore,
  IssueCommentReactionStore,
  IIssueCommentReactionStoreActions,
} from "./comment_reaction.store";

import { TIssue, TIssueComment, TIssueCommentReaction, TIssueLink, TIssueRelationTypes } from "@plane/types";

export type TPeekIssue = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export interface IIssueDetail
  extends IIssueStoreActions,
    IIssueReactionStoreActions,
    IIssueLinkStoreActions,
    IIssueSubIssuesStoreActions,
    IIssueSubscriptionStoreActions,
    IIssueAttachmentStoreActions,
    IIssueRelationStoreActions,
    IIssueActivityStoreActions,
    IIssueCommentStoreActions,
    IIssueCommentReactionStoreActions {
  // observables
  peekIssue: TPeekIssue | undefined;
  isIssueLinkModalOpen: boolean;
  isParentIssueModalOpen: boolean;
  isDeleteIssueModalOpen: boolean;
  isRelationModalOpen: TIssueRelationTypes | null;
  // computed
  isAnyModalOpen: boolean;
  // actions
  setPeekIssue: (peekIssue: TPeekIssue | undefined) => void;
  toggleIssueLinkModal: (value: boolean) => void;
  toggleParentIssueModal: (value: boolean) => void;
  toggleDeleteIssueModal: (value: boolean) => void;
  toggleRelationModal: (value: TIssueRelationTypes | null) => void;
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
  relation: IIssueRelationStore;
}

export class IssueDetail implements IIssueDetail {
  // observables
  peekIssue: TPeekIssue | undefined = undefined;
  isIssueLinkModalOpen: boolean = false;
  isParentIssueModalOpen: boolean = false;
  isDeleteIssueModalOpen: boolean = false;
  isRelationModalOpen: TIssueRelationTypes | null = null;
  // store
  rootIssueStore: IIssueRootStore;
  issue: IIssueStore;
  reaction: IIssueReactionStore;
  attachment: IIssueAttachmentStore;
  subIssues: IIssueSubIssuesStore;
  link: IIssueLinkStore;
  subscription: IIssueSubscriptionStore;
  relation: IIssueRelationStore;
  activity: IIssueActivityStore;
  comment: IIssueCommentStore;
  commentReaction: IIssueCommentReactionStore;

  constructor(rootStore: IIssueRootStore) {
    makeObservable(this, {
      // observables
      peekIssue: observable,
      isIssueLinkModalOpen: observable.ref,
      isParentIssueModalOpen: observable.ref,
      isDeleteIssueModalOpen: observable.ref,
      isRelationModalOpen: observable.ref,
      // computed
      isAnyModalOpen: computed,
      // action
      setPeekIssue: action,
      toggleIssueLinkModal: action,
      toggleParentIssueModal: action,
      toggleDeleteIssueModal: action,
      toggleRelationModal: action,
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
    this.relation = new IssueRelationStore(this);
  }

  // computed
  get isAnyModalOpen() {
    return (
      this.isIssueLinkModalOpen ||
      this.isParentIssueModalOpen ||
      this.isDeleteIssueModalOpen ||
      Boolean(this.isRelationModalOpen)
    );
  }

  // actions
  setPeekIssue = (peekIssue: TPeekIssue | undefined) => (this.peekIssue = peekIssue);
  toggleIssueLinkModal = (value: boolean) => (this.isIssueLinkModalOpen = value);
  toggleParentIssueModal = (value: boolean) => (this.isParentIssueModalOpen = value);
  toggleDeleteIssueModal = (value: boolean) => (this.isDeleteIssueModalOpen = value);
  toggleRelationModal = (value: TIssueRelationTypes | null) => (this.isRelationModalOpen = value);

  // issue
  fetchIssue = async (workspaceSlug: string, projectId: string, issueId: string, isArchived = false) =>
    this.issue.fetchIssue(workspaceSlug, projectId, issueId, isArchived);
  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) =>
    this.issue.updateIssue(workspaceSlug, projectId, issueId, data);
  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.issue.removeIssue(workspaceSlug, projectId, issueId);
  addIssueToCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueIds: string[]) =>
    this.issue.addIssueToCycle(workspaceSlug, projectId, cycleId, issueIds);
  removeIssueFromCycle = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) =>
    this.issue.removeIssueFromCycle(workspaceSlug, projectId, cycleId, issueId);
  addModulesToIssue = async (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) =>
    this.issue.addModulesToIssue(workspaceSlug, projectId, issueId, moduleIds);
  removeModulesFromIssue = async (workspaceSlug: string, projectId: string, issueId: string, moduleIds: string[]) =>
    this.issue.removeModulesFromIssue(workspaceSlug, projectId, issueId, moduleIds);
  removeIssueFromModule = async (workspaceSlug: string, projectId: string, moduleId: string, issueId: string) =>
    this.issue.removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);

  // reactions
  fetchReactions = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.reaction.fetchReactions(workspaceSlug, projectId, issueId);
  createReaction = async (workspaceSlug: string, projectId: string, issueId: string, reaction: string) =>
    this.reaction.createReaction(workspaceSlug, projectId, issueId, reaction);
  removeReaction = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    reaction: string,
    userId: string
  ) => this.reaction.removeReaction(workspaceSlug, projectId, issueId, reaction, userId);

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
  createSubIssues = async (workspaceSlug: string, projectId: string, parentIssueId: string, data: string[]) =>
    this.subIssues.createSubIssues(workspaceSlug, projectId, parentIssueId, data);
  updateSubIssue = async (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string,
    issueData: Partial<TIssue>,
    oldIssue?: Partial<TIssue>,
    fromModal?: boolean
  ) => this.subIssues.updateSubIssue(workspaceSlug, projectId, parentIssueId, issueId, issueData, oldIssue, fromModal);
  removeSubIssue = async (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) =>
    this.subIssues.removeSubIssue(workspaceSlug, projectId, parentIssueId, issueId);
  deleteSubIssue = async (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) =>
    this.subIssues.deleteSubIssue(workspaceSlug, projectId, parentIssueId, issueId);

  // subscription
  fetchSubscriptions = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.subscription.fetchSubscriptions(workspaceSlug, projectId, issueId);
  createSubscription = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.subscription.createSubscription(workspaceSlug, projectId, issueId);
  removeSubscription = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.subscription.removeSubscription(workspaceSlug, projectId, issueId);

  // relations
  fetchRelations = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.relation.fetchRelations(workspaceSlug, projectId, issueId);
  createRelation = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: TIssueRelationTypes,
    issues: string[]
  ) => this.relation.createRelation(workspaceSlug, projectId, issueId, relationType, issues);
  removeRelation = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: TIssueRelationTypes,
    relatedIssue: string
  ) => this.relation.removeRelation(workspaceSlug, projectId, issueId, relationType, relatedIssue);

  // activity
  fetchActivities = async (workspaceSlug: string, projectId: string, issueId: string, loaderType?: TActivityLoader) =>
    this.activity.fetchActivities(workspaceSlug, projectId, issueId, loaderType);

  // comment
  fetchComments = async (workspaceSlug: string, projectId: string, issueId: string, loaderType?: TCommentLoader) =>
    this.comment.fetchComments(workspaceSlug, projectId, issueId, loaderType);
  createComment = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssueComment>) =>
    this.comment.createComment(workspaceSlug, projectId, issueId, data);
  updateComment = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    data: Partial<TIssueComment>
  ) => this.comment.updateComment(workspaceSlug, projectId, issueId, commentId, data);
  removeComment = async (workspaceSlug: string, projectId: string, issueId: string, commentId: string) =>
    this.comment.removeComment(workspaceSlug, projectId, issueId, commentId);

  // comment reaction
  fetchCommentReactions = async (workspaceSlug: string, projectId: string, commentId: string) =>
    this.commentReaction.fetchCommentReactions(workspaceSlug, projectId, commentId);
  applyCommentReactions = async (commentId: string, commentReactions: TIssueCommentReaction[]) =>
    this.commentReaction.applyCommentReactions(commentId, commentReactions);
  createCommentReaction = async (workspaceSlug: string, projectId: string, commentId: string, reaction: string) =>
    this.commentReaction.createCommentReaction(workspaceSlug, projectId, commentId, reaction);
  removeCommentReaction = async (
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    reaction: string,
    userId: string
  ) => this.commentReaction.removeCommentReaction(workspaceSlug, projectId, commentId, reaction, userId);
}
