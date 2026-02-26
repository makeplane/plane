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

import type { TFileHandler } from "@plane/editor";
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
import { callNative, checkURLValidity } from "@/helpers";

/**
 * @description this function returns the file handler required by the editor.
 * @param {TEditorFileHandlerArgs} args
 */
export const getEditorFileHandlers = (): TFileHandler => ({
  assetsUploadStatus: {},
  duplicate: (assetId: string) => Promise.resolve(assetId),
  getAssetDownloadSrc: async (src) => {
    if (!src) return "";
    if (checkURLValidity(src)) {
      return src;
    } else {
      return (await callNative<string>(CallbackHandlerStrings.getDownloadAssetSrc, src)) ?? src;
    }
  },
  getAssetSrc: async (src) => {
    if (!src) return "";
    if (checkURLValidity(src)) {
      return src;
    } else {
      const resolved = (await callNative<string>(CallbackHandlerStrings.getResolvedImageUrl, src)) ?? src;
      return resolved;
    }
  },
  upload: async (_, file: File) => {
    try {
      const base64Data = await fileToBase64(file);
      const assetId = await callNative<string>(
        CallbackHandlerStrings.uploadImage,
        JSON.stringify({
          base64Data,
          fileName: file.name,
          fileType: file.type,
        })
      );
      return assetId ?? "";
    } catch (error) {
      console.error("Error uploading file:", error);
      return "";
    }
  },
  delete: async (src: string) => {
    await callNative(CallbackHandlerStrings.deleteImage, src);
  },
  restore: async (src: string) => {
    await callNative(CallbackHandlerStrings.restoreImage, src);
  },
  cancel: () => {},
  validation: {
    maxFileSize: MAX_FILE_SIZE,
  },
  checkIfAssetExists: async (assetId) => {
    const exists = await callNative<boolean>(CallbackHandlerStrings.checkIfAssetExists, assetId);
    return exists === true;
  },
});

const MAX_FILE_SIZE = 15 * 1024 * 1024;

/**
 * Converts a File to base64 string (without data URI prefix)
 */
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
