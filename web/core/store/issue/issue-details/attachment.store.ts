import concat from "lodash/concat";
import debounce from "lodash/debounce";
import pull from "lodash/pull";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
// types
import { TIssueAttachment, TIssueAttachmentMap, TIssueAttachmentIdMap, TIssueServiceType } from "@plane/types";
// services
import { IssueAttachmentService } from "@/services/issue";
import { IIssueRootStore } from "../root.store";
import { IIssueDetail } from "./root.store";

export type TAttachmentUploadStatus = {
  id: string;
  name: string;
  progress: number;
  size: number;
  type: string;
};

export interface IIssueAttachmentStoreActions {
  // actions
  addAttachments: (issueId: string, attachments: TIssueAttachment[]) => void;
  fetchAttachments: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueAttachment[]>;
  createAttachment: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    file: File
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
  attachmentsUploadStatusMap: Record<string, Record<string, TAttachmentUploadStatus>>;
  // computed
  issueAttachments: string[] | undefined;
  // helper methods
  getAttachmentsUploadStatusByIssueId: (issueId: string) => TAttachmentUploadStatus[] | undefined;
  getAttachmentsByIssueId: (issueId: string) => string[] | undefined;
  getAttachmentById: (attachmentId: string) => TIssueAttachment | undefined;
  getAttachmentsCountByIssueId: (issueId: string) => number;
}

export class IssueAttachmentStore implements IIssueAttachmentStore {
  // observables
  attachments: TIssueAttachmentIdMap = {};
  attachmentMap: TIssueAttachmentMap = {};
  attachmentsUploadStatusMap: Record<string, Record<string, TAttachmentUploadStatus>> = {};
  // root store
  rootIssueStore: IIssueRootStore;
  rootIssueDetailStore: IIssueDetail;
  // services
  issueAttachmentService;

  constructor(rootStore: IIssueRootStore, serviceType: TIssueServiceType) {
    makeObservable(this, {
      // observables
      attachments: observable,
      attachmentMap: observable,
      attachmentsUploadStatusMap: observable,
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
    this.issueAttachmentService = new IssueAttachmentService(serviceType);
  }

  // computed
  get issueAttachments() {
    const issueId = this.rootIssueDetailStore.peekIssue?.issueId;
    if (!issueId) return undefined;
    return this.attachments[issueId] ?? undefined;
  }

  // helper methods
  getAttachmentsUploadStatusByIssueId = computedFn((issueId: string) => {
    if (!issueId) return undefined;
    const attachmentsUploadStatus = Object.values(this.attachmentsUploadStatusMap[issueId] ?? {});
    return attachmentsUploadStatus ?? undefined;
  });

  getAttachmentsByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.attachments[issueId] ?? undefined;
  };

  getAttachmentById = (attachmentId: string) => {
    if (!attachmentId) return undefined;
    return this.attachmentMap[attachmentId] ?? undefined;
  };

  getAttachmentsCountByIssueId = (issueId: string) => {
    const attachments = this.getAttachmentsByIssueId(issueId);
    return attachments?.length ?? 0;
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
    const response = await this.issueAttachmentService.getIssueAttachments(workspaceSlug, projectId, issueId);
    this.addAttachments(issueId, response);
    return response;
  };

  private debouncedUpdateProgress = debounce((issueId: string, tempId: string, progress: number) => {
    runInAction(() => {
      set(this.attachmentsUploadStatusMap, [issueId, tempId, "progress"], progress);
    });
  }, 16);

  createAttachment = async (workspaceSlug: string, projectId: string, issueId: string, file: File) => {
    const tempId = uuidv4();
    try {
      // update attachment upload status
      runInAction(() => {
        set(this.attachmentsUploadStatusMap, [issueId, tempId], {
          id: tempId,
          name: file.name,
          progress: 0,
          size: file.size,
          type: file.type,
        });
      });
      const response = await this.issueAttachmentService.uploadIssueAttachment(
        workspaceSlug,
        projectId,
        issueId,
        file,
        (progressEvent) => {
          const progressPercentage = Math.round((progressEvent.progress ?? 0) * 100);
          this.debouncedUpdateProgress(issueId, tempId, progressPercentage);
        }
      );

      if (response && response.id) {
        runInAction(() => {
          update(this.attachments, [issueId], (attachmentIds = []) => uniq(concat(attachmentIds, [response.id])));
          set(this.attachmentMap, response.id, response);
          this.rootIssueStore.issues.updateIssue(issueId, {
            attachment_count: this.getAttachmentsCountByIssueId(issueId),
          });
        });
      }

      return response;
    } catch (error) {
      console.error("Error in uploading issue attachment:", error);
      throw error;
    } finally {
      runInAction(() => {
        delete this.attachmentsUploadStatusMap[issueId][tempId];
      });
    }
  };

  removeAttachment = async (workspaceSlug: string, projectId: string, issueId: string, attachmentId: string) => {
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
      this.rootIssueStore.issues.updateIssue(issueId, {
        attachment_count: this.getAttachmentsCountByIssueId(issueId),
      });
    });

    return response;
  };
}
