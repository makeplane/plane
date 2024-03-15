import { X } from "lucide-react";
// components
import { AppliedAccessFilters, AppliedDateFilters, AppliedMembersFilters } from "components/project";
// ui
import { Tooltip } from "@plane/ui";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { TProjectFilters } from "@plane/types";

type Props = {
  appliedFilters: TProjectFilters;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof TProjectFilters, value: string | null) => void;
  alwaysAllowEditing?: boolean;
  filteredProjects: number;
  totalProjects: number;
};

const MEMBERS_FILTERS = ["lead", "members"];
const DATE_FILTERS = ["created_at"];

export const ProjectAppliedFiltersList: React.FC<Props> = (props) => {
  const {
    appliedFilters,
    handleClearAllFilters,
    handleRemoveFilter,
    alwaysAllowEditing,
    filteredProjects,
    totalProjects,
  } = props;

  if (!appliedFilters) return null;
  if (Object.keys(appliedFilters).length === 0) return null;

  const isEditingAllowed = alwaysAllowEditing;

  return (
    <div className="flex items-start justify-between gap-1.5">
      <div className="flex flex-wrap items-stretch gap-2 bg-custom-background-100">
        {Object.entries(appliedFilters).map(([key, value]) => {
          const filterKey = key as keyof TProjectFilters;

          if (!value) return;
          if (Array.isArray(value) && value.length === 0) return;

          return (
            <div
              key={filterKey}
              className="flex flex-wrap items-center gap-2 rounded-md border border-custom-border-200 px-2 py-1 capitalize"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
                {filterKey === "access" && (
                  <AppliedAccessFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter("access", val)}
                    values={value}
                  />
                )}
                {DATE_FILTERS.includes(filterKey) && (
                  <AppliedDateFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                    values={value}
                  />
                )}
                {MEMBERS_FILTERS.includes(filterKey) && (
                  <AppliedMembersFilters
                    editable={isEditingAllowed}
                    handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                    values={value}
                  />
                )}
                {isEditingAllowed && (
                  <button
                    type="button"
                    className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                    onClick={() => handleRemoveFilter(filterKey, null)}
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {isEditingAllowed && (
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="flex items-center gap-2 rounded-md border border-custom-border-200 px-2 py-1 text-xs text-custom-text-300 hover:text-custom-text-200"
          >
            Clear all
            <X size={12} strokeWidth={2} />
          </button>
        )}
      </div>
      <Tooltip
        tooltipContent={
          <p>
            <span className="font-semibold">{filteredProjects}</span> of{" "}
            <span className="font-semibold">{totalProjects}</span> projects match the applied filters.
          </p>
        }
      >
        <span className="bg-custom-background-80 rounded-full text-sm font-medium py-1 px-2.5">
          {filteredProjects}/{totalProjects}
        </span>
      </Tooltip>
    </div>
  );
};
