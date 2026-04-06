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

import { Badge } from "@plane/propel/badge";
import { Tooltip } from "@plane/propel/tooltip";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

export const ONE_DAY_SECONDS = 86400;

export function formatCompactDuration(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < ONE_DAY_SECONDS) return `${Math.floor(seconds / 3600)}h`;
  const d = Math.floor(seconds / ONE_DAY_SECONDS);
  if (d > 99) return "99+";
  return `${d}d`;
}

export function formatDetailedDuration(seconds: number, stateName?: string): string {
  const d = Math.floor(seconds / ONE_DAY_SECONDS);
  const h = Math.floor((seconds % ONE_DAY_SECONDS) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || parts.length === 0) parts.push(`${m}m`);
  if (stateName) return `In ${stateName} for ${parts.join(" ")}`;
  return parts.join(" ");
}

export function getDurationBadgeVariant(seconds: number): "neutral" | "warning" | "danger" | null {
  const days = Math.floor(seconds / ONE_DAY_SECONDS);
  if (days <= 2) return "neutral";
  if (days <= 6) return "warning";
  return "danger";
}

type DurationBadgeProps = {
  seconds: number | undefined | null;
  stateName?: string;
};

export function DurationBadge(props: DurationBadgeProps) {
  const { seconds, stateName } = props;
  if (seconds == null || seconds < 60) return null;
  const variant = getDurationBadgeVariant(seconds);
  if (!variant) return null;
  return (
    <Tooltip tooltipContent={formatDetailedDuration(seconds, stateName)}>
      <Badge size="sm" variant={variant} style={{ cursor: "default" }}>
        {formatCompactDuration(seconds)}
      </Badge>
    </Tooltip>
  );
}

export function useCurrentStateDuration(issueId: string): number | undefined {
  const {
    activity: { getActivitiesByIssueId, getActivityById },
    issue: { getIssueById },
  } = useIssueDetail();

  const activityIds = getActivitiesByIssueId(issueId);

  // Find the last state transition activity
  let lastStateChangeTime: string | undefined;
  if (activityIds?.length) {
    for (let i = activityIds.length - 1; i >= 0; i--) {
      const activity = getActivityById(activityIds[i]);
      if (activity?.field === "state") {
        lastStateChangeTime = activity.created_at;
        break;
      }
    }
  }

  // Fall back to issue creation time if no state transitions
  if (!lastStateChangeTime) {
    const issue = getIssueById(issueId);
    if (!issue?.created_at) return undefined;
    lastStateChangeTime = issue.created_at;
  }

  return (Date.now() - new Date(lastStateChangeTime).getTime()) / 1000;
}
