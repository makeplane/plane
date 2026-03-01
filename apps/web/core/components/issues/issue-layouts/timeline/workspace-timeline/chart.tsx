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

import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
// plane constants
import { ALL_ISSUES, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TIssue, IBlockUpdateData, IBlockUpdateDependencyData } from "@plane/types";
import { EIssuesStoreType, EIssueLayoutTypes, GANTT_TIMELINE_TYPE } from "@plane/types";
// components
import { TimelineChartRoot, IssueTimelineSidebar } from "@/components/timeline";
import { WorkItemTimelineBlock } from "@/components/issues/issue-layouts/timeline/blocks";
import { IssueLayoutHOC } from "@/components/issues/issue-layouts/issue-layout-HOC";
import { TimelineLayoutLoader } from "@/components/ui/loader/layouts/timeline-layout-loader";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useTimeLineChart, useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";

type Props = {
  workspaceSlug: string;
  globalViewId: string;
};

export const WorkspaceTimelineChart = observer(function WorkspaceGanttChart(props: Props) {
  const { workspaceSlug, globalViewId } = props;

  // Hooks
  const { t } = useTranslation();

  // Custom hooks
  useWorkspaceIssueProperties(workspaceSlug);

  // Store hooks
  const {
    issues: { getIssueLoader, getPaginationData, groupedIssueIds, updateIssueDates },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { updateIssue, fetchNextIssues, fetchIssues } = useIssuesActions(EIssuesStoreType.GLOBAL);
  const { initGantt } = useTimeLineChart(GANTT_TIMELINE_TYPE.ISSUE);
  const { allowPermissions } = useUserPermissions();
  const { getBlockById } = useTimeLineChartStore();

  // Derived values
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1);

  useEffect(() => {
    fetchIssues("init-loader", { canGroup: false, perPageCount: 100 }, globalViewId).catch((error) =>
      console.error(error)
    );
  }, [fetchIssues, globalViewId]);

  // Gantt initialization
  useEffect(() => {
    initGantt();
  }, [initGantt]);

  // Block update handler
  const updateIssueBlockStructure = async (issue: TIssue, data: IBlockUpdateData) => {
    if (!workspaceSlug) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    if (updateIssue) await updateIssue(issue.project_id, issue.id, payload);
  };

  // Date update handler
  const updateBlockDates = useCallback(
    async (updates: IBlockUpdateDependencyData[]): Promise<void> => {
      try {
        const payload: IBlockUpdateDependencyData[] = updates.map((update) => ({
          id: update.id,
          start_date: update.start_date,
          target_date: update.target_date,
          meta: update.meta,
        }));
        return await updateIssueDates(workspaceSlug.toString(), payload);
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: "Error while updating work item dates, Please try again Later",
        });
      }
    },
    [updateIssueDates, workspaceSlug, t]
  );

  // Permission handler
  const checkBlockPermissions = (blockId: string) => {
    const block = getBlockById(blockId);
    const projectId = block?.meta?.project_id;

    return allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug,
      projectId
    );
  };
  // Loading state
  if (!globalViewId || !groupedIssueIds || getIssueLoader() === "init-loader") {
    return <TimelineLayoutLoader />;
  }

  // Computed values
  const issueIds = (groupedIssueIds[ALL_ISSUES] as string[]) ?? [];
  const nextPageResults = getPaginationData(ALL_ISSUES, undefined)?.nextPageResults;

  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.GANTT}>
      <div className="h-full w-full">
        <TimelineChartRoot
          border={false}
          title={t("issue.label", { count: 2 })}
          loaderTitle={t("issue.label", { count: 2 })}
          blockIds={issueIds}
          blockUpdateHandler={updateIssueBlockStructure}
          blockToRender={(data: TIssue) => <WorkItemTimelineBlock issueId={data.id} />}
          sidebarToRender={(props) => <IssueTimelineSidebar {...props} showAllBlocks />}
          enableBlockLeftResize={checkBlockPermissions}
          enableBlockRightResize={checkBlockPermissions}
          enableAddBlock={checkBlockPermissions}
          loadMoreBlocks={fetchNextIssues}
          canLoadMoreBlocks={!!nextPageResults}
          updateBlockDates={updateBlockDates}
          enableDependency={checkBlockPermissions}
          showAllBlocks
          enableBlockMove={checkBlockPermissions}
        />
      </div>
    </IssueLayoutHOC>
  );
});
