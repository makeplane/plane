"use client";

import { FC } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { Loader } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store";
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

export const ProjectOverviewSidebarUpdatesRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { features } = useProjectAdvanced();

  // derived values
  const project = getProjectById(projectId);

  if (!project) return <></>;

  const isProjectUpdatesEnabled =
    features &&
    features[project.id] &&
    features[project.id].is_project_updates_enabled &&
    useFlag(workspaceSlug.toString(), "PROJECT_UPDATES");

  return (
    <>
      {isEmpty(features[project.id]) ? (
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
