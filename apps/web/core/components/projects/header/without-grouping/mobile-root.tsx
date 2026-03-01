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

import { useCallback } from "react";
import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import type { TProjectFilters } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { ProjectFiltersSelection } from "@/components/projects/dropdowns/filters";
import { ProjectOrderByDropdown } from "@/components/projects/dropdowns/order-by";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectFilter } from "@/hooks/store/use-project-filter";

type TProjectsListWithoutGroupingMobileHeaderProps = {
  workspaceSlug: string;
};

export const ProjectsListWithoutGroupingMobileHeader = observer(function ProjectsListWithoutGroupingMobileHeader(
  props: TProjectsListWithoutGroupingMobileHeaderProps
) {
  const { workspaceSlug } = props;
  // i18n
  const { t } = useTranslation();
  const {
    currentWorkspaceDisplayFilters: displayFilters,
    currentWorkspaceFilters: filters,
    updateDisplayFilters,
    updateFilters,
  } = useProjectFilter();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();

  const handleFilters = useCallback(
    (key: keyof TProjectFilters, value: string | string[]) => {
      if (!workspaceSlug) return;
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
      updateFilters(workspaceSlug.toString(), { [key]: newValues });
    },
    [filters, updateFilters, workspaceSlug]
  );

  const isFiltersApplied = calculateTotalFilters(filters ?? {}) !== 0;

  return (
    <div className="flex py-2 border-b border-subtle md:hidden bg-surface-1 w-full">
      <ProjectOrderByDropdown
        value={displayFilters?.order_by}
        onChange={(val) => {
          if (!workspaceSlug || val === displayFilters?.order_by) return;
          updateDisplayFilters(workspaceSlug.toString(), {
            order_by: val,
          });
        }}
        isMobile
      />
      <div className="border-l border-subtle flex justify-around w-full">
        <FiltersDropdown
          icon={<ListFilter className="h-3 w-3" />}
          title={t("common.filters")}
          placement="bottom-end"
          menuButton={
            <div className="flex text-13 items-center gap-2 text-secondary">
              <ListFilter className="h-3 w-3" />
              {t("common.filters")}
              <ChevronDownIcon className="h-3 w-3" strokeWidth={2} />
            </div>
          }
          isFiltersApplied={isFiltersApplied}
        >
          <ProjectFiltersSelection
            displayFilters={displayFilters ?? {}}
            filters={filters ?? {}}
            handleFiltersUpdate={handleFilters}
            handleDisplayFiltersUpdate={(val) => {
              if (!workspaceSlug) return;
              updateDisplayFilters(workspaceSlug.toString(), val);
            }}
            memberIds={workspaceMemberIds ?? undefined}
          />
        </FiltersDropdown>
      </div>
    </div>
  );
});
