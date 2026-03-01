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

import Link from "next/link";
import { getButtonStyling } from "@plane/propel/button";
import { CycleGroupIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
// types
import type { ICycle, TCycleGroups } from "@plane/types";
// ui
import { Avatar, AvatarGroup } from "@plane/ui";
// helpers
import { findHowManyDaysLeft, getFileURL, renderFormattedDate, truncateText } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";

export type ActiveCycleHeaderProps = {
  cycle: ICycle;
  workspaceSlug: string;
  projectId: string;
};

export function ActiveCycleHeader(props: ActiveCycleHeaderProps) {
  const { cycle, workspaceSlug, projectId } = props;
  // store
  const { getUserDetails } = useMember();
  const cycleOwnerDetails = cycle && cycle.owned_by_id ? getUserDetails(cycle.owned_by_id) : undefined;

  const daysLeft = findHowManyDaysLeft(cycle.end_date) ?? 0;
  const currentCycleStatus = cycle?.status?.toLocaleLowerCase() as TCycleGroups;

  const cycleAssignee = (cycle.distribution?.assignees ?? []).filter((assignee) => assignee.display_name);

  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded-sm border-[0.5px] border-subtle bg-layer-1">
      <div className="flex items-center gap-2 cursor-default">
        <CycleGroupIcon cycleGroup={currentCycleStatus} className="h-4 w-4" />
        <Tooltip tooltipContent={cycle.name} position="top-start">
          <h3 className="break-words text-16 font-medium">{truncateText(cycle.name, 70)}</h3>
        </Tooltip>
        <Tooltip
          tooltipContent={`Start date: ${renderFormattedDate(cycle.start_date ?? "")} Due Date: ${renderFormattedDate(
            cycle.end_date ?? ""
          )}`}
          position="top-start"
        >
          <span className="flex gap-1 whitespace-nowrap rounded-sm text-placeholder font-semibold text-13 leading-5">
            {`${daysLeft} ${daysLeft > 1 ? "days" : "day"} left`}
          </span>
        </Tooltip>
      </div>
      <div className="flex items-center gap-4">
        <div className="rounded-sm text-13">
          <div className="flex gap-2 divide-x spac divide-x-border-300 text-13 whitespace-nowrap text-tertiary font-medium">
            <Avatar name={cycleOwnerDetails?.display_name} src={getFileURL(cycleOwnerDetails?.avatar_url ?? "")} />
            {cycleAssignee.length > 0 && (
              <span className="pl-2">
                <AvatarGroup showTooltip>
                  {cycleAssignee.map((member) => (
                    <Avatar
                      key={member.assignee_id}
                      name={member?.display_name ?? ""}
                      src={getFileURL(member?.avatar_url ?? "")}
                      showTooltip={false}
                    />
                  ))}
                </AvatarGroup>
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle.id}/`}
          className={`${getButtonStyling("secondary", "base")} cursor-pointer`}
        >
          View cycle
        </Link>
      </div>
    </div>
  );
}
