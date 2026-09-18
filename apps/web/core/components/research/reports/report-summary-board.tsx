/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { REPORT_TYPE_LABELS, REPORT_TYPES } from "@plane/constants";
import type { TReportType } from "@plane/constants";
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

const BUCKETS = [
  { key: "not_submitted", labelKey: "research.summary.not_submitted" },
  { key: "draft", labelKey: "research.summary.draft" },
  { key: "submitted", labelKey: "research.summary.submitted" },
  { key: "needs_revision", labelKey: "research.summary.needs_revision" },
  { key: "accepted", labelKey: "research.summary.accepted" },
] as const;

/** Submission board grouped by organisation node and period (P0-UI-05). */
export const ResearchReportSummaryBoard = observer(function ResearchReportSummaryBoard({ workspaceSlug }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [reportType, setReportType] = useState<TReportType>("WEEKLY");
  const [periodKey, setPeriodKey] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const summary = research.summaryByWorkspace[workspaceSlug];

  const load = useCallback(async () => {
    try {
      await research.fetchReportSummary(workspaceSlug, {
        report_type: reportType,
        period_key: periodKey.trim() || undefined,
      });
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [periodKey, reportType, research, workspaceSlug]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, reportType]);

  return (
    <div className="flex flex-col gap-4 p-5">
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
        <Button variant="secondary" size="sm" onClick={() => void load()}>
          {t("research.common.refresh")}
        </Button>
        {summary && (
          <span className="text-12 text-tertiary">
            {summary.period_key} · {summary.period_start} ~ {summary.period_end}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {BUCKETS.map((bucket) => (
          <div key={bucket.key} className="rounded-lg border border-subtle bg-surface-1 p-3">
            <p className="text-11 text-tertiary">{t(bucket.labelKey)}</p>
            <p className="mt-1 text-16 font-medium text-primary">{summary?.counts?.[bucket.key] ?? 0}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-subtle bg-surface-1 p-4">
        <h3 className="text-13 font-medium text-primary">{t("research.summary.by_unit")}</h3>
        <table className="mt-2 w-full text-12">
          <thead>
            <tr className="border-b border-subtle text-left text-tertiary">
              <th className="font-normal py-2">{t("research.summary.columns.unit")}</th>
              {BUCKETS.map((bucket) => (
                <th key={bucket.key} className="font-normal py-2">
                  {t(bucket.labelKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(summary?.by_unit ?? []).map((entry) => (
              <tr key={entry.org_unit} className="border-b border-subtle/60">
                <td className="py-2 text-secondary">{entry.org_unit_name}</td>
                {BUCKETS.map((bucket) => (
                  <td key={bucket.key} className="py-2 text-tertiary">
                    {entry.counts[bucket.key]}
                  </td>
                ))}
              </tr>
            ))}
            {(summary?.by_unit ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="py-3 text-center text-tertiary">
                  {t("research.summary.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border border-subtle bg-surface-1 p-4">
        <h3 className="text-13 font-medium text-primary">{t("research.summary.pending")}</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {(summary?.pending_members ?? []).map((member) => (
            <li key={member.id} className="rounded bg-surface-2 px-2 py-1 text-12 text-secondary">
              {member.display_name || member.email}
            </li>
          ))}
          {(summary?.pending_members ?? []).length === 0 && (
            <li className="text-12 text-tertiary">{t("research.summary.no_pending")}</li>
          )}
        </ul>
      </section>
    </div>
  );
});
