/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the "Report" view of the Activity page (?view=report). The time of the chosen period
// from series of actions, from the work log, or both, in the table of the PDF and Markdown files (date, log
// entry, work), with the PDF, Markdown and CSV files of the same report. The numbers come from the API
// (apps/api/plane/liviere/activity/report.py), so the view and the files always agree.

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { Switch } from "@makeplane/propel/components/switch";
import { Loader } from "@plane/blocks/skeleton";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { projectActivityService } from "./activity.service";
import { REPORT_EXPORTS, REPORT_SOURCES } from "./types";
import type { TActivityQuery, TActivityReport, TReportActor, TReportExport, TReportSource } from "./types";
import { useActivityReport } from "./use-activity";

type Props = {
  workspaceSlug: string;
  projectId: string;
  query: TActivityQuery;
  locale: string;
  source: TReportSource;
  onSourceChange: (source: TReportSource) => void;
};

/** 73 -> "1 h 13 min", like the files. */
export const formatReportMinutes = (minutes: number): string => {
  const sign = minutes < 0 ? "-" : "";
  const hours = Math.floor(Math.abs(minutes) / 60);
  const rest = Math.abs(minutes) % 60;
  return hours ? `${sign}${hours} h ${rest.toString().padStart(2, "0")} min` : `${sign}${rest} min`;
};

const fileName = (report: TActivityReport, format: TReportExport) =>
  `${report.project.identifier}-activity-${report.from}_${report.to}.${format}`;

type TReportDay = TActivityReport["days"][number];
type TReportRow = { date: string; texts: string[]; minutes: number };

const authorKey = (actor: TReportActor) => actor?.id ?? "";

/** The texts start with their author's name when the report is not narrowed to one person and has several. */
const namesTexts = (report: TActivityReport): boolean => {
  if (report.actor) return false;
  const authors = new Set<string>();
  for (const day of report.days) {
    for (const summary of day.summaries) authors.add(authorKey(summary.author));
    for (const entry of day.entries) if (entry.note?.trim()) authors.add(authorKey(entry.actor));
  }
  return authors.size > 1;
};

/**
 * Texts of the "log entry" column of a day, as in the files (report_export.py day_texts): for every person
 * their summary of the day, or without one the notes of their log entries of that day.
 */
const dayTexts = (day: TReportDay, withNames: boolean, personName: (actor: TReportActor) => string): string[] => {
  const authors = new Map<string, TReportActor>();
  const summaries = new Map<string, string>();
  const notes = new Map<string, string[]>();
  for (const summary of day.summaries) {
    const key = authorKey(summary.author);
    if (!authors.has(key)) authors.set(key, summary.author);
    summaries.set(key, summary.text);
  }
  for (const entry of day.entries) {
    const note = entry.note?.trim();
    if (!note) continue;
    const key = authorKey(entry.actor);
    if (!authors.has(key)) authors.set(key, entry.actor);
    notes.set(key, [...(notes.get(key) ?? []), note]);
  }
  const texts: string[] = [];
  for (const [key, actor] of authors) {
    const summary = summaries.get(key);
    for (const text of summary !== undefined ? [summary] : (notes.get(key) ?? [])) {
      const trimmed = text.trim();
      if (trimmed) texts.push(withNames ? `${personName(actor)}: ${trimmed}` : trimmed);
    }
  }
  return texts;
};

