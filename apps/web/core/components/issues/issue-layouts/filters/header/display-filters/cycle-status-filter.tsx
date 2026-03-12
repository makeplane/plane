/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { CYCLE_STATUS_FILTER_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TCycleStatusFilter } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

type Props = {
  selectedCycleStatus: TCycleStatusFilter[] | undefined;
  handleUpdate: (val: TCycleStatusFilter[]) => void;
};

export const FilterCycleStatus = observer(function FilterCycleStatus(props: Props) {
  const { selectedCycleStatus = [], handleUpdate } = props;
  // hooks
  const { t } = useTranslation();
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const handleToggle = (status: TCycleStatusFilter) => {
    const newStatus = selectedCycleStatus.includes(status)
      ? selectedCycleStatus.filter((s) => s !== status)
      : [...selectedCycleStatus, status];
    handleUpdate(newStatus);
  };

  return (
    <>
      <FilterHeader
        title={t("issue.display.cycle_status")}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {CYCLE_STATUS_FILTER_OPTIONS.map((option) => (
            <FilterOption
              key={option.key}
              isChecked={selectedCycleStatus.includes(option.key)}
              onClick={() => handleToggle(option.key)}
              title={t(option.titleTranslationKey)}
              multiple={true}
            />
          ))}
        </div>
      )}
    </>
  );
});
