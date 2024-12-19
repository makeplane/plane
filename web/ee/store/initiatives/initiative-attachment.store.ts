import { debounce } from "lodash";
import concat from "lodash/concat";
import pull from "lodash/pull";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
import { TInitiativeAttachment, TInitiativeAttachmentIdMap, TInitiativeAttachmentMap } from "@plane/types";
import { InitiativeAttachmentService } from "@/plane-web/services/initiative_attachment.service";
import { IInitiativeStore } from "./initiatives.store";
// services

export type TAttachmentUploadStatus = {
  id: string;
  name: string;
  progress: number;
  size: number;
  type: string;
};

export interface IInitiativeAttachmentStoreActions {
  // actions
  addAttachments: (initiativeId: string, attachments: TInitiativeAttachment[]) => void;
  fetchAttachments: (workspaceSlug: string, initiativeId: string) => Promise<TInitiativeAttachment[]>;
  createAttachment: (workspaceSlug: string, initiativeId: string, file: File) => Promise<TInitiativeAttachment>;
  removeAttachment: (
    workspaceSlug: string,
    initiativeId: string,
    attachmentId: string
  ) => Promise<TInitiativeAttachment>;
}

export interface IInitiativeAttachmentStore extends IInitiativeAttachmentStoreActions {
  // observables
  attachments: TInitiativeAttachmentIdMap;
  attachmentMap: TInitiativeAttachmentMap;
  attachmentsUploadStatusMap: Record<string, Record<string, TAttachmentUploadStatus>>;
  // helper methods
  getAttachmentsUploadStatusByInitiativeId: (initiativeId: string) => TAttachmentUploadStatus[] | undefined;
  getAttachmentsByInitiativeId: (initiativeId: string) => string[] | undefined;
  getAttachmentById: (attachmentId: string) => TInitiativeAttachment | undefined;
}

export class InitiativeAttachmentStore implements IInitiativeAttachmentStore {
  // observables
  attachments: TInitiativeAttachmentIdMap = {};
  attachmentMap: TInitiativeAttachmentMap = {};
  attachmentsUploadStatusMap: Record<string, Record<string, TAttachmentUploadStatus>> = {};
  // root store
  rootInitiativeStore: IInitiativeStore;
  // services
  initiativeAttachmentService: InitiativeAttachmentService;

  constructor(rootStore: IInitiativeStore) {
    makeObservable(this, {
      // observables
      attachments: observable,
      attachmentMap: observable,
      attachmentsUploadStatusMap: observable,
      // actions
      addAttachments: action.bound,
      fetchAttachments: action,
      createAttachment: action,
      removeAttachment: action,
    });
    // root store
    this.rootInitiativeStore = rootStore;
    // services
    this.initiativeAttachmentService = new InitiativeAttachmentService();
  }

  // helper methods
  getAttachmentsUploadStatusByInitiativeId = computedFn((initiativeId: string) => {
    if (!initiativeId) return undefined;
    const attachmentsUploadStatus = Object.values(this.attachmentsUploadStatusMap[initiativeId] ?? {});
    return attachmentsUploadStatus ?? undefined;
  });

  getAttachmentsByInitiativeId = (initiativeId: string) => {
    if (!initiativeId) return undefined;
    return this.attachments[initiativeId] ?? undefined;
  };

  getAttachmentById = (attachmentId: string) => {
    if (!attachmentId) return undefined;
    return this.attachmentMap[attachmentId] ?? undefined;
  };

  // actions
  addAttachments = (initiativeId: string, attachments: TInitiativeAttachment[]) => {
    if (attachments && attachments.length > 0) {
      const newAttachmentIds = attachments.map((attachment) => attachment.id);
      runInAction(() => {
        update(this.attachments, [initiativeId], (attachmentIds = []) => uniq(concat(attachmentIds, newAttachmentIds)));
        attachments.forEach((attachment) => set(this.attachmentMap, attachment.id, attachment));
      });
    }
  };

  fetchAttachments = async (workspaceSlug: string, initiativeId: string) => {
    try {
      const response = await this.initiativeAttachmentService.getInitiativeAttachments(workspaceSlug, initiativeId);
      this.addAttachments(initiativeId, response);
      return response;
    } catch (error) {
      console.error("Error fetching initiative attachments:", error);
      throw error;
    }
  };

  debouncedUpdateProgress = debounce((initiativeId: string, tempId: string, progress: number) => {
    runInAction(() => {
      set(this.attachmentsUploadStatusMap, [initiativeId, tempId, "progress"], progress);
    });
  }, 16);

  createAttachment = async (workspaceSlug: string, initiativeId: string, file: File) => {
    const tempId = uuidv4();
    try {
      // update attachment upload status
      runInAction(() => {
        set(this.attachmentsUploadStatusMap, [initiativeId, tempId], {
          id: tempId,
          name: file.name,
          progress: 0,
          size: file.size,
          type: file.type,
        });
      });
      const response = await this.initiativeAttachmentService.uploadInitiativeAttachment(
        workspaceSlug,
        initiativeId,
        file,
        (progressEvent) => {
          const progressPercentage = Math.round((progressEvent.progress ?? 0) * 100);
          this.debouncedUpdateProgress(initiativeId, tempId, progressPercentage);
        }
      );

      if (response && response.id) {
        runInAction(() => {
          update(this.attachments, [initiativeId], (attachmentIds = []) => uniq(concat([response.id], attachmentIds)));
          set(this.attachmentMap, response.id, response);
        });
      }

      return response;
    } catch (error) {
      console.error("Error in uploading initiative attachment:", error);
      throw error;
    } finally {
      runInAction(() => {
        delete this.attachmentsUploadStatusMap[initiativeId][tempId];
      });
    }
  };

  removeAttachment = async (workspaceSlug: string, initiativeId: string, attachmentId: string) => {
    // eslint-disable-next-line no-useless-catch
    try {
      const response = await this.initiativeAttachmentService.deleteInitiativeAttachment(
        workspaceSlug,
        initiativeId,
        attachmentId
      );

      runInAction(() => {
        update(this.attachments, [initiativeId], (attachmentIds) => pull(attachmentIds ?? [], attachmentId));
        delete this.attachmentMap[attachmentId];
      });

      return response;
    } catch (error) {
      throw error;
    }
  };
}
