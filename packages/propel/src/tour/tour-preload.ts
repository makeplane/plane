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

/**
 * Utility functions for preloading tour assets
 */

/**
 * Preloads a single image and returns a promise that resolves when loaded
 * @param url - The image URL to preload
 * @returns Promise that resolves when the image is loaded or rejects on error
 */
const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

/**
 * Preloads multiple images in parallel
 * Continues loading even if some images fail (errors are logged but don't block)
 * @param urls - Array of image URLs to preload
 * @returns Promise that resolves when all images have been attempted (success or failure)
 */
export const preloadTourAssets = async (urls: string[]): Promise<void> => {
  if (!urls || urls.length === 0) {
    return Promise.resolve();
  }

  // Filter out empty strings and invalid URLs
  const validUrls = urls.filter((url) => url && typeof url === "string" && url.trim().length > 0);

  if (validUrls.length === 0) {
    return Promise.resolve();
  }

  // Preload all images in parallel
  // Use Promise.allSettled to ensure all images are attempted even if some fail
  const results = await Promise.allSettled(validUrls.map((url) => preloadImage(url)));

  // Log any failures for debugging, but don't throw
  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length > 0) {
    console.warn(`Failed to preload ${failures.length} tour image(s)`, failures);
  }
};
