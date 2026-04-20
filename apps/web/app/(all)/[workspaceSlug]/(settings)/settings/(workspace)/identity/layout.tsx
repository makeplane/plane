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

// plane imports
import { Outlet } from "react-router";
// component
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WithFeatureFlagHOC } from "@/components/feature-flags/with-feature-flag-hoc";
import { IdentityUpgrade } from "@/components/workspace/settings/identity/upgrade";
import { useDomains } from "@/plane-web/hooks/sso/use-domains";
import { useProviders } from "@/plane-web/hooks/sso/use-providers";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { IdentityWorkspaceSettingsHeader } from "./header";
// types
import type { Route } from "./+types/layout";

function IdentityLayout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Identity` : undefined;
  // fetch domains and providers
  useDomains(workspaceSlug);
  useProviders(workspaceSlug);

  return (
    <SettingsContentWrapper header={<IdentityWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <WithFeatureFlagHOC flag="CLOUD_SSO" fallback={<IdentityUpgrade />} workspaceSlug={workspaceSlug}>
        <Outlet />
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
}

export default IdentityLayout;
