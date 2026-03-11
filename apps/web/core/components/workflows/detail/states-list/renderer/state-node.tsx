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

import { EIconSize } from "@plane/constants";
import { StateGroupIcon } from "@plane/propel/icons";
import type { TWorkflowRendererNode } from "./types";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Props = {
  node: TWorkflowRendererNode;
  setNodeRef: (stateId: string, element: HTMLDivElement | null) => void;
};

export const WorkflowRendererStateNode = ({ node, setNodeRef }: Props) => (
  <NodeContent node={node} setNodeRef={setNodeRef} />
);

const NodeContent = ({ node, setNodeRef }: Props) => {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [isLabelOverflowing, setIsLabelOverflowing] = useState(false);

  useLayoutEffect(() => {
    const label = labelRef.current;
    if (!label) return;
    setIsLabelOverflowing(label.scrollWidth > label.clientWidth);
  }, [node.name]);

  useEffect(() => {
    const handleResize = () => {
      const label = labelRef.current;
      if (!label) return;
      setIsLabelOverflowing(label.scrollWidth > label.clientWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div ref={(element) => setNodeRef(node.id, element)} className="w-30">
      <Tooltip tooltipContent={node.name} disabled={!isLabelOverflowing}>
        <div>
          <Button variant="secondary" className="w-full justify-start truncate">
            <StateGroupIcon stateGroup={node.group} color={node.color} size={EIconSize.MD} percentage={node.order} />
            <span ref={labelRef} className="truncate text-caption-sm-medium text-primary">
              {node.name}
            </span>
          </Button>
        </div>
      </Tooltip>
    </div>
  );
};
