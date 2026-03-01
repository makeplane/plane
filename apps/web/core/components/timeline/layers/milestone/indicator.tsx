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
import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { MilestoneIcon } from "@plane/propel/icons";
import type { MilestoneInstance } from "@plane/shared-state";
import type { ChartDataType } from "@plane/types";
import { getMilestoneIconProps, getMilestoneLineColors } from "@plane/utils";
// components
import { BLOCK_HEIGHT, DEFAULT_BLOCK_WIDTH } from "@/components/timeline/constants";
import { getPositionFromDate } from "@/components/timeline/views";
// local imports
import { MilestoneTooltip } from "./tooltip";

const HOVER_WIDTH = BLOCK_HEIGHT / 2;

type Props = {
  milestone: MilestoneInstance;
  chartData: ChartDataType;
  blockCount: number;
};

export const MilestoneIndicator: FC<Props> = observer(function MilestoneIndicator({
  milestone,
  chartData,
  blockCount,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [mouseY, setMouseY] = useState(0);

  if (!milestone.target_date) return null;

  const position = getPositionFromDate(chartData, milestone.target_date, DEFAULT_BLOCK_WIDTH);
  const { base: baseColor, hover: hoverColor } = getMilestoneLineColors(milestone.progress_percentage);
  const milestoneIconProps = getMilestoneIconProps(milestone.progress_percentage);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseY(e.clientY - rect.top);
  };

  // Center the hover area on the milestone date position
  const containerLeft = position - HOVER_WIDTH / 2;
  // Calculate total height based on number of blocks
  const totalHeight = blockCount * BLOCK_HEIGHT;

  return (
    <>
      {/* Hover area container - full block width for easy hover */}
      <div
        className="absolute top-0 cursor-pointer"
        style={{
          left: `${containerLeft}px`,
          width: `${HOVER_WIDTH}px`,
          height: `${totalHeight}px`,
          zIndex: isHovered ? 10 : 5,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        {/* Centered dashed line with custom dash length using SVG */}
        <svg
          className="absolute top-0 transition-all duration-200 ease-in-out"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            width: "2px",
            height: `${totalHeight}px`,
          }}
          preserveAspectRatio="none"
        >
          <line
            x1="1"
            y1="0"
            x2="1"
            y2={totalHeight}
            stroke={isHovered ? hoverColor : baseColor}
            strokeWidth="1"
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      {/* Milestone icon on the line at cursor position */}
      {isHovered && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${position}px`,
            top: `${mouseY}px`,
            transform: "translate(-50%, -50%)",
            zIndex: 100,
          }}
        >
          <MilestoneIcon {...milestoneIconProps} className="size-5" isSolid />
        </div>
      )}
      {/* Tooltip rendered outside hover container with independent z-index */}
      {isHovered && (
        <div
          className="absolute top-0 pointer-events-none m-2"
          style={{
            left: `${position}px`,
            zIndex: 100,
          }}
        >
          <MilestoneTooltip
            title={milestone.title}
            workItemsCount={milestone.progress.total_items}
            progress={milestone.progress_percentage}
            mouseY={mouseY}
          />
        </div>
      )}
    </>
  );
});
