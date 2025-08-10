"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
// component
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
import { PageHead } from "@/components/core";
// store hooks
import { SettingsHeading } from "@/components/settings";
import { useProject, useUserPermissions } from "@/hooks/store";
// plane web components
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { CreateRecurringWorkItemsButton } from "@/plane-web/components/recurring-work-items/settings/create-button";
import { RecurringWorkItemsSettingsRoot } from "@/plane-web/components/recurring-work-items/settings/root";
import { RecurringWorkItemsUpgrade } from "@/plane-web/components/recurring-work-items/settings/upgrade";
import { useRecurringWorkItems } from "@/plane-web/hooks/store/recurring-work-items/use-recurring-work-items";
import { useFlag } from "@/plane-web/hooks/store/use-flag";

const RecurringWorkItemsProjectSettingsPage = observer(() => {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const projectId = routerProjectId?.toString();
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
    <>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("project_settings.recurring_work_items.heading")}
        description={t("project_settings.recurring_work_items.description")}
        showButton={isRecurringWorkItemsEnabled && isRecurringWorkItemsAvailableForProject && hasAdminPermission}
        customButton={
          <CreateRecurringWorkItemsButton workspaceSlug={workspaceSlug} projectId={projectId} buttonSize="sm" />
        }
      />
      <WithFeatureFlagHOC
        flag="RECURRING_WORKITEMS"
        fallback={<RecurringWorkItemsUpgrade />}
        workspaceSlug={workspaceSlug}
      >
        <div className="flex flex-col gap-10 py-6 w-full">
          <RecurringWorkItemsSettingsRoot projectId={projectId} workspaceSlug={workspaceSlug} />
        </div>
      </WithFeatureFlagHOC>
    </>
  );
});

export default RecurringWorkItemsProjectSettingsPage;
