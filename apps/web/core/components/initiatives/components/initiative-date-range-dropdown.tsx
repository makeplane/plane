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
import { differenceInCalendarDays } from "date-fns";
import { observer } from "mobx-react";
// plane imports
import type { DateRange } from "@plane/propel/calendar";
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
// core components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
// plane Web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiative } from "@/types/initiative";

type TInitiativeDateRangeDropdownProps = {
  initiative: TInitiative;
  workspaceSlug: string;
};

export const InitiativeDateRangeDropdown = observer(function InitiativeDateRangeDropdown(
  props: TInitiativeDateRangeDropdownProps
) {
  const { initiative, workspaceSlug } = props;
  const {
    initiative: { updateInitiative },
  } = useInitiatives();

  const handleDateChange = (range: DateRange | undefined) => {
    updateInitiative?.(workspaceSlug, initiative.id, {
      start_date: range?.from ? renderFormattedPayloadDate(range.from) : null,
      end_date: range?.to ? renderFormattedPayloadDate(range.to) : null,
    });
  };

  const endDate = getDate(initiative.end_date);
  const shouldHighlightEndDate = endDate && differenceInCalendarDays(endDate, new Date()) <= 0;

  return (
    <DateRangeDropdown
      value={{
        from: getDate(initiative.start_date) || undefined,
        to: endDate || undefined,
      }}
      onSelect={handleDateChange}
      hideIcon={{
        from: false,
      }}
      isClearable
      mergeDates
      buttonVariant={initiative.start_date || initiative.end_date ? "border-with-text" : "border-without-text"}
      buttonClassName={shouldHighlightEndDate ? "text-danger-primary" : ""}
      showTooltip
      renderPlaceholder={false}
      renderInPortal
    />
  );
});
