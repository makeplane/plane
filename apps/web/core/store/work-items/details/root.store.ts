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

import { action, computed, makeObservable, observable } from "mobx";
// types
import type {
  TIssue,
  TIssueAttachment,
  TIssueComment,
  TIssueCommentReaction,
  TIssueLink,
  TIssueReaction,
  TIssueServiceType,
  TWorkItemWidgets,
} from "@plane/types";
// plane web store
import { IssueActivityStore } from "@/store/work-items/details/activity.store";
import type {
  IIssueActivityStore,
  IIssueActivityStoreActions,
  TActivityLoader,
} from "@/store/work-items/details/activity.store";
import type { TIssueRelationTypes } from "@/types";
import type { IIssueRootStore } from "../root.store";
import { IssueAttachmentStore } from "./attachment.store";
import type { IIssueAttachmentStore, IIssueAttachmentStoreActions } from "./attachment.store";
import { IssueCommentStore } from "./comment.store";
import type { IIssueCommentStore, IIssueCommentStoreActions, TCommentLoader } from "./comment.store";
import { IssueCommentReactionStore } from "./comment_reaction.store";
import type { IIssueCommentReactionStore, IIssueCommentReactionStoreActions } from "./comment_reaction.store";
import { IssueStore } from "./issue.store";
import type { IIssueStore, IIssueStoreActions } from "./issue.store";
import { IssueLinkStore } from "./link.store";
import type { IIssueLinkStore, IIssueLinkStoreActions } from "./link.store";
import { IssueReactionStore } from "./reaction.store";
import type { IIssueReactionStore, IIssueReactionStoreActions } from "./reaction.store";
import { IssueRelationStore } from "./relation.store";
import type { IIssueRelationStore, IIssueRelationStoreActions } from "./relation.store";
import { IssueSubIssuesStore } from "./sub_issues.store";
import type { IIssueSubIssuesStore, IIssueSubIssuesStoreActions } from "./sub_issues.store";
import { IssueSubscriptionStore } from "./subscription.store";
import type { IIssueSubscriptionStore, IIssueSubscriptionStoreActions } from "./subscription.store";
import { WorkItemPagesStore } from "./page.store";
// services
import { IssueService } from "@/services/issue/issue.service";

export type TPeekIssue = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  nestingLevel?: number;
  isArchived?: boolean;
};

export type TIssueRelationModal = {
  issueId: string | null;
  relationType: TIssueRelationTypes | null;
};

export type TIssueCrudState = { toggle: boolean; parentIssueId: string | undefined; issue: TIssue | undefined };

export type TIssueCrudOperationState = {
  create: TIssueCrudState;
  existing: TIssueCrudState;
};

export interface IIssueDetail
  extends
    IIssueStoreActions,
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
  relationKey: TIssueRelationTypes | null;
  issueLinkData: TIssueLink | null;
  issueCrudOperationState: TIssueCrudOperationState;
  openWidgets: TWorkItemWidgets[];
  lastWidgetAction: TWorkItemWidgets | null;
  isCreateIssueModalOpen: boolean;
  isIssueLinkModalOpen: boolean;
  isParentIssueModalOpen: string | null;
  isDeleteIssueModalOpen: string | null;
  isArchiveIssueModalOpen: string | null;
  isRelationModalOpen: TIssueRelationModal | null;
  isSubIssuesModalOpen: string | null;
  attachmentDeleteModalId: string | null;
  isWorkItemToEpicModalOpen: string | null;
  isEpicToWorkItemModalOpen: string | null;
  isConversionWarningModalOpen: string | null;
  isPagesModalOpen: string | null;
  // computed
  isAnyModalOpen: boolean;
  isPeekOpen: boolean;
  // helper actions
  getIsIssuePeeked: (issueId: string) => boolean;
  // actions
  setPeekIssue: (peekIssue: TPeekIssue | undefined) => void;
  setIssueLinkData: (issueLinkData: TIssueLink | null) => void;
  toggleCreateIssueModal: (value: boolean) => void;
  toggleIssueLinkModal: (value: boolean) => void;
  toggleParentIssueModal: (issueId: string | null) => void;
  toggleDeleteIssueModal: (issueId: string | null) => void;
  toggleArchiveIssueModal: (value: string | null) => void;
  toggleRelationModal: (issueId: string | null, relationType: TIssueRelationTypes | null) => void;
  toggleSubIssuesModal: (value: string | null) => void;
  toggleDeleteAttachmentModal: (attachmentId: string | null) => void;
  setOpenWidgets: (state: TWorkItemWidgets[]) => void;
  setLastWidgetAction: (action: TWorkItemWidgets) => void;
  toggleOpenWidget: (state: TWorkItemWidgets) => void;
  setRelationKey: (relationKey: TIssueRelationTypes | null) => void;
  setIssueCrudOperationState: (state: TIssueCrudOperationState) => void;
  toggleWorkItemToEpicModal: (value: string | null) => void;
  toggleEpicToWorkItemModal: (value: string | null) => void;
  toggleConversionWarningModal: (value: string | null) => void;
  togglePagesModal: (value: string | null) => void;
  duplicateWorkItem: (
    workspaceSlug: string,
    workItemId: string,
    targetProjectId: string
  ) => Promise<TIssue | undefined>;
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
  pages: WorkItemPagesStore;
}

