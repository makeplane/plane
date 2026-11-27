/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: project "Activity" (core/liviere/activity), registered in app/routes/extended.ts.

import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectActivityHeader } from "@/liviere/activity/activity-header";

export default function ProjectActivityLayout() {
  return (
    <>
      <AppHeader header={<ProjectActivityHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
