"use client";

import { FC, ReactNode, useEffect, useRef } from "react";
// plane imports
import { Tooltip } from "@plane/ui";
import { calculateTimeAgo, cn, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { IssuePropertyLogo } from "@/plane-web/components/issue-types/properties/common/issue-property-logo";
import { useIssuePropertiesActivity, useIssueTypes } from "@/plane-web/hooks/store";
// local imports
import { IssueUser } from "./issue-user";

type TIssueActivityBlockComponent = {
  activityId: string;
  propertyId: string;
  ends: "top" | "bottom" | undefined;
  children: ReactNode;
};

export const IssueActivityBlockComponent: FC<TIssueActivityBlockComponent> = (props) => {
  const { activityId, propertyId, ends, children } = props;
  const activityBlockRef = useRef<HTMLDivElement>(null);
  // hooks
  const { isMobile } = usePlatformOS();
  // plane web hooks
  const { getIssuePropertyById } = useIssueTypes();
  const { getPropertyActivityById } = useIssuePropertiesActivity();
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
      className={`relative flex items-center gap-3 text-xs ${
        ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`
      }`}
      ref={activityBlockRef}
    >
      <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-custom-background-80" aria-hidden />
      <div
        className={cn(
          "flex-shrink-0 ring-6 w-7 h-7 rounded-full overflow-hidden border-2 border-transparent flex justify-center items-center z-[4] bg-custom-background-80 text-custom-text-200",
          higlightedActivityIds.includes(activityId) ? "border-custom-primary-100" : ""
        )}
      >
        {propertyDetail?.logo_props?.in_use && (
          <IssuePropertyLogo
            icon_props={propertyDetail.logo_props.icon}
            size={14}
            colorClassName="text-custom-text-200"
          />
        )}
      </div>
      <div className="w-full truncate text-custom-text-200">
        <IssueUser activityId={activityId} />
        <span> {children} </span>
        {activityDetail.created_at && (
          <span>
            <Tooltip
              isMobile={isMobile}
              tooltipContent={`${renderFormattedDate(activityDetail.created_at)}, ${renderFormattedTime(activityDetail.created_at)}`}
            >
              <span className="whitespace-nowrap"> {calculateTimeAgo(activityDetail.created_at)}</span>
            </Tooltip>
          </span>
        )}
      </div>
    </div>
  );
};
