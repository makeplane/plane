/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PageWrapper } from "@/components/common/page-wrapper";
import { SchedulesList } from "@/components/calendar";

const CalendarPage = observer(function CalendarPage() {
  return (
    <PageWrapper
      header={{
        title: "Business Calendar",
        description: "Quản lý lịch làm việc, ngày lễ và các ngày override cho instance.",
      }}
    >
      <SchedulesList />
    </PageWrapper>
  );
});

// eslint-disable-next-line react-refresh/only-export-components
export function meta() {
  return [{ title: "Business Calendar - God Mode" }];
}

export default CalendarPage;
