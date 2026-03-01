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

import type { FC } from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { Loader } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useFlag } from "@/plane-web/hooks/store";
// plane web
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
// local components
import { UpgradeUpdates } from "./update-upgrade";
import { ProjectUpdates } from "./updates/root";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewSidebarUpdatesRoot = observer(function ProjectOverviewSidebarUpdatesRoot(props: Props) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { getProjectFeatures } = useProjectAdvanced();
  // derived values
  const project = getProjectById(projectId);
  const projectFeatures = getProjectFeatures(projectId);

  if (!project) return <></>;

  const isProjectUpdatesEnabled =
    projectFeatures &&
    projectFeatures.is_project_updates_enabled &&
    useFlag(workspaceSlug.toString(), "PROJECT_UPDATES");

  return (
    <>
      {isEmpty(projectFeatures) ? (
        <Loader className="flex flex-col gap-4 py-4">
          <Loader.Item height="125px" width="100%" />
          <Loader.Item height="125px" width="100%" />
          <Loader.Item height="125px" width="100%" />
        </Loader>
      ) : !isProjectUpdatesEnabled ? (
        <UpgradeUpdates workspaceSlug={workspaceSlug.toString()} projectId={project.id} />
      ) : (
        <div className="flex flex-col gap-3 h-full w-full px-6 pb-6 overflow-y-auto">
          <ProjectUpdates />
        </div>
      )}
    </>
  );
});
