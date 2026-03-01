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

import React, { useState } from "react";
import { observer } from "mobx-react";
// plane constants
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { PriorityIcon } from "@plane/propel/icons";

// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterPriority = observer(function FilterPriority(props: Props) {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // hooks
  const { t } = useTranslation();
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = ISSUE_PRIORITIES.filter((p) => p.key.includes(searchQuery.toLowerCase()));
  return (
    <>
      <FilterHeader
        title={`Priority ${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
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
            <p className="text-11 italic text-placeholder">{t("common.search.no_matches_found")}</p>
          )}
        </div>
      )}
    </>
  );
});
