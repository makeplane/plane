/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local components
import { ProjectsListHeader } from "@/plane-web/components/projects/header";
import { ProjectsListMobileHeader } from "@/plane-web/components/projects/mobile-header";

export default function ProjectListLayout() {
  return (
    <>
      <AppHeader header={<ProjectsListHeader />} mobileHeader={<ProjectsListMobileHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
