/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { PriorityIcon } from "@plane/propel/icons";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters/header";
// plane web constants
import { PROJECT_PRIORITIES } from "@/constants/project";
// plane web types
import type { TProjectPriority } from "@/types/workspace-project-filters";

type TFilterPriority = {
  searchQuery: string;
  appliedFilters: TProjectPriority[] | null;
  handleUpdate: (val: TProjectPriority[]) => void;
};

export const FilterPriority = observer(function FilterPriority(props: TFilterPriority) {
  const { searchQuery, appliedFilters, handleUpdate } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const sortedOptions = useMemo(
    () =>
      PROJECT_PRIORITIES.filter((priority) => priority.key.includes(searchQuery.toLowerCase()) || searchQuery === ""),

    [searchQuery]
  );

  const handleFilter = (val: TProjectPriority) => {
    if (appliedFilters?.includes(val)) {
      handleUpdate(appliedFilters.filter((priority) => priority !== val));
    } else {
      handleUpdate([...(appliedFilters ?? []), val]);
    }
  };

  return (
    <>
      <FilterHeader
        title={`Priority${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {sortedOptions.length > 0 ? (
            sortedOptions.map((priority) => (
              <FilterOption
                key={priority.key}
                isChecked={appliedFilters?.includes(priority.key) ? true : false}
                onClick={() => handleFilter(priority.key)}
                icon={<PriorityIcon priority={priority.key} className={`h-3 w-3`} />}
                title={priority.label}
              />
            ))
          ) : (
            <p className="text-11 italic text-placeholder">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
