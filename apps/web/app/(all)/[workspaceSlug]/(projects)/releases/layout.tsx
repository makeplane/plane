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
import { Navigate, Outlet, useMatch } from "react-router";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { AppHeader } from "@/components/core/app-header";
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
import { useFeatureFlags, useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
import type { Route } from "./+types/layout";
import { WorkspaceReleaseHeader } from "@/components/releases/header";
import { ReleaseDetailBreadcrumbHeader } from "@/components/releases/detail-breadcrumb-header";

function ReleasesLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { flags } = useFeatureFlags();
  const { isWorkspaceFeatureEnabled, featuresByWorkspaceSlug } = useWorkspaceFeatures();
  const isReleasesEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_RELEASES_ENABLED);
  const isFeatureFlagEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.RELEASES);
  const isDetailPage = useMatch("/:workspaceSlug/releases/:releaseId/*");

  const hasWorkspaceFeaturesLoaded = workspaceSlug ? featuresByWorkspaceSlug(workspaceSlug) !== undefined : false;
  const hasFeatureFlagsLoaded = workspaceSlug ? flags[workspaceSlug] !== undefined : false;
  const isReleasesAccessible = isFeatureFlagEnabled && isReleasesEnabled;

  if (hasWorkspaceFeaturesLoaded && hasFeatureFlagsLoaded && !isReleasesAccessible) {
    return <Navigate to={`/${workspaceSlug}`} replace />;
  }

  return (
    <WorkspaceAccessWrapper pageKey="releases">
      <AppHeader header={isDetailPage ? <ReleaseDetailBreadcrumbHeader /> : <WorkspaceReleaseHeader />} />
      <Outlet />
    </WorkspaceAccessWrapper>
  );
}

export default observer(ReleasesLayout);
