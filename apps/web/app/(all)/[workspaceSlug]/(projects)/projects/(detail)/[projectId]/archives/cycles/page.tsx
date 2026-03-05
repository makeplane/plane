/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core/page-title";
import { ArchivedCycleLayoutRoot } from "@/components/cycles/archived-cycles";
import { ArchivedCyclesHeader } from "@/components/cycles/archived-cycles/header";
// hooks
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

function ProjectArchivedCyclesPage({ params }: Route.ComponentProps) {
  // router
  const { projectId } = params;
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = getProjectById(projectId);
  const pageTitle = project?.name && `${project?.name} - Archived cycles`;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <ArchivedCyclesHeader />
        <ArchivedCycleLayoutRoot />
      </div>
    </>
  );
}

export default observer(ProjectArchivedCyclesPage);
