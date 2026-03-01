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

// component
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
// hooks
import { EmailSettingsLoader } from "@/components/ui/loader/settings/email";
import { APPLICATION_DETAILS } from "@/constants/fetch-keys";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { ApplicationInstallationDetails } from "@/components/marketplace/applications";
import { useApplications } from "@/plane-web/hooks/store";
import type { Route } from "./+types/page";

function ApplicationInstallPage({ params }: Route.ComponentProps) {
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { appSlug } = params;
  const { getApplicationBySlug, fetchApplication } = useApplications();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Install Application` : undefined;

  const application = getApplicationBySlug(appSlug);
  const { data, isLoading } = useSWR(APPLICATION_DETAILS(appSlug), () => fetchApplication(appSlug));

  if (!data || !application || isLoading) {
    return <EmailSettingsLoader />;
  }

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <ApplicationInstallationDetails app={application} />
    </>
  );
}

export default observer(ApplicationInstallPage);
