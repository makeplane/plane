/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// ui
import type { IBlockUpdateData } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { GanttDnDHOC } from "../gantt-dnd-HOC";
import { ProjectsSidebarBlock } from "./block";

type Props = {
  title: string;
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blockIds: string[];
  enableReorder: boolean;
};

export const ProjectGanttSidebar = observer(function ProjectGanttSidebar(props: Props) {
  const { blockIds } = props;

  return (
    <div className="h-full">
      {blockIds ? (
        blockIds.map((blockId, index) => (
          <GanttDnDHOC
            key={blockId}
            id={blockId}
            isLastChild={index === blockIds.length - 1}
            isDragEnabled={false}
            onDrop={() => {}}
          >
            {(isDragging: boolean) => <ProjectsSidebarBlock blockId={blockId} isDragging={isDragging} />}
          </GanttDnDHOC>
        ))
      ) : (
        <Loader className="space-y-3 pr-2">
          <Loader.Item height="34px" />
          <Loader.Item height="34px" />
          <Loader.Item height="34px" />
          <Loader.Item height="34px" />
        </Loader>
      )}
    </div>
  );
});
