import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
// plane constants
import { ALL_ISSUES, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import {
  TIssue,
  IBlockUpdateData,
  EIssuesStoreType,
  EIssueLayoutTypes,
  IBlockUpdateDependencyData,
} from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { GanttChartRoot, IssueGanttSidebar } from "@/components/gantt-chart";
import { ETimeLineTypeType } from "@/components/gantt-chart/contexts";
import { IssueGanttBlock } from "@/components/issues/issue-layouts/gantt/blocks";
import { IssueLayoutHOC } from "@/components/issues/issue-layouts/issue-layout-HOC";
import { GanttLayoutLoader } from "@/components/ui/loader/layouts/gantt-layout-loader";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useTimeLineChart, useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";

type Props = {
  isLoading?: boolean;
  workspaceSlug: string;
  globalViewId: string;
  fetchNextPages: () => void;
  issuesLoading: boolean;
};

export const WorkspaceGanttChart: React.FC<Props> = observer((props: Props) => {
  const { isLoading = false, workspaceSlug, globalViewId, fetchNextPages, issuesLoading } = props;

  // Hooks
  const { t } = useTranslation();

  // Custom hooks
  useWorkspaceIssueProperties(workspaceSlug);

  // Store hooks
  const {
    issues: { getIssueLoader, getPaginationData, groupedIssueIds, updateIssueDates },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { updateIssue } = useIssuesActions(EIssuesStoreType.GLOBAL);
  const { initGantt } = useTimeLineChart(ETimeLineTypeType.ISSUE);
  const { allowPermissions } = useUserPermissions();
  const { getBlockById } = useTimeLineChartStore();

  // Derived values
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1);

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

  // Load more handler
  const loadMoreIssues = useCallback(() => {
    fetchNextPages();
  }, [fetchNextPages]);

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
  if (isLoading || issuesLoading || !globalViewId || !groupedIssueIds || getIssueLoader() === "init-loader") {
    return <GanttLayoutLoader />;
  }

  // Computed values
  const issueIds = (groupedIssueIds[ALL_ISSUES] as string[]) ?? [];
  const nextPageResults = getPaginationData(ALL_ISSUES, undefined)?.nextPageResults;

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.GLOBAL}>
      <IssueLayoutHOC layout={EIssueLayoutTypes.GANTT}>
        <div className="h-full w-full">
          <GanttChartRoot
            border={false}
            title={t("issue.label", { count: 2 })}
            loaderTitle={t("issue.label", { count: 2 })}
            blockIds={issueIds}
            blockUpdateHandler={updateIssueBlockStructure}
            blockToRender={(data: TIssue) => <IssueGanttBlock issueId={data.id} />}
            sidebarToRender={(props) => <IssueGanttSidebar {...props} showAllBlocks />}
            enableBlockLeftResize={checkBlockPermissions}
            enableBlockRightResize={checkBlockPermissions}
            enableAddBlock={checkBlockPermissions}
            loadMoreBlocks={loadMoreIssues}
            canLoadMoreBlocks={!!nextPageResults}
            updateBlockDates={updateBlockDates}
            enableDependency={checkBlockPermissions}
            showAllBlocks
            enableBlockMove={checkBlockPermissions}
          />
        </div>
      </IssueLayoutHOC>
    </IssuesStoreContext.Provider>
  );
});
