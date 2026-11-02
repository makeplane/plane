/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { isAxiosError } from "axios";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useSchedulePrefs } from "@/components/bih-schedule/schedule-prefs";
import { useWorkspaceCalendar } from "@/components/bih-schedule/use-workspace-calendar";
import { AutoScheduleModal, scheduleSuccessors } from "@/components/gantt-chart/dependencies";
import type { TScheduleUpdate, TScheduleWarning } from "@/components/gantt-chart/dependencies";
import { schedulePreviewFromResponse } from "@/components/gantt-chart/dependencies/schedule-api";
import type { TScheduleLabels, TScheduleResponse } from "@/components/gantt-chart/dependencies/schedule-api";
import { useGanttDependencies } from "@/components/issues/issue-layouts/gantt/use-gantt-dependencies";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { IssueService } from "@/services/issue";
import type { TIssueOperations } from "./root";

const issueService = new IssueService();

const isAutoScheduleEnabled = () => {
  try {
    return localStorage.getItem("bih-gantt-auto-schedule") === "1";
  } catch {
    return false;
  }
};

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
};

export function useDetailAutoSchedule({ workspaceSlug, projectId, issueId, issueOperations }: Props): {
  onDateChange: (field: "start_date" | "target_date", value: string | null) => Promise<void>;
  modal: ReactNode;
} {
  const schedulePrefs = useSchedulePrefs();
  const { calendar: workspaceCalendar, supported: scheduleSupported } = useWorkspaceCalendar(workspaceSlug?.toString());
  const calendar = schedulePrefs.mode === "working" ? (workspaceCalendar ?? undefined) : undefined;
  const pullEarlier = scheduleSupported && schedulePrefs.pullEarlier;
  const scheduleOptions = { mode: calendar ? ("working" as const) : ("calendar" as const), pull_earlier: pullEarlier };
  const deps = useGanttDependencies(workspaceSlug, projectId, isAutoScheduleEnabled());
  const {
    issue: { getIssueById },
    rootIssueStore,
  } = useIssueDetail();
  const { getProjectIdentifierById } = useProject();
  const [schedulePreview, setSchedulePreview] = useState<{
    updates: TScheduleUpdate[];
    warnings: TScheduleWarning[];
    labels?: TScheduleLabels;
    save: (includeSuccessors: boolean) => Promise<void | boolean>;
  } | null>(null);

  useEffect(() => setSchedulePreview(null), [workspaceSlug, projectId, issueId]);

  const onDateChange = async (field: "start_date" | "target_date", value: string | null) => {
    const saveDate = () => issueOperations.update(workspaceSlug, projectId, issueId, { [field]: value });
    if (isAutoScheduleEnabled() && deps && value !== null && deps.issueDates[issueId]) {
      try {
        const liveIssue = getIssueById(issueId);
        const tasks = Object.entries(deps.issueDates).map(([id, dates]) => {
          const current = id === issueId && liveIssue ? liveIssue : dates;
          return { id, start: current.start_date ?? null, end: current.target_date ?? null };
        });
        const current = tasks.find((task) => task.id === issueId)!;
        let result: ReturnType<typeof scheduleSuccessors> & { labels?: TScheduleLabels } = scheduleSuccessors(
          tasks,
          deps.dependencies,
          {
            ...current,
            ...(field === "start_date" ? { start: value } : { end: value }),
          },
          calendar,
          pullEarlier
        );
        if (!result.cycle) {
          try {
            const response = await issueService.scheduleIssue(workspaceSlug, projectId, {
              ...scheduleOptions,
              change: { id: issueId, [field]: value },
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
        } else if (result.updates.length > 0 || result.warnings.length > 0) {
          const showPreview = (preview: {
            updates: TScheduleUpdate[];
            warnings: TScheduleWarning[];
            labels?: TScheduleLabels;
          }) =>
            setSchedulePreview({
              ...preview,
              save: async (includeSuccessors) => {
                try {
                  if (!includeSuccessors) {
                    await saveDate();
                    return;
                  }
                  let scheduled = false;
                  try {
                    const response = await issueService.scheduleIssue(workspaceSlug, projectId, {
                      ...scheduleOptions,
                      change: { id: issueId, [field]: value },
                      include_successors: true,
                      expected: preview.updates.map(({ id, newStart, newEnd }) => ({
                        id,
                        start_date: newStart,
                        target_date: newEnd,
                      })),
                    });
                    scheduled = true;
                    rootIssueStore.issues.updateIssue(issueId, { [field]: value });
                    response.updates.forEach(
                      ({ id, new_start, new_end }) =>
                        rootIssueStore.issues.issuesMap[id] &&
                        rootIssueStore.issues.updateIssue(id, { start_date: new_start, target_date: new_end })
                    );
                    await deps.refresh();
                    return;
                  } catch (error) {
                    if (!scheduled && isAxiosError<TScheduleResponse>(error)) {
                      if (error.response?.status === 409) {
                        setToast({ type: TOAST_TYPE.WARNING, title: "Lịch đã thay đổi — xem lại" });
                        const nextPreview = schedulePreviewFromResponse(error.response.data);
                        if (nextPreview) showPreview(nextPreview);
                        return false;
                      }
                      if (error.response?.status !== 404) throw error;
                    } else {
                      throw error;
                    }
                  }
                  await saveDate();
                  await issueService.updateIssueDates(
                    workspaceSlug,
                    projectId,
                    preview.updates.map(({ id, newStart, newEnd }) => ({
                      id,
                      start_date: newStart ?? undefined,
                      target_date: newEnd ?? undefined,
                    }))
                  );
                  await deps.refresh();
                } catch (error) {
                  setToast({
                    type: TOAST_TYPE.ERROR,
                    title:
                      isAxiosError(error) && error.response?.status === 403
                        ? "Bạn không có quyền sửa việc này"
                        : "Không lưu được lịch các việc sau",
                  });
                  console.error("Failed to save detail auto-schedule", error);
                }
              },
            });
          showPreview(result);
          return;
        }
      } catch (error) {
        console.error("Failed to preview detail auto-schedule", error);
      }
    }
    await saveDate();
  };

  return {
    onDateChange,
    modal:
      schedulePreview && deps ? (
        <AutoScheduleModal
          updates={schedulePreview.updates}
          warnings={schedulePreview.warnings}
          labels={schedulePreview.labels}
          issueDates={deps.issueDates}
          projectIdentifier={getProjectIdentifierById(projectId)}
          onSave={schedulePreview.save}
          onClose={() => setSchedulePreview(null)}
        />
      ) : null,
  };
}
