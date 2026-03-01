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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { NETWORK_CHOICES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";
import { ProjectNetworkIcon } from "@/components/projects/common/project-network-icon";

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
};

export const FilterAccess = observer(function FilterAccess(props: Props) {
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
            <p className="text-11 italic text-placeholder">No matches found</p>
          )}
        </div>
      )}
    </>
  );
});
