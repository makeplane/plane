/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
// workspaces imports
import { Button } from "@workspaces/propel/button";
// hooks
import { useProject } from "@/hooks/store/use-project";
// services
import attendanceService, { type TAttendanceStatus } from "@/services/attendance.service";
import { operationsService, type TDeveloperDashboardIssue } from "@/services/operations";
// local imports
import {
  BarList,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  Pill,
  Section,
  StatTile,
  TileGrid,
  formatDate,
  formatHours,
} from "../common";

type Props = { workspaceSlug: string; projectId?: string };

/** A work item row, linked through to the Workspaces work item page. */
const IssueRow = observer(function IssueRow({
  workspaceSlug,
  issue,
}: {
  workspaceSlug: string;
  issue: TDeveloperDashboardIssue;
}) {
  const { getProjectById } = useProject();
  const project = getProjectById(issue.project_id);

  return (
    <li className="flex items-center justify-between gap-3 border-b border-subtle py-2 last:border-0">
      <Link
        href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
        className="flex min-w-0 items-center gap-2 hover:underline"
      >
        <span className="shrink-0 text-11 text-placeholder">
          {project?.identifier ?? "--"}-{issue.sequence_id}
        </span>
        <span className="truncate text-13 text-secondary">{issue.name}</span>
      </Link>
      {issue.target_date && (
        <Pill
          className={new Date(issue.target_date) < new Date() ? "bg-danger-primary/15 text-danger-primary" : undefined}
        >
          {formatDate(issue.target_date)}
        </Pill>
      )}
    </li>
  );
});

/**
 * One developer's day, in one screen.
 *
 * The attendance tile reads the same endpoint as the navbar control, so the
 * two never disagree; it is a separate request because Odoo may be absent and
 * the rest of the screen must not wait on it.
 */
export const DeveloperDashboard = observer(function DeveloperDashboard({ workspaceSlug, projectId }: Props) {
  const { data, error, isLoading } = useSWR(
    workspaceSlug ? ["operations-dashboard-developer", workspaceSlug, projectId] : null,
    () => operationsService.getDeveloperDashboard(workspaceSlug, { project_id: projectId }),
    { revalidateOnFocus: false }
  );

  const { data: attendance } = useSWR<TAttendanceStatus>("ATTENDANCE_STATUS", () => attendanceService.getStatus(), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  if (isLoading) return <LoadingPanel label="Loading your work" />;
  if (error || !data) return <ErrorPanel />;

  const { assigned, current_sprint, modules, in_progress, blocked, overdue, recently_completed, work_log, weekly } =
    data;

  return (
    <div className="flex flex-col gap-4">
      <TileGrid>
        <StatTile label="Assigned" value={assigned.total} hint="Open work items" />
        <StatTile label="In progress" value={in_progress.length} />
        <StatTile label="Blocked" value={blocked.length} tone={blocked.length > 0 ? "danger" : "default"} />
        <StatTile label="Overdue" value={overdue} tone={overdue > 0 ? "danger" : "default"} />
        <StatTile label="Done this week" value={weekly.completed} tone="positive" />
        <StatTile
          label="Today"
          value={attendance?.available ? formatHours(attendance.worked_hours_today ?? 0) : "--"}
          hint={
            attendance?.available ? (attendance.checked_in ? "Checked in" : "Not checked in") : "Attendance unavailable"
          }
          tone={attendance?.available && attendance.checked_in ? "positive" : "default"}
        />
      </TileGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section
          title="Today's work log"
          description={work_log.today_filed ? "Filed" : "Not filed yet"}
          action={
            <Link href={`/${workspaceSlug}/operations/work-logs`}>
              <Button variant={work_log.today_filed ? "secondary" : "primary"} size="sm">
                {work_log.today_filed ? "View" : "Write it"}
              </Button>
            </Link>
          }
        >
          <TileGrid className="xl:grid-cols-3">
            <StatTile
              label="Today"
              value={work_log.today_filed ? "Filed" : "Missing"}
              tone={work_log.today_filed ? "positive" : "warning"}
            />
            <StatTile label="This week" value={`${work_log.week_filed} filed`} />
            <StatTile label="Hours logged" value={formatHours(work_log.week_hours)} hint="This week" />
          </TileGrid>
        </Section>

        <Section title="Current sprint" description={`${current_sprint.completed} of ${current_sprint.total} done`}>
          {current_sprint.cycles.length === 0 ? (
            <EmptyPanel label="None of your work is in a running cycle" />
          ) : (
            <BarList
              rows={current_sprint.cycles.map((cycle) => ({
                label: cycle["issue_cycle__cycle__name"],
                value: cycle.count,
              }))}
            />
          )}
        </Section>

        <Section title="In progress" description="Work items in a developer-owned state">
          {in_progress.length === 0 ? (
            <EmptyPanel label="Nothing in progress" />
          ) : (
            <ul>
              {in_progress.map((issue) => (
                <IssueRow key={issue.id} workspaceSlug={workspaceSlug} issue={issue} />
              ))}
            </ul>
          )}
        </Section>

        <Section title="Blocked" description="On hold and waiting on something">
          {blocked.length === 0 ? (
            <EmptyPanel label="Nothing is blocked" />
          ) : (
            <ul>
              {blocked.map((issue) => (
                <IssueRow key={issue.id} workspaceSlug={workspaceSlug} issue={issue} />
              ))}
            </ul>
          )}
        </Section>

        <Section title="Your modules" description="Where your open work sits">
          <BarList
            rows={modules.map((module) => ({
              label: module["issue_module__module__name"],
              value: module.count,
            }))}
            emptyLabel="None of your open work is filed under a module"
          />
        </Section>

        <Section title="Recently completed">
          {recently_completed.length === 0 ? (
            <EmptyPanel label="Nothing completed yet" />
          ) : (
            <ul>
              {recently_completed.map((issue) => (
                <IssueRow key={issue.id} workspaceSlug={workspaceSlug} issue={issue} />
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
});
