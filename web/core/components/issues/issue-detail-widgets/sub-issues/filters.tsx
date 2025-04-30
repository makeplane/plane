import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ListFilter, Search, X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { IIssueFilterOptions, IState } from "@plane/types";
import {
  FilterAssignees,
  FilterDueDate,
  FilterPriority,
  FilterProjects,
  FiltersDropdown,
  FilterStartDate,
  FilterState,
} from "@/components/issues";
import { FilterIssueTypes } from "@/plane-web/components/issues/filters/issue-types";

type TSubIssueFiltersProps = {
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string | string[]) => void;
  filters: IIssueFilterOptions;
  projectMemberIds: string[] | undefined;
  projectStates?: IState[];
};

export const SubIssueFilters: FC<TSubIssueFiltersProps> = observer((props) => {
  const { handleFiltersUpdate, filters, projectMemberIds, projectStates } = props;

  // states
  const [filtersSearchQuery, setFiltersSearchQuery] = useState("");

  // hooks
  const { t } = useTranslation();

  return (
    <>
      <FiltersDropdown placement="bottom-end" menuButton={<ListFilter className="h-4 w-4 text-custom-text-100" />}>
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
            <div className="py-2">
              <FilterPriority
                appliedFilters={filters.priority ?? null}
                handleUpdate={(val) => handleFiltersUpdate("priority", val)}
                searchQuery={filtersSearchQuery}
              />
            </div>
            {/* State */}
            <div className="py-2">
              <FilterState
                appliedFilters={filters.state ?? null}
                handleUpdate={(val) => handleFiltersUpdate("state", val)}
                searchQuery={filtersSearchQuery}
                states={projectStates}
              />
            </div>
            {/* Projects */}
            <div className="py-2">
              <FilterProjects
                appliedFilters={filters.project ?? null}
                handleUpdate={(val) => handleFiltersUpdate("project", val)}
                searchQuery={filtersSearchQuery}
              />
            </div>
            {/* work item types */}
            <FilterIssueTypes
              appliedFilters={filters.issue_type ?? null}
              handleUpdate={(val) => handleFiltersUpdate("issue_type", val)}
              searchQuery={filtersSearchQuery}
            />
            {/* Assignees */}
            <div className="py-2">
              <FilterAssignees
                appliedFilters={filters.assignees ?? null}
                handleUpdate={(val) => handleFiltersUpdate("assignees", val)}
                memberIds={projectMemberIds}
                searchQuery={filtersSearchQuery}
              />
            </div>
            {/* Start Date */}
            <div className="py-2">
              <FilterStartDate
                appliedFilters={filters.start_date ?? null}
                handleUpdate={(val) => handleFiltersUpdate("start_date", val)}
                searchQuery={filtersSearchQuery}
              />
            </div>
            {/* Target Date */}
            <div className="py-2">
              <FilterDueDate
                appliedFilters={filters.target_date ?? null}
                handleUpdate={(val) => handleFiltersUpdate("target_date", val)}
                searchQuery={filtersSearchQuery}
              />
            </div>
          </div>
        </div>
      </FiltersDropdown>
    </>
  );
});
