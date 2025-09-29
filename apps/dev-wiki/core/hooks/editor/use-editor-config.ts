import { useCallback } from "react";
// plane editor
import type { TFileHandler } from "@plane/editor";
// helpers
import { TFileSignedURLResponse } from "@plane/types";
import { getEditorAssetSrc } from "@/helpers/editor.helper";
import { getAssetIdFromUrl } from "@/helpers/file.helper";
// hooks
import { useEditorAsset } from "@/hooks/store";
// plane web hooks
import { useFileSize } from "@/plane-web/hooks/use-file-size";
// services
import { liveService } from "@/plane-web/services/live.service";
import { FileService } from "@/services/file.service";
const fileService = new FileService();

// Extended file handler type that includes diagram content method
type TExtendedFileHandler = TFileHandler & {
  getFileContent: (src: string) => Promise<string>;
};

type TArgs = {
  projectId?: string;
  uploadFile: TFileHandler["upload"];
  workspaceId: string;
  workspaceSlug: string;
};

export const useEditorConfig = () => {
  // store hooks
  const { assetsUploadPercentage } = useEditorAsset();
  // file size
  const { maxFileSize } = useFileSize();

  const getReadOnlyEditorFileHandlers = useCallback(
    (args: Pick<TArgs, "projectId" | "workspaceId" | "workspaceSlug">) => {
      const { projectId, workspaceId, workspaceSlug } = args;

      return {
        checkIfAssetExists: async (assetId: string) => {
          const res = await fileService.checkIfAssetExists(workspaceSlug, assetId);
          return res?.exists ?? false;
        },
        getAssetSrc: async (path: string) => {
          if (!path) return "";
          if (path?.startsWith("http")) {
            return path;
          } else {
            return (
              getEditorAssetSrc({
                assetId: path,
                projectId,
                workspaceSlug,
              }) ?? ""
            );
          }
        },
        getAssetDownloadSrc: async (path: string) => {
          if (!path) return "";
          if (path?.startsWith("http")) {
            return path;
          } else {
            return (
              getEditorAssetSrc({
                assetId: path,
                projectId,
                workspaceSlug,
              }) ?? ""
            );
          }
        },
        getFileContent: async (src: string): Promise<string> => {
          if (!src) return "";

          try {
            // Get the .drawio file URL
            let fileUrl: string;
            if (src.startsWith("http")) {
              fileUrl = src;
            } else {
              fileUrl =
                getEditorAssetSrc({
                  assetId: src,
                  projectId,
                  workspaceSlug,
                }) ?? "";
            }

            if (!fileUrl) return "";

            return liveService.getContent(fileUrl);
          } catch (error) {
            console.error("Error loading diagram content:", error);
            return "";
          }
        },
        restore: async (src: string) => {
          if (src?.startsWith("http")) {
            await fileService.restoreOldEditorAsset(workspaceId, src);
          } else {
            await fileService.restoreNewAsset(workspaceSlug, src);
          }
        },
      };
    },
    []
  );

  const getEditorFileHandlers = useCallback(
    (args: TArgs): TExtendedFileHandler => {
      const { projectId, uploadFile, workspaceId, workspaceSlug } = args;

      return {
        ...getReadOnlyEditorFileHandlers({
          projectId,
          workspaceId,
          workspaceSlug,
        }),
        assetsUploadStatus: assetsUploadPercentage,
        upload: uploadFile,
        reupload: async (blockId: string, file: File, assetSrc: string): Promise<string> => {
          const assetId = getAssetIdFromUrl(assetSrc);
          let response: TFileSignedURLResponse;
          if (projectId) {
            // Project-level asset reupload
            response = await fileService.reuploadProjectAsset(workspaceSlug, projectId, assetId, file);
          } else {
            // Workspace-level asset reupload
            response = await fileService.reuploadWorkspaceAsset(workspaceSlug, assetId, file);
          }
          return response.asset_id;
        },
        delete: async (src: string) => {
          if (src?.startsWith("http")) {
            await fileService.deleteOldWorkspaceAsset(workspaceId, src);
          } else {
            await fileService.deleteNewAsset(
              getEditorAssetSrc({
                assetId: src,
                projectId,
                workspaceSlug,
              }) ?? ""
            );
          }
        },
        cancel: fileService.cancelUpload,
        validation: {
          maxFileSize,
        },
      } as TExtendedFileHandler;
    },
    [assetsUploadPercentage, getReadOnlyEditorFileHandlers, maxFileSize]
  );

  return {
    getEditorFileHandlers,
    getReadOnlyEditorFileHandlers,
  };
};
