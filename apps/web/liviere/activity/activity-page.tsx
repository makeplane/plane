/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: content of the route /:workspaceSlug/projects/:projectId/activity.

import { observer } from "mobx-react";
import Link from "next/link";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core/page-title";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { ProjectActivityRoot } from "./activity-root";
import { useActivitySettings } from "./use-activity";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectActivityPage = observer(function ProjectActivityPage(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { data: settings } = useActivitySettings(workspaceSlug, projectId);
  const project = getProjectById(projectId);
  const canRead = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT);
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
  const pageTitle = project?.name ? `${project.name} - ${t("liviere.activity.title")}` : undefined;

  if (settings && (!settings.enabled || !canRead)) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
        <PageHead title={pageTitle} />
        <h2 className="text-16 font-medium text-primary">{t("liviere.activity.disabled.title")}</h2>
        <p className="max-w-md text-13 text-tertiary">
          {canRead ? t("liviere.activity.disabled.description") : t("liviere.activity.disabled.no_access")}
        </p>
        {isAdmin && (
          <Link
            href={`/${workspaceSlug}/settings/projects/${projectId}/features/activity`}
            className="mt-2 text-13 text-accent-primary hover:underline"
          >
            {t("liviere.activity.disabled.open_settings")}
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHead title={pageTitle} />
      {settings && <ProjectActivityRoot workspaceSlug={workspaceSlug} projectId={projectId} />}
    </>
  );
});
