/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";

export default function TimeTrackingLayout() {
  return (
    <>
      <AppHeader header={<div className="text-sm font-medium px-4 py-2">Time Tracking</div>} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
