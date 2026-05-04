/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import type { IWorkScheduleCreate } from "@plane/types";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Loader } from "@plane/ui";
import { PageWrapper } from "@/components/common/page-wrapper";
import { ScheduleDetail } from "@/components/calendar";
import { useBusinessCalendar } from "@/hooks/store";

const VN_DEFAULT_SCHEDULE: IWorkScheduleCreate = {
  name: "VN Banking",
  timezone: "Asia/Ho_Chi_Minh",
  country_code: "VN",
  week_pattern: [true, true, true, true, true, false, false],
  is_default: true,
};

const CalendarPage = observer(function CalendarPage() {
  const { schedules, defaultSchedule, loader, fetchSchedules, createSchedule } = useBusinessCalendar();
  const [initing, setIniting] = useState(false);

  useSWR("BUSINESS_CALENDAR_SCHEDULES", fetchSchedules);

  const handleInit = async () => {
    if (initing) return;
    setIniting(true);
    try {
      await createSchedule(VN_DEFAULT_SCHEDULE);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Default schedule initialized" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to initialize default schedule" });
    } finally {
      setIniting(false);
    }
  };

  const activeSchedule = defaultSchedule ?? schedules[0];

  return (
    <PageWrapper
      header={{
        title: "Business Calendar",
        description: "Manage business calendar, holidays and day overrides for the instance.",
      }}
      size="lg"
    >
      <div className="max-w-[1600px] mx-auto w-full">
        {loader && schedules.length === 0 ? (
          <Loader className="space-y-3 py-4">
            <Loader.Item height="80px" width="100%" />
            <Loader.Item height="240px" width="100%" />
          </Loader>
        ) : !activeSchedule ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-subtle rounded-lg space-y-3">
            <div className="space-y-1">
              <p className="text-body-sm-semibold text-secondary">No business calendar yet</p>
              <p className="text-caption-sm-regular text-tertiary">
                Initialize the default "VN Banking" schedule to start managing working days and holidays.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => void handleInit()} disabled={initing} loading={initing}>
              Initialize default schedule
            </Button>
          </div>
        ) : (
          <ScheduleDetail scheduleId={activeSchedule.id} />
        )}
      </div>
    </PageWrapper>
  );
});

// eslint-disable-next-line react-refresh/only-export-components
export function meta() {
  return [{ title: "Business Calendar - God Mode" }];
}

export default CalendarPage;
