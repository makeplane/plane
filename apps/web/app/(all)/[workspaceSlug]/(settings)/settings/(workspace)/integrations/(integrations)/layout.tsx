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
import Link from "next/link";
import { Outlet } from "react-router";
import { ChevronLeftIcon } from "lucide-react";
import { SILO_BASE_URL, SILO_BASE_PATH, E_FEATURE_FLAGS } from "@plane/constants";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserProfile } from "@/hooks/store/user";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { IntegrationsEmptyState } from "@/components/integrations";
import type { Route } from "./+types/layout";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";

function IntegrationLayout({ params }: Route.ComponentProps) {
  // router params
  const { workspaceSlug } = params;

  // hooks
  const { currentWorkspace } = useWorkspace();
  const { data: currentUser } = useUser();
  const { data: currentUserProfile } = useUserProfile();

  // derived values
  const siloBaseUrl = encodeURI(SILO_BASE_URL + SILO_BASE_PATH) || undefined;
  const workspaceId = currentWorkspace?.id || undefined;
  const userId = currentUser?.id || undefined;

  // check if workspace exists
  if (!workspaceId || !userId || !siloBaseUrl) return null;

  return (
    <WithFeatureFlagHOC
      flag={E_FEATURE_FLAGS.SILO_INTEGRATIONS}
      workspaceSlug={workspaceSlug}
      fallback={<IntegrationsEmptyState theme={currentUserProfile?.theme.theme || "light"} />}
    >
      <SettingsContentWrapper header={null}>
        <div className="w-full h-full">
          <Link
            href={`/${workspaceSlug}/settings/integrations`}
            className="flex items-center gap-2 text-body-xs-semibold text-tertiary mb-6"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to integrations
          </Link>
          <div className="w-full h-full">
            <Outlet />
          </div>
        </div>
      </SettingsContentWrapper>
    </WithFeatureFlagHOC>
  );
}

export default observer(IntegrationLayout);
