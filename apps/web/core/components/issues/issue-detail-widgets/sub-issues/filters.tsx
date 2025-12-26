import type { FC } from "react";
import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { SearchIcon, CloseIcon } from "@plane/propel/icons";
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
import { FilterIssueTypes } from "@/plane-web/components/issues/filters/issue-types";
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
              "p-1 rounded-sm  relative transition-all duration-200",
              isFilterApplied && "bg-accent-primary/20"
            )}
          >
            {isFilterApplied && <span className="p-1 rounded-full bg-accent-primary absolute -top-1 -right-1" />}
            <ListFilter className="h-3.5 w-3.5 text-primary" />
          </div>
        }
      >
        <div className="flex max-h-[350px] flex-col overflow-hidden">
          <div className="bg-surface-1 p-2.5 pb-0">
            <div className="flex items-center gap-1.5 rounded-sm border-[0.5px] border-subtle bg-surface-2 px-1.5 py-1 text-11">
              <SearchIcon className="text-placeholder" width={12} height={12} strokeWidth={2} />
              <input
                type="text"
                className="w-full bg-surface-2 outline-none placeholder:text-placeholder"
                placeholder={t("common.search.label")}
                value={filtersSearchQuery}
                onChange={(e) => setFiltersSearchQuery(e.target.value)}
              />
              {filtersSearchQuery !== "" && (
                <button type="button" className="grid place-items-center" onClick={() => setFiltersSearchQuery("")}>
                  <CloseIcon className="text-tertiary" height={12} width={12} strokeWidth={2} />
                </button>
              )}
            </div>
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

            {/* work item types */}
            {isFilterEnabled("issue_type") && (
              <div className="py-2">
                <FilterIssueTypes
                  appliedFilters={filters.issue_type ?? null}
                  handleUpdate={(val) => handleFiltersUpdate("issue_type", val)}
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
