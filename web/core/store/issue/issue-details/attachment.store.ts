import concat from "lodash/concat";
import pull from "lodash/pull";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import { TIssueAttachment, TIssueAttachmentMap, TIssueAttachmentIdMap } from "@plane/types";
// services
import { IssueAttachmentService } from "@/services/issue";
import { IIssueRootStore } from "../root.store";
import { IIssueDetail } from "./root.store";

export interface IIssueAttachmentStoreActions {
  addAttachments: (issueId: string, attachments: TIssueAttachment[]) => void;
  fetchAttachments: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueAttachment[]>;
  createAttachment: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: FormData
  ) => Promise<TIssueAttachment>;
  removeAttachment: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    attachmentId: string
  ) => Promise<TIssueAttachment>;
}

export interface IIssueAttachmentStore extends IIssueAttachmentStoreActions {
  // observables
  attachments: TIssueAttachmentIdMap;
  attachmentMap: TIssueAttachmentMap;
  // computed
  issueAttachments: string[] | undefined;
  // helper methods
  getAttachmentsByIssueId: (issueId: string) => string[] | undefined;
  getAttachmentById: (attachmentId: string) => TIssueAttachment | undefined;
}

export class IssueAttachmentStore implements IIssueAttachmentStore {
  // observables
  attachments: TIssueAttachmentIdMap = {};
  attachmentMap: TIssueAttachmentMap = {};
  // root store
  rootIssueStore: IIssueRootStore;
  rootIssueDetailStore: IIssueDetail;
  // services
  issueAttachmentService;

  constructor(rootStore: IIssueRootStore) {
    makeObservable(this, {
      // observables
      attachments: observable,
      attachmentMap: observable,
      // computed
      issueAttachments: computed,
      // actions
      addAttachments: action.bound,
      fetchAttachments: action,
      createAttachment: action,
      removeAttachment: action,
    });
    // root store
    this.rootIssueStore = rootStore;
    this.rootIssueDetailStore = rootStore.issueDetail;
    // services
    this.issueAttachmentService = new IssueAttachmentService();
  }

  // computed
  get issueAttachments() {
    const issueId = this.rootIssueDetailStore.peekIssue?.issueId;
    if (!issueId) return undefined;
    return this.attachments[issueId] ?? undefined;
  }

  // helper methods
  getAttachmentsByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.attachments[issueId] ?? undefined;
  };

  getAttachmentById = (attachmentId: string) => {
    if (!attachmentId) return undefined;
    return this.attachmentMap[attachmentId] ?? undefined;
  };

  // actions
  addAttachments = (issueId: string, attachments: TIssueAttachment[]) => {
    if (attachments && attachments.length > 0) {
      const newAttachmentIds = attachments.map((attachment) => attachment.id);
      runInAction(() => {
        update(this.attachments, [issueId], (attachmentIds = []) => uniq(concat(attachmentIds, newAttachmentIds)));
        attachments.forEach((attachment) => set(this.attachmentMap, attachment.id, attachment));
      });
    }
  };

  fetchAttachments = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const response = await this.issueAttachmentService.getIssueAttachment(workspaceSlug, projectId, issueId);
    this.addAttachments(issueId, response);
    return response;
  };

  createAttachment = async (workspaceSlug: string, projectId: string, issueId: string, data: FormData) => {
    const response = await this.issueAttachmentService.uploadIssueAttachment(workspaceSlug, projectId, issueId, data);
    const issueAttachmentsCount = this.getAttachmentsByIssueId(issueId)?.length ?? 0;

    if (response && response.id) {
      runInAction(() => {
        update(this.attachments, [issueId], (attachmentIds = []) => uniq(concat(attachmentIds, [response.id])));
        set(this.attachmentMap, response.id, response);
        this.rootIssueStore.issues.updateIssue(issueId, {
          attachment_count: issueAttachmentsCount + 1, // increment attachment count
        });
      });
    }

    return response;
  };

  removeAttachment = async (workspaceSlug: string, projectId: string, issueId: string, attachmentId: string) => {
    const response = await this.issueAttachmentService.deleteIssueAttachment(
      workspaceSlug,
      projectId,
      issueId,
      attachmentId
    );
    const issueAttachmentsCount = this.getAttachmentsByIssueId(issueId)?.length ?? 1;

    runInAction(() => {
      update(this.attachments, [issueId], (attachmentIds = []) => {
        if (attachmentIds.includes(attachmentId)) pull(attachmentIds, attachmentId);
        return attachmentIds;
      });
      delete this.attachmentMap[attachmentId];
      this.rootIssueStore.issues.updateIssue(issueId, {
        attachment_count: issueAttachmentsCount - 1, // decrement attachment count
      });
    });

    return response;
  };
}
