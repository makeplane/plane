/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

type TAccessOption = {
  key: number;
  value: string;
};

type Props = {
  appliedFilters: number[] | null | undefined;
  handleUpdate: (val: number) => void;
  searchQuery: string;
  accessFilters: TAccessOption[];
};

export const FilterByAccess = observer(function FilterByAccess(props: Props) {
  const { appliedFilters, handleUpdate, searchQuery, accessFilters } = props;
  const { t } = useTranslation();
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const normalizedQuery = searchQuery.toLowerCase();
  const filteredOptions = accessFilters.filter((access) => access.value.toLowerCase().includes(normalizedQuery));

  return (
    <div className="py-2">
      <FilterHeader
        title={`${t("common.access.label")}${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled((prev) => !prev)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((access) => (
              <FilterOption
                key={access.key}
                isChecked={appliedFilters?.includes(access.key) ? true : false}
                onClick={() => handleUpdate(access.key)}
                title={access.value}
              />
            ))
          ) : (
            <p className="text-11 italic text-placeholder">{t("common.no_matches_found")}</p>
          )}
        </div>
      )}
    </div>
  );
});
