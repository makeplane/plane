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

import type { Dispatch, SetStateAction } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Tabs } from "@plane/propel/tabs";
import type { TUpdate, EUpdateStatus } from "@plane/types";
import { EUpdateEntityType } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn, renderFormattedDate } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";
import { StatusOptions } from "./status-icons";

type TUpdateList = {
  count: number;
  workspaceSlug: string;
  entityId: string;
  handleTabChange: Dispatch<SetStateAction<"project" | "epic">>;
  getUpdates:
    | ((params?: {
        search: EUpdateStatus;
      }) => Promise<{ project_updates: TUpdate[]; epic_updates: TUpdate[] }> | undefined)
    | undefined;
  entityType: EUpdateEntityType;
  status: EUpdateStatus;
  customTitle?: (updateData: TUpdate) => React.ReactNode;
  showTabs?: boolean;
};

type TUpdateListTabs = {
  updates: TUpdate[] | undefined;
  customTitle?: (updateData: TUpdate) => React.ReactNode;
  className?: string;
};

function UpdateListTabs(props: TUpdateListTabs) {
  const { updates, customTitle, className } = props;
  const { getUserDetails } = useMember();
  return (
    updates &&
    updates.length > 0 && (
      <div className="flex flex-col divide-y divide-subtle-1 max-h-[500px] overflow-y-auto">
        {updates.map((updateData) => (
          <div key={updateData.id} className={cn("relative py-4 pb-0 w-full", className)}>
            <div className="flex items-center w-full">
              {/* Type and creator */}
              <div className="flex-1 overflow-hidden">
                {customTitle?.(updateData) || (
                  <div
                    className={cn(`text-[${StatusOptions[updateData.status].color}] font-semibold text-13 capitalize`)}
                  >
                    {updateData.status?.toLowerCase().replaceAll("-", " ")}
                  </div>
                )}
                <div className="text-tertiary font-regular text-11">
                  {renderFormattedDate(updateData.updated_at)} • {getUserDetails(updateData?.created_by)?.display_name}
                </div>
              </div>
            </div>

            {/* Update */}
            <div className="text-14 my-3 break-words w-full whitespace-pre-wrap">{updateData.description}</div>
          </div>
        ))}
      </div>
    )
  );
}

export const UpdateList = observer(function UpdateList(props: TUpdateList) {
  const { count, workspaceSlug, entityId, getUpdates, entityType, status, customTitle, showTabs, handleTabChange } =
    props;
  const { data: updates, isLoading } = useSWR(
    count > 0 && entityId && workspaceSlug ? `INITIATIVE_UPDATES_${entityId}_${status}` : null,
    count > 0 ? () => getUpdates?.({ search: status }) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const projectsCount = updates?.project_updates?.length ?? 0;
  const epicsCount = updates?.epic_updates?.length ?? 0;
  const shouldRenderTabHeader = projectsCount > 0 && epicsCount > 0;
  const defaultTab = shouldRenderTabHeader ? "project" : projectsCount > 0 ? "project" : "epic";

  if (isLoading) {
    return (
      <div className="flex flex-col divide-y divide-subtle-1">
        <Loader className="space-y-4 p-3">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="w-full space-y-3">
              <div className="flex gap-2">
                <div className="w-2/3 space-y-1">
                  <Loader.Item height="20px" />
                  <Loader.Item width="80%" height="10px" />
                </div>
                <div className="w-1/3">
                  <Loader.Item width="100%" height="30px" />
                </div>
              </div>
              <div className="space-y-2">
                <Loader.Item width="100%" height="10px" />
                <Loader.Item width="100%" height="10px" />
                <Loader.Item width="80%" height="10px" />
              </div>
            </div>
          ))}
        </Loader>
      </div>
    );
  }

  if (!isLoading && !updates)
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <div className="text-tertiary font-regular text-11 italic">No updates found</div>
        </div>
      </div>
    );
  if (!showTabs)
    return (
      <>
        <div className="font-semibold text-14 capitalize p-4 pb-0 text-secondary">
          {`${entityType === EUpdateEntityType.PROJECT ? "Project" : "Epic"} updates`}
        </div>
        <UpdateListTabs
          updates={entityType === EUpdateEntityType.PROJECT ? updates?.project_updates : updates?.epic_updates}
          customTitle={customTitle}
          className="px-4"
        />
      </>
    );

  return (
    <div className="flex flex-col p-4 overflow-hidden bg-surface-1  border border-subtle-1 rounded-lg">
      <div className="font-semibold text-14 capitalize text-secondary mb-2">
        {shouldRenderTabHeader ? "Updates" : projectsCount > 0 ? "Project updates" : "Epic updates"}
      </div>
      <Tabs defaultValue={defaultTab} onValueChange={(value) => handleTabChange(value as "project" | "epic")}>
        {shouldRenderTabHeader && (
          <Tabs.List>
            <Tabs.Trigger value="project">
              <div className="flex items-center gap-2">
                <div className="font-regular text-11 ">Project updates</div>
                <div
                  className={cn("font-regular text-11 px-2 py-0.5 rounded-full bg-transparent", {
                    "text-secondary bg-layer-1": entityType === EUpdateEntityType.PROJECT,
                  })}
                >
                  {projectsCount}
                </div>
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger value="epic">
              <div className="flex items-center gap-2">
                <div className="font-regular text-11 ">Epic updates</div>
                <div
                  className={cn("font-regular text-11 px-2 py-0.5 rounded-full bg-transparent", {
                    "text-secondary bg-layer-1": entityType === EUpdateEntityType.EPIC,
                  })}
                >
                  {epicsCount}
                </div>
              </div>
            </Tabs.Trigger>
          </Tabs.List>
        )}

        <Tabs.Content value="project">
          <UpdateListTabs updates={updates?.project_updates} customTitle={customTitle} />
        </Tabs.Content>
        <Tabs.Content value="epic">
          <UpdateListTabs updates={updates?.epic_updates} customTitle={customTitle} />
        </Tabs.Content>
      </Tabs>
    </div>
  );
});
