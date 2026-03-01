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

import { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane web components
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import {
  WorkspaceWorklogHeaderRoot,
  WorklogsPaginatedTableRoot,
  WorkspaceWorklogDownloadRoot,
  WorkspaceTablePaginationBar,
  WorklogLoader,
} from "@/components/worklogs";
// constants
import { EWorklogLoader, EWorklogQueryParamType } from "@/constants/workspace-worklog";
// hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";
import { SettingsHeading } from "@/components/settings/heading";

type TWorkspaceWorklogRoot = {
  workspaceSlug: string;
  workspaceId: string;
  projectId?: string;
};

export const WorkspaceWorklogRoot = observer(function WorkspaceWorklogRoot(props: TWorkspaceWorklogRoot) {
  const { workspaceSlug, workspaceId, projectId } = props;
  // hooks
  const { loader, paginationInfo, worklogIdsByWorkspaceId, getWorklogs, resetState } = useWorkspaceWorklogs();
  const { t } = useTranslation();

  // Reset state when projectId changes
  useEffect(() => {
    resetState(projectId, EWorklogLoader.WORKSPACE_INIT_LOADER);
    // cleanup function
    return () => resetState(projectId);
  }, [projectId, resetState]);

  // derived values
  const workspaceWorklogIds = (workspaceId && worklogIdsByWorkspaceId(workspaceId)) || undefined;
  const worklogPagination =
    workspaceWorklogIds || paginationInfo ? EWorklogQueryParamType.CURRENT : EWorklogQueryParamType.INIT;
  const worklogLoader =
    workspaceWorklogIds && workspaceWorklogIds.length > 0
      ? EWorklogLoader.WORKSPACE_MUTATION_LOADER
      : EWorklogLoader.WORKSPACE_INIT_LOADER;

  // fetching workspace worklogs
  useSWR(`WORKSPACE_WORKLOGS_${workspaceSlug}_${projectId}`, () =>
    getWorklogs(workspaceSlug.toString(), worklogLoader, worklogPagination, projectId)
  );

  return (
    <main className="container mx-auto pr-5 space-y-2 w-full">
      <SettingsHeading title="Worklogs" description="Download worklogs AKA timesheets for anyone in any project." />
      <div>
        {loader === EWorklogLoader.WORKSPACE_INIT_LOADER ? (
          <WorklogLoader loader={loader} />
        ) : (
          <>
            {/* header section */}
            <WorkspaceWorklogHeaderRoot workspaceSlug={workspaceSlug} workspaceId={workspaceId} projectId={projectId} />

            {/* table section */}
            <div className="space-y-3">
              {loader === EWorklogLoader.WORKSPACE_PAGINATION_LOADER ? (
                <WorklogLoader loader={loader} />
              ) : (workspaceWorklogIds || []).length <= 0 ? (
                <EmptyStateCompact
                  assetKey="worklog"
                  title={t("settings_empty_state.worklogs.title")}
                  description={t("settings_empty_state.worklogs.description")}
                  align="start"
                  rootClassName="py-20"
                />
              ) : (
                <WorklogsPaginatedTableRoot workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
              )}
              <WorkspaceTablePaginationBar workspaceSlug={workspaceSlug} projectId={projectId} />
            </div>
          </>
        )}
      </div>

      {/* download section */}
      <div className="pt-8">
        <WorkspaceWorklogDownloadRoot workspaceSlug={workspaceSlug} workspaceId={workspaceId} projectId={projectId} />
      </div>
    </main>
  );
});
