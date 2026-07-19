/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EUserProjectRoles } from "@plane/types";
// components
import { PageHead } from "@/components/core/page-title";
import { MilestonesSection } from "@/components/milestones";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import type { Route } from "./+types/page";

function ProjectMilestonesPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  // router
  const router = useAppRouter();
  // store hooks
  const { getProjectById, currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project?.name} - ${t("milestones")}` : undefined;
  const hasAdminLevelPermission = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);

  // milestones are disabled for the project
  if (currentProjectDetails && !currentProjectDetails.is_milestone_enabled)
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <h3 className="text-16 font-medium text-primary">{t("disabled_project.empty_state.milestone.title")}</h3>
        <p className="text-13 text-tertiary">{t("disabled_project.empty_state.milestone.description")}</p>
        {hasAdminLevelPermission && (
          <Button
            variant="primary"
            onClick={() => {
              router.push(`/${workspaceSlug}/settings/projects/${projectId}/features/milestones`);
            }}
          >
            {t("disabled_project.empty_state.milestone.primary_button.text")}
          </Button>
        )}
      </div>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full w-full overflow-y-auto px-6 py-4 md:px-9">
        <MilestonesSection workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>
    </>
  );
}

export default observer(ProjectMilestonesPage);
