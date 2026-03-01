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
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { GANTT_TIMELINE_TYPE } from "@plane/types";
import type { TTimelineType } from "@plane/types";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
// local imports
import { MilestoneIndicator } from "./indicator";

type Props = {
  blockCount: number;
  timelineType: TTimelineType;
};

export const MilestoneIndicatorsRoot: FC<Props> = observer(function MilestoneIndicatorsRoot({
  blockCount,
  timelineType,
}) {
  const { projectId } = useParams();
  const { currentViewData } = useTimeLineChartStore();
  const { getProjectMilestoneIds, getMilestoneById } = useMilestones();

  if (!projectId || !currentViewData || timelineType !== GANTT_TIMELINE_TYPE.ISSUE) return null;

  const milestoneIds = getProjectMilestoneIds(projectId.toString());
  if (!milestoneIds || milestoneIds.length === 0) return null;

  return (
    <>
      {milestoneIds.map((milestoneId) => {
        const milestone = getMilestoneById(projectId.toString(), milestoneId);
        if (!milestone) return null;

        return (
          <MilestoneIndicator
            key={milestoneId}
            milestone={milestone}
            chartData={currentViewData}
            blockCount={blockCount}
          />
        );
      })}
    </>
  );
});
