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
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters/header";
// constants
import { PROJECT_SORT_ORDER_OPTIONS } from "@/constants/project";
// types
import type { TProjectSortOrder } from "@/types/workspace-project-filters";

type TDisplayFilterSortOrder = {
  filterValue: TProjectSortOrder | undefined;
  handleUpdate: (val: TProjectSortOrder) => void;
};

export const DisplayFilterSortOrder = observer(function DisplayFilterSortOrder(props: TDisplayFilterSortOrder) {
  const { filterValue, handleUpdate } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  return (
    <>
      <FilterHeader
        title="Order by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {PROJECT_SORT_ORDER_OPTIONS.map((groupBy) => (
            <FilterOption
              key={groupBy?.key}
              isChecked={filterValue === groupBy?.key ? true : false}
              onClick={() => handleUpdate(groupBy.key)}
              title={groupBy.title}
              multiple={false}
            />
          ))}
        </div>
      )}
    </>
  );
});
