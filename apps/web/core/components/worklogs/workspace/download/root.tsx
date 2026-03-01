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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ChevronDownIcon } from "@plane/propel/icons";
// helpers
import { cn } from "@plane/utils";
// plane web components
import {
  WorklogDownloadLoader,
  WorkspaceWorklogDownloadList,
  WorkspaceWorklogDownloadRefresh,
} from "@/components/worklogs";
// plane web constants
import { EWorklogDownloadLoader, EWorklogDownloadQueryParamType } from "@/constants/workspace-worklog";
// hooks
import { useWorkspaceWorklogDownloads } from "@/plane-web/hooks/store";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";

type TWorkspaceWorklogDownloadRoot = {
  workspaceSlug: string;
  workspaceId: string;
  projectId?: string;
};

export const WorkspaceWorklogDownloadRoot = observer(function WorkspaceWorklogDownloadRoot(
  props: TWorkspaceWorklogDownloadRoot
) {
  const { workspaceSlug, workspaceId, projectId } = props;
  // hooks
  const { loader, paginationInfo, worklogDownloadIdsByWorkspaceId, getWorkspaceWorklogDownloads, resetState } =
    useWorkspaceWorklogDownloads();
  // states
  const [disclosureState, setDisclosureState] = useState<boolean>(true);

  // Reset state when projectId changes
  useEffect(() => {
    resetState(EWorklogDownloadLoader.INIT_LOADER);
    // cleanup function
    return () => resetState();
  }, [projectId, resetState]);

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
  useSWR(`WORKSPACE_WORKLOG_DOWNLOADS_${workspaceSlug}_${projectId}`, () =>
    getWorkspaceWorklogDownloads(workspaceSlug.toString(), worklogDownloadLoader, worklogDownloadPagination, projectId)
  );

  if (loader === EWorklogDownloadLoader.INIT_LOADER) return <WorklogDownloadLoader loader={loader} />;

  if (worklogDownloadIds.length <= 0) return <></>;

  return (
    <Collapsible open={disclosureState} onOpenChange={setDisclosureState}>
      <CollapsibleTrigger className="flex gap-1 w-full group">
        <div className="flex-shrink-0 w-5 h-5 rounded-sm group-hover:bg-layer-1 text-secondary hover:text-primary flex justify-center items-center">
          <ChevronDownIcon height={16} width={16} className={cn("duration-300", { "-rotate-90": !disclosureState })} />
        </div>
        <div className="text-16 font-medium py-0.5">Previous Downloads</div>
        {disclosureState && (workspaceWorklogDownloadIds || [])?.length > 0 && (
          <WorkspaceWorklogDownloadRefresh workspaceSlug={workspaceSlug} projectId={projectId} />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <WorkspaceWorklogDownloadList workspaceSlug={workspaceSlug} workspaceId={workspaceId} projectId={projectId} />
      </CollapsibleContent>
    </Collapsible>
  );
});
