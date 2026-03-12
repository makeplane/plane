/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { CYCLE_GROUP_ORDER_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TCycleGroupOrderByOptions } from "@plane/types";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

type Props = {
  selectedCycleGroupOrderBy: TCycleGroupOrderByOptions | undefined;
  handleUpdate: (val: TCycleGroupOrderByOptions) => void;
};

export const FilterCycleGroupOrderBy = observer(function FilterCycleGroupOrderBy(props: Props) {
  const { selectedCycleGroupOrderBy, handleUpdate } = props;
  // hooks
  const { t } = useTranslation();
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const activeOrderBy = selectedCycleGroupOrderBy ?? "sort_order";

  return (
    <>
      <FilterHeader
        title={t("issue.display.cycle_group_order_by")}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {CYCLE_GROUP_ORDER_BY_OPTIONS.map((orderBy) => (
            <FilterOption
              key={orderBy.key}
              isChecked={activeOrderBy === orderBy.key}
              onClick={() => handleUpdate(orderBy.key)}
              title={t(orderBy.titleTranslationKey)}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
