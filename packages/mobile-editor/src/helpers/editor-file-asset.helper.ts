import { TFileHandler } from "@plane/editor";
import { checkURLValidity, callNative } from "@/helpers";
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";

type TEditorSrcArgs = {
  assetId: string;
  projectId?: string;
  workspaceSlug: string;
  baseApi: string;
};

type TURLArgs = {
  src: string;
  projectId?: string;
  workspaceSlug: string;
  workspaceId: string;
  baseApi: string;
};

type TEditorFileHandlerArgs = {
  projectId?: string;
  workspaceSlug: string;
  workspaceId: string;
  baseApi: string;
};

/**
 * @description combines the file path with the base URL
 * @param {string} path
 * @returns {string} final URL with the base URL
 */
export const getFileURL = async (path: string, baseApi: string) => {
  if (!path) return undefined;
  const isValidURL = path.startsWith("http");
  if (isValidURL) return path;

  const url = await callNative(CallbackHandlerStrings.getResolvedImageUrl, `${baseApi}${path}`);
  return isValidURL ? path : url;
};

/**
 * @description generates the file source using assetId
 * @param {TEditorSrcArgs} args
 */
export const getEditorAssetSrc = async (args: TEditorSrcArgs) => {
  const { assetId, projectId, workspaceSlug } = args;
  let url: string | undefined = "";
  if (projectId) {
    url = await getFileURL(
      `/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/${assetId}/`,
      args.baseApi
    );
  } else {
    url = await getFileURL(`/api/assets/v2/workspaces/${workspaceSlug}/${assetId}/`, args.baseApi);
  }
  return url;
};

/**
 * @description generate the restore file URL
 * @param {TURLArgs} args
 * @returns {string} restore URL
 */
export const getRestoreURL = (args: TURLArgs) => {
  const { baseApi, src, workspaceId, workspaceSlug } = args;
  let url: string | undefined;
  if (checkURLValidity(src)) {
    const assetKey = src.split("/").pop();
    return `${baseApi}/api/workspaces/file-assets/${workspaceId}/${assetKey}`;
  }
  url = `${args.baseApi}/api/assets/v2/workspaces/${workspaceSlug}/restore/${src}/`;

  return url;
};

/**
 * @description generate the delete file URL
 * @param {TURLArgs} args
 */
export const getDeleteURL = (args: TURLArgs) => {
  const { baseApi, src, projectId, workspaceId, workspaceSlug } = args;
  let url: string | undefined;
  if (checkURLValidity(src)) {
    const assetKey = src.split("/").pop();
    return `${baseApi}/api/workspaces/file-assets/${workspaceId}/${assetKey}`;
  }
  if (projectId) {
    url = `${args.baseApi}/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/${src}/`;
  } else {
    url = `${args.baseApi}/api/assets/v2/workspaces/${workspaceSlug}/${src}/`;
  }
  return url;
};

/**
 * @description this function returns the file handler required by the editor.
 * @param {TEditorFileHandlerArgs} args
 */
export const getEditorFileHandlers = (args: TEditorFileHandlerArgs): TFileHandler => {
  const { projectId, workspaceSlug, workspaceId, baseApi } = args;
  return {
    assetsUploadStatus: {},
    getAssetSrc: async (path) => {
      if (!path) return "";
      if (checkURLValidity(path)) {
        return path;
      } else {
        return (
          (await getEditorAssetSrc({
            assetId: path,
            projectId,
            workspaceSlug,
            baseApi,
          })) ?? ""
        );
      }
    },
    upload: async (_, file: File) => Promise.resolve(""),
    delete: async (src: string) => {
      const url = getDeleteURL({
        src,
        projectId,
        workspaceSlug,
        workspaceId,
        baseApi,
      });
      await callNative(CallbackHandlerStrings.deleteImage, url);
    },
    restore: async (src: string) => {
      const url = getRestoreURL({
        src,
        projectId,
        workspaceSlug,
        workspaceId,
        baseApi,
      });
      await callNative(CallbackHandlerStrings.restoreImage, url);
    },
    cancel: () => {},
    validation: {
      maxFileSize: MAX_FILE_SIZE,
    },
  };
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
