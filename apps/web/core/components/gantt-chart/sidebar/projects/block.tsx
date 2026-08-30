/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { IUserLite } from "@plane/types";
import { Avatar, Row } from "@plane/ui";
import { cn, getFileURL } from "@plane/utils";
// components
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { getProjectProgressPercentage } from "@/components/program-timeline/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
// helpers
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

type Props = {
  blockId: string;
  isDragging: boolean;
};

export const ProjectsSidebarBlock = observer(function ProjectsSidebarBlock(props: Props) {
  const { blockId, isDragging } = props;
  const { workspaceSlug } = useParams();
  // store hooks
  const { getBlockById, updateActiveBlockId, isBlockActive, getNumberOfDaysFromPosition } = useTimeLineChartStore();
  const { getProjectById, getProjectAnalyticsCountById } = useProject();
  const { getUserDetails } = useMember();

  const block = getBlockById(blockId);
  if (!block) return <></>;

  const project = getProjectById(blockId);
  const analytics = getProjectAnalyticsCountById(blockId);
  const progressPercentage = getProjectProgressPercentage(analytics);

  const hasSchedule = !!block.start_date || !!block.target_date;
  const isBlockComplete = !!block.start_date && !!block.target_date;
  const duration = isBlockComplete ? getNumberOfDaysFromPosition(block?.position?.width) : undefined;

  const leadId = (project?.project_lead as IUserLite)?.id ?? (project?.project_lead as string | undefined);
  const lead = leadId ? getUserDetails(leadId) : undefined;

  return (
    <div
      className={cn({
        "rounded-sm bg-layer-1": isDragging,
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
    >
      <Row
        id={`sidebar-block-${block.id}`}
        className={cn(
          "group flex w-full items-center gap-2 bg-layer-transparent pr-4 hover:bg-layer-transparent-hover",
          {
            "bg-transparent-hover": isBlockActive(block.id),
          }
        )}
        style={{
          height: `${BLOCK_HEIGHT}px`,
        }}
      >
        <Link
          className="flex h-full flex-grow items-center gap-2 truncate"
          href={`/${workspaceSlug}/projects/${blockId}/issues`}
          draggable={false}
        >
          <span className="grid flex-shrink-0 place-items-center">
            <Logo logo={project?.logo_props} size={14} />
          </span>
          <h6 className="flex-grow truncate text-13 font-medium">{project?.name}</h6>
        </Link>
        <div className="flex flex-shrink-0 items-center gap-2">
          {lead && <Avatar name={lead.display_name} src={getFileURL(lead.avatar_url)} size="sm" />}
          <span className="w-9 flex-shrink-0 text-right text-13 text-secondary">{progressPercentage}%</span>
          <span className="w-20 flex-shrink-0 text-right text-13 text-secondary">
            {hasSchedule
              ? duration !== undefined
                ? `${duration} day${duration > 1 ? "s" : ""}`
                : "Open-ended"
              : "No schedule"}
          </span>
        </div>
      </Row>
    </div>
  );
});
