import { observer } from "mobx-react";
import { X } from "lucide-react";
import { TCycleFilters } from "@plane/types";
// hooks
import { AppliedDateFilters, AppliedStatusFilters } from "@/components/cycles";
import { EUserProjectRoles } from "@/constants/project";
import { replaceUnderscoreIfSnakeCase } from "@/helpers/string.helper";
import { useUser } from "@/hooks/store";
// components
// helpers
// types
// constants

type Props = {
  appliedFilters: TCycleFilters;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof TCycleFilters, value: string | null) => void;
  alwaysAllowEditing?: boolean;
};

const DATE_FILTERS = ["start_date", "end_date"];

export const CycleAppliedFiltersList: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleClearAllFilters, handleRemoveFilter, alwaysAllowEditing } = props;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();

  if (!appliedFilters) return null;

  if (Object.keys(appliedFilters).length === 0) return null;

  const isEditingAllowed = alwaysAllowEditing || (currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER);

  return (
    <div className="flex flex-wrap items-stretch gap-2 bg-custom-background-100">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof TCycleFilters;

        if (!value) return;
        if (Array.isArray(value) && value.length === 0) return;

        return (
          <div
            key={filterKey}
            className="flex flex-wrap items-center gap-2 rounded-md border border-custom-border-200 px-2 py-1 capitalize"
          >
            <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
            <div className="flex flex-wrap items-center gap-1">
              {filterKey === "status" && (
                <AppliedStatusFilters
                  editable={isEditingAllowed}
                  handleRemove={(val) => handleRemoveFilter("status", val)}
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
});
