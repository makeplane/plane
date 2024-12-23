import { MAX_FILE_SIZE } from "@plane/constants";
import { getFileURL } from "./file";

// Define image-related types locally
type DeleteImage = (assetUrlWithWorkspaceId: string) => Promise<void>;
type RestoreImage = (assetUrlWithWorkspaceId: string) => Promise<void>;
type UploadImage = (file: File) => Promise<string>;

// Define the FileService interface based on usage
interface IFileService {
  deleteOldEditorAsset: (workspaceId: string, src: string) => Promise<void>;
  deleteNewAsset: (url: string) => Promise<void>;
  restoreOldEditorAsset: (workspaceId: string, src: string) => Promise<void>;
  restoreNewAsset: (anchor: string, src: string) => Promise<void>;
  cancelUpload: () => void;
}

// Define TFileHandler locally since we can't import from @plane/editor
interface TFileHandler {
  getAssetSrc: (path: string) => Promise<string>;
  cancel: () => void;
  delete: DeleteImage;
  upload: UploadImage;
  restore: RestoreImage;
  validation: {
    maxFileSize: number;
  };
}

/**
 * @description generate the file source using assetId
 * @param {string} anchor
 * @param {string} assetId
 */
export const getEditorAssetSrc = (anchor: string, assetId: string): string | undefined => {
  const url = getFileURL(`/api/public/assets/v2/anchor/${anchor}/${assetId}/`);
  return url;
};

type TArgs = {
  anchor: string;
  uploadFile: (file: File) => Promise<string>;
  workspaceId: string;
  fileService: IFileService;
};

/**
 * @description this function returns the file handler required by the editors
 * @param {TArgs} args
 */
export const getEditorFileHandlers = (args: TArgs): TFileHandler => {
  const { anchor, uploadFile, workspaceId, fileService } = args;

  return {
    getAssetSrc: async (path: string) => {
      if (!path) return "";
      if (path?.startsWith("http")) {
        return path;
      } else {
        return getEditorAssetSrc(anchor, path) ?? "";
      }
    },
    upload: uploadFile,
    delete: async (src: string) => {
      if (src?.startsWith("http")) {
        await fileService.deleteOldEditorAsset(workspaceId, src);
      } else {
        await fileService.deleteNewAsset(getEditorAssetSrc(anchor, src) ?? "");
      }
    },
    restore: async (src: string) => {
      if (src?.startsWith("http")) {
        await fileService.restoreOldEditorAsset(workspaceId, src);
      } else {
        await fileService.restoreNewAsset(anchor, src);
      }
    },
    cancel: fileService.cancelUpload,
    validation: {
      maxFileSize: MAX_FILE_SIZE,
    },
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
    getAssetSrc: async (path: string) => {
      if (!path) return "";
      if (path?.startsWith("http")) {
        return path;
      } else {
        return getEditorAssetSrc(anchor, path) ?? "";
      }
    },
  };
};
