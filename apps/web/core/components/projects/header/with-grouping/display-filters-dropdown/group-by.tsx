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
import { PROJECT_GROUP_BY_OPTIONS } from "@/constants/project";
// types
import type { TProjectGroupBy } from "@/types/workspace-project-filters";

type TDisplayFilterGroupBy = {
  filterValue: TProjectGroupBy | undefined;
  handleUpdate: (val: TProjectGroupBy) => void;
};

export const DisplayFilterGroupBy = observer(function DisplayFilterGroupBy(props: TDisplayFilterGroupBy) {
  const { filterValue, handleUpdate } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  return (
    <>
      <FilterHeader
        title="Group by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {PROJECT_GROUP_BY_OPTIONS.map((groupBy) => (
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
