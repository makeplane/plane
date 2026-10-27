/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CloseOutline, FilterOutline, SearchOutline } from "@makeplane/propel/icons";
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
  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  const isFilterEnabled = (filter: keyof IIssueFilterOptions) => !!availableFilters.includes(filter);

  const isFilterApplied = useMemo(() => isFiltersApplied(filters), [filters]);

  return (
    <>
      <FiltersDropdown
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
        <div className="flex max-h-[350px] flex-col overflow-hidden">
          <div className="bg-surface-1 p-2.5 pb-0">
            <InputGroup size="md">
              <Icon icon={SearchOutline} tint="placeholder" />
              <Input
                size="md"
                aria-label={t("common.search.label")}
                type="text"
                placeholder={t("common.search.label")}
                value={filtersSearchQuery}
                onChange={(e) => setFiltersSearchQuery(e.target.value)}
              />
              {filtersSearchQuery !== "" && (
                <IconButton
                  type="button"
                  variant="ghost"
                  size="xs"
                  aria-label={t("common.clear")}
                  onClick={() => setFiltersSearchQuery("")}
                  icon={<Icon icon={CloseOutline} />}
                />
              )}
            </InputGroup>
          </div>
          <div className="vertical-scrollbar scrollbar-sm h-full w-full divide-y divide-subtle-1 overflow-y-auto px-2.5 text-left">
            {/* Priority */}
            {isFilterEnabled("priority") && (
              <div className="py-2">
                <FilterPriority
                  appliedFilters={filters.priority ?? null}
                  handleUpdate={(val) => handleFiltersUpdate("priority", val)}
                  searchQuery={filtersSearchQuery}
                />
              </div>
            )}

            {/* state group */}
            {isFilterEnabled("state_group") && (
              <div className="py-2">
                <FilterStateGroup
                  appliedFilters={filters.state_group ?? null}
                  handleUpdate={(val) => handleFiltersUpdate("state_group", val)}
                  searchQuery={filtersSearchQuery}
                />
              </div>
            )}

            {/* State */}
            {isFilterEnabled("state") && (
              <div className="py-2">
                <FilterState
                  appliedFilters={filters.state ?? null}
                  handleUpdate={(val) => handleFiltersUpdate("state", val)}
                  searchQuery={filtersSearchQuery}
                  states={states}
                />
              </div>
            )}

            {/* Projects */}
            {isFilterEnabled("project") && (
              <div className="py-2">
                <FilterProjects
                  appliedFilters={filters.project ?? null}
                  handleUpdate={(val) => handleFiltersUpdate("project", val)}
                  searchQuery={filtersSearchQuery}
                />
              </div>
            )}

            {/* Assignees */}
            {isFilterEnabled("assignees") && (
              <div className="py-2">
                <FilterAssignees
                  appliedFilters={filters.assignees ?? null}
                  handleUpdate={(val) => handleFiltersUpdate("assignees", val)}
                  memberIds={memberIds}
                  searchQuery={filtersSearchQuery}
                />
              </div>
            )}

            {/* Start Date */}
            {isFilterEnabled("start_date") && (
              <div className="py-2">
                <FilterStartDate
                  appliedFilters={filters.start_date ?? null}
                  handleUpdate={(val) => handleFiltersUpdate("start_date", val)}
                  searchQuery={filtersSearchQuery}
                />
              </div>
            )}

            {/* Target Date */}
            {isFilterEnabled("target_date") && (
              <div className="py-2">
                <FilterDueDate
                  appliedFilters={filters.target_date ?? null}
                  handleUpdate={(val) => handleFiltersUpdate("target_date", val)}
                  searchQuery={filtersSearchQuery}
                />
              </div>
            )}
          </div>
        </div>
      </FiltersDropdown>
    </>
  );
});
