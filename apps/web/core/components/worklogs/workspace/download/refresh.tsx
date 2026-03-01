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

import type { MouseEvent } from "react";
import { Loader, RefreshCcw } from "lucide-react";
import { Button } from "@plane/propel/button";
// plane web constants
import { EWorklogDownloadLoader, EWorklogDownloadQueryParamType } from "@/constants/workspace-worklog";
// hooks
import { useWorkspaceWorklogDownloads } from "@/plane-web/hooks/store";

type TWorkspaceWorklogDownloadRefresh = {
  workspaceSlug: string;
  projectId?: string;
};

export function WorkspaceWorklogDownloadRefresh(props: TWorkspaceWorklogDownloadRefresh) {
  const { workspaceSlug, projectId } = props;
  // hooks
  const { loader, paginationInfo, getWorkspaceWorklogDownloads } = useWorkspaceWorklogDownloads();

  const refreshStatus = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!workspaceSlug) return;
      await getWorkspaceWorklogDownloads(
        workspaceSlug,
        EWorklogDownloadLoader.MUTATION_LOADER,
        EWorklogDownloadQueryParamType.CURRENT,
        projectId
      );
    } catch (error) {
      console.error("Error while refreshing download status", error);
    }
  };

  const isLoaderButtonDisabled = loader === EWorklogDownloadLoader.MUTATION_LOADER;

  if (!paginationInfo) return <></>;
  return (
    <Button
      variant="secondary"
      className="whitespace-nowrap border-none !px-1"
      onClick={refreshStatus}
      disabled={isLoaderButtonDisabled}
    >
      <div className="flex items-center gap-1.5">
        {isLoaderButtonDisabled ? <Loader size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
        {isLoaderButtonDisabled && <div>Refreshing</div>}
      </div>
    </Button>
  );
}
