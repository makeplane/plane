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

import { Outlet } from "react-router";
import { observer } from "mobx-react";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { InitiativesFilterProvider } from "@/components/initiatives/components/rich-filters/context";
import { WorkspaceArchivesHeader } from "@/components/archives/workspace-archives-header";
// layout
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";

import type { Route } from "./+types/layout";

const ArchivedInitiativesLayout = observer(function ArchivedInitiativesLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;

  return (
    <WorkspaceAccessWrapper pageKey="archives" workspaceSlug={workspaceSlug}>
      <InitiativesFilterProvider isArchived>
        <AppHeader header={<WorkspaceArchivesHeader activeTab="initiatives" workspaceSlug={workspaceSlug} />} />
        <ContentWrapper>
          <Outlet />
        </ContentWrapper>
      </InitiativesFilterProvider>
    </WorkspaceAccessWrapper>
  );
});
export default ArchivedInitiativesLayout;
