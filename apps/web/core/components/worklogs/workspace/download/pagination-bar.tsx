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
import { PaginationBar } from "@/components/common/pagination-bar";
// hooks
import { useWorkspaceWorklogDownloads } from "@/plane-web/hooks/store";

type TWorkspaceWorklogDownloadPaginationBar = {
  workspaceSlug: string;
  projectId?: string;
};

export const WorkspaceWorklogDownloadPaginationBar = observer(function WorkspaceWorklogDownloadPaginationBar(
  props: TWorkspaceWorklogDownloadPaginationBar
) {
  const { workspaceSlug, projectId } = props;
  // hooks
  const { perPage, paginationInfo, getPreviousWorklogDownloads, getNextWorklogDownloads } =
    useWorkspaceWorklogDownloads();

  const getPrevDownloads = async () => {
    try {
      if (!workspaceSlug) return;
      await getPreviousWorklogDownloads(workspaceSlug, projectId);
    } catch (error) {
      console.error("Error while showing prev download", error);
    }
  };

  const getNextDownloads = async () => {
    try {
      if (!workspaceSlug) return;
      await getNextWorklogDownloads(workspaceSlug, projectId);
    } catch (error) {
      console.error("Error while showing next download", error);
    }
  };

  if (!paginationInfo) return <></>;
  return (
    <PaginationBar
      perPage={perPage}
      paginationInfo={paginationInfo}
      onPrevClick={getPrevDownloads}
      onNextClick={getNextDownloads}
    />
  );
});
