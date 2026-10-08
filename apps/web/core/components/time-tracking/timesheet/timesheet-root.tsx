/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ChevronLeft, ChevronRight, Copy, Plus } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Popover } from "@plane/propel/popover";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TTimesheetRow } from "@plane/types";
import {
  addDaysToISODate,
  cn,
  formatTimeDuration,
  getDateFromISODate,
  getISODate,
  getTodayISODate,
  getWeekDays,
  getWeekStartDate,
  renderFormattedDate,
} from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ProjectDropdownBase } from "@/components/dropdowns/project/base";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useLoggableProjects } from "@/hooks/time-tracking/use-loggable-projects";
import { useTimesheet } from "@/hooks/time-tracking/use-timesheet";
// services
import { timeTrackingService } from "@/services/time-tracking.service";
// local imports
import { getWorkItemKey } from "../helpers";
import type { TWorkItemSelectOption } from "../inputs/work-item-select";
import { WorkItemSelect } from "../inputs/work-item-select";
import { TimeTrackingRowsLoader } from "../loaders";
import { TimesheetCell } from "./timesheet-cell";

type TRowSkeleton = Pick<TTimesheetRow, "project_id" | "issue_id" | "issue_detail"> & {
  project_detail?: TTimesheetRow["project_detail"];
};

const rowKey = (row: { project_id: string; issue_id: string | null }) => `${row.project_id}|${row.issue_id ?? ""}`;

