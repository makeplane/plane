import { concat, debounce, pull, set, uniq, update } from "lodash-es";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
// services
import { ProjectAttachmentService } from "@/plane-web/services";
import { TProjectAttachment, TProjectAttachmentMap, TProjectAttachmentIdMap } from "@/plane-web/types";
import { IProjectStore } from "../projects";

export type TAttachmentUploadStatus = {
  id: string;
  name: string;
  progress: number;
  size: number;
  type: string;
};

export interface IProjectAttachmentStoreActions {
  // actions
  addAttachments: (projectId: string, attachments: TProjectAttachment[]) => void;
  fetchAttachments: (workspaceSlug: string, projectId: string) => Promise<TProjectAttachment[]>;
  createAttachment: (workspaceSlug: string, projectId: string, file: File) => Promise<TProjectAttachment>;
  removeAttachment: (workspaceSlug: string, projectId: string, attachmentId: string) => Promise<TProjectAttachment>;
}

export interface IProjectAttachmentStore extends IProjectAttachmentStoreActions {
  // observables
  attachments: TProjectAttachmentIdMap;
  attachmentMap: TProjectAttachmentMap;
  attachmentsUploadStatusMap: Record<string, Record<string, TAttachmentUploadStatus>>;
  // helper methods
  getAttachmentsUploadStatusByProjectId: (projectId: string) => TAttachmentUploadStatus[] | undefined;
  getAttachmentsByProjectId: (projectId: string) => string[] | undefined;
  getAttachmentById: (attachmentId: string) => TProjectAttachment | undefined;
}

export class ProjectAttachmentStore implements IProjectAttachmentStore {
  // observables
  attachments: TProjectAttachmentIdMap = {};
  attachmentMap: TProjectAttachmentMap = {};
  attachmentsUploadStatusMap: Record<string, Record<string, TAttachmentUploadStatus>> = {};
  // root store
  rootProjectStore: IProjectStore;
  // services
  projectAttachmentService: ProjectAttachmentService;

  constructor(rootStore: IProjectStore) {
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
    this.rootProjectStore = rootStore;
    // services
    this.projectAttachmentService = new ProjectAttachmentService();
  }

  // helper methods
  getAttachmentsUploadStatusByProjectId = computedFn((projectId: string) => {
    if (!projectId) return undefined;
    const attachmentsUploadStatus = Object.values(this.attachmentsUploadStatusMap[projectId] ?? {});
    return attachmentsUploadStatus ?? undefined;
  });

  getAttachmentsByProjectId = (projectId: string) => {
    if (!projectId) return undefined;
    return this.attachments[projectId] ?? undefined;
  };

  getAttachmentById = (attachmentId: string) => {
    if (!attachmentId) return undefined;
    return this.attachmentMap[attachmentId] ?? undefined;
  };

  // actions
  addAttachments = (projectId: string, attachments: TProjectAttachment[]) => {
    if (attachments && attachments.length > 0) {
      const newAttachmentIds = attachments.map((attachment) => attachment.id);
      runInAction(() => {
        update(this.attachments, [projectId], (attachmentIds = []) => uniq(concat(attachmentIds, newAttachmentIds)));
        attachments.forEach((attachment) => set(this.attachmentMap, attachment.id, attachment));
      });
    }
  };

  fetchAttachments = async (workspaceSlug: string, projectId: string) => {
    const response = await this.projectAttachmentService.getProjectAttachments(workspaceSlug, projectId);
    this.addAttachments(projectId, response);
    return response;
  };

  debouncedUpdateProgress = debounce((projectId: string, tempId: string, progress: number) => {
    runInAction(() => {
      set(this.attachmentsUploadStatusMap, [projectId, tempId, "progress"], progress);
    });
  }, 16);

  createAttachment = async (workspaceSlug: string, projectId: string, file: File) => {
    const tempId = uuidv4();
    try {
      // update attachment upload status
      runInAction(() => {
        set(this.attachmentsUploadStatusMap, [projectId, tempId], {
          id: tempId,
          name: file.name,
          progress: 0,
          size: file.size,
          type: file.type,
        });
      });
      const response = await this.projectAttachmentService.uploadProjectAttachment(
        workspaceSlug,
        projectId,
        file,
        (progressEvent) => {
          const progressPercentage = Math.round((progressEvent.progress ?? 0) * 100);
          this.debouncedUpdateProgress(projectId, tempId, progressPercentage);
        }
      );
      // const projectAttachmentsCount = this.getAttachmentsByProjectId(projectId)?.length ?? 0;

      if (response && response.id) {
        runInAction(() => {
          update(this.attachments, [projectId], (attachmentIds = []) => uniq(concat([response.id], attachmentIds)));
          set(this.attachmentMap, response.id, response);
          // this.rootProjectStore.projects.updateProject(projectId, {
          //   attachment_count: projectAttachmentsCount + 1, // increment attachment count
          // });
        });
      }

      return response;
    } catch (error) {
      console.error("Error in uploading project attachment:", error);
      throw error;
    } finally {
      runInAction(() => {
        delete this.attachmentsUploadStatusMap[projectId][tempId];
      });
    }
  };

  removeAttachment = async (workspaceSlug: string, projectId: string, attachmentId: string) => {
    const response = await this.projectAttachmentService.deleteProjectAttachment(
      workspaceSlug,
      projectId,
      attachmentId
    );

    runInAction(() => {
      update(this.attachments, [projectId], (attachmentIds = []) => {
        if (attachmentIds.includes(attachmentId)) pull(attachmentIds, attachmentId);
        return attachmentIds;
      });
      delete this.attachmentMap[attachmentId];
    });

    return response;
  };
}
