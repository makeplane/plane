/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane imports
import { MAX_FILE_SIZE } from "@plane/constants";
import type { TFileHandler } from "@plane/editor";
import { LiveService, SitesFileService } from "@plane/services";
import { getFileURL } from "@plane/utils";

const sitesFileService = new SitesFileService();
const liveService = new LiveService();

/**
 * @description generate the relative API path for a public asset
 * @param {string} anchor
 * @param {string} assetId
 */
const getEditorAssetPath = (anchor: string, assetId: string): string =>
  `/api/public/assets/v2/anchor/${anchor}/${assetId}/`;

/**
 * @description generate the full browser-accessible URL for a public asset
 * @param {string} anchor
 * @param {string} assetId
 */
export const getEditorAssetSrc = (anchor: string, assetId: string): string | undefined =>
  getFileURL(getEditorAssetPath(anchor, assetId));

type TArgs = {
  anchor: string;
  uploadFile: TFileHandler["upload"];
  workspaceId: string;
};

/**
 * @description this function returns the file handler required by the editors
 * @param {TArgs} args
 */
export const getEditorFileHandlers = (args: TArgs): TFileHandler => {
  const { anchor, uploadFile, workspaceId } = args;

  const getAssetSrc = async (path: string) => {
    if (!path) return "";
    if (path?.startsWith("http")) {
      return path;
    } else {
      return getEditorAssetSrc(anchor, path) ?? "";
    }
  };

  const getFileContent = async (src: string): Promise<string> => {
    if (!src) return "";
    const fileUrl = src.startsWith("http") ? src : getEditorAssetPath(anchor, src);
    if (!fileUrl) return "";
    return liveService.getFileContent(fileUrl);
  };

  return {
    checkIfAssetExists: async () => true,
    assetsUploadStatus: {},
    getAssetDownloadSrc: getAssetSrc,
    getAssetSrc: getAssetSrc,
    getFileContent,
    upload: uploadFile,
    delete: async (src: string) => {
      if (src?.startsWith("http")) {
        await sitesFileService.deleteOldEditorAsset(workspaceId, src);
      } else {
        await sitesFileService.deleteNewAsset(getEditorAssetSrc(anchor, src) ?? "");
      }
    },
    cancel: sitesFileService.cancelUpload,
    restore: async (src: string) => {
      if (src?.startsWith("http")) {
        await sitesFileService.restoreOldEditorAsset(workspaceId, src);
      } else {
        await sitesFileService.restoreNewAsset(anchor, src);
      }
    },
    duplicate: async (assetId: string) =>
      // Duplication is not supported for sites/space app
      // Return the same assetId as a fallback
      assetId,
    validation: {
      maxFileSize: MAX_FILE_SIZE,
    },
  };
};
