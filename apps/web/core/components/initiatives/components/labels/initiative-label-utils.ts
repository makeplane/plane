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

import type { TDropTarget, TInitiativeLabel } from "@plane/types";

/**
 * This provides a boolean to indicate if the label can be dropped onto the droptarget
 * @param source
 * @param label
 * @param isCurrentChild if the dropTarget is a child
 * @returns
 */
export const getInitiativeCanDrop = (source: TDropTarget, label: TInitiativeLabel | undefined) => {
  const sourceData = source?.data;

  if (!sourceData) return false;

  // a label cannot be dropped on to itself
  if (sourceData.id === label?.id) return false;
  return true;
};

/**
 * Converts store labels map to array, falling back to default options if store is empty
 * @param storeLabels - Map of labels from store
 * @param defaultOptions - Default options to fall back to
 * @returns Array of initiative labels
 */
export const getInitiativeLabelsArray = (
  storeLabels: Map<string, TInitiativeLabel> | undefined,
  defaultOptions: TInitiativeLabel[] = []
): TInitiativeLabel[] => {
  if (storeLabels && storeLabels.size > 0) {
    return Array.from(storeLabels.values());
  }
  return defaultOptions;
};
