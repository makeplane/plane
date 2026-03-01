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

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { Network } from "lucide-react";
// plane imports
import { ACTIVITY_HIGHLIGHT_TIMEOUT } from "@plane/constants";
import { Tooltip } from "@plane/propel/tooltip";
import { cn, renderFormattedTime, renderFormattedDate, calculateTimeAgo } from "@plane/utils";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications/use-workspace-notifications";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { IssueCreatorDisplay } from "./issue-creator";
import { IssueUser } from "./issue-user";

type TIssueActivityBlockComponent = {
  icon?: ReactNode;
  activityId: string;
  ends: "top" | "bottom" | undefined;
  children: ReactNode;
  customUserName?: string;
};

export const IssueActivityBlockComponent = observer(function IssueActivityBlockComponent(
  props: TIssueActivityBlockComponent
) {
  const { icon, activityId, ends, children, customUserName } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { higlightedActivityIds, setHighlightedActivityIds } = useWorkspaceNotifications();

  const activity = getActivityById(activityId);
  const { isMobile } = usePlatformOS();
  const activityBlockRef = useRef<HTMLDivElement>(null);
  //scroll self into view id is present in higlightedActivityIds use ref
  useEffect(() => {
    if (higlightedActivityIds.length > 0 && higlightedActivityIds[0] === activityId) {
      if (activityBlockRef.current) {
        activityBlockRef.current.scrollIntoView({ behavior: "smooth" });
      }
      // reset highlighted activity ids after 5 seconds
      setTimeout(() => {
        setHighlightedActivityIds([]);
      }, ACTIVITY_HIGHLIGHT_TIMEOUT);
    }
  }, [higlightedActivityIds, activityId, setHighlightedActivityIds]);
  if (!activity) return <></>;
  return (
    <div
      className={`relative flex items-center gap-3 text-caption-sm-regular ${
        ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`
      }`}
      ref={activityBlockRef}
    >
      <div className="absolute left-[13px] top-0 bottom-0 w-px bg-layer-3" aria-hidden />
      <div
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-lg overflow-hidden flex justify-center items-center z-[4] bg-layer-2 text-secondary transition-border duration-1000 border border-subtle shadow-raised-100",
          higlightedActivityIds.includes(activityId) ? "border-accent-strong" : "",
          "text-secondary"
        )}
      >
        {icon ? icon : <Network className="w-3.5 h-3.5" />}
      </div>
      <div className="w-full truncate text-secondary">
        {!activity?.field && activity?.verb === "created" ? (
          <IssueCreatorDisplay activityId={activityId} customUserName={customUserName} />
        ) : (
          <IssueUser activityId={activityId} customUserName={customUserName} />
        )}
        <span> {children} </span>
        <span>
          <Tooltip
            isMobile={isMobile}
            tooltipContent={`${renderFormattedDate(activity.created_at)}, ${renderFormattedTime(activity.created_at)}`}
          >
            <span className="whitespace-nowrap text-tertiary"> {calculateTimeAgo(activity.created_at)}</span>
          </Tooltip>
        </span>
      </div>
    </div>
  );
});
