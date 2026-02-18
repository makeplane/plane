/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Main orchestrator for the project-level time tracking report.
 * Fetches summary data and renders filters, KPI cards, and issue table.
 */

import { useState, useEffect, useCallback, type FC } from "react";
import type { IWorkLogSummary } from "@plane/types";
import { WorklogService } from "@/services/worklog.service";
import { TimeTrackingFilters } from "./time-tracking-filters";
import { TimeTrackingIssueTable } from "./time-tracking-issue-table";
import { TimeTrackingSummaryCards } from "./time-tracking-summary-cards";

type TTimeTrackingReportPageProps = {
  workspaceSlug: string;
  projectId: string;
};

// Use service directly — this is a one-off report view, no need for store caching
const worklogService = new WorklogService();

export const TimeTrackingReportPage: FC<TTimeTrackingReportPageProps> = ({ workspaceSlug, projectId }) => {
  const [summary, setSummary] = useState<IWorkLogSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params["date_from"] = dateFrom;
      if (dateTo) params["date_to"] = dateTo;
      const data = await worklogService.getProjectSummary(workspaceSlug, projectId, params);
      setSummary(data);
    } catch {
      setError("Failed to load time tracking data.");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceSlug, projectId, dateFrom, dateTo]);

  // Fetch on mount only; subsequent fetches triggered by Apply button
  useEffect(() => {
    void fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectId]);

  const isEmpty = summary && summary.total_duration_minutes === 0 && summary.by_issue.length === 0;

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      {/* Filter bar */}
      <TimeTrackingFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApply={() => {
          void fetchSummary();
        }}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-custom-text-300">Loading...</span>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-red-500">{error}</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && isEmpty && (
        <div className="flex items-center justify-center py-16">
          <span className="text-sm text-custom-text-300">No time logged yet.</span>
        </div>
      )}

      {/* Data */}
      {!isLoading && !error && summary && !isEmpty && (
        <>
          <TimeTrackingSummaryCards summary={summary} />
          <TimeTrackingIssueTable byIssue={summary.by_issue} />
        </>
      )}
    </div>
  );
};
