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

import { extractFieldReferences } from "./field-extractor";

/**
 * Detect circular references in formulas using DFS
 */
export function detectCircularReference(
  propertyId: string,
  formula: string,
  allProperties: Map<string, { formula?: string }>
): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const dfs = (currentId: string): boolean => {
    // Circular reference detected
    if (recursionStack.has(currentId)) {
      return true;
    }

    // Already visited this node in another path
    if (visited.has(currentId)) {
      return false;
    }

    visited.add(currentId);
    recursionStack.add(currentId);

    // Get the formula for current property
    const property = allProperties.get(currentId);
    const currentFormula = property?.formula;

    if (currentFormula) {
      // Extract field references and check each one
      const refs = extractFieldReferences(currentFormula);
      for (const refId of refs) {
        if (dfs(refId)) {
          return true;
        }
      }
    }

    recursionStack.delete(currentId);
    return false;
  };

  // Start DFS from the property we're checking
  // Add the formula's references to the map temporarily
  const tempMap = new Map(allProperties);
  tempMap.set(propertyId, { formula });

  return dfs(propertyId);
}
