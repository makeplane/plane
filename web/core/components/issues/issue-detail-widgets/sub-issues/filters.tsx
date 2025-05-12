import { FC, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ListFilter, Search, X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { IIssueFilterOptions, ILayoutDisplayFiltersOptions, IState } from "@plane/types";
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
} from "@/components/issues";
import { isFiltersApplied } from "@/components/issues/issue-layouts/utils";
import { FilterIssueTypes } from "@/plane-web/components/issues/filters/issue-types";

type TSubIssueFiltersProps = {
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
  filters: IIssueFilterOptions;
  memberIds: string[] | undefined;
  states?: IState[];
  layoutDisplayFiltersOptions: ILayoutDisplayFiltersOptions | undefined;
};

export const SubIssueFilters: FC<TSubIssueFiltersProps> = observer((props) => {
  const { handleFiltersUpdate, filters, memberIds, states, layoutDisplayFiltersOptions } = props;

  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  const isFilterEnabled = (filter: keyof IIssueFilterOptions) =>
    !!layoutDisplayFiltersOptions?.filters.includes(filter);
  const isFilterApplied = useMemo(() => isFiltersApplied(filters), [filters]);
  // hooks
  const { t } = useTranslation();

  return (
    <>
      <FiltersDropdown
        placement="bottom-end"
        menuButton={
          <div
            className={cn(
              "p-1 rounded  relative transition-all duration-200",
              isFilterApplied && "bg-custom-primary-60/20"
            )}
          >
            {isFilterApplied && <span className="p-1 rounded-full bg-custom-primary-100 absolute -top-1 -right-1" />}
            <ListFilter className="h-3.5 w-3.5 text-custom-text-100" />
          </div>
        }
      >
        <div className="flex max-h-[350px] flex-col overflow-hidden">
          <div className="bg-custom-background-100 p-2.5 pb-0">
            <div className="flex items-center gap-1.5 rounded border-[0.5px] border-custom-border-200 bg-custom-background-90 px-1.5 py-1 text-xs">
              <Search className="text-custom-text-400" size={12} strokeWidth={2} />
              <input
                type="text"
                className="w-full bg-custom-background-90 outline-none placeholder:text-custom-text-400"
                placeholder={t("common.search.label")}
                value={filtersSearchQuery}
                onChange={(e) => setFiltersSearchQuery(e.target.value)}
              />
              {filtersSearchQuery !== "" && (
                <button type="button" className="grid place-items-center" onClick={() => setFiltersSearchQuery("")}>
                  <X className="text-custom-text-300" size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
          <div className="vertical-scrollbar scrollbar-sm h-full w-full divide-y divide-custom-border-200 overflow-y-auto px-2.5 text-left">
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
