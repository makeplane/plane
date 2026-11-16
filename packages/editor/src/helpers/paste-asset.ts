/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { assetDuplicationHandlers } from "@/helpers/asset-duplication";

// Utility function to process HTML content with all registered handlers
export const processAssetDuplication = (htmlContent: string): { processedHtml: string } => {
  // parse in an inert document so nothing in the clipboard markup can load or run while it is processed
  const tempDiv = new DOMParser().parseFromString(htmlContent, "text/html").body;

  let processedHtml = htmlContent;

  // Process each registered component type
  for (const [componentName, handler] of Object.entries(assetDuplicationHandlers)) {
    const elements = tempDiv.querySelectorAll(componentName);

    if (elements.length > 0) {
      elements.forEach((element) => {
        const result = handler({ element, originalHtml: processedHtml });
        if (result.shouldProcess) {
          processedHtml = result.modifiedHtml;
        }
      });

      // Update tempDiv with processed HTML for next iteration
      tempDiv.innerHTML = processedHtml;
    }
  }

  return { processedHtml };
};
