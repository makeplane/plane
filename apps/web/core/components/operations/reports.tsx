/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Reports.
 *
 * A period plus a point of view. The interesting part is that a report is
 * meant to leave the tool — so every one of these can be copied as plain text
 * in the shape a person would actually paste into an email.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Copy } from "lucide-react";
// workspaces imports
import { Button } from "@workspaces/propel/button";
import { setToast, TOAST_TYPE } from "@workspaces/propel/toast";
import { cn } from "@workspaces/utils";
// services
import { operationsService, type TOperationsReport, type TReportType } from "@/services/operations";
// local imports
import { ErrorPanel, LoadingPanel, Section, StatTile, TileGrid, formatDate, formatDateTime } from "./common";
import { REPORT_LABEL, REPORT_TYPES } from "./constants";

/** Turn one section of the report payload into `Label: value` lines. */
function flatten(prefix: string, value: unknown, lines: string[] = []): string[] {
  if (value === null || value === undefined) return lines;
  if (typeof value !== "object") {
    lines.push(`${prefix}: ${value}`);
    return lines;
  }
  if (Array.isArray(value)) {
    // Arrays here are per-project or per-cycle breakdowns; a name and a count
    // is what a reader wants, not the whole row.
    value.forEach((entry) => {
      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        const name = record.name ?? record.project__name ?? record.display_name ?? "";
        const count = record.completed ?? record.count ?? record.velocity ?? "";
        if (name) lines.push(`${prefix} — ${name}: ${count}`);
      }
    });
    return lines;
  }
  Object.entries(value as Record<string, unknown>).forEach(([key, nested]) =>
    flatten(`${prefix} ${key.replace(/_/g, " ")}`.trim(), nested, lines)
  );
  return lines;
}

function reportToText(report: TOperationsReport): string {
  const header = [
    `${REPORT_LABEL[report.report_type]} report — ${report.workspace.name}`,
    `${formatDate(report.period.start_date)} to ${formatDate(report.period.end_date)}`,
    "",
  ];
  if (report.headline) header.push(report.headline, "");

  const sections: string[] = [];
  (["delivery", "quality", "operations", "sprint", "team", "records"] as const).forEach((key) => {
    const section = report[key];
    if (!section) return;
    sections.push(key.toUpperCase());
    sections.push(...flatten("", section).map((line) => `  ${line.replace(/^: /, "")}`));
    sections.push("");
  });

  return [...header, ...sections].join("\n");
}

/** A section of the payload, rendered as a plain definition list. */
function ReportSection({ title, section }: { title: string; section: Record<string, unknown> | undefined }) {
  if (!section) return null;

  const scalars = Object.entries(section).filter(([, value]) => value === null || typeof value !== "object") as [
    string,
    string | number | null,
  ][];
  const nested = Object.entries(section).filter(([, value]) => value && typeof value === "object");

  return (
    <Section title={title}>
      <div className="flex flex-col gap-4">
        {scalars.length > 0 && (
          <TileGrid className="xl:grid-cols-4">
            {scalars.map(([key, value]) => (
              <StatTile key={key} label={key.replace(/_/g, " ")} value={value === null ? "--" : String(value)} />
            ))}
          </TileGrid>
        )}
        {nested.map(([key, value]) => (
          <div key={key}>
            <p className="mb-1.5 text-11 font-medium tracking-wide text-tertiary uppercase">{key.replace(/_/g, " ")}</p>
            <ul className="flex flex-col gap-1">
              {flatten("", value).map((line) => (
                <li key={line} className="text-13 text-secondary">
                  {line.replace(/^: /, "")}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

export const OperationsReports = observer(function OperationsReports({
  workspaceSlug,
  projectId,
}: {
  workspaceSlug: string;
  projectId?: string;
}) {
  const [reportType, setReportType] = useState<TReportType>("weekly");

  const { data, error, isLoading } = useSWR(
    workspaceSlug ? ["operations-report", workspaceSlug, reportType, projectId] : null,
    () => operationsService.getReport(workspaceSlug, reportType, { project_id: projectId }),
    { revalidateOnFocus: false }
  );

  const asText = useMemo(() => (data ? reportToText(data) : ""), [data]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Copied", message: "The report is on your clipboard." });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Could not copy", message: "Your browser refused clipboard access." });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {REPORT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setReportType(type)}
            className={cn(
              "rounded-full px-3 py-1 text-11 font-medium transition-colors",
              reportType === type
                ? "bg-accent-primary text-on-color"
                : "bg-layer-3 text-secondary hover:bg-layer-3-hover"
            )}
          >
            {REPORT_LABEL[type]}
          </button>
        ))}
        <Button
          variant="secondary"
          size="lg"
          className="ml-auto"
          prependIcon={<Copy />}
          disabled={!data}
          onClick={() => void copy()}
        >
          Copy as text
        </Button>
      </div>

      {isLoading ? (
        <LoadingPanel label="Building the report" />
      ) : error || !data ? (
        <ErrorPanel />
      ) : (
        <div className="flex flex-col gap-4">
          <Section
            title={`${REPORT_LABEL[data.report_type]} report`}
            description={`${formatDate(data.period.start_date)} to ${formatDate(data.period.end_date)} · generated ${formatDateTime(data.generated_at)}`}
          >
            {data.headline ? (
              <p className="text-13 leading-relaxed text-secondary">{data.headline}</p>
            ) : (
              <p className="text-13 text-placeholder">
                {data.project_ids.length} project{data.project_ids.length === 1 ? "" : "s"} in scope.
              </p>
            )}
          </Section>

          <ReportSection title="Delivery" section={data.delivery} />
          <ReportSection title="Quality" section={data.quality} />
          <ReportSection title="Sprint" section={data.sprint} />
          <ReportSection title="Team" section={data.team} />
          <ReportSection title="Operations requests" section={data.operations} />
          <ReportSection title="Records" section={data.records} />
        </div>
      )}
    </div>
  );
});
