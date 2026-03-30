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

import type { TInitiativeDisplayFilters, TInitiativeGroupByOptions } from "@plane/types";
import { observer } from "mobx-react";
import { useMemo, useState } from "react";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters/header";
// Plane-web
import { INITIATIVE_GROUP_BY_OPTIONS } from "@/constants/initiative";

type Props = {
  displayFilters: TInitiativeDisplayFilters | undefined;
  groupByOptions: TInitiativeGroupByOptions[];
  handleUpdate: (val: TInitiativeGroupByOptions) => void;
};

export const FilterGroupBy = observer(function FilterGroupBy(props: Props) {
  const { displayFilters, groupByOptions, handleUpdate } = props;

  const [previewEnabled, setPreviewEnabled] = useState(true);

  const selectedGroupBy = displayFilters?.group_by;
  const layout = displayFilters?.layout;
  const options = useMemo(
    () =>
      INITIATIVE_GROUP_BY_OPTIONS.filter((option) => {
        if (!groupByOptions.includes(option.key)) return false;
        if (layout === "kanban" && (option.key === undefined || option.key === null)) return false;
        return true;
      }),
    [groupByOptions, layout]
  );

  return (
    <>
      <FilterHeader
        title="Group by"
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {options.map((groupBy) => (
            <FilterOption
              key={groupBy?.key ?? "none"}
              isChecked={selectedGroupBy === groupBy?.key}
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
