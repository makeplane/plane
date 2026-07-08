/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useNavigate } from "react-router";
// i18n
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { ProjectEpicsLayoutRoot } from "@/components/issues/issue-layouts/roots/project-epics-layout-root";
// hooks
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

function ProjectEpicsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  // i18n
  const { t } = useTranslation();
  // navigation
  const navigate = useNavigate();
  // store
  const { getProjectById } = useProject();

  // derived values
  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project?.name} - ${t("epic.label", { count: 2 })}` : undefined; // Count is for pluralization
  // Epics only exist once work item types are enabled (the epic type is seeded then).
  // Guard direct navigation to /epics on a project without them (project is loaded by
  // the auth wrapper before this renders, so `false` is a confirmed-disabled state).
  const isEpicsEnabled = project ? Boolean(project.is_issue_type_enabled) : undefined;

  useEffect(() => {
    if (isEpicsEnabled === false) {
      navigate(`/${workspaceSlug}/projects/${projectId}/issues/`, { replace: true });
    }
  }, [isEpicsEnabled, navigate, workspaceSlug, projectId]);

  if (!isEpicsEnabled) return null;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="h-full w-full">
        <ProjectEpicsLayoutRoot />
      </div>
    </>
  );
}

export default observer(ProjectEpicsPage);
