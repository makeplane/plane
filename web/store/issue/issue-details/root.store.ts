import { action, computed, makeObservable, observable } from "mobx";
// types
import {
  TIssue,
  TIssueAttachment,
  TIssueComment,
  TIssueCommentReaction,
  TIssueLink,
  TIssueReaction,
  TIssueRelationTypes,
} from "@plane/types";
import { IIssueRootStore } from "../root.store";
import { IIssueActivityStore, IssueActivityStore, IIssueActivityStoreActions, TActivityLoader } from "./activity.store";
import { IIssueAttachmentStore, IssueAttachmentStore, IIssueAttachmentStoreActions } from "./attachment.store";
import { IIssueCommentStore, IssueCommentStore, IIssueCommentStoreActions, TCommentLoader } from "./comment.store";
import {
  IIssueCommentReactionStore,
  IssueCommentReactionStore,
  IIssueCommentReactionStoreActions,
} from "./comment_reaction.store";
import { IIssueStore, IssueStore, IIssueStoreActions } from "./issue.store";
import { IIssueLinkStore, IssueLinkStore, IIssueLinkStoreActions } from "./link.store";
import { IIssueReactionStore, IssueReactionStore, IIssueReactionStoreActions } from "./reaction.store";
import { IIssueRelationStore, IssueRelationStore, IIssueRelationStoreActions } from "./relation.store";
import { IIssueSubIssuesStore, IssueSubIssuesStore, IIssueSubIssuesStoreActions } from "./sub_issues.store";
import { IIssueSubscriptionStore, IssueSubscriptionStore, IIssueSubscriptionStoreActions } from "./subscription.store";

export type TPeekIssue = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  nestingLevel?: number;
};

export type TIssueRelationModal = {
  issueId: string | null;
  relationType: TIssueRelationTypes | null;
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
  isCreateIssueModalOpen: boolean;
  isIssueLinkModalOpen: boolean;
  isParentIssueModalOpen: string | null;
  isDeleteIssueModalOpen: string | null;
  isArchiveIssueModalOpen: string | null;
  isRelationModalOpen: TIssueRelationModal | null;
  isSubIssuesModalOpen: string | null;
  isDeleteAttachmentModalOpen: string | null;
  // computed
  isAnyModalOpen: boolean;
  // helper actions
  getIsIssuePeeked: (issueId: string) => boolean;
  // actions
  setPeekIssue: (peekIssue: TPeekIssue | undefined) => void;
  toggleCreateIssueModal: (value: boolean) => void;
  toggleIssueLinkModal: (value: boolean) => void;
  toggleParentIssueModal: (issueId: string | null) => void;
  toggleDeleteIssueModal: (issueId: string | null) => void;
  toggleArchiveIssueModal: (value: string | null) => void;
  toggleRelationModal: (issueId: string | null, relationType: TIssueRelationTypes | null) => void;
  toggleSubIssuesModal: (value: string | null) => void;
  toggleDeleteAttachmentModal: (attachmentId: string | null) => void;
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
  isCreateIssueModalOpen: boolean = false;
  isIssueLinkModalOpen: boolean = false;
  isParentIssueModalOpen: string | null = null;
  isDeleteIssueModalOpen: string | null = null;
  isArchiveIssueModalOpen: string | null = null;
  isRelationModalOpen: TIssueRelationModal | null = null;
  isSubIssuesModalOpen: string | null = null;
  isDeleteAttachmentModalOpen: string | null = null;
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
      isCreateIssueModalOpen: observable,
      isIssueLinkModalOpen: observable.ref,
      isParentIssueModalOpen: observable.ref,
      isDeleteIssueModalOpen: observable.ref,
      isArchiveIssueModalOpen: observable.ref,
      isRelationModalOpen: observable.ref,
      isSubIssuesModalOpen: observable.ref,
      isDeleteAttachmentModalOpen: observable.ref,
      // computed
      isAnyModalOpen: computed,
      // action
      setPeekIssue: action,
      toggleCreateIssueModal: action,
      toggleIssueLinkModal: action,
      toggleParentIssueModal: action,
      toggleDeleteIssueModal: action,
      toggleArchiveIssueModal: action,
      toggleRelationModal: action,
      toggleSubIssuesModal: action,
      toggleDeleteAttachmentModal: action,
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
      this.isCreateIssueModalOpen ||
      this.isIssueLinkModalOpen ||
      !!this.isParentIssueModalOpen ||
      !!this.isDeleteIssueModalOpen ||
      !!this.isArchiveIssueModalOpen ||
      !!this.isRelationModalOpen?.issueId ||
      !!this.isSubIssuesModalOpen ||
      !!this.isDeleteAttachmentModalOpen
    );
  }

  // helper actions
  getIsIssuePeeked = (issueId: string) => this.peekIssue?.issueId === issueId;

  // actions
  setPeekIssue = (peekIssue: TPeekIssue | undefined) => (this.peekIssue = peekIssue);
  toggleCreateIssueModal = (value: boolean) => (this.isCreateIssueModalOpen = value);
  toggleIssueLinkModal = (value: boolean) => (this.isIssueLinkModalOpen = value);
  toggleParentIssueModal = (issueId: string | null) => (this.isParentIssueModalOpen = issueId);
  toggleDeleteIssueModal = (issueId: string | null) => (this.isDeleteIssueModalOpen = issueId);
  toggleArchiveIssueModal = (issueId: string | null) => (this.isArchiveIssueModalOpen = issueId);
  toggleRelationModal = (issueId: string | null, relationType: TIssueRelationTypes | null) =>
    (this.isRelationModalOpen = { issueId, relationType });
  toggleSubIssuesModal = (issueId: string | null) => (this.isSubIssuesModalOpen = issueId);
  toggleDeleteAttachmentModal = (attachmentId: string | null) => (this.isDeleteAttachmentModalOpen = attachmentId);

  // issue
  fetchIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    issueType: "DEFAULT" | "ARCHIVED" | "DRAFT" = "DEFAULT"
  ) => this.issue.fetchIssue(workspaceSlug, projectId, issueId, issueType);
  updateIssue = async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) =>
    this.issue.updateIssue(workspaceSlug, projectId, issueId, data);
  removeIssue = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.issue.removeIssue(workspaceSlug, projectId, issueId);
  archiveIssue = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.issue.archiveIssue(workspaceSlug, projectId, issueId);
  addCycleToIssue = async (workspaceSlug: string, projectId: string, cycleId: string, issueId: string) =>
    this.issue.addCycleToIssue(workspaceSlug, projectId, cycleId, issueId);
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
  addReactions = (issueId: string, reactions: TIssueReaction[]) => this.reaction.addReactions(issueId, reactions);
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
  addAttachments = (issueId: string, attachments: TIssueAttachment[]) =>
    this.attachment.addAttachments(issueId, attachments);
  fetchAttachments = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.attachment.fetchAttachments(workspaceSlug, projectId, issueId);
  createAttachment = async (workspaceSlug: string, projectId: string, issueId: string, data: FormData) =>
    this.attachment.createAttachment(workspaceSlug, projectId, issueId, data);
  removeAttachment = async (workspaceSlug: string, projectId: string, issueId: string, attachmentId: string) =>
    this.attachment.removeAttachment(workspaceSlug, projectId, issueId, attachmentId);

  // link
  addLinks = (issueId: string, links: TIssueLink[]) => this.link.addLinks(issueId, links);
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
  addSubscription = (issueId: string, isSubscribed: boolean | undefined | null) =>
    this.subscription.addSubscription(issueId, isSubscribed);
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
