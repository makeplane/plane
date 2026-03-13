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

import { useCallback, useMemo } from "react";
// components
import type { TRelationObject } from "@/components/issues/issue-detail-widgets/relations";
// hooks
import { useRelationDefinition } from "@/hooks/store/use-relation-definition";
// local
import { WORK_ITEM_RELATION_OPTIONS, useCustomRelationOptions } from ".";
import type { TIssueRelationTypes } from "@/types";

/**
 * Returns a Set of all relation field names that the backend may use in activity.field.
 * Includes hardcoded types (blocking, blocked_by, etc.) and custom direction names (blocks, etc.).
 */
export const useRelationFieldNames = (): Set<string> => {
  const { sortedRelationDefinitions } = useRelationDefinition();

  return useMemo(() => {
    const names = new Set(Object.keys(WORK_ITEM_RELATION_OPTIONS));
    for (const def of sortedRelationDefinitions) {
      names.add(def.outward);
      names.add(def.inward);
    }
    return names;
  }, [sortedRelationDefinitions]);
};

/**
 * Given a raw activity field name, return the matching TRelationObject.
 * Checks hardcoded options first, then custom relation definitions by direction name.
 */
export const useRelationOptionByFieldName = (): ((fieldName: string) => TRelationObject | undefined) => {
  const customRelationOptions = useCustomRelationOptions();

  return useCallback(
    (fieldName: string): TRelationObject | undefined => {
      if (WORK_ITEM_RELATION_OPTIONS[fieldName as TIssueRelationTypes]) {
        return WORK_ITEM_RELATION_OPTIONS[fieldName as TIssueRelationTypes];
      }
      for (const [compositeKey, option] of Object.entries(customRelationOptions)) {
        const separatorIndex = compositeKey.indexOf("::");
        if (separatorIndex !== -1) {
          const directionName = compositeKey.substring(separatorIndex + 2);
          if (directionName === fieldName) return option;
        }
      }
      return undefined;
    },
    [customRelationOptions]
  );
};
