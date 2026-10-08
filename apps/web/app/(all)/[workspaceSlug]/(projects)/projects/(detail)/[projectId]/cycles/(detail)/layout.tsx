/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { CycleIssuesHeader } from "./header";
import { CycleIssuesMobileHeader } from "./mobile-header";

export default function ProjectCycleIssuesLayout() {
  return (
    <>
      <AppHeader header={<CycleIssuesHeader />} mobileHeader={<CycleIssuesMobileHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
