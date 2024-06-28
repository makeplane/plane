import { X } from "lucide-react";
import { TPageFilterProps } from "@plane/types";
// components
import { AppliedDateFilters, AppliedMembersFilters } from "@/components/common/applied-filters";
// helpers
import { replaceUnderscoreIfSnakeCase } from "@/helpers/string.helper";
// types

type Props = {
  appliedFilters: TPageFilterProps;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof TPageFilterProps, value: string | null) => void;
  alwaysAllowEditing?: boolean;
};

const MEMBERS_FILTERS = ["created_by"];
const DATE_FILTERS = ["created_at"];

export const PageAppliedFiltersList: React.FC<Props> = (props) => {
  const { appliedFilters, handleClearAllFilters, handleRemoveFilter, alwaysAllowEditing } = props;

  if (!appliedFilters) return null;
  if (Object.keys(appliedFilters).length === 0) return null;

  const isEditingAllowed = alwaysAllowEditing;

  return (
    <div className="flex flex-wrap items-stretch gap-2 bg-custom-background-100">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof TPageFilterProps;

        if (!value) return;
        if (Array.isArray(value) && value.length === 0) return;

        return (
          <div
            key={filterKey}
            className="flex flex-wrap items-center gap-2 rounded-md border border-custom-border-200 px-2 py-1 capitalize"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
              {DATE_FILTERS.includes(filterKey) && (
                <AppliedDateFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={Array.isArray(value) ? value : []}
                />
              )}
              {MEMBERS_FILTERS.includes(filterKey) && (
                <AppliedMembersFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter(filterKey, val)}
                  values={Array.isArray(value) ? value : []}
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
  );
};
