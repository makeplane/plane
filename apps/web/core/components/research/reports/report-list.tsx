/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "react-router";
// plane imports
import { REPORT_STATUS_LABELS, REPORT_TYPE_LABELS, REPORT_TYPES } from "@plane/constants";
import type { TReportStatus, TReportType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
};

const STATUS_TONES: Record<TReportStatus, string> = {
  DRAFT: "bg-surface-2 text-tertiary",
  SUBMITTED: "bg-accent-subtle text-accent-primary",
  NEEDS_REVISION: "bg-danger-subtle text-danger-primary",
  ACCEPTED: "bg-success-subtle text-success-primary",
};

/** Report list with period / status / type / owner filters (P0-UI-02). */
export const ResearchReportList = observer(function ResearchReportList({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const { reportId } = useParams();
  const [reportType, setReportType] = useState<TReportType>("WEEKLY");
  const [periodKey, setPeriodKey] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [mineOnly, setMineOnly] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const reports = research.getReports(workspaceSlug);

  const load = useCallback(async () => {
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (mineOnly) params.mine = "true";
    try {
      await research.fetchReports(workspaceSlug, params);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [mineOnly, research, statusFilter, workspaceSlug]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, statusFilter, mineOnly]);

  const handleCreate = useCallback(async () => {
    try {
      const report = await research.createReport(workspaceSlug, {
        report_type: reportType,
        period_key: periodKey.trim() || undefined,
      });
      setPeriodKey("");
      setErrorKey(null);
      await load();
      window.location.assign(`/${workspaceSlug}/research/reports/${report.id}`);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [load, periodKey, reportType, research, workspaceSlug]);

  return (
    <div className="flex flex-col gap-3 p-5">
      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <select
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
          value={reportType}
          onChange={(event) => setReportType(event.target.value as TReportType)}
        >
          {REPORT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(REPORT_TYPE_LABELS[type])}
            </option>
          ))}
        </select>
        <Input
          className="!w-40"
          placeholder={t("research.reports.period_placeholder")}
          value={periodKey}
          onChange={(event) => setPeriodKey(event.target.value)}
        />
        <Button variant="primary" size="sm" onClick={() => void handleCreate()}>
          {t("research.reports.create")}
        </Button>

        <select
          className="ml-auto rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">{t("research.reports.all_statuses")}</option>
          {(["DRAFT", "SUBMITTED", "NEEDS_REVISION", "ACCEPTED"] as const).map((status) => (
            <option key={status} value={status}>
              {t(REPORT_STATUS_LABELS[status])}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-12 text-secondary">
          <input type="checkbox" checked={mineOnly} onChange={(event) => setMineOnly(event.target.checked)} />
          {t("research.reports.mine_only")}
        </label>
      </div>

      <table className="w-full text-12">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="font-normal py-2">{t("research.reports.columns.period")}</th>
            <th className="font-normal py-2">{t("research.reports.columns.type")}</th>
            <th className="font-normal py-2">{t("research.reports.columns.owner")}</th>
            <th className="font-normal py-2">{t("research.reports.columns.org_unit")}</th>
            <th className="font-normal py-2">{t("research.reports.columns.status")}</th>
            <th className="font-normal py-2">{t("research.reports.columns.visibility")}</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-b border-subtle/60">
              <td className="py-2">
                <Link
                  href={`/${workspaceSlug}/research/reports/${report.id}`}
                  className={`text-accent-primary ${reportId === report.id ? "font-medium" : ""}`}
                >
                  {report.period_key}
                </Link>
                {report.is_backfill && (
                  <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-10 text-tertiary">
                    {t("research.reports.backfill")}
                  </span>
                )}
              </td>
              <td className="py-2 text-secondary">{t(REPORT_TYPE_LABELS[report.report_type])}</td>
              <td className="py-2 text-tertiary">
                {report.owner_detail?.display_name ?? report.owner_detail?.email ?? report.owner}
              </td>
              <td className="py-2 text-tertiary">{report.org_unit_detail?.name ?? "-"}</td>
              <td className="py-2">
                <span className={`rounded px-1.5 py-0.5 text-10 ${STATUS_TONES[report.status]}`}>
                  {t(REPORT_STATUS_LABELS[report.status])}
                </span>
              </td>
              <td className="py-2 text-tertiary">
                {t(`research.report_visibility.${report.visibility.toLowerCase()}`)}
              </td>
            </tr>
          ))}
          {reports.length === 0 && (
            <tr>
              <td colSpan={6} className="py-3 text-center text-tertiary">
                {t("research.reports.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
