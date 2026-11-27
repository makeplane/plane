/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: content of the route /:workspaceSlug/projects/:projectId/decisions. Lets in project
// admins and members of a project with the register turned on; everyone else gets a plain state page.

import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/blocks/skeleton";
import { PageHead } from "@/components/core/page-title";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { ProjectDecisionsRoot } from "./decisions-root";
import { DecisionsUnavailable, unavailableReason } from "./decisions-unavailable";
import { useDecisionSettings } from "./use-decisions";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectDecisionsPage = observer(function ProjectDecisionsPage(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const { allowPermissions, getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const roleLoaded = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId) !== undefined;
  const canRead = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);
  // Guests are not asked for: the API refuses them anyway (403)
  const { data: settings, error, mutate } = useDecisionSettings(workspaceSlug, projectId, canRead);
  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project.name} - ${t("liviere.decisions.title")}` : undefined;

  let content;
  if (!roleLoaded || (canRead && !settings && !error)) {
    content = (
      <Loader className="flex flex-col gap-3 px-6 py-5">
        <Loader.Item height="36px" width="100%" />
        <Loader.Item height="320px" width="100%" />
      </Loader>
    );
  } else if (!canRead) {
    content = <DecisionsUnavailable {...props} reason="no_access" isAdmin={false} />;
  } else if (error) {
    content = (
      <DecisionsUnavailable
        {...props}
        reason={unavailableReason(error) ?? "error"}
        isAdmin={isAdmin}
        onRetry={() => void mutate()}
      />
    );
  } else if (!settings?.enabled) {
    content = <DecisionsUnavailable {...props} reason="disabled" isAdmin={isAdmin} />;
  } else {
    content = <ProjectDecisionsRoot workspaceSlug={workspaceSlug} projectId={projectId} isAdmin={isAdmin} />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      {content}
    </>
  );
});
