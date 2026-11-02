/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ALL_ISSUES, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { EIssuesStoreType, IBlockUpdateData, TIssue } from "@plane/types";
import { EIssueLayoutTypes, GANTT_TIMELINE_TYPE } from "@plane/types";
import { renderFormattedPayloadDate } from "@plane/utils";
// components
import { useSchedulePrefs } from "@/components/bih-schedule/schedule-prefs";
import { useWorkspaceCalendar } from "@/components/bih-schedule/use-workspace-calendar";
import { AutoScheduleModal, scheduleSuccessors } from "@/components/gantt-chart/dependencies";
import type { TScheduleUpdate, TScheduleWarning } from "@/components/gantt-chart/dependencies";
import { schedulePreviewFromResponse } from "@/components/gantt-chart/dependencies/schedule-api";
import type { TScheduleLabels, TScheduleResponse } from "@/components/gantt-chart/dependencies/schedule-api";
import { TimeLineTypeContext } from "@/components/gantt-chart/contexts";
import { GanttChartRoot } from "@/components/gantt-chart/root";
import { IssueGanttSidebar } from "@/components/gantt-chart/sidebar/issues/sidebar";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";
import { useBulkOperationStatus } from "@/hooks/use-bulk-operation-status";
import { IssueService } from "@/services/issue";
// local imports
import { IssueLayoutHOC } from "../issue-layout-HOC";
import { GanttQuickAddIssueButton, QuickAddIssueRoot } from "../quick-add";
import { IssueGanttBlock } from "./blocks";
import { useGanttDependencies } from "./use-gantt-dependencies";

const issueService = new IssueService();

interface IBaseGanttRoot {
  viewId?: string | undefined;
  isCompletedCycle?: boolean;
  isEpic?: boolean;
}

export type GanttStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.EPIC;

