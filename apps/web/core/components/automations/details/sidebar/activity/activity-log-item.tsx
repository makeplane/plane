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
import { Repeat } from "lucide-react";
// plane imports
import { usePlatformOS } from "@plane/hooks";
import { Tooltip } from "@plane/propel/tooltip";
import { calculateTimeAgo, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { getAutomationActivityListItemDetails } from "./activity.helper";

type Props = {
  automationId: string;
  activityId: string;
};

export const AutomationDetailsSidebarActivityLogItem = observer(function AutomationDetailsSidebarActivityLogItem(
  props: Props
) {
  const { automationId, activityId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  const { getUserDetails } = useMember();
  // derived values
  const automation = getAutomationById(automationId);
  const { getActivityById } = automation?.activity ?? {};
  const activityDetails = getActivityById?.(activityId);
  const activityActorDetails = activityDetails?.actor ? getUserDetails(activityDetails?.actor) : undefined;
  // platform check
  const { isMobile } = usePlatformOS();
  if (!activityDetails) return null;
  const activityListItemDetails = getAutomationActivityListItemDetails(activityDetails);
  if (!activityListItemDetails) return null;
  const ActivityIcon = activityListItemDetails.icon ?? Repeat;

  return (
    <>
      <div className="shrink-0 size-7 rounded-full overflow-hidden grid place-items-center z-[4] bg-layer-3 text-secondary border-2 border-transparent transition-border duration-1000">
        <ActivityIcon className="size-3.5" />
      </div>
      <div className="w-full">
        <div className="text-secondary">
          <span>{activityActorDetails?.display_name}</span>
          <span> {activityListItemDetails.titleContent} </span>
          <span>
            <Tooltip
              isMobile={isMobile}
              tooltipContent={`${renderFormattedDate(activityDetails.created_at)}, ${renderFormattedTime(activityDetails.created_at ?? "")}`}
            >
              <span className="whitespace-nowrap text-tertiary"> {calculateTimeAgo(activityDetails.created_at)}</span>
            </Tooltip>
          </span>
        </div>
        {activityListItemDetails.descriptionContent}
      </div>
    </>
  );
});
