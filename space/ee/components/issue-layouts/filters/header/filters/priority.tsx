"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
// ui
import { PriorityIcon } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues/filters";
// constants
import { ISSUE_PRIORITIES } from "@/constants/issue";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
  allowedValues: string[] | undefined;
};

export const FilterPriority: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery, allowedValues } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = ISSUE_PRIORITIES.filter(
    (p) => (allowedValues?.includes(p.key) ?? true) && p.key.includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <FilterHeader
        title={`Priority${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((priority) => (
              <FilterOption
                key={priority.key}
                isChecked={appliedFilters?.includes(priority.key) ? true : false}
                onClick={() => handleUpdate(priority.key)}
                icon={<PriorityIcon priority={priority.key} className="h-3.5 w-3.5" />}
                title={priority.title}
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
