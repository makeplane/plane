/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { MAX_FILE_SIZE } from "@plane/constants";
import type { TFileHandler } from "@plane/editor";
import { getFileURL } from "@plane/utils";

/**
 * @description resolve the displayed src for a help-center inline image.
 * Help images are instance-global (no workspace), so a bare asset id resolves to
 * the workspace-agnostic public static endpoint. An already-absolute path/URL
 * (e.g. legacy stored src) is passed through unchanged.
 */
export const getHelpEditorAssetSrc = (assetIdOrPath: string): string => {
  if (!assetIdOrPath) return "";
  if (assetIdOrPath.startsWith("http") || assetIdOrPath.startsWith("/")) {
    return getFileURL(assetIdOrPath) ?? assetIdOrPath;
  }
  return getFileURL(`/api/assets/v2/static/${assetIdOrPath}/`) ?? "";
};

type TArgs = {
  uploadFile: TFileHandler["upload"];
};

/**
 * @description editor file handler for the help center.
 * Inline-image cleanup (delete/restore) is intentionally a no-op: God Mode
 * authoring is infrequent and images are tiny, so we accept the rare orphan
 * rather than add delete/restore endpoints (the static endpoint already 404s
 * soft-deleted rows defensively).
 */
export const getHelpEditorFileHandler = (args: TArgs): TFileHandler => {
  const resolve = async (path: string) => getHelpEditorAssetSrc(path);
  return {
    assetsUploadStatus: {},
    checkIfAssetExists: async () => true,
    getAssetSrc: resolve,
    getAssetDownloadSrc: resolve,
    upload: args.uploadFile,
    delete: async () => {},
    restore: async () => {},
    cancel: () => {},
    duplicate: async (assetId: string) => assetId,
    validation: {
      maxFileSize: MAX_FILE_SIZE,
    },
  };
};
