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

import { observer } from "mobx-react";
import { Outlet } from "react-router";
// components
import { PageHead } from "@/components/core/page-title";
import { InitiativesUpgrade } from "@/components/initiatives/upgrade";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web components
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
// plane web hooks
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";

import type { Route } from "./+types/layout";

const ArchivedInitiativesLayout = observer(function ArchivedInitiativesLayout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store
  const { currentWorkspace } = useWorkspace();
  // plane web stores
  const { isWorkspaceFeatureEnabled, loader } = useWorkspaceFeatures();
  const isInitiativesFeatureEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_INITIATIVES_ENABLED);

  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Initiatives` : undefined;
  const shouldUpgrade = currentWorkspace && !isInitiativesFeatureEnabled && !loader;

  return (
    <WorkspaceAccessWrapper pageKey="initiatives">
      {shouldUpgrade ? (
        <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center">
          <InitiativesUpgrade workspaceSlug={workspaceSlug} redirect />
        </div>
      ) : (
        <>
          <PageHead title={pageTitle} />
          <Outlet />
        </>
      )}
    </WorkspaceAccessWrapper>
  );
});

export default ArchivedInitiativesLayout;
