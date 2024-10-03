// plane editor
import { TFileHandler } from "@plane/editor";
// helpers
import { getFileURL } from "@/helpers/file.helper";
import { checkURLValidity } from "@/helpers/string.helper";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();

/**
 * @description generate the file source using assetId
 * @param {string} workspaceSlug
 * @param {string} projectId
 * @param {string} assetId
 */
export const getEditorAssetSrc = (workspaceSlug: string, projectId: string, assetId: string): string | undefined => {
  const url = getFileURL(`/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/${assetId}/`);
  return url;
};

type TArgs = {
  projectId: string;
  uploadFile: (file: File) => Promise<string>;
  workspaceId: string;
  workspaceSlug: string;
};

/**
 * @description this function returns the file handler required by the editors
 * @param {TArgs} args
 */
export const getEditorFileHandlers = (args: TArgs): TFileHandler => {
  const { projectId, uploadFile, workspaceId, workspaceSlug } = args;

  return {
    getAssetSrc: (path) => {
      if (!path) return "";
      if (checkURLValidity(path)) {
        return path;
      } else {
        return getEditorAssetSrc(workspaceSlug, projectId, path) ?? "";
      }
    },
    upload: uploadFile,
    delete: async (src: string) => {
      if (checkURLValidity(src)) {
        await fileService.deleteOldEditorAsset(workspaceId, src);
      } else {
        await fileService.deleteNewAsset(getEditorAssetSrc(workspaceSlug, projectId, src) ?? "");
      }
    },
    restore: async (src: string) => {
      if (checkURLValidity(src)) {
        await fileService.restoreOldEditorAsset(workspaceId, src);
      } else {
        await fileService.restoreNewAsset(workspaceSlug, src);
      }
    },
    cancel: fileService.cancelUpload,
  };
};

/**
 * @description this function returns the file handler required by the read-only editors
 */
export const getReadOnlyEditorFileHandlers = (
  args: Pick<TArgs, "projectId" | "workspaceSlug">
): { getAssetSrc: TFileHandler["getAssetSrc"] } => {
  const { projectId, workspaceSlug } = args;

  return {
    getAssetSrc: (path) => {
      if (!path) return "";
      if (checkURLValidity(path)) {
        return path;
      } else {
        return getEditorAssetSrc(workspaceSlug, projectId, path) ?? "";
      }
    },
  };
};
