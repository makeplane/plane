"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { TModuleStatus } from "@plane/types";
// components
import { ModuleStatusIcon } from "@plane/ui";
import { FilterHeader, FilterOption } from "@/components/issues";
// ui
// types
import { MODULE_STATUS } from "@/constants/module";
// constants

type Props = {
  appliedFilters: TModuleStatus[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterStatus: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const filteredOptions = MODULE_STATUS.filter((p) => p.value.includes(searchQuery.toLowerCase()));
  const appliedFiltersCount = appliedFilters?.length ?? 0;

  return (
    <>
      <FilterHeader
        title={`Status${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((status) => (
              <FilterOption
                key={status.value}
                isChecked={appliedFilters?.includes(status.value) ? true : false}
                onClick={() => handleUpdate(status.value)}
                icon={<ModuleStatusIcon status={status.value} />}
                title={status.label}
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
