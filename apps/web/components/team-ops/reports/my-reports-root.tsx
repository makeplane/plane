/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Badge } from "@makeplane/propel/components/badge";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { ChevronLeftOutline, ChevronRightOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import { addDays, formatDuration, getWeekRange, parseDateKey, toDateKey } from "@plane/services";
import type { TReportKindName, TWorkReportDetail } from "@plane/types";
// hooks
import { useWorkReport } from "@/hooks/team-ops/use-work-reports";
// local imports
import { getErrorMessage } from "../calendar/error-message";

type Props = { workspaceSlug: string };

const dayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortFormat = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });

type FormProps = {
  report: TWorkReportDetail;
  onSave: (values: { done: string; blockers: string; next_steps: string }, submit: boolean) => Promise<void>;
};

function ReportForm({ report, onSave }: FormProps) {
  const [done, setDone] = useState(report.done);
  const [blockers, setBlockers] = useState(report.blockers);
  const [nextSteps, setNextSteps] = useState(report.next_steps);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);

  const run = async (submit: boolean) => {
    setSaving(submit ? "submit" : "draft");
    try {
      await onSave({ done, blockers, next_steps: nextSteps }, submit);
    } finally {
      setSaving(null);
    }
  };

  const addSuggestion = (line: string) => setDone((current) => (current ? `${current}\n${line}` : line));

  return (
    <div className="flex flex-col gap-4">
      {report.suggestions.length > 0 ? (
        <section aria-label="Logged in Time Tracking" className="rounded-lg border border-subtle bg-surface-1 p-3">
          <h3 className="mb-1 text-body-xs-medium text-secondary">You logged time on (from Time Tracking)</h3>
          <ul className="flex flex-col gap-1">
            {report.suggestions.map((item) => {
              const line = `${item.key} ${item.name} (${formatDuration(item.seconds, "en-US")})`;
              return (
                <li
                  key={item.issue}
                  className="flex items-center justify-between gap-2 text-body-sm-regular text-primary"
                >
                  <span className="truncate">{line}</span>
                  <Button variant="ghost" size="sm" stretch="auto" label="Add" onClick={() => addSuggestion(line)} />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {(
        [
          ["What did you do?", done, setDone],
          ["What is blocking you?", blockers, setBlockers],
          ["What is next?", nextSteps, setNextSteps],
        ] as const
      ).map(([label, value, setValue]) => (
        <label key={label} className="flex flex-col gap-1 text-body-xs-medium text-secondary">
          {label}
          <TextAreaField
            size="lg"
            resize="none"
            autoResize
            maxRows={10}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-label={label}
            maxLength={10000}
          />
        </label>
      ))}

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          stretch="auto"
          label={report.status === "SUBMITTED" ? "Update report" : "Submit"}
          loading={saving === "submit"}
          disabled={!!saving}
          onClick={() => run(true)}
        />
        {report.status === "SUBMITTED" ? null : (
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            label="Save draft"
            loading={saving === "draft"}
            disabled={!!saving}
            onClick={() => run(false)}
          />
        )}
      </div>
    </div>
  );
}

/** Write today's (or this week's) report, with what was logged in Time Tracking to copy from. */
export function MyReportsRoot({ workspaceSlug }: Props) {
  const [kind, setKind] = useState<TReportKindName>("DAILY");
  const [reference, setReference] = useState(() => new Date());

  const today = toDateKey(new Date());
  const start = kind === "DAILY" ? toDateKey(reference) : getWeekRange(reference, 1).from;
  const isLatest = kind === "DAILY" ? start >= today : start >= getWeekRange(new Date(), 1).from;
  const { report, isLoading, error, save } = useWorkReport(workspaceSlug, kind, start);

  const move = (direction: -1 | 1) =>
    setReference(parseDateKey(addDays(start, direction * (kind === "DAILY" ? 1 : 7))));

  const title =
    kind === "DAILY"
      ? dayFormat.format(parseDateKey(start))
      : `${shortFormat.format(parseDateKey(start))} – ${shortFormat.format(parseDateKey(addDays(start, 6)))}`;

  const handleSave = async (values: { done: string; blockers: string; next_steps: string }, submit: boolean) => {
    try {
      await save({ ...values, submit });
      setToast({ type: "success", title: submit ? "Report submitted" : "Draft saved", message: "" });
    } catch (saveError) {
      setToast({ type: "error", title: "Could not save", message: getErrorMessage(saveError) });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <p className="text-caption-sm-regular text-tertiary">
        A report is what you write about your work. It is not measured from your time and is not proof of it.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <IconButton
            icon={<Icon icon={ChevronLeftOutline} />}
            variant="ghost"
            size="sm"
            aria-label="Previous"
            onClick={() => move(-1)}
          />
          <h2 className="min-w-56 text-center text-body-sm-medium text-primary">{title}</h2>
          <IconButton
            icon={<Icon icon={ChevronRightOutline} />}
            variant="ghost"
            size="sm"
            aria-label="Next"
            disabled={isLatest}
            onClick={() => move(1)}
          />
          {report?.status ? (
            <Badge
              variant={report.status === "SUBMITTED" ? "success" : "neutral"}
              size="sm"
              label={report.status === "SUBMITTED" ? "Submitted" : "Draft"}
            />
          ) : null}
        </div>
        <div role="group" aria-label="Report type" className="flex gap-1">
          {(["DAILY", "WEEKLY"] as const).map((item) => (
            <Button
              key={item}
              type="button"
              variant={kind === item ? "primary" : "secondary"}
              size="sm"
              stretch="auto"
              label={item === "DAILY" ? "Daily" : "Weekly"}
              aria-pressed={kind === item}
              onClick={() => setKind(item)}
            />
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-body-sm-medium text-danger-primary">
          The report could not be loaded. Reload the page to try again.
        </p>
      ) : null}
      {isLoading || !report ? null : (
        <ReportForm
          key={`${kind}_${start}_${report.status}_${report.submitted_at}`}
          report={report}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
