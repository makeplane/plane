"use client";

import { FC, useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, EUserProjectRoles } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/ui";
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
// plane web components
import { ProjectCard } from "@/plane-web/components/projects/layouts/gallery/card";

type ProjectBoardListItem = {
  groupByKey: string;
  projectId: string;
};

export const ProjectBoardListItem: FC<ProjectBoardListItem> = observer((props) => {
  const { projectId } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const project = getProjectById(projectId);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isDragAllowed = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    projectId
  );
  if (!project) return <></>;

  useEffect(() => {
    const element = cardRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        dragHandle: element,
        canDrag: () => isDragAllowed,
        getInitialData: () => ({ id: project.id, type: "PROJECT" }),
      })
    );
  }, [cardRef?.current, project, isDragAllowed]);
  return (
    <div
      className="flex whitespace-nowrap gap-2 rounded w-full"
      ref={cardRef}
      id={`kanban-${project.id}`}
      onDragStart={() => {
        if (!isDragAllowed) {
          setToast({
            title: "Warning!",
            type: TOAST_TYPE.ERROR,
            message: "You don't have permission to move this project",
          });
        }
      }}
    >
      <ProjectCard project={project} />
    </div>
  );
});