export class IssueDetail implements IIssueDetail {
  // observables
  peekIssue: TPeekIssue | undefined = undefined;
  relationKey: TIssueRelationTypes | null = null;
  issueLinkData: TIssueLink | null = null;
  issueCrudOperationState: TIssueCrudOperationState = {
    create: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
    existing: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
  };
  openWidgets: TWorkItemWidgets[] = ["sub-work-items", "links", "attachments"];
  lastWidgetAction: TWorkItemWidgets | null = null;
  isCreateIssueModalOpen: boolean = false;
  isIssueLinkModalOpen: boolean = false;
  isParentIssueModalOpen: string | null = null;
  isDeleteIssueModalOpen: string | null = null;
  isArchiveIssueModalOpen: string | null = null;
  isRelationModalOpen: TIssueRelationModal | null = null;
  isSubIssuesModalOpen: string | null = null;
  attachmentDeleteModalId: string | null = null;
  isWorkItemToEpicModalOpen: string | null = null;
  isEpicToWorkItemModalOpen: string | null = null;
  isConversionWarningModalOpen: string | null = null;
  isPagesModalOpen: string | null = null;
  // service type
  serviceType: TIssueServiceType;
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
  pages: WorkItemPagesStore;
  // services
  workItemService: IssueService;

  constructor(rootStore: IIssueRootStore, serviceType: TIssueServiceType) {
    makeObservable(this, {
      // observables
      peekIssue: observable,
      relationKey: observable,
      issueLinkData: observable,
      issueCrudOperationState: observable,
      isCreateIssueModalOpen: observable,
      isIssueLinkModalOpen: observable.ref,
      isParentIssueModalOpen: observable.ref,
      isDeleteIssueModalOpen: observable.ref,
      isArchiveIssueModalOpen: observable.ref,
      isRelationModalOpen: observable.ref,
      isSubIssuesModalOpen: observable.ref,
      attachmentDeleteModalId: observable.ref,
      openWidgets: observable.ref,
      lastWidgetAction: observable.ref,
      isWorkItemToEpicModalOpen: observable.ref,
      isEpicToWorkItemModalOpen: observable.ref,
      isConversionWarningModalOpen: observable.ref,
      isPagesModalOpen: observable.ref,
      // computed
      isAnyModalOpen: computed,
      isPeekOpen: computed,
      // action
      setPeekIssue: action,
      setIssueLinkData: action,
      toggleCreateIssueModal: action,
      toggleIssueLinkModal: action,
      toggleParentIssueModal: action,
      toggleDeleteIssueModal: action,
      toggleArchiveIssueModal: action,
      toggleRelationModal: action,
      toggleSubIssuesModal: action,
      toggleDeleteAttachmentModal: action,
      toggleWorkItemToEpicModal: action,
      toggleEpicToWorkItemModal: action,
      setOpenWidgets: action,
      setLastWidgetAction: action,
      toggleOpenWidget: action,
      setRelationKey: action,
      setIssueCrudOperationState: action,
      toggleConversionWarningModal: action,
      togglePagesModal: action,
      duplicateWorkItem: action,
    });

    // store
    this.serviceType = serviceType;
    this.rootIssueStore = rootStore;
    this.issue = new IssueStore(this, serviceType);
    this.reaction = new IssueReactionStore(this, serviceType);
    this.attachment = new IssueAttachmentStore(rootStore, serviceType);
    this.activity = new IssueActivityStore(rootStore.rootStore, serviceType);
    this.comment = new IssueCommentStore(this, serviceType);
    this.commentReaction = new IssueCommentReactionStore(this);
    this.subIssues = new IssueSubIssuesStore(this, serviceType);
    this.link = new IssueLinkStore(this, serviceType);
    this.subscription = new IssueSubscriptionStore(this, serviceType);
    this.relation = new IssueRelationStore(this);
    this.pages = new WorkItemPagesStore(rootStore);
    // services
    this.workItemService = new IssueService(serviceType);
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
      !!this.attachmentDeleteModalId ||
      !!this.isWorkItemToEpicModalOpen ||
      !!this.isEpicToWorkItemModalOpen ||
      !!this.isConversionWarningModalOpen ||
      !!this.isPagesModalOpen
    );
  }

  get isPeekOpen() {
    return !!this.peekIssue;
  }

  // helper actions
  getIsIssuePeeked = (issueId: string) => this.peekIssue?.issueId === issueId;

  // actions
  setRelationKey = (relationKey: TIssueRelationTypes | null) => (this.relationKey = relationKey);
  setIssueCrudOperationState = (state: TIssueCrudOperationState) => (this.issueCrudOperationState = state);
  setPeekIssue = (peekIssue: TPeekIssue | undefined) => (this.peekIssue = peekIssue);
  toggleCreateIssueModal = (value: boolean) => (this.isCreateIssueModalOpen = value);
  toggleIssueLinkModal = (value: boolean) => (this.isIssueLinkModalOpen = value);
  toggleParentIssueModal = (issueId: string | null) => (this.isParentIssueModalOpen = issueId);
  toggleDeleteIssueModal = (issueId: string | null) => (this.isDeleteIssueModalOpen = issueId);
  toggleArchiveIssueModal = (issueId: string | null) => (this.isArchiveIssueModalOpen = issueId);
  toggleRelationModal = (issueId: string | null, relationType: TIssueRelationTypes | null) =>
    (this.isRelationModalOpen = { issueId, relationType });
  toggleSubIssuesModal = (issueId: string | null) => (this.isSubIssuesModalOpen = issueId);
  toggleDeleteAttachmentModal = (attachmentId: string | null) => (this.attachmentDeleteModalId = attachmentId);
  setOpenWidgets = (state: TWorkItemWidgets[]) => {
    this.openWidgets = state;
    if (this.lastWidgetAction) this.lastWidgetAction = null;
  };
  setLastWidgetAction = (action: TWorkItemWidgets) => {
    this.openWidgets = [action];
  };
  toggleOpenWidget = (state: TWorkItemWidgets) => {
    if (this.openWidgets && this.openWidgets.includes(state))
      this.openWidgets = this.openWidgets.filter((s) => s !== state);
    else this.openWidgets = [state, ...this.openWidgets];
  };
  setIssueLinkData = (issueLinkData: TIssueLink | null) => (this.issueLinkData = issueLinkData);
  toggleWorkItemToEpicModal = (value: string | null) => (this.isWorkItemToEpicModalOpen = value);
  toggleEpicToWorkItemModal = (value: string | null) => (this.isEpicToWorkItemModalOpen = value);
  toggleConversionWarningModal = (value: string | null) => (this.isConversionWarningModalOpen = value);
  togglePagesModal = (value: string | null) => (this.isPagesModalOpen = value);
  /**
   * Duplicate a work item to a target project
   * @param workspaceSlug - The slug of the workspace
   * @param workItemId - The id of the work item / epic to duplicate
   * @param targetProjectId - The id of the target project
   * @returns The duplicated work item
   */
  duplicateWorkItem = async (workspaceSlug: string, workItemId: string, targetProjectId: string) => {
    const response = await this.workItemService.duplicateWorkItem(workspaceSlug, workItemId, targetProjectId);
    // Add work item to the target project
    this.rootIssueStore.issues.addIssue([response]);
    return response;
  };
  // issue
  fetchIssue = async (workspaceSlug: string, projectId: string, issueId: string) =>
    this.issue.fetchIssue(workspaceSlug, projectId, issueId);
  fetchWorkItemWithIdentifier = async (workspaceSlug: string, identifier: string) =>
    this.issue.fetchWorkItemWithIdentifier(workspaceSlug, identifier);
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
  changeModulesInIssue = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    addModuleIds: string[],
    removeModuleIds: string[]
  ) => this.issue.changeModulesInIssue(workspaceSlug, projectId, issueId, addModuleIds, removeModuleIds);
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
  createAttachment = async (workspaceSlug: string, projectId: string, issueId: string, file: File) =>
    this.attachment.createAttachment(workspaceSlug, projectId, issueId, file);
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
    relatedIssue: string,
    updateLocally?: boolean
  ) => this.relation.removeRelation(workspaceSlug, projectId, issueId, relationType, relatedIssue, updateLocally);

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
