"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import {
  WorklogDownloadEmptyScreen,
  WorklogDownloadLoader,
  WorkspaceWorklogDownloadItem,
  WorkspaceWorklogDownloadPaginationBar,
} from "@/plane-web/components/worklogs";
// plane web constants
import { EWorklogDownloadLoader } from "@/plane-web/constants/workspace-worklog";
// plane web hooks
import { useWorkspaceWorklogDownloads } from "@/plane-web/hooks/store";

type TWorkspaceWorklogDownloadList = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogDownloadList: FC<TWorkspaceWorklogDownloadList> = observer((props) => {
  const { workspaceSlug, workspaceId } = props;
  // hooks
  const { loader, worklogDownloadIdsByWorkspaceId } = useWorkspaceWorklogDownloads();

  // derived values
  const worklogDownloadIds = worklogDownloadIdsByWorkspaceId(workspaceId) || [];

  return (
    <div className="divide-y divide-custom-border-100">
      {loader === EWorklogDownloadLoader.PAGINATION_LOADER ? (
        <WorklogDownloadLoader loader={loader} />
      ) : (
        <>
          {worklogDownloadIds.length <= 0 ? (
            <WorklogDownloadEmptyScreen />
          ) : (
            worklogDownloadIds.map((downloadId) => (
              <WorkspaceWorklogDownloadItem
                workspaceSlug={workspaceSlug}
                worklogDownloadId={downloadId}
                key={downloadId}
              />
            ))
          )}
        </>
      )}

      <div className="pt-3">
        <WorkspaceWorklogDownloadPaginationBar workspaceSlug={workspaceSlug} />
      </div>
    </div>
  );
});
