/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: the "Report" view of the Activity page (?view=report). The time of the chosen period
// from series of actions, from the work log, or both, per day and per person, with the PDF, Markdown and CSV
// files of the same report. The numbers come from the API (apps/api/plane/liviere/activity/report.py), so
// the view and the files always agree.

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { Switch } from "@makeplane/propel/components/switch";
import { Loader } from "@plane/blocks/skeleton";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { projectActivityService } from "./activity.service";
import { REPORT_EXPORTS, REPORT_SOURCES } from "./types";
import type {
  TActivityQuery,
  TActivityReport,
  TReportActor,
  TReportExport,
  TReportMinutes,
  TReportSource,
} from "./types";
import { useActivityReport } from "./use-activity";

type Props = {
  workspaceSlug: string;
  projectId: string;
  query: TActivityQuery;
  locale: string;
  source: TReportSource;
  onSourceChange: (source: TReportSource) => void;
};

type TColumn = keyof TReportMinutes;

// Columns of the tables per source, as in the files (report_export.py COLUMNS)
const COLUMNS: Record<TReportSource, TColumn[]> = {
  grid: ["grid_minutes"],
  log: ["log_minutes"],
  mixed: ["log_minutes", "grid_minutes", "difference_minutes", "result_minutes"],
};
const COLUMN_LABELS: Record<TColumn, string> = {
  log_minutes: "log",
  grid_minutes: "grid",
  difference_minutes: "difference",
  result_minutes: "result",
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

export function ActivityReport(props: Props) {
  const { workspaceSlug, projectId, query, locale, source, onSourceChange } = props;
  const { t } = useTranslation();
  const [entries, setEntries] = useState(true);
  const [downloading, setDownloading] = useState<TReportExport | null>(null);
  const options = { source, entries };
  const { data: report, error, isLoading } = useActivityReport(workspaceSlug, projectId, query, options);
  const columns = COLUMNS[source];
  const personName = (actor: TReportActor) =>
    actor ? actor.display_name || actor.id : t("liviere.activity.report.unknown_person");
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: query.tz,
  });

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
  const headings = columns.map((column) => t(`liviere.activity.report.columns.${COLUMN_LABELS[column]}`));
  const listed = report ? report.days.filter((day) => day.entries.length > 0) : [];
  const summarized = report ? report.days.filter((day) => day.summaries.length > 0) : [];

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

          <ReportTable
            title={t("liviere.activity.report.days")}
            first={t("liviere.activity.report.columns.date")}
            headings={headings}
            rows={report.days.map((day) => ({ key: day.date, label: day.date, values: day }))}
            total={{ label: t("liviere.activity.report.total"), values: report.totals }}
            columns={columns}
          />
          <ReportTable
            title={t("liviere.activity.report.people")}
            first={t("liviere.activity.report.columns.person")}
            headings={headings}
            rows={report.people.map((row) => ({
              key: row.actor?.id ?? "unknown",
              label: personName(row.actor),
              values: row,
            }))}
            columns={columns}
          />

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

          {summarized.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="text-14 font-medium text-primary">{t("liviere.activity.report.summaries")}</h3>
              {summarized.map((day) => (
                <div key={day.date} className="flex flex-col gap-2">
                  <h4 className="text-13 font-medium text-secondary">{day.date}</h4>
                  {day.summaries.map((summary) => (
                    <div key={summary.id} className="text-13">
                      <div className="font-medium text-primary">{personName(summary.author)}</div>
                      <p className="pl-4 whitespace-pre-wrap text-secondary">{summary.text}</p>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          )}

          {report.entries_included && (
            <section className="flex flex-col gap-3">
              <h3 className="text-14 font-medium text-primary">{t("liviere.activity.report.entries")}</h3>
              {listed.length === 0 && (
                <p className="text-13 text-tertiary">{t("liviere.activity.report.no_entries")}</p>
              )}
              {listed.map((day) => (
                <div key={day.date} className="flex flex-col gap-2">
                  <h4 className="text-13 font-medium text-secondary">{day.date}</h4>
                  <ul className="flex flex-col gap-2">
                    {day.entries.map((entry) => (
                      <li key={entry.id} className="text-13">
                        <div className="font-medium text-primary">
                          {[
                            entry.end
                              ? `${time.format(new Date(entry.start))}–${time.format(new Date(entry.end))}`
                              : time.format(new Date(entry.start)),
                            personName(entry.actor),
                            entry.issue && [entry.issue.identifier, entry.issue.name].filter(Boolean).join(" "),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                        {entry.note && <p className="pl-4 whitespace-pre-wrap text-secondary">{entry.note}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}

type TableProps = {
  title: string;
  first: string;
  headings: string[];
  rows: { key: string; label: string; values: TReportMinutes }[];
  total?: { label: string; values: TReportMinutes };
  columns: TColumn[];
};

function ReportTable(props: TableProps) {
  const { title, first, headings, rows, total, columns } = props;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-14 font-medium text-primary">{title}</h3>
      <div className="max-w-4xl overflow-x-auto">
        <table className="w-full text-13">
          <thead>
            <tr className="border-b border-subtle text-left text-tertiary">
              <th className="py-2 pr-4 font-medium">{first}</th>
              {headings.map((heading) => (
                <th key={heading} className="py-2 pl-4 text-right font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-subtle">
                <td className="py-1.5 pr-4 text-primary">{row.label}</td>
                {columns.map((column) => (
                  <td key={column} className="py-1.5 pl-4 text-right text-secondary tabular-nums">
                    {formatReportMinutes(row.values[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {total && (
            <tfoot>
              <tr className="font-medium text-primary">
                <td className="py-2 pr-4">{total.label}</td>
                {columns.map((column) => (
                  <td key={column} className="py-2 pl-4 text-right tabular-nums">
                    {formatReportMinutes(total.values[column])}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
