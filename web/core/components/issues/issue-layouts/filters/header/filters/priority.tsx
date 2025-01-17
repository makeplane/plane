"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";

import { useTranslation } from "@plane/i18n";
// ui
import { PriorityIcon } from "@plane/ui";

// components
import { FilterHeader, FilterOption } from "@/components/issues";

// constants
import { ISSUE_PRIORITIES } from "@/constants/issue";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterPriority: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;

  // i18n
  const { t } = useTranslation();

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const filteredOptions = ISSUE_PRIORITIES.filter((p) => p.key.includes(searchQuery.toLowerCase()));

  return (
    <>
      <FilterHeader
        title={`${t("priority")} ${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
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
                title={t(priority.titleTranslationKey)}
              />
            ))
          ) : (
            <p className="text-xs italic text-custom-text-400">{t("no_matches_found")}</p>
          )}
        </div>
      )}
    </>
  );
});
