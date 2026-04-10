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
import { ArchivedProjectsHeader } from "@/components/archives/archived-projects-header";
import { ProjectsListRoot } from "@/components/projects/list/root";

import type { Route } from "./+types/page";

const ProjectsPage = observer(function ProjectsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <ArchivedProjectsHeader workspaceSlug={workspaceSlug} />
      <ProjectsListRoot workspaceSlug={workspaceSlug} isArchived />
    </div>
  );
});

export default ProjectsPage;
