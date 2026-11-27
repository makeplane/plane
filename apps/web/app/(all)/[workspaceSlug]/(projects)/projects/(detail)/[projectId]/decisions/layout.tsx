/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: decision register (liviere/decisions), registered in app/routes/extended.ts.

import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ProjectDecisionsHeader } from "@/liviere/decisions/decisions-header";

export default function ProjectDecisionsLayout() {
  return (
    <>
      <AppHeader header={<ProjectDecisionsHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
