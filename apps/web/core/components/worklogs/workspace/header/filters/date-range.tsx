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

import type { FC } from "react";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogFilterDateRange = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogFilterDateRange = observer(function WorkspaceWorklogFilterDateRange(
  props: TWorkspaceWorklogFilterDateRange
) {
  const { workspaceSlug } = props;
  // hooks
  const { filters, updateFilters } = useWorkspaceWorklogs();
  // states
  const [startDateValue, setStartDateValue] = useState<string | undefined>(undefined);
  const [endDateValue, setEndDateValue] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (startDateValue && endDateValue && filters.created_at.length <= 0) {
      setStartDateValue(undefined);
      setEndDateValue(undefined);
    }
  }, [endDateValue, filters.created_at, startDateValue]);

  const handleDateChange = (from: string | undefined, to: string | undefined) =>
    handleSelectedOptions([`${from};after`, `${to};before`]);

  const handleSelectedOptions = (updatedIds: string[]) => updateFilters(workspaceSlug, "created_at", updatedIds);

  return (
    <div>
      <DateRangeDropdown
        className="h-6"
        buttonContainerClassName="w-full"
        buttonVariant="border-with-text"
        value={{
          from: getDate(startDateValue),
          to: getDate(endDateValue),
        }}
        onSelect={(val) => {
          setStartDateValue((val?.from && renderFormattedPayloadDate(val.from)) || undefined);
          setEndDateValue((val?.to && renderFormattedPayloadDate(val.to)) || undefined);
          handleDateChange(
            renderFormattedPayloadDate(val?.from) || undefined,
            renderFormattedPayloadDate(val?.to) || undefined
          );
        }}
        placeholder={{
          from: "Start date",
          to: "End date",
        }}
      />
    </div>
  );
});
