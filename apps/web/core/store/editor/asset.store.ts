import { debounce, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { v4 as uuidv4 } from "uuid";
// plane types
import type { EFileAssetType, TFileEntityInfo, TFileSignedURLResponse } from "@plane/types";
// services
import { FileService } from "@/services/file.service";
import type { TAttachmentUploadStatus } from "../issue/issue-details/attachment.store";

export interface IEditorAssetStore {
  // computed
  assetsUploadPercentage: Record<string, number>;
  // helper methods
  getAssetUploadStatusByEditorBlockId: (blockId: string) => TAttachmentUploadStatus | undefined;
  // actions
  uploadEditorAsset: ({
    blockId,
    data,
    file,
    projectId,
    workspaceSlug,
  }: {
    blockId: string;
    data: TFileEntityInfo;
    file: File;
    projectId?: string;
    workspaceSlug: string;
  }) => Promise<TFileSignedURLResponse>;
  duplicateEditorAsset: ({
    assetId,
    entityId,
    entityType,
    projectId,
    workspaceSlug,
  }: {
    assetId: string;
    entityId?: string;
    entityType: EFileAssetType;
    projectId?: string;
    workspaceSlug: string;
  }) => Promise<{ asset_id: string }>;
}

export class EditorAssetStore implements IEditorAssetStore {
  // observables
  assetsUploadStatus: Record<string, TAttachmentUploadStatus> = {};
  // services
  fileService: FileService;

  constructor() {
    makeObservable(this, {
      // observables
      assetsUploadStatus: observable,
      // computed
      assetsUploadPercentage: computed,
      // actions
      uploadEditorAsset: action,
    });
    // services
    this.fileService = new FileService();
  }

  get assetsUploadPercentage() {
    const assetsStatus = this.assetsUploadStatus;
    const assetsPercentage: Record<string, number> = {};
    Object.keys(assetsStatus).forEach((blockId) => {
      const asset = assetsStatus[blockId];
      if (asset) assetsPercentage[blockId] = asset.progress;
    });
    return assetsPercentage;
  }

  // helper methods
  getAssetUploadStatusByEditorBlockId: IEditorAssetStore["getAssetUploadStatusByEditorBlockId"] = computedFn(
    (blockId) => {
      const blockDetails = this.assetsUploadStatus[blockId];
      if (!blockDetails) return undefined;
      return blockDetails;
    }
  );

  // actions
  private debouncedUpdateProgress = debounce((blockId: string, progress: number) => {
    runInAction(() => {
      set(this.assetsUploadStatus, [blockId, "progress"], progress);
    });
  }, 16);

  uploadEditorAsset: IEditorAssetStore["uploadEditorAsset"] = async (args) => {
    const { blockId, data, file, projectId, workspaceSlug } = args;
    const tempId = uuidv4();

    try {
      // update attachment upload status
      runInAction(() => {
        set(this.assetsUploadStatus, [blockId], {
          id: tempId,
          name: file.name,
          progress: 0,
          size: file.size,
          type: file.type,
        });
      });
      if (projectId) {
        const response = await this.fileService.uploadProjectAsset(
          workspaceSlug,
          projectId,
          data,
          file,
          (progressEvent) => {
            const progressPercentage = Math.round((progressEvent.progress ?? 0) * 100);
            this.debouncedUpdateProgress(blockId, progressPercentage);
          }
        );
        return response;
      } else {
        const response = await this.fileService.uploadWorkspaceAsset(workspaceSlug, data, file, (progressEvent) => {
          const progressPercentage = Math.round((progressEvent.progress ?? 0) * 100);
          this.debouncedUpdateProgress(blockId, progressPercentage);
        });
        return response;
      }
    } catch (error) {
      console.error("Error in uploading page asset:", error);
      throw error;
    } finally {
      runInAction(() => {
        delete this.assetsUploadStatus[blockId];
      });
    }
  };
  duplicateEditorAsset: IEditorAssetStore["duplicateEditorAsset"] = async (args) => {
    const { assetId, entityId, entityType, projectId, workspaceSlug } = args;
    const { asset_id } = await this.fileService.duplicateAsset(workspaceSlug, assetId, {
      entity_id: entityId,
      entity_type: entityType,
      project_id: projectId,
    });
    return { asset_id };
  };
}
