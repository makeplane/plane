"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
// hooks
import { Globe2, Lock } from "lucide-react";
import { FilterHeader, FilterOption } from "@/components/issues";
// plane web hooks
import { PROJECT_ACCESS } from "@/plane-web/constants/project";
import { TProjectAccess } from "@/plane-web/types/workspace-project-filters";
import { EProjectAccess } from "@/plane-web/types/workspace-project-states";

type TFilterAccess = {
  workspaceId: string;
  searchQuery: string;
  appliedFilters: EProjectAccess[] | null;
  handleUpdate: (val: EProjectAccess[]) => void;
};

export const FilterAccess: React.FC<TFilterAccess> = observer((props) => {
  const { searchQuery, appliedFilters, handleUpdate } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const sortedOptions = useMemo(
    () => PROJECT_ACCESS.filter((access) => access.key.includes(searchQuery.toLowerCase()) || searchQuery === ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery]
  );

  const handleFilter = (val: TProjectAccess) => {
    if (appliedFilters?.includes(val)) {
      handleUpdate(appliedFilters.filter((access) => access !== val));
    } else {
      handleUpdate([...(appliedFilters ?? []), val]);
    }
  };

  return (
    <>
      <FilterHeader
        title={`Access${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {sortedOptions.length > 0 ? (
            sortedOptions.map((access) => (
              <FilterOption
                key={access.key}
                isChecked={appliedFilters?.includes(access.key) ? true : false}
                onClick={() => handleFilter(access.key)}
                icon={access.key === "public" ? <Globe2 className={`h-3 w-3`} /> : <Lock className={`h-3 w-3`} />}
                title={access.label}
              />
            ))
          ) : (
            <p className="text-xs italic text-custom-text-400">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
