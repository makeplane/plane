import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { NETWORK_CHOICES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { FilterHeader, FilterOption } from "@/components/issues";
import { ProjectNetworkIcon } from "@/components/project";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterAccess: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, searchQuery } = props;
  // states
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const { t } = useTranslation();

  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const filteredOptions = NETWORK_CHOICES.filter((a) => a.i18n_label.includes(searchQuery.toLowerCase()));

  return (
    <>
      <FilterHeader
        title={`Access${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((access) => (
              <FilterOption
                key={access.key}
                isChecked={appliedFilters?.includes(`${access.key}`) ? true : false}
                onClick={() => handleUpdate(`${access.key}`)}
                icon={<ProjectNetworkIcon iconKey={access.iconKey} />}
                title={t(access.i18n_label)}
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
