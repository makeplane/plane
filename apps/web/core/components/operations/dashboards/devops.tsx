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
import { operationsService } from "@/services/operations";
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
  formatDateTime,
} from "../common";
import { DEPLOYMENT_ENVIRONMENT_LABEL, DEPLOYMENT_STATUS_CLASS, DEPLOYMENT_STATUS_LABEL } from "../constants";

type Props = { workspaceSlug: string; projectId?: string };

/** The release queue and what happened to the last releases. */
export const DevOpsDashboard = observer(function DevOpsDashboard({ workspaceSlug, projectId }: Props) {
  const { getProjectById } = useProject();

  const { data, error, isLoading } = useSWR(
    workspaceSlug ? ["operations-dashboard-devops", workspaceSlug, projectId] : null,
    () => operationsService.getDevOpsDashboard(workspaceSlug, { project_id: projectId }),
    { revalidateOnFocus: false }
  );

  if (isLoading) return <LoadingPanel label="Loading deployments" />;
  if (error || !data) return <ErrorPanel />;

  return (
    <div className="flex flex-col gap-4">
      <TileGrid>
        <StatTile
          label="Release queue"
          value={data.release_queue.count}
          tone={data.release_queue.count > 0 ? "warning" : "default"}
        />
        <StatTile label="Pending deploys" value={data.pending_deployments} />
        <StatTile label="Production (30d)" value={data.production_releases_30d} tone="positive" />
        <StatTile label="Failed (30d)" value={data.failed_30d} tone={data.failed_30d > 0 ? "danger" : "default"} />
        <StatTile
          label="Rollbacks (30d)"
          value={data.rollbacks_30d}
          tone={data.rollbacks_30d > 0 ? "danger" : "default"}
        />
        <StatTile label="Frequency" value={data.deployment_frequency_per_week} hint="Successful deploys per week" />
      </TileGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section
          title="Release queue"
          description="Passed QA and waiting to go out"
          action={
            <Link href={`/${workspaceSlug}/operations/deployments`}>
              <Button variant="secondary" size="sm">
                Deployments
              </Button>
            </Link>
          }
        >
          {data.release_queue.items.length === 0 ? (
            <EmptyPanel label="Nothing is waiting on a release" />
          ) : (
            <ul>
              {data.release_queue.items.map((issue) => {
                const project = getProjectById(issue.project_id);
                return (
                  <li
                    key={issue.id}
                    className="flex items-center justify-between gap-3 border-b border-subtle py-2 last:border-0"
                  >
                    <Link
                      href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
                      className="flex min-w-0 items-center gap-2 hover:underline"
                    >
                      <span className="shrink-0 text-11 text-placeholder">
                        {project?.identifier ?? "--"}-{issue.sequence_id}
                      </span>
                      <span className="truncate text-13 text-secondary">{issue.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Recent deployments">
          {data.history.length === 0 ? (
            <EmptyPanel label="No deployments recorded yet" />
          ) : (
            <ul>
              {data.history.map((deployment) => (
                <li
                  key={deployment.id}
                  className="flex flex-col gap-1 border-b border-subtle py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-13 font-medium text-primary">{deployment.version}</span>
                    <span className="truncate text-11 text-placeholder">
                      {getProjectById(deployment.project)?.name ?? "Project"} ·{" "}
                      {DEPLOYMENT_ENVIRONMENT_LABEL[deployment.environment]}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Pill className={DEPLOYMENT_STATUS_CLASS[deployment.status]}>
                      {DEPLOYMENT_STATUS_LABEL[deployment.status]}
                    </Pill>
                    <span className="text-11 text-placeholder">
                      {formatDateTime(deployment.completed_at ?? deployment.created_at)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="By environment">
          <BarList
            rows={Object.entries(data.by_environment).map(([environment, count]) => ({
              label:
                DEPLOYMENT_ENVIRONMENT_LABEL[environment as keyof typeof DEPLOYMENT_ENVIRONMENT_LABEL] ?? environment,
              value: count,
            }))}
            emptyLabel="No deployments recorded yet"
          />
        </Section>

        <Section title="By status">
          <BarList
            rows={Object.entries(data.by_status).map(([status, count]) => ({
              label: DEPLOYMENT_STATUS_LABEL[status as keyof typeof DEPLOYMENT_STATUS_LABEL] ?? status,
              value: count,
            }))}
            emptyLabel="No deployments recorded yet"
          />
        </Section>
      </div>
    </div>
  );
});
