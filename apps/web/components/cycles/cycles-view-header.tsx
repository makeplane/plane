/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import { FilterOutline } from "@makeplane/propel/icons";
// plane imports
import { ExpandableSearch } from "@makeplane/propel/components/expandable-search";
import { useTranslation } from "@plane/i18n";
import type { TCycleFilters } from "@plane/types";
import { calculateTotalFilters } from "@plane/utils";
// components
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
// hooks
import { useCycleFilter } from "@/hooks/store/use-cycle-filter";
// local imports
import { CycleFiltersSelection } from "./dropdowns";

type Props = {
  projectId: string;
};

export const CyclesViewHeader = observer(function CyclesViewHeader(props: Props) {
  const { projectId } = props;
  // hooks
  const { currentProjectFilters, searchQuery, updateFilters, updateSearchQuery } = useCycleFilter();
  const { t } = useTranslation();

  const handleFilters = useCallback(
    (key: keyof TCycleFilters, value: string | string[]) => {
      if (!projectId) return;
      const newValues = currentProjectFilters?.[key] ?? [];

      if (Array.isArray(value))
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      else {
        if (currentProjectFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId, { [key]: newValues });
    },
    [currentProjectFilters, projectId, updateFilters]
  );

  const isFiltersApplied = calculateTotalFilters(currentProjectFilters ?? {}) !== 0;

  return (
    <div className="flex items-center gap-2">
      <ExpandableSearch
        size="md"
        aria-label={t("common.search.label")}
        clearLabel={t("common.clear")}
        placeholder={t("common.search.label")}
        value={searchQuery}
        onValueChange={(value) => updateSearchQuery(value)}
      />

      <FiltersDropdown
        icon={<FilterOutline className="h-3 w-3" />}
        title={t("common.filters")}
        placement="bottom-end"
        isFiltersApplied={isFiltersApplied}
      >
        <CycleFiltersSelection filters={currentProjectFilters ?? {}} handleFiltersUpdate={handleFilters} />
      </FiltersDropdown>
    </div>
  );
});
