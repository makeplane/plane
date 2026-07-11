/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { WORKSPACE_ACTIVITY } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// components
import { ActivityList } from "@/components/profile/activity/activity-list";
// services
import { WorkspaceService } from "@/services/workspace.service";

// services
const workspaceService = new WorkspaceService();

const PER_PAGE = 30;

export type TWorkspaceActivityFilterParams = {
  actor?: string[];
  project?: string[];
  start_date?: string;
  end_date?: string;
};

type TWorkspaceActivityListPageProps = {
  cursor: string;
  filterParams: TWorkspaceActivityFilterParams;
  perPage: number;
  updateResultsCount: (count: number) => void;
  updateTotalPages: (count: number) => void;
  updateTotalResults: (count: number) => void;
  workspaceSlug: string;
};

const WorkspaceActivityListPage = observer(function WorkspaceActivityListPage(props: TWorkspaceActivityListPageProps) {
  const { cursor, filterParams, perPage, updateResultsCount, updateTotalPages, updateTotalResults, workspaceSlug } =
    props;

  const { data: workspaceActivity } = useSWR(
    workspaceSlug ? WORKSPACE_ACTIVITY(workspaceSlug, { ...filterParams, cursor }) : null,
    workspaceSlug
      ? () =>
          workspaceService.getWorkspaceActivity(workspaceSlug, {
            ...filterParams,
            cursor,
            per_page: perPage,
          })
      : null
  );

  useEffect(() => {
    if (!workspaceActivity) return;

    updateTotalPages(workspaceActivity.total_pages);
    updateResultsCount(workspaceActivity.results.length);
    updateTotalResults(workspaceActivity.total_results);
  }, [updateResultsCount, updateTotalPages, updateTotalResults, workspaceActivity]);

  return <ActivityList activity={workspaceActivity} />;
});

type TWorkspaceActivityListProps = {
  filterParams: TWorkspaceActivityFilterParams;
  workspaceSlug: string;
};

export const WorkspaceActivityList = observer(function WorkspaceActivityList(props: TWorkspaceActivityListProps) {
  const { filterParams, workspaceSlug } = props;
  // states
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  // plane hooks
  const { t } = useTranslation();

  const updateTotalPages = (count: number) => setTotalPages(count);

  const updateResultsCount = (count: number) => setResultsCount(count);

  const updateTotalResults = (count: number) => setTotalResults(count);

  const handleLoadMore = () => setPageCount((prev) => prev + 1);

  const activityPages: React.ReactNode[] = [];
  for (let i = 0; i < pageCount; i++)
    activityPages.push(
      <WorkspaceActivityListPage
        key={i}
        cursor={`${PER_PAGE}:${i}:0`}
        filterParams={filterParams}
        perPage={PER_PAGE}
        updateResultsCount={updateResultsCount}
        updateTotalPages={updateTotalPages}
        updateTotalResults={updateTotalResults}
        workspaceSlug={workspaceSlug}
      />
    );

  return (
    <div className="flex h-full flex-col">
      {/* pages stay mounted even when empty so the SWR subscriptions keep revalidating */}
      {activityPages}
      {totalResults === 0 && (
        <div className="flex h-full w-full items-center justify-center py-10 text-13 text-secondary">
          {t("activity_empty_state.no_activity")}
        </div>
      )}
      {pageCount < totalPages && resultsCount !== 0 && (
        <div className="flex w-full items-center justify-center py-4 text-11">
          <Button variant="secondary" onClick={handleLoadMore}>
            {t("common.load_more")}
          </Button>
        </div>
      )}
    </div>
  );
});