/** The weekly timesheet for one person (plan 9.5.2). */
export const TimesheetRoot = observer(function TimesheetRoot({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { data: profile } = useUserProfile();
  const { getProjectById } = useProject();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const { ownProjectIds, forOthersProjectIds, canLogOwn, canLogForOthers } = useLoggableProjects(workspaceSlug);
  const startOfWeek = profile?.start_of_the_week ?? 0;
  const today = getTodayISODate(currentUser?.user_timezone);

  const [userId, setUserId] = useState<string | undefined>(currentUser?.id);
  const [weekStart, setWeekStart] = useState(() => getWeekStartDate(today, startOfWeek));
  // rows that only exist on the client until they get time (plan: "Add row", "Copy rows")
  const [extraRows, setExtraRows] = useState<TRowSkeleton[]>([]);

  useEffect(() => {
    if (!userId && currentUser?.id) setUserId(currentUser.id);
  }, [currentUser?.id, userId]);
  // follow a change of the profile's start of week
  useEffect(() => setWeekStart((current) => getWeekStartDate(current, startOfWeek)), [startOfWeek]);
  useEffect(() => setExtraRows([]), [userId, weekStart]);

  const { timesheet, isLoading } = useTimesheet(workspaceSlug, userId, weekStart);
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const isCurrentUser = !!currentUser && userId === currentUser.id;
  const canCreateIn = (projectId: string) => (isCurrentUser ? canLogOwn(projectId) : canLogForOthers(projectId));

  const rows = useMemo<TRowSkeleton[]>(() => {
    const serverRows: TRowSkeleton[] = timesheet?.rows ?? [];
    const known = new Set(serverRows.map(rowKey));
    return [...serverRows, ...extraRows.filter((row) => !known.has(rowKey(row)))];
  }, [timesheet, extraRows]);

  const copyPreviousWeek = async () => {
    if (!userId) return;
    try {
      const previous = await timeTrackingService.getTimesheet(workspaceSlug, userId, addDaysToISODate(weekStart, -7));
      if (!previous.rows.length) {
        setToast({ type: TOAST_TYPE.INFO, title: t("time-tracking.timesheet.no_previous_rows") });
        return;
      }
      setExtraRows((current) => [
        ...current,
        ...previous.rows.map(({ project_id, issue_id, issue_detail, project_detail }) => ({
          project_id,
          issue_id,
          issue_detail,
          project_detail,
        })),
      ]);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("time-tracking.errors.generic") });
    }
  };

  const projectName = (row: TRowSkeleton) => row.project_detail?.name ?? getProjectById(row.project_id)?.name ?? "";

  return (
    <div className="flex flex-col gap-4 px-page-x py-4">
      {/* top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <MemberDropdown
            value={userId ?? null}
            multiple={false}
            memberIds={workspaceMemberIds ?? []}
            onChange={(value) => value && setUserId(value)}
            buttonVariant="border-with-text"
            buttonClassName="h-7"
            placeholder={t("time-tracking.timesheet.person")}
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t("time-tracking.timesheet.previous_week")}
              onClick={() => setWeekStart(addDaysToISODate(weekStart, -7))}
              className="flex size-7 items-center justify-center rounded-md text-secondary hover:bg-layer-transparent-hover"
            >
              <ChevronLeft className="size-4" />
            </button>
            <Button variant="secondary" size="lg" onClick={() => setWeekStart(getWeekStartDate(today, startOfWeek))}>
              {t("time-tracking.timesheet.this_week")}
            </Button>
            <button
              type="button"
              aria-label={t("time-tracking.timesheet.next_week")}
              onClick={() => setWeekStart(addDaysToISODate(weekStart, 7))}
              className="flex size-7 items-center justify-center rounded-md text-secondary hover:bg-layer-transparent-hover"
            >
              <ChevronRight className="size-4" />
            </button>
            <DateDropdown
              value={getDateFromISODate(weekStart)}
              onChange={(date) => date && setWeekStart(getWeekStartDate(getISODate(date), startOfWeek))}
              buttonVariant="border-with-text"
              buttonClassName="h-7"
              formatToken="MMM d, yyyy"
            />
          </div>
          {!isCurrentUser && forOthersProjectIds.length === 0 && (
            <span className="text-13 text-tertiary">{t("time-tracking.timesheet.read_only")}</span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-13 text-tertiary">{t("time-tracking.timesheet.week_total")}</span>
          <span className="text-16 font-semibold text-primary tabular-nums">
            {formatTimeDuration(timesheet?.total_seconds ?? 0, "clock")}
          </span>
        </div>
      </div>

      {/* grid */}
      {isLoading && !timesheet ? (
        <TimeTrackingRowsLoader />
      ) : (
        <div className="overflow-x-auto rounded-md border-[0.5px] border-subtle">
          <table className="w-full min-w-[900px] border-collapse text-13">
            <thead>
              <tr className="border-b border-subtle text-tertiary">
                <th className="h-9 px-3 text-left font-medium">{t("time-tracking.timesheet.project_work_item")}</th>
                {days.map((day) => {
                  const weekday = getDateFromISODate(day).getDay();
                  return (
                    <th
                      key={day}
                      className={cn("w-24 border-l border-subtle px-2 text-right font-medium", {
                        "bg-accent-subtle/30 text-accent-primary": day === today,
                        "text-placeholder": (weekday === 0 || weekday === 6) && day !== today,
                      })}
                    >
                      {renderFormattedDate(day, "EEE d")}
                    </th>
                  );
                })}
                <th className="w-24 border-l border-subtle px-2 text-right font-medium">
                  {t("time-tracking.timesheet.total")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={days.length + 2} className="px-3 py-6 text-center text-tertiary">
                    {t("time-tracking.timesheet.empty")}
                  </td>
                </tr>
              )}
              {rows.map((row) => {
                const serverRow = timesheet?.rows.find((item) => rowKey(item) === rowKey(row));
                return (
                  <tr key={rowKey(row)} className="border-b border-subtle">
                    <td className="max-w-80 px-3">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="flex-shrink-0 text-secondary">{projectName(row)}</span>
                        <span className="text-placeholder">·</span>
                        {row.issue_detail ? (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span className="flex-shrink-0 text-tertiary">{getWorkItemKey(row.issue_detail)}</span>
                            <span className="truncate text-primary">{row.issue_detail.name}</span>
                          </span>
                        ) : (
                          <span className="text-tertiary italic">{t("time-tracking.project_time")}</span>
                        )}
                      </span>
                    </td>
                    {days.map((day) => {
                      const weekday = getDateFromISODate(day).getDay();
                      return (
                        <TimesheetCell
                          key={day}
                          workspaceSlug={workspaceSlug}
                          userId={userId ?? ""}
                          isCurrentUser={isCurrentUser}
                          row={row}
                          day={day}
                          cell={serverRow?.cells[day]}
                          canCreate={canCreateIn(row.project_id) && day <= today && !row.issue_detail?.is_archived}
                          isToday={day === today}
                          isWeekend={weekday === 0 || weekday === 6}
                        />
                      );
                    })}
                    <td className="border-l border-subtle px-2 text-right font-medium tabular-nums">
                      {serverRow?.total_seconds ? formatTimeDuration(serverRow.total_seconds, "clock") : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-layer-1 font-medium">
                <td className="h-9 px-3">{t("time-tracking.timesheet.day_total")}</td>
                {days.map((day) => (
                  <td key={day} className="border-l border-subtle px-2 text-right tabular-nums">
                    {timesheet?.day_totals[day] ? formatTimeDuration(timesheet.day_totals[day], "clock") : ""}
                  </td>
                ))}
                <td className="border-l border-subtle px-2 text-right tabular-nums">
                  {formatTimeDuration(timesheet?.total_seconds ?? 0, "clock")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* rows */}
      {(isCurrentUser ? ownProjectIds : forOthersProjectIds).length > 0 && (
        <div className="flex items-center gap-2">
          <AddRowPopover
            workspaceSlug={workspaceSlug}
            projectIds={isCurrentUser ? ownProjectIds : forOthersProjectIds}
            onAdd={(row) => setExtraRows((current) => [...current, row])}
          />
          <Button variant="ghost" size="lg" prependIcon={<Copy />} onClick={() => void copyPreviousWeek()}>
            {t("time-tracking.timesheet.copy_previous_week")}
          </Button>
        </div>
      )}
    </div>
  );
});

/** Pick a project and an optional work item for a new (client-only) timesheet row. */
const AddRowPopover = observer(function AddRowPopover(props: {
  workspaceSlug: string;
  projectIds: string[];
  onAdd: (row: TRowSkeleton) => void;
}) {
  const { workspaceSlug, projectIds, onAdd } = props;
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [issue, setIssue] = useState<TWorkItemSelectOption | null>(null);

  const add = () => {
    if (!projectId) return;
    onAdd({
      project_id: projectId,
      issue_id: issue?.id ?? null,
      issue_detail: issue ? { ...issue, state_group: null, is_archived: false } : null,
    });
    setIsOpen(false);
    setProjectId(null);
    setIssue(null);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-13 text-secondary hover:bg-layer-transparent-hover">
        <Plus className="size-3.5" />
        {t("time-tracking.timesheet.add_row")}
      </Popover.Button>
      <Popover.Panel
        positionerClassName="z-[60]"
        side="bottom"
        align="start"
        className="z-30 flex w-80 flex-col gap-2 rounded-md border-[0.5px] border-strong bg-surface-1 p-3 shadow-raised-200"
      >
        <ProjectDropdownBase
          value={projectId}
          multiple={false}
          onChange={(value) => {
            setProjectId(value);
            setIssue(null);
          }}
          projectIds={projectIds}
          getProjectById={getProjectById}
          buttonVariant="border-with-text"
          buttonContainerClassName="w-full text-left"
          buttonClassName="h-8 w-full justify-start"
          placeholder={t("time-tracking.log_time.project")}
          dropdownArrow
        />
        <WorkItemSelect
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          value={issue?.id ?? null}
          initialOption={issue}
          onChange={(_, option) => setIssue(option)}
        />
        <Button variant="primary" size="lg" disabled={!projectId} onClick={add}>
          {t("time-tracking.timesheet.add_row")}
        </Button>
      </Popover.Panel>
    </Popover>
  );
});
