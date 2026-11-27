/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: "New" work items (liviere/unread), registered in app/routes/extended.ts.

import { Outlet } from "react-router";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { NewWorkItemsHeader } from "@/liviere/unread/new-work-items-header";

export default function NewWorkItemsLayout() {
  return (
    <>
      <AppHeader header={<NewWorkItemsHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
