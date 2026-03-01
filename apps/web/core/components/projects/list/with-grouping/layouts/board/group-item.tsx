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
import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { observer } from "mobx-react";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useProjectFilter, useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import type { TProject } from "@/types/projects";
// local imports
import { GroupDragOverlay } from "./group-drag-overlay";
import { ProjectBoardGroupItemHeader } from "./group-item-header";
import { ProjectBoardList } from "./list";
import { groupDetails, highlightProjectOnDrop } from "./utils";

type ProjectBoardGroupItem = {
  groupByKey: string;
  projectIds: string[];
  verticalAlign: { [key: string]: boolean };
  setVerticalAlign: (
    value: (state: { [key: string]: boolean }) => {
      [key: string]: boolean;
    }
  ) => void;
  dropErrorMessage?: string;
};

export const ProjectBoardGroupItem = observer(function ProjectBoardGroupItem(props: ProjectBoardGroupItem) {
  const { groupByKey, projectIds, verticalAlign, setVerticalAlign, dropErrorMessage = "" } = props;
  const [isDraggingOverColumn, setIsDraggingOverColumn] = useState(false);
  const columnRef = useRef<HTMLDivElement | null>(null);
  const { currentWorkspace } = useWorkspace();
  const { getProjectStateById, getProjectStatedByStateGroupKey } = useWorkspaceProjectStates();
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();
  const { filters } = useProjectFilter();
  const { updateProject } = useProject();

  const selectedGroupKey = filters?.display_filters?.group_by;

  const handleOnDrop = (sourceId: string, payload: Partial<TProject>) => {
    if (!currentWorkspace?.slug)
      return setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Workspace not found" });

    updateProject(currentWorkspace?.slug, sourceId, payload);
    highlightProjectOnDrop(`kanban-${sourceId}`, true);
  };

  // Enable Kanban Columns as Drop Targets
  useEffect(() => {
    const element = columnRef.current;
    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ groupByKey, type: "COLUMN" }),
        onDragEnter: () => {
          setIsDraggingOverColumn(true);
        },
        onDragLeave: () => {
          setIsDraggingOverColumn(false);
        },
        onDragStart: () => {
          setIsDraggingOverColumn(true);
        },
        onDrop: (payload) => {
          setIsDraggingOverColumn(false);
          console.log("payload", payload);
          if (!payload.source) return;
          const sourceId = payload.source.data.id;
          const details = groupDetails(
            getProjectStateById,
            getProjectStatedByStateGroupKey,
            getWorkspaceMemberDetails,
            groupByKey,
            currentWorkspace,
            selectedGroupKey
          );
          handleOnDrop(sourceId as string, details?.prePopulatedPayload);
        },
      }),
      autoScrollForElements({
        element,
      })
    );
  }, [columnRef, groupByKey, setIsDraggingOverColumn, dropErrorMessage, handleOnDrop]);
  return (
    <div className="h-full relative flex flex-col overflow-hidden space-y-2" ref={columnRef}>
      <GroupDragOverlay
        dragColumnOrientation={"justify-center"}
        canOverlayBeVisible
        isDropDisabled={false}
        dropErrorMessage={dropErrorMessage}
        // orderBy={orderBy}
        isDraggingOverColumn={isDraggingOverColumn}
      />
      <div className="h-full rounded-md relative flex flex-col overflow-hidden bg-layer-1 p-2">
        {/* header */}
        <ProjectBoardGroupItemHeader
          groupByKey={groupByKey}
          projectIds={projectIds}
          verticalAlign={verticalAlign[`${groupByKey}`] || false}
          setVerticalAlign={setVerticalAlign}
        />
        {/* projects placeholder */}
        {!verticalAlign[groupByKey] && projectIds.length > 0 && (
          <ProjectBoardList groupByKey={groupByKey} projectIds={projectIds} />
        )}
      </div>
    </div>
  );
});
