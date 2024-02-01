import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
import update from "lodash/update";
import concat from "lodash/concat";
import uniq from "lodash/uniq";
import pull from "lodash/pull";
// services
import { IssueAttachmentService } from "services/issue";
// types
import { IIssueDetail } from "./root.store";
import { TIssueAttachment, TIssueAttachmentMap, TIssueAttachmentIdMap } from "@plane/types";

export interface IIssueAttachmentStoreActions {
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
  rootIssueDetailStore: IIssueDetail;
  // services
  issueAttachmentService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      attachments: observable,
      attachmentMap: observable,
      // computed
      issueAttachments: computed,
      // actions
      fetchAttachments: action,
      createAttachment: action,
      removeAttachment: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
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
  fetchAttachments = async (workspaceSlug: string, projectId: string, issueId: string) => {
    try {
      const response = await this.issueAttachmentService.getIssueAttachment(workspaceSlug, projectId, issueId);

      if (response && response.length > 0) {
        const _attachmentIds = response.map((attachment) => attachment.id);
        runInAction(() => {
          update(this.attachments, [issueId], (attachmentIds = []) => uniq(concat(attachmentIds, _attachmentIds)));
          response.forEach((attachment) => set(this.attachmentMap, attachment.id, attachment));
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  createAttachment = async (workspaceSlug: string, projectId: string, issueId: string, data: FormData) => {
    try {
      const response = await this.issueAttachmentService.uploadIssueAttachment(workspaceSlug, projectId, issueId, data);

      if (response && response.id)
        runInAction(() => {
          update(this.attachments, [issueId], (attachmentIds = []) => uniq(concat(attachmentIds, [response.id])));
          set(this.attachmentMap, response.id, response);
        });

      return response;
    } catch (error) {
      throw error;
    }
  };

  removeAttachment = async (workspaceSlug: string, projectId: string, issueId: string, attachmentId: string) => {
    try {
      const response = await this.issueAttachmentService.deleteIssueAttachment(
        workspaceSlug,
        projectId,
        issueId,
        attachmentId
      );

      runInAction(() => {
        update(this.attachments, [issueId], (attachmentIds = []) => {
          if (attachmentIds.includes(attachmentId)) pull(attachmentIds, attachmentId);
          return attachmentIds;
        });
        delete this.attachmentMap[attachmentId];
      });

      return response;
    } catch (error) {
      throw error;
    }
  };
}
