/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import useSWR from "swr";
// plane imports
import { cn } from "@plane/utils";
import { AppRailRoot } from "@/components/navigation";
import { useTaskCategory } from "@/hooks/store/use-task-category";
import { useAppRailVisibility } from "@/lib/app-rail";
// local imports
import { TopNavigationRoot } from "../navigations";

export const WorkspaceContentWrapper = observer(function WorkspaceContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { workspaceSlug } = useParams();
  const { fetchCategories } = useTaskCategory();
  // Use the context to determine if app rail should render
  const { shouldRenderAppRail } = useAppRailVisibility();

  // Pre-fetch task categories at workspace level so spreadsheet column sorting works
  useSWR(
    workspaceSlug ? `WORKSPACE_TASK_CATEGORIES_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchCategories(workspaceSlug) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return (
    <div className="flex flex-col relative size-full overflow-hidden bg-canvas transition-all ease-in-out duration-300">
      <TopNavigationRoot />
      <div className="relative flex size-full overflow-hidden">
        {/* Conditionally render AppRailRoot based on context */}
        {shouldRenderAppRail && <AppRailRoot />}
        <div
          className={cn(
            "relative size-full pl-2 pb-2 pr-2 flex-grow transition-all ease-in-out duration-300 overflow-hidden",
            {
              "pl-0!": shouldRenderAppRail,
            }
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
});
