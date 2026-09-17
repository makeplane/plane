/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const { reportId } = useParams();
  const [reportType, setReportType] = useState<TReportType>("WEEKLY");
  const [periodKey, setPeriodKey] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [mineOnly, setMineOnly] = useState(
    () => !["org_unit", "owner", "date_from", "date_to"].some((key) => searchParams.has(key))
  );
  const [orgFilter, setOrgFilter] = useState(() => searchParams.get("org_unit") ?? "");
  const [ownerFilter, setOwnerFilter] = useState(() => searchParams.get("owner") ?? "");
  const [dateFrom, setDateFrom] = useState(() => searchParams.get("date_from") ?? "");
  const [dateTo, setDateTo] = useState(() => searchParams.get("date_to") ?? "");
  const [cursor, setCursor] = useState("");
  const [selectedTeamProjects, setSelectedTeamProjects] = useState<string[]>([]);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const reports = research.getReports(workspaceSlug);
  const orgUnits = research.getOrgUnits(workspaceSlug);
  const pagination = research.reportPaginationByWorkspace[workspaceSlug];
  const canCreateReport = Boolean(research.identity?.user.org_units.length);
  const teamProjects = research
    .getResearchProjects(workspaceSlug)
    .filter((project) => project.research?.research_type === "RESEARCH_PROJECT");

  const load = useCallback(async () => {
    const params: Record<string, string> = { per_page: "50" };
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.report_type = typeFilter;
    if (periodFilter) params.period_key = periodFilter.trim();
    if (mineOnly) params.mine = "true";
    if (orgFilter) params.org_unit = orgFilter;
    if (ownerFilter) params.owner = ownerFilter.trim();
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (cursor) params.cursor = cursor;
    try {
      await research.fetchReports(workspaceSlug, params);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [
    cursor,
    dateFrom,
    dateTo,
    mineOnly,
    orgFilter,
    ownerFilter,
    periodFilter,
    research,
    statusFilter,
    typeFilter,
    workspaceSlug,
  ]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    workspaceSlug,
    statusFilter,
    typeFilter,
    periodFilter,
    mineOnly,
    orgFilter,
    ownerFilter,
    dateFrom,
    dateTo,
    cursor,
  ]);

  useEffect(
    () => setCursor(""),
    [statusFilter, typeFilter, periodFilter, mineOnly, orgFilter, ownerFilter, dateFrom, dateTo]
  );

  useEffect(() => {
    void research.fetchResearchProjects(workspaceSlug, { research_type: "RESEARCH_PROJECT" }).catch(() => undefined);
    void research.fetchOrgUnits(workspaceSlug).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  const handleCreate = useCallback(async () => {
    try {
      const report = await research.createReport(workspaceSlug, {
        report_type: reportType,
        period_key: periodKey.trim() || undefined,
        team_projects: selectedTeamProjects,
      });
      setPeriodKey("");
      setSelectedTeamProjects([]);
      setErrorKey(null);
      await load();
      window.location.assign(`/${workspaceSlug}/research/reports/${report.id}`);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [load, periodKey, reportType, research, selectedTeamProjects, workspaceSlug]);

  return (
    <div className="flex flex-col gap-3 p-5">
      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        {canCreateReport && (
          <>
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

            {teamProjects.length > 0 && (
              <details className="relative text-12 text-secondary">
                <summary className="cursor-pointer rounded-md border border-subtle bg-surface-1 px-2 py-1.5">
                  {t("research.reports.team_projects", { count: selectedTeamProjects.length })}
                </summary>
                <div className="shadow-sm absolute z-10 mt-1 flex max-h-56 min-w-60 flex-col gap-2 overflow-y-auto rounded-md border border-subtle bg-surface-1 p-3">
                  {teamProjects.map((project) => (
                    <label key={project.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedTeamProjects.includes(project.id)}
                        onChange={(event) =>
                          setSelectedTeamProjects((current) =>
                            event.target.checked
                              ? [...current, project.id]
                              : current.filter((projectId) => projectId !== project.id)
                          )
                        }
                      />
                      <span className="truncate">{project.name}</span>
                    </label>
                  ))}
                </div>
              </details>
            )}
          </>
        )}

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
        <select
          aria-label={t("research.reports.columns.type")}
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="">{t("research.reports.all_types")}</option>
          {REPORT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(REPORT_TYPE_LABELS[type])}
            </option>
          ))}
        </select>
        <Input
          aria-label={t("research.reports.columns.period")}
          className="!w-40"
          placeholder={t("research.reports.period_filter_placeholder")}
          value={periodFilter}
          onChange={(event) => setPeriodFilter(event.target.value)}
        />
        <select
          aria-label={t("research.reports.columns.org_unit")}
          className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
          value={orgFilter}
          onChange={(event) => setOrgFilter(event.target.value)}
        >
          <option value="">{t("research.reports.all_org_units")}</option>
          {orgUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
        <Input
          aria-label={t("research.reports.columns.owner")}
          className="!w-48"
          placeholder={t("research.reports.owner_filter_placeholder")}
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value)}
        />
        <Input
          aria-label={t("research.common.date_from")}
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
        />
        <Input
          aria-label={t("research.common.date_to")}
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
        />
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
      <div className="flex items-center justify-between gap-2 text-12 text-tertiary">
        <span>{t("research.common.total_results", { count: pagination?.total_results ?? reports.length })}</span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination?.prev_page_results}
            onClick={() => setCursor(pagination?.prev_cursor ?? "")}
          >
            {t("research.common.previous")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!pagination?.next_page_results}
            onClick={() => setCursor(pagination?.next_cursor ?? "")}
          >
            {t("research.common.next")}
          </Button>
        </div>
      </div>
    </div>
  );
});
