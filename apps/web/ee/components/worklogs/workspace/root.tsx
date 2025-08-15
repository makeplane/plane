"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import useSWR from "swr";
// plane web components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import {
  WorkspaceWorklogHeaderRoot,
  WorklogsPaginatedTableRoot,
  WorkspaceWorklogDownloadRoot,
  WorkspaceTablePaginationBar,
  WorklogLoader,
} from "@/plane-web/components/worklogs";
// constants
import { EWorklogLoader, EWorklogQueryParamType } from "@/plane-web/constants/workspace-worklog";
// hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";
type TWorkspaceWorklogRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogRoot: FC<TWorkspaceWorklogRoot> = observer((props) => {
  const { workspaceSlug, workspaceId } = props;
  // hooks
  const { loader, paginationInfo, worklogIdsByWorkspaceId, getWorkspaceWorklogs } = useWorkspaceWorklogs();
  const { resolvedTheme } = useTheme();

  // derived values
  const workspaceWorklogIds = (workspaceId && worklogIdsByWorkspaceId(workspaceId)) || undefined;
  const worklogPagination =
    workspaceWorklogIds || paginationInfo ? EWorklogQueryParamType.CURRENT : EWorklogQueryParamType.INIT;
  const worklogLoader =
    workspaceWorklogIds && workspaceWorklogIds.length > 0
      ? EWorklogLoader.WORKSPACE_MUTATION_LOADER
      : EWorklogLoader.WORKSPACE_INIT_LOADER;
  const resolvedEmptyStatePath = `/empty-state/worklogs/worklog-${resolvedTheme === "light" ? "light" : "dark"}.png`;

  // fetching workspace worklogs
  useSWR(workspaceSlug ? `WORKSPACE_WORKLOGS_${workspaceSlug}` : null, () =>
    workspaceSlug ? getWorkspaceWorklogs(workspaceSlug.toString(), worklogLoader, worklogPagination) : null
  );

  return (
    <main className="container mx-auto pr-5 space-y-2 w-full">
      <h3 className="text-xl font-medium">Worklogs</h3>
      <div className="text-sm text-custom-text-300">Download worklogs AKA timesheets for anyone in any project.</div>

      <div>
        {loader === EWorklogLoader.WORKSPACE_INIT_LOADER ? (
          <WorklogLoader loader={loader} />
        ) : (
          <>
            {/* header section */}
            <WorkspaceWorklogHeaderRoot workspaceSlug={workspaceSlug} workspaceId={workspaceId} />

            {/* table section */}
            <div className="space-y-3">
              {loader === EWorklogLoader.WORKSPACE_PAGINATION_LOADER ? (
                <WorklogLoader loader={loader} />
              ) : (workspaceWorklogIds || []).length <= 0 ? (
                <DetailedEmptyState
                  title="See timesheets for any member in any project."
                  description="When you log time via Tracked time in work item properties, you will see detailed timesheets here. Any member can log time in any work item in any project in your workspace."
                  assetPath={resolvedEmptyStatePath}
                  size="sm"
                />
              ) : (
                <WorklogsPaginatedTableRoot workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
              )}
              <WorkspaceTablePaginationBar workspaceSlug={workspaceSlug} />
            </div>
          </>
        )}
      </div>

      {/* download section */}
      <div className="pt-8">
        <WorkspaceWorklogDownloadRoot workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
      </div>
    </main>
  );
});
