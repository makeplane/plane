/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Table listing the current user's HO Datasheet export jobs.
 * Auto-refreshes every 30s while any job is queued or processing.
 */

import { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { THoExportJob } from "@/plane-web/services/ho-issue.service";
import { HoIssueService } from "@/plane-web/services/ho-issue.service";
import { HoExportRow } from "./ho-export-row";

const hoService = new HoIssueService();
const POLL_INTERVAL_MS = 30_000;
const IN_PROGRESS_STATUSES = new Set(["queued", "processing"]);

const COLUMN_KEYS = ["status", "range", "rows", "size", "created", "expires", "actions"] as const;
const COLUMN_LABELS: Record<(typeof COLUMN_KEYS)[number], string> = {
  status: "ho_exports.col_status",
  range: "ho_exports.col_range",
  rows: "ho_exports.col_rows",
  size: "ho_exports.col_size",
  created: "ho_exports.col_created",
  expires: "ho_exports.col_expires",
  actions: "",
};
const COLUMN_ALIGN: Record<(typeof COLUMN_KEYS)[number], string> = {
  status: "text-left",
  range: "text-left",
  rows: "text-right",
  size: "text-right",
  created: "text-left",
  expires: "text-left",
  actions: "text-right",
};

export const HoExportsList = observer(function HoExportsList() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<THoExportJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await hoService.listMyExports();
      setJobs(data);
    } catch {
      // non-critical
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const hasInProgress = jobs.some((j) => IN_PROGRESS_STATUSES.has(j.status));
    if (!hasInProgress) return;
    const timerId = setInterval(() => void fetchJobs(), POLL_INTERVAL_MS);
    return () => clearInterval(timerId);
  }, [jobs, fetchJobs]);

  const isEmpty = jobs.length === 0 && !isLoading;
  const isInitialLoading = isLoading && jobs.length === 0;

  return (
    <div className="h-full w-full overflow-auto bg-surface-1">
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-primary">{t("ho_exports.title")}</h2>
              <p className="mt-0.5 text-13 text-secondary">{t("ho_exports.subtitle")}</p>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => void fetchJobs()}
            className="flex items-center gap-1.5 rounded-md border border-subtle bg-surface-1 px-3 py-1.5 text-12 font-medium text-secondary transition-colors hover:bg-layer-2 hover:text-primary disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {t("ho_exports.refresh")}
          </button>
        </div>
      </div>

      {isInitialLoading && (
        <div className="flex items-center justify-center py-16 text-13 text-tertiary">{t("ho.loading")}</div>
      )}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <FileSpreadsheet className="h-8 w-8 text-tertiary/50" />
          <p className="text-13 text-tertiary">{t("ho_exports.empty")}</p>
        </div>
      )}

      {!isInitialLoading && jobs.length > 0 && (
        <div className="px-6 pb-6">
          <div className="overflow-hidden rounded-lg border border-subtle">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-subtle bg-layer-1">
                  {COLUMN_KEYS.map((col) => (
                    <th
                      key={col}
                      className={`px-4 py-2.5 text-12 font-semibold uppercase tracking-wide text-tertiary ${COLUMN_ALIGN[col]}`}
                    >
                      {COLUMN_LABELS[col] ? t(COLUMN_LABELS[col]) : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <HoExportRow key={job.id} job={job} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});
