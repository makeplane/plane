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

import { convertBase64StringToBinaryData, getAllDocumentFormatsFromDocumentEditorBinaryData } from "@plane/editor";

/**
 * Decode base64 binary to get all document formats
 * @param base64Binary - The base64 encoded binary data from the API
 * @returns Object containing contentHTML, contentJSON, and contentBinaryEncoded
 */
export const decodeVersionBinary = (base64Binary: string) => {
  if (!base64Binary) {
    return null;
  }

  try {
    const binaryData = convertBase64StringToBinaryData(base64Binary);

    const formats = getAllDocumentFormatsFromDocumentEditorBinaryData(new Uint8Array(binaryData), false);

    return formats;
  } catch {
    return null;
  }
};

/**
 * Find the previous version in the versions list
 * @param versions - Array of all versions
 * @param currentVersionId - The ID of the current version being viewed
 * @returns The previous version or undefined
 */
export const findPreviousVersion = <T extends { id: string }>(
  versions: T[],
  currentVersionId: string
): T | undefined => {
  const currentIndex = versions.findIndex((v) => v.id === currentVersionId);

  // Return undefined if version not found
  if (currentIndex === -1) return undefined;

  // Versions array is ordered newest first, so previous (older) version is at currentIndex + 1
  if (currentIndex < versions.length - 1) {
    const prevVersion = versions[currentIndex + 1];
    return prevVersion;
  }

  return undefined;
};
