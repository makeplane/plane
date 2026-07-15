/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles } from "@plane/types";
// components
import { PageHead } from "@/components/core/page-title";
import { TimeReportRoot } from "@/components/time-reports";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import type { Route } from "./+types/page";

function ProjectReportsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();

  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project?.name} - Reports` : undefined;

  const canViewReports = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  if (!canViewReports) {
    return (
      <div className="flex h-full w-full items-center justify-center text-13 text-tertiary">
        {t("time_reports.errors.no_access")}
      </div>
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <TimeReportRoot workspaceSlug={workspaceSlug} projectId={projectId} />
    </>
  );
}

export default observer(ProjectReportsPage);
