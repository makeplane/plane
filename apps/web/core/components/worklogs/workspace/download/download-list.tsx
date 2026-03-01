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
// plane web components
import { Table } from "@plane/ui";
import {
  WorklogDownloadEmptyScreen,
  WorklogDownloadLoader,
  WorkspaceWorklogDownloadPaginationBar,
} from "@/components/worklogs";
// plane web constants
import { EWorklogDownloadLoader } from "@/constants/workspace-worklog";
// plane web hooks
import { useWorkspaceWorklogDownloads } from "@/plane-web/hooks/store";
import type { IWorklogDownload } from "@/store/worklog";
import { useExportColumns } from "./column";

type TWorkspaceWorklogDownloadList = {
  workspaceSlug: string;
  workspaceId: string;
  projectId?: string;
};

export const WorkspaceWorklogDownloadList = observer(function WorkspaceWorklogDownloadList(
  props: TWorkspaceWorklogDownloadList
) {
  const { workspaceSlug, workspaceId, projectId } = props;
  // hooks
  const { loader, orderedWorklogDownloads } = useWorkspaceWorklogDownloads();
  const columns = useExportColumns();
  // derived values
  const worklogDownloads = orderedWorklogDownloads(workspaceId) || [];

  return (
    <div className="divide-y divide-subtle mt-2">
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
              tHeadClassName="border-y border-subtle"
              thClassName="text-left font-medium divide-x-0 text-placeholder"
              tBodyClassName="divide-y-0"
              tBodyTrClassName="divide-x-0 p-4 h-[40px] text-secondary"
              tHeadTrClassName="divide-x-0"
            />
          )}
        </>
      )}

      <div className="pt-3">
        <WorkspaceWorklogDownloadPaginationBar workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>
    </div>
  );
});
