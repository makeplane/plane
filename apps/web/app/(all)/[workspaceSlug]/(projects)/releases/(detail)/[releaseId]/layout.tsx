/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Outlet, useMatch } from "react-router";
import { ReleaseScopeModals } from "@/components/releases/common/scope-modals";
import { ReleaseDetailHeader } from "@/components/releases/detail-header";
import type { Route } from "./+types/layout";

function ReleaseDetailLayout({ params }: Route.ComponentProps) {
  const changelogMatch = useMatch("/:workspaceSlug/releases/:releaseId/changelog");
  const overviewMatch = useMatch("/:workspaceSlug/releases/:releaseId/overview");
  const selectedTab = changelogMatch ? "changelog" : overviewMatch ? "overview" : "scope";

  return (
    <>
      <ReleaseDetailHeader selectedTab={selectedTab} />
      <Outlet />
      <ReleaseScopeModals workspaceSlug={params.workspaceSlug} releaseId={params.releaseId} />
    </>
  );
}

export default ReleaseDetailLayout;
