/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { TCycleFilters, TCycleGroups } from "@plane/types";
// local imports
import { FilterEndDate } from "./end-date";
import { FilterStartDate } from "./start-date";
import { FilterStatus } from "./status";

type Props = {
  filters: TCycleFilters;
  handleFiltersUpdate: (key: keyof TCycleFilters, value: string | string[]) => void;
  isArchived?: boolean;
};

export const CycleFiltersSelection = observer(function CycleFiltersSelection(props: Props) {
  const { filters, handleFiltersUpdate, isArchived = false } = props;

  return (
    <>
      {/* cycle status */}
      {!isArchived && (
        <FilterStatus
          appliedFilters={(filters.status as TCycleGroups[]) ?? null}
          handleUpdate={(val) => handleFiltersUpdate("status", val)}
        />
      )}

      {/* start date */}
      <FilterStartDate
        appliedFilters={filters.start_date ?? null}
        handleUpdate={(val) => handleFiltersUpdate("start_date", val)}
      />

      {/* end date */}
      <FilterEndDate
        appliedFilters={filters.end_date ?? null}
        handleUpdate={(val) => handleFiltersUpdate("end_date", val)}
      />
    </>
  );
});
