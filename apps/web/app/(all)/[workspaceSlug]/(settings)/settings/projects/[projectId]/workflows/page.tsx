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
// components
import { PageHead } from "@/components/core/page-title";
// hook
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { WorkflowUpgrade } from "@/components/workflows";
// local imports
import type { Route } from "./+types/page";
import { WorkflowsProjectSettingsHeader } from "./header";
import { WorkflowsRoot } from "@/components/workflows/root";
import { useWorkspace } from "@/hooks/store/use-workspace";

function WorkflowsSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // plane hooks
  const { t } = useTranslation();
  const { currentProjectDetails } = useProject();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails?.name} - ${t("common.workflows")}`
    : undefined;

  if (!currentWorkspace) return <></>;
  return (
    <SettingsContentWrapper header={<WorkflowsProjectSettingsHeader />}>
      <div className="w-full h-full flex flex-col">
        <PageHead title={pageTitle} />
        <SettingsHeading
          title={t("project_settings.workflows.heading")}
          description={t("project_settings.workflows.description")}
        />
        <div className="flex-1 mt-6">
          <WithFeatureFlagHOC flag="WORKFLOWS" fallback={<WorkflowUpgrade />} workspaceSlug={workspaceSlug}>
            <WorkflowsRoot workspaceSlug={workspaceSlug} projectId={projectId} />
          </WithFeatureFlagHOC>
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(WorkflowsSettingsPage);
