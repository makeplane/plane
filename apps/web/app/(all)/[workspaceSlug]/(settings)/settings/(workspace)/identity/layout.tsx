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
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
// component
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { WithFeatureFlagHOC } from "@/components/feature-flags/with-feature-flag-hoc";
import { IdentityUpgrade } from "@/components/workspace/settings/identity/upgrade";
import { useDomains } from "@/plane-web/hooks/sso/use-domains";
import { useProviders } from "@/plane-web/hooks/sso/use-providers";
// types
import type { Route } from "./+types/layout";
import { IdentityWorkspaceSettingsHeader } from "./header";

function IdentityLayout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Identity` : undefined;
  const hasWorkspaceAdminPermission = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug
  );
  // fetch domains and providers
  useDomains(workspaceSlug);
  useProviders(workspaceSlug);

  if (!hasWorkspaceAdminPermission) return <NotAuthorizedView section="settings" className="h-auto" />;

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
