/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Engineering analytics.
 *
 * Every number here comes from work the team already does — issue transitions,
 * cycles, deployments, work logs — so nothing has to be filled in to keep the
 * charts honest. Where a metric could be defined more than one way, the API
 * returns its definition and this screen prints it next to the number.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// workspaces imports
import { cn } from "@workspaces/utils";
// services
import { operationsService } from "@/services/operations";
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
  daysAgo,
  formatDays,
  formatPercent,
  toISODate,
} from "./common";
import { OperationsMember } from "./member";

const PERIODS = [
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
  { key: 90, label: "90 days" },
] as const;

function Definitions({ definitions }: { definitions: Record<string, string> }) {
  const entries = Object.entries(definitions);
  if (entries.length === 0) return null;
  return (
    <details className="mt-3 rounded-md border border-subtle bg-layer-2 p-3">
      <summary className="cursor-pointer text-11 font-medium tracking-wide text-tertiary uppercase">
        What these numbers count
      </summary>
      <dl className="mt-2 flex flex-col gap-2">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-11 font-medium text-secondary">{key.replace(/_/g, " ")}</dt>
            <dd className="text-11 text-placeholder">{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export const OperationsAnalytics = observer(function OperationsAnalytics({
  workspaceSlug,
  projectId,
}: {
  workspaceSlug: string;
  projectId?: string;
}) {
  const [days, setDays] = useState<number>(30);
  const query = { days, project_id: projectId };

  const delivery = useSWR(
    workspaceSlug ? ["operations-analytics-delivery", workspaceSlug, days, projectId] : null,
    () => operationsService.getDeliveryAnalytics(workspaceSlug, query),
    { revalidateOnFocus: false }
  );
  const quality = useSWR(
    workspaceSlug ? ["operations-analytics-quality", workspaceSlug, days, projectId] : null,
    () => operationsService.getQualityAnalytics(workspaceSlug, query),
    { revalidateOnFocus: false }
  );
  const productivity = useSWR(
    workspaceSlug ? ["operations-analytics-productivity", workspaceSlug, days, projectId] : null,
    () => operationsService.getProductivityAnalytics(workspaceSlug, query),
    { revalidateOnFocus: false }
  );
  const team = useSWR(
    workspaceSlug ? ["operations-analytics-team", workspaceSlug, days, projectId] : null,
    () => operationsService.getTeamAnalytics(workspaceSlug, query),
    { revalidateOnFocus: false }
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-11 font-medium tracking-wide text-tertiary uppercase">Period</span>
        {PERIODS.map((period) => (
          <button
            key={period.key}
            type="button"
            onClick={() => setDays(period.key)}
            className={cn(
              "rounded-full px-3 py-1 text-11 font-medium transition-colors",
              days === period.key
                ? "bg-accent-primary text-on-color"
                : "bg-layer-3 text-secondary hover:bg-layer-3-hover"
            )}
          >
            {period.label}
          </button>
        ))}
        <span className="ml-auto text-11 text-placeholder">
          {daysAgo(days - 1)} — {toISODate(new Date())}
        </span>
      </div>

      <Section title="Delivery" description="How long work takes and how much of it lands">
        {delivery.isLoading ? (
          <LoadingPanel />
        ) : delivery.error || !delivery.data ? (
          <ErrorPanel />
        ) : (
          <div className="flex flex-col gap-4">
            <TileGrid className="xl:grid-cols-5">
              <StatTile label="Lead time" value={formatDays(delivery.data.lead_time_days)} hint="Created to done" />
              <StatTile label="Cycle time" value={formatDays(delivery.data.cycle_time_days)} hint="Picked up to done" />
              <StatTile label="Throughput" value={delivery.data.throughput.total} hint="Items completed" />
              <StatTile label="Per week" value={delivery.data.throughput.per_week} />
              <StatTile
                label="Deploys / week"
                value={delivery.data.deployment_frequency.per_week}
                hint={`${delivery.data.deployment_frequency.total} in the period`}
              />
            </TileGrid>

            <Sparkline
              label="Completed per day"
              points={delivery.data.throughput.series.map((point) => ({ date: point.date, value: point.count }))}
            />

            <div>
              <p className="mb-2 text-11 font-medium tracking-wide text-tertiary uppercase">
                Velocity by cycle {delivery.data.velocity.average !== null && `(avg ${delivery.data.velocity.average})`}
              </p>
              <BarList
                rows={delivery.data.velocity.cycles.map((cycle) => ({
                  label: cycle.name,
                  value: cycle.completed,
                  hint: `of ${cycle.total}`,
                }))}
                emptyLabel="No cycles closed in this period"
              />
            </div>

            <Definitions definitions={delivery.data.definitions} />
          </div>
        )}
      </Section>

      <Section title="Quality" description="Bugs, reopens and what escaped to production">
        {quality.isLoading ? (
          <LoadingPanel />
        ) : quality.error || !quality.data ? (
          <ErrorPanel />
        ) : (
          <div className="flex flex-col gap-4">
            <TileGrid className="xl:grid-cols-5">
              <StatTile
                label="Bug rate"
                value={formatPercent(quality.data.bug_rate, 1)}
                hint={`${quality.data.bug_count} of ${quality.data.created_total}`}
                tone={(quality.data.bug_rate ?? 0) > 0.3 ? "warning" : "default"}
              />
              <StatTile label="Hotfixes" value={quality.data.hotfix_count} />
              <StatTile
                label="Reopened rate"
                value={formatPercent(quality.data.reopened_rate, 1)}
                hint={`${quality.data.reopened_count} of ${quality.data.reached_qa} that reached QA`}
                tone={(quality.data.reopened_rate ?? 0) > 0.2 ? "danger" : "default"}
              />
              <StatTile
                label="Escaped bugs"
                value={quality.data.escaped_bugs}
                tone={quality.data.escaped_bugs > 0 ? "danger" : "positive"}
              />
              <StatTile label="Raised" value={quality.data.created_total} />
            </TileGrid>

            <BarList
              rows={Object.entries(quality.data.by_type).map(([type, count]) => ({ label: type, value: count }))}
              emptyLabel="Nothing raised in this period"
            />

            <Definitions definitions={quality.data.definitions} />
          </div>
        )}
      </Section>

      <Section title="Productivity" description="Completion and work log discipline, per person">
        {productivity.isLoading ? (
          <LoadingPanel />
        ) : productivity.error || !productivity.data ? (
          <ErrorPanel />
        ) : (
          <div className="flex flex-col gap-4">
            <TileGrid className="xl:grid-cols-4">
              <StatTile label="Completed" value={productivity.data.completed_total} />
              <StatTile
                label="Average time"
                value={formatDays(productivity.data.average_completion_days)}
                hint="Created to done"
              />
              <StatTile label="In flight" value={productivity.data.wip_total} />
              <StatTile label="Working days" value={productivity.data.expected_work_log_days} />
            </TileGrid>

            {productivity.data.members.length === 0 ? (
              <EmptyPanel label="No members to report on" />
            ) : (
              <div className="-mx-4 overflow-x-auto px-4">
                <table className="w-full min-w-[560px] text-13">
                  <thead>
                    <tr className="text-11 tracking-wide text-tertiary uppercase">
                      <th className="py-2 text-left font-medium">Member</th>
                      <th className="py-2 text-right font-medium">Completed</th>
                      <th className="py-2 text-right font-medium">In flight</th>
                      <th className="py-2 text-right font-medium">Logs filed</th>
                      <th className="py-2 text-right font-medium">Log completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productivity.data.members.map((member) => (
                      <tr key={member.member_id} className="border-t border-subtle">
                        <td className="py-2">
                          <OperationsMember
                            memberId={member.member_id}
                            fallbackName={member.display_name}
                            fallbackAvatarUrl={member.avatar_url}
                          />
                        </td>
                        <td className="py-2 text-right text-secondary tabular-nums">{member.completed}</td>
                        <td className="py-2 text-right text-secondary tabular-nums">{member.wip}</td>
                        <td className="py-2 text-right text-secondary tabular-nums">{member.work_logs_filed}</td>
                        <td
                          className={cn(
                            "py-2 text-right tabular-nums",
                            (member.work_log_completion ?? 1) < 0.6 ? "text-warning-primary" : "text-secondary"
                          )}
                        >
                          {formatPercent(member.work_log_completion)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Definitions definitions={productivity.data.definitions} />
          </div>
        )}
      </Section>

      <Section title="Team" description="Availability and load">
        {team.isLoading ? (
          <LoadingPanel />
        ) : team.error || !team.data ? (
          <ErrorPanel />
        ) : (
          <div className="flex flex-col gap-4">
            <TileGrid className="xl:grid-cols-3">
              <StatTile label="Members" value={team.data.member_count} />
              <StatTile
                label="Unassigned open work"
                value={team.data.unassigned_open}
                tone={team.data.unassigned_open > 0 ? "warning" : "default"}
              />
              <StatTile
                label="Attendance trends"
                value={team.data.attendance.available ? "Available" : "Not available"}
                hint={team.data.attendance.reason}
              />
            </TileGrid>

            <BarList
              rows={team.data.members.map((member) => ({
                label: member.display_name ?? "Member",
                value: member.open_assigned,
                hint: `${member.logged_hours}h`,
              }))}
              emptyLabel="No members to report on"
            />
          </div>
        )}
      </Section>
    </div>
  );
});
