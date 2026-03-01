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

import { v4 as uuidv4 } from "uuid";
import type { AssetDuplicationHandler } from "@/ce/helpers/asset-duplication";
import { assetDuplicationHandlers as ceAssetDuplicationHandlers } from "@/ce/helpers/asset-duplication";
import { EAttachmentBlockAttributeNames, EAttachmentStatus } from "@/plane-editor/extensions/attachments/types";
import { EDrawioAttributeNames, EDrawioStatus } from "@/plane-editor/extensions/drawio/types";

const attachmentComponentHandler: AssetDuplicationHandler = ({ element, originalHtml }) => {
  const src = element.getAttribute(EAttachmentBlockAttributeNames.SOURCE);

  if (!src) {
    return { modifiedHtml: originalHtml, shouldProcess: false };
  }

  // Capture the original HTML BEFORE making any modifications
  const originalTag = element.outerHTML;

  // Use setAttribute to update attributes
  const newId = uuidv4();
  element.setAttribute(EAttachmentBlockAttributeNames.STATUS, EAttachmentStatus.DUPLICATING);
  element.setAttribute(EAttachmentBlockAttributeNames.ID, newId);

  // Get the modified HTML AFTER the changes
  const modifiedTag = element.outerHTML;
  const modifiedHtml = originalHtml.replaceAll(originalTag, modifiedTag);

  return { modifiedHtml, shouldProcess: true };
};

const drawioComponentHandler: AssetDuplicationHandler = ({ element, originalHtml }) => {
  const xmlSrc = element.getAttribute(EDrawioAttributeNames.XML_SRC);

  if (!xmlSrc) {
    return { modifiedHtml: originalHtml, shouldProcess: false };
  }

  // Capture the original HTML BEFORE making any modifications
  const originalTag = element.outerHTML;

  // Use setAttribute to update attributes
  const newId = uuidv4();
  element.setAttribute(EDrawioAttributeNames.STATUS, EDrawioStatus.DUPLICATING);
  element.setAttribute(EDrawioAttributeNames.ID, newId);

  // Get the modified HTML AFTER the changes
  const modifiedTag = element.outerHTML;
  const modifiedHtml = originalHtml.replaceAll(originalTag, modifiedTag);

  return { modifiedHtml, shouldProcess: true };
};
export const assetDuplicationHandlers = {
  ...ceAssetDuplicationHandlers,
  "attachment-component": attachmentComponentHandler,
  "drawio-component": drawioComponentHandler,
};
