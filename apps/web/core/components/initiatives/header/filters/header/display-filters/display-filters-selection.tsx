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

import React from "react";
import { observer } from "mobx-react";
// components
import type { TInitiativeDisplayFilters } from "@plane/types";
import { INITIATIVE_GROUP_BY_OPTIONS, INITIATIVE_ORDER_BY_OPTIONS } from "@/constants/initiative";
import { FilterGroupBy } from "./group-by";
import { FilterOrderBy } from "./order-by";
// Plane-web

type Props = {
  displayFilters: TInitiativeDisplayFilters | undefined;
  handleDisplayFiltersUpdate: (updatedDisplayFilter: Partial<TInitiativeDisplayFilters>) => void;
};

export const DisplayFiltersSelection = observer(function DisplayFiltersSelection(props: Props) {
  const { displayFilters, handleDisplayFiltersUpdate } = props;

  const isDisplayFilterEnabled = (displayFilter: keyof TInitiativeDisplayFilters) => {
    if (displayFilter === "group_by" && displayFilters?.layout === "gantt") {
      return false;
    }
    return true;
  };

  return (
    <div className="vertical-scrollbar scrollbar-sm relative h-full w-full divide-y divide-subtle overflow-hidden overflow-y-auto px-2.5">
      {/* group by */}
      {isDisplayFilterEnabled("group_by") && (
        <div className="py-2">
          <FilterGroupBy
            displayFilters={displayFilters}
            groupByOptions={INITIATIVE_GROUP_BY_OPTIONS.map((option) => option.key)}
            handleUpdate={(val) =>
              handleDisplayFiltersUpdate({
                group_by: val,
              })
            }
          />
        </div>
      )}

      {/* order by */}
      {isDisplayFilterEnabled("order_by") && (
        <div className="py-2">
          <FilterOrderBy
            selectedOrderBy={displayFilters?.order_by}
            handleUpdate={(val) =>
              handleDisplayFiltersUpdate({
                order_by: val,
              })
            }
            orderByOptions={INITIATIVE_ORDER_BY_OPTIONS.map((option) => option.key)}
          />
        </div>
      )}
    </div>
  );
});
