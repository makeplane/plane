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

import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import {
  TimelineItem,
  TransitionRow,
  mapActivityToPropertyValues,
  TimelineConnectorLine,
} from "@plane/blocks/activity";
import { FieldIcon, ActivityMessage, formatFieldValue, resolveActorInfo, DurationBadge } from "./helpers";
import { Tooltip } from "@plane/propel/tooltip";
import { cn, calculateTimeAgo, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useActivityHighlight } from "@/hooks/use-activity-highlight";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePlatformOS } from "@/hooks/use-platform-os";

type IssueActivityTransitionItemProps = {
  activityId: string;
  ends: "top" | "bottom" | undefined;
  isLast?: boolean;
};

export const IssueActivityTransitionItem = observer(function IssueActivityTransitionItem(
  props: IssueActivityTransitionItemProps
) {
  const { activityId, ends, isLast = false } = props;
  // hooks
  const {
    activity: { getActivityById, getStateDurationByActivityId },
  } = useIssueDetail();
  const { isMobile } = usePlatformOS();
  const { highlightRef, isHighlighted } = useActivityHighlight(activityId);

  const activity = getActivityById(activityId);

  if (!activity) return null;

  const isStateTransition = activity.field === "state";
  const durationSeconds = isStateTransition ? getStateDurationByActivityId(activityId) : undefined;
  const oldBadge = <DurationBadge seconds={durationSeconds} />;
  const newBadge =
    isLast && isStateTransition ? (
      <DurationBadge seconds={(Date.now() - new Date(activity.created_at).getTime()) / 1000} />
    ) : undefined;

  const icon = <FieldIcon field={activity.field ?? null} newValue={activity.new_value} />;
  const formattedOld = formatFieldValue(activity.field ?? null, activity.old_value);
  const formattedNew = formatFieldValue(activity.field ?? null, activity.new_value);
  const message = (
    <ActivityMessage
      field={activity.field ?? null}
      verb={activity.verb}
      oldValue={formattedOld}
      newValue={formattedNew}
    />
  );
  const actor = resolveActorInfo(activity);
  const { oldValue, newValue } = mapActivityToPropertyValues(formattedOld, formattedNew, icon, oldBadge, newBadge);
  const showConnector = ends !== "bottom";

  const actorDisplay = actor.url ? (
    <Link href={actor.url} className="hover:underline text-primary font-medium">
      {actor.name}
    </Link>
  ) : (
    <span className="text-primary font-medium">{actor.name}</span>
  );

  return (
    <div
      ref={highlightRef}
      className={cn(
        "relative flex flex-col gap-2 border border-transparent transition-border duration-1000",
        ends !== "bottom" && "pb-6",
        isHighlighted && "border-accent-strong"
      )}
    >
      {/* Continuous connector line behind both TimelineItem and TransitionRow */}
      {showConnector && <TimelineConnectorLine />}

      <TimelineItem icon={icon} showConnector={false} className="text-caption-sm-regular">
        <span className="flex gap-1.5 w-full truncate text-secondary">
          {actorDisplay}
          <span> {message} </span>
          <Tooltip
            isMobile={isMobile}
            tooltipContent={`${renderFormattedDate(activity.created_at)}, ${renderFormattedTime(activity.created_at)}`}
          >
            <span className="whitespace-nowrap text-tertiary">{calculateTimeAgo(activity.created_at)}</span>
          </Tooltip>
        </span>
      </TimelineItem>

      <TransitionRow oldValue={oldValue} newValue={newValue} />
    </div>
  );
});
