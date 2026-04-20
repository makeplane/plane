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
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { AutomationDetailsMainContentRoot } from "@/components/automations/details/main-content/root";
import { AutomationDetailsSidebarRoot } from "@/components/automations/details/sidebar/root";
import { PageHead } from "@/components/core/page-title";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import type { Route } from "./+types/page";

function AutomationDetailsPage({ params }: Route.ComponentProps) {
  // params
  const { automationId } = params;
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const {
    workspaceAutomations: { getCanViewAutomation, getFetchStatusById },
  } = useAutomations();
  // derived values
  const canView = getCanViewAutomation(params.workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Automations` : undefined;
  const isLoaded = getFetchStatusById(automationId);

  if (!canView) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="size-full flex overflow-hidden bg-surface-2">
        <AutomationDetailsMainContentRoot automationId={automationId} isLoaded={isLoaded} />
        <AutomationDetailsSidebarRoot automationId={automationId} />
      </div>
    </>
  );
}

export default observer(AutomationDetailsPage);
