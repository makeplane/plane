/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { ISvgIcons } from "@plane/propel/icons";
import { GlobeIcon, LockIcon } from "@plane/propel/icons";
import { EViewAccess } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

type Props = {
  appliedFilters: EViewAccess[] | undefined;
  handleUpdate: (val: string | string[]) => void;
  searchQuery: string;
  accessFilters: { key: EViewAccess; value: string }[];
};

const VIEW_ACCESS_ICONS: Record<EViewAccess, React.FC<ISvgIcons>> = {
  [EViewAccess.PUBLIC]: GlobeIcon,
  [EViewAccess.PRIVATE]: LockIcon,
};

export const FilterByAccess = observer(function FilterByAccess(props: Props) {
  const { appliedFilters, handleUpdate, searchQuery, accessFilters } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);
  // derived values
  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const filteredOptions = accessFilters.filter((access) =>
    access.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // `view_type` filter values are numeric EViewAccess entries and the call-site handler
  // forwards them as-is, so the string typing of `handleUpdate` is nominal only
  const handleAccessUpdate = (val: EViewAccess) => handleUpdate(val as unknown as string);

  return (
    <div className="py-2">
      <FilterHeader
        title={`Access${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((access) => {
              const AccessIcon = VIEW_ACCESS_ICONS[access.key];
              return (
                <FilterOption
                  key={access.key}
                  isChecked={appliedFilters?.includes(access.key) ?? false}
                  onClick={() => handleAccessUpdate(access.key)}
                  icon={AccessIcon ? <AccessIcon className="h-3 w-3" /> : undefined}
                  title={access.value}
                />
              );
            })
          ) : (
            <p className="text-11 text-placeholder italic">No matches found</p>
          )}
        </div>
      )}
    </div>
  );
});
