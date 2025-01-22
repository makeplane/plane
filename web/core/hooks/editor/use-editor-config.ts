import { useCallback } from "react";
// plane editor
import { TFileHandler, TReadOnlyFileHandler } from "@plane/editor";
// helpers
import { getEditorAssetSrc } from "@/helpers/editor.helper";
// hooks
import { useEditorAsset } from "@/hooks/store";
// plane web hooks
import { useFileSize } from "@/plane-web/hooks/use-file-size";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();

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
    (args: Pick<TArgs, "projectId" | "workspaceId" | "workspaceSlug">): TReadOnlyFileHandler => {
      const { projectId, workspaceId, workspaceSlug } = args;

      return {
        getAssetSrc: async (path) => {
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
    (args: TArgs): TFileHandler => {
      const { projectId, uploadFile, workspaceId, workspaceSlug } = args;

      return {
        ...getReadOnlyEditorFileHandlers({
          projectId,
          workspaceId,
          workspaceSlug,
        }),
        assetsUploadStatus: assetsUploadPercentage,
        upload: uploadFile,
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
      };
    },
    [assetsUploadPercentage, getReadOnlyEditorFileHandlers, maxFileSize]
  );

  return {
    getEditorFileHandlers,
    getReadOnlyEditorFileHandlers,
  };
};
