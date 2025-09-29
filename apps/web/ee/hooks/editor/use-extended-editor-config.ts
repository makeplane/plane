import { useCallback } from "react";
// plane imports
import type { TFileSignedURLResponse } from "@plane/types";
import { getEditorAssetSrc, getAssetIdFromUrl } from "@plane/utils";
// ce imports
import type { TExtendedEditorConfig } from "@/ce/hooks/editor/use-extended-editor-config";
// services
import { liveService } from "@/plane-web/services/live.service";
import { FileService } from "@/services/file.service";
const fileService = new FileService();

export const useExtendedEditorConfig = (): TExtendedEditorConfig => {
  const getExtendedEditorFileHandlers: TExtendedEditorConfig["getExtendedEditorFileHandlers"] = useCallback(
    ({ projectId, workspaceSlug }) => ({
      reupload: async (_blockId, file, assetSrc) => {
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
      getFileContent: async (xmlSrc) => {
        if (!xmlSrc) return "";
        try {
          let fileUrl: string;
          if (xmlSrc.startsWith("http")) {
            fileUrl = xmlSrc;
          } else {
            fileUrl =
              getEditorAssetSrc({
                assetId: xmlSrc,
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
    }),
    []
  );

  return {
    getExtendedEditorFileHandlers,
  };
};
