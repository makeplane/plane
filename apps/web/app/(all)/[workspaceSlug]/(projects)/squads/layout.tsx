/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { Header } from "@plane/ui";
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";

function WorkspaceSquadsHeader() {
  return (
    <Header>
      <Header.LeftItem>
        <div className="text-16 font-semibold text-primary">Squads</div>
      </Header.LeftItem>
    </Header>
  );
}

export default function WorkspaceSquadsLayout() {
  return (
    <>
      <AppHeader header={<WorkspaceSquadsHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
