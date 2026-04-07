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
  TimelineTimestamp,
} from "@plane/blocks/activity";
import { FieldIcon, ActivityMessage, formatFieldValue, resolveActorInfo, DurationBadge } from "./helpers";
import { PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import type { TIssuePriorities } from "@plane/propel/icons";
import { cn, calculateTimeAgo } from "@plane/utils";
// hooks
import { useActivityHighlight } from "@/hooks/use-activity-highlight";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectState } from "@/hooks/store/use-project-state";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { EIconSize } from "@plane/constants";

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
  const { getStateById } = useProjectState();
  const { highlightRef, isHighlighted } = useActivityHighlight(activityId);

  const activity = getActivityById(activityId);

  if (!activity) return null;

  const isStateTransition = activity.field === "state";
  const durationSeconds = isStateTransition ? getStateDurationByActivityId(activityId) : undefined;
  const oldBadge = <DurationBadge seconds={durationSeconds} stateName={activity.old_value ?? undefined} />;

  // For state transitions, use actual state icons with colors
  const oldState = isStateTransition && activity.old_identifier ? getStateById(activity.old_identifier) : undefined;
  const newState = isStateTransition && activity.new_identifier ? getStateById(activity.new_identifier) : undefined;

  // Don't show live duration badge for terminal states (completed/cancelled)
  const isTerminalState = newState?.group === "completed" || newState?.group === "cancelled";
  const newBadge =
    isLast && isStateTransition && !isTerminalState ? (
      <DurationBadge
        seconds={(Date.now() - new Date(activity.created_at).getTime()) / 1000}
        stateName={activity.new_value ?? undefined}
      />
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
  const oldStateIcon = oldState ? (
    <StateGroupIcon stateGroup={oldState.group} color={oldState.color} size={EIconSize.MD} />
  ) : undefined;
  const newStateIcon = newState ? (
    <StateGroupIcon stateGroup={newState.group} color={newState.color} size={EIconSize.MD} />
  ) : undefined;

  // For priority transitions, use PriorityIcon with correct colors
  const isPriorityTransition = activity.field === "priority";
  const oldPriorityIcon =
    isPriorityTransition && activity.old_value ? (
      <PriorityIcon priority={activity.old_value as TIssuePriorities} size={14} />
    ) : undefined;
  const newPriorityIcon =
    isPriorityTransition && activity.new_value ? (
      <PriorityIcon priority={activity.new_value as TIssuePriorities} size={14} />
    ) : undefined;

  const { oldValue, newValue } = mapActivityToPropertyValues(
    formattedOld,
    formattedNew,
    icon,
    oldBadge,
    newBadge,
    oldStateIcon ?? oldPriorityIcon,
    newStateIcon ?? newPriorityIcon
  );
  const showConnector = ends !== "bottom" && !isLast;

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
        "relative flex flex-col gap-2 rounded-lg border border-transparent",
        ends !== "bottom" && "pb-6",
        isHighlighted && "animate-highlight-fade"
      )}
    >
      {/* Continuous connector line behind both TimelineItem and TransitionRow */}
      {showConnector && <TimelineConnectorLine />}

      <TimelineItem
        icon={icon}
        showConnector={ends !== "bottom"}
        connectorHeight="md"
        className="text-caption-sm-regular pb-0"
      >
        <span className="flex items-center gap-1.5 w-full truncate text-secondary text-body-xs-medium">
          {actorDisplay}
          <span className="truncate text-body-xs-regular text-secondary"> {message} </span>
          {activity.created_at && <TimelineTimestamp timestamp={calculateTimeAgo(activity.created_at)} />}
        </span>
      </TimelineItem>

      <TransitionRow oldValue={oldValue} newValue={newValue} showConnector={showConnector} />
    </div>
  );
});
