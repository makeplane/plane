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
import { observer } from "mobx-react";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { E_SORT_ORDER } from "@plane/constants";
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon } from "@plane/propel/icons";
import type { TLoader, TBaseActivity } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { ActivitySortRoot } from "@/components/issues/issue-detail/issue-activity/sort-root";

type TActivityContentWrapperProps = {
  children: ReactNode;
  isSidebarOpen: boolean;
  membersActivityLoader: TLoader;
  membersActivitySortOrder: E_SORT_ORDER;
  membersActivity: TBaseActivity[];
  toggleMembersActivitySortOrder: () => void;
  toggleMembersActivitySidebar: () => void;
};

export const ActivityContentWrapper = observer(function ActivityContentWrapper(props: TActivityContentWrapperProps) {
  const {
    children,
    isSidebarOpen,
    membersActivityLoader,
    membersActivitySortOrder,
    membersActivity,
    toggleMembersActivitySortOrder,
    toggleMembersActivitySidebar,
  } = props;

  return (
    <div
      className={cn(
        "flex overflow-y-scroll absolute right-0 flex-col pb-10 h-full border-l ease-linear border-subtle-1 bg-surface-1 xl:relative transition-[width] md:pt-page-y",
        {
          "hidden w-0": !isSidebarOpen,
          "sm:min-w-[368px] max-w-[368px]": isSidebarOpen,
        }
      )}
      aria-hidden={!isSidebarOpen}
    >
      <div className="flex gap-2 justify-between items-center px-7 pb-5">
        <h5 className="text-sm font-semibold">Activity</h5>
        <div className="flex items-center gap-2">
          {membersActivityLoader === "mutation" ? <Spinner size={12} className="animate-spin" /> : null}
          {membersActivity && membersActivity.length > 0 && (
            <ActivitySortRoot sortOrder={membersActivitySortOrder} toggleSort={toggleMembersActivitySortOrder} />
          )}
          <IconButton variant="secondary" onClick={toggleMembersActivitySidebar} icon={CloseIcon} />
        </div>
      </div>
      <div className="px-7 overflow-y-scroll h-full">
        {membersActivityLoader === "init-loader" ? (
          <Loader className="space-y-3">
            <Loader.Item height="34px" width="100%" />
            <Loader.Item height="34px" width="100%" />
            <Loader.Item height="34px" width="100%" />
          </Loader>
        ) : membersActivity && membersActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-sm text-tertiary">No activity yet</p>
          </div>
        ) : (
          <>{children}</>
        )}
      </div>
    </div>
  );
});
