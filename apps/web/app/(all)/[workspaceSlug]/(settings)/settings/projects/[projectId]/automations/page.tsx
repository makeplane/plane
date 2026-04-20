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
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProject } from "@plane/types";
import { DefaultAutomationRoot } from "@/components/automation";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { CustomAutomationsRoot } from "@/components/automations/root";
// local imports
import type { Route } from "./+types/page";
import { AutomationsProjectSettingsHeader } from "./header";
import { useProjectSettingsAccess } from "@/hooks/permissions/use-project-settings-access";

function AutomationSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // store hooks
  const { currentProjectDetails: projectDetails, updateProject } = useProject();
  const { t } = useTranslation();
  const { canAccessProjectSetting } = useProjectSettingsAccess();
  // derived values
  const canAccessAutomationSettings = canAccessProjectSetting(workspaceSlug, projectId, "automations");

  const handleChange = async (formData: Partial<IProject>) => {
    if (!projectDetails) return;

    try {
      await updateProject(workspaceSlug, projectId, formData);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong. Please try again.",
      });
    }
  };

  // derived values
  const pageTitle = projectDetails?.name ? `${projectDetails?.name} - Automations` : undefined;

  return (
    <SettingsContentWrapper header={<AutomationsProjectSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <section className={`w-full ${canAccessAutomationSettings ? "" : "opacity-60"}`}>
        <SettingsHeading
          title={t("project_settings.automations.heading")}
          description={t("project_settings.automations.description")}
        />
        <div className="mt-6">
          <DefaultAutomationRoot workspaceSlug={workspaceSlug} projectId={projectId} handleChange={handleChange} />
        </div>
      </section>
      {/* custom  */}
      <CustomAutomationsRoot projectId={projectId} workspaceSlug={workspaceSlug} />
    </SettingsContentWrapper>
  );
}

export default observer(AutomationSettingsPage);
