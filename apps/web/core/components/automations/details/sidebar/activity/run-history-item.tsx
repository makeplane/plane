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

import { useState } from "react";
import { differenceInSeconds } from "date-fns/differenceInSeconds";
import { observer } from "mobx-react";
import { CircleAlert, Clock, Dot } from "lucide-react";
import { CheckIcon, ChevronRightIcon } from "@plane/propel/icons";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { Avatar } from "@plane/ui";
import {
  calculateTimeAgo,
  cn,
  formatDuration,
  getFileURL,
  renderFormattedDate,
  renderFormattedTime,
} from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type Props = {
  automationId: string;
  activityId: string;
};

export const AutomationDetailsSidebarActivityRunHistoryItem = observer(
  function AutomationDetailsSidebarActivityRunHistoryItem(props: Props) {
    const { automationId, activityId } = props;
    // store hooks
    const { getAutomationById } = useAutomations();
    const { getUserDetails } = useMember();
    const { getProjectById } = useProject();
    // derived values
    const automation = getAutomationById(automationId);
    const { getActivityById } = automation?.activity ?? {};
    const activityDetails = getActivityById?.(activityId);
    const runDetails = activityDetails?.automation_run;
    const runInitiator = runDetails?.initiator ? getUserDetails(runDetails.initiator) : undefined;
    const duration = runDetails?.completed_at ? differenceInSeconds(runDetails.completed_at, runDetails.started_at) : 0;
    const projectIdentifier = getProjectById(activityDetails?.project)?.identifier;
    // translation
    const { t } = useTranslation();
    // state
    const [isOpen, setIsOpen] = useState(false);

    if (!activityDetails) return null;

    return (
      <Collapsible
        className="relative z-4 w-full bg-surface-1 border border-subtle-1 rounded-lg p-3"
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <CollapsibleTrigger type="button" className="w-full flex items-center justify-between gap-2 text-11 text-left">
          <div className="shrink-0 flex items-center gap-2">
            <span
              className={cn("shrink-0 size-7 rounded-full text-on-color grid place-items-center", {
                "bg-success-primary": runDetails?.status === "success",
                "bg-orange-500": runDetails?.status === "failed",
              })}
            >
              {runDetails?.status === "success" ? <CheckIcon className="size-4" /> : <CircleAlert className="size-4" />}
            </span>
            <div>
              <p className="font-semibold">
                {projectIdentifier}-{runDetails?.work_item_sequence_id}
              </p>
              <p className="flex items-center gap-0.5 text-secondary">
                {renderFormattedTime(activityDetails.created_at ?? "")}
                <Dot className="shrink-0 size-2" />
                {calculateTimeAgo(activityDetails.created_at)}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Tooltip
              tooltipContent={
                <div className="text-11 font-medium text-tertiary">
                  From{" "}
                  <span className="text-primary">
                    {renderFormattedDate(runDetails?.started_at ?? "")}{" "}
                    {renderFormattedTime(runDetails?.started_at ?? "")}
                  </span>
                  <br />
                  to{" "}
                  <span className="text-primary">
                    {renderFormattedDate(runDetails?.completed_at ?? "")}{" "}
                    {renderFormattedTime(runDetails?.completed_at ?? "")}
                  </span>
                </div>
              }
            >
              <span className="shrink-0 bg-layer-1 p-1 rounded text-secondary flex items-center gap-1">
                <Clock className="shrink-0 size-3" />
                <span className="font-medium">{formatDuration(duration)}</span>
              </span>
            </Tooltip>
            <button type="button" className="shrink-0 size-4 grid place-items-center text-secondary hover:text-primary">
              <ChevronRightIcon
                className={cn("size-3 transition-transform", {
                  "rotate-90": isOpen,
                })}
              />
            </button>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <hr className="mb-3 border-subtle-1" />
          {runInitiator && (
            <div className="space-y-1 text-11 font-medium">
              <p>{t("automations.activity.run_history.initiator")}</p>
              <div className="flex items-center gap-1">
                <Avatar src={getFileURL(runInitiator.avatar_url)} name={runInitiator.display_name} />
                <span className="text-secondary">{runInitiator.display_name ?? t("common.deactivated_user")}</span>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  }
);
