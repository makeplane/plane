/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Table listing the current user's capacity export jobs.
 * Auto-refreshes every 30s while any job is queued or processing.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { useWorklog } from "@/hooks/store/use-worklog";
import { CapacityExportRow } from "./capacity-export-row";

const POLL_INTERVAL_MS = 30_000;
const IN_PROGRESS_STATUSES = new Set(["queued", "processing"]);
const COLUMN_KEYS = ["status", "range", "members", "rows", "size", "created", "expires", "actions"] as const;

const COLUMN_ALIGN: Record<(typeof COLUMN_KEYS)[number], string> = {
  status: "text-left",
  range: "text-left",
  members: "text-right",
  rows: "text-right",
  size: "text-right",
  created: "text-left",
  expires: "text-left",
  actions: "text-right",
};

export const CapacityExportsList = observer(function CapacityExportsList() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const worklog = useWorklog();
  const { exportJobs, isExportJobsLoading } = worklog;

  useEffect(() => {
    if (workspaceSlug) void worklog.fetchExportHistory(workspaceSlug);
  }, [workspaceSlug, worklog]);

  useEffect(() => {
    const jobs = Object.values(exportJobs);
    const hasInProgress = jobs.some((j) => IN_PROGRESS_STATUSES.has(j.status));
    if (!hasInProgress || !workspaceSlug) return;
    const timerId = setInterval(() => {
      void worklog.fetchExportHistory(workspaceSlug);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timerId);
  }, [exportJobs, workspaceSlug, worklog]);

  const sortedJobs = Object.values(exportJobs).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const isEmpty = sortedJobs.length === 0 && !isExportJobsLoading;
  const isInitialLoading = isExportJobsLoading && Object.keys(exportJobs).length === 0;

  return (
    <div className="h-full w-full overflow-auto bg-surface-1">
      {/* Title block */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-primary">{t("capacity_exports.title")}</h2>
              <p className="mt-0.5 text-13 text-secondary">{t("capacity_exports.subtitle")}</p>
            </div>
          </div>

          <button
            type="button"
            disabled={isExportJobsLoading}
            onClick={() => {
              if (workspaceSlug) void worklog.fetchExportHistory(workspaceSlug);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-subtle bg-layer-2 px-2.5 py-1.5 text-12 font-medium text-secondary transition-colors hover:border-strong hover:text-primary disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isExportJobsLoading ? "animate-spin" : ""}`} />
            {t("capacity_exports.refresh")}
          </button>
        </div>
      </div>

      {/* Card container */}
      <div className="px-6 pb-6">
        <div className="overflow-hidden rounded-lg border border-subtle bg-surface-1 shadow-sm">
          {/* Loading */}
          {isInitialLoading && (
            <div className="flex items-center justify-center gap-2 py-16 text-13 text-tertiary">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              {t("common.loading")}
            </div>
          )}

          {/* Empty */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-tertiary">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <p className="text-13 font-medium text-secondary">{t("capacity_exports.empty")}</p>
              <p className="text-12 text-tertiary">{t("capacity_exports.empty_hint")}</p>
            </div>
          )}

          {/* Table */}
          {!isInitialLoading && sortedJobs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-subtle bg-surface-2/60">
                    {COLUMN_KEYS.map((col) => (
                      <th
                        key={col}
                        className={`px-4 py-2.5 text-12 font-semibold uppercase tracking-wide text-tertiary whitespace-nowrap ${COLUMN_ALIGN[col]}`}
                      >
                        {t(`capacity_exports.col.${col}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedJobs.map((job) => (
                    <CapacityExportRow key={job.id} job={job} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {sortedJobs.length > 0 && <p className="mt-3 text-12 text-tertiary">{t("capacity_exports.footer_hint")}</p>}
      </div>
    </div>
  );
});
