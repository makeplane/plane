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
import type { EViewAccess } from "@plane/types";
// plane imports
import { Loader } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters/header";

type Props = {
  appliedFilters: EViewAccess[] | undefined;
  handleUpdate: (val: string) => void;
  accessFilters: { key: any; value: string }[];
  searchQuery: string;
};

export const FilterByAccess = observer(function FilterByAccess(props: Props) {
  const { appliedFilters, handleUpdate, accessFilters, searchQuery } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const filteredOptions = useMemo(() => {
    const options = (accessFilters || []).filter((accessFilter) =>
      accessFilter.value.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return options;
  }, [searchQuery]);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  return (
    <div className="py-2">
      <FilterHeader
        title={`View Type${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions ? (
            filteredOptions && filteredOptions.length > 0 ? (
              <>
                {filteredOptions.map((accessOption) => {
                  if (!accessOption) return null;
                  return (
                    <FilterOption
                      key={`access-${accessOption.key}`}
                      isChecked={appliedFilters?.includes(accessOption.key) ? true : false}
                      onClick={() => handleUpdate(accessOption.key)}
                      title={accessOption.value}
                    />
                  );
                })}
              </>
            ) : (
              <p className="text-11 italic text-placeholder">No matches found</p>
            )
          ) : (
            <Loader className="space-y-2">
              <Loader.Item height="20px" />
              <Loader.Item height="20px" />
              <Loader.Item height="20px" />
            </Loader>
          )}
        </div>
      )}
    </div>
  );
});
