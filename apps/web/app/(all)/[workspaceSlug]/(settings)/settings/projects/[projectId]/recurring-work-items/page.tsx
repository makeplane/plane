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
import { EUserPermissionsLevel } from "@plane/constants";
// component
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// store hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { CreateRecurringWorkItemsButton } from "@/components/recurring-work-items/settings/create-button";
import { RecurringWorkItemsSettingsRoot } from "@/components/recurring-work-items/settings/root";
import { RecurringWorkItemsUpgrade } from "@/components/recurring-work-items/settings/upgrade";
import { useRecurringWorkItems } from "@/plane-web/hooks/store/recurring-work-items/use-recurring-work-items";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// local imports
import type { Route } from "./+types/page";
import { RecurringWorkItemsProjectSettingsHeader } from "./header";

function RecurringWorkItemsProjectSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { getProjectById } = useProject();
  const { isAnyRecurringWorkItemsAvailableForProject } = useRecurringWorkItems();
  // derived values
  const isRecurringWorkItemsEnabled = useFlag(workspaceSlug, "RECURRING_WORKITEMS");
  const isRecurringWorkItemsAvailableForProject = isAnyRecurringWorkItemsAvailableForProject(workspaceSlug, projectId);
  const currentProjectDetails = getProjectById(projectId);
  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails.name} - ${t("common.recurring_work_items")}`
    : undefined;
  const hasAdminPermission = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  return (
    <SettingsContentWrapper header={<RecurringWorkItemsProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("recurring_work_items.settings.heading")}
        description={t("recurring_work_items.settings.description")}
        control={
          isRecurringWorkItemsEnabled &&
          isRecurringWorkItemsAvailableForProject &&
          hasAdminPermission && (
            <CreateRecurringWorkItemsButton workspaceSlug={workspaceSlug} projectId={projectId} buttonSize="base" />
          )
        }
      />
      <WithFeatureFlagHOC
        flag="RECURRING_WORKITEMS"
        fallback={<RecurringWorkItemsUpgrade />}
        workspaceSlug={workspaceSlug}
      >
        <div className="mt-6">
          <RecurringWorkItemsSettingsRoot projectId={projectId} workspaceSlug={workspaceSlug} />
        </div>
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
}

export default observer(RecurringWorkItemsProjectSettingsPage);
