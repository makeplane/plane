"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import { Table } from "@plane/ui";
import {
  WorklogDownloadEmptyScreen,
  WorklogDownloadLoader,
  WorkspaceWorklogDownloadPaginationBar,
} from "@/plane-web/components/worklogs";
// plane web constants
import { EWorklogDownloadLoader } from "@/plane-web/constants/workspace-worklog";
// plane web hooks
import { useWorkspaceWorklogDownloads } from "@/plane-web/hooks/store";
import { IWorklogDownload } from "@/plane-web/store/workspace-worklog";
import { useExportColumns } from "./column";

type TWorkspaceWorklogDownloadList = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogDownloadList: FC<TWorkspaceWorklogDownloadList> = observer((props) => {
  const { workspaceSlug, workspaceId } = props;
  // hooks
  const { loader, orderedWorklogDownloads } = useWorkspaceWorklogDownloads();
  const columns = useExportColumns();
  // derived values
  const worklogDownloads = orderedWorklogDownloads(workspaceId) || [];

  return (
    <div className="divide-y divide-custom-border-100 mt-2">
      {loader === EWorklogDownloadLoader.PAGINATION_LOADER ? (
        <WorklogDownloadLoader loader={loader} />
      ) : (
        <>
          {worklogDownloads.length <= 0 ? (
            <WorklogDownloadEmptyScreen />
          ) : (
            <Table
              columns={columns ?? []}
              data={worklogDownloads ?? []}
              keyExtractor={(rowData: IWorklogDownload) => rowData?.id ?? ""}
              tHeadClassName="border-y border-custom-border-100"
              thClassName="text-left font-medium divide-x-0 text-custom-text-400"
              tBodyClassName="divide-y-0"
              tBodyTrClassName="divide-x-0 p-4 h-[40px] text-custom-text-200"
              tHeadTrClassName="divide-x-0"
            />
          )}
        </>
      )}

      <div className="pt-3">
        <WorkspaceWorklogDownloadPaginationBar workspaceSlug={workspaceSlug} />
      </div>
    </div>
  );
});
