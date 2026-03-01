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
// components
import { PageHead } from "@/components/core/page-title";
import { ArchivedEpicsHeader } from "@/components/epics/archived-epics-header";
import { ArchivedEpicLayoutRoot } from "@/components/epics/epic-layouts/roots/archived-epic-layout-root";
// hooks
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

const ProjectArchivedEpicsPage = observer(function ProjectArchivedEpicsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project.name} - Archived epics` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <ArchivedEpicsHeader workspaceSlug={workspaceSlug} projectId={projectId} />
        <ArchivedEpicLayoutRoot workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>
    </>
  );
});

export default ProjectArchivedEpicsPage;
