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

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { calculateTimeAgo, cn, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { IssuePropertyLogo } from "@/components/work-item-types/properties/common/issue-property-logo";
import { useIssueTypes } from "@/plane-web/hooks/store";
// local imports
import { IssueUser } from "./issue-user";

type TIssueActivityBlockComponent = {
  activityId: string;
  propertyId: string;
  ends: "top" | "bottom" | undefined;
  children: ReactNode;
};

export function IssueActivityBlockComponent(props: TIssueActivityBlockComponent) {
  const { activityId, propertyId, ends, children } = props;
  const activityBlockRef = useRef<HTMLDivElement>(null);
  // hooks
  const { isMobile } = usePlatformOS();
  // plane web hooks
  const { getIssuePropertyById } = useIssueTypes();
  const {
    activity: {
      issuePropertiesActivity: { getPropertyActivityById },
    },
  } = useIssueDetail();

  const { higlightedActivityIds } = useWorkspaceNotifications();
  const propertyDetail = getIssuePropertyById(propertyId);
  // derived values
  const activityDetail = getPropertyActivityById(activityId);

  useEffect(() => {
    if (higlightedActivityIds.length > 0 && higlightedActivityIds[0] === activityId) {
      if (activityBlockRef.current) {
        activityBlockRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [higlightedActivityIds, activityId]);
  if (!activityDetail) return <></>;
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
        {propertyDetail?.logo_props?.in_use && (
          <IssuePropertyLogo icon_props={propertyDetail.logo_props.icon} size={14} colorClassName="text-secondary" />
        )}
      </div>
      <div className="w-full truncate text-secondary">
        <IssueUser activityId={activityId} />
        <span> {children} </span>
        {activityDetail.created_at && (
          <span>
            <Tooltip
              isMobile={isMobile}
              tooltipContent={`${renderFormattedDate(activityDetail.created_at)}, ${renderFormattedTime(activityDetail.created_at)}`}
            >
              <span className="whitespace-nowrap text-tertiary"> {calculateTimeAgo(activityDetail.created_at)}</span>
            </Tooltip>
          </span>
        )}
      </div>
    </div>
  );
}
