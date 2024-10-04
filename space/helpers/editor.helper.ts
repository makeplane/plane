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
 * @param {string} anchor
 */
export const getEditorAssetSrc = (anchor: string, assetId: string): string | undefined => {
  const url = getFileURL(`/api/public/assets/v2/anchor/${anchor}/${assetId}/`);
  return url;
};

type TArgs = {
  anchor: string;
  uploadFile: (file: File) => Promise<string>;
  workspaceId: string;
};

/**
 * @description this function returns the file handler required by the editors
 * @param {TArgs} args
 */
export const getEditorFileHandlers = (args: TArgs): TFileHandler => {
  const { anchor, uploadFile, workspaceId } = args;

  return {
    getAssetSrc: (path) => {
      if (!path) return "";
      const url = getEditorAssetSrc(anchor, path) ?? "";
      return url;
    },
    upload: uploadFile,
    delete: async (src: string) => {
      if (checkURLValidity(src)) {
        await fileService.deleteOldEditorAsset(workspaceId, src);
      } else {
        await fileService.deleteNewAsset(getEditorAssetSrc(anchor, src) ?? "");
      }
    },
    restore: async (src: string) => {
      if (checkURLValidity(src)) {
        await fileService.restoreOldEditorAsset(workspaceId, src);
      } else {
        await fileService.restoreNewAsset(anchor, src);
      }
    },
    cancel: fileService.cancelUpload,
  };
};

/**
 * @description this function returns the file handler required by the read-only editors
 */
export const getReadOnlyEditorFileHandlers = (
  args: Pick<TArgs, "anchor">
): { getAssetSrc: TFileHandler["getAssetSrc"] } => {
  const { anchor } = args;

  return {
    getAssetSrc: (path) => {
      if (!path) return "";
      const url = getEditorAssetSrc(anchor, path) ?? "";
      return url;
    },
  };
};