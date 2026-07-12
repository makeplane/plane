/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWRInfinite from "swr/infinite";
// plane imports
import { PROGRESS_STATE_GROUPS_DETAILS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CycleIcon } from "@plane/propel/icons";
import type { ICycle } from "@plane/types";
import { Button, ContentWrapper, LinearProgressIndicator, Loader } from "@plane/ui";
import { renderFormattedDate } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
// services
import { CycleService } from "@/services/cycle.service";

const cycleService = new CycleService();

const ACTIVE_CYCLES_PER_PAGE = 100;

type TActiveCycleCardProps = {
  cycle: ICycle;
};

const WorkspaceActiveCycleCard = observer(function WorkspaceActiveCycleCard({ cycle }: TActiveCycleCardProps) {
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = getProjectById(cycle.project_id);
  const totalIssues = cycle.total_issues ?? 0;
  const cancelledIssues = cycle.cancelled_issues ?? 0;
  // cancelled work items are excluded from progress (the progress bar below
  // only stacks completed/started/unstarted/backlog) — keep the badge on the
  // same denominator so both always agree
  const scopedIssues = totalIssues - cancelledIssues;
  const completionPercentage = scopedIssues > 0 ? Math.round(((cycle.completed_issues ?? 0) / scopedIssues) * 100) : 0;

  const progressData = PROGRESS_STATE_GROUPS_DETAILS.map((group) => ({
    id: group.key,
    name: group.title,
    value: (cycle[group.key as keyof ICycle] as number) ?? 0,
    color: group.color,
  }));

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-strong bg-layer-1 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <CycleIcon className="h-4 w-4 flex-shrink-0 rotate-180 text-tertiary" />
          <span className="text-15 truncate font-semibold text-primary" title={cycle.name}>
            {cycle.name}
          </span>
        </div>
        <span className="flex-shrink-0 rounded-full bg-accent-primary/10 px-2 py-0.5 text-11 font-medium text-accent-secondary">
          {completionPercentage}%
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-12 text-tertiary">
        {project && (
          <span className="flex items-center gap-1 truncate" title={project.name}>
            <span className="text-placeholder">{project.identifier}</span>
            <span className="truncate">{project.name}</span>
          </span>
        )}
        {(cycle.start_date || cycle.end_date) && (
          <span>
            {cycle.start_date ? renderFormattedDate(cycle.start_date) : "-"}
            {" - "}
            {cycle.end_date ? renderFormattedDate(cycle.end_date) : "-"}
          </span>
        )}
      </div>

      {scopedIssues > 0 ? (
        <LinearProgressIndicator size="lg" data={progressData} />
      ) : (
        <div className="h-3.5 w-full rounded-xs bg-surface-2" />
      )}

      <div className="flex flex-wrap items-center gap-4 text-12 text-tertiary">
        <span className="font-medium text-primary">{totalIssues}</span>
        <span className="lowercase">
          {cycle.completed_issues ?? 0} {t("workspace_projects.state.completed")}
        </span>
        <span className="lowercase">
          {cycle.started_issues ?? 0} {t("workspace_projects.state.started")}
        </span>
        <span className="lowercase">
          {(cycle.unstarted_issues ?? 0) + (cycle.backlog_issues ?? 0)} {t("common.pending")}
        </span>
        {cancelledIssues > 0 && (
          <span className="lowercase">
            {cancelledIssues} {t("workspace_projects.state.cancelled")}
          </span>
        )}
      </div>
    </div>
  );
});

export const WorkspaceActiveCyclesRoot = observer(function WorkspaceActiveCyclesRoot() {
  const { t } = useTranslation();
  // router params
  const { workspaceSlug } = useParams();
  // fetch active cycles across the workspace, one cursor page at a time
  const getKey = (
    pageIndex: number,
    previousPageData: Awaited<ReturnType<typeof cycleService.workspaceActiveCycles>> | null
  ) => {
    if (!workspaceSlug) return null;
    if (previousPageData && !previousPageData.next_page_results) return null;
    const cursor = previousPageData?.next_cursor ?? `${ACTIVE_CYCLES_PER_PAGE}:0:0`;
    return `WORKSPACE_ACTIVE_CYCLES_${workspaceSlug.toString()}_${cursor}`;
  };
  const {
    data: pages,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
  } = useSWRInfinite(
    getKey,
    (key: string) => {
      const cursor = key.split("_").pop() ?? `${ACTIVE_CYCLES_PER_PAGE}:0:0`;
      return cycleService.workspaceActiveCycles(workspaceSlug!.toString(), cursor, ACTIVE_CYCLES_PER_PAGE);
    },
    { revalidateOnFocus: false }
  );

  const activeCycles = pages?.flatMap((page) => page.results) ?? [];
  const hasMore = pages && pages.length > 0 ? pages[pages.length - 1].next_page_results : false;

  // loading state
  if (isLoading && !pages) {
    return (
      <ContentWrapper>
        <Loader className="flex flex-col gap-4">
          <Loader.Item height="140px" />
          <Loader.Item height="140px" />
          <Loader.Item height="140px" />
        </Loader>
      </ContentWrapper>
    );
  }

  // error state (a request that failed without an HTTP response rejects with
  // the raw error, so `error` is always truthy on failure)
  if (error) {
    return (
      <ContentWrapper>
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 py-16 text-center">
          <h3 className="text-15 font-medium text-primary">{t("something_went_wrong")}</h3>
        </div>
      </ContentWrapper>
    );
  }

  // empty state
  if (activeCycles.length === 0) {
    return (
      <ContentWrapper>
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 py-16 text-center">
          <CycleIcon className="h-10 w-10 rotate-180 text-placeholder" />
          <h3 className="text-16 font-medium text-primary">{t("workspace_empty_state.active_cycles.title")}</h3>
          <p className="max-w-md text-13 text-tertiary">{t("workspace_empty_state.active_cycles.description")}</p>
        </div>
      </ContentWrapper>
    );
  }

  // list
  return (
    <ContentWrapper>
      <div className="flex flex-col gap-2 pb-6">
        <h2 className="text-18 font-semibold text-primary">{t("active_cycles")}</h2>
        <p className="text-13 text-tertiary">{t("active_cycles_description")}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 pb-8 lg:grid-cols-2">
        {activeCycles.map((cycle) => (
          <WorkspaceActiveCycleCard key={cycle.id} cycle={cycle} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center pb-8">
          <Button variant="neutral-primary" size="lg" onClick={() => setSize(size + 1)} loading={isValidating}>
            {t("common.load_more")}
          </Button>
        </div>
      )}
    </ContentWrapper>
  );
});
