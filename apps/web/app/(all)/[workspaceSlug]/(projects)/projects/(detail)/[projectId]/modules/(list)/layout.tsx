/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { ModulesListHeader } from "./header";
import { ModulesListMobileHeader } from "./mobile-header";

export default function ProjectModulesListLayout() {
  return (
    <>
      <AppHeader header={<ModulesListHeader />} mobileHeader={<ModulesListMobileHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
