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

import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
// plane imports
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { useProjectFilter } from "@/plane-web/hooks/store";
// plane web components
import { ProjectCard } from "@/components/projects/list/with-grouping/layouts/gallery/card";
import type { ProjectItemPermissions } from "@/store/project/permissions/root";

type ProjectBoardListItem = {
  groupByKey: string;
  projectId: string;
  permissions: ProjectItemPermissions;
  workspaceSlug: string;
};

export const ProjectBoardListItem = observer(function ProjectBoardListItem(props: ProjectBoardListItem) {
  const { projectId, permissions, workspaceSlug } = props;
  // hooks
  const { getProjectById } = useProject();
  const { filters } = useProjectFilter();
  // derived values
  const selectedGroupKey = filters?.display_filters?.group_by;
  const project = getProjectById(projectId);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const canDragAndDrop = permissions.canDragAndDrop;

  useEffect(() => {
    const element = cardRef.current;

    if (!element) return;
    if (!project) return;

    return combine(
      draggable({
        element,
        dragHandle: element,
        canDrag: () => canDragAndDrop && selectedGroupKey !== "labels",
        getInitialData: () => ({ id: project.id, type: "PROJECT" }),
      })
    );
  }, [project, canDragAndDrop, selectedGroupKey]);

  if (!project) return <></>;

  return (
    <div
      className="flex whitespace-nowrap gap-2 rounded-sm w-full"
      ref={cardRef}
      id={`kanban-${project.id}`}
      onDragStart={() => {
        if (selectedGroupKey === "labels") {
          setToast({
            title: "Warning!",
            type: TOAST_TYPE.WARNING,
            message: "Cannot move projects when grouped by labels",
          });
        } else if (!canDragAndDrop) {
          setToast({
            title: "Warning!",
            type: TOAST_TYPE.ERROR,
            message: "You don't have permission to move this project",
          });
        }
      }}
    >
      <ProjectCard project={project} permissions={permissions} workspaceSlug={workspaceSlug} />
    </div>
  );
});
