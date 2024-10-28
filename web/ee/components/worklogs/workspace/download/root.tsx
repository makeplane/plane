"use client";

import { FC, Fragment, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ChevronDown } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import {
  WorklogDownloadLoader,
  WorkspaceWorklogDownloadList,
  WorkspaceWorklogDownloadRefresh,
} from "@/plane-web/components/worklogs";
// plane web constants
import { EWorklogDownloadLoader, EWorklogDownloadQueryParamType } from "@/plane-web/constants/workspace-worklog";
// hooks
import { useWorkspaceWorklogDownloads } from "@/plane-web/hooks/store";

type TWorkspaceWorklogDownloadRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogDownloadRoot: FC<TWorkspaceWorklogDownloadRoot> = observer((props) => {
  const { workspaceSlug, workspaceId } = props;
  // hooks
  const { loader, paginationInfo, worklogDownloadIdsByWorkspaceId, getWorkspaceWorklogDownloads } =
    useWorkspaceWorklogDownloads();
  // states
  const [disclosureState, setDisclosureState] = useState<boolean>(true);

  // derived values
  const workspaceWorklogDownloadIds = (workspaceId && worklogDownloadIdsByWorkspaceId(workspaceId)) || undefined;
  const worklogDownloadPagination =
    workspaceWorklogDownloadIds || paginationInfo
      ? EWorklogDownloadQueryParamType.CURRENT
      : EWorklogDownloadQueryParamType.INIT;
  const worklogDownloadLoader =
    workspaceWorklogDownloadIds && workspaceWorklogDownloadIds.length > 0
      ? EWorklogDownloadLoader.MUTATION_LOADER
      : EWorklogDownloadLoader.INIT_LOADER;
  const worklogDownloadIds = worklogDownloadIdsByWorkspaceId(workspaceId) || [];

  // fetching workspace worklog downloads
  useSWR(workspaceSlug ? `WORKSPACE_WORKLOG_DOWNLOADS_${workspaceSlug}` : null, () =>
    workspaceSlug
      ? getWorkspaceWorklogDownloads(workspaceSlug.toString(), worklogDownloadLoader, worklogDownloadPagination)
      : null
  );

  if (loader === EWorklogDownloadLoader.INIT_LOADER) return <WorklogDownloadLoader loader={loader} />;

  if (worklogDownloadIds.length <= 0) return <></>;

  return (
    <Fragment>
      <div className="flex justify-between items-center">
        <div
          className="cursor-pointer flex items-center gap-1 group"
          onClick={() => setDisclosureState(!disclosureState)}
        >
          <div className="flex-shrink-0 w-5 h-5 rounded group-hover:bg-custom-background-90 text-custom-text-200 hover:text-custom-text-100 flex justify-center items-center">
            <ChevronDown size={16} className={cn("duration-300", { "-rotate-90": !disclosureState })} />
          </div>
          <div className="text-lg font-medium w-full py-0.5">Previous Downloads</div>
          {disclosureState && (workspaceWorklogDownloadIds || [])?.length > 0 && (
            <WorkspaceWorklogDownloadRefresh workspaceSlug={workspaceSlug} />
          )}
        </div>
      </div>

      {disclosureState && (
        <div className="py-4">
          <WorkspaceWorklogDownloadList workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
        </div>
      )}
    </Fragment>
  );
});
