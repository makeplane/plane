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
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
// plane web components
import { AutomationDetailsMainContentRoot } from "@/components/automations/details/main-content/root";
import { AutomationDetailsSidebarRoot } from "@/components/automations/details/sidebar/root";
import type { Route } from "./+types/page";

function AutomationDetailsPage({ params }: Route.ComponentProps) {
  // params
  const { automationId } = params;
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails: projectDetails } = useProject();
  // derived values
  const pageTitle = projectDetails?.name ? `${projectDetails?.name} - Automations` : undefined;
  const hasProjectAdminPermissions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (workspaceUserInfo && !hasProjectAdminPermissions) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="size-full flex overflow-hidden bg-surface-2">
        <AutomationDetailsMainContentRoot automationId={automationId} />
        <AutomationDetailsSidebarRoot automationId={automationId} />
      </div>
    </>
  );
}

export default observer(AutomationDetailsPage);
