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

import type { TIssueProperty, EIssuePropertyType } from "@plane/types";
import { createDisplayNamePattern, createPropertyIdPattern } from "./constants";

/**
 * Convert display names to property IDs in formula
 * Example: "{Due Date} - {Start Date}" → "{{target_date}} - {{start_date}}"
 */
export function convertDisplayNamesToIds(formula: string, properties: TIssueProperty<EIssuePropertyType>[]): string {
  if (!formula) return "";

  // Create a map of display names to property IDs (case-insensitive)
  const displayNameToId = new Map<string, string>();
  properties.forEach((prop) => {
    if (prop.display_name && prop.id) {
      displayNameToId.set(prop.display_name.toLowerCase(), prop.id);
    }
  });

  // Replace {Display Name} with {{property_id}}
  return formula.replace(createDisplayNamePattern(), (match, displayName) => {
    const propId = displayNameToId.get(displayName.trim().toLowerCase());
    if (propId) {
      return `{{${propId}}}`;
    }
    return match;
  });
}

/**
 * Convert property IDs to display names in formula
 * Example: "{{target_date}} - {{start_date}}" → "{Due Date} - {Start Date}"
 */
export function convertIdsToDisplayNames(formula: string, properties: TIssueProperty<EIssuePropertyType>[]): string {
  if (!formula) return "";

  // Create a map of property IDs to display names
  const idToDisplayName = new Map<string, string>();
  properties.forEach((prop) => {
    if (prop.id) {
      idToDisplayName.set(prop.id, prop.display_name || prop.id);
    }
  });

  // Replace {{property_id}} with {Display Name}
  return formula.replace(createPropertyIdPattern(), (match, propId) => {
    const displayName = idToDisplayName.get(propId.trim());
    if (displayName) {
      return `{${displayName}}`;
    }
    return "{???}";
  });
}
