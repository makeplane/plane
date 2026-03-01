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
import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EUserProjectRoles } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { ProjectCard } from "@/components/projects/list/with-grouping/layouts/gallery/card";

type ProjectBoardListItem = {
  groupByKey: string;
  projectId: string;
};

export const ProjectBoardListItem = observer(function ProjectBoardListItem(props: ProjectBoardListItem) {
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
      className="flex whitespace-nowrap gap-2 rounded-sm w-full"
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
