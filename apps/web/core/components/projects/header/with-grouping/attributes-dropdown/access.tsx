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
// hooks

import { GlobeIcon, LockIcon } from "@plane/propel/icons";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters/header";
// plane web hooks
import { PROJECT_ACCESS } from "@/constants/project";
import type { TProjectAccess } from "@/types/workspace-project-filters";
import type { EProjectAccess } from "@/types/workspace-project-states";

type TFilterAccess = {
  workspaceId: string;
  searchQuery: string;
  appliedFilters: EProjectAccess[] | null;
  handleUpdate: (val: EProjectAccess[]) => void;
};

export const FilterAccess = observer(function FilterAccess(props: TFilterAccess) {
  const { searchQuery, appliedFilters, handleUpdate } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const sortedOptions = useMemo(
    () => PROJECT_ACCESS.filter((access) => access.key.includes(searchQuery.toLowerCase()) || searchQuery === ""),

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
                icon={
                  access.key === "public" ? <GlobeIcon className={`h-3 w-3`} /> : <LockIcon className={`h-3 w-3`} />
                }
                title={access.label}
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
