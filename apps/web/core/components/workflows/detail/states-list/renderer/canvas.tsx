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

import { useRef } from "react";
import { WorkflowRendererLegend } from "./legend";
import { WorkflowRendererStateNode } from "./state-node";
import type { TWorkflowRendererGraph } from "./types";

type Props = {
  graph: TWorkflowRendererGraph;
};

export const WorkflowRendererCanvas = ({ graph }: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const setNodeRef = (stateId: string, element: HTMLDivElement | null) => {
    nodeRefs.current[stateId] = element;
  };

  return (
    <div className="p-6 pb-10">
      <div
        ref={scrollContainerRef}
        className="relative h-72 overflow-auto bg-layer-1 vertical-scrollbar scrollbar-xs rounded-lg"
      >
        <div className="sticky top-3 left-3 z-[3] ml-3 mt-3 w-fit">
          <WorkflowRendererLegend />
        </div>
        <div ref={contentRef} className="relative min-w-max p-8">
          <div className="relative z-[2] flex items-start gap-9">
            {graph.columns.map((column) => (
              <div key={column.id}>
                <div className="flex flex-col gap-4">
                  {column.nodes.map((node) => (
                    <WorkflowRendererStateNode key={node.id} node={node} setNodeRef={setNodeRef} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