export function ActivityReport(props: Props) {
  const { workspaceSlug, projectId, query, locale, source, onSourceChange } = props;
  const { t } = useTranslation();
  const [entries, setEntries] = useState(true);
  const [downloading, setDownloading] = useState<TReportExport | null>(null);
  const options = { source, entries };
  const { data: report, error, isLoading } = useActivityReport(workspaceSlug, projectId, query, options);
  const personName = (actor: TReportActor) =>
    actor ? actor.display_name || actor.id : t("liviere.activity.report.unknown_person");
  const download = async (format: TReportExport) => {
    if (!report) return;
    setDownloading(format);
    try {
      const lang = locale.toLowerCase().startsWith("pl") ? "pl" : "en";
      const blob = await projectActivityService.downloadReport(workspaceSlug, projectId, query, options, format, lang);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName(report, format);
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setToast({ type: "error", title: t("error"), message: t("liviere.activity.report.download_error") });
    } finally {
      setDownloading(null);
    }
  };

  const descriptions = report
    ? (source === "mixed" ? ["mixed", "log", "grid"] : [source]).map((key) =>
        t(`liviere.activity.report.describe_${key}`, {
          gap: report.series_gap_minutes,
          padding: report.series_padding_minutes,
          open: report.open_entry_minutes,
        })
      )
    : [];
  // Days without time and without texts are left out of the table, as in the PDF and Markdown (not JSON/CSV)
  const rows: TReportRow[] = [];
  if (report) {
    const withNames = namesTexts(report);
    for (const day of report.days) {
      const texts = dayTexts(day, withNames, personName);
      if (texts.length > 0 || day.log_minutes || day.grid_minutes || day.result_minutes)
        rows.push({ date: day.date, texts, minutes: day.result_minutes });
    }
  }
  const emptyDays = report ? report.days.length - rows.length : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-md border border-subtle" role="group">
          {REPORT_SOURCES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onSourceChange(key)}
              className={cn(
                "px-3 py-1 text-13 text-secondary hover:bg-layer-transparent-hover",
                source === key && "bg-layer-transparent-selected font-medium text-primary"
              )}
            >
              {t(`liviere.activity.report.sources.${key}`)}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-13 text-secondary">
          <Switch size="sm" checked={entries} onCheckedChange={setEntries} />
          {t("liviere.activity.report.include_entries")}
        </label>
        <div className="ml-auto flex gap-2">
          {REPORT_EXPORTS.map((format) => (
            <Button
              key={format}
              variant={format === "pdf" ? "primary" : "secondary"}
              size="md"
              stretch="auto"
              label={t(`liviere.activity.report.download.${format}`)}
              loading={downloading === format}
              disabled={!report || downloading !== null}
              onClick={() => void download(format)}
            />
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-13 text-danger-primary">{t("liviere.activity.load_error")}</p>
      ) : isLoading && !report ? (
        <Loader className="flex flex-col gap-2">
          <Loader.Item height="40px" width="100%" />
          <Loader.Item height="240px" width="100%" />
        </Loader>
      ) : report ? (
        <>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <span className="text-20 font-semibold text-primary">
              {formatReportMinutes(report.totals.result_minutes)}
            </span>
            {source === "mixed" && (
              <span className="text-13 text-secondary">
                {t("liviere.activity.report.mixed_summary", {
                  log: formatReportMinutes(report.totals.log_minutes),
                  grid: formatReportMinutes(report.totals.grid_minutes),
                  difference: formatReportMinutes(report.totals.difference_minutes),
                })}
              </span>
            )}
          </div>
          <div className="flex max-w-4xl flex-col gap-1">
            {descriptions.map((sentence) => (
              <p key={sentence} className="text-12 text-tertiary">
                {sentence}
              </p>
            ))}
            <p className="text-12 text-tertiary">{t("liviere.activity.report.describe_union")}</p>
            {report.skipped.length > 0 && (
              <p className="text-12 text-tertiary">{t("liviere.activity.report.describe_skipped")}</p>
            )}
          </div>

          {rows.length > 0 ? (
            <ReportTable
              rows={rows}
              total={report.totals.result_minutes}
              note={emptyDays > 0 ? t("liviere.activity.report.empty_days", { count: emptyDays }) : undefined}
            />
          ) : (
            <p className="text-13 text-tertiary">{t("liviere.activity.report.no_activity")}</p>
          )}

          {report.skipped.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-14 font-medium text-primary">{t("liviere.activity.report.skipped")}</h3>
              <ul className="flex flex-col gap-1 text-13 text-secondary">
                {report.skipped.map((period) => (
                  <li key={period.id}>
                    {period.starts_at.slice(0, 16).replace("T", " ")} – {period.ends_at.slice(0, 16).replace("T", " ")}
                    {period.description && `: ${period.description}`}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}

type TableProps = {
  rows: TReportRow[];
  total: number;
  // A line under the table
  note?: string;
};

function ReportTable(props: TableProps) {
  const { rows, total, note } = props;
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-2">
      <div className="max-w-5xl overflow-x-auto">
        <table className="w-full text-13">
          <thead>
            <tr className="border-b border-subtle text-left text-tertiary">
              <th className="py-2 pr-4 font-medium whitespace-nowrap">{t("liviere.activity.report.columns.date")}</th>
              <th className="w-full py-2 pr-4 font-medium">{t("liviere.activity.report.columns.notes")}</th>
              <th className="py-2 pl-4 text-right font-medium whitespace-nowrap">
                {t("liviere.activity.report.columns.work")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date} className="border-b border-subtle align-top">
                <td className="py-1.5 pr-4 whitespace-nowrap text-primary tabular-nums">{row.date}</td>
                <td className="py-1.5 pr-4 whitespace-pre-wrap text-secondary">{row.texts.join("\n")}</td>
                <td className="py-1.5 pl-4 text-right whitespace-nowrap text-secondary tabular-nums">
                  {formatReportMinutes(row.minutes)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-medium text-primary">
              <td className="py-2 pr-4">{t("liviere.activity.report.total")}</td>
              <td />
              <td className="py-2 pl-4 text-right whitespace-nowrap tabular-nums">{formatReportMinutes(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {note && <p className="text-12 text-tertiary">{note}</p>}
    </section>
  );
}
