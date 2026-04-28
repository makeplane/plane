/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
import { PageWrapper } from "@/components/common/page-wrapper";
import { ScheduleDetail } from "@/components/calendar";
import { useBusinessCalendar } from "@/hooks/store";
import type { Route } from "./+types/page";

const CalendarDetailPage = observer(function CalendarDetailPage({ params }: Route.ComponentProps) {
  const scheduleId = params.scheduleId;
  const { fetchSchedules } = useBusinessCalendar();

  // Ensure schedules are loaded when navigating directly to this URL
  useSWR("BUSINESS_CALENDAR_SCHEDULES", fetchSchedules);

  return (
    <PageWrapper>
      <ScheduleDetail scheduleId={scheduleId} />
    </PageWrapper>
  );
});

// eslint-disable-next-line react-refresh/only-export-components
export function meta() {
  return [{ title: "Schedule Detail - God Mode" }];
}

export default CalendarDetailPage;
