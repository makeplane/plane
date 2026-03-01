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
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { ProjectSettingsFeatureControlItem } from "@/components/settings/project/content/feature-control-item";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { IntakeFeatureChildren } from "@/components/projects/settings/intake/feature-children";
// local imports
import type { Route } from "./+types/page";
import { FeaturesIntakeProjectSettingsHeader } from "./header";

function FeaturesIntakeSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();
  // translation
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails?.name} settings - ${t("project_settings.features.intake.short_title")}`
    : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<FeaturesIntakeProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <section className="w-full">
        <SettingsHeading
          title={t("project_settings.features.intake.title")}
          description={t("project_settings.features.intake.description")}
        />
        <div className="mt-7">
          <ProjectSettingsFeatureControlItem
            title={t("project_settings.features.intake.toggle_title")}
            description={t("project_settings.features.intake.toggle_description")}
            featureProperty="inbox_view"
            projectId={projectId}
            value={!!currentProjectDetails?.inbox_view}
            workspaceSlug={workspaceSlug}
          />
        </div>
        {currentProjectDetails && (
          <div
            className={cn("mt-12", {
              "opacity-60 pointer-events-none select-none": !currentProjectDetails?.inbox_view,
            })}
          >
            <IntakeFeatureChildren currentProjectDetails={currentProjectDetails} workspaceSlug={workspaceSlug} />
          </div>
        )}
      </section>
    </SettingsContentWrapper>
  );
}

export default observer(FeaturesIntakeSettingsPage);
