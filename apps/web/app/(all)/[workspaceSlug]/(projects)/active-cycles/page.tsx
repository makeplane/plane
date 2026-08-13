/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Button } from "@plane/propel/button";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { AlertCircle, CalendarDays, Folder } from "lucide-react";
import type { ICycle, IWorkspaceActiveCyclesResponse } from "@plane/types";
import { CircularProgressIndicator, ContentWrapper, Loader } from "@plane/ui";
import { calculateCycleProgress, renderFormattedDate } from "@plane/utils";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAppRouter } from "@/hooks/use-app-router";
import { CycleService } from "@/services/cycle.service";

const ACTIVE_CYCLES_PER_PAGE = 20;
const FIRST_ACTIVE_CYCLES_CURSOR = `${ACTIVE_CYCLES_PER_PAGE}:0:0`;
const ACTIVE_CYCLES_LOADER_ROWS = [
  "active-cycle-loader-1",
  "active-cycle-loader-2",
  "active-cycle-loader-3",
  "active-cycle-loader-4",
  "active-cycle-loader-5",
];

const cycleService = new CycleService();

function ActiveCyclesLoader() {
  return (
    <Loader className="space-y-3 p-6">
      {ACTIVE_CYCLES_LOADER_ROWS.map((rowKey) => (
        <Loader.Item key={rowKey} height="72px" />
      ))}
    </Loader>
  );
}

function ActiveCycleListItem({ cycle, workspaceSlug }: { cycle: ICycle; workspaceSlug: string }) {
  const router = useAppRouter();
  const progress = calculateCycleProgress(cycle);
  const projectName = cycle.project_detail?.name ?? "Project";
  const projectIdentifier = cycle.project_detail?.identifier;

  return (
    <button
      type="button"
      onClick={() => router.push(`/${workspaceSlug}/projects/${cycle.project_id}/cycles/${cycle.id}`)}
      className="flex w-full flex-col gap-4 rounded-lg border border-subtle bg-surface-1 p-4 text-left transition-colors hover:bg-surface-2 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex min-w-0 items-start gap-4">
        <CircularProgressIndicator size={36} percentage={progress} strokeWidth={3}>
          <span className="text-9 text-primary">{`${progress}%`}</span>
        </CircularProgressIndicator>
        <div className="min-w-0 space-y-1">
          <h2 className="text-15 truncate font-semibold text-primary">{cycle.name}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-12 text-tertiary">
            <span className="inline-flex items-center gap-1">
              <Folder className="size-3.5" aria-hidden="true" />
              {projectIdentifier ? `${projectIdentifier} · ${projectName}` : projectName}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {cycle.start_date ? renderFormattedDate(cycle.start_date) : "No start date"} -{" "}
              {cycle.end_date ? renderFormattedDate(cycle.end_date) : "No end date"}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-right text-12 text-tertiary md:min-w-56">
        <span>
          <strong className="block text-14 text-primary">{cycle.total_issues ?? 0}</strong>
          Total
        </span>
        <span>
          <strong className="block text-14 text-primary">{cycle.completed_issues ?? 0}</strong>
          Done
        </span>
        <span>
          <strong className="block text-14 text-primary">{cycle.started_issues ?? 0}</strong>
          Started
        </span>
      </div>
    </button>
  );
}

function WorkspaceActiveCyclesPage() {
  const { currentWorkspace } = useWorkspace();
  const [cycles, setCycles] = useState<ICycle[]>([]);
  const [pagination, setPagination] = useState<IWorkspaceActiveCyclesResponse | undefined>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // derived values
  const workspaceSlug = currentWorkspace?.slug;
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Active Cycles` : undefined;
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug ? `WORKSPACE_ACTIVE_CYCLES_${workspaceSlug}_${FIRST_ACTIVE_CYCLES_CURSOR}` : null,
    () => cycleService.workspaceActiveCycles(workspaceSlug ?? "", FIRST_ACTIVE_CYCLES_CURSOR, ACTIVE_CYCLES_PER_PAGE)
  );

  useEffect(() => {
    if (!data) return;
    setCycles(data.results);
    setPagination(data);
  }, [data]);

  const handleLoadMore = async () => {
    if (!workspaceSlug || !pagination?.next_page_results || !pagination.next_cursor) return;

    setIsLoadingMore(true);
    try {
      const nextPage = await cycleService.workspaceActiveCycles(
        workspaceSlug,
        pagination.next_cursor,
        ACTIVE_CYCLES_PER_PAGE
      );
      setCycles((currentCycles) => [...currentCycles, ...nextPage.results]);
      setPagination(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <>
      <PageHead title={pageTitle} />
      <ContentWrapper className="py-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-primary">Active Cycles</h1>
            <p className="text-14 text-secondary">
              Running cycles from projects you can access. Projects with cycles disabled are excluded.
            </p>
          </div>
          {isLoading ? (
            <ActiveCyclesLoader />
          ) : error ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-subtle bg-surface-1 p-8 text-center">
              <AlertCircle className="size-8 text-tertiary" aria-hidden="true" />
              <h2 className="text-16 font-semibold text-primary">Could not load active cycles</h2>
              <p className="max-w-md text-13 text-secondary">
                Refresh the list. If this keeps happening, check workspace and project permissions.
              </p>
              <Button variant="secondary" size="sm" onClick={() => mutate()}>
                Try again
              </Button>
            </div>
          ) : cycles.length === 0 ? (
            <EmptyStateDetailed
              assetKey="cycle"
              title="No active cycles"
              description="Create or start a cycle from a project with cycles enabled to see it here."
              rootClassName="py-12"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {cycles.map((cycle) => (
                <ActiveCycleListItem key={cycle.id} cycle={cycle} workspaceSlug={workspaceSlug ?? ""} />
              ))}
              {pagination?.next_page_results && (
                <div className="flex justify-center pt-3">
                  <Button variant="secondary" size="sm" loading={isLoadingMore} onClick={handleLoadMore}>
                    Load more
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </ContentWrapper>
    </>
  );
}

export default observer(WorkspaceActiveCyclesPage);
