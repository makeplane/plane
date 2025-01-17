import React, { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// components
import { DateFilterModal } from "@/components/core";
import { FilterHeader, FilterOption } from "@/components/issues";
// constants
import { PROJECT_CREATED_AT_FILTER_OPTIONS } from "@/constants/filters";
// helpers
import { isInDateFormat } from "@/helpers/date-time.helper";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string | string[]) => void;
  searchQuery: string;
};

export const FilterCreatedDate: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // i18n
  const { t } = useTranslation();
  // state
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);
  // derived values
  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const filteredOptions = PROJECT_CREATED_AT_FILTER_OPTIONS.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isCustomDateSelected = () => {
    const isValidDateSelected = appliedFilters?.filter((f) => isInDateFormat(f.split(";")[0])) || [];
    return isValidDateSelected.length > 0 ? true : false;
  };
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
          title="Created date"
        />
      )}
      <FilterHeader
        title={`Created date${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
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
                  isChecked={appliedFilters?.includes(option.value) ? true : false}
                  onClick={() => handleUpdate(option.value)}
                  title={t(option.nameTranslationKey)}
                  multiple={false}
                />
              ))}
              <FilterOption
                isChecked={isCustomDateSelected()}
                onClick={handleCustomDate}
                title={t("custom")}
                multiple={false}
              />
            </>
          ) : (
            <p className="text-xs italic text-custom-text-400">{t("no_matches_found")}</p>
          )}
        </div>
      )}
    </>
  );
});
