/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ExpandableSearch } from "@makeplane/propel/components/expandable-search";
// icons
import { useTranslation } from "@plane/i18n";
// plane helpers
// types
import type { TModuleFilters } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
// components
import { ArchiveTabsList } from "@/components/archives";
import { ModuleOrderByDropdown } from "@/components/modules";
// helpers
import { ModuleFiltersDropdown } from "@/components/modules/dropdowns/filters/dropdown";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useModuleFilter } from "@/hooks/store/use-module-filter";

export const ArchivedModulesHeader = observer(function ArchivedModulesHeader() {
  // router
  const { projectId } = useParams();
  // hooks
  const {
    currentProjectArchivedFilters,
    currentProjectDisplayFilters,
    archivedModulesSearchQuery,
    updateFilters,
    updateDisplayFilters,
    updateArchivedModulesSearchQuery,
  } = useModuleFilter();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const { t } = useTranslation();

  const handleFilters = useCallback(
    (key: keyof TModuleFilters, value: string | string[]) => {
      if (!projectId) return;
      const newValues = currentProjectArchivedFilters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else {
        if (currentProjectArchivedFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId.toString(), { [key]: newValues }, "archived");
    },
    [currentProjectArchivedFilters, projectId, updateFilters]
  );

  const isFiltersApplied = calculateTotalFilters(currentProjectArchivedFilters ?? {}) !== 0;

  return (
    <div className="group relative flex border-b border-subtle">
      <div className="horizontal-scrollbar scrollbar-sm flex w-full items-center gap-2 overflow-x-auto px-4">
        <ArchiveTabsList />
      </div>
      {/* filter options */}
      <div className="flex h-full items-center gap-3 self-end px-8">
        <ExpandableSearch
          size="md"
          aria-label={t("common.search.label")}
          clearLabel={t("common.clear")}
          placeholder={t("common.search.label")}
          value={archivedModulesSearchQuery}
          onValueChange={(value) => updateArchivedModulesSearchQuery(value)}
        />
        <ModuleOrderByDropdown
          value={currentProjectDisplayFilters?.order_by}
          onChange={(val) => {
            if (!projectId || val === currentProjectDisplayFilters?.order_by) return;
            updateDisplayFilters(projectId.toString(), {
              order_by: val,
            });
          }}
        />
        <ModuleFiltersDropdown
          isFiltersApplied={isFiltersApplied}
          displayFilters={currentProjectDisplayFilters ?? {}}
          filters={currentProjectArchivedFilters ?? {}}
          handleDisplayFiltersUpdate={(val) => {
            if (!projectId) return;
            updateDisplayFilters(projectId.toString(), val);
          }}
          handleFiltersUpdate={handleFilters}
          memberIds={workspaceMemberIds ?? undefined}
          isArchived
        />
      </div>
    </div>
  );
});
