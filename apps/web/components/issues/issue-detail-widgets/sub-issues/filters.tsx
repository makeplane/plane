/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { FilterOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import type { IIssueFilterOptions, IState } from "@plane/types";
import { cn } from "@plane/utils";
import {
  FilterAssignees,
  FilterDueDate,
  FilterPriority,
  FilterProjects,
  FiltersDropdown,
  FilterStartDate,
  FilterState,
  FilterStateGroup,
} from "@/components/issues/issue-layouts/filters";
import { isFiltersApplied } from "@/components/issues/issue-layouts/utils";
type TSubIssueFiltersProps = {
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
  filters: IIssueFilterOptions;
  memberIds: string[] | undefined;
  states?: IState[];
  availableFilters: (keyof IIssueFilterOptions)[];
};

export const SubIssueFilters = observer(function SubIssueFilters(props: TSubIssueFiltersProps) {
  const { handleFiltersUpdate, filters, memberIds, states, availableFilters } = props;
  // plane hooks
  const { t } = useTranslation();

  const isFilterEnabled = (filter: keyof IIssueFilterOptions) => !!availableFilters.includes(filter);

  const isFilterApplied = useMemo(() => isFiltersApplied(filters), [filters]);

  return (
    <>
      <FiltersDropdown
        title={t("common.filters")}
        placement="bottom-end"
        menuButton={
          <div
            className={cn(
              "relative rounded-sm p-1 transition-all duration-200",
              isFilterApplied && "bg-accent-primary/20"
            )}
          >
            {isFilterApplied && <span className="absolute -top-1 -right-1 rounded-full bg-accent-primary p-1" />}
            <FilterOutline className="h-3.5 w-3.5 text-primary" />
          </div>
        }
      >
        {/* Priority */}
        {isFilterEnabled("priority") && (
          <FilterPriority
            appliedFilters={filters.priority ?? null}
            handleUpdate={(val) => handleFiltersUpdate("priority", val)}
          />
        )}

        {/* state group */}
        {isFilterEnabled("state_group") && (
          <FilterStateGroup
            appliedFilters={filters.state_group ?? null}
            handleUpdate={(val) => handleFiltersUpdate("state_group", val)}
          />
        )}

        {/* State */}
        {isFilterEnabled("state") && (
          <FilterState
            appliedFilters={filters.state ?? null}
            handleUpdate={(val) => handleFiltersUpdate("state", val)}
            states={states}
          />
        )}

        {/* Projects */}
        {isFilterEnabled("project") && (
          <FilterProjects
            appliedFilters={filters.project ?? null}
            handleUpdate={(val) => handleFiltersUpdate("project", val)}
          />
        )}

        {/* Assignees */}
        {isFilterEnabled("assignees") && (
          <FilterAssignees
            appliedFilters={filters.assignees ?? null}
            handleUpdate={(val) => handleFiltersUpdate("assignees", val)}
            memberIds={memberIds}
          />
        )}

        {/* Start Date */}
        {isFilterEnabled("start_date") && (
          <FilterStartDate
            appliedFilters={filters.start_date ?? null}
            handleUpdate={(val) => handleFiltersUpdate("start_date", val)}
          />
        )}

        {/* Target Date */}
        {isFilterEnabled("target_date") && (
          <FilterDueDate
            appliedFilters={filters.target_date ?? null}
            handleUpdate={(val) => handleFiltersUpdate("target_date", val)}
          />
        )}
      </FiltersDropdown>
    </>
  );
});
