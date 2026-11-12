/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Tab, Tabs, TabsList } from "@makeplane/propel/components/tabs";
import { ExpandableSearch } from "@makeplane/propel/components/expandable-search";
// plane helpers
import { MODULE_VIEW_LAYOUTS } from "@plane/constants";
// types
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { TModuleFilters } from "@plane/types";
// ui
import { calculateTotalFilters } from "@plane/utils";
// plane utils
// components
import { ModuleOrderByDropdown } from "@/components/modules/dropdowns";
// constants
// helpers
import { ModuleFiltersDropdown } from "@/components/modules/dropdowns/filters/dropdown";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useModuleFilter } from "@/hooks/store/use-module-filter";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { ModuleLayoutIcon } from "./module-layout-icon";
// i18n

export const ModuleViewHeader = observer(function ModuleViewHeader() {
  // router
  const { projectId } = useParams();
  // hooks
  const { isMobile } = usePlatformOS();
  // store hooks
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const {
    currentProjectDisplayFilters: displayFilters,
    currentProjectFilters: filters,
    searchQuery,
    updateDisplayFilters,
    updateFilters,
    updateSearchQuery,
  } = useModuleFilter();
  const { t } = useTranslation();

  // handlers
  const handleFilters = useCallback(
    (key: keyof TModuleFilters, value: string | string[]) => {
      if (!projectId) return;
      const newValues = filters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else {
        if (filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId.toString(), { [key]: newValues });
    },
    [filters, projectId, updateFilters]
  );

  const isFiltersApplied = calculateTotalFilters(filters ?? {}) !== 0 || displayFilters?.favorites;

  return (
    <div className="hidden h-full items-center gap-2 self-end sm:flex">
      <ExpandableSearch
        size="md"
        aria-label={t("common.search.label")}
        clearLabel={t("common.clear")}
        placeholder={t("common.search.label")}
        value={searchQuery}
        onValueChange={(value) => updateSearchQuery(value)}
      />
      <div className="hidden md:block">
        <Tabs value={displayFilters?.layout ?? null} variant="contained" stretch="auto">
          <TabsList aria-label={t("common.layout")}>
            {MODULE_VIEW_LAYOUTS.map((layout) => (
              <Tooltip key={layout.key} label={t(layout.i18n_title)} disabled={isMobile}>
                <Tab
                  value={layout.key}
                  label=""
                  aria-label={t(layout.i18n_title)}
                  icon={<ModuleLayoutIcon layoutType={layout.key} size={16} />}
                  onClick={() => {
                    if (!projectId) return;
                    updateDisplayFilters(projectId.toString(), { layout: layout.key });
                  }}
                />
              </Tooltip>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <ModuleFiltersDropdown
        iconOnly
        isFiltersApplied={isFiltersApplied}
        displayFilters={displayFilters ?? {}}
        filters={filters ?? {}}
        handleDisplayFiltersUpdate={(val) => {
          if (!projectId) return;
          updateDisplayFilters(projectId.toString(), val);
        }}
        handleFiltersUpdate={handleFilters}
        memberIds={workspaceMemberIds ?? undefined}
      />
      <ModuleOrderByDropdown
        value={displayFilters?.order_by}
        onChange={(val) => {
          if (!projectId || val === displayFilters?.order_by) return;
          updateDisplayFilters(projectId.toString(), {
            order_by: val,
          });
        }}
      />
    </div>
  );
});
