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

import { useMemo, useState } from "react";
// plane imports
import type { PermissionMatrixGroup } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

export function usePermissionSearch(groups: PermissionMatrixGroup[]) {
  // state
  const [query, setQuery] = useState("");
  // plane hooks
  const { t } = useTranslation();

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return groups;

    return groups
      .map((group) => {
        const groupMatches = t(group.titleKey).toLowerCase().includes(normalizedQuery);
        if (groupMatches) return group;

        return {
          ...group,
          rows: group.rows.filter((row) => t(row.labelKey).toLowerCase().includes(normalizedQuery)),
        };
      })
      .filter((group) => group.rows.length > 0);
  }, [groups, query, t]);

  return { query, setQuery, filteredGroups };
}
