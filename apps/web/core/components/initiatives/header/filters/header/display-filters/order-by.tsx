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
// components
import type { TInitiativeOrderByOptions } from "@plane/types";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters/header";
// Plane-web
import { INITIATIVE_ORDER_BY_OPTIONS } from "@/constants/initiative";

type Props = {
  selectedOrderBy: TInitiativeOrderByOptions | undefined;
  handleUpdate: (val: TInitiativeOrderByOptions) => void;
  orderByOptions: TInitiativeOrderByOptions[];
};

export const FilterOrderBy = observer(function FilterOrderBy(props: Props) {
  const { selectedOrderBy, handleUpdate, orderByOptions } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const activeOrderBy = selectedOrderBy ?? "-created_at";

  return (
    <>
      <FilterHeader
        title="Order by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {INITIATIVE_ORDER_BY_OPTIONS.filter((option) => orderByOptions.includes(option.key)).map((orderBy) => (
            <FilterOption
              key={orderBy?.key}
              isChecked={activeOrderBy === orderBy?.key ? true : false}
              onClick={() => handleUpdate(orderBy.key)}
              title={orderBy.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
