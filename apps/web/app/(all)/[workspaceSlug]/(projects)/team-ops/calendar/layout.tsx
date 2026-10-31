/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet, useParams } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { CalendarTabs } from "@/components/team-ops/calendar";
import { CalendarHeader } from "./header";

export default function CalendarLayout() {
  const { workspaceSlug } = useParams();

  return (
    <>
      <AppHeader header={<CalendarHeader />} />
      <ContentWrapper>
        {workspaceSlug ? <CalendarTabs workspaceSlug={workspaceSlug} /> : null}
        <Outlet />
      </ContentWrapper>
    </>
  );
}
