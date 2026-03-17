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

import { createPropertyIdPattern } from "../constants";

/**
 * Extract field references from a formula
 * Returns array of property IDs referenced in the formula
 */
export function extractFieldReferences(formula: string): string[] {
  const references = new Set<string>();
  const regex = createPropertyIdPattern();
  let match;

  while ((match = regex.exec(formula)) !== null) {
    const propertyId = match[1].trim();
    if (propertyId) {
      references.add(propertyId);
    }
  }

  return Array.from(references);
}
