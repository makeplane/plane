/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
// services
import { operationsService, type TTeamAvailability } from "@/services/operations";
// local imports
import {
  BarList,
  EmptyPanel,
  ErrorPanel,
  LoadingPanel,
  Section,
  Sparkline,
  StatTile,
  TileGrid,
  formatHours,
  formatTime,
} from "../common";
import { OperationsMember } from "../member";

type Props = { workspaceSlug: string; projectId?: string };

/**
 * The project manager's single screen.
 *
 * Two requests: one for everything Workspaces knows, one for who is checked in.
 * They are separate because the second talks to Odoo and can be slow or
 * absent, and a dashboard that waits on an external system to render its own
 * data is a dashboard that feels broken whenever that system is.
 */
export const PMDashboard = observer(function PMDashboard({ workspaceSlug, projectId }: Props) {
  const { getUserDetails } = useMember();
  const { getProjectById } = useProject();

  const { data, error, isLoading } = useSWR(
    workspaceSlug ? ["operations-dashboard-pm", workspaceSlug, projectId] : null,
    () => operationsService.getPMDashboard(workspaceSlug, { project_id: projectId }),
    { revalidateOnFocus: false }
  );

  const { data: availability } = useSWR<TTeamAvailability>(
    workspaceSlug ? ["operations-team-availability", workspaceSlug] : null,
    () => operationsService.getTeamAvailability(workspaceSlug),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  if (isLoading) return <LoadingPanel label="Building the dashboard" />;
  if (error || !data) return <ErrorPanel />;

  const { sprint, team, delivery, quality, capacity, operations } = data;
  const attendanceAvailable = availability?.available === true;

  return (
    <div className="flex flex-col gap-4">
      <TileGrid>
        <StatTile label="In progress" value={delivery.in_progress} />
        <StatTile
          label="Waiting QA"
          value={delivery.waiting_qa}
          tone={delivery.waiting_qa > 0 ? "warning" : "default"}
        />
        <StatTile label="Waiting deploy" value={delivery.waiting_deployment} />
        <StatTile label="Blocked" value={delivery.blocked} tone={delivery.blocked > 0 ? "danger" : "default"} />
        <StatTile label="Overdue" value={delivery.overdue} tone={delivery.overdue > 0 ? "danger" : "default"} />
        <StatTile label="Deployed" value={delivery.deployed} tone="positive" />
      </TileGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section
          title="Sprint"
          description={
            sprint.active_cycles.length > 0
              ? sprint.active_cycles
                  .map((cycle) => `${getProjectById(cycle.project_id)?.name ?? "Project"} · ${cycle.name}`)
                  .join("  |  ")
              : "No cycle is running right now"
          }
        >
          {sprint.active_cycles.length === 0 ? (
            <EmptyPanel label="Start a cycle to see sprint progress here" />
          ) : (
            <div className="flex flex-col gap-4">
              <TileGrid className="xl:grid-cols-4">
                <StatTile label="Scope" value={sprint.total} />
                <StatTile label="Completed" value={sprint.completed} tone="positive" />
                <StatTile label="Remaining" value={sprint.remaining} />
                <StatTile
                  label="Carry-over"
                  value={sprint.carry_over}
                  tone={sprint.carry_over > 0 ? "warning" : "default"}
                  hint="Started before this cycle"
                />
              </TileGrid>
              {sprint.burndown && sprint.burndown.length > 1 && (
                <Sparkline
                  label="Remaining work"
                  points={sprint.burndown.map((point) => ({ date: point.date, value: point.remaining }))}
                />
              )}
            </div>
          )}
        </Section>

        <Section
          title="Team"
          description={
            attendanceAvailable
              ? `${team.work_logs_filed} of ${team.total} filed a work log today`
              : "Work logs from Workspaces; attendance from Odoo"
          }
        >
          <div className="flex flex-col gap-4">
            <TileGrid className="xl:grid-cols-4">
              <StatTile label="Members" value={team.total} />
              <StatTile label="Logs filed" value={team.work_logs_filed} tone="positive" />
              <StatTile
                label="Checked in"
                value={availability?.available ? availability.checked_in : "--"}
                hint={availability?.available ? undefined : "Odoo unavailable"}
              />
              <StatTile
                label="Missing logs"
                value={team.missing_work_logs.length}
                tone={team.missing_work_logs.length > 0 ? "warning" : "positive"}
              />
            </TileGrid>

            {team.missing_work_logs.length > 0 && (
              <div>
                <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">Has not filed today</p>
                <ul className="flex flex-wrap gap-2">
                  {team.missing_work_logs.map((member) => (
                    <li
                      key={member.member_id}
                      className="flex items-center gap-1.5 rounded-full border border-subtle px-2 py-1"
                    >
                      <OperationsMember
                        memberId={member.member_id}
                        fallbackName={member.display_name}
                        fallbackAvatarUrl={member.avatar_url}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>

        <Section title="Quality" description="Bugs, hotfixes and work QA has sent back">
          <TileGrid className="xl:grid-cols-3">
            <StatTile
              label="Open bugs"
              value={quality.open_bugs}
              tone={quality.open_bugs > 0 ? "warning" : "default"}
            />
            <StatTile label="Hotfixes" value={quality.hotfixes} />
            <StatTile
              label="QA failures (30d)"
              value={quality.qa_failures_30d}
              tone={quality.qa_failures_30d > 0 ? "danger" : "positive"}
              hint="Moved from QA back to development"
            />
          </TileGrid>
        </Section>

        <Section title="Capacity" description={`${capacity.wip_total} items in flight`}>
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">Work in progress</p>
              <BarList
                rows={capacity.workload.map((row) => ({
                  label: getUserDetails(row.member_id)?.display_name ?? row.display_name ?? "Member",
                  value: row.wip,
                }))}
                emptyLabel="Nobody has work in progress"
              />
            </div>
            <div>
              <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">Where the queue sits</p>
              <BarList rows={capacity.bottlenecks.map((row) => ({ label: row.stage, value: row.count }))} />
            </div>
            {capacity.unassigned > 0 && (
              <p className="text-11 text-warning-primary">{capacity.unassigned} in-flight items have no assignee.</p>
            )}
          </div>
        </Section>

        <Section title="Operations requests" description="Requests that have not yet become work items">
          <div className="flex flex-col gap-4">
            <TileGrid className="xl:grid-cols-4">
              <StatTile label="Open" value={operations.pending} />
              <StatTile
                label="Waiting review"
                value={operations.waiting_pm_review}
                tone={operations.waiting_pm_review > 0 ? "warning" : "default"}
              />
              <StatTile label="Need info" value={operations.need_information} />
              <StatTile
                label="Ready to convert"
                value={operations.waiting_conversion}
                tone={operations.waiting_conversion > 0 ? "positive" : "default"}
              />
            </TileGrid>
            <BarList
              rows={Object.entries(operations.by_source).map(([source, count]) => ({
                label: source.charAt(0).toUpperCase() + source.slice(1),
                value: count,
              }))}
              emptyLabel="No requests filed yet"
            />
          </div>
        </Section>

        {availability?.available && (
          <Section
            title="Attendance right now"
            description={`${availability.checked_in} checked in · ${availability.not_checked_in} not · ${availability.unlinked} not linked to Odoo`}
          >
            <ul className="flex flex-col gap-1.5">
              {availability.members.map((member) => (
                <li key={member.member_id} className="flex items-center justify-between gap-3 text-13">
                  <OperationsMember
                    memberId={member.member_id}
                    fallbackName={member.display_name}
                    fallbackAvatarUrl={member.avatar_url}
                  />
                  <span className="shrink-0 text-11 text-placeholder">
                    {!member.linked
                      ? "Not linked"
                      : member.checked_in
                        ? `In since ${formatTime(member.check_in)} · ${formatHours(member.worked_hours_today)}`
                        : "Not checked in"}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
});
