/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { DATE_BEFORE_FILTER_OPTIONS } from "@plane/constants";
import { isInDateFormat } from "@plane/utils";
// components
import { DateFilterModal } from "@/components/core/filters/date-filter-modal";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string | string[]) => void;
  searchQuery: string;
};

/**
 * Render searchable, localized creation-date presets and a custom-date picker while preserving filter values.
 */
export const FilterCreatedDate = observer(function FilterCreatedDate(props: Props) {
  const { t } = useTranslation();
  const { appliedFilters, handleUpdate, searchQuery } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = DATE_BEFORE_FILTER_OPTIONS.map((option) => {
    const [amount, unit] = option.value.split(";")[0].split("_");
    return {
      value: option.value,
      name: t(`common.date_filter.${unit}_ago`, { count: Number(amount) }),
    };
  }).filter((option) => option.name.toLowerCase().includes(searchQuery.toLowerCase()));

  /**
   * Return whether an applied filter contains an explicit date rather than a relative-date preset.
   */
  const isCustomDateSelected = () => {
    const isValidDateSelected = appliedFilters?.filter((f) => isInDateFormat(f.split(";")[0])) || [];
    return isValidDateSelected.length > 0;
  };
  /**
   * Toggle applied custom-date values through the parent handler, or open the picker when none are selected.
   */
  const handleCustomDate = () => {
    if (isCustomDateSelected()) {
      const updateAppliedFilters = appliedFilters?.filter((f) => f.includes("-")) || [];
      handleUpdate(updateAppliedFilters);
    } else setIsDateFilterModalOpen(true);
  };

  return (
    <>
      {isDateFilterModalOpen && (
        <DateFilterModal
          handleClose={() => setIsDateFilterModalOpen(false)}
          isOpen={isDateFilterModalOpen}
          onSelect={(val) => handleUpdate(val)}
          title={t("common.date_filter.created_date")}
        />
      )}
      <FilterHeader
        title={`${t("common.date_filter.created_date")}${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            <>
              {filteredOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  isChecked={appliedFilters?.includes(option.value) ?? false}
                  onClick={() => handleUpdate(option.value)}
                  title={option.name}
                  multiple
                />
              ))}
              <FilterOption
                isChecked={isCustomDateSelected()}
                onClick={handleCustomDate}
                title={t("common.date_filter.custom")}
                multiple
              />
            </>
          ) : (
            <p className="text-11 text-placeholder italic">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
