"use client";

import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
// components
import { DateRangeDropdown } from "@/components/dropdowns";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogFilterDateRange = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogFilterDateRange: FC<TWorkspaceWorklogFilterDateRange> = observer((props) => {
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
