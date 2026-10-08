/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { CyclesListHeader } from "./header";
import { CyclesListMobileHeader } from "./mobile-header";

export default function ProjectCyclesListLayout() {
  return (
    <>
      <AppHeader header={<CyclesListHeader />} mobileHeader={<CyclesListMobileHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
