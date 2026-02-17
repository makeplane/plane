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
import Link from "next/link";
// plane imports
import { EpicIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { Popover } from "@plane/propel/popover";
import type { TUpdate } from "@plane/types";
import { EUpdateEntityType, EUpdateStatus } from "@plane/types";
import { capitalizeFirstLetter, cn } from "@plane/utils";
// plane web components
import { UpdateStatusIcons } from "@/components/updates/status-icons";
// local components
import { UpdateList } from "../../updates/read-only-list";

type TStatusPills = {
  showTabs?: boolean;
  defaultTab?: "project" | "epic";
  handleUpdateOperations: {
    fetchUpdates: (params?: { search: EUpdateStatus }) => Promise<{
      project_updates: TUpdate[];
      epic_updates: TUpdate[];
    }>;
    fetchProjectUpdates: (params?: { search: EUpdateStatus }) => Promise<TUpdate[]>;
    fetchEpicUpdates: (params?: { search: EUpdateStatus }) => Promise<TUpdate[]>;
  };
  workspaceSlug: string;
  initiativeId: string;
  analytics:
    | {
        on_track_updates: number;
        at_risk_updates: number;
        off_track_updates: number;
      }
    | undefined;
};
interface IInitiativeUpdate extends TUpdate {
  epic_id: string;
  epic__sequence_id: string;
  epic__name: string;
  project__identifier: string;
  project__name: string;
  project_id: string;
}

export function UpdateStatusPills(props: TStatusPills) {
  const { handleUpdateOperations, workspaceSlug, initiativeId, analytics, defaultTab = "project", showTabs } = props;
  const [selectedTab, setSelectedTab] = useState<"project" | "epic">(defaultTab);

  const statusCounts = {
    [EUpdateStatus.ON_TRACK]: analytics?.on_track_updates ?? 0,
    [EUpdateStatus.AT_RISK]: analytics?.at_risk_updates ?? 0,
    [EUpdateStatus.OFF_TRACK]: analytics?.off_track_updates ?? 0,
  };

  const getStatusText = (status: string): string => capitalizeFirstLetter(status.replaceAll("-", " ").toLowerCase());

  return (
    <div className="flex gap-2 flex-shrink-0">
      {Object.entries(statusCounts)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => (
          <Popover key={status}>
            <Popover.Trigger className={cn("my-auto outline-none text-tertiary")} onClick={(e) => e.stopPropagation()}>
              <Tooltip tooltipContent={status && capitalizeFirstLetter(status.replaceAll("-", " ").toLowerCase())}>
                <button className="flex items-center gap-1 border border-subtle-1 rounded-md px-1 py-1 bg-surface-1">
                  <UpdateStatusIcons size="xs" statusType={status as EUpdateStatus} showBackground={false} />
                  <span className="text-11 font-semibold text-tertiary">
                    {count} {getStatusText(status)}
                  </span>
                </button>
              </Tooltip>
            </Popover.Trigger>

            <Popover.Content
              side="bottom"
              align="start"
              positionerClassName="z-30"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={cn(
                  "rounded-lg bg-surface-1 text-11 shadow-raised-200 focus:outline-none max-w-[320px] w-screen"
                )}
              >
                <UpdateList
                  handleTabChange={setSelectedTab}
                  count={count}
                  workspaceSlug={workspaceSlug}
                  entityId={initiativeId}
                  showTabs={showTabs}
                  getUpdates={handleUpdateOperations.fetchUpdates}
                  entityType={selectedTab === "project" ? EUpdateEntityType.PROJECT : EUpdateEntityType.EPIC}
                  status={status as EUpdateStatus}
                  customTitle={(updateData) => {
                    const initiativeUpdate = updateData as IInitiativeUpdate;
                    const route = initiativeUpdate.epic_id
                      ? `/${workspaceSlug}/projects/${initiativeUpdate.project_id}/epics/${initiativeUpdate.epic_id}`
                      : `/${workspaceSlug}/projects/${initiativeUpdate.project_id}/issues`;
                    return (
                      <Link href={route} className={cn(`font-medium capitalize flex gap-2`)} target="_blank">
                        {initiativeUpdate.epic_id && (
                          <div className="flex gap-2 text-tertiary items-center">
                            <EpicIcon className="size-4 my-auto flex-shrink-0" />
                            <div className="text-11 flex flex-shrink-0 gap-1">
                              <span>{initiativeUpdate.project__identifier}</span>
                              <span>{initiativeUpdate.epic__sequence_id}</span>
                            </div>
                          </div>
                        )}
                        <span className="truncate font-semibold min-w-[0] text-13 text-tertiary my-auto flex-1">
                          {initiativeUpdate.epic__name || initiativeUpdate.project__name}
                        </span>
                        <UpdateStatusIcons
                          statusType={initiativeUpdate.status}
                          size="sm"
                          showText
                          className="justify-end"
                        />
                      </Link>
                    );
                  }}
                />
              </div>
            </Popover.Content>
          </Popover>
        ))}
    </div>
  );
}
