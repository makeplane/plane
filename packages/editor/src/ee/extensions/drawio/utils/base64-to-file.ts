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

export const base64ToFile = (base64Data: string, filename: string, mimeType: string): File => {
  let base64: string;
  if (base64Data.includes(",")) {
    const parts = base64Data.split(",");
    if (parts.length < 2) {
      throw new Error("Invalid base64 data URL format. Expected format: 'data:[mediatype];base64,[data]'");
    }
    base64 = parts[1];
  } else {
    base64 = base64Data;
  }

  let binaryString: string;
  try {
    binaryString = atob(base64);
  } catch (error) {
    throw new Error(
      `Failed to decode base64 data: ${error instanceof Error ? error.message : "Invalid base64 characters"}`
    );
  }

  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new File([bytes], filename, { type: mimeType });
};
