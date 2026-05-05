/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Plus } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Loader } from "@plane/ui";
import { useBusinessCalendar } from "@/hooks/store";
import { ScheduleCard } from "./schedule-card";
import { CreateScheduleModal } from "./create-schedule-modal";

export const SchedulesList = observer(function SchedulesList() {
  const { schedules, fetchSchedules, loader } = useBusinessCalendar();
  const [createOpen, setCreateOpen] = useState(false);

  useSWR("BUSINESS_CALENDAR_SCHEDULES", fetchSchedules);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-h6-semibold text-primary">Business calendars</h2>
          <p className="text-body-sm-regular text-secondary">Manage work schedules and holidays for the instance.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New schedule
        </Button>
      </div>

      {loader ? (
        <Loader className="space-y-3 py-4">
          <Loader.Item height="100px" width="100%" />
          <Loader.Item height="100px" width="100%" />
          <Loader.Item height="100px" width="100%" />
        </Loader>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-subtle rounded-lg">
          <p className="text-body-sm-semibold text-secondary">No business calendars yet</p>
          <p className="text-caption-sm-regular text-tertiary mt-1">
            Create your first schedule to manage working days
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((s) => (
            <ScheduleCard key={s.id} schedule={s} />
          ))}
        </div>
      )}

      <CreateScheduleModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
});
