/**
 * SPDX-FileCopyrightText: 2026-present Plane Software, Inc.
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

import { KNOWN_CUSTOM_FIELDS } from "./constants";
import type { TKnownFieldMapping } from "../types";

/**
 * Get the first ID matching a known custom field
 */
export const getKnownFieldId = (
  mapping: TKnownFieldMapping[] | undefined,
  key: keyof typeof KNOWN_CUSTOM_FIELDS
): string | undefined => {
  return getKnownFieldIds(mapping, key)[0];
};

/**
 * Get all IDs matching a known custom field, ordered by priority defined in matcher.
 */
export const getKnownFieldIds = (
  mapping: TKnownFieldMapping[] | undefined,
  key: keyof typeof KNOWN_CUSTOM_FIELDS
): string[] => {
  if (!mapping) return [];

  const matcher = KNOWN_CUSTOM_FIELDS[key];
  const fieldIds: string[] = [];

  // For each name in the matcher (in order), find matching fields in the mapping
  matcher.names?.forEach((name) => {
    mapping
      .filter((m) => m.name === key && m.data.name?.toLowerCase() === name.toLowerCase())
      .forEach((m) => {
        if (m.data.id && !fieldIds.includes(m.data.id)) {
          fieldIds.push(m.data.id);
        }
      });
  });

  // Then add any matches by custom type that haven't been added yet
  if ("customTypes" in matcher) {
    matcher.customTypes?.forEach((type: string) => {
      mapping
        .filter((m) => m.name === key && m.data.schema?.custom === type)
        .forEach((m) => {
          if (m.data.id && !fieldIds.includes(m.data.id)) {
            fieldIds.push(m.data.id);
          }
        });
    });
  }

  return fieldIds;
};

/**
 * Get the value of the first available field from a list of field IDs
 */
export const getFirstKnownValue = <T = unknown>(
  issueFields: Record<string, unknown>,
  fieldIds: string[] | undefined
): T | null => {
  if (!fieldIds || fieldIds.length === 0) return null;

  for (const id of fieldIds) {
    const value = issueFields[id];
    if (value) {
      return value as T;
    }
  }

  return null;
};
