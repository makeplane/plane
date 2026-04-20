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

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { PermissionMatrixGroup } from "@plane/constants";
import type { PermissionNamespace, PermissionMatrixState, PermissionSelection, PermissionString } from "@plane/types";
import { applySelectionWithDependencies, cn, isSelectionEnabled } from "@plane/utils";
// hooks
import { usePermissionGroupAccess } from "@/hooks/permissions/use-permission-group-access";
// local imports
import { PermissionGroupSection } from "./permission-group-section";
import { PermissionSearch } from "./permission-search";
import { usePermissionSearch } from "./permission-search-hook";
import { Button } from "@plane/propel/button";

type Props = {
  isEditing: boolean;
  namespace: PermissionNamespace;
  workspaceSlug: string;
  groups: PermissionMatrixGroup[];
  matrixState: PermissionMatrixState;
  onChange: (nextState: PermissionMatrixState) => void;
};

export const RoleDetailsPermissionsList = observer(function RoleDetailsPermissionsList(props: Props) {
  const { isEditing, namespace, workspaceSlug, groups, matrixState, onChange } = props;
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { filterGroups } = usePermissionGroupAccess(workspaceSlug, namespace);
  // derived values
  const visibleGroups = filterGroups(groups);
  const { query, setQuery, filteredGroups } = usePermissionSearch(visibleGroups);

  const allRows = useMemo(() => visibleGroups.flatMap((group) => group.rows), [visibleGroups]);

  const applySelection = (rowId: PermissionString, selection: PermissionSelection) => {
    const previousSelection = matrixState[rowId] ?? { mode: "disabled" as const };
    const wasEnabled = isSelectionEnabled(previousSelection);
    const isEnabled = isSelectionEnabled(selection);

    if (wasEnabled === isEnabled) {
      onChange({
        ...matrixState,
        [rowId]: selection,
      });
      return;
    }

    onChange(
      applySelectionWithDependencies({
        rows: allRows,
        currentState: matrixState,
        rowId,
        selection,
      })
    );
  };

  const handleGroupSelectAll = (rowIds: PermissionString[], enable: boolean) => {
    let nextState = matrixState;

    for (const rowId of rowIds) {
      const nextSelection = enable ? { mode: "all" as const } : { mode: "disabled" as const };
      nextState = applySelectionWithDependencies({
        rows: allRows,
        currentState: nextState,
        rowId,
        selection: nextSelection,
      });
    }

    onChange(nextState);
  };

  return (
    <div className="flex flex-col gap-y-4 py-7">
      <PermissionSearch query={query} setQuery={setQuery} />

      {filteredGroups.length === 0 && query && (
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-body-sm-regular text-secondary">
          <span>No permissions match &quot;{query}&quot;</span>
          <Button variant="tertiary" onClick={() => setQuery("")}>
            Clear search
          </Button>
        </div>
      )}

      <div className={cn("divide-y divide-subtle", !isEditing && "opacity-90")}>
        {filteredGroups.map((group) => (
          <PermissionGroupSection
            key={group.key}
            group={group}
            matrixState={matrixState}
            isEditing={isEditing}
            searchQuery={query || undefined}
            onRowSelectionChange={applySelection}
            onSelectAll={handleGroupSelectAll}
            t={t}
          />
        ))}
      </div>
    </div>
  );
});
