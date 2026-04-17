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
import { ISSUE_ORDER_BY_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssueOrderByOptions } from "@plane/types";

// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

type Props = {
  selectedOrderBy: TIssueOrderByOptions | undefined;
  handleUpdate: (val: TIssueOrderByOptions) => void;
  orderByOptions: TIssueOrderByOptions[];
};

export const FilterOrderBy = observer(function FilterOrderBy(props: Props) {
  const { selectedOrderBy, handleUpdate, orderByOptions } = props;
  // hooks
  const { t } = useTranslation();

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const activeOrderBy = selectedOrderBy ?? "-created_at";

  return (
    <>
      <FilterHeader
        title={t("common.order_by.label")}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {ISSUE_ORDER_BY_OPTIONS.filter((option) => orderByOptions.includes(option.key)).map((orderBy) => (
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