export const BaseGanttRoot = observer(function BaseGanttRoot(props: IBaseGanttRoot) {
  const { viewId, isCompletedCycle = false, isEpic = false } = props;
  const { t } = useTranslation();
  // router
  const { workspaceSlug, projectId } = useParams();
  const schedulePrefs = useSchedulePrefs();
  const { calendar: workspaceCalendar, supported: scheduleSupported } = useWorkspaceCalendar(workspaceSlug?.toString());
  const calendar = schedulePrefs.mode === "working" ? (workspaceCalendar ?? undefined) : undefined;
  const pullEarlier = scheduleSupported && schedulePrefs.pullEarlier;
  const deps = useGanttDependencies(workspaceSlug?.toString(), projectId?.toString(), !isEpic);

  const storeType = useIssueStoreType() as GanttStoreType;
  const { issues, issuesFilter, issueMap } = useIssues(storeType);
  const { rootIssueStore } = useIssueDetail();
  const { getProjectIdentifierById } = useProject();
  const { fetchIssues, fetchNextIssues, updateIssue, quickAddIssue } = useIssuesActions(storeType);
  const { initGantt, autoSchedule } = useTimeLineChart(GANTT_TIMELINE_TYPE.ISSUE);
  const [schedulePreview, setSchedulePreview] = useState<{
    updates: TScheduleUpdate[];
    warnings: TScheduleWarning[];
    labels?: TScheduleLabels;
    save: (includeSuccessors: boolean) => Promise<void | boolean>;
  } | null>(null);

  useEffect(() => setSchedulePreview(null), [workspaceSlug, projectId]);
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const appliedDisplayFilters = issuesFilter.issueFilters?.displayFilters;
  // plane web hooks
  const isBulkOperationsEnabled = useBulkOperationStatus();
  // derived values
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1);

  useEffect(() => {
    fetchIssues("init-loader", { canGroup: false, perPageCount: 100 }, viewId);
  }, [fetchIssues, storeType, viewId]);

  useEffect(() => {
    initGantt();
  }, []);

  const issuesIds = (issues.groupedIssueIds?.[ALL_ISSUES] as string[]) ?? [];
  const nextPageResults = issues.getPaginationData(undefined, undefined)?.nextPageResults;

  const { enableIssueCreation } = issues?.viewFlags || {};

  const loadMoreIssues = useCallback(() => {
    fetchNextIssues();
  }, [fetchNextIssues]);

  const updateIssueBlockStructure = async (issue: TIssue, data: IBlockUpdateData) => {
    if (!workspaceSlug) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    updateIssue && (await updateIssue(issue.project_id, issue.id, payload));
  };

  const isAllowed = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT);
  const dependencyActions =
    isAllowed && !isEpic && deps
      ? {
          otherPairs: deps.otherPairs,
          create: deps.createDependency,
          remove: deps.removeDependency,
          setLag: deps.setLag,
          lagsSupported: deps.lagsSupported,
        }
      : undefined;
  const hasDependencyActions = !!dependencyActions;
  const updateBlockDates = useCallback(
    async (updates: { id: string; start_date?: string; target_date?: string }[]) => {
      const scheduleOptions = {
        mode: calendar ? ("working" as const) : ("calendar" as const),
        pull_earlier: pullEarlier,
      };

      const saveDates = async (payload: typeof updates) => {
        try {
          await issues.updateIssueDates(workspaceSlug.toString(), payload, projectId.toString());
          await deps?.refresh();
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: "Error while updating work item dates, Please try again Later",
          });
        }
      };
      if (!autoSchedule || !deps || !hasDependencyActions || updates.length !== 1) {
        await saveDates(updates);
        return;
      }
      const tasks = Object.entries(deps.issueDates).map(([id, dates]) => {
        const liveIssue = issueMap[id];
        return {
          id,
          start: (liveIssue ? liveIssue.start_date : dates.start_date) ?? null,
          end: (liveIssue ? liveIssue.target_date : dates.target_date) ?? null,
        };
      });
      const drag = updates[0];
      const current = tasks.find((task) => task.id === drag.id);
      let result: ReturnType<typeof scheduleSuccessors> & { labels?: TScheduleLabels } = scheduleSuccessors(
        tasks,
        deps.dependencies,
        {
          id: drag.id,
          start: drag.start_date ?? current?.start ?? null,
          end: drag.target_date ?? current?.end ?? null,
        },
        calendar,
        pullEarlier
      );
      if (!result.cycle) {
        try {
          const response = await issueService.scheduleIssue(workspaceSlug.toString(), projectId.toString(), {
            ...scheduleOptions,
            change: drag,
            include_successors: true,
            dry_run: true,
          });
          const preview = schedulePreviewFromResponse(response);
          if (preview) result = { ...preview, cycle: null };
        } catch (error) {
          if (!isAxiosError(error) || error.response?.status !== 404) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title:
                isAxiosError(error) && error.response?.status === 403
                  ? "Bạn không có quyền sửa việc này"
                  : "Không xem trước được lịch các việc sau",
            });
            return;
          }
        }
      }
      if (result.cycle) {
        setToast({ type: TOAST_TYPE.WARNING, title: "Có vòng lặp phụ thuộc — chỉ đổi việc này" });
      }
      if (result.updates.length === 0 && !result.warnings.some(({ reason }) => reason === "no_permission")) {
        await saveDates(updates);
        return;
      }
      const showPreview = (preview: {
        updates: TScheduleUpdate[];
        warnings: TScheduleWarning[];
        labels?: TScheduleLabels;
      }) =>
        setSchedulePreview({
          ...preview,
          save: async (includeSuccessors) => {
            if (!includeSuccessors) return saveDates(updates);
            let scheduled = false;
            try {
              const response = await issueService.scheduleIssue(workspaceSlug.toString(), projectId.toString(), {
                ...scheduleOptions,
                change: drag,
                include_successors: true,
                expected: preview.updates.map(({ id, newStart, newEnd }) => ({
                  id,
                  start_date: newStart,
                  target_date: newEnd,
                })),
              });
              scheduled = true;
              rootIssueStore.issues.updateIssue(drag.id, drag);
              response.updates.forEach(
                ({ id, new_start, new_end }) =>
                  rootIssueStore.issues.issuesMap[id] &&
                  rootIssueStore.issues.updateIssue(id, { start_date: new_start, target_date: new_end })
              );
              await deps.refresh();
            } catch (error) {
              if (!scheduled && isAxiosError<TScheduleResponse>(error)) {
                if (error.response?.status === 404) {
                  await saveDates([
                    drag,
                    ...preview.updates.map(({ id, newStart, newEnd }) => ({
                      id,
                      start_date: newStart ?? undefined,
                      target_date: newEnd ?? undefined,
                    })),
                  ]);
                  return;
                }
                if (error.response?.status === 409) {
                  setToast({ type: TOAST_TYPE.WARNING, title: "Lịch đã thay đổi — xem lại" });
                  const nextPreview = schedulePreviewFromResponse(error.response.data);
                  if (nextPreview) showPreview(nextPreview);
                  return false;
                }
              }
              setToast({
                type: TOAST_TYPE.ERROR,
                title: t("toast.error"),
                message:
                  isAxiosError(error) && error.response?.status === 403
                    ? "Bạn không có quyền sửa việc này"
                    : "Error while updating work item dates, Please try again Later",
              });
            }
          },
        });
      showPreview(result);
    },
    [
      autoSchedule,
      deps,
      hasDependencyActions,
      issueMap,
      issues,
      projectId,
      rootIssueStore,
      workspaceSlug,
      t,
      calendar,
      pullEarlier,
    ]
  );

  const quickAdd =
    enableIssueCreation && isAllowed && !isCompletedCycle ? (
      <QuickAddIssueRoot
        layout={EIssueLayoutTypes.GANTT}
        QuickAddButton={GanttQuickAddIssueButton}
        containerClassName="sticky bottom-0 z-[1]"
        prePopulatedData={{
          start_date: renderFormattedPayloadDate(new Date()),
          target_date: renderFormattedPayloadDate(targetDate),
        }}
        quickAddCallback={quickAddIssue}
        isEpic={isEpic}
      />
    ) : undefined;

  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.GANTT}>
      <TimeLineTypeContext.Provider value={GANTT_TIMELINE_TYPE.ISSUE}>
        <div className="h-full w-full">
          {schedulePreview && deps && (
            <AutoScheduleModal
              updates={schedulePreview.updates}
              warnings={schedulePreview.warnings}
              labels={schedulePreview.labels}
              issueDates={deps.issueDates}
              projectIdentifier={getProjectIdentifierById(projectId.toString())}
              onSave={schedulePreview.save}
              onClose={() => setSchedulePreview(null)}
            />
          )}
          <GanttChartRoot
            dependencies={deps?.dependencies}
            externalLinks={deps?.externalLinks}
            dependencyActions={dependencyActions}
            border={false}
            title={isEpic ? t("epic.label", { count: 2 }) : t("issue.label", { count: 2 })}
            loaderTitle={isEpic ? t("epic.label", { count: 2 }) : t("issue.label", { count: 2 })}
            blockIds={issuesIds}
            blockUpdateHandler={updateIssueBlockStructure}
            blockToRender={(data: TIssue) => <IssueGanttBlock issueId={data.id} isEpic={isEpic} />}
            sidebarToRender={(props) => <IssueGanttSidebar {...props} showAllBlocks isEpic={isEpic} />}
            enableBlockLeftResize={isAllowed}
            enableBlockRightResize={isAllowed}
            enableBlockMove={isAllowed}
            enableReorder={appliedDisplayFilters?.order_by === "sort_order" && isAllowed}
            enableAddBlock={isAllowed}
            enableSelection={isBulkOperationsEnabled && isAllowed}
            quickAdd={quickAdd}
            loadMoreBlocks={loadMoreIssues}
            canLoadMoreBlocks={nextPageResults}
            updateBlockDates={updateBlockDates}
            showAllBlocks
            enableDependency
            isEpic={isEpic}
          />
        </div>
      </TimeLineTypeContext.Provider>
    </IssueLayoutHOC>
  );
});
