import { observer } from "mobx-react";
import { X } from "lucide-react";
// Plane
import { Tag } from "@plane/ui";
// helpers
import { replaceUnderscoreIfSnakeCase } from "@/helpers/string.helper";
// plane web components
import { TInitiativeFilters } from "@/plane-web/types/initiative";
//
import { AppliedDateFilters, AppliedMembersFilters } from "./";

type Props = {
  appliedFilters: TInitiativeFilters;
  handleClearAllFilters: () => void;
  handleRemoveFilter: (key: keyof TInitiativeFilters, value: string | null) => void;
};

const membersFilters = ["lead"];
const dateFilters = ["start_date", "target_date"];

export const AppliedFiltersList: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleClearAllFilters, handleRemoveFilter } = props;

  if (!appliedFilters) return null;

  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <div className="flex flex-wrap items-stretch gap-2 bg-custom-background-100 truncate my-auto">
      {Object.entries(appliedFilters).map(([key, value]) => {
        const filterKey = key as keyof TInitiativeFilters;

        if (!value) return;
        if (Array.isArray(value) && value.length === 0) return;

        return (
          <Tag key={filterKey}>
            <span className="text-xs text-custom-text-300">{replaceUnderscoreIfSnakeCase(filterKey)}</span>
            {membersFilters.includes(filterKey) && (
              <AppliedMembersFilters handleRemove={(val) => handleRemoveFilter(filterKey, val)} values={value} />
            )}
            {dateFilters.includes(filterKey) && (
              <AppliedDateFilters handleRemove={(val) => handleRemoveFilter(filterKey, val)} values={value} />
            )}
            <button
              type="button"
              className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
              onClick={() => handleRemoveFilter(filterKey, null)}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </Tag>
        );
      })}
      <button type="button" onClick={handleClearAllFilters}>
        <Tag>
          Clear all
          <X size={12} strokeWidth={2} />
        </Tag>
      </button>
    </div>
  );
});
